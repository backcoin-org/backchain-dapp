import { ethers } from 'ethers';
import type { NetworkId, NetworkConfig } from './types/index.js';
export declare function getNetworkConfig(network: NetworkId): NetworkConfig;
export declare class ProviderManager {
    readonly network: NetworkId;
    readonly networkConfig: NetworkConfig;
    readonly reader: ethers.JsonRpcProvider;
    private _signer;
    private _address;
    private _browserProvider;
    constructor(network: NetworkId, rpcUrl?: string);
    /** Current connected signer (null if not connected) */
    get signer(): ethers.Signer | null;
    /** Current connected wallet address (null if not connected) */
    get address(): string | null;
    /** Whether a wallet is currently connected */
    get isConnected(): boolean;
    /**
     * Connect to an injected wallet (MetaMask, etc.).
     * Requests account access and validates the network.
     */
    connect(): Promise<string>;
    /**
     * Connect with an external signer (e.g., from a private key or WalletConnect).
     * For server-side or custom wallet integrations.
     */
    connectWithSigner(signer: ethers.Signer): Promise<string>;
    /** Disconnect the current wallet */
    disconnect(): void;
    /**
     * Get a read-only contract instance (uses Alchemy/public RPC).
     * Safe to call without wallet connection.
     */
    getReadContract(address: string, abi: string[]): ethers.Contract;
    /**
     * Get a write contract instance (uses wallet signer).
     * Throws if wallet is not connected.
     */
    getWriteContract(address: string, abi: string[]): ethers.Contract;
    /** Get current gas price from the read provider */
    getGasPrice(): Promise<bigint>;
    /** Get the explorer URL for a transaction */
    getTxUrl(txHash: string): string;
    /** Get the explorer URL for an address */
    getAddressUrl(address: string): string;
    private _switchNetwork;
}
//# sourceMappingURL=provider.d.ts.map