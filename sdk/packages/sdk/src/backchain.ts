// @backchain/sdk — Full Backchain Class
// ============================================================================
// The all-in-one entry point. Implements BackchainContext so it can be passed
// directly to any individual module.
//
// Usage:
//   import { Backchain } from '@backchain/sdk';
//   const bkc = new Backchain({ operator: '0x...' });
//   await bkc.connect();
//   await bkc.staking.delegate(ethers.parseEther('100'), 365);

import { ethers } from 'ethers';
import {
    ProviderManager, getAddresses,
    BKC_TOKEN_ABI, ECOSYSTEM_ABI,
    calculateFee as calcFee,
} from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { BackchainConfig, ContractAddresses, NetworkId, TxResult } from '@backchain/core';

import { StakingModule } from '@backchain/staking';
import { NftModule } from '@backchain/nft';
import { FortuneModule } from '@backchain/fortune';
import { NotaryModule } from '@backchain/notary';
import { AgoraModule } from '@backchain/agora';
import { CharityModule } from '@backchain/charity';
import { RentalModule } from '@backchain/rental';
import { SwapModule } from '@backchain/swap';
import { FusionModule } from '@backchain/fusion';
import { BuybackModule } from '@backchain/buyback';

export class Backchain implements BackchainContext {
    readonly operator: string;
    readonly network: NetworkId;
    readonly provider: ProviderManager;
    readonly addresses: ContractAddresses;

    // ── Modules ─────────────────────────────────────────────────────────────
    readonly staking: StakingModule;
    readonly nft: NftModule;
    readonly fortune: FortuneModule;
    readonly notary: NotaryModule;
    readonly agora: AgoraModule;
    readonly charity: CharityModule;
    readonly rental: RentalModule;
    readonly swap: SwapModule;
    readonly fusion: FusionModule;
    readonly buyback: BuybackModule;

    constructor(config: BackchainConfig) {
        if (!config.operator || !ethers.isAddress(config.operator)) {
            throw new Error(`Invalid operator address: ${config.operator}. Must be a valid Ethereum address.`);
        }

        this.operator = ethers.getAddress(config.operator);
        this.network = config.network || 'sepolia';

        const defaults = getAddresses(this.network);
        this.addresses = { ...defaults, ...config.addresses };

        this.provider = new ProviderManager(this.network, config.rpcUrl);

        // Initialize all modules with this context
        this.staking = new StakingModule(this);
        this.nft = new NftModule(this);
        this.fortune = new FortuneModule(this);
        this.notary = new NotaryModule(this);
        this.agora = new AgoraModule(this);
        this.charity = new CharityModule(this);
        this.rental = new RentalModule(this);
        this.swap = new SwapModule(this);
        this.fusion = new FusionModule(this);
        this.buyback = new BuybackModule(this);
    }

    // ── BackchainContext Implementation ──────────────────────────────────────

    get isConnected(): boolean {
        return this.provider.isConnected;
    }

    get address(): string | null {
        return this.provider.address;
    }

    async connect(): Promise<string> {
        return this.provider.connect();
    }

    async connectWithSigner(signer: ethers.Signer): Promise<string> {
        return this.provider.connectWithSigner(signer);
    }

    disconnect(): void {
        this.provider.disconnect();
    }

    async calculateFee(actionId: string, txValue: bigint = 0n): Promise<bigint> {
        return calcFee(this.provider, this.addresses.backchainEcosystem, actionId, txValue);
    }

    async getBkcAllowance(spender: string, owner?: string): Promise<bigint> {
        const addr = owner || this.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        const token = this.provider.getReadContract(this.addresses.bkcToken, BKC_TOKEN_ABI);
        return token.allowance(addr, spender);
    }

    async approveBkc(spender: string, amount: bigint): Promise<TxResult> {
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

    // ── Extra Helpers (full SDK only) ────────────────────────────────────────

    /** Get BKC balance of an address (or connected wallet) */
    async getBkcBalance(address?: string): Promise<bigint> {
        const addr = address || this.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        const token = this.provider.getReadContract(this.addresses.bkcToken, BKC_TOKEN_ABI);
        return token.balanceOf(addr);
    }

    /** Get ETH balance of an address (or connected wallet) */
    async getEthBalance(address?: string): Promise<bigint> {
        const addr = address || this.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        return this.provider.reader.getBalance(addr);
    }

    /** Get the tutor (referrer) of an address */
    async getTutor(address?: string): Promise<string> {
        const addr = address || this.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        const eco = this.provider.getReadContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        return eco.tutorOf(addr);
    }

    /** Get number of students (referrals) for an address */
    async getTutorCount(address?: string): Promise<number> {
        const addr = address || this.provider.address;
        if (!addr) throw new Error('No address provided and wallet not connected.');
        const eco = this.provider.getReadContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        return Number(await eco.tutorCount(addr));
    }

    /** Set tutor (referrer) — pays tutorFee */
    async setTutor(tutor: string): Promise<TxResult> {
        const eco = this.provider.getWriteContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        const fee = await eco.tutorFee();
        const tx = await eco.setTutor(tutor, { value: fee });
        const receipt = await tx.wait(1);
        return {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            events: {},
        };
    }

    /** Get pending operator ETH earnings */
    async getPendingEarnings(address?: string): Promise<bigint> {
        const addr = address || this.operator;
        const eco = this.provider.getReadContract(this.addresses.backchainEcosystem, ECOSYSTEM_ABI);
        return eco.pendingEth(addr);
    }

    /** Withdraw accumulated operator ETH earnings */
    async withdrawEarnings(): Promise<TxResult> {
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
            ethCollected: s[0] as bigint,
            bkcCollected: s[1] as bigint,
            feeEvents: s[2] as bigint,
            buybackEth: s[3] as bigint,
            moduleCount: s[4] as bigint,
        };
    }

    /** Get explorer URL for a transaction hash */
    txUrl(hash: string): string {
        return this.provider.getTxUrl(hash);
    }

    /** Get explorer URL for an address */
    addressUrl(address: string): string {
        return this.provider.getAddressUrl(address);
    }
}
