// @backchain/sdk — Client-Side Fee Calculator
// ============================================================================
// Solidity's tx.gasprice returns 0 in view calls (eth_call), so on-chain
// calculateFee() always returns 0. This module reads the fee config from the
// contract and computes the fee in JavaScript.
import { ethers } from 'ethers';
import { ECOSYSTEM_ABI } from './contracts/abis.js';
const BPS = 10000n;
/**
 * Calculate the ETH fee for a protocol action (client-side).
 *
 * @param provider - The SDK's ProviderManager
 * @param ecosystemAddress - BackchainEcosystem contract address
 * @param actionId - keccak256 action identifier (e.g., ethers.id("NOTARY_CERTIFY"))
 * @param txValue - Transaction value in wei (for value-based fees)
 * @returns Fee amount in wei
 */
export async function calculateFee(provider, ecosystemAddress, actionId, txValue = 0n) {
    const contract = provider.getReadContract(ecosystemAddress, ECOSYSTEM_ABI);
    // Read fee config from contract
    const config = await contract.getFeeConfig(actionId);
    const feeType = Number(config[0]);
    const bps = BigInt(config[1]);
    const multiplier = BigInt(config[2]);
    const gasEstimate = BigInt(config[3]);
    if (bps === 0n)
        return 0n;
    if (feeType === 0) {
        // Gas-based: fee = gasEstimate × gasPrice × bps × multiplier / BPS
        // 150% gasPrice buffer for Arbitrum L1 data cost
        const gasPrice = await provider.getGasPrice();
        const bufferedGasPrice = (gasPrice * 150n) / 100n;
        return (gasEstimate * bufferedGasPrice * bps * multiplier) / BPS;
    }
    else {
        // Value-based: fee = txValue × bps / BPS
        return (txValue * bps) / BPS;
    }
}
// ── Common Action ID Helpers ────────────────────────────────────────────────
/** Simple action ID: keccak256 of the action name string */
export function actionId(name) {
    return ethers.id(name);
}
/** NFT pool action ID: keccak256(abi.encode("NFT_BUY_T"|"NFT_SELL_T", tier)) */
export function nftActionId(prefix, tier) {
    return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['string', 'uint8'], [prefix, tier]));
}
/** Notary certify action ID: keccak256(abi.encode("NOTARY_CERTIFY_T", docType)) */
export function notaryActionId(docType) {
    return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['string', 'uint8'], ['NOTARY_CERTIFY_T', docType]));
}
// Pre-computed common action IDs
export const ACTION_IDS = {
    // Staking
    STAKING_DELEGATE: ethers.id('STAKING_DELEGATE'),
    STAKING_CLAIM: ethers.id('STAKING_CLAIM'),
    STAKING_FORCE_UNSTAKE: ethers.id('STAKING_FORCE_UNSTAKE'),
    // Fortune
    FORTUNE_TIER0: ethers.id('FORTUNE_TIER0'),
    FORTUNE_TIER1: ethers.id('FORTUNE_TIER1'),
    FORTUNE_TIER2: ethers.id('FORTUNE_TIER2'),
    // Agora
    AGORA_LIKE: ethers.id('AGORA_LIKE'),
    AGORA_FOLLOW: ethers.id('AGORA_FOLLOW'),
    AGORA_POST_IMAGE: ethers.id('AGORA_POST_IMAGE'),
    AGORA_POST_VIDEO: ethers.id('AGORA_POST_VIDEO'),
    AGORA_LIVE: ethers.id('AGORA_LIVE'),
    AGORA_REPLY: ethers.id('AGORA_REPLY'),
    AGORA_DOWNVOTE: ethers.id('AGORA_DOWNVOTE'),
    AGORA_PROFILE_BOOST: ethers.id('AGORA_PROFILE_BOOST'),
    AGORA_BOOST_STD: ethers.id('AGORA_BOOST_STD'),
    AGORA_BOOST_FEAT: ethers.id('AGORA_BOOST_FEAT'),
    AGORA_BADGE_VERIFIED: ethers.id('AGORA_BADGE_VERIFIED'),
    AGORA_BADGE_PREMIUM: ethers.id('AGORA_BADGE_PREMIUM'),
    AGORA_BADGE_ELITE: ethers.id('AGORA_BADGE_ELITE'),
    AGORA_REPORT: ethers.id('AGORA_REPORT'),
    // Notary
    NOTARY_BOOST: ethers.id('NOTARY_BOOST'),
    NOTARY_TRANSFER: ethers.id('NOTARY_TRANSFER'),
    // Rental
    RENTAL_RENT: ethers.id('RENTAL_RENT'),
    RENTAL_BOOST: ethers.id('RENTAL_BOOST'),
    // Charity
    CHARITY_CREATE: ethers.id('CHARITY_CREATE'),
    CHARITY_BOOST: ethers.id('CHARITY_BOOST'),
    // Fusion
    FUSION_BRONZE: ethers.id('FUSION_BRONZE'),
    FUSION_SILVER: ethers.id('FUSION_SILVER'),
    FUSION_GOLD: ethers.id('FUSION_GOLD'),
    SPLIT_SILVER: ethers.id('SPLIT_SILVER'),
    SPLIT_GOLD: ethers.id('SPLIT_GOLD'),
    SPLIT_DIAMOND: ethers.id('SPLIT_DIAMOND'),
};
//# sourceMappingURL=fees.js.map