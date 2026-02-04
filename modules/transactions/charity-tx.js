// modules/js/transactions/charity-tx.js
// ✅ PRODUCTION V2.0 - Updated for CharityPool V6 + Operator Support
// 
// CHANGES V2.0:
// - Added operator parameter to all write functions
// - Uses resolveOperator() for hybrid system
// - ABI updated for CharityPool V6
// - Fixed: maxActiveCampaigns (was maxActiveCampaignsPerWallet)
// - Fixed: Removed non-existent functions (minDonationAmount, calculateWithdrawal)
// - Fixed: getCampaign returns all V6 fields (boostAmount, boostTime, goalReached)
// - Added: previewDonation, getStats, getFeeConfig, isBoosted, getDonation
// - Fixed: Event signatures to match V6
// - Backwards compatible (operator is optional)
//
// ============================================================================
// FEE STRUCTURE (CharityPool V6 - NO PENALTIES):
// - Create Campaign: 1 BKC
// - Donate: 5% ETH fee → MiningManager
// - Boost: 0.5 BKC + 0.001 ETH
// - Withdraw: 0.5 BKC (Creator gets 100% of raised ETH - NO penalty)
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - createCampaign: Create a new charity campaign
// - donate: Donate ETH to a campaign
// - cancelCampaign: Cancel your campaign (creator only)
// - withdraw: Withdraw funds after campaign ends
// - boostCampaign: Boost campaign visibility
// ============================================================================

import { txEngine, ValidationLayer, CacheManager } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 */
function getContracts() {
    const charityPool = addresses?.charityPool || 
                        contractAddresses?.charityPool ||
                        window.contractAddresses?.charityPool;
    
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!charityPool) {
        console.error('❌ CharityPool address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        CHARITY_POOL: charityPool
    };
}

/**
 * CharityPool V6 ABI - with Operator support
 */
const CHARITY_ABI = [
    // ─────────────────────────────────────────────────────────────────────────
    // WRITE FUNCTIONS (all with operator where applicable)
    // ─────────────────────────────────────────────────────────────────────────
    'function createCampaign(string calldata _title, string calldata _description, uint96 _goalAmount, uint256 _durationDays, address _operator) external returns (uint256 campaignId)',
    'function donate(uint256 _campaignId, address _operator) external payable',
    'function cancelCampaign(uint256 _campaignId) external',
    'function withdraw(uint256 _campaignId, address _operator) external',
    'function boostCampaign(uint256 _campaignId, address _operator) external payable',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Campaign Data
    // ─────────────────────────────────────────────────────────────────────────
    'function campaigns(uint256 campaignId) view returns (address creator, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status)',
    'function campaignTitles(uint256 campaignId) view returns (string)',
    'function campaignDescriptions(uint256 campaignId) view returns (string)',
    'function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Donation Data
    // ─────────────────────────────────────────────────────────────────────────
    'function donations(uint256 donationId) view returns (address donor, uint64 campaignId, uint96 grossAmount, uint96 netAmount, uint64 timestamp)',
    'function getDonation(uint256 _donationId) view returns (tuple(address donor, uint64 campaignId, uint96 grossAmount, uint96 netAmount, uint64 timestamp))',
    'function getCampaignDonations(uint256 _campaignId) view returns (uint256[])',
    'function getUserDonations(address _user) view returns (uint256[])',
    'function getUserCampaigns(address _user) view returns (uint256[])',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - User Data
    // ─────────────────────────────────────────────────────────────────────────
    'function userActiveCampaigns(address user) view returns (uint8)',
    'function maxActiveCampaigns() view returns (uint8)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Fee Configuration
    // ─────────────────────────────────────────────────────────────────────────
    'function createCostBkc() view returns (uint96)',
    'function withdrawCostBkc() view returns (uint96)',
    'function donationFeeBips() view returns (uint16)',
    'function boostCostBkc() view returns (uint96)',
    'function boostCostEth() view returns (uint96)',
    'function getFeeConfig() view returns (uint96 createBkc, uint96 withdrawBkc, uint16 donationBips, uint96 boostBkc, uint96 boostEth)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Statistics
    // ─────────────────────────────────────────────────────────────────────────
    'function campaignCounter() view returns (uint64)',
    'function donationCounter() view returns (uint64)',
    'function totalRaisedAllTime() view returns (uint256)',
    'function totalDonationsAllTime() view returns (uint256)',
    'function totalFeesCollected() view returns (uint256)',
    'function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Helpers
    // ─────────────────────────────────────────────────────────────────────────
    'function previewDonation(uint256 _amount) view returns (uint256 netToCampaign, uint256 feeToProtocol)',
    'function canWithdraw(uint256 _campaignId) view returns (bool allowed, string reason)',
    'function isBoosted(uint256 _campaignId) view returns (bool)',
    'function version() view returns (string)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS - V6 Format
    // ─────────────────────────────────────────────────────────────────────────
    'event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goalAmount, uint64 deadline, address operator)',
    'event DonationMade(uint256 indexed campaignId, uint256 indexed donationId, address indexed donor, uint96 grossAmount, uint96 netAmount, uint96 feeAmount, address operator)',
    'event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint96 bkcAmount, uint96 ethAmount, address operator)',
    'event CampaignCancelled(uint256 indexed campaignId, address indexed creator, uint96 raisedAmount)',
    'event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount, address operator)',
    'event ConfigUpdated()'
];

// Campaign Status Enum
const CampaignStatus = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    WITHDRAWN: 3
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
 * 
 * @param {Object} params - Campaign parameters
 * @param {string} params.title - Campaign title (max 100 chars)
 * @param {string} params.description - Campaign description (max 1000 chars)
 * @param {string|bigint} params.goalAmount - Goal amount in wei (ETH)
 * @param {number} params.durationDays - Duration in days (1-180)
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function createCampaign({
    title,
    description,
    goalAmount,
    durationDays,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Validation
    if (!title || title.trim().length === 0) {
        throw new Error('Title is required');
    }
    if (title.length > 100) {
        throw new Error('Title must be 100 characters or less');
    }
    if (description && description.length > 1000) {
        throw new Error('Description must be 1000 characters or less');
    }
    if (durationDays < 1 || durationDays > 180) {
        throw new Error('Duration must be between 1 and 180 days');
    }

    const goal = BigInt(goalAmount);
    if (goal <= 0n) {
        throw new Error('Goal amount must be greater than 0');
    }
    
    let storedTitle = title;
    let storedDesc = description || '';
    let storedOperator = operator;
    let createCost = 0n;

    return await txEngine.execute({
        name: 'CreateCampaign',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'createCampaign',
        args: () => [storedTitle, storedDesc, goal, BigInt(durationDays), resolveOperator(storedOperator)],
        
        // BKC approval for create cost
        get approval() {
            if (createCost > 0n) {
                const contracts = getContracts();
                return {
                    token: contracts.BKC_TOKEN,
                    spender: contracts.CHARITY_POOL,
                    amount: createCost
                };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            
            // Check max campaigns
            try {
                const activeCampaigns = await contract.userActiveCampaigns(userAddress);
                const maxCampaigns = await contract.maxActiveCampaigns();
                
                if (Number(activeCampaigns) >= Number(maxCampaigns)) {
                    throw new Error(`Maximum active campaigns reached (${maxCampaigns})`);
                }
            } catch (e) {
                if (e.message.includes('Maximum')) throw e;
            }
            
            // Get create cost
            try {
                createCost = await contract.createCostBkc();
            } catch {
                createCost = ethers.parseEther('1'); // Default 1 BKC
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
 * 
 * @param {Object} params - Donation parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {bigint} params.amount - Amount to donate in wei (ETH)
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback (receives { donationId, grossAmount, netAmount, feeAmount })
 * @param {Function} [params.onError] - Error callback
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
    
    if (campaignId === undefined || campaignId === null) {
        throw new Error('Campaign ID is required');
    }
    
    const donationAmount = BigInt(amount);
    if (donationAmount <= 0n) {
        throw new Error('Donation amount must be greater than 0');
    }

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
            const contract = getCharityContract(signer);
            
            // Get campaign and check status
            try {
                const campaign = await contract.getCampaign(storedCampaignId);
                
                if (campaign.creator === ethers.ZeroAddress) {
                    throw new Error('Campaign not found');
                }
                
                if (Number(campaign.status) !== CampaignStatus.ACTIVE) {
                    throw new Error('Campaign is not active');
                }
                
                const now = Math.floor(Date.now() / 1000);
                if (Number(campaign.deadline) <= now) {
                    throw new Error('Campaign has ended');
                }
            } catch (e) {
                if (e.message.includes('Campaign') || e.message.includes('active') || e.message.includes('ended')) {
                    throw e;
                }
            }
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
                                donationId: Number(parsed.args.donationId),
                                grossAmount: parsed.args.grossAmount,
                                netAmount: parsed.args.netAmount,
                                feeAmount: parsed.args.feeAmount
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
 * Cancels an active campaign
 * Note: No operator parameter - cancelCampaign doesn't have fees
 * 
 * @param {Object} params - Cancel parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function cancelCampaign({
    campaignId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (campaignId === undefined || campaignId === null) {
        throw new Error('Campaign ID is required');
    }

    let storedCampaignId = campaignId;

    return await txEngine.execute({
        name: 'CancelCampaign',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'cancelCampaign',
        args: [storedCampaignId],
        
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            
            try {
                const campaign = await contract.getCampaign(storedCampaignId);
                
                if (campaign.creator === ethers.ZeroAddress) {
                    throw new Error('Campaign not found');
                }
                
                if (campaign.creator.toLowerCase() !== userAddress.toLowerCase()) {
                    throw new Error('Only the campaign creator can cancel');
                }
                
                if (Number(campaign.status) !== CampaignStatus.ACTIVE) {
                    throw new Error('Campaign is not active');
                }
            } catch (e) {
                if (e.message.includes('Campaign') || e.message.includes('creator') || e.message.includes('active')) {
                    throw e;
                }
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Withdraws funds from completed/cancelled campaign
 * V6: Creator gets 100% of raised ETH (NO penalties)
 * 
 * @param {Object} params - Withdraw parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function withdraw({
    campaignId,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (campaignId === undefined || campaignId === null) {
        throw new Error('Campaign ID is required');
    }

    let storedCampaignId = campaignId;
    let storedOperator = operator;
    let withdrawCost = 0n;

    return await txEngine.execute({
        name: 'Withdraw',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'withdraw',
        args: () => [storedCampaignId, resolveOperator(storedOperator)],
        
        // BKC approval for withdraw cost
        get approval() {
            if (withdrawCost > 0n) {
                const contracts = getContracts();
                return {
                    token: contracts.BKC_TOKEN,
                    spender: contracts.CHARITY_POOL,
                    amount: withdrawCost
                };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            
            try {
                const campaign = await contract.getCampaign(storedCampaignId);
                
                if (campaign.creator === ethers.ZeroAddress) {
                    throw new Error('Campaign not found');
                }
                
                if (campaign.creator.toLowerCase() !== userAddress.toLowerCase()) {
                    throw new Error('Only the campaign creator can withdraw');
                }
                
                if (Number(campaign.status) === CampaignStatus.WITHDRAWN) {
                    throw new Error('Funds already withdrawn');
                }
                
                // Check can withdraw
                const [allowed, reason] = await contract.canWithdraw(storedCampaignId);
                if (!allowed) {
                    throw new Error(reason || 'Cannot withdraw yet');
                }
            } catch (e) {
                if (e.message) throw e;
            }
            
            // Get withdraw cost
            try {
                withdrawCost = await contract.withdrawCostBkc();
            } catch {
                withdrawCost = ethers.parseEther('0.5'); // Default 0.5 BKC
            }
        },
        
        onSuccess: async (receipt) => {
            let withdrawInfo = null;
            try {
                const iface = new ethers.Interface(CHARITY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'FundsWithdrawn') {
                            withdrawInfo = {
                                amount: parsed.args.amount
                            };
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
 * 
 * @param {Object} params - Boost parameters
 * @param {number|bigint} params.campaignId - Campaign ID
 * @param {bigint} [params.ethAmount] - ETH amount (optional, uses boostCostEth if not provided)
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function boostCampaign({
    campaignId,
    ethAmount,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (campaignId === undefined || campaignId === null) {
        throw new Error('Campaign ID is required');
    }

    let storedCampaignId = campaignId;
    let storedOperator = operator;
    let boostCostBkc = 0n;
    let boostEth = ethAmount ? BigInt(ethAmount) : 0n;

    return await txEngine.execute({
        name: 'BoostCampaign',
        button,
        
        getContract: async (signer) => getCharityContract(signer),
        method: 'boostCampaign',
        args: () => [storedCampaignId, resolveOperator(storedOperator)],
        
        get value() { return boostEth; },
        
        // BKC approval for boost cost
        get approval() {
            if (boostCostBkc > 0n) {
                const contracts = getContracts();
                return {
                    token: contracts.BKC_TOKEN,
                    spender: contracts.CHARITY_POOL,
                    amount: boostCostBkc
                };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getCharityContract(signer);
            
            try {
                const campaign = await contract.getCampaign(storedCampaignId);
                
                if (campaign.creator === ethers.ZeroAddress) {
                    throw new Error('Campaign not found');
                }
                
                if (Number(campaign.status) !== CampaignStatus.ACTIVE) {
                    throw new Error('Campaign is not active');
                }
            } catch (e) {
                if (e.message.includes('Campaign') || e.message.includes('active')) {
                    throw e;
                }
            }
            
            // Get boost costs
            try {
                boostCostBkc = await contract.boostCostBkc();
                if (!ethAmount) {
                    boostEth = await contract.boostCostEth();
                }
            } catch {
                boostCostBkc = ethers.parseEther('0.5');
                if (!ethAmount) {
                    boostEth = ethers.parseEther('0.001');
                }
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
        boostAmount: campaign.boostAmount,
        boostTime: Number(campaign.boostTime),
        status: Number(campaign.status),
        statusName: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'WITHDRAWN'][Number(campaign.status)] || 'UNKNOWN',
        goalReached: campaign.goalReached,
        progress: campaign.goalAmount > 0n 
            ? Number((campaign.raisedAmount * 100n) / campaign.goalAmount) 
            : 0,
        isEnded: Number(campaign.deadline) < now,
        isActive: Number(campaign.status) === CampaignStatus.ACTIVE && Number(campaign.deadline) > now,
        isBoosted: campaign.boostTime > 0 && (now - Number(campaign.boostTime)) < 86400
    };
}

/**
 * Gets donation details
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object>} Donation data
 */
export async function getDonation(donationId) {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();
    
    const donation = await contract.getDonation(donationId);
    
    return {
        id: donationId,
        donor: donation.donor,
        campaignId: Number(donation.campaignId),
        grossAmount: donation.grossAmount,
        netAmount: donation.netAmount,
        timestamp: Number(donation.timestamp),
        grossFormatted: ethers.formatEther(donation.grossAmount),
        netFormatted: ethers.formatEther(donation.netAmount)
    };
}

/**
 * Gets campaign count
 */
export async function getCampaignCount() {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.campaignCounter());
}

/**
 * Gets donation count
 */
export async function getDonationCount() {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.donationCounter());
}

/**
 * Gets user's active campaigns count
 */
export async function getUserActiveCampaigns(userAddress) {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.userActiveCampaigns(userAddress));
}

/**
 * Gets max active campaigns per user
 */
export async function getMaxActiveCampaigns() {
    const contract = await getCharityContractReadOnly();
    return Number(await contract.maxActiveCampaigns());
}

/**
 * Gets user's campaign IDs
 */
export async function getUserCampaigns(userAddress) {
    const contract = await getCharityContractReadOnly();
    const ids = await contract.getUserCampaigns(userAddress);
    return ids.map(id => Number(id));
}

/**
 * Gets user's donation IDs
 */
export async function getUserDonations(userAddress) {
    const contract = await getCharityContractReadOnly();
    const ids = await contract.getUserDonations(userAddress);
    return ids.map(id => Number(id));
}

/**
 * Gets campaign's donation IDs
 */
export async function getCampaignDonations(campaignId) {
    const contract = await getCharityContractReadOnly();
    const ids = await contract.getCampaignDonations(campaignId);
    return ids.map(id => Number(id));
}

/**
 * Preview donation fee calculation
 * @param {bigint} amount - Donation amount in wei
 * @returns {Promise<Object>} Fee preview
 */
export async function previewDonation(amount) {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();
    
    const result = await contract.previewDonation(amount);
    
    return {
        netToCampaign: result.netToCampaign,
        feeToProtocol: result.feeToProtocol,
        netFormatted: ethers.formatEther(result.netToCampaign),
        feeFormatted: ethers.formatEther(result.feeToProtocol)
    };
}

/**
 * Check if campaign can be withdrawn
 */
export async function canWithdraw(campaignId) {
    const contract = await getCharityContractReadOnly();
    const [allowed, reason] = await contract.canWithdraw(campaignId);
    return { allowed, reason };
}

/**
 * Check if campaign is boosted (within 24h)
 */
export async function isBoosted(campaignId) {
    const contract = await getCharityContractReadOnly();
    return await contract.isBoosted(campaignId);
}

/**
 * Gets fee configuration
 * @returns {Promise<Object>} Fee config
 */
export async function getFeeConfig() {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();
    
    const config = await contract.getFeeConfig();
    
    return {
        createCostBkc: config.createBkc,
        createCostFormatted: ethers.formatEther(config.createBkc),
        withdrawCostBkc: config.withdrawBkc,
        withdrawCostFormatted: ethers.formatEther(config.withdrawBkc),
        donationFeeBips: Number(config.donationBips),
        donationFeePercent: Number(config.donationBips) / 100,
        boostCostBkc: config.boostBkc,
        boostCostBkcFormatted: ethers.formatEther(config.boostBkc),
        boostCostEth: config.boostEth,
        boostCostEthFormatted: ethers.formatEther(config.boostEth)
    };
}

/**
 * Gets global statistics
 * @returns {Promise<Object>} Stats
 */
export async function getStats() {
    const ethers = window.ethers;
    const contract = await getCharityContractReadOnly();
    
    const stats = await contract.getStats();
    
    return {
        totalCampaigns: Number(stats.totalCampaigns),
        totalRaised: stats.totalRaised,
        totalRaisedFormatted: ethers.formatEther(stats.totalRaised),
        totalDonations: Number(stats.totalDonations),
        totalFees: stats.totalFees,
        totalFeesFormatted: ethers.formatEther(stats.totalFees)
    };
}

/**
 * Gets withdrawal fee
 */
export async function getWithdrawalFee() {
    const contract = await getCharityContractReadOnly();
    try {
        return await contract.withdrawCostBkc();
    } catch {
        return 0n;
    }
}

/**
 * Gets create fee
 */
export async function getCreateFee() {
    const contract = await getCharityContractReadOnly();
    try {
        return await contract.createCostBkc();
    } catch {
        return 0n;
    }
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const CharityTx = {
    // Write functions
    createCampaign,
    donate,
    cancelCampaign,
    withdraw,
    boostCampaign,
    
    // Read helpers - Campaigns
    getCampaign,
    getCampaignCount,
    getCampaignDonations,
    canWithdraw,
    isBoosted,
    
    // Read helpers - Donations
    getDonation,
    getDonationCount,
    previewDonation,
    
    // Read helpers - Users
    getUserActiveCampaigns,
    getMaxActiveCampaigns,
    getUserCampaigns,
    getUserDonations,
    
    // Read helpers - Config & Stats
    getFeeConfig,
    getStats,
    getWithdrawalFee,
    getCreateFee,
    
    // Constants
    CampaignStatus
};

export default CharityTx;