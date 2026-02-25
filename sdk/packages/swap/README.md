# @backchain/swap

AMM liquidity pool trading module for the Backchain DeFi ecosystem on opBNB.

## Install

```bash
npm install @backchain/swap
```

## Quick Start

```ts
import { createContext } from '@backchain/core';
import { SwapModule } from '@backchain/swap';

const ctx = await createContext({ provider, signer });
const swap = new SwapModule(ctx);

const quote = await swap.getQuote(ethers.parseEther('0.1'));
const tx = await swap.buyBkc(ethers.parseEther('0.1'), 50); // 0.5% slippage
```

## API

### Write Methods

#### `buyBkc(bnbAmount: bigint, slippageBps?: number): Promise<TransactionResponse>`
Buy BKC tokens by sending BNB. Uses constant-product AMM pricing. `slippageBps` defaults to 50 (0.5%).

#### `sellBkc(bkcAmount: bigint, slippageBps?: number): Promise<TransactionResponse>`
Sell BKC tokens and receive BNB. `slippageBps` defaults to 50 (0.5%).

### Read Methods

#### `getQuote(bnbAmount: bigint): Promise<bigint>`
Returns the estimated BKC output for a given BNB input, accounting for the 0.3% swap fee.

#### `getQuoteBkcToEth(bkcAmount: bigint): Promise<bigint>`
Returns the estimated BNB output for a given BKC input, accounting for the 0.3% swap fee.

#### `getCurrentPrice(): Promise<bigint>`
Returns the current BKC price in BNB, expressed in 18-decimal wei.

#### `getReserves(): Promise<{ bnbReserve: bigint; bkcReserve: bigint }>`
Returns the current BNB and BKC reserves held by the liquidity pool.

#### `getSwapFeeBps(): Promise<number>`
Returns the swap fee in basis points (currently 30, i.e. 0.3%).

#### `getStats(): Promise<SwapStats>`
Returns aggregated pool statistics including total volume, number of swaps, and TVL.

## Notes

- Uses a constant-product AMM (x * y = k).
- All amounts are `bigint` (ethers.js v6 wei scale).
- Slippage is expressed in basis points (100 bps = 1%).

## License

MIT
