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

// Charity Pool
export {
    CharityTx,
    createCampaign,
    donate,
    closeCampaign,
    cancelCampaign, // backward-compat alias
    withdraw,
    boostCampaign,
    getCampaign,
    getCampaignCount,
    canWithdraw,
    previewDonation,
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

// Rental Marketplace
export {
    RentalTx,
    listNft,
    rentNft,
    withdrawNft,
    withdrawEarnings,
    updateListing,
    getListing,
    getRental,
    getAllListedTokenIds,
    getListingCount,
    getRentalCost,
    isRented,
    getRemainingRentalTime,
    hasActiveRental,
    getPendingEarnings,
    getMarketplaceStats
} from './rental-tx.js';

// Notary (V9: certify replaces notarize)
export {
    NotaryTx,
    certify,
    notarize, // backward-compat alias
    verify,
    verifyByHash, // backward-compat alias
    getCertificate,
    getDocument, // backward-compat alias
    getFee as notaryGetFee,
    getTotalDocuments,
    getStats as notaryGetStats,
    calculateFileHash
} from './notary-tx.js';

// Faucet (Testnet) - No operator needed
export {
    FaucetTx,
    executeFaucetClaim
} from './faucet-tx.js';

// Backchat / Agora (V9: Agora replaces Backchat contract)
export {
    BackchatTx,
    createProfile,
    updateProfile,
    createPost,
    createReply,
    createRepost,
    like,
    superLike,
    downvote,
    follow,
    unfollow,
    deletePost,
    pinPost,
    boostProfile,
    obtainBadge,
    getUsernamePrice,
    getUsernameFee, // backward-compat alias
    getPost,
    getPostCount,
    getUserProfile,
    isUsernameAvailable,
    hasUserLiked,
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
    Backchat: (async () => (await import('./backchat-tx.js')).BackchatTx)()
};

export default Transactions;
