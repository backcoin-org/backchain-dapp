// ── Complete event ABIs for all Backchain contracts ──────────────────────────
// 117 events across 17 contracts — ethers.js v6 human-readable format
// ── BKCToken (ERC-20) ───────────────────────────────────────────────────────
export const BKC_TOKEN_EVENTS = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event MinterAdded(address indexed minter)',
    'event MinterRemoved(address indexed minter)',
    'event MinterAdminRenounced(address indexed deployer)',
    'event TokensBurned(address indexed from, uint256 amount, uint256 newTotalSupply, uint256 totalBurnedAllTime)',
    'event TokensMinted(address indexed to, uint256 amount, uint256 newTotalSupply)',
];
// ── BackchainEcosystem ──────────────────────────────────────────────────────
export const ECOSYSTEM_EVENTS = [
    'event FeeCollected(bytes32 indexed moduleId, address indexed user, address operator, address customRecipient, uint256 ethAmount, uint256 bkcFee)',
    'event EthDistributed(uint256 toReferrer, uint256 toCustom, uint256 toOperator, uint256 toTreasury, uint256 toBuyback)',
    'event BkcFeeDistributed(uint256 burned, uint256 toOperator, uint256 toStakers, uint256 toTreasury)',
    'event EthWithdrawn(address indexed recipient, uint256 amount)',
    'event BuybackETHWithdrawn(address indexed buyback, uint256 amount)',
    'event TutorSet(address indexed user, address indexed tutor)',
    'event TutorChanged(address indexed user, address indexed oldTutor, address indexed newTutor)',
    'event TutorRelayerUpdated(address indexed oldRelayer, address indexed newRelayer)',
    'event TutorBpsUpdated(uint16 newBps)',
    'event TutorBonusPaid(address indexed user, uint256 amount)',
    'event TutorBonusFunded(address indexed funder, uint256 amount, uint256 newPool)',
    'event TutorBonusAmountUpdated(uint256 oldAmount, uint256 newAmount)',
    'event TutorFeeUpdated(uint256 oldFee, uint256 newFee)',
    'event ChangeTutorFeeUpdated(uint256 oldFee, uint256 newFee)',
    'event ModuleRegistered(bytes32 indexed moduleId, address indexed contractAddr)',
    'event ContractDeauthorized(bytes32 indexed moduleId, address indexed contractAddr)',
    'event ModuleConfigUpdated(bytes32 indexed moduleId)',
    'event ModuleActivated(bytes32 indexed moduleId)',
    'event ModuleDeactivated(bytes32 indexed moduleId)',
    'event FeeConfigUpdated(bytes32 indexed actionId)',
    'event TreasuryUpdated(address indexed oldAddr, address indexed newAddr)',
    'event BuybackMinerUpdated(address indexed oldAddr, address indexed newAddr)',
    'event StakingPoolUpdated(address indexed oldAddr, address indexed newAddr)',
    'event BkcDistributionUpdated(uint16 burnBps, uint16 operatorBps, uint16 stakerBps, uint16 treasuryBps)',
    'event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner)',
    'event OwnershipTransferred(address indexed oldOwner, address indexed newOwner)',
    'event TokenRecovered(address indexed token, address indexed to, uint256 amount)',
];
// ── StakingPool ─────────────────────────────────────────────────────────────
export const STAKING_EVENTS = [
    'event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)',
    'event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)',
    'event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 totalPenalty, uint256 recycledAmount, uint256 burnedAmount, uint256 tutorAmount, address tutor, address operator)',
    'event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 recycledAmount, uint256 burnedAmount, uint256 tutorAmount, uint256 userReceived, uint256 nftBoostUsed, address tutor, address operator)',
    'event RewardNotified(uint256 amount, uint256 newAccRewardPerShare)',
    'event RewardNotifierSet(address indexed notifier, bool authorized)',
    'event RewardBoosterUpdated(address indexed oldBooster, address indexed newBooster)',
    'event ForceUnstakeEthFeeUpdated(uint256 oldFee, uint256 newFee)',
    'event DelegateForAuthorizationSet(address indexed contractAddr, bool authorized)',
];
// ── LiquidityPool ───────────────────────────────────────────────────────────
export const LIQUIDITY_POOL_EVENTS = [
    'event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 bkcAmount, uint256 shares)',
    'event LiquidityRemoved(address indexed provider, uint256 ethAmount, uint256 bkcAmount, uint256 shares)',
    'event SwapETHforBKC(address indexed buyer, uint256 ethIn, uint256 bkcOut)',
    'event SwapBKCforETH(address indexed seller, uint256 bkcIn, uint256 ethOut)',
];
// ── BuybackMiner ────────────────────────────────────────────────────────────
export const BUYBACK_EVENTS = [
    'event BuybackExecuted(address indexed caller, uint256 indexed buybackNumber, uint256 callerReward, uint256 ethSpent, uint256 bkcPurchased, uint256 bkcMined, uint256 bkcBurned, uint256 bkcToStakers, uint256 miningRateBps)',
    'event SwapTargetUpdated(address indexed oldPool, address indexed newPool)',
    'event ExecutionFeeUpdated(uint256 oldFee, uint256 newFee)',
    'event OwnershipTransferStarted(address indexed currentOwner, address indexed newOwner)',
    'event OwnershipTransferred(address indexed oldOwner, address indexed newOwner)',
];
// ── RewardBooster (ERC-721) ─────────────────────────────────────────────────
export const REWARD_BOOSTER_EVENTS = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
    'event PoolsConfigured(address[4] pools)',
    'event FusionContractSet(address indexed fusionAddr)',
    'event FusionMinted(address indexed to, uint256 indexed tokenId, uint8 tier)',
    'event FusionBurned(address indexed from, uint256 indexed tokenId, uint8 tier)',
];
// ── NFTPool ─────────────────────────────────────────────────────────────────
export const NFT_POOL_EVENTS = [
    'event PoolInitialized(uint8 tier, uint256 nftCount, uint256 mintableReserves, uint256 bkcAmount, uint256 virtualReserves, uint256 initialK)',
    'event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 newNftCount, address operator)',
    'event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 newNftCount, address operator)',
];
// ── NFTFusion ───────────────────────────────────────────────────────────────
export const NFT_FUSION_EVENTS = [
    'event Fused(address indexed user, uint256 indexed tokenId1, uint256 indexed tokenId2, uint256 newTokenId, uint8 sourceTier, uint8 resultTier, address operator)',
    'event Split(address indexed user, uint256 indexed burnedTokenId, uint8 sourceTier, uint8 targetTier, uint256 mintCount, uint256[] newTokenIds, address operator)',
];
// ── FortunePool ─────────────────────────────────────────────────────────────
export const FORTUNE_EVENTS = [
    'event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)',
    'event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)',
    'event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)',
    'event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)',
    'event PrizePoolFunded(address indexed funder, uint256 amount)',
    'event ExcessBurned(uint256 amount, uint256 totalBurned)',
];
// ── Notary ──────────────────────────────────────────────────────────────────
export const NOTARY_EVENTS = [
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)',
    'event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)',
    'event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)',
    'event CertificateBoosted(bytes32 indexed documentHash, address indexed booster, uint32 boostExpiry, address operator)',
];
// ── CharityPool ─────────────────────────────────────────────────────────────
export const CHARITY_EVENTS = [
    'event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint96 goal, uint48 deadline, address operator)',
    'event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, address operator)',
    'event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)',
    'event CampaignClosed(uint256 indexed campaignId, address indexed owner, uint96 raised)',
    'event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint96 amount)',
];
// ── Agora ───────────────────────────────────────────────────────────────────
export const AGORA_EVENTS = [
    'event PostCreated(uint256 indexed postId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)',
    'event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)',
    'event RepostCreated(uint256 indexed postId, uint256 indexed originalId, address indexed author, uint8 tag, string contentHash, address operator)',
    'event PostEdited(uint256 indexed postId, address indexed author, string newContentHash)',
    'event PostDeleted(uint256 indexed postId, address indexed author)',
    'event TagChanged(uint256 indexed postId, uint8 oldTag, uint8 newTag)',
    'event Liked(uint256 indexed postId, address indexed liker, address indexed author, address operator)',
    'event SuperLiked(uint256 indexed postId, address indexed voter, address indexed author, uint256 amount, address operator)',
    'event Downvoted(uint256 indexed postId, address indexed voter, address indexed author, address operator)',
    'event Followed(address indexed follower, address indexed followed, address operator)',
    'event Unfollowed(address indexed follower, address indexed followed)',
    'event PostReported(uint256 indexed postId, address indexed reporter, address indexed author, uint8 category, uint256 totalReports)',
    'event PostBoosted(uint256 indexed postId, address indexed booster, uint8 tier, uint64 boostExpiry, address operator)',
    'event PostTipped(uint256 indexed postId, address indexed tipper, address indexed author, uint256 amount, address operator)',
    'event UserBlocked(address indexed blocker, address indexed blocked)',
    'event UserUnblocked(address indexed blocker, address indexed unblocked)',
    'event ProfileCreated(address indexed user, string metadataURI)',
    'event ProfileUpdated(address indexed user, string metadataURI)',
    'event PostPinned(address indexed user, uint256 indexed postId)',
    'event ProfileBoosted(address indexed user, uint64 boostExpiry, address operator)',
    'event BadgeObtained(address indexed user, uint8 tier, uint64 badgeExpiry, address operator)',
];
// ── RentalManager ───────────────────────────────────────────────────────────
export const RENTAL_EVENTS = [
    'event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerDay)',
    'event ListingUpdated(uint256 indexed tokenId, uint96 pricePerDay)',
    'event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)',
    'event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)',
    'event ListingBoosted(uint256 indexed tokenId, address indexed owner, uint256 days_, uint256 boostCost, uint32 newBoostExpiry)',
    'event EarningsWithdrawn(address indexed owner, uint256 amount)',
];
// ── SimpleBKCFaucet ─────────────────────────────────────────────────────────
export const FAUCET_EVENTS = [
    'event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)',
    'event ConfigUpdated(address relayer, uint256 tokensPerClaim, uint256 ethPerClaim, uint256 cooldown)',
    'event Paused(bool isPaused)',
    'event FundsDeposited(address indexed sender, uint256 eth, uint256 tokens)',
    'event FundsWithdrawn(address indexed to, uint256 eth, uint256 tokens)',
];
// ── BackchainGovernance ─────────────────────────────────────────────────────
export const GOVERNANCE_EVENTS = [
    'event AdminTransferred(address indexed previous, address indexed current)',
    'event PendingAdminSet(address indexed pending)',
    'event PhaseAdvanced(uint8 indexed previous, uint8 indexed current)',
    'event DAOSet(address indexed daoAddress)',
    'event TimelockDelayUpdated(uint256 previous, uint256 current)',
    'event ProposalCreated(uint256 indexed proposalId, address indexed target, uint256 value, bytes data, uint256 eta, string description)',
    'event ProposalExecuted(uint256 indexed proposalId)',
    'event ProposalCancelled(uint256 indexed proposalId)',
    'event DirectExecution(address indexed target, uint256 value, bytes data)',
];
// ── AirdropVesting ──────────────────────────────────────────────────────────
export const AIRDROP_EVENTS = [
    'event AllocationSet(address indexed beneficiary, uint256 amount)',
    'event AllocationFinalized(uint256 totalAllocated, uint256 beneficiaryCount)',
    'event ClaimedAndStaked(address indexed beneficiary, uint256 amount, uint256 lockDays)',
    'event ClaimedVested(address indexed beneficiary, uint256 totalAmount, uint256 firstRelease)',
    'event VestedWithdrawn(address indexed beneficiary, uint256 amount, uint256 totalWithdrawn, uint256 remaining)',
];
// ── Aggregated ──────────────────────────────────────────────────────────────
/** All event ABIs grouped by contract name */
export const ALL_EVENT_ABIS = {
    BKCToken: BKC_TOKEN_EVENTS,
    BackchainEcosystem: ECOSYSTEM_EVENTS,
    StakingPool: STAKING_EVENTS,
    LiquidityPool: LIQUIDITY_POOL_EVENTS,
    BuybackMiner: BUYBACK_EVENTS,
    RewardBooster: REWARD_BOOSTER_EVENTS,
    NFTPool: NFT_POOL_EVENTS,
    NFTFusion: NFT_FUSION_EVENTS,
    FortunePool: FORTUNE_EVENTS,
    Notary: NOTARY_EVENTS,
    CharityPool: CHARITY_EVENTS,
    Agora: AGORA_EVENTS,
    RentalManager: RENTAL_EVENTS,
    SimpleBKCFaucet: FAUCET_EVENTS,
    BackchainGovernance: GOVERNANCE_EVENTS,
    AirdropVesting: AIRDROP_EVENTS,
};
/** Flat array of all event ABIs */
export const ALL_EVENTS_FLAT = Object.values(ALL_EVENT_ABIS).flat();
//# sourceMappingURL=abis.js.map