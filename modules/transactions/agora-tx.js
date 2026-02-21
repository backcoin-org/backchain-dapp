// modules/js/transactions/backchat-tx.js
// ✅ V3.0 - Agora V3 "The Forever Protocol" (ETH-only, zero hardcoded prices)
//
// V3.0 CHANGES:
// - ALL pricing via ecosystem.calculateFee (zero hardcoded ETH values)
// - Text/link posts are FREE (gas only). Only media (image/video/live) pays fees.
// - SuperLike: free-value (any amount > 0), 1 count per call, tracks cumulative ETH
// - Downvote: 1 per user per post, ecosystem fee (AGORA_DOWNVOTE)
// - editPost(postId, newContentHash) — 15 min window, free
// - blockUser / unblockUser — on-chain, free
// - getPostsBatch(ids) — batch read via PostView struct
// - getPost returns PostView struct (replaces getPost + getPostMeta)
// - getUserProfile returns 10 fields (added followers, following)
// - On-chain social graph: isFollowing, followerCount, followingCount
// - Post boost pricing via ecosystem fees (AGORA_BOOST_STD, AGORA_BOOST_FEAT)
// - Username pricing via ecosystem fees per length tier
//
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

            // V3: pricing via ecosystem governance per length tier
            usernameFee = await contract.getUsernamePrice(username.length);
            console.log('[Agora] Username fee:', ethers.formatEther(usernameFee), 'BNB');

            const { NetworkManager } = await import('../core/index.js');
            const balance = await NetworkManager.getProvider().getBalance(userAddress);
            if (balance < usernameFee + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(usernameFee + ethers.parseEther('0.001'))} BNB`);
            }
        },
        onSuccess, onError
    });
}

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
 * V3: Text/link posts are FREE. Only image/video/live charge fees.
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
        skipSimulation: true, fixedGasLimit: 2_000_000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createPost',
        args: () => [content, tag, contentType, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            if (!content || content.length === 0) throw new Error('Content is required');
            if (tag < 0 || tag > 14) throw new Error('Tag must be 0-14');
            // V3: text (0) and link (3) are FREE. Image/video/live pay fees.
            const isMedia = contentType === 1 || contentType === 2 || contentType === 4;
            if (isMedia) {
                const actionIds = { 1: 'AGORA_POST_IMAGE', 2: 'AGORA_POST_VIDEO', 4: 'AGORA_LIVE' };
                fee = await calculateFeeClientSide(ethers.id(actionIds[contentType]), 0n);
                console.log(`[Agora] Post fee (${actionIds[contentType]}):`, ethers.formatEther(fee), 'BNB');
            } else {
                fee = 0n;
                console.log('[Agora] Text/link post: FREE');
            }
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
 * V3: Text replies are FREE. Media replies pay fees.
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
        skipSimulation: true, fixedGasLimit: 2_000_000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createReply',
        args: () => [parentId, content, contentType, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            if (!content) throw new Error('Content is required');
            const isMedia = contentType === 1 || contentType === 2 || contentType === 4;
            if (isMedia) {
                fee = await calculateFeeClientSide(ethers.id('AGORA_REPLY'), 0n);
            } else {
                fee = 0n;
            }
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

export async function createRepost({
    originalPostId, quote = '', operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'CreateRepost', button,
        skipSimulation: true, fixedGasLimit: 1_000_000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'createRepost',
        args: () => [originalPostId, quote || '', resolveOperator(storedOperator)],
        // V3: reposts are free
        onSuccess, onError
    });
}

/**
 * V3 NEW: Edit a post within 15-minute window (free, gas only)
 */
export async function editPost({
    postId, newContent,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'EditPost', button,
        skipSimulation: true, fixedGasLimit: 2_000_000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'editPost',
        args: [postId, newContent],

        validate: async () => {
            if (!newContent || newContent.length === 0) throw new Error('Content is required');
        },
        onSuccess, onError
    });
}

// ============================================================================
// 5. ENGAGEMENT TRANSACTIONS
// ============================================================================

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
 * V3: SuperLike — send any amount > 0 ETH. 1 count per call, tracks cumulative ETH.
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
            if (amount <= 0n) throw new Error('SuperLike requires BNB > 0');
        },
        onSuccess, onError
    });
}

/**
 * V3: Downvote — 1 per user per post, ecosystem fee (AGORA_DOWNVOTE)
 */
export async function downvote({
    postId, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let fee = 0n;

    return await txEngine.execute({
        name: 'Downvote', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'downvote',
        args: () => [postId, resolveOperator(storedOperator)],
        get value() { return fee; },

        validate: async (signer, userAddress) => {
            const contract = await getAgoraContractReadOnly();
            const already = await contract.hasDownvoted(postId, userAddress);
            if (already) throw new Error('Already downvoted this post');
            fee = await calculateFeeClientSide(ethers.id('AGORA_DOWNVOTE'), 0n);
        },
        onSuccess, onError
    });
}

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
            // V3: check on-chain state
            const contract = await getAgoraContractReadOnly();
            const already = await contract.isFollowing(userAddress, toFollow);
            if (already) throw new Error('Already following this user');
            fee = await calculateFeeClientSide(ethers.id('AGORA_FOLLOW'), 0n);
        },
        onSuccess, onError
    });
}

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
 * V3 NEW: Block user on-chain (free, gas only)
 */
export async function blockUser({
    userAddress,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'BlockUser', button,
        skipSimulation: true, fixedGasLimit: 100000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'blockUser',
        args: [userAddress],
        onSuccess, onError
    });
}

/**
 * V3 NEW: Unblock user on-chain (free, gas only)
 */
export async function unblockUser({
    userAddress,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'UnblockUser', button,
        skipSimulation: true, fixedGasLimit: 100000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'unblockUser',
        args: [userAddress],
        onSuccess, onError
    });
}

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
    days = 1, operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;
    const actionId = window.ethers.id('AGORA_PROFILE_BOOST');
    const pricePerDay = await calculateFeeClientSide(actionId);
    const boostAmount = pricePerDay * BigInt(days);

    return await txEngine.execute({
        name: 'BoostProfile', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'boostProfile',
        args: () => [resolveOperator(storedOperator)],
        value: boostAmount,
        onSuccess, onError
    });
}

export async function obtainBadge({
    tier = 0, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    const badgeActions = ['AGORA_BADGE_VERIFIED', 'AGORA_BADGE_PREMIUM', 'AGORA_BADGE_ELITE'];
    const actionId = ethers.id(badgeActions[tier] || badgeActions[0]);
    const badgeFee = await calculateFeeClientSide(actionId);

    return await txEngine.execute({
        name: 'ObtainBadge', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'obtainBadge',
        args: () => [tier, resolveOperator(storedOperator)],
        value: badgeFee,
        onSuccess, onError
    });
}

// ============================================================================
// 7. REPORT, BOOST POST, TIP
// ============================================================================

export async function reportPost({
    postId, category = 0, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    const actionId = ethers.id('AGORA_REPORT');
    const reportFee = await calculateFeeClientSide(actionId);

    return await txEngine.execute({
        name: 'ReportPost', button,
        skipSimulation: true, fixedGasLimit: 200000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'reportPost',
        args: () => [postId, category, resolveOperator(storedOperator)],
        value: reportFee,

        validate: async (signer, userAddress) => {
            const contract = await getAgoraContractReadOnly();
            const alreadyReported = await contract.hasReported(postId, userAddress);
            if (alreadyReported) throw new Error('You already reported this post');
        },
        onSuccess, onError
    });
}

/**
 * V3: Post boost pricing via ecosystem fees (AGORA_BOOST_STD, AGORA_BOOST_FEAT)
 */
export async function boostPost({
    postId, tier = 0, days = 1, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    const actionName = tier === 1 ? 'AGORA_BOOST_FEAT' : 'AGORA_BOOST_STD';
    const pricePerDay = await calculateFeeClientSide(ethers.id(actionName));
    const boostAmount = pricePerDay * BigInt(days);

    return await txEngine.execute({
        name: 'BoostPost', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'boostPost',
        args: () => [postId, tier, resolveOperator(storedOperator)],
        value: boostAmount,

        validate: async () => {
            if (boostAmount <= 0n) throw new Error('Boost requires at least 1 day');
        },
        onSuccess, onError
    });
}

/**
 * V3: Boost cost estimate for UI (returns cost for N days at given tier)
 */
export async function getBoostCost(tier = 0, days = 1) {
    const ethers = window.ethers;
    const actionName = tier === 1 ? 'AGORA_BOOST_FEAT' : 'AGORA_BOOST_STD';
    const pricePerDay = await calculateFeeClientSide(ethers.id(actionName));
    const total = pricePerDay * BigInt(days);
    return { pricePerDay, total, formatted: ethers.formatEther(total) };
}

export async function tipPost({
    postId, ethAmount, operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;
    const amount = BigInt(ethAmount);

    return await txEngine.execute({
        name: 'TipPost', button,
        skipSimulation: true, fixedGasLimit: 250000n,
        getContract: async (signer) => getAgoraContract(signer),
        method: 'tipPost',
        args: () => [postId, resolveOperator(storedOperator)],
        value: amount,

        validate: async () => {
            if (amount <= 0n) throw new Error('Tip requires BNB > 0');
        },
        onSuccess, onError
    });
}

// ============================================================================
// 8. BATCH ACTIONS (Cart System)
// ============================================================================

/**
 * V3: Execute multiple likes/follows/downvotes in a single transaction.
 * @param {Array} actions - [{ type: 'like'|'follow'|'downvote', targetId }]
 * @param {BigInt} totalFee - Pre-calculated total ETH fee
 */
export async function batchActions({
    actions, totalFee, operator,
    button = null, onSuccess = null, onError = null
}) {
    let storedOperator = operator;

    // Map to contract format: actionType 1=like, 2=follow, 3=downvote
    const TYPE_MAP = { like: 1, follow: 2, downvote: 3 };
    const contractActions = actions.map(a => ({
        actionType: TYPE_MAP[a.type],
        targetId: a.type === 'follow'
            ? BigInt(a.targetId)  // address → uint256
            : BigInt(a.targetId)  // postId → uint256
    }));

    return await txEngine.execute({
        name: 'BatchActions', button,
        skipSimulation: true,
        fixedGasLimit: 300000n + 150000n * BigInt(actions.length),
        getContract: async (signer) => getAgoraContract(signer),
        method: 'batchActions',
        args: () => [contractActions, resolveOperator(storedOperator)],
        value: totalFee,

        validate: async () => {
            if (!actions || actions.length === 0) throw new Error('No actions to submit');
            if (actions.length > 50) throw new Error('Max 50 actions per batch');
        },
        onSuccess, onError
    });
}

// ============================================================================
// 9. READ FUNCTIONS
// ============================================================================

export async function getUsernamePrice(length) {
    const ethers = window.ethers;
    const contract = await getAgoraContractReadOnly();
    const fee = await contract.getUsernamePrice(length);
    return { fee, formatted: ethers.formatEther(fee) };
}

export const getUsernameFee = getUsernamePrice;

/**
 * V3: getPost returns PostView struct (replaces getPost + getPostMeta)
 */
export async function getPost(postId) {
    const contract = await getAgoraContractReadOnly();
    const p = await contract.getPost(postId);
    return {
        author: p.author || p[0],
        tag: Number(p.tag ?? p[1]),
        contentType: Number(p.contentType ?? p[2]),
        deleted: p.deleted ?? p[3],
        createdAt: Number(p.createdAt ?? p[4]),
        editedAt: Number(p.editedAt_ ?? p[5]),
        replyTo: Number(p.replyTo_ ?? p[6]),
        repostOf: Number(p.repostOf_ ?? p[7]),
        likes: Number(p.likes ?? p[8]),
        superLikes: Number(p.superLikes ?? p[9]),
        superLikeETH: p.superLikeETH ?? p[10] ?? 0n,
        downvotes: Number(p.downvotes ?? p[11]),
        replies: Number(p.replies ?? p[12]),
        reposts: Number(p.reposts ?? p[13]),
        reports: Number(p.reports ?? p[14]),
        tips: p.tips ?? p[15] ?? 0n,
        boostTier: Number(p.boostTier ?? p[16]),
        boostExpiry: Number(p.boostExpiry ?? p[17])
    };
}

/**
 * V3 NEW: Batch read posts — 1 RPC call for N posts
 */
export async function getPostsBatch(postIds) {
    const contract = await getAgoraContractReadOnly();
    const batch = await contract.getPostsBatch(postIds);
    return batch.map((p, i) => ({
        author: p.author || p[0],
        tag: Number(p.tag ?? p[1]),
        contentType: Number(p.contentType ?? p[2]),
        deleted: p.deleted ?? p[3],
        createdAt: Number(p.createdAt ?? p[4]),
        editedAt: Number(p.editedAt_ ?? p[5]),
        replyTo: Number(p.replyTo_ ?? p[6]),
        repostOf: Number(p.repostOf_ ?? p[7]),
        likes: Number(p.likes ?? p[8]),
        superLikes: Number(p.superLikes ?? p[9]),
        superLikeETH: p.superLikeETH ?? p[10] ?? 0n,
        downvotes: Number(p.downvotes ?? p[11]),
        replies: Number(p.replies ?? p[12]),
        reposts: Number(p.reposts ?? p[13]),
        reports: Number(p.reports ?? p[14]),
        tips: p.tips ?? p[15] ?? 0n,
        boostTier: Number(p.boostTier ?? p[16]),
        boostExpiry: Number(p.boostExpiry ?? p[17])
    }));
}

/**
 * V3: getPostMeta no longer exists — kept as alias for backward compatibility
 */
export async function getPostMeta(postId) {
    const p = await getPost(postId);
    return {
        reports: p.reports,
        illegalReports: 0,
        boostTier: p.boostTier,
        boostExpiry: p.boostExpiry,
        isBoosted: p.boostExpiry > Math.floor(Date.now() / 1000),
        boostSpent: 0n,
        tips: p.tips
    };
}

export async function getPostCount() {
    const contract = await getAgoraContractReadOnly();
    return Number(await contract.postCounter());
}

/**
 * V3: getUserProfile returns 10 fields (added followers, following)
 */
export async function getUserProfile(userAddress) {
    const contract = await getAgoraContractReadOnly();
    const p = await contract.getUserProfile(userAddress);
    return {
        usernameHash: p.usernameHash || p[0],
        metadataURI: p.metadataURI || p[1],
        pinnedPost: Number(p.pinned ?? p[2]),
        boosted: p.boosted ?? p[3],
        hasBadge: p.hasBadge ?? p[4],
        badgeTier: Number(p._badgeTier ?? p[5] ?? 0),
        boostExpiry: Number(p.boostExp ?? p[6]),
        badgeExpiry: Number(p.badgeExp ?? p[7]),
        followers: Number(p.followers ?? p[8] ?? 0),
        following: Number(p.following ?? p[9] ?? 0)
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

/**
 * V3 NEW: Check if user has downvoted a post
 */
export async function hasUserDownvoted(postId, userAddress) {
    const contract = await getAgoraContractReadOnly();
    return await contract.hasDownvoted(postId, userAddress);
}

/**
 * V3 NEW: Check if user A is following user B (on-chain)
 */
export async function checkFollowing(a, b) {
    const contract = await getAgoraContractReadOnly();
    return await contract.checkFollowing(a, b);
}

/**
 * V3 NEW: Check if user A has blocked user B (on-chain)
 */
export async function checkBlocked(a, b) {
    const contract = await getAgoraContractReadOnly();
    return await contract.checkBlocked(a, b);
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
    return Number(profile.boostExp ?? profile[6]);
}

export async function getBadgeExpiry(userAddress) {
    const contract = await getAgoraContractReadOnly();
    const profile = await contract.getUserProfile(userAddress);
    return Number(profile.badgeExp ?? profile[7]);
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
// 9. EXPORT
// ============================================================================

export const BackchatTx = {
    // Profile
    createProfile, updateProfile,
    // Content
    createPost, createReply, createRepost, editPost, deletePost, pinPost, changeTag,
    // Engagement
    like, superLike, downvote, follow, unfollow,
    // Batch (Cart System)
    batchActions,
    // Social (V3)
    blockUser, unblockUser,
    // Reports, Boosts, Tips
    reportPost, boostPost, getBoostCost, tipPost,
    // Premium
    boostProfile, obtainBadge,
    // Read
    getUsernamePrice, getUsernameFee,
    getPost, getPostsBatch, getPostMeta, getPostCount, getUserProfile,
    isUsernameAvailable, hasUserLiked, hasUserDownvoted,
    checkFollowing, checkBlocked,
    isProfileBoosted, hasTrustBadge,
    getBoostExpiry, getBadgeExpiry,
    getGlobalStats, getOperatorStats, getVersion
};

// Alias for new naming convention
export const AgoraTx = BackchatTx;

export default BackchatTx;
