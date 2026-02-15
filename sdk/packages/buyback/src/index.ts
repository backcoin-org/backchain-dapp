// @backchain/buyback — Proof-of-Purchase Mining
// ============================================================================

import { ethers } from 'ethers';
import { BUYBACK_MINER_ABI } from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { TxResult, BuybackPreview, BuybackStats } from '@backchain/core';

export class BuybackModule {
    constructor(private ctx: BackchainContext) {}

    async execute(): Promise<TxResult> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const fee = await contract.executionFee();

        const writeContract = this.ctx.provider.getWriteContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const tx = await writeContract.executeBuyback({ value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async executeWithSlippage(minTotalBkcOut: bigint): Promise<TxResult> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const fee = await contract.executionFee();

        const writeContract = this.ctx.provider.getWriteContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const tx = await writeContract.executeBuybackWithSlippage(minTotalBkcOut, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async preview(): Promise<BuybackPreview> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const r = await c.previewBuyback();
        return {
            ethAvailable: r[0], estimatedBkcPurchased: r[1], estimatedBkcMined: r[2],
            estimatedBurn: r[3], estimatedToStakers: r[4], estimatedCallerReward: r[5],
            currentMiningRateBps: r[6], isReady: r[7],
        };
    }

    async pendingEth(): Promise<bigint> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.pendingBuybackETH();
    }

    async miningRate(): Promise<bigint> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.currentMiningRate();
    }

    async getExecutionFee(): Promise<bigint> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.executionFee();
    }

    async getSupplyInfo() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const s = await c.getSupplyInfo();
        return {
            currentSupply: s[0] as bigint, maxSupply: s[1] as bigint,
            totalMintedViaMining: s[2] as bigint, remainingMintable: s[3] as bigint,
            miningRateBps: s[4] as bigint, totalBurnedLifetime: s[5] as bigint,
        };
    }

    async getStats(): Promise<BuybackStats> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const s = await c.getBuybackStats();
        return {
            totalBuybacks: s[0], totalEthSpent: s[1], totalBkcPurchased: s[2],
            totalBkcMined: s[3], totalBkcBurned: s[4], totalBkcToStakers: s[5],
            totalCallerRewards: s[6], avgEthPerBuyback: s[7], avgBkcPerBuyback: s[8],
        };
    }

    async getLastBuyback() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const r = await c.getLastBuyback();
        return {
            timestamp: r[0] as bigint, blockNumber: r[1] as bigint, caller: r[2] as string,
            ethSpent: r[3] as bigint, bkcTotal: r[4] as bigint, timeSinceLast: r[5] as bigint,
        };
    }
}
