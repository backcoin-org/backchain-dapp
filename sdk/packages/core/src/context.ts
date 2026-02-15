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
import { BKC_TOKEN_ABI, ECOSYSTEM_ABI } from './contracts/abis.js';
import { calculateFee as calcFee } from './fees.js';
import type { BackchainConfig, ContractAddresses, NetworkId, TxResult } from './types/index.js';

// ── Interface ────────────────────────────────────────────────────────────────

/**
 * BackchainContext is the interface that all modules depend on.
 * It provides wallet connection, operator injection, fee calculation,
 * and BKC token helpers. Both the full Backchain class and the lightweight
 * createContext() factory implement this interface.
 */
export interface BackchainContext {
    /** Operator wallet address (earns 10-20% of ETH fees) */
    readonly operator: string;
    /** Network identifier */
    readonly network: NetworkId;
    /** Provider manager (dual: reader for reads, signer for writes) */
    readonly provider: ProviderManager;
    /** Deployed contract addresses */
    readonly addresses: ContractAddresses;

    /** Whether a wallet is connected */
    readonly isConnected: boolean;
    /** Connected wallet address (null if not connected) */
    readonly address: string | null;

    /** Connect to injected wallet (MetaMask, etc.) */
    connect(): Promise<string>;
    /** Connect with a custom signer (private key, WalletConnect, server-side) */
    connectWithSigner(signer: ethers.Signer): Promise<string>;
    /** Disconnect wallet */
    disconnect(): void;

    /** Calculate ETH fee for a protocol action */
    calculateFee(actionId: string, txValue?: bigint): Promise<bigint>;
    /** Check BKC allowance for a spender */
    getBkcAllowance(spender: string, owner?: string): Promise<bigint>;
    /** Approve BKC spending for a contract */
    approveBkc(spender: string, amount: bigint): Promise<TxResult>;
}

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
export function createContext(config: BackchainConfig): BackchainContext {
    if (!config.operator || !ethers.isAddress(config.operator)) {
        throw new Error(`Invalid operator address: ${config.operator}`);
    }

    const operator = ethers.getAddress(config.operator);
    const network: NetworkId = config.network || 'arbitrum-sepolia';
    const defaults = getAddresses(network);
    const addresses: ContractAddresses = { ...defaults, ...config.addresses };
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

        async calculateFee(actionId: string, txValue: bigint = 0n): Promise<bigint> {
            return calcFee(provider, addresses.backchainEcosystem, actionId, txValue);
        },

        async getBkcAllowance(spender: string, owner?: string): Promise<bigint> {
            const addr = owner || provider.address;
            if (!addr) throw new Error('No address provided and wallet not connected.');
            const token = provider.getReadContract(addresses.bkcToken, BKC_TOKEN_ABI);
            return token.allowance(addr, spender);
        },

        async approveBkc(spender: string, amount: bigint): Promise<TxResult> {
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
