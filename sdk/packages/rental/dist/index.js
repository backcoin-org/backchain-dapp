// @backchain/rental — NFT Rental Marketplace
// ============================================================================
import { RENTAL_MANAGER_ABI, REWARD_BOOSTER_ABI, calculateFee, ACTION_IDS } from '@backchain/core';
export class RentalModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async listNft(tokenId, pricePerDay) {
        const booster = this.ctx.provider.getReadContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
        const isApproved = await booster.isApprovedForAll(this.ctx.provider.address, this.ctx.addresses.rentalManager);
        if (!isApproved) {
            const writeBooster = this.ctx.provider.getWriteContract(this.ctx.addresses.rewardBooster, REWARD_BOOSTER_ABI);
            const approveTx = await writeBooster.setApprovalForAll(this.ctx.addresses.rentalManager, true);
            await approveTx.wait(1);
        }
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.listNFT(tokenId, pricePerDay);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async rentNft(tokenId) {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const [, , totalCost] = await contract.getRentalCost(tokenId);
        const writeContract = this.ctx.provider.getWriteContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await writeContract.rentNFT(tokenId, this.ctx.operator, { value: totalCost });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async withdrawNft(tokenId) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.withdrawNFT(tokenId);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async updateListing(tokenId, pricePerDay) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.updateListing(tokenId, pricePerDay);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async withdrawEarnings() {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.withdrawEarnings();
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async boostListing(tokenId, days) {
        const fee = await calculateFee(this.ctx.provider, this.ctx.addresses.backchainEcosystem, ACTION_IDS.RENTAL_BOOST);
        const totalFee = fee * BigInt(days);
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const tx = await contract.boostListing(tokenId, days, this.ctx.operator, { value: totalFee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async getListing(tokenId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const r = await c.getListing(tokenId);
        return {
            owner: r[0], pricePerDay: r[1], totalEarnings: r[2], rentalCount: r[3],
            currentlyRented: r[4], rentalEndTime: r[5], isBoosted: r[6], boostExpiry: r[7],
        };
    }
    async getRentalCost(tokenId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const r = await c.getRentalCost(tokenId);
        return { rentalCost: r[0], ethFee: r[1], totalCost: r[2] };
    }
    async getAllListedTokenIds() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        return c.getAllListedTokenIds();
    }
    async getAvailableListings() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const r = await c.getAvailableListings();
        return { tokenIds: r[0], boosted: r[1] };
    }
    async getPendingEarnings(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        return c.pendingEarnings(addr);
    }
    async hasActiveRental(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        return c.hasActiveRental(addr);
    }
    async getStats() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.rentalManager, RENTAL_MANAGER_ABI);
        const s = await c.getStats();
        return {
            activeListings: s[0], volume: s[1], rentals: s[2],
            ethFees: s[3], earningsWithdrawn: s[4], boostRevenue: s[5],
        };
    }
}
//# sourceMappingURL=index.js.map