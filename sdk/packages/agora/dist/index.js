// @backchain/agora — Decentralized Social Protocol
// ============================================================================
import { ethers } from 'ethers';
import { AGORA_ABI, calculateFee, ACTION_IDS } from '@backchain/core';
export class AgoraModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async createPost(content, tag = 0, contentType = 0) {
        let fee = 0n;
        if (contentType === 1)
            fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_POST_IMAGE);
        else if (contentType === 2)
            fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_POST_VIDEO);
        else if (contentType === 4)
            fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_LIVE);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.createPost(content, tag, contentType, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(AGORA_ABI);
        let postId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'PostCreated')
                    postId = parsed.args[0];
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { postId }, postId };
    }
    async createReply(parentId, content, contentType = 0) {
        let fee = 0n;
        if (contentType === 1 || contentType === 2 || contentType === 4) {
            fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_REPLY);
        }
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.createReply(parentId, content, contentType, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(AGORA_ABI);
        let postId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'ReplyCreated')
                    postId = parsed.args[0];
            }
            catch { /* skip */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: { postId }, postId };
    }
    async createRepost(originalId, quote = '') {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.createRepost(originalId, quote, this.ctx.operator);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async editPost(postId, newContent) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.editPost(postId, newContent);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async deletePost(postId) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.deletePost(postId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async like(postId) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_LIKE);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.like(postId, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async superLike(postId, ethAmount) {
        if (ethAmount <= 0n)
            throw new Error('ETH amount must be > 0');
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.superLike(postId, this.ctx.operator, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async downvote(postId) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_DOWNVOTE);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.downvote(postId, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async tipPost(postId, ethAmount) {
        if (ethAmount <= 0n)
            throw new Error('ETH amount must be > 0');
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.tipPost(postId, this.ctx.operator, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async follow(userAddress) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_FOLLOW);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.follow(userAddress, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async unfollow(userAddress) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.unfollow(userAddress);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async blockUser(userAddress) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.blockUser(userAddress);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async unblockUser(userAddress) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.unblockUser(userAddress);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async createProfile(username, metadataURI) {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        const fee = await contract.getUsernamePrice(username.length);
        const writeContract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await writeContract.createProfile(username, metadataURI, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async updateProfile(metadataURI) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.updateProfile(metadataURI);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async pinPost(postId) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.pinPost(postId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async boostProfile(days) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.AGORA_PROFILE_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.boostProfile(this.ctx.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async obtainBadge(tier) {
        const actionIds = [ACTION_IDS.AGORA_BADGE_VERIFIED, ACTION_IDS.AGORA_BADGE_PREMIUM, ACTION_IDS.AGORA_BADGE_ELITE];
        if (tier < 0 || tier > 2)
            throw new Error('Badge tier must be 0-2');
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, actionIds[tier]);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.obtainBadge(tier, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async boostPost(postId, tier, days) {
        const actionId = tier === 0 ? ACTION_IDS.AGORA_BOOST_STD : ACTION_IDS.AGORA_BOOST_FEAT;
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, actionId);
        const totalFee = fee * BigInt(days);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.agora, AGORA_ABI);
        const tx = await contract.boostPost(postId, tier, this.ctx.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async getPost(postId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        const p = await c.getPost(postId);
        return this._mapPost(p);
    }
    async getPostsBatch(postIds) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        const posts = await c.getPostsBatch(postIds);
        return posts.map((p) => this._mapPost(p));
    }
    async getUserProfile(address) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        const p = await c.getUserProfile(address);
        return {
            usernameHash: p[0], metadataURI: p[1], pinned: p[2], boosted: p[3],
            hasBadge: p[4], badgeTier: Number(p[5]), boostExp: p[6], badgeExp: p[7],
            followers: p[8], following: p[9],
        };
    }
    async isFollowing(follower, followed) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        return c.checkFollowing(follower, followed);
    }
    async hasLiked(postId, user) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        return c.hasLiked(postId, user);
    }
    async isUsernameAvailable(username) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        return c.isUsernameAvailable(username);
    }
    async getUsernamePrice(length) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        return c.getUsernamePrice(length);
    }
    async getGlobalStats() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.agora, AGORA_ABI);
        const s = await c.getGlobalStats();
        return { totalPosts: s[0], totalProfiles: s[1], tagCounts: s[2] };
    }
    _mapPost(p) {
        return {
            author: p[0], tag: Number(p[1]), contentType: Number(p[2]), deleted: p[3],
            createdAt: p[4], editedAt: p[5], replyTo: p[6], repostOf: p[7],
            likes: p[8], superLikes: p[9], superLikeETH: p[10], downvotes: p[11],
            replies: p[12], reposts: p[13], reports: p[14], tips: p[15],
            boostTier: Number(p[16]), boostExpiry: p[17],
        };
    }
}
//# sourceMappingURL=index.js.map