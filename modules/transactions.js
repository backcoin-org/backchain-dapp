// js/modules/transactions.js
// ✅ VERSÃO V8.0 SIMPLIFICADA - Código limpo sem complexidade desnecessária

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI } from '../config.js'; 
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
// BUY BOOSTER
// ====================================================================

export async function executeBuyBooster(poolAddress, price, btnElement) {
    console.log("🛒 executeBuyBooster:", { poolAddress, price });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Buy';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const priceBigInt = BigInt(price);
        const priceWithBuffer = (priceBigInt * 120n) / 100n; // 20% buffer
        
        console.log(`💰 Price: ${ethers.formatEther(priceBigInt)} BKC`);
        console.log(`💰 With buffer: ${ethers.formatEther(priceWithBuffer)} BKC`);
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, poolAddress, priceWithBuffer, signer);
        if (!approved) return false;
        
        // Buy
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        showToast("Confirm purchase in wallet...", "info");
        const tx = await poolContract.buyNFT();
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
// SELL BOOSTER
// ====================================================================

export async function executeSellBooster(poolAddress, tokenId, btnElement) {
    console.log("💰 executeSellBooster:", { poolAddress, tokenId });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Sell';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        
        // Approve NFT
        const nftContract = new ethers.Contract(
            addresses.boosterNFT,
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
    
    const originalText = btnElement?.innerHTML || 'List';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        const priceBigInt = ethers.parseEther(pricePerHour.toString());
        
        // Approve NFT for rental manager
        const nftContract = new ethers.Contract(
            addresses.boosterNFT,
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
// RENT NFT
// ====================================================================

export async function executeRentNFT(tokenId, totalCost, btnElement) {
    console.log("🎮 executeRentNFT:", { tokenId, totalCost });
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
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
// FORTUNE GAME
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
        
        // Approve
        const approved = await simpleApprove(
            addresses.bkcToken, 
            await State.actionsManagerContract.getAddress(), 
            wagerBigInt, 
            signer
        );
        if (!approved) return false;
        
        // Get oracle fee
        const oracleFee = await State.actionsManagerContract.oracleFee();
        console.log("💎 Oracle fee:", ethers.formatEther(oracleFee), "ETH");
        
        // Participate
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Submitting...';
        
        const fortuneContract = new ethers.Contract(
            await State.actionsManagerContract.getAddress(),
            State.actionsManagerContract.interface,
            signer
        );
        
        showToast("Confirm game in wallet...", "info");
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
// NOTARIZE DOCUMENT
// ====================================================================

export async function executeNotarizeDocument(params, submitButton) {
    console.log("📄 executeNotarizeDocument:", params);
    
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = submitButton?.innerHTML || 'Notarize';
    if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const { ipfsUri, contentHash, title, description, docType, tags } = params;
        const tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (tags || []);
        
        const notaryAddress = addresses.notary;
        const feeToPay = ethers.parseEther("1"); // 1 BKC fee
        
        // Approve
        const approved = await simpleApprove(addresses.bkcToken, notaryAddress, feeToPay, signer);
        if (!approved) return false;
        
        // Notarize
        if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Notarizing...';
        
        const notaryContract = new ethers.Contract(
            notaryAddress,
            State.notaryContract.interface,
            signer
        );
        
        showToast("Confirm notarization in wallet...", "info");
        const tx = await notaryContract.notarize(ipfsUri, contentHash, title, description, docType, tagsArray);
        console.log(`📝 TX: ${tx.hash}`);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Document notarized!", "success");
        return true;
        
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

console.log("✅ Transactions module V8.0 loaded (simplified)");