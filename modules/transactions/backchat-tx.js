// modules/js/transactions/backchat-tx.js
// ✅ PRODUCTION V1.0 - Backchat Social Network Transactions
// 
// This module handles all Backchat contract transactions:
// - Posts (create, edit, delete)
// - Comments (create, reply, delete)
// - Moderation (vote on posts/comments)
// - Community Notes (propose, vote)
// - Tips (send, claim)
// - Boost (ETH boost for posts)
// - Private Messages (E2EE)
// - KYC verification
//
// ============================================================================
// TRANSACTION FLOW:
// All transactions require BKC platform fee (default: 1 BKC)
// Tip transactions split between creator and mining pool
// ============================================================================

import { txEngine } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 */
function getContracts() {
    const backchat = addresses?.backchat || 
                     contractAddresses?.backchat ||
                     window.contractAddresses?.backchat;
    
    const bkcToken = addresses?.bkcToken ||
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!backchat) {
        console.error('❌ Backchat address not found!', { addresses, contractAddresses });
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    console.log('[BackchatTx] Using addresses:', { backchat, bkcToken });
    
    return {
        BACKCHAT: backchat,
        BKC_TOKEN: bkcToken
    };
}

/**
 * Backchat ABI - All contract functions
 */
const BACKCHAT_ABI = [
    // ═══════════════════════════════════════════════════════════════════════════
    // POSTS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'createPost',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_content', type: 'string' },
            { name: '_ipfsHash', type: 'string' }
        ],
        outputs: [{ name: 'postId', type: 'uint256' }]
    },
    {
        name: 'editPost',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_postId', type: 'uint256' },
            { name: '_newContent', type: 'string' },
            { name: '_newIpfsHash', type: 'string' }
        ],
        outputs: []
    },
    {
        name: 'deletePost',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'getPost',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: [{
            name: '',
            type: 'tuple',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'author', type: 'address' },
                { name: 'content', type: 'string' },
                { name: 'ipfsHash', type: 'string' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'editedAt', type: 'uint256' },
                { name: 'exists', type: 'bool' },
                { name: 'deleted', type: 'bool' }
            ]
        }]
    },
    {
        name: 'getPostModerationScore',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: [
            { name: 'safeVotes', type: 'uint256' },
            { name: 'unsafeVotes', type: 'uint256' },
            { name: 'score', type: 'int256' },
            { name: 'status', type: 'uint8' }
        ]
    },
    {
        name: 'getAuthorPosts',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_author', type: 'address' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
        name: 'getPostComments',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
        name: 'getPostNotes',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // COMMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'createComment',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_postId', type: 'uint256' },
            { name: '_content', type: 'string' },
            { name: '_ipfsHash', type: 'string' }
        ],
        outputs: [{ name: 'commentId', type: 'uint256' }]
    },
    {
        name: 'replyToComment',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_commentId', type: 'uint256' },
            { name: '_content', type: 'string' },
            { name: '_ipfsHash', type: 'string' }
        ],
        outputs: [{ name: 'replyId', type: 'uint256' }]
    },
    {
        name: 'deleteComment',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_commentId', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'getComment',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_commentId', type: 'uint256' }],
        outputs: [{
            name: '',
            type: 'tuple',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'postId', type: 'uint256' },
                { name: 'parentCommentId', type: 'uint256' },
                { name: 'author', type: 'address' },
                { name: 'content', type: 'string' },
                { name: 'ipfsHash', type: 'string' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'exists', type: 'bool' },
                { name: 'deleted', type: 'bool' }
            ]
        }]
    },
    {
        name: 'getCommentModerationScore',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_commentId', type: 'uint256' }],
        outputs: [
            { name: 'safeVotes', type: 'uint256' },
            { name: 'unsafeVotes', type: 'uint256' },
            { name: 'score', type: 'int256' },
            { name: 'status', type: 'uint8' }
        ]
    },
    {
        name: 'getCommentReplies',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_commentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MODERATION (VOTING)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'voteOnPost',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_postId', type: 'uint256' },
            { name: '_voteSafe', type: 'bool' }
        ],
        outputs: []
    },
    {
        name: 'voteOnComment',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_commentId', type: 'uint256' },
            { name: '_voteSafe', type: 'bool' }
        ],
        outputs: []
    },
    {
        name: 'hasVotedOnPost',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: '_user', type: 'address' },
            { name: '_postId', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'hasVotedOnComment',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: '_user', type: 'address' },
            { name: '_commentId', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // COMMUNITY NOTES
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'proposeNote',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_postId', type: 'uint256' },
            { name: '_content', type: 'string' },
            { name: '_ipfsHash', type: 'string' }
        ],
        outputs: [{ name: 'noteId', type: 'uint256' }]
    },
    {
        name: 'voteOnNote',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_noteId', type: 'uint256' },
            { name: '_believe', type: 'bool' }
        ],
        outputs: []
    },
    {
        name: 'getNote',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_noteId', type: 'uint256' }],
        outputs: [{
            name: '',
            type: 'tuple',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'postId', type: 'uint256' },
                { name: 'author', type: 'address' },
                { name: 'content', type: 'string' },
                { name: 'ipfsHash', type: 'string' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'exists', type: 'bool' }
            ]
        }]
    },
    {
        name: 'getNoteVotingScore',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_noteId', type: 'uint256' }],
        outputs: [
            { name: 'believeVotes', type: 'uint256' },
            { name: 'dontBelieveVotes', type: 'uint256' },
            { name: 'score', type: 'int256' },
            { name: 'status', type: 'uint8' }
        ]
    },
    {
        name: 'hasVotedOnNote',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: '_user', type: 'address' },
            { name: '_noteId', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPS (CREATOR ECONOMY)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'sendTip',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_creator', type: 'address' },
            { name: '_amount', type: 'uint256' },
            { name: '_postId', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'claimRewards',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: []
    },
    {
        name: 'creatorBalance',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_creator', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'getCreatorStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_creator', type: 'address' }],
        outputs: [{
            name: '',
            type: 'tuple',
            components: [
                { name: 'totalPosts', type: 'uint256' },
                { name: 'totalComments', type: 'uint256' },
                { name: 'totalTipsReceived', type: 'uint256' },
                { name: 'totalTipsClaimed', type: 'uint256' },
                { name: 'reputationScore', type: 'uint256' }
            ]
        }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // POST BOOST (ETH)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'boostPost',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'postBoostAmount',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE MESSAGES (E2EE)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'setPublicKey',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_publicKey', type: 'bytes' }],
        outputs: []
    },
    {
        name: 'sendPrivateMessage',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_to', type: 'address' },
            { name: '_encryptedContent', type: 'string' },
            { name: '_encryptedIpfsHash', type: 'string' }
        ],
        outputs: [{ name: 'messageId', type: 'uint256' }]
    },
    {
        name: 'replyToMessage',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_messageId', type: 'uint256' },
            { name: '_encryptedContent', type: 'string' },
            { name: '_encryptedIpfsHash', type: 'string' }
        ],
        outputs: [{ name: 'replyId', type: 'uint256' }]
    },
    {
        name: 'getPublicKey',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [{ name: '', type: 'bytes' }]
    },
    {
        name: 'getMessage',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_messageId', type: 'uint256' }],
        outputs: [
            { name: 'sender', type: 'address' },
            { name: 'recipient', type: 'address' },
            { name: 'encryptedContent', type: 'string' },
            { name: 'encryptedIpfsHash', type: 'string' },
            { name: 'sentAt', type: 'uint256' },
            { name: 'conversationId', type: 'uint256' },
            { name: 'parentMessageId', type: 'uint256' }
        ]
    },
    {
        name: 'getUserConversations',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
        name: 'getConversationMessages',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_conversationId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // KYC
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'verifyKYC',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: []
    },
    {
        name: 'getKYCStatus',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [
            { name: 'verified', type: 'bool' },
            { name: 'level', type: 'uint8' },
            { name: 'expiresAt', type: 'uint256' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // BURN INACTIVE
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'burnInactiveBalance',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_creator', type: 'address' }],
        outputs: []
    },
    {
        name: 'lastActivity',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIG & STATS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'platformFee',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'minTipAmount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'tipMiningFeeBips',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'bipsDenominator',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'kycRequired',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'hasBoosterAccess',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'getTotals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'posts', type: 'uint256' },
            { name: 'comments', type: 'uint256' },
            { name: 'notes', type: 'uint256' },
            { name: 'messages', type: 'uint256' },
            { name: 'conversations', type: 'uint256' }
        ]
    },
    {
        name: 'getFinancialStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'platformFees', type: 'uint256' },
            { name: 'tipsProcessed', type: 'uint256' },
            { name: 'tipsToCreators', type: 'uint256' },
            { name: 'tipsToMining', type: 'uint256' },
            { name: 'boostCollected', type: 'uint256' },
            { name: 'burnedInactive', type: 'uint256' }
        ]
    },
    {
        name: 'postTipsReceived',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_postId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'PostCreated',
        type: 'event',
        inputs: [
            { name: 'postId', type: 'uint256', indexed: true },
            { name: 'author', type: 'address', indexed: true },
            { name: 'content', type: 'string', indexed: false },
            { name: 'ipfsHash', type: 'string', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'CommentCreated',
        type: 'event',
        inputs: [
            { name: 'commentId', type: 'uint256', indexed: true },
            { name: 'postId', type: 'uint256', indexed: true },
            { name: 'parentCommentId', type: 'uint256', indexed: false },
            { name: 'author', type: 'address', indexed: true },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'ContentVoted',
        type: 'event',
        inputs: [
            { name: 'contentId', type: 'uint256', indexed: true },
            { name: 'isPost', type: 'bool', indexed: false },
            { name: 'voter', type: 'address', indexed: true },
            { name: 'votedSafe', type: 'bool', indexed: false },
            { name: 'newScore', type: 'int256', indexed: false },
            { name: 'newStatus', type: 'uint8', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'NoteProposed',
        type: 'event',
        inputs: [
            { name: 'noteId', type: 'uint256', indexed: true },
            { name: 'postId', type: 'uint256', indexed: true },
            { name: 'author', type: 'address', indexed: true },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'TipSent',
        type: 'event',
        inputs: [
            { name: 'sender', type: 'address', indexed: true },
            { name: 'creator', type: 'address', indexed: true },
            { name: 'postId', type: 'uint256', indexed: true },
            { name: 'totalAmount', type: 'uint256', indexed: false },
            { name: 'toCreator', type: 'uint256', indexed: false },
            { name: 'toMining', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'RewardsClaimed',
        type: 'event',
        inputs: [
            { name: 'creator', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'PostBoosted',
        type: 'event',
        inputs: [
            { name: 'postId', type: 'uint256', indexed: true },
            { name: 'booster', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'totalBoost', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'PrivateMessageSent',
        type: 'event',
        inputs: [
            { name: 'messageId', type: 'uint256', indexed: true },
            { name: 'conversationId', type: 'uint256', indexed: true },
            { name: 'sender', type: 'address', indexed: true },
            { name: 'recipient', type: 'address', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'PublicKeyRegistered',
        type: 'event',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    }
];

// ============================================================================
// 2. ENUMS (match contract)
// ============================================================================

/**
 * Content visibility status based on community voting
 */
export const ContentStatus = {
    Normal: 0,    // Score in neutral range
    Trusted: 1,   // Score >= thresholdTrusted (highlighted)
    Warning: 2,   // Score <= -thresholdWarning (flagged)
    Hidden: 3     // Score <= -thresholdHidden (collapsed)
};

/**
 * Community note approval status
 */
export const NoteStatus = {
    Pending: 0,   // Under review
    Approved: 1,  // Accepted by community
    Rejected: 2   // Rejected by community
};

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Backchat contract instance with signer (for write operations)
 */
function getBackchatContract(signer) {
    const ethers = window.ethers;
    
    if (!ethers) {
        throw new Error('ethers.js not loaded');
    }
    
    if (!signer) {
        throw new Error('Signer is required for write operations');
    }
    
    const contracts = getContracts();
    
    console.log('[BackchatTx] Creating contract with signer:', {
        address: contracts.BACKCHAT,
        hasSigner: !!signer
    });
    
    const contract = new ethers.Contract(contracts.BACKCHAT, BACKCHAT_ABI, signer);
    
    console.log('[BackchatTx] Contract created successfully');
    
    return contract;
}

/**
 * Creates Backchat contract instance with provider (for read operations)
 */
async function getBackchatContractReadOnly() {
    const ethers = window.ethers;
    
    if (!ethers) {
        throw new Error('ethers.js not loaded');
    }
    
    try {
        const { NetworkManager } = await import('../core/index.js');
        const provider = NetworkManager.getProvider();
        
        if (!provider) {
            throw new Error('Provider not available');
        }
        
        const contracts = getContracts();
        const contract = new ethers.Contract(contracts.BACKCHAT, BACKCHAT_ABI, provider);
        
        return contract;
    } catch (error) {
        console.warn('[BackchatTx] Failed to get read-only contract:', error.message);
        throw error;
    }
}

/**
 * Pre-fetches platform fee for approval
 */
async function getPlatformFee() {
    try {
        const contract = await getBackchatContractReadOnly();
        const fee = await contract.platformFee();
        return fee;
    } catch (e) {
        console.warn('[BackchatTx] Could not fetch platform fee:', e.message);
        const ethers = window.ethers;
        return ethers.parseEther('1'); // Default 1 BKC
    }
}

// ============================================================================
// 4. TRANSACTION FUNCTIONS - POSTS
// ============================================================================

/**
 * Creates a new public post
 * 
 * @param {Object} params - Post parameters
 * @param {string} params.content - Post text content
 * @param {string} [params.ipfsHash] - IPFS hash for media
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receipt, postId)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function createPost({
    content,
    ipfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (!content && !ipfsHash) {
        throw new Error('Content or IPFS hash is required');
    }
    
    // Pre-fetch fee for approval
    const feeAmount = await getPlatformFee();
    console.log('[BackchatTx] Platform fee:', ethers.formatEther(feeAmount), 'BKC');

    return await txEngine.execute({
        name: 'CreatePost',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'createPost',
        args: [content || '', ipfsHash || ''],
        
        // Approval for platform fee
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        onSuccess: async (receipt) => {
            console.log('[BackchatTx] Post created:', receipt.hash);
            
            // Extract postId from event
            let postId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'PostCreated') {
                            postId = Number(parsed.args.postId);
                            console.log('[BackchatTx] Created post ID:', postId);
                            break;
                        }
                    } catch {}
                }
            } catch (e) {
                console.warn('[BackchatTx] Could not parse event logs:', e.message);
            }

            if (onSuccess) {
                onSuccess(receipt, postId);
            }
        },
        
        onError: (error) => {
            console.error('[BackchatTx] CreatePost failed:', error);
            if (onError) {
                onError(error);
            }
        }
    });
}

/**
 * Edits an existing post
 * 
 * @param {Object} params - Edit parameters
 * @param {number|bigint} params.postId - Post ID to edit
 * @param {string} params.newContent - New content
 * @param {string} [params.newIpfsHash] - New IPFS hash
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function editPost({
    postId,
    newContent,
    newIpfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (postId === undefined || postId === null) {
        throw new Error('Post ID is required');
    }
    
    if (!newContent && !newIpfsHash) {
        throw new Error('New content or IPFS hash is required');
    }

    return await txEngine.execute({
        name: 'EditPost',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'editPost',
        args: [BigInt(postId), newContent || '', newIpfsHash || ''],
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const post = await contract.getPost(postId);
            
            if (!post.exists) {
                throw new Error('Post not found');
            }
            
            if (post.deleted) {
                throw new Error('Post has been deleted');
            }
            
            if (post.author.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the author can edit this post');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Deletes a post (soft delete)
 * 
 * @param {Object} params - Delete parameters
 * @param {number|bigint} params.postId - Post ID to delete
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function deletePost({
    postId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (postId === undefined || postId === null) {
        throw new Error('Post ID is required');
    }

    return await txEngine.execute({
        name: 'DeletePost',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'deletePost',
        args: [BigInt(postId)],
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const post = await contract.getPost(postId);
            
            if (!post.exists || post.deleted) {
                throw new Error('Post not found or already deleted');
            }
            
            if (post.author.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the author can delete this post');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 5. TRANSACTION FUNCTIONS - COMMENTS
// ============================================================================

/**
 * Creates a comment on a post
 * 
 * @param {Object} params - Comment parameters
 * @param {number|bigint} params.postId - Post ID to comment on
 * @param {string} params.content - Comment content
 * @param {string} [params.ipfsHash] - IPFS hash for media
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback (receipt, commentId)
 * @param {Function} [params.onError] - Error callback
 */
export async function createComment({
    postId,
    content,
    ipfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (postId === undefined || postId === null) {
        throw new Error('Post ID is required');
    }
    
    if (!content && !ipfsHash) {
        throw new Error('Content or IPFS hash is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'CreateComment',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'createComment',
        args: [BigInt(postId), content || '', ipfsHash || ''],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer) => {
            const contract = getBackchatContract(signer);
            const post = await contract.getPost(postId);
            
            if (!post.exists || post.deleted) {
                throw new Error('Post not found or deleted');
            }
        },
        
        onSuccess: async (receipt) => {
            let commentId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'CommentCreated') {
                            commentId = Number(parsed.args.commentId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, commentId);
            }
        },
        onError
    });
}

/**
 * Replies to a comment (threading)
 * 
 * @param {Object} params - Reply parameters
 * @param {number|bigint} params.commentId - Comment ID to reply to
 * @param {string} params.content - Reply content
 * @param {string} [params.ipfsHash] - IPFS hash
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback (receipt, replyId)
 * @param {Function} [params.onError] - Error callback
 */
export async function replyToComment({
    commentId,
    content,
    ipfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (commentId === undefined || commentId === null) {
        throw new Error('Comment ID is required');
    }
    
    if (!content && !ipfsHash) {
        throw new Error('Content or IPFS hash is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'ReplyToComment',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'replyToComment',
        args: [BigInt(commentId), content || '', ipfsHash || ''],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer) => {
            const contract = getBackchatContract(signer);
            const comment = await contract.getComment(commentId);
            
            if (!comment.exists || comment.deleted) {
                throw new Error('Comment not found or deleted');
            }
        },
        
        onSuccess: async (receipt) => {
            let replyId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'CommentCreated') {
                            replyId = Number(parsed.args.commentId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, replyId);
            }
        },
        onError
    });
}

/**
 * Deletes a comment (soft delete)
 */
export async function deleteComment({
    commentId,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (commentId === undefined || commentId === null) {
        throw new Error('Comment ID is required');
    }

    return await txEngine.execute({
        name: 'DeleteComment',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'deleteComment',
        args: [BigInt(commentId)],
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const comment = await contract.getComment(commentId);
            
            if (!comment.exists || comment.deleted) {
                throw new Error('Comment not found or already deleted');
            }
            
            if (comment.author.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the author can delete this comment');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 6. TRANSACTION FUNCTIONS - MODERATION (VOTING)
// ============================================================================

/**
 * Votes on a post (SAFE or UNSAFE)
 * 
 * @param {Object} params - Vote parameters
 * @param {number|bigint} params.postId - Post ID
 * @param {boolean} params.voteSafe - true = SAFE, false = UNSAFE
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function voteOnPost({
    postId,
    voteSafe,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const contracts = getContracts();
    
    if (postId === undefined || postId === null) {
        throw new Error('Post ID is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'VoteOnPost',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'voteOnPost',
        args: [BigInt(postId), voteSafe],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            
            const post = await contract.getPost(postId);
            if (!post.exists || post.deleted) {
                throw new Error('Post not found or deleted');
            }
            
            const hasVoted = await contract.hasVotedOnPost(userAddress, postId);
            if (hasVoted) {
                throw new Error('You have already voted on this post');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Votes on a comment (SAFE or UNSAFE)
 */
export async function voteOnComment({
    commentId,
    voteSafe,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const contracts = getContracts();
    
    if (commentId === undefined || commentId === null) {
        throw new Error('Comment ID is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'VoteOnComment',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'voteOnComment',
        args: [BigInt(commentId), voteSafe],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            
            const comment = await contract.getComment(commentId);
            if (!comment.exists || comment.deleted) {
                throw new Error('Comment not found or deleted');
            }
            
            const hasVoted = await contract.hasVotedOnComment(userAddress, commentId);
            if (hasVoted) {
                throw new Error('You have already voted on this comment');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 7. TRANSACTION FUNCTIONS - COMMUNITY NOTES
// ============================================================================

/**
 * Proposes a community note on a post
 * 
 * @param {Object} params - Note parameters
 * @param {number|bigint} params.postId - Post ID to annotate
 * @param {string} params.content - Note content (fact-check, context)
 * @param {string} [params.ipfsHash] - IPFS hash for evidence
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback (receipt, noteId)
 * @param {Function} [params.onError] - Error callback
 */
export async function proposeNote({
    postId,
    content,
    ipfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (postId === undefined || postId === null) {
        throw new Error('Post ID is required');
    }
    
    if (!content) {
        throw new Error('Note content is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'ProposeNote',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'proposeNote',
        args: [BigInt(postId), content, ipfsHash || ''],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer) => {
            const contract = getBackchatContract(signer);
            const post = await contract.getPost(postId);
            
            if (!post.exists || post.deleted) {
                throw new Error('Post not found or deleted');
            }
        },
        
        onSuccess: async (receipt) => {
            let noteId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'NoteProposed') {
                            noteId = Number(parsed.args.noteId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, noteId);
            }
        },
        onError
    });
}

/**
 * Votes on a community note (BELIEVE or DON'T BELIEVE)
 */
export async function voteOnNote({
    noteId,
    believe,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const contracts = getContracts();
    
    if (noteId === undefined || noteId === null) {
        throw new Error('Note ID is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'VoteOnNote',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'voteOnNote',
        args: [BigInt(noteId), believe],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            
            const note = await contract.getNote(noteId);
            if (!note.exists) {
                throw new Error('Note not found');
            }
            
            const hasVoted = await contract.hasVotedOnNote(userAddress, noteId);
            if (hasVoted) {
                throw new Error('You have already voted on this note');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 8. TRANSACTION FUNCTIONS - TIPS
// ============================================================================

/**
 * Sends a tip to a creator
 * Tip is split: creator receives (100% - tipMiningFeeBips), mining receives rest
 * 
 * @param {Object} params - Tip parameters
 * @param {string} params.creator - Creator address
 * @param {string|bigint} params.amount - Tip amount in BKC (wei)
 * @param {number|bigint} [params.postId=0] - Optional post ID (0 for general tip)
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function sendTip({
    creator,
    amount,
    postId = 0,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (!creator || !ethers.isAddress(creator)) {
        throw new Error('Valid creator address is required');
    }
    
    const tipAmount = BigInt(amount);
    if (tipAmount <= 0n) {
        throw new Error('Tip amount must be greater than 0');
    }

    return await txEngine.execute({
        name: 'SendTip',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'sendTip',
        args: [creator, tipAmount, BigInt(postId)],
        
        // Approval for tip amount
        approval: contracts.BKC_TOKEN ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: tipAmount
        } : null,
        
        validate: async (signer, userAddress) => {
            if (creator.toLowerCase() === userAddress.toLowerCase()) {
                throw new Error('Cannot tip yourself');
            }
            
            const contract = getBackchatContract(signer);
            const minTip = await contract.minTipAmount();
            
            if (tipAmount < minTip) {
                throw new Error(`Minimum tip is ${ethers.formatEther(minTip)} BKC`);
            }
            
            // Validate post if specified
            if (postId > 0) {
                const post = await contract.getPost(postId);
                if (!post.exists) {
                    throw new Error('Post not found');
                }
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Claims accumulated tip balance
 * Requires: positive balance, Booster NFT, KYC (if enabled)
 */
export async function claimRewards({
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    return await txEngine.execute({
        name: 'ClaimRewards',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'claimRewards',
        args: [],
        
        validate: async (signer, userAddress) => {
            const ethers = window.ethers;
            const contract = getBackchatContract(signer);
            
            const balance = await contract.creatorBalance(userAddress);
            if (balance === 0n) {
                throw new Error('No rewards to claim');
            }
            
            const hasBooster = await contract.hasBoosterAccess(userAddress);
            if (!hasBooster) {
                throw new Error('Booster NFT required to claim rewards');
            }
            
            const kycRequired = await contract.kycRequired();
            if (kycRequired) {
                const [verified, , expiresAt] = await contract.getKYCStatus(userAddress);
                const now = Math.floor(Date.now() / 1000);
                
                if (!verified || (expiresAt > 0 && now > Number(expiresAt))) {
                    throw new Error('KYC verification required to claim rewards');
                }
            }
            
            console.log('[BackchatTx] Claiming rewards:', ethers.formatEther(balance), 'BKC');
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 9. TRANSACTION FUNCTIONS - POST BOOST
// ============================================================================

/**
 * Boosts a post with ETH for visibility
 * 100% of ETH goes to Treasury
 * 
 * @param {Object} params - Boost parameters
 * @param {number|bigint} params.postId - Post ID to boost
 * @param {string|bigint} params.amount - ETH amount in wei
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function boostPost({
    postId,
    amount,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (postId === undefined || postId === null) {
        throw new Error('Post ID is required');
    }
    
    const boostAmount = BigInt(amount);
    if (boostAmount <= 0n) {
        throw new Error('Boost amount must be greater than 0');
    }

    return await txEngine.execute({
        name: 'BoostPost',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'boostPost',
        args: [BigInt(postId)],
        
        // ETH value
        value: boostAmount,
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const post = await contract.getPost(postId);
            
            if (!post.exists || post.deleted) {
                throw new Error('Post not found or deleted');
            }
            
            // Check ETH balance
            const provider = signer.provider;
            const balance = await provider.getBalance(userAddress);
            
            if (balance < boostAmount) {
                throw new Error(`Insufficient ETH. Need ${ethers.formatEther(boostAmount)} ETH`);
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 10. TRANSACTION FUNCTIONS - PRIVATE MESSAGES
// ============================================================================

/**
 * Registers public key for E2EE messaging
 * 
 * @param {Object} params - Key parameters
 * @param {string|Uint8Array} params.publicKey - User's public encryption key
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 */
export async function setPublicKey({
    publicKey,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (!publicKey) {
        throw new Error('Public key is required');
    }
    
    // Convert to bytes if string
    let keyBytes;
    if (typeof publicKey === 'string') {
        keyBytes = ethers.toUtf8Bytes(publicKey);
    } else {
        keyBytes = publicKey;
    }

    return await txEngine.execute({
        name: 'SetPublicKey',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'setPublicKey',
        args: [keyBytes],
        
        onSuccess,
        onError
    });
}

/**
 * Sends an encrypted private message
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.to - Recipient address
 * @param {string} params.encryptedContent - Encrypted message content
 * @param {string} [params.encryptedIpfsHash] - Encrypted IPFS hash
 * @param {HTMLElement} [params.button] - Button element
 * @param {Function} [params.onSuccess] - Success callback (receipt, messageId)
 * @param {Function} [params.onError] - Error callback
 */
export async function sendPrivateMessage({
    to,
    encryptedContent,
    encryptedIpfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (!to || !ethers.isAddress(to)) {
        throw new Error('Valid recipient address is required');
    }
    
    if (!encryptedContent) {
        throw new Error('Message content is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'SendPrivateMessage',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'sendPrivateMessage',
        args: [to, encryptedContent, encryptedIpfsHash || ''],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer, userAddress) => {
            if (to.toLowerCase() === userAddress.toLowerCase()) {
                throw new Error('Cannot message yourself');
            }
            
            const contract = getBackchatContract(signer);
            const recipientKey = await contract.getPublicKey(to);
            
            if (!recipientKey || recipientKey.length === 0 || recipientKey === '0x') {
                throw new Error('Recipient has not registered a public key');
            }
        },
        
        onSuccess: async (receipt) => {
            let messageId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'PrivateMessageSent') {
                            messageId = Number(parsed.args.messageId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, messageId);
            }
        },
        onError
    });
}

/**
 * Replies to a private message
 */
export async function replyToMessage({
    messageId,
    encryptedContent,
    encryptedIpfsHash = '',
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    if (messageId === undefined || messageId === null) {
        throw new Error('Message ID is required');
    }
    
    if (!encryptedContent) {
        throw new Error('Message content is required');
    }
    
    const feeAmount = await getPlatformFee();

    return await txEngine.execute({
        name: 'ReplyToMessage',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'replyToMessage',
        args: [BigInt(messageId), encryptedContent, encryptedIpfsHash || ''],
        
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.BACKCHAT,
            amount: feeAmount
        } : null,
        
        validate: async (signer, userAddress) => {
            const contract = getBackchatContract(signer);
            const msg = await contract.getMessage(messageId);
            
            // msg returns tuple: [sender, recipient, ...]
            const sender = msg[0];
            const recipient = msg[1];
            
            if (sender === '0x0000000000000000000000000000000000000000') {
                throw new Error('Message not found');
            }
            
            if (sender.toLowerCase() !== userAddress.toLowerCase() && 
                recipient.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You are not a participant in this conversation');
            }
        },
        
        onSuccess: async (receipt) => {
            let replyId = null;
            try {
                const iface = new ethers.Interface(BACKCHAT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'PrivateMessageSent') {
                            replyId = Number(parsed.args.messageId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, replyId);
            }
        },
        onError
    });
}

// ============================================================================
// 11. TRANSACTION FUNCTIONS - KYC & BURN
// ============================================================================

/**
 * Verifies KYC from external provider and caches result
 */
export async function verifyKYC({
    userAddress,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (!userAddress || !ethers.isAddress(userAddress)) {
        throw new Error('Valid user address is required');
    }

    return await txEngine.execute({
        name: 'VerifyKYC',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'verifyKYC',
        args: [userAddress],
        
        onSuccess,
        onError
    });
}

/**
 * Burns balance of inactive account
 * Anyone can call after inactivityBurnPeriod expires
 */
export async function burnInactiveBalance({
    creatorAddress,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    if (!creatorAddress || !ethers.isAddress(creatorAddress)) {
        throw new Error('Valid creator address is required');
    }

    return await txEngine.execute({
        name: 'BurnInactiveBalance',
        button,
        
        getContract: async (signer) => getBackchatContract(signer),
        method: 'burnInactiveBalance',
        args: [creatorAddress],
        
        validate: async (signer) => {
            const contract = getBackchatContract(signer);
            
            const balance = await contract.creatorBalance(creatorAddress);
            if (balance === 0n) {
                throw new Error('No balance to burn');
            }
            
            // Check inactivity period (would need to fetch inactivityBurnPeriod)
            // For now, let the contract handle this validation
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 12. READ FUNCTIONS
// ============================================================================

/**
 * Gets post by ID
 */
export async function getPost(postId) {
    const contract = await getBackchatContractReadOnly();
    const post = await contract.getPost(postId);
    
    return {
        id: Number(post.id),
        author: post.author,
        content: post.content,
        ipfsHash: post.ipfsHash,
        createdAt: Number(post.createdAt),
        editedAt: Number(post.editedAt),
        exists: post.exists,
        deleted: post.deleted
    };
}

/**
 * Gets post moderation score
 */
export async function getPostScore(postId) {
    const contract = await getBackchatContractReadOnly();
    const [safeVotes, unsafeVotes, score, status] = await contract.getPostModerationScore(postId);
    
    return {
        safeVotes: Number(safeVotes),
        unsafeVotes: Number(unsafeVotes),
        score: Number(score),
        status: Number(status),
        statusName: ['Normal', 'Trusted', 'Warning', 'Hidden'][Number(status)] || 'Unknown'
    };
}

/**
 * Gets comment by ID
 */
export async function getComment(commentId) {
    const contract = await getBackchatContractReadOnly();
    const comment = await contract.getComment(commentId);
    
    return {
        id: Number(comment.id),
        postId: Number(comment.postId),
        parentCommentId: Number(comment.parentCommentId),
        author: comment.author,
        content: comment.content,
        ipfsHash: comment.ipfsHash,
        createdAt: Number(comment.createdAt),
        exists: comment.exists,
        deleted: comment.deleted
    };
}

/**
 * Gets community note by ID
 */
export async function getNote(noteId) {
    const contract = await getBackchatContractReadOnly();
    const note = await contract.getNote(noteId);
    
    return {
        id: Number(note.id),
        postId: Number(note.postId),
        author: note.author,
        content: note.content,
        ipfsHash: note.ipfsHash,
        createdAt: Number(note.createdAt),
        exists: note.exists
    };
}

/**
 * Gets note voting score
 */
export async function getNoteScore(noteId) {
    const contract = await getBackchatContractReadOnly();
    const [believeVotes, dontBelieveVotes, score, status] = await contract.getNoteVotingScore(noteId);
    
    return {
        believeVotes: Number(believeVotes),
        dontBelieveVotes: Number(dontBelieveVotes),
        score: Number(score),
        status: Number(status),
        statusName: ['Pending', 'Approved', 'Rejected'][Number(status)] || 'Unknown'
    };
}

/**
 * Gets creator stats
 */
export async function getCreatorStats(creatorAddress) {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const stats = await contract.getCreatorStats(creatorAddress);
    const balance = await contract.creatorBalance(creatorAddress);
    
    return {
        totalPosts: Number(stats.totalPosts),
        totalComments: Number(stats.totalComments),
        totalTipsReceived: stats.totalTipsReceived,
        totalTipsClaimed: stats.totalTipsClaimed,
        reputationScore: Number(stats.reputationScore),
        pendingBalance: balance,
        pendingBalanceFormatted: ethers.formatEther(balance)
    };
}

/**
 * Gets platform totals
 */
export async function getTotals() {
    const contract = await getBackchatContractReadOnly();
    const [posts, comments, notes, messages, conversations] = await contract.getTotals();
    
    return {
        totalPosts: Number(posts),
        totalComments: Number(comments),
        totalNotes: Number(notes),
        totalMessages: Number(messages),
        totalConversations: Number(conversations)
    };
}

/**
 * Gets financial stats
 */
export async function getFinancialStats() {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const [platformFees, tipsProcessed, tipsToCreators, tipsToMining, boostCollected, burnedInactive] = 
        await contract.getFinancialStats();
    
    return {
        platformFees,
        tipsProcessed,
        tipsToCreators,
        tipsToMining,
        boostCollected,
        burnedInactive,
        // Formatted
        platformFeesFormatted: ethers.formatEther(platformFees),
        tipsProcessedFormatted: ethers.formatEther(tipsProcessed),
        tipsToCreatorsFormatted: ethers.formatEther(tipsToCreators),
        tipsToMiningFormatted: ethers.formatEther(tipsToMining),
        boostCollectedFormatted: ethers.formatEther(boostCollected),
        burnedInactiveFormatted: ethers.formatEther(burnedInactive)
    };
}

/**
 * Gets platform fee
 */
export async function getPlatformFeeAmount() {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const fee = await contract.platformFee();
    
    return {
        raw: fee,
        formatted: ethers.formatEther(fee)
    };
}

/**
 * Gets minimum tip amount
 */
export async function getMinTipAmount() {
    const ethers = window.ethers;
    const contract = await getBackchatContractReadOnly();
    const minTip = await contract.minTipAmount();
    
    return {
        raw: minTip,
        formatted: ethers.formatEther(minTip)
    };
}

/**
 * Gets user's posts
 */
export async function getUserPosts(userAddress) {
    const contract = await getBackchatContractReadOnly();
    const postIds = await contract.getAuthorPosts(userAddress);
    return postIds.map(id => Number(id));
}

/**
 * Gets post comments
 */
export async function getPostComments(postId) {
    const contract = await getBackchatContractReadOnly();
    const commentIds = await contract.getPostComments(postId);
    return commentIds.map(id => Number(id));
}

/**
 * Gets post notes
 */
export async function getPostNotes(postId) {
    const contract = await getBackchatContractReadOnly();
    const noteIds = await contract.getPostNotes(postId);
    return noteIds.map(id => Number(id));
}

/**
 * Gets comment replies
 */
export async function getCommentReplies(commentId) {
    const contract = await getBackchatContractReadOnly();
    const replyIds = await contract.getCommentReplies(commentId);
    return replyIds.map(id => Number(id));
}

/**
 * Gets user conversations
 */
export async function getUserConversations(userAddress) {
    const contract = await getBackchatContractReadOnly();
    const convIds = await contract.getUserConversations(userAddress);
    return convIds.map(id => Number(id));
}

/**
 * Gets conversation messages
 */
export async function getConversationMessages(conversationId) {
    const contract = await getBackchatContractReadOnly();
    const msgIds = await contract.getConversationMessages(conversationId);
    return msgIds.map(id => Number(id));
}

/**
 * Gets message by ID
 */
export async function getMessage(messageId) {
    const contract = await getBackchatContractReadOnly();
    const msg = await contract.getMessage(messageId);
    
    return {
        sender: msg[0],
        recipient: msg[1],
        encryptedContent: msg[2],
        encryptedIpfsHash: msg[3],
        sentAt: Number(msg[4]),
        conversationId: Number(msg[5]),
        parentMessageId: Number(msg[6])
    };
}

/**
 * Gets user's public key
 */
export async function getPublicKey(userAddress) {
    const contract = await getBackchatContractReadOnly();
    return await contract.getPublicKey(userAddress);
}

/**
 * Checks if user has public key registered
 */
export async function hasPublicKey(userAddress) {
    const key = await getPublicKey(userAddress);
    return key && key.length > 0 && key !== '0x';
}

/**
 * Checks if user has voted on post
 */
export async function hasVotedOnPost(userAddress, postId) {
    const contract = await getBackchatContractReadOnly();
    return await contract.hasVotedOnPost(userAddress, postId);
}

/**
 * Checks if user has voted on comment
 */
export async function hasVotedOnComment(userAddress, commentId) {
    const contract = await getBackchatContractReadOnly();
    return await contract.hasVotedOnComment(userAddress, commentId);
}

/**
 * Checks if user has voted on note
 */
export async function hasVotedOnNote(userAddress, noteId) {
    const contract = await getBackchatContractReadOnly();
    return await contract.hasVotedOnNote(userAddress, noteId);
}

/**
 * Checks if user has booster access
 */
export async function hasBoosterAccess(userAddress) {
    const contract = await getBackchatContractReadOnly();
    return await contract.hasBoosterAccess(userAddress);
}

/**
 * Gets KYC status
 */
export async function getKYCStatus(userAddress) {
    const contract = await getBackchatContractReadOnly();
    const [verified, level, expiresAt] = await contract.getKYCStatus(userAddress);
    
    return {
        verified,
        level: Number(level),
        expiresAt: Number(expiresAt),
        isExpired: expiresAt > 0 && Math.floor(Date.now() / 1000) > Number(expiresAt)
    };
}

// ============================================================================
// 13. EXPORT
// ============================================================================

export const BackchatTx = {
    // Posts
    createPost,
    editPost,
    deletePost,
    
    // Comments
    createComment,
    replyToComment,
    deleteComment,
    
    // Moderation
    voteOnPost,
    voteOnComment,
    
    // Community Notes
    proposeNote,
    voteOnNote,
    
    // Tips
    sendTip,
    claimRewards,
    
    // Boost
    boostPost,
    
    // Private Messages
    setPublicKey,
    sendPrivateMessage,
    replyToMessage,
    
    // KYC & Burn
    verifyKYC,
    burnInactiveBalance,
    
    // Read functions
    getPost,
    getPostScore,
    getComment,
    getNote,
    getNoteScore,
    getCreatorStats,
    getTotals,
    getFinancialStats,
    getPlatformFeeAmount,
    getMinTipAmount,
    getUserPosts,
    getPostComments,
    getPostNotes,
    getCommentReplies,
    getUserConversations,
    getConversationMessages,
    getMessage,
    getPublicKey,
    hasPublicKey,
    hasVotedOnPost,
    hasVotedOnComment,
    hasVotedOnNote,
    hasBoosterAccess,
    getKYCStatus,
    
    // Constants
    ContentStatus,
    NoteStatus
};

export default BackchatTx;