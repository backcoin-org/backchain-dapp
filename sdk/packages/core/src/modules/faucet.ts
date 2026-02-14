// @backchain/sdk — Faucet Module (Testnet Token Distribution)
// ============================================================================

import { FAUCET_ABI } from '../contracts/abis.js';
import type { Backchain } from '../backchain.js';
import type { TxResult, FaucetStatus, UserFaucetInfo } from '../types/index.js';

export class FaucetModule {
    constructor(private sdk: Backchain) {}

    // ── Write ───────────────────────────────────────────────────────────────

    /**
     * Claim testnet BKC + ETH from the faucet (direct on-chain call).
     * Note: The official faucet uses a server-side relayer. This is the
     * direct contract call (user pays gas).
     */
    async claim(): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.simpleBkcFaucet, FAUCET_ABI);
        const tx = await contract.claim();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    /** Check if an address can claim */
    async canClaim(address?: string): Promise<boolean> {
        const addr = address || this.sdk.provider.address;
        if (!addr) throw new Error('No address');
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.simpleBkcFaucet, FAUCET_ABI);
        return c.canClaim(addr);
    }

    /** Get user faucet info (last claim, count, eligibility, cooldown) */
    async getUserInfo(address?: string): Promise<UserFaucetInfo> {
        const addr = address || this.sdk.provider.address;
        if (!addr) throw new Error('No address');
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.simpleBkcFaucet, FAUCET_ABI);
        const r = await c.getUserInfo(addr);
        return { lastClaim: r[0], claims: r[1], eligible: r[2], cooldownLeft: r[3] };
    }

    /** Get faucet status (balances, drip amounts, estimated claims remaining) */
    async getStatus(): Promise<FaucetStatus> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.simpleBkcFaucet, FAUCET_ABI);
        const s = await c.getFaucetStatus();
        return {
            ethBalance: s[0], tokenBalance: s[1], ethPerDrip: s[2],
            tokensPerDrip: s[3], estimatedEthClaims: s[4], estimatedTokenClaims: s[5],
        };
    }

    /** Get faucet statistics */
    async getStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.simpleBkcFaucet, FAUCET_ABI);
        const s = await c.getStats();
        return { tokens: s[0] as bigint, eth: s[1] as bigint, claims: s[2] as bigint, users: s[3] as bigint };
    }

    /** Check if faucet is paused */
    async isPaused(): Promise<boolean> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.simpleBkcFaucet, FAUCET_ABI);
        return c.paused();
    }
}
