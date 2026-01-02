// modules/js/transactions/charity-tx.js
// ✅ PRODUCTION V1.1 - FIXED: Uses dynamic addresses from config.js
// 
// CHANGES V1.1:
// - Imports addresses from config.js (loaded from deployment-addresses.json)
// - Removed hardcoded fallback addresses
// - Fixed ABI to match actual CharityPool contract
// - createCampaign now uses durationInDays instead of deadline timestamp
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - createCampaign: Create a new charity campaign
// - donate: Donate tokens to a campaign
// - cancelCampaign: Cancel your campaign (creator only)
// - withdraw: Withdraw funds after campaign ends (creator only)
// ============================================================================

import { txEngine, ValidationLayer, CacheManager } from '../core/index.js';
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
    // Try multiple sources for maximum compatibility
    const charityPool = addresses?.charityPool || 
                        contractAddresses?.charityPool ||
                        window.contractAddresses?.charityPool;
    
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!charityPool) {
        console.error('❌ CharityPool address not found!', { addresses, contractAddresses });
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        CHARITY_POOL: charityPool
    };
}

/**
 * CharityPool ABI - matches actual deployed contract
 */
const CHARITY_ABI = [
    // Write functions
    'function createCampaign(string title, string description, uint256 goalAmount, uint256 durationInDays) external returns (uint256)',
    'function donate(uint256 campaignId, uint256 amount) external',
    'function cancelCampaign(uint256 campaignId) external',
    'function withdraw(uint256 campaignId) external payable',
    
    // Read functions
    'function campaignCounter() view returns (uint256)',
    'function getCampaign(uint256 campaignId) view returns (tuple(address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status))',
    'function userActiveCampaigns(address user) view returns (uint256)',
    'function maxActiveCampaignsPerWallet() view returns (uint256)',
    'function minDonationAmount() view returns (uint256)',
    'function withdrawalFeeETH() view returns (uint256)',
    'function canWithdraw(uint256 campaignId) view returns (bool canWithdraw_, string reason)',
    'function calculateWithdrawal(uint256 campaignId) view returns (uint256 grossAmount, uint256 netAmount, uint256 burnAmount, bool goalReached)',
    
    // Events
    'event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)',
    'event DonationMade(uint256 indexed campaignId, uint256 indexed donationId, address indexed donor, uint256 grossAmount, uint256 netAmount, uint256 miningFee, uint256 burnedAmount)',
    'event CampaignCancelled(uint256 indexed campaignId, address indexed creator, uint256 raisedAmount)',
    'event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 grossAmount, uint256 netAmount, uint256 burnedAmount, bool goalReached)'
];

// Campaign Status Enum (matches contract)
const CampaignStatus = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    WITHDRAWN: 3
};

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates CharityPool contract instance
 * @param {ethers.Signer} signer - Signer for transactions
 * @returns {ethers.Contract} Contract instance
 */
function getCharityContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.CHARITY_POOL, CHARITY_ABI, signer);
}

/**
 * Creates CharityPool contract instance with provider (for read-only)
 * @returns {Promise<ethers.Contract>} Contract instance
 */
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
 * 
 * @param {Object} params - Campaign parameters
 * @param {string} params.title - Campaign title
 * @param {string} params.description - Campaign description
 * @param {string|bigint} params.goalAmount - Goal amount in tokens (wei)
 * @param {number} params.durationDays - Duration in days (1-180)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function createCampaign({
    title,
    description,
    goalAmount,
    durationDays,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Validate inputs
    ValidationLayer.charity.validateCreateCampaign({
        title,
        description,
        goalAmount,
        durationDays
    });

    // Convert values
    const goal = BigInt(goalAmount);
    const duration = BigInt(durationDays);

    return await txEngine.execute({
        name: 'CreateCampaign',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'createCampaign',
        // FIXED: Using durationInDays instead of deadline timestamp
        args: [title, description, goal, duration],
        
        // Validate user hasn't reached max campaigns
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            
            try {
                const activeCampaigns = await contract.userActiveCampaigns(userAddress);
                const maxCampaigns = await contract.maxActiveCampaignsPerWallet();
                
                if (activeCampaigns >= maxCampaigns) {
                    throw new Error(`Maximum active campaigns reached (${maxCampaigns})`);
                }
            } catch (e) {
                // If these functions don't exist, skip validation
                if (!e.message.includes('Maximum')) {
                    console.warn('Could not validate campaign limits:', e.message);
                } else {
                    throw e;
                }
            }
        },
        
        onSuccess: async (receipt) => {
            // Try to extract campaign ID from event
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

            if (onSuccess) {
                onSuccess(receipt, campaignId);
            }
        },
        onError
    });
}

/**
 * Donates tokens to a campaign
 * 
 * @param {Object} params - Donation parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {string|bigint} params.amount - Donation amount in tokens (wei)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function donate({
    campaignId,
    amount,
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Validate inputs
    ValidationLayer.charity.validateDonate({ campaignId, amount });

    const donationAmount = BigInt(amount);
    const contracts = getContracts();

    return await txEngine.execute({
        name: 'Donate',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'donate',
        args: [campaignId, donationAmount],
        
        // Token approval config - using dynamic addresses
        approval: {
            token: contracts.BKC_TOKEN,
            spender: contracts.CHARITY_POOL,
            amount: donationAmount
        },
        
        // Validate campaign is active
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            
            try {
                const campaign = await contract.getCampaign(campaignId);
                
                // Check campaign status (0 = ACTIVE)
                if (Number(campaign.status) !== CampaignStatus.ACTIVE) {
                    throw new Error('Campaign is not accepting donations');
                }
                
                // Check deadline hasn't passed
                const now = Math.floor(Date.now() / 1000);
                if (Number(campaign.deadline) < now) {
                    throw new Error('Campaign deadline has passed');
                }
                
                // Check minimum donation
                try {
                    const minDonation = await contract.minDonationAmount();
                    if (donationAmount < minDonation) {
                        const ethers = window.ethers;
                        throw new Error(`Minimum donation is ${ethers.formatEther(minDonation)} BKC`);
                    }
                } catch (e) {
                    if (e.message.includes('Minimum')) throw e;
                }
            } catch (e) {
                if (e.message.includes('Campaign') || e.message.includes('Minimum') || e.message.includes('deadline')) {
                    throw e;
                }
                console.warn('Could not validate campaign:', e.message);
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Cancels a campaign (creator only)
 * 
 * @param {Object} params - Cancel parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function cancelCampaign({
    campaignId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (campaignId === undefined || campaignId === null) {
        throw new Error('Campaign ID is required');
    }

    return await txEngine.execute({
        name: 'CancelCampaign',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'cancelCampaign',
        args: [campaignId],
        
        // Custom validation: check user is creator and campaign is active
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            const campaign = await contract.getCampaign(campaignId);
            
            if (campaign.creator.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the campaign creator can cancel');
            }
            
            if (Number(campaign.status) !== CampaignStatus.ACTIVE) {
                throw new Error('Campaign is not active');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Withdraws funds from a completed campaign (creator only)
 * Requires ETH for withdrawal fee
 * 
 * @param {Object} params - Withdraw parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function withdraw({
    campaignId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (campaignId === undefined || campaignId === null) {
        throw new Error('Campaign ID is required');
    }

    // We need to get the withdrawal fee first
    let withdrawalFee = 0n;

    return await txEngine.execute({
        name: 'Withdraw',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'withdraw',
        args: [campaignId],
        
        // ETH value for withdrawal fee (set in validate)
        get value() { return withdrawalFee; },
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            const campaign = await contract.getCampaign(campaignId);
            
            if (campaign.creator.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the campaign creator can withdraw');
            }
            
            if (Number(campaign.status) === CampaignStatus.WITHDRAWN) {
                throw new Error('Funds already withdrawn');
            }
            
            // Check if can withdraw
            try {
                const [canWithdraw_, reason] = await contract.canWithdraw(campaignId);
                if (!canWithdraw_) {
                    throw new Error(reason || 'Cannot withdraw yet');
                }
            } catch (e) {
                if (e.message.includes('Cannot') || e.message.includes('still active')) {
                    throw e;
                }
                // Fallback: check manually
                if (Number(campaign.status) === CampaignStatus.ACTIVE) {
                    const now = Math.floor(Date.now() / 1000);
                    if (Number(campaign.deadline) > now) {
                        throw new Error('Campaign is still active. Wait for deadline.');
                    }
                }
            }
            
            // Get withdrawal fee
            try {
                withdrawalFee = await contract.withdrawalFeeETH();
            } catch {
                withdrawalFee = 0n;
            }
            
            // Check user has enough ETH for fee
            if (withdrawalFee > 0n) {
                const ethers = window.ethers;
                const provider = signer.provider;
                const balance = await provider.getBalance(userAddress);
                
                if (balance < withdrawalFee) {
                    throw new Error(`Insufficient ETH for withdrawal fee (${ethers.formatEther(withdrawalFee)} ETH required)`);
                }
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
 * Gets campaign details
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign data
 */
export async function getCampaign(campaignId) {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();
    
    const campaign = await contract.getCampaign(campaignId);
    const now = Math.floor(Date.now() / 1000);
    
    return {
        id: campaignId,
        creator: campaign.creator,
        title: campaign.title,
        description: campaign.description,
        goalAmount: campaign.goalAmount,
        raisedAmount: campaign.raisedAmount,
        donationCount: Number(campaign.donationCount),
        deadline: Number(campaign.deadline),
        createdAt: Number(campaign.createdAt),
        status: Number(campaign.status),
        statusName: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'WITHDRAWN'][Number(campaign.status)] || 'UNKNOWN',
        // Computed
        progress: campaign.goalAmount > 0n 
            ? Number((campaign.raisedAmount * 100n) / campaign.goalAmount) 
            : 0,
        isEnded: Number(campaign.deadline) < now,
        isActive: Number(campaign.status) === CampaignStatus.ACTIVE && Number(campaign.deadline) > now
    };
}

/**
 * Gets total number of campaigns
 * @returns {Promise<number>} Campaign count
 */
export async function getCampaignCount() {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.campaignCounter());
}

/**
 * Gets user's active campaigns count
 * @param {string} userAddress - User address
 * @returns {Promise<number>} Active campaign count
 */
export async function getUserActiveCampaigns(userAddress) {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.userActiveCampaigns(userAddress));
}

/**
 * Gets current withdrawal fee
 * @returns {Promise<bigint>} Fee in wei
 */
export async function getWithdrawalFee() {
    const contract = await getCharityContractReadOnly();
    
    try {
        return await contract.withdrawalFeeETH();
    } catch {
        return 0n;
    }
}

/**
 * Gets minimum donation amount
 * @returns {Promise<bigint>} Minimum amount in wei
 */
export async function getMinDonationAmount() {
    const contract = await getCharityContractReadOnly();
    
    try {
        return await contract.minDonationAmount();
    } catch {
        return 0n;
    }
}

/**
 * Calculates withdrawal amounts for a campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<Object>} Withdrawal breakdown
 */
export async function calculateWithdrawal(campaignId) {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();
    
    const result = await contract.calculateWithdrawal(campaignId);
    
    return {
        grossAmount: result.grossAmount,
        netAmount: result.netAmount,
        burnAmount: result.burnAmount,
        goalReached: result.goalReached,
        // Formatted
        grossFormatted: ethers.formatEther(result.grossAmount),
        netFormatted: ethers.formatEther(result.netAmount),
        burnFormatted: ethers.formatEther(result.burnAmount)
    };
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const CharityTx = {
    createCampaign,
    donate,
    cancelCampaign,
    withdraw,
    // Read helpers
    getCampaign,
    getCampaignCount,
    getUserActiveCampaigns,
    getWithdrawalFee,
    getMinDonationAmount,
    calculateWithdrawal,
    // Constants
    CampaignStatus
};

export default CharityTx;