// @backchain/sdk — Faucet Module (Testnet ETH Distribution)
// ============================================================================
import { FAUCET_ABI } from '../contracts/abis.js';
export class FaucetModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Write ───────────────────────────────────────────────────────────────
    /** Claim testnet ETH from the faucet (user pays gas) */
    async claim() {
        const addr = this.sdk.addresses.simpleBkcFaucet;
        if (!addr)
            throw new Error('Faucet not deployed on this network.');
        const contract = this.sdk.provider.getWriteContract(addr, FAUCET_ABI);
        const tx = await contract.claim();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Read ────────────────────────────────────────────────────────────────
    /** Check if an address can claim */
    async canClaim(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const faucetAddr = this.sdk.addresses.simpleBkcFaucet;
        if (!faucetAddr)
            throw new Error('Faucet not deployed on this network.');
        const c = this.sdk.provider.getReadContract(faucetAddr, FAUCET_ABI);
        return c.canClaim(addr);
    }
    /** Get user faucet info (last claim, count, eligibility, cooldown) */
    async getUserInfo(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const faucetAddr = this.sdk.addresses.simpleBkcFaucet;
        if (!faucetAddr)
            throw new Error('Faucet not deployed on this network.');
        const c = this.sdk.provider.getReadContract(faucetAddr, FAUCET_ABI);
        const r = await c.getUserInfo(addr);
        return { lastClaim: r[0], claims: r[1], eligible: r[2], cooldownLeft: r[3] };
    }
    /** Get faucet status (ETH balance, drip amount, estimated claims remaining) */
    async getStatus() {
        const faucetAddr = this.sdk.addresses.simpleBkcFaucet;
        if (!faucetAddr)
            throw new Error('Faucet not deployed on this network.');
        const c = this.sdk.provider.getReadContract(faucetAddr, FAUCET_ABI);
        const s = await c.getFaucetStatus();
        return { ethBalance: s[0], ethPerDrip: s[1], estimatedClaims: s[2] };
    }
    /** Get faucet statistics */
    async getStats() {
        const faucetAddr = this.sdk.addresses.simpleBkcFaucet;
        if (!faucetAddr)
            throw new Error('Faucet not deployed on this network.');
        const c = this.sdk.provider.getReadContract(faucetAddr, FAUCET_ABI);
        const s = await c.getStats();
        return { eth: s[0], claims: s[1], users: s[2] };
    }
    /** Check if faucet is paused */
    async isPaused() {
        const faucetAddr = this.sdk.addresses.simpleBkcFaucet;
        if (!faucetAddr)
            throw new Error('Faucet not deployed on this network.');
        const c = this.sdk.provider.getReadContract(faucetAddr, FAUCET_ABI);
        return c.paused();
    }
}
//# sourceMappingURL=faucet.js.map