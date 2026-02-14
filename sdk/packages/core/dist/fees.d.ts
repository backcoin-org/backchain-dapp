import type { ProviderManager } from './provider.js';
export interface FeeConfig {
    feeType: number;
    bps: bigint;
    multiplier: bigint;
    gasEstimate: bigint;
}
/**
 * Calculate the ETH fee for a protocol action (client-side).
 *
 * @param provider - The SDK's ProviderManager
 * @param ecosystemAddress - BackchainEcosystem contract address
 * @param actionId - keccak256 action identifier (e.g., ethers.id("NOTARY_CERTIFY"))
 * @param txValue - Transaction value in wei (for value-based fees)
 * @returns Fee amount in wei
 */
export declare function calculateFee(provider: ProviderManager, ecosystemAddress: string, actionId: string, txValue?: bigint): Promise<bigint>;
/** Simple action ID: keccak256 of the action name string */
export declare function actionId(name: string): string;
/** NFT pool action ID: keccak256(abi.encode("NFT_BUY_T"|"NFT_SELL_T", tier)) */
export declare function nftActionId(prefix: string, tier: number): string;
/** Notary certify action ID: keccak256(abi.encode("NOTARY_CERTIFY_T", docType)) */
export declare function notaryActionId(docType: number): string;
export declare const ACTION_IDS: {
    readonly STAKING_DELEGATE: string;
    readonly STAKING_CLAIM: string;
    readonly STAKING_FORCE_UNSTAKE: string;
    readonly FORTUNE_TIER0: string;
    readonly FORTUNE_TIER1: string;
    readonly FORTUNE_TIER2: string;
    readonly AGORA_LIKE: string;
    readonly AGORA_FOLLOW: string;
    readonly AGORA_POST_IMAGE: string;
    readonly AGORA_POST_VIDEO: string;
    readonly AGORA_LIVE: string;
    readonly AGORA_REPLY: string;
    readonly AGORA_DOWNVOTE: string;
    readonly AGORA_PROFILE_BOOST: string;
    readonly AGORA_BOOST_STD: string;
    readonly AGORA_BOOST_FEAT: string;
    readonly AGORA_BADGE_VERIFIED: string;
    readonly AGORA_BADGE_PREMIUM: string;
    readonly AGORA_BADGE_ELITE: string;
    readonly AGORA_REPORT: string;
    readonly NOTARY_BOOST: string;
    readonly NOTARY_TRANSFER: string;
    readonly RENTAL_RENT: string;
    readonly RENTAL_BOOST: string;
    readonly CHARITY_CREATE: string;
    readonly CHARITY_BOOST: string;
    readonly FUSION_BRONZE: string;
    readonly FUSION_SILVER: string;
    readonly FUSION_GOLD: string;
    readonly SPLIT_SILVER: string;
    readonly SPLIT_GOLD: string;
    readonly SPLIT_DIAMOND: string;
};
//# sourceMappingURL=fees.d.ts.map