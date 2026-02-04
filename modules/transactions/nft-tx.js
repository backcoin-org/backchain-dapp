// modules/js/transactions/nft-tx.js
// ✅ PRODUCTION V2.0 - Updated for NFTLiquidityPool V6 + Operator + ETH Fees
// 
// CHANGES V2.0:
// - CRITICAL FIX: All buy/sell functions now include operator parameter
// - CRITICAL FIX: All buy/sell functions now send ETH fees (msg.value)
// - FIXED: getPoolNFTCount() → getNFTBalance() (correct V6 function)
// - FIXED: poolTokenBalance() → getBKCBalance() (correct V6 function)
// - FIXED: getNFTsInPool() → getAvailableNFTs() (correct V6 function)
// - FIXED: tierIndex() → boostBips() (correct V6 function)
// - ADDED: getTotalBuyCost() - returns BKC cost + ETH fee
// - ADDED: getTotalSellInfo() - returns BKC payout + ETH fee
// - ADDED: getEthFeeConfig() - ETH fee configuration
// - ADDED: getTierName() - human readable tier
// - ADDED: getTradingStats() - volume, taxes, buys, sells
// - ADDED: getSpread() - buy/sell spread
// - Uses resolveOperator() for hybrid operator system
// - Backwards compatible (operator is optional)
//
// ============================================================================
// V6 FEE STRUCTURE (EQUAL FOR ALL - NO DISCOUNTS):
// - Buy: 5% BKC tax + ETH fee (buyEthFee) → MiningManager
// - Sell: 10% BKC tax + ETH fee (sellEthFee) → MiningManager
// - Operator receives commission on all fees
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

const POOL_TIERS = ['diamond', 'gold', 'silver', 'bronze'];

function getContracts(poolTier = null) {
    const bkcToken = addresses?.bkcToken || contractAddresses?.bkcToken || window.contractAddresses?.bkcToken;
    const nftContract = addresses?.rewardBoosterNFT || contractAddresses?.rewardBoosterNFT || window.contractAddresses?.rewardBoosterNFT;
    
    let nftPool = null;
    if (poolTier) {
        const poolKey = `pool_${poolTier.toLowerCase()}`;
        nftPool = addresses?.[poolKey] || contractAddresses?.[poolKey] || window.contractAddresses?.[poolKey];
    }
    
    if (!bkcToken || !nftContract) throw new Error('Contract addresses not loaded');
    return { BKC_TOKEN: bkcToken, NFT_CONTRACT: nftContract, NFT_POOL: nftPool };
}

function getPoolAddress(tier) {
    const poolKey = `pool_${tier.toLowerCase()}`;
    return addresses?.[poolKey] || contractAddresses?.[poolKey] || window.contractAddresses?.[poolKey] || null;
}

function getAllPools() {
    const pools = {};
    for (const tier of POOL_TIERS) {
        const address = getPoolAddress(tier);
        if (address) pools[tier] = address;
    }
    return pools;
}

const NFT_POOL_ABI = [
    // WRITE - V6 with operator + payable!
    'function buyNFT(address _operator) external payable returns (uint256 tokenId)',
    'function buySpecificNFT(uint256 _tokenId, address _operator) external payable',
    'function buyNFTWithSlippage(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId)',
    'function sellNFT(uint256 _tokenId, uint256 _minPayout, address _operator) external payable',
    // READ - Prices
    'function getBuyPrice() view returns (uint256)',
    'function getBuyPriceWithTax() view returns (uint256)',
    'function getSellPrice() view returns (uint256)',
    'function getSellPriceAfterTax() view returns (uint256)',
    'function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)',
    'function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)',
    'function getSpread() view returns (uint256 spread, uint256 spreadBips)',
    // READ - Pool State
    'function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized)',
    'function getAvailableNFTs() view returns (uint256[])',
    'function getNFTBalance() view returns (uint256)',
    'function getBKCBalance() view returns (uint256)',
    'function isNFTInPool(uint256 _tokenId) view returns (bool)',
    // READ - Tier
    'function boostBips() view returns (uint256)',
    'function getTierName() view returns (string)',
    // READ - ETH Fees
    'function buyEthFee() view returns (uint256)',
    'function sellEthFee() view returns (uint256)',
    'function getEthFeeConfig() view returns (uint256 buyFee, uint256 sellFee, uint256 totalCollected)',
    'function totalETHCollected() view returns (uint256)',
    // READ - Stats
    'function getTradingStats() view returns (uint256 volume, uint256 taxes, uint256 buys, uint256 sells)',
    'function totalVolume() view returns (uint256)',
    'function totalTaxesCollected() view returns (uint256)',
    'function totalBuys() view returns (uint256)',
    'function totalSells() view returns (uint256)',
    // Events
    'event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)',
    'event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)'
];

const NFT_ABI = [
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function boostBips(uint256 tokenId) view returns (uint256)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getNftPoolContract(signer, poolAddress) {
    return new window.ethers.Contract(poolAddress, NFT_POOL_ABI, signer);
}

async function getNftPoolContractReadOnly(poolAddress) {
    const { NetworkManager } = await import('../core/index.js');
    return new window.ethers.Contract(poolAddress, NFT_POOL_ABI, NetworkManager.getProvider());
}

function getNftContract(signer) {
    const contracts = getContracts();
    return new window.ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, signer);
}

async function getNftContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    const contracts = getContracts();
    return new window.ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, NetworkManager.getProvider());
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

export async function buyNft({
    poolAddress, poolTier, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) throw new Error('Pool address or valid pool tier is required');
    
    let storedOperator = operator;
    let buyPriceWithTax = 0n;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'BuyNFT', button,
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buyNFT',
        args: () => [resolveOperator(storedOperator)],
        get value() { return ethFee; },
        
        get approval() {
            if (buyPriceWithTax > 0n) return { token: contracts.BKC_TOKEN, spender: targetPool, amount: buyPriceWithTax };
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getNftPoolContract(signer, targetPool);
            const nftCount = await contract.getNFTBalance();
            if (nftCount === 0n) throw new Error('No NFTs available in pool');
            
            try {
                const [bkcCost, ethCost] = await contract.getTotalBuyCost();
                buyPriceWithTax = bkcCost; ethFee = ethCost;
            } catch {
                buyPriceWithTax = await contract.getBuyPriceWithTax();
                ethFee = await contract.buyEthFee().catch(() => 0n);
            }
            
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, ['function balanceOf(address) view returns (uint256)'], provider);
            const bkcBalance = await bkcContract.balanceOf(userAddress);
            if (bkcBalance < buyPriceWithTax) throw new Error(`Insufficient BKC. Need ${ethers.formatEther(buyPriceWithTax)} BKC`);
            
            const ethBalance = await provider.getBalance(userAddress);
            if (ethBalance < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH for fee + gas');
        },
        
        onSuccess: async (receipt) => {
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NFT_POOL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'NFTPurchased') { tokenId = Number(parsed.args.tokenId); break; }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, tokenId);
        },
        onError
    });
}

export async function buySpecificNft({
    poolAddress, poolTier, tokenId, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) throw new Error('Pool address or valid pool tier is required');
    if (tokenId === undefined) throw new Error('Token ID is required');
    
    let storedOperator = operator;
    let buyPriceWithTax = 0n;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'BuySpecificNFT', button,
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buySpecificNFT',
        args: () => [tokenId, resolveOperator(storedOperator)],
        get value() { return ethFee; },
        
        get approval() {
            if (buyPriceWithTax > 0n) return { token: contracts.BKC_TOKEN, spender: targetPool, amount: buyPriceWithTax };
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getNftPoolContract(signer, targetPool);
            if (!(await contract.isNFTInPool(tokenId))) throw new Error('NFT is not in pool');
            
            try {
                const [bkcCost, ethCost] = await contract.getTotalBuyCost();
                buyPriceWithTax = bkcCost; ethFee = ethCost;
            } catch {
                buyPriceWithTax = await contract.getBuyPriceWithTax();
                ethFee = await contract.buyEthFee().catch(() => 0n);
            }
            
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, ['function balanceOf(address) view returns (uint256)'], provider);
            if ((await bkcContract.balanceOf(userAddress)) < buyPriceWithTax) throw new Error('Insufficient BKC');
            if ((await provider.getBalance(userAddress)) < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');
        },
        onSuccess, onError
    });
}

export async function buyNftWithSlippage({
    poolAddress, poolTier, maxPrice, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) throw new Error('Pool address or valid pool tier is required');
    
    const maxPriceWei = BigInt(maxPrice);
    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'BuyNFTWithSlippage', button,
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buyNFTWithSlippage',
        args: () => [maxPriceWei, resolveOperator(storedOperator)],
        get value() { return ethFee; },
        approval: { token: contracts.BKC_TOKEN, spender: targetPool, amount: maxPriceWei },
        
        validate: async (signer, userAddress) => {
            const contract = getNftPoolContract(signer, targetPool);
            if ((await contract.getNFTBalance()) === 0n) throw new Error('No NFTs available');
            
            const currentPrice = await contract.getBuyPriceWithTax();
            if (currentPrice > maxPriceWei) throw new Error(`Price exceeds max`);
            ethFee = await contract.buyEthFee().catch(() => 0n);
            
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, ['function balanceOf(address) view returns (uint256)'], provider);
            if ((await bkcContract.balanceOf(userAddress)) < maxPriceWei) throw new Error('Insufficient BKC');
            if ((await provider.getBalance(userAddress)) < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');
        },
        
        onSuccess: async (receipt) => {
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NFT_POOL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'NFTPurchased') { tokenId = Number(parsed.args.tokenId); break; }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, tokenId);
        },
        onError
    });
}

export async function sellNft({
    poolAddress, poolTier, tokenId, minPayout, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) throw new Error('Pool address or valid pool tier is required');
    if (tokenId === undefined) throw new Error('Token ID is required');
    
    let storedOperator = operator;
    let finalMinPayout = 0n;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'SellNFT', button,
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'sellNFT',
        args: () => [tokenId, finalMinPayout, resolveOperator(storedOperator)],
        get value() { return ethFee; },
        
        validate: async (signer, userAddress) => {
            const contract = getNftPoolContract(signer, targetPool);
            const nftContract = getNftContract(signer);
            
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('You do not own this NFT');
            
            const poolBoost = await contract.boostBips();
            const nftBoost = await nftContract.boostBips(tokenId);
            if (poolBoost !== nftBoost) throw new Error('NFT tier does not match pool tier');
            
            try {
                const [bkcPayout, ethCost] = await contract.getTotalSellInfo();
                finalMinPayout = minPayout ? BigInt(minPayout) : (bkcPayout * 95n) / 100n;
                ethFee = ethCost;
            } catch {
                const sellPriceAfterTax = await contract.getSellPriceAfterTax();
                finalMinPayout = minPayout ? BigInt(minPayout) : (sellPriceAfterTax * 95n) / 100n;
                ethFee = await contract.sellEthFee().catch(() => 0n);
            }
            
            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');
            
            if (!(await nftContract.isApprovedForAll(userAddress, targetPool))) {
                const approveTx = await nftContract.setApprovalForAll(targetPool, true);
                await approveTx.wait();
            }
        },
        onSuccess, onError
    });
}

export async function approveAllNfts({
    poolAddress, poolTier,
    button = null, onSuccess = null, onError = null
}) {
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) throw new Error('Pool address or valid pool tier is required');

    return await txEngine.execute({
        name: 'ApproveAllNFTs', button,
        getContract: async (signer) => getNftContract(signer),
        method: 'setApprovalForAll',
        args: [targetPool, true],
        validate: async (signer, userAddress) => {
            if (await getNftContract(signer).isApprovedForAll(userAddress, targetPool)) {
                throw new Error('Already approved');
            }
        },
        onSuccess, onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

export async function getBuyPrice(poolAddress) {
    return await (await getNftPoolContractReadOnly(poolAddress)).getBuyPrice();
}

export async function getBuyPriceWithTax(poolAddress) {
    return await (await getNftPoolContractReadOnly(poolAddress)).getBuyPriceWithTax();
}

export async function getSellPrice(poolAddress) {
    return await (await getNftPoolContractReadOnly(poolAddress)).getSellPrice();
}

export async function getSellPriceAfterTax(poolAddress) {
    return await (await getNftPoolContractReadOnly(poolAddress)).getSellPriceAfterTax();
}

export async function getTotalBuyCost(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    try {
        const [bkcCost, ethCost] = await contract.getTotalBuyCost();
        return { bkcCost, bkcFormatted: ethers.formatEther(bkcCost), ethCost, ethFormatted: ethers.formatEther(ethCost) };
    } catch {
        const bkcCost = await contract.getBuyPriceWithTax();
        const ethCost = await contract.buyEthFee().catch(() => 0n);
        return { bkcCost, bkcFormatted: ethers.formatEther(bkcCost), ethCost, ethFormatted: ethers.formatEther(ethCost) };
    }
}

export async function getTotalSellInfo(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    try {
        const [bkcPayout, ethCost] = await contract.getTotalSellInfo();
        return { bkcPayout, bkcFormatted: ethers.formatEther(bkcPayout), ethCost, ethFormatted: ethers.formatEther(ethCost) };
    } catch {
        const bkcPayout = await contract.getSellPriceAfterTax();
        const ethCost = await contract.sellEthFee().catch(() => 0n);
        return { bkcPayout, bkcFormatted: ethers.formatEther(bkcPayout), ethCost, ethFormatted: ethers.formatEther(ethCost) };
    }
}

export async function getPoolInfo(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const [poolInfo, buyPrice, sellPrice, boostBips] = await Promise.all([
        contract.getPoolInfo(), contract.getBuyPrice().catch(() => 0n),
        contract.getSellPrice().catch(() => 0n), contract.boostBips()
    ]);
    return {
        bkcBalance: poolInfo.bkcBalance, nftCount: Number(poolInfo.nftCount),
        k: poolInfo.k, initialized: poolInfo.initialized, boostBips: Number(boostBips),
        buyPrice, buyPriceFormatted: ethers.formatEther(buyPrice),
        sellPrice, sellPriceFormatted: ethers.formatEther(sellPrice)
    };
}

export async function getAvailableNfts(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    return (await contract.getAvailableNFTs()).map(id => Number(id));
}

export async function getEthFeeConfig(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    try {
        const config = await contract.getEthFeeConfig();
        return {
            buyFee: config.buyFee, buyFeeFormatted: ethers.formatEther(config.buyFee),
            sellFee: config.sellFee, sellFeeFormatted: ethers.formatEther(config.sellFee),
            totalCollected: config.totalCollected, totalCollectedFormatted: ethers.formatEther(config.totalCollected)
        };
    } catch {
        const [buyFee, sellFee, totalCollected] = await Promise.all([
            contract.buyEthFee().catch(() => 0n), contract.sellEthFee().catch(() => 0n), contract.totalETHCollected().catch(() => 0n)
        ]);
        return {
            buyFee, buyFeeFormatted: ethers.formatEther(buyFee),
            sellFee, sellFeeFormatted: ethers.formatEther(sellFee),
            totalCollected, totalCollectedFormatted: ethers.formatEther(totalCollected)
        };
    }
}

export async function getTradingStats(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    try {
        const stats = await contract.getTradingStats();
        return { volume: stats.volume, volumeFormatted: ethers.formatEther(stats.volume), taxes: stats.taxes, taxesFormatted: ethers.formatEther(stats.taxes), buys: Number(stats.buys), sells: Number(stats.sells) };
    } catch {
        const [volume, taxes, buys, sells] = await Promise.all([
            contract.totalVolume().catch(() => 0n), contract.totalTaxesCollected().catch(() => 0n), contract.totalBuys().catch(() => 0n), contract.totalSells().catch(() => 0n)
        ]);
        return { volume, volumeFormatted: ethers.formatEther(volume), taxes, taxesFormatted: ethers.formatEther(taxes), buys: Number(buys), sells: Number(sells) };
    }
}

export async function getTierName(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    try { return await contract.getTierName(); }
    catch {
        const boostBips = await contract.boostBips();
        return { 5000: 'Diamond', 4000: 'Gold', 2500: 'Silver', 1000: 'Bronze' }[Number(boostBips)] || 'Unknown';
    }
}

export async function getSpread(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    try {
        const result = await contract.getSpread();
        return { spread: result.spread, spreadFormatted: ethers.formatEther(result.spread), spreadBips: Number(result.spreadBips), spreadPercent: Number(result.spreadBips) / 100 };
    } catch {
        const [buy, sell] = await Promise.all([contract.getBuyPrice().catch(() => 0n), contract.getSellPrice().catch(() => 0n)]);
        const spread = buy > sell ? buy - sell : 0n;
        const spreadBips = sell > 0n ? Number((spread * 10000n) / sell) : 0;
        return { spread, spreadFormatted: ethers.formatEther(spread), spreadBips, spreadPercent: spreadBips / 100 };
    }
}

export async function isNFTInPool(poolAddress, tokenId) {
    return await (await getNftPoolContractReadOnly(poolAddress)).isNFTInPool(tokenId);
}

export async function isApprovedForAll(userAddress, poolAddress) {
    return await (await getNftContractReadOnly()).isApprovedForAll(userAddress, poolAddress);
}

// ============================================================================
// 5. ALIASES & EXPORT
// ============================================================================

export const buyFromPool = buyNft;
export const sellToPool = sellNft;

export const NftTx = {
    buyNft, buySpecificNft, buyNftWithSlippage, sellNft, approveAllNfts,
    buyFromPool, sellToPool,
    getBuyPrice, getBuyPriceWithTax, getSellPrice, getSellPriceAfterTax,
    getTotalBuyCost, getTotalSellInfo, getEthFeeConfig,
    getPoolInfo, getAvailableNfts, isNFTInPool, isApprovedForAll,
    getTradingStats, getTierName, getSpread,
    getPoolAddress, getAllPools, POOL_TIERS
};

export default NftTx;