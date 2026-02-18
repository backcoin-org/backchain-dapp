// modules/js/transactions/charity-tx.js
// ✅ V2.0 - CharityPool V2: Variable-day boost + batch reads + boost revenue tracking
//
// V2.0 Changes:
// - boostCampaign() now takes days_ param (variable 1-30 days, additive expiry)
// - getCampaign() returns 10 fields (added boostExpiry uint48)
// - getCampaignsBatch() for efficient batch reads (no more N+1 queries)
// - getStats() returns 5-tuple (added totalBoostRevenue)
// - Dynamic fees via calculateFeeClientSide() (no more hardcoded 0.0001 ETH)
// - getBoostCost(days) estimates boost cost
//
// ============================================================================
// V2 FEE STRUCTURE (ETH only):
// - Create: gas-based → calculateFeeClientSide(CHARITY_CREATE)
// - Donate: value-based 5% → ecosystem deducts on-chain
// - Boost:  gas-based per day → calculateFeeClientSide(CHARITY_BOOST) × days
// - Withdraw: FREE (no fee)
// ============================================================================

import { txEngine, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const charityPool = addresses?.charityPool ||
                        contractAddresses?.charityPool ||
                        window.contractAddresses?.charityPool;

    if (!charityPool) {
        console.error('❌ CharityPool address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    return { CHARITY_POOL: charityPool };
}

/**
 * CharityPool V2 ABI
 */
const CHARITY_ABI = [
    // Write functions
    'function createCampaign(string calldata title, string calldata metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256 campaignId)',
    'function donate(uint256 campaignId, address operator) external payable',
    'function boostCampaign(uint256 campaignId, uint256 days_, address operator) external payable',
    'function closeCampaign(uint256 campaignId) external',
    'function withdraw(uint256 campaignId) external',

    // Read functions - Campaign
    'function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, uint48 boostExpiry, string memory title, string memory metadataUri)',
    'function getCampaignsBatch(uint256 start, uint256 count) view returns (address[] owners, uint48[] deadlines, uint8[] statuses, uint96[] raiseds, uint96[] goals, uint32[] donorCounts, bool[] boosteds, uint48[] boostExpiries)',
    'function canWithdraw(uint256 campaignId) view returns (bool)',
    'function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)',

    // Read functions - Stats
    'function campaignCount() view returns (uint256)',
    'function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees, uint256 totalBoostRevenue)',
    'function version() view returns (string)',

    // Events
    'event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goal, uint48 deadline, address operator)',
    'event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netDonation, address operator)',
    'event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)',
    'event CampaignClosed(uint256 indexed campaignId, address indexed creator, uint96 raised)',
    'event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount)'
];

const CampaignStatus = {
    ACTIVE: 0,
    CLOSED: 1,
    WITHDRAWN: 2
};

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getCharityContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.CHARITY_POOL, CHARITY_ABI, signer);
}

async function getCharityContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.CHARITY_POOL, CHARITY_ABI, provider);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Creates a new charity campaign
 * V2: Dynamic fee via calculateFeeClientSide
 */
export async function createCampaign({
    title,
    metadataUri = '',
    description, // backward-compat: if metadataUri not provided, use description
    goalAmount,
    durationDays,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;

    if (!title || title.trim().length === 0) throw new Error('Title is required');
    if (title.length > 100) throw new Error('Title must be 100 characters or less');
    if (durationDays < 1 || durationDays > 365) throw new Error('Duration must be between 1 and 365 days');

    const goal = BigInt(goalAmount);
    if (goal <= 0n) throw new Error('Goal amount must be greater than 0');

    const meta = metadataUri || description || '';
    let storedOperator = operator;
    let createFee = 0n;

    return await txEngine.execute({
        name: 'CreateCampaign',
        button,

        getContract: async (signer) => getCharityContract(signer),
        method: 'createCampaign',
        args: () => [title, meta, goal, BigInt(durationDays), resolveOperator(storedOperator)],

        get value() { return createFee; },

        validate: async (signer, userAddress) => {
            // V2: Dynamic fee via calculateFeeClientSide
            try {
                createFee = await calculateFeeClientSide(ethers.id('CHARITY_CREATE'));
            } catch (e) {
                console.warn('[CharityTx] calculateFeeClientSide failed, using fallback:', e.message);
                createFee = ethers.parseEther('0.0001');
            }

            if (createFee === 0n) createFee = ethers.parseEther('0.0001');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            if (ethBalance < createFee + ethers.parseEther('0.001')) {
                throw new Error('Insufficient BNB for creation fee + gas');
            }
        },

        onSuccess: async (receipt) => {
            let campaignId = null;
            try {
                const iface = new ethers.Interface(CHARITY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'CampaignCreated') {
                            campaignId = Number(parsed.args.campaignId);
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, campaignId);
        },
        onError
    });
}

/**
 * Donates ETH to a campaign
 * V2: Same structure, value-based fee deducted on-chain
 */
export async function donate({
    campaignId,
    amount,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;

    if (campaignId === undefined || campaignId === null) throw new Error('Campaign ID is required');
    const donationAmount = BigInt(amount);
    if (donationAmount <= 0n) throw new Error('Donation amount must be greater than 0');

    let storedCampaignId = campaignId;
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'Donate',
        button,

        getContract: async (signer) => getCharityContract(signer),
        method: 'donate',
        args: () => [storedCampaignId, resolveOperator(storedOperator)],
        value: donationAmount,

        validate: async (signer, userAddress) => {
            const contract = await getCharityContractReadOnly();
            const campaign = await contract.getCampaign(storedCampaignId);

            if (campaign.owner === ethers.ZeroAddress) throw new Error('Campaign not found');
            if (Number(campaign.status) !== CampaignStatus.ACTIVE) throw new Error('Campaign is not active');

            const now = Math.floor(Date.now() / 1000);
            if (Number(campaign.deadline) <= now) throw new Error('Campaign has ended');
        },

        onSuccess: async (receipt) => {
            let donationInfo = null;
            try {
                const iface = new ethers.Interface(CHARITY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'DonationMade') {
                            donationInfo = {
                                grossAmount: parsed.args.grossAmount,
                                netDonation: parsed.args.netDonation
                            };
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, donationInfo);
        },
        onError
    });
}

/**
 * Closes an active campaign (replaces cancelCampaign)
 */
export async function closeCampaign({
    campaignId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (campaignId === undefined || campaignId === null) throw new Error('Campaign ID is required');

    return await txEngine.execute({
        name: 'CloseCampaign',
        button,

        getContract: async (signer) => getCharityContract(signer),
        method: 'closeCampaign',
        args: [campaignId],

        validate: async (signer, userAddress) => {
            const contract = await getCharityContractReadOnly();
            const campaign = await contract.getCampaign(campaignId);

            if (campaign.owner === ethers.ZeroAddress) throw new Error('Campaign not found');
            if (campaign.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the campaign creator can close');
            if (Number(campaign.status) !== CampaignStatus.ACTIVE) throw new Error('Campaign is not active');
        },

        onSuccess,
        onError
    });
}

// Backward-compatible alias
export const cancelCampaign = closeCampaign;

/**
 * Withdraws funds from closed campaign
 */
export async function withdraw({
    campaignId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (campaignId === undefined || campaignId === null) throw new Error('Campaign ID is required');

    return await txEngine.execute({
        name: 'Withdraw',
        button,

        getContract: async (signer) => getCharityContract(signer),
        method: 'withdraw',
        args: [campaignId],

        validate: async (signer, userAddress) => {
            const contract = await getCharityContractReadOnly();
            const campaign = await contract.getCampaign(campaignId);

            if (campaign.owner === ethers.ZeroAddress) throw new Error('Campaign not found');
            if (campaign.owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('Only the campaign creator can withdraw');
            if (Number(campaign.status) === CampaignStatus.WITHDRAWN) throw new Error('Funds already withdrawn');

            const allowed = await contract.canWithdraw(campaignId);
            if (!allowed) throw new Error('Cannot withdraw yet — campaign must be closed or past deadline');
        },

        onSuccess: async (receipt) => {
            let withdrawInfo = null;
            try {
                const iface = new ethers.Interface(CHARITY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'FundsWithdrawn') {
                            withdrawInfo = { amount: parsed.args.amount };
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, withdrawInfo);
        },
        onError
    });
}

/**
 * Boosts a campaign for X days. Pays ETH gas-based fee per day.
 * V2: Variable days (1-30), additive expiry (stacks with existing boost)
 */
export async function boostCampaign({
    campaignId,
    days = 1,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (campaignId === undefined || campaignId === null) throw new Error('Campaign ID is required');
    if (days < 1 || days > 30) throw new Error('Boost duration must be 1-30 days');

    let storedOperator = operator;
    let totalFee = 0n;

    return await txEngine.execute({
        name: 'BoostCampaign',
        button,

        getContract: async (signer) => getCharityContract(signer),
        method: 'boostCampaign',
        args: () => [campaignId, days, resolveOperator(storedOperator)],
        get value() { return totalFee; },

        validate: async (signer, userAddress) => {
            const contract = await getCharityContractReadOnly();
            const campaign = await contract.getCampaign(campaignId);

            if (campaign.owner === ethers.ZeroAddress) throw new Error('Campaign not found');
            if (Number(campaign.status) !== CampaignStatus.ACTIVE) throw new Error('Campaign is not active');

            const now = Math.floor(Date.now() / 1000);
            if (Number(campaign.deadline) <= now) throw new Error('Campaign has ended');

            // Calculate boost cost client-side (gas-based fee × days)
            const feePerDay = await calculateFeeClientSide(ethers.id('CHARITY_BOOST'));
            totalFee = feePerDay * BigInt(days);

            if (totalFee === 0n) throw new Error('Could not calculate boost fee');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            if (ethBalance < totalFee + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(totalFee)} BNB for ${days}-day boost`);
            }
        },

        onSuccess,
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

/**
 * Gets campaign details
 * V2: Returns 10 fields (added boostExpiry)
 */
export async function getCampaign(campaignId) {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();

    const c = await contract.getCampaign(campaignId);
    const now = Math.floor(Date.now() / 1000);

    return {
        id: campaignId,
        creator: c.owner,
        title: c.title,
        metadataUri: c.metadataUri,
        goalAmount: c.goal,
        raisedAmount: c.raised,
        donationCount: Number(c.donorCount),
        deadline: Number(c.deadline),
        status: Number(c.status),
        statusName: ['ACTIVE', 'CLOSED', 'WITHDRAWN'][Number(c.status)] || 'UNKNOWN',
        isBoosted: c.isBoosted,
        boostExpiry: Number(c.boostExpiry),
        progress: c.goal > 0n ? Number((c.raised * 100n) / c.goal) : 0,
        isEnded: Number(c.deadline) < now,
        isActive: Number(c.status) === CampaignStatus.ACTIVE && Number(c.deadline) > now
    };
}

/**
 * Batch read campaign data (struct fields only, no strings)
 * Frontend must fetch titles/metadata separately or from Firebase
 */
export async function getCampaignsBatch(start, count) {
    const contract = await getCharityContractReadOnly();
    const now = Math.floor(Date.now() / 1000);

    const batch = await contract.getCampaignsBatch(start, count);
    const len = batch.owners.length;
    const campaigns = [];

    for (let i = 0; i < len; i++) {
        const id = start + i;
        const deadline = Number(batch.deadlines[i]);
        const status = Number(batch.statuses[i]);
        const goal = batch.goals[i];
        const raised = batch.raiseds[i];

        campaigns.push({
            id: String(id),
            creator: batch.owners[i],
            deadline,
            status,
            statusName: ['ACTIVE', 'CLOSED', 'WITHDRAWN'][status] || 'UNKNOWN',
            raisedAmount: raised,
            goalAmount: goal,
            donationCount: Number(batch.donorCounts[i]),
            isBoosted: batch.boosteds[i],
            boostExpiry: Number(batch.boostExpiries[i]),
            progress: goal > 0n ? Number((raised * 100n) / goal) : 0,
            isEnded: deadline < now,
            isActive: status === CampaignStatus.ACTIVE && deadline > now
        });
    }

    return campaigns;
}

export async function getCampaignCount() {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.campaignCount());
}

export async function canWithdraw(campaignId) {
    const contract = await getCharityContractReadOnly();
    return await contract.canWithdraw(campaignId);
}

/**
 * Preview donation fee calculation
 * Note: previewDonation uses on-chain calculateFee which returns 0 in eth_call.
 * Use calculateFeeClientSide for accurate preview.
 */
export async function previewDonation(amount) {
    const ethers = window.ethers;
    try {
        const fee = await calculateFeeClientSide(ethers.id('CHARITY_DONATE'), BigInt(amount));
        const net = BigInt(amount) - fee;
        return {
            fee,
            netToCampaign: net,
            feeFormatted: ethers.formatEther(fee),
            netFormatted: ethers.formatEther(net)
        };
    } catch {
        // Fallback: 5% estimate
        const val = BigInt(amount);
        const fee = val * 500n / 10000n;
        const net = val - fee;
        return {
            fee,
            netToCampaign: net,
            feeFormatted: ethers.formatEther(fee),
            netFormatted: ethers.formatEther(net)
        };
    }
}

/**
 * Estimate boost cost for X days (gas-based fee × days)
 */
export async function getBoostCost(days) {
    const ethers = window.ethers;
    const feePerDay = await calculateFeeClientSide(ethers.id('CHARITY_BOOST'));
    const totalFee = feePerDay * BigInt(days);
    return {
        feePerDay,
        feePerDayFormatted: ethers.formatEther(feePerDay),
        totalFee,
        totalFeeFormatted: ethers.formatEther(totalFee)
    };
}

/**
 * Estimate create campaign fee (gas-based)
 */
export async function getCreateFee() {
    const ethers = window.ethers;
    try {
        const fee = await calculateFeeClientSide(ethers.id('CHARITY_CREATE'));
        return {
            fee,
            feeFormatted: ethers.formatEther(fee)
        };
    } catch {
        return {
            fee: ethers.parseEther('0.0001'),
            feeFormatted: '0.0001'
        };
    }
}

/**
 * Gets global statistics
 * V2: Returns 5-tuple (added totalBoostRevenue)
 */
export async function getStats() {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();

    const stats = await contract.getStats();
    return {
        totalCampaigns: Number(stats[0]),
        totalDonated: stats[1],
        totalDonatedFormatted: ethers.formatEther(stats[1]),
        totalWithdrawn: stats[2],
        totalWithdrawnFormatted: ethers.formatEther(stats[2]),
        totalEthFees: stats[3],
        totalEthFeesFormatted: ethers.formatEther(stats[3]),
        totalBoostRevenue: stats[4],
        totalBoostRevenueFormatted: ethers.formatEther(stats[4])
    };
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const CharityTx = {
    createCampaign,
    donate,
    closeCampaign,
    cancelCampaign, // backward-compatible alias
    withdraw,
    boostCampaign,

    getCampaign,
    getCampaignsBatch,
    getCampaignCount,
    canWithdraw,
    previewDonation,
    getBoostCost,
    getCreateFee,
    getStats,

    CampaignStatus
};

export default CharityTx;
