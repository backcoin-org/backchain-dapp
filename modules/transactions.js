// js/modules/transactions.js
// ✅ VERSÃO V7.11: Smaller approval amounts, retry logic for RPC errors

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js';

// --- Constants ---
const APPROVAL_BUFFER_PERCENT = 5n; // 5% extra buffer for approvals
const MAX_GAS_LIMIT = 5000000n; // Safe max for Arbitrum (increased)
const MIN_GAS_LIMIT = 200000n; // Minimum gas for simple txs (increased)

// 🔥 V7.9: Fixed gas limits for reliable transactions (bypass estimation issues)
const FIXED_GAS = {
    APPROVE: 150000n,
    SIMPLE_TX: 300000n,
    COMPLEX_TX: 600000n,
    DELEGATION: 800000n,
    NFT_TRANSFER: 400000n
};

// 🔥 V7.5: Global lock to prevent multiple simultaneous approvals
let approvalInProgress = false;
let transactionInProgress = false;

// 🔥 V7.9: Safe formatter that handles MAX_UINT256 without overflow
function safeFormatEther(value) {
    try {
        const bigValue = BigInt(value);
        const MAX_SAFE = ethers.parseEther("1000000000"); // 1 billion
        if (bigValue > MAX_SAFE) {
            return "UNLIMITED";
        }
        return ethers.formatEther(bigValue);
    } catch (e) {
        return "N/A";
    }
}

// --- Custom Error Signatures (for decoding) ---
const CUSTOM_ERRORS = {
    '0x7939f424': 'InvalidAmount',
    '0xe6c4247b': 'InvalidAddress', 
    '0x82b42900': 'Unauthorized',
    '0x1f2a2005': 'InvalidDuration',
    '0xce8ef7fc': 'InvalidIndex',
    '0x5a34cd89': 'LockPeriodNotOver',
    '0x5274afe7': 'InsufficientAllowance',
    '0x13be252b': 'InsufficientLiquidity',
    '0x856d8d35': 'PriceCheckFailed',
    '0x8baa579f': 'MathError',
    '0x3d693ada': 'NotOwner',
    '0xf92ee8a9': 'PoolNotInitialized',
    '0x6697b232': 'AlreadyRented',
    '0x8b1e12d4': 'NotListed',
    '0x7b3c91ff': 'RentalActive',
    '0x8e4a23d6': 'DistributionConfigError',
    '0x30cd7471': 'TransferFailed',
    // Fortune Pool V2.1 Errors
    '0x2c5211c6': 'InvalidWagerAmount',
    '0x7c214f04': 'InvalidGuessCount',
    '0x8579befe': 'GameNotResolved',
    '0x3ee5aeb5': 'OracleFeeNotPaid',
    '0x4e487b71': 'PanicError'
};

// ====================================================================
// GAS ESTIMATION WITH INTELLIGENT FALLBACK
// ====================================================================

async function estimateGasWithFallback(contract, method, args, defaultGas = 500000n) {
    try {
        // First attempt: Normal estimation
        const estimated = await contract[method].estimateGas(...args);
        // Add 50% margin for Arbitrum's L2 gas dynamics (increased from 30%)
        const withMargin = (estimated * 150n) / 100n;
        
        console.log(`⛽ Gas estimated for ${method}: ${estimated.toString()} + 50% = ${withMargin.toString()}`);
        
        // Clamp between min and max
        if (withMargin < MIN_GAS_LIMIT) return { gasLimit: MIN_GAS_LIMIT };
        if (withMargin > MAX_GAS_LIMIT) return { gasLimit: MAX_GAS_LIMIT };
        
        return { gasLimit: withMargin };
    } catch (error) {
        // 🔥 V7.9: Don't throw on estimation failure - use generous fallback
        console.warn(`⚠️ Gas estimation failed for ${method}, using fallback:`, defaultGas.toString());
        console.warn(`   Reason:`, error.message?.slice(0, 100));
        
        // Return generous fallback - let the transaction try anyway
        // Many times estimation fails but tx succeeds with fixed gas
        return { gasLimit: defaultGas > MIN_GAS_LIMIT ? defaultGas : FIXED_GAS.COMPLEX_TX };
    }
}

// ====================================================================
// ERROR DECODING SYSTEM
// ====================================================================

function decodeRevertReason(error) {
    let errorData = null;
    
    // Extract error data from various error formats
    if (error?.data) {
        errorData = error.data;
    } else if (error?.error?.data) {
        errorData = error.error.data;
    } else if (error?.info?.error?.data) {
        errorData = error.info.error.data;
    } else if (error?.transaction?.data) {
        errorData = error.transaction.data;
    }
    
    // Try to decode custom errors
    if (errorData && typeof errorData === 'string' && errorData.startsWith('0x')) {
        const selector = errorData.slice(0, 10).toLowerCase();
        
        // Check our custom errors map
        if (CUSTOM_ERRORS[selector]) {
            return CUSTOM_ERRORS[selector];
        }
        
        // Standard revert string: Error(string)
        if (selector === '0x08c379a0') {
            try {
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                    ['string'],
                    '0x' + errorData.slice(10)
                );
                return decoded[0];
            } catch {}
        }
        
        // Panic codes
        if (selector === '0x4e487b71') {
            try {
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                    ['uint256'],
                    '0x' + errorData.slice(10)
                );
                const panicCodes = {
                    0x00: 'Generic panic',
                    0x01: 'Assertion failed',
                    0x11: 'Arithmetic overflow/underflow',
                    0x12: 'Division by zero',
                    0x21: 'Invalid enum value',
                    0x22: 'Storage encoding error',
                    0x31: 'Empty array pop',
                    0x32: 'Array out of bounds',
                    0x41: 'Excessive memory allocation',
                    0x51: 'Zero function pointer'
                };
                return panicCodes[Number(decoded[0])] || `Panic(${decoded[0]})`;
            } catch {}
        }
    }
    
    // Fallback to parsing error message
    const msg = error?.message || error?.reason || '';
    
    // Common patterns
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('insufficient allowance')) return 'Token approval needed';
    if (msg.includes('transfer amount exceeds balance')) return 'Insufficient token balance';
    if (msg.includes('execution reverted')) {
        const match = msg.match(/reverted:?\s*(.+?)(?:"|$)/i);
        if (match) return match[1].trim();
        return 'Transaction would revert (check contract state)';
    }
    if (msg.includes('user rejected')) return 'Transaction rejected by user';
    if (msg.includes('nonce')) return 'Nonce error - try resetting MetaMask';
    if (msg.includes('replacement fee too low')) return 'Gas price too low - increase gas';
    
    return null;
}

function formatErrorForUser(error, context = '') {
    const decoded = decodeRevertReason(error);
    
    if (decoded) {
        return decoded;
    }
    
    // Handle common ethers.js error codes
    if (error?.code === 'ACTION_REJECTED') {
        return 'Transaction rejected in wallet';
    }
    if (error?.code === 'INSUFFICIENT_FUNDS') {
        return 'Insufficient ETH for gas fees';
    }
    if (error?.code === 'CALL_EXCEPTION') {
        return 'Contract call failed - check inputs and state';
    }
    if (error?.code === 'NETWORK_ERROR') {
        return 'Network error - check connection';
    }
    if (error?.code === 'TIMEOUT') {
        return 'Request timed out - try again';
    }
    
    // Handle RPC errors
    const errCode = error?.error?.code || error?.code;
    if (errCode === -32603) {
        // Try to extract more info from the error
        const errData = error?.error?.data?.message || error?.data?.message || error?.message || '';
        if (errData.includes('gas')) return 'Gas estimation failed - try increasing gas limit';
        if (errData.includes('revert')) return 'Transaction would revert - check contract state';
        if (errData.includes('allowance')) return 'Insufficient token allowance';
        if (errData.includes('balance')) return 'Insufficient balance';
        return 'RPC error - try again or check MetaMask connection';
    }
    if (errCode === -32000) {
        return 'RPC rejected - check gas and parameters';
    }
    if (errCode === 429) {
        return 'Rate limited - wait and retry';
    }
    
    return context ? `${context}: ${error?.message?.slice(0, 80) || 'Unknown error'}` : 'Transaction failed';
}

// ====================================================================
// CORE SIGNER UTILITY
// ====================================================================

async function getConnectedSigner() {
    // 🔥 V7.9: More robust signer acquisition
    if (!State.isConnected) {
        showToast("Please connect your wallet first.", "error");
        return null;
    }
    
    // Try multiple sources for the provider
    const web3Provider = State.web3Provider || window.ethereum;
    
    if (!web3Provider) {
        showToast("Wallet provider not found. Please refresh.", "error");
        return null;
    }
    
    try {
        // 🔥 V7.9: Always create fresh provider and signer
        const provider = new ethers.BrowserProvider(web3Provider);
        
        // Request accounts to ensure we have permission
        await provider.send("eth_requestAccounts", []);
        
        const signer = await provider.getSigner();
        
        // Verify signer is still connected
        const address = await signer.getAddress();
        if (!address) {
            throw new Error("Signer address unavailable");
        }
        
        // Verify address matches State (detect account change)
        if (State.userAddress && address.toLowerCase() !== State.userAddress.toLowerCase()) {
            console.warn("⚠️ Account changed! Updating State...");
            State.userAddress = address;
        }
        
        console.log("✅ Signer ready:", address);
        return signer;
        
    } catch (e) {
        console.error("Signer acquisition failed:", e);
        
        // 🔥 V7.9: Try fallback with window.ethereum directly
        if (window.ethereum && window.ethereum !== web3Provider) {
            try {
                console.log("🔄 Trying fallback with window.ethereum...");
                const fallbackProvider = new ethers.BrowserProvider(window.ethereum);
                await fallbackProvider.send("eth_requestAccounts", []);
                const fallbackSigner = await fallbackProvider.getSigner();
                const addr = await fallbackSigner.getAddress();
                console.log("✅ Fallback signer ready:", addr);
                return fallbackSigner;
            } catch (fallbackErr) {
                console.error("Fallback also failed:", fallbackErr);
            }
        }
        
        showToast("Failed to connect to wallet. Please reconnect.", "error");
        return null;
    }
}

// ====================================================================
// TRANSACTION EXECUTOR WITH ENHANCED ERROR HANDLING
// ====================================================================

async function executeTransaction(txPromise, successMessage, failContext, btnElement) {
    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    
    const setButtonState = (text, disabled = true) => {
        if (btnElement) {
            btnElement.disabled = disabled;
            btnElement.innerHTML = text;
        }
    };

    setButtonState('<div class="loader inline-block mr-2"></div> Confirming in wallet...');

    try {
        // Wait for user to sign
        const tx = await txPromise;
        
        setButtonState('<div class="loader inline-block mr-2"></div> Mining...');
        showToast('Transaction submitted. Waiting for confirmation...', 'info');
        
        // Wait for confirmation with timeout
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Transaction timeout')), 120000)
            )
        ]);
        
        if (receipt.status === 0) {
            // 🔥 V7.11: Try to get revert reason for better error messages
            let revertReason = 'Unknown reason';
            try {
                const provider = tx.provider || State.provider || State.publicProvider;
                if (provider && tx.data) {
                    const txData = {
                        to: receipt.to,
                        from: receipt.from,
                        data: tx.data,
                        value: tx.value || 0n,
                        blockTag: receipt.blockNumber - 1
                    };
                    await provider.call(txData);
                }
            } catch (simErr) {
                revertReason = simErr.reason || simErr.shortMessage || simErr.message?.slice(0, 100) || 'Check contract state';
                console.error('❌ Revert reason:', revertReason);
            }
            throw new Error(`Transaction reverted: ${revertReason}`);
        }
        
        showToast(successMessage, 'success', receipt.hash);

        // Refresh data
        loadUserData().catch(() => {});
        
        if (window.location.hash.includes('rental') || window.location.hash.includes('dashboard')) {
            if (typeof loadRentalListings === 'function') {
                loadRentalListings().catch(() => {});
            }
        }
        
        // Delayed refresh for indexer sync
        setTimeout(async () => {
            await loadUserData().catch(() => {});
            if (typeof loadRentalListings === 'function') {
                await loadRentalListings().catch(() => {});
            }
            if (window.updateUIState) window.updateUIState(true);
        }, 5000);

        return true;
        
    } catch (e) {
        console.error("❌ Tx Failed:", e);
        
        const userMessage = formatErrorForUser(e, failContext);
        showToast(userMessage, "error");
        
        return false;
        
    } finally {
        setTimeout(() => {
            setButtonState(originalText, false);
        }, 1500);
    }
}

// ====================================================================
// APPROVAL SYSTEM WITH PRE-VALIDATION
// ====================================================================

async function ensureApproval(tokenContract, spenderAddress, amountOrTokenId, btnElement, purpose) {
    // 🔥 V7.5: Prevent multiple simultaneous approvals
    if (approvalInProgress) {
        console.log('Approval already in progress, waiting...');
        // Wait for current approval to complete
        let waitTime = 0;
        while (approvalInProgress && waitTime < 30000) {
            await new Promise(r => setTimeout(r, 500));
            waitTime += 500;
        }
        if (approvalInProgress) {
            showToast("Previous approval still pending. Please wait.", "warning");
            return false;
        }
    }
    
    approvalInProgress = true;
    
    try {
        const signer = await getConnectedSigner(); 
        if (!signer) return false;
        
        // Validate spender address
        if (!spenderAddress || !ethers.isAddress(spenderAddress)) {
            showToast(`Invalid contract address for ${purpose}.`, "error");
            return false;
        }

        const approvedTokenContract = tokenContract.connect(signer);

        const setButtonState = (text) => {
            if (btnElement) {
                btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
                btnElement.disabled = true;
            }
        };
        // Detect if ERC721 or ERC20
        let isERC721 = false;
        try {
            const fn = tokenContract.interface.getFunction("setApprovalForAll");
            isERC721 = !!fn;
        } catch (e) { 
            isERC721 = false; 
        }

        if (!isERC721) {
            // === ERC20 APPROVAL ===
            const requiredAmount = BigInt(amountOrTokenId);
            if (requiredAmount === 0n) return true;
            
            setButtonState("Checking allowance");
            
            const [allowance, balance] = await Promise.all([
                tokenContract.allowance(State.userAddress, spenderAddress),
                tokenContract.balanceOf(State.userAddress)
            ]);

            // Pre-validate balance
            if (balance < requiredAmount) {
                const formatted = formatBigNumber(requiredAmount);
                showToast(`Insufficient balance. Need ${formatted.toFixed(2)} BKC.`, "error");
                return false;
            }

            // Use a reasonable large approval amount
            // Some RPCs have issues with very large numbers
            const LARGE_APPROVAL = ethers.parseEther("10000000"); // 10 million BKC

            if (allowance < requiredAmount) {
                console.log(`💰 Current allowance: ${safeFormatEther(allowance)} BKC`);
                console.log(`💰 Required amount: ${safeFormatEther(requiredAmount)} BKC`);
                console.log(`🎯 Spender address: ${spenderAddress}`);
                
                showToast(`Approving BKC for ${purpose}...`, "info");
                setButtonState("Approving tokens");

                // 🔥 V7.10: Use fixed gas for approvals - more reliable
                const gasOpts = { gasLimit: FIXED_GAS.APPROVE };
                console.log(`⛽ Using fixed gas for approve: ${FIXED_GAS.APPROVE.toString()}`);
                
                // 🔥 V7.11: Determine best approval amount - try progressively smaller values
                let approvalAmount = requiredAmount * 100n; // Start with 100x required
                
                // Try staticCall to validate
                try {
                    await approvedTokenContract.approve.staticCall(spenderAddress, approvalAmount);
                    console.log('✅ Approval staticCall passed with 100x amount');
                } catch (staticErr) {
                    console.warn('⚠️ 100x approval failed, trying 10x...');
                    approvalAmount = requiredAmount * 10n;
                    try {
                        await approvedTokenContract.approve.staticCall(spenderAddress, approvalAmount);
                        console.log('✅ Approval staticCall passed with 10x amount');
                    } catch (retryErr) {
                        // Last try with 2x amount
                        approvalAmount = requiredAmount * 2n;
                        try {
                            await approvedTokenContract.approve.staticCall(spenderAddress, approvalAmount);
                            console.log('✅ Approval staticCall passed with 2x amount');
                        } catch (finalErr) {
                            console.error('❌ All approval amounts failed:', finalErr);
                            throw new Error(`Token approval blocked: ${finalErr.reason || finalErr.shortMessage || 'Check token contract'}`);
                        }
                    }
                }
                
                console.log(`📝 Approving amount: ${safeFormatEther(approvalAmount)} BKC`);
                
                // 🔥 V7.11: Retry logic for RPC errors
                let approveTx;
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                    try {
                        approveTx = await approvedTokenContract.approve(
                            spenderAddress, 
                            approvalAmount, 
                            gasOpts
                        );
                        console.log(`📝 Approval TX sent: ${approveTx.hash}`);
                        break; // Success, exit retry loop
                    } catch (txErr) {
                        retryCount++;
                        const errCode = txErr?.error?.code || txErr?.code;
                        
                        // User rejected - don't retry
                        if (txErr?.code === 'ACTION_REJECTED' || txErr?.code === 4001) {
                            throw txErr;
                        }
                        
                        console.warn(`⚠️ Approval attempt ${retryCount}/${maxRetries} failed:`, errCode, txErr.message?.slice(0, 100));
                        
                        if (retryCount >= maxRetries) {
                            throw txErr;
                        }
                        
                        // Wait before retry (exponential backoff)
                        const waitTime = 1000 * retryCount;
                        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                        await new Promise(r => setTimeout(r, waitTime));
                    }
                }
                
                showToast('Approval sent, waiting for confirmation...', 'info');
                
                const receipt = await approveTx.wait();
                
                if (receipt.status === 0) {
                    throw new Error('Approval transaction reverted');
                }
                
                console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
                showToast('Approval successful!', "success");
                
                // 🔥 V7.9: Verify approval actually worked (use safe formatter)
                const newAllowance = await tokenContract.allowance(State.userAddress, spenderAddress);
                console.log(`💰 New allowance: ${safeFormatEther(newAllowance)} BKC`);
                
                if (newAllowance < requiredAmount) {
                    console.error("❌ Approval confirmed but allowance still insufficient!");
                    showToast("Approval issue - please try again", "error");
                    return false;
                }
                
                // Small delay to ensure blockchain state is updated
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                console.log(`✅ Already approved: ${safeFormatEther(allowance)} BKC`);
            }
            
            return true;
            
        } else {
            // === ERC721 APPROVAL ===
            const tokenId = BigInt(amountOrTokenId);
            setButtonState("Checking NFT approval");
            
            console.log(`🎨 Checking NFT #${tokenId} approval for ${spenderAddress}`);
            
            // Check current approval state
            let approvedAddr = ethers.ZeroAddress;
            try { 
                approvedAddr = await tokenContract.getApproved(tokenId); 
                console.log(`🎨 Current approved address: ${approvedAddr}`);
            } catch(e) {
                console.warn("getApproved failed:", e.message?.slice(0, 50));
            }
            
            const isApprovedAll = await tokenContract.isApprovedForAll(
                State.userAddress, 
                spenderAddress
            );
            console.log(`🎨 isApprovedForAll: ${isApprovedAll}`);
            
            if (approvedAddr.toLowerCase() !== spenderAddress.toLowerCase() && !isApprovedAll) {
                showToast(`Approving NFT #${tokenId} for ${purpose}...`, "info");
                setButtonState("Approving NFT");
                
                // 🔥 V7.9: Use fixed gas for NFT approvals
                const gasOpts = { gasLimit: FIXED_GAS.NFT_TRANSFER };
                console.log(`⛽ Using fixed gas for NFT approve: ${FIXED_GAS.NFT_TRANSFER.toString()}`);

                const approveTx = await approvedTokenContract.approve(
                    spenderAddress, 
                    tokenId, 
                    gasOpts
                );
                
                console.log(`📝 NFT Approval TX sent: ${approveTx.hash}`);
                const receipt = await approveTx.wait();
                
                if (receipt.status === 0) {
                    throw new Error('NFT approval reverted');
                }
                
                console.log(`✅ NFT Approval confirmed in block ${receipt.blockNumber}`);
                showToast("NFT Approval successful!", "success");
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                console.log(`✅ NFT #${tokenId} already approved`);
            }
            
            return true;
        }

    } catch (e) {
        console.error("❌ Approval Failed:", e);
        if (btnElement) btnElement.disabled = false;
        
        const userMessage = formatErrorForUser(e, 'Approval failed');
        showToast(userMessage, "error");
        
        return false;
    } finally {
        // 🔥 V7.5: Always release the lock
        approvalInProgress = false;
    }
}

// ====================================================================
// 1. RENTAL MARKET TRANSACTIONS
// ====================================================================

export async function executeListNFT(tokenId, pricePerHourWei, btnElement) {
    console.log("🏷️ executeListNFT called with:", { tokenId, pricePerHourWei: pricePerHourWei.toString() });
    
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) {
        console.error("❌ No signer or rental manager address");
        return false;
    }

    const tokenIdBigInt = BigInt(tokenId);
    const priceBigInt = BigInt(pricePerHourWei);
    
    console.log("📝 Listing NFT #" + tokenId + " for " + ethers.formatEther(priceBigInt) + " BKC/hour");
    
    // Pre-validation
    if (priceBigInt === 0n) {
        showToast("Price must be greater than 0.", "error");
        return false;
    }

    // Verify ownership
    try {
        const owner = await State.rewardBoosterContract.ownerOf(tokenIdBigInt);
        console.log("👤 NFT owner:", owner, "User:", State.userAddress);
        if (owner.toLowerCase() !== State.userAddress.toLowerCase()) {
            showToast("You don't own this NFT.", "error");
            return false;
        }
    } catch (e) {
        console.error("❌ Failed to verify ownership:", e);
        showToast("Failed to verify NFT ownership.", "error");
        return false;
    }
    
    const originalText = btnElement ? btnElement.innerHTML : 'List NFT';
    if (btnElement) { 
        btnElement.disabled = true; 
        btnElement.innerHTML = '<div class="loader inline-block"></div>'; 
    }

    try {
        console.log("🔐 Checking approval for rental manager:", addresses.rentalManager);
        const approved = await ensureApproval(
            State.rewardBoosterContract, 
            addresses.rentalManager, 
            tokenIdBigInt, 
            btnElement, 
            "Rental Listing"
        );
        if (!approved) {
            console.error("❌ Approval failed or rejected");
            return false;
        }
        console.log("✅ NFT approved for rental manager");

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';
        
        // 🔥 V7.9: Create fresh contract instance with signer
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        const args = [tokenIdBigInt, priceBigInt];
        
        console.log("📤 Calling listNFTSimple with args:", args.map(a => a.toString()));
        
        // 🔥 V7.9: Use fixed gas - more reliable than estimation
        const gasOpts = { gasLimit: FIXED_GAS.NFT_TRANSFER };
        console.log(`⛽ Using fixed gas: ${FIXED_GAS.NFT_TRANSFER.toString()}`);
        
        const listTxPromise = rentalContract.listNFTSimple(...args, gasOpts);
        
        const result = await executeTransaction(
            listTxPromise, 
            'NFT listed for rental!', 
            'Listing failed', 
            btnElement
        );
        
        console.log("📋 List transaction result:", result);
        return result;

    } catch (e) {
        console.error("List NFT Error:", e);
        const userMessage = formatErrorForUser(e, 'Listing failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        if (btnElement) {
            setTimeout(() => { 
                btnElement.disabled = false; 
                btnElement.innerHTML = originalText; 
            }, 1500);
        }
    }
}

export async function executeWithdrawNFT(tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;

    const tokenIdBigInt = BigInt(tokenId);
    const originalText = btnElement ? btnElement.innerHTML : 'Withdraw';
    
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }

    try {
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        const args = [tokenIdBigInt];
        
        const gasOpts = await estimateGasWithFallback(rentalContract, 'withdrawNFT', args, 200000n);
        const withdrawTxPromise = rentalContract.withdrawNFT(...args, gasOpts);
        
        return await executeTransaction(
            withdrawTxPromise, 
            'NFT withdrawn from rental!', 
            'Withdrawal failed', 
            btnElement
        );

    } catch (e) {
        console.error("Withdraw NFT Error:", e);
        const userMessage = formatErrorForUser(e, 'Withdrawal failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        if (btnElement) {
            setTimeout(() => {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }, 1500);
        }
    }
}

// 🔥 V7.6: Simplified rental for 1-hour fixed rentals (matches contract rentNFTSimple)
export async function executeRentNFT(tokenId, totalCost, btnElement) {
    console.log("🎮 executeRentNFT called:", { tokenId, totalCost: totalCost.toString() });
    
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) {
        console.error("❌ No signer or rental manager address");
        return false;
    }
    
    const tokenIdBigInt = BigInt(tokenId);
    const costBigInt = BigInt(totalCost);

    // Check balance
    if (costBigInt > State.currentUserBalance) {
        const needed = formatBigNumber(costBigInt);
        showToast(`Insufficient balance. Need ${needed.toFixed(2)} BKC.`, "error");
        return false;
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Rent';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }

    try {
        // Add buffer for potential fees
        const costWithBuffer = (costBigInt * 120n) / 100n;
        
        const approved = await ensureApproval(
            State.bkcTokenContract, 
            addresses.rentalManager, 
            costWithBuffer, 
            btnElement, 
            "NFT Rental"
        );
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';

        // 🔥 V7.9: Create fresh contract instance
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        // 🔥 V7.9: Use fixed gas
        const args = [tokenIdBigInt];
        const gasOpts = { gasLimit: FIXED_GAS.NFT_TRANSFER };
        console.log(`⛽ Using fixed gas: ${FIXED_GAS.NFT_TRANSFER.toString()}`);
        
        const rentTxPromise = rentalContract.rentNFTSimple(...args, gasOpts);

        return await executeTransaction(
            rentTxPromise, 
            'NFT rented for 1 hour!', 
            'Rental failed', 
            btnElement
        );

    } catch (e) {
        console.error("Rent NFT Error:", e);
        const userMessage = formatErrorForUser(e, 'Rental failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        if (btnElement) {
            setTimeout(() => {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }, 1500);
        }
    }
}

// Full rental function for variable hours (future use)
export async function executeRentNFTHours(tokenId, hoursToRent, totalCost, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;
    
    const tokenIdBigInt = BigInt(tokenId);
    const hoursBigInt = BigInt(hoursToRent);
    const costBigInt = BigInt(totalCost);

    if (hoursBigInt === 0n) {
        showToast("Rental duration must be at least 1 hour.", "error");
        return false;
    }

    if (costBigInt > State.currentUserBalance) {
        const needed = formatBigNumber(costBigInt);
        showToast(`Insufficient balance. Need ${needed.toFixed(2)} BKC.`, "error");
        return false;
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Rent';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }

    try {
        const approved = await ensureApproval(
            State.bkcTokenContract, 
            addresses.rentalManager, 
            costBigInt, 
            btnElement, 
            "NFT Rental"
        );
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';

        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        const args = [tokenIdBigInt, hoursBigInt];

        const gasOpts = await estimateGasWithFallback(rentalContract, 'rentNFT', args, 400000n);
        const rentTxPromise = rentalContract.rentNFT(...args, gasOpts);

        return await executeTransaction(
            rentTxPromise, 
            `NFT rented for ${hoursToRent} hour(s)!`, 
            'Rental failed', 
            btnElement
        );

    } catch (e) {
        console.error("Rent NFT Error:", e);
        const userMessage = formatErrorForUser(e, 'Rental failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        if (btnElement) {
            setTimeout(() => {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }, 1500);
        }
    }
}

// ====================================================================
// 2. DELEGATION TRANSACTIONS
// ====================================================================

export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    console.log("🔐 executeDelegation called:", { totalAmount: totalAmount.toString(), durationSeconds, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) {
        console.error("❌ No signer or delegation manager address");
        return false;
    }
    
    const totalAmountBigInt = BigInt(totalAmount);
    const durationBigInt = BigInt(durationSeconds);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    // Pre-validations
    const MIN_LOCK = 86400n; // 1 day in seconds
    const MAX_LOCK = 315360000n; // 10 years
    
    if (totalAmountBigInt === 0n) {
        showToast("Amount must be greater than 0.", "error");
        return false;
    }
    
    if (durationBigInt < MIN_LOCK || durationBigInt > MAX_LOCK) {
        showToast("Lock duration must be between 1 day and 10 years.", "error");
        return false;
    }

    // Check balance
    try {
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        console.log(`💰 User balance: ${ethers.formatEther(balance)} BKC`);
        if (balance < totalAmountBigInt) {
            const needed = formatBigNumber(totalAmountBigInt);
            showToast(`Insufficient balance. Need ${needed.toFixed(2)} BKC.`, "error");
            return false;
        }
    } catch(e) {
        console.warn("Balance check failed:", e);
    }

    const approved = await ensureApproval(
        State.bkcTokenContract, 
        addresses.delegationManager, 
        totalAmountBigInt, 
        btnElement, 
        "Delegation"
    );
    if (!approved) return false;
    
    // 🔥 V7.9: Create fresh contract instance with signer
    const delegationContract = new ethers.Contract(
        addresses.delegationManager,
        State.delegationManagerContract.interface,
        signer
    );
    
    const args = [totalAmountBigInt, durationBigInt, boosterIdBigInt];
    console.log("📤 Calling delegate with args:", args.map(a => a.toString()));

    // 🔥 V7.9: Use fixed gas for delegation - it's a complex operation
    const gasOpts = { gasLimit: FIXED_GAS.DELEGATION };
    console.log(`⛽ Using fixed gas for delegation: ${FIXED_GAS.DELEGATION.toString()}`);
    
    const delegateTxPromise = delegationContract.delegate(...args, gasOpts);
    
    const success = await executeTransaction(
        delegateTxPromise, 
        'Delegation successful!', 
        'Delegation failed', 
        btnElement
    );
    
    if (success) closeModal();
    return success;
}

export async function executeUnstake(index, boosterIdToSend) {
    console.log("🔓 executeUnstake called:", { index, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) {
        console.error("❌ No signer or delegation manager address");
        return false;
    }

    const indexBigInt = BigInt(index);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    const btnElement = document.querySelector(`.unstake-btn[data-index='${index}']`);
    
    // 🔥 V7.9: Create fresh contract instance with signer
    const delegationContract = new ethers.Contract(
        addresses.delegationManager,
        State.delegationManagerContract.interface,
        signer
    );
    
    const args = [indexBigInt, boosterIdBigInt];
    console.log("📤 Calling unstake with args:", args.map(a => a.toString()));

    // 🔥 V7.9: Use fixed gas
    const gasOpts = { gasLimit: FIXED_GAS.COMPLEX_TX };
    const unstakeTxPromise = delegationContract.unstake(...args, gasOpts);
    
    return await executeTransaction(
        unstakeTxPromise, 
        'Unstake successful!', 
        'Unstake failed', 
        btnElement
    );
}

export async function executeForceUnstake(index, boosterIdToSend) {
    console.log("⚠️ executeForceUnstake called:", { index, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) {
        console.error("❌ No signer or delegation manager address");
        return false;
    }

    const indexBigInt = BigInt(index);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    if (!confirm("⚠️ Force unstaking applies a 50% penalty. Are you sure?")) {
        return false;
    }
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`);
    
    // 🔥 V7.9: Create fresh contract instance with signer
    const delegationContract = new ethers.Contract(
        addresses.delegationManager,
        State.delegationManagerContract.interface,
        signer
    );
    
    const args = [indexBigInt, boosterIdBigInt];
    console.log("📤 Calling forceUnstake with args:", args.map(a => a.toString()));

    // 🔥 V7.9: Use fixed gas
    const gasOpts = { gasLimit: FIXED_GAS.COMPLEX_TX };
    const forceUnstakeTxPromise = delegationContract.forceUnstake(...args, gasOpts);
    
    return await executeTransaction(
        forceUnstakeTxPromise, 
        'Force unstake successful!', 
        'Force unstake failed', 
        btnElement
    );
}

export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    console.log("💰 executeUniversalClaim called:", { stakingRewards: stakingRewards.toString(), boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) {
        console.error("❌ No signer or delegation manager address");
        return false;
    }
    
    const stakingRewardsBigInt = BigInt(stakingRewards);
    const minerRewardsBigInt = BigInt(minerRewards);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    if (stakingRewardsBigInt === 0n && minerRewardsBigInt === 0n) {
        showToast("No rewards to claim.", "info");
        return false;
    }
    
    const originalText = btnElement ? btnElement.innerHTML : 'Claiming...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
    }
    
    try {
        if (stakingRewardsBigInt > 0n) {
            showToast("Claiming staking rewards...", "info");
            
            // 🔥 V7.9: Create fresh contract instance with signer
            const delegationContract = new ethers.Contract(
                addresses.delegationManager,
                State.delegationManagerContract.interface,
                signer
            );
            
            const args = [boosterIdBigInt];
            console.log("📤 Calling claimReward with boosterId:", boosterIdBigInt.toString());

            // 🔥 V7.9: Always use fixed gas - more reliable
            const gasOpts = { gasLimit: FIXED_GAS.SIMPLE_TX };
            console.log(`⛽ Using fixed gas: ${FIXED_GAS.SIMPLE_TX.toString()}`);
            
            const tx = await delegationContract.claimReward(...args, gasOpts);
            console.log(`📝 Claim TX sent: ${tx.hash}`);
            
            await tx.wait();
            showToast('Rewards claimed successfully!', "success");
        }
        
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Claim Error:", e);
        const userMessage = formatErrorForUser(e, 'Claim failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        if (btnElement) {
            setTimeout(() => {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }, 1500);
        }
    }
}

// ====================================================================
// 3. NFT POOL (BOOSTER STORE) TRANSACTIONS
// ====================================================================

// 🔥 V7.5: Flag to prevent duplicate buy/sell transactions
let buyTransactionInProgress = false;
let sellTransactionInProgress = false;

export async function executeBuyBooster(poolAddress, price, boosterTokenIdForDiscount, btnElement) {
    console.log("🛒 executeBuyBooster called:", { poolAddress, price: price.toString() });
    
    // 🔥 V7.5: Prevent duplicate transactions
    if (buyTransactionInProgress) {
        console.log('Buy transaction already in progress');
        return false;
    }
    buyTransactionInProgress = true;
    
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) {
        buyTransactionInProgress = false;
        return false;
    }
    
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    const priceBigInt = BigInt(price);
    
    // Pre-validations
    if (priceBigInt === 0n) {
        showToast("Price is zero - pool may be empty.", "error");
        buyTransactionInProgress = false;
        return false;
    }
    
    // Check if price is max uint256 (pool depleted indicator)
    const MAX_UINT = 2n ** 256n - 1n;
    if (priceBigInt === MAX_UINT) {
        showToast("Pool is depleted. No NFTs available.", "error");
        buyTransactionInProgress = false;
        return false;
    }
    
    if (priceBigInt > State.currentUserBalance) {
        const needed = formatBigNumber(priceBigInt);
        const have = formatBigNumber(State.currentUserBalance);
        showToast(`Insufficient balance. Need ${needed.toFixed(2)} BKC, have ${have.toFixed(2)}.`, "error");
        buyTransactionInProgress = false;
        return false;
    }

    if (btnElement) { 
        btnElement.disabled = true; 
        btnElement.innerHTML = '<div class="loader inline-block"></div>'; 
    }
    
    try {
        // Calculate total with tax buffer (assume ~15% tax)
        const totalWithBuffer = (priceBigInt * 120n) / 100n;
        console.log(`💰 Price: ${safeFormatEther(priceBigInt)} BKC`);
        console.log(`💰 With buffer: ${safeFormatEther(totalWithBuffer)} BKC`);
        
        const approved = await ensureApproval(
            State.bkcTokenContract, 
            poolAddress, 
            totalWithBuffer, 
            btnElement, 
            "NFT Purchase"
        );
        if (!approved) { 
            if (btnElement) btnElement.innerHTML = originalText; 
            return false; 
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        // 🔥 V7.9: Create fresh contract instance with signer
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        // 🔥 V7.9: Use fixed gas - don't rely on estimation
        const gasOpts = { gasLimit: FIXED_GAS.COMPLEX_TX };
        console.log(`⛽ Using fixed gas for buyNFT: ${FIXED_GAS.COMPLEX_TX.toString()}`);
        
        const buyTxPromise = poolContract.buyNFT(gasOpts);
        
        return await executeTransaction(
            buyTxPromise, 
            'NFT purchased successfully!', 
            'Purchase failed', 
            btnElement
        );

    } catch (e) {
        console.error("Buy Booster Error:", e);
        const userMessage = formatErrorForUser(e, 'Purchase failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        // 🔥 V7.5: Always reset the flag
        buyTransactionInProgress = false;
        
        if (btnElement) {
            setTimeout(() => { 
                btnElement.disabled = false; 
                btnElement.innerHTML = originalText; 
            }, 1500);
        }
    }
}

export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    console.log("💸 executeSellBooster called:", { poolAddress, tokenIdToSell });
    
    // 🔥 V7.5: Prevent duplicate transactions
    if (sellTransactionInProgress) {
        console.log('Sell transaction already in progress');
        return false;
    }
    sellTransactionInProgress = true;
    
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) {
        sellTransactionInProgress = false;
        return false;
    }
    
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';
    const tokenIdBigInt = BigInt(tokenIdToSell);
    
    if (tokenIdBigInt === 0n) { 
        showToast("No NFT selected.", "error"); 
        sellTransactionInProgress = false;
        return false; 
    }

    // Verify ownership
    try {
        const owner = await State.rewardBoosterContract.ownerOf(tokenIdBigInt);
        console.log(`👤 NFT #${tokenIdToSell} owner: ${owner}`);
        if (owner.toLowerCase() !== State.userAddress.toLowerCase()) {
            showToast("You don't own this NFT.", "error");
            sellTransactionInProgress = false;
            return false;
        }
    } catch (e) {
        showToast("Failed to verify NFT ownership.", "error");
        sellTransactionInProgress = false;
        return false;
    }

    if (btnElement) { 
        btnElement.disabled = true; 
        btnElement.innerHTML = '<div class="loader inline-block"></div>'; 
    }

    try {
        const approved = await ensureApproval(
            State.rewardBoosterContract, 
            poolAddress, 
            tokenIdBigInt, 
            btnElement, 
            "NFT Sale"
        );
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        // 🔥 V7.9: Create fresh contract instance with signer
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        // Contract uses sellNFT(tokenId, minPayout) - only 2 arguments
        const minPayout = 0n; // Accept any price (slippage protection disabled)
        const args = [tokenIdBigInt, minPayout];
        
        console.log("📤 Calling sellNFT with args:", args.map(a => a.toString()));

        // 🔥 V7.9: Use fixed gas
        const gasOpts = { gasLimit: FIXED_GAS.COMPLEX_TX };
        console.log(`⛽ Using fixed gas: ${FIXED_GAS.COMPLEX_TX.toString()}`);
        
        const sellTxPromise = poolContract.sellNFT(...args, gasOpts);

        return await executeTransaction(
            sellTxPromise, 
            'NFT sold successfully!', 
            'Sale failed', 
            btnElement
        );

    } catch (e) {
        console.error("Sell Booster Error:", e);
        const userMessage = formatErrorForUser(e, 'Sale failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        // 🔥 V7.5: Always reset the flag
        sellTransactionInProgress = false;
        
        if (btnElement) {
            setTimeout(() => { 
                btnElement.disabled = false; 
                btnElement.innerHTML = originalText; 
            }, 1500);
        }
    }
}

// ====================================================================
// 4. FAUCET & NOTARY
// ====================================================================

export async function executeInternalFaucet(btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const network = await State.provider.getNetwork();
    if (network.chainId !== 421614n) {
        showToast("Faucet is only available on testnet.", "warning");
        return false;
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Get Tokens';
    if (btnElement) { 
        btnElement.disabled = true; 
        btnElement.innerHTML = '<div class="loader inline-block"></div> Checking...'; 
    }

    try {
        if (State.faucetContract) {
            const faucetContract = State.faucetContract.connect(signer);
            const faucetAddress = await faucetContract.getAddress();
            
            // Check if faucet has tokens to distribute
            let faucetBkcBalance = 0n;
            let faucetEthBalance = 0n;
            
            try {
                if (State.bkcTokenContract) {
                    faucetBkcBalance = await State.bkcTokenContract.balanceOf(faucetAddress);
                }
                faucetEthBalance = await State.provider.getBalance(faucetAddress);
            } catch (balErr) {
                console.warn("Could not check faucet balance:", balErr.message?.slice(0, 50));
            }
            
            // Warn if faucet appears empty
            if (faucetBkcBalance === 0n && faucetEthBalance === 0n) {
                console.warn("⚠️ Faucet may be empty - BKC:", faucetBkcBalance.toString(), "ETH:", faucetEthBalance.toString());
            }

            if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
            
            // Try to claim - let the contract handle cooldown internally
            let tx;
            try {
                // First try to estimate gas to catch errors early
                const estimated = await faucetContract.claim.estimateGas();
                tx = await faucetContract.claim({ gasLimit: (estimated * 150n) / 100n });
            } catch (estError) {
                console.warn("Faucet claim estimation failed:", estError.message?.slice(0, 100));
                
                // Parse the error to give better feedback
                const errMsg = estError.message?.toLowerCase() || '';
                const errData = estError.data || '';
                
                // Common faucet error patterns
                if (errMsg.includes('cooldown') || errMsg.includes('wait') || errMsg.includes('already claimed')) {
                    showToast("⏳ Already claimed recently. Please wait 24 hours.", "warning");
                } else if (errMsg.includes('insufficient') || errMsg.includes('empty') || faucetBkcBalance === 0n) {
                    showToast("🚫 Faucet is empty. Please contact admin.", "error");
                } else if (errMsg.includes('revert') || errData === '0x') {
                    // Generic revert - could be cooldown or other check
                    showToast("⏳ Faucet unavailable. You may have already claimed today.", "warning");
                } else {
                    // Try anyway with fixed gas (might work for some edge cases)
                    try {
                        tx = await faucetContract.claim({ gasLimit: 300000n });
                    } catch (retryErr) {
                        showToast("❌ Faucet request failed. Try again later.", "error");
                        if (btnElement) { 
                            btnElement.disabled = false; 
                            btnElement.innerHTML = originalText; 
                        }
                        return false;
                    }
                }
                
                if (!tx) {
                    if (btnElement) { 
                        btnElement.disabled = false; 
                        btnElement.innerHTML = originalText; 
                    }
                    return false;
                }
            }
            
            return await executeTransaction(tx, '✅ Tokens received!', 'Faucet Error', btnElement);
            
        } else if (State.bkcTokenContract) {
            // Fallback: direct mint if token has mint function
            if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Minting...';
            
            const amount = ethers.parseUnits("20", 18);
            const bkcTokenContract = State.bkcTokenContract.connect(signer);
            const args = [State.userAddress, amount];
            
            try {
                const gasOpts = await estimateGasWithFallback(bkcTokenContract, 'mint', args, 200000n);
                const tx = await bkcTokenContract.mint(...args, gasOpts);
                return await executeTransaction(tx, '20 BKC Minted!', 'Mint Error', btnElement);
            } catch (mintErr) {
                console.error("Direct mint failed:", mintErr);
                showToast("❌ Mint not available. Use external faucet.", "error");
                if (btnElement) { 
                    btnElement.disabled = false; 
                    btnElement.innerHTML = originalText; 
                }
                return false;
            }
            
        } else {
            showToast("❌ Faucet contract not configured.", "error");
            if (btnElement) { 
                btnElement.disabled = false; 
                btnElement.innerHTML = originalText; 
            }
            return false;
        }
        
    } catch (e) {
        console.error("Faucet Error:", e);
        
        // Parse error for user-friendly message
        const errMsg = (e.message || '').toLowerCase();
        
        if (errMsg.includes('user rejected') || errMsg.includes('user denied')) {
            showToast("Transaction cancelled.", "info");
        } else if (errMsg.includes('insufficient funds') || errMsg.includes('gas')) {
            showToast("❌ Not enough ETH for gas fees.", "error");
        } else if (errMsg.includes('cooldown') || errMsg.includes('revert')) {
            showToast("⏳ Faucet on cooldown. Try again in 24h.", "warning");
        } else {
            showToast("❌ Faucet request failed.", "error");
        }
        
        if (btnElement) { 
            btnElement.disabled = false; 
            btnElement.innerHTML = originalText; 
        }
        return false;
    }
}

// Diagnostic function - can be called from console: window.diagnoseFaucet()
export async function diagnoseFaucet() {
    console.log("🔍 Faucet Diagnostics Starting...");
    
    const results = {
        connected: State.isConnected,
        userAddress: State.userAddress,
        faucetContract: !!State.faucetContract,
        faucetAddress: null,
        faucetBkcBalance: null,
        faucetEthBalance: null,
        userEthBalance: null,
        chainId: null,
        canClaim: false,
        error: null
    };

    try {
        // Check network
        if (State.provider) {
            const network = await State.provider.getNetwork();
            results.chainId = network.chainId.toString();
            console.log("📡 Chain ID:", results.chainId);
        }

        // Check user ETH balance
        if (State.userAddress && State.provider) {
            const userEth = await State.provider.getBalance(State.userAddress);
            results.userEthBalance = ethers.formatEther(userEth);
            console.log("💰 User ETH Balance:", results.userEthBalance, "ETH");
            
            if (userEth < ethers.parseEther("0.001")) {
                console.warn("⚠️ User has very low ETH - may not be able to pay gas");
            }
        }

        // Check faucet contract
        if (State.faucetContract) {
            results.faucetAddress = await State.faucetContract.getAddress();
            console.log("📍 Faucet Address:", results.faucetAddress);
            
            // Check faucet balances
            const faucetEth = await State.provider.getBalance(results.faucetAddress);
            results.faucetEthBalance = ethers.formatEther(faucetEth);
            console.log("💎 Faucet ETH Balance:", results.faucetEthBalance, "ETH");
            
            if (State.bkcTokenContract) {
                const faucetBkc = await State.bkcTokenContract.balanceOf(results.faucetAddress);
                results.faucetBkcBalance = ethers.formatEther(faucetBkc);
                console.log("🪙 Faucet BKC Balance:", results.faucetBkcBalance, "BKC");
                
                if (faucetBkc === 0n) {
                    console.error("❌ FAUCET HAS NO BKC TOKENS TO DISTRIBUTE!");
                }
            }

            // Try to simulate claim
            try {
                const gasEstimate = await State.faucetContract.claim.estimateGas();
                results.canClaim = true;
                console.log("✅ Claim would succeed! Estimated gas:", gasEstimate.toString());
            } catch (simErr) {
                results.canClaim = false;
                results.error = simErr.message?.slice(0, 200);
                console.error("❌ Claim would fail:", results.error);
                
                // Try to decode the error
                if (simErr.message?.includes('revert')) {
                    console.log("💡 This might be: cooldown active, faucet empty, or contract paused");
                }
            }
        } else {
            console.error("❌ Faucet contract not loaded!");
        }

    } catch (e) {
        results.error = e.message;
        console.error("Diagnostic error:", e);
    }

    console.log("📊 Full Diagnostic Results:", results);
    console.log("\n🔧 TO FIX:");
    
    if (!results.connected) {
        console.log("1. Connect your wallet first");
    }
    if (results.faucetBkcBalance === "0.0" || results.faucetBkcBalance === null) {
        console.log("2. Faucet needs to be funded with BKC tokens");
    }
    if (parseFloat(results.faucetEthBalance || 0) < 0.01) {
        console.log("3. Faucet needs ETH for gas refunds");
    }
    if (parseFloat(results.userEthBalance || 0) < 0.001) {
        console.log("4. You need more ETH for gas fees. Get from: https://faucet.arbitrum.io/");
    }
    if (!results.canClaim && results.faucetBkcBalance !== "0.0") {
        console.log("5. You may have already claimed today (24h cooldown)");
    }

    return results;
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
    window.diagnoseFaucet = diagnoseFaucet;
}

// ====================================================================
// HELPER: Format contentHash to valid bytes32
// ====================================================================

/**
 * Converts a content hash string to a valid bytes32 format
 * @param {string} hash - The hash string (with or without 0x prefix)
 * @returns {string} - A valid bytes32 hex string (0x + 64 hex chars)
 */
function formatContentHashToBytes32(hash) {
    if (!hash) {
        // Return zero bytes32 if no hash provided
        return '0x' + '0'.repeat(64);
    }
    
    // If it's already a valid bytes32
    if (typeof hash === 'string' && hash.startsWith('0x') && hash.length === 66) {
        return hash;
    }
    
    // Remove 0x prefix if present
    let cleanHash = typeof hash === 'string' ? hash : String(hash);
    if (cleanHash.startsWith('0x')) {
        cleanHash = cleanHash.slice(2);
    }
    
    // Remove any non-hex characters
    cleanHash = cleanHash.replace(/[^0-9a-fA-F]/g, '');
    
    // Ensure exactly 64 hex characters (32 bytes)
    if (cleanHash.length > 64) {
        // Truncate if too long
        cleanHash = cleanHash.slice(0, 64);
    } else if (cleanHash.length < 64) {
        // Pad with zeros if too short
        cleanHash = cleanHash.padStart(64, '0');
    }
    
    return '0x' + cleanHash.toLowerCase();
}

// ====================================================================
// NOTARY DOCUMENT FUNCTION (V7.2 - Fixed bytes32 conversion)
// ====================================================================

export async function executeNotarizeDocument(documentURI, description, contentHash, boosterId, submitButton) {
    const signer = await getConnectedSigner();
    
    if (!signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Contracts or Signer not ready.", "error");
        return false;
    }

    const notaryContract = State.decentralizedNotaryContract.connect(signer);
    const notaryAddress = await notaryContract.getAddress();
    
    // 1. Get fee and ensure approval
    let feeToPay = State.systemFees?.NOTARY_SERVICE || 0n;
    try {
        if (State.ecosystemManagerContractPublic) {
            const key = ethers.id("NOTARY_SERVICE");
            const realFee = await State.ecosystemManagerContractPublic.getFee(key);
            if (realFee > 0n) feeToPay = realFee;
        }
    } catch (e) {
        console.warn("Fee fetch warning:", e);
    }

    if (feeToPay > 0n) {
        // Check balance first
        try {
            const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
            if (balance < feeToPay) {
                showToast("Insufficient balance for notary fee.", "error");
                return false;
            }
        } catch (e) {
            console.warn("Balance check failed:", e);
        }
        
        const approved = await ensureApproval(
            State.bkcTokenContract, 
            notaryAddress, 
            feeToPay, 
            submitButton, 
            "Notary Fee"
        );
        if (!approved) {
            showToast("Approval failed or rejected.", "error");
            return false;
        }
    }

    // 2. Prepare Parameters - FIX: Convert contentHash to valid bytes32
    const bId = boosterId ? BigInt(boosterId) : 0n;
    
    // Sanitize description (remove problematic characters, limit length)
    let safeDescription = description || 'No description';
    safeDescription = safeDescription.slice(0, 200); // Max 200 chars
    safeDescription = safeDescription.replace(/[^\x20-\x7E]/g, ''); // Only ASCII printable
    if (!safeDescription) safeDescription = 'Notarized Document';
    
    // Convert contentHash to proper bytes32 format
    const formattedHash = formatContentHashToBytes32(contentHash);
    
    // Debug log to help troubleshoot
    console.log('📝 Notary Parameters:', {
        documentURI,
        description: safeDescription?.slice(0, 50) + '...',
        originalHash: contentHash,
        formattedHash,
        boosterId: bId.toString()
    });
    
    const args = [documentURI, safeDescription, formattedHash, bId];
    
    // 3. Try static call first to catch revert reasons
    try {
        console.log('🔍 Testing notarize call...');
        await notaryContract.notarize.staticCall(...args);
        console.log('✅ Static call passed');
    } catch (staticErr) {
        console.error('❌ Static call failed:', staticErr);
        const reason = staticErr.reason || staticErr.message || 'Unknown error';
        showToast(`Contract error: ${reason.slice(0, 50)}`, 'error');
        return false;
    }
    
    // 4. Check ETH balance for gas
    try {
        const provider = notaryContract.runner?.provider || State.provider;
        const ethBalance = await provider.getBalance(State.userAddress);
        console.log('⛽ ETH Balance for gas:', ethers.formatEther(ethBalance), 'ETH');
        
        if (ethBalance < ethers.parseEther("0.0001")) {
            showToast('Insufficient ETH for gas. Get some Arbitrum Sepolia ETH.', 'error');
            return false;
        }
    } catch (balErr) {
        console.warn('ETH balance check failed:', balErr);
    }
    
    // 5. Double-check allowance before executing
    if (feeToPay > 0n) {
        try {
            const tokenWithSigner = State.bkcTokenContract.connect(signer);
            const currentAllowance = await tokenWithSigner.allowance(State.userAddress, notaryAddress);
            // 🔥 V7.9: Use safe formatter to avoid overflow
            console.log('💰 Current allowance:', safeFormatEther(currentAllowance), 'BKC');
            console.log('💰 Fee to pay:', safeFormatEther(feeToPay), 'BKC');
            
            if (currentAllowance < feeToPay) {
                console.warn('⚠️ Allowance insufficient, requesting new approval...');
                // 🔥 V7.11: Use specific approval amount (100x fee)
                const approvalAmount = feeToPay * 100n;
                const approveTx = await tokenWithSigner.approve(notaryAddress, approvalAmount, { gasLimit: FIXED_GAS.APPROVE });
                console.log('📝 Approval tx sent:', approveTx.hash);
                await approveTx.wait();
                console.log('✅ Approval confirmed');
                // Wait for state update
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (allowErr) {
            console.error('Allowance check/fix failed:', allowErr);
            // Continue anyway - the main approval should have worked
        }
    }
    
    // 6. Execute with FIXED gas (not estimation - more reliable)
    // 🔥 V7.9: Use fixed gas to avoid RPC errors
    const gasOpts = { gasLimit: FIXED_GAS.COMPLEX_TX };
    console.log('⛽ Gas options:', gasOpts);
    
    const notarizeTxPromise = notaryContract.notarize(...args, gasOpts);

    return await executeTransaction(
        notarizeTxPromise, 
        'Document notarized successfully!', 
        'Notarization failed', 
        submitButton
    );
}

// ====================================================================
// 5. FORTUNE POOL TRANSACTIONS (V2.1)
// ====================================================================

/**
 * Execute Fortune Pool participation
 * @param {bigint|string|number} wagerAmount - Amount to wager in wei
 * @param {number[]} guesses - Array of guess values
 * @param {boolean} isCumulative - true for 5x Cumulative mode, false for 1x Jackpot
 * @param {HTMLElement} btnElement - Button element for UI feedback
 * @returns {Promise<{success: boolean, gameId?: number, txHash?: string}|false>}
 */
export async function executeFortuneParticipate(wagerAmount, guesses, isCumulative, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !State.actionsManagerContract) {
        showToast("Contracts not ready. Please refresh.", "error");
        return false;
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Play';
    
    try {
        // Parse inputs
        const wagerBigInt = BigInt(wagerAmount);
        const guessesArray = guesses.map(g => BigInt(g));

        // Pre-validations
        if (wagerBigInt === 0n) {
            showToast("Wager amount must be greater than 0.", "error");
            return false;
        }

        if (guessesArray.length === 0) {
            showToast("Please select at least one number.", "error");
            return false;
        }

        // Check BKC balance
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        if (balance < wagerBigInt) {
            const needed = formatBigNumber(wagerBigInt);
            showToast(`Insufficient BKC. Need ${needed.toFixed(2)} BKC.`, "error");
            return false;
        }

        // 1. Get oracle fee
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Preparing...';
        
        let oracleFee;
        try {
            oracleFee = await State.actionsManagerContract.getRequiredOracleFee(isCumulative);
        } catch (e) {
            // Fallback: use base oracle fee
            try {
                const baseFee = await State.actionsManagerContract.oracleFee();
                oracleFee = isCumulative ? baseFee * 5n : baseFee;
            } catch (e2) {
                oracleFee = isCumulative ? ethers.parseEther("0.005") : ethers.parseEther("0.001");
            }
        }

        // Check ETH balance for oracle fee
        const ethBalance = await signer.provider.getBalance(State.userAddress);
        const requiredEth = oracleFee + ethers.parseEther("0.0005"); // Extra for gas
        
        if (ethBalance < requiredEth) {
            const feeFormatted = Number(ethers.formatEther(oracleFee)).toFixed(4);
            showToast(`Insufficient ETH for oracle fee. Need ~${feeFormatted} ETH.`, "error");
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }
            return false;
        }

        // 2. Approve BKC tokens
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Approving...';
        
        const fortuneAddress = await State.actionsManagerContract.getAddress();
        const approved = await ensureApproval(
            State.bkcTokenContract,
            fortuneAddress,
            wagerBigInt,
            btnElement,
            "Fortune Pool"
        );
        
        if (!approved) {
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }
            return false;
        }

        // 3. Execute participation
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Submitting...';
        
        // 🔥 V7.9: Create fresh contract instance with signer
        const fortuneContract = new ethers.Contract(
            await State.actionsManagerContract.getAddress(),
            State.actionsManagerContract.interface,
            signer
        );
        
        const args = [wagerBigInt, guessesArray, isCumulative];
        console.log("📤 Calling participate with args:", args.map(a => a.toString()));
        console.log("💎 Oracle fee:", ethers.formatEther(oracleFee), "ETH");
        
        // 🔥 V7.9: Use fixed gas - estimation often fails with value
        const gasOpts = { gasLimit: FIXED_GAS.COMPLEX_TX };
        console.log(`⛽ Using fixed gas: ${FIXED_GAS.COMPLEX_TX.toString()}`);
        
        const tx = await fortuneContract.participate(...args, { 
            value: oracleFee,
            ...gasOpts 
        });

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Confirming...';
        
        showToast('Transaction submitted. Waiting for confirmation...', 'info');
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
            // 🔥 V7.11: Get revert reason for Fortune
            let reason = 'Game rejected by contract';
            try {
                const provider = tx.provider || State.provider;
                await provider.call({
                    to: receipt.to,
                    from: receipt.from,
                    data: tx.data,
                    value: oracleFee,
                    blockTag: receipt.blockNumber - 1
                });
            } catch (e) {
                reason = e.reason || e.shortMessage || 'Check wager amount and guesses';
            }
            throw new Error(`Fortune game failed: ${reason}`);
        }

        // Parse GameRequested event
        let gameId = null;
        for (const log of receipt.logs) {
            try {
                const parsed = fortuneContract.interface.parseLog(log);
                if (parsed?.name === "GameRequested") {
                    gameId = Number(parsed.args.gameId);
                    break;
                }
            } catch {}
        }

        const modeName = isCumulative ? "5x Cumulative" : "1x Jackpot";
        const successMsg = gameId 
            ? `🎰 Game #${gameId} submitted! Waiting for oracle...`
            : `🎰 ${modeName} game submitted! Waiting for oracle...`;
        
        showToast(successMsg, 'success', receipt.hash);

        // Refresh user data
        loadUserData().catch(() => {});
        
        return { success: true, gameId, txHash: receipt.hash };

    } catch (e) {
        console.error("Fortune Error:", e);
        const userMessage = formatErrorForUser(e, 'Fortune Pool failed');
        showToast(userMessage, "error");
        return false;
        
    } finally {
        if (btnElement) {
            setTimeout(() => {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }, 1500);
        }
    }
}

/**
 * Get Fortune Pool status and configuration
 */
export async function getFortunePoolStatus() {
    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) {
        return { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n, 
            oracleFee1x: ethers.parseEther("0.001"), 
            oracleFee5x: ethers.parseEther("0.005"),
            tiers: [] 
        };
    }

    try {
        const [activeTierCount, prizePool, gameCounter] = await Promise.all([
            contract.activeTierCount().catch(() => 0n),
            contract.prizePoolBalance().catch(() => 0n),
            contract.gameCounter().catch(() => 0n)
        ]);

        // Get oracle fees
        let oracleFee1x = ethers.parseEther("0.001");
        let oracleFee5x = ethers.parseEther("0.005");
        try {
            oracleFee1x = await contract.getRequiredOracleFee(false);
            oracleFee5x = await contract.getRequiredOracleFee(true);
        } catch (e) {
            try {
                const baseFee = await contract.oracleFee();
                oracleFee1x = baseFee;
                oracleFee5x = baseFee * 5n;
            } catch {}
        }

        // Load tiers
        const tiers = [];
        const tierCount = Number(activeTierCount);
        
        for (let i = 0; i < Math.min(tierCount, 10); i++) {
            try {
                const tier = await contract.prizeTiers(i);
                if (tier && (tier.active || tier[2])) {
                    tiers.push({
                        tierId: i,
                        maxRange: Number(tier.maxRange || tier[0]),
                        multiplierBips: Number(tier.multiplierBips || tier[1]),
                        multiplier: Number(tier.multiplierBips || tier[1]) / 10000,
                        active: tier.active || tier[2]
                    });
                }
            } catch (e) {
                // Tier doesn't exist
            }
        }

        return {
            active: tierCount > 0,
            activeTiers: tierCount,
            prizePool: BigInt(prizePool.toString()),
            oracleFee1x: BigInt(oracleFee1x.toString()),
            oracleFee5x: BigInt(oracleFee5x.toString()),
            gameCounter: Number(gameCounter),
            tiers
        };

    } catch (e) {
        console.error("Fortune status error:", e);
        return { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n, 
            oracleFee1x: ethers.parseEther("0.001"), 
            oracleFee5x: ethers.parseEther("0.005"),
            tiers: [] 
        };
    }
}

/**
 * Check game result by gameId
 */
export async function getGameResult(gameId) {
    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) return null;

    try {
        const isFulfilled = await contract.isGameFulfilled(gameId);
        
        if (!isFulfilled) {
            return { fulfilled: false, pending: true };
        }

        const results = await contract.getGameResults(gameId);
        
        return {
            fulfilled: true,
            pending: false,
            rolls: results.map(r => Number(r))
        };

    } catch (e) {
        console.warn("Game result check failed:", e);
        return null;
    }
}