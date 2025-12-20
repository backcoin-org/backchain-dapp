// js/modules/transactions.js
// ✅ PRODUCTION V13.0 - Complete + Aggressive Retry (5 attempts, 1s delay)

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
    MAX_RETRIES: 5,
    RETRY_DELAY_MS: 1000,
    APPROVAL_WAIT_MS: 500,
    GAS_BUFFER_PERCENT: 130
};

// ====================================================================
// UTILITIES
// ====================================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function safeFormatEther(value) {
    try {
        const bigValue = BigInt(value);
        if (bigValue > ethers.parseEther("1000000000")) return "UNLIMITED";
        return ethers.formatEther(bigValue);
    } catch { return "N/A"; }
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
        return await provider.getSigner();
    } catch (e) {
        console.error("Signer error:", e);
        showToast("Wallet connection error", "error");
        return null;
    }
}

function formatError(error) {
    const msg = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
    
    if (msg.includes('user rejected') || msg.includes('User denied')) return 'Transaction cancelled';
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('exceeds balance')) return 'Insufficient token balance';
    if (msg.includes('0xfb550858') || msg.includes('InsufficientOracleFee')) return 'Insufficient oracle fee (ETH)';
    if (msg.includes('0xbcfa8e99') || msg.includes('InvalidGuessCount')) return 'Wrong number of guesses';
    if (msg.includes('0x5c844fb4') || msg.includes('InvalidGuessRange')) return 'Guess out of range';
    if (msg.includes('DelegationNotFound') || msg.includes('not found')) return 'Delegation not found';
    if (msg.includes('DelegationLocked') || msg.includes('still locked')) return 'Delegation is still locked';
    if (msg.includes('InvalidIndex') || msg.includes('invalid index')) return 'Invalid delegation index';
    if (msg.includes('NotOwner') || msg.includes('not owner')) return 'Not the delegation owner';
    if (msg.includes('require(false)')) return 'Transaction rejected by contract';
    if (msg.includes('Internal JSON-RPC')) return 'Network busy, please wait...';
    
    return msg.slice(0, 100);
}

function isRetryableError(error) {
    const msg = (error?.message || error?.reason || '').toLowerCase();
    return msg.includes('internal json-rpc') || 
           msg.includes('network') || 
           msg.includes('timeout') ||
           msg.includes('nonce') ||
           msg.includes('already known') ||
           msg.includes('replacement') ||
           msg.includes('could not coalesce');
}

function isUserRejection(error) {
    const msg = (error?.message || error?.reason || '').toLowerCase();
    return msg.includes('user rejected') || 
           msg.includes('user denied') || 
           msg.includes('cancelled') ||
           msg.includes('canceled');
}

// ====================================================================
// CORE: EXECUTE WITH RETRY
// ====================================================================

async function executeWithRetry(fn, description = 'Transaction') {
    let lastError;
    
    for (let attempt = 1; attempt <= TX_CONFIG.MAX_RETRIES; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`${description} attempt ${attempt}/${TX_CONFIG.MAX_RETRIES}...`);
            }
            return await fn();
        } catch (error) {
            lastError = error;
            console.error(`${description} attempt ${attempt} failed:`, error.message?.slice(0, 80));
            
            if (isUserRejection(error)) {
                throw error;
            }
            
            if (attempt < TX_CONFIG.MAX_RETRIES && isRetryableError(error)) {
                showToast(`Retrying... (${attempt}/${TX_CONFIG.MAX_RETRIES})`, "warning");
                await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                continue;
            }
            
            throw error;
        }
    }
    
    throw lastError;
}

// ====================================================================
// SIMPLE APPROVAL WITH RETRY
// ====================================================================

async function simpleApprove(tokenAddress, spenderAddress, amount, signer) {
    const tokenABI = [
        "function approve(address,uint256) returns (bool)", 
        "function allowance(address,address) view returns (uint256)"
    ];
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    let currentAllowance = 0n;
    try {
        currentAllowance = await token.allowance(State.userAddress, spenderAddress);
        console.log("Current allowance:", ethers.formatEther(currentAllowance), "BKC");
    } catch (e) {
        console.warn("Could not check allowance");
    }
    
    if (currentAllowance >= amount) {
        console.log("✅ Already approved");
        return true;
    }
    
    const approveAmount = amount * 10n;
    
    return executeWithRetry(async () => {
        showToast("Approve tokens...", "info");
        const tx = await token.approve(spenderAddress, approveAmount, { gasLimit: 100000n });
        await tx.wait();
        await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        showToast("✅ Approved!", "success");
        return true;
    }, 'Approval');
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
        
        const approved = await simpleApprove(addresses.bkcToken, addresses.delegationManager, totalAmountBigInt, signer);
        if (!approved) return false;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Delegating...';
        
        const contract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signer);
        
        return await executeWithRetry(async () => {
            showToast("Confirm delegation...", "info");
            
            let gasLimit;
            try {
                const gasEstimate = await contract.delegate.estimateGas(totalAmountBigInt, durationBigInt, boosterIdBigInt);
                gasLimit = (gasEstimate * BigInt(TX_CONFIG.GAS_BUFFER_PERCENT)) / 100n;
                console.log("Delegation gas estimated:", gasEstimate.toString(), "→ Using:", gasLimit.toString());
            } catch {
                gasLimit = 400000n;
            }
            
            const tx = await contract.delegate(totalAmountBigInt, durationBigInt, boosterIdBigInt, { gasLimit });
            const receipt = await tx.wait();
            
            if (receipt.status === 0) throw new Error("Transaction reverted");
            
            showToast("✅ Delegation successful!", "success");
            loadUserData();
            return true;
        }, 'Delegation');
        
    } catch (e) {
        console.error("Delegation error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// UNSTAKE (Normal - quando unlocked)
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
        
        console.log("Unstake params:", { index: indexBigInt.toString(), boosterId: boosterIdBigInt.toString() });
        
        const contract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signer);
        
        return await executeWithRetry(async () => {
            showToast("Confirm unstake...", "info");
            const tx = await contract.unstake(indexBigInt, boosterIdBigInt, { gasLimit: 300000n });
            const receipt = await tx.wait();
            
            if (receipt.status === 0) throw new Error("Transaction reverted");
            
            showToast("✅ Unstaked!", "success");
            await loadUserData(true);
            await loadUserDelegations(true);
            return true;
        }, 'Unstake');
        
    } catch (e) {
        console.error("Unstake error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// FORCE UNSTAKE (50% penalty)
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
        
        let boosterIdBigInt = 0n;
        try {
            const boosterNum = Number(boosterIdToSend || 0);
            if (boosterNum > 0 && State.myBoosters && State.myBoosters.length > 0) {
                const ownsBooster = State.myBoosters.some(b => Number(b.tokenId) === boosterNum);
                if (ownsBooster) boosterIdBigInt = BigInt(boosterNum);
            }
        } catch {}
        
        console.log("Force unstake params:", { index: indexBigInt.toString(), boosterId: boosterIdBigInt.toString() });
        
        const contract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signer);
        
        // Verify delegation exists
        try {
            const delegations = await contract.getDelegationsOf(State.userAddress);
            if (indexNum >= delegations.length) {
                showToast(`Delegation ${indexNum} not found`, "error");
                return false;
            }
        } catch {}
        
        return await executeWithRetry(async () => {
            showToast("Confirm force unstake...", "info");
            const tx = await contract.forceUnstake(indexBigInt, boosterIdBigInt, { gasLimit: 350000n });
            const receipt = await tx.wait();
            
            if (receipt.status === 0) throw new Error("Transaction reverted");
            
            showToast("⚠️ Force unstaked (50% penalty)", "warning");
            await loadUserData(true);
            await loadUserDelegations(true);
            return true;
        }, 'Force Unstake');
        
    } catch (e) {
        console.error("Force unstake error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
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
        let boosterIdBigInt = 0n;
        try {
            const boosterNum = Number(boosterIdToSend || 0);
            if (boosterNum > 0 && State.myBoosters && State.myBoosters.length > 0) {
                const ownsBooster = State.myBoosters.some(b => Number(b.tokenId) === boosterNum);
                if (ownsBooster) boosterIdBigInt = BigInt(boosterNum);
            }
        } catch {}
        
        const contract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signer);
        
        return await executeWithRetry(async () => {
            showToast("Confirm claim...", "info");
            const tx = await contract.claimReward(boosterIdBigInt, { gasLimit: 250000n });
            const receipt = await tx.wait();
            
            if (receipt.status === 0) throw new Error("Transaction reverted");
            
            showToast("✅ Rewards claimed!", "success");
            await loadUserData(true);
            return true;
        }, 'Claim Rewards');
        
    } catch (e) {
        console.error("Claim error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// UNIVERSAL CLAIM (Alias with same signature as V11)
// ====================================================================

export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    return executeClaimRewards(boosterIdToSend, btnElement);
}

// ====================================================================
// BUY NFT FROM POOL
// ====================================================================

export async function executeBuyNFT(poolAddress, price, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };

    const originalText = btnElement?.innerHTML || 'Buy';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }

    try {
        const approved = await simpleApprove(addresses.bkcToken, poolAddress, BigInt(price) * 2n, signer);
        if (!approved) return { success: false };

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        const contract = new ethers.Contract(poolAddress, nftPoolABI, signer);

        const result = await executeWithRetry(async () => {
            showToast("Confirm purchase...", "info");
            const tx = await contract.buyNFT({ gasLimit: 400000n });
            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Transaction reverted");

            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed?.name === "NFTBought") {
                        tokenId = parsed.args.tokenId?.toString();
                        break;
                    }
                } catch {}
            }

            showToast(`✅ NFT purchased! ${tokenId ? `#${tokenId}` : ''}`, "success");
            loadUserData();
            return { success: true, tokenId, txHash: receipt.hash };
        }, 'Buy NFT');

        return result;

    } catch (e) {
        console.error("Buy error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// SELL NFT TO POOL
// ====================================================================

export async function executeSellNFT(poolAddress, tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };

    const originalText = btnElement?.innerHTML || 'Sell';
    if (btnElement) {
        btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
        btnElement.disabled = true;
    }

    try {
        if (!tokenId && tokenId !== 0n) {
            showToast("No NFT selected", "error");
            return { success: false };
        }
        
        const tokenIdBigInt = BigInt(tokenId);
        
        const boosterContract = new ethers.Contract(
            addresses.rewardBoosterNFT,
            ["function approve(address,uint256)", "function getApproved(uint256) view returns (address)", "function ownerOf(uint256) view returns (address)", "function boostBips(uint256) view returns (uint256)"],
            signer
        );

        // Verify ownership
        try {
            const owner = await boosterContract.ownerOf(tokenIdBigInt);
            if (owner.toLowerCase() !== State.userAddress.toLowerCase()) {
                showToast("You don't own this NFT", "error");
                return { success: false };
            }
        } catch {
            showToast("Error verifying ownership", "error");
            return { success: false };
        }

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);

        // Check pool tier match
        try {
            const nftBoostBips = await boosterContract.boostBips(tokenIdBigInt);
            const poolBoostBips = await poolContract.boostBips();
            if (nftBoostBips.toString() !== poolBoostBips.toString()) {
                showToast("NFT tier doesn't match pool", "error");
                return { success: false };
            }
        } catch {}

        // Check pool liquidity
        try {
            const poolInfo = await poolContract.getPoolInfo();
            const tokenBalance = poolInfo[0];
            const sellPrice = await poolContract.getSellPrice();
            if (tokenBalance < sellPrice) {
                showToast("Pool has insufficient liquidity", "error");
                return { success: false };
            }
        } catch {}

        // Approve NFT
        const approved = await boosterContract.getApproved(tokenIdBigInt);
        if (approved.toLowerCase() !== poolAddress.toLowerCase()) {
            showToast("Approving NFT...", "info");
            const approveTx = await boosterContract.approve(poolAddress, tokenIdBigInt, { gasLimit: 100000n });
            await approveTx.wait();
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        const result = await executeWithRetry(async () => {
            showToast("Confirm sale...", "info");
            
            const sellPriceAfterTax = await poolContract.getSellPriceAfterTax();
            const minPayout = (sellPriceAfterTax * 95n) / 100n;
            
            const tx = await poolContract.sellNFT(tokenIdBigInt, minPayout, { gasLimit: 400000n });
            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Transaction reverted");

            showToast(`✅ NFT #${tokenIdBigInt} sold!`, "success");
            loadUserData(true);
            return { success: true, txHash: receipt.hash };
        }, 'Sell NFT');

        return result;

    } catch (e) {
        console.error("Sell error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
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
        const { tokenId, pricePerHour, minHours, maxHours } = params;

        const nftContract = new ethers.Contract(
            addresses.rewardBoosterNFT,
            ["function setApprovalForAll(address,bool)", "function isApprovedForAll(address,address) view returns (bool)"],
            signer
        );

        const isApproved = await nftContract.isApprovedForAll(State.userAddress, addresses.rentalManager);
        if (!isApproved) {
            showToast("Approving NFTs...", "info");
            const approveTx = await nftContract.setApprovalForAll(addresses.rentalManager, true, { gasLimit: 100000n });
            await approveTx.wait();
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';

        const contract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);

        const result = await executeWithRetry(async () => {
            showToast("Confirm listing...", "info");
            const tx = await contract.listNFT(BigInt(tokenId), BigInt(pricePerHour), BigInt(minHours), BigInt(maxHours), { gasLimit: 300000n });
            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Transaction reverted");

            showToast(`✅ NFT #${tokenId} listed!`, "success");
            loadRentalListings(true);
            return { success: true, txHash: receipt.hash };
        }, 'List NFT');

        return result;

    } catch (e) {
        console.error("List error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
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
        const { tokenId, hours, totalCost } = params;
        
        const approved = await simpleApprove(addresses.bkcToken, addresses.rentalManager, BigInt(totalCost), signer);
        if (!approved) return { success: false };

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';

        const contract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);

        const result = await executeWithRetry(async () => {
            showToast("Confirm rental...", "info");
            const tx = await contract.rentNFT(BigInt(tokenId), BigInt(hours), { gasLimit: 350000n });
            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Transaction reverted");

            showToast(`✅ NFT rented for ${hours}h!`, "success");
            loadRentalListings(true);
            loadUserData();
            return { success: true, txHash: receipt.hash };
        }, 'Rent NFT');

        return result;

    } catch (e) {
        console.error("Rent error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
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
        const boosterContract = new ethers.Contract(
            addresses.rewardBoosterNFT,
            ["function ownerOf(uint256) view returns (address)"],
            signer
        );
        
        try {
            const owner = await boosterContract.ownerOf(BigInt(tokenId));
            if (owner.toLowerCase() !== addresses.rentalManager?.toLowerCase()) {
                if (owner.toLowerCase() === State.userAddress?.toLowerCase()) {
                    showToast("NFT not listed for rental", "warning");
                } else {
                    showToast("NFT transferred", "error");
                }
                return { success: false };
            }
        } catch {
            showToast("NFT not found", "error");
            return { success: false };
        }

        const contract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);

        const result = await executeWithRetry(async () => {
            showToast("Confirm withdrawal...", "info");
            const tx = await contract.withdrawNFT(BigInt(tokenId), { gasLimit: 250000n });
            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Transaction reverted");

            showToast(`✅ NFT #${tokenId} withdrawn!`, "success");
            loadRentalListings(true);
            loadUserData();
            return { success: true, txHash: receipt.hash };
        }, 'Withdraw NFT');

        return result;

    } catch (e) {
        console.error("Withdraw error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

// ====================================================================
// FORTUNE POOL - PARTICIPATE
// ====================================================================

export async function executeFortuneGame(wager, guesses, isCumulative, btnElement) {
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
        
        console.log("Fortune Game params:", { wager, wagerWei: wagerBigInt.toString(), guesses: guessesArray.map(g => g.toString()), isCumulative });
        
        const fortuneAddress = addresses.fortunePool || addresses.actionsManager;
        if (!fortuneAddress) {
            showToast("Fortune Pool not configured", "error");
            return { success: false };
        }
        
        const contract = new ethers.Contract(fortuneAddress, actionsManagerABI, signer);
        
        // Verify tiers
        const tierCount = await contract.activeTierCount();
        console.log("Active tier count:", tierCount.toString());
        
        if (tierCount === 0n) {
            showToast("No active game tiers", "error");
            return { success: false };
        }
        
        const expectedGuessCount = isCumulative ? Number(tierCount) : 1;
        if (guessesArray.length !== expectedGuessCount) {
            showToast(`Need ${expectedGuessCount} guess(es)`, "error");
            return { success: false };
        }
        
        // Check BKC balance
        const bkcBalance = await State.bkcTokenContract.balanceOf(State.userAddress);
        if (bkcBalance < wagerBigInt) {
            showToast("Insufficient BKC balance", "error");
            return { success: false };
        }
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, fortuneAddress, wagerBigInt, signer);
        if (!approved) return { success: false };
        
        // Get oracle fee
        let oracleFee = 0n;
        try {
            oracleFee = await contract.getRequiredOracleFee(isCumulative);
            console.log("Oracle fee:", ethers.formatEther(oracleFee), "ETH");
        } catch {
            try {
                const baseFee = await contract.oracleFee();
                oracleFee = isCumulative ? baseFee * 5n : baseFee;
            } catch {
                oracleFee = 0n;
            }
        }
        
        // Check ETH balance
        const provider = signer.provider;
        const ethBalance = await provider.getBalance(State.userAddress);
        console.log("ETH balance:", ethers.formatEther(ethBalance), "ETH");
        
        if (oracleFee > 0n && ethBalance < oracleFee) {
            showToast(`Need ${ethers.formatEther(oracleFee)} ETH`, "error");
            return { success: false };
        }
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Playing...';
        
        // Estimate gas first
        let gasLimit;
        try {
            const gasEstimate = await contract.participate.estimateGas(wagerBigInt, guessesArray, isCumulative, { value: oracleFee });
            gasLimit = (gasEstimate * BigInt(TX_CONFIG.GAS_BUFFER_PERCENT)) / 100n;
            console.log("Gas estimated successfully:", gasEstimate.toString(), "→ Using:", gasLimit.toString());
        } catch {
            gasLimit = 500000n;
            console.log("Gas estimation failed, using default:", gasLimit.toString());
        }
        
        console.log("Calling participate with:", { wagerAmount: wagerBigInt.toString(), guesses: guessesArray.map(g => g.toString()), isCumulative, value: oracleFee.toString(), gasLimit: gasLimit.toString() });
        
        const result = await executeWithRetry(async () => {
            showToast("Confirm game...", "info");
            const tx = await contract.participate(wagerBigInt, guessesArray, isCumulative, { value: oracleFee, gasLimit });
            const receipt = await tx.wait();
            
            if (receipt.status === 0) throw new Error("Transaction reverted");
            
            let gameId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed?.name === "GameRequested") {
                        gameId = parsed.args.gameId?.toString();
                        break;
                    }
                } catch {}
            }
            
            showToast("🎰 Game submitted! Waiting for result...", "success");
            loadUserData();
            return { success: true, gameId, txHash: receipt.hash };
        }, 'Fortune Game');
        
        return result;
        
    } catch (e) {
        console.error("Fortune error:", e);
        
        const errorMsg = e?.message || '';
        if (errorMsg.includes('ZeroAmount')) {
            showToast("Wager cannot be zero", "error");
        } else if (errorMsg.includes('NoActiveTiers')) {
            showToast("No active tiers", "error");
        } else if (errorMsg.includes('InvalidGuessCount')) {
            showToast("Wrong number of guesses", "error");
        } else if (errorMsg.includes('InvalidGuessRange')) {
            showToast("Guess out of range", "error");
        } else if (!isUserRejection(e)) {
            showToast(formatError(e), "error");
        }
        return { success: false };
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

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
            showToast("Notary not configured", "error");
            return false;
        }
        
        // Get fee
        let feeToPay = ethers.parseEther("1");
        try {
            const notaryRead = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer.provider);
            feeToPay = await notaryRead.calculateFee(0);
        } catch {}
        
        const approved = await simpleApprove(addresses.bkcToken, notaryAddress, feeToPay, signer);
        if (!approved) return false;
        
        if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Notarizing...';
        
        let boosterTokenId = 0n;
        try {
            const boosterInfo = await getHighestBoosterBoostFromAPI();
            if (boosterInfo?.tokenId) boosterTokenId = BigInt(boosterInfo.tokenId);
        } catch {}
        
        const contract = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer);
        
        // Estimate gas
        let gasLimit;
        try {
            const gasEstimate = await contract.notarize.estimateGas(ipfsUri, description || '', contentHash, boosterTokenId);
            gasLimit = (gasEstimate * BigInt(TX_CONFIG.GAS_BUFFER_PERCENT)) / 100n;
            console.log("Notarize gas estimated:", gasEstimate.toString(), "→ Using:", gasLimit.toString());
        } catch {
            gasLimit = 500000n;
        }
        
        const result = await executeWithRetry(async () => {
            showToast("Confirm notarization...", "info");
            const tx = await contract.notarize(ipfsUri, description || '', contentHash, boosterTokenId, { gasLimit });
            const receipt = await tx.wait();
            
            if (receipt.status === 0) throw new Error("Transaction reverted");
            
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed?.name === "DocumentNotarized") {
                        tokenId = parsed.args.tokenId?.toString();
                        break;
                    }
                } catch {}
            }
            
            showToast(`✅ Notarized! ${tokenId ? `#${tokenId}` : ''}`, "success");
            return { success: true, tokenId, txHash: receipt.hash };
        }, 'Notarize');
        
        return result;
        
    } catch (e) {
        console.error("Notarize error:", e);
        if (!isUserRejection(e)) showToast(formatError(e), "error");
        return false;
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }
}

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
            return { success: true, txHash: data.txHash, bkcAmount: data.bkcAmount, ethAmount: data.ethAmount };
        } else {
            showToast(data.error || "Faucet unavailable", "error");
            return { success: false, error: data.error };
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
// ALIASES for backward compatibility
// ====================================================================

export const executeBuyBooster = executeBuyNFT;
export const executeSellBooster = executeSellNFT;
export const executeFortuneParticipate = executeFortuneGame;