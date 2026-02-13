// modules/js/transactions/fusion-tx.js
// ✅ V1.0 - NFTFusion: Fuse (2→1 up) + Split (1→2 down) + SplitTo (1→2^N)
//
// Two-way NFT tier transformation:
//   Fuse:    2 Bronze → 1 Silver, 2 Silver → 1 Gold, 2 Gold → 1 Diamond
//   Split:   1 Silver → 2 Bronze, 1 Gold → 2 Silver, 1 Diamond → 2 Gold
//   SplitTo: 1 Diamond → 8 Bronze (multi-level), etc.
//
// Economics: ETH fees per operation → ecosystem (operator/treasury/buyback)
// ============================================================================

import { txEngine, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Diamond'];

// Fusion action IDs: simple keccak256 of string (matches Solidity)
const FUSION_ACTION_IDS = {
    FUSION_BRONZE: null, // lazy-init (needs ethers)
    FUSION_SILVER: null,
    FUSION_GOLD: null,
    SPLIT_SILVER: null,
    SPLIT_GOLD: null,
    SPLIT_DIAMOND: null,
};

function initActionIds() {
    if (FUSION_ACTION_IDS.FUSION_BRONZE) return;
    const ethers = window.ethers;
    FUSION_ACTION_IDS.FUSION_BRONZE = ethers.id("FUSION_BRONZE");
    FUSION_ACTION_IDS.FUSION_SILVER = ethers.id("FUSION_SILVER");
    FUSION_ACTION_IDS.FUSION_GOLD   = ethers.id("FUSION_GOLD");
    FUSION_ACTION_IDS.SPLIT_SILVER  = ethers.id("SPLIT_SILVER");
    FUSION_ACTION_IDS.SPLIT_GOLD    = ethers.id("SPLIT_GOLD");
    FUSION_ACTION_IDS.SPLIT_DIAMOND = ethers.id("SPLIT_DIAMOND");
}

function getFusionActionId(sourceTier) {
    initActionIds();
    if (sourceTier === 0) return FUSION_ACTION_IDS.FUSION_BRONZE;
    if (sourceTier === 1) return FUSION_ACTION_IDS.FUSION_SILVER;
    if (sourceTier === 2) return FUSION_ACTION_IDS.FUSION_GOLD;
    return null;
}

function getSplitActionId(sourceTier) {
    initActionIds();
    if (sourceTier === 1) return FUSION_ACTION_IDS.SPLIT_SILVER;
    if (sourceTier === 2) return FUSION_ACTION_IDS.SPLIT_GOLD;
    if (sourceTier === 3) return FUSION_ACTION_IDS.SPLIT_DIAMOND;
    return null;
}

function getFusionAddress() {
    return addresses?.nftFusion || contractAddresses?.nftFusion || window.contractAddresses?.nftFusion || null;
}

function getNftAddress() {
    return addresses?.rewardBooster || contractAddresses?.rewardBooster || window.contractAddresses?.rewardBooster || null;
}

// ============================================================================
// 2. ABI DEFINITIONS
// ============================================================================

const FUSION_ABI = [
    // Write
    'function fuse(uint256 tokenId1, uint256 tokenId2, address operator) external payable returns (uint256 newTokenId)',
    'function split(uint256 tokenId, address operator) external payable returns (uint256[])',
    'function splitTo(uint256 tokenId, uint8 targetTier, address operator) external payable returns (uint256[])',

    // Read
    'function getFusionFee(uint8 sourceTier) view returns (uint256)',
    'function getSplitFee(uint8 sourceTier) view returns (uint256)',
    'function getMultiSplitFee(uint8 sourceTier, uint8 targetTier) view returns (uint256)',
    'function previewFusion(uint256 tokenId1, uint256 tokenId2) view returns (uint8 sourceTier, uint8 resultTier, uint256 ethFee, bool canFuse)',
    'function previewSplit(uint256 tokenId, uint8 targetTier) view returns (uint8 sourceTier, uint256 mintCount, uint256 ethFee, bool canSplit)',
    'function getStats() view returns (uint256 totalFusions, uint256 totalSplits, uint256 bronzeFusions, uint256 silverFusions, uint256 goldFusions, uint256 silverSplits, uint256 goldSplits, uint256 diamondSplits)',
    'function version() view returns (string)',

    // Events
    'event Fused(address indexed user, uint256 indexed tokenId1, uint256 indexed tokenId2, uint256 newTokenId, uint8 sourceTier, uint8 resultTier, address operator)',
    'event Split(address indexed user, uint256 indexed burnedTokenId, uint8 sourceTier, uint8 targetTier, uint256 mintCount, uint256[] newTokenIds, address operator)',
];

const NFT_APPROVAL_ABI = [
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function tokenTier(uint256 tokenId) view returns (uint8)',
    'function ownerOf(uint256 tokenId) view returns (address)',
];

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================

function getFusionContract(signer) {
    const addr = getFusionAddress();
    if (!addr) throw new Error('NFTFusion contract address not loaded');
    return new window.ethers.Contract(addr, FUSION_ABI, signer);
}

async function getFusionContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    const addr = getFusionAddress();
    if (!addr) throw new Error('NFTFusion contract address not loaded');
    return new window.ethers.Contract(addr, FUSION_ABI, NetworkManager.getProvider());
}

async function getNftContractReadOnly() {
    const { NetworkManager } = await import('../core/index.js');
    const addr = getNftAddress();
    if (!addr) throw new Error('RewardBooster address not loaded');
    return new window.ethers.Contract(addr, NFT_APPROVAL_ABI, NetworkManager.getProvider());
}

// ============================================================================
// 4. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Fuse 2 same-tier NFTs into 1 higher-tier NFT
 * @param {Object} params
 * @param {number|bigint} params.tokenId1 - First NFT to burn
 * @param {number|bigint} params.tokenId2 - Second NFT to burn
 * @param {string} [params.operator] - Operator address
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Callback on success
 * @param {Function} [params.onError] - Callback on error
 */
export async function fuseNfts({
    tokenId1, tokenId2, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const fusionAddr = getFusionAddress();
    const nftAddr = getNftAddress();
    if (!fusionAddr || !nftAddr) throw new Error('Contract addresses not loaded');

    let ethFee = 0n;
    let sourceTier = 0;

    return await txEngine.execute({
        name: 'FuseNFTs', button,
        getContract: async (signer) => getFusionContract(signer),
        method: 'fuse',
        args: () => [BigInt(tokenId1), BigInt(tokenId2), resolveOperator(operator)],
        get value() { return ethFee; },

        // NFT approval (setApprovalForAll for fusion contract)
        get approval() {
            return {
                token: nftAddr,
                spender: fusionAddr,
                isERC721: true,
            };
        },

        validate: async (signer, userAddress) => {
            const nft = await getNftContractReadOnly();

            // Verify ownership
            const [owner1, owner2] = await Promise.all([
                nft.ownerOf(tokenId1),
                nft.ownerOf(tokenId2),
            ]);
            if (owner1.toLowerCase() !== userAddress.toLowerCase()) throw new Error(`You don't own NFT #${tokenId1}`);
            if (owner2.toLowerCase() !== userAddress.toLowerCase()) throw new Error(`You don't own NFT #${tokenId2}`);

            // Verify same tier and not max tier
            const [tier1, tier2] = await Promise.all([
                nft.tokenTier(tokenId1),
                nft.tokenTier(tokenId2),
            ]);
            sourceTier = Number(tier1);
            if (Number(tier2) !== sourceTier) throw new Error(`NFTs must be the same tier (got ${TIER_NAMES[sourceTier]} and ${TIER_NAMES[Number(tier2)]})`);
            if (sourceTier >= 3) throw new Error('Diamond NFTs cannot be fused (already max tier)');

            // Calculate ETH fee client-side (ecosystem.calculateFee returns 0 in eth_call)
            const actionId = getFusionActionId(sourceTier);
            ethFee = await calculateFeeClientSide(actionId);
            console.log(`[FuseNFTs] ${TIER_NAMES[sourceTier]} → ${TIER_NAMES[sourceTier + 1]}, Fee: ${ethers.formatEther(ethFee)} ETH`);

            // Check ETH balance
            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH for fee + gas');
        },

        onSuccess: async (receipt) => {
            let newTokenId = null;
            try {
                const iface = new ethers.Interface(FUSION_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'Fused') { newTokenId = Number(parsed.args.newTokenId); break; }
                    } catch {}
                }
            } catch {}

            console.log(`[FuseNFTs] Success! New ${TIER_NAMES[sourceTier + 1]} NFT #${newTokenId}`);
            if (onSuccess) onSuccess({ receipt, newTokenId, resultTier: sourceTier + 1 });
        },
        onError: (err) => { if (onError) onError(err); }
    });
}

/**
 * Split 1 NFT into 2 of the tier below
 */
export async function splitNft({
    tokenId, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const fusionAddr = getFusionAddress();
    const nftAddr = getNftAddress();
    if (!fusionAddr || !nftAddr) throw new Error('Contract addresses not loaded');

    let ethFee = 0n;
    let sourceTier = 0;

    return await txEngine.execute({
        name: 'SplitNFT', button,
        getContract: async (signer) => getFusionContract(signer),
        method: 'split',
        args: () => [BigInt(tokenId), resolveOperator(operator)],
        get value() { return ethFee; },

        get approval() {
            return {
                token: nftAddr,
                spender: fusionAddr,
                isERC721: true,
            };
        },

        validate: async (signer, userAddress) => {
            const nft = await getNftContractReadOnly();

            const owner = await nft.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error(`You don't own NFT #${tokenId}`);

            const tier = await nft.tokenTier(tokenId);
            sourceTier = Number(tier);
            if (sourceTier === 0) throw new Error('Bronze NFTs cannot be split (already lowest tier)');

            const actionId = getSplitActionId(sourceTier);
            ethFee = await calculateFeeClientSide(actionId);
            console.log(`[SplitNFT] ${TIER_NAMES[sourceTier]} → 2x ${TIER_NAMES[sourceTier - 1]}, Fee: ${ethers.formatEther(ethFee)} ETH`);

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH for fee + gas');
        },

        onSuccess: async (receipt) => {
            let newTokenIds = [];
            try {
                const iface = new ethers.Interface(FUSION_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'Split') {
                            newTokenIds = parsed.args.newTokenIds.map(Number);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            console.log(`[SplitNFT] Success! 2x ${TIER_NAMES[sourceTier - 1]} NFTs: ${newTokenIds.join(', ')}`);
            if (onSuccess) onSuccess({ receipt, newTokenIds, targetTier: sourceTier - 1 });
        },
        onError: (err) => { if (onError) onError(err); }
    });
}

/**
 * Split 1 NFT into 2^N lower-tier NFTs (multi-level)
 */
export async function splitNftTo({
    tokenId, targetTier, operator,
    button = null, onSuccess = null, onError = null
}) {
    const ethers = window.ethers;
    const fusionAddr = getFusionAddress();
    const nftAddr = getNftAddress();
    if (!fusionAddr || !nftAddr) throw new Error('Contract addresses not loaded');

    let ethFee = 0n;
    let sourceTier = 0;

    return await txEngine.execute({
        name: 'SplitNFTTo', button,
        getContract: async (signer) => getFusionContract(signer),
        method: 'splitTo',
        args: () => [BigInt(tokenId), Number(targetTier), resolveOperator(operator)],
        get value() { return ethFee; },

        get approval() {
            return {
                token: nftAddr,
                spender: fusionAddr,
                isERC721: true,
            };
        },

        validate: async (signer, userAddress) => {
            const nft = await getNftContractReadOnly();

            const owner = await nft.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) throw new Error(`You don't own NFT #${tokenId}`);

            const tier = await nft.tokenTier(tokenId);
            sourceTier = Number(tier);
            if (sourceTier === 0) throw new Error('Bronze NFTs cannot be split');
            if (targetTier >= sourceTier) throw new Error('Target tier must be lower than source tier');

            // Sum fees for each level
            ethFee = 0n;
            for (let t = sourceTier; t > targetTier; t--) {
                const actionId = getSplitActionId(t);
                ethFee += await calculateFeeClientSide(actionId);
            }

            const levels = sourceTier - targetTier;
            const mintCount = 1 << levels;
            console.log(`[SplitNFTTo] ${TIER_NAMES[sourceTier]} → ${mintCount}x ${TIER_NAMES[targetTier]}, Fee: ${ethers.formatEther(ethFee)} ETH`);

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethBalance < ethFee + ethers.parseEther('0.001')) throw new Error('Insufficient ETH for fee + gas');
        },

        onSuccess: async (receipt) => {
            let newTokenIds = [];
            try {
                const iface = new ethers.Interface(FUSION_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === 'Split') {
                            newTokenIds = parsed.args.newTokenIds.map(Number);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            console.log(`[SplitNFTTo] Success! ${newTokenIds.length}x ${TIER_NAMES[targetTier]} NFTs`);
            if (onSuccess) onSuccess({ receipt, newTokenIds, targetTier });
        },
        onError: (err) => { if (onError) onError(err); }
    });
}

// ============================================================================
// 5. READ FUNCTIONS
// ============================================================================

/**
 * Get estimated ETH fee for a fusion (client-side calculation)
 */
export async function getEstimatedFusionFee(sourceTier) {
    const actionId = getFusionActionId(Number(sourceTier));
    if (!actionId) return 0n;
    return await calculateFeeClientSide(actionId);
}

/**
 * Get estimated ETH fee for a split (client-side calculation)
 */
export async function getEstimatedSplitFee(sourceTier) {
    const actionId = getSplitActionId(Number(sourceTier));
    if (!actionId) return 0n;
    return await calculateFeeClientSide(actionId);
}

/**
 * Get estimated total fee for a multi-level split
 */
export async function getEstimatedMultiSplitFee(sourceTier, targetTier) {
    let total = 0n;
    for (let t = Number(sourceTier); t > Number(targetTier); t--) {
        const actionId = getSplitActionId(t);
        total += await calculateFeeClientSide(actionId);
    }
    return total;
}

/**
 * Get fusion statistics from the contract
 */
export async function getFusionStats() {
    const contract = await getFusionContractReadOnly();
    const stats = await contract.getStats();
    return {
        totalFusions: Number(stats[0]),
        totalSplits: Number(stats[1]),
        bronzeFusions: Number(stats[2]),
        silverFusions: Number(stats[3]),
        goldFusions: Number(stats[4]),
        silverSplits: Number(stats[5]),
        goldSplits: Number(stats[6]),
        diamondSplits: Number(stats[7]),
    };
}

/**
 * Check if the fusion contract is approved to transfer user's NFTs
 */
export async function isFusionApproved(userAddress) {
    const fusionAddr = getFusionAddress();
    if (!fusionAddr) return false;
    const nft = await getNftContractReadOnly();
    return await nft.isApprovedForAll(userAddress, fusionAddr);
}

// ============================================================================
// 6. NAMESPACE OBJECT
// ============================================================================

export const FusionTx = {
    fuseNfts,
    splitNft,
    splitNftTo,
    getEstimatedFusionFee,
    getEstimatedSplitFee,
    getEstimatedMultiSplitFee,
    getFusionStats,
    isFusionApproved,
    TIER_NAMES,
};
