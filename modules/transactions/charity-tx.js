// modules/js/transactions/charity-tx.js
// ✅ PRODUCTION V1.0 - Charity Pool Transaction Handlers
// 
// This module provides transaction functions for the CharityPool contract.
// Each function uses the transaction engine for proper validation and execution.
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - createCampaign: Create a new charity campaign
// - donate: Donate tokens to a campaign
// - cancelCampaign: Cancel your campaign (creator only)
// - withdraw: Withdraw funds after campaign ends (creator only)
// ============================================================================

import { txEngine, ValidationLayer, CacheManager } from '../core/index.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Contract addresses - import from your config or define here
 * These should match your deployed contracts on Arbitrum Sepolia
 */
const CONTRACTS = {
    BKC_TOKEN: window.ENV?.BKC_TOKEN_ADDRESS || '0x5c6d3a63F8A41F4dB91EBA04eA9B39AC2a6d8d79',
    CHARITY_POOL: window.ENV?.CHARITY_POOL_ADDRESS || '0x96310e72C42A5Dad1dEcFA6E1E5278e90e62f8c3'
};

/**
 * CharityPool ABI - only methods we need
 */
const CHARITY_ABI = [
    // Write functions
    'function createCampaign(string title, string description, uint256 goal, uint256 deadline) external returns (uint256)',
    'function donate(uint256 campaignId, uint256 amount) external',
    'function cancelCampaign(uint256 campaignId) external',
    'function withdraw(uint256 campaignId) external payable',
    
    // Read functions
    'function campaigns(uint256) view returns (address creator, string title, string description, uint256 goal, uint256 deadline, uint256 totalDonated, bool active, bool withdrawn)',
    'function campaignCount() view returns (uint256)',
    'function getUserCampaigns(address user) view returns (uint256[])',
    'function getDonations(uint256 campaignId) view returns (address[], uint256[])',
    'function withdrawalFee() view returns (uint256)',
    
    // Events
    'event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 deadline)',
    'event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 amount)',
    'event CampaignCancelled(uint256 indexed campaignId)',
    'event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount)'
];

/**
 * BKC Token ABI - for approvals
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
 * Creates CharityPool contract instance
 * @param {ethers.Signer} signer - Signer for transactions
 * @returns {ethers.Contract} Contract instance
 */
function getCharityContract(signer) {
    const ethers = window.ethers;
    return new ethers.Contract(CONTRACTS.CHARITY_POOL, CHARITY_ABI, signer);
}

/**
 * Creates BKC Token contract instance
 * @param {ethers.Signer} signer - Signer for transactions
 * @returns {ethers.Contract} Contract instance
 */
function getBkcContract(signer) {
    const ethers = window.ethers;
    return new ethers.Contract(CONTRACTS.BKC_TOKEN, BKC_ABI, signer);
}

/**
 * Calculates deadline timestamp from days
 * @param {number} days - Number of days from now
 * @returns {bigint} Unix timestamp
 */
function calculateDeadline(days) {
    const now = Math.floor(Date.now() / 1000);
    return BigInt(now + (days * 24 * 60 * 60));
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
 * 
 * @example
 * const result = await CharityTx.createCampaign({
 *     title: 'Save the Rainforest',
 *     description: 'Help us plant 1000 trees',
 *     goalAmount: ethers.parseEther('1000'),
 *     durationDays: 30,
 *     button: document.getElementById('createBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Campaign created!');
 *         loadCampaigns(); // Refresh list
 *     }
 * });
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
    const deadline = calculateDeadline(durationDays);

    return await txEngine.execute({
        name: 'CreateCampaign',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'createCampaign',
        args: [title, description, goal, deadline],
        
        onSuccess: async (receipt) => {
            // Try to extract campaign ID from event
            let campaignId = null;
            try {
                const iface = new ethers.Interface(CHARITY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'CampaignCreated') {
                            campaignId = parsed.args.campaignId;
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
 * 
 * @example
 * const result = await CharityTx.donate({
 *     campaignId: 5,
 *     amount: ethers.parseEther('100'),
 *     button: document.getElementById('donateBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Thank you for your donation!');
 *         updateCampaignProgress();
 *     }
 * });
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

    return await txEngine.execute({
        name: 'Donate',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'donate',
        args: [campaignId, donationAmount],
        
        // Token approval config
        approval: {
            token: CONTRACTS.BKC_TOKEN,
            spender: CONTRACTS.CHARITY_POOL,
            amount: donationAmount
        },
        
        // Custom validation: check campaign is active
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            const campaign = await contract.campaigns(campaignId);
            
            if (!campaign.active) {
                throw new Error('This campaign is no longer accepting donations');
            }
            
            const now = Math.floor(Date.now() / 1000);
            if (campaign.deadline <= now) {
                throw new Error('This campaign has ended');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Cancels a campaign (creator only)
 * Returns all donations to donors
 * 
 * @param {Object} params - Cancel parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await CharityTx.cancelCampaign({
 *     campaignId: 5,
 *     button: document.getElementById('cancelBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Campaign cancelled. Donations returned.');
 *     }
 * });
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
        
        // Custom validation: check user is creator
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            const campaign = await contract.campaigns(campaignId);
            
            if (campaign.creator.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the campaign creator can cancel');
            }
            
            if (!campaign.active) {
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
 * 
 * @example
 * const result = await CharityTx.withdraw({
 *     campaignId: 5,
 *     button: document.getElementById('withdrawBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Funds withdrawn successfully!');
 *     }
 * });
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
        
        // Custom validation: check campaign ended and user is creator
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            const campaign = await contract.campaigns(campaignId);
            
            if (campaign.creator.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the campaign creator can withdraw');
            }
            
            if (campaign.withdrawn) {
                throw new Error('Funds already withdrawn');
            }
            
            if (campaign.active) {
                const now = Math.floor(Date.now() / 1000);
                if (campaign.deadline > now) {
                    throw new Error('Campaign is still active. Wait for deadline.');
                }
            }
            
            // Get withdrawal fee
            withdrawalFee = await contract.withdrawalFee();
            
            // Check user has enough ETH for fee
            const ethers = window.ethers;
            const provider = signer.provider;
            const balance = await provider.getBalance(userAddress);
            
            if (balance < withdrawalFee) {
                throw new Error(`Insufficient ETH for withdrawal fee (${ethers.formatEther(withdrawalFee)} ETH required)`);
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
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.CHARITY_POOL, CHARITY_ABI, provider);
    
    const campaign = await contract.campaigns(campaignId);
    
    return {
        creator: campaign.creator,
        title: campaign.title,
        description: campaign.description,
        goal: campaign.goal,
        deadline: campaign.deadline,
        totalDonated: campaign.totalDonated,
        active: campaign.active,
        withdrawn: campaign.withdrawn,
        // Computed
        progress: campaign.goal > 0n 
            ? Number((campaign.totalDonated * 100n) / campaign.goal) 
            : 0,
        isEnded: Number(campaign.deadline) < Math.floor(Date.now() / 1000)
    };
}

/**
 * Gets total number of campaigns
 * @returns {Promise<number>} Campaign count
 */
export async function getCampaignCount() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.CHARITY_POOL, CHARITY_ABI, provider);
    
    return Number(await contract.campaignCount());
}

/**
 * Gets campaigns created by a user
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of campaign IDs
 */
export async function getUserCampaigns(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.CHARITY_POOL, CHARITY_ABI, provider);
    
    const ids = await contract.getUserCampaigns(userAddress);
    return ids.map(id => Number(id));
}

/**
 * Gets current withdrawal fee
 * @returns {Promise<bigint>} Fee in wei
 */
export async function getWithdrawalFee() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.CHARITY_POOL, CHARITY_ABI, provider);
    
    return await contract.withdrawalFee();
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
    getUserCampaigns,
    getWithdrawalFee
};

export default CharityTx;