// modules/js/transactions/rental-tx.js
// ✅ PRODUCTION V1.5 - Improved RPC resilience and approval handling
// 
// CHANGES V1.5:
// - IMPROVED: Use setApprovalForAll instead of individual approve (one-time approval)
// - IMPROVED: Better error handling during NFT approval with timeout
// - IMPROVED: Re-check approval status after RPC errors
// - IMPROVED: Fixed gas limit for approval transactions
// - IMPROVED: Cleaner error messages for users
//
// CHANGES V1.4:
// - Changed ABI from string format to object format (ethers v6 compatibility)
// - Fixed: listing.active → listing.isActive (match contract struct)
// - Fixed: rental.renter → rental.tenant (match contract struct)
// - Fixed: rental.totalPaid → rental.paidAmount (match contract struct)
// - Removed non-existent functions: getActiveListings, getUserListings, getUserRentals
// - Added proper contract method validation
// - Added debug logging for troubleshooting
//
// CHANGES V1.3:
// - Fixed: listing.active → listing.isActive (match contract)
// - Fixed: calculateRentalCost → getRentalCost (match contract)
// - Added: BKC balance check before rent
// - Added: Better error messages for each failure case
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - listNft / list: List an NFT for rent
// - rentNft / rent: Rent a listed NFT
// - withdrawNft / withdraw: Remove NFT from marketplace
// - updateListing: Update listing price/duration
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 */
function getContracts() {
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    const rentalMarketplace = addresses?.rentalManager || 
                              contractAddresses?.rentalManager ||
                              window.contractAddresses?.rentalManager;
    
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
    
    console.log('[RentalTx] Using addresses:', { bkcToken, rentalMarketplace, nftContract });
    
    return {
        BKC_TOKEN: bkcToken,
        RENTAL_MARKETPLACE: rentalMarketplace,
        NFT_CONTRACT: nftContract
    };
}

/**
 * Rental Marketplace ABI - RentalManager contract
 * V1.4: Using OBJECT format for ethers v6 compatibility
 */
const RENTAL_ABI = [
    // Write functions
    {
        name: 'listNFT',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'pricePerHour', type: 'uint256' },
            { name: 'minHours', type: 'uint256' },
            { name: 'maxHours', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'rentNFT',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'hours', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'rentNFTSimple',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'tokenId', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'withdrawNFT',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'tokenId', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'updateListing',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'pricePerHour', type: 'uint256' },
            { name: 'minHours', type: 'uint256' },
            { name: 'maxHours', type: 'uint256' }
        ],
        outputs: []
    },
    
    // Read functions - V1.4: Match contract struct fields exactly
    {
        name: 'getListing',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
            { name: 'owner', type: 'address' },
            { name: 'pricePerHour', type: 'uint256' },
            { name: 'minHours', type: 'uint256' },
            { name: 'maxHours', type: 'uint256' },
            { name: 'isActive', type: 'bool' },
            { name: 'totalEarnings', type: 'uint256' },
            { name: 'rentalCount', type: 'uint256' }
        ]
    },
    {
        name: 'getRental',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
            { name: 'tenant', type: 'address' },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'paidAmount', type: 'uint256' }
        ]
    },
    {
        name: 'getRentalCost',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'hours', type: 'uint256' }
        ],
        outputs: [
            { name: 'totalCost', type: 'uint256' },
            { name: 'protocolFee', type: 'uint256' },
            { name: 'ownerPayout', type: 'uint256' }
        ]
    },
    {
        name: 'getAllListedTokenIds',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
        name: 'isRented',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'hasRentalRights',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'user', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'getRemainingRentalTime',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'paused',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'getListingCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'getMarketplaceStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'activeListings', type: 'uint256' },
            { name: 'totalVol', type: 'uint256' },
            { name: 'totalFees', type: 'uint256' },
            { name: 'rentals', type: 'uint256' }
        ]
    },
    
    // Events
    {
        name: 'NFTListed',
        type: 'event',
        inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'owner', type: 'address', indexed: true },
            { name: 'pricePerHour', type: 'uint256', indexed: false },
            { name: 'minHours', type: 'uint256', indexed: false },
            { name: 'maxHours', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'NFTRented',
        type: 'event',
        inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'tenant', type: 'address', indexed: true },
            { name: 'owner', type: 'address', indexed: true },
            { name: 'hours_', type: 'uint256', indexed: false },
            { name: 'totalCost', type: 'uint256', indexed: false },
            { name: 'protocolFee', type: 'uint256', indexed: false },
            { name: 'ownerPayout', type: 'uint256', indexed: false },
            { name: 'endTime', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'NFTWithdrawn',
        type: 'event',
        inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'owner', type: 'address', indexed: true }
        ]
    },
    {
        name: 'ListingUpdated',
        type: 'event',
        inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'newPricePerHour', type: 'uint256', indexed: false },
            { name: 'newMinHours', type: 'uint256', indexed: false },
            { name: 'newMaxHours', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'RentalExpired',
        type: 'event',
        inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'tenant', type: 'address', indexed: true }
        ]
    }
];

/**
 * NFT Contract ABI (RewardBoosterNFT) - Object format
 */
const NFT_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'setApprovalForAll',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'operator', type: 'address' },
            { name: 'approved', type: 'bool' }
        ],
        outputs: []
    },
    {
        name: 'isApprovedForAll',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'operator', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'getApproved',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }]
    },
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }]
    }
];

/**
 * BKC Token ABI - Object format
 */
const BKC_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Rental Marketplace contract instance
 * V1.4: Added validation and debug logging
 */
function getRentalContract(signer) {
    const ethers = window.ethers;
    
    if (!ethers) {
        throw new Error('ethers.js not loaded');
    }
    
    const contracts = getContracts();
    const contract = new ethers.Contract(contracts.RENTAL_MARKETPLACE, RENTAL_ABI, signer);
    
    console.log('[RentalTx] Contract created, checking methods...');
    
    return contract;
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

/**
 * Creates NFT contract instance (read-only)
 */
async function getNftContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, provider);
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
    console.log('[RentalTx] listNft called with:', { tokenId, pricePerHour, minHours, maxHours });
    
    ValidationLayer.rental.validateList({ tokenId, pricePerHour, minHours, maxHours });

    const price = BigInt(pricePerHour);
    const contracts = getContracts();

    return await txEngine.execute({
        name: 'ListNFT',
        button,
        
        getContract: async (signer) => {
            const contract = getRentalContract(signer);
            console.log('[RentalTx] Contract.listNFT exists:', typeof contract.listNFT);
            return contract;
        },
        method: 'listNFT',
        args: [BigInt(tokenId), price, BigInt(minHours), BigInt(maxHours)],
        
        validate: async (signer, userAddress) => {
            console.log('[RentalTx] Validating listNFT for user:', userAddress);
            
            const rentalContract = getRentalContract(signer);
            const nftContract = getNftContract(signer);
            
            // Check if marketplace is paused
            try {
                const isPaused = await rentalContract.paused();
                console.log('[RentalTx] Marketplace paused:', isPaused);
                if (isPaused) {
                    throw new Error('Marketplace is currently paused');
                }
            } catch (e) {
                if (e.message.includes('paused')) throw e;
            }
            
            // Check ownership
            const owner = await nftContract.ownerOf(tokenId);
            console.log('[RentalTx] NFT owner:', owner);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            // Check if already listed - V1.4: Use isActive (not active)
            try {
                const listing = await rentalContract.getListing(tokenId);
                console.log('[RentalTx] Current listing:', listing);
                if (listing.isActive) {
                    throw new Error('This NFT is already listed');
                }
            } catch (e) {
                if (e.message.includes('already listed')) throw e;
            }
            
            // V1.5: Improved NFT approval handling with better RPC error resilience
            const isApprovedForAll = await nftContract.isApprovedForAll(userAddress, contracts.RENTAL_MARKETPLACE);
            console.log('[RentalTx] Is approved for all:', isApprovedForAll);
            
            if (!isApprovedForAll) {
                const approved = await nftContract.getApproved(tokenId);
                console.log('[RentalTx] Approved address:', approved);
                
                if (approved.toLowerCase() !== contracts.RENTAL_MARKETPLACE.toLowerCase()) {
                    console.log('[RentalTx] Approving NFT for marketplace...');
                    
                    // V1.5: Use setApprovalForAll for better UX (one-time approval for all NFTs)
                    // This avoids needing to approve each NFT individually
                    try {
                        const approveTx = await nftContract.setApprovalForAll(
                            contracts.RENTAL_MARKETPLACE, 
                            true,
                            { gasLimit: 100000 } // Fixed gas limit for approval
                        );
                        
                        console.log('[RentalTx] Approval tx submitted:', approveTx.hash);
                        
                        // Wait with timeout
                        const receipt = await Promise.race([
                            approveTx.wait(),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Approval timeout - please try again')), 60000)
                            )
                        ]);
                        
                        console.log('[RentalTx] ✅ NFT approval confirmed in block:', receipt.blockNumber);
                    } catch (approvalError) {
                        console.error('[RentalTx] Approval error:', approvalError);
                        
                        // Check if approval actually went through despite error
                        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                        const recheckApproval = await nftContract.isApprovedForAll(userAddress, contracts.RENTAL_MARKETPLACE);
                        
                        if (recheckApproval) {
                            console.log('[RentalTx] ✅ Approval confirmed on recheck');
                        } else {
                            // Propagate a cleaner error
                            throw new Error('NFT approval failed. Please check MetaMask and try again.');
                        }
                    }
                }
            }
            
            console.log('[RentalTx] ✅ All validations passed for listNFT');
        },
        
        onSuccess: async (receipt) => {
            console.log('[RentalTx] ListNFT successful:', receipt.hash);
            if (onSuccess) await onSuccess(receipt);
        },
        onError: (error) => {
            console.error('[RentalTx] ListNFT failed:', error);
            if (onError) onError(error);
        }
    });
}

/**
 * Rents a listed NFT
 */
export async function rentNft({
    tokenId,
    hours = 1,
    button = null,
    onSuccess = null,
    onError = null
}) {
    console.log('[RentalTx] rentNft called with:', { tokenId, hours });
    
    ValidationLayer.rental.validateRent({ tokenId, hours });
    
    const contracts = getContracts();
    
    // Pre-fetch rental cost for approval
    let rentalCost = 0n;
    try {
        const readContract = await getRentalContractReadOnly();
        const costData = await readContract.getRentalCost(tokenId, hours);
        rentalCost = costData.totalCost;
        console.log('[RentalTx] Pre-fetched rental cost:', window.ethers.formatEther(rentalCost), 'BKC');
    } catch (e) {
        console.warn('[RentalTx] Could not pre-fetch rental cost:', e.message);
    }

    return await txEngine.execute({
        name: 'RentNFT',
        button,
        
        getContract: async (signer) => {
            const contract = getRentalContract(signer);
            console.log('[RentalTx] Contract.rentNFT exists:', typeof contract.rentNFT);
            return contract;
        },
        method: 'rentNFT',
        args: [BigInt(tokenId), BigInt(hours)],
        
        // Token approval for rental payment
        approval: (rentalCost > 0n) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.RENTAL_MARKETPLACE,
            amount: rentalCost
        } : null,
        
        validate: async (signer, userAddress) => {
            const ethers = window.ethers;
            console.log('[RentalTx] Validating rent for tokenId:', tokenId, 'hours:', hours);
            
            const contract = getRentalContract(signer);
            
            // Check marketplace paused
            const isPaused = await contract.paused();
            console.log('[RentalTx] Marketplace paused:', isPaused);
            if (isPaused) {
                throw new Error('Marketplace is currently paused');
            }
            
            // Check listing - V1.4: Use isActive (not active)
            const listing = await contract.getListing(tokenId);
            console.log('[RentalTx] Listing:', listing);
            
            if (!listing.isActive) {
                throw new Error('This NFT is not listed for rent');
            }
            
            // Check hours within bounds
            const minH = Number(listing.minHours);
            const maxH = Number(listing.maxHours);
            if (hours < minH || hours > maxH) {
                throw new Error(`Rental duration must be between ${minH} and ${maxH} hours`);
            }
            
            // Check if currently rented
            const isCurrentlyRented = await contract.isRented(tokenId);
            console.log('[RentalTx] Is currently rented:', isCurrentlyRented);
            if (isCurrentlyRented) {
                throw new Error('This NFT is currently being rented by someone else');
            }
            
            // Calculate and validate cost
            const costData = await contract.getRentalCost(tokenId, hours);
            const totalCost = costData.totalCost;
            console.log('[RentalTx] Rental cost:', ethers.formatEther(totalCost), 'BKC');
            
            // Check user balance
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, BKC_ABI, provider);
            const balance = await bkcContract.balanceOf(userAddress);
            console.log('[RentalTx] User BKC balance:', ethers.formatEther(balance), 'BKC');
            
            if (balance < totalCost) {
                throw new Error(`Insufficient BKC balance. Need ${ethers.formatEther(totalCost)} BKC`);
            }
            
            console.log('[RentalTx] ✅ All validations passed');
        },
        
        onSuccess: async (receipt) => {
            console.log('[RentalTx] RentNFT successful:', receipt.hash);
            if (onSuccess) await onSuccess(receipt);
        },
        onError: (error) => {
            console.error('[RentalTx] RentNFT failed:', error);
            if (onError) onError(error);
        }
    });
}

/**
 * Withdraws an NFT from the marketplace (de-list)
 */
export async function withdrawNft({
    tokenId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    console.log('[RentalTx] withdrawNft called with:', { tokenId });
    
    if (tokenId === undefined || tokenId === null) {
        throw new Error('Token ID is required');
    }

    return await txEngine.execute({
        name: 'WithdrawNFT',
        button,
        
        getContract: async (signer) => {
            const contract = getRentalContract(signer);
            console.log('[RentalTx] Contract.withdrawNFT exists:', typeof contract.withdrawNFT);
            return contract;
        },
        method: 'withdrawNFT',
        args: [BigInt(tokenId)],
        
        validate: async (signer, userAddress) => {
            console.log('[RentalTx] Validating withdrawNFT for user:', userAddress);
            
            const contract = getRentalContract(signer);
            
            // V1.4: Use isActive (not active)
            const listing = await contract.getListing(tokenId);
            console.log('[RentalTx] Listing:', listing);
            
            if (!listing.isActive) {
                throw new Error('This NFT is not listed');
            }
            
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the listing owner can withdraw');
            }
            
            const isRented = await contract.isRented(tokenId);
            console.log('[RentalTx] Is rented:', isRented);
            if (isRented) {
                throw new Error('Cannot withdraw while NFT is being rented');
            }
            
            console.log('[RentalTx] ✅ Validation passed for withdrawNFT');
        },
        
        onSuccess: async (receipt) => {
            console.log('[RentalTx] WithdrawNFT successful:', receipt.hash);
            if (onSuccess) await onSuccess(receipt);
        },
        onError: (error) => {
            console.error('[RentalTx] WithdrawNFT failed:', error);
            if (onError) onError(error);
        }
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
    console.log('[RentalTx] updateListing called with:', { tokenId, pricePerHour, minHours, maxHours });
    
    ValidationLayer.rental.validateList({ tokenId, pricePerHour, minHours, maxHours });

    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'UpdateListing',
        button,
        
        getContract: async (signer) => {
            const contract = getRentalContract(signer);
            console.log('[RentalTx] Contract.updateListing exists:', typeof contract.updateListing);
            return contract;
        },
        method: 'updateListing',
        args: [BigInt(tokenId), price, BigInt(minHours), BigInt(maxHours)],
        
        validate: async (signer, userAddress) => {
            console.log('[RentalTx] Validating updateListing for user:', userAddress);
            
            const contract = getRentalContract(signer);
            
            // V1.4: Use isActive (not active)
            const listing = await contract.getListing(tokenId);
            console.log('[RentalTx] Listing:', listing);
            
            if (!listing.isActive) {
                throw new Error('This NFT is not listed');
            }
            
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the listing owner can update');
            }
            
            const isRented = await contract.isRented(tokenId);
            if (isRented) {
                throw new Error('Cannot update while NFT is being rented');
            }
            
            console.log('[RentalTx] ✅ Validation passed for updateListing');
        },
        
        onSuccess: async (receipt) => {
            console.log('[RentalTx] UpdateListing successful:', receipt.hash);
            if (onSuccess) await onSuccess(receipt);
        },
        onError: (error) => {
            console.error('[RentalTx] UpdateListing failed:', error);
            if (onError) onError(error);
        }
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets listing details for a token
 * V1.4: Fixed field names to match contract struct
 */
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
        isActive: listing.isActive,  // V1.4: Correct field name
        totalEarnings: listing.totalEarnings,
        totalEarningsFormatted: ethers.formatEther(listing.totalEarnings),
        rentalCount: Number(listing.rentalCount)
    };
}

/**
 * Gets rental details for a token
 * V1.4: Fixed field names to match contract struct
 */
export async function getRental(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const rental = await contract.getRental(tokenId);
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(rental.endTime);
    const isActive = endTime > now;
    
    return {
        tenant: rental.tenant,  // V1.4: Correct field name (was renter)
        startTime: Number(rental.startTime),
        endTime: endTime,
        paidAmount: rental.paidAmount,  // V1.4: Correct field name (was totalPaid)
        paidAmountFormatted: ethers.formatEther(rental.paidAmount),
        isActive: isActive,
        hoursRemaining: isActive ? Math.max(0, Math.ceil((endTime - now) / 3600)) : 0,
        isExpired: !isActive && endTime > 0
    };
}

/**
 * Gets all listed token IDs
 */
export async function getAllListedTokenIds() {
    const contract = await getRentalContractReadOnly();
    const ids = await contract.getAllListedTokenIds();
    return ids.map(id => Number(id));
}

/**
 * Gets rental cost for specified duration
 */
export async function getRentalCost(tokenId, hours) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const cost = await contract.getRentalCost(tokenId, hours);
    
    return {
        totalCost: cost.totalCost,
        totalCostFormatted: ethers.formatEther(cost.totalCost),
        protocolFee: cost.protocolFee,
        protocolFeeFormatted: ethers.formatEther(cost.protocolFee),
        ownerPayout: cost.ownerPayout,
        ownerPayoutFormatted: ethers.formatEther(cost.ownerPayout)
    };
}

/**
 * Checks if NFT is currently rented
 */
export async function isRented(tokenId) {
    const contract = await getRentalContractReadOnly();
    return await contract.isRented(tokenId);
}

/**
 * Gets remaining rental time in seconds
 */
export async function getRemainingRentalTime(tokenId) {
    const contract = await getRentalContractReadOnly();
    return Number(await contract.getRemainingRentalTime(tokenId));
}

/**
 * Checks if user has rental rights for an NFT
 */
export async function hasRentalRights(tokenId, userAddress) {
    const contract = await getRentalContractReadOnly();
    return await contract.hasRentalRights(tokenId, userAddress);
}

/**
 * Gets marketplace statistics
 */
export async function getMarketplaceStats() {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const stats = await contract.getMarketplaceStats();
    
    return {
        activeListings: Number(stats.activeListings),
        totalVolume: stats.totalVol,
        totalVolumeFormatted: ethers.formatEther(stats.totalVol),
        totalFees: stats.totalFees,
        totalFeesFormatted: ethers.formatEther(stats.totalFees),
        totalRentals: Number(stats.rentals)
    };
}

/**
 * Checks if marketplace is paused
 */
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
    // Write functions
    listNft,
    rentNft,
    withdrawNft,
    updateListing,
    // Aliases
    list,
    rent,
    withdraw,
    // Read helpers
    getListing,
    getRental,
    getAllListedTokenIds,
    getRentalCost,
    isRented,
    getRemainingRentalTime,
    hasRentalRights,
    getMarketplaceStats,
    isMarketplacePaused
};

export default RentalTx;