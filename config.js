// config.js

// --- (CORRIGIDO!) IMPORTAÇÃO DE ENDEREÇOS ---
export const addresses = {};

export async function loadAddresses() {
    try {
        const response = await fetch('./deployment-addresses.json');
        if (!response.ok) {
            throw new Error(`Falha ao buscar deployment-addresses.json: ${response.statusText}`);
        }
        const jsonAddresses = await response.json();

        addresses.bkcToken = jsonAddresses.bkcToken;
        addresses.delegationManager = jsonAddresses.delegationManager;
        addresses.rewardManager = jsonAddresses.rewardManager;
        addresses.rewardBoosterNFT = jsonAddresses.rewardBoosterNFT;
        addresses.publicSale = jsonAddresses.publicSale;
        addresses.faucet = jsonAddresses.faucet;
        addresses.decentralizedNotary = jsonAddresses.decentralizedNotary;
        addresses.nftBondingCurve = jsonAddresses.nftLiquidityPool;
        addresses.actionsManager = jsonAddresses.fortuneTiger; // ActionsManager agora aponta para FortuneTiger
        addresses.ecosystemManager = jsonAddresses.ecosystemManager; 
        
        // --- ATUALIZAÇÃO AQUI ---
        // Carrega o link de swap. Se não existir no JSON, usa '#' como fallback.
        addresses.swapLink = jsonAddresses.swapLink || "#"; 

        return true;

    } catch (error) {
        console.error("ERRO CRÍTICO: Não foi possível carregar os endereços dos contratos.", error);
        document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif; font-size: 1.2rem; background: #222; border: 1px solid red; margin: 20px;">
            <b>Erro:</b> Não foi possível carregar <code>deployment-addresses.json</code>.
            <br><br><b>Solução:</b> Verifique se o arquivo está na raiz do projeto e atualize a página.
            <br><br><small>${error.message}</small></div>`;
        return false;
    }
}


// --- Constante do Faucet ---
// AJUSTADA para 100 BKC (100 * 10^18)
export const FAUCET_AMOUNT_WEI = 100n * 10n**18n; 

// =================================================================
// ### CORREÇÃO (CORS) ###
// Revertido para o seu URL original da Alchemy, que permite
// solicitações de 'localhost'.
// =================================================================
export const sepoliaRpcUrl = "https://eth-sepolia.g.alchemy.com/v2/GNfs8FTc-lBMgbTvpudoz";
// =================================================================

export const ipfsGateway = "https://ipfs.io/ipfs/";
export const sepoliaChainId = 11155111n;

export const boosterTiers = [
    { name: "Diamond", boostBips: 5000, color: "text-cyan-400", img: "https://ipfs.io/ipfs/bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i", borderColor: "border-cyan-400/50", glowColor: "bg-cyan-500/10" },
    { name: "Platinum", boostBips: 4000, color: "text-gray-300", img: "https://ipfs.io/ipfs/bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau", borderColor: "border-gray-300/50", glowColor: "bg-gray-400/10" },
    { name: "Gold", boostBips: 3000, color: "text-amber-400", img: "https://ipfs.io/ipfs/bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem", borderColor: "border-amber-400/50", glowColor: "bg-amber-500/10" },
    { name: "Silver", boostBips: 2000, color: "text-gray-400", img: "https://ipfs.io/ipfs/bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu", borderColor: "border-gray-400/50", glowColor: "bg-gray-500/10" },
    { name: "Bronze", boostBips: 1000, color: "text-yellow-600", img: "https://ipfs.io/ipfs/bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye", borderColor: "border-yellow-600/50", glowColor: "bg-yellow-600/10" },
    { name: "Iron", boostBips: 500, color: "text-slate-500", img: "https://ipfs.io/ipfs/bafybeidta4mytpfqtnnrspzij63m4lcnkp6l42m7hnhyjxioci5jhcf3vm", borderColor: "border-slate-500/50", glowColor: "bg-slate-600/10" },
    { name: "Crystal", boostBips: 100, color: "text-indigo-300", img: "https://ipfs.io/ipfs/bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay", borderColor: "border-indigo-300/50", glowColor: "bg-indigo-300/10" }
];


// --- ABIs CORRIGIDAS --- 
// (Mantidos como estavam)

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
    "function validators(address) view returns (bool isRegistered, uint256 selfStakeAmount, uint256 selfStakeUnlockTime, uint256 totalPStake, uint256 totalDelegatedAmount)",
    "function userTotalPStake(address) view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint256 unlockTime, uint256 lockDuration, address validator)[])",
    "function pendingDelegatorRewards(address _user) public view returns (uint256)",
    "function VALIDATOR_LOCK_DURATION() view returns (uint256)",
    "function hasPaidRegistrationFee(address) view returns (bool)",
    "function MIN_LOCK_DURATION() view returns (uint256)",
    "function MAX_LOCK_DURATION() view returns (uint256)",
    "function getMinValidatorStake() view returns (uint256)",
    "function payRegistrationFee()",
    "function registerValidator(address _validatorAddress)",
    "function delegate(address _validatorAddress, uint256 _totalAmount, uint256 _lockDuration)",
    "function unstake(uint256 _delegationIndex)",
    "function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId)",
    "function claimDelegatorReward()",
    "event Delegated(address indexed user, address indexed validator, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event DelegatorRewardClaimed(address indexed delegator, uint256 amount)"
];

export const rewardManagerABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function vestingPositions(uint256) view returns (uint256 totalAmount, uint256 startTime)",
    "function VESTING_DURATION() view returns (uint256)",
    "function tokenURI(uint256 _tokenId) view returns (string)",
    "function minerRewardsOwed(address) view returns (uint256)", 
    "function INITIAL_PENALTY_BIPS() view returns (uint256)",
    "function withdraw(uint256 _tokenId, uint256 _boosterTokenId)",
    "function claimMinerRewards()",
    "function createVestingCertificate(address _recipient, uint256 _grossAmount)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function getMintRate(uint256 _purchaseAmount) view returns (uint256)", 
    "event VestingCertificateCreated(uint256 indexed tokenId, address indexed recipient, uint256 netAmount)",
    "event CertificateWithdrawn(uint256 indexed tokenId, address indexed owner, uint256 amountToOwner, uint256 penaltyAmount)",
    "event MinerRewardClaimed(address indexed miner, uint256 amount)"
];

export const rewardBoosterABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function balanceOf(address owner) view returns (uint256)",
    "function boostBips(uint256) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function approve(address to, uint256 tokenId)",
];

export const nftBondingCurveABI = [ 
    "function pools(uint256 boostBips) view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)",
    "function getBuyPrice(uint256 _boostBips) view returns (uint256)",
    "function getSellPrice(uint256 _boostBips) view returns (uint256)",
    "function buyNFT(uint256 _boostBips, uint256 _boosterTokenId)", 
    "function sellNFT(uint256 _tokenId, uint256 _boosterTokenId)",
    "function PSTAKE_SERVICE_KEY() view returns (string)",
    "event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price)",
    "event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 feePaid)"
];

export const fortuneTigerABI = [
    "function play(uint256 _amount, uint256 _boosterTokenId)",
    "function prizePools(uint256) view returns (uint256 multiplier, uint256 chanceDenominator, uint256 balance, uint256 contributionShareBips)",
    "function setPools(uint256[] calldata _multipliers, uint256[] calldata _denominators, uint256[] calldata _contributionBips)",
    "function SERVICE_FEE_BIPS() view returns (uint256)",
    "event GamePlayed(address indexed user, uint256 amountWagered, uint256 totalPrizeWon)"
];

export const actionsManagerABI = [ 
    "function actionCounter() view returns (uint256)",
    "function actions(uint256) view returns (uint256 id, address creator, string description, uint8 actionType, uint8 status, uint256 endTime, uint256 totalPot, uint256 creatorStake, bool isStakeReturned, address beneficiary, uint256 totalCoupons, address winner, uint256 closingBlock, uint256 winningCoupon)",
    "function getMinCreatorStake() view returns (uint256)",
    "function createAction(uint256 _duration, uint8 _actionType, uint256 _charityStake, string calldata _description, uint256 _boosterTokenId)",
    "function participate(uint256 _actionId, uint256 _bkcAmount, uint256 _boosterTokenId)",
    "function finalizeAction(uint256 _actionId)",
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
  "event DocumentNotarized(address indexed user, uint256 indexed tokenId, string documentURI, uint256 feePaid)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function notarizeDocument(string calldata _documentURI, uint256 _boosterTokenId)",
  "function setBaseURI(string calldata newBaseURI)"
];

export const faucetABI = [
  "constructor(address _tokenAddress)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event TokensClaimed(address indexed recipient, uint256 amount)",
  "function claim()",
  "function claimAmount() view returns (uint256)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function token() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function withdrawETH()",
  "function withdrawRemainingTokens()"
];

export const ecosystemManagerABI = [
    "function getServiceRequirements(string calldata _serviceKey) external view returns (uint256 fee, uint256 pStake)",
    "function getFee(string calldata _serviceKey) external view returns (uint256)",
    "function getBoosterDiscount(uint256 _boostBips) external view returns (uint256)",
    "function getTreasuryAddress() external view returns (address)",
    "function getDelegationManagerAddress() external view returns (address)",
    "function getBKCTokenAddress() external view returns (address)",
    "function getBoosterAddress() external view returns (address)"
];