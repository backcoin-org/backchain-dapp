// js/config.js
// ✅ PRODUCTION V26

// ============================================================================
// 1. ENVIRONMENT & ALCHEMY CONFIG
// ============================================================================
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log(`Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const GAS_POLICY_ID = import.meta.env.VITE_GAS_POLICY_ID;

if (!ALCHEMY_KEY) {
    console.error("❌ CRITICAL: VITE_ALCHEMY_API_KEY not found");
}

export const CONFIG = {
    alchemy: {
        apiKey: ALCHEMY_KEY, 
        gasPolicyId: GAS_POLICY_ID 
    }
};

// ============================================================================
// 2. NETWORK CONFIGURATION
// ============================================================================
export const sepoliaRpcUrl = `https://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;
export const sepoliaWssUrl = `wss://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;
export const sepoliaChainId = 421614n;

export const ipfsGateway = "https://white-defensive-eel-240.mypinata.cloud/ipfs/";

// ============================================================================
// 3. CONTRACT ADDRESSES
// ============================================================================
export const addresses = {};

export async function loadAddresses() {
    try {
        const response = await fetch(`./deployment-addresses.json?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch deployment-addresses.json: ${response.status}`);
        }
        
        const jsonAddresses = await response.json();

        const requiredAddresses = ['bkcToken', 'delegationManager', 'ecosystemManager', 'miningManager'];
        const missingAddresses = requiredAddresses.filter(key => !jsonAddresses[key]);
        
        if (missingAddresses.length > 0) {
            throw new Error(`Missing required addresses: ${missingAddresses.join(', ')}`);
        }

        Object.assign(addresses, jsonAddresses);

        addresses.actionsManager = jsonAddresses.fortunePool; 
        addresses.fortunePool = jsonAddresses.fortunePool;
        
        addresses.rentalManager = jsonAddresses.rentalManager || 
                                   jsonAddresses.RentalManager ||
                                   jsonAddresses.rental_manager ||
                                   null;
        
        addresses.decentralizedNotary = jsonAddresses.decentralizedNotary ||
                                         jsonAddresses.notary ||
                                         jsonAddresses.Notary ||
                                         null;
        
        addresses.bkcDexPoolAddress = jsonAddresses.bkcDexPoolAddress || "#";

        console.log("✅ Contract addresses loaded");
        return true;

    } catch (error) {
        console.error("❌ Failed to load contract addresses:", error);
        return false;
    }
}

// ============================================================================
// 4. APPLICATION CONSTANTS
// ============================================================================
export const FAUCET_AMOUNT_WEI = 20n * 10n**18n;

export const boosterTiers = [
    { name: "Diamond", boostBips: 7000, color: "text-cyan-400", img: `${ipfsGateway}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq/diamond_booster.json`, realImg: `${ipfsGateway}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq`, borderColor: "border-cyan-400/50", glowColor: "bg-cyan-500/10" },
    { name: "Platinum", boostBips: 6000, color: "text-gray-300", img: `${ipfsGateway}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei/platinum_booster.json`, realImg: `${ipfsGateway}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei`, borderColor: "border-gray-300/50", glowColor: "bg-gray-400/10" },
    { name: "Gold", boostBips: 5000, color: "text-amber-400", img: `${ipfsGateway}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44/gold_booster.json`, realImg: `${ipfsGateway}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44`, borderColor: "border-amber-400/50", glowColor: "bg-amber-500/10" },
    { name: "Silver", boostBips: 4000, color: "text-gray-400", img: `${ipfsGateway}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4/silver_booster.json`, realImg: `${ipfsGateway}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4`, borderColor: "border-gray-400/50", glowColor: "bg-gray-500/10" },
    { name: "Bronze", boostBips: 3000, color: "text-yellow-600", img: `${ipfsGateway}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m/bronze_booster.json`, realImg: `${ipfsGateway}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m`, borderColor: "border-yellow-600/50", glowColor: "bg-yellow-600/10" },
    { name: "Iron", boostBips: 2000, color: "text-slate-500", img: `${ipfsGateway}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu/iron_booster.json`, realImg: `${ipfsGateway}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu`, borderColor: "border-slate-500/50", glowColor: "bg-slate-600/10" },
    { name: "Crystal", boostBips: 1000, color: "text-indigo-300", img: `${ipfsGateway}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u/crystal_booster.json`, realImg: `${ipfsGateway}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u`, borderColor: "border-indigo-300/50", glowColor: "bg-indigo-300/10" }
];

// ============================================================================
// 5. CONTRACT ABIs
// ============================================================================

export const bkcTokenABI = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 value) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function TGE_SUPPLY() view returns (uint256)",
    "function remainingMintableSupply() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const delegationManagerABI = [
    "function totalNetworkPStake() view returns (uint256)",
    "function userTotalPStake(address _user) view returns (uint256)",
    "function pendingRewards(address _user) view returns (uint256)",
    "function MIN_LOCK_DURATION() view returns (uint256)",
    "function MAX_LOCK_DURATION() view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])",
    "function delegate(uint256 _amount, uint256 _lockDuration, uint256 _boosterTokenId) external",
    "function unstake(uint256 _delegationIndex, uint256 _boosterTokenId) external",
    "function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external",
    "function claimReward(uint256 _boosterTokenId) external",
    "event Delegated(address indexed user, uint256 delegationIndex, uint256 amount, uint256 pStakeGenerated, uint256 feeAmount)",
    "event Unstaked(address indexed user, uint256 delegationIndex, uint256 amountReceived, uint256 feePaid)",
    "event RewardClaimed(address indexed user, uint256 amountReceived, uint256 feePaid)"
];

export const rewardBoosterABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function approve(address to, uint256 tokenId)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function boostBips(uint256 tokenId) view returns (uint256)",
    "function tokensOfOwner(address owner) view returns (uint256[])",
    "function getHighestBoostOf(address owner) view returns (uint256 tokenId, uint256 boostBips)",
    "function hasBooster(address owner) view returns (bool)",
    "function totalSupply() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

export const rentalManagerABI = [
    "function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external",
    "function updateListing(uint256 _tokenId, uint256 _newPricePerHour, uint256 _newMinHours, uint256 _newMaxHours) external",
    "function withdrawNFT(uint256 _tokenId) external",
    "function rentNFT(uint256 _tokenId, uint256 _hours) external",
    "function getListing(uint256 _tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool isActive, uint256 totalEarnings, uint256 rentalCount))",
    "function getRental(uint256 _tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime, uint256 paidAmount))",
    "function isRented(uint256 _tokenId) view returns (bool)",
    "function hasRentalRights(uint256 _tokenId, address _user) view returns (bool)",
    "function getRemainingRentalTime(uint256 _tokenId) view returns (uint256)",
    "function getAllListedTokenIds() view returns (uint256[])",
    "function getListingCount() view returns (uint256)",
    "function getRentalCost(uint256 _tokenId, uint256 _hours) view returns (uint256 totalCost, uint256 protocolFee, uint256 ownerPayout)",
    "function getMarketplaceStats() view returns (uint256 activeListings, uint256 totalVol, uint256 totalFees, uint256 rentals)",
    "event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)",
    "event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 totalCost, uint256 protocolFee, uint256 ownerPayout, uint256 endTime)",
    "event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)",
    "event RentalExpired(uint256 indexed tokenId, address indexed tenant)"
];

export const nftPoolABI = [
    "function getBuyPrice() view returns (uint256)",
    "function getSellPrice() view returns (uint256)",
    "function getBuyPriceWithTax() view returns (uint256)",
    "function getSellPriceAfterTax() view returns (uint256)",
    "function buyNFT() external payable returns (uint256)",
    "function buySpecificNFT(uint256 _tokenId) external payable",
    "function buyNFTWithSlippage(uint256 _maxPrice) external payable returns (uint256)",
    "function sellNFT(uint256 _tokenId, uint256 _minPayout) external",
    "function getPoolInfo() view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)",
    "function getAvailableNFTs() view returns (uint256[])",
    "function boostBips() view returns (uint256)",
    "event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price, uint256 taxPaid)",
    "event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid)"
];

export const actionsManagerABI = [
    "function participate(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable",
    "function oracleFee() view returns (uint256)",
    "function gameFeeBips() view returns (uint256)",
    "function getRequiredOracleFee(bool _isCumulative) view returns (uint256)",
    "function activeTierCount() view returns (uint256)",
    "function gameCounter() view returns (uint256)",
    "function prizePoolBalance() view returns (uint256)",
    "function getExpectedGuessCount(bool _isCumulative) view returns (uint256)",
    "function isGameFulfilled(uint256 _gameId) view returns (bool)",
    "function getGameResults(uint256 _gameId) view returns (uint256[])",
    "function getJackpotTierId() view returns (uint256)",
    "function getJackpotTier() view returns (uint256 tierId, uint128 maxRange, uint64 multiplierBips, bool active)",
    "function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)",
    "function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)",
    "function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)",
    "event GameRequested(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256[] guesses, bool isCumulative, uint256 targetTier)",
    "event GameFulfilled(uint256 indexed gameId, address indexed player, uint256 prizeWon, uint256[] rolls, uint256[] guesses, bool isCumulative)"
];

export const publicSaleABI = [
    "function tiers(uint256 tierId) view returns (uint256 priceInWei, uint64 maxSupply, uint64 mintedCount, uint16 boostBips, bool isConfigured, bool isActive, string metadataFile, string name)",
    "function buyNFT(uint256 _tierId) external payable",
    "function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) external payable",
    "function getTierPrice(uint256 _tierId) view returns (uint256)",
    "function getTierSupply(uint256 _tierId) view returns (uint64 maxSupply, uint64 mintedCount)",
    "function isTierActive(uint256 _tierId) view returns (bool)",
    "event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)"
];

export const decentralizedNotaryABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function getDocument(uint256 tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))",
    "function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)",
    "function getBaseFee() view returns (uint256)",
    "function calculateFee(uint256 _boosterTokenId) view returns (uint256)",
    "function notarize(string _ipfsCid, string _description, bytes32 _contentHash, uint256 _boosterTokenId) external returns (uint256)",
    "event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 feePaid)"
];

export const faucetABI = [
    "function canClaim(address _user) view returns (bool)",
    "function getCooldownRemaining(address _user) view returns (uint256)",
    "function getUserInfo(address _user) view returns (uint256 lastClaimTime, uint256 totalClaimed)",
    "function getFaucetStatus() view returns (uint256 bkcBalance, uint256 ethBalance, bool isActive)",
    "function COOLDOWN_PERIOD() view returns (uint256)",
    "function TOKEN_AMOUNT() view returns (uint256)",
    "function ETH_AMOUNT() view returns (uint256)",
    "event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer)"
];

export const ecosystemManagerABI = [
    "function getServiceRequirements(bytes32 _serviceKey) view returns (uint256 fee, uint256 pStake)",
    "function getFee(bytes32 _serviceKey) view returns (uint256)",
    "function getBoosterDiscount(uint256 _boostBips) view returns (uint256)",
    "function getMiningDistributionBips() view returns (uint256 stakingBips, uint256 minerBips, uint256 treasuryBips)",
    "function getFeeDistributionBips() view returns (uint256 burnBips, uint256 treasuryBips, uint256 poolBips)",
    "function getTreasuryAddress() view returns (address)",
    "function getDelegationManagerAddress() view returns (address)",
    "function getBKCTokenAddress() view returns (address)",
    "function getBoosterAddress() view returns (address)",
    "function getNFTLiquidityPoolFactoryAddress() view returns (address)",
    "function getMiningManagerAddress() view returns (address)",
    "function getFortunePoolAddress() view returns (address)",
    "function getNotaryAddress() view returns (address)",
    "function getRentalManagerAddress() view returns (address)",
    "function getPublicSaleAddress() view returns (address)",
    "function isInitialized() view returns (bool)",
    "function owner() view returns (address)"
];

export const miningManagerABI = [
    "function pendingMinerRewards(address _user) view returns (uint256)",
    "function claimMinerRewards(uint256 _boosterTokenId) external",
    "function getLastRewardBlock() view returns (uint256)",
    "function getRewardPerBlock() view returns (uint256)",
    "event MinerRewardsClaimed(address indexed user, uint256 amount)"
];

export const nftPoolFactoryABI = [
    "function getPoolAddress(uint256 boostBips) view returns (address)",
    "function isPool(address pool) view returns (bool)",
    "function getAllPools() view returns (address[])",
    "function getPoolCount() view returns (uint256)",
    "event PoolDeployed(uint256 indexed boostBips, address indexed poolAddress)"
];