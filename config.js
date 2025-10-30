// config.js

// --- CONTRACTS SETUP ---
export const addresses = {
    // Endereços do deploy.ts:
    bkcToken: "0x3d178F42c948646BB5a5eA74DF8F5fE2185bFD95",
    delegationManager: "0x6C4EF8fc2D2dcA25e3eB2AB2F21b9E7E554442bF",
    rewardManager: "0xe5440738D6C7e27c43A3FCECf7cf32eCf55101bA",
    rewardBoosterNFT: "0x5aE62209c1635C150573c318BC8d3B36EecFe177",
    nftBondingCurve: "0x1471D83065A6bC1A849f0d4D362b1a86a023D6FB", // NFTLiquidityPool
    actionsManager: "0xB35ab889f12f05F3c17457055989cd5b8406CE43", // FortuneTiger

    // Endereço do deploySale.ts (PublicSale)
    publicSale: "0xbD544F8F954Dd7b82B6d0f406a375F80AAD27793",

    // --- ENDEREÇO DO CONTRATO FAUCET ---
    faucet: "0x33811433E5DB3952Cf34Fadaef88bc8b1eDA184B",
    
    // --- NOVO CONTRATO: DECENTRALIZED NOTARY ---
    decentralizedNotary: "0x8DB100284F2304dc8958c4d58ECA00A1d341656C" // <-- ENDEREÇO ATUALIZADO
};

// --- Constante do Faucet ---
export const FAUCET_AMOUNT_WEI = 12500000000000000000000n; // 12.500 $BKC

export const sepoliaRpcUrl = "https://eth-sepolia.g.alchemy.com/v2/GNfs8FTc-lBMgbTvpudoz"; // Considere usar uma chave API própria
export const ipfsGateway = "https://ipfs.io/ipfs/";
export const sepoliaChainId = 11155111n; // Sepolia Chain ID: 11155111

// --- Booster Tiers ---
export const boosterTiers = [
    { name: "Diamond", boostBips: 5000, color: "text-cyan-400", img: "https://ipfs.io/ipfs/bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i", borderColor: "border-cyan-400/50", glowColor: "bg-cyan-500/10" },
    { name: "Platinum", boostBips: 4000, color: "text-gray-300", img: "https://ipfs.io/ipfs/bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau", borderColor: "border-gray-300/50", glowColor: "bg-gray-400/10" },
    { name: "Gold", boostBips: 3000, color: "text-amber-400", img: "https://ipfs.io/ipfs/bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem", borderColor: "border-amber-400/50", glowColor: "bg-amber-500/10" },
    { name: "Silver", boostBips: 2000, color: "text-gray-400", img: "https://ipfs.io/ipfs/bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu", borderColor: "border-gray-400/50", glowColor: "bg-gray-500/10" },
    { name: "Bronze", boostBips: 1000, color: "text-yellow-600", img: "https://ipfs.io/ipfs/bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye", borderColor: "border-yellow-600/50", glowColor: "bg-yellow-600/10" },
];


// --- ABIs --- 

export const bkcTokenABI = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function transferFrom(address from, address to, uint256 value) returns (bool)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function mint(address to, uint256 amount)"
];

// ### ABI CORRIGIDA ###
export const delegationManagerABI = [
    "function totalNetworkPStake() view returns (uint256)",
    "function getAllValidators() view returns (address[])",
    "function validators(address) view returns (bool isRegistered, uint256 selfStakeAmount, uint256 selfStakeUnlockTime, uint256 totalPStake, uint256 totalDelegatedAmount)",
    "function userTotalPStake(address) view returns (uint256)",
    "function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint256 unlockTime, uint256 lockDuration, address validator)[])",
    "function pendingDelegatorRewards(address _user) public view returns (uint256)",
    "function DELEGATION_FEE_BIPS() view returns (uint256)",
    "function VALIDATOR_LOCK_DURATION() view returns (uint256)",
    "function hasPaidRegistrationFee(address) view returns (bool)",
    "function getDelegationPStake(address _delegator, uint256 _index) view returns (uint256)",
    "function MIN_LOCK_DURATION() view returns (uint256)",
    "function MAX_LOCK_DURATION() view returns (uint256)",
    "function MINT_POOL() view returns (uint256)",
    "function TGE_SUPPLY() view returns (uint256)",
    "function payRegistrationFee()",
    "function registerValidator(address _validatorAddress)",
    "function delegate(address _validatorAddress, uint256 _totalAmount, uint256 _lockDuration)",
    "function unstake(uint256 _delegationIndex)",
    "function forceUnstake(uint256 _delegationIndex)",
    "function claimDelegatorReward()",
    "function getMinValidatorStake() view returns (uint256)",
    "event Delegated(address indexed user, address indexed validator, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid)",
    "event DelegatorRewardClaimed(address indexed delegator, uint256 amount)" // <-- AJUSTE APLICADO AQUI
];

export const rewardManagerABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function vestingPositions(uint256) view returns (uint256 totalAmount, uint256 startTime)",
    "function VESTING_DURATION() view returns (uint256)",
    "function tokenURI(uint256 _tokenId) view returns (string)",
    "function minerRewardsOwed(address) view returns (uint256)",
    "function INITIAL_PENALTY_BIPS() view returns (uint256)",
    "function withdraw(uint256 _tokenId)",
    "function claimMinerRewards()",
    "function createVestingCertificate(address _recipient, uint256 _grossAmount)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
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
    "function getHighestBoost(address user) view returns (uint256)"
];

export const nftBondingCurveABI = [ // NFTLiquidityPool ABI
    "function pools(uint256 boostBips) view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)",
    "function getBuyPrice(uint256 _boostBips) view returns (uint256)",
    "function getSellPrice(uint256 _boostBips) view returns (uint256)",
    "function buyNFT(uint256 _boostBips, uint256 _tokenId)",
    "function sellNFT(uint256 _tokenId)",
    "event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price)",
    "event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 feePaid)"
];

export const actionsManagerABI = [ // FortuneTiger ABI
    "function actionCounter() view returns (uint256)",
    "function actions(uint256) view returns (uint256 id, address creator, string description, uint8 actionType, uint8 status, uint256 endTime, uint256 totalPot, uint256 creatorStake, bool isStakeReturned, address beneficiary, uint256 totalCoupons, address winner, uint256 closingBlock, uint256 winningCoupon)",
    "function getMinCreatorStake() view returns (uint256)",
    "function createAction(uint256 _duration, uint8 _actionType, uint256 _charityStake, string calldata _description)",
    "function participate(uint256 _actionId, uint256 _bkcAmount)",
    "function finalizeAction(uint256 _actionId)",
];

export const publicSaleABI = [
    // Funções de Leitura (View)
    "function tiers(uint256) view returns (uint256 priceInWei, uint256 maxSupply, uint256 mintedCount, uint256 boostBips, string metadataFile, bool isConfigured)",
    "function rewardBoosterNFT() view returns (address)",
    "function ecosystemManager() view returns (address)",
    "function owner() view returns (address)",

    // Funções de Escrita (Write)
    "function setTier(uint256 _tierId, uint256 _priceInWei, uint256 _maxSupply, uint256 _boostBips, string calldata _metadataFile)",
    "function buyNFT(uint256 _tierId) payable",
    "function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) payable",
    "function withdrawFunds()",
    "function renounceOwnership()",
    "function transferOwnership(address newOwner)",

    // Eventos
    "event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)",
    "event TierSet(uint256 indexed tierId, uint256 price, uint256 maxSupply)"
];

// --- NOVO ABI: DecentralizedNotary (CORRIGIDO) ---
export const decentralizedNotaryABI = [
  // Construtor
  "constructor(address _bkcTokenAddress, address _delegationManagerAddress, address _treasuryAddress, address _initialOwner)",
  
  // Eventos
  "event DocumentNotarized(address indexed user, uint256 indexed tokenId, string documentURI, uint256 feePaid)",
  "event NotarySettingsChanged(uint256 newMinPStake, uint256 newFee, uint256 newTreasuryBips)",
  
  // Funções de Leitura (View)
  "function minimumPStakeRequired() view returns (uint256)",
  "function notarizeFeeBKC() view returns (uint256)",
  "function treasuryFeeBips() view returns (uint256)",
  
  // Funções ERC721Enumerable (Leitura)
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Funções de Escrita (Write)
  "function notarizeDocument(string calldata _documentURI)",
  "function setNotarySettings(uint256 _newMinPStake, uint256 _newFeeBKC, uint256 _newTreasuryBips)",
  "function setBaseURI(string calldata newBaseURI)"
];

// --- ABI do Faucet (SimpleBKCFaucet) ---
export const faucetABI = [
  "constructor(address _tokenAddress)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event TokensClaimed(address indexed recipient, uint256 amount)",
  "function claim()",
  "function claimAmount() view returns (uint256)",
  "function hasClaimed(address) view returns (bool)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function token() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function withdrawETH()",
  "function withdrawRemainingTokens()"
];