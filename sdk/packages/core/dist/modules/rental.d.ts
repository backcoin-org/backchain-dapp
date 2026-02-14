import type { Backchain } from '../backchain.js';
import type { TxResult, Listing } from '../types/index.js';
export declare class RentalModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * List an NFT for rent.
     * Requires NFT approval for the RentalManager contract.
     *
     * @param tokenId - NFT token ID
     * @param pricePerDay - Rental price per day in wei
     */
    listNft(tokenId: bigint, pricePerDay: bigint): Promise<TxResult>;
    /** Rent an available NFT (1-day rental) */
    rentNft(tokenId: bigint): Promise<TxResult>;
    /** Withdraw a listed NFT */
    withdrawNft(tokenId: bigint): Promise<TxResult>;
    /** Update listing price */
    updateListing(tokenId: bigint, pricePerDay: bigint): Promise<TxResult>;
    /** Withdraw accumulated rental earnings */
    withdrawEarnings(): Promise<TxResult>;
    /** Boost a listing's visibility (daily rate) */
    boostListing(tokenId: bigint, days: number): Promise<TxResult>;
    /** Get listing details */
    getListing(tokenId: bigint): Promise<Listing>;
    /** Get rental cost breakdown for a token */
    getRentalCost(tokenId: bigint): Promise<{
        rentalCost: bigint;
        ethFee: bigint;
        totalCost: bigint;
    }>;
    /** Get all listed token IDs */
    getAllListedTokenIds(): Promise<bigint[]>;
    /** Get available (not currently rented) listings */
    getAvailableListings(): Promise<{
        tokenIds: bigint[];
        boosted: boolean[];
    }>;
    /** Get pending earnings for a listing owner */
    getPendingEarnings(address?: string): Promise<bigint>;
    /** Check if user has an active rental */
    hasActiveRental(address?: string): Promise<boolean>;
    /** Get marketplace statistics */
    getStats(): Promise<{
        activeListings: bigint;
        volume: bigint;
        rentals: bigint;
        ethFees: bigint;
        earningsWithdrawn: bigint;
        boostRevenue: bigint;
    }>;
}
//# sourceMappingURL=rental.d.ts.map