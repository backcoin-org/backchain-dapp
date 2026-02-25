# @backchain/nft

NFT module for the Backchain DeFi ecosystem on opBNB. Buy and sell booster NFTs that trade on bonding curves and increase staking reward yields.

## Install

```bash
npm install @backchain/nft
```

## Quick Start

```js
import { NftModule } from '@backchain/nft';

const nft = new NftModule(context); // context from @backchain/core
const price = await nft.getBuyPrice(0); // get Bronze NFT price
await nft.buy(0, 50); // buy Bronze NFT with 0.5% slippage tolerance
const tokens = await nft.getUserTokens();
```

## API

### Tiers

| Tier | Name    | Reward Boost |
|------|---------|--------------|
| 0    | Bronze  | 10%          |
| 1    | Silver  | 25%          |
| 2    | Gold    | 40%          |
| 3    | Diamond | 50%          |

NFTs can be upgraded via `@backchain/fusion`.

### Write Methods

**`buy(tier: number, slippageBps?: number): Promise<TransactionResult>`**
Purchase an NFT from the bonding curve pool for the given tier. `slippageBps` sets the maximum acceptable price increase in basis points (default: 100 = 1%). Automatically pays the required ETH/BNB.

**`sell(tier: number, tokenId: number, minPayout?: bigint): Promise<TransactionResult>`**
Sell an NFT back to the bonding curve pool. `minPayout` is the minimum BNB the caller will accept; the transaction reverts if the pool price has dropped below this value.

### Read Methods

**`getBuyPrice(tier: number): Promise<bigint>`**
Returns the current buy price in BNB for one NFT of the given tier, as determined by the bonding curve.

**`getSellPrice(tier: number): Promise<bigint>`**
Returns the current sell price in BNB for one NFT of the given tier.

**`getPoolInfo(tier: number): Promise<PoolInfo>`**
Returns pool state for a tier: reserve BNB, NFT supply, bonding curve parameters, and pool address.

**`getAvailableNFTs(tier: number): Promise<number[]>`**
Returns an array of token IDs currently available for purchase in the given tier's pool.

**`getPoolStats(tier: number): Promise<PoolStats>`**
Returns aggregate statistics for a tier pool: total volume, number of holders, and all-time buy/sell counts.

**`getUserTokens(address?: string): Promise<UserToken[]>`**
Returns all NFTs owned by the given address (defaults to connected wallet). Each entry includes token ID, tier, and current sell price.

**`getUserBestBoost(address?: string): Promise<number>`**
Returns the highest boost percentage among all NFTs held by the given address. This is the effective boost applied to staking rewards and claim burn reduction.

**`getTokenInfo(tokenId: number): Promise<TokenInfo>`**
Returns metadata for a specific token: tier, owner, acquisition price, and current sell price.

## License

MIT
