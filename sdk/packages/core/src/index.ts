// @backchain/sdk — Main Barrel Export
// ============================================================================
//
// Usage:
//   import { Backchain } from '@backchain/sdk';
//
//   const bkc = new Backchain({ operator: '0xYOUR_WALLET' });
//   await bkc.connect();
//   await bkc.staking.delegate(ethers.parseEther('100'), 365);
//

// ── Core ────────────────────────────────────────────────────────────────────
export { Backchain } from './backchain.js';
export { ProviderManager, getNetworkConfig } from './provider.js';
export { calculateFee, actionId, nftActionId, notaryActionId, ACTION_IDS } from './fees.js';

// ── Modules ─────────────────────────────────────────────────────────────────
export { StakingModule } from './modules/staking.js';
export { NftModule } from './modules/nft.js';
export { FortuneModule } from './modules/fortune.js';
export { NotaryModule } from './modules/notary.js';
export { AgoraModule } from './modules/agora.js';
export { CharityModule } from './modules/charity.js';
export { RentalModule } from './modules/rental.js';
export { SwapModule } from './modules/swap.js';
export { FaucetModule } from './modules/faucet.js';
export { FusionModule } from './modules/fusion.js';
export { BuybackModule } from './modules/buyback.js';

// ── Contracts ───────────────────────────────────────────────────────────────
export { getAddresses, getPoolAddress } from './contracts/addresses.js';
export * from './contracts/abis.js';

// ── Types ───────────────────────────────────────────────────────────────────
export type {
    // Config
    BackchainConfig,
    ContractAddresses,
    NetworkId,
    NetworkConfig,

    // Core
    TxResult,
    DualProvider,

    // Staking
    Delegation,
    DelegationDetail,
    ClaimPreview,
    ForceUnstakePreview,
    StakingStats,
    UserSummary,

    // NFT
    NftTier,
    PoolInfo,
    PoolStats,
    TokenInfo,

    // Fortune
    GameInfo,
    GameResult,
    GameStatus,
    TierInfo,

    // Notary
    Certificate,

    // Charity
    Campaign,

    // Agora
    PostView,
    UserProfile,

    // Rental
    Listing,
    RentalInfo,

    // Swap
    LiquidityPoolStats,

    // Buyback
    BuybackPreview,
    BuybackStats,

    // Faucet
    FaucetStatus,
    UserFaucetInfo,

    // Fusion
    FusionPreview,
    SplitPreview,

    // Ecosystem
    EcosystemStats,
    FeeConfig,
} from './types/index.js';

// Re-export enums (these need value exports, not just type exports)
export { DocType, CampaignStatus, ContentType, BadgeTier, TierNames, TierBoosts } from './types/index.js';
