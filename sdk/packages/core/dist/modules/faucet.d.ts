import type { Backchain } from '../backchain.js';
import type { TxResult, FaucetStatus, UserFaucetInfo } from '../types/index.js';
export declare class FaucetModule {
    private sdk;
    constructor(sdk: Backchain);
    /** Claim testnet ETH from the faucet (user pays gas) */
    claim(): Promise<TxResult>;
    /** Check if an address can claim */
    canClaim(address?: string): Promise<boolean>;
    /** Get user faucet info (last claim, count, eligibility, cooldown) */
    getUserInfo(address?: string): Promise<UserFaucetInfo>;
    /** Get faucet status (ETH balance, drip amount, estimated claims remaining) */
    getStatus(): Promise<FaucetStatus>;
    /** Get faucet statistics */
    getStats(): Promise<{
        eth: bigint;
        claims: bigint;
        users: bigint;
    }>;
    /** Check if faucet is paused */
    isPaused(): Promise<boolean>;
}
//# sourceMappingURL=faucet.d.ts.map