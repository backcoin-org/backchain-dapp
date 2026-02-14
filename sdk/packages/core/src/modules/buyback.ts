// @backchain/sdk — Buyback Module (Proof-of-Purchase Mining)
// ============================================================================

import { ethers } from 'ethers';
import { BUYBACK_MINER_ABI } from '../contracts/abis.js';
import type { Backchain } from '../backchain.js';
import type { TxResult, BuybackPreview, BuybackStats } from '../types/index.js';

export class BuybackModule {
    constructor(private sdk: Backchain) {}

    // ── Write ───────────────────────────────────────────────────────────────

    /**
     * Execute a buyback — converts accumulated ETH fees into BKC rewards.
     * The caller earns 5% of the mined BKC as a reward.
     * Requires paying the execution fee (anti-spam).
     */
    async execute(): Promise<TxResult> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const fee = await contract.executionFee();

        const writeContract = this.sdk.provider.getWriteContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const tx = await writeContract.executeBuyback({ value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /**
     * Execute buyback with slippage protection.
     * @param minTotalBkcOut - Minimum total BKC output (purchased + mined)
     */
    async executeWithSlippage(minTotalBkcOut: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const fee = await contract.executionFee();

        const writeContract = this.sdk.provider.getWriteContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const tx = await writeContract.executeBuybackWithSlippage(minTotalBkcOut, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    /** Preview the next buyback (estimated outputs, is ready?) */
    async preview(): Promise<BuybackPreview> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const r = await c.previewBuyback();
        return {
            ethAvailable: r[0], estimatedBkcPurchased: r[1], estimatedBkcMined: r[2],
            estimatedBurn: r[3], estimatedToStakers: r[4], estimatedCallerReward: r[5],
            currentMiningRateBps: r[6], isReady: r[7],
        };
    }

    /** Get pending ETH available for buyback */
    async pendingEth(): Promise<bigint> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.pendingBuybackETH();
    }

    /** Get current mining rate (basis points) */
    async miningRate(): Promise<bigint> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.currentMiningRate();
    }

    /** Get execution fee */
    async getExecutionFee(): Promise<bigint> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.executionFee();
    }

    /** Get supply info (current, max, minted, remaining, rate, burned) */
    async getSupplyInfo() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const s = await c.getSupplyInfo();
        return {
            currentSupply: s[0] as bigint, maxSupply: s[1] as bigint,
            totalMintedViaMining: s[2] as bigint, remainingMintable: s[3] as bigint,
            miningRateBps: s[4] as bigint, totalBurnedLifetime: s[5] as bigint,
        };
    }

    /** Get lifetime buyback statistics */
    async getStats(): Promise<BuybackStats> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const s = await c.getBuybackStats();
        return {
            totalBuybacks: s[0], totalEthSpent: s[1], totalBkcPurchased: s[2],
            totalBkcMined: s[3], totalBkcBurned: s[4], totalBkcToStakers: s[5],
            totalCallerRewards: s[6], avgEthPerBuyback: s[7], avgBkcPerBuyback: s[8],
        };
    }

    /** Get info about the last buyback */
    async getLastBuyback() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const r = await c.getLastBuyback();
        return {
            timestamp: r[0] as bigint, blockNumber: r[1] as bigint, caller: r[2] as string,
            ethSpent: r[3] as bigint, bkcTotal: r[4] as bigint, timeSinceLast: r[5] as bigint,
        };
    }
}
