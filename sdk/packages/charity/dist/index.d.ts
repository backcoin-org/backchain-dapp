import type { BackchainContext } from '@backchain/core';
import type { TxResult, Campaign } from '@backchain/core';
export declare class CharityModule {
    private ctx;
    constructor(ctx: BackchainContext);
    createCampaign(title: string, metadataUri: string, goalAmount: bigint, durationDays: number): Promise<TxResult & {
        campaignId: bigint;
    }>;
    donate(campaignId: bigint, amount: bigint): Promise<TxResult>;
    closeCampaign(campaignId: bigint): Promise<TxResult>;
    withdraw(campaignId: bigint): Promise<TxResult>;
    boostCampaign(campaignId: bigint, days: number): Promise<TxResult>;
    getCampaign(campaignId: bigint): Promise<Campaign>;
    previewDonation(amount: bigint): Promise<{
        fee: bigint;
        netToCampaign: bigint;
    }>;
    getStats(): Promise<{
        campaignCount: bigint;
        totalDonated: bigint;
        totalWithdrawn: bigint;
        totalEthFees: bigint;
    }>;
    getCampaignCount(): Promise<bigint>;
}
//# sourceMappingURL=index.d.ts.map