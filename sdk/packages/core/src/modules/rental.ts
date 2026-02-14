// @backchain/sdk — Rental Module (NFT Rental Marketplace / AirBNFT)
// ============================================================================

import { ethers } from 'ethers';
import { RENTAL_MANAGER_ABI, REWARD_BOOSTER_ABI } from '../contracts/abis.js';
import { calculateFee, ACTION_IDS } from '../fees.js';
import type { Backchain } from '../backchain.js';
import type { TxResult, Listing, RentalInfo } from '../types/index.js';

export class RentalModule {
    constructor(private sdk: Backchain) {}

    // ── Write ───────────────────────────────────────────────────────────────

    /**
     * List an NFT for rent.
     * Requires NFT approval for the RentalManager contract.
     *
     * @param tokenId - NFT token ID
     * @param pricePerDay - Rental price per day in wei
     */
    async listNft(tokenId: bigint, pricePerDay: bigint): Promise<TxResult> {
        // Auto-approve NFT if needed
        const booster = this.sdk.provider.getReadContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const isApproved = await booster.isApprovedForAll(this.sdk.provider.address!, this.sdk.addresses.rentalManager);
        if (!isApproved) {
            const writeBooster = this.sdk.provider.getWriteContract(this.sdk.addresses.rewardBooster, REWARD_BOOSTER_ABI);
            const approveTx = await writeBooster.setApprovalForAll(this.sdk.addresses.rentalManager, true);
            await approveTx.wait(1);
        }

        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.listNFT(tokenId, pricePerDay);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Rent an available NFT (1-day rental) */
    async rentNft(tokenId: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const [, , totalCost] = await contract.getRentalCost(tokenId);

        const writeContract = this.sdk.provider.getWriteContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await writeContract.rentNFT(tokenId, this.sdk.operator, { value: totalCost });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Withdraw a listed NFT */
    async withdrawNft(tokenId: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.withdrawNFT(tokenId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Update listing price */
    async updateListing(tokenId: bigint, pricePerDay: bigint): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.updateListing(tokenId, pricePerDay);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Withdraw accumulated rental earnings */
    async withdrawEarnings(): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.withdrawEarnings();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    /** Boost a listing's visibility (daily rate) */
    async boostListing(tokenId: bigint, days: number): Promise<TxResult> {
        const fee = await calculateFee(this.sdk.provider, this.sdk.addresses.backchainEcosystem, ACTION_IDS.RENTAL_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.boostListing(tokenId, days, this.sdk.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    /** Get listing details */
    async getListing(tokenId: bigint): Promise<Listing> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const r = await c.getListing(tokenId);
        return {
            owner: r[0], pricePerDay: r[1], totalEarnings: r[2], rentalCount: r[3],
            currentlyRented: r[4], rentalEndTime: r[5], isBoosted: r[6], boostExpiry: r[7],
        };
    }

    /** Get rental cost breakdown for a token */
    async getRentalCost(tokenId: bigint): Promise<{ rentalCost: bigint; ethFee: bigint; totalCost: bigint }> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const r = await c.getRentalCost(tokenId);
        return { rentalCost: r[0], ethFee: r[1], totalCost: r[2] };
    }

    /** Get all listed token IDs */
    async getAllListedTokenIds(): Promise<bigint[]> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        return c.getAllListedTokenIds();
    }

    /** Get available (not currently rented) listings */
    async getAvailableListings(): Promise<{ tokenIds: bigint[]; boosted: boolean[] }> {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const r = await c.getAvailableListings();
        return { tokenIds: r[0], boosted: r[1] };
    }

    /** Get pending earnings for a listing owner */
    async getPendingEarnings(address?: string): Promise<bigint> {
        const addr = address || this.sdk.provider.address;
        if (!addr) throw new Error('No address');
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        return c.pendingEarnings(addr);
    }

    /** Check if user has an active rental */
    async hasActiveRental(address?: string): Promise<boolean> {
        const addr = address || this.sdk.provider.address;
        if (!addr) throw new Error('No address');
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        return c.hasActiveRental(addr);
    }

    /** Get marketplace statistics */
    async getStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const s = await c.getStats();
        return {
            activeListings: s[0] as bigint, volume: s[1] as bigint, rentals: s[2] as bigint,
            ethFees: s[3] as bigint, earningsWithdrawn: s[4] as bigint, boostRevenue: s[5] as bigint,
        };
    }
}
