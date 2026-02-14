// modules/js/transactions/index.js
// ✅ V9.0 - Updated exports for V9 contracts
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
//   Transactions.CharityTx.donate({ campaignId, amount, operator: '0x...' });
//
// OPERATOR USAGE:
//   - Don't pass operator → Uses default from localStorage
//   - Pass operator: '0x...' → Uses that operator (for third-party frontends)
//   - Pass operator: null → No operator (ZeroAddress)
// ============================================================================

// Charity Pool V2
export {
    CharityTx,
    createCampaign,
    donate,
    closeCampaign,
    cancelCampaign, // backward-compat alias
    withdraw,
    boostCampaign,
    getCampaign,
    getCampaignsBatch,
    getCampaignCount,
    canWithdraw,
    previewDonation,
    getBoostCost as charityGetBoostCost,
    getCreateFee,
    getStats as charityGetStats
} from './charity-tx.js';

// Staking (V9: StakingPool replaces DelegationManager)
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
    getStakingConfig,
    previewClaim,
    getUserSummary
} from './staking-tx.js';

// NFT Pool
export {
    NftTx,
    buyNft,
    buySpecificNft,
    sellNft,
    approveAllNfts,
    getBuyPrice,
    getSellPrice,
    getTotalBuyCost,
    getTotalSellInfo,
    getPoolInfo,
    getAvailableNfts,
    getEthFees,
    getStats as nftGetStats,
    getTierName,
    getSpread,
    isApprovedForAll
} from './nft-tx.js';

// Fortune Pool
export {
    FortuneTx,
    commitPlay,
    revealPlay,
    playGame,
    getActiveTiers,
    getServiceFee,
    calculatePotentialWin,
    getPoolStats as fortuneGetPoolStats,
    getCommitmentStatus,
    getGameResult
} from './fortune-tx.js';

// Rental Marketplace V2 (daily pricing + boost)
export {
    RentalTx,
    listNft,
    rentNft,
    withdrawNft,
    withdrawEarnings,
    updateListing,
    boostListing,
    getBoostCost,
    getListing,
    getRental,
    getAllListedTokenIds,
    getListingCount,
    getAvailableListings,
    getRentalCost,
    isRented,
    getRemainingRentalTime,
    hasActiveRental,
    getPendingEarnings,
    getMarketplaceStats
} from './rental-tx.js';

// Notary V3 (per-docType fees, boost, transfer, batch reads)
export {
    NotaryTx,
    certify,
    notarize, // backward-compat alias
    boostCertificate as notaryBoostCertificate,
    transferCertificate as notaryTransferCertificate,
    verify,
    verifyByHash, // backward-compat alias
    getCertificate,
    getDocument, // backward-compat alias
    getCertificatesBatch,
    getCertifyFee,
    getFee as notaryGetFee,
    getBoostCost as notaryGetBoostCost,
    getTransferFee as notaryGetTransferFee,
    getTotalDocuments,
    getStats as notaryGetStats,
    calculateFileHash,
    calculateTextHash
} from './notary-tx.js';

// Faucet (Testnet) - No operator needed
export {
    FaucetTx,
    executeFaucetClaim
} from './faucet-tx.js';

// NFT Fusion (fuse 2→1 up, split 1→2 down)
export {
    FusionTx,
    fuseNfts,
    splitNft,
    splitNftTo,
    getEstimatedFusionFee,
    getEstimatedSplitFee,
    getEstimatedMultiSplitFee,
    getFusionStats,
    isFusionApproved
} from './fusion-tx.js';

// Buyback Miner V2 (permissionless buyback + execution fee + 5% caller reward)
export {
    BuybackTx,
    executeBuyback,
    executeBuybackWithSlippage,
    getExecutionFee,
    getPreviewBuyback,
    getPendingETH,
    getMiningRate,
    getBuybackStats,
    getLastBuyback,
    getSupplyInfo
} from './buyback-tx.js';

// Backchat / Agora V3 (The Forever Protocol)
export {
    BackchatTx,
    createProfile,
    updateProfile,
    createPost,
    createReply,
    createRepost,
    editPost,
    like,
    superLike,
    downvote,
    follow,
    unfollow,
    blockUser,
    unblockUser,
    deletePost,
    pinPost,
    changeTag,
    reportPost,
    boostPost,
    getBoostCost as agoraGetBoostCost,
    tipPost,
    boostProfile,
    obtainBadge,
    getUsernamePrice,
    getUsernameFee, // backward-compat alias
    getPost,
    getPostsBatch,
    getPostMeta,
    getPostCount,
    getUserProfile,
    isUsernameAvailable,
    hasUserLiked,
    hasUserDownvoted,
    checkFollowing,
    checkBlocked,
    getGlobalStats,
    getVersion as backchatGetVersion
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
    Fusion: (async () => (await import('./fusion-tx.js')).FusionTx)(),
    Buyback: (async () => (await import('./buyback-tx.js')).BuybackTx)(),
    Backchat: (async () => (await import('./backchat-tx.js')).BackchatTx)()
};

export default Transactions;
