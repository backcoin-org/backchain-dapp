import { ethers } from 'ethers';
import { ProviderManager } from '@backchain/core';
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
export declare class Backchain implements BackchainContext {
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
    readonly fusion: FusionModule;
    readonly buyback: BuybackModule;
    constructor(config: BackchainConfig);
    get isConnected(): boolean;
    get address(): string | null;
    connect(): Promise<string>;
    connectWithSigner(signer: ethers.Signer): Promise<string>;
    disconnect(): void;
    calculateFee(actionId: string, txValue?: bigint): Promise<bigint>;
    getBkcAllowance(spender: string, owner?: string): Promise<bigint>;
    approveBkc(spender: string, amount: bigint): Promise<TxResult>;
    /** Get BKC balance of an address (or connected wallet) */
    getBkcBalance(address?: string): Promise<bigint>;
    /** Get ETH balance of an address (or connected wallet) */
    getEthBalance(address?: string): Promise<bigint>;
    /** Get the tutor (referrer) of an address */
    getTutor(address?: string): Promise<string>;
    /** Get number of students (referrals) for an address */
    getTutorCount(address?: string): Promise<number>;
    /** Set tutor (referrer) — pays tutorFee */
    setTutor(tutor: string): Promise<TxResult>;
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
    /** Get explorer URL for a transaction hash */
    txUrl(hash: string): string;
    /** Get explorer URL for an address */
    addressUrl(address: string): string;
}
//# sourceMappingURL=backchain.d.ts.map