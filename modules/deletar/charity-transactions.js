// js/modules/charity-transactions.js
// ✅ PRODUCTION V3.0 - Robust Error Handling + Retry Logic + Safe tx.wait()
// Based on transactions.js patterns for maximum reliability

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, bkcTokenABI } from '../config.js';
import { showToast } from '../ui-feedback.js';
import { loadUserData } from './data.js';
import { recordPlatformUsage } from './firebase-auth-service.js';
import {
    charityPoolABI,
    loadCharityStats,
    loadCampaignDetails,
    calculateDonationFees,
    calculateWithdrawalFees,
    clearCharityCache,
    CampaignStatus
} from './charity-data.js';

// ====================================================================
// CONFIGURATION
// ====================================================================

const TX_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    APPROVAL_WAIT_MS: 1500,
    TX_CONFIRMATION_TIMEOUT_MS: 60000
};

// Arbitrum Sepolia Faucet Links
const FAUCET_LINKS = {
    arbitrumSepolia: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
    alternativeFaucet: 'https://faucet.quicknode.com/arbitrum/sepolia'
};

// Firebase API endpoints
const CHARITY_FIREBASE_API = {
    saveCampaignMetadata: 'https://savecharitycampaign-4wvdcuoouq-uc.a.run.app',
    updateCampaignMetadata: 'https://updatecharitycampaign-4wvdcuoouq-uc.a.run.app',
    recordDonation: 'https://recordcharitydonation-4wvdcuoouq-uc.a.run.app',
    uploadImage: 'https://uploadcharityimage-4wvdcuoouq-uc.a.run.app'
};

// ====================================================================
// UTILITIES
// ====================================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getConnectedSigner() {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return null;
    }
    try {
        let rawProvider = State.web3Provider || State.provider || window.ethereum;
        if (!rawProvider) {
            showToast("No wallet provider found", "error");
            return null;
        }
        const provider = new ethers.BrowserProvider(rawProvider);
        return await provider.getSigner();
    } catch (e) {
        console.error("Signer error:", e);
        showToast("Wallet connection error", "error");
        return null;
    }
}

// ====================================================================
// ERROR HANDLING (Based on transactions.js patterns)
// ====================================================================

function formatError(error) {
    const msg = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
    const errorData = error?.data || error?.error?.data;
    
    // User cancelled
    if (msg.includes('user rejected') || msg.includes('User denied') || msg.includes('cancelled') || msg.includes('canceled')) {
        return 'USER_REJECTED';
    }
    
    // MetaMask RPC Rate Limit - special handling
    if (msg.includes('too many errors') || msg.includes('retrying in') || error?.code === -32002) {
        return 'RPC_RATE_LIMITED';
    }
    
    // 🔥 V3.3: Decode custom errors from CharityPool contract
    // Custom error signatures (first 4 bytes of keccak256)
    const customErrors = {
        '0x5bf182a2': 'Maximum active campaigns reached (3)',
        '0x7e273289': 'Campaign not found',
        '0x8d8b8b8e': 'Campaign is not active',
        '0x82b42900': 'Not the campaign creator',
        '0x2c5211c6': 'Donation below minimum (1 BKC)',
        '0x2075c7c1': 'Insufficient ETH for withdrawal fee'
    };
    
    if (errorData && typeof errorData === 'string' && errorData.startsWith('0x')) {
        const selector = errorData.slice(0, 10);
        if (customErrors[selector]) {
            return customErrors[selector];
        }
    }
    
    // Check if error message contains the selector
    for (const [selector, message] of Object.entries(customErrors)) {
        if (msg.includes(selector)) {
            return message;
        }
    }
    
    // Gas/Balance issues
    if (msg.includes('insufficient funds') || msg.includes('exceeds the balance')) {
        return 'INSUFFICIENT_GAS';
    }
    if (msg.includes('InsufficientBalance') || (msg.includes('exceeds balance') && !msg.includes('gas'))) {
        return 'Insufficient BKC balance';
    }
    if (msg.includes('InsufficientAllowance')) return 'Please approve tokens first';
    
    // CharityPool specific errors
    if (msg.includes('CampaignNotFound')) return 'Campaign not found';
    if (msg.includes('CampaignNotActive')) return 'Campaign is not active';
    if (msg.includes('CampaignStillActive')) return 'Campaign is still active';
    if (msg.includes('NotCampaignCreator')) return 'Only campaign creator can do this';
    if (msg.includes('InvalidGoal') || msg.includes('GoalTooLow')) return 'Goal must be at least 1 BKC';
    if (msg.includes('InvalidDuration')) return 'Duration must be 1-180 days';
    if (msg.includes('MaxActiveCampaignsReached')) return 'Maximum active campaigns reached (3)';
    if (msg.includes('DonationTooSmall')) return 'Donation below minimum (1 BKC)';
    if (msg.includes('InsufficientETHFee')) return 'Insufficient ETH for withdrawal fee';
    if (msg.includes('EmptyTitle')) return 'Campaign title is required';
    if (msg.includes('ZeroAmount')) return 'Amount cannot be zero';
    
    // Network/RPC errors - these are retryable
    if (msg.includes('Internal JSON-RPC') || msg.includes('network') || msg.includes('timeout')) {
        return 'NETWORK_ERROR';
    }
    
    return msg.slice(0, 100);
}

function isRetryableError(error) {
    const msg = error?.message || error?.reason || '';
    const code = error?.code || error?.error?.code;
    
    // Rate limit error code from MetaMask
    if (code === -32002) return true;
    
    const retryablePatterns = [
        'Internal JSON-RPC',
        'network',
        'timeout',
        'ETIMEDOUT',
        'ECONNRESET',
        'rate limit',
        'Too Many Requests',
        'too many errors',
        'retrying in',
        'nonce',
        'replacement transaction',
        'already known',
        'yParity'
    ];
    return retryablePatterns.some(pattern => msg.toLowerCase().includes(pattern.toLowerCase()));
}

/**
 * Check if error is MetaMask rate limit and extract wait time
 * @returns {number} Wait time in ms, or 0 if not a rate limit error
 */
function getMetaMaskRateLimitWaitTime(error) {
    const msg = error?.message || '';
    const code = error?.code || error?.error?.code;
    
    if (code !== -32002 && !msg.includes('too many errors')) return 0;
    
    // Extract wait time from message like "retrying in 0,5 minutes"
    const match = msg.match(/retrying in (\d+[,.]?\d*) minutes/i);
    if (match) {
        const minutes = parseFloat(match[1].replace(',', '.'));
        return Math.ceil(minutes * 60 * 1000) + 5000; // Add 5s buffer
    }
    
    // Default 30 seconds if we can't parse
    return 30000;
}

function isUserRejection(error) {
    const msg = error?.message || error?.reason || '';
    return msg.includes('user rejected') || 
           msg.includes('User denied') || 
           msg.includes('cancelled') ||
           msg.includes('canceled');
}

/**
 * Handle transaction error with appropriate UI feedback
 */
function handleTransactionError(error) {
    const formattedError = formatError(error);
    
    if (formattedError === 'USER_REJECTED') {
        showToast('Transaction cancelled', 'error');
        return 'Transaction cancelled';
    }
    
    if (formattedError === 'INSUFFICIENT_GAS') {
        showInsufficientGasError();
        return 'Insufficient ETH for gas';
    }
    
    if (formattedError === 'RPC_RATE_LIMITED') {
        showRpcRateLimitError();
        return 'RPC rate limited - please wait';
    }
    
    if (formattedError === 'NETWORK_ERROR') {
        showToast('Network error - please try again', 'error');
        return 'Network error';
    }
    
    showToast(formattedError, 'error');
    return formattedError;
}

/**
 * Show modal with instructions for RPC rate limit
 */
function showRpcRateLimitError() {
    showToast("⏳ RPC rate limited - wait 30 seconds", "warning");
    
    setTimeout(() => {
        const existingModal = document.getElementById('rpc-limit-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'rpc-limit-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
            <div class="relative bg-zinc-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <button onclick="this.closest('#rpc-limit-modal').remove()" class="absolute top-4 right-4 text-zinc-400 hover:text-white">
                    <i class="fa-solid fa-times text-xl"></i>
                </button>
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-clock text-3xl text-amber-400"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">RPC Rate Limited</h3>
                    <p class="text-zinc-400 text-sm">MetaMask's RPC is temporarily blocked due to too many requests. Wait 30-60 seconds and try again.</p>
                </div>
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p class="text-blue-400 text-xs">
                        <i class="fa-solid fa-lightbulb mr-1"></i>
                        <strong>Tip:</strong> You can change MetaMask's RPC to avoid this:
                    </p>
                    <ol class="text-blue-300 text-xs mt-2 space-y-1 list-decimal list-inside">
                        <li>Open MetaMask Settings</li>
                        <li>Go to Networks → Arbitrum Sepolia</li>
                        <li>Change RPC URL to:</li>
                    </ol>
                    <code class="block bg-zinc-800 text-green-400 text-xs p-2 rounded mt-2 break-all">
                        https://sepolia-rollup.arbitrum.io/rpc
                    </code>
                </div>
                <button onclick="this.closest('#rpc-limit-modal').remove()" 
                        class="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded-xl transition-colors">
                    Got it, I'll wait
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }, 500);
}

/**
 * Show modal with faucet links for gas issues
 */
function showInsufficientGasError() {
    showToast("⛽ You're out of ETH for gas fees!", "error");
    
    setTimeout(() => {
        const existingModal = document.getElementById('gas-faucet-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'gas-faucet-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
            <div class="relative bg-zinc-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <button onclick="this.closest('#gas-faucet-modal').remove()" class="absolute top-4 right-4 text-zinc-400 hover:text-white">
                    <i class="fa-solid fa-times text-xl"></i>
                </button>
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-gas-pump text-3xl text-red-400"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Out of Gas!</h3>
                    <p class="text-zinc-400 text-sm">You need ETH on Arbitrum Sepolia to pay for transaction fees.</p>
                </div>
                <div class="space-y-3 mb-6">
                    <a href="${FAUCET_LINKS.arbitrumSepolia}" target="_blank" rel="noopener noreferrer"
                       class="flex items-center justify-between w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                        <span><i class="fa-solid fa-faucet mr-2"></i>Alchemy Faucet</span>
                        <i class="fa-solid fa-external-link"></i>
                    </a>
                    <a href="${FAUCET_LINKS.alternativeFaucet}" target="_blank" rel="noopener noreferrer"
                       class="flex items-center justify-between w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                        <span><i class="fa-solid fa-faucet mr-2"></i>QuickNode Faucet</span>
                        <i class="fa-solid fa-external-link"></i>
                    </a>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p class="text-amber-400 text-xs">
                        <i class="fa-solid fa-lightbulb mr-1"></i>
                        <strong>Tip:</strong> Request testnet ETH from any faucet above. It usually takes 1-2 minutes.
                    </p>
                </div>
                <button onclick="this.closest('#gas-faucet-modal').remove()" 
                        class="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }, 500);
}

// ====================================================================
// SAFE TX.WAIT() - Handles Arbitrum yParity parsing issues
// ====================================================================

/**
 * Safe wrapper for tx.wait() that handles ethers.js parsing errors on Arbitrum
 * The yParity mismatch error is cosmetic - TX succeeds but receipt parsing fails
 */
async function safeWaitForTx(tx, provider) {
    try {
        const receipt = await tx.wait();
        return { success: true, receipt };
    } catch (waitError) {
        console.warn('tx.wait() parsing error, checking manually...', waitError.message);
        
        // Wait a bit for tx to confirm
        await sleep(3000);
        
        try {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (receipt && receipt.status === 1) {
                console.log('✅ TX confirmed manually:', tx.hash);
                return { success: true, receipt };
            } else if (receipt && receipt.status === 0) {
                return { success: false, error: 'Transaction reverted' };
            }
        } catch (e) {
            console.warn('First receipt check failed:', e.message);
        }
        
        // Retry after longer wait
        await sleep(5000);
        
        try {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (receipt && receipt.status === 1) {
                console.log('✅ TX confirmed manually (retry):', tx.hash);
                return { success: true, receipt };
            } else if (receipt && receipt.status === 0) {
                return { success: false, error: 'Transaction reverted' };
            }
        } catch (e) {
            console.warn('Second receipt check failed:', e.message);
        }
        
        // If we still can't get receipt but have hash, assume success
        console.warn('Could not verify TX, assuming success:', tx.hash);
        return { success: true, receipt: { hash: tx.hash, status: 1 } };
    }
}

// ====================================================================
// ROBUST TRANSACTION EXECUTOR WITH RETRY
// ====================================================================

/**
 * Execute transaction with automatic retry on network errors
 * Includes special handling for MetaMask rate limits
 */
async function executeWithRetry(txFunction, options = {}) {
    const {
        retries = TX_CONFIG.MAX_RETRIES,
        onAttempt = () => {},
        onSuccess = () => {},
        description = 'Transaction',
        provider = null
    } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            onAttempt(attempt);
            
            const tx = await txFunction();
            showToast("Waiting for confirmation...", "info");
            
            // Use safe wait to handle parsing errors
            const waitResult = await safeWaitForTx(tx, provider || tx.provider);
            
            if (!waitResult.success) {
                throw new Error(waitResult.error || 'Transaction failed');
            }
            
            onSuccess(waitResult.receipt);
            return { success: true, receipt: waitResult.receipt, txHash: waitResult.receipt.hash || tx.hash };
            
        } catch (e) {
            console.error(`${description} attempt ${attempt} failed:`, e);
            
            if (isUserRejection(e)) {
                showToast("Transaction cancelled", "error");
                return { success: false, cancelled: true };
            }
            
            // Special handling for MetaMask rate limit
            const rateLimitWait = getMetaMaskRateLimitWaitTime(e);
            if (rateLimitWait > 0) {
                const waitSeconds = Math.ceil(rateLimitWait / 1000);
                showToast(`⏳ MetaMask rate limited. Waiting ${waitSeconds}s...`, "warning");
                
                // Show countdown
                for (let i = waitSeconds; i > 0; i -= 5) {
                    await sleep(5000);
                    if (i > 5) {
                        showToast(`⏳ Waiting ${i - 5}s for MetaMask...`, "info");
                    }
                }
                
                showToast("🔄 Retrying transaction...", "info");
                continue; // Retry after waiting
            }
            
            if (attempt < retries && isRetryableError(e)) {
                showToast(`Network issue, retrying... (${attempt}/${retries})`, "warning");
                await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                continue;
            }
            
            handleTransactionError(e);
            return { success: false, error: e };
        }
    }
    
    return { success: false };
}

// ====================================================================
// ROBUST APPROVAL WITH RETRY
// ====================================================================

async function robustApprove(tokenAddress, spenderAddress, amount, signer, retries = TX_CONFIG.MAX_RETRIES) {
    const tokenABI = [
        "function approve(address,uint256) returns (bool)", 
        "function allowance(address,address) view returns (uint256)"
    ];
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    const userAddress = await signer.getAddress();
    
    // Check current allowance
    let currentAllowance;
    try {
        currentAllowance = await token.allowance(userAddress, spenderAddress);
        console.log("Current allowance:", ethers.formatEther(currentAllowance), "BKC");
    } catch (e) {
        console.warn("Could not check allowance:", e.message);
        currentAllowance = 0n;
    }
    
    // If already approved, return immediately
    if (currentAllowance >= amount) {
        console.log("✅ Already approved");
        return true;
    }
    
    // Request approval with 10x amount to avoid future approvals
    const approveAmount = amount * 10n;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            showToast(`Approve tokens... ${attempt > 1 ? `(attempt ${attempt})` : ''}`, "info");
            
            const tx = await token.approve(spenderAddress, approveAmount);
            showToast("Waiting for approval confirmation...", "info");
            
            const waitResult = await safeWaitForTx(tx, signer.provider);
            
            if (!waitResult.success) {
                throw new Error("Approval transaction failed");
            }
            
            // Wait a bit for the approval to propagate
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
            
            // Verify the approval went through
            try {
                const newAllowance = await token.allowance(userAddress, spenderAddress);
                if (newAllowance >= amount) {
                    showToast("✅ Approved!", "success");
                    return true;
                }
            } catch (e) {
                // If we can't verify, assume success
                console.warn("Could not verify allowance, assuming success");
                showToast("✅ Approved!", "success");
                return true;
            }
            
        } catch (e) {
            console.error(`Approval attempt ${attempt} failed:`, e);
            
            if (isUserRejection(e)) {
                showToast("Approval cancelled", "error");
                return false;
            }
            
            if (attempt < retries && isRetryableError(e)) {
                showToast(`Retrying approval... (${attempt}/${retries})`, "warning");
                await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                continue;
            }
            
            handleTransactionError(e);
            return false;
        }
    }
    
    return false;
}

// ====================================================================
// CONTRACT HELPERS
// ====================================================================

function getCharityPoolContract(signer) {
    const address = addresses.charityPool;
    if (!address) {
        showToast("CharityPool not configured", "error");
        return null;
    }
    return new ethers.Contract(address, charityPoolABI, signer);
}

function getBKCTokenContract(signer) {
    return new ethers.Contract(addresses.bkcToken, bkcTokenABI, signer);
}

// ====================================================================
// IMAGE UPLOAD
// ====================================================================

export async function uploadCampaignImage(file) {
    if (!file) return { success: false, error: 'No file provided' };
    
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Image must be less than 5MB' };
    }
    
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image' };
    }
    
    try {
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        const response = await fetch(CHARITY_FIREBASE_API.uploadImage, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: base64,
                filename: file.name,
                contentType: file.type,
                uploader: State.userAddress
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Upload failed');
        }
        
        const result = await response.json();
        return { success: true, url: result.url };
        
    } catch (e) {
        console.error('Image upload error:', e);
        return { success: false, error: e.message };
    }
}

// ====================================================================
// PLATFORM USAGE TRACKING
// ====================================================================

async function trackCharityUsage(actionType, txHash) {
    if (!txHash) return;
    
    // Execute in background with retry
    (async () => {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const result = await recordPlatformUsage(actionType, txHash);
                if (result.success) {
                    console.log(`✅ Charity tracking: ${actionType} +${result.pointsAwarded || 0} pts`);
                    if (result.pointsAwarded > 0) {
                        showToast(`🎯 +${result.pointsAwarded.toLocaleString()} Airdrop Points!`, "success");
                    }
                }
                return;
            } catch (e) {
                if (attempt < 3) {
                    await sleep(1500 * attempt);
                    continue;
                }
                console.warn('Charity tracking failed:', e.message);
            }
        }
    })();
}

// ====================================================================
// CREATE CAMPAIGN
// ====================================================================

export async function executeCreateCampaign(params, btnElement = null) {
    const {
        title,
        description,
        goalAmount,
        durationDays,
        category = 'humanitarian',
        imageUrl = null,
        websiteUrl = null,
        youtubeUrl = null,
        twitterUrl = null,
        instagramUrl = null,
        telegramUrl = null
    } = params;
    
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Create';
    
    if (btnElement) {
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
        btnElement.disabled = true;
    }
    
    try {
        // Validate inputs
        if (!title || title.trim().length === 0) {
            showToast("Title is required", "error");
            return { success: false };
        }
        
        if (!goalAmount || parseFloat(goalAmount) < 1) {
            showToast("Goal must be at least 1 BKC", "error");
            return { success: false };
        }
        
        const duration = parseInt(durationDays);
        if (!duration || duration < 1 || duration > 180) {
            showToast("Duration must be 1-180 days", "error");
            return { success: false };
        }
        
        const contract = getCharityPoolContract(signer);
        if (!contract) return { success: false };
        
        // 🔥 V3.3: Check if user can create more campaigns BEFORE sending tx
        try {
            const userAddress = await signer.getAddress();
            const [userActiveCampaigns, maxActive] = await Promise.all([
                contract.userActiveCampaigns(userAddress),
                contract.maxActiveCampaignsPerWallet()
            ]);
            
            const currentActive = Number(userActiveCampaigns);
            const maxAllowed = Number(maxActive);
            
            console.log(`User campaigns: ${currentActive}/${maxAllowed}`);
            
            if (currentActive >= maxAllowed) {
                showToast(`You already have ${currentActive} active campaigns (max: ${maxAllowed})`, "error");
                return { success: false, error: 'MaxActiveCampaignsReached' };
            }
        } catch (e) {
            console.warn("Could not check campaign limit:", e.message);
            // Continue anyway, contract will reject if limit reached
        }
        
        const goalWei = ethers.parseEther(goalAmount.toString());
        
        console.log("Creating campaign:", {
            title,
            description: description?.slice(0, 50) + '...',
            goalAmount: goalAmount.toString(),
            durationDays: duration
        });
        
        // Execute with retry
        const result = await executeWithRetry(
            () => contract.createCampaign(
                title.trim(),
                description?.trim() || '',
                goalWei,
                duration
            ),
            {
                description: 'Create Campaign',
                provider: signer.provider,
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm transaction in wallet...", "info");
                    if (btnElement && attempt > 1) {
                        btnElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Retrying (${attempt})...`;
                    }
                }
            }
        );
        
        if (!result.success) {
            return { success: false, error: result.error };
        }
        
        // Extract campaign ID from event
        let campaignId = null;
        if (result.receipt?.logs) {
            for (const log of result.receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
                    if (parsed?.name === "CampaignCreated") {
                        campaignId = Number(parsed.args.campaignId);
                        break;
                    }
                } catch {}
            }
        }
        
        // Fallback: get campaignId from counter
        if (!campaignId) {
            try {
                const counter = await contract.campaignCounter();
                campaignId = Number(counter);
                console.log('📍 Campaign ID from counter:', campaignId);
            } catch (e) {
                console.warn('Could not get campaign ID:', e.message);
            }
        }
        
        // Save metadata to Firebase
        if (campaignId) {
            try {
                await fetch(CHARITY_FIREBASE_API.saveCampaignMetadata, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaignId,
                        creator: State.userAddress,
                        title: title.trim(),
                        description: description?.trim() || '',
                        category,
                        imageUrl,
                        websiteUrl,
                        youtubeUrl,
                        twitterUrl,
                        instagramUrl,
                        telegramUrl,
                        txHash: result.txHash
                    })
                });
                console.log('✅ Campaign metadata saved');
            } catch (e) {
                console.warn('Failed to save campaign metadata:', e.message);
            }
        }
        
        showToast(`🎉 Campaign created successfully!`, "success");
        
        clearCharityCache();
        loadUserData();
        trackCharityUsage('charityCreate', result.txHash);
        
        return {
            success: true,
            campaignId,
            txHash: result.txHash
        };
        
    } catch (e) {
        console.error("Create campaign error:", e);
        handleTransactionError(e);
        return { success: false, error: formatError(e) };
        
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// DONATE TO CAMPAIGN
// ====================================================================

export async function executeDonate(campaignId, amount, btnElement = null) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Donate';
    
    if (btnElement) {
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        if (!amount || parseFloat(amount) <= 0) {
            showToast("Please enter a valid amount", "error");
            return { success: false };
        }
        
        const contract = getCharityPoolContract(signer);
        if (!contract) return { success: false };
        
        const amountWei = ethers.parseEther(amount.toString());
        const charityPoolAddress = addresses.charityPool;
        
        // Check balance
        const bkcToken = getBKCTokenContract(signer);
        const balance = await bkcToken.balanceOf(State.userAddress);
        
        if (balance < amountWei) {
            showToast("Insufficient BKC balance", "error");
            return { success: false };
        }
        
        // Calculate fees for display
        const fees = await calculateDonationFees(amount);
        console.log("Donation breakdown:", fees);
        
        // Ensure approval with retry
        const approved = await robustApprove(addresses.bkcToken, charityPoolAddress, amountWei, signer);
        if (!approved) return { success: false };
        
        if (btnElement) btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Donating...';
        
        // Execute with retry
        const result = await executeWithRetry(
            () => contract.donate(campaignId, amountWei),
            {
                description: 'Donate',
                provider: signer.provider,
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm donation in wallet...", "info");
                }
            }
        );
        
        if (!result.success) {
            return { success: false, error: result.error };
        }
        
        // Extract event data
        let netAmount = 0n, burnedAmount = 0n;
        if (result.receipt?.logs) {
            for (const log of result.receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
                    if (parsed?.name === "DonationMade") {
                        netAmount = BigInt(parsed.args.netAmount?.toString() || '0');
                        burnedAmount = BigInt(parsed.args.burnedAmount?.toString() || '0');
                        break;
                    }
                } catch {}
            }
        }
        
        // Record donation in Firebase (background)
        fetch(CHARITY_FIREBASE_API.recordDonation, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId,
                donor: State.userAddress,
                grossAmount: amountWei.toString(),
                netAmount: netAmount.toString(),
                burnedAmount: burnedAmount.toString(),
                txHash: result.txHash
            })
        }).catch(e => console.warn('Failed to record donation:', e.message));
        
        const burnedFormatted = ethers.formatEther(burnedAmount || fees.burnFee);
        showToast(`❤️ Donation successful! (${burnedFormatted} BKC burned 🔥)`, "success");
        
        clearCharityCache();
        loadUserData();
        trackCharityUsage('charityDonate', result.txHash);
        
        return {
            success: true,
            txHash: result.txHash,
            netAmount,
            burnedAmount
        };
        
    } catch (e) {
        console.error("Donate error:", e);
        handleTransactionError(e);
        return { success: false, error: formatError(e) };
        
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// CANCEL CAMPAIGN
// ====================================================================

export async function executeCancelCampaign(campaignId, btnElement = null) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Cancel';
    
    if (btnElement) {
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cancelling...';
        btnElement.disabled = true;
    }
    
    try {
        const contract = getCharityPoolContract(signer);
        if (!contract) return { success: false };
        
        // Execute with retry
        const result = await executeWithRetry(
            () => contract.cancelCampaign(campaignId),
            {
                description: 'Cancel Campaign',
                provider: signer.provider,
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm cancellation in wallet...", "info");
                }
            }
        );
        
        if (!result.success) {
            return { success: false, error: result.error };
        }
        
        showToast("Campaign cancelled successfully", "success");
        
        clearCharityCache();
        trackCharityUsage('charityCancel', result.txHash);
        
        return {
            success: true,
            txHash: result.txHash
        };
        
    } catch (e) {
        console.error("Cancel campaign error:", e);
        handleTransactionError(e);
        return { success: false, error: formatError(e) };
        
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// WITHDRAW FUNDS
// ====================================================================

export async function executeWithdraw(campaignId, btnElement = null) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Withdraw';
    
    if (btnElement) {
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const contract = getCharityPoolContract(signer);
        if (!contract) return { success: false };
        
        // Load campaign to calculate fees
        const campaign = await loadCampaignDetails(campaignId);
        if (!campaign) {
            showToast("Campaign not found", "error");
            return { success: false };
        }
        
        const withdrawal = await calculateWithdrawalFees(campaign);
        console.log("Withdrawal breakdown:", withdrawal);
        
        // Check ETH balance for fee
        const ethBalance = await signer.provider.getBalance(State.userAddress);
        if (ethBalance < withdrawal.ethFee) {
            showToast(`Need ${withdrawal.ethFeeFormatted} ETH for withdrawal fee`, "error");
            showInsufficientGasError();
            return { success: false };
        }
        
        if (btnElement) btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Withdrawing...';
        
        // Execute with retry
        const result = await executeWithRetry(
            () => contract.withdraw(campaignId, { value: withdrawal.ethFee }),
            {
                description: 'Withdraw',
                provider: signer.provider,
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm withdrawal in wallet...", "info");
                }
            }
        );
        
        if (!result.success) {
            return { success: false, error: result.error };
        }
        
        // Extract event data
        let amountReceived = 0n, burnedAmount = 0n, goalMet = false;
        if (result.receipt?.logs) {
            for (const log of result.receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
                    if (parsed?.name === "FundsWithdrawn") {
                        amountReceived = BigInt(parsed.args.netAmount?.toString() || '0');
                        burnedAmount = BigInt(parsed.args.burnedAmount?.toString() || '0');
                        goalMet = parsed.args.goalReached;
                        break;
                    }
                } catch {}
            }
        }
        
        const receivedFormatted = ethers.formatEther(amountReceived || withdrawal.receiveAmount);
        
        if (goalMet) {
            showToast(`🎉 Goal reached! Withdrew ${receivedFormatted} BKC`, "success");
        } else {
            const burnedFormatted = ethers.formatEther(burnedAmount || withdrawal.burnAmount);
            showToast(`Withdrew ${receivedFormatted} BKC (${burnedFormatted} burned 🔥)`, "success");
        }
        
        clearCharityCache();
        loadUserData();
        trackCharityUsage('charityWithdraw', result.txHash);
        
        return {
            success: true,
            txHash: result.txHash,
            amountReceived,
            burnedAmount,
            goalMet
        };
        
    } catch (e) {
        console.error("Withdraw error:", e);
        handleTransactionError(e);
        return { success: false, error: formatError(e) };
        
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// UPDATE CAMPAIGN METADATA
// ====================================================================

export async function updateCampaignMetadata(campaignId, updates) {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return { success: false };
    }
    
    try {
        const response = await fetch(CHARITY_FIREBASE_API.updateCampaignMetadata, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId,
                creator: State.userAddress,
                ...updates
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
        
        showToast("Campaign updated!", "success");
        clearCharityCache();
        
        return { success: true };
        
    } catch (e) {
        console.error("Update metadata error:", e);
        showToast(e.message || "Update failed", "error");
        return { success: false, error: e.message };
    }
}

// ====================================================================
// EXPORTS
// ====================================================================

export {
    getConnectedSigner,
    formatError,
    robustApprove as ensureApproval,
    handleTransactionError,
    safeWaitForTx
};