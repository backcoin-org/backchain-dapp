// @backchain/sdk — NFT Module (Bonding Curve Trading)
// ============================================================================

import { ethers } from 'ethers';
import { NFT_POOL_ABI, REWARD_BOOSTER_ABI, BKC_TOKEN_ABI } from '../contracts/abis.js';
import { calculateFee, nftActionId } from '../fees.js';
import { getPoolAddress } from '../contracts/addresses.js';
import type { Backchain } from '../backchain.js';
import type { TxResult, NftTier, PoolInfo, PoolStats, TokenInfo } from '../types/index.js';

export class NftModule {
    constructor(private sdk: Backchain) {}

    // ── Write ───────────────────────────────────────────────────────────────

    /**
     * Buy an NFT Booster from the bonding curve pool.
     * Requires BKC (for the NFT price) + ETH (for the protocol fee).
     * Auto-approves BKC if needed.
     *
     * @param tier - 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
     * @param slippageBps - Max slippage in basis points (default 500 = 5%)
     */
    async buy(tier: NftTier, slippageBps: number = 500): Promise<TxResult> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);

        const pool = this.sdk.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const [bkcCost] = await pool.getTotalBuyCost();
        const maxBkcPrice = bkcCost + (bkcCost * BigInt(slippageBps) / 10000n);

        // Auto-approve BKC
        const allowance = await this.sdk.getBkcAllowance(poolAddr);
        if (allowance < maxBkcPrice) {
            await this.sdk.approveBkc(poolAddr, maxBkcPrice);
        }

        // Calculate ETH fee
        const fee = await calculateFee(
            this.sdk.provider, this.sdk.addresses.backchainEcosystem,
            nftActionId('NFT_BUY_T', tier)
        );

        const writePool = this.sdk.provider.getWriteContract(poolAddr, NFT_POOL_ABI);
        const tx = await writePool.buyNFT(maxBkcPrice, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);

        // Parse NFTPurchased event
        const iface = new ethers.Interface(NFT_POOL_ABI);
        const events: Record<string, unknown> = {};
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'NFTPurchased') {
                    events.tokenId = parsed.args[1];
                    events.price = parsed.args[2];
                }
            } catch { /* skip */ }
        }

        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events };
    }

    /**
     * Sell an NFT back to the bonding curve pool.
     * @param tier - NFT tier
     * @param tokenId - Token ID to sell
     * @param minPayout - Minimum BKC payout (0 for no minimum)
     */
    async sell(tier: NftTier, tokenId: bigint, minPayout: bigint = 0n): Promise<TxResult> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);

        // Ensure approval for the pool
        const booster = this.sdk.provider.getReadContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const isApproved = await booster.isApprovedForAll(this.sdk.provider.address!, poolAddr);
        if (!isApproved) {
            const writeBooster = this.sdk.provider.getWriteContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
            const approveTx = await writeBooster.setApprovalForAll(poolAddr, true);
            await approveTx.wait(1);
        }

        // Calculate ETH fee
        const fee = await calculateFee(
            this.sdk.provider, this.sdk.addresses.backchainEcosystem,
            nftActionId('NFT_SELL_T', tier)
        );

        const writePool = this.sdk.provider.getWriteContract(poolAddr, NFT_POOL_ABI);
        const tx = await writePool.sellNFT(tokenId, minPayout, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    /** Get buy price for a tier (BKC cost + ETH fee) */
    async getBuyPrice(tier: NftTier): Promise<{ bkcCost: bigint; ethFee: bigint }> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);
        const pool = this.sdk.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const [bkcCost, ethCost] = await pool.getTotalBuyCost();
        return { bkcCost, ethFee: ethCost };
    }

    /** Get sell payout for a tier */
    async getSellPrice(tier: NftTier): Promise<{ bkcPayout: bigint; ethFee: bigint }> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);
        const pool = this.sdk.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const [bkcPayout, ethCost] = await pool.getTotalSellInfo();
        return { bkcPayout, ethFee: ethCost };
    }

    /** Get pool info for a tier */
    async getPoolInfo(tier: NftTier): Promise<PoolInfo> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);
        const pool = this.sdk.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const info = await pool.getPoolInfo();
        return { bkcBalance: info[0], nftCount: info[1], k: info[2], initialized: info[3], tier: info[4] };
    }

    /** Get available NFT token IDs in a pool */
    async getAvailableNFTs(tier: NftTier): Promise<bigint[]> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);
        const pool = this.sdk.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        return pool.getAvailableNFTs();
    }

    /** Get pool trading statistics */
    async getPoolStats(tier: NftTier): Promise<PoolStats> {
        const poolAddr = getPoolAddress(this.sdk.addresses, tier);
        const pool = this.sdk.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const s = await pool.getStats();
        return { volume: s[0], buys: s[1], sells: s[2], ethFees: s[3] };
    }

    /** Get user's NFT tokens and tiers */
    async getUserTokens(address?: string): Promise<{ tokenIds: bigint[]; tiers: number[] }> {
        const addr = address || this.sdk.provider.address;
        if (!addr) throw new Error('No address');
        const booster = this.sdk.provider.getReadContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const result = await booster.getUserTokens(addr);
        return { tokenIds: result[0], tiers: result[1].map(Number) };
    }

    /** Get user's best NFT boost in basis points */
    async getUserBestBoost(address?: string): Promise<bigint> {
        const addr = address || this.sdk.provider.address;
        if (!addr) throw new Error('No address');
        const booster = this.sdk.provider.getReadContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        return booster.getUserBestBoost(addr);
    }

    /** Get token info (owner, tier, boost) */
    async getTokenInfo(tokenId: bigint): Promise<TokenInfo> {
        const booster = this.sdk.provider.getReadContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const info = await booster.getTokenInfo(tokenId);
        return { owner: info[0], tier: Number(info[1]), boostBips: info[2] };
    }
}
