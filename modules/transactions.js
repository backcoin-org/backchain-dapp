// js/modules/transactions.js
// ✅ PRODUCTION V11.0 - Fixed Force Unstake + Better Error Handling

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI, decentralizedNotaryABI, actionsManagerABI, delegationManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings, loadUserDelegations } from './data.js';

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
    
    // Erros específicos do contrato
    if (msg.includes('user rejected')) return 'Transaction cancelled';
    if (msg.includes('insufficient funds')) return 'Insufficient ETH for gas';
    if (msg.includes('exceeds balance')) return 'Insufficient token balance';
    if (msg.includes('0xfb550858') || msg.includes('InsufficientOracleFee')) return 'Insufficient oracle fee (ETH)';
    if (msg.includes('0xbcfa8e99') || msg.includes('InvalidGuessCount')) return 'Wrong number of guesses';
    if (msg.includes('0x5c844fb4') || msg.includes('InvalidGuessRange')) return 'Guess out of range';
    
    // Erros de delegação
    if (msg.includes('DelegationNotFound') || msg.includes('not found')) return 'Delegation not found';
    if (msg.includes('DelegationLocked') || msg.includes('still locked')) return 'Delegation is still locked';
    if (msg.includes('InvalidIndex') || msg.includes('invalid index')) return 'Invalid delegation index';
    if (msg.includes('NotOwner') || msg.includes('not owner')) return 'Not the delegation owner';
    if (msg.includes('require(false)')) return 'Transaction rejected by contract';
    
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
// UNDELEGATE (Normal - quando unlocked)
// ====================================================================

export async function executeUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Unstake';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        // Garante que o índice é um número válido
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
        
        showToast("Confirm unstake in wallet...", "info");
        const tx = await delegationContract.unstake(indexBigInt, boosterIdBigInt);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Unstaked!", "success");
        
        // Recarrega dados
        await loadUserData(true);
        await loadUserDelegations(true);
        
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
// FORCE UNDELEGATE (Quando ainda locked - 50% penalty)
// ====================================================================

export async function executeForceUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Force Unstake';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        // Garante que o índice é um número válido
        const indexNum = Number(index);
        if (isNaN(indexNum) || indexNum < 0) {
            showToast("Invalid delegation index", "error");
            return false;
        }
        
        const indexBigInt = BigInt(indexNum);
        
        // CORREÇÃO: Se boosterId for muito grande ou inválido, usa 0
        let boosterIdBigInt = 0n;
        try {
            const boosterNum = Number(boosterIdToSend || 0);
            // Verifica se o booster realmente pertence ao usuário
            if (boosterNum > 0 && State.myBoosters && State.myBoosters.length > 0) {
                const ownsBooster = State.myBoosters.some(b => 
                    Number(b.tokenId) === boosterNum
                );
                if (ownsBooster) {
                    boosterIdBigInt = BigInt(boosterNum);
                } else {
                    console.warn("User doesn't own booster", boosterNum, "- using 0");
                }
            }
        } catch (e) {
            console.warn("Invalid booster ID, using 0:", e);
        }
        
        console.log("Force unstake params:", { 
            index: indexBigInt.toString(), 
            boosterId: boosterIdBigInt.toString(),
            userAddress: State.userAddress
        });
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        // Verifica se a delegação existe antes de tentar
        try {
            const delegations = await delegationContract.getDelegationsOf(State.userAddress);
            console.log("User delegations count:", delegations.length);
            
            if (indexNum >= delegations.length) {
                showToast(`Delegation index ${indexNum} not found. You have ${delegations.length} delegations.`, "error");
                return false;
            }
            
            const delegation = delegations[indexNum];
            console.log("Target delegation:", {
                amount: delegation.amount?.toString() || delegation[0]?.toString(),
                unlockTime: delegation.unlockTime?.toString() || delegation[1]?.toString(),
                lockDuration: delegation.lockDuration?.toString() || delegation[2]?.toString()
            });
        } catch (checkErr) {
            console.warn("Could not verify delegation:", checkErr);
        }
        
        showToast("Confirm force unstake in wallet...", "info");
        
        // Tenta a transação - NOTA: função no contrato é forceUnstake, não forceUndelegate
        const tx = await delegationContract.forceUnstake(indexBigInt, boosterIdBigInt);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Force unstaked! (50% penalty applied)", "warning");
        
        // Recarrega dados
        await loadUserData(true);
        await loadUserDelegations(true);
        
        return true;
        
    } catch (e) {
        console.error("Force unstake error:", e);
        
        // Melhor tratamento de erros específicos
        const errorMsg = e?.message || '';
        
        if (errorMsg.includes('execution reverted') || errorMsg.includes('require(false)')) {
            // Tenta dar mais contexto sobre o erro
            showToast("Force unstake failed. Check if delegation still exists.", "error");
        } else {
            showToast(formatError(e), "error");
        }
        
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
        // CORREÇÃO: Valida boosterId similar ao force unstake
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
        
        showToast("Confirm claim in wallet...", "info");
        const tx = await delegationContract.claimReward(boosterIdBigInt);
        
        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();
        
        if (receipt.status === 0) throw new Error("Transaction reverted");
        
        showToast("Rewards claimed!", "success");
        
        // Recarrega dados
        await loadUserData(true);
        
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
        const approved = await simpleApprove(
            addresses.bkcToken,
            poolAddress,
            BigInt(price) * 2n,
            signer
        );
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);

        showToast("Confirm buy in wallet...", "info");
        const tx = await poolContract.buyNFT();

        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 0) throw new Error("Transaction reverted");

        let boughtTokenId = null;
        for (const log of receipt.logs) {
            try {
                const parsed = poolContract.interface.parseLog(log);
                if (parsed?.name === "NFTBought") {
                    boughtTokenId = parsed.args.tokenId?.toString();
                    break;
                }
            } catch {}
        }

        showToast(`NFT Bought! ${boughtTokenId ? `#${boughtTokenId}` : ''}`, "success");
        loadUserData();
        return { success: true, tokenId: boughtTokenId };

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
        // Validar tokenId
        if (!tokenId && tokenId !== 0n) {
            showToast("No NFT selected to sell", "error");
            return false;
        }
        
        const tokenIdBigInt = BigInt(tokenId);
        
        console.log("Sell NFT params:", {
            poolAddress,
            tokenId: tokenIdBigInt.toString(),
            userAddress: State.userAddress
        });

        const boosterContract = new ethers.Contract(
            addresses.rewardBoosterNFT,
            [
                "function approve(address to, uint256 tokenId)", 
                "function getApproved(uint256 tokenId) view returns (address)",
                "function ownerOf(uint256 tokenId) view returns (address)",
                "function boostBips(uint256 tokenId) view returns (uint256)"
            ],
            signer
        );

        // Verificar se o usuário é dono do NFT
        try {
            const owner = await boosterContract.ownerOf(tokenIdBigInt);
            console.log("NFT owner:", owner);
            if (owner.toLowerCase() !== State.userAddress.toLowerCase()) {
                showToast("You don't own this NFT", "error");
                return false;
            }
        } catch (e) {
            console.error("Error checking NFT ownership:", e);
            showToast("Error verifying NFT ownership", "error");
            return false;
        }

        // Verificar boostBips do NFT vs pool
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        try {
            const nftBoostBips = await boosterContract.boostBips(tokenIdBigInt);
            const poolBoostBips = await poolContract.boostBips();
            console.log("NFT boostBips:", nftBoostBips.toString(), "Pool boostBips:", poolBoostBips.toString());
            
            if (nftBoostBips.toString() !== poolBoostBips.toString()) {
                showToast(`NFT tier mismatch! NFT: ${Number(nftBoostBips)/100}%, Pool: ${Number(poolBoostBips)/100}%`, "error");
                return false;
            }
        } catch (e) {
            console.warn("Could not verify boostBips match:", e.message);
        }

        // Verificar e fazer approve se necessário
        const approved = await boosterContract.getApproved(tokenIdBigInt);
        console.log("Currently approved:", approved);
        
        if (approved.toLowerCase() !== poolAddress.toLowerCase()) {
            showToast("Approve NFT transfer...", "info");
            const approveTx = await boosterContract.approve(poolAddress, tokenIdBigInt);
            await approveTx.wait();
            console.log("NFT approved for pool");
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        showToast("Confirm sell in wallet...", "info");
        const tx = await poolContract.sellNFT(tokenIdBigInt);

        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 0) throw new Error("Transaction reverted");

        showToast(`NFT #${tokenIdBigInt} Sold!`, "success");
        loadUserData(true);
        return true;

    } catch (e) {
        console.error("Sell error:", e);
        
        // Mensagens de erro mais específicas
        const errorMsg = e?.message || '';
        if (errorMsg.includes('require(false)') || errorMsg.includes('execution reverted')) {
            showToast("Pool rejected the sale. Check if NFT tier matches the pool.", "error");
        } else if (errorMsg.includes('user rejected')) {
            showToast("Transaction cancelled", "info");
        } else {
            showToast(formatError(e), "error");
        }
        return false;
    } finally {
        if (btnElement) btnElement.innerHTML = originalText;
    }
}

// ====================================================================
// RENTAL - LIST NFT
// ====================================================================

export async function executeListNFT(params, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'List';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const { tokenId, pricePerHour, minHours, maxHours } = params;

        const boosterContract = new ethers.Contract(
            addresses.rewardBoosterNFT,
            ["function approve(address to, uint256 tokenId)", "function getApproved(uint256 tokenId) view returns (address)", "function setApprovalForAll(address operator, bool approved)", "function isApprovedForAll(address owner, address operator) view returns (bool)"],
            signer
        );

        const isApprovedForAll = await boosterContract.isApprovedForAll(State.userAddress, addresses.rentalManager);
        
        if (!isApprovedForAll) {
            showToast("Approve NFT access...", "info");
            const approveTx = await boosterContract.setApprovalForAll(addresses.rentalManager, true);
            await approveTx.wait();
            showToast("Approved!", "success");
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Listing...';

        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);

        showToast("Confirm listing in wallet...", "info");
        const tx = await rentalContract.listNFT(
            BigInt(tokenId),
            BigInt(pricePerHour),
            BigInt(minHours),
            BigInt(maxHours)
        );

        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 0) throw new Error("Transaction reverted");

        showToast(`NFT #${tokenId} listed!`, "success");
        loadRentalListings(true);
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
// RENTAL - RENT NFT
// ====================================================================

export async function executeRentNFT(params, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Rent';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const { tokenId, hours, totalCost } = params;
        
        const approved = await simpleApprove(
            addresses.bkcToken,
            addresses.rentalManager,
            BigInt(totalCost),
            signer
        );
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Renting...';

        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);

        showToast("Confirm rental in wallet...", "info");
        const tx = await rentalContract.rentNFT(BigInt(tokenId), BigInt(hours));

        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 0) throw new Error("Transaction reverted");

        showToast(`NFT #${tokenId} rented for ${hours}h!`, "success");
        loadRentalListings(true);
        loadUserData();
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
// RENTAL - WITHDRAW NFT
// ====================================================================

export async function executeWithdrawNFT(tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Withdraw';
    if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Processing...';
    
    try {
        const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer);

        showToast("Confirm withdrawal in wallet...", "info");
        const tx = await rentalContract.withdrawNFT(BigInt(tokenId));

        showToast("Waiting confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 0) throw new Error("Transaction reverted");

        showToast(`NFT #${tokenId} withdrawn!`, "success");
        loadRentalListings(true);
        loadUserData();
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
// FORTUNE POOL - PARTICIPATE
// ====================================================================

export async function executeFortuneGame(wager, guesses, isCumulative, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
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
// ALIASES para compatibilidade
// ====================================================================

export const executeBuyBooster = executeBuyNFT;
export const executeSellBooster = executeSellNFT;
export const executeFortuneParticipate = executeFortuneGame;