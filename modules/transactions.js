// js/modules/transactions.js
// ✅ PRODUCTION V13.2 - Improved Gas Error Messages + Faucet Link

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI, decentralizedNotaryABI, actionsManagerABI, delegationManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings, loadUserDelegations } from './data.js';
import { recordPlatformUsage } from './firebase-auth-service.js';

// ====================================================================
// CONFIGURATION
// ====================================================================

// Arbitrum Sepolia Faucet Links
const FAUCET_LINKS = {
    arbitrumSepolia: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
    alternativeFaucet: 'https://faucet.quicknode.com/arbitrum/sepolia'
};

// ====================================================================
// CONFIGURATION
// ====================================================================

const TX_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    APPROVAL_WAIT_MS: 1500,  // Esperar após aprovação
    SIMULATION_TIMEOUT_MS: 10000
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

// ====================================================================
// PLATFORM USAGE TRACKING (com retry e notificação destacada)
// ====================================================================

const TRACKING_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1500,
    TOAST_DURATION_MS: 4000
};

/**
 * Registra pontos de uso da plataforma para o Airdrop.
 * Executa em background com retry, não bloqueia o fluxo principal.
 * Mostra notificação destacada de sucesso.
 */
async function trackPlatformUsage(actionType, txHash) {
    if (!txHash) {
        console.warn("trackPlatformUsage: No txHash provided, skipping");
        return;
    }

    // Executa tracking com retry em background
    (async () => {
        for (let attempt = 1; attempt <= TRACKING_CONFIG.MAX_RETRIES; attempt++) {
            try {
                const result = await recordPlatformUsage(actionType, txHash);
                
                if (result.success) {
                    // Notificação destacada de pontos ganhos
                    showAirdropPointsToast(result.pointsAwarded, result.newCount, result.maxCount);
                    console.log(`✅ Airdrop tracking: ${actionType} +${result.pointsAwarded} pts (${result.newCount}/${result.maxCount})`);
                    return; // Sucesso, sai do loop
                } else if (result.reason === 'max_reached') {
                    console.log(`Airdrop tracking: ${actionType} max reached (${result.reason})`);
                    return; // Não é erro, apenas atingiu o limite
                } else if (result.reason === 'cooldown') {
                    console.log(`Airdrop tracking: ${actionType} on cooldown`);
                    return; // Não é erro, está em cooldown
                } else if (result.reason === 'duplicate_tx') {
                    console.log(`Airdrop tracking: ${actionType} duplicate tx`);
                    return; // Transação já processada
                } else {
                    throw new Error(result.reason || 'Unknown error');
                }
                
            } catch (e) {
                console.warn(`Airdrop tracking attempt ${attempt}/${TRACKING_CONFIG.MAX_RETRIES} failed:`, e.message);
                
                if (attempt < TRACKING_CONFIG.MAX_RETRIES) {
                    await sleep(TRACKING_CONFIG.RETRY_DELAY_MS * attempt);
                    continue;
                }
                
                // Falhou todas as tentativas - não mostra erro ao usuário (não crítico)
                console.error(`Airdrop tracking failed for ${actionType} after ${TRACKING_CONFIG.MAX_RETRIES} attempts`);
            }
        }
    })();
}

/**
 * Mostra toast especial para pontos do Airdrop (mais visível)
 */
function showAirdropPointsToast(points, current, max) {
    // Usa o showToast existente com estilo "success" para destaque
    const message = `🎯 +${points.toLocaleString()} Airdrop Points! (${current}/${max})`;
    showToast(message, "success");
    
    // Log para debug
    console.log(`🎯 AIRDROP POINTS AWARDED: +${points} (${current}/${max})`);
}

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
    
    // Gas/ETH errors - MENSAGENS MAIS CLARAS
    if (msg.includes('insufficient funds') || msg.includes('exceeds the balance')) {
        return 'INSUFFICIENT_GAS'; // Código especial para tratamento
    }
    if (msg.includes('exceeds balance') && !msg.includes('gas')) return 'Insufficient token balance';
    
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

/**
 * Mostra erro de falta de gas com link para faucet
 */
function showInsufficientGasError() {
    // Mostra toast com mensagem clara
    showToast("⛽ You're out of ETH for gas fees!", "error");
    
    // Mostra modal com instruções e link
    setTimeout(() => {
        showGasFaucetModal();
    }, 500);
}

/**
 * Modal com instruções para obter gas
 */
function showGasFaucetModal() {
    const existingModal = document.getElementById('gas-faucet-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'gas-faucet-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
        <div class="relative bg-zinc-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <button onclick="this.closest('#gas-faucet-modal').remove()" class="absolute top-4 right-4 text-zinc-400 hover:text-white">
                <i class="fa-solid fa-times text-xl"></i>
            </button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-gas-pump text-3xl text-red-400"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Out of Gas!</h3>
                <p class="text-zinc-400 text-sm">You need ETH on Arbitrum Sepolia to pay for transaction fees (gas).</p>
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
                    <strong>Tip:</strong> Request testnet ETH from any faucet above. It usually takes 1-2 minutes to arrive.
                </p>
            </div>
            
            <button onclick="this.closest('#gas-faucet-modal').remove()" 
                    class="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Processa erro e mostra mensagem apropriada
 */
function handleTransactionError(error) {
    const formattedError = formatError(error);
    
    if (formattedError === 'INSUFFICIENT_GAS') {
        showInsufficientGasError();
        return 'Insufficient ETH for gas';
    }
    
    showToast(formattedError, "error");
    return formattedError;
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
            
            handleTransactionError(e);
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
            
            handleTransactionError(e);
            return { success: false, error: e };
        }
    }
    
    return { success: false };
}

// ====================================================================
// DELEGATION
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
        
        const result = await executeWithRetry(
            () => delegationContract.delegate(totalAmountBigInt, durationBigInt, boosterIdBigInt),
            {
                description: 'Delegation',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm delegation in wallet...", "info");
                },
                onSuccess: () => {
                    showToast("✅ Delegation successful!", "success");
                    loadUserData();
                }
            }
        );
        
        // Track platform usage for airdrop points
        if (result.success && result.txHash) {
            trackPlatformUsage('delegation', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Delegation error:", e);
        handleTransactionError(e);
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
        
        // Track platform usage for airdrop points
        if (result.success && result.txHash) {
            trackPlatformUsage('unstake', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Unstake error:", e);
        handleTransactionError(e);
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
        
        // Track platform usage for airdrop points
        if (result.success && result.txHash) {
            trackPlatformUsage('unstake', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Force unstake error:", e);
        handleTransactionError(e);
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
        
        // Track platform usage for airdrop points
        if (result.success && result.txHash) {
            trackPlatformUsage('claimReward', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Claim rewards error:", e);
        handleTransactionError(e);
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
        
        // Track platform usage for airdrop points
        if (result.success && result.txHash) {
            trackPlatformUsage('claimReward', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Claim error:", e);
        handleTransactionError(e);
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
            
            // Track platform usage for airdrop points
            trackPlatformUsage('buyNFT', result.txHash);
            
            return { success: true, tokenId, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Buy NFT error:", e);
        handleTransactionError(e);
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
        // 🔧 FIX: Validate and extract tokenId if object was passed
        let validTokenId = tokenId;
        if (typeof tokenId === 'object' && tokenId !== null) {
            // If an NFT object was passed instead of just tokenId
            validTokenId = tokenId.tokenId || tokenId.id || tokenId.token_id;
            console.warn('executeSellNFT: Object passed instead of tokenId, extracted:', validTokenId);
        }
        
        if (validTokenId === undefined || validTokenId === null || validTokenId === '') {
            console.error('executeSellNFT: Invalid tokenId:', tokenId);
            showToast("Invalid NFT token ID", "error");
            return { success: false };
        }
        
        // Convert to BigInt safely
        try {
            validTokenId = BigInt(validTokenId);
        } catch (e) {
            console.error('executeSellNFT: Cannot convert tokenId to BigInt:', validTokenId);
            showToast("Invalid NFT token ID format", "error");
            return { success: false };
        }
        
        // Validate minPayout
        let validMinPayout = 0n;
        if (minPayout !== undefined && minPayout !== null && minPayout !== '') {
            try {
                validMinPayout = BigInt(minPayout);
            } catch (e) {
                console.warn('executeSellNFT: Invalid minPayout, using 0');
                validMinPayout = 0n;
            }
        }
        
        // Approve NFT for pool
        const nftABI = ["function approve(address,uint256)", "function getApproved(uint256) view returns (address)"];
        const nftContract = new ethers.Contract(addresses.rewardBoosterNFT, nftABI, signer);
        
        const approved = await nftContract.getApproved(validTokenId);
        if (approved.toLowerCase() !== poolAddress.toLowerCase()) {
            showToast("Approving NFT...", "info");
            const approveTx = await nftContract.approve(poolAddress, validTokenId);
            await approveTx.wait();
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        }
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        const result = await executeWithRetry(
            () => poolContract.sellNFT(validTokenId, validMinPayout),
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
            
            // Track platform usage for airdrop points
            trackPlatformUsage('sellNFT', result.txHash);
            
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Sell NFT error:", e);
        handleTransactionError(e);
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
            
            // Track platform usage for airdrop points
            trackPlatformUsage('listRental', result.txHash);
            
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("List NFT error:", e);
        handleTransactionError(e);
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
            
            // Track platform usage for airdrop points
            trackPlatformUsage('rentNFT', result.txHash);
            
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Rent NFT error:", e);
        handleTransactionError(e);
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
        handleTransactionError(e);
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// ====================================================================
// FORTUNE POOL V2 - PLAY GAME (INSTANT RESOLUTION)
// ====================================================================
// 
// V2 CHANGES:
// - Uses BackchainRandomness Oracle for instant results
// - No more polling for oracle callbacks  
// - Results returned directly from play() function
// - No oracle fee required (FREE!)
//
// ====================================================================

// FortunePool V2 ABI
const fortunePoolV2ABI = [
    "function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable",
    "function prizePoolBalance() external view returns (uint256)",
    "function gameCounter() external view returns (uint256)",
    "function activeTierCount() external view returns (uint256)",
    "function serviceFee() external view returns (uint256)",
    "function getRequiredServiceFee(bool _isCumulative) external view returns (uint256)",
    "function getExpectedGuessCount(bool _isCumulative) external view returns (uint256)",
    "function getTier(uint256 _tierId) external view returns (uint128 maxRange, uint64 multiplierBips, bool active)",
    "function getAllTiers() external view returns (uint128[] memory ranges, uint64[] memory multipliers)",
    "event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)",
    "event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)",
    "event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"
];

/**
 * Execute Fortune Pool V2 Game - INSTANT RESOLUTION
 * Results are returned directly - no polling needed!
 * Requires serviceFee in ETH for project funding
 */
export async function executeFortunePlay(wager, guesses, isCumulative, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Play';
    
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }
    
    try {
        const wagerBigInt = ethers.parseEther(wager.toString());
        const guessesArray = Array.isArray(guesses) ? guesses.map(g => BigInt(g)) : [BigInt(guesses)];
        
        console.log("Fortune V2 Play params:", {
            wager: wager.toString(),
            wagerWei: wagerBigInt.toString(),
            guesses: guessesArray.map(g => g.toString()),
            isCumulative
        });
        
        // Get contract address - prefer V2
        const fortuneAddress = addresses.fortunePoolV2 || addresses.fortunePool || addresses.actionsManager;
        if (!fortuneAddress) {
            showToast("Fortune Pool not configured", "error");
            return { success: false };
        }
        
        const fortuneContract = new ethers.Contract(fortuneAddress, fortunePoolV2ABI, signer);
        
        // 1. Verify active tiers
        let tierCount = 0n;
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
        
        // 2. Get required service fee (ETH)
        let requiredFee = 0n;
        try {
            requiredFee = await fortuneContract.getRequiredServiceFee(isCumulative);
            console.log("Required service fee:", ethers.formatEther(requiredFee), "ETH");
        } catch (e) {
            console.warn("Could not get service fee, using 0:", e.message);
        }
        
        // 3. Check ETH balance for service fee
        if (requiredFee > 0n) {
            const ethBalance = await signer.provider.getBalance(State.userAddress);
            if (ethBalance < requiredFee) {
                showToast(`Insufficient ETH for game fee (need ${ethers.formatEther(requiredFee)} ETH)`, "error");
                return { success: false };
            }
        }
        
        // 4. Check BKC balance
        const bkcBalance = await State.bkcTokenContract.balanceOf(State.userAddress);
        if (bkcBalance < wagerBigInt) {
            showToast("Insufficient BKC balance", "error");
            return { success: false };
        }
        
        // 5. Approve BKC
        const approved = await robustApprove(
            addresses.bkcToken, 
            fortuneAddress, 
            wagerBigInt, 
            signer
        );
        if (!approved) return { success: false };
        
        // 6. Execute play() with service fee - V2 returns results instantly!
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> 🎰 Rolling...';
        
        const result = await executeWithRetry(
            () => fortuneContract.play(wagerBigInt, guessesArray, isCumulative, { value: requiredFee }),
            {
                description: 'Fortune Game V2',
                retries: TX_CONFIG.MAX_RETRIES,
                onAttempt: (attempt) => {
                    if (attempt === 1) {
                        showToast("Confirm game in wallet...", "info");
                    } else {
                        showToast(`Retrying... (${attempt}/${TX_CONFIG.MAX_RETRIES})`, "warning");
                    }
                }
            }
        );
        
        if (result.success) {
            // Parse results from events
            let gameId = null;
            let rolls = [];
            let prizeWon = 0;
            let matches = [];
            let matchCount = 0;
            let isJackpot = false;
            
            for (const log of result.receipt.logs) {
                try {
                    const parsed = fortuneContract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    
                    if (parsed?.name === "GamePlayed") {
                        gameId = Number(parsed.args.gameId);
                        prizeWon = Number(ethers.formatEther(parsed.args.prizeWon));
                        matchCount = Number(parsed.args.matchCount);
                    }
                    
                    if (parsed?.name === "GameDetails") {
                        rolls = parsed.args.rolls.map(r => Number(r));
                        matches = Array.from(parsed.args.matches);
                    }
                    
                    if (parsed?.name === "JackpotWon") {
                        isJackpot = true;
                    }
                } catch (e) {
                    // Not our event
                }
            }
            
            // Show result
            if (prizeWon > 0) {
                if (isJackpot) {
                    showToast(`🎰🎰🎰 JACKPOT! You won ${prizeWon.toLocaleString()} BKC! 🎉`, "success");
                } else {
                    showToast(`🎉 YOU WON ${prizeWon.toLocaleString()} BKC!`, "success");
                }
            } else {
                showToast("No match this time. Try again!", "warning");
            }
            
            loadUserData();
            trackPlatformUsage('fortune', result.txHash);
            
            return { 
                success: true, 
                gameId, 
                rolls,
                guesses: guessesArray.map(g => Number(g)),
                prizeWon,
                matches,
                matchCount,
                isJackpot,
                isCumulative,
                txHash: result.txHash 
            };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Fortune V2 error:", e);
        
        const errorMsg = e?.message || '';
        if (errorMsg.includes('ZeroAmount')) {
            showToast("Wager cannot be zero", "error");
        } else if (errorMsg.includes('NoActiveTiers')) {
            showToast("No active game tiers", "error");
        } else if (errorMsg.includes('InvalidGuessCount')) {
            showToast("Wrong number of guesses", "error");
        } else if (errorMsg.includes('InvalidGuessRange')) {
            showToast("Guess out of range", "error");
        } else if (errorMsg.includes('OracleNotSet')) {
            showToast("Oracle not configured", "error");
        } else if (errorMsg.includes('InsufficientServiceFee')) {
            showToast("Insufficient ETH for game fee", "error");
        } else if (errorMsg.includes('InsufficientPrizePool')) {
            showToast("Prize pool too low", "error");
        } else if (errorMsg.includes('InsufficientBalance') || errorMsg.includes('insufficient')) {
            showToast("Insufficient BKC balance", "error");
        } else {
            handleTransactionError(e);
        }
        return { success: false };
        
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// Alias for backwards compatibility - V2 is now default
export const executeFortuneGame = executeFortunePlay;
export const executeFortuneParticipate = executeFortunePlay;

// ====================================================================
// NOTARIZE DOCUMENT
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
        
        const result = await executeWithRetry(
            () => notaryContract.notarize(ipfsUri, description || '', contentHash, boosterTokenId),
            {
                description: 'Notarize',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm notarization in wallet...", "info");
                }
            }
        );
        
        if (result.success) {
            let tokenId = null;
            for (const log of result.receipt.logs) {
                try {
                    const parsed = notaryContract.interface.parseLog(log);
                    if (parsed?.name === "DocumentNotarized") {
                        tokenId = parsed.args.tokenId?.toString();
                        break;
                    }
                } catch {}
            }
            
            showToast(`✅ Document notarized! ${tokenId ? `#${tokenId}` : ''}`, "success");
            
            // Track platform usage for airdrop points
            trackPlatformUsage('notarize', result.txHash);
            
            return { success: true, tokenId, txHash: result.txHash };
        }
        
        return false;
        
    } catch (e) {
        console.error("Notarize error:", e);
        handleTransactionError(e);
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
            
            // Track platform usage for airdrop points
            if (data.txHash) {
                trackPlatformUsage('faucet', data.txHash);
            }
            
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
// Fortune aliases already defined after executeFortunePlay function