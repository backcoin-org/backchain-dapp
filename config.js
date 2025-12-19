// js/config.js
// ✅ PRODUCTION V28 - Alchemy Primary (CORS-friendly for browsers)

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

export const IPFS_GATEWAYS = [
    "https://dweb.link/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/"
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

export const contractAddresses = {
    bkcToken: null,
    ecosystemManager: null,
    delegationManager: null,
    rewardBoosterNFT: null,
    rentalManager: null,
    nftLiquidityPoolFactory: null,
    fortunePool: null,
    publicSale: null,
    decentralizedNotary: null,
    faucet: null,
    miningManager: null
};

export async function loadContractAddresses() {
    try {
        const response = await fetch('/deployment-addresses.json');
        if (!response.ok) throw new Error('Failed to load addresses');
        
        const addresses = await response.json();
        
        contractAddresses.bkcToken = addresses.bkcToken;
        contractAddresses.ecosystemManager = addresses.ecosystemManager;
        contractAddresses.delegationManager = addresses.delegationManager;
        contractAddresses.rewardBoosterNFT = addresses.rewardBoosterNFT;
        contractAddresses.rentalManager = addresses.rentalManager;
        contractAddresses.nftLiquidityPoolFactory = addresses.nftLiquidityPoolFactory;
        contractAddresses.fortunePool = addresses.fortunePool;
        contractAddresses.publicSale = addresses.publicSale;
        contractAddresses.decentralizedNotary = addresses.decentralizedNotary;
        contractAddresses.faucet = addresses.faucet;
        contractAddresses.miningManager = addresses.miningManager;
        
        console.log("✅ Contract addresses loaded");
        return addresses;
    } catch (error) {
        console.error("❌ Failed to load contract addresses:", error);
        throw error;
    }
}

// ============================================================================
// 6. ABIs (CONTRATOS)
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
    "function getUnstakePenaltyBips() view returns (uint256)",
    "event Delegated(address indexed user, uint256 amount, uint256 lockDuration, uint256 pStake)",
    "event Unstaked(address indexed user, uint256 amount, uint256 pStakeReduced)",
    "event RewardClaimed(address indexed user, uint256 amount)"
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
    "event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)",
    "event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)"
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