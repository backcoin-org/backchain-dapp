// modules/js/transactions/rental-tx.js
// ✅ PRODUCTION V2.0 - Updated for RentalManager V6 + Operator Support
// 
// CHANGES V2.0:
// - CRITICAL FIX: rentNFT() and rentNFTSimple() now include operator parameter
// - RENAMED: promoteListing → spotlightListing (V6 spotlight system)
// - REMOVED: getPromotionFee(), getPromotionRanking() - don't exist in V6
// - ADDED: getEffectiveSpotlight() - spotlight decay system
// - ADDED: getSpotlightConfig() - spotlight configuration
// - ADDED: getSpotlightedListings() - paginated spotlighted listings
// - ADDED: getFeeConfig() - fee configuration
// - ADDED: hasActiveRental() - Backchat integration
// - ADDED: getUserActiveRentals() - Backchat integration
// - ADDED: getListingCount() - total listings
// - FIXED: getMarketplaceStats() - now returns all V6 fields
// - Uses resolveOperator() for hybrid operator system
// - Backwards compatible (operator is optional)
//
// ============================================================================
// V6 SPOTLIGHT SYSTEM:
// - Owner pays ETH to boost listing visibility
// - Spotlight decays 1% per day (100 days max)
// - Frontend sorts by getEffectiveSpotlight() for visibility
// - ETH goes to MiningManager → Operator/Treasury
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - listNft / list: List an NFT for rent
// - rentNft / rent: Rent a listed NFT (with operator!)
// - rentNftSimple: Simple 1-hour rental (with operator!)
// - withdrawNft / withdraw: Remove NFT from marketplace
// - updateListing: Update listing price/duration
// - spotlightListing / spotlight: Pay ETH to boost visibility (V6)
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

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
    
    if (!bkcToken || !rentalMarketplace || !nftContract) {
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        RENTAL_MARKETPLACE: rentalMarketplace,
        NFT_CONTRACT: nftContract
    };
}

const RENTAL_ABI = [
    // WRITE - Listings
    'function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external',
    'function updateListing(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external',
    'function withdrawNFT(uint256 _tokenId) external',
    // WRITE - Rentals (WITH operator!)
    'function rentNFT(uint256 _tokenId, uint256 _hours, address _operator) external',
    'function rentNFTSimple(uint256 _tokenId, address _operator) external',
    // WRITE - Spotlight
    'function spotlightListing(uint256 _tokenId, address _operator) external payable',
    // READ - Listings
    'function getListing(uint256 _tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool isActive, uint256 totalEarnings, uint256 rentalCount))',
    'function getAllListedTokenIds() view returns (uint256[])',
    'function getListingCount() view returns (uint256)',
    // READ - Rentals
    'function getRental(uint256 _tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime, uint256 paidAmount))',
    'function isRented(uint256 _tokenId) view returns (bool)',
    'function getRemainingRentalTime(uint256 _tokenId) view returns (uint256)',
    'function hasRentalRights(uint256 _tokenId, address _user) view returns (bool)',
    'function getRentalCost(uint256 _tokenId, uint256 _hours) view returns (uint256 totalCost, uint256 protocolFee, uint256 ownerPayout)',
    // READ - Spotlight
    'function listingSpotlight(uint256 tokenId) view returns (uint256 totalAmount, uint256 lastSpotlightTime)',
    'function getEffectiveSpotlight(uint256 _tokenId) view returns (uint256 effectiveAmount, uint256 daysPassed)',
    'function getSpotlightedListingsPaginated(uint256 _offset, uint256 _limit) view returns (uint256[] tokenIds, uint256[] effectiveSpotlights, uint256 total)',
    'function getSpotlightConfig() view returns (uint256 decayPerDayBips, uint256 minAmount, uint256 maxDays, uint256 totalSpotlightedListings, uint256 totalCollected)',
    'function minSpotlightAmount() view returns (uint256)',
    // READ - Backchat
    'function hasActiveRental(address _user) view returns (bool)',
    'function getUserActiveRentals(address _user) view returns (uint256[] tokenIds, uint256[] endTimes)',
    // READ - Config
    'function paused() view returns (bool)',
    'function rentalFeeBips() view returns (uint256)',
    'function getFeeConfig() view returns (uint256 miningFeeBips, uint256 burnFeeBips, uint256 totalFeeBips)',
    'function getMarketplaceStats() view returns (uint256 activeListings, uint256 totalVol, uint256 totalFees, uint256 rentals, uint256 spotlightTotal, uint256 ethCollected, uint256 bkcFees)',
    // EVENTS
    'event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)',
    'event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 totalCost, uint256 protocolFee, uint256 ownerPayout, uint256 endTime, address operator)',
    'event ListingSpotlighted(uint256 indexed tokenId, address indexed owner, uint256 amount, uint256 newTotal, uint256 timestamp, address operator)'
];

const NFT_ABI = [
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function ownerOf(uint256 tokenId) view returns (address)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getRentalContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.RENTAL_MARKETPLACE, RENTAL_ABI, signer);
}

async function getRentalContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.RENTAL_MARKETPLACE, RENTAL_ABI, provider);
}

function getNftContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, signer);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

export async function listNft({
    tokenId, pricePerHour, minHours, maxHours,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'ListNFT',
        button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'listNFT',
        args: [tokenId, price, minHours, maxHours],
        
        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            const rentalContract = getRentalContract(signer);
            if (await rentalContract.paused()) {
                throw new Error('Marketplace is currently paused');
            }
            
            const isApproved = await nftContract.isApprovedForAll(userAddress, contracts.RENTAL_MARKETPLACE);
            if (!isApproved) {
                const approveTx = await nftContract.setApprovalForAll(contracts.RENTAL_MARKETPLACE, true);
                await approveTx.wait();
            }
        },
        onSuccess, onError
    });
}

export async function rentNft({
    tokenId, hours, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    let totalCost = 0n;

    return await txEngine.execute({
        name: 'RentNFT',
        button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'rentNFT',
        args: () => [tokenId, hours, resolveOperator(storedOperator)],
        
        get approval() {
            if (totalCost > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.RENTAL_MARKETPLACE, amount: totalCost };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            if (await contract.paused()) throw new Error('Marketplace is currently paused');
            
            const listing = await contract.getListing(tokenId);
            if (!listing.isActive) throw new Error('NFT is not listed for rent');
            if (hours < Number(listing.minHours) || hours > Number(listing.maxHours)) {
                throw new Error(`Hours must be between ${listing.minHours} and ${listing.maxHours}`);
            }
            if (await contract.isRented(tokenId)) throw new Error('NFT is currently rented');
            
            const cost = await contract.getRentalCost(tokenId, hours);
            totalCost = cost.totalCost;
            
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcAbi = ['function balanceOf(address) view returns (uint256)'];
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, bkcAbi, provider);
            const balance = await bkcContract.balanceOf(userAddress);
            if (balance < totalCost) throw new Error(`Insufficient BKC. Need ${ethers.formatEther(totalCost)} BKC`);
        },
        
        onSuccess: async (receipt) => {
            let rentalInfo = null;
            try {
                const iface = new ethers.Interface(RENTAL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'NFTRented') {
                            rentalInfo = {
                                endTime: Number(parsed.args.endTime),
                                totalCost: parsed.args.totalCost,
                                protocolFee: parsed.args.protocolFee,
                                ownerPayout: parsed.args.ownerPayout
                            };
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, rentalInfo);
        },
        onError
    });
}

export async function rentNftSimple({
    tokenId, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    let totalCost = 0n;

    return await txEngine.execute({
        name: 'RentNFTSimple',
        button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'rentNFTSimple',
        args: () => [tokenId, resolveOperator(storedOperator)],
        
        get approval() {
            if (totalCost > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.RENTAL_MARKETPLACE, amount: totalCost };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            if (await contract.paused()) throw new Error('Marketplace is currently paused');
            
            const listing = await contract.getListing(tokenId);
            if (!listing.isActive) throw new Error('NFT is not listed for rent');
            if (await contract.isRented(tokenId)) throw new Error('NFT is currently rented');
            
            totalCost = listing.pricePerHour;
            
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcAbi = ['function balanceOf(address) view returns (uint256)'];
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, bkcAbi, provider);
            const balance = await bkcContract.balanceOf(userAddress);
            if (balance < totalCost) throw new Error(`Insufficient BKC. Need ${ethers.formatEther(totalCost)} BKC`);
        },
        onSuccess, onError
    });
}

export async function withdrawNft({
    tokenId, button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'WithdrawNFT',
        button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'withdrawNFT',
        args: [tokenId],
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            const listing = await contract.getListing(tokenId);
            if (!listing.isActive) throw new Error('NFT is not listed');
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the owner can withdraw');
            if (await contract.isRented(tokenId)) throw new Error('Cannot withdraw while NFT is rented');
        },
        onSuccess, onError
    });
}

export async function updateListing({
    tokenId, pricePerHour, minHours, maxHours,
    button = null, onSuccess = null, onError = null
}) {
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
            if (!listing.isActive) throw new Error('NFT is not listed');
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the owner can update');
        },
        onSuccess, onError
    });
}

export async function spotlightListing({
    tokenId, amount, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const amountWei = BigInt(amount);
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'SpotlightListing',
        button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'spotlightListing',
        args: () => [tokenId, resolveOperator(storedOperator)],
        value: amountWei,
        
        validate: async (signer, userAddress) => {
            const contract = getRentalContract(signer);
            if (await contract.paused()) throw new Error('Marketplace is currently paused');
            
            const listing = await contract.getListing(tokenId);
            if (!listing.isActive) throw new Error('NFT is not listed');
            
            try {
                const minAmount = await contract.minSpotlightAmount();
                if (amountWei < minAmount) throw new Error(`Minimum spotlight is ${ethers.formatEther(minAmount)} ETH`);
            } catch (e) { if (e.message.includes('Minimum')) throw e; }
            
            const balance = await signer.provider.getBalance(userAddress);
            if (balance < amountWei + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient ETH`);
            }
        },
        onSuccess, onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
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
        isActive: listing.isActive,
        totalEarnings: listing.totalEarnings,
        totalEarningsFormatted: ethers.formatEther(listing.totalEarnings),
        rentalCount: Number(listing.rentalCount)
    };
}

export async function getRental(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const rental = await contract.getRental(tokenId);
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(rental.endTime);
    const isActive = endTime > now;
    return {
        tenant: rental.tenant,
        startTime: Number(rental.startTime),
        endTime, paidAmount: rental.paidAmount,
        paidAmountFormatted: ethers.formatEther(rental.paidAmount),
        isActive, hoursRemaining: isActive ? Math.max(0, Math.ceil((endTime - now) / 3600)) : 0
    };
}

export async function getAllListedTokenIds() {
    const contract = await getRentalContractReadOnly();
    const ids = await contract.getAllListedTokenIds();
    return ids.map(id => Number(id));
}

export async function getListingCount() {
    const contract = await getRentalContractReadOnly();
    return Number(await contract.getListingCount());
}

export async function getRentalCost(tokenId, hours) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const cost = await contract.getRentalCost(tokenId, hours);
    return {
        totalCost: cost.totalCost, totalCostFormatted: ethers.formatEther(cost.totalCost),
        protocolFee: cost.protocolFee, protocolFeeFormatted: ethers.formatEther(cost.protocolFee),
        ownerPayout: cost.ownerPayout, ownerPayoutFormatted: ethers.formatEther(cost.ownerPayout)
    };
}

export async function isRented(tokenId) {
    const contract = await getRentalContractReadOnly();
    return await contract.isRented(tokenId);
}

export async function getRemainingRentalTime(tokenId) {
    const contract = await getRentalContractReadOnly();
    return Number(await contract.getRemainingRentalTime(tokenId));
}

export async function hasRentalRights(tokenId, userAddress) {
    const contract = await getRentalContractReadOnly();
    return await contract.hasRentalRights(tokenId, userAddress);
}

export async function getEffectiveSpotlight(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    try {
        const result = await contract.getEffectiveSpotlight(tokenId);
        return { effectiveAmount: result.effectiveAmount, effectiveAmountFormatted: ethers.formatEther(result.effectiveAmount), daysPassed: Number(result.daysPassed) };
    } catch { return { effectiveAmount: 0n, effectiveAmountFormatted: '0', daysPassed: 0 }; }
}

export async function getSpotlightedListings(offset = 0, limit = 20) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    try {
        const result = await contract.getSpotlightedListingsPaginated(offset, limit);
        return {
            tokenIds: result.tokenIds.map(id => Number(id)),
            effectiveSpotlights: result.effectiveSpotlights.map(s => ({ amount: s, formatted: ethers.formatEther(s) })),
            total: Number(result.total)
        };
    } catch { return { tokenIds: [], effectiveSpotlights: [], total: 0 }; }
}

export async function getSpotlightConfig() {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    try {
        const config = await contract.getSpotlightConfig();
        return {
            decayPerDayBips: Number(config.decayPerDayBips), decayPerDayPercent: Number(config.decayPerDayBips) / 100,
            minAmount: config.minAmount, minAmountFormatted: ethers.formatEther(config.minAmount),
            maxDays: Number(config.maxDays), totalSpotlightedListings: Number(config.totalSpotlightedListings),
            totalCollected: config.totalCollected, totalCollectedFormatted: ethers.formatEther(config.totalCollected)
        };
    } catch { return { decayPerDayBips: 100, decayPerDayPercent: 1, minAmount: 0n, minAmountFormatted: '0', maxDays: 100, totalSpotlightedListings: 0, totalCollected: 0n, totalCollectedFormatted: '0' }; }
}

export async function getFeeConfig() {
    const contract = await getRentalContractReadOnly();
    try {
        const config = await contract.getFeeConfig();
        return {
            miningFeeBips: Number(config.miningFeeBips), miningFeePercent: Number(config.miningFeeBips) / 100,
            burnFeeBips: Number(config.burnFeeBips), burnFeePercent: Number(config.burnFeeBips) / 100,
            totalFeeBips: Number(config.totalFeeBips), totalFeePercent: Number(config.totalFeeBips) / 100
        };
    } catch {
        const feeBips = await contract.rentalFeeBips().catch(() => 1000);
        return { miningFeeBips: Number(feeBips), miningFeePercent: Number(feeBips) / 100, burnFeeBips: 0, burnFeePercent: 0, totalFeeBips: Number(feeBips), totalFeePercent: Number(feeBips) / 100 };
    }
}

export async function getMarketplaceStats() {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    try {
        const stats = await contract.getMarketplaceStats();
        return {
            activeListings: Number(stats.activeListings),
            totalVolume: stats.totalVol, totalVolumeFormatted: ethers.formatEther(stats.totalVol),
            totalFees: stats.totalFees, totalFeesFormatted: ethers.formatEther(stats.totalFees),
            totalRentals: Number(stats.rentals),
            totalSpotlight: stats.spotlightTotal, totalSpotlightFormatted: ethers.formatEther(stats.spotlightTotal),
            totalETHCollected: stats.ethCollected, totalETHFormatted: ethers.formatEther(stats.ethCollected),
            totalBKCFees: stats.bkcFees, totalBKCFormatted: ethers.formatEther(stats.bkcFees)
        };
    } catch { return { activeListings: 0, totalVolume: 0n, totalVolumeFormatted: '0', totalFees: 0n, totalFeesFormatted: '0', totalRentals: 0, totalSpotlight: 0n, totalSpotlightFormatted: '0', totalETHCollected: 0n, totalETHFormatted: '0', totalBKCFees: 0n, totalBKCFormatted: '0' }; }
}

export async function isMarketplacePaused() {
    const contract = await getRentalContractReadOnly();
    return await contract.paused();
}

export async function hasActiveRental(userAddress) {
    const contract = await getRentalContractReadOnly();
    try { return await contract.hasActiveRental(userAddress); } catch { return false; }
}

export async function getUserActiveRentals(userAddress) {
    const contract = await getRentalContractReadOnly();
    try {
        const result = await contract.getUserActiveRentals(userAddress);
        return result.tokenIds.map((id, i) => ({
            tokenId: Number(id), endTime: Number(result.endTimes[i]),
            hoursRemaining: Math.max(0, Math.ceil((Number(result.endTimes[i]) - Math.floor(Date.now() / 1000)) / 3600))
        }));
    } catch { return []; }
}

// ============================================================================
// 5. ALIASES
// ============================================================================

export const list = listNft;
export const rent = rentNft;
export const withdraw = withdrawNft;
export const spotlight = spotlightListing;
export const promoteListing = spotlightListing;
export const promote = spotlightListing;

// ============================================================================
// 6. EXPORT
// ============================================================================

export const RentalTx = {
    listNft, rentNft, rentNftSimple, withdrawNft, updateListing, spotlightListing,
    list, rent, withdraw, spotlight, promote, promoteListing,
    getListing, getAllListedTokenIds, getListingCount, getRentalCost,
    getRental, isRented, getRemainingRentalTime, hasRentalRights,
    getEffectiveSpotlight, getSpotlightedListings, getSpotlightConfig,
    hasActiveRental, getUserActiveRentals,
    getFeeConfig, getMarketplaceStats, isMarketplacePaused
};

export default RentalTx;