// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *                    ██╗   ██╗███╗   ██╗███████╗████████╗ ██████╗ ██████╗
 *                    ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
 *                    ██║   ██║██╔██╗ ██║███████╗   ██║   ██║   ██║██████╔╝
 *                    ██║   ██║██║╚██╗██║╚════██║   ██║   ██║   ██║██╔═══╝
 *                    ╚██████╔╝██║ ╚████║███████║   ██║   ╚██████╔╝██║
 *                     ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : NFTLiquidityPool
 *  Version     : 6.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchain
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn a percentage of ALL fees (BKC + ETH) generated
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 * ============================================================================
 *
 *  PURPOSE
 *
 *  AMM-style liquidity pool for trading RewardBooster NFTs.
 *  Implements constant product formula (XY=K) for NFT price discovery.
 *
 *  WHY BUY AN NFT?
 *  +--------------------------------------------------------------------+
 *  |  NFTs reduce the BURN RATE when claiming rewards from              |
 *  |  DelegationManager. Without an NFT, 50% of rewards are burned.     |
 *  |                                                                    |
 *  |  ┌──────────┬────────────┬───────────┬─────────────┐              |
 *  |  │ Tier     │ Boost Bips │ Burn Rate │ User Gets   │              |
 *  |  ├──────────┼────────────┼───────────┼─────────────┤              |
 *  |  │ No NFT   │ 0          │ 50%       │ 50%         │              |
 *  |  │ Bronze   │ 1000       │ 40%       │ 60%         │              |
 *  |  │ Silver   │ 2500       │ 25%       │ 75%         │              |
 *  |  │ Gold     │ 4000       │ 10%       │ 90%         │              |
 *  |  │ Diamond  │ 5000       │ 0%        │ 100%        │              |
 *  |  └──────────┴────────────┴───────────┴─────────────┘              |
 *  +--------------------------------------------------------------------+
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │                        BONDING CURVE MODEL                              │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │  K = NFT_COUNT × BKC_BALANCE (constant product)                         │
 *  │                                                                         │
 *  │  Buy Price = K / (NFT_COUNT - 1) - BKC_BALANCE                          │
 *  │  Sell Price = BKC_BALANCE - K / (NFT_COUNT + 1)                         │
 *  │                                                                         │
 *  │  As NFTs decrease → Price increases (scarcity)                          │
 *  │  As NFTs increase → Price decreases (abundance)                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 *  FEE STRUCTURE (V6 - EQUAL FOR ALL)
 *
 *  +-------------+------------------+----------------------------------------+
 *  | Action      | Default Fee      | Destination                            |
 *  +-------------+------------------+----------------------------------------+
 *  | Buy NFT     | 5% of price      | MiningManager                          |
 *  | Sell NFT    | 10% of price     | MiningManager                          |
 *  +-------------+------------------+----------------------------------------+
 *
 *  IMPORTANT: Trading fees are the SAME for all users. NFT ownership does
 *             NOT provide discounts on pool fees.
 *
 * ============================================================================
 *
 *  FEE DISTRIBUTION
 *
 *  BKC Flow (Buy/Sell Tax):
 *  +------------------------------------------------------------------+
 *  |                      BKC TAX COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |      +----------------------+----------------------+             |
 *  |      |          |           |                      |             |
 *  |      v          v           v                      v             |
 *  |  OPERATOR     BURN      TREASURY             DELEGATORS          |
 *  |  (config%)  (config%)   (config%)             (config%)          |
 *  +------------------------------------------------------------------+
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";
import "./TimelockUpgradeable.sol";

interface IMiningManagerV3 {
    function performPurchaseMiningWithOperator(
        bytes32 serviceKey,
        uint256 purchaseAmount,
        address operator
    ) external payable;
}

contract NFTLiquidityPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC721ReceiverUpgradeable,
    TimelockUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    uint256 private constant BIPS_DENOMINATOR = 10_000;

    bytes32 public constant BUY_TAX_KEY = keccak256("NFT_POOL_BUY_TAX_BIPS");

    bytes32 public constant SELL_TAX_KEY = keccak256("NFT_POOL_SELL_TAX_BIPS");

    // -------------------------------------------------------------------------
    //                         VALID NFT TIERS (V6)
    // -------------------------------------------------------------------------

    uint256 public constant BOOST_BRONZE = 1000;   // 40% burn on claim
    uint256 public constant BOOST_SILVER = 2500;   // 25% burn on claim
    uint256 public constant BOOST_GOLD = 4000;     // 10% burn on claim
    uint256 public constant BOOST_DIAMOND = 5000;  // 0% burn on claim

    uint256 public constant MAX_ETH_FEE = 0.1 ether;

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    struct PoolState {
        uint256 bkcBalance;
        uint256 nftCount;
        uint256 k;
        bool initialized;
        mapping(uint256 => uint256) tokenIndex;
        uint256[] tokenIds;
    }

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error PoolAlreadyInitialized();
    error PoolNotInitialized();
    error InsufficientLiquidity();
    error InsufficientNFTs();
    error NFTNotInPool();
    error NotNFTOwner();
    error SlippageExceeded();
    error MathOverflow();
    error InvalidBoostTier();
    error NFTBoostMismatch();
    error InsufficientETHFee();
    error TransferFailed();
    error MiningManagerCallFailed();
    error CloneCannotUpgrade();
    error FeeTooHigh();

    // =========================================================================
    //                              STATE
    // =========================================================================

    IEcosystemManager public ecosystemManager;

    BKCToken public bkcToken;

    uint256 public boostBips;

    PoolState private pool;

    uint256 public totalVolume;

    uint256 public totalTaxesCollected;

    uint256 public totalBuys;

    uint256 public totalSells;

    // =========================================================================
    //                              STATE (V2 - Operators)
    // =========================================================================

    /// @notice ETH fee for buy transactions (configurable)
    uint256 public buyEthFee;

    /// @notice ETH fee for sell transactions (configurable)
    uint256 public sellEthFee;

    /// @notice Total ETH collected from fees
    uint256 public totalETHCollected;

    /// @notice True if deployed as an EIP-1167 clone (UUPS upgrades disabled)
    bool public isClone;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[41] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event LiquidityInitialized(
        uint256 indexed boostBips,
        uint256 nftCount,
        uint256 bkcAmount,
        uint256 initialK
    );

    event NFTsAdded(
        uint256 indexed boostBips,
        uint256 nftCount,
        uint256 newK
    );

    event NFTPurchased(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price,
        uint256 tax,
        uint256 newBkcBalance,
        uint256 newNftCount,
        address operator
    );

    event NFTSold(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 payout,
        uint256 tax,
        uint256 newBkcBalance,
        uint256 newNftCount,
        address operator
    );

    event BKCLiquidityAdded(uint256 amount, uint256 newBalance, uint256 newK);

    event BKCLiquidityRemoved(uint256 amount, uint256 newBalance);

    event EthFeesUpdated(uint256 buyFee, uint256 sellFee);

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _ecosystemManager,
        uint256 _boostBips
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();
        if (!_isValidTier(_boostBips)) revert InvalidBoostTier();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _transferOwnership(_owner);

        ecosystemManager = IEcosystemManager(_ecosystemManager);

        address bkcAddress = ecosystemManager.getBKCTokenAddress();
        if (bkcAddress == address(0)) revert ZeroAddress();

        bkcToken = BKCToken(bkcAddress);
        boostBips = _boostBips;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        if (isClone) revert CloneCannotUpgrade();
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    function markAsClone() external onlyOwner {
        isClone = true;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // =========================================================================
    //                      LIQUIDITY MANAGEMENT
    // =========================================================================

    function addInitialLiquidity(
        uint256[] calldata _tokenIds,
        uint256 _bkcAmount
    ) external onlyOwner nonReentrant {
        if (pool.initialized) revert PoolAlreadyInitialized();
        if (_tokenIds.length == 0) revert ZeroAmount();
        if (_bkcAmount == 0) revert ZeroAmount();

        pool.initialized = true;

        address boosterAddress = ecosystemManager.getBoosterAddress();
        IRewardBoosterNFT nftContract = IRewardBoosterNFT(boosterAddress);

        for (uint256 i; i < _tokenIds.length;) {
            if (nftContract.boostBips(_tokenIds[i]) != boostBips) {
                revert NFTBoostMismatch();
            }

            IERC721Upgradeable(boosterAddress).safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _addTokenToPool(_tokenIds[i]);
            unchecked { ++i; }
        }

        bkcToken.safeTransferFrom(msg.sender, address(this), _bkcAmount);

        pool.nftCount = _tokenIds.length;
        pool.bkcBalance = _bkcAmount;
        pool.k = pool.nftCount * pool.bkcBalance;

        emit LiquidityInitialized(boostBips, pool.nftCount, pool.bkcBalance, pool.k);
    }

    function addMoreNFTsToPool(
        uint256[] calldata _tokenIds
    ) external onlyOwner nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (_tokenIds.length == 0) revert ZeroAmount();

        address boosterAddress = ecosystemManager.getBoosterAddress();
        IRewardBoosterNFT nftContract = IRewardBoosterNFT(boosterAddress);

        for (uint256 i; i < _tokenIds.length;) {
            if (nftContract.boostBips(_tokenIds[i]) != boostBips) {
                revert NFTBoostMismatch();
            }

            IERC721Upgradeable(boosterAddress).safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _addTokenToPool(_tokenIds[i]);
            unchecked { ++i; }
        }

        pool.nftCount += _tokenIds.length;
        pool.k = pool.nftCount * pool.bkcBalance;

        emit NFTsAdded(boostBips, _tokenIds.length, pool.k);
    }

    function addBKCLiquidity(uint256 _amount) external onlyOwner nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (_amount == 0) revert ZeroAmount();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        pool.bkcBalance += _amount;
        pool.k = pool.nftCount * pool.bkcBalance;

        emit BKCLiquidityAdded(_amount, pool.bkcBalance, pool.k);
    }

    function removeBKCLiquidity(uint256 _amount) external onlyOwner nonReentrant {
        if (_amount > pool.bkcBalance) revert InsufficientLiquidity();

        uint256 newBalance = pool.bkcBalance - _amount;
        if (pool.nftCount > 0 && newBalance == 0) revert InsufficientLiquidity();

        pool.bkcBalance = newBalance;
        pool.k = pool.nftCount * pool.bkcBalance;

        bkcToken.safeTransfer(msg.sender, _amount);

        emit BKCLiquidityRemoved(_amount, pool.bkcBalance);
    }

    /**
     * @notice Sets ETH fees for buy and sell transactions
     * @param _buyFee ETH fee for buying NFTs (in wei)
     * @param _sellFee ETH fee for selling NFTs (in wei)
     */
    function setEthFees(uint256 _buyFee, uint256 _sellFee) external onlyOwner {
        if (_buyFee > MAX_ETH_FEE || _sellFee > MAX_ETH_FEE) revert FeeTooHigh();
        buyEthFee = _buyFee;
        sellEthFee = _sellFee;
        emit EthFeesUpdated(_buyFee, _sellFee);
    }

    /**
     * @notice Recovers stuck ETH (if MiningManager call fails)
     * @param _to Destination address
     * @param _amount Amount to recover
     */
    function recoverETH(address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        if (_amount > address(this).balance) revert InsufficientLiquidity();
        
        (bool success, ) = _to.call{value: _amount}("");
        if (!success) revert TransferFailed();
    }

    // =========================================================================
    //                         TRADING FUNCTIONS
    // =========================================================================

    /**
     * @notice Buys the next available NFT from pool
     * @param _operator Address of the frontend operator
     * @return tokenId The purchased NFT token ID
     */
    function buyNFT(uint256 _maxPrice, address _operator) external payable nonReentrant returns (uint256 tokenId) {
        if (!pool.initialized) revert PoolNotInitialized();
        if (pool.nftCount == 0) revert InsufficientNFTs();
        if (msg.value < buyEthFee) revert InsufficientETHFee();

        if (_maxPrice > 0) {
            uint256 totalCost = getBuyPriceWithTax();
            if (totalCost > _maxPrice) revert SlippageExceeded();
        }

        tokenId = pool.tokenIds[pool.tokenIds.length - 1];

        _executeBuy(tokenId, _operator);
        
        // Send ETH fee to MiningManager
        if (msg.value > 0) {
            _sendETHToMining(msg.value, _operator);
        }
    }

    /**
     * @notice Buys a specific NFT from pool
     * @param _tokenId Token ID to purchase
     * @param _operator Address of the frontend operator
     */
    function buySpecificNFT(
        uint256 _tokenId,
        uint256 _maxPrice,
        address _operator
    ) external payable nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (pool.nftCount == 0) revert InsufficientNFTs();
        if (msg.value < buyEthFee) revert InsufficientETHFee();

        if (_maxPrice > 0) {
            uint256 totalCost = getBuyPriceWithTax();
            if (totalCost > _maxPrice) revert SlippageExceeded();
        }

        if (!_isTokenInPool(_tokenId)) revert NFTNotInPool();

        _executeBuy(_tokenId, _operator);
        
        // Send ETH fee to MiningManager
        if (msg.value > 0) {
            _sendETHToMining(msg.value, _operator);
        }
    }

    /**
     * @notice Buys NFT with maximum price protection
     * @param _maxPrice Maximum total price willing to pay (including tax)
     * @param _operator Address of the frontend operator
     * @return tokenId The purchased NFT token ID
     */
    function buyNFTWithSlippage(
        uint256 _maxPrice,
        address _operator
    ) external payable nonReentrant returns (uint256 tokenId) {
        if (!pool.initialized) revert PoolNotInitialized();
        if (pool.nftCount == 0) revert InsufficientNFTs();
        if (msg.value < buyEthFee) revert InsufficientETHFee();

        uint256 totalCost = getBuyPriceWithTax();
        if (totalCost > _maxPrice) revert SlippageExceeded();

        tokenId = pool.tokenIds[pool.tokenIds.length - 1];
        _executeBuy(tokenId, _operator);
        
        // Send ETH fee to MiningManager
        if (msg.value > 0) {
            _sendETHToMining(msg.value, _operator);
        }
    }

    /**
     * @notice Sells an NFT to the pool
     * @param _tokenId Token ID to sell
     * @param _minPayout Minimum BKC expected (slippage protection)
     * @param _operator Address of the frontend operator
     */
    function sellNFT(
        uint256 _tokenId,
        uint256 _minPayout,
        address _operator
    ) external payable nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (msg.value < sellEthFee) revert InsufficientETHFee();

        address boosterAddress = ecosystemManager.getBoosterAddress();
        IRewardBoosterNFT nftContract = IRewardBoosterNFT(boosterAddress);

        if (IERC721Upgradeable(boosterAddress).ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();

        if (nftContract.boostBips(_tokenId) != boostBips) {
            revert NFTBoostMismatch();
        }

        uint256 grossValue = getSellPrice();
        uint256 taxBips = ecosystemManager.getFee(SELL_TAX_KEY);

        // Checked arithmetic: grossValue * taxBips could overflow with extreme fee values
        uint256 taxAmount = (grossValue * taxBips) / BIPS_DENOMINATOR;
        uint256 netPayout = grossValue - taxAmount;

        if (netPayout < _minPayout) revert SlippageExceeded();
        if (pool.bkcBalance < grossValue) revert InsufficientLiquidity();

        IERC721Upgradeable(boosterAddress).safeTransferFrom(msg.sender, address(this), _tokenId);
        _addTokenToPool(_tokenId);

        if (netPayout > 0) {
            bkcToken.safeTransfer(msg.sender, netPayout);
        }

        if (taxAmount > 0) {
            _sendTaxToMining(SELL_TAX_KEY, taxAmount, _operator);
        }

        // Safe: pool.bkcBalance >= grossValue checked above (InsufficientLiquidity)
        pool.bkcBalance -= grossValue;
        pool.nftCount++;
        pool.k = pool.bkcBalance * pool.nftCount;

        totalVolume += grossValue;
        totalTaxesCollected += taxAmount;
        totalSells++;

        emit NFTSold(
            msg.sender,
            _tokenId,
            netPayout,
            taxAmount,
            pool.bkcBalance,
            pool.nftCount,
            _operator
        );

        // Send ETH fee to MiningManager
        if (msg.value > 0) {
            _sendETHToMining(msg.value, _operator);
        }
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function getBuyPrice() public view returns (uint256) {
        if (!pool.initialized || pool.nftCount <= 1) {
            return type(uint256).max;
        }

        uint256 newBalance = pool.k / (pool.nftCount - 1);
        if (newBalance <= pool.bkcBalance) return 0;

        return newBalance - pool.bkcBalance;
    }

    function getBuyPriceWithTax() public view returns (uint256) {
        uint256 price = getBuyPrice();
        if (price == type(uint256).max) return type(uint256).max;

        uint256 taxBips = ecosystemManager.getFee(BUY_TAX_KEY);
        uint256 tax = (price * taxBips) / BIPS_DENOMINATOR;

        return price + tax;
    }

    function getSellPrice() public view returns (uint256) {
        if (!pool.initialized || pool.nftCount == 0) return 0;

        uint256 newBalance = pool.k / (pool.nftCount + 1);
        if (pool.bkcBalance <= newBalance) return 0;

        return pool.bkcBalance - newBalance;
    }

    function getSellPriceAfterTax() public view returns (uint256) {
        uint256 grossPrice = getSellPrice();
        if (grossPrice == 0) return 0;

        uint256 taxBips = ecosystemManager.getFee(SELL_TAX_KEY);
        uint256 tax = (grossPrice * taxBips) / BIPS_DENOMINATOR;

        return grossPrice - tax;
    }

    function getPoolInfo() external view returns (
        uint256 bkcBalance,
        uint256 nftCount,
        uint256 k,
        bool initialized
    ) {
        return (pool.bkcBalance, pool.nftCount, pool.k, pool.initialized);
    }

    function getAvailableNFTs() external view returns (uint256[] memory) {
        return pool.tokenIds;
    }

    function getNFTBalance() external view returns (uint256) {
        return pool.nftCount;
    }

    function getBKCBalance() external view returns (uint256) {
        return pool.bkcBalance;
    }

    function isNFTInPool(uint256 _tokenId) external view returns (bool) {
        return _isTokenInPool(_tokenId);
    }

    function getTradingStats() external view returns (
        uint256 volume,
        uint256 taxes,
        uint256 buys,
        uint256 sells
    ) {
        return (totalVolume, totalTaxesCollected, totalBuys, totalSells);
    }

    function getSpread() external view returns (uint256 spread, uint256 spreadBips) {
        uint256 buyPrice = getBuyPrice();
        uint256 sellPrice = getSellPrice();

        if (buyPrice == type(uint256).max || sellPrice == 0) {
            return (0, 0);
        }

        spread = buyPrice > sellPrice ? buyPrice - sellPrice : 0;
        spreadBips = sellPrice > 0 ? (spread * BIPS_DENOMINATOR) / sellPrice : 0;
    }

    /**
     * @notice Returns ETH fee configuration
     * @return buyFee ETH fee for buying
     * @return sellFee ETH fee for selling
     * @return totalCollected Total ETH collected
     */
    function getEthFeeConfig() external view returns (
        uint256 buyFee,
        uint256 sellFee,
        uint256 totalCollected
    ) {
        return (buyEthFee, sellEthFee, totalETHCollected);
    }

    /**
     * @notice Returns total buy cost including BKC price, BKC tax, and ETH fee
     * @return bkcCost Total BKC cost (price + tax)
     * @return ethCost ETH fee required
     */
    function getTotalBuyCost() external view returns (uint256 bkcCost, uint256 ethCost) {
        bkcCost = getBuyPriceWithTax();
        ethCost = buyEthFee;
    }

    /**
     * @notice Returns net sell payout and ETH fee required
     * @return bkcPayout Net BKC payout after tax
     * @return ethCost ETH fee required
     */
    function getTotalSellInfo() external view returns (uint256 bkcPayout, uint256 ethCost) {
        bkcPayout = getSellPriceAfterTax();
        ethCost = sellEthFee;
    }

    /// @notice Get the tier name for this pool
    function getTierName() external view returns (string memory) {
        if (boostBips == BOOST_DIAMOND) return "Diamond";
        if (boostBips == BOOST_GOLD) return "Gold";
        if (boostBips == BOOST_SILVER) return "Silver";
        if (boostBips == BOOST_BRONZE) return "Bronze";
        return "Unknown";
    }

    /// @notice Get all valid tier boost values
    function getValidTiers() external pure returns (uint256[4] memory) {
        return [BOOST_BRONZE, BOOST_SILVER, BOOST_GOLD, BOOST_DIAMOND];
    }

    /// @notice Check if a boost value is a valid tier
    function isValidTier(uint256 _boostBips) external pure returns (bool) {
        return _isValidTier(_boostBips);
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    function _executeBuy(uint256 _tokenId, address _operator) internal {
        uint256 price = getBuyPrice();
        if (price == type(uint256).max) revert MathOverflow();

        uint256 taxBips = ecosystemManager.getFee(BUY_TAX_KEY);

        // Checked arithmetic: price * taxBips could overflow with extreme fee values
        uint256 taxAmount = (price * taxBips) / BIPS_DENOMINATOR;
        uint256 totalCost = price + taxAmount;

        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        if (taxAmount > 0) {
            _sendTaxToMining(BUY_TAX_KEY, taxAmount, _operator);
        }

        // Safe: pool.nftCount > 0 checked at function entry (InsufficientNFTs)
        pool.bkcBalance += price;
        pool.nftCount--;
        pool.k = pool.nftCount > 0 ? pool.bkcBalance * pool.nftCount : 0;

        _removeTokenFromPool(_tokenId);
        address boosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable(boosterAddress).safeTransferFrom(
            address(this),
            msg.sender,
            _tokenId
        );

        totalVolume += price;
        totalTaxesCollected += taxAmount;
        totalBuys++;

        emit NFTPurchased(
            msg.sender,
            _tokenId,
            price,
            taxAmount,
            pool.bkcBalance,
            pool.nftCount,
            _operator
        );
    }

    function _sendTaxToMining(
        bytes32 _taxKey,
        uint256 _amount,
        address _operator
    ) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager == address(0)) revert ZeroAddress();
        if (_amount == 0) return;

        bkcToken.safeTransfer(miningManager, _amount);

        // Propagate revert: if MiningManager rejects, the entire tx reverts
        // preventing BKC from being sent without proper distribution accounting
        IMiningManagerV3(miningManager).performPurchaseMiningWithOperator(
            _taxKey,
            _amount,
            _operator
        );
    }

    function _addTokenToPool(uint256 _tokenId) internal {
        pool.tokenIndex[_tokenId] = pool.tokenIds.length;
        pool.tokenIds.push(_tokenId);
    }

    function _removeTokenFromPool(uint256 _tokenId) internal {
        uint256 index = pool.tokenIndex[_tokenId];
        uint256 lastIndex = pool.tokenIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = pool.tokenIds[lastIndex];
            pool.tokenIds[index] = lastTokenId;
            pool.tokenIndex[lastTokenId] = index;
        }

        pool.tokenIds.pop();
        delete pool.tokenIndex[_tokenId];
    }

    function _isTokenInPool(uint256 _tokenId) internal view returns (bool) {
        if (pool.tokenIds.length == 0) return false;

        uint256 index = pool.tokenIndex[_tokenId];
        return index < pool.tokenIds.length && pool.tokenIds[index] == _tokenId;
    }

    function _sendETHToMining(uint256 _amount, address _operator) internal {
        if (_amount == 0) return;

        totalETHCollected += _amount;

        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager == address(0)) revert ZeroAddress();

        // Propagate revert: if MiningManager rejects, entire tx reverts
        // preventing ETH from being stuck in pool without accounting
        IMiningManagerV3(miningManager).performPurchaseMiningWithOperator{value: _amount}(
            BUY_TAX_KEY,
            0,
            _operator
        );
    }

    /// @notice Validates that boost value is one of the valid tiers
    function _isValidTier(uint256 _boostBips) internal pure returns (bool) {
        return _boostBips == BOOST_BRONZE ||
               _boostBips == BOOST_SILVER ||
               _boostBips == BOOST_GOLD ||
               _boostBips == BOOST_DIAMOND;
    }

    receive() external payable {}
}
