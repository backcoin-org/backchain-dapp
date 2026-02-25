// @backchain/faucet — Testnet BNB Distribution
// ============================================================================

import { FAUCET_ABI } from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { TxResult, FaucetStatus, UserFaucetInfo } from '@backchain/core';

export class FaucetModule {
    constructor(private ctx: BackchainContext) {}

    private get faucetAddress(): string {
        const addr = this.ctx.addresses.simpleBkcFaucet;
        if (!addr) throw new Error('Faucet contract address not configured for this network.');
        return addr;
    }

    async claim(): Promise<TxResult> {
        const contract = this.ctx.provider.getWriteContract(this.faucetAddress, FAUCET_ABI);
        const tx = await contract.claim();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async canClaim(address?: string): Promise<boolean> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        const c = this.ctx.provider.getReadContract(this.faucetAddress, FAUCET_ABI);
        return c.canClaim(addr);
    }

    async getUserInfo(address?: string): Promise<UserFaucetInfo> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        const c = this.ctx.provider.getReadContract(this.faucetAddress, FAUCET_ABI);
        const r = await c.getUserInfo(addr);
        return { lastClaim: r[0], claims: r[1], eligible: r[2], cooldownLeft: r[3] };
    }

    async getStatus(): Promise<FaucetStatus> {
        const c = this.ctx.provider.getReadContract(this.faucetAddress, FAUCET_ABI);
        const s = await c.getFaucetStatus();
        return { ethBalance: s[0], ethPerDrip: s[1], estimatedClaims: s[2] };
    }

    async getStats() {
        const c = this.ctx.provider.getReadContract(this.faucetAddress, FAUCET_ABI);
        const s = await c.getStats();
        return { eth: s[0] as bigint, claims: s[1] as bigint, users: s[2] as bigint };
    }

    async isPaused(): Promise<boolean> {
        const c = this.ctx.provider.getReadContract(this.faucetAddress, FAUCET_ABI);
        return c.paused();
    }
}
