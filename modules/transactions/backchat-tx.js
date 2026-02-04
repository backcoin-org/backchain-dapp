// modules/js/transactions/backchat-tx.js
// ✅ PRODUCTION V2.0 - Rewritten for Backchat V7.0.0
// 
// COMPLETE REWRITE - Old module was for different contract!
// 
// BACKCHAT V7 FEATURES:
// - Decentralized Social Protocol (posts, replies, reposts)
// - Like / Super Like (organic trending)
// - Follow / Unfollow
// - Profile (username registration, display name, bio)
// - Premium (profile boost, trust badge)
// - BKC Tips (90% creator, 10% mining ecosystem)
// - ETH distribution (40% creator, 30% operator, 30% treasury)
// - Graceful degradation (works even if ecosystem contracts fail)
//
// ============================================================================
// FEE STRUCTURE:
// - All actions pay ETH fee (20% of gas cost)
// - With creator (reply, like, follow): 40/30/30 split
// - Without creator (post, username, boost): 60/40 operator/treasury
// - BKC tips: 90% creator, 10% MiningManager
// ============================================================================

import { txEngine } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const backchat = addresses?.backchat || contractAddresses?.backchat || window.contractAddresses?.backchat;
    const bkcToken = addresses?.bkcToken || contractAddresses?.bkcToken || window.contractAddresses?.bkcToken;
    
    if (!backchat) throw new Error('Backchat contract address not loaded');
    return { BACKCHAT: backchat, BKC_TOKEN: bkcToken };
}

/**
 * Backchat V7 ABI - Complete rewrite for V7.0.0
 */
const BACKCHAT_ABI = [
    // ─────────────────────────────────────────────────────────────────────────
    // PROFILE FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    'function createProfile(string username, string displayName, string bio, address operator) external payable',
    'function updateProfile(string displayName, string bio) external',
    
    // ─────────────────────────────────────────────────────────────────────────
    // CONTENT FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    'function createPost(string content, string mediaCID, address operator) external payable returns (uint256 postId)',
    'function createReply(uint256 parentId, string content, string mediaCID, address operator, uint256 tipBkc) external payable returns (uint256 postId)',
    'function createRepost(uint256 originalPostId, address operator, uint256 tipBkc) external payable returns (uint256 postId)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // ENGAGEMENT FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    'function like(uint256 postId, address operator, uint256 tipBkc) external payable',
    'function superLike(uint256 postId, address operator, uint256 tipBkc) external payable',
    'function follow(address toFollow, address operator, uint256 tipBkc) external payable',
    'function unfollow(address toUnfollow) external',
    
    // ─────────────────────────────────────────────────────────────────────────
    // PREMIUM FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    'function boostProfile(address operator) external payable',
    'function obtainBadge(address operator) external payable',
    
    // ─────────────────────────────────────────────────────────────────────────
    // WITHDRAWAL
    // ─────────────────────────────────────────────────────────────────────────
    'function withdraw() external',
    
    // ─────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS - Fees
    // ─────────────────────────────────────────────────────────────────────────
    'function calculateFee(uint256 gasEstimate) view returns (uint256)',
    'function getCurrentFees() view returns (uint256 postFee, uint256 replyFee, uint256 likeFee, uint256 followFee, uint256 repostFee, uint256 superLikeMin, uint256 boostMin, uint256 badgeFee_)',
    'function getUsernameFee(uint256 length) pure returns (uint256)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS - State
    // ─────────────────────────────────────────────────────────────────────────
    'function postCounter() view returns (uint256)',
    'function postAuthor(uint256 postId) view returns (address)',
    'function pendingEth(address user) view returns (uint256)',
    'function usernameOwner(bytes32 usernameHash) view returns (address)',
    'function hasLiked(uint256 postId, address user) view returns (bool)',
    'function boostExpiry(address user) view returns (uint256)',
    'function badgeExpiry(address user) view returns (uint256)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS - Helpers
    // ─────────────────────────────────────────────────────────────────────────
    'function isProfileBoosted(address user) view returns (bool)',
    'function hasTrustBadge(address user) view returns (bool)',
    'function hasUserLiked(uint256 postId, address user) view returns (bool)',
    'function getPendingBalance(address user) view returns (uint256)',
    'function isUsernameAvailable(string username) view returns (bool)',
    'function getUsernameOwner(string username) view returns (address)',
    'function version() pure returns (string)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // IMMUTABLES
    // ─────────────────────────────────────────────────────────────────────────
    'function bkcToken() view returns (address)',
    'function ecosystemManager() view returns (address)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────
    'event ProfileCreated(address indexed user, bytes32 indexed usernameHash, string username, string displayName, string bio, uint256 ethPaid, address indexed operator)',
    'event ProfileUpdated(address indexed user, string displayName, string bio)',
    'event PostCreated(uint256 indexed postId, address indexed author, string content, string mediaCID, address indexed operator)',
    'event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, string content, string mediaCID, uint256 tipBkc, address operator)',
    'event RepostCreated(uint256 indexed newPostId, uint256 indexed originalPostId, address indexed reposter, uint256 tipBkc, address operator)',
    'event Liked(uint256 indexed postId, address indexed user, uint256 tipBkc, address indexed operator)',
    'event SuperLiked(uint256 indexed postId, address indexed user, uint256 ethAmount, uint256 tipBkc, address indexed operator)',
    'event Followed(address indexed follower, address indexed followed, uint256 tipBkc, address indexed operator)',
    'event Unfollowed(address indexed follower, address indexed followed)',
    'event ProfileBoosted(address indexed user, uint256 amount, uint256 expiresAt, address indexed operator)',
    'event BadgeObtained(address indexed user, uint256 expiresAt, address indexed operator)',
    'event Withdrawal(address indexed user, uint256 amount)',
    'event TipProcessed(address indexed from, address indexed creator, uint256 totalBkc, uint256 creatorShare, uint256 miningShare, address indexed operator)'
];

// ============================================================================
// 2. HELPERS
// ============================================================================

function getBackchatContract(signer) {
    return new window.ethers.Contract(getContracts().BACKCHAT, BACKCHAT_ABI, signer);
}

async function getBackchatContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    return new window.ethers.Contract(getContracts().BACKCHAT, BACKCHAT_ABI, NetworkManager.getProvider());
}

// ============================================================================
// 3. PROFILE TRANSACTIONS
// ============================================================================

/**
 * Creates a new user profile with username
 * Fee depends on username length (shorter = more expensive)
 */
export async function createProfile({
    username, displayName, bio, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let usernameFee = 0n;

    return await txEngine.execute({
        name: 'CreateProfile', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'createProfile',
        args: () => [username, displayName || '', bio || '', resolveOperator(storedOperator)],
        get value() { return usernameFee; },
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            
            // Check username availability
            const available = await contract.isUsernameAvailable(username);
            if (!available) throw new Error('Username is already taken');
            
            // Check username format (1-15 chars, a-z, 0-9, underscore)
            if (!username || username.length < 1 || username.length > 15) {
                throw new Error('Username must be 1-15 characters');
            }
            if (!/^[a-z0-9_]+$/.test(username)) {
                throw new Error('Username can only contain lowercase letters, numbers, and underscores');
            }
            
            // Get username fee
            usernameFee = await contract.getUsernameFee(username.length);
            console.log('[Backchat] Username fee:', ethers.formatEther(usernameFee), 'ETH');
            
            // Check ETH balance
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
 * Updates user profile (free, only gas)
 */
export async function updateProfile({
    displayName, bio,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'UpdateProfile', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'updateProfile',
        args: [displayName || '', bio || ''],
        
        validate: async () => {
            if (displayName && displayName.length > 30) throw new Error('Display name max 30 chars');
            if (bio && bio.length > 160) throw new Error('Bio max 160 chars');
        },
        onSuccess, onError
    });
}

// ============================================================================
// 4. CONTENT TRANSACTIONS
// ============================================================================

/**
 * Creates a new post
 */
export async function createPost({
    content, mediaCID, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let postFee = 0n;

    return await txEngine.execute({
        name: 'CreatePost', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'createPost',
        args: () => [content, mediaCID || '', resolveOperator(storedOperator)],
        get value() { return postFee; },
        
        validate: async (signer, userAddress) => {
            if (!content || content.length === 0) throw new Error('Content is required');
            if (content.length > 500) throw new Error('Content max 500 chars');
            
            const contract = getBackchatContract(signer);
            const fees = await contract.getCurrentFees();
            postFee = fees.postFee;
            
            const { NetworkManager } = await import('../core/index.js');
            const balance = await NetworkManager.getProvider().getBalance(userAddress);
            if (balance < postFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');
        },
        
        onSuccess: async (receipt) => {
            let postId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'PostCreated') { postId = Number(parsed.args.postId); break; }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, postId);
        },
        onError
    });
}

/**
 * Creates a reply to an existing post with optional BKC tip
 */
export async function createReply({
    parentId, content, mediaCID, tipBkc, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    let replyFee = 0n;
    const tipAmount = tipBkc ? BigInt(tipBkc) : 0n;

    return await txEngine.execute({
        name: 'CreateReply', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'createReply',
        args: () => [parentId, content, mediaCID || '', resolveOperator(storedOperator), tipAmount],
        get value() { return replyFee; },
        
        // BKC approval for tip
        get approval() {
            if (tipAmount > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.BACKCHAT, amount: tipAmount };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            if (!content) throw new Error('Content is required');
            if (content.length > 500) throw new Error('Content max 500 chars');
            
            const contract = getBackchatContract(signer);
            
            // Check parent post exists
            const author = await contract.postAuthor(parentId);
            if (author === '0x0000000000000000000000000000000000000000') throw new Error('Post not found');
            
            const fees = await contract.getCurrentFees();
            replyFee = fees.replyFee;
            
            // Check balances
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            if (ethBalance < replyFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');
            
            if (tipAmount > 0n) {
                const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, ['function balanceOf(address) view returns (uint256)'], provider);
                const bkcBalance = await bkcContract.balanceOf(userAddress);
                if (bkcBalance < tipAmount) throw new Error('Insufficient BKC for tip');
            }
        },
        
        onSuccess: async (receipt) => {
            let postId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'ReplyCreated') { postId = Number(parsed.args.postId); break; }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, postId);
        },
        onError
    });
}

/**
 * Reposts an existing post with optional BKC tip
 */
export async function createRepost({
    originalPostId, tipBkc, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    let repostFee = 0n;
    const tipAmount = tipBkc ? BigInt(tipBkc) : 0n;

    return await txEngine.execute({
        name: 'CreateRepost', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'createRepost',
        args: () => [originalPostId, resolveOperator(storedOperator), tipAmount],
        get value() { return repostFee; },
        
        get approval() {
            if (tipAmount > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.BACKCHAT, amount: tipAmount };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const author = await contract.postAuthor(originalPostId);
            if (author === '0x0000000000000000000000000000000000000000') throw new Error('Post not found');
            
            const fees = await contract.getCurrentFees();
            repostFee = fees.repostFee;
        },
        onSuccess, onError
    });
}

// ============================================================================
// 5. ENGAGEMENT TRANSACTIONS
// ============================================================================

/**
 * Likes a post (limited to one per user per post)
 */
export async function like({
    postId, tipBkc, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    let likeFee = 0n;
    const tipAmount = tipBkc ? BigInt(tipBkc) : 0n;

    return await txEngine.execute({
        name: 'Like', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'like',
        args: () => [postId, resolveOperator(storedOperator), tipAmount],
        get value() { return likeFee; },
        
        get approval() {
            if (tipAmount > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.BACKCHAT, amount: tipAmount };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            
            const author = await contract.postAuthor(postId);
            if (author === '0x0000000000000000000000000000000000000000') throw new Error('Post not found');
            
            const alreadyLiked = await contract.hasUserLiked(postId, userAddress);
            if (alreadyLiked) throw new Error('Already liked this post');
            
            const fees = await contract.getCurrentFees();
            likeFee = fees.likeFee;
        },
        onSuccess, onError
    });
}

/**
 * Super likes a post (unlimited, contributes to trending)
 * Minimum 0.0001 ETH, no maximum
 */
export async function superLike({
    postId, ethAmount, tipBkc, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    const superLikeAmount = BigInt(ethAmount);
    const tipAmount = tipBkc ? BigInt(tipBkc) : 0n;

    return await txEngine.execute({
        name: 'SuperLike', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'superLike',
        args: () => [postId, resolveOperator(storedOperator), tipAmount],
        value: superLikeAmount,
        
        get approval() {
            if (tipAmount > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.BACKCHAT, amount: tipAmount };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            
            const author = await contract.postAuthor(postId);
            if (author === '0x0000000000000000000000000000000000000000') throw new Error('Post not found');
            
            const fees = await contract.getCurrentFees();
            if (superLikeAmount < fees.superLikeMin) {
                throw new Error(`Minimum super like is ${ethers.formatEther(fees.superLikeMin)} ETH`);
            }
        },
        onSuccess, onError
    });
}

/**
 * Follows a user
 */
export async function follow({
    toFollow, tipBkc, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    let storedOperator = operator;
    let followFee = 0n;
    const tipAmount = tipBkc ? BigInt(tipBkc) : 0n;

    return await txEngine.execute({
        name: 'Follow', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'follow',
        args: () => [toFollow, resolveOperator(storedOperator), tipAmount],
        get value() { return followFee; },
        
        get approval() {
            if (tipAmount > 0n) {
                return { token: contracts.BKC_TOKEN, spender: contracts.BACKCHAT, amount: tipAmount };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            if (!toFollow || toFollow === '0x0000000000000000000000000000000000000000') {
                throw new Error('Invalid address');
            }
            if (toFollow.toLowerCase() === userAddress.toLowerCase()) {
                throw new Error('Cannot follow yourself');
            }
            
            const contract = getBackchatContract(signer);
            const fees = await contract.getCurrentFees();
            followFee = fees.followFee;
        },
        onSuccess, onError
    });
}

/**
 * Unfollows a user (free, only gas)
 */
export async function unfollow({
    toUnfollow,
    button = null, onSuccess = null, onError = null
}) {
    return await txEngine.execute({
        name: 'Unfollow', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'unfollow',
        args: [toUnfollow],
        onSuccess, onError
    });
}

// ============================================================================
// 6. PREMIUM TRANSACTIONS
// ============================================================================

/**
 * Boosts profile visibility
 * Duration = (ETH / 0.0005) days
 */
export async function boostProfile({
    ethAmount, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    const boostAmount = BigInt(ethAmount);

    return await txEngine.execute({
        name: 'BoostProfile', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'boostProfile',
        args: () => [resolveOperator(storedOperator)],
        value: boostAmount,
        
        validate: async (signer) => {
            const contract = getBackchatContract(signer);
            const fees = await contract.getCurrentFees();
            if (boostAmount < fees.boostMin) {
                throw new Error(`Minimum boost is ${ethers.formatEther(fees.boostMin)} ETH`);
            }
        },
        onSuccess, onError
    });
}

/**
 * Obtains a trust badge for 1 year
 */
export async function obtainBadge({
    operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    let storedOperator = operator;
    let badgeFee = 0n;

    return await txEngine.execute({
        name: 'ObtainBadge', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'obtainBadge',
        args: () => [resolveOperator(storedOperator)],
        get value() { return badgeFee; },
        
        validate: async (signer) => {
            const contract = getBackchatContract(signer);
            const fees = await contract.getCurrentFees();
            badgeFee = fees.badgeFee_;
        },
        onSuccess, onError
    });
}

// ============================================================================
// 7. WITHDRAWAL
// ============================================================================

/**
 * Withdraws accumulated ETH earnings
 */
export async function withdraw({
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;

    return await txEngine.execute({
        name: 'Withdraw', button,
        getContract: async (signer) => getBackchatContract(signer),
        method: 'withdraw',
        args: [],
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const pending = await contract.getPendingBalance(userAddress);
            if (pending === 0n) throw new Error('Nothing to withdraw');
            console.log('[Backchat] Withdrawing:', ethers.formatEther(pending), 'ETH');
        },
        onSuccess, onError
    });
}

// ============================================================================
// 8. READ FUNCTIONS
// ============================================================================

export async function getCurrentFees() {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const fees = await contract.getCurrentFees();
    return {
        postFee: fees.postFee, postFeeFormatted: ethers.formatEther(fees.postFee),
        replyFee: fees.replyFee, replyFeeFormatted: ethers.formatEther(fees.replyFee),
        likeFee: fees.likeFee, likeFeeFormatted: ethers.formatEther(fees.likeFee),
        followFee: fees.followFee, followFeeFormatted: ethers.formatEther(fees.followFee),
        repostFee: fees.repostFee, repostFeeFormatted: ethers.formatEther(fees.repostFee),
        superLikeMin: fees.superLikeMin, superLikeMinFormatted: ethers.formatEther(fees.superLikeMin),
        boostMin: fees.boostMin, boostMinFormatted: ethers.formatEther(fees.boostMin),
        badgeFee: fees.badgeFee_, badgeFeeFormatted: ethers.formatEther(fees.badgeFee_)
    };
}

export async function getUsernameFee(length) {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const fee = await contract.getUsernameFee(length);
    return { fee, formatted: ethers.formatEther(fee) };
}

export async function getPostAuthor(postId) {
    const contract = await getBackchatContractReadOnly();
    return await contract.postAuthor(postId);
}

export async function getPostCount() {
    const contract = await getBackchatContractReadOnly();
    return Number(await contract.postCounter());
}

export async function getPendingBalance(userAddress) {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const balance = await contract.getPendingBalance(userAddress);
    return { balance, formatted: ethers.formatEther(balance) };
}

export async function isUsernameAvailable(username) {
    const contract = await getBackchatContractReadOnly();
    return await contract.isUsernameAvailable(username);
}

export async function getUsernameOwner(username) {
    const contract = await getBackchatContractReadOnly();
    return await contract.getUsernameOwner(username);
}

export async function hasUserLiked(postId, userAddress) {
    const contract = await getBackchatContractReadOnly();
    return await contract.hasUserLiked(postId, userAddress);
}

export async function isProfileBoosted(userAddress) {
    const contract = await getBackchatContractReadOnly();
    return await contract.isProfileBoosted(userAddress);
}

export async function hasTrustBadge(userAddress) {
    const contract = await getBackchatContractReadOnly();
    return await contract.hasTrustBadge(userAddress);
}

export async function getBoostExpiry(userAddress) {
    const contract = await getBackchatContractReadOnly();
    return Number(await contract.boostExpiry(userAddress));
}

export async function getBadgeExpiry(userAddress) {
    const contract = await getBackchatContractReadOnly();
    return Number(await contract.badgeExpiry(userAddress));
}

export async function getVersion() {
    const contract = await getBackchatContractReadOnly();
    return await contract.version();
}

// ============================================================================
// 9. EXPORT
// ============================================================================

export const BackchatTx = {
    // Profile
    createProfile, updateProfile,
    // Content
    createPost, createReply, createRepost,
    // Engagement
    like, superLike, follow, unfollow,
    // Premium
    boostProfile, obtainBadge,
    // Financial
    withdraw,
    // Read
    getCurrentFees, getUsernameFee,
    getPostAuthor, getPostCount,
    getPendingBalance, isUsernameAvailable, getUsernameOwner,
    hasUserLiked, isProfileBoosted, hasTrustBadge,
    getBoostExpiry, getBadgeExpiry, getVersion
};

export default BackchatTx;