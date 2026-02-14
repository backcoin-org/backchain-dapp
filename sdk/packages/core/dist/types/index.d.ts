import type { ethers } from 'ethers';
export type NetworkId = 'arbitrum-sepolia' | 'arbitrum-one';
export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
}
export interface BackchainConfig {
    /** Your operator wallet address — earns 10-20% of all ETH fees */
    operator: string;
    /** Network to connect to */
    network?: NetworkId;
    /** Custom RPC URL (overrides default Alchemy) */
    rpcUrl?: string;
    /** Custom contract addresses (overrides defaults) */
    addresses?: Partial<ContractAddresses>;
}
export interface ContractAddresses {
    bkcToken: string;
    backchainEcosystem: string;
    liquidityPool: string;
    stakingPool: string;
    buybackMiner: string;
    rewardBooster: string;
    nftFusion: string;
    poolBronze: string;
    poolSilver: string;
    poolGold: string;
    poolDiamond: string;
    fortunePool: string;
    agora: string;
    notary: string;
    charityPool: string;
    rentalManager: string;
    simpleBkcFaucet: string;
    backchainGovernance: string;
}
export interface DualProvider {
    /** Read-only provider (Alchemy RPC) — for background reads without wallet popups */
    reader: ethers.JsonRpcProvider;
    /** Signer provider (MetaMask/WalletConnect) — for write transactions */
    signer: ethers.Signer | null;
    /** Connected wallet address */
    address: string | null;
}
export interface TxResult {
    /** Transaction hash */
    hash: string;
    /** Block number of confirmation */
    blockNumber: number;
    /** Gas used */
    gasUsed: bigint;
    /** Parsed event data (module-specific) */
    events: Record<string, unknown>;
}
export interface Delegation {
    amount: bigint;
    pStake: bigint;
    lockEnd: bigint;
    lockDays: bigint;
    rewardDebt: bigint;
}
export interface DelegationDetail {
    amount: bigint;
    pStake: bigint;
    lockEnd: bigint;
    lockDays: bigint;
    pendingReward: bigint;
}
export interface ClaimPreview {
    totalRewards: bigint;
    recycleAmount: bigint;
    burnAmount: bigint;
    tutorCut: bigint;
    userReceives: bigint;
    recycleRateBps: bigint;
    nftBoost: bigint;
}
export interface ForceUnstakePreview {
    stakedAmount: bigint;
    totalPenalty: bigint;
    recycleAmount: bigint;
    burnAmount: bigint;
    tutorCut: bigint;
    userReceives: bigint;
    penaltyRateBps: bigint;
    nftBoost: bigint;
    ethFeeRequired: bigint;
}
export interface StakingStats {
    totalPStake: bigint;
    totalBkcDelegated: bigint;
    totalRewardsDistributed: bigint;
    totalBurnedOnClaim: bigint;
    totalRecycledOnClaim: bigint;
    totalForceUnstakePenalties: bigint;
    totalTutorPayments: bigint;
    totalEthFeesCollected: bigint;
    accRewardPerShare: bigint;
}
export interface UserSummary {
    userTotalPStake: bigint;
    delegationCount: bigint;
    savedRewards: bigint;
    totalPending: bigint;
    nftBoost: bigint;
    recycleRateBps: bigint;
}
export type NftTier = 0 | 1 | 2 | 3;
export declare const TierNames: readonly ["Bronze", "Silver", "Gold", "Diamond"];
export declare const TierBoosts: readonly [1000, 2500, 4000, 5000];
export interface PoolInfo {
    bkcBalance: bigint;
    nftCount: bigint;
    k: bigint;
    initialized: boolean;
    tier: number;
}
export interface PoolStats {
    volume: bigint;
    buys: bigint;
    sells: bigint;
    ethFees: bigint;
}
export interface TokenInfo {
    owner: string;
    tier: number;
    boostBips: bigint;
}
export interface GameInfo {
    player: string;
    commitBlock: bigint;
    tierMask: number;
    status: number;
    operator: string;
    wagerAmount: bigint;
}
export interface GameResult {
    player: string;
    grossWager: bigint;
    prizeWon: bigint;
    tierMask: number;
    matchCount: number;
    revealBlock: bigint;
}
export interface GameStatus {
    status: number;
    canReveal: boolean;
    blocksUntilReveal: bigint;
    blocksUntilExpiry: bigint;
}
export interface TierInfo {
    range: bigint;
    multiplier: bigint;
    winChanceBps: bigint;
}
export declare enum DocType {
    General = 0,
    Contract = 1,
    Identity = 2,
    Diploma = 3,
    Property = 4,
    Financial = 5,
    Legal = 6,
    Medical = 7,
    IP = 8,
    Other = 9
}
export interface Certificate {
    exists: boolean;
    owner: string;
    timestamp: bigint;
    docType: number;
    meta: string;
}
export declare enum CampaignStatus {
    Active = 0,
    Closed = 1,
    Withdrawn = 2
}
export interface Campaign {
    owner: string;
    deadline: bigint;
    status: number;
    raised: bigint;
    goal: bigint;
    donorCount: bigint;
    isBoosted: boolean;
    title: string;
    metadataUri: string;
}
export declare enum ContentType {
    Text = 0,
    Image = 1,
    Video = 2,
    Link = 3,
    Live = 4
}
export declare enum BadgeTier {
    Verified = 0,
    Premium = 1,
    Elite = 2
}
export interface PostView {
    author: string;
    tag: number;
    contentType: number;
    deleted: boolean;
    createdAt: bigint;
    editedAt: bigint;
    replyTo: bigint;
    repostOf: bigint;
    likes: bigint;
    superLikes: bigint;
    superLikeETH: bigint;
    downvotes: bigint;
    replies: bigint;
    reposts: bigint;
    reports: bigint;
    tips: bigint;
    boostTier: number;
    boostExpiry: bigint;
}
export interface UserProfile {
    usernameHash: string;
    metadataURI: string;
    pinned: bigint;
    boosted: boolean;
    hasBadge: boolean;
    badgeTier: number;
    boostExp: bigint;
    badgeExp: bigint;
    followers: bigint;
    following: bigint;
}
export interface Listing {
    owner: string;
    pricePerDay: bigint;
    totalEarnings: bigint;
    rentalCount: bigint;
    currentlyRented: boolean;
    rentalEndTime: bigint;
    isBoosted: boolean;
    boostExpiry: bigint;
}
export interface RentalInfo {
    tenant: string;
    endTime: bigint;
    isActive: boolean;
}
export interface PoolQuote {
    amountOut: bigint;
}
export interface LiquidityPoolStats {
    ethReserve: bigint;
    bkcReserve: bigint;
    totalLPShares: bigint;
    currentPrice: bigint;
    totalSwapCount: bigint;
    totalEthVolume: bigint;
    totalBkcVolume: bigint;
}
export interface BuybackPreview {
    ethAvailable: bigint;
    estimatedBkcPurchased: bigint;
    estimatedBkcMined: bigint;
    estimatedBurn: bigint;
    estimatedToStakers: bigint;
    estimatedCallerReward: bigint;
    currentMiningRateBps: bigint;
    isReady: boolean;
}
export interface BuybackStats {
    totalBuybacks: bigint;
    totalEthSpent: bigint;
    totalBkcPurchased: bigint;
    totalBkcMined: bigint;
    totalBkcBurned: bigint;
    totalBkcToStakers: bigint;
    totalCallerRewards: bigint;
    avgEthPerBuyback: bigint;
    avgBkcPerBuyback: bigint;
}
export interface FaucetStatus {
    ethBalance: bigint;
    tokenBalance: bigint;
    ethPerDrip: bigint;
    tokensPerDrip: bigint;
    estimatedEthClaims: bigint;
    estimatedTokenClaims: bigint;
}
export interface UserFaucetInfo {
    lastClaim: bigint;
    claims: bigint;
    eligible: boolean;
    cooldownLeft: bigint;
}
export interface FusionPreview {
    sourceTier: number;
    resultTier: number;
    ethFee: bigint;
    canFuse: boolean;
}
export interface SplitPreview {
    sourceTier: number;
    mintCount: bigint;
    ethFee: bigint;
    canSplit: boolean;
}
export interface EcosystemStats {
    ethCollected: bigint;
    bkcCollected: bigint;
    feeEvents: bigint;
    buybackEth: bigint;
    moduleCount: bigint;
}
export interface FeeConfig {
    feeType: number;
    bps: bigint;
    multiplier: bigint;
    gasEstimate: bigint;
}
//# sourceMappingURL=index.d.ts.map