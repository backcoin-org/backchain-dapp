// @backchain/sdk — NFT Fusion Module (Fuse / Split / SplitTo)
// ============================================================================
import { ethers } from 'ethers';
import { NFT_FUSION_ABI, REWARD_BOOSTER_ABI } from '../contracts/abis.js';
export class FusionModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Write ───────────────────────────────────────────────────────────────
    /**
     * Fuse two same-tier NFTs into one higher-tier NFT.
     * Both NFTs are burned, one new NFT is minted.
     *
     * @param tokenId1 - First NFT
     * @param tokenId2 - Second NFT (same tier as first)
     */
    async fuse(tokenId1, tokenId2) {
        await this._ensureApproval();
        // Get fee
        const preview = await this.previewFusion(tokenId1, tokenId2);
        if (!preview.canFuse)
            throw new Error('Cannot fuse these tokens (must be same tier, not Diamond)');
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const tx = await contract.fuse(tokenId1, tokenId2, this.sdk.operator, { value: preview.ethFee });
        const receipt = await tx.wait(1);
        // Parse Fused event
        const iface = new ethers.Interface(NFT_FUSION_ABI);
        let newTokenId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Fused')
                    newTokenId = parsed.args[3];
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { newTokenId }, newTokenId };
    }
    /**
     * Split one NFT into two lower-tier NFTs.
     * @param tokenId - NFT to split (cannot be Bronze)
     */
    async split(tokenId) {
        await this._ensureApproval();
        const fusion = this.sdk.provider.getReadContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const preview = await fusion.previewSplit(tokenId, 255); // 255 = just one tier down
        const fee = preview[2];
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const tx = await contract.split(tokenId, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(NFT_FUSION_ABI);
        let newTokenIds = [];
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Split')
                    newTokenIds = parsed.args[5];
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { newTokenIds }, newTokenIds };
    }
    /**
     * Split one NFT down to a target tier (cascading split).
     * E.g., Diamond → 8 Bronze (splitTo tier 0)
     *
     * @param tokenId - NFT to split
     * @param targetTier - Target tier (0=Bronze, 1=Silver, 2=Gold)
     */
    async splitTo(tokenId, targetTier) {
        await this._ensureApproval();
        const preview = await this.previewSplit(tokenId, targetTier);
        if (!preview.canSplit)
            throw new Error('Cannot split to this target tier');
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const tx = await contract.splitTo(tokenId, targetTier, this.sdk.operator, { value: preview.ethFee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(NFT_FUSION_ABI);
        let newTokenIds = [];
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Split')
                    newTokenIds = parsed.args[5];
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { newTokenIds }, newTokenIds };
    }
    // ── Read ────────────────────────────────────────────────────────────────
    /** Preview a fusion (fee, result tier, can fuse?) */
    async previewFusion(tokenId1, tokenId2) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const r = await c.previewFusion(tokenId1, tokenId2);
        return { sourceTier: Number(r[0]), resultTier: Number(r[1]), ethFee: r[2], canFuse: r[3] };
    }
    /** Preview a split (fee, mint count, can split?) */
    async previewSplit(tokenId, targetTier) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const r = await c.previewSplit(tokenId, targetTier);
        return { sourceTier: Number(r[0]), mintCount: r[1], ethFee: r[2], canSplit: r[3] };
    }
    /** Get fusion statistics */
    async getStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.nftFusion, NFT_FUSION_ABI);
        const s = await c.getStats();
        return {
            totalFusions: s[0], totalSplits: s[1],
            bronzeFusions: s[2], silverFusions: s[3], goldFusions: s[4],
            silverSplits: s[5], goldSplits: s[6], diamondSplits: s[7],
        };
    }
    // ── Private ─────────────────────────────────────────────────────────────
    async _ensureApproval() {
        const booster = this.sdk.provider.getReadContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const isApproved = await booster.isApprovedForAll(this.sdk.provider.address, this.sdk.addresses.nftFusion);
        if (!isApproved) {
            const writeBooster = this.sdk.provider.getWriteContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
            const tx = await writeBooster.setApprovalForAll(this.sdk.addresses.nftFusion, true);
            await tx.wait(1);
        }
    }
}
//# sourceMappingURL=fusion.js.map