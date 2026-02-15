// @backchain/buyback — Proof-of-Purchase Mining
// ============================================================================
import { BUYBACK_MINER_ABI } from '@backchain/core';
export class BuybackModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async execute() {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const fee = await contract.executionFee();
        const writeContract = this.ctx.provider.getWriteContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const tx = await writeContract.executeBuyback({ value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async executeWithSlippage(minTotalBkcOut) {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const fee = await contract.executionFee();
        const writeContract = this.ctx.provider.getWriteContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const tx = await writeContract.executeBuybackWithSlippage(minTotalBkcOut, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async preview() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const r = await c.previewBuyback();
        return {
            ethAvailable: r[0], estimatedBkcPurchased: r[1], estimatedBkcMined: r[2],
            estimatedBurn: r[3], estimatedToStakers: r[4], estimatedCallerReward: r[5],
            currentMiningRateBps: r[6], isReady: r[7],
        };
    }
    async pendingEth() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.pendingBuybackETH();
    }
    async miningRate() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.currentMiningRate();
    }
    async getExecutionFee() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        return c.executionFee();
    }
    async getSupplyInfo() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.buybackMiner, BUYBACK_MINER_ABI);
        const s = await c.getSupplyInfo();
        return {
            currentSupply: s[0], maxSupply: s[1],
            totalMintedViaMining: s[2], remainingMintable: s[3],
            miningRateBps: s[4], totalBurnedLifetime: s[5],
        };
    }
    async getStats() {
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
            timestamp: r[0], blockNumber: r[1], caller: r[2],
            ethSpent: r[3], bkcTotal: r[4], timeSinceLast: r[5],
        };
    }
}
//# sourceMappingURL=index.js.map