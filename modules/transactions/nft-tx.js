// modules/js/transactions/nft-tx.js
// ✅ PRODUCTION V1.2 - FIXED: Uses getAvailableNFTs instead of getPoolNFTCount
// 
// CHANGES V1.2:
// - Fixed validate() to use getAvailableNFTs() instead of getPoolNFTCount()
// - Added better error handling for pool validation
// - Fixed args to be array, not function
//
// CHANGES V1.1:
// - Imports addresses from config.js (loaded from deployment-addresses.json)
// - Removed hardcoded fallback addresses
// - Added support for multiple pools by tier (diamond, platinum, gold, etc.)
// - Uses rewardBoosterNFT as the NFT contract
// - Added aliases for backward compatibility (buyFromPool, sellToPool)
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - buyNft / buyFromPool: Buy an NFT from a specific pool (pays BKC)
// - sellNft / sellToPool: Sell your NFT to a pool (receives BKC)
// - approveAllNfts: Approve all NFTs for a pool
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Pool tiers available
 */
const POOL_TIERS = ['diamond', 'platinum', 'gold', 'silver', 'bronze', 'iron', 'crystal'];

/**
 * Get contract addresses dynamically from config.js
 * 
 * @param {string} [poolTier] - Pool tier (diamond, platinum, gold, silver, bronze, iron, crystal)
 * @returns {Object} Contract addresses
 * @throws {Error} If addresses are not loaded
 */
function getContracts(poolTier = null) {
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    // NFT contract is RewardBoosterNFT
    const nftContract = addresses?.rewardBoosterNFT || 
                        contractAddresses?.rewardBoosterNFT ||
                        window.contractAddresses?.rewardBoosterNFT;
    
    // Get pool address based on tier
    let nftPool = null;
    if (poolTier) {
        const poolKey = `pool_${poolTier.toLowerCase()}`;
        nftPool = addresses?.[poolKey] || 
                  contractAddresses?.[poolKey] ||
                  window.contractAddresses?.[poolKey];
    }
    
    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    if (!nftContract) {
        console.error('❌ NFT Contract (RewardBoosterNFT) address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        NFT_CONTRACT: nftContract,
        NFT_POOL: nftPool // May be null if no tier specified
    };
}

/**
 * Get pool address for a specific tier
 * @param {string} tier - Pool tier name
 * @returns {string|null} Pool address or null
 */
function getPoolAddress(tier) {
    const poolKey = `pool_${tier.toLowerCase()}`;
    return addresses?.[poolKey] || 
           contractAddresses?.[poolKey] ||
           window.contractAddresses?.[poolKey] ||
           null;
}

/**
 * Get all available pool addresses
 * @returns {Object} Map of tier -> address
 */
function getAllPools() {
    const pools = {};
    for (const tier of POOL_TIERS) {
        const address = getPoolAddress(tier);
        if (address) {
            pools[tier] = address;
        }
    }
    return pools;
}

/**
 * NFT Pool ABI - NFTLiquidityPool contract
 */
const NFT_POOL_ABI = [
    // Write functions
    'function buyFromPool(uint256 maxPrice) external returns (uint256 tokenId)',
    'function sellToPool(uint256 tokenId, uint256 minPayout) external',
    
    // Read functions
    'function getBuyPrice() view returns (uint256)',
    'function getSellPrice() view returns (uint256)',
    'function getAvailableNFTs() view returns (uint256[])',
    'function poolTokenBalance() view returns (uint256)',
    'function getNFTsInPool() view returns (uint256[])',
    'function isNFTInPool(uint256 tokenId) view returns (bool)',
    'function tierIndex() view returns (uint256)',
    
    // Events
    'event NFTBought(address indexed buyer, uint256 indexed tokenId, uint256 price)',
    'event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout)'
];

/**
 * NFT Contract ABI (RewardBoosterNFT) - for approvals
 */
const NFT_ABI = [
    'function approve(address to, uint256 tokenId) external',
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function getTierOfToken(uint256 tokenId) view returns (uint256)'
];

/**
 * BKC Token ABI
 */
const BKC_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates NFT Pool contract instance
 * @param {ethers.Signer} signer - Signer
 * @param {string} poolAddress - Pool address
 */
function getNftPoolContract(signer, poolAddress) {
    const ethers = window.ethers;
    return new ethers.Contract(poolAddress, NFT_POOL_ABI, signer);
}

/**
 * Creates NFT Pool contract instance (read-only)
 * @param {string} poolAddress - Pool address
 */
async function getNftPoolContractReadOnly(poolAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    return new ethers.Contract(poolAddress, NFT_POOL_ABI, provider);
}

/**
 * Creates NFT contract instance
 */
function getNftContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, signer);
}

/**
 * Creates NFT contract instance (read-only)
 */
async function getNftContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.NFT_CONTRACT, NFT_ABI, provider);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Buys an NFT from a specific pool
 * Price is determined by bonding curve
 * 
 * @param {Object} params - Buy parameters
 * @param {string} params.poolAddress - Pool contract address
 * @param {string} [params.poolTier] - Alternative: pool tier name (diamond, gold, etc.)
 * @param {string|bigint} [params.maxPrice] - Maximum price willing to pay (slippage protection)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives tokenId)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function buyNft({
    poolAddress,
    poolTier,
    maxPrice = null,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    // Determine pool address
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) {
        throw new Error('Pool address or valid pool tier is required');
    }
    
    let buyPrice = 0n;
    let finalMaxPrice = maxPrice ? BigInt(maxPrice) : 0n;

    return await txEngine.execute({
        name: 'BuyNFT',
        button,
        
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buyFromPool',
        args: () => [finalMaxPrice], // Dynamic args - maxPrice is set in validate
        
        // Token approval config
        get approval() {
            return finalMaxPrice > 0n ? {
                token: contracts.BKC_TOKEN,
                spender: targetPool,
                amount: finalMaxPrice
            } : null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getNftPoolContract(signer, targetPool);
            
            // V1.2: Use getAvailableNFTs instead of getPoolNFTCount
            let availableNFTs = [];
            try {
                availableNFTs = await contract.getAvailableNFTs();
            } catch (e) {
                console.warn('[NFT] getAvailableNFTs failed, trying getNFTsInPool:', e.message);
                try {
                    availableNFTs = await contract.getNFTsInPool();
                } catch (e2) {
                    console.error('[NFT] Could not get pool NFT count:', e2.message);
                    throw new Error('Could not verify pool NFT availability');
                }
            }
            
            if (!availableNFTs || availableNFTs.length === 0) {
                throw new Error('No NFTs available in pool');
            }
            
            // Get current buy price
            buyPrice = await contract.getBuyPrice();
            
            // Set max price with 5% slippage if not specified
            if (!maxPrice) {
                finalMaxPrice = (buyPrice * 105n) / 100n;
            } else {
                finalMaxPrice = BigInt(maxPrice);
            }
            
            if (finalMaxPrice < buyPrice) {
                throw new Error(`Price increased. Current price: ${ethers.formatEther(buyPrice)} BKC`);
            }
        },
        
        onSuccess: async (receipt) => {
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NFT_POOL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'NFTBought') {
                            tokenId = Number(parsed.args.tokenId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, tokenId);
            }
        },
        onError
    });
}

/**
 * Sells an NFT to a pool
 * Payout is determined by bonding curve
 * 
 * @param {Object} params - Sell parameters
 * @param {string} params.poolAddress - Pool contract address
 * @param {string} [params.poolTier] - Alternative: pool tier name
 * @param {number|bigint} params.tokenId - Token ID to sell
 * @param {string|bigint} [params.minPayout] - Minimum payout expected (slippage protection)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function sellNft({
    poolAddress,
    poolTier,
    tokenId,
    minPayout = null,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    // Determine pool address
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) {
        throw new Error('Pool address or valid pool tier is required');
    }
    
    if (tokenId === undefined || tokenId === null) {
        throw new Error('Token ID is required');
    }
    
    let sellPrice = 0n;
    let finalMinPayout = minPayout ? BigInt(minPayout) : 0n;

    return await txEngine.execute({
        name: 'SellNFT',
        button,
        
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'sellToPool',
        args: () => [tokenId, finalMinPayout], // V1.2: Dynamic args
        
        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const poolContract = getNftPoolContract(signer, targetPool);
            
            // Check user owns the NFT
            let owner;
            try {
                owner = await nftContract.ownerOf(tokenId);
            } catch (e) {
                throw new Error('Could not verify NFT ownership. Token may not exist.');
            }
            
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            // Get current sell price
            try {
                sellPrice = await poolContract.getSellPrice();
            } catch (e) {
                throw new Error('Could not get sell price from pool');
            }
            
            // Set min payout with 5% slippage if not specified
            if (!minPayout) {
                finalMinPayout = (sellPrice * 95n) / 100n;
            } else {
                finalMinPayout = BigInt(minPayout);
            }
            
            if (sellPrice < finalMinPayout) {
                throw new Error(`Price decreased. Current payout: ${ethers.formatEther(sellPrice)} BKC`);
            }
            
            // Check if NFT is approved for pool
            const isApprovedForAll = await nftContract.isApprovedForAll(userAddress, targetPool);
            const approved = await nftContract.getApproved(tokenId);
            
            if (!isApprovedForAll && approved.toLowerCase() !== targetPool.toLowerCase()) {
                console.log('[NFT] Approving NFT for pool...');
                const approveTx = await nftContract.approve(targetPool, tokenId);
                await approveTx.wait();
                console.log('[NFT] NFT approved');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Approves all NFTs for a specific pool (one-time operation)
 * 
 * @param {Object} params - Approval parameters
 * @param {string} params.poolAddress - Pool contract address
 * @param {string} [params.poolTier] - Alternative: pool tier name
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function approveAllNfts({
    poolAddress,
    poolTier,
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    // Determine pool address
    const targetPool = poolAddress || getPoolAddress(poolTier);
    if (!targetPool) {
        throw new Error('Pool address or valid pool tier is required');
    }

    return await txEngine.execute({
        name: 'ApproveAllNFTs',
        button,
        
        getContract: async (signer) => getNftContract(signer),
        method: 'setApprovalForAll',
        args: [targetPool, true],
        
        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const isApproved = await nftContract.isApprovedForAll(userAddress, targetPool);
            
            if (isApproved) {
                throw new Error('NFTs are already approved for this pool');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets current buy price for a pool
 * @param {string} poolAddress - Pool address
 * @returns {Promise<bigint>} Price in wei
 */
export async function getBuyPrice(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    return await contract.getBuyPrice();
}

/**
 * Gets current sell price for a pool
 * @param {string} poolAddress - Pool address
 * @returns {Promise<bigint>} Payout in wei
 */
export async function getSellPrice(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    return await contract.getSellPrice();
}

/**
 * Gets pool information
 * @param {string} poolAddress - Pool address
 * @returns {Promise<Object>} Pool info
 */
export async function getPoolInfo(poolAddress) {
    const ethers = window.ethers;
    const contract = await getNftPoolContractReadOnly(poolAddress);
    
    const [nftCount, tokenBalance, buyPrice, sellPrice, tierIndex] = await Promise.all([
        contract.getPoolNFTCount(),
        contract.poolTokenBalance(),
        contract.getBuyPrice(),
        contract.getSellPrice(),
        contract.tierIndex().catch(() => 0n)
    ]);
    
    return {
        nftCount: Number(nftCount),
        tokenBalance,
        buyPrice,
        sellPrice,
        tierIndex: Number(tierIndex),
        buyPriceFormatted: ethers.formatEther(buyPrice),
        sellPriceFormatted: ethers.formatEther(sellPrice)
    };
}

/**
 * Gets NFTs available in a pool
 * @param {string} poolAddress - Pool address
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getAvailableNfts(poolAddress) {
    const contract = await getNftPoolContractReadOnly(poolAddress);
    const ids = await contract.getNFTsInPool();
    return ids.map(id => Number(id));
}

/**
 * Gets NFTs owned by user
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getUserNfts(userAddress) {
    const nftContract = await getNftContractReadOnly();
    const balance = await nftContract.balanceOf(userAddress);
    const tokenIds = [];
    
    for (let i = 0; i < Number(balance); i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
        tokenIds.push(Number(tokenId));
    }
    
    return tokenIds;
}

/**
 * Checks if user has approved all NFTs for a pool
 * @param {string} userAddress - User address
 * @param {string} poolAddress - Pool address
 * @returns {Promise<boolean>} True if approved
 */
export async function isApprovedForAll(userAddress, poolAddress) {
    const nftContract = await getNftContractReadOnly();
    return await nftContract.isApprovedForAll(userAddress, poolAddress);
}

/**
 * Gets the tier of a specific NFT
 * @param {number} tokenId - Token ID
 * @returns {Promise<number>} Tier index
 */
export async function getNftTier(tokenId) {
    const nftContract = await getNftContractReadOnly();
    return Number(await nftContract.getTierOfToken(tokenId));
}

// ============================================================================
// 5. ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

// Alias buyFromPool -> buyNft
export const buyFromPool = buyNft;

// Alias sellToPool -> sellNft  
export const sellToPool = sellNft;

// ============================================================================
// 6. EXPORT
// ============================================================================

export const NftTx = {
    // Main functions
    buyNft,
    sellNft,
    approveAllNfts,
    // Aliases
    buyFromPool,
    sellToPool,
    // Read helpers
    getBuyPrice,
    getSellPrice,
    getPoolInfo,
    getAvailableNfts,
    getUserNfts,
    isApprovedForAll,
    getNftTier,
    // Utility
    getPoolAddress,
    getAllPools,
    POOL_TIERS
};

export default NftTx;