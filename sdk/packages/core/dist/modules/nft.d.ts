import type { Backchain } from '../backchain.js';
import type { TxResult, NftTier, PoolInfo, PoolStats, TokenInfo } from '../types/index.js';
export declare class NftModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Buy an NFT Booster from the bonding curve pool.
     * Requires BKC (for the NFT price) + ETH (for the protocol fee).
     * Auto-approves BKC if needed.
     *
     * @param tier - 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
     * @param slippageBps - Max slippage in basis points (default 500 = 5%)
     */
    buy(tier: NftTier, slippageBps?: number): Promise<TxResult>;
    /**
     * Sell an NFT back to the bonding curve pool.
     * @param tier - NFT tier
     * @param tokenId - Token ID to sell
     * @param minPayout - Minimum BKC payout (0 for no minimum)
     */
    sell(tier: NftTier, tokenId: bigint, minPayout?: bigint): Promise<TxResult>;
    /** Get buy price for a tier (BKC cost + ETH fee) */
    getBuyPrice(tier: NftTier): Promise<{
        bkcCost: bigint;
        ethFee: bigint;
    }>;
    /** Get sell payout for a tier */
    getSellPrice(tier: NftTier): Promise<{
        bkcPayout: bigint;
        ethFee: bigint;
    }>;
    /** Get pool info for a tier */
    getPoolInfo(tier: NftTier): Promise<PoolInfo>;
    /** Get available NFT token IDs in a pool */
    getAvailableNFTs(tier: NftTier): Promise<bigint[]>;
    /** Get pool trading statistics */
    getPoolStats(tier: NftTier): Promise<PoolStats>;
    /** Get user's NFT tokens and tiers */
    getUserTokens(address?: string): Promise<{
        tokenIds: bigint[];
        tiers: number[];
    }>;
    /** Get user's best NFT boost in basis points */
    getUserBestBoost(address?: string): Promise<bigint>;
    /** Get token info (owner, tier, boost) */
    getTokenInfo(tokenId: bigint): Promise<TokenInfo>;
}
//# sourceMappingURL=nft.d.ts.map