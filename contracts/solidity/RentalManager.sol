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
 *  Contract    : RentalManager
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
 *  PURPOSE (V6)
 *
 *  AirBNFT Protocol - NFT rental marketplace for RewardBoosterNFT.
 *  Rent NFTs to REDUCE BURN RATE when claiming rewards from DelegationManager.
 *
 *  WHY RENT AN NFT?
 *  +--------------------------------------------------------------------+
 *  |  Without NFT: 50% of rewards are BURNED on claim                   |
 *  |  With Bronze: 40% burned (user keeps 60%)                          |
 *  |  With Silver: 25% burned (user keeps 75%)                          |
 *  |  With Gold:   10% burned (user keeps 90%)                          |
 *  |  With Diamond: 0% burned (user keeps 100%)                         |
 *  +--------------------------------------------------------------------+
 *
 *  RENTAL FLOW:
 *  +--------------------------------------------------------------------+
 *  |  1. Owner lists NFT -> NFT transferred to escrow                   |
 *  |  2. Owner spotlights listing (optional) -> Pay ETH                 |
 *  |  3. Tenant rents NFT -> Payment distributed:                       |
 *  |     - Rental fee -> MiningManager (operator + burn + treasury)     |
 *  |     - Net amount -> Owner payout                                   |
 *  |  4. Tenant claims rewards in DelegationManager with reduced burn   |
 *  |  5. Rental expires -> NFT available for next rental                |
 *  |  6. Owner withdraws -> NFT returned (if not rented)                |
 *  +--------------------------------------------------------------------+
 *
 *  IMPORTANT: Rental fees are the SAME for everyone. NFT ownership does
 *             NOT provide discounts on rental fees.
 *
 * ============================================================================
 *
 *  FEE STRUCTURE (configurable by governance)
 *
 *  +-------------+------------------+----------------------------------------+
 *  | Action      | Default Fee      | Destination                            |
 *  +-------------+------------------+----------------------------------------+
 *  | Rent NFT    | 10% of rental    | MiningManager                          |
 *  | Spotlight   | ETH payment      | MiningManager                          |
 *  +-------------+------------------+----------------------------------------+
 *
 * ============================================================================
 *
 *  FEE DISTRIBUTION
 *
 *  BKC Flow (Rental Fee):
 *  +------------------------------------------------------------------+
 *  |                      BKC FEE COLLECTED                           |
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
 *  ETH Flow (Spotlight):
 *  +------------------------------------------------------------------+
 *  |                      ETH FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |           +-----------------+-----------------+                  |
 *  |           |                                   |                  |
 *  |           v                                   v                  |
 *  |       OPERATOR                            TREASURY               |
 *  |       (config%)                           (remaining)            |
 *  +------------------------------------------------------------------+
 *
 * ============================================================================
 *
 *  SPOTLIGHT SYSTEM
 *
 *  - Owner pays ETH to boost listing visibility
 *  - Spotlight value decays 1% per day (linear)
 *  - After 100 days, effective spotlight = 0
 *  - Frontend sorts by getEffectiveSpotlight() for visibility
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

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
import "./TimelockUpgradeable.sol";

interface IMiningManagerV3 {
    function performPurchaseMiningWithOperator(
        bytes32 serviceKey,
        uint256 purchaseAmount,
        address operator
    ) external payable;
}

contract RentalManager is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC721HolderUpgradeable,
    UUPSUpgradeable,
    TimelockUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for BKCToken;

    // ========================================================================
    //                               STRUCTS
    // ========================================================================

    struct Listing {
        address owner;
        uint256 pricePerHour;
        uint256 minHours;
        uint256 maxHours;
        bool isActive;
        uint256 totalEarnings;
        uint256 rentalCount;
    }

    struct Rental {
        address tenant;
        uint256 startTime;
        uint256 endTime;
        uint256 paidAmount;
    }

    struct SpotlightInfo {
        uint256 totalAmount;
        uint256 lastSpotlightTime;
    }

    // ========================================================================
    //                              CONSTANTS
    // ========================================================================

    uint256 private constant BIPS_DENOMINATOR = 10_000;

    bytes32 public constant SERVICE_KEY = keccak256("RENTAL_MARKET_TAX_BIPS");

    uint256 public constant DEFAULT_DURATION = 1 hours;

    uint256 public constant MAX_RENTAL_FEE_BIPS = 3000;

    uint256 public constant MAX_SPOTLIGHT_DAYS = 100;

    // ========================================================================
    //                              STATE (V1)
    // ========================================================================

    IEcosystemManager public ecosystemManager;

    BKCToken public bkcToken;

    IERC721Upgradeable public nftContract;

    mapping(uint256 => Listing) public listings;

    mapping(uint256 => Rental) public activeRentals;

    uint256[] public listedTokenIds;

    mapping(uint256 => uint256) private _tokenIndex;

    uint256 public totalFeesCollected;

    uint256 public totalVolume;

    uint256 public totalRentals;

    bool public paused;

    uint256 public globalRentalDuration;

    // ========================================================================
    //                              STATE (V2 - Legacy)
    // ========================================================================

    mapping(uint256 => uint256) public promotionFees;

    address public treasury;

    uint256 public totalPromotionFeesCollected;

    uint256 public rentalMiningFeeBips;

    uint256 public rentalBurnFeeBips;

    uint256 public totalBurnedAllTime;

    // ========================================================================
    //                              STATE (V3.1 - Spotlight)
    // ========================================================================

    mapping(uint256 => SpotlightInfo) public listingSpotlight;

    uint256 public totalSpotlightCollected;

    uint256[] internal _spotlightedTokenIds;

    mapping(uint256 => uint256) internal _spotlightedIndex;

    mapping(uint256 => bool) internal _isSpotlighted;

    uint256 public spotlightDecayPerDayBips;

    uint256 public minSpotlightAmount;

    uint256 public rentalFeeBips;

    // ========================================================================
    //                              STATE (V4 - Operators)
    // ========================================================================

    uint256 public totalETHCollected;

    uint256 public totalBKCFees;

    // ========================================================================
    //                           STORAGE GAP
    // ========================================================================

    uint256[40] private __gap;

    // ========================================================================
    //                               EVENTS
    // ========================================================================

    event NFTListed(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 pricePerHour,
        uint256 minHours,
        uint256 maxHours
    );

    event ListingUpdated(
        uint256 indexed tokenId,
        uint256 newPricePerHour,
        uint256 newMinHours,
        uint256 newMaxHours
    );

    event NFTWithdrawn(
        uint256 indexed tokenId,
        address indexed owner
    );

    event NFTRented(
        uint256 indexed tokenId,
        address indexed tenant,
        address indexed owner,
        uint256 hours_,
        uint256 totalCost,
        uint256 protocolFee,
        uint256 ownerPayout,
        uint256 endTime,
        address operator
    );

    event RentalExpired(
        uint256 indexed tokenId,
        address indexed tenant
    );

    event MarketplacePaused(bool isPaused);

    event ListingSpotlighted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp,
        address operator
    );

    event RentalFeeUpdated(
        uint256 feeBips,
        uint256 timestamp
    );

    event SpotlightConfigUpdated(
        uint256 decayPerDayBips,
        uint256 minAmount,
        uint256 timestamp
    );

    event TreasuryUpdated(
        address oldTreasury,
        address newTreasury
    );

    // ========================================================================
    //                               ERRORS
    // ========================================================================

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
    error SpotlightAmountTooLow();
    error TransferFailed();

    // ========================================================================
    //                            INITIALIZATION
    // ========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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

        treasury = msg.sender;

        rentalFeeBips = 1000;
        spotlightDecayPerDayBips = 100;
        minSpotlightAmount = 0.0001 ether;
    }

    function initializeV4(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(address(0), _treasury);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    // ========================================================================
    //                         SPOTLIGHT FUNCTIONS
    // ========================================================================

    /**
     * @notice Spotlight a listing for more visibility (paid in ETH)
     * @dev ETH goes to MiningManager with operator info
     * @param _tokenId Token ID to spotlight
     * @param _operator Address of the frontend operator
     */
    function spotlightListing(
        uint256 _tokenId,
        address _operator
    ) external payable nonReentrant {
        if (paused) revert MarketplaceIsPaused();
        if (msg.value == 0) revert ZeroAmount();
        if (msg.value < minSpotlightAmount) revert SpotlightAmountTooLow();

        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();

        SpotlightInfo storage spotlight = listingSpotlight[_tokenId];

        if (!_isSpotlighted[_tokenId]) {
            _isSpotlighted[_tokenId] = true;
            _spotlightedIndex[_tokenId] = _spotlightedTokenIds.length;
            _spotlightedTokenIds.push(_tokenId);
        }

        spotlight.totalAmount += msg.value;
        spotlight.lastSpotlightTime = block.timestamp;

        unchecked {
            totalSpotlightCollected += msg.value;
            totalETHCollected += msg.value;
        }

        // Send ETH to MiningManager with operator info
        _sendETHToMining(msg.value, _operator);

        emit ListingSpotlighted(
            _tokenId,
            msg.sender,
            msg.value,
            spotlight.totalAmount,
            block.timestamp,
            _operator
        );
    }

    function getEffectiveSpotlight(uint256 _tokenId) public view returns (
        uint256 effectiveAmount,
        uint256 daysPassed
    ) {
        SpotlightInfo memory spotlight = listingSpotlight[_tokenId];
        if (spotlight.totalAmount == 0) return (0, 0);

        daysPassed = (block.timestamp - spotlight.lastSpotlightTime) / 1 days;

        if (daysPassed >= MAX_SPOTLIGHT_DAYS) return (0, daysPassed);

        uint256 decayPercent = (spotlightDecayPerDayBips * daysPassed) / 100;
        if (decayPercent >= 100) return (0, daysPassed);

        uint256 remainingPercent = 100 - decayPercent;
        effectiveAmount = (spotlight.totalAmount * remainingPercent) / 100;

        return (effectiveAmount, daysPassed);
    }

    function getSpotlightedListingsPaginated(
        uint256 _offset,
        uint256 _limit
    ) external view returns (
        uint256[] memory tokenIds,
        uint256[] memory effectiveSpotlights,
        uint256 total
    ) {
        total = _spotlightedTokenIds.length;

        if (_offset >= total) {
            return (new uint256[](0), new uint256[](0), total);
        }

        uint256 remaining = total - _offset;
        uint256 size = remaining < _limit ? remaining : _limit;

        tokenIds = new uint256[](size);
        effectiveSpotlights = new uint256[](size);

        for (uint256 i; i < size;) {
            uint256 tokenId = _spotlightedTokenIds[_offset + i];
            tokenIds[i] = tokenId;
            (effectiveSpotlights[i], ) = getEffectiveSpotlight(tokenId);
            unchecked { ++i; }
        }
    }

    // ========================================================================
    //                          LISTING FUNCTIONS
    // ========================================================================

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

    function withdrawNFT(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();
        if (listing.owner != msg.sender) revert NotListingOwner();

        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        address owner = listing.owner;
        delete listings[_tokenId];
        delete activeRentals[_tokenId];
        delete listingSpotlight[_tokenId];

        if (_isSpotlighted[_tokenId]) {
            _removeFromSpotlightedArray(_tokenId);
        }

        _removeFromListedArray(_tokenId);

        nftContract.safeTransferFrom(address(this), owner, _tokenId);

        emit NFTWithdrawn(_tokenId, owner);
    }

    // ========================================================================
    //                          RENTAL FUNCTIONS
    // ========================================================================

    /**
     * @notice Rents an NFT for specified hours
     * @param _tokenId Token ID to rent
     * @param _hours Duration in hours
     * @param _operator Address of the frontend operator
     */
    function rentNFT(
        uint256 _tokenId,
        uint256 _hours,
        address _operator
    ) external nonReentrant {
        if (paused) revert MarketplaceIsPaused();

        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();

        if (_hours < listing.minHours || _hours > listing.maxHours) {
            revert InvalidHoursRange();
        }

        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        uint256 totalCost = listing.pricePerHour * _hours;
        uint256 protocolFee;
        uint256 ownerPayout;

        unchecked {
            protocolFee = (totalCost * rentalFeeBips) / BIPS_DENOMINATOR;
            ownerPayout = totalCost - protocolFee;
        }

        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        if (protocolFee > 0) {
            _sendToMining(protocolFee, _operator);
        }

        if (ownerPayout > 0) {
            bkcToken.safeTransfer(listing.owner, ownerPayout);
        }

        uint256 duration = globalRentalDuration > 0
            ? globalRentalDuration
            : _hours * 1 hours;
        uint256 endTime = block.timestamp + duration;

        activeRentals[_tokenId] = Rental({
            tenant: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            paidAmount: totalCost
        });

        unchecked {
            listing.totalEarnings += ownerPayout;
            listing.rentalCount++;
            totalFeesCollected += protocolFee;
            totalVolume += totalCost;
            totalRentals++;
            totalBKCFees += protocolFee;
        }

        emit NFTRented(
            _tokenId,
            msg.sender,
            listing.owner,
            _hours,
            totalCost,
            protocolFee,
            ownerPayout,
            endTime,
            _operator
        );
    }

    /**
     * @notice Simple 1-hour rental
     * @param _tokenId NFT token ID to rent
     * @param _operator Address of the frontend operator
     */
    function rentNFTSimple(
        uint256 _tokenId,
        address _operator
    ) external nonReentrant {
        if (paused) revert MarketplaceIsPaused();

        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NFTNotListed();

        // Enforce listing's minHours constraint (renting for 1 hour)
        if (listing.minHours > 1) revert InvalidHoursRange();

        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        uint256 totalCost = listing.pricePerHour;
        uint256 protocolFee;
        uint256 ownerPayout;

        unchecked {
            protocolFee = (totalCost * rentalFeeBips) / BIPS_DENOMINATOR;
            ownerPayout = totalCost - protocolFee;
        }

        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        if (protocolFee > 0) {
            _sendToMining(protocolFee, _operator);
        }

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

        unchecked {
            listing.totalEarnings += ownerPayout;
            listing.rentalCount++;
            totalFeesCollected += protocolFee;
            totalVolume += totalCost;
            totalRentals++;
            totalBKCFees += protocolFee;
        }

        emit NFTRented(
            _tokenId,
            msg.sender,
            listing.owner,
            1,
            totalCost,
            protocolFee,
            ownerPayout,
            endTime,
            _operator
        );
    }

    // ========================================================================
    //                         ADMIN FUNCTIONS
    // ========================================================================

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit MarketplacePaused(_paused);
    }

    function setGlobalRentalDuration(uint256 _duration) external onlyOwner {
        globalRentalDuration = _duration;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    function setRentalFee(uint256 _rentalFeeBips) external onlyOwner {
        if (_rentalFeeBips > MAX_RENTAL_FEE_BIPS) revert InvalidFeeBips();
        rentalFeeBips = _rentalFeeBips;
        emit RentalFeeUpdated(_rentalFeeBips, block.timestamp);
    }

    function setSpotlightConfig(
        uint256 _decayPerDayBips,
        uint256 _minSpotlightAmount
    ) external onlyOwner {
        if (_decayPerDayBips > BIPS_DENOMINATOR) revert InvalidFeeBips();
        spotlightDecayPerDayBips = _decayPerDayBips;
        minSpotlightAmount = _minSpotlightAmount;
        emit SpotlightConfigUpdated(_decayPerDayBips, _minSpotlightAmount, block.timestamp);
    }

    function emergencyRecoverNFT(uint256 _tokenId, address _to) external onlyOwner {
        if (activeRentals[_tokenId].endTime > block.timestamp) {
            revert RentalStillActive();
        }

        delete listings[_tokenId];
        delete activeRentals[_tokenId];
        delete listingSpotlight[_tokenId];

        if (_isSpotlighted[_tokenId]) {
            _removeFromSpotlightedArray(_tokenId);
        }

        _removeFromListedArray(_tokenId);

        nftContract.safeTransferFrom(address(this), _to, _tokenId);
    }

    function recoverTokens(address _token, address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        if (_token == address(0)) {
            (bool success, ) = _to.call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20Upgradeable(_token).safeTransfer(_to, _amount);
        }
    }

    // ========================================================================
    //                          VIEW FUNCTIONS
    // ========================================================================

    function getListing(uint256 _tokenId) external view returns (Listing memory) {
        return listings[_tokenId];
    }

    function getRental(uint256 _tokenId) external view returns (Rental memory) {
        return activeRentals[_tokenId];
    }

    function isRented(uint256 _tokenId) external view returns (bool) {
        return activeRentals[_tokenId].endTime > block.timestamp;
    }

    function getRemainingRentalTime(uint256 _tokenId) external view returns (uint256) {
        uint256 endTime = activeRentals[_tokenId].endTime;
        if (endTime <= block.timestamp) return 0;
        return endTime - block.timestamp;
    }

    function hasRentalRights(uint256 _tokenId, address _user) external view returns (bool) {
        Rental memory rental = activeRentals[_tokenId];
        return rental.tenant == _user && rental.endTime > block.timestamp;
    }

    function getAllListedTokenIds() external view returns (uint256[] memory) {
        return listedTokenIds;
    }

    function getListingCount() external view returns (uint256) {
        return listedTokenIds.length;
    }

    function getRentalCost(uint256 _tokenId, uint256 _hours) external view returns (
        uint256 totalCost,
        uint256 protocolFee,
        uint256 ownerPayout
    ) {
        Listing memory listing = listings[_tokenId];
        totalCost = listing.pricePerHour * _hours;
        unchecked {
            protocolFee = (totalCost * rentalFeeBips) / BIPS_DENOMINATOR;
            ownerPayout = totalCost - protocolFee;
        }
    }

    function getMarketplaceStats() external view returns (
        uint256 activeListings,
        uint256 totalVol,
        uint256 totalFees,
        uint256 rentals,
        uint256 spotlightTotal,
        uint256 ethCollected,
        uint256 bkcFees
    ) {
        return (
            listedTokenIds.length,
            totalVolume,
            totalFeesCollected,
            totalRentals,
            totalSpotlightCollected,
            totalETHCollected,
            totalBKCFees
        );
    }

    function getSpotlightConfig() external view returns (
        uint256 decayPerDayBips,
        uint256 minAmount,
        uint256 maxDays,
        uint256 totalSpotlightedListings,
        uint256 totalCollected
    ) {
        return (
            spotlightDecayPerDayBips,
            minSpotlightAmount,
            MAX_SPOTLIGHT_DAYS,
            _spotlightedTokenIds.length,
            totalSpotlightCollected
        );
    }

    function getFeeConfig() external view returns (
        uint256 miningFeeBips,
        uint256 burnFeeBips,
        uint256 totalFeeBips
    ) {
        if (rentalMiningFeeBips > 0 || rentalBurnFeeBips > 0) {
            return (rentalMiningFeeBips, rentalBurnFeeBips, rentalMiningFeeBips + rentalBurnFeeBips);
        }
        return (rentalFeeBips, 0, rentalFeeBips);
    }

    // ========================================================================
    //                     BACKCHAT INTEGRATION
    // ========================================================================

    function hasActiveRental(address _user) external view returns (bool) {
        uint256 length = listedTokenIds.length;

        for (uint256 i; i < length;) {
            uint256 tokenId = listedTokenIds[i];
            Rental storage rental = activeRentals[tokenId];

            if (rental.tenant == _user && rental.endTime > block.timestamp) {
                return true;
            }

            unchecked { ++i; }
        }

        return false;
    }

    function getUserActiveRentals(address _user) external view returns (
        uint256[] memory tokenIds,
        uint256[] memory endTimes
    ) {
        uint256 length = listedTokenIds.length;
        uint256 count;

        for (uint256 i; i < length;) {
            uint256 tokenId = listedTokenIds[i];
            Rental storage rental = activeRentals[tokenId];
            if (rental.tenant == _user && rental.endTime > block.timestamp) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }

        tokenIds = new uint256[](count);
        endTimes = new uint256[](count);

        uint256 index;
        for (uint256 i; i < length && index < count;) {
            uint256 tokenId = listedTokenIds[i];
            Rental storage rental = activeRentals[tokenId];
            if (rental.tenant == _user && rental.endTime > block.timestamp) {
                tokenIds[index] = tokenId;
                endTimes[index] = rental.endTime;
                unchecked { ++index; }
            }
            unchecked { ++i; }
        }
    }

    // ========================================================================
    //                         INTERNAL FUNCTIONS
    // ========================================================================

    function _sendToMining(uint256 _amount, address _operator) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager != address(0) && _amount > 0) {
            bkcToken.safeTransfer(miningManager, _amount);

            try IMiningManagerV3(miningManager).performPurchaseMiningWithOperator(
                SERVICE_KEY,
                _amount,
                _operator
            ) {} catch {}
        }
    }

    function _sendETHToMining(uint256 _amount, address _operator) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager != address(0) && _amount > 0) {
            try IMiningManagerV3(miningManager).performPurchaseMiningWithOperator{value: _amount}(
                SERVICE_KEY,
                0,
                _operator
            ) {} catch {
                // Fallback to treasury
                if (treasury != address(0)) {
                    (bool success, ) = treasury.call{value: _amount}("");
                    if (!success) revert TransferFailed();
                }
            }
        }
    }

    function _addToListedArray(uint256 _tokenId) internal {
        _tokenIndex[_tokenId] = listedTokenIds.length;
        listedTokenIds.push(_tokenId);
    }

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

    function _removeFromSpotlightedArray(uint256 _tokenId) internal {
        uint256 index = _spotlightedIndex[_tokenId];
        uint256 lastIndex = _spotlightedTokenIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = _spotlightedTokenIds[lastIndex];
            _spotlightedTokenIds[index] = lastTokenId;
            _spotlightedIndex[lastTokenId] = index;
        }

        _spotlightedTokenIds.pop();
        delete _spotlightedIndex[_tokenId];
        delete _isSpotlighted[_tokenId];
    }

    receive() external payable {}
}
