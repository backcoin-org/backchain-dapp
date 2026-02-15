// @backchain/faucet — Testnet Token Distribution
// ============================================================================
import { FAUCET_ABI } from '@backchain/core';
export class FaucetModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async claim() {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        const tx = await contract.claim();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async canClaim(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        return c.canClaim(addr);
    }
    async getUserInfo(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        const r = await c.getUserInfo(addr);
        return { lastClaim: r[0], claims: r[1], eligible: r[2], cooldownLeft: r[3] };
    }
    async getStatus() {
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
        return { tokens: s[0], eth: s[1], claims: s[2], users: s[3] };
    }
    async isPaused() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.simpleBkcFaucet, FAUCET_ABI);
        return c.paused();
    }
}
//# sourceMappingURL=index.js.map