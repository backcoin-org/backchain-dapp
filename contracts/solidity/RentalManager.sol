// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title RentalManager V2 (AirBNFT Protocol)
 * @author Backchain Protocol
 * @notice Decentralized marketplace for time-limited NFT rentals with MetaAds & Burn mechanics
 * @dev V2 Features:
 *      - MetaAds promotion system (pay ETH to boost listing visibility)
 *      - Configurable burn mechanism (deflationary)
 *      - Configurable mining fee distribution
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                      RENTAL FLOW                                │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │  1. Owner lists NFT → NFT transferred to escrow                 │
 *      │  2. Owner promotes listing (optional) → Pay ETH to treasury     │
 *      │  3. Tenant rents NFT → Payment distributed:                     │
 *      │     • Mining fee → MiningManager (PoP)                          │
 *      │     • Burn fee → Burned (deflationary) 🔥                       │
 *      │     • Net amount → Owner payout                                 │
 *      │  4. Rental expires → NFT available for next rental              │
 *      │  5. Owner withdraws → NFT returned (if not rented)              │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      Fee Structure (Configurable):
 *      ┌────────────────────────────────────────────┐
 *      │  Default: 10% total fee                    │
 *      │  ├── 7% → MiningManager (PoP mining)       │
 *      │  └── 3% → Burn (deflationary)              │
 *      └────────────────────────────────────────────┘
 *
 *      Promotion System (MetaAds):
 *      ┌────────────────────────────────────────────┐
 *      │  Owner pays ETH → Treasury receives ETH    │
 *      │  promotionFee stored in listing            │
 *      │  Frontend sorts by promotionFee (desc)     │
 *      │  Higher fee = More visibility              │
 *      └────────────────────────────────────────────┘
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract RentalManager is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC721HolderUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /// @notice Listing information for an NFT
    struct Listing {
        address owner;          // Original NFT owner
        uint256 pricePerHour;   // Rental cost per hour in BKC (wei)
        uint256 minHours;       // Minimum rental duration
        uint256 maxHours;       // Maximum rental duration
        bool isActive;          // Whether listing is active
        uint256 totalEarnings;  // Total BKC earned from rentals
        uint256 rentalCount;    // Number of times rented
    }

    /// @notice Active rental information
    struct Rental {
        address tenant;         // Current renter
        uint256 startTime;      // Rental start timestamp
        uint256 endTime;        // Rental end timestamp
        uint256 paidAmount;     // Total amount paid
    }

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BIPS_DENOMINATOR = 10_000;

    /// @notice Service key for MiningManager authorization
    bytes32 public constant SERVICE_KEY = keccak256("RENTAL_MARKET_TAX_BIPS");

    /// @notice Default rental duration (1 hour)
    uint256 public constant DEFAULT_DURATION = 1 hours;

    /// @notice Maximum total fee allowed (30%)
    uint256 public constant MAX_TOTAL_FEE_BIPS = 3000;

    // =========================================================================
    //                              STATE (V1)
    // =========================================================================

    /// @notice Ecosystem manager reference
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract (using BKCToken for burn function)
    BKCToken public bkcToken;

    /// @notice NFT contract (RewardBoosterNFT)
    IERC721Upgradeable public nftContract;

    /// @notice Token ID => Listing details
    mapping(uint256 => Listing) public listings;

    /// @notice Token ID => Active rental details
    mapping(uint256 => Rental) public activeRentals;

    /// @notice Array of all listed token IDs
    uint256[] public listedTokenIds;

    /// @notice Token ID => Array index (for O(1) removal)
    mapping(uint256 => uint256) private _tokenIndex;

    /// @notice Total protocol fees collected (mining)
    uint256 public totalFeesCollected;

    /// @notice Total rental volume
    uint256 public totalVolume;

    /// @notice Total rentals completed
    uint256 public totalRentals;

    /// @notice Whether marketplace is paused
    bool public paused;

    /// @notice Global rental duration override (0 = use listing settings)
    uint256 public globalRentalDuration;

    // =========================================================================
    //                         V2 STATE (PROMOTION + BURN)
    // =========================================================================

    /// @notice Token ID => Promotion fee paid in ETH (wei)
    mapping(uint256 => uint256) public promotionFees;

    /// @notice Treasury address for promotion payments
    address public treasury;

    /// @notice Total promotion fees collected (ETH)
    uint256 public totalPromotionFeesCollected;

    // -------------------------------------------------------------------------
    // V2: Configurable Fee Structure
    // -------------------------------------------------------------------------

    /// @notice Fee sent to MiningManager on rental (default: 700 = 7%)
    uint256 public rentalMiningFeeBips;

    /// @notice Fee burned on rental (default: 300 = 3%)
    uint256 public rentalBurnFeeBips;

    /// @notice Total BKC burned through rentals
    uint256 public totalBurnedAllTime;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when NFT is listed for rent
    event NFTListed(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 pricePerHour,
        uint256 minHours,
        uint256 maxHours
    );

    /// @notice Emitted when listing is updated
    event ListingUpdated(
        uint256 indexed tokenId,
        uint256 newPricePerHour,
        uint256 newMinHours,
        uint256 newMaxHours
    );

    /// @notice Emitted when NFT is withdrawn
    event NFTWithdrawn(
        uint256 indexed tokenId,
        address indexed owner
    );

    /// @notice Emitted when NFT is rented
    event NFTRented(
        uint256 indexed tokenId,
        address indexed tenant,
        address indexed owner,
        uint256 hours_,
        uint256 totalCost,
        uint256 miningFee,
        uint256 burnFee,
        uint256 ownerPayout,
        uint256 endTime
    );

    /// @notice Emitted when rental expires (for indexers)
    event RentalExpired(
        uint256 indexed tokenId,
        address indexed tenant
    );

    /// @notice Emitted when marketplace is paused/unpaused
    event MarketplacePaused(bool isPaused);

    /// @notice V2: Emitted when listing is promoted
    event ListingPromoted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 amount,
        uint256 totalPromotionFee
    );

    /// @notice V2: Emitted when tokens are burned
    event TokensBurned(
        uint256 indexed tokenId,
        uint256 amount,
        string reason
    );

    /// @notice V2: Emitted when fees are updated
    event FeesUpdated(
        uint256 miningFeeBips,
        uint256 burnFeeBips
    );

    /// @notice V2: Emitted when treasury is updated
    event TreasuryUpdated(
        address oldTreasury,
        address newTreasury
    );

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error NotListingOwner();
    error NFTNotListed();
    error NFTAlreadyListed();
    error RentalStillActive();
    error InvalidDuration();
    error MarketplaceIsPaused();
    error InsufficientPayment();
    error InvalidHoursRange();
    error ETHTransferFailed();
    error InvalidFeeBips();
    error AlreadyInitializedV2();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the rental marketplace (V1)
     * @param _ecosystemManager Ecosystem hub address
     * @param _nftContract NFT contract address (RewardBoosterNFT)
     */
    function initialize(
        address _ecosystemManager,
        address _nftContract
    ) external initializer {
        if (_ecosystemManager == address(0)) revert ZeroAddress();
        if (_nftContract == address(0)) revert ZeroAddress();

        __Ownable_init();
        __ReentrancyGuard_init();
        __ERC721Holder_init();
        __UUPSUpgradeable_init();

        ecosystemManager = IEcosystemManager(_ecosystemManager);
        bkcToken = BKCToken(ecosystemManager.getBKCTokenAddress());
        nftContract = IERC721Upgradeable(_nftContract);
        
        // V2: Set default treasury to owner (will be updated in initializeV2)
        treasury = msg.sender;
        
        // V2: Set default fees (total 10%: 7% mining + 3% burn)
        rentalMiningFeeBips = 700;  // 7%
        rentalBurnFeeBips = 300;    // 3%
    }

    /**
     * @notice V2: Initialize V2 state (call after upgrade)
     * @dev Sets treasury and optionally custom fees
     * @param _treasury Treasury address for promotion payments
     * @param _miningFeeBips Mining fee in basis points (0 = keep current)
     * @param _burnFeeBips Burn fee in basis points (0 = keep current)
     */
    function initializeV2(
        address _treasury,
        uint256 _miningFeeBips,
        uint256 _burnFeeBips
    ) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        
        treasury = _treasury;
        
        // Only update fees if provided (non-zero)
        if (_miningFeeBips > 0 || _burnFeeBips > 0) {
            uint256 newMining = _miningFeeBips > 0 ? _miningFeeBips : rentalMiningFeeBips;
            uint256 newBurn = _burnFeeBips > 0 ? _burnFeeBips : rentalBurnFeeBips;
            
            if (newMining + newBurn > MAX_TOTAL_FEE_BIPS) revert InvalidFeeBips();
            
            rentalMiningFeeBips = newMining;
            rentalBurnFeeBips = newBurn;
            
            emit FeesUpdated(newMining, newBurn);
        }
        
        emit TreasuryUpdated(address(0), _treasury);
    }

    /// @dev Required by UUPSUpgradeable
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // =========================================================================
    //                         V2: PROMOTION FUNCTIONS
    // =========================================================================

    /**
     * @notice Promote a listing by paying ETH (MetaAds)
     * @dev ETH is sent to treasury, amount is added to existing promotion fee
     * @param _tokenId Token ID to promote
     */
    function promoteListing(uint256 _tokenId) external payable nonReentrant {
        if (paused) revert MarketplaceIsPaused();
        if (msg.value == 0) revert ZeroAmount();
        
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();
        if (listing.owner != msg.sender) revert NotListingOwner();

        // Add to promotion fee (accumulative)
        promotionFees[_tokenId] += msg.value;
        totalPromotionFeesCollected += msg.value;

        // Send ETH to treasury
        (bool sent, ) = treasury.call{value: msg.value}("");
        if (!sent) revert ETHTransferFailed();

        emit ListingPromoted(_tokenId, msg.sender, msg.value, promotionFees[_tokenId]);
    }

    /**
     * @notice Get promotion fee for a listing
     * @param _tokenId Token ID to query
     * @return Promotion fee in wei
     */
    function getPromotionFee(uint256 _tokenId) external view returns (uint256) {
        return promotionFees[_tokenId];
    }

    /**
     * @notice Get all listings with promotion fees (for frontend sorting)
     * @return tokenIds Array of token IDs
     * @return fees Array of promotion fees
     */
    function getPromotionRanking() external view returns (
        uint256[] memory tokenIds,
        uint256[] memory fees
    ) {
        uint256 length = listedTokenIds.length;
        tokenIds = new uint256[](length);
        fees = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            tokenIds[i] = listedTokenIds[i];
            fees[i] = promotionFees[listedTokenIds[i]];
        }
        
        return (tokenIds, fees);
    }

    // =========================================================================
    //                          LISTING FUNCTIONS
    // =========================================================================

    /**
     * @notice Lists an NFT for rental
     * @param _tokenId Token ID to list
     * @param _pricePerHour Price per hour in BKC (wei)
     * @param _minHours Minimum rental hours
     * @param _maxHours Maximum rental hours
     */
    function listNFT(
        uint256 _tokenId,
        uint256 _pricePerHour,
        uint256 _minHours,
        uint256 _maxHours
    ) external nonReentrant {
        if (paused) revert MarketplaceIsPaused();
        if (_pricePerHour == 0) revert ZeroAmount();
        if (_minHours == 0 || _maxHours == 0) revert InvalidDuration();
        if (_minHours > _maxHours) revert InvalidHoursRange();
        if (listings[_tokenId].isActive) revert NFTAlreadyListed();

        // Transfer NFT to contract (escrow)
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);

        listings[_tokenId] = Listing({
            owner: msg.sender,
            pricePerHour: _pricePerHour,
            minHours: _minHours,
            maxHours: _maxHours,
            isActive: true,
            totalEarnings: 0,
            rentalCount: 0
        });

        _addToListedArray(_tokenId);

        emit NFTListed(_tokenId, msg.sender, _pricePerHour, _minHours, _maxHours);
    }

    /**
     * @notice Updates listing parameters
     * @param _tokenId Token ID
     * @param _pricePerHour New price per hour
     * @param _minHours New minimum hours
     * @param _maxHours New maximum hours
     */
    function updateListing(
        uint256 _tokenId,
        uint256 _pricePerHour,
        uint256 _minHours,
        uint256 _maxHours
    ) external {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();
        if (listing.owner != msg.sender) revert NotListingOwner();
        if (_pricePerHour == 0) revert ZeroAmount();
        if (_minHours == 0 || _maxHours == 0) revert InvalidDuration();
        if (_minHours > _maxHours) revert InvalidHoursRange();

        listing.pricePerHour = _pricePerHour;
        listing.minHours = _minHours;
        listing.maxHours = _maxHours;

        emit ListingUpdated(_tokenId, _pricePerHour, _minHours, _maxHours);
    }

    /**
     * @notice Withdraws NFT from marketplace
     * @param _tokenId Token ID to withdraw
     */
    function withdrawNFT(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();
        if (listing.owner != msg.sender) revert NotListingOwner();

        // Check rental not active
        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        // Clear listing state
        address owner = listing.owner;
        delete listings[_tokenId];
        delete activeRentals[_tokenId];
        
        // V2: Clear promotion fee
        delete promotionFees[_tokenId];
        
        _removeFromListedArray(_tokenId);

        // Return NFT
        nftContract.safeTransferFrom(address(this), owner, _tokenId);

        emit NFTWithdrawn(_tokenId, owner);
    }

    // =========================================================================
    //                          RENTAL FUNCTIONS
    // =========================================================================

    /**
     * @notice Rents an NFT for specified hours
     * @dev Fee distribution:
     *      - rentalMiningFeeBips% → MiningManager (triggers PoP)
     *      - rentalBurnFeeBips% → Burned (deflationary)
     *      - Remainder → Owner payout
     *
     * @param _tokenId Token ID to rent
     * @param _hours Duration in hours
     */
    function rentNFT(uint256 _tokenId, uint256 _hours) external nonReentrant {
        if (paused) revert MarketplaceIsPaused();

        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();

        // Validate duration
        if (_hours < listing.minHours || _hours > listing.maxHours) {
            revert InvalidHoursRange();
        }

        // Check not currently rented
        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        // Calculate costs
        uint256 totalCost = listing.pricePerHour * _hours;
        uint256 miningFee = (totalCost * rentalMiningFeeBips) / BIPS_DENOMINATOR;
        uint256 burnFee = (totalCost * rentalBurnFeeBips) / BIPS_DENOMINATOR;
        uint256 ownerPayout = totalCost - miningFee - burnFee;

        // Transfer payment from tenant
        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Process mining fee → MiningManager
        if (miningFee > 0) {
            address miningManager = ecosystemManager.getMiningManagerAddress();
            if (miningManager != address(0)) {
                bkcToken.safeTransfer(miningManager, miningFee);
                IMiningManager(miningManager).performPurchaseMining(SERVICE_KEY, miningFee);
            }
        }

        // Process burn fee → Burn (deflationary) 🔥
        if (burnFee > 0) {
            bkcToken.burn(burnFee);
            unchecked {
                totalBurnedAllTime += burnFee;
            }
            emit TokensBurned(_tokenId, burnFee, "rental_fee");
        }

        // Owner payout
        if (ownerPayout > 0) {
            bkcToken.safeTransfer(listing.owner, ownerPayout);
        }

        // Calculate end time
        uint256 duration = globalRentalDuration > 0 
            ? globalRentalDuration 
            : _hours * 1 hours;
        uint256 endTime = block.timestamp + duration;

        // Record rental
        activeRentals[_tokenId] = Rental({
            tenant: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            paidAmount: totalCost
        });

        // Update stats
        listing.totalEarnings += ownerPayout;
        listing.rentalCount++;
        totalFeesCollected += miningFee;
        totalVolume += totalCost;
        totalRentals++;

        emit NFTRented(
            _tokenId,
            msg.sender,
            listing.owner,
            _hours,
            totalCost,
            miningFee,
            burnFee,
            ownerPayout,
            endTime
        );
    }

    /**
     * @notice Simple 1-hour rental (backward compatible)
     * @param _tokenId NFT token ID to rent
     */
    function rentNFTSimple(uint256 _tokenId) external nonReentrant {
        if (paused) revert MarketplaceIsPaused();

        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();

        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        uint256 totalCost = listing.pricePerHour;
        uint256 miningFee = (totalCost * rentalMiningFeeBips) / BIPS_DENOMINATOR;
        uint256 burnFee = (totalCost * rentalBurnFeeBips) / BIPS_DENOMINATOR;
        uint256 ownerPayout = totalCost - miningFee - burnFee;

        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Mining fee
        if (miningFee > 0) {
            address miningManager = ecosystemManager.getMiningManagerAddress();
            if (miningManager != address(0)) {
                bkcToken.safeTransfer(miningManager, miningFee);
                IMiningManager(miningManager).performPurchaseMining(SERVICE_KEY, miningFee);
            }
        }

        // Burn fee 🔥
        if (burnFee > 0) {
            bkcToken.burn(burnFee);
            unchecked {
                totalBurnedAllTime += burnFee;
            }
            emit TokensBurned(_tokenId, burnFee, "rental_fee");
        }

        // Owner payout
        if (ownerPayout > 0) {
            bkcToken.safeTransfer(listing.owner, ownerPayout);
        }

        uint256 endTime = block.timestamp + 1 hours;

        activeRentals[_tokenId] = Rental({
            tenant: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            paidAmount: totalCost
        });

        listing.totalEarnings += ownerPayout;
        listing.rentalCount++;
        totalFeesCollected += miningFee;
        totalVolume += totalCost;
        totalRentals++;

        emit NFTRented(
            _tokenId,
            msg.sender,
            listing.owner,
            1,
            totalCost,
            miningFee,
            burnFee,
            ownerPayout,
            endTime
        );
    }

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Pauses/unpauses the marketplace
     * @param _paused True to pause
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit MarketplacePaused(_paused);
    }

    /**
     * @notice Sets global rental duration override
     * @param _duration Duration in seconds (0 = use listing settings)
     */
    function setGlobalRentalDuration(uint256 _duration) external onlyOwner {
        globalRentalDuration = _duration;
    }

    /**
     * @notice V2: Sets treasury address for promotion payments
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @notice V2: Updates rental fee configuration
     * @dev Total fee cannot exceed 30% (MAX_TOTAL_FEE_BIPS)
     *
     * @param _miningFeeBips Mining fee in basis points (e.g., 700 = 7%)
     * @param _burnFeeBips Burn fee in basis points (e.g., 300 = 3%)
     */
    function setRentalFees(
        uint256 _miningFeeBips,
        uint256 _burnFeeBips
    ) external onlyOwner {
        // Total fee cannot exceed 30%
        if (_miningFeeBips + _burnFeeBips > MAX_TOTAL_FEE_BIPS) {
            revert InvalidFeeBips();
        }

        rentalMiningFeeBips = _miningFeeBips;
        rentalBurnFeeBips = _burnFeeBips;

        emit FeesUpdated(_miningFeeBips, _burnFeeBips);
    }

    /**
     * @notice Emergency NFT recovery (only if not actively rented)
     * @param _tokenId Token to recover
     * @param _to Recipient address
     */
    function emergencyRecoverNFT(uint256 _tokenId, address _to) external onlyOwner {
        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        delete listings[_tokenId];
        delete activeRentals[_tokenId];
        delete promotionFees[_tokenId];
        _removeFromListedArray(_tokenId);

        nftContract.safeTransferFrom(address(this), _to, _tokenId);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns listing details
     * @param _tokenId Token ID to query
     */
    function getListing(uint256 _tokenId) external view returns (Listing memory) {
        return listings[_tokenId];
    }

    /**
     * @notice Returns active rental details
     * @param _tokenId Token ID to query
     */
    function getRental(uint256 _tokenId) external view returns (Rental memory) {
        return activeRentals[_tokenId];
    }

    /**
     * @notice Checks if NFT is currently rented
     * @param _tokenId Token ID to check
     * @return True if rental is active
     */
    function isRented(uint256 _tokenId) external view returns (bool) {
        return activeRentals[_tokenId].endTime > block.timestamp;
    }

    /**
     * @notice Returns remaining rental time
     * @param _tokenId Token ID
     * @return Seconds remaining (0 if not rented)
     */
    function getRemainingRentalTime(uint256 _tokenId) external view returns (uint256) {
        uint256 endTime = activeRentals[_tokenId].endTime;
        if (endTime <= block.timestamp) return 0;
        return endTime - block.timestamp;
    }

    /**
     * @notice Checks if user has active rental rights
     * @param _tokenId Token ID
     * @param _user User address
     * @return True if user is current tenant with active rental
     */
    function hasRentalRights(uint256 _tokenId, address _user) external view returns (bool) {
        Rental memory rental = activeRentals[_tokenId];
        return rental.tenant == _user && rental.endTime > block.timestamp;
    }

    /**
     * @notice Returns all listed token IDs
     * @return Array of token IDs
     */
    function getAllListedTokenIds() external view returns (uint256[] memory) {
        return listedTokenIds;
    }

    /**
     * @notice Returns number of active listings
     * @return Count of listings
     */
    function getListingCount() external view returns (uint256) {
        return listedTokenIds.length;
    }

    /**
     * @notice Returns rental cost breakdown for specified duration
     * @param _tokenId Token ID
     * @param _hours Number of hours
     * @return totalCost Total cost
     * @return miningFee Fee to MiningManager
     * @return burnFee Fee to be burned
     * @return ownerPayout Owner receives
     */
    function getRentalCost(uint256 _tokenId, uint256 _hours) external view returns (
        uint256 totalCost,
        uint256 miningFee,
        uint256 burnFee,
        uint256 ownerPayout
    ) {
        Listing memory listing = listings[_tokenId];
        totalCost = listing.pricePerHour * _hours;
        miningFee = (totalCost * rentalMiningFeeBips) / BIPS_DENOMINATOR;
        burnFee = (totalCost * rentalBurnFeeBips) / BIPS_DENOMINATOR;
        ownerPayout = totalCost - miningFee - burnFee;
    }

    /**
     * @notice Returns marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 activeListings,
        uint256 totalVol,
        uint256 totalMiningFees,
        uint256 totalBurned,
        uint256 rentals
    ) {
        return (
            listedTokenIds.length,
            totalVolume,
            totalFeesCollected,
            totalBurnedAllTime,
            totalRentals
        );
    }

    /**
     * @notice V2: Returns promotion statistics
     */
    function getPromotionStats() external view returns (
        uint256 totalPromotionFees,
        address treasuryAddress
    ) {
        return (totalPromotionFeesCollected, treasury);
    }

    /**
     * @notice V2: Returns current fee configuration
     * @return miningFeeBips Mining fee in bips
     * @return burnFeeBips Burn fee in bips
     * @return totalFeeBips Total fee in bips
     */
    function getFeeConfig() external view returns (
        uint256 miningFeeBips,
        uint256 burnFeeBips,
        uint256 totalFeeBips
    ) {
        return (
            rentalMiningFeeBips,
            rentalBurnFeeBips,
            rentalMiningFeeBips + rentalBurnFeeBips
        );
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Adds token to listed array (O(1))
     */
    function _addToListedArray(uint256 _tokenId) internal {
        _tokenIndex[_tokenId] = listedTokenIds.length;
        listedTokenIds.push(_tokenId);
    }

    /**
     * @dev Removes token from listed array (O(1) swap-and-pop)
     */
    function _removeFromListedArray(uint256 _tokenId) internal {
        uint256 index = _tokenIndex[_tokenId];
        uint256 lastIndex = listedTokenIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = listedTokenIds[lastIndex];
            listedTokenIds[index] = lastTokenId;
            _tokenIndex[lastTokenId] = index;
        }

        listedTokenIds.pop();
        delete _tokenIndex[_tokenId];
    }
}
