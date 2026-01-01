// js/modules/transactions/faucet-tx.js
// ✅ Faucet Transaction Module V1.0
//
// Handles testnet faucet claims for BKC and ETH tokens

import { State } from '../../state.js';
import { showToast } from '../../ui-feedback.js';
import { loadUserData } from '../data.js';

// ============================================================================
// CONFIGURATION
// ============================================================================
const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";

// ============================================================================
// FAUCET CLAIM
// ============================================================================

/**
 * Claim tokens from the testnet faucet
 * @param {HTMLElement} btnElement - Button element to show loading state
 * @returns {Promise<{success: boolean, txHash?: string, bkcAmount?: string, ethAmount?: string, error?: string}>}
 */
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

// ============================================================================
// EXPORTS
// ============================================================================
export const FaucetTx = {
    claim: executeFaucetClaim
};

export default FaucetTx;