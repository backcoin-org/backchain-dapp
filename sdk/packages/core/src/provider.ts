// @backchain/sdk — Dual Provider System
// ============================================================================
// MetaMask (or any injected wallet) for signing, Alchemy/public RPC for reads.
// This prevents MetaMask rate-limiting (-32002 errors) and allows background
// reads without triggering wallet popups.

import { ethers } from 'ethers';
import type { NetworkId, NetworkConfig } from './types/index.js';

// ── Network Configs ─────────────────────────────────────────────────────────

const NETWORKS: Record<NetworkId, NetworkConfig> = {
    'sepolia': {
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        explorerUrl: 'https://sepolia.etherscan.io',
    },
    'opbnb-testnet': {
        chainId: 5611,
        name: 'opBNB Testnet',
        rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org',
        explorerUrl: 'https://testnet.opbnbscan.com',
    },
    'opbnb-mainnet': {
        chainId: 204,
        name: 'opBNB Mainnet',
        rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
        explorerUrl: 'https://opbnbscan.com',
    },
};

export function getNetworkConfig(network: NetworkId): NetworkConfig {
    return NETWORKS[network];
}

// ── Provider Manager ────────────────────────────────────────────────────────

export class ProviderManager {
    readonly network: NetworkId;
    readonly networkConfig: NetworkConfig;
    readonly reader: ethers.JsonRpcProvider;
    private _signer: ethers.Signer | null = null;
    private _address: string | null = null;
    private _browserProvider: ethers.BrowserProvider | null = null;

    constructor(network: NetworkId, rpcUrl?: string) {
        this.network = network;
        this.networkConfig = NETWORKS[network];
        this.reader = new ethers.JsonRpcProvider(rpcUrl || this.networkConfig.rpcUrl);
    }

    /** Current connected signer (null if not connected) */
    get signer(): ethers.Signer | null {
        return this._signer;
    }

    /** Current connected wallet address (null if not connected) */
    get address(): string | null {
        return this._address;
    }

    /** Whether a wallet is currently connected */
    get isConnected(): boolean {
        return this._signer !== null && this._address !== null;
    }

    /**
     * Connect to an injected wallet (MetaMask, etc.).
     * Requests account access and validates the network.
     */
    async connect(): Promise<string> {
        const ethereum = (globalThis as any).ethereum;
        if (!ethereum) {
            throw new Error('No wallet detected. Install MetaMask or another Web3 wallet.');
        }

        this._browserProvider = new ethers.BrowserProvider(ethereum);

        // Request accounts
        await this._browserProvider.send('eth_requestAccounts', []);

        // Validate chain
        const network = await this._browserProvider.getNetwork();
        if (Number(network.chainId) !== this.networkConfig.chainId) {
            await this._switchNetwork(ethereum);
        }

        this._signer = await this._browserProvider.getSigner();
        this._address = await this._signer.getAddress();

        return this._address;
    }

    /**
     * Connect with an external signer (e.g., from a private key or WalletConnect).
     * For server-side or custom wallet integrations.
     */
    async connectWithSigner(signer: ethers.Signer): Promise<string> {
        this._signer = signer;
        this._address = await signer.getAddress();
        return this._address;
    }

    /** Disconnect the current wallet */
    disconnect(): void {
        this._signer = null;
        this._address = null;
        this._browserProvider = null;
    }

    /**
     * Get a read-only contract instance (uses Alchemy/public RPC).
     * Safe to call without wallet connection.
     */
    getReadContract(address: string, abi: string[]): ethers.Contract {
        return new ethers.Contract(address, abi, this.reader);
    }

    /**
     * Get a write contract instance (uses wallet signer).
     * Throws if wallet is not connected.
     */
    getWriteContract(address: string, abi: string[]): ethers.Contract {
        if (!this._signer) {
            throw new Error('Wallet not connected. Call connect() first.');
        }
        return new ethers.Contract(address, abi, this._signer);
    }

    /** Get current gas price from the read provider */
    async getGasPrice(): Promise<bigint> {
        const feeData = await this.reader.getFeeData();
        return feeData.gasPrice || 0n;
    }

    /** Get the explorer URL for a transaction */
    getTxUrl(txHash: string): string {
        return `${this.networkConfig.explorerUrl}/tx/${txHash}`;
    }

    /** Get the explorer URL for an address */
    getAddressUrl(address: string): string {
        return `${this.networkConfig.explorerUrl}/address/${address}`;
    }

    // ── Private ─────────────────────────────────────────────────────────────

    private async _switchNetwork(ethereum: any): Promise<void> {
        const chainIdHex = '0x' + this.networkConfig.chainId.toString(16);

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
        } catch (err: any) {
            // Chain not added yet — add it
            if (err.code === 4902) {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: chainIdHex,
                        chainName: this.networkConfig.name,
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: [this.networkConfig.rpcUrl],
                        blockExplorerUrls: [this.networkConfig.explorerUrl],
                    }],
                });
            } else {
                throw err;
            }
        }
    }
}
