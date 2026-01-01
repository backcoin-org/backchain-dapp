// modules/js/transactions/rental-tx.js
// ✅ PRODUCTION V1.0 - NFT Rental Marketplace Transaction Handlers
// 
// This module provides transaction functions for the NFT Rental contract.
// Supports listing, renting, and managing NFT rentals.
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - listNft: List an NFT for rent
// - rentNft: Rent a listed NFT
// - withdrawNft: Remove NFT from marketplace
// - updateListing: Update listing price/duration
// - endRental: End an active rental early
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Contract addresses
 */
const CONTRACTS = {
    BKC_TOKEN: window.ENV?.BKC_TOKEN_ADDRESS || '0x5c6d3a63F8A41F4dB91EBA04eA9B39AC2a6d8d79',
    RENTAL_MARKETPLACE: window.ENV?.RENTAL_MARKETPLACE_ADDRESS || '0xYourRentalMarketplaceAddress',
    NFT_CONTRACT: window.ENV?.NFT_CONTRACT_ADDRESS || '0xYourNftContractAddress'
};

/**
 * Rental Marketplace ABI
 */
const RENTAL_ABI = [
    // Write functions
    'function listNFT(uint256 tokenId, uint256 pricePerHour, uint256 minHours, uint256 maxHours) external',
    'function rentNFT(uint256 tokenId, uint256 hours) external',
    'function withdrawNFT(uint256 tokenId) external',
    'function updateListing(uint256 tokenId, uint256 pricePerHour, uint256 minHours, uint256 maxHours) external',
    'function endRental(uint256 tokenId) external',
    
    // Read functions
    'function getListing(uint256 tokenId) view returns (address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool active)',
    'function getRental(uint256 tokenId) view returns (address renter, uint256 startTime, uint256 endTime, uint256 totalPaid, bool active)',
    'function getActiveListings() view returns (uint256[])',
    'function getUserListings(address user) view returns (uint256[])',
    'function getUserRentals(address user) view returns (uint256[])',
    'function calculateRentalCost(uint256 tokenId, uint256 hours) view returns (uint256)',
    'function isRented(uint256 tokenId) view returns (bool)',
    'function paused() view returns (bool)',
    
    // Events
    'event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)',
    'event NFTRented(uint256 indexed tokenId, address indexed renter, uint256 hours, uint256 totalCost)',
    'event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)',
    'event ListingUpdated(uint256 indexed tokenId, uint256 pricePerHour, uint256 minHours, uint256 maxHours)',
    'event RentalEnded(uint256 indexed tokenId, address indexed renter)'
];

/**
 * NFT Contract ABI
 */
const NFT_ABI = [
    'function approve(address to, uint256 tokenId) external',
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function ownerOf(uint256 tokenId) view returns (address)'
];

/**
 * BKC Token ABI
 */
const BKC_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Rental Marketplace contract instance
 */
function getRentalContract(signer) {
    const ethers = window.ethers;
    return new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, signer);
}

/**
 * Creates NFT contract instance
 */
function getNftContract(signer) {
    const ethers = window.ethers;
    return new ethers.Contract(CONTRACTS.NFT_CONTRACT, NFT_ABI, signer);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Lists an NFT for rent on the marketplace
 * 
 * @param {Object} params - Listing parameters
 * @param {number|bigint} params.tokenId - NFT token ID
 * @param {string|bigint} params.pricePerHour - Price per hour in tokens (wei)
 * @param {number} params.minHours - Minimum rental hours (1-720)
 * @param {number} params.maxHours - Maximum rental hours (minHours-720)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await RentalTx.listNft({
 *     tokenId: 42,
 *     pricePerHour: ethers.parseEther('5'),
 *     minHours: 1,
 *     maxHours: 168, // 1 week max
 *     button: document.getElementById('listBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('NFT listed for rent!');
 *         updateMyListings();
 *     }
 * });
 */
export async function listNft({
    tokenId,
    pricePerHour,
    minHours,
    maxHours,
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Validate inputs
    ValidationLayer.rental.validateList({ tokenId, pricePerHour, minHours, maxHours });

    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'ListNFT',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'listNFT',
        args: [tokenId, price, minHours, maxHours],
        
        // Custom validation: check ownership and approve NFT
        validate: async (signer, userAddress) => {
            const rentalContract = getRentalContract(signer);
            const nftContract = getNftContract(signer);
            
            // Check marketplace not paused
            const isPaused = await rentalContract.paused();
            if (isPaused) {
                throw new Error('Marketplace is currently paused');
            }
            
            // Check user owns the NFT
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            // Check NFT not already listed
            const listing = await rentalContract.getListing(tokenId);
            if (listing.active) {
                throw new Error('This NFT is already listed');
            }
            
            // Check if NFT is approved for marketplace
            const isApprovedForAll = await nftContract.isApprovedForAll(userAddress, CONTRACTS.RENTAL_MARKETPLACE);
            const approved = await nftContract.getApproved(tokenId);
            
            if (!isApprovedForAll && approved.toLowerCase() !== CONTRACTS.RENTAL_MARKETPLACE.toLowerCase()) {
                // Need to approve NFT first
                console.log('[Rental] Approving NFT for marketplace...');
                const approveTx = await nftContract.approve(CONTRACTS.RENTAL_MARKETPLACE, tokenId);
                await approveTx.wait();
                console.log('[Rental] NFT approved');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Rents a listed NFT
 * 
 * @param {Object} params - Rental parameters
 * @param {number|bigint} params.tokenId - NFT token ID to rent
 * @param {number} params.hours - Number of hours to rent
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await RentalTx.rentNft({
 *     tokenId: 42,
 *     hours: 24,
 *     button: document.getElementById('rentBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('NFT rented successfully!');
 *     }
 * });
 */
export async function rentNft({
    tokenId,
    hours,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Validate inputs
    ValidationLayer.rental.validateRent({ tokenId, hours });

    let rentalCost = 0n;

    return await txEngine.execute({
        name: 'RentNFT',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'rentNFT',
        args: [tokenId, hours],
        
        // Token approval config (set in validate)
        get approval() {
            return rentalCost > 0n ? {
                token: CONTRACTS.BKC_TOKEN,
                spender: CONTRACTS.RENTAL_MARKETPLACE,
                amount: rentalCost
            } : null;
        },
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            // Check marketplace not paused
            const isPaused = await contract.paused();
            if (isPaused) {
                throw new Error('Marketplace is currently paused');
            }
            
            // Check listing exists and is active
            const listing = await contract.getListing(tokenId);
            if (!listing.active) {
                throw new Error('This NFT is not listed for rent');
            }
            
            // Check hours within limits
            if (hours < Number(listing.minHours)) {
                throw new Error(`Minimum rental is ${listing.minHours} hours`);
            }
            if (hours > Number(listing.maxHours)) {
                throw new Error(`Maximum rental is ${listing.maxHours} hours`);
            }
            
            // Check not already rented
            const isRented = await contract.isRented(tokenId);
            if (isRented) {
                throw new Error('This NFT is currently being rented');
            }
            
            // Calculate cost
            rentalCost = await contract.calculateRentalCost(tokenId, hours);
            
            // Check user has enough tokens
            await ValidationLayer.validateTokenBalance(
                CONTRACTS.BKC_TOKEN,
                rentalCost,
                userAddress
            );
        },
        
        onSuccess,
        onError
    });
}

/**
 * Withdraws an NFT from the marketplace
 * 
 * @param {Object} params - Withdraw parameters
 * @param {number|bigint} params.tokenId - NFT token ID
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function withdrawNft({
    tokenId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (tokenId === undefined || tokenId === null) {
        throw new Error('Token ID is required');
    }

    return await txEngine.execute({
        name: 'WithdrawNFT',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'withdrawNFT',
        args: [tokenId],
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            // Check listing exists
            const listing = await contract.getListing(tokenId);
            if (!listing.active) {
                throw new Error('This NFT is not listed');
            }
            
            // Check user is the listing owner
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the listing owner can withdraw');
            }
            
            // Check not currently rented
            const isRented = await contract.isRented(tokenId);
            if (isRented) {
                throw new Error('Cannot withdraw while NFT is being rented');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Updates a listing's price and duration limits
 * 
 * @param {Object} params - Update parameters
 * @param {number|bigint} params.tokenId - NFT token ID
 * @param {string|bigint} params.pricePerHour - New price per hour in tokens (wei)
 * @param {number} params.minHours - New minimum hours
 * @param {number} params.maxHours - New maximum hours
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function updateListing({
    tokenId,
    pricePerHour,
    minHours,
    maxHours,
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Validate inputs
    ValidationLayer.rental.validateList({ tokenId, pricePerHour, minHours, maxHours });

    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'UpdateListing',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'updateListing',
        args: [tokenId, price, minHours, maxHours],
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            // Check listing exists
            const listing = await contract.getListing(tokenId);
            if (!listing.active) {
                throw new Error('This NFT is not listed');
            }
            
            // Check user is the listing owner
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the listing owner can update');
            }
            
            // Check not currently rented
            const isRented = await contract.isRented(tokenId);
            if (isRented) {
                throw new Error('Cannot update while NFT is being rented');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Ends an active rental early (owner or renter can call)
 * 
 * @param {Object} params - End rental parameters
 * @param {number|bigint} params.tokenId - NFT token ID
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function endRental({
    tokenId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (tokenId === undefined || tokenId === null) {
        throw new Error('Token ID is required');
    }

    return await txEngine.execute({
        name: 'EndRental',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'endRental',
        args: [tokenId],
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            // Check there's an active rental
            const isRented = await contract.isRented(tokenId);
            if (!isRented) {
                throw new Error('This NFT is not currently rented');
            }
            
            // Check rental has expired or user is renter/owner
            const rental = await contract.getRental(tokenId);
            const listing = await contract.getListing(tokenId);
            const now = Math.floor(Date.now() / 1000);
            
            const isExpired = rental.endTime <= now;
            const isRenter = rental.renter.toLowerCase() === userAddress.toLowerCase();
            const isOwner = listing.owner.toLowerCase() === userAddress.toLowerCase();
            
            if (!isExpired && !isRenter && !isOwner) {
                throw new Error('Only the renter or owner can end the rental early');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets listing details
 * @param {number} tokenId - Token ID
 * @returns {Promise<Object>} Listing info
 */
export async function getListing(tokenId) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    const listing = await contract.getListing(tokenId);
    
    return {
        owner: listing.owner,
        pricePerHour: listing.pricePerHour,
        minHours: Number(listing.minHours),
        maxHours: Number(listing.maxHours),
        active: listing.active
    };
}

/**
 * Gets rental details
 * @param {number} tokenId - Token ID
 * @returns {Promise<Object>} Rental info
 */
export async function getRental(tokenId) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    const rental = await contract.getRental(tokenId);
    const now = Math.floor(Date.now() / 1000);
    
    return {
        renter: rental.renter,
        startTime: Number(rental.startTime),
        endTime: Number(rental.endTime),
        totalPaid: rental.totalPaid,
        active: rental.active,
        // Computed
        hoursRemaining: rental.active ? Math.max(0, Math.ceil((Number(rental.endTime) - now) / 3600)) : 0,
        isExpired: rental.active && Number(rental.endTime) <= now
    };
}

/**
 * Gets all active listings
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getActiveListings() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    const ids = await contract.getActiveListings();
    return ids.map(id => Number(id));
}

/**
 * Gets user's listings
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getUserListings(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    const ids = await contract.getUserListings(userAddress);
    return ids.map(id => Number(id));
}

/**
 * Gets user's active rentals
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getUserRentals(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    const ids = await contract.getUserRentals(userAddress);
    return ids.map(id => Number(id));
}

/**
 * Calculates rental cost
 * @param {number} tokenId - Token ID
 * @param {number} hours - Rental hours
 * @returns {Promise<bigint>} Cost in wei
 */
export async function calculateRentalCost(tokenId, hours) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    return await contract.calculateRentalCost(tokenId, hours);
}

/**
 * Checks if marketplace is paused
 * @returns {Promise<boolean>} True if paused
 */
export async function isMarketplacePaused() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
    
    return await contract.paused();
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const RentalTx = {
    listNft,
    rentNft,
    withdrawNft,
    updateListing,
    endRental,
    // Read helpers
    getListing,
    getRental,
    getActiveListings,
    getUserListings,
    getUserRentals,
    calculateRentalCost,
    isMarketplacePaused
};

export default RentalTx;