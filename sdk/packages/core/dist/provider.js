// @backchain/sdk — Dual Provider System
// ============================================================================
// MetaMask (or any injected wallet) for signing, Alchemy/public RPC for reads.
// This prevents MetaMask rate-limiting (-32002 errors) and allows background
// reads without triggering wallet popups.
import { ethers } from 'ethers';
// ── Network Configs ─────────────────────────────────────────────────────────
const NETWORKS = {
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
export function getNetworkConfig(network) {
    return NETWORKS[network];
}
// ── Provider Manager ────────────────────────────────────────────────────────
export class ProviderManager {
    network;
    networkConfig;
    reader;
    _signer = null;
    _address = null;
    _browserProvider = null;
    constructor(network, rpcUrl) {
        this.network = network;
        this.networkConfig = NETWORKS[network];
        this.reader = new ethers.JsonRpcProvider(rpcUrl || this.networkConfig.rpcUrl);
    }
    /** Current connected signer (null if not connected) */
    get signer() {
        return this._signer;
    }
    /** Current connected wallet address (null if not connected) */
    get address() {
        return this._address;
    }
    /** Whether a wallet is currently connected */
    get isConnected() {
        return this._signer !== null && this._address !== null;
    }
    /**
     * Connect to an injected wallet (MetaMask, etc.).
     * Requests account access and validates the network.
     */
    async connect() {
        const ethereum = globalThis.ethereum;
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
    async connectWithSigner(signer) {
        this._signer = signer;
        this._address = await signer.getAddress();
        return this._address;
    }
    /** Disconnect the current wallet */
    disconnect() {
        this._signer = null;
        this._address = null;
        this._browserProvider = null;
    }
    /**
     * Get a read-only contract instance (uses Alchemy/public RPC).
     * Safe to call without wallet connection.
     */
    getReadContract(address, abi) {
        return new ethers.Contract(address, abi, this.reader);
    }
    /**
     * Get a write contract instance (uses wallet signer).
     * Throws if wallet is not connected.
     */
    getWriteContract(address, abi) {
        if (!this._signer) {
            throw new Error('Wallet not connected. Call connect() first.');
        }
        return new ethers.Contract(address, abi, this._signer);
    }
    /** Get current gas price from the read provider */
    async getGasPrice() {
        const feeData = await this.reader.getFeeData();
        return feeData.gasPrice || 0n;
    }
    /** Get the explorer URL for a transaction */
    getTxUrl(txHash) {
        return `${this.networkConfig.explorerUrl}/tx/${txHash}`;
    }
    /** Get the explorer URL for an address */
    getAddressUrl(address) {
        return `${this.networkConfig.explorerUrl}/address/${address}`;
    }
    // ── Private ─────────────────────────────────────────────────────────────
    async _switchNetwork(ethereum) {
        const chainIdHex = '0x' + this.networkConfig.chainId.toString(16);
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
        }
        catch (err) {
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
            }
            else {
                throw err;
            }
        }
    }
}
//# sourceMappingURL=provider.js.map