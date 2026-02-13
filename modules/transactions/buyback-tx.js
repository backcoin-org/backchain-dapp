// modules/js/transactions/buyback-tx.js
// ✅ V2.0 - BuybackMiner V2: Permissionless buyback + execution fee + 5% caller reward
//
// BuybackMiner converts accumulated ETH protocol fees into BKC:
//   1. Caller pays execution fee (anti-spam, ~$1, added to buyback)
//   2. Pull pending ETH from ecosystem
//   3. Caller gets 5% of TOTAL ETH (ecosystem + fee) as reward
//   4. Remaining 95% buys BKC from LiquidityPool
//   5. Scarcity curve mints additional BKC (decreases as supply → 200M cap)
//   6. 5% of total BKC burned, 95% → StakingPool as staker rewards
//
// The fee amplifies the buyback — more ETH → more BKC for stakers.
// ============================================================================

import { txEngine } from '../core/index.js';
import { addresses, contractAddresses, buybackMinerABI } from '../../config.js';

// ============================================================================
// 1. CONTRACT HELPERS
// ============================================================================

function getBuybackAddress() {
    return addresses?.buybackMiner || contractAddresses?.buybackMiner || window.contractAddresses?.buybackMiner || null;
}

async function getBuybackContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    const addr = getBuybackAddress();
    if (!addr) throw new Error('BuybackMiner contract address not loaded');
    return new window.ethers.Contract(addr, buybackMinerABI, NetworkManager.getProvider());
}

// ============================================================================
// 2. WRITE FUNCTIONS
// ============================================================================

/**
 * Execute a buyback — caller pays execution fee and earns 5% of total ETH
 * Fee is added to the buyback, amplifying BKC purchase for stakers.
 * @param {Object} params
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Callback on success (receives receipt)
 * @param {Function} [params.onError] - Callback on error
 */
export async function executeBuyback({ button, onSuccess, onError } = {}) {
    const addr = getBuybackAddress();
    if (!addr) throw new Error('BuybackMiner contract address not loaded');

    // Read execution fee from contract
    const fee = await getExecutionFee();

    return txEngine.execute({
        getContract: (signer) => new window.ethers.Contract(addr, buybackMinerABI, signer),
        method: 'executeBuyback',
        args: [],
        value: fee,
        button,
        txName: 'Execute Buyback',
        onSuccess: (receipt) => {
            console.log('[BuybackTx] Buyback executed:', receipt.hash);
            onSuccess?.(receipt);
        },
        onError: (error) => {
            console.error('[BuybackTx] Buyback failed:', error.message);
            onError?.(error);
        }
    });
}

/**
 * Execute buyback with slippage protection
 * @param {Object} params
 * @param {bigint} params.minTotalBkcOut - Minimum total BKC output
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Callback on success
 * @param {Function} [params.onError] - Callback on error
 */
export async function executeBuybackWithSlippage({ minTotalBkcOut, button, onSuccess, onError } = {}) {
    const addr = getBuybackAddress();
    if (!addr) throw new Error('BuybackMiner contract address not loaded');

    const fee = await getExecutionFee();

    return txEngine.execute({
        getContract: (signer) => new window.ethers.Contract(addr, buybackMinerABI, signer),
        method: 'executeBuybackWithSlippage',
        args: [minTotalBkcOut],
        value: fee,
        button,
        txName: 'Execute Buyback (Slippage)',
        onSuccess: (receipt) => {
            console.log('[BuybackTx] Buyback with slippage executed:', receipt.hash);
            onSuccess?.(receipt);
        },
        onError: (error) => {
            console.error('[BuybackTx] Buyback with slippage failed:', error.message);
            onError?.(error);
        }
    });
}

// ============================================================================
// 3. READ FUNCTIONS
// ============================================================================

/**
 * Get the execution fee required for buyback (anti-spam)
 * @returns {bigint} Fee in wei
 */
export async function getExecutionFee() {
    const contract = await getBuybackContractReadOnly();
    return contract.executionFee();
}

/**
 * Preview the next buyback — returns estimates for ETH, BKC, rewards
 * @returns {Object} { ethAvailable, estimatedBkcPurchased, estimatedBkcMined, estimatedBurn, estimatedToStakers, estimatedCallerReward, currentMiningRateBps, isReady }
 */
export async function getPreviewBuyback() {
    const contract = await getBuybackContractReadOnly();
    const result = await contract.previewBuyback();
    return {
        ethAvailable: result[0],
        estimatedBkcPurchased: result[1],
        estimatedBkcMined: result[2],
        estimatedBurn: result[3],
        estimatedToStakers: result[4],
        estimatedCallerReward: result[5],
        currentMiningRateBps: result[6],
        isReady: result[7]
    };
}

/**
 * Get pending ETH available for buyback
 * @returns {bigint} ETH amount in wei
 */
export async function getPendingETH() {
    const contract = await getBuybackContractReadOnly();
    return contract.pendingBuybackETH();
}

/**
 * Get current mining rate (scarcity curve)
 * @returns {bigint} Rate in bps (e.g., 8700 = 87%)
 */
export async function getMiningRate() {
    const contract = await getBuybackContractReadOnly();
    return contract.currentMiningRate();
}

/**
 * Get lifetime buyback statistics
 * @returns {Object} { totalBuybacks, totalEthSpent, totalBkcPurchased, totalBkcMined, totalBkcBurned, totalBkcToStakers, totalCallerRewards, avgEthPerBuyback, avgBkcPerBuyback }
 */
export async function getBuybackStats() {
    const contract = await getBuybackContractReadOnly();
    const result = await contract.getBuybackStats();
    return {
        totalBuybacks: result[0],
        totalEthSpent: result[1],
        totalBkcPurchased: result[2],
        totalBkcMined: result[3],
        totalBkcBurned: result[4],
        totalBkcToStakers: result[5],
        totalCallerRewards: result[6],
        avgEthPerBuyback: result[7],
        avgBkcPerBuyback: result[8]
    };
}

/**
 * Get last buyback info
 * @returns {Object} { timestamp, blockNumber, caller, ethSpent, bkcTotal, timeSinceLast }
 */
export async function getLastBuyback() {
    const contract = await getBuybackContractReadOnly();
    const result = await contract.getLastBuyback();
    return {
        timestamp: result[0],
        blockNumber: result[1],
        caller: result[2],
        ethSpent: result[3],
        bkcTotal: result[4],
        timeSinceLast: result[5]
    };
}

/**
 * Get supply info for mining curve
 * @returns {Object} { currentSupply, maxSupply, totalMintedViaMining, remainingMintable, miningRateBps, totalBurnedLifetime }
 */
export async function getSupplyInfo() {
    const contract = await getBuybackContractReadOnly();
    const result = await contract.getSupplyInfo();
    return {
        currentSupply: result[0],
        maxSupply: result[1],
        totalMintedViaMining: result[2],
        remainingMintable: result[3],
        miningRateBps: result[4],
        totalBurnedLifetime: result[5]
    };
}

// ============================================================================
// 4. NAMESPACE EXPORT
// ============================================================================

export const BuybackTx = {
    executeBuyback,
    executeBuybackWithSlippage,
    getExecutionFee,
    getPreviewBuyback,
    getPendingETH,
    getMiningRate,
    getBuybackStats,
    getLastBuyback,
    getSupplyInfo
};

export default BuybackTx;
