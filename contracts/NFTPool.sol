// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NFT POOL V3 — IMMUTABLE (Bonding Curve AMM + On-Demand Minting)
// ============================================================================
//
// Constant-product bonding curve (XY=K) for trading RewardBooster NFTs.
// Single Bronze pool design — higher tiers obtained via NFTFusion.
//
// V3: Mintable Reserves (on-demand minting)
//   Pool starts with 0 real NFTs + mintableReserves (e.g., 10,000).
//   When a user buys, the pool mints a new NFT via RewardBooster.poolMint().
//   When a user sells back, the real NFT enters the pool inventory.
//   Subsequent buys prioritize real NFTs in inventory (transfer, not mint).
//
//   effectiveNftCount = realNftCount + virtualReserves + mintableReserves
//
//   Bronze: 0 real + 10,000 mintable + 1M BKC
//     K = 10,000 × 1,000,000 = 10B
//     Initial price ≈ 100 BKC per NFT
//
//   Buy Price  = K / (effectiveNftCount - 1) - BKC_BALANCE
//   Sell Price = BKC_BALANCE - K / (effectiveNftCount + 1)
//
// Fee Structure (ETH only — gas-based):
//   Buy:  ETH fee → ecosystem (operator/treasury/buyback)
//   Sell: ETH fee → ecosystem
//   BKC liquidity stays in the pool — no BKC taxes.
//
// Safety:
//   - Virtual + mintable reserves prevent pool drainage
//   - Last effective NFT can never be bought (effectiveNftCount ≤ 1 blocks buys)
//   - Slippage protection on buy (maxPrice) and sell (minPayout)
//   - CEI pattern on all transfers
//   - Reentrancy guard on all mutations
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

/// @dev RewardBooster on-demand minting (authorized pools only)
interface IBoosterPoolMint {
    function poolMint(address to, uint8 tier) external returns (uint256);
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

    /// @notice Virtual reserves — phantom NFTs that never leave pool.
    uint256             public immutable virtualReserves;

    /// @dev Per-tier action IDs for configurable ETH fees.
    bytes32 public immutable ACTION_BUY;
    bytes32 public immutable ACTION_SELL;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — POOL
    // ════════════════════════════════════════════════════════════════════════

    uint256 public bkcBalance;
    uint256 public nftCount;           // Real NFTs in the pool inventory
    uint256 public mintableReserves;   // NFTs available to mint on-demand
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
        uint8 tier, uint256 nftCount, uint256 mintableReserves,
        uint256 bkcAmount, uint256 virtualReserves, uint256 initialK
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

    /// @param _ecosystem        BackchainEcosystem address
    /// @param _bkcToken         BKC ERC-20 address
    /// @param _rewardBooster    RewardBooster ERC-721 address
    /// @param _tier             Pool tier: 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
    /// @param _virtualReserves  Virtual NFT count (phantom depth)
    /// @param _mintableReserves NFTs to mint on-demand when bought (e.g., 10000)
    constructor(
        address _ecosystem,
        address _bkcToken,
        address _rewardBooster,
        uint8   _tier,
        uint256 _virtualReserves,
        uint256 _mintableReserves
    ) {
        ecosystem        = IBackchainEcosystem(_ecosystem);
        bkcToken         = IBKCToken(_bkcToken);
        rewardBooster    = _rewardBooster;
        deployer         = msg.sender;
        tier             = _tier;
        virtualReserves  = _virtualReserves;
        mintableReserves = _mintableReserves;

        // Per-tier action IDs
        ACTION_BUY  = keccak256(abi.encode("NFT_BUY_T", _tier));
        ACTION_SELL = keccak256(abi.encode("NFT_SELL_T", _tier));
    }

    // ════════════════════════════════════════════════════════════════════════
    // SETUP (one-time, locks forever)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Initialize pool with optional NFT inventory and BKC liquidity.
    ///         For mintable-reserves pools: pass empty tokenIds + BKC.
    ///         After this call, trading is live and no further admin is possible.
    function initializePool(
        uint256[] calldata tokenIds,
        uint256 bkcAmount
    ) external {
        if (msg.sender != deployer) revert NotDeployer();
        if (initialized) revert AlreadyInitialized();
        if (bkcAmount == 0) revert ZeroAmount();

        uint256 realCount = tokenIds.length;
        uint256 effectiveCount = realCount + virtualReserves + mintableReserves;
        if (effectiveCount == 0) revert ZeroAmount();

        initialized = true;

        // Transfer real NFTs if any
        if (realCount > 0) {
            IBoosterTier booster = IBoosterTier(rewardBooster);
            IERC721Pool nft = IERC721Pool(rewardBooster);

            for (uint256 i; i < realCount;) {
                if (booster.tokenTier(tokenIds[i]) != tier) revert TierMismatch();
                nft.transferFrom(msg.sender, address(this), tokenIds[i]);
                _addToken(tokenIds[i]);
                unchecked { ++i; }
            }
        }

        // Transfer BKC
        bkcToken.transferFrom(msg.sender, address(this), bkcAmount);

        nftCount   = realCount;
        bkcBalance = bkcAmount;
        k          = effectiveCount * bkcBalance;

        emit PoolInitialized(tier, realCount, mintableReserves, bkcAmount, virtualReserves, k);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BUY NFT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Buy the next available NFT from the bonding curve.
    ///         Prioritizes real NFTs in inventory; mints on-demand if empty.
    function buyNFT(
        uint256 maxBkcPrice,
        address operator
    ) external payable nonReentrant returns (uint256 tokenId) {
        if (!initialized) revert NotInitialized();

        uint256 effectiveCount = _effectiveCount();
        if (effectiveCount <= 1) revert NoNFTsAvailable();

        if (nftCount > 0) {
            // Transfer real NFT from inventory
            tokenId = _tokenIds[_tokenIds.length - 1];
            _executeBuy(tokenId, maxBkcPrice, operator);
        } else if (mintableReserves > 0) {
            // Mint on-demand
            tokenId = _executeBuyMint(maxBkcPrice, operator);
        } else {
            revert NoNFTsAvailable();
        }
    }

    /// @notice Buy a specific NFT by token ID (only real NFTs in inventory).
    function buySpecificNFT(
        uint256 tokenId,
        uint256 maxBkcPrice,
        address operator
    ) external payable nonReentrant {
        if (!initialized) revert NotInitialized();
        if (nftCount == 0) revert NoNFTsAvailable();

        uint256 effectiveCount = _effectiveCount();
        if (effectiveCount <= 1) revert NoNFTsAvailable();
        if (!_isInPool(tokenId)) revert NFTNotInPool();

        _executeBuy(tokenId, maxBkcPrice, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BUY MULTIPLE NFTs (batch, single tx)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Buy multiple NFTs in a single transaction.
    function buyMultipleNFTs(
        uint256 count,
        uint256 maxTotalBkc,
        address operator
    ) external payable nonReentrant returns (uint256[] memory tokenIds) {
        if (!initialized) revert NotInitialized();
        if (count == 0 || count > 50) revert ZeroAmount();

        tokenIds = new uint256[](count);
        uint256 totalBkcCost;

        // Calculate total ETH fee (per buy × count)
        uint256 ethFeePerBuy = ecosystem.calculateFee(ACTION_BUY, 0);
        uint256 totalEthFee = ethFeePerBuy * count;
        if (msg.value < totalEthFee) revert InsufficientETHFee();

        for (uint256 i; i < count;) {
            uint256 effectiveCount = _effectiveCount();
            if (effectiveCount <= 1) revert NoNFTsAvailable();

            uint256 price = _buyPrice();
            if (price == type(uint256).max) revert NoNFTsAvailable();
            totalBkcCost += price;

            // Pull BKC
            bkcToken.transferFrom(msg.sender, address(this), price);

            // Effects
            bkcBalance += price;

            uint256 tokenId;
            if (nftCount > 0) {
                tokenId = _tokenIds[_tokenIds.length - 1];
                nftCount--;
                _removeToken(tokenId);
                // Transfer real NFT to buyer
                IERC721Pool(rewardBooster).transferFrom(address(this), msg.sender, tokenId);
            } else if (mintableReserves > 0) {
                mintableReserves--;
                // Mint new NFT to buyer
                tokenId = IBoosterPoolMint(rewardBooster).poolMint(msg.sender, tier);
            } else {
                revert NoNFTsAvailable();
            }

            effectiveCount = _effectiveCount();
            k = effectiveCount > 0 ? bkcBalance * effectiveCount : 0;

            totalVolume += price;
            totalBuys++;

            tokenIds[i] = tokenId;
            unchecked { ++i; }
        }

        // Slippage check on total
        if (maxTotalBkc > 0 && totalBkcCost > maxTotalBkc) revert SlippageExceeded();

        totalEthFees += msg.value;

        // ETH fee to ecosystem (one call for all)
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SELL NFT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Sell an NFT back to the bonding curve.
    function sellNFT(
        uint256 tokenId,
        uint256 minPayout,
        address operator
    ) external payable nonReentrant {
        if (!initialized) revert NotInitialized();

        IERC721Pool nft = IERC721Pool(rewardBooster);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();
        if (IBoosterTier(rewardBooster).tokenTier(tokenId) != tier)
            revert TierMismatch();

        // ETH fee
        uint256 ethFee = ecosystem.calculateFee(ACTION_SELL, 0);
        if (msg.value < ethFee) revert InsufficientETHFee();

        // Bonding curve sell price
        uint256 payout = _sellPrice();
        if (payout < minPayout) revert SlippageExceeded();
        if (bkcBalance < payout) revert InsufficientLiquidity();

        // Pull NFT from seller
        nft.transferFrom(msg.sender, address(this), tokenId);
        _addToken(tokenId);

        // Effects
        bkcBalance -= payout;
        nftCount++;
        uint256 effectiveCount = _effectiveCount();
        k = bkcBalance * effectiveCount;

        totalVolume  += payout;
        totalEthFees += msg.value;
        totalSells++;

        // Push BKC to seller
        if (payout > 0) {
            bkcToken.transfer(msg.sender, payout);
        }

        // ETH fee to ecosystem
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit NFTSold(
            msg.sender, tokenId, payout, msg.value,
            nftCount, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SELL MULTIPLE NFTs (batch, single tx)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Sell multiple NFTs in a single transaction.
    function sellMultipleNFTs(
        uint256[] calldata tokenIds,
        uint256 minTotalBkc,
        address operator
    ) external payable nonReentrant returns (uint256 totalPayout) {
        if (!initialized) revert NotInitialized();
        uint256 count = tokenIds.length;
        if (count == 0 || count > 50) revert ZeroAmount();

        IERC721Pool nft = IERC721Pool(rewardBooster);
        IBoosterTier tierCheck = IBoosterTier(rewardBooster);

        // ETH fee (per sell × count)
        uint256 ethFeePerSell = ecosystem.calculateFee(ACTION_SELL, 0);
        uint256 totalEthFee = ethFeePerSell * count;
        if (msg.value < totalEthFee) revert InsufficientETHFee();

        for (uint256 i; i < count;) {
            uint256 tokenId = tokenIds[i];
            if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();
            if (tierCheck.tokenTier(tokenId) != tier) revert TierMismatch();

            uint256 payout = _sellPrice();
            if (bkcBalance < payout) revert InsufficientLiquidity();

            // Pull NFT
            nft.transferFrom(msg.sender, address(this), tokenId);
            _addToken(tokenId);

            // Effects
            bkcBalance -= payout;
            nftCount++;
            uint256 effectiveCount = _effectiveCount();
            k = bkcBalance * effectiveCount;

            totalVolume += payout;
            totalSells++;
            totalPayout += payout;

            unchecked { ++i; }
        }

        // Slippage check
        if (totalPayout < minTotalBkc) revert SlippageExceeded();

        // Push total BKC to seller
        if (totalPayout > 0) {
            bkcToken.transfer(msg.sender, totalPayout);
        }

        totalEthFees += msg.value;

        // ETH fee to ecosystem (one call for all)
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS — PRICES
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Current BKC price to buy an NFT
    function getBuyPrice() external view returns (uint256) {
        return _buyPrice();
    }

    /// @notice Current BKC payout for selling an NFT
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

    /// @notice Preview buying N NFTs: total BKC cost + total ETH fee
    function getBuyMultiplePrice(uint256 count) external view returns (
        uint256 totalBkcCost, uint256 totalEthCost, uint256[] memory individualPrices
    ) {
        individualPrices = new uint256[](count);
        uint256 ethFeePerBuy = ecosystem.calculateFee(ACTION_BUY, 0);
        totalEthCost = ethFeePerBuy * count;

        // Simulate sequential buys
        uint256 simNftCount = nftCount;
        uint256 simMintable = mintableReserves;
        uint256 simBkcBalance = bkcBalance;
        uint256 simK = k;

        for (uint256 i; i < count;) {
            uint256 effCount = simNftCount + virtualReserves + simMintable;
            if (effCount <= 1 || (simNftCount == 0 && simMintable == 0)) break;

            uint256 newBal = simK / (effCount - 1);
            uint256 price = newBal > simBkcBalance ? newBal - simBkcBalance : 0;

            individualPrices[i] = price;
            totalBkcCost += price;

            // Simulate state after buy
            simBkcBalance += price;
            if (simNftCount > 0) {
                simNftCount--;
            } else {
                simMintable--;
            }
            effCount = simNftCount + virtualReserves + simMintable;
            simK = effCount > 0 ? simBkcBalance * effCount : 0;

            unchecked { ++i; }
        }
    }

    /// @notice Preview selling N NFTs: total BKC payout + total ETH fee
    function getSellMultiplePrice(uint256 count) external view returns (
        uint256 totalBkcPayout, uint256 totalEthCost, uint256[] memory individualPayouts
    ) {
        individualPayouts = new uint256[](count);
        uint256 ethFeePerSell = ecosystem.calculateFee(ACTION_SELL, 0);
        totalEthCost = ethFeePerSell * count;

        // Simulate sequential sells
        uint256 simNftCount = nftCount;
        uint256 simBkcBalance = bkcBalance;
        uint256 simK = k;

        for (uint256 i; i < count;) {
            uint256 effCount = simNftCount + virtualReserves + mintableReserves;
            if (effCount == 0) break;

            uint256 newBal = simK / (effCount + 1);
            uint256 payout = simBkcBalance > newBal ? simBkcBalance - newBal : 0;

            individualPayouts[i] = payout;
            totalBkcPayout += payout;

            // Simulate state after sell
            simBkcBalance -= payout;
            simNftCount++;
            effCount = simNftCount + virtualReserves + mintableReserves;
            simK = simBkcBalance * effCount;

            unchecked { ++i; }
        }
    }

    /// @notice ETH fees
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
        uint256 _bkcBalance, uint256 _nftCount, uint256 _effectiveNftCount,
        uint256 _virtualReserves, uint256 _mintableReserves,
        uint256 _k, bool _initialized, uint8 _tier
    ) {
        return (
            bkcBalance, nftCount, _effectiveCount(),
            virtualReserves, mintableReserves,
            k, initialized, tier
        );
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
        return "3.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BUY EXECUTION (transfer real NFT from inventory)
    // ════════════════════════════════════════════════════════════════════════

    function _executeBuy(
        uint256 tokenId,
        uint256 maxBkcPrice,
        address operator
    ) internal {
        // ETH fee
        uint256 ethFee = ecosystem.calculateFee(ACTION_BUY, 0);
        if (msg.value < ethFee) revert InsufficientETHFee();

        // Bonding curve price
        uint256 price = _buyPrice();
        if (price == type(uint256).max) revert NoNFTsAvailable();
        if (maxBkcPrice > 0 && price > maxBkcPrice) revert SlippageExceeded();

        // Pull BKC from buyer
        bkcToken.transferFrom(msg.sender, address(this), price);

        // Effects
        bkcBalance += price;
        nftCount--;
        uint256 effectiveCount = _effectiveCount();
        k = effectiveCount > 0 ? bkcBalance * effectiveCount : 0;
        _removeToken(tokenId);

        totalVolume  += price;
        totalEthFees += msg.value;
        totalBuys++;

        // Push NFT to buyer
        IERC721Pool(rewardBooster).transferFrom(
            address(this), msg.sender, tokenId
        );

        // ETH fee to ecosystem
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit NFTPurchased(
            msg.sender, tokenId, price, msg.value,
            nftCount, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BUY EXECUTION (mint on-demand from mintable reserves)
    // ════════════════════════════════════════════════════════════════════════

    function _executeBuyMint(
        uint256 maxBkcPrice,
        address operator
    ) internal returns (uint256 tokenId) {
        // ETH fee
        uint256 ethFee = ecosystem.calculateFee(ACTION_BUY, 0);
        if (msg.value < ethFee) revert InsufficientETHFee();

        // Bonding curve price
        uint256 price = _buyPrice();
        if (price == type(uint256).max) revert NoNFTsAvailable();
        if (maxBkcPrice > 0 && price > maxBkcPrice) revert SlippageExceeded();

        // Pull BKC from buyer
        bkcToken.transferFrom(msg.sender, address(this), price);

        // Effects
        bkcBalance += price;
        mintableReserves--;
        uint256 effectiveCount = _effectiveCount();
        k = effectiveCount > 0 ? bkcBalance * effectiveCount : 0;

        totalVolume  += price;
        totalEthFees += msg.value;
        totalBuys++;

        // Mint new NFT directly to buyer
        tokenId = IBoosterPoolMint(rewardBooster).poolMint(msg.sender, tier);

        // ETH fee to ecosystem
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit NFTPurchased(
            msg.sender, tokenId, price, msg.value,
            nftCount, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — EFFECTIVE COUNT HELPER
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Total effective NFTs: real + virtual + mintable
    function _effectiveCount() internal view returns (uint256) {
        return nftCount + virtualReserves + mintableReserves;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BONDING CURVE
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Buy price = K / (effectiveNftCount - 1) - bkcBalance
    function _buyPrice() internal view returns (uint256) {
        if (!initialized) return type(uint256).max;
        uint256 effectiveCount = _effectiveCount();
        if (effectiveCount <= 1 || (nftCount == 0 && mintableReserves == 0))
            return type(uint256).max;
        uint256 newBal = k / (effectiveCount - 1);
        return newBal > bkcBalance ? newBal - bkcBalance : 0;
    }

    /// @dev Sell price = bkcBalance - K / (effectiveNftCount + 1)
    function _sellPrice() internal view returns (uint256) {
        if (!initialized) return 0;
        uint256 effectiveCount = _effectiveCount();
        if (effectiveCount == 0) return 0;
        uint256 newBal = k / (effectiveCount + 1);
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
