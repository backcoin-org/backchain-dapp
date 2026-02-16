// @backchain/sdk — Charity Module (Transparent Fundraising)
// ============================================================================

import { ethers } from 'ethers';
import { CHARITY_POOL_ABI } from '../contracts/abis.js';
import { calculateFee, ACTION_IDS } from '../fees.js';
import type { Backchain } from '../backchain.js';
import type { TxResult, Campaign } from '../types/index.js';

export class CharityModule {
    constructor(private sdk: Backchain) {}

    // ── Write ───────────────────────────────────────────────────────────────

    /**
     * Create a charity campaign.
     * @param title - Campaign title
     * @param metadataUri - Metadata URI (IPFS/Lighthouse link)
     * @param goalAmount - Goal in wei (ETH)
     * @param durationDays - Campaign duration
     */
    async createCampaign(title: string, metadataUri: string, goalAmount: bigint, durationDays: number): Promise<TxResult & { campaignId: bigint }> {
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
                if (parsed?.name === 'CampaignCreated') campaignId = parsed.args[0];
            } catch { /* skip */ }
        }

        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { campaignId }, campaignId };
    }

    /**
     * Donate ETH to a campaign.
     * @param campaignId - Campaign ID
     * @param amount - Donation amount in wei (5% fee deducted on-chain)
     */
    async donate(campaignId: bigint, amount: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.donate(campaignId, this.sdk.operator, { value: amount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Close a campaign (owner only) */
    async closeCampaign(campaignId: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.closeCampaign(campaignId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Withdraw funds from a closed campaign (owner only) */
    async withdraw(campaignId: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.withdraw(campaignId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Boost a campaign's visibility (daily rate) */
    async boostCampaign(campaignId: bigint, days: number): Promise<TxResult> {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.CHARITY_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const tx = await contract.boostCampaign(campaignId, this.sdk.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    /** Get campaign details */
    async getCampaign(campaignId: bigint): Promise<Campaign> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const r = await c.getCampaign(campaignId);
        return {
            owner: r[0], deadline: r[1], status: Number(r[2]), raised: r[3],
            goal: r[4], donorCount: r[5], isBoosted: r[6], title: r[7], metadataUri: r[8],
        };
    }

    /** Preview donation (fee breakdown) */
    async previewDonation(amount: bigint): Promise<{ fee: bigint; netToCampaign: bigint }> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const r = await c.previewDonation(amount);
        return { fee: r[0], netToCampaign: r[1] };
    }

    /** Get charity pool statistics */
    async getStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        const s = await c.getStats();
        return { campaignCount: s[0] as bigint, totalDonated: s[1] as bigint, totalWithdrawn: s[2] as bigint, totalEthFees: s[3] as bigint };
    }

    /** Get total number of campaigns */
    async getCampaignCount(): Promise<bigint> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.charityPool, CHARITY_POOL_ABI);
        return c.campaignCount();
    }
}
