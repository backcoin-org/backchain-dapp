import type { BackchainContext } from '@backchain/core';
import type { TxResult, Listing } from '@backchain/core';
export declare class RentalModule {
    private ctx;
    constructor(ctx: BackchainContext);
    listNft(tokenId: bigint, pricePerDay: bigint): Promise<TxResult>;
    rentNft(tokenId: bigint): Promise<TxResult>;
    withdrawNft(tokenId: bigint): Promise<TxResult>;
    updateListing(tokenId: bigint, pricePerDay: bigint): Promise<TxResult>;
    withdrawEarnings(): Promise<TxResult>;
    boostListing(tokenId: bigint, days: number): Promise<TxResult>;
    getListing(tokenId: bigint): Promise<Listing>;
    getRentalCost(tokenId: bigint): Promise<{
        rentalCost: bigint;
        ethFee: bigint;
        totalCost: bigint;
    }>;
    getAllListedTokenIds(): Promise<bigint[]>;
    getAvailableListings(): Promise<{
        tokenIds: bigint[];
        boosted: boolean[];
    }>;
    getPendingEarnings(address?: string): Promise<bigint>;
    hasActiveRental(address?: string): Promise<boolean>;
    getStats(): Promise<{
        activeListings: bigint;
        volume: bigint;
        rentals: bigint;
        ethFees: bigint;
        earningsWithdrawn: bigint;
        boostRevenue: bigint;
    }>;
}
//# sourceMappingURL=index.d.ts.map