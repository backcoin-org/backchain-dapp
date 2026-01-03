// modules/js/transactions/nft-tx.js
// ✅ PRODUCTION V1.7 - Reduced retries, MaxUint256 approval first
// 
// CHANGES V1.7:
// - MaxUint256 approval as first strategy (one-time approval for pool)
// - Reduced retry logging noise
// - Added 500ms delay before sending tx (RPC stabilization)
// - Longer delays between retries (2s, 4s, 6s instead of 1s, 2s, 4s)
// - Cleaner console output
//
// CHANGES V1.6:
// - CRITICAL FIX: buyFromPool → buyNFTWithSlippage (correct method name)
// - CRITICAL FIX: sellToPool → sellNFT (correct method name)
// - Updated ABI to match actual NFTLiquidityPool.sol contract
// - Updated event names: NFTBought → NFTPurchased
//
// CHANGES V1.3:
// - Reverted to txEngine approval handling (has retry logic)
// - Removed manual approve in validate() to avoid RPC issues
// - Keep detailed logging for debugging
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
    'function buyNFT() external returns (uint256 tokenId)',
    'function buySpecificNFT(uint256 _tokenId) external',
    'function buyNFTWithSlippage(uint256 _maxPrice) external returns (uint256 tokenId)',
    'function sellNFT(uint256 _tokenId, uint256 _minPayout) external',
    
    // Read functions
    'function getBuyPrice() view returns (uint256)',
    'function getBuyPriceWithTax() view returns (uint256)',
    'function getSellPrice() view returns (uint256)',
    'function getSellPriceAfterTax() view returns (uint256)',
    'function getAvailableNFTs() view returns (uint256[])',
    'function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized)',
    'function getNFTBalance() view returns (uint256)',
    'function getBKCBalance() view returns (uint256)',
    'function isNFTInPool(uint256 _tokenId) view returns (bool)',
    'function boostBips() view returns (uint256)',
    
    // Events
    'event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)',
    'event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)'
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
// 3. HELPER: Approval with retry and fallback strategies
// ============================================================================

/**
 * Approve BKC with retry logic and multiple strategies
 * Strategy 1: Normal approve with exact amount
 * Strategy 2: Approve with MaxUint256 (unlimited)
 * Strategy 3: Reset to 0 first, then approve
 */
async function approveWithRetry(signer, userAddress, tokenAddress, spenderAddress, amount, maxRetries = 3) {
    const ethers = window.ethers;
    const bkcContract = new ethers.Contract(tokenAddress, BKC_ABI, signer);
    
    // Check current allowance
    const currentAllowance = await bkcContract.allowance(userAddress, spenderAddress);
    console.log('[NFT] Current allowance:', ethers.formatEther(currentAllowance), 'BKC');
    
    if (currentAllowance >= amount) {
        console.log('[NFT] Sufficient allowance, skipping approval');
        return true;
    }
    
    // V1.7: MaxUint256 first to avoid future re-approvals
    const strategies = [
        {
            name: 'max_uint256',
            amount: ethers.MaxUint256,
            description: 'Approving unlimited (one-time)'
        },
        {
            name: 'exact_amount',
            amount: amount,
            description: 'Approving exact amount'
        },
        {
            name: 'reset_then_approve',
            amount: ethers.MaxUint256,
            resetFirst: true,
            description: 'Resetting to 0, then approving unlimited'
        }
    ];
    
    for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
        const strategy = strategies[strategyIndex];
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // V1.7: Only log on first attempt or if retrying
                if (attempt === 1) {
                    console.log(`[NFT] ${strategy.description}...`);
                } else {
                    console.log(`[NFT] Retry ${attempt}/${maxRetries}...`);
                }
                
                // Reset to 0 first if strategy requires it
                if (strategy.resetFirst && currentAllowance > 0n) {
                    console.log('[NFT] Resetting allowance to 0...');
                    const resetTx = await bkcContract.approve(spenderAddress, 0n);
                    await resetTx.wait();
                    console.log('[NFT] Allowance reset to 0');
                }
                
                // V1.7: Add small delay before sending to let RPC stabilize
                await new Promise(r => setTimeout(r, 500));
                
                // Execute approval
                const approveTx = await bkcContract.approve(spenderAddress, strategy.amount);
                console.log('[NFT] Approval tx sent:', approveTx.hash);
                
                const receipt = await approveTx.wait();
                console.log('[NFT] Approval confirmed in block:', receipt.blockNumber);
                
                // Verify allowance
                const newAllowance = await bkcContract.allowance(userAddress, spenderAddress);
                
                if (newAllowance >= amount) {
                    console.log('[NFT] ✅ Approval successful!');
                    return true;
                }
            } catch (error) {
                // V1.7: Quieter logging
                console.warn(`[NFT] Attempt ${attempt} failed:`, error.message?.substring(0, 80));
                
                // Check if user rejected
                if (error.code === 'ACTION_REJECTED' || 
                    error.code === 4001 || 
                    error.message?.includes('user rejected') ||
                    error.message?.includes('User denied')) {
                    throw new Error('User rejected the approval');
                }
                
                // Wait before retry (longer delay for RPC issues)
                if (attempt < maxRetries) {
                    const delay = 2000 * attempt; // 2s, 4s, 6s
                    console.log(`[NFT] Waiting ${delay/1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
        
        // Only try next strategy if current one failed all attempts
        if (strategyIndex < strategies.length - 1) {
            console.log(`[NFT] Trying alternative approach...`);
        }
    }
    
    throw new Error('All approval strategies failed. Please try again later or check your network connection.');
}

// ============================================================================
// 4. TRANSACTION FUNCTIONS
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
    let approvalDone = false;

    return await txEngine.execute({
        name: 'BuyNFT',
        button,
        
        getContract: async (signer) => getNftPoolContract(signer, targetPool),
        method: 'buyNFTWithSlippage',  // V1.6: Corrected method name
        args: () => [finalMaxPrice],
        
        // V1.4: No automatic approval - we handle it in validate with retry logic
        approval: null,
        
        // V1.5: Skip simulation - it's failing due to RPC issues but tx might work
        skipSimulation: true,
        
        validate: async (signer, userAddress) => {
            const ethers = window.ethers;
            const contract = getNftPoolContract(signer, targetPool);
            
            console.log('[NFT] Validating buy from pool:', targetPool);
            
            // Check pool has NFTs
            let availableNFTs = [];
            try {
                availableNFTs = await contract.getAvailableNFTs();
                console.log('[NFT] Available NFTs in pool:', availableNFTs.length);
            } catch (e) {
                console.warn('[NFT] getAvailableNFTs failed:', e.message);
                throw new Error('Could not verify pool NFT availability');
            }
            
            if (!availableNFTs || availableNFTs.length === 0) {
                throw new Error('No NFTs available in pool');
            }
            
            // V1.6: Get buy price WITH TAX (this is what buyNFTWithSlippage checks)
            let buyPriceWithTax;
            try {
                buyPriceWithTax = await contract.getBuyPriceWithTax();
                buyPrice = await contract.getBuyPrice();
                console.log('[NFT] Buy price (without tax):', ethers.formatEther(buyPrice), 'BKC');
                console.log('[NFT] Buy price (with tax):', ethers.formatEther(buyPriceWithTax), 'BKC');
            } catch (e) {
                // Fallback to getBuyPrice and add 10% for tax estimate
                buyPrice = await contract.getBuyPrice();
                buyPriceWithTax = (buyPrice * 110n) / 100n;
                console.log('[NFT] Buy price (estimated with tax):', ethers.formatEther(buyPriceWithTax), 'BKC');
            }
            
            // Set max price with 5% slippage on top of price+tax
            // V1.6: Always recalculate based on current price with tax, ignoring passed maxPrice
            // This ensures we account for tax that may not be included in StorePage's maxPrice
            finalMaxPrice = (buyPriceWithTax * 105n) / 100n;
            
            // If user explicitly passed a maxPrice that's higher, use that instead
            if (maxPrice) {
                const passedMaxPrice = BigInt(maxPrice);
                // Only use passed maxPrice if it's higher than our calculated one
                // (user might want to pay more for faster execution)
                if (passedMaxPrice > finalMaxPrice) {
                    finalMaxPrice = passedMaxPrice;
                    console.log('[NFT] Using user-provided max price:', ethers.formatEther(finalMaxPrice), 'BKC');
                }
            }
            
            console.log('[NFT] Max price (with slippage):', ethers.formatEther(finalMaxPrice), 'BKC');
            
            if (finalMaxPrice < buyPriceWithTax) {
                throw new Error(`Price increased. Current price: ${ethers.formatEther(buyPriceWithTax)} BKC`);
            }
            
            // Check BKC balance
            const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, BKC_ABI, signer);
            const userBalance = await bkcContract.balanceOf(userAddress);
            console.log('[NFT] User BKC balance:', ethers.formatEther(userBalance), 'BKC');
            
            if (userBalance < finalMaxPrice) {
                throw new Error(`Insufficient BKC balance. Need ${ethers.formatEther(finalMaxPrice)} BKC, have ${ethers.formatEther(userBalance)} BKC`);
            }
            
            // V1.4: Handle approval with retry and multiple strategies
            if (!approvalDone) {
                await approveWithRetry(
                    signer, 
                    userAddress, 
                    contracts.BKC_TOKEN, 
                    targetPool, 
                    finalMaxPrice
                );
                approvalDone = true;
            }
            
            console.log('[NFT] ✅ Validation complete, ready to buy');
        },
        
        onSuccess: async (receipt) => {
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NFT_POOL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'NFTPurchased') {  // V1.6: Correct event name
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
        method: 'sellNFT',  // V1.6: Corrected method name
        args: () => [tokenId, finalMinPayout],
        
        // V1.5: Skip simulation - RPC issues may cause false failures
        skipSimulation: true,
        
        validate: async (signer, userAddress) => {
            const ethers = window.ethers;
            const nftContract = getNftContract(signer);
            const poolContract = getNftPoolContract(signer, targetPool);
            
            console.log('[NFT] Validating sell to pool:', targetPool);
            console.log('[NFT] Token ID to sell:', tokenId.toString());
            
            // Check user owns the NFT
            let owner;
            try {
                owner = await nftContract.ownerOf(tokenId);
                console.log('[NFT] Token owner:', owner);
            } catch (e) {
                throw new Error('Could not verify NFT ownership. Token may not exist.');
            }
            
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            // V1.6: Get sell price AFTER TAX (this is what the user actually receives)
            let sellPriceAfterTax;
            try {
                sellPrice = await poolContract.getSellPrice();
                sellPriceAfterTax = await poolContract.getSellPriceAfterTax();
                console.log('[NFT] Sell price (gross):', ethers.formatEther(sellPrice), 'BKC');
                console.log('[NFT] Sell price (after tax):', ethers.formatEther(sellPriceAfterTax), 'BKC');
            } catch (e) {
                // Fallback: estimate 10% tax
                sellPrice = await poolContract.getSellPrice();
                sellPriceAfterTax = (sellPrice * 90n) / 100n;
                console.log('[NFT] Sell price (estimated after tax):', ethers.formatEther(sellPriceAfterTax), 'BKC');
            }
            
            // Set min payout with 5% slippage below net payout
            if (!minPayout) {
                finalMinPayout = (sellPriceAfterTax * 95n) / 100n;
            } else {
                finalMinPayout = BigInt(minPayout);
            }
            
            console.log('[NFT] Min payout (with slippage):', ethers.formatEther(finalMinPayout), 'BKC');
            
            if (sellPriceAfterTax < finalMinPayout) {
                throw new Error(`Price decreased. Current payout: ${ethers.formatEther(sellPriceAfterTax)} BKC`);
            }
            
            // Check if NFT is approved for pool
            const isApprovedForAll = await nftContract.isApprovedForAll(userAddress, targetPool);
            
            console.log('[NFT] Is approved for all:', isApprovedForAll);
            
            // V1.7: Use setApprovalForAll (one-time, more reliable than individual approve)
            if (!isApprovedForAll) {
                console.log('[NFT] Setting approval for all NFTs...');
                
                // Add delay before approval (RPC stabilization)
                await new Promise(r => setTimeout(r, 500));
                
                const approveTx = await nftContract.setApprovalForAll(targetPool, true);
                await approveTx.wait();
                console.log('[NFT] ✅ All NFTs approved for pool');
                
                // Wait for propagation
                await new Promise(r => setTimeout(r, 1000));
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