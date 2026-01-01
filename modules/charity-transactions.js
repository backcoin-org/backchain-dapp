// js/modules/charity-transactions.js
// ✅ PRODUCTION V2.0 - Charity Pool Transaction Module
// Fixed: Better error handling, image upload support

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
    APPROVAL_WAIT_MS: 1500
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

function formatError(error) {
    const msg = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
    
    // User cancelled
    if (msg.includes('user rejected') || msg.includes('User denied')) {
        return 'Transaction cancelled';
    }
    
    // Gas/Balance issues
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('InsufficientBalance')) return 'Insufficient BKC balance';
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
    
    // Internal JSON-RPC error - likely contract revert
    if (msg.includes('Internal JSON-RPC error')) {
        return 'Transaction failed. Please check if CharityPool is properly configured.';
    }
    
    return msg.slice(0, 100);
}

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
// APPROVAL HELPER
// ====================================================================

async function ensureApproval(amount, spender, signer) {
    const bkcToken = getBKCTokenContract(signer);
    const userAddress = await signer.getAddress();
    
    try {
        const currentAllowance = await bkcToken.allowance(userAddress, spender);
        
        if (currentAllowance >= amount) {
            console.log('✅ Sufficient allowance:', ethers.formatEther(currentAllowance));
            return true;
        }
        
        showToast("Approving BKC...", "info");
        
        // Approve unlimited for better UX
        const tx = await bkcToken.approve(spender, ethers.MaxUint256);
        
        showToast("Waiting for approval confirmation...", "info");
        await tx.wait();
        
        await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        
        showToast("✅ BKC Approved!", "success");
        return true;
        
    } catch (e) {
        console.error("Approval error:", e);
        showToast(formatError(e), "error");
        return false;
    }
}

// ====================================================================
// IMAGE UPLOAD
// ====================================================================

/**
 * Upload campaign image to cloud storage
 * @param {File} file - Image file to upload
 * @returns {Object} Result with success and url
 */
export async function uploadCampaignImage(file) {
    if (!file) return { success: false, error: 'No file provided' };
    
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Image must be less than 5MB' };
    }
    
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image' };
    }
    
    try {
        // Convert to base64
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
    
    try {
        await recordPlatformUsage(actionType, txHash);
        console.log(`✅ Charity tracking: ${actionType}`);
    } catch (e) {
        console.warn('Charity tracking failed:', e.message);
    }
}

// ====================================================================
// CREATE CAMPAIGN
// ====================================================================

/**
 * Create a new charity campaign
 */
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
        // Validate
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
        
        const goalWei = ethers.parseEther(goalAmount.toString());
        
        console.log("Creating campaign:", {
            title,
            description: description?.slice(0, 50) + '...',
            goalAmount: goalAmount.toString(),
            durationDays: duration
        });
        
        showToast("Confirm transaction in wallet...", "info");
        
        const tx = await contract.createCampaign(
            title.trim(),
            description?.trim() || '',
            goalWei,
            duration
        );
        
        if (btnElement) btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming...';
        
        showToast("Creating campaign...", "info");
        const receipt = await tx.wait();
        
        // Extract campaign ID from event
        let campaignId = null;
        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === "CampaignCreated") {
                    campaignId = Number(parsed.args.campaignId);
                    break;
                }
            } catch {}
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
                        txHash: receipt.hash
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
        trackCharityUsage('charityCreate', receipt.hash);
        
        return {
            success: true,
            campaignId,
            txHash: receipt.hash
        };
        
    } catch (e) {
        console.error("Create campaign error:", e);
        showToast(formatError(e), "error");
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

/**
 * Donate BKC to a campaign
 */
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
        
        // Ensure approval
        const approved = await ensureApproval(amountWei, charityPoolAddress, signer);
        if (!approved) return { success: false };
        
        if (btnElement) btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Donating...';
        
        showToast("Confirm donation in wallet...", "info");
        
        const tx = await contract.donate(campaignId, amountWei);
        
        showToast("Processing donation... 🔥", "info");
        const receipt = await tx.wait();
        
        // Extract event data
        let netAmount = 0n, burnedAmount = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === "DonationMade") {
                    netAmount = BigInt(parsed.args.netAmount?.toString() || '0');
                    burnedAmount = BigInt(parsed.args.burnedAmount?.toString() || '0');
                    break;
                }
            } catch {}
        }
        
        // Record donation in Firebase
        try {
            await fetch(CHARITY_FIREBASE_API.recordDonation, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    donor: State.userAddress,
                    grossAmount: amountWei.toString(),
                    netAmount: netAmount.toString(),
                    burnedAmount: burnedAmount.toString(),
                    txHash: receipt.hash
                })
            });
        } catch (e) {
            console.warn('Failed to record donation:', e.message);
        }
        
        const burnedFormatted = ethers.formatEther(burnedAmount || fees.burnFee);
        showToast(`❤️ Donation successful! (${burnedFormatted} BKC burned 🔥)`, "success");
        
        clearCharityCache();
        loadUserData();
        trackCharityUsage('charityDonate', receipt.hash);
        
        return {
            success: true,
            txHash: receipt.hash,
            netAmount,
            burnedAmount
        };
        
    } catch (e) {
        console.error("Donate error:", e);
        showToast(formatError(e), "error");
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

/**
 * Cancel a campaign (only creator)
 */
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
        
        showToast("Confirm cancellation in wallet...", "info");
        
        const tx = await contract.cancelCampaign(campaignId);
        
        showToast("Cancelling campaign...", "info");
        const receipt = await tx.wait();
        
        showToast("Campaign cancelled successfully", "success");
        
        clearCharityCache();
        trackCharityUsage('charityCancel', receipt.hash);
        
        return {
            success: true,
            txHash: receipt.hash
        };
        
    } catch (e) {
        console.error("Cancel campaign error:", e);
        showToast(formatError(e), "error");
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

/**
 * Withdraw campaign funds (only creator, only after deadline or cancelled)
 */
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
        const provider = signer.provider;
        const ethBalance = await provider.getBalance(State.userAddress);
        if (ethBalance < withdrawal.ethFee) {
            showToast(`Need ${withdrawal.ethFeeFormatted} ETH for withdrawal fee`, "error");
            return { success: false };
        }
        
        if (btnElement) btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Withdrawing...';
        
        showToast("Confirm withdrawal in wallet...", "info");
        
        const tx = await contract.withdraw(campaignId, { value: withdrawal.ethFee });
        
        showToast("Processing withdrawal...", "info");
        const receipt = await tx.wait();
        
        // Extract event data
        let amountReceived = 0n, burnedAmount = 0n, goalMet = false;
        for (const log of receipt.logs) {
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
        
        const receivedFormatted = ethers.formatEther(amountReceived || withdrawal.receiveAmount);
        
        if (goalMet) {
            showToast(`🎉 Goal reached! Withdrew ${receivedFormatted} BKC`, "success");
        } else {
            const burnedFormatted = ethers.formatEther(burnedAmount || withdrawal.burnAmount);
            showToast(`Withdrew ${receivedFormatted} BKC (${burnedFormatted} burned 🔥)`, "success");
        }
        
        clearCharityCache();
        loadUserData();
        trackCharityUsage('charityWithdraw', receipt.hash);
        
        return {
            success: true,
            txHash: receipt.hash,
            amountReceived,
            burnedAmount,
            goalMet
        };
        
    } catch (e) {
        console.error("Withdraw error:", e);
        showToast(formatError(e), "error");
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

/**
 * Update campaign metadata (Firebase only, not blockchain)
 */
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
        showToast(formatError(e), "error");
        return { success: false, error: e.message };
    }
}

// ====================================================================
// EXPORTS
// ====================================================================

export {
    getConnectedSigner,
    formatError,
    ensureApproval
};