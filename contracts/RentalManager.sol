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

// Ecosystem Interfaces
import "./IInterfaces.sol";

/**
 * @title RentalManager (AirBNFT Protocol)
 * @notice A decentralized marketplace for hourly NFT rentals, fully integrated with the Backchain Economy.
 * @dev 
 * - **AirBNFT Logic**: Rentals are priced and managed on an HOURLY basis.
 * - **Ecosystem Integration**: Enforces minimum pStake requirements via DelegationManager.
 * - **Proof-of-Purchase**: Protocol fees trigger the MiningManager to mint new rewards.
 * - **Escrow**: NFTs are held securely by this contract during the listing period.
 */
contract RentalManager is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    ERC721HolderUpgradeable, 
    UUPSUpgradeable 
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // --- Structs ---

    struct Listing {
        address owner;
        uint256 pricePerHour; // Cost per 1 HOUR in Wei (BKC)
        uint256 maxDuration;  // Max duration allowed in HOURS
        bool isActive;
    }

    struct Rental {
        address tenant;
        uint256 startTime;
        uint256 endTime;
    }

    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    IERC20Upgradeable public bkcToken;
    IERC721Upgradeable public nftContract;

    // Mapping: TokenID => Listing Details
    mapping(uint256 => Listing) public listings;
    
    // Mapping: TokenID => Active Rental Details
    mapping(uint256 => Rental) public activeRentals;
    
    // Array to assist frontend indexing (Note: In production, TheGraph is recommended)
    uint256[] public listedTokenIds;

    // --- Constants & Configuration Keys ---
    
    // Key to fetch the protocol tax percentage (BIPS) from EcosystemManager (e.g., 500 = 5%)
    bytes32 public constant RENTAL_TAX_BIPS_KEY = keccak256("RENTAL_MARKET_TAX_BIPS");
    
    // Key to fetch the minimum pStake requirement to rent an NFT
    bytes32 public constant RENTAL_ACCESS_KEY = keccak256("RENTAL_MARKET_ACCESS");

    // --- Events ---

    event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 maxDurationHours);
    event NFTWithdrawn(uint256 indexed tokenId, address indexed owner);
    event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hoursRented, uint256 totalCost, uint256 feePaid);

    // --- Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error NotOwner();
    error NotListed();
    error AlreadyRented();
    error RentalActive();
    error DurationTooLong();
    error InsufficientPStake();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract and binds it to the Ecosystem.
     * @param _ecosystemManagerAddress The address of the central Hub.
     * @param _nftContract The address of the Booster NFT contract.
     */
    function initialize(address _ecosystemManagerAddress, address _nftContract) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __ERC721Holder_init();
        __UUPSUpgradeable_init();

        if (_ecosystemManagerAddress == address(0) || _nftContract == address(0)) revert InvalidAddress();
        
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        nftContract = IERC721Upgradeable(_nftContract);
        
        // Fetch BKC Token address dynamically from the Hub
        address bkcAddress = ecosystemManager.getBKCTokenAddress();
        if (bkcAddress == address(0)) revert InvalidAddress();
        bkcToken = IERC20Upgradeable(bkcAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Core Functions ---

    /**
     * @notice Lists an NFT for rent (Escrow Custody).
     * @dev Transfers the NFT from the user to this contract.
     * @param tokenId The ID of the NFT to list.
     * @param pricePerHour The cost per HOUR in BKC (Wei).
     * @param maxDurationHours The maximum duration in HOURS allowed for a single rental.
     */
    function listNFT(uint256 tokenId, uint256 pricePerHour, uint256 maxDurationHours) external nonReentrant {
        if (pricePerHour == 0 || maxDurationHours == 0) revert InvalidAmount();

        // Escrow: Transfer NFT to this contract
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            owner: msg.sender,
            pricePerHour: pricePerHour,
            maxDuration: maxDurationHours,
            isActive: true
        });

        _addToListedArray(tokenId);

        emit NFTListed(tokenId, msg.sender, pricePerHour, maxDurationHours);
    }

    /**
     * @notice Withdraws an NFT from the marketplace.
     * @dev Only possible if the NFT is not currently under an active rental.
     * @param tokenId The ID of the NFT to withdraw.
     */
    function withdrawNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        if (listing.owner != msg.sender) revert NotOwner();
        
        // Ensure rental is expired before withdrawing
        Rental storage rental = activeRentals[tokenId];
        if (rental.endTime > block.timestamp) revert RentalActive();

        // Clean up storage
        delete listings[tokenId];
        delete activeRentals[tokenId];
        _removeFromListedArray(tokenId);

        // Return NFT to owner
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);

        emit NFTWithdrawn(tokenId, msg.sender);
    }

    /**
     * @notice Rents a listed NFT, distributes fees, and triggers mining.
     * @param tokenId The ID of the NFT to rent.
     * @param hoursToRent The duration of the rental in HOURS.
     */
    function rentNFT(uint256 tokenId, uint256 hoursToRent) external nonReentrant {
        Listing storage listing = listings[tokenId];
        if (!listing.isActive) revert NotListed();
        if (hoursToRent == 0 || hoursToRent > listing.maxDuration) revert DurationTooLong();
        
        Rental storage currentRental = activeRentals[tokenId];
        if (currentRental.endTime > block.timestamp) revert AlreadyRented();

        // 1. Regulatory Check (Hub): Ensure tenant meets pStake requirements
        _enforcePStakeRequirement(msg.sender);

        // 2. Financial Calculation
        uint256 totalCost = listing.pricePerHour * hoursToRent;
        uint256 feeBips = ecosystemManager.getFee(RENTAL_TAX_BIPS_KEY); // Fetch dynamic fee from Hub
        uint256 feeAmount = (totalCost * feeBips) / 10000;
        uint256 ownerAmount = totalCost - feeAmount;

        // 3. Fund Collection (Pull all funds to contract for safety)
        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // 4. Fee Distribution & Proof-of-Purchase Mining
        if (feeAmount > 0) {
            address miningManager = ecosystemManager.getMiningManagerAddress();
            if (miningManager != address(0)) {
                // Send fee to MiningManager
                bkcToken.safeTransfer(miningManager, feeAmount);
                // Trigger Mining (Mint new tokens based on fee burned/spent)
                IMiningManager(miningManager).performPurchaseMining(RENTAL_TAX_BIPS_KEY, feeAmount);
            }
        }

        // 5. Payout to Owner
        if (ownerAmount > 0) {
            bkcToken.safeTransfer(listing.owner, ownerAmount);
        }

        // 6. Record Rental
        activeRentals[tokenId] = Rental({
            tenant: msg.sender,
            startTime: block.timestamp,
            // 1 hours = 3600 seconds in Solidity
            endTime: block.timestamp + (hoursToRent * 1 hours)
        });

        emit NFTRented(tokenId, msg.sender, listing.owner, hoursToRent, totalCost, feeAmount);
    }

    // --- Internal Logic ---

    /**
     * @dev Checks if the user meets the minimum pStake required by the Ecosystem.
     */
    function _enforcePStakeRequirement(address _user) internal view {
        ( , uint256 minPStake) = ecosystemManager.getServiceRequirements(RENTAL_ACCESS_KEY);
        
        if (minPStake > 0) {
            address delegationManagerAddr = ecosystemManager.getDelegationManagerAddress();
            if (delegationManagerAddr != address(0)) {
                uint256 userStake = IDelegationManager(delegationManagerAddr).userTotalPStake(_user);
                if (userStake < minPStake) revert InsufficientPStake();
            }
        }
    }

    function _addToListedArray(uint256 tokenId) internal {
        listedTokenIds.push(tokenId);
    }

    function _removeFromListedArray(uint256 tokenId) internal {
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listedTokenIds[i] == tokenId) {
                listedTokenIds[i] = listedTokenIds[listedTokenIds.length - 1];
                listedTokenIds.pop();
                break;
            }
        }
    }

    // --- View Functions ---

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    function getRental(uint256 tokenId) external view returns (Rental memory) {
        return activeRentals[tokenId];
    }

    /**
     * @notice Returns true if the NFT is currently under an active rental contract.
     */
    function isRented(uint256 tokenId) external view returns (bool) {
        return activeRentals[tokenId].endTime > block.timestamp;
    }

    function getAllListedTokenIds() external view returns (uint256[] memory) {
        return listedTokenIds;
    }
}