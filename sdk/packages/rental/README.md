# @backchain/rental

Rental module for the Backchain DeFi ecosystem on opBNB. NFT booster rental marketplace — list your NFTs for rent and earn BNB, or rent a booster to amplify your staking rewards.

## Install

```bash
npm install @backchain/rental
```

## Quick Start

```js
import { RentalModule } from '@backchain/rental';

const rental = new RentalModule(context); // context from @backchain/core
await rental.listNft(tokenId, ethers.parseEther('0.001')); // 0.001 BNB/day
const cost = await rental.getRentalCost(tokenId);
await rental.rentNft(tokenId); // renter receives the NFT boost
```

## API

### Write Methods

**`listNft(tokenId: number, pricePerDay: bigint): Promise<TransactionResult>`**
List an NFT booster for rent. `pricePerDay` is the daily rental price in BNB (wei). The NFT is transferred to the rental contract escrow. The owner retains ownership and can withdraw at any time when the NFT is not actively rented.

**`rentNft(tokenId: number): Promise<TransactionResult>`**
Rent a listed NFT. Automatically calculates and sends the required BNB based on the listing's `pricePerDay` and a fixed rental period. The renter receives the NFT's boost effect for the duration of the rental.

**`withdrawNft(tokenId: number): Promise<TransactionResult>`**
Return a listed (but not currently rented) NFT to the owner's wallet. Removes the listing. Reverts if the NFT is actively rented.

**`updateListing(tokenId: number, pricePerDay: bigint): Promise<TransactionResult>`**
Update the daily rental price of an existing listing. Only the listing owner can call this. Takes effect on the next rental.

**`withdrawEarnings(): Promise<TransactionResult>`**
Withdraw all accumulated BNB rental earnings to the caller's wallet. Collects earnings across all of the caller's listings.

**`boostListing(tokenId: number, days: number): Promise<TransactionResult>`**
Pay a fee to feature a listing in the marketplace's promoted section for the given number of days. Increases visibility to prospective renters.

### Read Methods

**`getListing(tokenId: number): Promise<Listing>`**
Returns full listing data for an NFT: owner, tier, price per day, current renter address (zero if available), rental start time, rental end time, and total earnings accumulated.

**`getRentalCost(tokenId: number): Promise<bigint>`**
Returns the total BNB required to rent the NFT for one standard rental period. Equivalent to `pricePerDay * rentalPeriodDays` plus any applicable protocol fee.

**`getStats(): Promise<RentalStats>`**
Returns global rental marketplace statistics: total listings, active rentals, total BNB earned by owners, total rental volume, and the current standard rental period in days.

## License

MIT
