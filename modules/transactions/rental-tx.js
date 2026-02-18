// modules/js/transactions/rental-tx.js
// ✅ V2.0 - RentalManager V2: Fixed 1-day rentals + Boost (paid visibility)
//
// V2 Changes:
//   - pricePerHour → pricePerDay (fixed 24-hour rental, no variable duration)
//   - boostListing() — pay ETH for listing visibility (stacks with existing boost)
//   - getAvailableListings() — returns tokenIds + boosted flags
//   - getListing returns (owner, pricePerDay, totalEarnings, rentalCount, currentlyRented, rentalEndTime, isBoosted, boostExpiry)
//   - getStats returns 6-tuple (added totalBoostRevenue)
//   - Removed: minHours, maxHours parameters
//
// ============================================================================

import { txEngine, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const rentalManager = addresses?.rentalManager ||
                          contractAddresses?.rentalManager ||
                          window.contractAddresses?.rentalManager;

    const nftContract = addresses?.rewardBooster ||
                        contractAddresses?.rewardBooster ||
                        window.contractAddresses?.rewardBooster;

    if (!rentalManager || !nftContract) {
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    return { RENTAL_MANAGER: rentalManager, NFT_CONTRACT: nftContract };
}

const RENTAL_ABI = [
    // Write
    'function listNFT(uint256 tokenId, uint96 pricePerDay) external',
    'function updateListing(uint256 tokenId, uint96 pricePerDay) external',
    'function withdrawNFT(uint256 tokenId) external',
    'function rentNFT(uint256 tokenId, address operator) external payable',
    'function withdrawEarnings() external',
    'function boostListing(uint256 tokenId, uint256 days_, address operator) external payable',

    // Read - Listings
    'function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerDay, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime, bool isBoosted, uint32 boostExpiry)',
    'function getAllListedTokenIds() view returns (uint256[])',
    'function getListingCount() view returns (uint256)',
    'function getAvailableListings() view returns (uint256[] tokenIds, bool[] boosted)',
    'function isAvailable(uint256 tokenId) view returns (bool)',

    // Read - Rentals
    'function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)',
    'function isRented(uint256 tokenId) view returns (bool)',
    'function getRemainingTime(uint256 tokenId) view returns (uint256)',
    'function hasActiveRental(address user) view returns (bool)',
    'function getRentalCost(uint256 tokenId) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)',

    // Read - Earnings
    'function pendingEarnings(address user) view returns (uint256)',

    // Read - Stats
    'function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn, uint256 boostRevenue)',

    // Events
    'event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerDay)',
    'event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)',
    'event ListingBoosted(uint256 indexed tokenId, address indexed owner, uint256 days_, uint256 boostCost, uint32 newBoostExpiry)',
    'event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)',
    'event EarningsWithdrawn(address indexed owner, uint256 amount)'
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
    const contracts = getContracts();
    return new window.ethers.Contract(contracts.RENTAL_MANAGER, RENTAL_ABI, signer);
}

async function getRentalContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    const contracts = getContracts();
    return new window.ethers.Contract(contracts.RENTAL_MANAGER, RENTAL_ABI, NetworkManager.getProvider());
}

function getNftContract(signer) {
    const contracts = getContracts();
    return new window.ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, signer);
}

// ============================================================================
// 3. WRITE FUNCTIONS
// ============================================================================

/**
 * List an NFT for rent with daily price. NFT is escrowed.
 * Auto re-lists after each rental (passive income).
 */
export async function listNft({
    tokenId, pricePerDay,
    button = null, onSuccess = null, onError = null
}) {
    const contracts = getContracts();
    const price = BigInt(pricePerDay);

    return await txEngine.execute({
        name: 'ListNFT', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'listNFT',
        args: [tokenId, price],

        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('You do not own this NFT');

            const isApproved = await nftContract.isApprovedForAll(userAddress, contracts.RENTAL_MANAGER);
            if (!isApproved) {
                const { NetworkManager } = await import('../core/index.js');
                const feeData = await NetworkManager.getProvider().getFeeData();
                const approveOpts = { gasLimit: 100000n };
                if (feeData.maxFeePerGas) {
                    approveOpts.maxFeePerGas = feeData.maxFeePerGas * 120n / 100n;
                    approveOpts.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
                }
                const approveTx = await nftContract.setApprovalForAll(contracts.RENTAL_MANAGER, true, approveOpts);
                await approveTx.wait();
            }
        },
        onSuccess, onError
    });
}

/**
 * Rent an NFT for 1 day (fixed 24 hours). Pays ETH (rental + ecosystem fee).
 */
export async function rentNft({
    tokenId, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let totalCost = 0n;

    return await txEngine.execute({
        name: 'RentNFT', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'rentNFT',
        args: () => [tokenId, resolveOperator(storedOperator)],
        get value() { return totalCost; },

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const listing = await contract.getListing(tokenId);

            if (listing.owner === ethers.ZeroAddress) throw new Error('NFT is not listed for rent');
            if (listing.currentlyRented) throw new Error('NFT is currently rented');

            // Check if user already has an active rental (contract enforces 1 per user)
            const alreadyRenting = await contract.hasActiveRental(userAddress);
            if (alreadyRenting) throw new Error('You already have an active rental. Wait for it to expire before renting another.');

            // V2: Fixed 1-day rental — get cost from contract + calculate fee client-side
            const cost = await contract.getRentalCost(tokenId);
            const rentalCost = cost.rentalCost || cost[0];
            const ethFee = await calculateFeeClientSide(ethers.id('RENTAL_RENT'), rentalCost);
            totalCost = rentalCost + ethFee;

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < totalCost + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient BNB. Need ${ethers.formatEther(totalCost)} BNB + gas`);
            }
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
                                rentalCost: parsed.args.rentalCost,
                                ethFee: parsed.args.ethFee
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

/**
 * Withdraw NFT from escrow. Only when not currently rented.
 */
export async function withdrawNft({
    tokenId, button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;

    return await txEngine.execute({
        name: 'WithdrawNFT', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'withdrawNFT',
        args: [tokenId],

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const listing = await contract.getListing(tokenId);
            if (listing.owner === ethers.ZeroAddress) throw new Error('NFT is not listed');
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the owner can withdraw');
            if (listing.currentlyRented) throw new Error('Cannot withdraw while NFT is rented');
        },
        onSuccess, onError
    });
}

/**
 * Withdraw accumulated ETH earnings (pull pattern).
 */
export async function withdrawEarnings({
    button = null, onSuccess = null, onError = null
} = {}) {
    const ethers = window.ethers;

    return await txEngine.execute({
        name: 'WithdrawEarnings', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'withdrawEarnings',
        args: [],

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const pending = await contract.pendingEarnings(userAddress);
            if (pending === 0n) throw new Error('No earnings to withdraw');
            console.log('[RentalTx] Withdrawing:', ethers.formatEther(pending), 'ETH');
        },
        onSuccess, onError
    });
}

/**
 * Update listing price (daily rate). Only listing owner can call.
 */
export async function updateListing({
    tokenId, pricePerDay,
    button = null, onSuccess = null, onError = null
}) {
    const price = BigInt(pricePerDay);

    return await txEngine.execute({
        name: 'UpdateListing', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'updateListing',
        args: [tokenId, price],

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const listing = await contract.getListing(tokenId);
            if (listing.owner === window.ethers.ZeroAddress) throw new Error('NFT is not listed');
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the owner can update');
        },
        onSuccess, onError
    });
}

/**
 * Boost a listing's visibility for X days. Pays ETH gas-based fee.
 * Stacks with existing boost (extends from current expiry if still active).
 */
export async function boostListing({
    tokenId, days, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let totalFee = 0n;

    return await txEngine.execute({
        name: 'BoostListing', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'boostListing',
        args: () => [tokenId, days, resolveOperator(storedOperator)],
        get value() { return totalFee; },

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const listing = await contract.getListing(tokenId);
            if (listing.owner === ethers.ZeroAddress) throw new Error('NFT is not listed');
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the listing owner can boost');

            // Calculate boost cost client-side (gas-based fee × days)
            const feePerDay = await calculateFeeClientSide(ethers.id('RENTAL_BOOST'));
            totalFee = feePerDay * BigInt(days);

            if (totalFee === 0n) throw new Error('Could not calculate boost fee');

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < totalFee + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient BNB. Need ${ethers.formatEther(totalFee)} BNB + gas`);
            }
        },

        onSuccess: async (receipt) => {
            let boostInfo = null;
            try {
                const iface = new ethers.Interface(RENTAL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'ListingBoosted') {
                            boostInfo = {
                                days: Number(parsed.args.days_),
                                boostCost: parsed.args.boostCost,
                                newBoostExpiry: Number(parsed.args.newBoostExpiry)
                            };
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, boostInfo);
        },
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

/**
 * V2: getListing returns (owner, pricePerDay, totalEarnings, rentalCount, currentlyRented, rentalEndTime, isBoosted, boostExpiry)
 */
export async function getListing(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const l = await contract.getListing(tokenId);
    return {
        owner: l.owner,
        pricePerDay: l.pricePerDay,
        pricePerDayFormatted: ethers.formatEther(l.pricePerDay),
        totalEarnings: l.totalEarnings,
        totalEarningsFormatted: ethers.formatEther(l.totalEarnings),
        rentalCount: Number(l.rentalCount),
        isActive: l.owner !== ethers.ZeroAddress,
        currentlyRented: l.currentlyRented,
        rentalEndTime: Number(l.rentalEndTime),
        isBoosted: l.isBoosted,
        boostExpiry: Number(l.boostExpiry)
    };
}

/**
 * V2: getRental returns (tenant, endTime, isActive)
 */
export async function getRental(tokenId) {
    const contract = await getRentalContractReadOnly();
    const r = await contract.getRental(tokenId);
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(r.endTime);
    return {
        tenant: r.tenant,
        endTime,
        isActive: r.isActive,
        hoursRemaining: r.isActive ? Math.max(0, Math.ceil((endTime - now) / 3600)) : 0
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

/**
 * V2: getAvailableListings — returns available (not rented) listings with boost flag
 */
export async function getAvailableListings() {
    const contract = await getRentalContractReadOnly();
    const result = await contract.getAvailableListings();
    const tokenIds = (result.tokenIds || result[0]).map(id => Number(id));
    const boosted = result.boosted || result[1];
    return tokenIds.map((id, i) => ({ tokenId: id, isBoosted: boosted[i] }));
}

/**
 * V2: getRentalCost — fixed 1-day cost (no hours param)
 */
export async function getRentalCost(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const cost = await contract.getRentalCost(tokenId);
    const rentalCost = cost.rentalCost || cost[0];
    const ethFee = await calculateFeeClientSide(ethers.id('RENTAL_RENT'), rentalCost);
    const totalCost = rentalCost + ethFee;
    return {
        rentalCost,
        rentalCostFormatted: ethers.formatEther(rentalCost),
        ethFee,
        ethFeeFormatted: ethers.formatEther(ethFee),
        totalCost,
        totalCostFormatted: ethers.formatEther(totalCost)
    };
}

/**
 * Estimate boost cost for X days (gas-based fee × days)
 */
export async function getBoostCost(days) {
    const ethers = window.ethers;
    const feePerDay = await calculateFeeClientSide(ethers.id('RENTAL_BOOST'));
    const totalFee = feePerDay * BigInt(days);
    return {
        feePerDay,
        feePerDayFormatted: ethers.formatEther(feePerDay),
        totalFee,
        totalFeeFormatted: ethers.formatEther(totalFee)
    };
}

export async function isRented(tokenId) {
    const contract = await getRentalContractReadOnly();
    return await contract.isRented(tokenId);
}

export async function getRemainingRentalTime(tokenId) {
    const contract = await getRentalContractReadOnly();
    return Number(await contract.getRemainingTime(tokenId));
}

export async function hasActiveRental(userAddress) {
    const contract = await getRentalContractReadOnly();
    try { return await contract.hasActiveRental(userAddress); } catch { return false; }
}

export async function getPendingEarnings(userAddress) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const amount = await contract.pendingEarnings(userAddress);
    return { amount, formatted: ethers.formatEther(amount) };
}

/**
 * V2: getStats returns 6-tuple (added totalBoostRevenue)
 */
export async function getMarketplaceStats() {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    try {
        const s = await contract.getStats();
        return {
            activeListings: Number(s.activeListings || s[0]),
            totalVolume: s.volume || s[1],
            totalVolumeFormatted: ethers.formatEther(s.volume || s[1]),
            totalRentals: Number(s.rentals || s[2]),
            totalEthFees: s.ethFees || s[3],
            totalEthFeesFormatted: ethers.formatEther(s.ethFees || s[3]),
            totalEarningsWithdrawn: s.earningsWithdrawn || s[4],
            totalEarningsWithdrawnFormatted: ethers.formatEther(s.earningsWithdrawn || s[4]),
            totalBoostRevenue: s.boostRevenue || s[5],
            totalBoostRevenueFormatted: ethers.formatEther(s.boostRevenue || s[5])
        };
    } catch {
        return { activeListings: 0, totalVolume: 0n, totalVolumeFormatted: '0', totalRentals: 0, totalEthFees: 0n, totalEthFeesFormatted: '0', totalBoostRevenue: 0n, totalBoostRevenueFormatted: '0' };
    }
}

// ============================================================================
// 5. ALIASES & EXPORT
// ============================================================================

export const list = listNft;
export const rent = rentNft;
export const withdraw = withdrawNft;

export const RentalTx = {
    listNft, rentNft, withdrawNft, withdrawEarnings, updateListing,
    boostListing, getBoostCost,
    list, rent, withdraw,
    getListing, getAllListedTokenIds, getListingCount, getAvailableListings,
    getRentalCost, getRental, isRented, getRemainingRentalTime,
    hasActiveRental, getPendingEarnings,
    getMarketplaceStats
};

export default RentalTx;
