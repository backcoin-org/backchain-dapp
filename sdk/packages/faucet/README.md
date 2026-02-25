# @backchain/faucet

Testnet BNB distribution module for the Backchain DeFi ecosystem.

## Install

```bash
npm install @backchain/faucet
```

## Quick Start

```ts
import { createContext } from '@backchain/core';
import { FaucetModule } from '@backchain/faucet';

const ctx = await createContext({ provider, signer });
const faucet = new FaucetModule(ctx);

const eligible = await faucet.canClaim();
if (eligible) {
  const tx = await faucet.claim();
}
```

## API

### Write Methods

#### `claim(): Promise<TransactionResponse>`
Claims the daily testnet BNB allocation for the connected wallet. Reverts if the cooldown period has not elapsed or the faucet is paused.

### Read Methods

#### `canClaim(address?: string): Promise<boolean>`
Returns `true` if the given address (defaults to the connected wallet) is eligible to claim. Checks cooldown and paused state.

#### `getUserInfo(address?: string): Promise<UserInfo>`
Returns claim history for an address: last claim timestamp, total claims, and total BNB received.

#### `getStatus(): Promise<FaucetStatus>`
Returns the current faucet state: BNB balance, claim amount per request, and cooldown duration in seconds.

#### `getStats(): Promise<FaucetStats>`
Returns aggregate faucet statistics: total BNB distributed, total number of claims, and unique claimants.

#### `isPaused(): Promise<boolean>`
Returns `true` if the faucet has been administratively paused.

## Notes

- Testnet-only module. Not deployed on opBNB Mainnet.
- Distributes BNB for gas only. BKC is not distributed by the faucet (V12: BNB-only faucet).
- Users who need BKC should purchase it via the liquidity pool using `@backchain/swap`.
- All amounts are `bigint` (ethers.js v6 wei scale).

## License

MIT
