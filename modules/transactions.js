// js/modules/transactions.js
// ✅ VERSÃO V7.0 - FORTUNE POOL V2.1 SUPPORT + Anti-Revert System + Pre-Flight Checks

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js';

// --- Constants ---
const APPROVAL_BUFFER_PERCENT = 5n; // 5% extra buffer for approvals
const MAX_GAS_LIMIT = 3000000n; // Safe max for Arbitrum
const MIN_GAS_LIMIT = 100000n; // Minimum gas for simple txs

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
        // Add 30% margin for Arbitrum's L2 gas dynamics
        const withMargin = (estimated * 130n) / 100n;
        
        // Clamp between min and max
        if (withMargin < MIN_GAS_LIMIT) return { gasLimit: MIN_GAS_LIMIT };
        if (withMargin > MAX_GAS_LIMIT) return { gasLimit: MAX_GAS_LIMIT };
        
        return { gasLimit: withMargin };
    } catch (error) {
        // Gas estimation failed - likely will revert
        console.warn(`⚠️ Gas estimation failed for ${method}:`, error.message?.slice(0, 100));
        
        // Try to decode the error
        const decodedError = decodeRevertReason(error);
        if (decodedError && decodedError !== 'Unknown error') {
            throw new Error(`Pre-flight check failed: ${decodedError}`);
        }
        
        // Return safe fallback (but transaction may still fail)
        return { gasLimit: defaultGas };
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
        return 'Internal RPC error - try resetting MetaMask or check contract state';
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
    if (!State.isConnected) {
        showToast("Please connect your wallet first.", "error");
        return null;
    }
    
    if (!State.web3Provider) {
        showToast("Wallet provider not found. Please refresh.", "error");
        return null;
    }
    
    try {
        const provider = new ethers.BrowserProvider(State.web3Provider);
        const signer = await provider.getSigner();
        
        // Verify signer is still connected
        const address = await signer.getAddress();
        if (!address) {
            throw new Error("Signer address unavailable");
        }
        
        return signer;
    } catch (e) {
        console.error("Signer acquisition failed:", e);
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
            throw new Error('Transaction reverted on-chain');
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

    try {
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

            // Calculate approval amount with small buffer
            const approvalAmount = (requiredAmount * (100n + APPROVAL_BUFFER_PERCENT)) / 100n;

            if (allowance < requiredAmount) {
                const formatted = formatBigNumber(approvalAmount);
                showToast(`Approving ${formatted.toFixed(2)} BKC for ${purpose}...`, "info");
                setButtonState("Approving tokens");

                // Estimate gas for approval
                const gasOpts = await estimateGasWithFallback(
                    approvedTokenContract, 
                    'approve', 
                    [spenderAddress, approvalAmount],
                    100000n
                );
                
                const approveTx = await approvedTokenContract.approve(
                    spenderAddress, 
                    approvalAmount, 
                    gasOpts
                );
                
                const receipt = await approveTx.wait();
                
                if (receipt.status === 0) {
                    throw new Error('Approval transaction reverted');
                }
                
                showToast('Approval successful!', "success");
            }
            
            return true;
            
        } else {
            // === ERC721 APPROVAL ===
            const tokenId = BigInt(amountOrTokenId);
            setButtonState("Checking NFT approval");
            
            // Check current approval state
            let approvedAddr = ethers.ZeroAddress;
            try { 
                approvedAddr = await tokenContract.getApproved(tokenId); 
            } catch(e) {
                // Token might not exist or other error
            }
            
            const isApprovedAll = await tokenContract.isApprovedForAll(
                State.userAddress, 
                spenderAddress
            );
            
            if (approvedAddr.toLowerCase() !== spenderAddress.toLowerCase() && !isApprovedAll) {
                showToast(`Approving NFT #${tokenId} for ${purpose}...`, "info");
                setButtonState("Approving NFT");
                
                const gasOpts = await estimateGasWithFallback(
                    approvedTokenContract,
                    'approve',
                    [spenderAddress, tokenId],
                    150000n
                );

                const approveTx = await approvedTokenContract.approve(
                    spenderAddress, 
                    tokenId, 
                    gasOpts
                );
                
                const receipt = await approveTx.wait();
                
                if (receipt.status === 0) {
                    throw new Error('NFT approval reverted');
                }
                
                showToast("NFT Approval successful!", "success");
            }
            
            return true;
        }

    } catch (e) {
        console.error("❌ Approval Failed:", e);
        if (btnElement) btnElement.disabled = false;
        
        const userMessage = formatErrorForUser(e, 'Approval failed');
        showToast(userMessage, "error");
        
        return false;
    }
}

// ====================================================================
// 1. RENTAL MARKET TRANSACTIONS
// ====================================================================

export async function executeListNFT(tokenId, pricePerHourWei, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;

    const tokenIdBigInt = BigInt(tokenId);
    const priceBigInt = BigInt(pricePerHourWei);
    
    // Pre-validation
    if (priceBigInt === 0n) {
        showToast("Price must be greater than 0.", "error");
        return false;
    }

    // Verify ownership
    try {
        const owner = await State.rewardBoosterContract.ownerOf(tokenIdBigInt);
        if (owner.toLowerCase() !== State.userAddress.toLowerCase()) {
            showToast("You don't own this NFT.", "error");
            return false;
        }
    } catch (e) {
        showToast("Failed to verify NFT ownership.", "error");
        return false;
    }
    
    const originalText = btnElement ? btnElement.innerHTML : 'List NFT';
    if (btnElement) { 
        btnElement.disabled = true; 
        btnElement.innerHTML = '<div class="loader inline-block"></div>'; 
    }

    try {
        const approved = await ensureApproval(
            State.rewardBoosterContract, 
            addresses.rentalManager, 
            tokenIdBigInt, 
            btnElement, 
            "Rental Listing"
        );
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        const args = [tokenIdBigInt, priceBigInt];
        
        const gasOpts = await estimateGasWithFallback(rentalContract, 'listNFTSimple', args, 300000n);
        const listTxPromise = rentalContract.listNFTSimple(...args, gasOpts);
        
        return await executeTransaction(
            listTxPromise, 
            'NFT listed for rental!', 
            'Listing failed', 
            btnElement
        );

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

export async function executeRentNFT(tokenId, hoursToRent, totalCost, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;
    
    const tokenIdBigInt = BigInt(tokenId);
    const hoursBigInt = BigInt(hoursToRent);
    const costBigInt = BigInt(totalCost);

    // Pre-validation
    if (hoursBigInt === 0n) {
        showToast("Rental duration must be at least 1 hour.", "error");
        return false;
    }

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
            'NFT rented successfully!', 
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
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;
    
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
    
    const delegationContract = State.delegationManagerContract.connect(signer);
    const args = [totalAmountBigInt, durationBigInt, boosterIdBigInt];

    const gasOpts = await estimateGasWithFallback(delegationContract, 'delegate', args, 500000n);
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
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;

    const indexBigInt = BigInt(index);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    const btnElement = document.querySelector(`.unstake-btn[data-index='${index}']`);
    const delegationContract = State.delegationManagerContract.connect(signer);
    const args = [indexBigInt, boosterIdBigInt];

    const gasOpts = await estimateGasWithFallback(delegationContract, 'unstake', args, 400000n);
    const unstakeTxPromise = delegationContract.unstake(...args, gasOpts);
    
    return await executeTransaction(
        unstakeTxPromise, 
        'Unstake successful!', 
        'Unstake failed', 
        btnElement
    );
}

export async function executeForceUnstake(index, boosterIdToSend) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;

    const indexBigInt = BigInt(index);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    if (!confirm("⚠️ Force unstaking applies a 50% penalty. Are you sure?")) {
        return false;
    }
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`);
    const delegationContract = State.delegationManagerContract.connect(signer);
    const args = [indexBigInt, boosterIdBigInt];

    const gasOpts = await estimateGasWithFallback(delegationContract, 'forceUnstake', args, 400000n);
    const forceUnstakeTxPromise = delegationContract.forceUnstake(...args, gasOpts);
    
    return await executeTransaction(
        forceUnstakeTxPromise, 
        'Force unstake successful!', 
        'Force unstake failed', 
        btnElement
    );
}

export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;
    
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
            const delegationContract = State.delegationManagerContract.connect(signer);
            const args = [boosterIdBigInt];

            const gasOpts = await estimateGasWithFallback(delegationContract, 'claimReward', args, 300000n);
            const tx = await delegationContract.claimReward(...args, gasOpts);
            
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

export async function executeBuyBooster(poolAddress, price, boosterTokenIdForDiscount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    const priceBigInt = BigInt(price);
    
    // Pre-validations
    if (priceBigInt === 0n) {
        showToast("Price is zero - pool may be empty.", "error");
        return false;
    }
    
    // Check if price is max uint256 (pool depleted indicator)
    const MAX_UINT = 2n ** 256n - 1n;
    if (priceBigInt === MAX_UINT) {
        showToast("Pool is depleted. No NFTs available.", "error");
        return false;
    }
    
    if (priceBigInt > State.currentUserBalance) {
        const needed = formatBigNumber(priceBigInt);
        const have = formatBigNumber(State.currentUserBalance);
        showToast(`Insufficient balance. Need ${needed.toFixed(2)} BKC, have ${have.toFixed(2)}.`, "error");
        return false;
    }

    if (btnElement) { 
        btnElement.disabled = true; 
        btnElement.innerHTML = '<div class="loader inline-block"></div>'; 
    }
    
    try {
        // Calculate total with tax buffer (assume ~10% tax)
        const totalWithBuffer = (priceBigInt * 115n) / 100n;
        
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

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        const args = [boosterIdToSend];

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        const gasOpts = await estimateGasWithFallback(poolContract, 'buyNextAvailableNFT', args, 500000n);
        const buyTxPromise = poolContract.buyNextAvailableNFT(...args, gasOpts);
        
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
        if (btnElement) {
            setTimeout(() => { 
                btnElement.disabled = false; 
                btnElement.innerHTML = originalText; 
            }, 1500);
        }
    }
}

export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';
    const tokenIdBigInt = BigInt(tokenIdToSell);
    
    if (tokenIdBigInt === 0n) { 
        showToast("No NFT selected.", "error"); 
        return false; 
    }

    // Verify ownership
    try {
        const owner = await State.rewardBoosterContract.ownerOf(tokenIdBigInt);
        if (owner.toLowerCase() !== State.userAddress.toLowerCase()) {
            showToast("You don't own this NFT.", "error");
            return false;
        }
    } catch (e) {
        showToast("Failed to verify NFT ownership.", "error");
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

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        const minPrice = 0n; // Accept any price (slippage protection disabled)
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        const args = [tokenIdBigInt, boosterIdToSend, minPrice];

        const gasOpts = await estimateGasWithFallback(poolContract, 'sellNFT', args, 500000n);
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
        btnElement.innerHTML = '<div class="loader inline-block"></div> Minting...'; 
    }

    try {
        if (State.faucetContract) {
            const faucetContract = State.faucetContract.connect(signer);
            const gasOpts = await estimateGasWithFallback(faucetContract, 'claim', [], 200000n);
            const tx = await faucetContract.claim(gasOpts);
            return await executeTransaction(tx, 'Tokens received!', 'Faucet Error', btnElement);
            
        } else if (State.bkcTokenContract) {
            const amount = ethers.parseUnits("20", 18);
            const bkcTokenContract = State.bkcTokenContract.connect(signer);
            const args = [State.userAddress, amount];
            
            const gasOpts = await estimateGasWithFallback(bkcTokenContract, 'mint', args, 200000n);
            const tx = await bkcTokenContract.mint(...args, gasOpts);
            return await executeTransaction(tx, '20 BKC Minted!', 'Mint Error', btnElement);
            
        } else {
            throw new Error("Faucet not available.");
        }
        
    } catch (e) {
        console.error("Faucet Error:", e);
        const userMessage = formatErrorForUser(e, 'Faucet failed');
        showToast(userMessage, "error");
        if (btnElement) { 
            btnElement.disabled = false; 
            btnElement.innerHTML = originalText; 
        }
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

    // 2. Prepare Parameters
    const bId = boosterId ? BigInt(boosterId) : 0n;
    const args = [documentURI, description, contentHash, bId];
    
    // 3. Execute with gas estimation
    const gasOpts = await estimateGasWithFallback(notaryContract, 'notarize', args, 500000n);
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
        showToast("Fortune Pool not available.", "error");
        return false;
    }

    const wagerBigInt = BigInt(wagerAmount);
    const guessesArray = guesses.map(g => BigInt(g));
    
    // Pre-validations
    if (wagerBigInt === 0n) {
        showToast("Wager amount must be greater than 0.", "error");
        return false;
    }

    // Check BKC balance
    try {
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        if (balance < wagerBigInt) {
            const needed = formatBigNumber(wagerBigInt);
            showToast(`Insufficient BKC. Need ${needed.toFixed(2)} BKC.`, "error");
            return false;
        }
    } catch (e) {
        console.warn("Balance check failed:", e);
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Play';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div> Preparing...';
    }

    try {
        // 1. Get Oracle Fee
        let oracleFee = 0n;
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
        
        const fortuneContract = State.actionsManagerContract.connect(signer);
        const args = [wagerBigInt, guessesArray, isCumulative];
        
        // Estimate gas with value
        let gasOpts;
        try {
            const estimated = await fortuneContract.participate.estimateGas(...args, { value: oracleFee });
            gasOpts = { gasLimit: (estimated * 130n) / 100n };
        } catch (e) {
            console.warn("Gas estimation for Fortune failed:", e.message?.slice(0, 80));
            gasOpts = { gasLimit: 500000n };
        }
        
        const tx = await fortuneContract.participate(...args, { 
            value: oracleFee,
            ...gasOpts 
        });

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Confirming...';
        
        showToast('Transaction submitted. Waiting for confirmation...', 'info');
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
            throw new Error('Transaction reverted on-chain');
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