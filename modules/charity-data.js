// js/modules/charity-data.js
// ✅ PRODUCTION V3.0 - Robust Data Loading with Retry + Status Normalization
// Based on data.js patterns for maximum reliability

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses } from '../config.js';

// ====================================================================
// CONSTANTS & CONFIGURATION
// ====================================================================

const CACHE_DURATION_MS = 30000; // 30 seconds
const API_TIMEOUT_MS = 8000;
const CONTRACT_READ_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Campaign Status Enum (matches smart contract)
export const CampaignStatus = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    WITHDRAWN: 3
};

// Status string to number map
const StatusMap = {
    'ACTIVE': 0,
    'COMPLETED': 1,
    'CANCELLED': 2,
    'WITHDRAWN': 3
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
const contractReadCache = new Map();

// ====================================================================
// API ENDPOINTS
// ====================================================================

export const CHARITY_API = {
    getCampaigns: 'https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app',
    getCampaignDetails: 'https://getcharitycampaigndetails-4wvdcuoouq-uc.a.run.app',
    getCharityStats: 'https://getcharitystats-4wvdcuoouq-uc.a.run.app',
    getUserCampaigns: 'https://getusercampaigns-4wvdcuoouq-uc.a.run.app',
    getUserDonations: 'https://getuserdonations-4wvdcuoouq-uc.a.run.app',
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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// ====================================================================
// RPC SAFETY FUNCTIONS (Based on data.js patterns)
// ====================================================================

function isRateLimitError(e) {
    return (
        e?.error?.code === 429 || 
        e?.code === 429 ||
        (e.message && (e.message.includes("429") || e.message.includes("Too Many Requests") || e.message.includes("rate limit")))
    );
}

function isRpcError(e) {
    const errorCode = e?.error?.code || e?.code;
    return (
        errorCode === -32603 ||
        errorCode === -32000 ||
        e.message?.includes("Internal JSON-RPC")
    );
}

// ====================================================================
// SAFE CONTRACT CALL WITH CACHE & RETRY
// ====================================================================

export async function safeContractCall(
    contract, 
    method, 
    args = [], 
    fallbackValue = null, 
    retries = CONTRACT_READ_RETRIES, 
    forceRefresh = false
) {
    if (!contract) return fallbackValue;

    const contractAddr = contract.target || contract.address;
    const serializedArgs = JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    const cacheKey = `charity-${contractAddr}-${method}-${serializedArgs}`;
    const now = Date.now();

    // Check cache
    if (!forceRefresh) {
        const cached = contractReadCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
            return cached.value;
        }
    }

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await contract[method](...args);
            contractReadCache.set(cacheKey, { value: result, timestamp: now });
            return result;

        } catch (e) {
            lastError = e;
            
            if (isRateLimitError(e) && attempt < retries) {
                const jitter = Math.floor(Math.random() * 500);
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt) + jitter;
                console.warn(`Rate limit hit, retrying in ${delay}ms...`);
                await wait(delay);
                continue;
            }
            
            if (isRpcError(e) && attempt < retries) {
                console.warn(`RPC error, retrying...`);
                await wait(RETRY_DELAY_MS);
                continue;
            }
            
            break;
        }
    }
    
    console.warn(`safeContractCall ${method} failed:`, lastError?.message);
    return fallbackValue;
}

// ====================================================================
// CONTRACT HELPER
// ====================================================================

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
// STATUS NORMALIZATION (Handles both string "ACTIVE" and number 0)
// ====================================================================

/**
 * Normalize status to number (handles both string "ACTIVE" and number 0)
 */
export function normalizeStatus(status) {
    if (typeof status === 'number') return status;
    if (typeof status === 'string') {
        // Check if it's a string number like "0"
        if (!isNaN(parseInt(status))) return parseInt(status);
        // Check if it's a status name like "ACTIVE"
        return StatusMap[status.toUpperCase()] ?? 0;
    }
    return 0;
}

// ====================================================================
// CAMPAIGN DATA NORMALIZATION
// ====================================================================

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
            status: normalizeStatus(data[8]),
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
        status: normalizeStatus(data.status),
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
// LOAD CHARITY STATS
// ====================================================================

export async function loadCharityStats(forceRefresh = false) {
    const now = Date.now();
    
    // Check cache
    if (!forceRefresh && statsCache && (now - statsCacheTime < CACHE_DURATION_MS)) {
        return statsCache;
    }
    
    // Default stats
    const defaultStats = {
        totalCampaigns: 0,
        totalRaised: 0n,
        totalBurned: 0n,
        totalSuccessful: 0,
        donationMiningFeeBips: 400,  // 4%
        donationBurnFeeBips: 100,    // 1%
        withdrawalFeeETH: ethers.parseEther("0.0001"),
        goalNotMetBurnBips: 500      // 5%
    };
    
    // Try Firebase first
    try {
        const response = await fetchWithTimeout(CHARITY_API.getCharityStats);
        if (response.ok) {
            const data = await response.json();
            const stats = {
                totalCampaigns: Number(data.totalCampaigns || 0),
                totalRaised: BigInt(data.totalRaised?.toString() || '0'),
                totalBurned: BigInt(data.totalBurned?.toString() || '0'),
                totalSuccessful: Number(data.totalSuccessful || 0),
                donationMiningFeeBips: Number(data.donationMiningFeeBips || 400),
                donationBurnFeeBips: Number(data.donationBurnFeeBips || 100),
                withdrawalFeeETH: BigInt(data.withdrawalFeeETH?.toString() || ethers.parseEther("0.0001").toString()),
                goalNotMetBurnBips: Number(data.goalNotMetBurnBips || 500)
            };
            
            statsCache = stats;
            statsCacheTime = now;
            return stats;
        }
    } catch (e) {
        console.warn('Firebase stats failed:', e.message);
    }
    
    // Fallback to blockchain
    const contract = getCharityPoolContract();
    if (!contract) {
        return defaultStats;
    }
    
    try {
        const [
            totalCampaigns,
            totalRaised,
            totalBurned,
            totalSuccessful,
            miningFee,
            burnFee,
            ethFee,
            penalty
        ] = await Promise.all([
            safeContractCall(contract, 'totalCampaignsCreated', [], 0n),
            safeContractCall(contract, 'totalRaisedAllTime', [], 0n),
            safeContractCall(contract, 'totalBurnedAllTime', [], 0n),
            safeContractCall(contract, 'totalSuccessfulWithdrawals', [], 0n),
            safeContractCall(contract, 'donationMiningFeeBips', [], 400n),
            safeContractCall(contract, 'donationBurnFeeBips', [], 100n),
            safeContractCall(contract, 'withdrawalFeeETH', [], ethers.parseEther("0.0001")),
            safeContractCall(contract, 'goalNotMetBurnBips', [], 500n)
        ]);
        
        const stats = {
            totalCampaigns: Number(totalCampaigns),
            totalRaised: BigInt(totalRaised.toString()),
            totalBurned: BigInt(totalBurned.toString()),
            totalSuccessful: Number(totalSuccessful),
            donationMiningFeeBips: Number(miningFee),
            donationBurnFeeBips: Number(burnFee),
            withdrawalFeeETH: BigInt(ethFee.toString()),
            goalNotMetBurnBips: Number(penalty)
        };
        
        statsCache = stats;
        statsCacheTime = now;
        return stats;
        
    } catch (e) {
        console.error('Failed to load charity stats:', e);
        return defaultStats;
    }
}

// ====================================================================
// LOAD CAMPAIGNS
// ====================================================================

export async function loadCampaigns(options = {}) {
    const { category, status, creator, forceRefresh = false } = options;
    const now = Date.now();
    
    // Check cache
    if (!forceRefresh && campaignsCache && (now - campaignsCacheTime < CACHE_DURATION_MS)) {
        return filterCampaigns(campaignsCache, options);
    }
    
    // Try Firebase first
    try {
        let url = `${CHARITY_API.getCampaigns}?limit=100`;
        if (category) url += `&category=${category}`;
        if (status !== null && status !== undefined) url += `&status=${status}`;
        if (creator) url += `&creator=${creator.toLowerCase()}`;
        
        const response = await fetchWithTimeout(url);
        if (response.ok) {
            const data = await response.json();
            const campaigns = (data.campaigns || []).map(c => normalizeCampaign(c));
            
            console.log(`✅ Firebase: ${campaigns.length} campaigns loaded`);
            
            campaignsCache = campaigns;
            campaignsCacheTime = now;
            State.charityCampaigns = campaigns;
            
            return filterCampaigns(campaigns, options);
        }
    } catch (e) {
        console.warn('Firebase campaigns failed:', e.message);
    }
    
    // Fallback to blockchain
    return loadCampaignsFromBlockchain(options);
}

/**
 * Load campaigns directly from blockchain
 */
async function loadCampaignsFromBlockchain(options = {}) {
    const contract = getCharityPoolContract();
    if (!contract) return [];
    
    try {
        const counter = await safeContractCall(contract, 'campaignCounter', [], 0n);
        const totalCampaigns = Number(counter);
        
        if (totalCampaigns === 0) {
            campaignsCache = [];
            campaignsCacheTime = Date.now();
            return [];
        }
        
        console.log(`📊 Loading ${totalCampaigns} campaigns from blockchain...`);
        
        const campaigns = [];
        const batchSize = 10;
        
        for (let i = 1; i <= totalCampaigns; i += batchSize) {
            const batch = [];
            for (let j = i; j < Math.min(i + batchSize, totalCampaigns + 1); j++) {
                batch.push(loadSingleCampaign(contract, j));
            }
            
            const results = await Promise.allSettled(batch);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    campaigns.push(result.value);
                }
            });
            
            // Small delay between batches to avoid rate limits
            if (i + batchSize <= totalCampaigns) {
                await wait(200);
            }
        }
        
        console.log(`✅ Blockchain: ${campaigns.length} campaigns loaded`);
        
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
        const normalizedStatus = normalizeStatus(status);
        filtered = filtered.filter(c => normalizeStatus(c.status) === normalizedStatus);
    }
    if (creator) {
        filtered = filtered.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());
    }
    
    return filtered;
}

// ====================================================================
// LOAD CAMPAIGN DETAILS
// ====================================================================

export async function loadCampaignDetails(campaignId) {
    const cacheKey = `campaign-${campaignId}`;
    
    // Check cache
    if (campaignDetailCache.has(cacheKey)) {
        const cached = campaignDetailCache.get(cacheKey);
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
            campaignDetailCache.set(cacheKey, { data: campaign, timestamp: Date.now() });
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
        campaignDetailCache.set(cacheKey, { data: campaign, timestamp: Date.now() });
    }
    return campaign;
}

// ====================================================================
// FEE CALCULATIONS
// ====================================================================

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
 * Check if campaign is active (handles string/number status)
 */
export function isCampaignActive(campaign) {
    const now = Math.floor(Date.now() / 1000);
    const status = normalizeStatus(campaign.status);
    return status === CampaignStatus.ACTIVE && Number(campaign.deadline) > now;
}

/**
 * Check if campaign can be withdrawn (handles string/number status)
 */
export function canWithdraw(campaign, userAddress) {
    if (!campaign || !userAddress) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const isCreator = campaign.creator?.toLowerCase() === userAddress.toLowerCase();
    const hasEnded = Number(campaign.deadline) <= now;
    const status = normalizeStatus(campaign.status);
    const isActive = status === CampaignStatus.ACTIVE;
    const isCancelled = status === CampaignStatus.CANCELLED;
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
    contractReadCache.clear();
}

// ====================================================================
// EXPORTS
// ====================================================================

export {
    getCharityPoolContract,
    normalizeCampaign
};