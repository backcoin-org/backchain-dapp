# @backchain/buyback

Proof-of-Purchase mining module for the Backchain DeFi ecosystem on opBNB.

## Install

```bash
npm install @backchain/buyback
```

## Quick Start

```ts
import { createContext } from '@backchain/core';
import { BuybackModule } from '@backchain/buyback';

const ctx = await createContext({ provider, signer });
const buyback = new BuybackModule(ctx);

const preview = await buyback.preview();
console.log('BKC to buy back:', preview.bkcOut);
const tx = await buyback.execute();
```

## API

### Write Methods

#### `execute(): Promise<TransactionResponse>`
Triggers the buyback: uses accumulated BNB fees to buy BKC from the LP, then burns or distributes the BKC. The caller earns a 5% execution reward.

#### `executeWithSlippage(minBkcOut: bigint): Promise<TransactionResponse>`
Same as `execute()` but with an explicit minimum BKC output guard. Reverts if slippage exceeds the specified threshold.

### Read Methods

#### `preview(): Promise<BuybackPreview>`
Simulates the next buyback execution. Returns estimated BKC output, caller reward, and amount to be burned.

#### `pendingEth(): Promise<bigint>`
Returns the total BNB accumulated and available for the next buyback execution.

#### `miningRate(): Promise<bigint>`
Returns the current mining rate (BKC distributed per unit of BNB spent on buyback).

#### `getExecutionFee(): Promise<bigint>`
Returns the BNB fee required to call `execute()`.

#### `getSupplyInfo(): Promise<SupplyInfo>`
Returns current BKC total supply, circulating supply, and total burned to date.

#### `getStats(): Promise<BuybackStats>`
Returns historical buyback statistics: total BNB spent, total BKC burned, number of executions.

#### `getLastBuyback(): Promise<LastBuyback>`
Returns block number, timestamp, BNB used, and BKC burned from the most recent buyback execution.

## Notes

- Accumulated BNB fees originate from ecosystem protocol fees.
- Caller reward is 5% of the BKC purchased in that execution.
- All amounts are `bigint` (ethers.js v6 wei scale).

## License

MIT
