// @backchain/charity — Transparent Fundraising
// ============================================================================
import { ethers } from 'ethers';
import { CHARITY_POOL_ABI, calculateFee, ACTION_IDS } from '@backchain/core';
export class CharityModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async createCampaign(title, metadataUri, goalAmount, durationDays) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.CHARITY_CREATE);
        const safeFee = fee > 0n ? fee : ethers.parseEther('0.0001');
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.createCampaign(title, metadataUri, goalAmount, durationDays, this.ctx.operator, { value: safeFee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(CHARITY_POOL_ABI);
        let campaignId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'CampaignCreated')
                    campaignId = parsed.args[0];
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { campaignId }, campaignId };
    }
    async donate(campaignId, amount) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.donate(campaignId, this.ctx.operator, { value: amount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async closeCampaign(campaignId) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.closeCampaign(campaignId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async withdraw(campaignId) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.withdraw(campaignId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async boostCampaign(campaignId, days) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.CHARITY_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.boostCampaign(campaignId, this.ctx.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async getCampaign(campaignId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const r = await c.getCampaign(campaignId);
        return {
            owner: r[0], deadline: r[1], status: Number(r[2]), raised: r[3],
            goal: r[4], donorCount: r[5], isBoosted: r[6], title: r[7], metadataUri: r[8],
        };
    }
    async previewDonation(amount) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const r = await c.previewDonation(amount);
        return { fee: r[0], netToCampaign: r[1] };
    }
    async getStats() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        const s = await c.getStats();
        return { campaignCount: s[0], totalDonated: s[1], totalWithdrawn: s[2], totalEthFees: s[3] };
    }
    async getCampaignCount() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.charityPool, CHARITY_POOL_ABI);
        return c.campaignCount();
    }
}
//# sourceMappingURL=index.js.map