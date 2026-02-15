// modules/js/transactions/nft-tx.js
// ✅ V9.0 - Updated for NFTPool V9 (XY=K bonding curve, ETH fees, no BKC tax)
//
// CHANGES V9.0:
// - rewardBoosterNFT → rewardBooster
// - No BKC tax (5%/10% removed) — pure bonding curve price
// - ETH fees via ecosystem.calculateFee (not buyEthFee/sellEthFee)
// - buyNFT(maxBkcPrice, operator) payable — max BKC price + ETH fee
// - buySpecificNFT(tokenId, maxBkcPrice, operator) payable
// - sellNFT(tokenId, minPayout, operator) payable — ETH fee
// - Removed: buyNFTWithSlippage, getBuyPriceWithTax, getSellPriceAfterTax
// - getPoolInfo returns 5-tuple (bkcBalance, nftCount, k, initialized, tier)
// - getStats returns 4-tuple (volume, buys, sells, ethFees)
// - getEthFees(buyFee, sellFee) replaces getEthFeeConfig
// - getTotalBuyCost/getTotalSellInfo still exist (bkcCost/bkcPayout + ethCost)
// - getSpread still exists
// - tier() returns uint8 (pool tier)
// - Tier matching: pool.tier() vs booster.tokenTier(tokenId)
//
// ============================================================================
// V9 BONDING CURVE (XY=K):
// - Buy: BKC price from curve, no BKC tax, ETH fee to ecosystem
// - Sell: BKC payout from curve, no BKC tax, ETH fee to ecosystem
// ============================================================================

import { txEngine, ValidationLayer, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

const POOL_TIERS = ['diamond', 'gold', 'silver', 'bronze'];

function getContracts(poolTier = null) {
    const bkcToken = addresses?.bkcToken || contractAddresses?.bkcToken || window.contractAddresses?.bkcToken;
    const nftContract = addresses?.rewardBooster || contractAddresses?.rewardBooster || window.contractAddresses?.rewardBooster;

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
    // Write
    'function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)',
    'function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable',
    'function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable',

    // Read - Prices
    'function getBuyPrice() view returns (uint256)',
    'function getSellPrice() view returns (uint256)',
    'function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)',
    'function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)',
    'function getEthFees() view returns (uint256 buyFee, uint256 sellFee)',
    'function getSpread() view returns (uint256 spread, uint256 spreadBips)',

    // Read - Pool State
    'function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 effectiveNftCount, uint256 virtualReserves, uint256 mintableReserves, uint256 k, bool initialized, uint8 tier)',
    'function getAvailableNFTs() view returns (uint256[])',
    'function isNFTInPool(uint256 tokenId) view returns (bool)',
    'function tier() view returns (uint8)',
    'function getTierName() view returns (string)',

    // Read - Stats
    'function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)',

    // Events
    'event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 nftCount, address operator)',
    'event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 nftCount, address operator)'
];

const NFT_ABI = [
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenTier(uint256 tokenId) view returns (uint8)'
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

/**
 * Compute NFT action ID matching Solidity: keccak256(abi.encode("NFT_BUY_T"|"NFT_SELL_T", tier))
 */
function nftActionId(prefix, tier) {
    const ethers = window.ethers;
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint8"], [prefix, Number(tier)])
    );
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
    let buyPrice = 0n;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'BuyNFT', button,
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buyNFT',
        args: () => [buyPrice, resolveOperator(storedOperator)],
        get value() { return ethFee; },

        get approval() {
            if (buyPrice > 0n) return { token: contracts.BKC_TOKEN, spender: targetPool, amount: buyPrice };
            return null;
        },

        validate: async (signer, userAddress) => {
            const contract = await getNftPoolContractReadOnly(targetPool);

            // V9: BKC price from bonding curve, ETH fee calculated client-side
            const [bkcCost] = await contract.getTotalBuyCost();
            buyPrice = bkcCost;

            // Client-side fee: ecosystem.getFeeConfig(ACTION_BUY) + gasPrice
            const tier = await contract.tier();
            ethFee = await calculateFeeClientSide(nftActionId("NFT_BUY_T", tier));

            console.log(`[BuyNFT] Price: ${ethers.formatEther(buyPrice)} BKC, Fee: ${ethers.formatEther(ethFee)} ETH`);

            const poolInfo = await contract.getPoolInfo();
            // V3: effectiveNftCount = nftCount + virtualReserves + mintableReserves (index 2)
            if (Number(poolInfo[2]) <= 1) throw new Error('No NFTs available in pool');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, ['function balanceOf(address) view returns (uint256)'], provider);
            const bkcBalance = await bkcContract.balanceOf(userAddress);
            if (bkcBalance < buyPrice) throw new Error(`Insufficient BKC. Need ${ethers.formatEther(buyPrice)} BKC`);

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
    let buyPrice = 0n;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'BuySpecificNFT', button,
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buySpecificNFT',
        args: () => [tokenId, buyPrice, resolveOperator(storedOperator)],
        get value() { return ethFee; },

        get approval() {
            if (buyPrice > 0n) return { token: contracts.BKC_TOKEN, spender: targetPool, amount: buyPrice };
            return null;
        },

        validate: async (signer, userAddress) => {
            const contract = await getNftPoolContractReadOnly(targetPool);
            if (!(await contract.isNFTInPool(tokenId))) throw new Error('NFT is not in pool');

            const [bkcCost] = await contract.getTotalBuyCost();
            buyPrice = bkcCost;
            const tier = await contract.tier();
            ethFee = await calculateFeeClientSide(nftActionId("NFT_BUY_T", tier));

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, ['function balanceOf(address) view returns (uint256)'], provider);
            if ((await bkcContract.balanceOf(userAddress)) < buyPrice) throw new Error('Insufficient BKC');
            if ((await provider.getBalance(userAddress)) < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');
        },
        onSuccess, onError
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
            const contract = await getNftPoolContractReadOnly(targetPool);
            const nftContract = getNftContract(signer);

            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error('You do not own this NFT');

            // V9: Tier matching via pool.tier() and nft.tokenTier()
            const poolTierVal = await contract.tier();
            const nftTierVal = await nftContract.tokenTier(tokenId);
            if (poolTierVal !== nftTierVal) throw new Error('NFT tier does not match pool tier');

            const [bkcPayout] = await contract.getTotalSellInfo();
            finalMinPayout = minPayout ? BigInt(minPayout) : (bkcPayout * 95n) / 100n;
            const tier = await contract.tier();
            ethFee = await calculateFeeClientSide(nftActionId("NFT_SELL_T", tier));

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH');

            if (!(await nftContract.isApprovedForAll(userAddress, targetPool))) {
                // Get fresh fee data from Alchemy (not MetaMask) with 120% buffer
                const { NetworkManager } = await import('../core/index.js');
                const feeData = await NetworkManager.getProvider().getFeeData();
                const approveOpts = { gasLimit: 100000n };
                if (feeData.maxFeePerGas) {
                    approveOpts.maxFeePerGas = feeData.maxFeePerGas * 120n / 100n;
                    approveOpts.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
                }
                const approveTx = await nftContract.setApprovalForAll(targetPool, true, approveOpts);
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

export async function getSellPrice(poolAddress) {
    return await (await getNftPoolContractReadOnly(poolAddress)).getSellPrice();
}

export async function getTotalBuyCost(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const [bkcCost] = await contract.getTotalBuyCost();
    const tier = await contract.tier();
    const ethCost = await calculateFeeClientSide(nftActionId("NFT_BUY_T", tier));
    return { bkcCost, bkcFormatted: ethers.formatEther(bkcCost), ethCost, ethFormatted: ethers.formatEther(ethCost) };
}

export async function getTotalSellInfo(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const [bkcPayout] = await contract.getTotalSellInfo();
    const tier = await contract.tier();
    const ethCost = await calculateFeeClientSide(nftActionId("NFT_SELL_T", tier));
    return { bkcPayout, bkcFormatted: ethers.formatEther(bkcPayout), ethCost, ethFormatted: ethers.formatEther(ethCost) };
}

export async function getPoolInfo(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const [poolInfo, buyPrice, sellPrice] = await Promise.all([
        contract.getPoolInfo(), contract.getBuyPrice().catch(() => 0n), contract.getSellPrice().catch(() => 0n)
    ]);
    return {
        bkcBalance: poolInfo[0], nftCount: Number(poolInfo[1]),
        effectiveNftCount: Number(poolInfo[2]), virtualReserves: Number(poolInfo[3]),
        mintableReserves: Number(poolInfo[4]),
        k: poolInfo[5], initialized: poolInfo[6], tier: Number(poolInfo[7]),
        buyPrice, buyPriceFormatted: ethers.formatEther(buyPrice),
        sellPrice, sellPriceFormatted: ethers.formatEther(sellPrice)
    };
}

export async function getAvailableNfts(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    return (await contract.getAvailableNFTs()).map(id => Number(id));
}

export async function getEthFees(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const tier = await contract.tier();
    const buyFee = await calculateFeeClientSide(nftActionId("NFT_BUY_T", tier));
    const sellFee = await calculateFeeClientSide(nftActionId("NFT_SELL_T", tier));
    return {
        buyFee, buyFeeFormatted: ethers.formatEther(buyFee),
        sellFee, sellFeeFormatted: ethers.formatEther(sellFee)
    };
}

// Backward-compatible alias
export const getEthFeeConfig = getEthFees;

export async function getStats(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const s = await contract.getStats();
    return {
        volume: s[0], volumeFormatted: ethers.formatEther(s[0]),
        buys: Number(s[1]), sells: Number(s[2]),
        ethFees: s[3], ethFeesFormatted: ethers.formatEther(s[3])
    };
}

// Backward-compatible alias
export const getTradingStats = getStats;

export async function getTierName(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    return await contract.getTierName();
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
    buyNft, buySpecificNft, sellNft, approveAllNfts,
    buyFromPool, sellToPool,
    getBuyPrice, getSellPrice,
    getTotalBuyCost, getTotalSellInfo, getEthFees, getEthFeeConfig,
    getPoolInfo, getAvailableNfts, isNFTInPool, isApprovedForAll,
    getStats, getTradingStats, getTierName, getSpread,
    getPoolAddress, getAllPools, POOL_TIERS
};

export default NftTx;
