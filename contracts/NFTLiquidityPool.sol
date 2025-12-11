// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title NFTLiquidityPool
 * @author Backchain Protocol
 * @notice AMM-style liquidity pool for trading RewardBooster NFTs
 * @dev Implements constant product formula (XY=K) for NFT price discovery:
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                    BONDING CURVE MODEL                          │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │  K = NFT_COUNT × BKC_BALANCE (constant product)                 │
 *      │                                                                 │
 *      │  Buy Price = K / (NFT_COUNT - 1) - BKC_BALANCE                 │
 *      │  Sell Price = BKC_BALANCE - K / (NFT_COUNT + 1)                │
 *      │                                                                 │
 *      │  As NFTs decrease → Price increases (scarcity)                 │
 *      │  As NFTs increase → Price decreases (abundance)                │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      Price Movement Example (K = 1000):
 *      ┌────────────┬─────────────┬───────────┬───────────┐
 *      │ NFT Count  │ BKC Balance │ Buy Price │ Sell Price│
 *      ├────────────┼─────────────┼───────────┼───────────┤
 *      │ 10         │ 100 BKC     │ 11.1 BKC  │ 9.1 BKC   │
 *      │ 5          │ 200 BKC     │ 50.0 BKC  │ 33.3 BKC  │
 *      │ 2          │ 500 BKC     │ 500.0 BKC │ 166.7 BKC │
 *      └────────────┴─────────────┴───────────┴───────────┘
 *
 *      Fee Structure:
 *      - Buy Tax: Paid on top of price (e.g., 5% = price + 5%)
 *      - Sell Tax: Deducted from payout (e.g., 5% = payout - 5%)
 *      - All taxes sent to MiningManager for distribution
 *
 *      One pool per NFT boost tier (Crystal, Iron, Bronze, etc.)
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract NFTLiquidityPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC721ReceiverUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Basis points denominator (100% = 10000)
    uint256 private constant BIPS_DENOMINATOR = 10_000;

    /// @notice Fee key for buy tax
    bytes32 public constant BUY_TAX_KEY = keccak256("NFT_POOL_BUY_TAX_BIPS");

    /// @notice Fee key for sell tax
    bytes32 public constant SELL_TAX_KEY = keccak256("NFT_POOL_SELL_TAX_BIPS");

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /// @notice Pool state data
    struct PoolState {
        uint256 bkcBalance;                      // BKC liquidity in pool
        uint256 nftCount;                        // Number of NFTs in pool
        uint256 k;                               // Constant product (bkcBalance × nftCount)
        bool initialized;                        // Whether pool has initial liquidity
        mapping(uint256 => uint256) tokenIndex;  // tokenId => array index
        uint256[] tokenIds;                      // Array of NFT token IDs in pool
    }

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to ecosystem hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice NFT boost tier for this pool
    uint256 public boostBips;

    /// @notice Pool liquidity state
    PoolState private pool;

    /// @notice Total volume traded (buys + sells)
    uint256 public totalVolume;

    /// @notice Total taxes collected
    uint256 public totalTaxesCollected;

    /// @notice Total NFTs bought from pool
    uint256 public totalBuys;

    /// @notice Total NFTs sold to pool
    uint256 public totalSells;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when initial liquidity is added
    event LiquidityInitialized(
        uint256 indexed boostBips,
        uint256 nftCount,
        uint256 bkcAmount,
        uint256 initialK
    );

    /// @notice Emitted when more NFTs are added to pool
    event NFTsAdded(
        uint256 indexed boostBips,
        uint256 nftCount,
        uint256 newK
    );

    /// @notice Emitted when NFT is purchased from pool
    event NFTPurchased(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price,
        uint256 tax,
        uint256 newBkcBalance,
        uint256 newNftCount
    );

    /// @notice Emitted when NFT is sold to pool
    event NFTSold(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 payout,
        uint256 tax,
        uint256 newBkcBalance,
        uint256 newNftCount
    );

    /// @notice Emitted when BKC liquidity is added
    event BKCLiquidityAdded(uint256 amount, uint256 newBalance, uint256 newK);

    /// @notice Emitted when BKC liquidity is removed (emergency)
    event BKCLiquidityRemoved(uint256 amount, uint256 newBalance);

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

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the NFT liquidity pool
     * @param _owner Pool owner (typically the Factory or admin)
     * @param _ecosystemManager Address of ecosystem hub
     * @param _boostBips NFT boost tier for this pool
     */
    function initialize(
        address _owner,
        address _ecosystemManager,
        uint256 _boostBips
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();
        if (_boostBips == 0 || _boostBips > 10000) revert InvalidBoostTier();

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

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev Required for receiving ERC721 tokens
     */
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

    /**
     * @notice Initializes pool with NFTs and BKC liquidity
     * @dev Can only be called once. Sets the initial K constant.
     * @param _tokenIds Array of NFT token IDs to deposit
     * @param _bkcAmount Amount of BKC to deposit
     */
    function addInitialLiquidity(
        uint256[] calldata _tokenIds,
        uint256 _bkcAmount
    ) external onlyOwner nonReentrant {
        if (pool.initialized) revert PoolAlreadyInitialized();
        if (_tokenIds.length == 0) revert ZeroAmount();
        if (_bkcAmount == 0) revert ZeroAmount();

        pool.initialized = true;

        // Transfer NFTs to pool
        address boosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable nftContract = IERC721Upgradeable(boosterAddress);

        for (uint256 i = 0; i < _tokenIds.length;) {
            nftContract.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _addTokenToPool(_tokenIds[i]);
            unchecked { ++i; }
        }

        // Transfer BKC to pool
        bkcToken.safeTransferFrom(msg.sender, address(this), _bkcAmount);

        // Set pool state
        pool.nftCount = _tokenIds.length;
        pool.bkcBalance = _bkcAmount;
        pool.k = pool.nftCount * pool.bkcBalance;

        emit LiquidityInitialized(boostBips, pool.nftCount, pool.bkcBalance, pool.k);
    }

    /**
     * @notice Adds more NFTs to an existing pool
     * @dev Updates K constant to reflect new liquidity
     * @param _tokenIds Array of NFT token IDs to add
     */
    function addMoreNFTsToPool(
        uint256[] calldata _tokenIds
    ) external onlyOwner nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (_tokenIds.length == 0) revert ZeroAmount();

        address boosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable nftContract = IERC721Upgradeable(boosterAddress);

        for (uint256 i = 0; i < _tokenIds.length;) {
            nftContract.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _addTokenToPool(_tokenIds[i]);
            unchecked { ++i; }
        }

        pool.nftCount += _tokenIds.length;
        pool.k = pool.nftCount * pool.bkcBalance;

        emit NFTsAdded(boostBips, _tokenIds.length, pool.k);
    }

    /**
     * @notice Adds more BKC liquidity to pool
     * @dev Updates K constant to reflect new liquidity
     * @param _amount Amount of BKC to add
     */
    function addBKCLiquidity(uint256 _amount) external onlyOwner nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (_amount == 0) revert ZeroAmount();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        pool.bkcBalance += _amount;
        pool.k = pool.nftCount * pool.bkcBalance;

        emit BKCLiquidityAdded(_amount, pool.bkcBalance, pool.k);
    }

    /**
     * @notice Emergency withdrawal of BKC liquidity
     * @param _amount Amount to withdraw
     */
    function removeBKCLiquidity(uint256 _amount) external onlyOwner nonReentrant {
        if (_amount > pool.bkcBalance) revert InsufficientLiquidity();

        pool.bkcBalance -= _amount;
        pool.k = pool.nftCount * pool.bkcBalance;

        bkcToken.safeTransfer(msg.sender, _amount);

        emit BKCLiquidityRemoved(_amount, pool.bkcBalance);
    }

    // =========================================================================
    //                         TRADING FUNCTIONS
    // =========================================================================

    /**
     * @notice Buys the next available NFT from pool
     * @dev Price is determined by bonding curve + buy tax
     * @return tokenId The purchased NFT token ID
     */
    function buyNFT() external nonReentrant returns (uint256 tokenId) {
        if (!pool.initialized) revert PoolNotInitialized();
        if (pool.nftCount == 0) revert InsufficientNFTs();

        // Get last NFT in array (gas efficient)
        tokenId = pool.tokenIds[pool.tokenIds.length - 1];

        _executeBuy(tokenId);
    }

    /**
     * @notice Buys a specific NFT from pool
     * @param _tokenId Token ID to purchase
     */
    function buySpecificNFT(uint256 _tokenId) external nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();
        if (pool.nftCount == 0) revert InsufficientNFTs();

        // Verify NFT is in pool
        if (!_isTokenInPool(_tokenId)) revert NFTNotInPool();

        _executeBuy(_tokenId);
    }

    /**
     * @notice Buys NFT with maximum price protection
     * @param _maxPrice Maximum total price willing to pay (including tax)
     * @return tokenId The purchased NFT token ID
     */
    function buyNFTWithSlippage(
        uint256 _maxPrice
    ) external nonReentrant returns (uint256 tokenId) {
        if (!pool.initialized) revert PoolNotInitialized();
        if (pool.nftCount == 0) revert InsufficientNFTs();

        uint256 totalCost = getBuyPriceWithTax();
        if (totalCost > _maxPrice) revert SlippageExceeded();

        tokenId = pool.tokenIds[pool.tokenIds.length - 1];
        _executeBuy(tokenId);
    }

    /**
     * @notice Sells an NFT to the pool
     * @param _tokenId Token ID to sell
     * @param _minPayout Minimum BKC expected (slippage protection)
     */
    function sellNFT(
        uint256 _tokenId,
        uint256 _minPayout
    ) external nonReentrant {
        if (!pool.initialized) revert PoolNotInitialized();

        address boosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable nftContract = IERC721Upgradeable(boosterAddress);

        // Verify ownership
        if (nftContract.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();

        // Calculate payout
        uint256 grossValue = getSellPrice();
        uint256 taxBips = ecosystemManager.getFee(SELL_TAX_KEY);
        uint256 taxAmount = (grossValue * taxBips) / BIPS_DENOMINATOR;
        uint256 netPayout = grossValue - taxAmount;

        // Slippage check
        if (netPayout < _minPayout) revert SlippageExceeded();
        if (pool.bkcBalance < grossValue) revert InsufficientLiquidity();

        // Transfer NFT to pool
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        _addTokenToPool(_tokenId);

        // Pay seller
        if (netPayout > 0) {
            bkcToken.safeTransfer(msg.sender, netPayout);
        }

        // Send tax to MiningManager
        if (taxAmount > 0) {
            _sendTaxToMining(SELL_TAX_KEY, taxAmount);
        }

        // Update pool state
        pool.bkcBalance -= grossValue;
        pool.nftCount++;
        pool.k = pool.bkcBalance * pool.nftCount;

        // Update stats
        totalVolume += grossValue;
        totalTaxesCollected += taxAmount;
        totalSells++;

        emit NFTSold(
            msg.sender,
            _tokenId,
            netPayout,
            taxAmount,
            pool.bkcBalance,
            pool.nftCount
        );
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns current buy price (without tax)
     * @dev Price = K / (nftCount - 1) - bkcBalance
     * @return Price in BKC (wei), or max uint256 if insufficient liquidity
     */
    function getBuyPrice() public view returns (uint256) {
        if (!pool.initialized || pool.nftCount <= 1) {
            return type(uint256).max;
        }

        uint256 newBalance = pool.k / (pool.nftCount - 1);
        if (newBalance <= pool.bkcBalance) return 0;

        return newBalance - pool.bkcBalance;
    }

    /**
     * @notice Returns current buy price including tax
     * @return Total cost in BKC (price + tax)
     */
    function getBuyPriceWithTax() public view returns (uint256) {
        uint256 price = getBuyPrice();
        if (price == type(uint256).max) return type(uint256).max;

        uint256 taxBips = ecosystemManager.getFee(BUY_TAX_KEY);
        uint256 tax = (price * taxBips) / BIPS_DENOMINATOR;

        return price + tax;
    }

    /**
     * @notice Returns current sell price (before tax deduction)
     * @dev Price = bkcBalance - K / (nftCount + 1)
     * @return Price in BKC (wei)
     */
    function getSellPrice() public view returns (uint256) {
        if (!pool.initialized || pool.nftCount == 0) return 0;

        uint256 newBalance = pool.k / (pool.nftCount + 1);
        if (pool.bkcBalance <= newBalance) return 0;

        return pool.bkcBalance - newBalance;
    }

    /**
     * @notice Returns sell payout after tax deduction
     * @return Net payout in BKC
     */
    function getSellPriceAfterTax() public view returns (uint256) {
        uint256 grossPrice = getSellPrice();
        if (grossPrice == 0) return 0;

        uint256 taxBips = ecosystemManager.getFee(SELL_TAX_KEY);
        uint256 tax = (grossPrice * taxBips) / BIPS_DENOMINATOR;

        return grossPrice - tax;
    }

    /**
     * @notice Returns pool information
     * @return bkcBalance Current BKC in pool
     * @return nftCount Current NFT count
     * @return k Constant product value
     * @return initialized Whether pool is active
     */
    function getPoolInfo() external view returns (
        uint256 bkcBalance,
        uint256 nftCount,
        uint256 k,
        bool initialized
    ) {
        return (pool.bkcBalance, pool.nftCount, pool.k, pool.initialized);
    }

    /**
     * @notice Returns all NFT token IDs in pool
     * @return Array of token IDs
     */
    function getAvailableNFTs() external view returns (uint256[] memory) {
        return pool.tokenIds;
    }

    /**
     * @notice Returns number of NFTs available
     * @return NFT count
     */
    function getNFTBalance() external view returns (uint256) {
        return pool.nftCount;
    }

    /**
     * @notice Returns BKC balance in pool
     * @return BKC balance (wei)
     */
    function getBKCBalance() external view returns (uint256) {
        return pool.bkcBalance;
    }

    /**
     * @notice Checks if a specific NFT is in the pool
     * @param _tokenId Token ID to check
     * @return True if NFT is in pool
     */
    function isNFTInPool(uint256 _tokenId) external view returns (bool) {
        return _isTokenInPool(_tokenId);
    }

    /**
     * @notice Returns trading statistics
     * @return volume Total trading volume
     * @return taxes Total taxes collected
     * @return buys Total buy transactions
     * @return sells Total sell transactions
     */
    function getTradingStats() external view returns (
        uint256 volume,
        uint256 taxes,
        uint256 buys,
        uint256 sells
    ) {
        return (totalVolume, totalTaxesCollected, totalBuys, totalSells);
    }

    /**
     * @notice Returns spread between buy and sell prices
     * @return spread Price difference (buy - sell)
     * @return spreadBips Spread in basis points
     */
    function getSpread() external view returns (uint256 spread, uint256 spreadBips) {
        uint256 buyPrice = getBuyPrice();
        uint256 sellPrice = getSellPrice();

        if (buyPrice == type(uint256).max || sellPrice == 0) {
            return (0, 0);
        }

        spread = buyPrice > sellPrice ? buyPrice - sellPrice : 0;
        spreadBips = sellPrice > 0 ? (spread * BIPS_DENOMINATOR) / sellPrice : 0;
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Executes NFT purchase logic
     */
    function _executeBuy(uint256 _tokenId) internal {
        uint256 price = getBuyPrice();
        if (price == type(uint256).max) revert MathOverflow();

        // Calculate tax
        uint256 taxBips = ecosystemManager.getFee(BUY_TAX_KEY);
        uint256 taxAmount = (price * taxBips) / BIPS_DENOMINATOR;
        uint256 totalCost = price + taxAmount;

        // Pull payment from buyer
        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Send tax to MiningManager
        if (taxAmount > 0) {
            _sendTaxToMining(BUY_TAX_KEY, taxAmount);
        }

        // Update pool state (price stays in pool)
        pool.bkcBalance += price;
        pool.nftCount--;
        pool.k = pool.nftCount > 0 ? pool.bkcBalance * pool.nftCount : 0;

        // Transfer NFT to buyer
        _removeTokenFromPool(_tokenId);
        address boosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable(boosterAddress).safeTransferFrom(
            address(this),
            msg.sender,
            _tokenId
        );

        // Update stats
        totalVolume += price;
        totalTaxesCollected += taxAmount;
        totalBuys++;

        emit NFTPurchased(
            msg.sender,
            _tokenId,
            price,
            taxAmount,
            pool.bkcBalance,
            pool.nftCount
        );
    }

    /**
     * @dev Sends tax to MiningManager for distribution
     */
    function _sendTaxToMining(bytes32 _taxKey, uint256 _amount) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager != address(0) && _amount > 0) {
            bkcToken.safeTransfer(miningManager, _amount);
            IMiningManager(miningManager).performPurchaseMining(_taxKey, _amount);
        }
    }

    /**
     * @dev Adds token ID to pool tracking
     */
    function _addTokenToPool(uint256 _tokenId) internal {
        pool.tokenIndex[_tokenId] = pool.tokenIds.length;
        pool.tokenIds.push(_tokenId);
    }

    /**
     * @dev Removes token ID from pool tracking (swap and pop)
     */
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

    /**
     * @dev Checks if token is in pool
     */
    function _isTokenInPool(uint256 _tokenId) internal view returns (bool) {
        if (pool.tokenIds.length == 0) return false;

        uint256 index = pool.tokenIndex[_tokenId];
        return index < pool.tokenIds.length && pool.tokenIds[index] == _tokenId;
    }
}
