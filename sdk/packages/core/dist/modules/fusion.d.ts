import type { Backchain } from '../backchain.js';
import type { TxResult, FusionPreview, SplitPreview } from '../types/index.js';
export declare class FusionModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Fuse two same-tier NFTs into one higher-tier NFT.
     * Both NFTs are burned, one new NFT is minted.
     *
     * @param tokenId1 - First NFT
     * @param tokenId2 - Second NFT (same tier as first)
     */
    fuse(tokenId1: bigint, tokenId2: bigint): Promise<TxResult & {
        newTokenId: bigint;
    }>;
    /**
     * Split one NFT into two lower-tier NFTs.
     * @param tokenId - NFT to split (cannot be Bronze)
     */
    split(tokenId: bigint): Promise<TxResult & {
        newTokenIds: bigint[];
    }>;
    /**
     * Split one NFT down to a target tier (cascading split).
     * E.g., Diamond → 8 Bronze (splitTo tier 0)
     *
     * @param tokenId - NFT to split
     * @param targetTier - Target tier (0=Bronze, 1=Silver, 2=Gold)
     */
    splitTo(tokenId: bigint, targetTier: number): Promise<TxResult & {
        newTokenIds: bigint[];
    }>;
    /** Preview a fusion (fee, result tier, can fuse?) */
    previewFusion(tokenId1: bigint, tokenId2: bigint): Promise<FusionPreview>;
    /** Preview a split (fee, mint count, can split?) */
    previewSplit(tokenId: bigint, targetTier: number): Promise<SplitPreview>;
    /** Get fusion statistics */
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
//# sourceMappingURL=fusion.d.ts.map