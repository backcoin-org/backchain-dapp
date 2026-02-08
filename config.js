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

export const ipfsGateway = "https://white-defensive-eel-240.mypinata.cloud/ipfs/";

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
    ecosystemManager: null,
    delegationManager: null,
    rewardBoosterNFT: null,
    rentalManager: null,
    nftLiquidityPoolFactory: null,
    fortunePool: null,
    fortunePoolV2: null,
    backchainRandomness: null,
    publicSale: null,
    decentralizedNotary: null,
    faucet: null,
    miningManager: null,
    charityPool: null,      // ✅ V29: Charity Pool
    backchat: null,         // ✅ V6.9: Backchat Social Network
    operator: null          // ✅ V6.9: Operator for fee distribution
};

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

        // Fortune Pool - V2 takes priority if available
        addresses.fortunePoolV2 = jsonAddresses.fortunePoolV2 || jsonAddresses.fortunePool;
        addresses.fortunePool = jsonAddresses.fortunePool;
        addresses.actionsManager = jsonAddresses.fortunePool; // Legacy alias
        
        addresses.rentalManager = jsonAddresses.rentalManager || 
                                   jsonAddresses.RentalManager ||
                                   jsonAddresses.rental_manager ||
                                   null;
        
        addresses.decentralizedNotary = jsonAddresses.decentralizedNotary ||
                                         jsonAddresses.notary ||
                                         jsonAddresses.Notary ||
                                         null;
        
        addresses.bkcDexPoolAddress = jsonAddresses.bkcDexPoolAddress || "#";
        
        // BackchainRandomness Oracle
        addresses.backchainRandomness = jsonAddresses.backchainRandomness || null;

        // ✅ V29: Charity Pool
        addresses.charityPool = jsonAddresses.charityPool || 
                                jsonAddresses.CharityPool ||
                                null;

        // ✅ V6.9: Backchat Social Network
        addresses.backchat = jsonAddresses.backchat || 
                             jsonAddresses.Backchat ||
                             null;
        
        // ✅ V6.9: Operator address (treasury receives operator fees)
        addresses.operator = jsonAddresses.operator || 
                             jsonAddresses.treasuryWallet ||
                             null;

        // Also update contractAddresses for compatibility
        Object.assign(contractAddresses, jsonAddresses);

        console.log("✅ Contract addresses loaded");
        console.log("   FortunePool V2:", addresses.fortunePoolV2);
        console.log("   CharityPool:", addresses.charityPool);
        console.log("   Backchat:", addresses.backchat);
        console.log("   Operator:", addresses.operator);
        return true;

    } catch (error) {
        console.error("❌ Failed to load contract addresses:", error);
        return false;
    }
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
    "function remainingMintableSupply() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// DelegationManager V6.8 ABI - NFT Burn Rate Reduction System
export const delegationManagerABI = [
    // Core staking
    "function totalNetworkPStake() view returns (uint256)",
    "function userTotalPStake(address _user) view returns (uint256)",
    "function pendingRewards(address _user) view returns (uint256)",
    "function MIN_LOCK_DURATION() view returns (uint256)",
    "function MAX_LOCK_DURATION() view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])",
    
    // V6.8: New signature with operator parameter
    "function delegate(uint256 _amount, uint256 _lockDuration, address _operator) external",
    "function unstake(uint256 _delegationIndex, address _operator) external",
    "function forceUnstake(uint256 _delegationIndex, address _operator) external",
    "function claimReward(address _operator) external payable",
    "function claimEthFee() view returns (uint256)",

    // V6.8: NFT Boost & Burn Rate functions
    "function getUserBestBoost(address _user) view returns (uint256)",
    "function getBurnRateForBoost(uint256 _boost) view returns (uint256)",
    "function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 userReceives, uint256 burnRateBips, uint256 userBoost)",
    
    // Penalty
    "function getUnstakePenaltyBips() view returns (uint256)",
    
    // Events V6.8
    "event Delegated(address indexed user, address indexed operator, uint256 amount, uint256 lockDuration, uint256 pStake)",
    "event Unstaked(address indexed user, address indexed operator, uint256 amount, uint256 pStakeReduced)",
    "event ForceUnstaked(address indexed user, address indexed operator, uint256 amount, uint256 penaltyAmount)",
    "event RewardClaimed(address indexed user, address indexed operator, uint256 grossAmount, uint256 burnedAmount, uint256 userReceived, uint256 boostUsed)"
];

export const rewardBoosterABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function approve(address to, uint256 tokenId)",
    "function setApprovalForAll(address operator, bool approved)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function boostBips(uint256 _tokenId) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
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

// NFT Liquidity Pool V6 ABI - With Operator + ETH Fees
export const nftPoolABI = [
    // WRITE - V6 with operator + payable
    "function buyNFT(address _operator) external payable returns (uint256 tokenId)",
    "function buySpecificNFT(uint256 _tokenId, address _operator) external payable",
    "function buyNFTWithSlippage(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId)",
    "function sellNFT(uint256 _tokenId, uint256 _minPayout, address _operator) external payable",
    // READ - Prices
    "function getBuyPrice() view returns (uint256)",
    "function getBuyPriceWithTax() view returns (uint256)",
    "function getSellPrice() view returns (uint256)",
    "function getSellPriceAfterTax() view returns (uint256)",
    "function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)",
    "function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)",
    "function getSpread() view returns (uint256 spread, uint256 spreadBips)",
    // READ - Pool State
    "function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized)",
    "function getAvailableNFTs() view returns (uint256[])",
    "function getNFTBalance() view returns (uint256)",
    "function getBKCBalance() view returns (uint256)",
    "function isNFTInPool(uint256 _tokenId) view returns (bool)",
    // READ - Tier
    "function boostBips() view returns (uint256)",
    "function getTierName() view returns (string)",
    // READ - ETH Fees
    "function buyEthFee() view returns (uint256)",
    "function sellEthFee() view returns (uint256)",
    "function getEthFeeConfig() view returns (uint256 buyFee, uint256 sellFee, uint256 totalCollected)",
    "function totalETHCollected() view returns (uint256)",
    // READ - Stats
    "function getTradingStats() view returns (uint256 volume, uint256 taxes, uint256 buys, uint256 sells)",
    "function totalVolume() view returns (uint256)",
    "function totalTaxesCollected() view returns (uint256)",
    "function totalBuys() view returns (uint256)",
    "function totalSells() view returns (uint256)",
    // Events V6
    "event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)",
    "event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)"
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

// FortunePool V6.9 ABI - Commit-Reveal System (Aligned with fortune-tx.js)
export const fortunePoolV2ABI = [
    // ===== Write Functions =====
    "function commitPlay(bytes32 _commitmentHash, uint256 _wagerAmount, bool _isCumulative, address _operator) external payable",
    "function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)",
    "function generateCommitmentHash(uint256[] calldata _guesses, bytes32 _userSecret) external pure returns (bytes32 hash)",
    "function claimExpiredGame(uint256 _gameId) external",

    // ===== Commitment Queries =====
    "function getCommitmentStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, bool isExpired, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)",
    "function getCommitment(uint256 _gameId) view returns (address player, uint64 commitBlock, bool isCumulative, uint8 status, uint256 wagerAmount, uint256 ethPaid)",
    "function commitmentHashes(uint256 _gameId) view returns (bytes32)",
    "function commitmentOperators(uint256 _gameId) view returns (address)",
    "function revealDelay() view returns (uint256)",
    "function revealWindow() view returns (uint256)",

    // ===== Fees =====
    "function serviceFee() view returns (uint256)",
    "function getRequiredServiceFee(bool _isCumulative) view returns (uint256)",
    "function gameFeeBips() view returns (uint256)",

    // ===== Tiers =====
    "function activeTierCount() view returns (uint256)",
    "function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)",
    "function getTier(uint256 _tierId) view returns (uint256 maxRange, uint256 multiplierBips, bool active)",
    "function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)",
    "function getExpectedGuessCount(bool _isCumulative) view returns (uint256)",
    "function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)",

    // ===== Game State =====
    "function gameCounter() view returns (uint256)",
    "function prizePoolBalance() view returns (uint256)",

    // ===== Game Results =====
    "function getGameResult(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256[] guesses, uint256[] rolls, bool isCumulative, uint8 matchCount, uint256 timestamp)",
    "function getPlayerStats(address _player) view returns (uint256 gamesPlayed, uint256 totalWagered, uint256 totalWon, int256 netProfit)",
    "function getPoolStats() view returns (uint256 poolBalance, uint256 gamesPlayed, uint256 wageredAllTime, uint256 paidOutAllTime, uint256 winsAllTime, uint256 ethCollected, uint256 bkcFees, uint256 expiredGames)",

    // ===== Statistics =====
    "function totalWageredAllTime() view returns (uint256)",
    "function totalPaidOutAllTime() view returns (uint256)",
    "function totalWinsAllTime() view returns (uint256)",
    "function totalETHCollected() view returns (uint256)",
    "function totalBKCFees() view returns (uint256)",
    "function totalExpiredGames() view returns (uint256)",

    // ===== Events =====
    "event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, bool isCumulative, address operator)",
    "event GameRevealed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount, address operator)",
    "event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)",
    "event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)",
    "event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)"
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

// Notary V6.8 ABI - ETH Service Fee + Operator
export const decentralizedNotaryABI = [
    // NFT functions
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    
    // Document functions
    "function getDocument(uint256 tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))",
    "function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)",
    
    // V6.8: Fees - BKC + ETH
    "function bkcFee() view returns (uint256)",
    "function ethFee() view returns (uint256)",
    
    // V6.8: New notarize with operator (payable for ETH fee)
    "function notarize(string _ipfsCid, string _description, bytes32 _contentHash, address _operator) external payable returns (uint256)",
    
    // Events V6.8
    "event DocumentNotarized(uint256 indexed tokenId, address indexed owner, address indexed operator, string ipfsCid, bytes32 contentHash, uint256 bkcFeePaid, uint256 ethFeePaid)"
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

// ============================================================================
// ✅ V29: CHARITY POOL ABI
// ============================================================================

export const charityPoolABI = [
    // Read Functions
    "function campaigns(uint256 campaignId) view returns (address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 deadline, uint8 status, uint256 donationCount, uint256 createdAt)",
    "function donations(uint256 donationId) view returns (address donor, uint256 campaignId, uint256 grossAmount, uint256 netAmount, uint256 timestamp)",
    "function campaignCounter() view returns (uint256)",
    "function donationCounter() view returns (uint256)",
    "function userActiveCampaigns(address user) view returns (uint256)",
    "function maxActiveCampaignsPerWallet() view returns (uint256)",
    "function minDonationAmount() view returns (uint256)",
    "function donationMiningFeeBips() view returns (uint256)",
    "function donationBurnFeeBips() view returns (uint256)",
    "function withdrawalFeeETH() view returns (uint256)",
    "function goalNotMetBurnBips() view returns (uint256)",
    "function totalRaisedAllTime() view returns (uint256)",
    "function totalBurnedAllTime() view returns (uint256)",
    "function totalCampaignsCreated() view returns (uint256)",
    "function totalSuccessfulWithdrawals() view returns (uint256)",
    "function getCampaignDonations(uint256 campaignId, uint256 offset, uint256 limit) view returns (uint256[])",
    "function getUserCampaignIds(address user) view returns (uint256[])",
    
    // Write Functions
    "function createCampaign(string _title, string _description, uint256 _goalAmount, uint256 _durationDays) external returns (uint256)",
    "function donate(uint256 _campaignId, uint256 _amount) external",
    "function cancelCampaign(uint256 _campaignId) external",
    "function withdraw(uint256 _campaignId) external payable",
    
    // Events
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)",
    "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, uint256 burnedAmount)",
    "event CampaignCancelled(uint256 indexed campaignId, address indexed creator)",
    "event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount, uint256 burnedAmount, bool goalMet)"
];

// ============================================================================
// ✅ V8.0.0: BACKCHAT ABI - Viral Referral Social Protocol
// ============================================================================
// CANONICAL ABI — All files should import from here, not define their own.
// Fee model: 50/30/20 (operator/referrer/protocol) with viral referral system.

export const backchatABI = [
    // ── Profile ──────────────────────────────────────────────────────────────
    "function createProfile(string username, string displayName, string bio, address operator) external payable",
    "function updateProfile(string displayName, string bio) external",

    // ── Content ──────────────────────────────────────────────────────────────
    "function createPost(string content, string mediaCID, address operator) external payable returns (uint256 postId)",
    "function createReply(uint256 parentId, string content, string mediaCID, address operator, uint256 tipBkc) external payable returns (uint256 postId)",
    "function createRepost(uint256 originalPostId, address operator, uint256 tipBkc) external payable returns (uint256 postId)",

    // ── Engagement ───────────────────────────────────────────────────────────
    "function like(uint256 postId, address operator, uint256 tipBkc) external payable",
    "function superLike(uint256 postId, address operator, uint256 tipBkc) external payable",
    "function follow(address toFollow, address operator, uint256 tipBkc) external payable",
    "function unfollow(address toUnfollow) external",

    // ── Premium ──────────────────────────────────────────────────────────────
    "function boostProfile(address operator) external payable",
    "function obtainBadge(address operator) external payable",

    // ── Referral (V8 NEW) ────────────────────────────────────────────────────
    "function setReferrer(address _referrer) external",
    "function getReferralStats(address referrer) external view returns (uint256 totalReferred, uint256 totalEarned)",
    "function referredBy(address user) external view returns (address)",
    "function referralCount(address referrer) external view returns (uint256)",
    "function referralEarnings(address referrer) external view returns (uint256)",

    // ── Withdrawal ───────────────────────────────────────────────────────────
    "function withdraw() external",

    // ── View: Fees ───────────────────────────────────────────────────────────
    "function calculateFee(uint256 gasEstimate) view returns (uint256)",
    "function getCurrentFees() view returns (uint256 postFee, uint256 replyFee, uint256 likeFee, uint256 followFee, uint256 repostFee, uint256 superLikeMin, uint256 boostMin, uint256 badgeFee_)",
    "function getUsernameFee(uint256 length) pure returns (uint256)",

    // ── View: State ──────────────────────────────────────────────────────────
    "function postCounter() view returns (uint256)",
    "function postAuthor(uint256 postId) view returns (address)",
    "function pendingEth(address user) view returns (uint256)",
    "function usernameOwner(bytes32 usernameHash) view returns (address)",
    "function hasLiked(uint256 postId, address user) view returns (bool)",
    "function boostExpiry(address user) view returns (uint256)",
    "function badgeExpiry(address user) view returns (uint256)",

    // ── View: Helpers ────────────────────────────────────────────────────────
    "function isProfileBoosted(address user) view returns (bool)",
    "function hasTrustBadge(address user) view returns (bool)",
    "function hasUserLiked(uint256 postId, address user) view returns (bool)",
    "function getPendingBalance(address user) view returns (uint256)",
    "function isUsernameAvailable(string username) view returns (bool)",
    "function getUsernameOwner(string username) view returns (address)",
    "function version() pure returns (string)",

    // ── Immutables ───────────────────────────────────────────────────────────
    "function bkcToken() view returns (address)",
    "function ecosystemManager() view returns (address)",

    // ── Events ───────────────────────────────────────────────────────────────
    "event ProfileCreated(address indexed user, bytes32 indexed usernameHash, string username, string displayName, string bio, uint256 ethPaid, address indexed operator)",
    "event ProfileUpdated(address indexed user, string displayName, string bio)",
    "event PostCreated(uint256 indexed postId, address indexed author, string content, string mediaCID, address indexed operator)",
    "event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, string content, string mediaCID, uint256 tipBkc, address operator)",
    "event RepostCreated(uint256 indexed newPostId, uint256 indexed originalPostId, address indexed reposter, uint256 tipBkc, address operator)",
    "event Liked(uint256 indexed postId, address indexed user, uint256 tipBkc, address indexed operator)",
    "event SuperLiked(uint256 indexed postId, address indexed user, uint256 ethAmount, uint256 tipBkc, address indexed operator)",
    "event Followed(address indexed follower, address indexed followed, uint256 tipBkc, address indexed operator)",
    "event Unfollowed(address indexed follower, address indexed followed)",
    "event ProfileBoosted(address indexed user, uint256 amount, uint256 expiresAt, address indexed operator)",
    "event BadgeObtained(address indexed user, uint256 expiresAt, address indexed operator)",
    "event Withdrawal(address indexed user, uint256 amount)",
    "event TipProcessed(address indexed from, address indexed creator, uint256 totalBkc, uint256 creatorShare, uint256 miningShare, address indexed operator)",
    "event ReferrerSet(address indexed user, address indexed referrer)"
];

// Campaign Status Enum
export const CampaignStatus = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    WITHDRAWN: 3
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