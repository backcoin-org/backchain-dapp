import type { BackchainContext } from '@backchain/core';
import type { TxResult, FusionPreview, SplitPreview } from '@backchain/core';
export declare class FusionModule {
    private ctx;
    constructor(ctx: BackchainContext);
    fuse(tokenId1: bigint, tokenId2: bigint): Promise<TxResult & {
        newTokenId: bigint;
    }>;
    split(tokenId: bigint): Promise<TxResult & {
        newTokenIds: bigint[];
    }>;
    splitTo(tokenId: bigint, targetTier: number): Promise<TxResult & {
        newTokenIds: bigint[];
    }>;
    previewFusion(tokenId1: bigint, tokenId2: bigint): Promise<FusionPreview>;
    previewSplit(tokenId: bigint, targetTier: number): Promise<SplitPreview>;
    getStats(): Promise<{
        totalFusions: bigint;
        totalSplits: bigint;
        bronzeFusions: bigint;
        silverFusions: bigint;
        goldFusions: bigint;
        silverSplits: bigint;
        goldSplits: bigint;
        diamondSplits: bigint;
    }>;
    private _ensureApproval;
}
//# sourceMappingURL=index.d.ts.map