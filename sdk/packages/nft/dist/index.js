// @backchain/nft — NFT Module (Bonding Curve Trading)
// ============================================================================
import { ethers } from 'ethers';
import { NFT_POOL_ABI, REWARD_BOOSTER_ABI, calculateFee, nftActionId, getPoolAddress, } from '@backchain/core';
export class NftModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async buy(tier, slippageBps = 500) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const pool = this.ctx.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const [bkcCost] = await pool.getTotalBuyCost();
        const maxBkcPrice = bkcCost + (bkcCost * BigInt(slippageBps) / 10000n);
        const allowance = await this.ctx.getBkcAllowance(poolAddr);
        if (allowance < maxBkcPrice) {
            await this.ctx.approveBkc(poolAddr, maxBkcPrice);
        }
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, nftActionId('NFT_BUY_T', tier));
        const writePool = this.ctx.provider.getWriteContract(poolAddr, NFT_POOL_ABI);
        const tx = await writePool.buyNFT(maxBkcPrice, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(NFT_POOL_ABI);
        const events = {};
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'NFTPurchased') {
                    events.tokenId = parsed.args[1];
                    events.price = parsed.args[2];
                }
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events };
    }
    async sell(tier, tokenId, minPayout = 0n) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const booster = this.ctx.provider.getReadContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const isApproved = await booster.isApprovedForAll(this.ctx.provider.address, poolAddr);
        if (!isApproved) {
            const writeBooster = this.ctx.provider.getWriteContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
            const approveTx = await writeBooster.setApprovalForAll(poolAddr, true);
            await approveTx.wait(1);
        }
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, nftActionId('NFT_SELL_T', tier));
        const writePool = this.ctx.provider.getWriteContract(poolAddr, NFT_POOL_ABI);
        const tx = await writePool.sellNFT(tokenId, minPayout, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async getBuyPrice(tier) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const pool = this.ctx.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const [bkcCost, ethCost] = await pool.getTotalBuyCost();
        return { bkcCost, ethFee: ethCost };
    }
    async getSellPrice(tier) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const pool = this.ctx.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const [bkcPayout, ethCost] = await pool.getTotalSellInfo();
        return { bkcPayout, ethFee: ethCost };
    }
    async getPoolInfo(tier) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const pool = this.ctx.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const info = await pool.getPoolInfo();
        return { bkcBalance: info[0], nftCount: info[1], k: info[2], initialized: info[3], tier: info[4] };
    }
    async getAvailableNFTs(tier) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const pool = this.ctx.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        return pool.getAvailableNFTs();
    }
    async getPoolStats(tier) {
        const poolAddr = getPoolAddress(this.ctx.addresses, tier);
        const pool = this.ctx.provider.getReadContract(poolAddr, NFT_POOL_ABI);
        const s = await pool.getStats();
        return { volume: s[0], buys: s[1], sells: s[2], ethFees: s[3] };
    }
    async getUserTokens(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const booster = this.ctx.provider.getReadContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const result = await booster.getUserTokens(addr);
        return { tokenIds: result[0], tiers: result[1].map(Number) };
    }
    async getUserBestBoost(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const booster = this.ctx.provider.getReadContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        return booster.getUserBestBoost(addr);
    }
    async getTokenInfo(tokenId) {
        const booster = this.ctx.provider.getReadContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const info = await booster.getTokenInfo(tokenId);
        return { owner: info[0], tier: Number(info[1]), boostBips: info[2] };
    }
}
//# sourceMappingURL=index.js.map