// config.js
// ✅ VERSÃO FINAL DAPP: Completa (Todas as funções + Rental Market + Compatibilidade Visual)

// ============================================================================
// 1. ENVIRONMENT DETECTION
// ============================================================================
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = !isDevelopment;

console.log(`Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

// ============================================================================
// 2. CONTRACT ADDRESSES (Dynamic Loader)
// ============================================================================
export const addresses = {};

/**
 * Carrega os endereços do JSON de deploy.
 * É vital que o arquivo 'deployment-addresses.json' esteja na raiz do build.
 */
export async function loadAddresses() {
    try {
        const response = await fetch('./deployment-addresses.json');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch deployment-addresses.json: ${response.status}`);
        }
        
        const jsonAddresses = await response.json();

        // Validação básica de integridade
        const requiredAddresses = ['bkcToken', 'delegationManager', 'ecosystemManager', 'miningManager'];
        const missingAddresses = requiredAddresses.filter(key => !jsonAddresses[key]);
        
        if (missingAddresses.length > 0) {
            throw new Error(`Missing required addresses: ${missingAddresses.join(', ')}`);
        }

        // Mapeamento Principal
        addresses.bkcToken = jsonAddresses.bkcToken;
        addresses.delegationManager = jsonAddresses.delegationManager;
        addresses.rewardBoosterNFT = jsonAddresses.rewardBoosterNFT;
        addresses.publicSale = jsonAddresses.publicSale;
        addresses.decentralizedNotary = jsonAddresses.decentralizedNotary;
        addresses.ecosystemManager = jsonAddresses.ecosystemManager;
        addresses.miningManager = jsonAddresses.miningManager;
        
        // --- [NEW] Rental Market (AirBNFT) ---
        // Se não existir no JSON ainda, pode quebrar se tentarmos usar, então verificamos
        addresses.rentalManager = jsonAddresses.rentalManager || null;
        
        // Mapeamento de Piscinas AMM (Carregamento Inteligente)
        addresses.pool_diamond = jsonAddresses.pool_diamond;
        addresses.pool_platinum = jsonAddresses.pool_platinum;
        addresses.pool_gold = jsonAddresses.pool_gold;
        addresses.pool_silver = jsonAddresses.pool_silver;
        addresses.pool_bronze = jsonAddresses.pool_bronze;
        addresses.pool_iron = jsonAddresses.pool_iron;
        addresses.pool_crystal = jsonAddresses.pool_crystal;

        // Se houver pools extras criados dinamicamente, carrega também
        Object.keys(jsonAddresses).forEach(key => {
            if (key.startsWith('pool_')) {
                addresses[key] = jsonAddresses[key];
            }
        });

        // FortunePool / ActionsManager
        addresses.actionsManager = jsonAddresses.fortunePool;
        addresses.fortunePool = jsonAddresses.fortunePool;
        
        // Endereços Auxiliares
        addresses.bkcDexPoolAddress = jsonAddresses.bkcDexPoolAddress || "#";
        addresses.mainLPPairAddress = jsonAddresses.mainLPPairAddress;
        addresses.oracleWalletAddress = jsonAddresses.oracleWalletAddress;
        addresses.faucet = jsonAddresses.faucet;
        addresses.nftLiquidityPoolFactory = jsonAddresses.nftLiquidityPoolFactory;

        console.log("✅ Contract addresses loaded successfully.");
        return true;

    } catch (error) {
        console.error("❌ CRITICAL ERROR: Failed to load contract addresses.", error);
        return false;
    }
}

// ============================================================================
// 3. NETWORK CONFIGURATION (INFURA)
// ============================================================================

const INFURA_KEY = "a17d6aa469bd4214836fe54f36df6915"; // Chave pública dedicada

// WebSocket URL (Listeners)
export const sepoliaWssUrl = `wss://sepolia.infura.io/ws/v3/${INFURA_KEY}`;

// RPC URL (Leitura/Escrita HTTP)
export const sepoliaRpcUrl = `https://sepolia.infura.io/v3/${INFURA_KEY}`;

export const sepoliaChainId = 11155111n; // Sepolia ID

// IPFS Gateway (Pinata)
export const ipfsGateway = "https://white-defensive-eel-240.mypinata.cloud/ipfs/";

// ============================================================================
// 4. APPLICATION CONSTANTS
// ============================================================================

export const FAUCET_AMOUNT_WEI = 100n * 10n**18n;

// Tiers atualizados com a nova pasta do Pinata
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
    "function transferFrom(address from, address to, uint256 value) returns (bool)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function mint(address to, uint256 amount)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function TGE_SUPPLY() view returns (uint256)"
];

export const delegationManagerABI = [
    // --- View Functions ---
    "function totalNetworkPStake() view returns (uint256)",
    "function userTotalPStake(address) view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint256 unlockTime, uint256 lockDuration)[])",
    "function pendingRewards(address _user) public view returns (uint256)",
    
    // --- Constants ---
    "function MIN_LOCK_DURATION() view returns (uint256)",
    "function MAX_LOCK_DURATION() view returns (uint256)",

    // --- Write Functions ---
    "function delegate(uint256 _totalAmount, uint256 _lockDuration, uint256 _boosterTokenId)",
    "function unstake(uint256 _delegationIndex, uint256 _boosterTokenId)",
    "function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId)",
    "function claimReward(uint256 _boosterTokenId)",
    
    // --- Events ---
    "event Delegated(address indexed user, uint256 delegationIndex, uint256 amount, uint256 pStakeGenerated, uint256 feeAmount)",
    "event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event RewardClaimed(address indexed user, uint256 amount)"
];

export const rewardBoosterABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function boostBips(uint256 tokenId) view returns (uint256)", 
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function approve(address to, uint256 tokenId)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)"
];

// --- [NEW] RENTAL MANAGER ABI (AirBNFT) ---
export const rentalManagerABI = [
    "function listNFT(uint256 tokenId, uint256 pricePerHour, uint256 maxDurationHours) external",
    "function withdrawNFT(uint256 tokenId) external",
    "function rentNFT(uint256 tokenId, uint256 hoursToRent) external",
    "function getListing(uint256 tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 maxDuration, bool isActive))",
    "function getRental(uint256 tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime))",
    "function isRented(uint256 tokenId) view returns (bool)",
    "function getAllListedTokenIds() view returns (uint256[])",
    "event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 maxDurationHours)",
    "event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hoursRented, uint256 totalCost, uint256 feePaid)"
];

export const nftPoolABI = [
    "function getBuyPrice() view returns (uint256)",
    "function getSellPrice() view returns (uint256)",
    "function buyNFT(uint256 _tokenId, uint256 _boosterTokenId)",
    "function buyNextAvailableNFT(uint256 _boosterTokenId)",
    "function sellNFT(uint256 _tokenId, uint256 _boosterTokenId, uint256 _minBkcExpected)",
    "function PSTAKE_SERVICE_KEY() view returns (bytes32)",
    "function getPoolInfo() view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)",
    "function getAvailableTokenIds() view returns (uint256[] memory)",
    "event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price, uint256 taxPaid)",
    "event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid)"
];

// Mantido como actionsManagerABI para compatibilidade
export const actionsManagerABI = [
    "function participate(uint256 _amount) payable", 
    "function oracleFeeInWei() view returns (uint256)",
    "function gameResults(uint256) view returns (uint256[3] memory)",
    "event GameRequested(uint256 indexed gameId, address indexed user, uint256 purchaseAmount)",
    "event GameFulfilled(uint256 indexed gameId, address indexed user, uint256 prizeWon, uint256[3] rolls)",
    "function prizePoolBalance() view returns (uint256)",
    "function setOracleAddress(address _oracle)"
];

export const publicSaleABI = [
    "function tiers(uint256) view returns (uint256 priceInWei, uint64 maxSupply, uint64 mintedCount, uint16 boostBips, bool isConfigured, string metadataFile)",
    "function rewardBoosterNFT() view returns (address)",
    "function ecosystemManager() view returns (address)",
    "function owner() view returns (address)",
    "function setTier(uint256 _tierId, uint256 _maxSupply, uint256 _priceInWei, uint256 _boostBips, string calldata _metadataFile)",
    "function buyNFT(uint256 _tierId) payable",
    "function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) payable",
    "function withdrawFunds()",
    "function renounceOwnership()",
    "function transferOwnership(address newOwner)",
    "event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)",
    "event TierSet(uint256 indexed tierId, uint256 price, uint256 maxSupply)"
];

export const decentralizedNotaryABI = [
    "event NotarizationEvent(uint256 indexed tokenId, address indexed owner, string indexed documentMetadataHash, uint256 feePaid)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function notarize(string calldata _documentMetadataURI, uint256 _boosterTokenId)",
];

export const faucetABI = [
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    "event TokensClaimed(address indexed recipient, uint256 amount)",
    "function claim()",
    "function owner() view returns (address)",
    "function renounceOwnership()",
    "function token() view returns (address)",
    "function transferOwnership(address newOwner)",
    "function withdrawNativeCurrency()",
    "function withdrawRemainingTokens()"
];

export const ecosystemManagerABI = [
    // ATENÇÃO: Contrato atualizado usa bytes32. Se o frontend passar string, use ethers.id() antes de chamar.
    "function getServiceRequirements(bytes32 _serviceKey) external view returns (uint256 fee, uint256 pStake)",
    "function getFee(bytes32 _serviceKey) external view returns (uint256)",
    "function getBoosterDiscount(uint256 _boostBips) external view returns (uint256)",
    "function getTreasuryAddress() external view returns (address)",
    "function getDelegationManagerAddress() external view returns (address)",
    "function getBKCTokenAddress() external view returns (address)",
    "function getBoosterAddress() external view returns (address)",
    "function getNFTLiquidityPoolFactoryAddress() external view returns (address)"
];