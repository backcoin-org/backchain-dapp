// @backchain/sdk — Agora Module (Decentralized Social Protocol)
// ============================================================================
import { ethers } from 'ethers';
import { AGORA_ABI } from '../contracts/abis.js';
import { calculateFee, ACTION_IDS } from '../fees.js';
export class AgoraModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Posts ────────────────────────────────────────────────────────────────
    /**
     * Create a post.
     * Text (0) and Link (3) posts are FREE. Image (1), Video (2), Live (4) pay fees.
     *
     * @param content - Content hash or text
     * @param tag - Tag index (0-14)
     * @param contentType - 0=Text, 1=Image, 2=Video, 3=Link, 4=Live
     */
    async createPost(content, tag = 0, contentType = 0) {
        let fee = 0n;
        if (contentType === 1)
            fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_POST_IMAGE);
        else if (contentType === 2)
            fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_POST_VIDEO);
        else if (contentType === 4)
            fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_LIVE);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.createPost(content, tag, contentType, this.sdk.operator, { value: fee });
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
    /** Reply to a post */
    async createReply(parentId, content, contentType = 0) {
        let fee = 0n;
        if (contentType === 1 || contentType === 2 || contentType === 4) {
            fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_REPLY);
        }
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.createReply(parentId, content, contentType, this.sdk.operator, { value: fee });
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
    /** Repost (free) */
    async createRepost(originalId, quote = '') {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.createRepost(originalId, quote, this.sdk.operator);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Edit post (within 15-min window, free) */
    async editPost(postId, newContent) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.editPost(postId, newContent);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Delete post (free) */
    async deletePost(postId) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.deletePost(postId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Engagement ──────────────────────────────────────────────────────────
    /** Like a post (ETH fee) */
    async like(postId) {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_LIKE);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.like(postId, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Super Like — send any ETH amount */
    async superLike(postId, ethAmount) {
        if (ethAmount <= 0n)
            throw new Error('ETH amount must be > 0');
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.superLike(postId, this.sdk.operator, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Downvote a post (ETH fee) */
    async downvote(postId) {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_DOWNVOTE);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.downvote(postId, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Tip a post (send any ETH amount to the author) */
    async tipPost(postId, ethAmount) {
        if (ethAmount <= 0n)
            throw new Error('ETH amount must be > 0');
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.tipPost(postId, this.sdk.operator, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Social Graph ────────────────────────────────────────────────────────
    /** Follow a user (ETH fee) */
    async follow(userAddress) {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_FOLLOW);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.follow(userAddress, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Unfollow a user (free) */
    async unfollow(userAddress) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.unfollow(userAddress);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Block user (free) */
    async blockUser(userAddress) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.blockUser(userAddress);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Unblock user (free) */
    async unblockUser(userAddress) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.unblockUser(userAddress);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Profiles ────────────────────────────────────────────────────────────
    /** Create a profile (username fee varies by length) */
    async createProfile(username, metadataURI) {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        const fee = await contract.getUsernamePrice(username.length);
        const writeContract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await writeContract.createProfile(username, metadataURI, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Update profile metadata (free) */
    async updateProfile(metadataURI) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.updateProfile(metadataURI);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Pin a post to your profile (free) */
    async pinPost(postId) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.pinPost(postId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Premium ─────────────────────────────────────────────────────────────
    /** Boost profile visibility (daily rate) */
    async boostProfile(days) {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.AGORA_PROFILE_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.boostProfile(this.sdk.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Obtain a badge (0=Verified, 1=Premium, 2=Elite) */
    async obtainBadge(tier) {
        const actionIds = [ACTION_IDS.AGORA_BADGE_VERIFIED, ACTION_IDS.AGORA_BADGE_PREMIUM, ACTION_IDS.AGORA_BADGE_ELITE];
        if (tier < 0 || tier > 2)
            throw new Error('Badge tier must be 0-2');
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, actionIds[tier]);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.obtainBadge(tier, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /** Boost a post (tier: 0=Standard, 1=Featured; daily rate) */
    async boostPost(postId, tier, days) {
        const actionId = tier === 0 ? ACTION_IDS.AGORA_BOOST_STD : ACTION_IDS.AGORA_BOOST_FEAT;
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, actionId);
        const totalFee = fee * BigInt(days);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.agora, AGORA_ABI);
        const tx = await contract.boostPost(postId, tier, this.sdk.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Read ────────────────────────────────────────────────────────────────
    /** Get a single post */
    async getPost(postId) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        const p = await c.getPost(postId);
        return this._mapPost(p);
    }
    /** Get multiple posts in one RPC call */
    async getPostsBatch(postIds) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        const posts = await c.getPostsBatch(postIds);
        return posts.map((p) => this._mapPost(p));
    }
    /** Get user profile */
    async getUserProfile(address) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        const p = await c.getUserProfile(address);
        return {
            usernameHash: p[0], metadataURI: p[1], pinned: p[2], boosted: p[3],
            hasBadge: p[4], badgeTier: Number(p[5]), boostExp: p[6], badgeExp: p[7],
            followers: p[8], following: p[9],
        };
    }
    /** Check if user follows another */
    async isFollowing(follower, followed) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        return c.checkFollowing(follower, followed);
    }
    /** Check if user liked a post */
    async hasLiked(postId, user) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        return c.hasLiked(postId, user);
    }
    /** Check if username is available */
    async isUsernameAvailable(username) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        return c.isUsernameAvailable(username);
    }
    /** Get username price by length */
    async getUsernamePrice(length) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        return c.getUsernamePrice(length);
    }
    /** Get global statistics */
    async getGlobalStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.agora, AGORA_ABI);
        const s = await c.getGlobalStats();
        return { totalPosts: s[0], totalProfiles: s[1], tagCounts: s[2] };
    }
    // ── Private ─────────────────────────────────────────────────────────────
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
//# sourceMappingURL=agora.js.map