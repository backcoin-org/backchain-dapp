// modules/js/transactions/backchat-tx.js
// ✅ V9.0 - Updated for Agora V9 (Immutable Social Protocol, ETH-only)
//
// CHANGES V9.0:
// - Renamed: Backchat → Agora, backchat → agora, backchatABI → agoraABI
// - All fees via ecosystem.calculateFee (ETH only, Tier 1)
// - No BKC tips — all interactions are ETH
// - createPost(content, tag uint8, contentType uint8, operator) — new tag system
// - createReply(parentId, content, contentType, operator) — no tip, inherits parent tag
// - createRepost(originalId, contentHash, operator) — quote repost
// - createProfile(username, metadataURI, operator) — no displayName/bio, uses IPFS
// - updateProfile(metadataURI) — no displayName/bio
// - like(postId, operator) — no tip, 1 per user
// - superLike(postId, operator) — 100 gwei per, unlimited
// - downvote(postId, operator) — 100 gwei per, unlimited (NEW)
// - deletePost(postId) — soft delete (NEW)
// - pinPost(postId) — 1 per user (NEW)
// - No referral system, no withdraw, no getPendingBalance
// - getUserProfile returns 7-tuple
// - getGlobalStats returns (totalPosts, totalProfiles, tagCounts[15])
// - getPost returns 12 fields
// - getUsernameFee → getUsernamePrice
//
// ============================================================================
// V9 FEE STRUCTURE (ETH only, Tier 1):
// - Posts/replies/reposts/likes: ecosystem.calculateFee(ACTION_*, 0)
// - SuperLike/Downvote: 100 gwei per vote (unlimited)
// - Username: length-based pricing
// - Boost: 0.0005 ETH per day
// - Badge: 0.001 ETH for 1 year
// ============================================================================

import { txEngine, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses, agoraABI } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const agora = addresses?.agora || contractAddresses?.agora || window.contractAddresses?.agora;
    if (!agora) throw new Error('Agora contract address not loaded');
    return { AGORA: agora };
}

const AGORA_ABI = agoraABI;

// ============================================================================
// 2. HELPERS
// ============================================================================

function getAgoraContract(signer) {
    return new window.ethers.Contract(getContracts().AGORA, AGORA_ABI, signer);
}

async function getAgoraContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    return new window.ethers.Contract(getContracts().AGORA, AGORA_ABI, NetworkManager.getProvider());
}

// ============================================================================
// 3. PROFILE TRANSACTIONS
// ============================================================================

/**
 * Creates a new user profile with username
 * V9: createProfile(username, metadataURI, operator) — no displayName/bio
 */
export async function createProfile({
    username, metadataURI = '', operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let usernameFee = 0n;

    return await txEngine.execute({
        name: 'CreateProfile', button,
        skipSimulation: true, fixedGasLimit: 300000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createProfile',
        args: () => [username, metadataURI || '', resolveOperator(storedOperator)],
        get value() { return usernameFee; },

        validate: async (signer, userAddress) => {
            const contract = await getAgoraContractReadOnly();

            if (!username || username.length < 1 || username.length > 15) throw new Error('Username must be 1-15 characters');
            if (!/^[a-z0-9_]+$/.test(username)) throw new Error('Username: lowercase letters, numbers, underscores only');

            const available = await contract.isUsernameAvailable(username);
            if (!available) throw new Error('Username is already taken');

            usernameFee = await contract.getUsernamePrice(username.length);
            console.log('[Agora] Username fee:', ethers.formatEther(usernameFee), 'ETH');

            const { NetworkManager } = await import('../core/index.js');
            const balance = await NetworkManager.getProvider().getBalance(userAddress);
            if (balance < usernameFee + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient ETH. Need ~${ethers.formatEther(usernameFee + ethers.parseEther('0.001'))} ETH`);
            }
        },
        onSuccess, onError
    });
}

/**
 * Updates user profile metadata
 * V9: updateProfile(metadataURI) — free, only gas
 */
export async function updateProfile({
    metadataURI,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'UpdateProfile', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'updateProfile',
        args: [metadataURI || ''],
        onSuccess, onError
    });
}

// ============================================================================
// 4. CONTENT TRANSACTIONS
// ============================================================================

/**
 * Creates a new post
 * V9: createPost(contentHash, tag, contentType, operator)
 */
export async function createPost({
    content, tag = 0, contentType = 0, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let fee = 0n;

    return await txEngine.execute({
        name: 'CreatePost', button,
        skipSimulation: true, fixedGasLimit: 300000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createPost',
        args: () => [content, tag, contentType, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            if (!content || content.length === 0) throw new Error('Content is required');
            if (tag < 0 || tag > 14) throw new Error('Tag must be 0-14');
            fee = await calculateFeeClientSide(ethers.id('AGORA_POST'), 0n);
            console.log('[Agora] Post fee:', ethers.formatEther(fee), 'ETH');
        },

        onSuccess: async (receipt) => {
            let postId = null;
            try {
                const iface = new ethers.Interface(AGORA_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'PostCreated') { postId = Number(parsed.args[0]); break; }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, postId);
        },
        onError
    });
}

/**
 * Creates a reply to an existing post
 * V9: createReply(parentId, contentHash, contentType, operator)
 */
export async function createReply({
    parentId, content, contentType = 0, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let fee = 0n;

    return await txEngine.execute({
        name: 'CreateReply', button,
        skipSimulation: true, fixedGasLimit: 350000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createReply',
        args: () => [parentId, content, contentType, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            if (!content) throw new Error('Content is required');
            fee = await calculateFeeClientSide(ethers.id('AGORA_REPLY'), 0n);
        },

        onSuccess: async (receipt) => {
            let postId = null;
            try {
                const iface = new ethers.Interface(AGORA_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'ReplyCreated') { postId = Number(parsed.args[0]); break; }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, postId);
        },
        onError
    });
}

/**
 * Reposts an existing post (optionally with quote)
 * V9: createRepost(originalId, contentHash, operator)
 */
export async function createRepost({
    originalPostId, quote = '', operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let fee = 0n;

    return await txEngine.execute({
        name: 'CreateRepost', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createRepost',
        args: () => [originalPostId, quote || '', resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async () => {
            fee = await calculateFeeClientSide(ethers.id('AGORA_REPOST'), 0n);
        },
        onSuccess, onError
    });
}

// ============================================================================
// 5. ENGAGEMENT TRANSACTIONS
// ============================================================================

/**
 * Like a post (1 per user per post)
 * V9: like(postId, operator)
 */
export async function like({
    postId, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let fee = 0n;

    return await txEngine.execute({
        name: 'Like', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'like',
        args: () => [postId, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            const contract = await getAgoraContractReadOnly();
            const alreadyLiked = await contract.hasLiked(postId, userAddress);
            if (alreadyLiked) throw new Error('Already liked this post');
            fee = await calculateFeeClientSide(ethers.id('AGORA_LIKE'), 0n);
        },
        onSuccess, onError
    });
}

/**
 * Super like a post (100 gwei per, unlimited)
 * V9: superLike(postId, operator) payable — multiples of 100 gwei
 */
export async function superLike({
    postId, ethAmount, operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;
    const amount = BigInt(ethAmount);

    return await txEngine.execute({
        name: 'SuperLike', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'superLike',
        args: () => [postId, resolveOperator(storedOperator)],
        value: amount,

        validate: async () => {
            if (amount < 100000000n) throw new Error('Minimum super like is 100 gwei'); // 100 gwei
        },
        onSuccess, onError
    });
}

/**
 * Downvote a post (100 gwei per, unlimited) — V9 NEW
 */
export async function downvote({
    postId, ethAmount, operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;
    const amount = BigInt(ethAmount);

    return await txEngine.execute({
        name: 'Downvote', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'downvote',
        args: () => [postId, resolveOperator(storedOperator)],
        value: amount,

        validate: async () => {
            if (amount < 100000000n) throw new Error('Minimum downvote is 100 gwei');
        },
        onSuccess, onError
    });
}

/**
 * Follow a user
 * V9: follow(user, operator) payable
 */
export async function follow({
    toFollow, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let fee = 0n;

    return await txEngine.execute({
        name: 'Follow', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'follow',
        args: () => [toFollow, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            if (!toFollow || toFollow === '0x0000000000000000000000000000000000000000') throw new Error('Invalid address');
            if (toFollow.toLowerCase() === userAddress.toLowerCase()) throw new Error('Cannot follow yourself');
            fee = await calculateFeeClientSide(ethers.id('AGORA_FOLLOW'), 0n);
        },
        onSuccess, onError
    });
}

/**
 * Unfollow a user (free, only gas)
 */
export async function unfollow({
    toUnfollow,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'Unfollow', button,
        skipSimulation: true, fixedGasLimit: 150000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'unfollow',
        args: [toUnfollow],
        onSuccess, onError
    });
}

/**
 * Delete a post (soft delete, free) — V9 NEW
 */
export async function deletePost({
    postId,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'DeletePost', button,
        skipSimulation: true, fixedGasLimit: 150000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'deletePost',
        args: [postId],
        onSuccess, onError
    });
}

/**
 * Pin a post to profile (1 per user, free) — V9 NEW
 */
export async function pinPost({
    postId,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'PinPost', button,
        skipSimulation: true, fixedGasLimit: 150000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'pinPost',
        args: [postId],
        onSuccess, onError
    });
}

/**
 * Change a post's tag (free, only gas) — V9
 */
export async function changeTag({
    postId, newTag,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'ChangeTag', button,
        skipSimulation: true, fixedGasLimit: 100000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'changeTag',
        args: [postId, newTag],
        onSuccess, onError
    });
}

// ============================================================================
// 6. PREMIUM TRANSACTIONS
// ============================================================================

export async function boostProfile({
    ethAmount, operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;
    const boostAmount = BigInt(ethAmount);

    return await txEngine.execute({
        name: 'BoostProfile', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'boostProfile',
        args: () => [resolveOperator(storedOperator)],
        value: boostAmount,

        validate: async () => {
            const ethers = window.ethers;
            if (boostAmount < ethers.parseEther('0.0005')) throw new Error('Minimum boost is 0.0005 ETH');
        },
        onSuccess, onError
    });
}

export async function obtainBadge({
    operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    const badgeFee = ethers.parseEther('0.001');

    return await txEngine.execute({
        name: 'ObtainBadge', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'obtainBadge',
        args: () => [resolveOperator(storedOperator)],
        value: badgeFee,
        onSuccess, onError
    });
}

// ============================================================================
// 7. READ FUNCTIONS
// ============================================================================

export async function getUsernamePrice(length) {
    const ethers = window.ethers;
    const contract = await getAgoraContractReadOnly();
    const fee = await contract.getUsernamePrice(length);
    return { fee, formatted: ethers.formatEther(fee) };
}

// Backward-compatible alias
export const getUsernameFee = getUsernamePrice;

export async function getPost(postId) {
    const contract = await getAgoraContractReadOnly();
    const p = await contract.getPost(postId);
    return {
        author: p.author, tag: Number(p.tag), contentType: Number(p.contentType),
        deleted: p.deleted, createdAt: Number(p.createdAt),
        replyTo: Number(p._replyTo), repostOf: Number(p._repostOf),
        likes: Number(p.likes), superLikes: Number(p.superLikes),
        downvotes: Number(p.downvotes), replies: Number(p.replies), reposts: Number(p.reposts)
    };
}

export async function getPostCount() {
    const contract = await getAgoraContractReadOnly();
    return Number(await contract.postCounter());
}

export async function getUserProfile(userAddress) {
    const contract = await getAgoraContractReadOnly();
    const p = await contract.getUserProfile(userAddress);
    return {
        usernameHash: p.usernameHash, metadataURI: p.metadataURI,
        pinnedPost: Number(p.pinned), boosted: p.boosted, hasBadge: p.hasBadge,
        boostExpiry: Number(p.boostExp), badgeExpiry: Number(p.badgeExp)
    };
}

export async function isUsernameAvailable(username) {
    const contract = await getAgoraContractReadOnly();
    return await contract.isUsernameAvailable(username);
}

export async function hasUserLiked(postId, userAddress) {
    const contract = await getAgoraContractReadOnly();
    return await contract.hasLiked(postId, userAddress);
}

export async function isProfileBoosted(userAddress) {
    const contract = await getAgoraContractReadOnly();
    return await contract.isProfileBoosted(userAddress);
}

export async function hasTrustBadge(userAddress) {
    const contract = await getAgoraContractReadOnly();
    return await contract.hasTrustBadge(userAddress);
}

export async function getBoostExpiry(userAddress) {
    const contract = await getAgoraContractReadOnly();
    const profile = await contract.getUserProfile(userAddress);
    return Number(profile.boostExp);
}

export async function getBadgeExpiry(userAddress) {
    const contract = await getAgoraContractReadOnly();
    const profile = await contract.getUserProfile(userAddress);
    return Number(profile.badgeExp);
}

export async function getGlobalStats() {
    const contract = await getAgoraContractReadOnly();
    const stats = await contract.getGlobalStats();
    return {
        totalPosts: Number(stats._totalPosts || stats[0]),
        totalProfiles: Number(stats._totalProfiles || stats[1]),
        tagCounts: (stats._tagCounts || stats[2]).map(c => Number(c))
    };
}

export async function getOperatorStats(operatorAddress) {
    const contract = await getAgoraContractReadOnly();
    const stats = await contract.getOperatorStats(operatorAddress);
    return {
        posts: Number(stats.posts_ || stats[0]),
        engagement: Number(stats.engagement || stats[1])
    };
}

export async function getVersion() {
    const contract = await getAgoraContractReadOnly();
    return await contract.version();
}

// ============================================================================
// 8. EXPORT
// ============================================================================

export const BackchatTx = {
    // Profile
    createProfile, updateProfile,
    // Content
    createPost, createReply, createRepost, deletePost, pinPost, changeTag,
    // Engagement
    like, superLike, downvote, follow, unfollow,
    // Premium
    boostProfile, obtainBadge,
    // Read
    getUsernamePrice, getUsernameFee,
    getPost, getPostCount, getUserProfile,
    isUsernameAvailable, hasUserLiked,
    isProfileBoosted, hasTrustBadge,
    getBoostExpiry, getBadgeExpiry,
    getGlobalStats, getOperatorStats, getVersion
};

export default BackchatTx;
