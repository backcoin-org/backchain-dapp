// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *                    ██╗   ██╗███╗   ██╗███████╗████████╗ ██████╗ ██████╗
 *                    ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
 *                    ██║   ██║██╔██╗ ██║███████╗   ██║   ██║   ██║██████╔╝
 *                    ██║   ██║██║╚██╗██║╚════██║   ██║   ██║   ██║██╔═══╝
 *                    ╚██████╔╝██║ ╚████║███████║   ██║   ╚██████╔╝██║
 *                     ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : IInterfaces
 *  Version     : 6.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  V6 CHANGES
 *
 *  - Removed _boosterTokenId parameters from ALL service functions
 *  - Removed getBoosterDiscount() - no more fee discounts
 *  - NFTs now ONLY affect burn rate when claiming rewards from DelegationManager
 *  - All service fees are EQUAL for all users
 *  - 4-tier system: Bronze (1000), Silver (2500), Gold (4000), Diamond (5000)
 *
 * ============================================================================
 *
 *  OPERATOR SYSTEM
 *
 *  All fee-generating functions accept an optional `operator` parameter.
 *  Operators earn a percentage of fees (BKC + ETH) generated through
 *  their frontends/apps/bots.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │                        ARCHITECTURE OVERVIEW                            │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │                                                                         │
 *  │                      ┌──────────────────┐                               │
 *  │                      │ EcosystemManager │ ◄── Central Hub               │
 *  │                      └────────┬─────────┘                               │
 *  │                               │                                         │
 *  │      ┌────────────────────────┼────────────────────────┐                │
 *  │      │            │           │           │            │                │
 *  │      ▼            ▼           ▼           ▼            ▼                │
 *  │  ┌──────┐   ┌──────────┐  ┌───────┐  ┌────────┐  ┌─────────┐           │
 *  │  │ BKC  │   │ Mining   │  │Delegate│ │ Notary │  │ Fortune │           │
 *  │  │Token │   │ Manager  │  │Manager │ │        │  │  Pool   │           │
 *  │  └──────┘   └──────────┘  └────────┘ └────────┘  └─────────┘           │
 *  │                  ▲                                                      │
 *  │                  │ ALL FEES (BKC + ETH)                                 │
 *  │      ┌───────────┴───────────────────────────────────┐                  │
 *  │      │            │           │           │          │                  │
 *  │      ▼            ▼           ▼           ▼          ▼                  │
 *  │  ┌──────┐   ┌──────────┐  ┌───────┐  ┌────────┐  ┌─────────┐           │
 *  │  │Booste│   │NFT Pool  │  │Rental │  │Charity │  │Backchat │           │
 *  │  │ NFT  │   │ Factory  │  │Manager│  │ Pool   │  │         │           │
 *  │  └──────┘   └──────────┘  └───────┘  └────────┘  └─────────┘           │
 *  │                                                                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

// =============================================================================
//                           ECOSYSTEM MANAGER (V6)
// =============================================================================

interface IEcosystemManager {
    // Fee Configuration
    function getFee(bytes32 _serviceKey) external view returns (uint256);

    // Distribution Configuration
    function getMiningDistributionBips(bytes32 _poolKey) external view returns (uint256);
    function getFeeDistributionBips(bytes32 _poolKey) external view returns (uint256);

    // Core Address Registry
    function getBKCTokenAddress() external view returns (address);
    function getTreasuryAddress() external view returns (address);
    function getDelegationManagerAddress() external view returns (address);
    function getBoosterAddress() external view returns (address);
    function getMiningManagerAddress() external view returns (address);
    function getDecentralizedNotaryAddress() external view returns (address);
    function getFortunePoolAddress() external view returns (address);
    function getNFTLiquidityPoolFactoryAddress() external view returns (address);
    function getRentalManagerAddress() external view returns (address);

    // Extensible Module Registry
    function getModule(bytes32 _moduleKey) external view returns (address);
    function isModuleRegistered(bytes32 _moduleKey) external view returns (bool);

    // V6 Tier Functions
    function getValidTiers() external pure returns (uint256[4] memory);
    function getTierName(uint256 _boostBips) external pure returns (string memory);
    function isValidTier(uint256 _boostBips) external pure returns (bool);

    // Bulk Query
    function getAllAddresses() external view returns (
        address bkcToken,
        address treasury,
        address delegationManager,
        address booster,
        address miningManager,
        address notary,
        address fortunePool,
        address nftPoolFactory,
        address rentalManager
    );
}

// =============================================================================
//                           DELEGATION MANAGER (V6)
// =============================================================================

interface IDelegationManager {
    // Events
    event Delegated(
        address indexed user,
        uint256 indexed delegationIndex,
        uint256 amount,
        uint256 pStake,
        uint256 feePaid,
        address operator
    );

    // State
    function userTotalPStake(address _user) external view returns (uint256);
    function totalNetworkPStake() external view returns (uint256);

    // Core Functions (V6 - no boosterTokenId, fees equal for all)
    function depositMiningRewards(uint256 _amount) external;
    function delegate(uint256 _amount, uint256 _lockDuration, address _operator) external;
    function unstake(uint256 _delegationIndex, address _operator) external;
    function forceUnstake(uint256 _delegationIndex, address _operator) external;
    function claimReward(address _operator) external payable;

    // View Functions
    function pendingRewards(address _user) external view returns (uint256);
    function getDelegationCount(address _user) external view returns (uint256);
    function claimEthFee() external view returns (uint256);
    function getFeeStats() external view returns (
        uint256 ethCollected,
        uint256 bkcCollected,
        uint256 currentEthFee,
        uint256 totalBurned
    );

    // V6 NFT Boost Functions (for claim burn rate only)
    function getUserBestBoost(address _user) external view returns (uint256);
    function getBurnRateForBoost(uint256 _boost) external pure returns (uint256);
    function previewClaim(address _user) external view returns (
        uint256 totalRewards,
        uint256 burnAmount,
        uint256 userReceives,
        uint256 burnRateBips,
        uint256 nftBoost
    );
    function getTierName(uint256 _boost) external pure returns (string memory);
}

// =============================================================================
//                            MINING MANAGER
// =============================================================================

interface IMiningManager {
    // Core Functions (V1 - legacy)
    function performPurchaseMining(bytes32 _serviceKey, uint256 _purchaseAmount) external;

    // Core Functions (V3 - with operators)
    function performPurchaseMiningWithOperator(
        bytes32 _serviceKey,
        uint256 _purchaseAmount,
        address _operator
    ) external payable;

    // Operator Functions
    function claimOperatorEarnings() external;
    function getOperatorEarnings(address _operator) external view returns (uint256 bkcEarnings, uint256 ethEarnings);

    // View Functions
    function getMintAmount(uint256 _purchaseAmount) external view returns (uint256);
    function getCurrentMiningRate() external view returns (uint256);
    function getRemainingMintableSupply() external view returns (uint256);
    function isAuthorizedMiner(bytes32 _serviceKey, address _address) external view returns (bool);
    function getMiningStats() external view returns (
        uint256 mined,
        uint256 fees,
        uint256 rate,
        uint256 remaining
    );
    function getOperatorConfig() external view returns (uint256 bips, uint256 totalBkc, uint256 totalEth);
}

// =============================================================================
//                          REWARD BOOSTER NFT (V6)
// =============================================================================

interface IRewardBoosterNFT {
    // ERC721 Functions
    function ownerOf(uint256 _tokenId) external view returns (address);
    function balanceOf(address _owner) external view returns (uint256);

    // Boost Functions
    function boostBips(uint256 _tokenId) external view returns (uint256);
    function getBoostBips(uint256 _tokenId) external view returns (uint256);
    function mintFromSale(address _to, uint256 _boostBips, string calldata _metadataFile) external returns (uint256 tokenId);

    // Query Functions
    function tokensOfOwner(address _owner) external view returns (uint256[] memory);
    function getHighestBoostOf(address _owner) external view returns (uint256 tokenId, uint256 boost);
    function hasBooster(address _owner) external view returns (bool);
    function isAuthorizedMinter(address _minter) external view returns (bool);
    function totalMinted() external view returns (uint256);
    function nextTokenId() external view returns (uint256);

    // V6 Tier Functions
    function getValidTiers() external pure returns (uint256[4] memory);
    function getTierName(uint256 _boostBips) external pure returns (string memory);
    function isValidBoostTier(uint256 _boostBips) external pure returns (bool);
}

// =============================================================================
//                       NFT LIQUIDITY POOL FACTORY (V6)
// =============================================================================

interface INFTLiquidityPoolFactory {
    // State
    function getPoolAddress(uint256 _boostBips) external view returns (address);
    function isPool(address _pool) external view returns (bool);

    // View Functions
    function getDeployedBoostBips() external view returns (uint256[] memory);
    function getPoolCount() external view returns (uint256);
    function getAllPools() external view returns (address[] memory pools);
    function getPoolInfo(uint256 _boostBips) external view returns (
        address poolAddress,
        bool exists,
        bool active
    );
    function getAllPoolsInfo() external view returns (
        uint256[] memory boostTiers,
        address[] memory poolAddresses,
        bool[] memory activeStatus
    );
    function hasPool(uint256 _boostBips) external view returns (bool);
    function predictPoolAddress(bytes32 _salt) external view returns (address);

    // V6 Tier Functions
    function getValidTiers() external pure returns (uint256[4] memory);
    function getTierName(uint256 _boostBips) external pure returns (string memory);
    function isValidTier(uint256 _boostBips) external pure returns (bool);
}

// =============================================================================
//                          NFT LIQUIDITY POOL (V6)
// =============================================================================

interface INFTLiquidityPool {
    // State
    function boostBips() external view returns (uint256);

    // Liquidity Functions
    function addInitialLiquidity(uint256[] calldata _tokenIds, uint256 _bkcAmount) external;
    function addMoreNFTsToPool(uint256[] calldata _tokenIds) external;
    function addBKCLiquidity(uint256 _amount) external;
    function removeBKCLiquidity(uint256 _amount) external;

    // Trading Functions (V2 with operators)
    function buyNFT(address _operator) external payable returns (uint256 tokenId);
    function buySpecificNFT(uint256 _tokenId, address _operator) external payable;
    function buyNFTWithSlippage(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId);
    function sellNFT(uint256 _tokenId, uint256 _minPayout, address _operator) external payable;

    // Price Functions
    function getBuyPrice() external view returns (uint256);
    function getBuyPriceWithTax() external view returns (uint256);
    function getSellPrice() external view returns (uint256);
    function getSellPriceAfterTax() external view returns (uint256);
    function getTotalBuyCost() external view returns (uint256 bkcCost, uint256 ethCost);
    function getTotalSellInfo() external view returns (uint256 bkcPayout, uint256 ethCost);

    // View Functions
    function getPoolInfo() external view returns (
        uint256 nftCount,
        uint256 bkcBalance,
        uint256 k,
        bool initialized
    );
    function getAvailableNFTs() external view returns (uint256[] memory);
    function getNFTBalance() external view returns (uint256);
    function getBKCBalance() external view returns (uint256);
    function isNFTInPool(uint256 _tokenId) external view returns (bool);
    function getTradingStats() external view returns (
        uint256 totalBuys,
        uint256 totalSells,
        uint256 totalVolume,
        uint256 totalTaxes
    );
    function getSpread() external view returns (uint256 spread, uint256 spreadBips);
    function getEthFeeConfig() external view returns (uint256 buyFee, uint256 sellFee, uint256 totalCollected);

    // V6 Tier Functions
    function getTierName() external view returns (string memory);
    function getValidTiers() external pure returns (uint256[4] memory);
    function isValidTier(uint256 _boostBips) external pure returns (bool);
}

// =============================================================================
//                              BKC TOKEN
// =============================================================================

interface IBKCToken {
    // Constants
    function MAX_SUPPLY() external view returns (uint256);

    // ERC20 Functions
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // Mint/Burn Functions
    function mint(address _to, uint256 _amount) external;
    function burn(uint256 _amount) external;
    function burnFrom(address _from, uint256 _amount) external;

    // View Functions
    function isBlacklisted(address _account) external view returns (bool);
    function remainingMintableSupply() external view returns (uint256);
    function circulatingSupply() external view returns (uint256);
    function getTokenStats() external view returns (
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 mintable,
        uint256 burned
    );
    function mintedPercentage() external view returns (uint256);
    function getBurnStats() external view returns (uint256 burnedTotal, uint256 burnedPercentage);
}

// =============================================================================
//                            FORTUNE POOL
// =============================================================================

interface IFortunePool {
    // Core Functions (V3 - Commit-Reveal with operators)
    function commitPlay(
        bytes32 _commitmentHash,
        uint256 _wagerAmount,
        bool _isCumulative,
        address _operator
    ) external payable returns (uint256 gameId);

    function revealPlay(
        uint256 _gameId,
        uint256[] calldata _guesses,
        bytes32 _userSecret
    ) external;

    function cancelExpiredGame(uint256 _gameId) external;

    // View Functions
    function getJackpotTierId() external view returns (uint256);
    function getTier(uint256 _tierId) external view returns (uint256 maxRange, uint256 multiplier, bool active);
    function getJackpotTier() external view returns (uint256 tierId, uint256 maxRange, uint256 multiplier);
    function getAllTiers() external view returns (
        uint256[] memory maxRanges,
        uint256[] memory multipliers,
        bool[] memory activeStatus
    );
    function getRequiredServiceFee(bool _isCumulative) external view returns (uint256);
    function getExpectedGuessCount(bool _isCumulative) external view returns (uint256);
    function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) external view returns (uint256[] memory);
    function getGameResult(uint256 _gameId) external view returns (
        address player,
        uint256 wagerAmount,
        uint256 prizeWon,
        uint256[] memory guesses,
        uint256[] memory rolls,
        bool isCumulative,
        uint8 matchCount,
        uint256 timestamp
    );
    function getPoolStats() external view returns (
        uint256 poolBalance,
        uint256 gamesPlayed,
        uint256 wageredAllTime,
        uint256 paidOutAllTime,
        uint256 winsAllTime,
        uint256 ethCollected,
        uint256 bkcFees,
        uint256 expiredGames
    );
    function getCommitmentStatus(uint256 _gameId) external view returns (
        address player,
        uint256 wagerAmount,
        uint256 commitBlock,
        uint8 status,
        uint256 blocksUntilReveal,
        uint256 blocksUntilExpiry
    );
}

// =============================================================================
//                        DECENTRALIZED NOTARY (V6)
// =============================================================================

interface IDecentralizedNotary {
    // Core Functions (V6 - no boosterTokenId, fees equal for all)
    function notarize(
        string calldata _ipfsCid,
        string calldata _description,
        bytes32 _contentHash,
        address _operator
    ) external payable returns (uint256 tokenId);

    // View Functions
    function getFee() external view returns (uint256 bkcFee, uint256 ethFee);
    function totalSupply() external view returns (uint256);
    function notarizationFeeETH() external view returns (uint256);
    function verifyByHash(bytes32 _contentHash) external view returns (
        bool exists,
        uint256 tokenId,
        address owner,
        uint256 timestamp
    );
    function getStats() external view returns (
        uint256 notarizations,
        uint256 bkcCollected,
        uint256 ethCollected
    );
}

// =============================================================================
//                            RENTAL MANAGER (V6)
// =============================================================================

interface IRentalManager {
    // Listing Functions
    function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external;
    function updateListing(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external;
    function withdrawNFT(uint256 _tokenId) external;

    // Rental Functions (V4 with operators)
    function rentNFT(uint256 _tokenId, uint256 _hours, address _operator) external;
    function rentNFTSimple(uint256 _tokenId, address _operator) external;

    // User tracking
    function hasActiveRental(address _user) external view returns (bool);

    // V6: Required by DelegationManager for rented NFT boost check
    function getUserActiveRentals(address _user) external view returns (
        uint256[] memory tokenIds,
        uint256[] memory endTimes
    );

    // Spotlight Functions (V4 with operators)
    function spotlightListing(uint256 _tokenId, address _operator) external payable;
    function getSpotlightFee() external view returns (uint256);
    function getSpotlightRanking() external view returns (uint256[] memory tokenIds, uint256[] memory fees);

    // View Functions
    function isRented(uint256 _tokenId) external view returns (bool);
    function getRemainingRentalTime(uint256 _tokenId) external view returns (uint256);
    function hasRentalRights(uint256 _tokenId, address _user) external view returns (bool);
    function getAllListedTokenIds() external view returns (uint256[] memory);
    function getListingCount() external view returns (uint256);
    function getRentalCost(uint256 _tokenId, uint256 _hours) external view returns (
        uint256 totalCost,
        uint256 protocolFee,
        uint256 ownerPayout
    );
    function getMarketplaceStats() external view returns (
        uint256 activeListings,
        uint256 totalVol,
        uint256 totalFees,
        uint256 rentals,
        uint256 spotlightTotal,
        uint256 ethCollected,
        uint256 bkcFees
    );
    function getFeeConfig() external view returns (uint256 miningFeeBips, uint256 burnFeeBips, uint256 totalFeeBips);
}

// =============================================================================
//                            CHARITY POOL
// =============================================================================

interface ICharityPool {
    // Campaign Functions
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goalAmount,
        uint256 _durationInDays
    ) external returns (uint256 campaignId);
    function cancelCampaign(uint256 _campaignId) external;

    // Core Functions (V3 with operators)
    function donate(uint256 _campaignId, uint256 _amount, address _operator) external;
    function withdraw(uint256 _campaignId, address _operator) external payable;

    // View Functions
    function getCampaignDonations(uint256 _campaignId) external view returns (uint256[] memory);
    function getUserDonations(address _user) external view returns (uint256[] memory);
    function calculateDonationFees(uint256 _grossAmount) external view returns (
        uint256 miningFee,
        uint256 burnFee,
        uint256 netAmount
    );
    function calculateWithdrawal(uint256 _campaignId) external view returns (
        uint256 grossAmount,
        uint256 burnAmount,
        uint256 netAmount,
        uint256 requiredETH
    );
    function canWithdraw(uint256 _campaignId) external view returns (bool allowed, string memory reason);
    function getGlobalStats() external view returns (
        uint256 totalCampaigns,
        uint256 totalRaised,
        uint256 totalBurned,
        uint256 successfulWithdrawals
    );
    function getFeeConfig() external view returns (
        uint256 donationMiningFeeBips,
        uint256 donationBurnFeeBips,
        uint256 withdrawalFeeETH,
        uint256 goalNotMetBurnBips
    );
}

// =============================================================================
//                              BACKCHAT
// =============================================================================

interface IBackchat {
    // Profile Functions (V6 with operators)
    function createProfile(
        string calldata _username,
        string calldata _displayName,
        string calldata _bio,
        string calldata _avatarIpfs,
        string calldata _bannerIpfs,
        uint256 _tipAmount,
        address _operator
    ) external;

    function updateProfile(
        string calldata _displayName,
        string calldata _bio,
        string calldata _avatarIpfs,
        string calldata _bannerIpfs
    ) external;

    // Post Functions (V6 with operators)
    function createPost(
        string calldata _content,
        string calldata _ipfsHash,
        uint256 _tipAmount,
        address _operator
    ) external returns (uint256 postId);

    function replyToPost(
        uint256 _replyToPostId,
        string calldata _content,
        string calldata _ipfsHash,
        uint256 _tipAmount,
        address _operator
    ) external returns (uint256 postId);

    function repost(uint256 _originalPostId, uint256 _tipAmount, address _operator) external returns (uint256 postId);

    function quoteRepost(
        uint256 _originalPostId,
        string calldata _content,
        string calldata _ipfsHash,
        uint256 _tipAmount,
        address _operator
    ) external returns (uint256 postId);

    // Comment Functions (V6 with operators)
    function createComment(
        uint256 _postId,
        string calldata _content,
        string calldata _ipfsHash,
        uint256 _tipAmount,
        address _operator
    ) external returns (uint256 commentId);

    function replyToComment(
        uint256 _commentId,
        string calldata _content,
        string calldata _ipfsHash,
        uint256 _tipAmount,
        address _operator
    ) external returns (uint256 replyId);

    // Tip & Boost (V6 with operators)
    function sendTip(address _creator, uint256 _postId, uint256 _amount, address _operator) external;
    function boostPost(uint256 _postId, address _operator) external payable;

    // Community Notes (V6 with operators)
    function proposeNote(
        uint256 _postId,
        string calldata _content,
        string calldata _ipfsHash,
        uint256 _tipAmount,
        address _operator
    ) external returns (uint256 noteId);

    function voteOnNote(uint256 _noteId, bool _believe, uint256 _tipAmount, address _operator) external;

    // Badge Functions (V6 with operators)
    function purchaseBadge(uint8 _badgeType, address _operator) external payable;

    // Claim Rewards
    function claimRewards() external;

    // View Functions
    function getAddressByUsername(string calldata _username) external view returns (address);
    function getAuthorPosts(address _author) external view returns (uint256[] memory);
    function getPostComments(uint256 _postId) external view returns (uint256[] memory);
    function getCommentReplies(uint256 _commentId) external view returns (uint256[] memory);
    function getAuthorComments(address _author) external view returns (uint256[] memory);
    function getPostNotes(uint256 _postId) external view returns (uint256[] memory);
    function hasVotedOnNote(address _user, uint256 _noteId) external view returns (bool);
    function getBoostInfo(uint256 _postId) external view returns (uint256 totalAmount, uint256 lastBoostTime);
    function getEffectiveBoost(uint256 _postId) external view returns (uint256 effectiveBoost, uint256 daysPassed);
    function getBoostedPostIds() external view returns (uint256[] memory);
    function getBoostedPostsCount() external view returns (uint256);
    function isPostBoosted(uint256 _postId) external view returns (bool);
    function getCreatorBalance(address _creator) external view returns (uint256);
    function hasBoosterAccess(address _user) external view returns (bool);
    function getTotals() external view returns (uint256 posts, uint256 comments, uint256 notes, uint256 users);
    function getEconomyStats() external view returns (
        uint256 distributed,
        uint256 burned,
        uint256 toMining,
        uint256 toTreasury,
        uint256 toCreators,
        uint256 boostCollected
    );
}

// =============================================================================
//                          SIMPLE BKC FAUCET
// =============================================================================

interface ISimpleBKCFaucet {
    function distributeTo(address _recipient) external;
    function distributeToBatch(address[] calldata _recipients) external;
    function canClaim(address _user) external view returns (bool);
    function getCooldownRemaining(address _user) external view returns (uint256);
    function getNextClaimTime(address _user) external view returns (uint256);
    function getFaucetStatus() external view returns (
        uint256 ethBalance,
        uint256 tokenBalance,
        uint256 ethPerClaim,
        uint256 tokensPerClaim,
        uint256 estimatedEthClaims,
        uint256 estimatedTokenClaims
    );
    function getDistributionStats() external view returns (
        uint256 totalTokens,
        uint256 totalEth,
        uint256 uniqueUsers,
        uint256 distributions
    );
    function getUserInfo(address _user) external view returns (
        uint256 lastClaim,
        uint256 claimCount,
        bool canClaimNow,
        uint256 cooldownLeft
    );
}
