// @backchain/core — Core Infrastructure
// ============================================================================
//
// The foundation package. All module packages depend on this.
//
// Usage:
//   import { createContext, ProviderManager, calculateFee } from '@backchain/core';
//   import type { BackchainContext, ContractAddresses } from '@backchain/core';

// ── Context (the decoupling layer) ───────────────────────────────────────────
export { createContext } from './context.js';
export type { BackchainContext } from './context.js';

// ── Provider ─────────────────────────────────────────────────────────────────
export { ProviderManager, getNetworkConfig } from './provider.js';

// ── Fees ─────────────────────────────────────────────────────────────────────
export { calculateFee, actionId, nftActionId, notaryActionId, ACTION_IDS } from './fees.js';

// ── Contracts ────────────────────────────────────────────────────────────────
export { getAddresses, getPoolAddress } from './contracts/addresses.js';
export * from './contracts/abis.js';

// ── Types ────────────────────────────────────────────────────────────────────
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

    // Fusion
    FusionPreview,
    SplitPreview,

    // Ecosystem
    EcosystemStats,
    FeeConfig,
} from './types/index.js';

// Re-export enums (value exports)
export { DocType, CampaignStatus, ContentType, BadgeTier, TierNames, TierBoosts } from './types/index.js';
