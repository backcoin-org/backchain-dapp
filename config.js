// js/config.js
// ✅ PRODUCTION V30 - Auto Network Management for MetaMask

// ============================================================================
// 1. ENVIRONMENT & API KEYS
// ============================================================================
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log(`Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const GAS_POLICY_ID = import.meta.env.VITE_GAS_POLICY_ID;

if (!ALCHEMY_KEY) {
    console.warn("⚠️ VITE_ALCHEMY_API_KEY not found - Using public RPCs only");
}

export const CONFIG = {
    alchemy: {
        apiKey: ALCHEMY_KEY, 
        gasPolicyId: GAS_POLICY_ID 
    }
};

// ============================================================================
// 1.5 🔥 METAMASK NETWORK AUTO-CONFIG (V30 - NOVO!)
// ============================================================================
// Esta configuração é usada para adicionar/atualizar a rede no MetaMask automaticamente
// Resolve o problema de RPC ruim sem intervenção do usuário

export const METAMASK_NETWORK_CONFIG = {
    chainId: '0x66eee', // 421614 in hex
    chainIdDecimal: 421614,
    chainName: 'Arbitrum Sepolia',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    // 🔥 RPCs em ordem de prioridade para o MetaMask
    rpcUrls: ALCHEMY_KEY 
        ? [
            `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
            'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
            'https://arbitrum-sepolia-rpc.publicnode.com'
          ]
        : [
            'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
            'https://arbitrum-sepolia-rpc.publicnode.com',
            'https://sepolia-rollup.arbitrum.io/rpc'
          ]
};

// ============================================================================
// 2. NETWORK CONFIGURATION - MULTI-RPC SYSTEM
// ============================================================================

// 🔥 Lista de RPCs em ordem de prioridade
// ⚠️ IMPORTANTE: Alchemy como primário porque Arbitrum Official tem problemas de CORS
// O header "Access-Control-Allow-Origin: *,*" (duplicado) é rejeitado pelos browsers
export const RPC_ENDPOINTS = [
    {
        name: "Alchemy",
        url: ALCHEMY_KEY ? `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}` : null,
        priority: 1,
        isPublic: false,
        corsCompatible: true  // ✅ Funciona em browsers
    },
    {
        name: "BlockPI",
        url: "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
        priority: 2,
        isPublic: true,
        corsCompatible: true  // ✅ Funciona em browsers
    },
    {
        name: "PublicNode",
        url: "https://arbitrum-sepolia-rpc.publicnode.com",
        priority: 3,
        isPublic: true,
        corsCompatible: true  // ✅ Funciona em browsers
    },
    {
        name: "Arbitrum Official",
        url: "https://sepolia-rollup.arbitrum.io/rpc",
        priority: 4,
        isPublic: true,
        corsCompatible: false  // ❌ CORS header duplicado (*,*)
    }
].filter(rpc => rpc.url !== null); // Remove RPCs sem URL (ex: Alchemy sem key)

// 🔥 RPC Principal - Alchemy (compatível com CORS)
export const sepoliaRpcUrl = ALCHEMY_KEY 
    ? `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : "https://arbitrum-sepolia.blockpi.network/v1/rpc/public";

// WebSocket - Alchemy (para eventos em tempo real, se disponível)
export const sepoliaWssUrl = ALCHEMY_KEY 
    ? `wss://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : null;

export const sepoliaChainId = 421614n;

// ============================================================================
// 3. RPC FALLBACK SYSTEM
// ============================================================================

let currentRpcIndex = 0;
let rpcHealthStatus = new Map(); // Track health of each RPC

/**
 * Obtém a URL do RPC atual
 */
export function getCurrentRpcUrl() {
    return RPC_ENDPOINTS[currentRpcIndex]?.url || sepoliaRpcUrl;
}

/**
 * Obtém o nome do RPC atual
 */
export function getCurrentRpcName() {
    return RPC_ENDPOINTS[currentRpcIndex]?.name || "Unknown";
}

/**
 * Alterna para o próximo RPC disponível (apenas CORS-compatible)
 * @returns {string|null} URL do próximo RPC ou null se todos falharam
 */
export function switchToNextRpc() {
    const startIndex = currentRpcIndex;
    
    do {
        currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
        
        const candidate = RPC_ENDPOINTS[currentRpcIndex];
        
        // Pular RPCs com CORS incompatível
        if (!candidate.corsCompatible) {
            console.warn(`⏭️ Skipping ${candidate.name} (CORS incompatible)`);
            continue;
        }
        
        // Se voltou ao início, todos foram tentados
        if (currentRpcIndex === startIndex) {
            console.warn("⚠️ All RPCs have been tried. Resetting to primary.");
            currentRpcIndex = 0;
            return RPC_ENDPOINTS[0].url;
        }
        
    } while (rpcHealthStatus.get(RPC_ENDPOINTS[currentRpcIndex].url) === 'unhealthy');
    
    const newRpc = RPC_ENDPOINTS[currentRpcIndex];
    console.log(`🔄 Switched to RPC: ${newRpc.name}`);
    
    return newRpc.url;
}

/**
 * Marca um RPC como não saudável
 * @param {string} rpcUrl URL do RPC com problema
 */
export function markRpcUnhealthy(rpcUrl) {
    rpcHealthStatus.set(rpcUrl, 'unhealthy');
    console.warn(`❌ RPC marked unhealthy: ${rpcUrl}`);
    
    // Limpa o status após 60 segundos para tentar novamente
    setTimeout(() => {
        rpcHealthStatus.delete(rpcUrl);
        console.log(`♻️ RPC health reset: ${rpcUrl}`);
    }, 60000);
}

/**
 * Marca um RPC como saudável
 * @param {string} rpcUrl URL do RPC funcionando
 */
export function markRpcHealthy(rpcUrl) {
    rpcHealthStatus.set(rpcUrl, 'healthy');
}

/**
 * Reseta para o RPC primário (Alchemy)
 */
export function resetToPrimaryRpc() {
    currentRpcIndex = 0;
    rpcHealthStatus.clear();
    console.log(`✅ Reset to primary RPC: ${RPC_ENDPOINTS[0].name}`);
}

/**
 * Obtém estatísticas dos RPCs
 */
export function getRpcStats() {
    return {
        current: getCurrentRpcName(),
        currentUrl: getCurrentRpcUrl(),
        totalEndpoints: RPC_ENDPOINTS.length,
        healthStatus: Object.fromEntries(rpcHealthStatus)
    };
}

// ============================================================================
// 4. IPFS GATEWAY
// ============================================================================

export const ipfsGateway = "https://gateway.lighthouse.storage/ipfs/";

export const IPFS_GATEWAYS = [
    "https://dweb.link/ipfs/",
    "https://w3s.link/ipfs/",
    "https://nftstorage.link/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://ipfs.io/ipfs/"
];

export function getIpfsUrl(cid) {
    if (!cid) return null;
    
    // Se já é uma URL completa, converter para gateway preferido
    if (cid.startsWith('http')) {
        const cidMatch = cid.match(/ipfs\/([a-zA-Z0-9]+)/);
        if (cidMatch) {
            return `${IPFS_GATEWAYS[0]}${cidMatch[1]}`;
        }
        return cid;
    }
    
    // Remover prefixo ipfs:// se existir
    const cleanCid = cid.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${cleanCid}`;
}

// ============================================================================
// 5. CONTRACT ADDRESSES
// ============================================================================

export const addresses = {};

export const contractAddresses = {
    bkcToken: null,
    backchainEcosystem: null,
    stakingPool: null,
    buybackMiner: null,
    rewardBooster: null,
    nftPoolFactory: null,
    fortunePool: null,
    agora: null,
    notary: null,
    charityPool: null,
    rentalManager: null,
    liquidityPool: null,
    faucet: null,
    backchainGovernance: null,
    treasuryWallet: null
};

export async function loadAddresses() {
    try {
        const response = await fetch(`./deployment-addresses.json?t=${Date.now()}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch deployment-addresses.json: ${response.status}`);
        }

        const json = await response.json();

        // V9: Required contracts
        const requiredAddresses = ['bkcToken', 'backchainEcosystem', 'stakingPool', 'buybackMiner'];
        // Backward-compatible: check both old and new names
        const resolvedRequired = requiredAddresses.every(key =>
            json[key] || json[_legacyName(key)]
        );

        if (!resolvedRequired) {
            const missing = requiredAddresses.filter(key => !json[key] && !json[_legacyName(key)]);
            throw new Error(`Missing required addresses: ${missing.join(', ')}`);
        }

        // V9 name resolution with backward-compatible fallbacks
        addresses.bkcToken = json.bkcToken;
        addresses.backchainEcosystem = json.backchainEcosystem || json.ecosystemManager;
        addresses.stakingPool = json.stakingPool || json.delegationManager;
        addresses.buybackMiner = json.buybackMiner || json.miningManager;
        addresses.rewardBooster = json.rewardBooster || json.rewardBoosterNFT;
        addresses.nftPoolFactory = json.nftPoolFactory || json.nftLiquidityPoolFactory;
        addresses.fortunePool = json.fortunePool || json.fortunePoolV2;
        addresses.agora = json.agora || json.backchat;
        addresses.notary = json.notary || json.decentralizedNotary;
        addresses.charityPool = json.charityPool;
        addresses.rentalManager = json.rentalManager;
        addresses.liquidityPool = json.liquidityPool;
        addresses.faucet = json.faucet || json.simpleBkcFaucet;
        addresses.backchainGovernance = json.backchainGovernance;
        addresses.treasuryWallet = json.treasuryWallet;

        // Pool addresses (per-tier NFT liquidity pools)
        addresses.pool_bronze = json.pool_bronze;
        addresses.pool_silver = json.pool_silver;
        addresses.pool_gold = json.pool_gold;
        addresses.pool_diamond = json.pool_diamond;

        // Also update contractAddresses for compatibility
        Object.assign(contractAddresses, addresses);

        console.log("✅ V9 contract addresses loaded");
        console.log("   Ecosystem:", addresses.backchainEcosystem);
        console.log("   StakingPool:", addresses.stakingPool);
        console.log("   Agora:", addresses.agora);
        console.log("   FortunePool:", addresses.fortunePool);
        return true;

    } catch (error) {
        console.error("❌ Failed to load contract addresses:", error);
        return false;
    }
}

// Maps V9 names to legacy deployment-addresses.json key names
function _legacyName(v9Name) {
    const map = {
        backchainEcosystem: 'ecosystemManager',
        stakingPool: 'delegationManager',
        buybackMiner: 'miningManager',
        rewardBooster: 'rewardBoosterNFT',
        nftPoolFactory: 'nftLiquidityPoolFactory',
        agora: 'backchat',
        notary: 'decentralizedNotary'
    };
    return map[v9Name] || v9Name;
}

// Alias for compatibility
export const loadContractAddresses = loadAddresses;

// ============================================================================
// 6. APPLICATION CONSTANTS
// ============================================================================

export const FAUCET_AMOUNT_WEI = 20n * 10n**18n;

// ============================================================================
// ✅ V6.8: NFT BOOST TIERS - Now only 4 tiers with BURN RATE reduction
// ============================================================================
// The boost value REDUCES the burn rate on delegation claim rewards:
// - No NFT: 50% burn → user keeps 50%
// - Bronze (10%): 40% burn → user keeps 60%
// - Silver (25%): 25% burn → user keeps 75%
// - Gold (40%): 10% burn → user keeps 90%
// - Diamond (50%): 0% burn → user keeps 100%

export const boosterTiers = [
    {
        name: "Diamond",
        boostBips: 5000,  // 50% boost → 0% burn
        burnRate: 0,
        keepRate: 100,
        color: "text-cyan-400",
        emoji: "💎",
        image: "https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",
        borderColor: "border-cyan-400/50",
        glowColor: "bg-cyan-500/10",
        bgGradient: "from-cyan-500/20 to-blue-500/20"
    },
    {
        name: "Gold",
        boostBips: 4000,  // 40% boost → 10% burn
        burnRate: 10,
        keepRate: 90,
        color: "text-amber-400",
        emoji: "🥇",
        image: "https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",
        borderColor: "border-amber-400/50",
        glowColor: "bg-amber-500/10",
        bgGradient: "from-amber-500/20 to-yellow-500/20"
    },
    {
        name: "Silver",
        boostBips: 2500,  // 25% boost → 25% burn
        burnRate: 25,
        keepRate: 75,
        color: "text-gray-300",
        emoji: "🥈",
        image: "https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",
        borderColor: "border-gray-400/50",
        glowColor: "bg-gray-500/10",
        bgGradient: "from-gray-400/20 to-zinc-500/20"
    },
    {
        name: "Bronze",
        boostBips: 1000,  // 10% boost → 40% burn
        burnRate: 40,
        keepRate: 60,
        color: "text-yellow-600",
        emoji: "🥉",
        image: "https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",
        borderColor: "border-yellow-600/50",
        glowColor: "bg-yellow-600/10",
        bgGradient: "from-yellow-600/20 to-orange-600/20"
    }
];

// Helper function to get tier info by boost value
export function getTierByBoost(boostBips) {
    const sorted = [...boosterTiers].sort((a, b) => b.boostBips - a.boostBips);
    for (const tier of sorted) {
        if (boostBips >= tier.boostBips) return tier;
    }
    return null; // No NFT
}

// Helper function to calculate burn rate from boost
export function getBurnRateFromBoost(boostBips) {
    if (boostBips >= 5000) return 0;   // Diamond: 0% burn
    if (boostBips >= 4000) return 10;  // Gold: 10% burn
    if (boostBips >= 2500) return 25;  // Silver: 25% burn
    if (boostBips >= 1000) return 40;  // Bronze: 40% burn
    return 50; // No NFT: 50% burn
}

// Helper to get user's effective keep rate
export function getKeepRateFromBoost(boostBips) {
    return 100 - getBurnRateFromBoost(boostBips);
}

// ============================================================================
// 7. CONTRACT ABIs
// ============================================================================

export const bkcTokenABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function TGE_SUPPLY() view returns (uint256)",
    "function totalBurned() view returns (uint256)",
    "function mintableRemaining() view returns (uint256)",
    "function totalMinted() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// StakingPool V9 ABI — MasterChef-style rewards, NFT burn reduction
export const stakingPoolABI = [
    // Core staking
    "function totalPStake() view returns (uint256)",
    "function totalBkcDelegated() view returns (uint256)",
    "function userTotalPStake(address _user) view returns (uint256)",
    "function pendingRewards(address _user) view returns (uint256)",
    "function savedRewards(address _user) view returns (uint256)",
    "function MIN_LOCK_DAYS() view returns (uint256)",
    "function MAX_LOCK_DAYS() view returns (uint256)",
    "function REFERRER_CUT_BPS() view returns (uint256)",
    "function forceUnstakePenaltyBps() view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])",
    "function getDelegation(address _user, uint256 _index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)",
    "function delegationCount(address _user) view returns (uint256)",

    // Write — delegate/unstake/claim
    "function delegate(uint256 _amount, uint256 _lockDays, address _operator) external payable",
    "function unstake(uint256 _index) external",
    "function forceUnstake(uint256 _index, address _operator) external payable",
    "function claimRewards(address _operator) external payable",
    "function claimRewards() external",

    // NFT Boost & Burn Rate
    "function getUserBestBoost(address _user) view returns (uint256)",
    "function getBurnRateForBoost(uint256 _boostBps) pure returns (uint256)",
    "function getTierName(uint256 _boostBps) pure returns (string)",
    "function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)",

    // Stats
    "function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)",
    "function getUserSummary(address _user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)",

    // Events
    "event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)",
    "event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)",
    "event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)",
    "event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)",
    "event TokensBurnedOnClaim(address indexed user, uint256 burnedAmount, uint256 burnRateBps, uint256 totalBurnedAllTime)"
];

// (Old rewardBoosterABI removed — V9 version is below, after fortunePoolABI)

// RentalManager V9 ABI — NFT rental marketplace with pull-pattern earnings
export const rentalManagerABI = [
    // Write
    "function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external",
    "function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external",
    "function withdrawNFT(uint256 tokenId) external",
    "function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable",
    "function withdrawEarnings() external",

    // Read — Listings
    "function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)",
    "function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)",
    "function isRented(uint256 tokenId) view returns (bool)",
    "function getRemainingTime(uint256 tokenId) view returns (uint256)",
    "function hasActiveRental(address user) view returns (bool)",
    "function getUserBestBoost(address user) view returns (uint256)",
    "function pendingEarnings(address owner) view returns (uint256)",
    "function userActiveRental(address user) view returns (uint256)",

    // Read — Marketplace
    "function getAllListedTokenIds() view returns (uint256[])",
    "function getListingCount() view returns (uint256)",
    "function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)",
    "function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)",

    // Events
    "event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)",
    "event ListingUpdated(uint256 indexed tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours)",
    "event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)",
    "event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)",
    "event EarningsWithdrawn(address indexed owner, uint256 amount)"
];

// NFTPool V9 ABI — Constant-product bonding curve (XY=K), ETH fees per tier
export const nftPoolABI = [
    // Write
    "function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)",
    "function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable",
    "function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable",

    // Read — Prices
    "function getBuyPrice() view returns (uint256)",
    "function getSellPrice() view returns (uint256)",
    "function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)",
    "function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)",
    "function getEthFees() view returns (uint256 buyFee, uint256 sellFee)",
    "function getSpread() view returns (uint256 spread, uint256 spreadBips)",

    // Read — Pool State
    "function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)",
    "function getAvailableNFTs() view returns (uint256[])",
    "function isNFTInPool(uint256 tokenId) view returns (bool)",
    "function bkcBalance() view returns (uint256)",
    "function nftCount() view returns (uint256)",
    "function tier() view returns (uint8)",
    "function initialized() view returns (bool)",
    "function getTierName() view returns (string)",

    // Read — Stats
    "function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)",
    "function totalVolume() view returns (uint256)",
    "function totalBuys() view returns (uint256)",
    "function totalSells() view returns (uint256)",
    "function totalEthFees() view returns (uint256)",

    // Events
    "event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 newNftCount, address operator)",
    "event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 newNftCount, address operator)"
];

// FortunePool V9 ABI — Commit-reveal game with 3 tier bitmask system
export const fortunePoolABI = [
    // Write
    "function commitPlay(bytes32 _commitHash, uint256 _wagerAmount, uint8 _tierMask, address _operator) external payable returns (uint256 gameId)",
    "function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)",
    "function claimExpired(uint256 _gameId) external",
    "function fundPrizePool(uint256 _amount) external",

    // Helpers
    "function generateCommitHash(uint256[] calldata _guesses, bytes32 _userSecret) pure returns (bytes32)",

    // Constants
    "function TIER_COUNT() view returns (uint8)",
    "function BKC_FEE_BPS() view returns (uint256)",
    "function MAX_PAYOUT_BPS() view returns (uint256)",
    "function REVEAL_DELAY() view returns (uint256)",
    "function REVEAL_WINDOW() view returns (uint256)",
    "function POOL_CAP() view returns (uint256)",

    // Tier info
    "function getTierInfo(uint8 _tier) pure returns (uint256 range, uint256 multiplier, uint256 winChanceBps)",
    "function getAllTiers() pure returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)",

    // Game queries
    "function getGame(uint256 _gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)",
    "function getGameResult(uint256 _gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)",
    "function getGameStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)",
    "function activeGame(address _player) view returns (uint256)",

    // Fee & winnings calculation
    "function getRequiredFee(uint8 _tierMask) view returns (uint256 fee)",
    "function calculatePotentialWinnings(uint256 _wagerAmount, uint8 _tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)",

    // Stats
    "function gameCounter() view returns (uint256)",
    "function prizePool() view returns (uint256)",
    "function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)",

    // Events
    "event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)",
    "event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)",
    "event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)",
    "event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)",
    "event PrizePoolFunded(address indexed funder, uint256 amount)",
    "event PoolExcessBurned(uint256 amount, uint256 newTotalBurned)"
];

// RewardBooster V9 ABI — Minimal ERC721, O(1) boost lookup
export const rewardBoosterABI = [
    // ERC721 standard
    "function balanceOf(address _owner) view returns (uint256)",
    "function ownerOf(uint256 _tokenId) view returns (address)",
    "function approve(address _to, uint256 _tokenId) external",
    "function setApprovalForAll(address _operator, bool _approved) external",
    "function transferFrom(address _from, address _to, uint256 _tokenId) external",
    "function safeTransferFrom(address _from, address _to, uint256 _tokenId) external",
    "function totalSupply() view returns (uint256)",

    // Boost queries
    "function getUserBestBoost(address _user) view returns (uint256)",
    "function getTokenInfo(uint256 _tokenId) view returns (address owner, uint8 tier, uint256 boostBips)",
    "function getUserTokens(address _user) view returns (uint256[] tokenIds, uint8[] tiers)",
    "function getTierBoost(uint8 _tier) pure returns (uint256)",
    "function getTierName(uint8 _tier) pure returns (string)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

// Notary V9 ABI — ETH-only, batch support, document types
export const notaryABI = [
    // Write
    "function certify(bytes32 _documentHash, string _meta, uint8 _docType, address _operator) external payable returns (uint256 certId)",
    "function batchCertify(bytes32[] _documentHashes, string[] _metas, uint8[] _docTypes, address _operator) external payable returns (uint256 startId)",
    "function transferCertificate(bytes32 _documentHash, address _newOwner) external",

    // Read
    "function verify(bytes32 _documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string meta)",
    "function getCertificate(uint256 _certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string meta)",
    "function getFee() view returns (uint256)",
    "function getStats() view returns (uint256 certCount, uint256 totalEthCollected)",
    "function certCount() view returns (uint256)",
    "function totalEthCollected() view returns (uint256)",
    "function MAX_BATCH_SIZE() view returns (uint8)",

    // Events
    "event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)",
    "event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)",
    "event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"
];

// SimpleBKCFaucet V9 ABI — Dual-mode testnet faucet (direct + relayer)
export const faucetABI = [
    // Write
    "function claim() external",

    // Read — User
    "function canClaim(address user) view returns (bool)",
    "function getCooldownRemaining(address user) view returns (uint256)",
    "function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)",

    // Read — Faucet
    "function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)",
    "function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)",
    "function cooldown() view returns (uint256)",
    "function tokensPerClaim() view returns (uint256)",
    "function ethPerClaim() view returns (uint256)",
    "function paused() view returns (bool)",

    // Events
    "event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"
];

// BackchainEcosystem V9 ABI — Central fee hub with module registration
export const ecosystemManagerABI = [
    // Fee calculation & collection
    "function calculateFee(bytes32 _actionId, uint256 _txValue) view returns (uint256)",

    // Immutable references
    "function bkcToken() view returns (address)",
    "function treasury() view returns (address)",
    "function buybackAccumulated() view returns (uint256)",
    "function referredBy(address _user) view returns (address)",
    "function referralCount(address _referrer) view returns (uint256)",
    "function setReferrer(address _referrer) external",
    "event ReferrerSet(address indexed user, address indexed referrer)",

    // Stats
    "function totalEthCollected() view returns (uint256)",
    "function totalBkcCollected() view returns (uint256)",
    "function totalFeeEvents() view returns (uint256)",
    "function getStats() view returns (uint256 ethCollected, uint256 bkcCollected, uint256 feeEvents, uint256 buybackEth, uint256 moduleCount)",

    // Module queries
    "function isAuthorized(address _contract) view returns (bool)",
    "function moduleCount() view returns (uint256)",

    // Events
    "event FeeCollected(bytes32 indexed moduleId, address indexed user, address operator, address customRecipient, uint256 ethAmount, uint256 bkcAmount)"
];

// BuybackMiner V9 ABI — Permissionless buyback + mining scarcity curve
export const buybackMinerABI = [
    // Write
    "function executeBuyback() external",
    "function executeBuybackWithSlippage(uint256 _minTotalBkcOut) external",

    // Constants
    "function MAX_SUPPLY() view returns (uint256)",
    "function MAX_MINTABLE() view returns (uint256)",
    "function MIN_BUYBACK() view returns (uint256)",
    "function CALLER_BPS() view returns (uint256)",
    "function BURN_BPS() view returns (uint256)",

    // Views
    "function currentMiningRate() view returns (uint256 rateBps)",
    "function pendingBuybackETH() view returns (uint256)",
    "function getSupplyInfo() view returns (uint256 currentSupply, uint256 maxSupply, uint256 totalMintedViaMining, uint256 remainingMintable, uint256 miningRateBps, uint256 totalBurnedLifetime)",
    "function previewBuyback() view returns (uint256 ethAvailable, uint256 estimatedBkcPurchased, uint256 estimatedBkcMined, uint256 estimatedBurn, uint256 estimatedToStakers, uint256 estimatedCallerReward, uint256 currentMiningRateBps, bool isReady)",
    "function previewMiningAtSupply(uint256 _supplyLevel, uint256 _purchaseAmount) pure returns (uint256 miningAmount, uint256 rateBps)",
    "function getBuybackStats() view returns (uint256 totalBuybacks, uint256 totalEthSpent, uint256 totalBkcPurchased, uint256 totalBkcMined, uint256 totalBkcBurned, uint256 totalBkcToStakers, uint256 totalCallerRewards, uint256 avgEthPerBuyback, uint256 avgBkcPerBuyback)",
    "function getLastBuyback() view returns (uint256 timestamp, uint256 blockNumber, address caller, uint256 ethSpent, uint256 bkcTotal, uint256 timeSinceLast)",

    // Stats
    "function totalBuybacks() view returns (uint256)",
    "function totalEthSpent() view returns (uint256)",
    "function totalBkcPurchased() view returns (uint256)",
    "function totalBkcMined() view returns (uint256)",
    "function totalBkcBurned() view returns (uint256)",
    "function totalBkcToStakers() view returns (uint256)",
    "function totalCallerRewards() view returns (uint256)",

    // Events
    "event BuybackExecuted(address indexed caller, uint256 indexed buybackNumber, uint256 callerReward, uint256 ethSpent, uint256 bkcPurchased, uint256 bkcMined, uint256 bkcBurned, uint256 bkcToStakers, uint256 miningRateBps)"
];

export const nftPoolFactoryABI = [
    "function getPoolAddress(uint256 boostBips) view returns (address)",
    "function isPool(address pool) view returns (bool)",
    "function getAllPools() view returns (address[])",
    "function getPoolCount() view returns (uint256)",
    "event PoolDeployed(uint256 indexed boostBips, address indexed poolAddress)"
];

// CharityPool V9 ABI — ETH-only permissionless fundraising
export const charityPoolABI = [
    // Write
    "function createCampaign(string title, string metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256)",
    "function donate(uint256 campaignId, address operator) external payable",
    "function boostCampaign(uint256 campaignId, address operator) external payable",
    "function closeCampaign(uint256 campaignId) external",
    "function withdraw(uint256 campaignId) external",

    // Read — Campaign
    "function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string title, string metadataUri)",
    "function canWithdraw(uint256 campaignId) view returns (bool)",
    "function titles(uint256 campaignId) view returns (string)",
    "function metadataUris(uint256 campaignId) view returns (string)",
    "function campaignCount() view returns (uint256)",

    // Read — Fees & Stats
    "function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)",
    "function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)",

    // Events
    "event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint96 goal, uint48 deadline, address operator)",
    "event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, address operator)",
    "event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)",
    "event CampaignClosed(uint256 indexed campaignId, address indexed owner, uint96 raised)",
    "event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint96 amount)"
];

// Agora V9 ABI — Decentralized social protocol (Tier 1: ETH only)
export const agoraABI = [
    // ── Posts ──
    "function createPost(string contentHash, uint8 tag, uint8 contentType, address operator) external payable",
    "function createReply(uint256 parentId, string contentHash, uint8 contentType, address operator) external payable",
    "function createRepost(uint256 originalId, string contentHash, address operator) external payable",
    "function deletePost(uint256 postId) external",
    "function changeTag(uint256 postId, uint8 newTag) external",

    // ── Engagement ──
    "function like(uint256 postId, address operator) external payable",
    "function superLike(uint256 postId, address operator) external payable",
    "function downvote(uint256 postId, address operator) external payable",
    "function follow(address user, address operator) external payable",
    "function unfollow(address user) external",

    // ── Reports (V2) ──
    "function reportPost(uint256 postId, uint8 category) external payable",
    "function hasReported(uint256 postId, address user) view returns (bool)",
    "function reportCount(uint256 postId) view returns (uint256)",

    // ── Post Boost & Tips (V2) ──
    "function boostPost(uint256 postId, uint8 tier, address operator) external payable",
    "function tipPost(uint256 postId, address operator) external payable",

    // ── Profiles ──
    "function createProfile(string username, string metadataURI, address operator) external payable",
    "function updateProfile(string metadataURI) external",
    "function pinPost(uint256 postId) external",

    // ── Premium (V2: tiers) ──
    "function boostProfile(address operator) external payable",
    "function obtainBadge(uint8 tier, address operator) external payable",

    // ── Constants ──
    "function VOTE_PRICE() view returns (uint256)",
    "function TAG_COUNT() view returns (uint8)",
    "function REPORT_PRICE() view returns (uint256)",
    "function MIN_TIP() view returns (uint256)",
    "function PROFILE_BOOST_PRICE() view returns (uint256)",
    "function BOOST_TIER_COUNT() view returns (uint8)",
    "function BADGE_TIER_COUNT() view returns (uint8)",
    "function postCounter() view returns (uint256)",
    "function totalProfiles() view returns (uint256)",

    // ── Views ──
    "function getPost(uint256 postId) view returns (address author, uint8 tag, uint8 contentType, bool deleted, uint32 createdAt, uint256 replyTo, uint256 repostOf, uint256 likes, uint256 superLikes, uint256 downvotes, uint256 replies, uint256 reposts)",
    "function getPostMeta(uint256 postId) view returns (uint256 reports, uint256 illegalReports, uint8 boostTier, uint64 boostExp, bool isBoosted, uint256 boostSpent, uint256 tips)",
    "function getUserProfile(address user) view returns (bytes32 usernameHash, string metadataURI, uint256 pinned, bool boosted, bool hasBadge, uint8 badgeTier, uint64 boostExp, uint64 badgeExp)",
    "function isProfileBoosted(address user) view returns (bool)",
    "function hasTrustBadge(address user) view returns (bool)",
    "function isPostBoosted(uint256 postId) view returns (bool)",
    "function isUsernameAvailable(string username) view returns (bool)",
    "function getUsernamePrice(uint256 length) pure returns (uint256)",
    "function getBoostPrice(uint8 tier) pure returns (uint256)",
    "function getBadgePrice(uint8 tier) pure returns (uint256)",
    "function hasLiked(uint256 postId, address user) view returns (bool)",
    "function getOperatorStats(address operator) view returns (uint256 posts_, uint256 engagement)",
    "function getGlobalStats() view returns (uint256 totalPosts, uint256 totalProfiles, uint256[15] tagCounts)",
    "function version() pure returns (string)",

    // ── Events ──
    "event PostCreated(uint256 indexed postId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)",
    "event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)",
    "event RepostCreated(uint256 indexed postId, uint256 indexed originalId, address indexed author, uint8 tag, string contentHash, address operator)",
    "event PostDeleted(uint256 indexed postId, address indexed author)",
    "event TagChanged(uint256 indexed postId, uint8 oldTag, uint8 newTag)",
    "event Liked(uint256 indexed postId, address indexed liker, address indexed author, address operator)",
    "event SuperLiked(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)",
    "event Downvoted(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)",
    "event Followed(address indexed follower, address indexed followed, address operator)",
    "event Unfollowed(address indexed follower, address indexed followed)",
    "event PostReported(uint256 indexed postId, address indexed reporter, address indexed author, uint8 category, uint256 totalReports)",
    "event PostBoosted(uint256 indexed postId, address indexed booster, uint8 tier, uint256 amount, uint64 newExpiry, address operator)",
    "event PostTipped(uint256 indexed postId, address indexed tipper, address indexed author, uint256 amount, address operator)",
    "event ProfileCreated(address indexed user, string username, string metadataURI, address operator)",
    "event ProfileUpdated(address indexed user, string metadataURI)",
    "event ProfileBoosted(address indexed user, uint256 daysAdded, uint64 expiresAt, address operator)",
    "event BadgeObtained(address indexed user, uint8 tier, uint64 expiresAt, address operator)"
];

// Campaign Status Enum (V9: ACTIVE → CLOSED → WITHDRAWN)
export const CampaignStatus = {
    ACTIVE: 0,
    CLOSED: 1,
    WITHDRAWN: 2
};

// Campaign Categories
export const CampaignCategories = {
    ANIMAL: 'animal',
    HUMANITARIAN: 'humanitarian'
};

// ============================================================================
// ✅ V30: NETWORK MANAGEMENT FUNCTIONS
// ============================================================================
// Funções para gerenciar automaticamente a rede no MetaMask
// Resolve o problema de RPC ruim sem intervenção do usuário

let lastNetworkCheck = 0;
const NETWORK_CHECK_THROTTLE_MS = 5000;

/**
 * Verifica se está na rede correta
 */
export async function isCorrectNetwork() {
    try {
        if (!window.ethereum) return false;
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return chainId === METAMASK_NETWORK_CONFIG.chainId;
    } catch (e) {
        console.warn('Network check failed:', e.message);
        return false;
    }
}

/**
 * Adiciona/Atualiza a rede Arbitrum Sepolia no MetaMask com RPCs confiáveis
 * Esta função também ATUALIZA os RPCs se a rede já existir!
 */
export async function updateMetaMaskNetwork() {
    if (!window.ethereum) {
        console.warn('MetaMask not detected');
        return false;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: METAMASK_NETWORK_CONFIG.chainId,
                chainName: METAMASK_NETWORK_CONFIG.chainName,
                nativeCurrency: METAMASK_NETWORK_CONFIG.nativeCurrency,
                rpcUrls: METAMASK_NETWORK_CONFIG.rpcUrls,
                blockExplorerUrls: METAMASK_NETWORK_CONFIG.blockExplorerUrls
            }]
        });
        
        console.log('✅ MetaMask network config updated');
        return true;
    } catch (error) {
        if (error.code === 4001) {
            console.log('User rejected network update');
            return false;
        }
        console.warn('Could not update MetaMask network:', error.message);
        return false;
    }
}

/**
 * Troca para a rede Arbitrum Sepolia
 * Se a rede não existir, adiciona automaticamente
 */
export async function switchToCorrectNetwork() {
    if (!window.ethereum) {
        console.warn('MetaMask not detected');
        return false;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: METAMASK_NETWORK_CONFIG.chainId }]
        });
        
        console.log('✅ Switched to Arbitrum Sepolia');
        return true;
        
    } catch (switchError) {
        // Error 4902 = chain not added to MetaMask
        if (switchError.code === 4902) {
            console.log('🔄 Network not found, adding...');
            return await updateMetaMaskNetwork();
        }
        
        if (switchError.code === 4001) {
            console.log('User rejected network switch');
            return false;
        }
        
        console.error('Network switch error:', switchError);
        return false;
    }
}

/**
 * Verifica a saúde do RPC atual do MetaMask
 */
export async function checkRpcHealth() {
    if (!window.ethereum) return { healthy: false, reason: 'no_provider' };

    try {
        const provider = new window.ethers.BrowserProvider(window.ethereum);
        
        // Tenta uma operação simples com timeout de 5s
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 5000)
        );
        
        const blockPromise = provider.getBlockNumber();
        await Promise.race([blockPromise, timeoutPromise]);
        
        return { healthy: true };
        
    } catch (error) {
        const errorMsg = error?.message?.toLowerCase() || '';
        
        if (errorMsg.includes('timeout')) {
            return { healthy: false, reason: 'timeout' };
        }
        if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || errorMsg.includes('-32002')) {
            return { healthy: false, reason: 'rate_limited' };
        }
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
            return { healthy: false, reason: 'network_error' };
        }
        
        return { healthy: false, reason: 'unknown', error: errorMsg };
    }
}

/**
 * 🔥 FUNÇÃO PRINCIPAL: Garante que o MetaMask está configurado corretamente
 * Chame isso antes de qualquer transação importante
 * Retorna: { success: boolean, error?: string, fixed?: boolean }
 */
export async function ensureCorrectNetworkConfig() {
    // Throttle para não chamar muito frequentemente
    const now = Date.now();
    if (now - lastNetworkCheck < NETWORK_CHECK_THROTTLE_MS) {
        return { success: true, skipped: true };
    }
    lastNetworkCheck = now;

    if (!window.ethereum) {
        return { success: false, error: 'MetaMask not detected' };
    }

    try {
        // 1. Verifica se está na rede correta
        const onCorrectNetwork = await isCorrectNetwork();
        
        if (!onCorrectNetwork) {
            console.log('🔄 Wrong network detected, switching...');
            const switched = await switchToCorrectNetwork();
            
            if (!switched) {
                return { success: false, error: 'Please switch to Arbitrum Sepolia network' };
            }
        }

        // 2. Verifica saúde do RPC
        const rpcHealth = await checkRpcHealth();
        
        if (!rpcHealth.healthy) {
            console.log(`⚠️ RPC unhealthy (${rpcHealth.reason}), updating MetaMask config...`);
            const updated = await updateMetaMaskNetwork();
            
            if (updated) {
                // Aguarda um pouco e verifica novamente
                await new Promise(r => setTimeout(r, 1000));
                const recheckHealth = await checkRpcHealth();
                
                if (!recheckHealth.healthy) {
                    return { 
                        success: false, 
                        error: 'Network is congested. Please try again in a moment.',
                        rpcReason: recheckHealth.reason
                    };
                }
                
                return { success: true, fixed: true };
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Network config error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Configura listener para mudanças de rede no MetaMask
 */
export function setupNetworkChangeListener(onNetworkChange) {
    if (!window.ethereum) return;

    window.ethereum.on('chainChanged', async (chainId) => {
        console.log('🔄 Network changed to:', chainId);
        
        const isCorrect = chainId === METAMASK_NETWORK_CONFIG.chainId;
        
        if (onNetworkChange) {
            onNetworkChange({
                chainId,
                isCorrectNetwork: isCorrect,
                needsSwitch: !isCorrect
            });
        }
    });
}