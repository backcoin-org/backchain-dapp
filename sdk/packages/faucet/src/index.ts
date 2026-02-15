// @backchain/faucet — Testnet Token Distribution
// ============================================================================

import { FAUCET_ABI } from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { TxResult, FaucetStatus, UserFaucetInfo } from '@backchain/core';

export class FaucetModule {
    constructor(private ctx: BackchainContext) {}

    async claim(): Promise<TxResult> {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        const tx = await contract.claim();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async canClaim(address?: string): Promise<boolean> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        return c.canClaim(addr);
    }

    async getUserInfo(address?: string): Promise<UserFaucetInfo> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        const r = await c.getUserInfo(addr);
        return { lastClaim: r[0], claims: r[1], eligible: r[2], cooldownLeft: r[3] };
    }

    async getStatus(): Promise<FaucetStatus> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        const s = await c.getFaucetStatus();
        return {
            ethBalance: s[0], tokenBalance: s[1], ethPerDrip: s[2],
            tokensPerDrip: s[3], estimatedEthClaims: s[4], estimatedTokenClaims: s[5],
        };
    }

    async getStats() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        const s = await c.getStats();
        return { tokens: s[0] as bigint, eth: s[1] as bigint, claims: s[2] as bigint, users: s[3] as bigint };
    }

    async isPaused(): Promise<boolean> {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        return c.paused();
    }
}
