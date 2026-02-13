// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// RENTAL MANAGER V2 — IMMUTABLE (Tier 1: ETH only)
// ============================================================================
//
// NFT rental marketplace for RewardBooster NFTs.
// Rent an NFT to reduce burn rate on staking reward claims.
//
// V2 Changes:
//   - Fixed 1-day rental (24 hours). No variable duration.
//   - Daily pricing (pricePerDay instead of pricePerHour)
//   - Passive income: list once, auto re-list after rental expires (no withdraw needed)
//   - Boost feature: owners pay ETH/day for listing visibility (like Agora profile boost)
//   - Rented NFTs hidden from marketplace (isAvailable view returns false)
//   - Owner can delist ONLY when not currently rented
//
// Flow:
//   1. Owner lists NFT with pricePerDay → NFT escrowed
//   2. Tenant rents for 1 day → pays ETH (rental to owner + fee to ecosystem)
//   3. Rental expires after 24h → NFT auto-available for next rental
//   4. Owner claims accumulated ETH earnings anytime
//   5. Owner boosts listing for visibility (optional, pays ETH/day)
//   6. Owner delists (withdraws NFT) only when not rented
//
// Implements IRewardBooster so StakingPool can query rented boost.
// One active rental per user (best tier wins — rent wisely).
//
// No admin. No pause. Fully immutable and permissionless.
//
// ============================================================================

/// @dev Minimal ERC721 interface for RewardBooster
interface IERC721Rental {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @dev RewardBooster tier query
interface IBoosterQuery {
    function tokenTier(uint256 tokenId) external view returns (uint8);
}

contract RentalManager is IRewardBooster {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID     = keccak256("RENTAL");
    bytes32 public constant ACTION_RENT   = keccak256("RENTAL_RENT");
    bytes32 public constant ACTION_BOOST  = keccak256("RENTAL_BOOST");

    uint256 public constant RENTAL_DURATION = 1 days;  // Fixed 24-hour rental

    uint256 private constant BOOST_BRONZE  = 1000;
    uint256 private constant BOOST_SILVER  = 2500;
    uint256 private constant BOOST_GOLD    = 4000;
    uint256 private constant BOOST_DIAMOND = 5000;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    address             public immutable rewardBooster;

    // ════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Listing — 2 storage slots
    struct Listing {
        // Slot 1 (28 bytes)
        address owner;          // 20 bytes
        uint32  rentalCount;    // 4 bytes
        uint32  boostExpiry;    // 4 bytes — unix timestamp (boost visibility end)
        // Slot 2 (24 bytes)
        uint96  pricePerDay;    // 12 bytes — ETH per day (wei)
        uint96  totalEarnings;  // 12 bytes — lifetime ETH earned
    }

    /// @dev Active rental — 1 storage slot (26 bytes)
    struct Rental {
        address tenant;   // 20 bytes
        uint48  endTime;  // 6 bytes
    }

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Rental)  public activeRentals;

    /// @dev Pull pattern: accumulated ETH for each owner
    mapping(address => uint256) public pendingEarnings;

    /// @dev One active rental per user → O(1) boost check
    mapping(address => uint256) public userActiveRental;

    // Listed token tracking (swap-and-pop)
    uint256[] internal _listedTokens;
    mapping(uint256 => uint256) internal _listedIdx;

    // Stats
    uint256 public totalVolume;
    uint256 public totalRentals;
    uint256 public totalEthFees;
    uint256 public totalEarningsWithdrawn;
    uint256 public totalBoostRevenue;

    // Reentrancy guard
    uint8 private _locked;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event NFTListed(
        uint256 indexed tokenId, address indexed owner,
        uint96 pricePerDay
    );

    event ListingUpdated(
        uint256 indexed tokenId, uint96 pricePerDay
    );

    event NFTWithdrawn(
        uint256 indexed tokenId, address indexed owner
    );

    event NFTRented(
        uint256 indexed tokenId, address indexed tenant,
        address indexed owner,
        uint256 rentalCost, uint256 ethFee,
        uint48 endTime, address operator
    );

    event ListingBoosted(
        uint256 indexed tokenId, address indexed owner,
        uint256 days_, uint256 boostCost,
        uint32 newBoostExpiry
    );

    event EarningsWithdrawn(
        address indexed owner, uint256 amount
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotListingOwner();
    error NFTNotListed();
    error AlreadyListed();
    error RentalStillActive();
    error UserAlreadyRenting();
    error ZeroPrice();
    error ZeroDays();
    error InsufficientPayment();
    error NothingToWithdraw();
    error TransferFailed();
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

    constructor(address _ecosystem, address _rewardBooster) {
        ecosystem     = IBackchainEcosystem(_ecosystem);
        rewardBooster = _rewardBooster;
    }

    // ════════════════════════════════════════════════════════════════════════
    // LIST NFT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice List an NFT for rent. NFT is escrowed. Fixed 1-day rentals.
    ///         List once → passive income (auto re-lists after each rental).
    ///         Must approve this contract for the NFT first.
    ///
    /// @param tokenId    NFT to list
    /// @param pricePerDay ETH rental price per day (wei)
    function listNFT(
        uint256 tokenId,
        uint96  pricePerDay
    ) external nonReentrant {
        if (pricePerDay == 0) revert ZeroPrice();
        if (listings[tokenId].owner != address(0)) revert AlreadyListed();

        // Escrow NFT
        IERC721Rental(rewardBooster).transferFrom(
            msg.sender, address(this), tokenId
        );

        listings[tokenId] = Listing({
            owner: msg.sender,
            rentalCount: 0,
            boostExpiry: 0,
            pricePerDay: pricePerDay,
            totalEarnings: 0
        });

        _addListed(tokenId);

        emit NFTListed(tokenId, msg.sender, pricePerDay);
    }

    /// @notice Update listing price. Only when not currently rented.
    function updateListing(
        uint256 tokenId,
        uint96  pricePerDay
    ) external {
        Listing storage l = listings[tokenId];
        if (l.owner != msg.sender) revert NotListingOwner();
        if (pricePerDay == 0) revert ZeroPrice();

        l.pricePerDay = pricePerDay;

        emit ListingUpdated(tokenId, pricePerDay);
    }

    /// @notice Withdraw NFT from escrow. Only if not currently rented.
    function withdrawNFT(uint256 tokenId) external nonReentrant {
        Listing storage l = listings[tokenId];
        if (l.owner != msg.sender) revert NotListingOwner();

        if (activeRentals[tokenId].endTime > block.timestamp)
            revert RentalStillActive();

        address owner = l.owner;

        delete listings[tokenId];
        delete activeRentals[tokenId];
        _removeListed(tokenId);

        IERC721Rental(rewardBooster).transferFrom(
            address(this), owner, tokenId
        );

        emit NFTWithdrawn(tokenId, owner);
    }

    // ════════════════════════════════════════════════════════════════════════
    // RENT NFT (fixed 1-day)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Rent an NFT for 1 day (24 hours).
    ///         msg.value must cover rentalCost + ecosystem ETH fee.
    ///         One active rental per user at a time.
    ///
    /// @param tokenId  NFT to rent
    /// @param operator Frontend operator earning commission
    function rentNFT(
        uint256 tokenId,
        address operator
    ) external payable nonReentrant {
        Listing storage l = listings[tokenId];
        if (l.owner == address(0)) revert NFTNotListed();

        // NFT must not be currently rented
        if (activeRentals[tokenId].endTime > block.timestamp)
            revert RentalStillActive();

        // One rental per user — check if previous expired
        uint256 prevToken = userActiveRental[msg.sender];
        if (prevToken != 0 &&
            activeRentals[prevToken].tenant == msg.sender &&
            activeRentals[prevToken].endTime > block.timestamp)
        {
            revert UserAlreadyRenting();
        }

        // Calculate costs
        uint256 rentalCost = uint256(l.pricePerDay);
        uint256 ethFee     = ecosystem.calculateFee(ACTION_RENT, rentalCost);
        uint256 required   = rentalCost + ethFee;
        if (msg.value < required) revert InsufficientPayment();

        uint48 endTime = uint48(block.timestamp + RENTAL_DURATION);

        // Effects
        activeRentals[tokenId] = Rental({
            tenant: msg.sender,
            endTime: endTime
        });

        userActiveRental[msg.sender] = tokenId;

        pendingEarnings[l.owner] += rentalCost;
        l.totalEarnings += uint96(rentalCost);
        l.rentalCount++;

        totalVolume  += rentalCost;
        totalEthFees += ethFee;
        totalRentals++;

        // Fee to ecosystem
        if (ethFee > 0) {
            ecosystem.collectFee{value: ethFee}(
                msg.sender, operator, l.owner, MODULE_ID, 0
            );
        }

        emit NFTRented(
            tokenId, msg.sender, l.owner,
            rentalCost, ethFee, endTime, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // BOOST LISTING (pay for visibility)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost a listing's visibility for X days. Pays ETH fee.
    ///         Similar to Agora profile boost. Stacks with existing boost.
    ///
    /// @param tokenId NFT listing to boost
    /// @param days_   Number of days to boost
    function boostListing(
        uint256 tokenId,
        uint256 days_
    ) external payable nonReentrant {
        Listing storage l = listings[tokenId];
        if (l.owner != msg.sender) revert NotListingOwner();
        if (days_ == 0) revert ZeroDays();

        // Fee = ecosystem fee per boost action × days
        uint256 feePerDay = ecosystem.calculateFee(ACTION_BOOST, 0);
        uint256 totalFee = feePerDay * days_;
        if (msg.value < totalFee) revert InsufficientPayment();

        // Extend boost: from now or from current expiry, whichever is later
        uint256 baseTime = block.timestamp;
        if (l.boostExpiry > block.timestamp) {
            baseTime = l.boostExpiry;
        }
        uint32 newExpiry = uint32(baseTime + days_ * 1 days);
        l.boostExpiry = newExpiry;

        totalBoostRevenue += msg.value;

        // ETH fee to ecosystem
        ecosystem.collectFee{value: msg.value}(
            msg.sender, address(0), address(0), MODULE_ID, 0
        );

        emit ListingBoosted(tokenId, msg.sender, days_, msg.value, newExpiry);
    }

    // ════════════════════════════════════════════════════════════════════════
    // WITHDRAW EARNINGS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim accumulated ETH earnings from all your listings.
    function withdrawEarnings() external nonReentrant {
        uint256 amount = pendingEarnings[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // Effects (CEI)
        pendingEarnings[msg.sender] = 0;
        totalEarningsWithdrawn += amount;

        // Interaction
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EarningsWithdrawn(msg.sender, amount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // IRewardBooster — RENTED BOOST
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get the user's best rented boost. O(1).
    function getUserBestBoost(address user) external view override returns (uint256) {
        uint256 tokenId = userActiveRental[user];
        if (tokenId == 0) return 0;

        Rental memory r = activeRentals[tokenId];
        if (r.tenant != user || r.endTime <= block.timestamp) return 0;

        return _tierBoost(IBoosterQuery(rewardBooster).tokenTier(tokenId));
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS — LISTINGS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Full listing details
    function getListing(uint256 tokenId) external view returns (
        address owner, uint96 pricePerDay,
        uint96 totalEarnings_, uint32 rentalCount,
        bool currentlyRented, uint48 rentalEndTime,
        bool isBoosted, uint32 boostExpiry
    ) {
        Listing memory l = listings[tokenId];
        Rental memory r = activeRentals[tokenId];
        bool rented = r.endTime > block.timestamp;

        return (
            l.owner, l.pricePerDay,
            l.totalEarnings, l.rentalCount,
            rented, r.endTime,
            l.boostExpiry > block.timestamp, l.boostExpiry
        );
    }

    /// @notice Check if NFT is available for rent (listed and not currently rented)
    function isAvailable(uint256 tokenId) external view returns (bool) {
        Listing memory l = listings[tokenId];
        if (l.owner == address(0)) return false;
        return activeRentals[tokenId].endTime <= block.timestamp;
    }

    /// @notice Current rental details
    function getRental(uint256 tokenId) external view returns (
        address tenant, uint48 endTime, bool isActive
    ) {
        Rental memory r = activeRentals[tokenId];
        bool active = r.endTime > block.timestamp;
        return (r.tenant, r.endTime, active);
    }

    /// @notice Check if NFT is currently rented
    function isRented(uint256 tokenId) external view returns (bool) {
        return activeRentals[tokenId].endTime > block.timestamp;
    }

    /// @notice Remaining rental time in seconds (0 if expired)
    function getRemainingTime(uint256 tokenId) external view returns (uint256) {
        uint48 end = activeRentals[tokenId].endTime;
        if (end <= block.timestamp) return 0;
        return end - block.timestamp;
    }

    /// @notice Check if user has an active rental
    function hasActiveRental(address user) external view returns (bool) {
        uint256 tokenId = userActiveRental[user];
        if (tokenId == 0) return false;
        Rental memory r = activeRentals[tokenId];
        return r.tenant == user && r.endTime > block.timestamp;
    }

    /// @notice Preview rental cost: rentalETH + ecosystemFee
    function getRentalCost(uint256 tokenId) external view returns (
        uint256 rentalCost, uint256 ethFee, uint256 totalCost
    ) {
        Listing memory l = listings[tokenId];
        rentalCost = uint256(l.pricePerDay);
        ethFee     = ecosystem.calculateFee(ACTION_RENT, rentalCost);
        totalCost  = rentalCost + ethFee;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS — MARKETPLACE DATA
    // ════════════════════════════════════════════════════════════════════════

    /// @notice All listed token IDs
    function getAllListedTokenIds() external view returns (uint256[] memory) {
        return _listedTokens;
    }

    /// @notice Total number of active listings
    function getListingCount() external view returns (uint256) {
        return _listedTokens.length;
    }

    /// @notice Get available (not rented) listings, with boosted first
    function getAvailableListings() external view returns (
        uint256[] memory tokenIds,
        bool[] memory boosted
    ) {
        uint256 len = _listedTokens.length;
        uint256 count;

        // Count available
        for (uint256 i; i < len;) {
            if (activeRentals[_listedTokens[i]].endTime <= block.timestamp) {
                count++;
            }
            unchecked { ++i; }
        }

        tokenIds = new uint256[](count);
        boosted = new bool[](count);
        uint256 idx;

        for (uint256 i; i < len;) {
            uint256 tid = _listedTokens[i];
            if (activeRentals[tid].endTime <= block.timestamp) {
                tokenIds[idx] = tid;
                boosted[idx] = listings[tid].boostExpiry > block.timestamp;
                idx++;
            }
            unchecked { ++i; }
        }
    }

    /// @notice Marketplace statistics
    function getStats() external view returns (
        uint256 activeListings,
        uint256 volume,
        uint256 rentals,
        uint256 ethFees,
        uint256 earningsWithdrawn,
        uint256 boostRevenue
    ) {
        return (
            _listedTokens.length,
            totalVolume,
            totalRentals,
            totalEthFees,
            totalEarningsWithdrawn,
            totalBoostRevenue
        );
    }

    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BOOST MAPPING
    // ════════════════════════════════════════════════════════════════════════

    function _tierBoost(uint8 t) internal pure returns (uint256) {
        if (t == 0) return BOOST_BRONZE;
        if (t == 1) return BOOST_SILVER;
        if (t == 2) return BOOST_GOLD;
        if (t == 3) return BOOST_DIAMOND;
        return 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — LISTED TOKEN TRACKING (swap-and-pop)
    // ════════════════════════════════════════════════════════════════════════

    function _addListed(uint256 tokenId) internal {
        _listedIdx[tokenId] = _listedTokens.length;
        _listedTokens.push(tokenId);
    }

    function _removeListed(uint256 tokenId) internal {
        uint256 idx     = _listedIdx[tokenId];
        uint256 lastIdx = _listedTokens.length - 1;
        if (idx != lastIdx) {
            uint256 lastId = _listedTokens[lastIdx];
            _listedTokens[idx] = lastId;
            _listedIdx[lastId] = idx;
        }
        _listedTokens.pop();
        delete _listedIdx[tokenId];
    }
}
