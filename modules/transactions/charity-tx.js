// modules/js/transactions/charity-tx.js
// ✅ V9.0 - Updated for CharityPool V9 (ETH-only, immutable)
//
// CHANGES V9.0:
// - ETH-only fees (no BKC fees for create/withdraw/boost)
// - createCampaign() now payable (ETH fee), uses metadataUri instead of description
// - cancelCampaign() → closeCampaign() (renamed)
// - withdraw() no longer takes operator param
// - getCampaign() returns V9 9-tuple (owner, deadline, status, raised, goal, donorCount, isBoosted, title, metadataUri)
// - canWithdraw() returns just bool (not tuple with reason)
// - previewDonation() returns (fee, netToCampaign) — reversed order
// - getStats() returns 4-tuple (campaignCount, totalDonated, totalWithdrawn, totalEthFees)
// - CampaignStatus: ACTIVE=0, CLOSED=1, WITHDRAWN=2 (no COMPLETED/CANCELLED)
// - Removed: BKC approval, createCostBkc, withdrawCostBkc, boostCostBkc
// - All fees via ecosystem.calculateFee()
//
// ============================================================================
// V9 FEE STRUCTURE (ETH only):
// - Create: ecosystem.calculateFee(ACTION_CREATE, 0)
// - Donate: value-based fee → ecosystem.calculateFee(ACTION_DONATE, msgValue)
// - Boost:  ecosystem.calculateFee(ACTION_BOOST, 0)
// - Withdraw: FREE (no fee)
// ============================================================================

import { txEngine, ValidationLayer, CacheManager } from '../core/index.js';
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
 * CharityPool V9 ABI
 */
const CHARITY_ABI = [
    // Write functions
    'function createCampaign(string calldata title, string calldata metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256 campaignId)',
    'function donate(uint256 campaignId, address operator) external payable',
    'function boostCampaign(uint256 campaignId, address operator) external payable',
    'function closeCampaign(uint256 campaignId) external',
    'function withdraw(uint256 campaignId) external',

    // Read functions - Campaign
    'function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string memory title, string memory metadataUri)',
    'function canWithdraw(uint256 campaignId) view returns (bool)',
    'function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)',

    // Read functions - Stats
    'function campaignCount() view returns (uint256)',
    'function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)',
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
 * V9: Payable (ETH fee), uses metadataUri instead of description
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
            // Fetch create fee from contract
            const contract = await getCharityContractReadOnly();
            try {
                // V9: fee comes from ecosystem.calculateFee — we estimate via provider
                const { NetworkManager } = await import('../core/index.js');
                const provider = NetworkManager.getProvider();

                // Try to get fee estimate (contract will revert if insufficient)
                // Use a reasonable default
                createFee = ethers.parseEther('0.0001');

                const ethBalance = await provider.getBalance(userAddress);
                if (ethBalance < createFee + ethers.parseEther('0.001')) {
                    throw new Error(`Insufficient ETH for creation fee + gas`);
                }
            } catch (e) {
                if (e.message.includes('Insufficient')) throw e;
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
 * V9: Same structure, value-based fee
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
 * V9: closeCampaign — creator can still withdraw raised funds
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
 * V9: No operator, no BKC fee — FREE withdrawal
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
 * Boosts a campaign for visibility
 * V9: ETH-only (no BKC cost)
 */
export async function boostCampaign({
    campaignId,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (campaignId === undefined || campaignId === null) throw new Error('Campaign ID is required');

    let storedOperator = operator;
    // V9: boost fee from ecosystem — use reasonable minimum
    let boostFee = ethers.parseEther('0.0001');

    return await txEngine.execute({
        name: 'BoostCampaign',
        button,

        getContract: async (signer) => getCharityContract(signer),
        method: 'boostCampaign',
        args: () => [campaignId, resolveOperator(storedOperator)],
        get value() { return boostFee; },

        validate: async (signer, userAddress) => {
            const contract = await getCharityContractReadOnly();
            const campaign = await contract.getCampaign(campaignId);

            if (campaign.owner === ethers.ZeroAddress) throw new Error('Campaign not found');
            if (Number(campaign.status) !== CampaignStatus.ACTIVE) throw new Error('Campaign is not active');

            const now = Math.floor(Date.now() / 1000);
            if (Number(campaign.deadline) <= now) throw new Error('Campaign has ended');
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
 * V9: Returns (owner, deadline, status, raised, goal, donorCount, isBoosted, title, metadataUri)
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
        progress: c.goal > 0n ? Number((c.raised * 100n) / c.goal) : 0,
        isEnded: Number(c.deadline) < now,
        isActive: Number(c.status) === CampaignStatus.ACTIVE && Number(c.deadline) > now
    };
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
 * V9: Returns (fee, netToCampaign)
 */
export async function previewDonation(amount) {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();

    const result = await contract.previewDonation(amount);
    return {
        fee: result.fee || result[0],
        netToCampaign: result.netToCampaign || result[1],
        feeFormatted: ethers.formatEther(result.fee || result[0]),
        netFormatted: ethers.formatEther(result.netToCampaign || result[1])
    };
}

/**
 * Gets global statistics
 * V9: Returns (campaignCount, totalDonated, totalWithdrawn, totalEthFees)
 */
export async function getStats() {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();

    const stats = await contract.getStats();
    return {
        totalCampaigns: Number(stats.campaignCount || stats[0]),
        totalDonated: stats.totalDonated || stats[1],
        totalDonatedFormatted: ethers.formatEther(stats.totalDonated || stats[1]),
        totalWithdrawn: stats.totalWithdrawn || stats[2],
        totalWithdrawnFormatted: ethers.formatEther(stats.totalWithdrawn || stats[2]),
        totalEthFees: stats.totalEthFees || stats[3],
        totalEthFeesFormatted: ethers.formatEther(stats.totalEthFees || stats[3])
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
    getCampaignCount,
    canWithdraw,
    previewDonation,
    getStats,

    CampaignStatus
};

export default CharityTx;
