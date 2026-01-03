// modules/js/transactions/rental-tx.js
// ✅ PRODUCTION V1.2 - Use setApprovalForAll for one-time approval
// 
// CHANGES V1.2:
// - Changed from individual approve() to setApprovalForAll() 
// - One-time approval for all NFTs (no need to approve each listing)
// - Added delay after approval for RPC propagation
//
// CHANGES V1.1:
// - Imports addresses from config.js (loaded from deployment-addresses.json)
// - Removed hardcoded fallback addresses
// - Uses rentalManager as the marketplace contract
// - Uses rewardBoosterNFT as the NFT contract
// - Added aliases for backward compatibility (list, rent, withdraw)
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - listNft / list: List an NFT for rent
// - rentNft / rent: Rent a listed NFT
// - withdrawNft / withdraw: Remove NFT from marketplace
// - updateListing: Update listing price/duration
// - endRental: End an active rental early
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 * Addresses are loaded from deployment-addresses.json at app init
 * 
 * @returns {Object} Contract addresses
 * @throws {Error} If addresses are not loaded
 */
function getContracts() {
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    // Rental marketplace is rentalManager
    const rentalMarketplace = addresses?.rentalManager || 
                              contractAddresses?.rentalManager ||
                              window.contractAddresses?.rentalManager;
    
    // NFT contract is RewardBoosterNFT
    const nftContract = addresses?.rewardBoosterNFT || 
                        contractAddresses?.rewardBoosterNFT ||
                        window.contractAddresses?.rewardBoosterNFT;
    
    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    if (!rentalMarketplace) {
        console.error('❌ RentalManager address not found!', { addresses, contractAddresses });
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    if (!nftContract) {
        console.error('❌ NFT Contract (RewardBoosterNFT) address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        RENTAL_MARKETPLACE: rentalMarketplace,
        NFT_CONTRACT: nftContract
    };
}

/**
 * Rental Marketplace ABI - RentalManager contract
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
 * NFT Contract ABI (RewardBoosterNFT)
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
    const contracts = getContracts();
    return new ethers.Contract(contracts.RENTAL_MARKETPLACE, RENTAL_ABI, signer);
}

/**
 * Creates Rental Marketplace contract instance (read-only)
 */
async function getRentalContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
}

/**
 * Creates NFT contract instance
 */
function getNftContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, signer);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Lists an NFT for rent on the marketplace
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
    ValidationLayer.rental.validateList({ tokenId, pricePerHour, minHours, maxHours });

    const price = BigInt(pricePerHour);
    const contracts = getContracts();

    return await txEngine.execute({
        name: 'ListNFT',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'listNFT',
        args: [tokenId, price, minHours, maxHours],
        
        validate: async (signer, userAddress) => {
            const rentalContract = getRentalContract(signer);
            const nftContract = getNftContract(signer);
            
            try {
                const isPaused = await rentalContract.paused();
                if (isPaused) {
                    throw new Error('Marketplace is currently paused');
                }
            } catch (e) {
                if (e.message.includes('paused')) throw e;
            }
            
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            try {
                const listing = await rentalContract.getListing(tokenId);
                if (listing.active) {
                    throw new Error('This NFT is already listed');
                }
            } catch (e) {
                if (e.message.includes('already listed')) throw e;
            }
            
            const isApprovedForAll = await nftContract.isApprovedForAll(userAddress, contracts.RENTAL_MARKETPLACE);
            
            // V1.2: Use setApprovalForAll (one-time approval for all NFTs)
            if (!isApprovedForAll) {
                console.log('[Rental] Setting approval for all NFTs...');
                
                // Small delay before approval (RPC stabilization)
                await new Promise(r => setTimeout(r, 500));
                
                const approveTx = await nftContract.setApprovalForAll(contracts.RENTAL_MARKETPLACE, true);
                await approveTx.wait();
                console.log('[Rental] ✅ All NFTs approved for marketplace');
                
                // Wait for propagation
                await new Promise(r => setTimeout(r, 1000));
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Rents a listed NFT
 */
export async function rentNft({
    tokenId,
    hours,
    button = null,
    onSuccess = null,
    onError = null
}) {
    ValidationLayer.rental.validateRent({ tokenId, hours });

    const contracts = getContracts();
    let rentalCost = 0n;

    return await txEngine.execute({
        name: 'RentNFT',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'rentNFT',
        args: [tokenId, hours],
        
        get approval() {
            return rentalCost > 0n ? {
                token: contracts.BKC_TOKEN,
                spender: contracts.RENTAL_MARKETPLACE,
                amount: rentalCost
            } : null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            try {
                const isPaused = await contract.paused();
                if (isPaused) {
                    throw new Error('Marketplace is currently paused');
                }
            } catch (e) {
                if (e.message.includes('paused')) throw e;
            }
            
            const listing = await contract.getListing(tokenId);
            
            if (!listing.active) {
                throw new Error('This NFT is not listed for rent');
            }
            
            if (hours < listing.minHours || hours > listing.maxHours) {
                throw new Error(`Rental hours must be between ${listing.minHours} and ${listing.maxHours}`);
            }
            
            const isRented = await contract.isRented(tokenId);
            if (isRented) {
                throw new Error('This NFT is currently being rented');
            }
            
            rentalCost = await contract.calculateRentalCost(tokenId, hours);
        },
        
        onSuccess,
        onError
    });
}

/**
 * Withdraws an NFT from the marketplace
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
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            const listing = await contract.getListing(tokenId);
            
            if (!listing.active) {
                throw new Error('This NFT is not listed');
            }
            
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the listing owner can withdraw');
            }
            
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
 * Updates a listing's price and duration parameters
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
    ValidationLayer.rental.validateList({ tokenId, pricePerHour, minHours, maxHours });

    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'UpdateListing',
        button,
        
        getContract: async (signer) => getRentalContract(signer),
        method: 'updateListing',
        args: [tokenId, price, minHours, maxHours],
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            const listing = await contract.getListing(tokenId);
            
            if (!listing.active) {
                throw new Error('This NFT is not listed');
            }
            
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the listing owner can update');
            }
            
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
 * Ends an active rental early
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
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            
            const isRented = await contract.isRented(tokenId);
            if (!isRented) {
                throw new Error('This NFT is not currently rented');
            }
            
            const rental = await contract.getRental(tokenId);
            const listing = await contract.getListing(tokenId);
            const now = Math.floor(Date.now() / 1000);
            
            const isExpired = Number(rental.endTime) <= now;
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

export async function getListing(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const listing = await contract.getListing(tokenId);
    
    return {
        owner: listing.owner,
        pricePerHour: listing.pricePerHour,
        pricePerHourFormatted: ethers.formatEther(listing.pricePerHour),
        minHours: Number(listing.minHours),
        maxHours: Number(listing.maxHours),
        active: listing.active
    };
}

export async function getRental(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const rental = await contract.getRental(tokenId);
    const now = Math.floor(Date.now() / 1000);
    
    return {
        renter: rental.renter,
        startTime: Number(rental.startTime),
        endTime: Number(rental.endTime),
        totalPaid: rental.totalPaid,
        totalPaidFormatted: ethers.formatEther(rental.totalPaid),
        active: rental.active,
        hoursRemaining: rental.active ? Math.max(0, Math.ceil((Number(rental.endTime) - now) / 3600)) : 0,
        isExpired: rental.active && Number(rental.endTime) <= now
    };
}

export async function getActiveListings() {
    const contract = await getRentalContractReadOnly();
    const ids = await contract.getActiveListings();
    return ids.map(id => Number(id));
}

export async function getUserListings(userAddress) {
    const contract = await getRentalContractReadOnly();
    const ids = await contract.getUserListings(userAddress);
    return ids.map(id => Number(id));
}

export async function getUserRentals(userAddress) {
    const contract = await getRentalContractReadOnly();
    const ids = await contract.getUserRentals(userAddress);
    return ids.map(id => Number(id));
}

export async function calculateRentalCost(tokenId, hours) {
    const contract = await getRentalContractReadOnly();
    return await contract.calculateRentalCost(tokenId, hours);
}

export async function isMarketplacePaused() {
    const contract = await getRentalContractReadOnly();
    return await contract.paused();
}

// ============================================================================
// 5. ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

export const list = listNft;
export const rent = rentNft;
export const withdraw = withdrawNft;

// ============================================================================
// 6. EXPORT
// ============================================================================

export const RentalTx = {
    listNft,
    rentNft,
    withdrawNft,
    updateListing,
    endRental,
    // Aliases
    list,
    rent,
    withdraw,
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