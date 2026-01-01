// js/modules/charity-data.js
// ✅ PRODUCTION V2.0 - Charity Pool Data Module
// Fixed: Better error handling, proper status checks, blockchain fallback

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
    getUserDonations: 'https://getuserdonations-4wvdcuoouq-uc.a.run.app',
    // NEW: Image upload endpoint
    uploadImage: 'https://uploadcharityimage-4wvdcuoouq-uc.a.run.app'
};

// ====================================================================
// CONTRACT ABI (CharityPool)
// ====================================================================

export const charityPoolABI = [
    // Read Functions - CORRECT ORDER matching CharityPool.sol struct
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
    "function getCampaignDonations(uint256 campaignId) external view returns (uint256[] memory)",
    "function getUserDonations(address user) external view returns (uint256[] memory)",
    
    // View functions
    "function getCampaign(uint256 campaignId) external view returns (tuple(address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status))",
    "function getDonation(uint256 donationId) external view returns (tuple(address donor, uint256 campaignId, uint256 grossAmount, uint256 netAmount, uint256 timestamp))",
    "function calculateDonationFees(uint256 grossAmount) external view returns (uint256 netAmount, uint256 miningFee, uint256 burnFee)",
    "function calculateWithdrawal(uint256 campaignId) external view returns (uint256 grossAmount, uint256 netAmount, uint256 burnAmount, bool goalReached)",
    "function canWithdraw(uint256 campaignId) external view returns (bool canWithdraw_, string memory reason)",
    "function getGlobalStats() external view returns (uint256 totalCampaigns, uint256 totalRaised, uint256 totalBurned, uint256 totalWithdrawals)",
    "function getFeeConfig() external view returns (uint256 miningFeeBips, uint256 burnFeeBips, uint256 ethFee, uint256 penaltyBips)",
    
    // Write Functions
    "function createCampaign(string calldata _title, string calldata _description, uint256 _goalAmount, uint256 _durationInDays) external returns (uint256)",
    "function donate(uint256 _campaignId, uint256 _amount) external",
    "function cancelCampaign(uint256 _campaignId) external",
    "function withdraw(uint256 _campaignId) external payable",
    
    // Events
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)",
    "event DonationMade(uint256 indexed campaignId, uint256 indexed donationId, address indexed donor, uint256 grossAmount, uint256 netAmount, uint256 miningFee, uint256 burnedAmount)",
    "event CampaignCancelled(uint256 indexed campaignId, address indexed creator, uint256 raisedAmount)",
    "event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 grossAmount, uint256 netAmount, uint256 burnedAmount, bool goalReached)",
    "event TokensBurned(uint256 indexed campaignId, uint256 amount, string reason)"
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

/**
 * Normalize campaign data from blockchain or API
 */
function normalizeCampaign(data, id = null) {
    // Handle array format from blockchain
    if (Array.isArray(data) || data[0] !== undefined) {
        return {
            id: id?.toString() || data.id?.toString(),
            creator: data[0],
            title: data[1],
            description: data[2],
            goalAmount: BigInt(data[3]?.toString() || '0'),
            raisedAmount: BigInt(data[4]?.toString() || '0'),
            donationCount: Number(data[5] || 0),
            deadline: Number(data[6] || 0),
            createdAt: Number(data[7] || 0),
            status: Number(data[8] || 0),
            // Metadata (from Firebase if available)
            category: data.category || 'humanitarian',
            imageUrl: data.imageUrl || null,
            websiteUrl: data.websiteUrl || null,
            youtubeUrl: data.youtubeUrl || null,
            twitterUrl: data.twitterUrl || null,
            instagramUrl: data.instagramUrl || null,
            telegramUrl: data.telegramUrl || null
        };
    }
    
    // Handle object format from API
    return {
        id: data.id?.toString() || id?.toString(),
        creator: data.creator,
        title: data.title,
        description: data.description,
        goalAmount: BigInt(data.goalAmount?.toString() || '0'),
        raisedAmount: BigInt(data.raisedAmount?.toString() || '0'),
        donationCount: Number(data.donationCount || 0),
        deadline: Number(data.deadline || 0),
        createdAt: Number(data.createdAt || 0),
        status: Number(data.status || 0),
        category: data.category || 'humanitarian',
        imageUrl: data.imageUrl || null,
        websiteUrl: data.websiteUrl || null,
        youtubeUrl: data.youtubeUrl || null,
        twitterUrl: data.twitterUrl || null,
        instagramUrl: data.instagramUrl || null,
        telegramUrl: data.telegramUrl || null
    };
}

// ====================================================================
// GLOBAL STATISTICS
// ====================================================================

/**
 * Load global charity pool statistics
 */
export async function loadCharityStats(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && statsCache && (now - statsCacheTime < CACHE_DURATION_MS)) {
        return statsCache;
    }
    
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
    
    const contract = getCharityPoolContract();
    if (!contract) {
        State.charityStats = defaultStats;
        return defaultStats;
    }
    
    try {
        // Try using the view functions first
        const [globalStats, feeConfig] = await Promise.all([
            contract.getGlobalStats().catch(() => null),
            contract.getFeeConfig().catch(() => null)
        ]);
        
        let stats;
        
        if (globalStats && feeConfig) {
            stats = {
                totalCampaigns: Number(globalStats[0]),
                totalRaised: BigInt(globalStats[1].toString()),
                totalBurned: BigInt(globalStats[2].toString()),
                totalSuccessful: Number(globalStats[3]),
                donationMiningFeeBips: Number(feeConfig[0]),
                donationBurnFeeBips: Number(feeConfig[1]),
                withdrawalFeeETH: BigInt(feeConfig[2].toString()),
                goalNotMetBurnBips: Number(feeConfig[3]),
                minDonationAmount: ethers.parseEther("1"),
                maxActiveCampaignsPerWallet: 3
            };
        } else {
            // Fallback to individual calls
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
            
            stats = {
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
        }
        
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
 * Load all campaigns
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
    
    console.log('🔄 loadCampaigns called with options:', options);
    
    // Check cache
    if (!forceRefresh && campaignsCache && (now - campaignsCacheTime < CACHE_DURATION_MS)) {
        console.log('📦 Returning cached campaigns:', campaignsCache.length);
        return filterCampaigns(campaignsCache, { category, status, creator });
    }
    
    // Try Firebase API first
    try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (status !== null) params.append('status', status);
        if (creator) params.append('creator', creator);
        params.append('limit', limit);
        params.append('offset', offset);
        
        console.log('🌐 Fetching from Firebase API...');
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
        }
    } catch (e) {
        console.warn('❌ Firebase API failed, falling back to blockchain:', e.message);
    }
    
    // Fallback: Load from blockchain
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
        console.log('🔗 Loading campaigns from blockchain...');
        const campaignCount = await safeContractCall(contract, 'campaignCounter', [], 0n);
        const count = Number(campaignCount);
        
        console.log('📊 Total campaigns on blockchain:', count);
        
        if (count === 0) {
            return [];
        }
        
        const campaigns = [];
        const batchSize = 10;
        
        for (let i = 1; i <= count; i += batchSize) {
            const batch = [];
            for (let j = i; j < Math.min(i + batchSize, count + 1); j++) {
                batch.push(loadSingleCampaign(contract, j));
            }
            const results = await Promise.allSettled(batch);
            results.forEach((r, idx) => {
                if (r.status === 'fulfilled' && r.value) {
                    campaigns.push(r.value);
                }
            });
        }
        
        console.log(`📦 Loaded ${campaigns.length} campaigns from blockchain`);
        
        campaignsCache = campaigns;
        campaignsCacheTime = Date.now();
        State.charityCampaigns = campaigns;
        
        return filterCampaigns(campaigns, options);
        
    } catch (e) {
        console.error('❌ Failed to load campaigns from blockchain:', e);
        return [];
    }
}

/**
 * Load single campaign from blockchain
 */
async function loadSingleCampaign(contract, campaignId) {
    try {
        // Try getCampaign view function first
        try {
            const campaign = await contract.getCampaign(campaignId);
            return normalizeCampaign(campaign, campaignId);
        } catch {
            // Fallback to campaigns mapping
            const campaign = await contract.campaigns(campaignId);
            return normalizeCampaign(campaign, campaignId);
        }
    } catch (e) {
        console.warn(`Failed to load campaign ${campaignId}:`, e.message);
        return null;
    }
}

/**
 * Filter campaigns by criteria
 */
function filterCampaigns(campaigns, { category, status, creator }) {
    let filtered = [...campaigns];
    
    if (category) {
        filtered = filtered.filter(c => c.category === category);
    }
    if (status !== null && status !== undefined) {
        filtered = filtered.filter(c => c.status === status);
    }
    if (creator) {
        filtered = filtered.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());
    }
    
    return filtered;
}

/**
 * Load campaign details
 */
export async function loadCampaignDetails(campaignId) {
    // Check cache
    if (campaignDetailCache.has(campaignId)) {
        const cached = campaignDetailCache.get(campaignId);
        if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            return cached.data;
        }
    }
    
    // Try Firebase first
    try {
        const response = await fetchWithTimeout(`${CHARITY_API.getCampaignDetails}?id=${campaignId}`);
        if (response.ok) {
            const data = await response.json();
            const campaign = normalizeCampaign(data);
            campaignDetailCache.set(campaignId, { data: campaign, timestamp: Date.now() });
            return campaign;
        }
    } catch (e) {
        console.warn('Firebase campaign details failed:', e.message);
    }
    
    // Fallback to blockchain
    const contract = getCharityPoolContract();
    if (!contract) return null;
    
    const campaign = await loadSingleCampaign(contract, campaignId);
    if (campaign) {
        campaignDetailCache.set(campaignId, { data: campaign, timestamp: Date.now() });
    }
    return campaign;
}

// ====================================================================
// FEE CALCULATIONS
// ====================================================================

/**
 * Calculate donation fee breakdown
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
        grossFormatted: ethers.formatEther(grossAmount),
        miningFeeFormatted: ethers.formatEther(miningFee),
        burnFeeFormatted: ethers.formatEther(burnFee),
        netFormatted: ethers.formatEther(netAmount)
    };
}

/**
 * Calculate withdrawal fee breakdown
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
 * Check if campaign is active
 */
export function isCampaignActive(campaign) {
    const now = Math.floor(Date.now() / 1000);
    return campaign.status === CampaignStatus.ACTIVE && Number(campaign.deadline) > now;
}

/**
 * Check if campaign can be withdrawn
 */
export function canWithdraw(campaign, userAddress) {
    if (!campaign || !userAddress) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const isCreator = campaign.creator?.toLowerCase() === userAddress.toLowerCase();
    const hasEnded = Number(campaign.deadline) <= now;
    const isActive = campaign.status === CampaignStatus.ACTIVE;
    const isCancelled = campaign.status === CampaignStatus.CANCELLED;
    const hasFunds = BigInt(campaign.raisedAmount?.toString() || '0') > 0n;
    
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