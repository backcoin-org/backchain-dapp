// @backchain/fusion — NFT Fusion Module (Fuse / Split / SplitTo)
// ============================================================================

import { ethers } from 'ethers';
import { NFT_FUSION_ABI, REWARD_BOOSTER_ABI } from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { TxResult, FusionPreview, SplitPreview } from '@backchain/core';

export class FusionModule {
    constructor(private ctx: BackchainContext) {}

    async fuse(tokenId1: bigint, tokenId2: bigint): Promise<TxResult & { newTokenId: bigint }> {
        await this._ensureApproval();

        const preview = await this.previewFusion(tokenId1, tokenId2);
        if (!preview.canFuse) throw new Error('Cannot fuse these tokens (must be same tier, not Diamond)');

        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const tx = await contract.fuse(tokenId1, tokenId2, this.ctx.operator, { value: preview.ethFee });
        const receipt = await tx.wait(1);

        const iface = new ethers.Interface(NFT_FUSION_ABI);
        let newTokenId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Fused') newTokenId = parsed.args[3];
            } catch { /* skip */ }
        }

        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { newTokenId }, newTokenId };
    }

    async split(tokenId: bigint): Promise<TxResult & { newTokenIds: bigint[] }> {
        await this._ensureApproval();

        const fusion = this.ctx.provider.getReadContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const preview = await fusion.previewSplit(tokenId, 255);
        const fee = preview[2];

        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const tx = await contract.split(tokenId, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);

        const iface = new ethers.Interface(NFT_FUSION_ABI);
        let newTokenIds: bigint[] = [];
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Split') newTokenIds = parsed.args[5];
            } catch { /* skip */ }
        }

        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { newTokenIds }, newTokenIds };
    }

    async splitTo(tokenId: bigint, targetTier: number): Promise<TxResult & { newTokenIds: bigint[] }> {
        await this._ensureApproval();

        const preview = await this.previewSplit(tokenId, targetTier);
        if (!preview.canSplit) throw new Error('Cannot split to this target tier');

        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const tx = await contract.splitTo(tokenId, targetTier, this.ctx.operator, { value: preview.ethFee });
        const receipt = await tx.wait(1);

        const iface = new ethers.Interface(NFT_FUSION_ABI);
        let newTokenIds: bigint[] = [];
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Split') newTokenIds = parsed.args[5];
            } catch { /* skip */ }
        }

        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { newTokenIds }, newTokenIds };
    }

    async previewFusion(tokenId1: bigint, tokenId2: bigint): Promise<FusionPreview> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const r = await c.previewFusion(tokenId1, tokenId2);
        return { sourceTier: Number(r[0]), resultTier: Number(r[1]), ethFee: r[2], canFuse: r[3] };
    }

    async previewSplit(tokenId: bigint, targetTier: number): Promise<SplitPreview> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const r = await c.previewSplit(tokenId, targetTier);
        return { sourceTier: Number(r[0]), mintCount: r[1], ethFee: r[2], canSplit: r[3] };
    }

    async getStats() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.nftFusion, NFT_FUSION_ABI);
        const s = await c.getStats();
        return {
            totalFusions: s[0] as bigint, totalSplits: s[1] as bigint,
            bronzeFusions: s[2] as bigint, silverFusions: s[3] as bigint, goldFusions: s[4] as bigint,
            silverSplits: s[5] as bigint, goldSplits: s[6] as bigint, diamondSplits: s[7] as bigint,
        };
    }

    private async _ensureApproval(): Promise<void> {
        const booster = this.ctx.provider.getReadContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const isApproved = await booster.isApprovedForAll(this.ctx.provider.address!, this.ctx.addresses.nftFusion);
        if (!isApproved) {
            const writeBooster = this.ctx.provider.getWriteContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
            const tx = await writeBooster.setApprovalForAll(this.ctx.addresses.nftFusion, true);
            await tx.wait(1);
        }
    }
}
