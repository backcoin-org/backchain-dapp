import type { BackchainContext } from '@backchain/core';
import type { TxResult, NftTier, PoolInfo, PoolStats, TokenInfo } from '@backchain/core';
export declare class NftModule {
    private ctx;
    constructor(ctx: BackchainContext);
    buy(tier: NftTier, slippageBps?: number): Promise<TxResult>;
    sell(tier: NftTier, tokenId: bigint, minPayout?: bigint): Promise<TxResult>;
    getBuyPrice(tier: NftTier): Promise<{
        bkcCost: bigint;
        ethFee: bigint;
    }>;
    getSellPrice(tier: NftTier): Promise<{
        bkcPayout: bigint;
        ethFee: bigint;
    }>;
    getPoolInfo(tier: NftTier): Promise<PoolInfo>;
    getAvailableNFTs(tier: NftTier): Promise<bigint[]>;
    getPoolStats(tier: NftTier): Promise<PoolStats>;
    getUserTokens(address?: string): Promise<{
        tokenIds: bigint[];
        tiers: number[];
    }>;
    getUserBestBoost(address?: string): Promise<bigint>;
    getTokenInfo(tokenId: bigint): Promise<TokenInfo>;
}
//# sourceMappingURL=index.d.ts.map