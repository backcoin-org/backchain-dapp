// js/modules/transactions.js
// ✅ VERSÃO FINAL V7.7 (DASHBOARD SYNC FIX): Padronização do Claim para atualizar UI

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, FAUCET_AMOUNT_WEI, nftPoolABI, rentalManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js'; 

// --- Tolerance Constants ---
const APPROVAL_TOLERANCE_BIPS = 100n; 
const BIPS_DENOMINATOR = 10000n; 

/**
 * ⚡ GAS HELPER V2
 * Calcula gás dinâmico com margem de segurança e fallbacks.
 */
export async function getGasWithMargin(contract, method, args, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const estimatedGas = await contract[method].estimateGas(...args);
            const gasWithMargin = (estimatedGas * 120n) / 100n;
            console.log(`✅ ${method} Gas: ${estimatedGas.toString()} → ${gasWithMargin.toString()}`);
            return { gasLimit: gasWithMargin };
        } catch (error) {
            if (i < retries && !error.message?.includes("execution reverted") && !error.data) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            if (error.message?.includes("execution reverted") || error.data) {
                throw error;
            }
            
            // Fallbacks contextuais
            const fallbacks = {
                'approve': 100000n, 'transfer': 65000n,
                'participate': 800000n, 'buyNextAvailableNFT': 500000n,
                'sellNFT': 400000n, 'claim': 200000n, 'mint': 150000n,
                'notarize': 300000n, 'listNFT': 250000n, 'rentNFT': 350000n,
                'stake': 200000n, 'unstake': 180000n, 'claimRewards': 250000n,
                'claimReward': 250000n // Singular
            };
            const fallbackGas = fallbacks[method] || 300000n;
            return { gasLimit: fallbackGas };
        }
    }
}

// ====================================================================
// CORE UTILITIES
// ====================================================================

async function getConnectedSigner() {
    if (!State.isConnected) {
        showToast("Wallet not connected.", "error");
        return null;
    }
    if (State.web3Provider) {
        try {
            const provider = new ethers.BrowserProvider(State.web3Provider);
            return await provider.getSigner(); 
        } catch (e) {
            console.error("Signer Error:", e);
            return null;
        }
    }
    return null;
}

// 🔥 WRAPPER PRINCIPAL (CORRIGIDO PARA ATUALIZAR DASHBOARD)
async function executeTransaction(txPromise, successMessage, failMessage, btnElement) {
    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...';
    }

    try {
        const tx = await txPromise;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Confirming...';
        showToast('Submitting transaction...', 'info');
        
        const receipt = await tx.wait();
        showToast(successMessage, 'success', receipt.hash);

        // ✅ ATUALIZAÇÃO CRÍTICA DO DASHBOARD
        console.log("🔄 Transaction confirmed. Refreshing data...");
        await loadUserData(); 
        
        if (window.location.hash.includes('rental') || window.location.hash.includes('dashboard')) {
             if (typeof loadRentalListings === 'function') await loadRentalListings(); 
        }
        
        // Reforço de atualização
        setTimeout(async () => {
            await loadUserData();
            if (window.updateUIState) window.updateUIState(true); // Força render do Dashboard
        }, 2000);

        return true;
    } catch (e) {
        console.error("Transaction Error:", e);
        let reason = 'Transaction rejected.';
        if (e.reason) reason = e.reason;
        else if (e.message) reason = e.message;

        if (reason.includes("Internal JSON-RPC error") || reason.includes("code=-32603")) {
            reason = "RPC Error: Network busy. Reset MetaMask activity or check ETH balance.";
        }
        
        showToast(`${failMessage}: ${reason}`, "error");
        return false;
    } finally {
        if(btnElement) {
            setTimeout(() => {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
            }, 1000);
        }
    }
}

async function ensureApproval(tokenContract, spenderAddress, amountOrTokenId, btnElement, purpose) {
    const signer = await getConnectedSigner(); 
    if (!signer) return false;
    
    const approvedTokenContract = tokenContract.connect(signer);
    
    const setBtnLoading = (text) => {
        if(btnElement) {
            btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
            btnElement.disabled = true;
        }
    };

    try {
        let isERC721 = false;
        try { const fn = tokenContract.interface.getFunction("setApprovalForAll"); isERC721 = !!fn; } catch (e) {}

        if (!isERC721) {
            const requiredAmount = BigInt(amountOrTokenId);
            if (requiredAmount === 0n) return true;
            
            setBtnLoading("Checking Allowance");
            const allowance = await tokenContract.allowance(State.userAddress, spenderAddress); 
            const toleratedAmount = (requiredAmount * (BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BIPS_DENOMINATOR;

            if (allowance < toleratedAmount) {
                showToast(`Approving BKC for ${purpose}...`, "info");
                setBtnLoading("Approving");
                
                const args = [spenderAddress, toleratedAmount];
                const gasOpts = await getGasWithMargin(approvedTokenContract, 'approve', args);
                
                const approveTx = await approvedTokenContract.approve(...args, gasOpts);
                await approveTx.wait();
                showToast('Approval successful!', "success");
            }
            return true;
        } else {
            const tokenId = BigInt(amountOrTokenId);
            setBtnLoading("Checking NFT Approval");
            let approvedAddr = ethers.ZeroAddress;
            try { approvedAddr = await tokenContract.getApproved(tokenId); } catch(e) {} 
            const isApprovedAll = await tokenContract.isApprovedForAll(State.userAddress, spenderAddress);
            
            if (approvedAddr.toLowerCase() !== spenderAddress.toLowerCase() && !isApprovedAll) {
                showToast(`Approving NFT...`, "info");
                setBtnLoading("Approving NFT");
                
                const args = [spenderAddress, tokenId];
                const gasOpts = await getGasWithMargin(approvedTokenContract, 'approve', args);
                
                const approveTx = await approvedTokenContract.approve(...args, gasOpts);
                await approveTx.wait();
                showToast('NFT Approval successful!', "success");
            }
            return true;
        }
    } catch (e) {
        console.error("Approval error:", e);
        showToast(`Approval error: ${e.reason || e.message}`, "error");
        return false;
    }
}

// ====================================================================
// 1. STAKING WORKFLOW
// ====================================================================

export async function executeStake(amount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !State.delegationManagerContract) return false;
    
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    if (amountWei <= 0n) { showToast("Invalid amount.", "error"); return false; }
    if (amountWei > State.currentUserBalance) { showToast("Insufficient BKC.", "error"); return false; }

    const approved = await ensureApproval(State.bkcTokenContract, await State.delegationManagerContract.getAddress(), amountWei, btnElement, "Staking");
    if (!approved) return false;

    const delegationManagerContract = State.delegationManagerContract.connect(signer); 
    const args = [amountWei];
    const gasOpts = await getGasWithMargin(delegationManagerContract, 'stake', args);
    const stakeTxPromise = delegationManagerContract.stake(...args, gasOpts);

    return await executeTransaction(stakeTxPromise, 'Staking successful!', 'Error staking', btnElement);
}

export async function executeUnstake(amount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !State.delegationManagerContract) return false;
    
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    if (amountWei <= 0n) { showToast("Invalid amount.", "error"); return false; }

    const delegationManagerContract = State.delegationManagerContract.connect(signer); 
    const args = [amountWei];
    const gasOpts = await getGasWithMargin(delegationManagerContract, 'unstake', args);
    const unstakeTxPromise = delegationManagerContract.unstake(...args, gasOpts);

    return await executeTransaction(unstakeTxPromise, 'Unstaked successfully!', 'Error unstaking', btnElement);
}

// ====================================================================
// 2. REWARD CLAIM (CORRIGIDO PARA USAR WRAPPER E ATUALIZAR DASHBOARD)
// ====================================================================

export async function executeClaimRewards(btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !State.delegationManagerContract) return false;

    try {
        const pendingRewards = await State.delegationManagerContract.pendingRewards(State.userAddress);
        if (pendingRewards === 0n) {
            showToast('No rewards to claim.', "info");
            return false;
        }

        const delegationManagerContract = State.delegationManagerContract.connect(signer); 
        const gasOpts = await getGasWithMargin(delegationManagerContract, 'claimRewards', []);
        const txPromise = delegationManagerContract.claimRewards(gasOpts);
        
        // ✅ AGORA USA O WRAPPER PARA ATUALIZAR O DASHBOARD
        return await executeTransaction(txPromise, 'Reward claimed!', 'Error claiming', btnElement);

    } catch (e) {
        showToast(`Error: ${e.message}`, "error");
        return false;
    }
}

// ✅ ESTA É A FUNÇÃO USADA NO DASHBOARD BUTTON
export async function executeUniversalClaim(stakingRewards, minerRewards, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    if (stakingRewards === 0n && minerRewards === 0n) {
        showToast("No rewards to claim.", "info");
        return false;
    }
    
    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;

    if (stakingRewards > 0n) {
        const delegationContract = State.delegationManagerContract.connect(signer); 
        const args = [boosterIdToSend];
        const gasOpts = await getGasWithMargin(delegationContract, 'claimReward', args);
        const txPromise = delegationContract.claimReward(...args, gasOpts);
        
        // ✅ AGORA USA O WRAPPER PARA ATUALIZAR O DASHBOARD AUTOMATICAMENTE
        return await executeTransaction(txPromise, 'Reward claimed successfully!', 'Error claiming', btnElement);
    }
    return true;
}

// ====================================================================
// 3. BOOSTER STORE (FACTORY)
// ====================================================================

export async function executeBuyBooster(poolAddress, price, boosterTokenIdForPStake, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const priceBigInt = BigInt(price);
    if (priceBigInt > State.currentUserBalance) { showToast("Insufficient BKC.", "error"); return false; }

    const approved = await ensureApproval(State.bkcTokenContract, poolAddress, priceBigInt, btnElement, "NFT Purchase");
    if (!approved) return false;

    const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer); 
    const args = [BigInt(boosterTokenIdForPStake)];
    const gasOpts = await getGasWithMargin(poolContract, 'buyNextAvailableNFT', args);
    const buyTxPromise = poolContract.buyNextAvailableNFT(...args, gasOpts);
    
    return await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error buying', btnElement);
}

export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const tokenIdBigInt = BigInt(tokenIdToSell);
    const approved = await ensureApproval(State.rewardBoosterContract, poolAddress, tokenIdBigInt, btnElement, "NFT Sale");
    if (!approved) return false;

    const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer); 
    const args = [tokenIdBigInt, BigInt(boosterTokenIdForDiscount), 0n];
    const gasOpts = await getGasWithMargin(poolContract, 'sellNFT', args);
    const sellTxPromise = poolContract.sellNFT(...args, gasOpts);

    return await executeTransaction(sellTxPromise, 'Sale successful!', 'Error selling', btnElement);
}

// ====================================================================
// 4. FAUCET & NOTARY
// ====================================================================

export async function executeInternalFaucet(btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;

    try {
        if (State.faucetContract) {
            const faucetContract = State.faucetContract.connect(signer); 
            const gasOpts = await getGasWithMargin(faucetContract, 'claim', []);
            const txPromise = faucetContract.claim(gasOpts);
            // ✅ Usa Wrapper
            return await executeTransaction(txPromise, 'Tokens sent!', 'Faucet Error', btnElement);
        } else if (State.bkcTokenContract) {
            const amount = ethers.parseUnits("20", 18); 
            const bkcContract = State.bkcTokenContract.connect(signer); 
            const args = [State.userAddress, amount];
            const gasOpts = await getGasWithMargin(bkcContract, 'mint', args);
            const txPromise = bkcContract.mint(...args, gasOpts); 
            // ✅ Usa Wrapper
            return await executeTransaction(txPromise, '20 BKC Minted!', 'Mint Error', btnElement);
        }
    } catch (e) {
        showToast(`Error: ${e.message}`, "error");
        return false;
    }
}

export async function executeNotarizeDocument(documentURI, description, contentHash, boosterId, submitButton) {
    const signer = await getConnectedSigner();
    if (!signer) return false;

    const notaryContract = State.decentralizedNotaryContract.connect(signer); 
    const notaryAddress = await notaryContract.getAddress(); 
    
    let feeToPay = State.systemFees?.NOTARY_SERVICE || 0n;
    try {
        if (State.ecosystemManagerContractPublic) {
            const key = ethers.id("NOTARY_SERVICE");
            const [realFee] = await State.ecosystemManagerContractPublic.getServiceRequirements(key);
            if (realFee > 0n) feeToPay = realFee;
        }
    } catch (e) {}

    if (feeToPay > 0n) {
        const approved = await ensureApproval(State.bkcTokenContract, notaryAddress, feeToPay, submitButton, "Notary Fee");
        if (!approved) return false;
    }

    const args = [documentURI, description, contentHash, BigInt(boosterId || 0)];
    const gasOpts = await getGasWithMargin(notaryContract, 'notarize', args);
    const notarizeTxPromise = notaryContract.notarize(...args, gasOpts);

    return await executeTransaction(notarizeTxPromise, 'Document notarized!', 'Error', submitButton);
}

// --- RENTAL FUNCTIONS ---
export async function executeListNFT(tokenId, pricePerHourWei, maxDurationHours, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;

    const approved = await ensureApproval(State.rewardBoosterContract, addresses.rentalManager, tokenId, btnElement, "Listing NFT");
    if (!approved) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer); 
    const args = [BigInt(tokenId), BigInt(pricePerHourWei), BigInt(maxDurationHours)];
    const gasOpts = await getGasWithMargin(rentalContract, 'listNFT', args);
    const txPromise = rentalContract.listNFT(...args, gasOpts);
    
    return await executeTransaction(txPromise, `NFT #${tokenId} listed!`, "Error listing", btnElement);
}

export async function executeRentNFT(tokenId, hoursToRent, totalCostWei, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;

    const approved = await ensureApproval(State.bkcTokenContract, addresses.rentalManager, BigInt(totalCostWei), btnElement, "Rental Payment");
    if (!approved) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer); 
    const args = [BigInt(tokenId), BigInt(hoursToRent)];
    const gasOpts = await getGasWithMargin(rentalContract, 'rentNFT', args);
    const txPromise = rentalContract.rentNFT(...args, gasOpts);

    return await executeTransaction(txPromise, `NFT #${tokenId} rented!`, "Error renting", btnElement);
}

export async function executeWithdrawNFT(tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer); 
    const args = [BigInt(tokenId)];
    const gasOpts = await getGasWithMargin(rentalContract, 'withdrawNFT', args);
    const txPromise = rentalContract.withdrawNFT(...args, gasOpts);

    return await executeTransaction(txPromise, `NFT #${tokenId} withdrawn!`, "Error withdrawing", btnElement);
}