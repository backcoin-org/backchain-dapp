// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NFT POOL — IMMUTABLE (Bonding Curve AMM, Tier 1: ETH only)
// ============================================================================
//
// Constant-product bonding curve (XY=K) for trading RewardBooster NFTs.
// Deploy one pool per tier: Bronze (0), Silver (1), Gold (2), Diamond (3).
//
//   K = NFT_COUNT × BKC_BALANCE
//
//   Buy Price  = K / (NFT_COUNT - 1) - BKC_BALANCE   (scarcity → price up)
//   Sell Price = BKC_BALANCE - K / (NFT_COUNT + 1)    (abundance → price down)
//
// Fee Structure (ETH only — Tier 1):
//   Buy:  ETH fee → ecosystem (operator/treasury/buyback)
//   Sell: ETH fee → ecosystem
//   BKC liquidity stays in the pool — no BKC taxes.
//   Natural spread between buy/sell provides organic pool growth.
//
// Each tier has its own ACTION IDs (NFT_BUY_T0..T3, NFT_SELL_T0..T3),
// allowing the ecosystem to configure different ETH fees per tier.
// Diamond trades can cost more ETH than Bronze, reflecting tier value.
//
// Safety:
//   - Last NFT can never be bought (nftCount ≤ 1 blocks buys)
//   - Slippage protection on buy (maxPrice) and sell (minPayout)
//   - CEI pattern on all transfers
//   - Reentrancy guard on all mutations
//
// Setup:
//   1. Deploy RewardBooster, mintBatch NFTs to deployer
//   2. Deploy 4 NFTPools (one per tier)
//   3. Deployer approves each pool: setApprovalForAll (NFTs) + approve (BKC)
//   4. Call initializePool(tokenIds, bkcAmount) on each — one-time, locks
//   5. Call RewardBooster.configurePools([pool0, pool1, pool2, pool3])
//
// No admin. No pause. No liquidity removal. Fully immutable.
//
// ============================================================================

/// @dev Minimal ERC721 interface for RewardBooster
interface IERC721Pool {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @dev RewardBooster tier query
interface IBoosterTier {
    function tokenTier(uint256 tokenId) external view returns (uint8);
}

contract NFTPool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID = keccak256("NFT_POOL");

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IBKCToken           public immutable bkcToken;
    address             public immutable rewardBooster;
    address             public immutable deployer;
    uint8               public immutable tier;

    /// @dev Per-tier action IDs for configurable ETH fees.
    ///      Tier 0 → keccak256("NFT_BUY_T0"), Tier 3 → keccak256("NFT_BUY_T3"), etc.
    bytes32 public immutable ACTION_BUY;
    bytes32 public immutable ACTION_SELL;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — POOL
    // ════════════════════════════════════════════════════════════════════════

    uint256 public bkcBalance;
    uint256 public nftCount;
    uint256 public k;
    bool    public initialized;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — INVENTORY (swap-and-pop)
    // ════════════════════════════════════════════════════════════════════════

    uint256[] internal _tokenIds;
    mapping(uint256 => uint256) internal _tokenIdx;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — STATS
    // ════════════════════════════════════════════════════════════════════════

    uint256 public totalVolume;
    uint256 public totalBuys;
    uint256 public totalSells;
    uint256 public totalEthFees;

    // Reentrancy guard
    uint8 private _locked;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event PoolInitialized(
        uint8 tier, uint256 nftCount, uint256 bkcAmount, uint256 initialK
    );

    event NFTPurchased(
        address indexed buyer, uint256 indexed tokenId,
        uint256 price, uint256 ethFee,
        uint256 newNftCount, address operator
    );

    event NFTSold(
        address indexed seller, uint256 indexed tokenId,
        uint256 payout, uint256 ethFee,
        uint256 newNftCount, address operator
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotDeployer();
    error AlreadyInitialized();
    error NotInitialized();
    error ZeroAmount();
    error NoNFTsAvailable();
    error InsufficientLiquidity();
    error NFTNotInPool();
    error NotNFTOwner();
    error TierMismatch();
    error SlippageExceeded();
    error InsufficientETHFee();
    error Reentrancy();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    modifier nonReentrant() {
        if (_locked == 1) revert Reentrancy();
        _locked = 1;
        _;
        _locked = 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    /// @param _ecosystem  BackchainEcosystem address
    /// @param _bkcToken   BKC ERC-20 address
    /// @param _rewardBooster RewardBooster ERC-721 address
    /// @param _tier       Pool tier: 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
    constructor(
        address _ecosystem,
        address _bkcToken,
        address _rewardBooster,
        uint8   _tier
    ) {
        ecosystem     = IBackchainEcosystem(_ecosystem);
        bkcToken      = IBKCToken(_bkcToken);
        rewardBooster = _rewardBooster;
        deployer      = msg.sender;
        tier          = _tier;

        // Per-tier action IDs → ecosystem can set different ETH fees per tier
        ACTION_BUY  = keccak256(abi.encode("NFT_BUY_T", _tier));
        ACTION_SELL = keccak256(abi.encode("NFT_SELL_T", _tier));
    }

    // ════════════════════════════════════════════════════════════════════════
    // SETUP (one-time, locks forever)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Initialize pool with NFT inventory and BKC liquidity.
    ///         Deployer must pre-approve this contract for all NFTs and BKC.
    ///         After this call, trading is live and no further admin is possible.
    ///
    /// @param tokenIds  NFT token IDs to seed the pool (must match pool tier)
    /// @param bkcAmount BKC liquidity to pair against NFTs
    function initializePool(
        uint256[] calldata tokenIds,
        uint256 bkcAmount
    ) external {
        if (msg.sender != deployer) revert NotDeployer();
        if (initialized) revert AlreadyInitialized();
        if (tokenIds.length == 0) revert ZeroAmount();
        if (bkcAmount == 0) revert ZeroAmount();

        initialized = true;

        IBoosterTier booster = IBoosterTier(rewardBooster);
        IERC721Pool nft = IERC721Pool(rewardBooster);

        for (uint256 i; i < tokenIds.length;) {
            if (booster.tokenTier(tokenIds[i]) != tier) revert TierMismatch();
            nft.transferFrom(msg.sender, address(this), tokenIds[i]);
            _addToken(tokenIds[i]);
            unchecked { ++i; }
        }

        bkcToken.transferFrom(msg.sender, address(this), bkcAmount);

        nftCount   = tokenIds.length;
        bkcBalance = bkcAmount;
        k          = nftCount * bkcBalance;

        emit PoolInitialized(tier, nftCount, bkcAmount, k);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BUY NFT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Buy the next available NFT from the bonding curve.
    ///         User pays BKC (bonding curve price) + ETH fee as msg.value.
    ///         BKC must be pre-approved for this contract.
    ///
    /// @param maxBkcPrice Max BKC willing to pay. 0 = no slippage check.
    /// @param operator    Frontend operator earning commission
    /// @return tokenId    The purchased NFT
    function buyNFT(
        uint256 maxBkcPrice,
        address operator
    ) external payable nonReentrant returns (uint256 tokenId) {
        if (!initialized) revert NotInitialized();
        if (nftCount <= 1) revert NoNFTsAvailable();

        tokenId = _tokenIds[_tokenIds.length - 1];
        _executeBuy(tokenId, maxBkcPrice, operator);
    }

    /// @notice Buy a specific NFT by token ID.
    function buySpecificNFT(
        uint256 tokenId,
        uint256 maxBkcPrice,
        address operator
    ) external payable nonReentrant {
        if (!initialized) revert NotInitialized();
        if (nftCount <= 1) revert NoNFTsAvailable();
        if (!_isInPool(tokenId)) revert NFTNotInPool();

        _executeBuy(tokenId, maxBkcPrice, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SELL NFT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Sell an NFT back to the bonding curve.
    ///         Receives full BKC payout (no BKC tax). Pays ETH fee as msg.value.
    ///         NFT must be approved for this contract.
    ///
    /// @param tokenId   NFT to sell (must match pool tier)
    /// @param minPayout Minimum BKC to receive (slippage protection)
    /// @param operator  Frontend operator
    function sellNFT(
        uint256 tokenId,
        uint256 minPayout,
        address operator
    ) external payable nonReentrant {
        if (!initialized) revert NotInitialized();

        // Verify ownership and tier
        IERC721Pool nft = IERC721Pool(rewardBooster);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();
        if (IBoosterTier(rewardBooster).tokenTier(tokenId) != tier)
            revert TierMismatch();

        // ETH fee
        uint256 ethFee = ecosystem.calculateFee(ACTION_SELL, 0);
        if (msg.value < ethFee) revert InsufficientETHFee();

        // Bonding curve sell price — full payout, no BKC tax
        uint256 payout = _sellPrice();
        if (payout < minPayout) revert SlippageExceeded();
        if (bkcBalance < payout) revert InsufficientLiquidity();

        // ── Pull NFT from seller ──
        nft.transferFrom(msg.sender, address(this), tokenId);
        _addToken(tokenId);

        // ── Effects ──
        bkcBalance -= payout;
        nftCount++;
        k = bkcBalance * nftCount;

        totalVolume  += payout;
        totalEthFees += msg.value;
        totalSells++;

        // ── Push BKC to seller ──
        if (payout > 0) {
            bkcToken.transfer(msg.sender, payout);
        }

        // ── ETH fee to ecosystem ──
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit NFTSold(
            msg.sender, tokenId, payout, msg.value,
            nftCount, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS — PRICES
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Current BKC price to buy an NFT (bonding curve)
    function getBuyPrice() external view returns (uint256) {
        return _buyPrice();
    }

    /// @notice Current BKC payout for selling an NFT (bonding curve)
    function getSellPrice() external view returns (uint256) {
        return _sellPrice();
    }

    /// @notice Full buy cost: BKC price + ETH fee
    function getTotalBuyCost() external view returns (
        uint256 bkcCost, uint256 ethCost
    ) {
        bkcCost = _buyPrice();
        ethCost = ecosystem.calculateFee(ACTION_BUY, 0);
    }

    /// @notice Full sell info: BKC payout + ETH fee required
    function getTotalSellInfo() external view returns (
        uint256 bkcPayout, uint256 ethCost
    ) {
        bkcPayout = _sellPrice();
        ethCost = ecosystem.calculateFee(ACTION_SELL, 0);
    }

    /// @notice ETH fee for buy and sell
    function getEthFees() external view returns (
        uint256 buyFee, uint256 sellFee
    ) {
        buyFee  = ecosystem.calculateFee(ACTION_BUY, 0);
        sellFee = ecosystem.calculateFee(ACTION_SELL, 0);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS — POOL DATA
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Pool state summary
    function getPoolInfo() external view returns (
        uint256 _bkcBalance, uint256 _nftCount, uint256 _k,
        bool _initialized, uint8 _tier
    ) {
        return (bkcBalance, nftCount, k, initialized, tier);
    }

    /// @notice All NFT token IDs currently in the pool
    function getAvailableNFTs() external view returns (uint256[] memory) {
        return _tokenIds;
    }

    /// @notice Check if a specific token is in the pool
    function isNFTInPool(uint256 tokenId) external view returns (bool) {
        return _isInPool(tokenId);
    }

    /// @notice Buy-sell spread (BKC)
    function getSpread() external view returns (
        uint256 spread, uint256 spreadBips
    ) {
        uint256 bp = _buyPrice();
        uint256 sp = _sellPrice();
        if (bp == type(uint256).max || sp == 0) return (0, 0);
        spread = bp > sp ? bp - sp : 0;
        spreadBips = sp > 0 ? (spread * 10_000) / sp : 0;
    }

    /// @notice Trading statistics
    function getStats() external view returns (
        uint256 volume, uint256 buys, uint256 sells, uint256 ethFees
    ) {
        return (totalVolume, totalBuys, totalSells, totalEthFees);
    }

    /// @notice Tier name for display
    function getTierName() external view returns (string memory) {
        if (tier == 0) return "Bronze";
        if (tier == 1) return "Silver";
        if (tier == 2) return "Gold";
        if (tier == 3) return "Diamond";
        return "Unknown";
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BUY EXECUTION
    // ════════════════════════════════════════════════════════════════════════

    function _executeBuy(
        uint256 tokenId,
        uint256 maxBkcPrice,
        address operator
    ) internal {
        // ETH fee
        uint256 ethFee = ecosystem.calculateFee(ACTION_BUY, 0);
        if (msg.value < ethFee) revert InsufficientETHFee();

        // Bonding curve price — no BKC tax, just the curve price
        uint256 price = _buyPrice();
        if (price == type(uint256).max) revert NoNFTsAvailable();
        if (maxBkcPrice > 0 && price > maxBkcPrice) revert SlippageExceeded();

        // ── Pull BKC from buyer (exact curve price) ──
        bkcToken.transferFrom(msg.sender, address(this), price);

        // ── Effects ──
        bkcBalance += price;
        nftCount--;
        k = nftCount > 0 ? bkcBalance * nftCount : 0;
        _removeToken(tokenId);

        totalVolume  += price;
        totalEthFees += msg.value;
        totalBuys++;

        // ── Push NFT to buyer ──
        IERC721Pool(rewardBooster).transferFrom(
            address(this), msg.sender, tokenId
        );

        // ── ETH fee to ecosystem ──
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit NFTPurchased(
            msg.sender, tokenId, price, msg.value,
            nftCount, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BONDING CURVE
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Buy price = K / (nftCount - 1) - bkcBalance
    ///      Returns max uint if ≤ 1 NFT remains (last NFT is reserved)
    function _buyPrice() internal view returns (uint256) {
        if (!initialized || nftCount <= 1) return type(uint256).max;
        uint256 newBal = k / (nftCount - 1);
        return newBal > bkcBalance ? newBal - bkcBalance : 0;
    }

    /// @dev Sell price = bkcBalance - K / (nftCount + 1)
    ///      Returns 0 if pool has 0 NFTs
    function _sellPrice() internal view returns (uint256) {
        if (!initialized || nftCount == 0) return 0;
        uint256 newBal = k / (nftCount + 1);
        return bkcBalance > newBal ? bkcBalance - newBal : 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — INVENTORY (swap-and-pop)
    // ════════════════════════════════════════════════════════════════════════

    function _addToken(uint256 tokenId) internal {
        _tokenIdx[tokenId] = _tokenIds.length;
        _tokenIds.push(tokenId);
    }

    function _removeToken(uint256 tokenId) internal {
        uint256 idx     = _tokenIdx[tokenId];
        uint256 lastIdx = _tokenIds.length - 1;
        if (idx != lastIdx) {
            uint256 lastId = _tokenIds[lastIdx];
            _tokenIds[idx] = lastId;
            _tokenIdx[lastId] = idx;
        }
        _tokenIds.pop();
        delete _tokenIdx[tokenId];
    }

    function _isInPool(uint256 tokenId) internal view returns (bool) {
        if (_tokenIds.length == 0) return false;
        uint256 idx = _tokenIdx[tokenId];
        return idx < _tokenIds.length && _tokenIds[idx] == tokenId;
    }
}
