// js/modules/transactions.js
// ✅ PRODUCTION V12.0 - Robust Retry + Better Error Handling + Stability Fixes

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI, decentralizedNotaryABI, actionsManagerABI, delegationManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings, loadUserDelegations } from './data.js';

// ====================================================================
// CONFIGURATION
// ====================================================================

const TX_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 3000,      // Aumentado para 3s
    APPROVAL_WAIT_MS: 2000,    // Aumentado para 2s
    SIMULATION_TIMEOUT_MS: 10000,
    // Gas settings para evitar simulação problemática
    DEFAULT_GAS_LIMIT: 500000n,
    GAS_LIMIT_MULTIPLIER: 1.3   // 30% extra para segurança
};

// ====================================================================
// UTILITIES
// ====================================================================

function safeFormatEther(value) {
    try {
        const bigValue = BigInt(value);
        if (bigValue > ethers.parseEther("1000000000")) return "UNLIMITED";
        return ethers.formatEther(bigValue);
    } catch { return "N/A"; }
}

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
        const signer = await provider.getSigner();
        return signer;
    } catch (e) {
        console.error("Signer error:", e);
        showToast("Wallet connection error", "error");
        return null;
    }
}

function formatError(error) {
    const msg = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
    
    // User cancelled
    if (msg.includes('user rejected') || msg.includes('User denied')) return 'Transaction cancelled by user';
    
    // Gas/ETH errors
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('exceeds balance')) return 'Insufficient token balance';
    
    // Contract specific errors
    if (msg.includes('0xfb550858') || msg.includes('InsufficientOracleFee')) return 'Insufficient oracle fee (ETH)';
    if (msg.includes('0xbcfa8e99') || msg.includes('InvalidGuessCount')) return 'Wrong number of guesses';
    if (msg.includes('0x5c844fb4') || msg.includes('InvalidGuessRange')) return 'Guess out of range';
    if (msg.includes('ZeroAmount')) return 'Amount cannot be zero';
    if (msg.includes('NoActiveTiers')) return 'No active game tiers';
    if (msg.includes('InsufficientAllowance')) return 'Please approve tokens first';
    if (msg.includes('InsufficientBalance')) return 'Insufficient BKC balance';
    
    // Delegation errors
    if (msg.includes('DelegationNotFound') || msg.includes('not found')) return 'Delegation not found';
    if (msg.includes('DelegationLocked') || msg.includes('still locked')) return 'Delegation is still locked';
    if (msg.includes('InvalidIndex') || msg.includes('invalid index')) return 'Invalid delegation index';
    if (msg.includes('NotOwner') || msg.includes('not owner')) return 'Not the delegation owner';
    if (msg.includes('require(false)')) return 'Transaction rejected by contract';
    
    // RPC/Network errors (these should trigger retry)
    if (msg.includes('Internal JSON-RPC')) return 'Network error - please try again';
    if (msg.includes('network') || msg.includes('timeout')) return 'Network timeout - please try again';
    
    return msg.slice(0, 100);
}

function isRetryableError(error) {
    const msg = error?.message || error?.reason || '';
    const retryablePatterns = [
        'Internal JSON-RPC',
        'network',
        'timeout',
        'ETIMEDOUT',
        'ECONNRESET',
        'rate limit',
        'Too Many Requests',
        'nonce',
        'replacement transaction',
        'already known'
    ];
    return retryablePatterns.some(pattern => msg.toLowerCase().includes(pattern.toLowerCase()));
}

function isUserRejection(error) {
    const msg = error?.message || error?.reason || '';
    return msg.includes('user rejected') || 
           msg.includes('User denied') || 
           msg.includes('cancelled') ||
           msg.includes('canceled');
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
    
    // Check current allowance
    let currentAllowance;
    try {
        currentAllowance = await token.allowance(State.userAddress, spenderAddress);
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
            
            const receipt = await tx.wait();
            
            if (receipt.status === 0) {
                throw new Error("Approval transaction reverted");
            }
            
            // Wait a bit for the approval to propagate
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
            
            // Verify the approval went through
            const newAllowance = await token.allowance(State.userAddress, spenderAddress);
            if (newAllowance >= amount) {
                showToast("✅ Approved!", "success");
                return true;
            } else {
                throw new Error("Approval not reflected yet");
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
            
            showToast(formatError(e), "error");
            return false;
        }
    }
    
    return false;
}

// ====================================================================
// ROBUST TRANSACTION EXECUTOR WITH RETRY
// ====================================================================

async function executeWithRetry(txFunction, options = {}) {
    const {
        retries = TX_CONFIG.MAX_RETRIES,
        onAttempt = () => {},
        onSuccess = () => {},
        description = 'Transaction'
    } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            onAttempt(attempt);
            
            const tx = await txFunction();
            showToast("Waiting for confirmation...", "info");
            
            const receipt = await tx.wait();
            
            if (receipt.status === 0) {
                throw new Error("Transaction reverted");
            }
            
            onSuccess(receipt);
            return { success: true, receipt, txHash: receipt.hash };
            
        } catch (e) {
            console.error(`${description} attempt ${attempt} failed:`, e);
            
            if (isUserRejection(e)) {
                showToast("Transaction cancelled", "error");
                return { success: false, cancelled: true };
            }
            
            if (attempt < retries && isRetryableError(e)) {
                showToast(`Network issue, retrying... (${attempt}/${retries})`, "warning");
                await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                continue;
            }
            
            showToast(formatError(e), "error");
            return { success: false, error: e };
        }
    }
    
    return { success: false };
}

// ====================================================================
// DELEGATION (WITH SIMULATION BYPASS)
// ====================================================================

export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Delegate';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const totalAmountBigInt = BigInt(totalAmount);
        const durationBigInt = BigInt(durationSeconds);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        
        if (balance < totalAmountBigInt) {
            showToast("Insufficient BKC balance", "error");
            return false;
        }
        
        const approved = await robustApprove(
            addresses.bkcToken,
            addresses.delegationManager,
            totalAmountBigInt,
            signer
        );
        if (!approved) return false;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Delegating...';
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        // Pre-estimate gas
        let gasLimit = 350000n;
        try {
            const estimatedGas = await delegationContract.delegate.estimateGas(
                totalAmountBigInt, 
                durationBigInt, 
                boosterIdBigInt
            );
            gasLimit = (estimatedGas * 150n) / 100n;
            console.log("Delegation gas estimated:", estimatedGas.toString(), "→ Using:", gasLimit.toString());
        } catch (e) {
            console.warn("Gas estimation failed, using default:", e.message);
        }
        
        // Execute with explicit gasLimit
        for (let attempt = 1; attempt <= TX_CONFIG.MAX_RETRIES; attempt++) {
            try {
                if (attempt === 1) {
                    showToast("Confirm delegation in wallet...", "info");
                } else {
                    await sleep(TX_CONFIG.RETRY_DELAY_MS);
                    showToast(`Retrying... (${attempt}/${TX_CONFIG.MAX_RETRIES})`, "warning");
                }
                
                const tx = await delegationContract.delegate(
                    totalAmountBigInt, 
                    durationBigInt, 
                    boosterIdBigInt, 
                    { gasLimit: gasLimit }
                );
                
                showToast("Waiting for confirmation...", "info");
                const receipt = await tx.wait();
                
                if (receipt.status === 0) {
                    throw new Error("Transaction reverted");
                }
                
                showToast("✅ Delegation successful!", "success");
                loadUserData();
                return true;
                
            } catch (e) {
                console.error(`Delegation attempt ${attempt} failed:`, e);
                
                if (isUserRejection(e)) {
                    showToast("Transaction cancelled", "error");
                    return false;
                }
                
                if (attempt < TX_CONFIG.MAX_RETRIES && isRetryableError(e)) {
                    await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                    continue;
                }
                
                if (e.message?.includes('Internal JSON-RPC')) {
                    showToast("Network busy - please try again", "error");
                } else {
                    showToast(formatError(e), "error");
                }
                return false;
            }
        }
        
        return false;
        
    } catch (e) {
        console.error("Delegation error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// UNDELEGATE (Normal - quando unlocked)
// ====================================================================

export async function executeUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Unstake';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const indexNum = Number(index);
        if (isNaN(indexNum) || indexNum < 0) {
            showToast("Invalid delegation index", "error");
            return false;
        }
        
        const indexBigInt = BigInt(indexNum);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        console.log("Unstake params:", { 
            index: indexBigInt.toString(), 
            boosterId: boosterIdBigInt.toString() 
        });
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithRetry(
            () => delegationContract.unstake(indexBigInt, boosterIdBigInt),
            {
                description: 'Unstake',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm unstake in wallet...", "info");
                },
                onSuccess: async () => {
                    showToast("✅ Unstaked!", "success");
                    await loadUserData(true);
                    await loadUserDelegations(true);
                }
            }
        );
        
        return result.success;
        
    } catch (e) {
        console.error("Unstake error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// FORCE UNSTAKE (quando locked - com penalidade)
// ====================================================================

export async function executeForceUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Force Unstake';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const indexNum = Number(index);
        if (isNaN(indexNum) || indexNum < 0) {
            showToast("Invalid delegation index", "error");
            return false;
        }
        
        const indexBigInt = BigInt(indexNum);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithRetry(
            () => delegationContract.forceUnstake(indexBigInt, boosterIdBigInt),
            {
                description: 'Force Unstake',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm force unstake in wallet...", "info");
                },
                onSuccess: async () => {
                    showToast("✅ Force unstaked (penalty applied)", "success");
                    await loadUserData(true);
                    await loadUserDelegations(true);
                }
            }
        );
        
        return result.success;
        
    } catch (e) {
        console.error("Force unstake error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// CLAIM REWARDS
// ====================================================================

export async function executeClaimRewards(boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
        btnElement.disabled = true;
    }
    
    try {
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithRetry(
            () => delegationContract.claimReward(boosterIdBigInt),
            {
                description: 'Claim Rewards',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm claim in wallet...", "info");
                },
                onSuccess: () => {
                    showToast("✅ Rewards claimed!", "success");
                    loadUserData();
                }
            }
        );
        
        return result.success;
        
    } catch (e) {
        console.error("Claim rewards error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// UNIVERSAL CLAIM (Staking + Mining Rewards)
// ====================================================================

export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        // Validate boosterId
        let boosterIdBigInt = 0n;
        try {
            const boosterNum = Number(boosterIdToSend || 0);
            if (boosterNum > 0 && State.myBoosters && State.myBoosters.length > 0) {
                const ownsBooster = State.myBoosters.some(b => 
                    Number(b.tokenId) === boosterNum
                );
                if (ownsBooster) {
                    boosterIdBigInt = BigInt(boosterNum);
                }
            }
        } catch (e) {
            console.warn("Invalid booster ID for claim, using 0:", e);
        }
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithRetry(
            () => delegationContract.claimReward(boosterIdBigInt),
            {
                description: 'Claim Rewards',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm claim in wallet...", "info");
                },
                onSuccess: async () => {
                    showToast("✅ Rewards claimed!", "success");
                    await loadUserData(true);
                }
            }
        );
        
        return result.success;
        
    } catch (e) {
        console.error("Claim error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// NFT POOL - BUY
// ====================================================================

export async function executeBuyNFT(poolAddress, priceWithTax, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Buy';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const priceBigInt = BigInt(priceWithTax);
        
        const approved = await robustApprove(
            addresses.bkcToken,
            poolAddress,
            priceBigInt,
            signer
        );
        if (!approved) return { success: false };
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        const result = await executeWithRetry(
            () => poolContract.buyNFT(),
            {
                description: 'Buy NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm purchase in wallet...", "info");
                }
            }
        );
        
        if (result.success) {
            let tokenId = null;
            for (const log of result.receipt.logs) {
                try {
                    const parsed = poolContract.interface.parseLog(log);
                    if (parsed?.name === "NFTPurchased") {
                        tokenId = parsed.args.tokenId?.toString();
                        break;
                    }
                } catch {}
            }
            
            showToast(`✅ NFT purchased! ${tokenId ? `#${tokenId}` : ''}`, "success");
            loadUserData();
            return { success: true, tokenId, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Buy NFT error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// NFT POOL - SELL
// ====================================================================

export async function executeSellNFT(poolAddress, tokenId, minPayout, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Sell';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        // Approve NFT for pool
        const nftABI = ["function approve(address,uint256)", "function getApproved(uint256) view returns (address)"];
        const nftContract = new ethers.Contract(addresses.rewardBoosterNFT, nftABI, signer);
        
        const approved = await nftContract.getApproved(tokenId);
        if (approved.toLowerCase() !== poolAddress.toLowerCase()) {
            showToast("Approving NFT...", "info");
            const approveTx = await nftContract.approve(poolAddress, tokenId);
            await approveTx.wait();
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        }
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        const result = await executeWithRetry(
            () => poolContract.sellNFT(tokenId, minPayout || 0),
            {
                description: 'Sell NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm sale in wallet...", "info");
                }
            }
        );
        
        if (result.success) {
            showToast("✅ NFT sold!", "success");
            loadUserData();
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Sell NFT error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// RENTAL - LIST NFT
// ====================================================================

export async function executeListNFT(params, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'List';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        // Support both object params and individual params
        let tokenId, pricePerHour, minHours, maxHours;
        if (typeof params === 'object' && params !== null) {
            tokenId = params.tokenId;
            pricePerHour = params.pricePerHour;
            minHours = params.minHours;
            maxHours = params.maxHours;
        } else {
            // Legacy support: params is tokenId
            tokenId = params;
            pricePerHour = arguments[1];
            minHours = arguments[2];
            maxHours = arguments[3];
            btnElement = arguments[4];
        }
        
        const rentalAddress = addresses.rentalManager;
        if (!rentalAddress) {
            showToast("Rental Manager not configured", "error");
            return { success: false };
        }
        
        // Approve NFT for rental manager
        const nftABI = [
            "function setApprovalForAll(address,bool)", 
            "function isApprovedForAll(address,address) view returns (bool)"
        ];
        const nftContract = new ethers.Contract(addresses.rewardBoosterNFT, nftABI, signer);
        
        const isApproved = await nftContract.isApprovedForAll(State.userAddress, rentalAddress);
        if (!isApproved) {
            showToast("Approving NFTs for rental...", "info");
            const approveTx = await nftContract.setApprovalForAll(rentalAddress, true);
            await approveTx.wait();
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        }
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';
        
        const rentalContract = new ethers.Contract(rentalAddress, rentalManagerABI, signer);
        
        const result = await executeWithRetry(
            () => rentalContract.listNFT(
                BigInt(tokenId), 
                BigInt(pricePerHour), 
                BigInt(minHours), 
                BigInt(maxHours)
            ),
            {
                description: 'List NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm listing in wallet...", "info");
                }
            }
        );
        
        if (result.success) {
            showToast(`✅ NFT #${tokenId} listed for rent!`, "success");
            loadRentalListings(true);
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("List NFT error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// RENTAL - RENT NFT
// ====================================================================

export async function executeRentNFT(params, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Rent';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        // Support both object params and individual params
        let tokenId, hours, totalCost;
        if (typeof params === 'object' && params !== null) {
            tokenId = params.tokenId;
            hours = params.hours;
            totalCost = params.totalCost;
        } else {
            tokenId = params;
            hours = arguments[1];
            totalCost = arguments[2];
            btnElement = arguments[3];
        }
        
        const rentalAddress = addresses.rentalManager;
        if (!rentalAddress) {
            showToast("Rental Manager not configured", "error");
            return { success: false };
        }
        
        const costBigInt = BigInt(totalCost);
        
        const approved = await robustApprove(
            addresses.bkcToken,
            rentalAddress,
            costBigInt,
            signer
        );
        if (!approved) return { success: false };
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';
        
        const rentalContract = new ethers.Contract(rentalAddress, rentalManagerABI, signer);
        
        const result = await executeWithRetry(
            () => rentalContract.rentNFT(BigInt(tokenId), BigInt(hours)),
            {
                description: 'Rent NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm rental in wallet...", "info");
                }
            }
        );
        
        if (result.success) {
            showToast(`✅ NFT #${tokenId} rented for ${hours} hours!`, "success");
            loadUserData();
            loadRentalListings(true);
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Rent NFT error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// RENTAL - WITHDRAW NFT
// ====================================================================

export async function executeWithdrawNFT(tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Withdraw';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const rentalAddress = addresses.rentalManager;
        const rentalContract = new ethers.Contract(rentalAddress, rentalManagerABI, signer);
        
        const result = await executeWithRetry(
            () => rentalContract.withdrawNFT(tokenId),
            {
                description: 'Withdraw NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm withdrawal in wallet...", "info");
                }
            }
        );
        
        if (result.success) {
            showToast("✅ NFT withdrawn!", "success");
            loadUserData();
            loadRentalListings();
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Withdraw NFT error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// FORTUNE POOL - PLAY GAME (ROBUST VERSION WITH SIMULATION BYPASS)
// ====================================================================

export async function executeFortuneGame(wager, guesses, isCumulative, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Play';
    
    // CRITICAL: Disable button immediately to prevent double-clicks
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const wagerBigInt = ethers.parseEther(wager.toString());
        const guessesArray = Array.isArray(guesses) ? guesses.map(g => BigInt(g)) : [BigInt(guesses)];
        
        console.log("Fortune Game params:", {
            wager: wager.toString(),
            wagerWei: wagerBigInt.toString(),
            guesses: guessesArray.map(g => g.toString()),
            isCumulative
        });
        
        const fortuneAddress = addresses.fortunePool || addresses.actionsManager;
        if (!fortuneAddress) {
            showToast("Fortune Pool not configured", "error");
            return { success: false };
        }
        
        const fortuneContract = new ethers.Contract(fortuneAddress, actionsManagerABI, signer);
        
        // 1. Verify active tiers
        let tierCount;
        try {
            tierCount = await fortuneContract.activeTierCount();
            console.log("Active tier count:", tierCount.toString());
            
            if (tierCount === 0n) {
                showToast("No active game tiers", "error");
                return { success: false };
            }
            
            const expectedGuessCount = isCumulative ? Number(tierCount) : 1;
            if (guessesArray.length !== expectedGuessCount) {
                showToast(`Need ${expectedGuessCount} guess(es), got ${guessesArray.length}`, "error");
                return { success: false };
            }
        } catch (e) {
            console.warn("Could not verify tier count:", e.message);
        }
        
        // 2. Check BKC balance
        const bkcBalance = await State.bkcTokenContract.balanceOf(State.userAddress);
        if (bkcBalance < wagerBigInt) {
            showToast("Insufficient BKC balance", "error");
            return { success: false };
        }
        
        // 3. Approve BKC with retry
        const approved = await robustApprove(
            addresses.bkcToken, 
            fortuneAddress, 
            wagerBigInt, 
            signer
        );
        if (!approved) return { success: false };
        
        // 4. Get oracle fee
        let oracleFee = 0n;
        try {
            oracleFee = await fortuneContract.getRequiredOracleFee(isCumulative);
            console.log("Oracle fee:", ethers.formatEther(oracleFee), "ETH");
        } catch (e) {
            console.warn("getRequiredOracleFee failed, trying oracleFee:", e.message);
            try {
                const baseFee = await fortuneContract.oracleFee();
                oracleFee = isCumulative ? baseFee * 5n : baseFee;
            } catch {
                oracleFee = 0n;
            }
        }
        
        // 5. Check ETH balance
        let rawProvider = State.web3Provider || State.provider || window.ethereum;
        const provider = new ethers.BrowserProvider(rawProvider);
        const ethBalance = await provider.getBalance(State.userAddress);
        
        console.log("ETH balance:", ethers.formatEther(ethBalance), "ETH");
        
        if (oracleFee > 0n && ethBalance < oracleFee) {
            showToast(`Need ${ethers.formatEther(oracleFee)} ETH for oracle fee`, "error");
            return { success: false };
        }
        
        // 6. Estimate gas first, then execute with explicit gasLimit
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Preparing...';
        
        // Pre-estimate gas to avoid MetaMask simulation issues
        let gasLimit = 500000n; // Safe default
        try {
            const estimatedGas = await fortuneContract.participate.estimateGas(
                wagerBigInt, 
                guessesArray, 
                isCumulative, 
                { value: oracleFee }
            );
            // Add 50% buffer for safety
            gasLimit = (estimatedGas * 150n) / 100n;
            console.log("Gas estimated successfully:", estimatedGas.toString(), "→ Using:", gasLimit.toString());
        } catch (estimateError) {
            console.warn("Gas estimation failed (this is often normal):", estimateError.message);
            // Keep default gasLimit
        }
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Submitting...';
        
        console.log("Calling participate with:", {
            wagerAmount: wagerBigInt.toString(),
            guesses: guessesArray.map(g => g.toString()),
            isCumulative,
            value: oracleFee.toString(),
            gasLimit: gasLimit.toString()
        });
        
        // Execute with explicit gasLimit to bypass MetaMask simulation issues
        for (let attempt = 1; attempt <= TX_CONFIG.MAX_RETRIES; attempt++) {
            try {
                if (attempt === 1) {
                    showToast("Confirm game in wallet...", "info");
                } else {
                    // Wait before retry
                    await sleep(TX_CONFIG.RETRY_DELAY_MS);
                    showToast(`Retrying... (${attempt}/${TX_CONFIG.MAX_RETRIES})`, "warning");
                }
                
                // Always use explicit gasLimit to prevent simulation issues
                const tx = await fortuneContract.participate(wagerBigInt, guessesArray, isCumulative, { 
                    value: oracleFee,
                    gasLimit: gasLimit
                });
                
                showToast("Waiting for confirmation...", "info");
                const receipt = await tx.wait();
                
                if (receipt.status === 0) {
                    throw new Error("Transaction reverted");
                }
                
                // Extract gameId from event
                let gameId = null;
                for (const log of receipt.logs) {
                    try {
                        const parsed = fortuneContract.interface.parseLog(log);
                        if (parsed?.name === "GameRequested") {
                            gameId = parsed.args.gameId?.toString();
                            break;
                        }
                    } catch {}
                }
                
                showToast("🎰 Game submitted! Waiting for result...", "success");
                loadUserData();
                
                return { success: true, gameId, txHash: receipt.hash };
                
            } catch (e) {
                console.error(`Fortune attempt ${attempt} failed:`, e);
                
                if (isUserRejection(e)) {
                    showToast("Transaction cancelled", "error");
                    return { success: false, cancelled: true };
                }
                
                if (attempt < TX_CONFIG.MAX_RETRIES && isRetryableError(e)) {
                    await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                    continue;
                }
                
                // Final attempt failed
                const errorMsg = e?.message || '';
                if (errorMsg.includes('ZeroAmount')) {
                    showToast("Wager cannot be zero", "error");
                } else if (errorMsg.includes('NoActiveTiers')) {
                    showToast("No active game tiers", "error");
                } else if (errorMsg.includes('InvalidGuessCount')) {
                    showToast("Wrong number of guesses", "error");
                } else if (errorMsg.includes('InvalidGuessRange')) {
                    showToast("Guess out of range", "error");
                } else if (errorMsg.includes('InsufficientOracleFee')) {
                    showToast("Incorrect oracle fee", "error");
                } else if (errorMsg.includes('InsufficientBalance') || errorMsg.includes('insufficient')) {
                    showToast("Insufficient BKC balance", "error");
                } else if (errorMsg.includes('Internal JSON-RPC')) {
                    showToast("Network busy - please try again", "error");
                } else {
                    showToast(formatError(e), "error");
                }
                return { success: false };
            }
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Fortune error:", e);
        showToast(formatError(e), "error");
        return { success: false };
        
    } finally {
        // ALWAYS re-enable button
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// NOTARIZE DOCUMENT (WITH SIMULATION BYPASS)
// ====================================================================

export async function executeNotarize(params, submitButton) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = submitButton?.innerHTML || 'Notarize';
    if (submitButton) {
        submitButton.innerHTML = '<div class="loader inline-block"></div> Processing...';
        submitButton.disabled = true;
    }
    
    try {
        const { ipfsUri, contentHash, description } = params;
        
        const notaryAddress = addresses.decentralizedNotary || addresses.notary;
        
        if (!notaryAddress) {
            showToast("Notary contract not configured", "error");
            return false;
        }
        
        // Get fee
        let feeToPay = ethers.parseEther("1");
        try {
            const notaryRead = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer.provider);
            feeToPay = await notaryRead.calculateFee(0);
        } catch (e) {}
        
        // Approve BKC
        const approved = await robustApprove(addresses.bkcToken, notaryAddress, feeToPay, signer);
        if (!approved) return false;
        
        if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Notarizing...';
        
        const notaryContract = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer);
        
        // Get booster for discount
        let boosterTokenId = 0n;
        try {
            const boosterInfo = await getHighestBoosterBoostFromAPI();
            if (boosterInfo?.tokenId) {
                boosterTokenId = BigInt(boosterInfo.tokenId);
            }
        } catch (e) {}
        
        // Pre-estimate gas to avoid simulation issues
        let gasLimit = 400000n;
        try {
            const estimatedGas = await notaryContract.notarize.estimateGas(
                ipfsUri, 
                description || '', 
                contentHash, 
                boosterTokenId
            );
            gasLimit = (estimatedGas * 150n) / 100n;
            console.log("Notarize gas estimated:", estimatedGas.toString(), "→ Using:", gasLimit.toString());
        } catch (e) {
            console.warn("Gas estimation failed, using default:", e.message);
        }
        
        // Execute with explicit gasLimit
        for (let attempt = 1; attempt <= TX_CONFIG.MAX_RETRIES; attempt++) {
            try {
                if (attempt === 1) {
                    showToast("Confirm notarization in wallet...", "info");
                } else {
                    await sleep(TX_CONFIG.RETRY_DELAY_MS);
                    showToast(`Retrying... (${attempt}/${TX_CONFIG.MAX_RETRIES})`, "warning");
                }
                
                const tx = await notaryContract.notarize(
                    ipfsUri, 
                    description || '', 
                    contentHash, 
                    boosterTokenId, 
                    { gasLimit: gasLimit }
                );
                
                showToast("Waiting for confirmation...", "info");
                const receipt = await tx.wait();
                
                if (receipt.status === 0) {
                    throw new Error("Transaction reverted");
                }
                
                let tokenId = null;
                for (const log of receipt.logs) {
                    try {
                        const parsed = notaryContract.interface.parseLog(log);
                        if (parsed?.name === "DocumentNotarized") {
                            tokenId = parsed.args.tokenId?.toString();
                            break;
                        }
                    } catch {}
                }
                
                showToast(`✅ Document notarized! ${tokenId ? `#${tokenId}` : ''}`, "success");
                return { success: true, tokenId, txHash: receipt.hash };
                
            } catch (e) {
                console.error(`Notarize attempt ${attempt} failed:`, e);
                
                if (isUserRejection(e)) {
                    showToast("Transaction cancelled", "error");
                    return false;
                }
                
                if (attempt < TX_CONFIG.MAX_RETRIES && isRetryableError(e)) {
                    await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                    continue;
                }
                
                if (e.message?.includes('Internal JSON-RPC')) {
                    showToast("Network busy - please try again", "error");
                } else {
                    showToast(formatError(e), "error");
                }
                return false;
            }
        }
        
        return false;
        
    } catch (e) {
        console.error("Notarize error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }
}

// Alias
export const executeNotarizeDocument = executeNotarize;

// ====================================================================
// FAUCET - Via API
// ====================================================================

const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";

export async function executeFaucetClaim(btnElement) {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return { success: false };
    }
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
        btnElement.disabled = true;
    }
    
    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast("✅ Tokens received!", "success");
            loadUserData();
            return { 
                success: true, 
                txHash: data.txHash,
                bkcAmount: data.bkcAmount,
                ethAmount: data.ethAmount
            };
        } else {
            const msg = data.error || data.message || "Faucet unavailable";
            showToast(msg, "error");
            return { success: false, error: msg };
        }
        
    } catch (e) {
        console.error("Faucet error:", e);
        showToast("Faucet unavailable", "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// ALIASES
// ====================================================================

export const executeBuyBooster = executeBuyNFT;
export const executeSellBooster = executeSellNFT;
export const executeFortuneParticipate = executeFortuneGame;