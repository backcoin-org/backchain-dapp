// js/modules/transactions.js
// ✅ PRODUCTION V10.0

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI, decentralizedNotaryABI, actionsManagerABI, delegationManagerABI } from '../config.js'; 
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
        // Prioriza Web3Modal provider, depois State.provider, depois window.ethereum
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
    if (msg.includes('user rejected')) return 'Transaction cancelled';
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('exceeds balance')) return 'Insufficient token balance';
    if (msg.includes('0xfb550858') || msg.includes('InsufficientOracleFee')) return 'Insufficient oracle fee (ETH)';
    if (msg.includes('0xbcfa8e99') || msg.includes('InvalidGuessCount')) return 'Wrong number of guesses';
    if (msg.includes('0x5c844fb4') || msg.includes('InvalidGuessRange')) return 'Guess out of range';
    return msg.slice(0, 100);
}

// ====================================================================
// SIMPLE APPROVAL
// ====================================================================

async function simpleApprove(tokenAddress, spenderAddress, amount, signer) {
    const tokenABI = ["function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)"];
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    const currentAllowance = await token.allowance(State.userAddress, spenderAddress);
    
    if (currentAllowance >= amount) {
        return true;
    }
    
    const approveAmount = amount * 10n;
    
    showToast("Approve in wallet...", "info");
    const tx = await token.approve(spenderAddress, approveAmount);
    
    showToast("Waiting confirmation...", "info");
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
        throw new Error("Approval reverted");
    }
    
    showToast("Approved!", "success");
    return true;
}

// ====================================================================
// DELEGATION
// ====================================================================

export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Delegate';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const totalAmountBigInt = BigInt(totalAmount);
        const durationBigInt = BigInt(durationSeconds);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        
        if (balance < totalAmountBigInt) {
            showToast("Insufficient BKC balance", "error");
            return false;
        }
        
        const approved = await simpleApprove(
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
        
        showToast("Confirm delegation in wallet...", "info");
        const tx = await delegationContract.delegate(totalAmountBigInt, durationBigInt, boosterIdBigInt);
        
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
// UNDELEGATE (era unstake)
// ====================================================================

export async function executeUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Unstake';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const indexBigInt = BigInt(index);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        showToast("Confirm unstake in wallet...", "info");
        // Função correta: undelegate (não unstake)
        const tx = await delegationContract.undelegate(indexBigInt, boosterIdBigInt);
        
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
// FORCE UNDELEGATE (era forceUnstake)
// ====================================================================

export async function executeForceUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Force Unstake';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const indexBigInt = BigInt(index);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        showToast("Confirm force unstake in wallet...", "info");
        // Função correta: forceUndelegate (não forceUnstake)
        const tx = await delegationContract.forceUndelegate(indexBigInt, boosterIdBigInt);
        
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
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        showToast("Confirm claim in wallet...", "info");
        const tx = await delegationContract.claimReward(boosterIdBigInt);
        
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
// BUY NFT FROM POOL
// ====================================================================

export async function executeBuyNFT(poolAddress, price, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Buy';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const priceBigInt = BigInt(price);
        const priceWithBuffer = (priceBigInt * 120n) / 100n;
        
        const approved = await simpleApprove(addresses.bkcToken, poolAddress, priceWithBuffer, signer);
        if (!approved) return false;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        showToast("Confirm purchase in wallet...", "info");
        const tx = await poolContract.buyNFTWithSlippage(priceWithBuffer);
        
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
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Sell';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        
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
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        showToast("Confirm sale in wallet...", "info");
        // sellNFT com 1 parâmetro (conforme ABI corrigida)
        const tx = await poolContract.sellNFT(tokenIdBigInt);
        
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
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    if (!addresses.rentalManager) {
        showToast("Rental marketplace not available", "error");
        return false;
    }
    
    const originalText = btnElement?.innerHTML || 'List';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const tokenIdBigInt = BigInt(tokenId);
        // pricePerHour já vem como BigInt do RentalPage
        const priceBigInt = typeof pricePerHour === 'bigint' ? pricePerHour : BigInt(pricePerHour);
        
        const nftAddress = addresses.rewardBoosterNFT || addresses.boosterNFT;
        if (!nftAddress) {
            throw new Error("NFT contract address not configured");
        }
        
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
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm listing in wallet...", "info");
        // Usar listNFT com parâmetros padrão (minHours=1, maxHours=168)
        const tx = await rentalContract.listNFT(tokenIdBigInt, priceBigInt, 1n, 168n);
        
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
        const costWithBuffer = (costBigInt * 120n) / 100n;
        
        const approved = await simpleApprove(addresses.bkcToken, addresses.rentalManager, costWithBuffer, signer);
        if (!approved) return false;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm rental in wallet...", "info");
        // rentNFT com 1 hora por padrão
        const tx = await rentalContract.rentNFT(tokenIdBigInt, 1n);
        
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
// RENT NFT WITH HOURS
// ====================================================================

export async function executeRentNFTWithHours(tokenId, totalCost, hours, btnElement) {
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
        
        const approved = await simpleApprove(addresses.bkcToken, addresses.rentalManager, costWithBuffer, signer);
        if (!approved) return false;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';
        
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);
        
        showToast("Confirm rental in wallet...", "info");
        const tx = await rentalContract.rentNFT(tokenIdBigInt, hoursBigInt);
        
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
// FORTUNE GAME
// ====================================================================

export async function executeFortuneParticipate(wager, guesses, isCumulative, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Play';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const wagerBigInt = ethers.parseEther(wager.toString());
        const guessesArray = Array.isArray(guesses) ? guesses.map(g => BigInt(g)) : [BigInt(guesses)];
        
        const fortuneAddress = addresses.fortunePool || addresses.actionsManager;
        if (!fortuneAddress) {
            throw new Error("Fortune Pool not configured");
        }
        
        const approved = await simpleApprove(
            addresses.bkcToken, 
            fortuneAddress, 
            wagerBigInt, 
            signer
        );
        if (!approved) return false;
        
        const fortuneContract = new ethers.Contract(fortuneAddress, actionsManagerABI, signer);
        
        let oracleFee;
        try {
            oracleFee = await fortuneContract.getRequiredOracleFee(isCumulative);
        } catch (e) {
            const baseFee = await fortuneContract.oracleFee();
            oracleFee = isCumulative ? baseFee * 5n : baseFee;
        }
        
        // Prioriza Web3Modal provider
        let rawProvider = State.web3Provider || State.provider || window.ethereum;
        const provider = new ethers.BrowserProvider(rawProvider);
        const ethBalance = await provider.getBalance(State.userAddress);
        
        if (ethBalance < oracleFee) {
            showToast(`Insufficient ETH for oracle fee (need ${ethers.formatEther(oracleFee)} ETH)`, "error");
            return { success: false };
        }
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Submitting...';
        
        showToast("Confirm game in wallet...", "info");
        
        const tx = await fortuneContract.participate(wagerBigInt, guessesArray, isCumulative, { value: oracleFee });
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
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

export async function executeNotarize(params, submitButton) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = submitButton?.innerHTML || 'Notarize';
    if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const { ipfsUri, contentHash, description } = params;
        
        const notaryAddress = addresses.decentralizedNotary || addresses.notary;
        
        if (!notaryAddress) {
            throw new Error("Notary contract address not configured");
        }
        
        let feeToPay = ethers.parseEther("1");
        try {
            const notaryRead = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer.provider);
            feeToPay = await notaryRead.calculateFee(0);
        } catch (e) {}
        
        const approved = await simpleApprove(addresses.bkcToken, notaryAddress, feeToPay, signer);
        if (!approved) return false;
        
        if (submitButton) submitButton.innerHTML = '<div class="loader inline-block"></div> Notarizing...';
        
        const notaryContract = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer);
        
        let boosterTokenId = 0n;
        try {
            const boosterInfo = await getHighestBoosterBoostFromAPI();
            if (boosterInfo?.tokenId) {
                boosterTokenId = BigInt(boosterInfo.tokenId);
            }
        } catch (e) {}
        
        showToast("Confirm notarization in wallet...", "info");
        
        // notarize(string _ipfsCid, string _description, bytes32 _contentHash, uint256 _boosterTokenId)
        const tx = await notaryContract.notarize(
            ipfsUri,
            description || '',
            contentHash,
            boosterTokenId
        );
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
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

// Alias para compatibilidade
export const executeNotarizeDocument = executeNotarize;

// ====================================================================
// FAUCET - Via API (não via contrato)
// ====================================================================

const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";

export async function executeFaucetClaim(btnElement) {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return { success: false };
    }
    
    const originalText = btnElement?.innerHTML || 'Claim';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
    
    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast("Tokens received!", "success");
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
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// ALIASES para compatibilidade com StorePage.js
// ====================================================================

export const executeBuyBooster = executeBuyNFT;
export const executeSellBooster = executeSellNFT;