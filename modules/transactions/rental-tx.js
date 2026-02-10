// modules/js/transactions/rental-tx.js
// ✅ V9.0 - Updated for RentalManager V9 (ETH-only, immutable)
//
// CHANGES V9.0:
// - rewardBoosterNFT → rewardBooster
// - rentNFT now payable (ETH covers rental + ecosystem fee)
// - No BKC payments — all ETH
// - Pull-pattern earnings: withdrawEarnings() replaces direct payouts
// - Removed: rentNFTSimple, spotlight system, paused(), getFeeConfig
// - getListing returns different tuple (currentlyRented + rentalEndTime instead of isActive)
// - getRental returns (tenant, endTime, isActive) — V9 simplified struct
// - getRentalCost returns 3-tuple (rentalCost, ethFee, totalCost)
// - getStats replaces getMarketplaceStats (5-tuple)
// - getRemainingRentalTime → getRemainingTime
// - Removed: hasRentalRights
//
// ============================================================================
// V9 FEE STRUCTURE (ETH only):
// - Rental cost: ETH per hour × hours → goes to NFT owner
// - Ecosystem fee: ecosystem.calculateFee(ACTION_RENT, rentalCost) → ecosystem
// - Total msg.value = rentalCost + ecosystemFee
// ============================================================================

import { txEngine, ValidationLayer, calculateFeeClientSide } from '../core/index.js';
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
    'function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external',
    'function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external',
    'function withdrawNFT(uint256 tokenId) external',
    'function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable',
    'function withdrawEarnings() external',

    // Read - Listings
    'function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)',
    'function getAllListedTokenIds() view returns (uint256[])',
    'function getListingCount() view returns (uint256)',

    // Read - Rentals
    'function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)',
    'function isRented(uint256 tokenId) view returns (bool)',
    'function getRemainingTime(uint256 tokenId) view returns (uint256)',
    'function hasActiveRental(address user) view returns (bool)',
    'function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)',

    // Read - Earnings
    'function pendingEarnings(address user) view returns (uint256)',

    // Read - Stats
    'function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)',

    // Events
    'event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)',
    'event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)',
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
// 3. TRANSACTION FUNCTIONS
// ============================================================================

export async function listNft({
    tokenId, pricePerHour, minHours, maxHours,
    button = null, onSuccess = null, onError = null
}) {
    const contracts = getContracts();
    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'ListNFT', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'listNFT',
        args: [tokenId, price, minHours, maxHours],

        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('You do not own this NFT');

            const isApproved = await nftContract.isApprovedForAll(userAddress, contracts.RENTAL_MANAGER);
            if (!isApproved) {
                // Get fresh fee data from Alchemy (not MetaMask) with 120% buffer
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
 * Rent an NFT — V9: Payable (ETH)
 */
export async function rentNft({
    tokenId, hours, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let totalCost = 0n;

    return await txEngine.execute({
        name: 'RentNFT', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'rentNFT',
        args: () => [tokenId, hours, resolveOperator(storedOperator)],
        get value() { return totalCost; },

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const listing = await contract.getListing(tokenId);

            if (listing.owner === ethers.ZeroAddress) throw new Error('NFT is not listed for rent');
            if (listing.currentlyRented) throw new Error('NFT is currently rented');
            if (hours < Number(listing.minHours) || hours > Number(listing.maxHours)) {
                throw new Error(`Hours must be between ${listing.minHours} and ${listing.maxHours}`);
            }

            // V9: Get rental cost from contract + calculate ETH fee client-side
            const cost = await contract.getRentalCost(tokenId, hours);
            const rentalCost = cost.rentalCost || cost[0];
            const ethFee = await calculateFeeClientSide(ethers.id('RENTAL_RENT'), rentalCost);
            totalCost = rentalCost + ethFee;

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < totalCost + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient ETH. Need ${ethers.formatEther(totalCost)} ETH + gas`);
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
 * V9 NEW: Withdraw accumulated ETH earnings (pull pattern)
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

export async function updateListing({
    tokenId, pricePerHour, minHours, maxHours,
    button = null, onSuccess = null, onError = null
}) {
    const price = BigInt(pricePerHour);

    return await txEngine.execute({
        name: 'UpdateListing', button,
        getContract: async (signer) => getRentalContract(signer),
        method: 'updateListing',
        args: [tokenId, price, minHours, maxHours],

        validate: async (signer, userAddress) => {
            const contract = await getRentalContractReadOnly();
            const listing = await contract.getListing(tokenId);
            if (listing.owner === window.ethers.ZeroAddress) throw new Error('NFT is not listed');
            if (listing.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the owner can update');
        },
        onSuccess, onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

/**
 * V9: getListing returns (owner, pricePerHour, minHours, maxHours, totalEarnings, rentalCount, currentlyRented, rentalEndTime)
 */
export async function getListing(tokenId) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const l = await contract.getListing(tokenId);
    return {
        owner: l.owner,
        pricePerHour: l.pricePerHour,
        pricePerHourFormatted: ethers.formatEther(l.pricePerHour),
        minHours: Number(l.minHours),
        maxHours: Number(l.maxHours),
        totalEarnings: l.totalEarnings,
        totalEarningsFormatted: ethers.formatEther(l.totalEarnings),
        rentalCount: Number(l.rentalCount),
        isActive: l.owner !== ethers.ZeroAddress,
        currentlyRented: l.currentlyRented,
        rentalEndTime: Number(l.rentalEndTime)
    };
}

/**
 * V9: getRental returns (tenant, endTime, isActive)
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
 * V9: getRentalCost returns 3-tuple (rentalCost, ethFee, totalCost)
 */
export async function getRentalCost(tokenId, hours) {
    const ethers = window.ethers;
    const contract = await getRentalContractReadOnly();
    const cost = await contract.getRentalCost(tokenId, hours);
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
 * V9: getStats returns 5-tuple (activeListings, volume, rentals, ethFees, earningsWithdrawn)
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
            totalEarningsWithdrawnFormatted: ethers.formatEther(s.earningsWithdrawn || s[4])
        };
    } catch {
        return { activeListings: 0, totalVolume: 0n, totalVolumeFormatted: '0', totalRentals: 0, totalEthFees: 0n, totalEthFeesFormatted: '0' };
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
    list, rent, withdraw,
    getListing, getAllListedTokenIds, getListingCount, getRentalCost,
    getRental, isRented, getRemainingRentalTime,
    hasActiveRental, getPendingEarnings,
    getMarketplaceStats
};

export default RentalTx;
