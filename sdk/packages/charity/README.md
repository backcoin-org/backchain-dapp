# @backchain/charity

Charity module for the Backchain DeFi ecosystem on opBNB. Create and fund transparent on-chain fundraising campaigns.

## Install

```bash
npm install @backchain/charity
```

## Quick Start

```js
import { CharityModule } from '@backchain/charity';

const charity = new CharityModule(context); // context from @backchain/core
const campaignId = await charity.createCampaign('Clean Water Fund', 'ipfs://Qm...', ethers.parseEther('10'), 30);
await charity.donate(campaignId, ethers.parseEther('0.5'));
const campaign = await charity.getCampaign(campaignId);
```

## API

### Write Methods

**`createCampaign(title: string, metadataUri: string, goal: bigint, durationDays: number): Promise<TransactionResult>`**
Create a new fundraising campaign. `title` is stored on-chain. `metadataUri` points to an IPFS or Firebase JSON document with extended campaign details (description, image, links). `goal` is the fundraising target in BNB (wei). `durationDays` sets how long the campaign accepts donations.

**`donate(campaignId: bigint, amount: bigint): Promise<TransactionResult>`**
Donate BNB to an active campaign. A 5% fee is deducted from `amount` and distributed to the ecosystem; the remaining 95% is credited to the campaign. Reverts if the campaign is closed or expired.

**`closeCampaign(campaignId: bigint): Promise<TransactionResult>`**
Manually close a campaign before its deadline. Only the campaign owner can call this. Once closed, no further donations are accepted.

**`withdraw(campaignId: bigint): Promise<TransactionResult>`**
Withdraw raised funds from a closed or expired campaign. Only the campaign owner can call this. Transfers the net BNB balance to the owner's address.

**`boostCampaign(campaignId: bigint): Promise<TransactionResult>`**
Pay a boost fee to promote a campaign in the protocol's featured listings. The fee amount is set by the ecosystem fee configuration.

### Read Methods

**`getCampaign(campaignId: bigint): Promise<Campaign>`**
Returns full campaign data: owner, title, metadata URI, goal, amount raised (net after fees), donor count, deadline, open/closed status, and whether funds have been withdrawn.

**`previewDonation(amount: bigint): Promise<DonationPreview>`**
Returns the breakdown of a donation before sending: gross amount, protocol fee (5%), and net amount credited to the campaign. No network transaction required.

**`getStats(): Promise<CharityStats>`**
Returns global charity pool statistics: total campaigns created, total BNB donated (gross), total fees collected, and number of unique donors.

## License

MIT
