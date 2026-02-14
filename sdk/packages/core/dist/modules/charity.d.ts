import type { Backchain } from '../backchain.js';
import type { TxResult, Campaign } from '../types/index.js';
export declare class CharityModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Create a charity campaign.
     * @param title - Campaign title
     * @param metadataUri - Metadata URI (IPFS/Arweave link)
     * @param goalAmount - Goal in wei (ETH)
     * @param durationDays - Campaign duration
     */
    createCampaign(title: string, metadataUri: string, goalAmount: bigint, durationDays: number): Promise<TxResult & {
        campaignId: bigint;
    }>;
    /**
     * Donate ETH to a campaign.
     * @param campaignId - Campaign ID
     * @param amount - Donation amount in wei (5% fee deducted on-chain)
     */
    donate(campaignId: bigint, amount: bigint): Promise<TxResult>;
    /** Close a campaign (owner only) */
    closeCampaign(campaignId: bigint): Promise<TxResult>;
    /** Withdraw funds from a closed campaign (owner only) */
    withdraw(campaignId: bigint): Promise<TxResult>;
    /** Boost a campaign's visibility (daily rate) */
    boostCampaign(campaignId: bigint, days: number): Promise<TxResult>;
    /** Get campaign details */
    getCampaign(campaignId: bigint): Promise<Campaign>;
    /** Preview donation (fee breakdown) */
    previewDonation(amount: bigint): Promise<{
        fee: bigint;
        netToCampaign: bigint;
    }>;
    /** Get charity pool statistics */
    getStats(): Promise<{
        campaignCount: bigint;
        totalDonated: bigint;
        totalWithdrawn: bigint;
        totalEthFees: bigint;
    }>;
    /** Get total number of campaigns */
    getCampaignCount(): Promise<bigint>;
}
//# sourceMappingURL=charity.d.ts.map