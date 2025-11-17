// config.js
// FINAL: Configuração da DApp para o Ecossistema Backchain

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = !isDevelopment;

console.log(`Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

// ============================================================================
// CONTRACT ADDRESSES (Loaded dynamically)
// ============================================================================
export const addresses = {};

/**
 * Carrega os endereços do JSON de deploy e mapeia para o objeto addresses.
 */
export async function loadAddresses() {
    try {
        const response = await fetch('./deployment-addresses.json');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch deployment-addresses.json: ${response.status} ${response.statusText}`);
        }
        
        const jsonAddresses = await response.json();

        // Valida endereços essenciais
        // O sistema agora se baseia em bkcToken, delegationManager e ecosystemManager
        const requiredAddresses = ['bkcToken', 'delegationManager', 'ecosystemManager'];
        const missingAddresses = requiredAddresses.filter(key => !jsonAddresses[key]);
        
        if (missingAddresses.length > 0) {
            throw new Error(`Missing required addresses: ${missingAddresses.join(', ')}`);
        }

        // Mapeia endereços
        addresses.bkcToken = jsonAddresses.bkcToken;
        addresses.delegationManager = jsonAddresses.delegationManager;
        addresses.rewardBoosterNFT = jsonAddresses.rewardBoosterNFT;
        addresses.publicSale = jsonAddresses.publicSale;
        addresses.decentralizedNotary = jsonAddresses.decentralizedNotary;
        addresses.ecosystemManager = jsonAddresses.ecosystemManager; 
        
        // Mapeamento de Piscinas AMM
        addresses.pool_diamond = jsonAddresses.pool_diamond;
        addresses.pool_platinum = jsonAddresses.pool_platinum;
        addresses.pool_gold = jsonAddresses.pool_gold;
        addresses.pool_silver = jsonAddresses.pool_silver;
        addresses.pool_bronze = jsonAddresses.pool_bronze;
        addresses.pool_iron = jsonAddresses.pool_iron;
        addresses.pool_crystal = jsonAddresses.pool_crystal;

        // FortunePool renomeado para actionsManager no frontend
        addresses.actionsManager = jsonAddresses.fortunePool; 
        
        // Endereços auxiliares
        addresses.bkcDexPoolAddress = jsonAddresses.bkcDexPoolAddress || "#"; 
        addresses.mainLPPairAddress = jsonAddresses.mainLPPairAddress || "0x...[PLEASE UPDATE AFTER CREATING LP]..."; 
        addresses.miningManager = jsonAddresses.miningManager;
        addresses.oracleWalletAddress = jsonAddresses.oracleWalletAddress;
        addresses.faucet = jsonAddresses.faucet; 
        // REMOVIDO: addresses.rewardManager

        console.log("✅ Contract addresses loaded:", addresses);
        return true;

    } catch (error) {
        console.error("❌ CRITICAL ERROR: Failed to load contract addresses.", error);
        
        // CÓDIGO DE TRATAMENTO DE ERRO EM TELA CHEIA (Mantido)
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); color: white; display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;';
        errorDiv.innerHTML = `
            <div style="max-width: 600px; background: #1e1e1e; border: 2px solid #ef4444; border-radius: 8px; padding: 30px;">
                <h2 style="color: #ef4444; margin-bottom: 15px; font-size: 24px;">⚠️ Configuration Error</h2>
                <p style="margin-bottom: 10px;">Could not load <code style="background: #333; padding: 2px 6px; border-radius: 3px;">deployment-addresses.json</code></p>
                <p style="margin-bottom: 20px; color: #aaa; font-size: 14px;">The dApp requires contract addresses to function.</p>
                <details style="margin-bottom: 20px; background: #2a2a2a; padding: 10px; border-radius: 4px;">
                    <summary style="cursor: pointer; font-weight: bold; color: #fbbf24;">Technical Details</summary>
                    <pre style="margin-top: 10px; color: #ef4444; font-size: 12px; overflow-x: auto;">${error.message}</pre>
                </details>
                <button onclick="location.reload()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
                    🔄 Retry
                </button>
            </div>
        `;
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
        
        return false;
    }
}

// ============================================================================
// NETWORK CONFIGURATION (CHAVE WSS HARDCODED)
// ============================================================================

// Chave WSS hardcoded diretamente
const WSS_KEY = "wJwRXHRaYO3THysyZWvHL";

// 1. Define a URL usando a chave hardcoded
export const sepoliaWssUrl = `wss://eth-sepolia.g.alchemy.com/v2/${WSS_KEY}`; 

// Converte WSS para HTTP/HTTPS para RPC tradicional
export const sepoliaRpcUrl = sepoliaWssUrl.replace('wss://', 'https://');

export const sepoliaChainId = 11155111n;

// IPFS Gateway
export const ipfsGateway = "https://white-defensive-eel-240.mypinata.cloud/ipfs/";

// ============================================================================
// APPLICATION CONSTANTS
// ============================================================================

// Faucet amount (100 BKC)
export const FAUCET_AMOUNT_WEI = 100n * 10n**18n; 

// Booster tiers configuration (Mantido)
export const boosterTiers = [
    { name: "Diamond", boostBips: 5000, color: "text-cyan-400", img: "https://ipfs.io/ipfs/bafybeigf3n2q2cbsnsmqytv57e6dvuimtzsg6pp7iyhhhmqpaxgpzlmgem", borderColor: "border-cyan-400/50", glowColor: "bg-cyan-500/10" },
    { name: "Platinum", boostBips: 4000, color: "text-gray-300", img: "https://ipfs.io/ipfs/bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau", borderColor: "border-gray-300/50", glowColor: "bg-gray-400/10" },
    { name: "Gold", boostBips: 3000, color: "text-amber-400", img: "https://ipfs.io/ipfs/bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem", borderColor: "border-amber-400/50", glowColor: "bg-amber-500/10" },
    { name: "Silver", boostBips: 2000, color: "text-gray-400", img: "https://ipfs.io/ipfs/bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu", borderColor: "border-gray-400/50", glowColor: "bg-gray-500/10" },
    { name: "Bronze", boostBips: 1000, color: "text-yellow-600", img: "https://ipfs.io/ipfs/bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye", borderColor: "border-yellow-600/50", glowColor: "bg-yellow-600/10" },
    { name: "Iron", boostBips: 500, color: "text-slate-500", img: "https://ipfs.io/ipfs/bafybeidta4mytpfqtnnrspzij63m4lcnkp6l42m7hnhyjxioci5jhcf3vm", borderColor: "border-slate-500/50", glowColor: "bg-slate-600/10" },
    { name: "Crystal", boostBips: 100, color: "text-indigo-300", img: "https://ipfs.io/ipfs/bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay", borderColor: "border-indigo-300/50", glowColor: "bg-indigo-300/10" }
];

// ============================================================================
// CONTRACT ABIs (Ajustados)
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
    "function totalNetworkPStake() view returns (uint256)",
    "function getAllValidators() view returns (address[])",
    // CORREÇÃO: Removido selfStakeUnlockTime para corresponder à estrutura atual de 4 campos.
    "function validators(address) view returns (bool isRegistered, uint256 selfStakeAmount, uint256 totalPStake, uint256 totalDelegatedAmount)",
    "function userTotalPStake(address) view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint256 unlockTime, uint256 lockDuration, address validator)[])",
    "function pendingDelegatorRewards(address _user) public view returns (uint256)",
    "function pendingValidatorRewards(address _validator) public view returns (uint256)", 
    "function VALIDATOR_LOCK_DURATION() view returns (uint256)",
    "function hasPaidRegistrationFee(address) view returns (bool)",
    "function MIN_LOCK_DURATION() view returns (uint256)",
    "function MAX_LOCK_DURATION() view returns (uint256)",
    "function getMinValidatorStake() view returns (uint256)",
    "function payRegistrationFee()",
    "function registerValidator(address _validatorAddress)",
    "function delegate(address _validatorAddress, uint256 _totalAmount, uint256 _lockDuration, uint256 _boosterTokenId)",
    "function unstake(uint256 _delegationIndex, uint256 _boosterTokenId)",
    "function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId)",
    "function claimDelegatorReward(uint256 _boosterTokenId)",
    "event Delegated(address indexed user, address indexed validator, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event DelegatorRewardClaimed(address indexed delegator, uint256 amount)"
];

export const rewardBoosterABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function boostBips(uint256) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function approve(address to, uint256 tokenId)",
];

export const nftPoolABI = [ 
    "function getBuyPrice() view returns (uint256)",
    "function getSellPrice() view returns (uint256)",
    "function buyNFT(uint256 _tokenId, uint256 _boosterTokenId)",
    "function buyNextAvailableNFT(uint256 _boosterTokenId)",
    "function sellNFT(uint256 _tokenId, uint256 _boosterTokenId)",
    "function PSTAKE_SERVICE_KEY() view returns (string)",
    "function getPoolInfo() view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)",
    "function getAvailableTokenIds() view returns (uint256[] memory)",
    "event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price)",
    "event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid)"
];

// ABI para o FortunePool (ActionsManager)
export const actionsManagerABI = [ 
    "function participate(uint256 _amount)", 
    "function oracleFeeInWei() view returns (uint256)",
    "function gameResults(uint256) view returns (uint256[3] memory)",
    "event GameRequested(uint256 indexed gameId, address indexed user, uint256 purchaseAmount)",
    "event GameFulfilled(uint256 indexed gameId, address indexed user, uint256 prizeWon, uint256[3] rolls)",
    "function prizePoolBalance() view returns (uint256)",
    "function setOracleAddress(address _oracle)" 
];

export const publicSaleABI = [
    "function tiers(uint256) view returns (uint256 priceInWei, uint256 maxSupply, uint256 mintedCount, uint256 boostBips, string metadataFile, bool isConfigured)",
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
    "event NotarizationEvent(uint256 indexed tokenId, address indexed owner, string indexed documentMetadataHash)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function notarize(string calldata _documentMetadataURI, uint256 _boosterTokenId)",
];

export const faucetABI = [
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    "event TokensClaimed(address indexed recipient, uint256 amount)",
    "function claim()",
    "function claimAmount() view returns (uint256)",
    "function owner() view returns (address)",
    "function renounceOwnership()",
    "function token() view returns (address)",
    "function transferOwnership(address newOwner)",
    "function withdrawNativeCurrency()",
    "function withdrawRemainingTokens()"
];

export const ecosystemManagerABI = [
    "function getServiceRequirements(string calldata _serviceKey) external view returns (uint256 fee, uint256 pStake)",
    "function getFee(string calldata _serviceKey) external view returns (uint256)",
    "function getBoosterDiscount(uint256 _boostBips) external view returns (uint256)",
    "function getTreasuryAddress() external view returns (address)",
    "function getDelegationManagerAddress() external view returns (address)",
    "function getBKCTokenAddress() external view returns (address)",
    "function getBoosterAddress() external view returns (address)",
    "function getNFTLiquidityPoolFactoryAddress() external view returns (address)"
];