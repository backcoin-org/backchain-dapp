// ── Typed event interfaces for all Backchain contracts ──────────────────────

/** Base interface for all parsed events */
export interface BaseEvent {
    event: string;
    args: Record<string, unknown>;
    blockNumber: number;
    blockHash: string;
    transactionHash: string;
    transactionIndex: number;
    logIndex: number;
    address: string;
    removed: boolean;
}

/** Wrapper returned by EventParser */
export interface ParsedEvent<T extends BaseEvent = BaseEvent> {
    raw: { topics: readonly string[]; data: string };
    parsed: T;
}

// ── BKCToken Events ─────────────────────────────────────────────────────────

export interface TransferEvent extends BaseEvent {
    event: 'Transfer';
    args: { from: string; to: string; value: bigint };
}

export interface ApprovalEvent extends BaseEvent {
    event: 'Approval';
    args: { owner: string; spender: string; value: bigint };
}

export interface TokensBurnedEvent extends BaseEvent {
    event: 'TokensBurned';
    args: { from: string; amount: bigint; newTotalSupply: bigint; totalBurnedAllTime: bigint };
}

export interface TokensMintedEvent extends BaseEvent {
    event: 'TokensMinted';
    args: { to: string; amount: bigint; newTotalSupply: bigint };
}

export type BkcTokenEvent = TransferEvent | ApprovalEvent | TokensBurnedEvent | TokensMintedEvent | BaseEvent;

// ── Ecosystem Events ────────────────────────────────────────────────────────

export interface FeeCollectedEvent extends BaseEvent {
    event: 'FeeCollected';
    args: { moduleId: string; user: string; operator: string; customRecipient: string; ethAmount: bigint; bkcFee: bigint };
}

export interface EthDistributedEvent extends BaseEvent {
    event: 'EthDistributed';
    args: { toReferrer: bigint; toCustom: bigint; toOperator: bigint; toTreasury: bigint; toBuyback: bigint };
}

export interface TutorSetEvent extends BaseEvent {
    event: 'TutorSet';
    args: { user: string; tutor: string };
}

export interface OwnershipTransferredEvent extends BaseEvent {
    event: 'OwnershipTransferred';
    args: { oldOwner: string; newOwner: string };
}

export type EcosystemEvent = FeeCollectedEvent | EthDistributedEvent | TutorSetEvent | OwnershipTransferredEvent | BaseEvent;

// ── Staking Events ──────────────────────────────────────────────────────────

export interface DelegatedEvent extends BaseEvent {
    event: 'Delegated';
    args: { user: string; delegationIndex: bigint; amount: bigint; pStake: bigint; lockDays: bigint; operator: string };
}

export interface UnstakedEvent extends BaseEvent {
    event: 'Unstaked';
    args: { user: string; delegationIndex: bigint; amountReturned: bigint };
}

export interface ForceUnstakedEvent extends BaseEvent {
    event: 'ForceUnstaked';
    args: { user: string; delegationIndex: bigint; amountReturned: bigint; totalPenalty: bigint; recycledAmount: bigint; burnedAmount: bigint; tutorAmount: bigint; tutor: string; operator: string };
}

export interface RewardsClaimedEvent extends BaseEvent {
    event: 'RewardsClaimed';
    args: { user: string; totalRewards: bigint; recycledAmount: bigint; burnedAmount: bigint; tutorAmount: bigint; userReceived: bigint; nftBoostUsed: bigint; tutor: string; operator: string };
}

export interface RewardNotifiedEvent extends BaseEvent {
    event: 'RewardNotified';
    args: { amount: bigint; newAccRewardPerShare: bigint };
}

export type StakingEvent = DelegatedEvent | UnstakedEvent | ForceUnstakedEvent | RewardsClaimedEvent | RewardNotifiedEvent | BaseEvent;

// ── LiquidityPool Events ────────────────────────────────────────────────────

export interface LiquidityAddedEvent extends BaseEvent {
    event: 'LiquidityAdded';
    args: { provider: string; ethAmount: bigint; bkcAmount: bigint; shares: bigint };
}

export interface SwapETHforBKCEvent extends BaseEvent {
    event: 'SwapETHforBKC';
    args: { buyer: string; ethIn: bigint; bkcOut: bigint };
}

export interface SwapBKCforETHEvent extends BaseEvent {
    event: 'SwapBKCforETH';
    args: { seller: string; bkcIn: bigint; ethOut: bigint };
}

export type LiquidityEvent = LiquidityAddedEvent | SwapETHforBKCEvent | SwapBKCforETHEvent | BaseEvent;

// ── BuybackMiner Events ─────────────────────────────────────────────────────

export interface BuybackExecutedEvent extends BaseEvent {
    event: 'BuybackExecuted';
    args: { caller: string; buybackNumber: bigint; callerReward: bigint; ethSpent: bigint; bkcPurchased: bigint; bkcMined: bigint; bkcBurned: bigint; bkcToStakers: bigint; miningRateBps: bigint };
}

export type BuybackEvent = BuybackExecutedEvent | BaseEvent;

// ── NFT Events ──────────────────────────────────────────────────────────────

export interface NFTPurchasedEvent extends BaseEvent {
    event: 'NFTPurchased';
    args: { buyer: string; tokenId: bigint; price: bigint; ethFee: bigint; newNftCount: bigint; operator: string };
}

export interface NFTSoldEvent extends BaseEvent {
    event: 'NFTSold';
    args: { seller: string; tokenId: bigint; payout: bigint; ethFee: bigint; newNftCount: bigint; operator: string };
}

export interface FusedEvent extends BaseEvent {
    event: 'Fused';
    args: { user: string; tokenId1: bigint; tokenId2: bigint; newTokenId: bigint; sourceTier: number; resultTier: number; operator: string };
}

export interface SplitEvent extends BaseEvent {
    event: 'Split';
    args: { user: string; burnedTokenId: bigint; sourceTier: number; targetTier: number; mintCount: bigint; newTokenIds: bigint[]; operator: string };
}

export type NftEvent = NFTPurchasedEvent | NFTSoldEvent | FusedEvent | SplitEvent | BaseEvent;

// ── Fortune Events ──────────────────────────────────────────────────────────

export interface GameCommittedEvent extends BaseEvent {
    event: 'GameCommitted';
    args: { gameId: bigint; player: string; wagerAmount: bigint; tierMask: number; operator: string };
}

export interface GameRevealedEvent extends BaseEvent {
    event: 'GameRevealed';
    args: { gameId: bigint; player: string; grossWager: bigint; prizeWon: bigint; tierMask: number; matchCount: number; operator: string };
}

export interface GameExpiredEvent extends BaseEvent {
    event: 'GameExpired';
    args: { gameId: bigint; player: string; forfeitedAmount: bigint };
}

export type FortuneEvent = GameCommittedEvent | GameRevealedEvent | GameExpiredEvent | BaseEvent;

// ── Notary Events ───────────────────────────────────────────────────────────

export interface CertifiedEvent extends BaseEvent {
    event: 'Certified';
    args: { certId: bigint; owner: string; documentHash: string; docType: number; operator: string };
}

export interface CertificateTransferredEvent extends BaseEvent {
    event: 'CertificateTransferred';
    args: { documentHash: string; from: string; to: string };
}

export type NotaryEvent = CertifiedEvent | CertificateTransferredEvent | BaseEvent;

// ── Charity Events ──────────────────────────────────────────────────────────

export interface CampaignCreatedEvent extends BaseEvent {
    event: 'CampaignCreated';
    args: { campaignId: bigint; owner: string; goal: bigint; deadline: bigint; operator: string };
}

export interface DonationMadeEvent extends BaseEvent {
    event: 'DonationMade';
    args: { campaignId: bigint; donor: string; grossAmount: bigint; netAmount: bigint; operator: string };
}

export type CharityEvent = CampaignCreatedEvent | DonationMadeEvent | BaseEvent;

// ── Agora Events ────────────────────────────────────────────────────────────

export interface PostCreatedEvent extends BaseEvent {
    event: 'PostCreated';
    args: { postId: bigint; author: string; tag: number; contentType: number; contentHash: string; operator: string };
}

export interface ReplyCreatedEvent extends BaseEvent {
    event: 'ReplyCreated';
    args: { postId: bigint; parentId: bigint; author: string; tag: number; contentType: number; contentHash: string; operator: string };
}

export interface LikedEvent extends BaseEvent {
    event: 'Liked';
    args: { postId: bigint; liker: string; author: string; operator: string };
}

export interface FollowedEvent extends BaseEvent {
    event: 'Followed';
    args: { follower: string; followed: string; operator: string };
}

export interface PostTippedEvent extends BaseEvent {
    event: 'PostTipped';
    args: { postId: bigint; tipper: string; author: string; amount: bigint; operator: string };
}

export type AgoraEvent = PostCreatedEvent | ReplyCreatedEvent | LikedEvent | FollowedEvent | PostTippedEvent | BaseEvent;

// ── Rental Events ───────────────────────────────────────────────────────────

export interface NFTListedEvent extends BaseEvent {
    event: 'NFTListed';
    args: { tokenId: bigint; owner: string; pricePerDay: bigint };
}

export interface NFTRentedEvent extends BaseEvent {
    event: 'NFTRented';
    args: { tokenId: bigint; tenant: string; owner: string; rentalCost: bigint; ethFee: bigint; endTime: bigint; operator: string };
}

export type RentalEvent = NFTListedEvent | NFTRentedEvent | BaseEvent;

// ── Faucet Events ───────────────────────────────────────────────────────────

export interface ClaimedEvent extends BaseEvent {
    event: 'Claimed';
    args: { recipient: string; tokens: bigint; eth: bigint; via: string };
}

export type FaucetEvent = ClaimedEvent | BaseEvent;

// ── Governance Events ───────────────────────────────────────────────────────

export interface ProposalCreatedEvent extends BaseEvent {
    event: 'ProposalCreated';
    args: { proposalId: bigint; target: string; value: bigint; data: string; eta: bigint; description: string };
}

export interface PhaseAdvancedEvent extends BaseEvent {
    event: 'PhaseAdvanced';
    args: { previous: number; current: number };
}

export type GovernanceEvent = ProposalCreatedEvent | PhaseAdvancedEvent | BaseEvent;

// ── Union of all events ─────────────────────────────────────────────────────

export type BackchainEvent =
    | BkcTokenEvent
    | EcosystemEvent
    | StakingEvent
    | LiquidityEvent
    | BuybackEvent
    | NftEvent
    | FortuneEvent
    | NotaryEvent
    | CharityEvent
    | AgoraEvent
    | RentalEvent
    | FaucetEvent
    | GovernanceEvent;
