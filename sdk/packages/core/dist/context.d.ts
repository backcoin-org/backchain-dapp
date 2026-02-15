import { ethers } from 'ethers';
import { ProviderManager } from './provider.js';
import type { BackchainConfig, ContractAddresses, NetworkId, TxResult } from './types/index.js';
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
export declare function createContext(config: BackchainConfig): BackchainContext;
//# sourceMappingURL=context.d.ts.map