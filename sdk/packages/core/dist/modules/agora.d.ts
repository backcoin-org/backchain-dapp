import type { Backchain } from '../backchain.js';
import type { TxResult, PostView, UserProfile } from '../types/index.js';
export declare class AgoraModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Create a post.
     * Text (0) and Link (3) posts are FREE. Image (1), Video (2), Live (4) pay fees.
     *
     * @param content - Content hash or text
     * @param tag - Tag index (0-14)
     * @param contentType - 0=Text, 1=Image, 2=Video, 3=Link, 4=Live
     */
    createPost(content: string, tag?: number, contentType?: number): Promise<TxResult & {
        postId: bigint;
    }>;
    /** Reply to a post */
    createReply(parentId: bigint, content: string, contentType?: number): Promise<TxResult & {
        postId: bigint;
    }>;
    /** Repost (free) */
    createRepost(originalId: bigint, quote?: string): Promise<TxResult>;
    /** Edit post (within 15-min window, free) */
    editPost(postId: bigint, newContent: string): Promise<TxResult>;
    /** Delete post (free) */
    deletePost(postId: bigint): Promise<TxResult>;
    /** Like a post (ETH fee) */
    like(postId: bigint): Promise<TxResult>;
    /** Super Like — send any ETH amount */
    superLike(postId: bigint, ethAmount: bigint): Promise<TxResult>;
    /** Downvote a post (ETH fee) */
    downvote(postId: bigint): Promise<TxResult>;
    /** Tip a post (send any ETH amount to the author) */
    tipPost(postId: bigint, ethAmount: bigint): Promise<TxResult>;
    /** Follow a user (ETH fee) */
    follow(userAddress: string): Promise<TxResult>;
    /** Unfollow a user (free) */
    unfollow(userAddress: string): Promise<TxResult>;
    /** Block user (free) */
    blockUser(userAddress: string): Promise<TxResult>;
    /** Unblock user (free) */
    unblockUser(userAddress: string): Promise<TxResult>;
    /** Create a profile (username fee varies by length) */
    createProfile(username: string, metadataURI: string): Promise<TxResult>;
    /** Update profile metadata (free) */
    updateProfile(metadataURI: string): Promise<TxResult>;
    /** Pin a post to your profile (free) */
    pinPost(postId: bigint): Promise<TxResult>;
    /** Boost profile visibility (daily rate) */
    boostProfile(days: number): Promise<TxResult>;
    /** Obtain a badge (0=Verified, 1=Premium, 2=Elite) */
    obtainBadge(tier: number): Promise<TxResult>;
    /** Boost a post (tier: 0=Standard, 1=Featured; daily rate) */
    boostPost(postId: bigint, tier: number, days: number): Promise<TxResult>;
    /** Get a single post */
    getPost(postId: bigint): Promise<PostView>;
    /** Get multiple posts in one RPC call */
    getPostsBatch(postIds: bigint[]): Promise<PostView[]>;
    /** Get user profile */
    getUserProfile(address: string): Promise<UserProfile>;
    /** Check if user follows another */
    isFollowing(follower: string, followed: string): Promise<boolean>;
    /** Check if user liked a post */
    hasLiked(postId: bigint, user: string): Promise<boolean>;
    /** Check if username is available */
    isUsernameAvailable(username: string): Promise<boolean>;
    /** Get username price by length */
    getUsernamePrice(length: number): Promise<bigint>;
    /** Get global statistics */
    getGlobalStats(): Promise<{
        totalPosts: bigint;
        totalProfiles: bigint;
        tagCounts: bigint[];
    }>;
    private _mapPost;
}
//# sourceMappingURL=agora.d.ts.map