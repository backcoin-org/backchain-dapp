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
 * @title RentalManager (AirBNFT Protocol - Single Session)
 * @notice A decentralized marketplace for fixed 1-HOUR NFT rentals.
 * @dev 
 * - Single Session Logic: Rentals are fixed to exactly 1 HOUR.
 * - Automatic Expiry: Usage rights expire automatically after 60 minutes.
 * - Proof-of-Purchase: Protocol fees trigger the MiningManager to mint new rewards.
 * - Escrow: NFTs are held securely by this contract during the listing period.
 * - Optimized Storage: Uses O(1) array management for infinite scalability.
 * Part of the Backcoin Ecosystem.
 * Website: Backcoin.org
 * Optimized for Arbitrum Network.
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
        uint256 price; // Cost for 1 HOUR session in Wei (BKC)
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
    // Array to assist frontend indexing
    uint256[] public listedTokenIds;
    // Critical: O(1) Optimization: Maps TokenID to Array Index
    mapping(uint256 => uint256) private _listedTokenIndex;

    // --- Constants & Configuration Keys ---
    
    // Key to fetch the protocol tax percentage (BIPS) from EcosystemManager
    bytes32 public constant RENTAL_TAX_BIPS_KEY = keccak256("RENTAL_MARKET_TAX_BIPS");

    // --- Events ---

    event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 price);
    event NFTWithdrawn(uint256 indexed tokenId, address indexed owner);
    event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 totalCost, uint256 feePaid);

    // --- Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error NotOwner();
    error NotListed();
    error AlreadyRented();
    error RentalActive();

    // --- Initialization ---

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
     * @param price The cost for a fixed 1-HOUR session in BKC (Wei).
     */
    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert InvalidAmount();

        // Escrow: Transfer NFT to this contract
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            owner: msg.sender,
            price: price,
            isActive: true
        });

        // Optimization: Add to array with index tracking
        _addToListedArray(tokenId);

        emit NFTListed(tokenId, msg.sender, price);
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
        
        // Optimization: Remove from array using Swap-and-Pop (O(1))
        _removeFromListedArray(tokenId);

        // Return NFT to owner
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);

        emit NFTWithdrawn(tokenId, msg.sender);
    }

    /**
     * @notice Rents a listed NFT for exactly 1 HOUR.
     * @dev Distributes fees and triggers mining.
     * @param tokenId The ID of the NFT to rent.
     */
    function rentNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        if (!listing.isActive) revert NotListed();
        
        Rental storage currentRental = activeRentals[tokenId];
        if (currentRental.endTime > block.timestamp) revert AlreadyRented();

        // 1. Financial Calculation (Fixed Price)
        uint256 totalCost = listing.price;
        uint256 feeBips = ecosystemManager.getFee(RENTAL_TAX_BIPS_KEY); // Fetch dynamic fee from Hub
        uint256 feeAmount = (totalCost * feeBips) / 10000;
        uint256 ownerAmount = totalCost - feeAmount;

        // 2. Fund Collection (Pull all funds to contract for safety)
        bkcToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // 3. Fee Distribution & Proof-of-Purchase Mining
        if (feeAmount > 0) {
            address miningManager = ecosystemManager.getMiningManagerAddress();
            if (miningManager != address(0)) {
                // Send fee to MiningManager
                bkcToken.safeTransfer(miningManager, feeAmount);
                // Trigger Mining (Mint new tokens based on fee burned/spent)
                IMiningManager(miningManager).performPurchaseMining(RENTAL_TAX_BIPS_KEY, feeAmount);
            }
        }

        // 4. Payout to Owner
        if (ownerAmount > 0) {
            bkcToken.safeTransfer(listing.owner, ownerAmount);
        }

        // 5. Record Rental (Fixed 1 Hour Duration)
        activeRentals[tokenId] = Rental({
            tenant: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + 1 hours
        });
        
        emit NFTRented(tokenId, msg.sender, listing.owner, totalCost, feeAmount);
    }

    // --- Internal Logic (Optimized) ---

    /**
     * @dev O(1) Add to array.
     */
    function _addToListedArray(uint256 tokenId) internal {
        // Tracks where the token will stay in the array (last position)
        _listedTokenIndex[tokenId] = listedTokenIds.length;
        listedTokenIds.push(tokenId);
    }

    /**
     * @dev O(1) Remove from array (Swap-and-Pop pattern).
     * Prevents gas issues with large arrays.
     */
    function _removeFromListedArray(uint256 tokenId) internal {
        uint256 indexToRemove = _listedTokenIndex[tokenId];
        uint256 lastIndex = listedTokenIds.length - 1;

        // If the element is not the last one, swap it with the last one
        if (indexToRemove != lastIndex) {
            uint256 lastTokenId = listedTokenIds[lastIndex];
            // Move the last element to the hole of the element being removed
            listedTokenIds[indexToRemove] = lastTokenId;
            // Update the index of the moved element
            _listedTokenIndex[lastTokenId] = indexToRemove;
        }

        // Remove the last element (which is now duplicated or the target)
        listedTokenIds.pop();
        delete _listedTokenIndex[tokenId];
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