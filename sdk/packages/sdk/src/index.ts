// @backchain/sdk — Full SDK Barrel Export
// ============================================================================
//
// Install everything at once:
//   npm i @backchain/sdk
//
// Usage:
//   import { Backchain } from '@backchain/sdk';
//   const bkc = new Backchain({ operator: '0xYOUR_WALLET' });
//   await bkc.connect();
//   await bkc.staking.delegate(ethers.parseEther('100'), 365);
//
// Or use individual modules:
//   import { createContext } from '@backchain/sdk';
//   import { StakingModule } from '@backchain/sdk';

// ── Full SDK ─────────────────────────────────────────────────────────────────
export { Backchain } from './backchain.js';

// ── Core (re-exported) ──────────────────────────────────────────────────────
export {
    // Context
    createContext,
    // Provider
    ProviderManager, getNetworkConfig,
    // Fees
    calculateFee, actionId, nftActionId, notaryActionId, ACTION_IDS,
    // Contracts
    getAddresses, getPoolAddress,
    // ABIs
    BKC_TOKEN_ABI, ECOSYSTEM_ABI, STAKING_POOL_ABI, NFT_POOL_ABI,
    REWARD_BOOSTER_ABI, FORTUNE_POOL_ABI, NOTARY_ABI, CHARITY_POOL_ABI,
    AGORA_ABI, RENTAL_MANAGER_ABI, LIQUIDITY_POOL_ABI, BUYBACK_MINER_ABI,
    NFT_FUSION_ABI, FAUCET_ABI,
    // Enums
    DocType, CampaignStatus, ContentType, BadgeTier, TierNames, TierBoosts,
} from '@backchain/core';

export type {
    BackchainContext,
    BackchainConfig,
    ContractAddresses,
    NetworkId,
    NetworkConfig,
    TxResult,
    DualProvider,
    Delegation,
    DelegationDetail,
    ClaimPreview,
    ForceUnstakePreview,
    StakingStats,
    UserSummary,
    NftTier,
    PoolInfo,
    PoolStats,
    TokenInfo,
    GameInfo,
    GameResult,
    GameStatus,
    TierInfo,
    Certificate,
    Campaign,
    PostView,
    UserProfile,
    Listing,
    RentalInfo,
    LiquidityPoolStats,
    BuybackPreview,
    BuybackStats,
    FaucetStatus,
    UserFaucetInfo,
    FusionPreview,
    SplitPreview,
    EcosystemStats,
    FeeConfig,
} from '@backchain/core';

// ── Modules (re-exported) ───────────────────────────────────────────────────
export { StakingModule } from '@backchain/staking';
export { NftModule } from '@backchain/nft';
export { FusionModule } from '@backchain/fusion';
export { FortuneModule } from '@backchain/fortune';
export { NotaryModule } from '@backchain/notary';
export { AgoraModule } from '@backchain/agora';
export { CharityModule } from '@backchain/charity';
export { RentalModule } from '@backchain/rental';
export { SwapModule } from '@backchain/swap';
export { FaucetModule } from '@backchain/faucet';
export { BuybackModule } from '@backchain/buyback';

// ── Events (re-exported) ────────────────────────────────────────────────────
export {
    EventParser, FilterBuilder, eventFilter,
    ALL_EVENT_ABIS, ALL_EVENTS_FLAT,
    BKC_TOKEN_EVENTS, ECOSYSTEM_EVENTS, STAKING_EVENTS, LIQUIDITY_POOL_EVENTS,
    BUYBACK_EVENTS, REWARD_BOOSTER_EVENTS, NFT_POOL_EVENTS, NFT_FUSION_EVENTS,
    FORTUNE_EVENTS, NOTARY_EVENTS, CHARITY_EVENTS, AGORA_EVENTS,
    RENTAL_EVENTS, FAUCET_EVENTS, GOVERNANCE_EVENTS, AIRDROP_EVENTS,
} from '@backchain/events';

export type {
    BaseEvent, ParsedEvent, ContractName, EventFilter,
    DelegatedEvent, UnstakedEvent, RewardsClaimedEvent,
    NFTPurchasedEvent, NFTSoldEvent, FusedEvent, SplitEvent,
    GameCommittedEvent, GameRevealedEvent, CertifiedEvent,
    PostCreatedEvent, DonationMadeEvent, BuybackExecutedEvent,
    BackchainEvent,
} from '@backchain/events';

// ── Indexer (re-exported) ───────────────────────────────────────────────────
export { EventIndexer, InMemoryCheckpoint, FileCheckpoint, EventPipeline } from '@backchain/indexer';
export type { IndexerConfig, CheckpointStore, PipelineStage, EventHandler } from '@backchain/indexer';

// ── API (re-exported) ───────────────────────────────────────────────────────
export { Multicall, backchainMiddleware, generateRoutes, setupBackchainRoutes } from '@backchain/api';
export type { RouteConfig, RouteDefinition, ServerConfig, BackchainMiddlewareConfig } from '@backchain/api';
