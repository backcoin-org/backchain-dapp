// modules/js/transactions/nft-tx.js
// ✅ PRODUCTION V1.0 - NFT Pool Transaction Handlers
// 
// This module provides transaction functions for the NFT Pool contract.
// Supports buying and selling NFTs using bonding curve pricing.
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - buyNft: Buy an NFT from the pool (pays BKC)
// - sellNft: Sell your NFT to the pool (receives BKC)
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Contract addresses
 */
const CONTRACTS = {
    BKC_TOKEN: window.ENV?.BKC_TOKEN_ADDRESS || '0x5c6d3a63F8A41F4dB91EBA04eA9B39AC2a6d8d79',
    NFT_POOL: window.ENV?.NFT_POOL_ADDRESS || '0xYourNftPoolAddress',
    NFT_CONTRACT: window.ENV?.NFT_CONTRACT_ADDRESS || '0xYourNftContractAddress'
};

/**
 * NFT Pool ABI
 */
const NFT_POOL_ABI = [
    // Write functions
    'function buyNFT(uint256 maxPrice) external returns (uint256 tokenId)',
    'function sellNFT(uint256 tokenId, uint256 minPayout) external',
    
    // Read functions
    'function getBuyPrice() view returns (uint256)',
    'function getSellPrice() view returns (uint256)',
    'function getPoolInfo() view returns (uint256 nftCount, uint256 tokenBalance, uint256 buyPrice, uint256 sellPrice)',
    'function getAvailableNFTs() view returns (uint256[])',
    'function isNFTInPool(uint256 tokenId) view returns (bool)',
    
    // Events
    'event NFTBought(address indexed buyer, uint256 indexed tokenId, uint256 price)',
    'event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout)'
];

/**
 * NFT Contract ABI - for approvals
 */
const NFT_ABI = [
    'function approve(address to, uint256 tokenId) external',
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
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
 */
function getNftPoolContract(signer) {
    const ethers = window.ethers;
    return new ethers.Contract(CONTRACTS.NFT_POOL, NFT_POOL_ABI, signer);
}

/**
 * Creates NFT contract instance
 */
function getNftContract(signer) {
    const ethers = window.ethers;
    return new ethers.Contract(CONTRACTS.NFT_CONTRACT, NFT_ABI, signer);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Buys an NFT from the pool
 * Price is determined by bonding curve
 * 
 * @param {Object} params - Buy parameters
 * @param {string|bigint} [params.maxPrice] - Maximum price willing to pay (slippage protection)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives tokenId)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await NftTx.buyNft({
 *     maxPrice: ethers.parseEther('150'), // Max 150 BKC
 *     button: document.getElementById('buyBtn'),
 *     onSuccess: (receipt, tokenId) => {
 *         showToast(`NFT #${tokenId} purchased!`);
 *         updateNftDisplay();
 *     }
 * });
 */
export async function buyNft({
    maxPrice = null,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // We need to get the current price first
    let buyPrice = 0n;
    let finalMaxPrice = maxPrice ? BigInt(maxPrice) : 0n;

    return await txEngine.execute({
        name: 'BuyNFT',
        button,
        
        getContract: async (signer) => getNftPoolContract(signer),
        method: 'buyNFT',
        args: () => [finalMaxPrice], // Use getter to get updated value
        
        // Token approval config (set in validate)
        get approval() {
            return buyPrice > 0n ? {
                token: CONTRACTS.BKC_TOKEN,
                spender: CONTRACTS.NFT_POOL,
                amount: finalMaxPrice
            } : null;
        },
        
        // Custom validation: check price and pool has NFTs
        validate: async (signer, userAddress) => {
            const contract = getNftPoolContract(signer);
            
            // Get pool info
            const poolInfo = await contract.getPoolInfo();
            
            if (poolInfo.nftCount === 0n) {
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
            
            // Check user has enough tokens
            await ValidationLayer.validateTokenBalance(
                CONTRACTS.BKC_TOKEN,
                finalMaxPrice,
                userAddress
            );
        },
        
        onSuccess: async (receipt) => {
            // Try to extract tokenId from event
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NFT_POOL_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'NFTBought') {
                            tokenId = parsed.args.tokenId;
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
 * Sells an NFT to the pool
 * Payout is determined by bonding curve
 * 
 * @param {Object} params - Sell parameters
 * @param {number|bigint} params.tokenId - Token ID to sell
 * @param {string|bigint} [params.minPayout] - Minimum payout expected (slippage protection)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await NftTx.sellNft({
 *     tokenId: 42,
 *     minPayout: ethers.parseEther('90'), // Min 90 BKC
 *     button: document.getElementById('sellBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('NFT sold!');
 *         updateNftDisplay();
 *     }
 * });
 */
export async function sellNft({
    tokenId,
    minPayout = null,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Validate inputs
    ValidationLayer.nftPool.validateSell({ tokenId, minPayout });
    
    let sellPrice = 0n;
    let finalMinPayout = minPayout ? BigInt(minPayout) : 0n;

    return await txEngine.execute({
        name: 'SellNFT',
        button,
        
        getContract: async (signer) => getNftPoolContract(signer),
        method: 'sellNFT',
        args: [tokenId, finalMinPayout],
        
        // Custom validation: check ownership and approve NFT
        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const poolContract = getNftPoolContract(signer);
            
            // Check user owns the NFT
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }
            
            // Get current sell price
            sellPrice = await poolContract.getSellPrice();
            
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
            const isApprovedForAll = await nftContract.isApprovedForAll(userAddress, CONTRACTS.NFT_POOL);
            const approved = await nftContract.getApproved(tokenId);
            
            if (!isApprovedForAll && approved.toLowerCase() !== CONTRACTS.NFT_POOL.toLowerCase()) {
                // Need to approve NFT first
                console.log('[NFT] Approving NFT for pool...');
                const approveTx = await nftContract.approve(CONTRACTS.NFT_POOL, tokenId);
                await approveTx.wait();
                console.log('[NFT] NFT approved');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Approves all NFTs for the pool (one-time operation)
 * This allows selling any NFT without individual approvals
 * 
 * @param {Object} params - Approval parameters
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function approveAllNfts({
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    return await txEngine.execute({
        name: 'ApproveAllNFTs',
        button,
        
        getContract: async (signer) => getNftContract(signer),
        method: 'setApprovalForAll',
        args: [CONTRACTS.NFT_POOL, true],
        
        // Check if already approved
        validate: async (signer, userAddress) => {
            const nftContract = getNftContract(signer);
            const isApproved = await nftContract.isApprovedForAll(userAddress, CONTRACTS.NFT_POOL);
            
            if (isApproved) {
                throw new Error('NFTs are already approved for the pool');
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
 * Gets current buy price
 * @returns {Promise<bigint>} Price in wei
 */
export async function getBuyPrice() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.NFT_POOL, NFT_POOL_ABI, provider);
    
    return await contract.getBuyPrice();
}

/**
 * Gets current sell price
 * @returns {Promise<bigint>} Payout in wei
 */
export async function getSellPrice() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.NFT_POOL, NFT_POOL_ABI, provider);
    
    return await contract.getSellPrice();
}

/**
 * Gets pool information
 * @returns {Promise<Object>} Pool info
 */
export async function getPoolInfo() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.NFT_POOL, NFT_POOL_ABI, provider);
    
    const info = await contract.getPoolInfo();
    
    return {
        nftCount: Number(info.nftCount),
        tokenBalance: info.tokenBalance,
        buyPrice: info.buyPrice,
        sellPrice: info.sellPrice
    };
}

/**
 * Gets NFTs available in pool
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getAvailableNfts() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.NFT_POOL, NFT_POOL_ABI, provider);
    
    const ids = await contract.getAvailableNFTs();
    return ids.map(id => Number(id));
}

/**
 * Gets NFTs owned by user
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getUserNfts(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const nftContract = new ethers.Contract(CONTRACTS.NFT_CONTRACT, NFT_ABI, provider);
    
    const balance = await nftContract.balanceOf(userAddress);
    const tokenIds = [];
    
    for (let i = 0; i < Number(balance); i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
        tokenIds.push(Number(tokenId));
    }
    
    return tokenIds;
}

/**
 * Checks if user has approved all NFTs for pool
 * @param {string} userAddress - User address
 * @returns {Promise<boolean>} True if approved
 */
export async function isApprovedForAll(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const nftContract = new ethers.Contract(CONTRACTS.NFT_CONTRACT, NFT_ABI, provider);
    
    return await nftContract.isApprovedForAll(userAddress, CONTRACTS.NFT_POOL);
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const NftTx = {
    buyNft,
    sellNft,
    approveAllNfts,
    // Read helpers
    getBuyPrice,
    getSellPrice,
    getPoolInfo,
    getAvailableNfts,
    getUserNfts,
    isApprovedForAll
};

export default NftTx;