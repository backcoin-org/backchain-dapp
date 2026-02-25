# @backchain/fusion

Fusion module for the Backchain DeFi ecosystem on opBNB. Fuse lower-tier NFTs into higher-tier boosters, or split them back down.

## Install

```bash
npm install @backchain/fusion
```

## Quick Start

```js
import { FusionModule } from '@backchain/fusion';

const fusion = new FusionModule(context); // context from @backchain/core
const preview = await fusion.previewFusion(tokenId1, tokenId2);
await fusion.fuse(tokenId1, tokenId2); // combines 2 Bronze into 1 Silver
```

## API

### Write Methods

**`fuse(tokenId1: number, tokenId2: number): Promise<TransactionResult>`**
Combine two NFTs of the same tier into one NFT of the next higher tier. Both input tokens are burned; one new token of the higher tier is minted. Automatically requests NFT transfer approval if not already granted. Tiers: Bronze(0) + Bronze(0) → Silver(1), and so on up to Diamond(3).

**`split(tokenId: number): Promise<TransactionResult>`**
Split one NFT into two NFTs of the next lower tier. The input token is burned; two new tokens of the lower tier are minted. Cannot split Bronze (tier 0).

**`splitTo(tokenId: number, targetTier: number): Promise<TransactionResult>`**
Cascade-split an NFT down to a target tier in a single transaction. For example, splitting a Gold (tier 2) to Bronze (tier 0) produces four Bronze NFTs. Automatically approves transfers as needed.

### Read Methods

**`previewFusion(tokenId1: number, tokenId2: number): Promise<FusionPreview>`**
Returns a preview of a fuse operation: input tiers, expected output tier, and the fusion fee in BNB. Returns an error description if the tokens are not eligible to fuse (e.g., mismatched tiers or already at Diamond).

**`previewSplit(tokenId: number, targetTier: number): Promise<SplitPreview>`**
Returns a preview of a split or cascade-split: input tier, target tier, number of output tokens, and the total fee in BNB.

**`getStats(): Promise<FusionStats>`**
Returns global fusion statistics: total fusions performed, total splits, total fees collected, and current fee rates per tier operation.

## License

MIT
