import { ethers } from 'ethers';
import { ProviderManager } from './provider.js';
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
import type { BackchainConfig, ContractAddresses, NetworkId, TxResult } from './types/index.js';
export declare class Backchain {
    readonly operator: string;
    readonly network: NetworkId;
    readonly provider: ProviderManager;
    readonly addresses: ContractAddresses;
    readonly staking: StakingModule;
    readonly nft: NftModule;
    readonly fortune: FortuneModule;
    readonly notary: NotaryModule;
    readonly agora: AgoraModule;
    readonly charity: CharityModule;
    readonly rental: RentalModule;
    readonly swap: SwapModule;
    readonly faucet: FaucetModule;
    readonly fusion: FusionModule;
    readonly buyback: BuybackModule;
    constructor(config: BackchainConfig);
    /** Connect to MetaMask or injected wallet */
    connect(): Promise<string>;
    /** Connect with a custom signer (e.g., private key, WalletConnect) */
    connectWithSigner(signer: ethers.Signer): Promise<string>;
    /** Disconnect wallet */
    disconnect(): void;
    /** Whether a wallet is connected */
    get isConnected(): boolean;
    /** Connected wallet address (null if not connected) */
    get address(): string | null;
    /** Get BKC balance of an address (or connected wallet) */
    getBkcBalance(address?: string): Promise<bigint>;
    /** Get ETH balance of an address (or connected wallet) */
    getEthBalance(address?: string): Promise<bigint>;
    /** Approve BKC spending for a contract */
    approveBkc(spender: string, amount: bigint): Promise<TxResult>;
    /** Check BKC allowance for a spender */
    getBkcAllowance(spender: string, owner?: string): Promise<bigint>;
    /** Get the tutor (referrer) of an address */
    getTutor(address?: string): Promise<string>;
    /** Get pending operator ETH earnings */
    getPendingEarnings(address?: string): Promise<bigint>;
    /** Withdraw accumulated operator ETH earnings */
    withdrawEarnings(): Promise<TxResult>;
    /** Get ecosystem stats */
    getEcosystemStats(): Promise<{
        ethCollected: bigint;
        bkcCollected: bigint;
        feeEvents: bigint;
        buybackEth: bigint;
        moduleCount: bigint;
    }>;
    /** Calculate the ETH fee for any action */
    calculateFee(feeActionId: string, txValue?: bigint): Promise<bigint>;
    /** Get explorer URL for a transaction hash */
    txUrl(hash: string): string;
    /** Get explorer URL for an address */
    addressUrl(address: string): string;
}
//# sourceMappingURL=backchain.d.ts.map