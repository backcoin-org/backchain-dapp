// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./IInterfaces.sol";

/**
 * @title PublicSale
 * @author Backchain Protocol
 * @notice Public sale contract for RewardBooster NFTs
 * @dev Implements tiered NFT sales with native ETH payments:
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                      SALE FLOW                                  │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │  1. Admin configures tiers (price, supply, boost, metadata)    │
 *      │  2. User sends ETH to buy NFT from desired tier                │
 *      │  3. NFT minted directly to buyer via RewardBoosterNFT          │
 *      │  4. Funds sent to Treasury                                      │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      Tier Configuration Example:
 *      ┌────────────┬────────────┬─────────┬──────────┬─────────────┐
 *      │ Tier ID    │ Name       │ Price   │ Supply   │ Boost       │
 *      ├────────────┼────────────┼─────────┼──────────┼─────────────┤
 *      │ 1          │ Crystal    │ 0.01 ETH│ 1000     │ 10% (1000)  │
 *      │ 2          │ Iron       │ 0.02 ETH│ 800      │ 20% (2000)  │
 *      │ 3          │ Bronze     │ 0.03 ETH│ 600      │ 30% (3000)  │
 *      │ 4          │ Silver     │ 0.05 ETH│ 400      │ 40% (4000)  │
 *      │ 5          │ Gold       │ 0.08 ETH│ 200      │ 50% (5000)  │
 *      │ 6          │ Platinum   │ 0.12 ETH│ 100      │ 60% (6000)  │
 *      │ 7          │ Diamond    │ 0.20 ETH│ 50       │ 70% (7000)  │
 *      └────────────┴────────────┴─────────┴──────────┴─────────────┘
 *
 *      Features:
 *      - Multiple tiers with different prices and boost values
 *      - Per-wallet purchase limits
 *      - Whitelist support (optional)
 *      - Auto-withdrawal to Treasury
 *      - Batch minting support
 *      - Sale statistics tracking
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract PublicSale is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /// @notice Tier configuration (storage-optimized)
    struct Tier {
        uint256 priceInWei;     // Price per NFT in wei
        uint64 maxSupply;       // Maximum NFTs for this tier
        uint64 mintedCount;     // NFTs already minted
        uint16 boostBips;       // Boost value in basis points
        bool isConfigured;      // Whether tier is set up
        bool isActive;          // Whether tier is available for purchase
        string metadataFile;    // Metadata filename
        string name;            // Tier display name
    }

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice RewardBoosterNFT contract
    IRewardBoosterNFT public rewardBoosterNFT;

    /// @notice Ecosystem manager reference
    IEcosystemManager public ecosystemManager;

    /// @notice Tier ID => Tier configuration
    mapping(uint256 => Tier) public tiers;

    /// @notice Array of configured tier IDs
    uint256[] public tierIds;

    /// @notice Wallet => Tier ID => Purchase count
    mapping(address => mapping(uint256 => uint256)) public purchasesByWallet;

    /// @notice Tier ID => Max purchases per wallet (0 = unlimited)
    mapping(uint256 => uint256) public maxPerWallet;

    /// @notice Whether whitelist is required
    bool public whitelistEnabled;

    /// @notice Address => is whitelisted
    mapping(address => bool) public whitelist;

    /// @notice Whether sale is paused
    bool public paused;

    /// @notice Sale start timestamp (0 = immediately)
    uint256 public saleStartTime;

    /// @notice Sale end timestamp (0 = no end)
    uint256 public saleEndTime;

    /// @notice Total ETH raised
    uint256 public totalRaised;

    /// @notice Total NFTs sold across all tiers
    uint256 public totalSold;

    /// @notice Auto-withdraw to treasury after each purchase
    bool public autoWithdraw;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when NFT is purchased
    event NFTPurchased(
        address indexed buyer,
        uint256 indexed tierId,
        uint256 indexed tokenId,
        uint256 price,
        uint256 quantity
    );

    /// @notice Emitted when tier is configured
    event TierConfigured(
        uint256 indexed tierId,
        string name,
        uint256 price,
        uint64 maxSupply,
        uint16 boostBips
    );

    /// @notice Emitted when tier price is updated
    event TierPriceUpdated(
        uint256 indexed tierId,
        uint256 previousPrice,
        uint256 newPrice
    );

    /// @notice Emitted when tier status changes
    event TierStatusChanged(uint256 indexed tierId, bool isActive);

    /// @notice Emitted when funds are withdrawn
    event FundsWithdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when whitelist status changes
    event WhitelistStatusChanged(address indexed account, bool isWhitelisted);

    /// @notice Emitted when sale is paused/unpaused
    event SalePaused(bool isPaused);

    /// @notice Emitted when sale times are updated
    event SaleTimesUpdated(uint256 startTime, uint256 endTime);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error TierNotConfigured();
    error TierNotActive();
    error TierSoldOut();
    error IncorrectPayment(uint256 sent, uint256 required);
    error WithdrawalFailed();
    error SaleNotStarted();
    error SaleEnded();
    error SaleIsPaused();
    error NotWhitelisted();
    error ExceedsWalletLimit(uint256 current, uint256 max);
    error TierAlreadyExists();
    error InvalidTierConfig();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the public sale contract
     * @param _rewardBoosterNFT RewardBoosterNFT contract address
     * @param _ecosystemManager Ecosystem manager address
     * @param _owner Contract owner
     */
    function initialize(
        address _rewardBoosterNFT,
        address _ecosystemManager,
        address _owner
    ) external initializer {
        if (_rewardBoosterNFT == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();

        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);

        rewardBoosterNFT = IRewardBoosterNFT(_rewardBoosterNFT);
        ecosystemManager = IEcosystemManager(_ecosystemManager);

        autoWithdraw = true;
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Configures a new sale tier
     * @param _tierId Unique tier identifier
     * @param _name Tier display name
     * @param _priceInWei Price per NFT in wei
     * @param _maxSupply Maximum NFTs for this tier
     * @param _boostBips Boost value in basis points
     * @param _metadataFile Metadata filename
     */
    function setTier(
        uint256 _tierId,
        string calldata _name,
        uint256 _priceInWei,
        uint64 _maxSupply,
        uint16 _boostBips,
        string calldata _metadataFile
    ) external onlyOwner {
        if (_maxSupply == 0) revert InvalidTierConfig();
        if (_boostBips == 0 || _boostBips > 10000) revert InvalidTierConfig();

        Tier storage tier = tiers[_tierId];

        // Track new tier IDs
        if (!tier.isConfigured) {
            tierIds.push(_tierId);
        }

        tier.name = _name;
        tier.priceInWei = _priceInWei;
        tier.maxSupply = _maxSupply;
        tier.boostBips = _boostBips;
        tier.metadataFile = _metadataFile;
        tier.isConfigured = true;
        tier.isActive = true;

        emit TierConfigured(_tierId, _name, _priceInWei, _maxSupply, _boostBips);
    }

    /**
     * @notice Updates tier price
     * @param _tierId Tier to update
     * @param _newPriceInWei New price in wei
     */
    function updateTierPrice(uint256 _tierId, uint256 _newPriceInWei) external onlyOwner {
        Tier storage tier = tiers[_tierId];
        if (!tier.isConfigured) revert TierNotConfigured();

        uint256 previousPrice = tier.priceInWei;
        tier.priceInWei = _newPriceInWei;

        emit TierPriceUpdated(_tierId, previousPrice, _newPriceInWei);
    }

    /**
     * @notice Sets tier active status
     * @param _tierId Tier to update
     * @param _isActive Whether tier is available
     */
    function setTierActive(uint256 _tierId, bool _isActive) external onlyOwner {
        Tier storage tier = tiers[_tierId];
        if (!tier.isConfigured) revert TierNotConfigured();

        tier.isActive = _isActive;

        emit TierStatusChanged(_tierId, _isActive);
    }

    /**
     * @notice Sets maximum purchases per wallet for a tier
     * @param _tierId Tier to configure
     * @param _maxPurchases Max purchases (0 = unlimited)
     */
    function setMaxPerWallet(uint256 _tierId, uint256 _maxPurchases) external onlyOwner {
        maxPerWallet[_tierId] = _maxPurchases;
    }

    /**
     * @notice Sets sale start and end times
     * @param _startTime Start timestamp (0 = immediate)
     * @param _endTime End timestamp (0 = no end)
     */
    function setSaleTimes(uint256 _startTime, uint256 _endTime) external onlyOwner {
        saleStartTime = _startTime;
        saleEndTime = _endTime;

        emit SaleTimesUpdated(_startTime, _endTime);
    }

    /**
     * @notice Pauses/unpauses the sale
     * @param _paused True to pause
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit SalePaused(_paused);
    }

    /**
     * @notice Enables/disables whitelist requirement
     * @param _enabled True to require whitelist
     */
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
    }

    /**
     * @notice Updates whitelist status for addresses
     * @param _accounts Addresses to update
     * @param _isWhitelisted Whitelist status
     */
    function setWhitelist(
        address[] calldata _accounts,
        bool _isWhitelisted
    ) external onlyOwner {
        uint256 length = _accounts.length;
        for (uint256 i = 0; i < length;) {
            whitelist[_accounts[i]] = _isWhitelisted;
            emit WhitelistStatusChanged(_accounts[i], _isWhitelisted);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Sets auto-withdraw behavior
     * @param _autoWithdraw True to auto-send to treasury
     */
    function setAutoWithdraw(bool _autoWithdraw) external onlyOwner {
        autoWithdraw = _autoWithdraw;
    }

    /**
     * @notice Withdraws all funds to Treasury
     */
    function withdrawFunds() external onlyOwner {
        _withdrawToTreasury();
    }

    /**
     * @notice Emergency withdrawal to specific address
     * @param _to Recipient address
     */
    function emergencyWithdraw(address _to) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success,) = _to.call{value: balance}("");
            if (!success) revert WithdrawalFailed();

            emit FundsWithdrawn(_to, balance);
        }
    }

    // =========================================================================
    //                         PURCHASE FUNCTIONS
    // =========================================================================

    /**
     * @notice Purchases a single NFT from a tier
     * @param _tierId Tier to purchase from
     */
    function buyNFT(uint256 _tierId) external payable nonReentrant {
        _purchase(_tierId, 1);
    }

    /**
     * @notice Purchases multiple NFTs from a tier
     * @param _tierId Tier to purchase from
     * @param _quantity Number of NFTs to purchase
     */
    function buyMultipleNFTs(
        uint256 _tierId,
        uint256 _quantity
    ) external payable nonReentrant {
        _purchase(_tierId, _quantity);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns tier information
     * @param _tierId Tier to query
     */
    function getTier(uint256 _tierId) external view returns (Tier memory) {
        return tiers[_tierId];
    }

    /**
     * @notice Returns all configured tier IDs
     */
    function getAllTierIds() external view returns (uint256[] memory) {
        return tierIds;
    }

    /**
     * @notice Returns remaining supply for a tier
     * @param _tierId Tier to query
     */
    function getRemainingSupply(uint256 _tierId) external view returns (uint256) {
        Tier memory tier = tiers[_tierId];
        if (!tier.isConfigured) return 0;
        return tier.maxSupply - tier.mintedCount;
    }

    /**
     * @notice Returns purchase cost for quantity
     * @param _tierId Tier to query
     * @param _quantity Number of NFTs
     */
    function getPurchaseCost(
        uint256 _tierId,
        uint256 _quantity
    ) external view returns (uint256) {
        return tiers[_tierId].priceInWei * _quantity;
    }

    /**
     * @notice Checks if address can purchase from tier
     * @param _buyer Buyer address
     * @param _tierId Tier to check
     * @param _quantity Desired quantity
     */
    function canPurchase(
        address _buyer,
        uint256 _tierId,
        uint256 _quantity
    ) external view returns (bool, string memory) {
        if (paused) return (false, "Sale paused");
        if (saleStartTime > 0 && block.timestamp < saleStartTime) {
            return (false, "Sale not started");
        }
        if (saleEndTime > 0 && block.timestamp > saleEndTime) {
            return (false, "Sale ended");
        }
        if (whitelistEnabled && !whitelist[_buyer]) {
            return (false, "Not whitelisted");
        }

        Tier memory tier = tiers[_tierId];
        if (!tier.isConfigured) return (false, "Tier not configured");
        if (!tier.isActive) return (false, "Tier not active");
        if (tier.mintedCount + _quantity > tier.maxSupply) {
            return (false, "Exceeds supply");
        }

        uint256 maxPurchase = maxPerWallet[_tierId];
        if (maxPurchase > 0) {
            uint256 currentPurchases = purchasesByWallet[_buyer][_tierId];
            if (currentPurchases + _quantity > maxPurchase) {
                return (false, "Exceeds wallet limit");
            }
        }

        return (true, "");
    }

    /**
     * @notice Returns sale statistics
     */
    function getSaleStats() external view returns (
        uint256 raised,
        uint256 sold,
        uint256 activeTiers,
        uint256 totalConfiguredTiers
    ) {
        raised = totalRaised;
        sold = totalSold;
        totalConfiguredTiers = tierIds.length;

        for (uint256 i = 0; i < tierIds.length;) {
            if (tiers[tierIds[i]].isActive) {
                activeTiers++;
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns all tiers with their info
     */
    function getAllTiers() external view returns (
        uint256[] memory ids,
        string[] memory names,
        uint256[] memory prices,
        uint64[] memory supplies,
        uint64[] memory minted,
        bool[] memory active
    ) {
        uint256 length = tierIds.length;

        ids = new uint256[](length);
        names = new string[](length);
        prices = new uint256[](length);
        supplies = new uint64[](length);
        minted = new uint64[](length);
        active = new bool[](length);

        for (uint256 i = 0; i < length;) {
            uint256 tierId = tierIds[i];
            Tier memory tier = tiers[tierId];

            ids[i] = tierId;
            names[i] = tier.name;
            prices[i] = tier.priceInWei;
            supplies[i] = tier.maxSupply;
            minted[i] = tier.mintedCount;
            active[i] = tier.isActive;

            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns user purchase info for a tier
     * @param _user User address
     * @param _tierId Tier to query
     */
    function getUserPurchases(
        address _user,
        uint256 _tierId
    ) external view returns (
        uint256 purchased,
        uint256 maxAllowed,
        uint256 remaining
    ) {
        purchased = purchasesByWallet[_user][_tierId];
        maxAllowed = maxPerWallet[_tierId];

        if (maxAllowed == 0) {
            remaining = type(uint256).max; // Unlimited
        } else {
            remaining = maxAllowed > purchased ? maxAllowed - purchased : 0;
        }
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Internal purchase logic
     */
    function _purchase(uint256 _tierId, uint256 _quantity) internal {
        // Validation checks
        if (paused) revert SaleIsPaused();
        if (_quantity == 0) revert ZeroAmount();
        if (saleStartTime > 0 && block.timestamp < saleStartTime) {
            revert SaleNotStarted();
        }
        if (saleEndTime > 0 && block.timestamp > saleEndTime) {
            revert SaleEnded();
        }
        if (whitelistEnabled && !whitelist[msg.sender]) {
            revert NotWhitelisted();
        }

        Tier storage tier = tiers[_tierId];
        if (!tier.isConfigured) revert TierNotConfigured();
        if (!tier.isActive) revert TierNotActive();

        // Supply check
        if (tier.mintedCount + _quantity > tier.maxSupply) {
            revert TierSoldOut();
        }

        // Wallet limit check
        uint256 maxPurchase = maxPerWallet[_tierId];
        if (maxPurchase > 0) {
            uint256 currentPurchases = purchasesByWallet[msg.sender][_tierId];
            if (currentPurchases + _quantity > maxPurchase) {
                revert ExceedsWalletLimit(currentPurchases, maxPurchase);
            }
        }

        // Payment check
        uint256 totalPrice = tier.priceInWei * _quantity;
        if (msg.value != totalPrice) {
            revert IncorrectPayment(msg.value, totalPrice);
        }

        // Update state
        tier.mintedCount += uint64(_quantity);
        purchasesByWallet[msg.sender][_tierId] += _quantity;
        totalRaised += totalPrice;
        totalSold += _quantity;

        // Mint NFTs
        for (uint256 i = 0; i < _quantity;) {
            uint256 tokenId = rewardBoosterNFT.mintFromSale(
                msg.sender,
                tier.boostBips,
                tier.metadataFile
            );

            emit NFTPurchased(
                msg.sender,
                _tierId,
                tokenId,
                tier.priceInWei,
                1
            );

            unchecked { ++i; }
        }

        // Auto-withdraw if enabled
        if (autoWithdraw) {
            _withdrawToTreasury();
        }
    }

    /**
     * @dev Withdraws balance to Treasury
     */
    function _withdrawToTreasury() internal {
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury == address(0)) return;

        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success,) = treasury.call{value: balance}("");
            if (!success) revert WithdrawalFailed();

            emit FundsWithdrawn(treasury, balance);
        }
    }

    /**
     * @notice Receive ETH (for direct transfers)
     */
    receive() external payable {}
}
