// @backchain/sdk — Charity Module (Transparent Fundraising)
// ============================================================================
import { ethers } from 'ethers';
import { CHARITY_POOL_ABI } from '../contracts/abis.js';
import { calculateFee, ACTION_IDS } from '../fees.js';
export class CharityModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Write ───────────────────────────────────────────────────────────────
    /**
     * Create a charity campaign.
     * @param title - Campaign title
     * @param metadataUri - Metadata URI (IPFS/Arweave link)
     * @param goalAmount - Goal in wei (ETH)
     * @param durationDays - Campaign duration
     */
    async createCampaign(title, metadataUri, goalAmount, durationDays) {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.CHARITY_CREATE);
        const safeFee = fee > 0n ? fee : ethers.parseEther('0.0001');
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.createCampaign(title, metadataUri, goalAmount, durationDays, this.sdk.operator, { value: safeFee });
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
    /**
     * Donate ETH to a campaign.
     * @param campaignId - Campaign ID
     * @param amount - Donation amount in wei (5% fee deducted on-chain)
     */
    async donate(campaignId, amount) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.donate(campaignId, this.sdk.operator, { value: amount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Close a campaign (owner only) */
    async closeCampaign(campaignId) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.closeCampaign(campaignId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Withdraw funds from a closed campaign (owner only) */
    async withdraw(campaignId) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.withdraw(campaignId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Boost a campaign's visibility (daily rate) */
    async boostCampaign(campaignId, days) {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.CHARITY_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.boostCampaign(campaignId, this.sdk.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Read ────────────────────────────────────────────────────────────────
    /** Get campaign details */
    async getCampaign(campaignId) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const r = await c.getCampaign(campaignId);
        return {
            owner: r[0], deadline: r[1], status: Number(r[2]), raised: r[3],
            goal: r[4], donorCount: r[5], isBoosted: r[6], title: r[7], metadataUri: r[8],
        };
    }
    /** Preview donation (fee breakdown) */
    async previewDonation(amount) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const r = await c.previewDonation(amount);
        return { fee: r[0], netToCampaign: r[1] };
    }
    /** Get charity pool statistics */
    async getStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const s = await c.getStats();
        return { campaignCount: s[0], totalDonated: s[1], totalWithdrawn: s[2], totalEthFees: s[3] };
    }
    /** Get total number of campaigns */
    async getCampaignCount() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        return c.campaignCount();
    }
}
//# sourceMappingURL=charity.js.map