// js/modules/transactions.js
// ✅ VERSÃO V9.0 - Fixed: Notary ABI, FortunePool oracle fee, rentalManager null check

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI, decentralizedNotaryABI, actionsManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js';

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

async function getConnectedSigner() {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return null;
    }
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log("✅ Signer ready:", await signer.getAddress());
        return signer;
    } catch (e) {
        console.error("Signer error:", e);
        showToast("Wallet connection error", "error");
        return null;
    }
}

function formatError(error) {
    const msg = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
    if (msg.includes('user rejected')) return 'Transaction cancelled';
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('exceeds balance')) return 'Insufficient token balance';
    // 🔧 V9.0: Better error messages for FortunePool
    if (msg.includes('0xfb550858') || msg.includes('InsufficientOracleFee')) return 'Insufficient oracle fee (ETH)';
    if (msg.includes('0xbcfa8e99') || msg.includes('InvalidGuessCount')) return 'Wrong number of guesses';
    if (msg.includes('0x5c844fb4') || msg.includes('InvalidGuessRange')) return 'Guess out of range';
    return msg.slice(0, 100);
}

// ====================================================================
// SIMPLE APPROVAL - No complexity, just approve
// ====================================================================

async function simpleApprove(tokenAddress, spenderAddress, amount, signer) {
    const tokenABI = ["function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)"];
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    // Check current allowance
    const currentAllowance = await token.allowance(State.userAddress, spenderAddress);
    console.log(`💰 Current allowance: ${safeFormatEther(currentAllowance)}`);
    
    if (currentAllowance >= amount) {
        console.log("✅ Already approved");
        return true;
    }
    
    // Simple approve with 10x the amount needed
    const approveAmount = amount * 10n;
    console.log(`📝 Approving ${safeFormatEther(approveAmount)} tokens...`);
    
    showToast("Approve in wallet...", "info");
    const tx = await token.approve(spenderAddress, approveAmount);
    console.log(`📝 TX: ${tx.hash}`);
    
    showToast("Waiting confirmation...", "info");
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
        throw new Error("Approval reverted");
    }
    
    console.log("✅ Approved!");
    showToast("Approved!", "success");
    return true;
}

// ====================================================================
// DELEGATION
// ====================================================================

export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    console.log("🔐 executeDelegation:", { totalAmount, durationSeconds, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Delegate';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const totalAmountBigInt = BigInt(totalAmount);
        const durationBigInt = BigInt(durationSeconds);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        // Check balance
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} BKC`);
        
        if (balance < totalAmountBigInt) {
            showToast("Insufficient BKC balance", "error");
            return false;
        }
        
        // Approve
        const approved = await simpleApprove(
            addresses.bkcToken,
            addresses.delegationManager,
            totalAmountBigInt,
            signer
        );
        if (!approved) return false;
        
        // Delegate
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Delegating...';
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            State.delegationManagerContract.interface,
            signer
        );
        
        showToast("Confirm delegation in wallet...", "info");
        const tx = await delegationContract.delegate(totalAmountBigInt, durationBigInt, boosterIdBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Delegation successful!", "success");
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Delegation error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// BUY NFT FROM POOL
// ====================================================================

export async function executeBuyNFT(poolAddress, price, btnElement) {
    console.log("🛒 executeBuyNFT:", { poolAddress, price });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Buy';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const priceBigInt = BigInt(price);
        const priceWithBuffer = (priceBigInt * 120n) / 100n;
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, poolAddress, priceWithBuffer, signer);
        if (!approved) return false;
        
        // Buy
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        showToast("Confirm purchase in wallet...", "info");
        const tx = await poolContract.buyNFTWithSlippage(priceWithBuffer);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("NFT purchased!", "success");
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Buy error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// SELL NFT TO POOL
// ====================================================================

export async function executeSellNFT(poolAddress, tokenId, btnElement) {
    console.log("💰 executeSellNFT:", { poolAddress, tokenId });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Sell';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        
        // Approve NFT
        const nftContract = new ethers.Contract(
            addresses.rewardBoosterNFT || addresses.boosterNFT,
            ["function approve(address,uint256)", "function getApproved(uint256) view returns (address)"],
            signer
        );
        
        const approved = await nftContract.getApproved(tokenIdBigInt);
        if (approved.toLowerCase() !== poolAddress.toLowerCase()) {
            showToast("Approving NFT...", "info");
            const approveTx = await nftContract.approve(poolAddress, tokenIdBigInt);
            await approveTx.wait();
        }
        
        // Sell
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        showToast("Confirm sale in wallet...", "info");
        const tx = await poolContract.sellNFT(tokenIdBigInt, 0n);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("NFT sold!", "success");
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Sell error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// LIST NFT FOR RENTAL
// ====================================================================

export async function executeListNFT(tokenId, pricePerHour, btnElement) {
    console.log("🏷️ executeListNFT:", { tokenId, pricePerHour });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    // 🔧 V9.0 FIX: Check if rentalManager is configured
    if (!addresses.rentalManager) {
        showToast("Rental marketplace not available", "error");
        console.error("❌ addresses.rentalManager is null/undefined");
        return false;
    }
    
    const originalText = btnElement?.innerHTML || 'List';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        const priceBigInt = ethers.parseEther(pricePerHour.toString());
        
        // 🔧 V9.0 FIX: Use correct NFT address
        const nftAddress = addresses.rewardBoosterNFT || addresses.boosterNFT;
        if (!nftAddress) {
            throw new Error("NFT contract address not configured");
        }
        
        // Approve NFT for rental manager
        const nftContract = new ethers.Contract(
            nftAddress,
            ["function approve(address,uint256)", "function getApproved(uint256) view returns (address)", "function setApprovalForAll(address,bool)", "function isApprovedForAll(address,address) view returns (bool)"],
            signer
        );
        
        const isApprovedForAll = await nftContract.isApprovedForAll(State.userAddress, addresses.rentalManager);
        if (!isApprovedForAll) {
            const approved = await nftContract.getApproved(tokenIdBigInt);
            if (approved.toLowerCase() !== addresses.rentalManager.toLowerCase()) {
                showToast("Approving NFT...", "info");
                const approveTx = await nftContract.approve(addresses.rentalManager, tokenIdBigInt);
                await approveTx.wait();
            }
        }
        
        // List
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm listing in wallet...", "info");
        const tx = await rentalContract.listNFTSimple(tokenIdBigInt, priceBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("NFT listed!", "success");
        loadUserData();
        if (typeof loadRentalListings === 'function') loadRentalListings(true);
        return true;
        
    } catch (e) {
        console.error("List error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// RENT NFT (Simple)
// ====================================================================

export async function executeRentNFT(tokenId, totalCost, btnElement) {
    console.log("🎮 executeRentNFT:", { tokenId, totalCost });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    // 🔧 V9.0 FIX: Check if rentalManager is configured
    if (!addresses.rentalManager) {
        showToast("Rental marketplace not available", "error");
        return false;
    }
    
    const originalText = btnElement?.innerHTML || 'Rent';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        const costBigInt = BigInt(totalCost);
        const costWithBuffer = (costBigInt * 120n) / 100n;
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, addresses.rentalManager, costWithBuffer, signer);
        if (!approved) return false;
        
        // Rent
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm rental in wallet...", "info");
        const tx = await rentalContract.rentNFTSimple(tokenIdBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("NFT rented!", "success");
        loadUserData();
        if (typeof loadRentalListings === 'function') loadRentalListings(true);
        return true;
        
    } catch (e) {
        console.error("Rent error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// WITHDRAW LISTED NFT
// ====================================================================

export async function executeWithdrawNFT(tokenId, btnElement) {
    console.log("📤 executeWithdrawNFT:", { tokenId });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    if (!addresses.rentalManager) {
        showToast("Rental marketplace not available", "error");
        return false;
    }
    
    const originalText = btnElement?.innerHTML || 'Withdraw';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm withdrawal in wallet...", "info");
        const tx = await rentalContract.withdrawNFT(tokenIdBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("NFT withdrawn!", "success");
        loadUserData();
        if (typeof loadRentalListings === 'function') loadRentalListings(true);
        return true;
        
    } catch (e) {
        console.error("Withdraw error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// UNSTAKE
// ====================================================================

export async function executeUnstake(index, boosterIdToSend, btnElement) {
    console.log("📤 executeUnstake:", { index, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Unstake';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const indexBigInt = BigInt(index);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            State.delegationManagerContract.interface,
            signer
        );
        
        showToast("Confirm unstake in wallet...", "info");
        const tx = await delegationContract.unstake(indexBigInt, boosterIdBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Unstaked!", "success");
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Unstake error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// FORCE UNSTAKE
// ====================================================================

export async function executeForceUnstake(index, boosterIdToSend, btnElement) {
    console.log("⚠️ executeForceUnstake:", { index, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Force Unstake';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const indexBigInt = BigInt(index);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            State.delegationManagerContract.interface,
            signer
        );
        
        showToast("Confirm force unstake in wallet...", "info");
        const tx = await delegationContract.forceUnstake(indexBigInt, boosterIdBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Force unstaked!", "success");
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Force unstake error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// CLAIM REWARDS
// ====================================================================

export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    console.log("💰 executeUniversalClaim:", { stakingRewards, minerRewards, boosterIdToSend });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            State.delegationManagerContract.interface,
            signer
        );
        
        showToast("Confirm claim in wallet...", "info");
        const tx = await delegationContract.claimReward(boosterIdBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Rewards claimed!", "success");
        loadUserData();
        return true;
        
    } catch (e) {
        console.error("Claim error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// FORTUNE GAME - 🔧 V9.0 FIX: Correct oracle fee handling
// ====================================================================

export async function executeFortuneParticipate(wager, guesses, isCumulative, btnElement) {
    console.log("🎰 executeFortuneParticipate:", { wager, guesses, isCumulative });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Play';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const wagerBigInt = ethers.parseEther(wager.toString());
        const guessesArray = Array.isArray(guesses) ? guesses.map(g => BigInt(g)) : [BigInt(guesses)];
        
        // Get Fortune contract address
        const fortuneAddress = addresses.fortunePool || addresses.actionsManager;
        if (!fortuneAddress) {
            throw new Error("Fortune Pool not configured");
        }
        
        // Approve BKC
        const approved = await simpleApprove(
            addresses.bkcToken, 
            fortuneAddress, 
            wagerBigInt, 
            signer
        );
        if (!approved) return false;
        
        // 🔧 V9.0 FIX: Get correct oracle fee using getRequiredOracleFee
        const fortuneContract = new ethers.Contract(fortuneAddress, actionsManagerABI, signer);
        
        let oracleFee;
        try {
            // Try getRequiredOracleFee first (more accurate)
            oracleFee = await fortuneContract.getRequiredOracleFee(isCumulative);
            console.log(`💎 Oracle fee (getRequiredOracleFee): ${ethers.formatEther(oracleFee)} ETH`);
        } catch (e) {
            // Fallback to oracleFee() * multiplier
            const baseFee = await fortuneContract.oracleFee();
            oracleFee = isCumulative ? baseFee * 5n : baseFee;
            console.log(`💎 Oracle fee (calculated): ${ethers.formatEther(oracleFee)} ETH`);
        }
        
        // Check ETH balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const ethBalance = await provider.getBalance(State.userAddress);
        if (ethBalance < oracleFee) {
            showToast(`Insufficient ETH for oracle fee (need ${ethers.formatEther(oracleFee)} ETH)`, "error");
            return { success: false };
        }
        
        // Participate
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Submitting...';
        
        showToast("Confirm game in wallet...", "info");
        console.log("📤 Sending participate tx:", { 
            wager: ethers.formatEther(wagerBigInt), 
            guesses: guessesArray.map(g => g.toString()), 
            isCumulative, 
            oracleFee: ethers.formatEther(oracleFee) 
        });
        
        const tx = await fortuneContract.participate(wagerBigInt, guessesArray, isCumulative, { value: oracleFee });
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        // Parse GameRequested event
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
        
        showToast("Game submitted! Waiting for result...", "success");
        loadUserData();
        
        return { success: true, gameId, txHash: receipt.hash };
        
    } catch (e) {
        console.error("Fortune error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// NOTARIZE DOCUMENT - 🔧 V9.0 FIX: Correct function signature
// ====================================================================

export async function executeNotarizeDocument(params, submitButton) {
    console.log("📄 executeNotarizeDocument:", params);
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = submitButton?.innerHTML || 'Notarize';
    if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        // 🔧 V9.0 FIX: Extract correct parameters
        // Contract expects: notarize(string _ipfsCid, string _description, bytes32 _contentHash, uint256 _boosterTokenId)
        const { ipfsUri, contentHash, description } = params;
        
        // Get notary address
        const notaryAddress = addresses.decentralizedNotary || addresses.notary;
        
        if (!notaryAddress) {
            throw new Error("Notary contract address not configured");
        }
        
        console.log("📍 Notary address:", notaryAddress);
        
        // 🔧 V9.0 FIX: Get fee from contract or use default
        let feeToPay = ethers.parseEther("1"); // Default 1 BKC
        try {
            const notaryRead = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer.provider);
            feeToPay = await notaryRead.calculateFee(0); // 0 = no booster
            console.log("💰 Fee from contract:", ethers.formatEther(feeToPay), "BKC");
        } catch (e) {
            console.log("⚠️ Using default fee: 1 BKC");
        }
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, notaryAddress, feeToPay, signer);
        if (!approved) return false;
        
        // Notarize
        if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Notarizing...';
        
        // 🔧 V9.0 FIX: Use correct ABI with 4 parameters
        const notaryContract = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer);
        
        // Get user's best booster for discount (optional)
        let boosterTokenId = 0n;
        try {
            const boosterInfo = await getHighestBoosterBoostFromAPI();
            if (boosterInfo?.tokenId) {
                boosterTokenId = BigInt(boosterInfo.tokenId);
                console.log("🎯 Using booster #" + boosterTokenId + " for discount");
            }
        } catch (e) {}
        
        showToast("Confirm notarization in wallet...", "info");
        
        // 🔧 V9.0 FIX: Call with correct 4 parameters in correct order
        // notarize(string _ipfsCid, string _description, bytes32 _contentHash, uint256 _boosterTokenId)
        console.log("📤 Calling notarize with:", {
            ipfsCid: ipfsUri,
            description: description || '',
            contentHash: contentHash,
            boosterTokenId: boosterTokenId.toString()
        });
        
        const tx = await notaryContract.notarize(
            ipfsUri,                    // _ipfsCid
            description || '',          // _description
            contentHash,                // _contentHash
            boosterTokenId              // _boosterTokenId
        );
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        // Get tokenId from event
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
        
        showToast(`Document notarized! ${tokenId ? `Token #${tokenId}` : ''}`, "success");
        return { success: true, tokenId, txHash: receipt.hash };
        
    } catch (e) {
        console.error("Notarize error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (submitButton) submitButton.innerHTML = originalText;
    }
}

// ====================================================================
// FAUCET (for testing)
// ====================================================================

export async function executeFaucetClaim(tokenType, btnElement) {
    console.log("🚰 executeFaucetClaim:", tokenType);
    
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
    
    try {
        if (tokenType === 'ETH') {
            const faucetContract = new ethers.Contract(
                addresses.faucet,
                ["function claimETH()"],
                signer
            );
            const tx = await faucetContract.claimETH();
            await tx.wait();
            showToast("ETH claimed!", "success");
        } else {
            const bkcContract = new ethers.Contract(
                addresses.bkcToken,
                ["function mint(address,uint256)"],
                signer
            );
            const tx = await bkcContract.mint(State.userAddress, ethers.parseEther("1000"));
            await tx.wait();
            showToast("BKC claimed!", "success");
        }
        
        loadUserData();
        return { success: true };
        
    } catch (e) {
        console.error("Faucet error:", e);
        showToast(formatError(e), "error");
        return { success: false };
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// EXTENDED RENTAL (with hours parameter)
// ====================================================================

export async function executeRentNFTWithHours(tokenId, totalCost, hours, btnElement) {
    console.log("🎮 executeRentNFTWithHours:", { tokenId, totalCost, hours });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    if (!addresses.rentalManager) {
        showToast("Rental marketplace not available", "error");
        return false;
    }
    
    const originalText = btnElement?.innerHTML || 'Rent';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        const costBigInt = BigInt(totalCost);
        const hoursBigInt = BigInt(hours || 1);
        const costWithBuffer = (costBigInt * 120n) / 100n;
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, addresses.rentalManager, costWithBuffer, signer);
        if (!approved) return false;
        
        // Rent
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm rental in wallet...", "info");
        const tx = await rentalContract.rentNFT(tokenIdBigInt, hoursBigInt);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("NFT rented!", "success");
        loadUserData();
        if (typeof loadRentalListings === 'function') loadRentalListings(true);
        return true;
        
    } catch (e) {
        console.error("Rent error:", e);
        showToast(formatError(e), "error");
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// ALIASES - For backward compatibility with StorePage.js
// ====================================================================

// StorePage.js imports executeBuyBooster/executeSellBooster
// These are aliases to executeBuyNFT/executeSellNFT
export const executeBuyBooster = executeBuyNFT;
export const executeSellBooster = executeSellNFT;

console.log("✅ Transactions module V9.0 loaded (with fixes)"); 