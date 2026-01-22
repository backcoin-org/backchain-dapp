// modules/js/transactions/index.js
// ✅ PRODUCTION V1.2 - Added BackchatTx
// 
// This file re-exports all transaction modules for simplified imports.
//
// ============================================================================
// USAGE:
// 
// Import specific modules:
//   import { CharityTx, StakingTx, BackchatTx } from './transactions/index.js';
//
// Import everything:
//   import * as Transactions from './transactions/index.js';
//   Transactions.CharityTx.donate({ ... });
//   Transactions.BackchatTx.createPost({ ... });
// ============================================================================

// Charity Pool
export { 
    CharityTx,
    createCampaign,
    donate,
    cancelCampaign,
    withdraw,
    getCampaign,
    getCampaignCount,
    getUserCampaigns,
    getWithdrawalFee
} from './charity-tx.js';

// Staking / Delegation
export { 
    StakingTx,
    delegate,
    unstake,
    forceUnstake,
    claimRewards as claimStakingRewards,
    getUserDelegations,
    getPendingRewards,
    getUserPStake,
    getTotalPStake,
    getEarlyUnstakePenalty,
    getStakingConfig
} from './staking-tx.js';

// NFT Pool
export { 
    NftTx,
    buyNft,
    sellNft,
    approveAllNfts,
    getBuyPrice,
    getSellPrice,
    getPoolInfo,
    getAvailableNfts,
    getUserNfts,
    isApprovedForAll
} from './nft-tx.js';

// Fortune Pool
export { 
    FortuneTx,
    playGame,
    getActiveTiers,
    getTierForWager,
    getServiceFee,
    calculatePotentialWin,
    getUserGameHistory,
    getLastWinningNumber
} from './fortune-tx.js';

// Rental Marketplace
export { 
    RentalTx,
    listNft,
    rentNft,
    withdrawNft,
    updateListing,
    endRental,
    getListing,
    getRental,
    getActiveListings,
    getUserListings,
    getUserRentals,
    calculateRentalCost,
    isMarketplacePaused
} from './rental-tx.js';

// Notary
export { 
    NotaryTx,
    notarize,
    getDocument,
    getDocumentByHash,
    getUserDocuments,
    getDocumentCount,
    isHashNotarized,
    verifyDocument,
    calculateFileHash
} from './notary-tx.js';

// Faucet (Testnet)
export { 
    FaucetTx,
    executeFaucetClaim
} from './faucet-tx.js';

// Backchat (Social Network) - V1.2
export { 
    BackchatTx,
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
    claimRewards as claimBackchatRewards,
    // Boost
    boostPost,
    // Private Messages
    setPublicKey,
    sendPrivateMessage,
    replyToMessage,
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
    // Enums
    ContentStatus,
    NoteStatus
} from './backchat-tx.js';

// ============================================================================
// CONVENIENCE OBJECT
// ============================================================================

/**
 * All transaction modules in one object
 */
export const Transactions = {
    Charity: (async () => (await import('./charity-tx.js')).CharityTx)(),
    Staking: (async () => (await import('./staking-tx.js')).StakingTx)(),
    Nft: (async () => (await import('./nft-tx.js')).NftTx)(),
    Fortune: (async () => (await import('./fortune-tx.js')).FortuneTx)(),
    Rental: (async () => (await import('./rental-tx.js')).RentalTx)(),
    Notary: (async () => (await import('./notary-tx.js')).NotaryTx)(),
    Faucet: (async () => (await import('./faucet-tx.js')).FaucetTx)(),
    Backchat: (async () => (await import('./backchat-tx.js')).BackchatTx)() // V1.2
};

export default Transactions;