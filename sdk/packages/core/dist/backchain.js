// @backchain/sdk — Main Entry Point
// ============================================================================
// The Backchain class is the single entry point for the SDK.
// It manages wallet connection, operator injection, and provides
// typed access to all protocol modules.
import { ethers } from 'ethers';
import { ProviderManager } from './provider.js';
import { getAddresses } from './contracts/addresses.js';
import { BKC_TOKEN_ABI, ECOSYSTEM_ABI } from './contracts/abis.js';
import { calculateFee } from './fees.js';
import { StakingModule } from './modules/staking.js';
import { NftModule } from './modules/nft.js';
import { FortuneModule } from './modules/fortune.js';
import { NotaryModule } from './modules/notary.js';
import { AgoraModule } from './modules/agora.js';
import { CharityModule } from './modules/charity.js';
import { RentalModule } from './modules/rental.js';
import { SwapModule } from './modules/swap.js';
import { FaucetModule } from './modules/faucet.js';
import { FusionModule } from './modules/fusion.js';
import { BuybackModule } from './modules/buyback.js';
export class Backchain {
    operator;
    network;
    provider;
    addresses;
    // ── Modules ─────────────────────────────────────────────────────────────
    staking;
    nft;
    fortune;
    notary;
    agora;
    charity;
    rental;
    swap;
    faucet;
    fusion;
    buyback;
    constructor(config) {
        if (!config.operator || !ethers.isAddress(config.operator)) {
            throw new Error(`Invalid operator address: ${config.operator}. Must be a valid Ethereum address.`);
        }
        this.operator = ethers.getAddress(config.operator); // checksummed
        this.network = config.network || 'arbitrum-sepolia';
        // Merge addresses (user overrides take precedence)
        const defaults = getAddresses(this.network);
        this.addresses = { ...defaults, ...config.addresses };
        // Create provider
        this.provider = new ProviderManager(this.network, config.rpcUrl);
        // Initialize modules
        this.staking = new StakingModule(this);
        this.nft = new NftModule(this);
        this.fortune = new FortuneModule(this);
        this.notary = new NotaryModule(this);
        this.agora = new AgoraModule(this);
        this.charity = new CharityModule(this);
        this.rental = new RentalModule(this);
        this.swap = new SwapModule(this);
        this.faucet = new FaucetModule(this);
        this.fusion = new FusionModule(this);
        this.buyback = new BuybackModule(this);
    }
    // ── Wallet ──────────────────────────────────────────────────────────────
    /** Connect to MetaMask or injected wallet */
    async connect() {
        return this.provider.connect();
    }
    /** Connect with a custom signer (e.g., private key, WalletConnect) */
    async connectWithSigner(signer) {
        return this.provider.connectWithSigner(signer);
    }
    /** Disconnect wallet */
    disconnect() {
        this.provider.disconnect();
    }
    /** Whether a wallet is connected */
    get isConnected() {
        return this.provider.isConnected;
    }
    /** Connected wallet address (null if not connected) */
    get address() {
        return this.provider.address;
    }
    // ── Token Helpers ───────────────────────────────────────────────────────
    /** Get BKC balance of an address (or connected wallet) */
    async getBkcBalance(address) {
        const addr = address || this.provider.address;
        if (!addr)
            throw new Error('No address provided and wallet not connected.');
        const token = this.provider.getReadContract(this.addresses.bkcToken, BKC_TOKEN_ABI);
        return token.balanceOf(addr);
    }
    /** Get ETH balance of an address (or connected wallet) */
    async getEthBalance(address) {
        const addr = address || this.provider.address;
        if (!addr)
            throw new Error('No address provided and wallet not connected.');
        return this.provider.reader.getBalance(addr);
    }
    /** Approve BKC spending for a contract */
    async approveBkc(spender, amount) {
        const token = this.provider.getWriteContract(this.addresses.bkcToken, BKC_TOKEN_ABI);
        const tx = await token.approve(spender, amount);
        const receipt = await tx.wait(1);
        return {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            events: {},
        };
    }
    /** Check BKC allowance for a spender */
    async getBkcAllowance(spender, owner) {
        const addr = owner || this.provider.address;
        if (!addr)
            throw new Error('No address provided and wallet not connected.');
        const token = this.provider.getReadContract(this.addresses.bkcToken, BKC_TOKEN_ABI);
        return token.allowance(addr, spender);
    }
    // ── Ecosystem ───────────────────────────────────────────────────────────
    /** Get the tutor (referrer) of an address */
    async getTutor(address) {
        const addr = address || this.provider.address;
        if (!addr)
            throw new Error('No address provided and wallet not connected.');
        const eco = this.provider.getReadContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        return eco.tutorOf(addr);
    }
    /** Get pending operator ETH earnings */
    async getPendingEarnings(address) {
        const addr = address || this.operator;
        const eco = this.provider.getReadContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        return eco.pendingEth(addr);
    }
    /** Withdraw accumulated operator ETH earnings */
    async withdrawEarnings() {
        const eco = this.provider.getWriteContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        const tx = await eco.withdrawEth();
        const receipt = await tx.wait(1);
        return {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            events: {},
        };
    }
    /** Get ecosystem stats */
    async getEcosystemStats() {
        const eco = this.provider.getReadContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        const s = await eco.getStats();
        return {
            ethCollected: s[0],
            bkcCollected: s[1],
            feeEvents: s[2],
            buybackEth: s[3],
            moduleCount: s[4],
        };
    }
    // ── Fee Helpers ─────────────────────────────────────────────────────────
    /** Calculate the ETH fee for any action */
    async calculateFee(feeActionId, txValue = 0n) {
        return calculateFee(this.provider, this.addresses.backchainEcosystem, feeActionId, txValue);
    }
    // ── Explorer Links ──────────────────────────────────────────────────────
    /** Get explorer URL for a transaction hash */
    txUrl(hash) {
        return this.provider.getTxUrl(hash);
    }
    /** Get explorer URL for an address */
    addressUrl(address) {
        return this.provider.getAddressUrl(address);
    }
}
//# sourceMappingURL=backchain.js.map