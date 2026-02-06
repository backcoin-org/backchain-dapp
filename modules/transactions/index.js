// modules/js/transactions/index.js
// ✅ PRODUCTION V2.0 - Added Operator Support
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
    cancelCampaign,
    withdraw,
    boostCampaign,
    getCampaign,
    getCampaignCount,
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
    commitPlay,
    revealPlay,
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
    spotlightListing,
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

// Faucet (Testnet) - No operator needed
export { 
    FaucetTx,
    executeFaucetClaim
} from './faucet-tx.js';

// Backchat (Social Network) - V8.0.0 Viral Referral
export {
    BackchatTx,
    createProfile,
    updateProfile,
    createPost,
    createReply,
    createRepost,
    like,
    superLike,
    follow,
    unfollow,
    boostProfile,
    obtainBadge,
    withdraw as backchatWithdraw,
    setReferrer,
    getReferralStats,
    getReferredBy,
    getCurrentFees as backchatGetCurrentFees,
    getPostCount,
    getPendingBalance as backchatGetPendingBalance,
    isUsernameAvailable,
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