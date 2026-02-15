import type { BackchainContext } from '@backchain/core';
import type { TxResult, PostView, UserProfile } from '@backchain/core';
export declare class AgoraModule {
    private ctx;
    constructor(ctx: BackchainContext);
    createPost(content: string, tag?: number, contentType?: number): Promise<TxResult & {
        postId: bigint;
    }>;
    createReply(parentId: bigint, content: string, contentType?: number): Promise<TxResult & {
        postId: bigint;
    }>;
    createRepost(originalId: bigint, quote?: string): Promise<TxResult>;
    editPost(postId: bigint, newContent: string): Promise<TxResult>;
    deletePost(postId: bigint): Promise<TxResult>;
    like(postId: bigint): Promise<TxResult>;
    superLike(postId: bigint, ethAmount: bigint): Promise<TxResult>;
    downvote(postId: bigint): Promise<TxResult>;
    tipPost(postId: bigint, ethAmount: bigint): Promise<TxResult>;
    follow(userAddress: string): Promise<TxResult>;
    unfollow(userAddress: string): Promise<TxResult>;
    blockUser(userAddress: string): Promise<TxResult>;
    unblockUser(userAddress: string): Promise<TxResult>;
    createProfile(username: string, metadataURI: string): Promise<TxResult>;
    updateProfile(metadataURI: string): Promise<TxResult>;
    pinPost(postId: bigint): Promise<TxResult>;
    boostProfile(days: number): Promise<TxResult>;
    obtainBadge(tier: number): Promise<TxResult>;
    boostPost(postId: bigint, tier: number, days: number): Promise<TxResult>;
    getPost(postId: bigint): Promise<PostView>;
    getPostsBatch(postIds: bigint[]): Promise<PostView[]>;
    getUserProfile(address: string): Promise<UserProfile>;
    isFollowing(follower: string, followed: string): Promise<boolean>;
    hasLiked(postId: bigint, user: string): Promise<boolean>;
    isUsernameAvailable(username: string): Promise<boolean>;
    getUsernamePrice(length: number): Promise<bigint>;
    getGlobalStats(): Promise<{
        totalPosts: bigint;
        totalProfiles: bigint;
        tagCounts: bigint[];
    }>;
    private _mapPost;
}
//# sourceMappingURL=index.d.ts.map