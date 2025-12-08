// js/modules/transactions.js
// ✅ VERSÃO FINAL V7.5 (IMPROVED DYNAMIC GAS): Fallbacks Contextuais + Export + Retry

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, FAUCET_AMOUNT_WEI, nftPoolABI, rentalManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
// CERTIFIQUE-SE QUE loadRentalListings ESTÁ EXPORTADO EM ./data.js
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js'; 

// --- Tolerance Constants ---
const APPROVAL_TOLERANCE_BIPS = 100n; 
const BIPS_DENOMINATOR = 10000n; 

/**
 * ⚡ GAS HELPER V2 (CRITICAL FIX FOR ARBITRUM)
 * Calcula o gás dinamicamente com margem de segurança de 20%.
 * Se a estimativa do RPC falhar, usa fallbacks contextuais baseados no método.
 * Inclui retry automático para lidar com timeouts temporários.
 * * @param {Contract} contract - Contrato Ethers.js
 * @param {string} method - Nome do método a ser chamado
 * @param {Array} args - Argumentos do método
 * @param {number} retries - Número de tentativas (padrão: 2)
 * @returns {Object} { gasLimit: BigInt }
 */
export async function getGasWithMargin(contract, method, args, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            // Tenta estimar o gás real via RPC
            const estimatedGas = await contract[method].estimateGas(...args);
            // Adiciona 20% de margem (x * 120 / 100)
            const gasWithMargin = (estimatedGas * 120n) / 100n;
            
            console.log(`✅ ${method} Gas Estimation: ${estimatedGas.toString()} → ${gasWithMargin.toString()} (+20%)`);
            return { gasLimit: gasWithMargin };
            
        } catch (error) {
            // Retry em caso de timeout/erro de rede
            if (i < retries && !error.message?.includes("execution reverted") && !error.data) {
                console.warn(`⚠️ Gas estimation retry ${i + 1}/${retries} for ${method}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1s
                continue;
            }
            
            // Detecta erro de lógica de contrato vs erro de rede
            if (error.message?.includes("execution reverted") || error.data) {
                // É um erro de lógica do contrato (ex: PStake insuficiente)
                console.error(`❌ Contract revert during gas estimation for ${method}:`, error.reason || error.message);
                throw error; // Propaga para exibir mensagem ao usuário
            }
            
            // Erro de rede/RPC: usa fallback contextual
            console.warn(`⚠️ Gas estimation failed for ${method}. Using contextual fallback.`, error.message);
            
            // 🔥 FALLBACKS CONTEXTUAIS baseados no método
            const fallbacks = {
                // ERC20 Operations
                'approve': 100000n,
                'transfer': 65000n,
                'transferFrom': 85000n,
                
                // Game Operations
                'participate': 800000n,
                'requestRandom': 500000n,
                
                // NFT Pool Operations
                'buyNextAvailableNFT': 500000n,
                'sellNFT': 400000n,
                
                // Faucet & Minting
                'claim': 150000n,
                'mint': 150000n,
                
                // Notary
                'notarize': 300000n,
                
                // Rental
                'listNFT': 250000n,
                'rentNFT': 350000n,
                'returnNFT': 200000n,
                
                // Staking
                'stake': 200000n,
                'unstake': 180000n,
                'claimRewards': 150000n
            };
            
            const fallbackGas = fallbacks[method] || 300000n; // Fallback genérico: 300k
            console.log(`   → Using fallback: ${fallbackGas.toString()} gas units for ${method}`);
            
            return { gasLimit: fallbackGas };
        }
    }
}

// ====================================================================
// CORE SIGNER/RUNNER UTILITY
// ====================================================================

async function getConnectedSigner() {
    if (!State.isConnected) {
        showToast("Wallet not connected.", "error");
        return null;
    }
    
    // Prioriza obter o Signer diretamente do Web3Provider (MetaMask/WalletConnect)
    if (State.web3Provider) {
        try {
            const provider = new ethers.BrowserProvider(State.web3Provider);
            const signer = await provider.getSigner(); 
            return signer;
        } catch (e) {
            console.error("Signer acquisition failed (BrowserProvider):", e);
            showToast("Failed to acquire wallet signer. Please check permissions in MetaMask.", "error");
            return null;
        }
    }

    showToast("Wallet provider not found.", "error");
    return null;
}


// ====================================================================
// GENERIC WRAPPERS & UTILITIES
// ====================================================================

async function executeTransaction(txPromise, successMessage, failMessage, btnElement) {
    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...';
    }

    try {
        const tx = await txPromise;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Confirming...';
        showToast('Submitting transaction to blockchain...', 'info');
        
        // Wait for block confirmation
        const receipt = await tx.wait();
        
        showToast(successMessage, 'success', receipt.hash);

        // --- OPTIMISTIC UPDATE ---
        await loadUserData(); 
        
        if (window.location.hash.includes('rental') || window.location.hash.includes('dashboard')) {
             if (typeof loadRentalListings === 'function') await loadRentalListings(); 
        }
        
        setTimeout(async () => {
            await loadUserData();
            if (typeof loadRentalListings === 'function') await loadRentalListings();
            if (window.updateUIState) window.updateUIState(true);
        }, 3000);

        return true;
    } catch (e) {
        console.error("Transaction Error:", e);
        let reason = 'Transaction rejected or failed.';

        if (e.reason) reason = e.reason;
        else if (e.data && e.data.message) reason = e.data.message;
        else if (e.message) reason = e.message;

        // Tratamento específico para erros comuns de RPC
        if (reason.includes("Internal JSON-RPC error") || reason.includes("code=-32603")) {
            reason = "RPC Error: Network busy or Gas estimation failed. Please reset MetaMask activity.";
        }
        if (e.code === 'ACTION_REJECTED') reason = 'You rejected the transaction in your wallet.';
        if (reason.includes("execution reverted")) reason = "Execution Reverted (Check Contract State/Input).";
        
        if (reason.includes("Insufficient pStake")) reason = "Minimum pStake requirement not met.";
        if (reason.includes("TransferFailed")) reason = "Token transfer failed (Check BKC balance/allowance).";
        if (reason.includes("insufficient allowance")) reason = "Contract not approved to spend tokens.";
        
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

    if (!spenderAddress || spenderAddress.includes('...')) {
        showToast(`Error: Invalid contract address for ${purpose}.`, "error");
        return false;
    }

    const setBtnLoading = (text) => {
        if(btnElement) {
            btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
            btnElement.disabled = true;
        }
    };

    try {
        let isERC721 = false;
        try {
            const fn = tokenContract.interface.getFunction("setApprovalForAll");
            isERC721 = !!fn; 
        } catch (e) { isERC721 = false; }

        if (!isERC721) {
            const requiredAmount = BigInt(amountOrTokenId);
            if (requiredAmount === 0n) return true;
            
            setBtnLoading("Checking Allowance");
            const allowance = await tokenContract.allowance(State.userAddress, spenderAddress); 

            const toleratedAmount = (requiredAmount * (BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BIPS_DENOMINATOR;

            if (allowance < toleratedAmount) {
                showToast(`Approving ${formatBigNumber(toleratedAmount).toFixed(2)} $BKC for ${purpose}...`, "info");
                setBtnLoading("Approving");

                // ✅ FIX: Gás dinâmico para evitar "Insufficient Funds" em aprovações
                const args = [spenderAddress, toleratedAmount];
                const gasOpts = await getGasWithMargin(approvedTokenContract, 'approve', args);
                
                const approveTx = await approvedTokenContract.approve(...args, gasOpts);
                await approveTx.wait();
                showToast('Approval successful!', "success");
            }
            return true;
        } 
        else {
            const tokenId = BigInt(amountOrTokenId);
            setBtnLoading("Checking NFT Approval");
            
            let approvedAddr = ethers.ZeroAddress;
            try { approvedAddr = await tokenContract.getApproved(tokenId); } catch(e) {} 
            
            const isApprovedAll = await tokenContract.isApprovedForAll(State.userAddress, spenderAddress);
            
            if (approvedAddr.toLowerCase() !== spenderAddress.toLowerCase() && !isApprovedAll) {
                showToast(`Approving NFT #${tokenId} for ${purpose}...`, "info");
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
    
    const originalText = btnElement ? btnElement.innerHTML : 'Stake';
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    if (amountWei <= 0n) { showToast("Invalid amount.", "error"); return false; }
    if (amountWei > State.currentUserBalance) { showToast("Insufficient BKC balance.", "error"); return false; }

    const approved = await ensureApproval(State.bkcTokenContract, await State.delegationManagerContract.getAddress(), amountWei, btnElement, "Staking");
    if (!approved) return false;

    const delegationManagerContract = State.delegationManagerContract.connect(signer); 
    const args = [amountWei];
    
    // 🔥 Gás Dinâmico
    const gasOpts = await getGasWithMargin(delegationManagerContract, 'stake', args);
    const stakeTxPromise = delegationManagerContract.stake(...args, gasOpts);

    return await executeTransaction(stakeTxPromise, 'Staking successful!', 'Error during staking', btnElement);
}

export async function executeUnstake(amount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !State.delegationManagerContract) return false;
    
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    if (amountWei <= 0n) { showToast("Invalid amount.", "error"); return false; }

    const delegationManagerContract = State.delegationManagerContract.connect(signer); 
    const args = [amountWei];

    // 🔥 Gás Dinâmico
    const gasOpts = await getGasWithMargin(delegationManagerContract, 'unstake', args);
    const unstakeTxPromise = delegationManagerContract.unstake(...args, gasOpts);

    return await executeTransaction(unstakeTxPromise, 'Unstaked successfully!', 'Error during unstake', btnElement);
}


// ====================================================================
// 2. REWARD CLAIM
// ====================================================================

export async function executeClaimRewards(btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !State.delegationManagerContract) {
        console.error("Signer or contract unavailable.");
        showToast("Wallet or contract not ready.", "error");
        return false;
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Claim';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
    }

    try {
        const pendingRewards = await State.delegationManagerContract.pendingRewards(State.userAddress);
        if (pendingRewards === 0n) {
            showToast('No rewards to claim.', "info");
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }
            return false;
        } else {
            const delegationManagerContract = State.delegationManagerContract.connect(signer); 
            
            // 🔥 Gás Dinâmico
            const gasOpts = await getGasWithMargin(delegationManagerContract, 'claimRewards', []);
            const tx = await delegationManagerContract.claimRewards(gasOpts);
            
            await tx.wait();
            showToast('Reward claimed successfully!', "success");
        }
        loadUserData(); 
        return true;
    } catch (e) {
        console.error("Error during claim:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
        if(btnElement) {
            setTimeout(() => {
                if(btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
            }, 1000);
        }
    }
}


// ====================================================================
// 3. BOOSTER STORE (FACTORY)
// ====================================================================

export async function executeBuyBooster(poolAddress, price, boosterTokenIdForPStake, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    const priceBigInt = BigInt(price);
    
    if (priceBigInt <= 0n) { showToast("Price is zero.", "error"); return false; }
    if (priceBigInt > State.currentUserBalance) { showToast("Insufficient BKC balance.", "error"); return false; }

    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<div class="loader inline-block"></div>'; }
    
    try {
        const approved = await ensureApproval(State.bkcTokenContract, poolAddress, priceBigInt, btnElement, "NFT Purchase");
        if (!approved) { if(btnElement) btnElement.innerHTML = originalText; return false; }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer); 
        const boosterIdToSend = BigInt(boosterTokenIdForPStake);
        const args = [boosterIdToSend];

        // 🔥 Gás Dinâmico
        const gasOpts = await getGasWithMargin(poolContract, 'buyNextAvailableNFT', args);
        const buyTxPromise = poolContract.buyNextAvailableNFT(...args, gasOpts);
        
        return await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error during purchase', btnElement);

    } catch (e) {
        console.error("Error buying booster:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
         if(btnElement) setTimeout(() => { if(btnElement) { btnElement.disabled = false; btnElement.innerHTML = originalText; } }, 1000);
    }
}

export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';
    const tokenIdBigInt = BigInt(tokenIdToSell);
    
    if (tokenIdBigInt <= 0n) { showToast("No NFT selected.", "error"); return false; }

    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<div class="loader inline-block"></div>'; }

    try {
        const approved = await ensureApproval(State.rewardBoosterContract, poolAddress, tokenIdBigInt, btnElement, "NFT Sale");
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        const minPrice = 0n; 
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer); 
        const args = [tokenIdBigInt, boosterIdToSend, minPrice];

        // 🔥 Gás Dinâmico
        const gasOpts = await getGasWithMargin(poolContract, 'sellNFT', args);
        const sellTxPromise = poolContract.sellNFT(...args, gasOpts);

        return await executeTransaction(sellTxPromise, 'Sale successful!', 'Error during sale', btnElement);

    } catch (e) {
        console.error("Error selling booster:", e);
        showToast(`Error: ${e.reason || e.message}`, "error");
        return false;
    } finally {
        if(btnElement) setTimeout(() => { if(btnElement) { btnElement.disabled = false; btnElement.innerHTML = originalText; } }, 1000);
    }
}


// ====================================================================
// 4. FAUCET & NOTARY (ENTERPRISE LOGIC)
// ====================================================================

export async function executeInternalFaucet(btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const network = await State.provider.getNetwork();
    if (network.chainId !== 421614n) return showToast("Testnet only.", "warning");

    const originalText = btnElement ? btnElement.innerHTML : 'Get Tokens';
    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<div class="loader inline-block"></div> Minting...'; }

    try {
        if (State.faucetContract) {
            const faucetContract = State.faucetContract.connect(signer); 
            // 🔥 Gás Dinâmico
            const gasOpts = await getGasWithMargin(faucetContract, 'claim', []);
            const tx = await faucetContract.claim(gasOpts);
            return await executeTransaction(tx, 'Tokens sent!', 'Faucet Error', btnElement);
        } else if (State.bkcTokenContract) {
            const amount = ethers.parseUnits("20", 18); 
            const bkcTokenContract = State.bkcTokenContract.connect(signer); 
            const args = [State.userAddress, amount];
            
            // 🔥 Gás Dinâmico
            const gasOpts = await getGasWithMargin(bkcTokenContract, 'mint', args);
            const tx = await bkcTokenContract.mint(...args, gasOpts); 
            return await executeTransaction(tx, '20 BKC Minted!', 'Mint Error', btnElement);
        } else {
            throw new Error("Faucet not available.");
        }
    } catch (e) {
        console.error("Faucet Error:", e);
        showToast(`Error: ${e.reason || e.message}`, "error");
        if(btnElement) { btnElement.disabled = false; btnElement.innerHTML = originalText; }
        return false;
    }
}

export async function executeNotarizeDocument(documentURI, description, contentHash, boosterId, submitButton) {
    const signer = await getConnectedSigner();
    
    if (!signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Contracts or Signer not ready.", "error");
        return false;
    }

    const notaryContract = State.decentralizedNotaryContract.connect(signer); 
    const notaryAddress = await notaryContract.getAddress(); 
    
    // 1. Fee Calculation & Approval Logic
    let feeToPay = State.systemFees?.NOTARY_SERVICE || 0n;
    try {
        if (State.ecosystemManagerContractPublic) {
            const key = ethers.id("NOTARY_SERVICE");
            const [realFee] = await State.ecosystemManagerContractPublic.getServiceRequirements(key);
            if (realFee > 0n) feeToPay = realFee;
        }
    } catch (e) {
        console.warn("Fee fetch warning:", e);
    }

    console.log(`Notary Fee to Approve: ${feeToPay.toString()}`);

    if (feeToPay > 0n) {
        const approved = await ensureApproval(State.bkcTokenContract, notaryAddress, feeToPay, submitButton, "Notary Fee");
        if (!approved) {
            showToast("Approval failed or rejected.", "error");
            return false;
        }
    }

    // 2. Prepare Parameters
    const bId = boosterId ? BigInt(boosterId) : 0n;
    const args = [documentURI, description, contentHash, bId];
    
    // 3. Call Smart Contract (Updated Signature with Dynamic Gas)
    const gasOpts = await getGasWithMargin(notaryContract, 'notarize', args);
    const notarizeTxPromise = notaryContract.notarize(...args, gasOpts);

    return await executeTransaction(notarizeTxPromise, 'Document notarized successfully!', 'Error notarizing document', submitButton);
}