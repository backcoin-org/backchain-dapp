// js/modules/charity-data.js
// ✅ PRODUCTION V1.1 - Charity Pool Data Module
// FIX V1.1: Corrected ABI field order to match CharityPool.sol struct
// FIX V1.1: Updated canWithdraw to allow withdrawal after cancellation

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses } from '../config.js';
import { safeContractCall } from './data.js';

// ====================================================================
// CONSTANTS & CONFIGURATION
// ====================================================================

const CACHE_DURATION_MS = 30000; // 30 seconds
const API_TIMEOUT_MS = 8000;

// Campaign Status Enum (matches smart contract)
export const CampaignStatus = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    WITHDRAWN: 3
};

export const CampaignStatusLabels = {
    [CampaignStatus.ACTIVE]: { label: 'Active', color: 'green', icon: 'fa-circle-play' },
    [CampaignStatus.COMPLETED]: { label: 'Completed', color: 'blue', icon: 'fa-circle-check' },
    [CampaignStatus.CANCELLED]: { label: 'Cancelled', color: 'red', icon: 'fa-circle-xmark' },
    [CampaignStatus.WITHDRAWN]: { label: 'Withdrawn', color: 'zinc', icon: 'fa-circle-dollar' }
};

// Categories
export const CampaignCategories = {
    ANIMAL: 'animal',
    HUMANITARIAN: 'humanitarian'
};

// ====================================================================
// CACHE
// ====================================================================

let campaignsCache = null;
let campaignsCacheTime = 0;
let statsCache = null;
let statsCacheTime = 0;

const campaignDetailCache = new Map();

// ====================================================================
// API ENDPOINTS
// ====================================================================

export const CHARITY_API = {
    getCampaigns: 'https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app',
    getCampaignDetails: 'https://getcharitycampaigndetails-4wvdcuoouq-uc.a.run.app',
    getCharityStats: 'https://getcharitystats-4wvdcuoouq-uc.a.run.app',
    getUserCampaigns: 'https://getusercampaigns-4wvdcuoouq-uc.a.run.app',
    getUserDonations: 'https://getuserdonations-4wvdcuoouq-uc.a.run.app'
};

// ====================================================================
// CONTRACT ABI (CharityPool)
// ====================================================================

export const charityPoolABI = [
    // Read Functions
    // FIXED: Correct field order matching CharityPool.sol struct Campaign
    "function campaigns(uint256 campaignId) external view returns (address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status)",
    "function donations(uint256 donationId) external view returns (address donor, uint256 campaignId, uint256 grossAmount, uint256 netAmount, uint256 timestamp)",
    "function campaignCounter() external view returns (uint256)",
    "function donationCounter() external view returns (uint256)",
    "function userActiveCampaigns(address user) external view returns (uint256)",
    "function maxActiveCampaignsPerWallet() external view returns (uint256)",
    "function minDonationAmount() external view returns (uint256)",
    "function donationMiningFeeBips() external view returns (uint256)",
    "function donationBurnFeeBips() external view returns (uint256)",
    "function withdrawalFeeETH() external view returns (uint256)",
    "function goalNotMetBurnBips() external view returns (uint256)",
    "function totalRaisedAllTime() external view returns (uint256)",
    "function totalBurnedAllTime() external view returns (uint256)",
    "function totalCampaignsCreated() external view returns (uint256)",
    "function totalSuccessfulWithdrawals() external view returns (uint256)",
    "function getCampaignDonations(uint256 campaignId, uint256 offset, uint256 limit) external view returns (uint256[] memory donationIds)",
    "function getUserCampaignIds(address user) external view returns (uint256[] memory)",
    
    // Write Functions
    "function createCampaign(string calldata _title, string calldata _description, uint256 _goalAmount, uint256 _durationDays) external returns (uint256)",
    "function donate(uint256 _campaignId, uint256 _amount) external",
    "function cancelCampaign(uint256 _campaignId) external",
    "function withdraw(uint256 _campaignId) external payable",
    
    // Events
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)",
    "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, uint256 burnedAmount)",
    "event CampaignCancelled(uint256 indexed campaignId, address indexed creator)",
    "event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount, uint256 burnedAmount, bool goalMet)"
];

// ====================================================================
// UTILITIES
// ====================================================================

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
}

function getCharityPoolContract(signerOrProvider = null) {
    const address = addresses.charityPool;
    if (!address) {
        console.warn('CharityPool address not configured');
        return null;
    }
    
    const provider = signerOrProvider || State.publicProvider;
    if (!provider) return null;
    
    try {
        return new ethers.Contract(address, charityPoolABI, provider);
    } catch (e) {
        console.error('Failed to create CharityPool contract:', e);
        return null;
    }
}

// ====================================================================
// GLOBAL STATISTICS
// ====================================================================

/**
 * Load global charity pool statistics
 * @param {boolean} forceRefresh - Force refresh from blockchain
 * @returns {Object} Global statistics
 */
export async function loadCharityStats(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && statsCache && (now - statsCacheTime < CACHE_DURATION_MS)) {
        return statsCache;
    }
    
    const contract = getCharityPoolContract();
    
    const defaultStats = {
        totalRaised: 0n,
        totalBurned: 0n,
        totalCampaigns: 0,
        totalSuccessful: 0,
        donationMiningFeeBips: 400,
        donationBurnFeeBips: 100,
        withdrawalFeeETH: ethers.parseEther("0.001"),
        goalNotMetBurnBips: 1000,
        minDonationAmount: ethers.parseEther("1"),
        maxActiveCampaignsPerWallet: 3
    };
    
    if (!contract) {
        State.charityStats = defaultStats;
        return defaultStats;
    }
    
    try {
        const [
            totalRaised,
            totalBurned,
            totalCampaigns,
            totalSuccessful,
            miningFeeBips,
            burnFeeBips,
            withdrawalFee,
            penaltyBips,
            minDonation,
            maxCampaigns
        ] = await Promise.all([
            safeContractCall(contract, 'totalRaisedAllTime', [], 0n),
            safeContractCall(contract, 'totalBurnedAllTime', [], 0n),
            safeContractCall(contract, 'totalCampaignsCreated', [], 0n),
            safeContractCall(contract, 'totalSuccessfulWithdrawals', [], 0n),
            safeContractCall(contract, 'donationMiningFeeBips', [], 400n),
            safeContractCall(contract, 'donationBurnFeeBips', [], 100n),
            safeContractCall(contract, 'withdrawalFeeETH', [], ethers.parseEther("0.001")),
            safeContractCall(contract, 'goalNotMetBurnBips', [], 1000n),
            safeContractCall(contract, 'minDonationAmount', [], ethers.parseEther("1")),
            safeContractCall(contract, 'maxActiveCampaignsPerWallet', [], 3n)
        ]);
        
        const stats = {
            totalRaised: BigInt(totalRaised.toString()),
            totalBurned: BigInt(totalBurned.toString()),
            totalCampaigns: Number(totalCampaigns),
            totalSuccessful: Number(totalSuccessful),
            donationMiningFeeBips: Number(miningFeeBips),
            donationBurnFeeBips: Number(burnFeeBips),
            withdrawalFeeETH: BigInt(withdrawalFee.toString()),
            goalNotMetBurnBips: Number(penaltyBips),
            minDonationAmount: BigInt(minDonation.toString()),
            maxActiveCampaignsPerWallet: Number(maxCampaigns)
        };
        
        statsCache = stats;
        statsCacheTime = now;
        State.charityStats = stats;
        
        return stats;
        
    } catch (e) {
        console.error('Failed to load charity stats:', e);
        State.charityStats = defaultStats;
        return defaultStats;
    }
}

// ====================================================================
// CAMPAIGN LOADING
// ====================================================================

/**
 * Load all campaigns (from Firebase or blockchain)
 * @param {Object} options - Filter options
 * @returns {Array} List of campaigns
 */
export async function loadCampaigns(options = {}) {
    const {
        category = null,
        status = null,
        creator = null,
        forceRefresh = false,
        limit = 50,
        offset = 0
    } = options;
    
    const now = Date.now();
    const cacheKey = `campaigns-${category}-${status}-${creator}-${limit}-${offset}`;
    
    console.log('🔄 loadCampaigns called with options:', options);
    
    // Check cache
    if (!forceRefresh && campaignsCache && (now - campaignsCacheTime < CACHE_DURATION_MS)) {
        console.log('📦 Returning cached campaigns:', campaignsCache.length);
        let filtered = [...campaignsCache];
        if (category) filtered = filtered.filter(c => c.category === category);
        if (status !== null) filtered = filtered.filter(c => c.status === status);
        if (creator) filtered = filtered.filter(c => c.creator.toLowerCase() === creator.toLowerCase());
        return filtered;
    }
    
    // Try Firebase API first
    try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (status !== null) params.append('status', status);
        if (creator) params.append('creator', creator);
        params.append('limit', limit);
        params.append('offset', offset);
        
        console.log('🌐 Fetching from Firebase API:', CHARITY_API.getCampaigns);
        const response = await fetchWithTimeout(`${CHARITY_API.getCampaigns}?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            const campaigns = data.campaigns || [];
            
            console.log('✅ Firebase API returned', campaigns.length, 'campaigns');
            
            // Normalize data
            const normalized = campaigns.map(c => normalizeCampaign(c));
            
            campaignsCache = normalized;
            campaignsCacheTime = now;
            State.charityCampaigns = normalized;
            
            return normalized;
        } else {
            console.warn('⚠️ Firebase API returned status:', response.status);
        }
    } catch (e) {
        console.warn('❌ Firebase API failed, falling back to blockchain:', e.message);
    }
    
    // Fallback: Load from blockchain
    console.log('🔗 Loading campaigns from blockchain...');
    return await loadCampaignsFromBlockchain(options);
}

/**
 * Load campaigns directly from blockchain
 */
async function loadCampaignsFromBlockchain(options = {}) {
    const contract = getCharityPoolContract();
    if (!contract) {
        console.error('❌ CharityPool contract not available');
        return [];
    }
    
    try {
        console.log('🔗 Querying campaignCounter from blockchain...');
        const campaignCount = await safeContractCall(contract, 'campaignCounter', [], 0n);
        const count = Number(campaignCount);
        
        console.log('📊 Total campaigns on blockchain:', count);
        
        if (count === 0) {
            console.log('ℹ️ No campaigns found on blockchain');
            return [];
        }
        
        const campaigns = [];
        const batchSize = 10;
        
        console.log(`🔄 Loading ${count} campaigns in batches of ${batchSize}...`);
        
        for (let i = 1; i <= count; i += batchSize) {
            const batch = [];
            for (let j = i; j < Math.min(i + batchSize, count + 1); j++) {
                batch.push(loadCampaignFromBlockchain(j));
            }
            const results = await Promise.allSettled(batch);
            results.forEach((r, idx) => {
                if (r.status === 'fulfilled' && r.value) {
                    campaigns.push(r.value);
                    console.log(`✅ Loaded campaign ${i + idx}:`, r.value.title, '- Status:', r.value.status);
                } else if (r.status === 'rejected') {
                    console.warn(`⚠️ Failed to load campaign ${i + idx}:`, r.reason);
                }
            });
        }
        
        console.log(`📦 Total campaigns loaded: ${campaigns.length}`);
        
        // Apply filters
        let filtered = campaigns;
        if (options.category) {
            filtered = filtered.filter(c => c.category === options.category);
            console.log(`🔍 After category filter (${options.category}): ${filtered.length}`);
        }
        if (options.status !== null && options.status !== undefined) {
            filtered = filtered.filter(c => c.status === options.status);
            console.log(`🔍 After status filter (${options.status}): ${filtered.length}`);
        }
        if (options.creator) {
            filtered = filtered.filter(c => c.creator.toLowerCase() === options.creator.toLowerCase());
            console.log(`🔍 After creator filter: ${filtered.length}`);
        }
        
        campaignsCache = campaigns;
        campaignsCacheTime = Date.now();
        State.charityCampaigns = campaigns;
        
        console.log(`✅ Returning ${filtered.length} campaigns`);
        return filtered;
        
    } catch (e) {
        console.error('❌ Failed to load campaigns from blockchain:', e);
        return [];
    }
}

/**
 * Load single campaign from blockchain
 */
async function loadCampaignFromBlockchain(campaignId) {
    const contract = getCharityPoolContract();
    if (!contract) return null;
    
    try {
        const campaign = await contract.campaigns(campaignId);
        
        // Debug: log raw response
        console.log(`🔍 Raw campaign ${campaignId} data:`, {
            field0: campaign[0],
            field1: campaign[1],
            field2: campaign[2]?.slice(0, 30),
            field3: campaign[3]?.toString(),
            field4: campaign[4]?.toString(),
            field5: campaign[5]?.toString(),
            field6: campaign[6]?.toString(),
            field7: campaign[7]?.toString(),
            field8: campaign[8]?.toString()
        });
        
        // FIXED: Correct field order matching CharityPool.sol struct
        // Order: creator, title, description, goalAmount, raisedAmount, donationCount, deadline, createdAt, status
        const normalized = {
            id: campaignId.toString(),
            creator: campaign[0],           // creator
            title: campaign[1],             // title
            description: campaign[2],       // description
            goalAmount: BigInt(campaign[3].toString()),    // goalAmount
            raisedAmount: BigInt(campaign[4].toString()),  // raisedAmount
            donationCount: Number(campaign[5]),            // donationCount
            deadline: Number(campaign[6]),                 // deadline
            createdAt: Number(campaign[7]),                // createdAt
            status: Number(campaign[8]),                   // status
            // These come from Firebase metadata
            category: 'humanitarian', // Default, override from Firebase
            imageUrl: null,
            websiteUrl: null
        };
        
        console.log(`✅ Campaign ${campaignId} normalized:`, normalized.title, 'Status:', normalized.status, 'Deadline:', new Date(normalized.deadline * 1000).toISOString());
        
        return normalized;
        
    } catch (e) {
        console.error(`❌ Failed to load campaign ${campaignId}:`, e);
        return null;
    }
}

/**
 * Load single campaign details (with metadata from Firebase)
 */
export async function loadCampaignDetails(campaignId, forceRefresh = false) {
    const cacheKey = `campaign-${campaignId}`;
    const now = Date.now();
    
    if (!forceRefresh) {
        const cached = campaignDetailCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
            return cached.value;
        }
    }
    
    // Try Firebase first
    try {
        const response = await fetchWithTimeout(`${CHARITY_API.getCampaignDetails}?id=${campaignId}`);
        if (response.ok) {
            const data = await response.json();
            const campaign = normalizeCampaign(data);
            campaignDetailCache.set(cacheKey, { value: campaign, timestamp: now });
            return campaign;
        }
    } catch (e) {
        console.warn('Failed to load from Firebase:', e.message);
    }
    
    // Fallback to blockchain
    const campaign = await loadCampaignFromBlockchain(campaignId);
    if (campaign) {
        campaignDetailCache.set(cacheKey, { value: campaign, timestamp: now });
    }
    return campaign;
}

/**
 * Normalize campaign data from various sources
 */
function normalizeCampaign(raw) {
    return {
        id: raw.id?.toString() || raw.campaignId?.toString(),
        creator: raw.creator,
        title: raw.title || 'Untitled Campaign',
        description: raw.description || '',
        goalAmount: BigInt(raw.goalAmount?.toString() || '0'),
        raisedAmount: BigInt(raw.raisedAmount?.toString() || '0'),
        deadline: Number(raw.deadline || 0),
        status: Number(raw.status ?? CampaignStatus.ACTIVE),
        donationCount: Number(raw.donationCount || 0),
        createdAt: Number(raw.createdAt || 0),
        category: raw.category || CampaignCategories.HUMANITARIAN,
        imageUrl: raw.imageUrl || raw.image || null,
        websiteUrl: raw.websiteUrl || raw.website || null,
        txHash: raw.txHash || null
    };
}

// ====================================================================
// USER DATA
// ====================================================================

/**
 * Load campaigns created by a user
 */
export async function loadUserCampaigns(userAddress, forceRefresh = false) {
    if (!userAddress) return [];
    
    return await loadCampaigns({
        creator: userAddress,
        forceRefresh
    });
}

/**
 * Load donations made by a user
 */
export async function loadUserDonations(userAddress, forceRefresh = false) {
    if (!userAddress) return [];
    
    // Try Firebase API
    try {
        const response = await fetchWithTimeout(`${CHARITY_API.getUserDonations}?address=${userAddress}`);
        if (response.ok) {
            const data = await response.json();
            return data.donations || [];
        }
    } catch (e) {
        console.warn('Failed to load user donations from API:', e.message);
    }
    
    // Fallback: Query events from blockchain
    const contract = getCharityPoolContract();
    if (!contract) return [];
    
    try {
        const filter = contract.filters.DonationReceived(null, userAddress);
        const events = await contract.queryFilter(filter, -50000);
        
        return events.map(event => ({
            campaignId: Number(event.args.campaignId),
            donor: event.args.donor,
            grossAmount: BigInt(event.args.grossAmount.toString()),
            netAmount: BigInt(event.args.netAmount.toString()),
            burnedAmount: BigInt(event.args.burnedAmount.toString()),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
        }));
        
    } catch (e) {
        console.error('Failed to load user donations:', e);
        return [];
    }
}

/**
 * Get user's active campaign count
 */
export async function getUserActiveCampaignCount(userAddress) {
    if (!userAddress) return 0;
    
    const contract = getCharityPoolContract();
    if (!contract) return 0;
    
    try {
        const count = await safeContractCall(contract, 'userActiveCampaigns', [userAddress], 0n);
        return Number(count);
    } catch (e) {
        return 0;
    }
}

/**
 * Check if user can create a new campaign
 */
export async function canUserCreateCampaign(userAddress) {
    if (!userAddress) return { canCreate: false, reason: 'Not connected' };
    
    const [activeCount, stats] = await Promise.all([
        getUserActiveCampaignCount(userAddress),
        loadCharityStats()
    ]);
    
    if (activeCount >= stats.maxActiveCampaignsPerWallet) {
        return {
            canCreate: false,
            reason: `Maximum ${stats.maxActiveCampaignsPerWallet} active campaigns per wallet`,
            activeCount,
            maxAllowed: stats.maxActiveCampaignsPerWallet
        };
    }
    
    return {
        canCreate: true,
        activeCount,
        maxAllowed: stats.maxActiveCampaignsPerWallet
    };
}

// ====================================================================
// FEE CALCULATIONS
// ====================================================================

/**
 * Calculate donation fee breakdown
 * @param {BigInt|string|number} amount - Donation amount in BKC
 * @returns {Object} Fee breakdown
 */
export async function calculateDonationFees(amount) {
    const stats = await loadCharityStats();
    
    const grossAmount = BigInt(ethers.parseEther(amount.toString()));
    const miningFee = (grossAmount * BigInt(stats.donationMiningFeeBips)) / 10000n;
    const burnFee = (grossAmount * BigInt(stats.donationBurnFeeBips)) / 10000n;
    const netAmount = grossAmount - miningFee - burnFee;
    
    return {
        grossAmount,
        miningFee,
        burnFee,
        netAmount,
        miningFeeBips: stats.donationMiningFeeBips,
        burnFeeBips: stats.donationBurnFeeBips,
        // Formatted strings for UI
        grossFormatted: ethers.formatEther(grossAmount),
        miningFeeFormatted: ethers.formatEther(miningFee),
        burnFeeFormatted: ethers.formatEther(burnFee),
        netFormatted: ethers.formatEther(netAmount)
    };
}

/**
 * Calculate withdrawal fee breakdown
 * @param {Object} campaign - Campaign object
 * @returns {Object} Withdrawal breakdown
 */
export async function calculateWithdrawalFees(campaign) {
    const stats = await loadCharityStats();
    
    const raisedAmount = BigInt(campaign.raisedAmount.toString());
    const goalAmount = BigInt(campaign.goalAmount.toString());
    const goalMet = raisedAmount >= goalAmount;
    
    let burnAmount = 0n;
    let receiveAmount = raisedAmount;
    
    if (!goalMet && raisedAmount > 0n) {
        burnAmount = (raisedAmount * BigInt(stats.goalNotMetBurnBips)) / 10000n;
        receiveAmount = raisedAmount - burnAmount;
    }
    
    return {
        raisedAmount,
        goalAmount,
        goalMet,
        burnAmount,
        receiveAmount,
        ethFee: stats.withdrawalFeeETH,
        penaltyBips: stats.goalNotMetBurnBips,
        // Formatted
        raisedFormatted: ethers.formatEther(raisedAmount),
        burnFormatted: ethers.formatEther(burnAmount),
        receiveFormatted: ethers.formatEther(receiveAmount),
        ethFeeFormatted: ethers.formatEther(stats.withdrawalFeeETH)
    };
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Calculate campaign progress percentage
 */
export function calculateProgress(raised, goal) {
    if (!goal || goal === 0n) return 0;
    try {
        const raisedNum = parseFloat(ethers.formatEther(raised || 0n));
        const goalNum = parseFloat(ethers.formatEther(goal));
        return Math.min((raisedNum / goalNum) * 100, 100);
    } catch {
        return 0;
    }
}

/**
 * Format time remaining until deadline
 */
export function formatTimeRemaining(deadline) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return { text: 'Ended', ended: true };
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return { text: `${days}d ${hours}h left`, ended: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m left`, ended: false };
    return { text: `${minutes}m left`, ended: false };
}

/**
 * Check if campaign is active and accepting donations
 */
export function isCampaignActive(campaign) {
    const now = Math.floor(Date.now() / 1000);
    return campaign.status === CampaignStatus.ACTIVE && campaign.deadline > now;
}

/**
 * Check if campaign can be withdrawn
 */
export function canWithdraw(campaign, userAddress) {
    if (!campaign || !userAddress) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const isCreator = campaign.creator.toLowerCase() === userAddress.toLowerCase();
    const hasEnded = campaign.deadline <= now;
    const isActive = campaign.status === CampaignStatus.ACTIVE;
    const isCancelled = campaign.status === CampaignStatus.CANCELLED;
    const hasFunds = campaign.raisedAmount > 0n;
    
    // Can withdraw if: creator AND has funds AND (campaign ended OR cancelled)
    return isCreator && hasFunds && ((hasEnded && isActive) || isCancelled);
}

/**
 * Clear all caches
 */
export function clearCharityCache() {
    campaignsCache = null;
    campaignsCacheTime = 0;
    statsCache = null;
    statsCacheTime = 0;
    campaignDetailCache.clear();
}

// ====================================================================
// EXPORTS
// ====================================================================

export {
    getCharityPoolContract,
    normalizeCampaign
};