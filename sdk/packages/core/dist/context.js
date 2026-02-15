// @backchain/core — BackchainContext
// ============================================================================
// The decoupling layer that allows modules to work independently.
// Modules depend on this interface, NOT on the full Backchain class.
//
// Usage:
//   import { createContext } from '@backchain/core';
//   import { StakingModule } from '@backchain/staking';
//
//   const ctx = createContext({ operator: '0x...' });
//   await ctx.connect();
//   const staking = new StakingModule(ctx);
//   await staking.delegate(amount, 365);
import { ethers } from 'ethers';
import { ProviderManager } from './provider.js';
import { getAddresses } from './contracts/addresses.js';
import { BKC_TOKEN_ABI } from './contracts/abis.js';
import { calculateFee as calcFee } from './fees.js';
// ── Factory ──────────────────────────────────────────────────────────────────
/**
 * Create a lightweight BackchainContext without the full SDK.
 * Use this when you only need one or two modules.
 *
 * @example
 * ```ts
 * const ctx = createContext({ operator: '0x...' });
 * await ctx.connect();
 * const staking = new StakingModule(ctx);
 * ```
 */
export function createContext(config) {
    if (!config.operator || !ethers.isAddress(config.operator)) {
        throw new Error(`Invalid operator address: ${config.operator}`);
    }
    const operator = ethers.getAddress(config.operator);
    const network = config.network || 'arbitrum-sepolia';
    const defaults = getAddresses(network);
    const addresses = { ...defaults, ...config.addresses };
    const provider = new ProviderManager(network, config.rpcUrl);
    return {
        operator,
        network,
        provider,
        addresses,
        get isConnected() { return provider.isConnected; },
        get address() { return provider.address; },
        connect: () => provider.connect(),
        connectWithSigner: (signer) => provider.connectWithSigner(signer),
        disconnect: () => provider.disconnect(),
        async calculateFee(actionId, txValue = 0n) {
            return calcFee(provider, addresses.backchainEcosystem, actionId, txValue);
        },
        async getBkcAllowance(spender, owner) {
            const addr = owner || provider.address;
            if (!addr)
                throw new Error('No address provided and wallet not connected.');
            const token = provider.getReadContract(addresses.bkcToken, BKC_TOKEN_ABI);
            return token.allowance(addr, spender);
        },
        async approveBkc(spender, amount) {
            const token = provider.getWriteContract(addresses.bkcToken, BKC_TOKEN_ABI);
            const tx = await token.approve(spender, amount);
            const receipt = await tx.wait(1);
            return {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed,
                events: {},
            };
        },
    };
}
//# sourceMappingURL=context.js.map