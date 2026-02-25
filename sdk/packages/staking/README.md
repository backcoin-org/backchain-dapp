# @backchain/staking

Staking module for the Backchain DeFi ecosystem on opBNB. Delegate BKC tokens, earn rewards, and boost yields with NFT boosters.

## Install

```bash
npm install @backchain/staking
```

## Quick Start

```js
import { StakingModule } from '@backchain/staking';

const staking = new StakingModule(context); // context from @backchain/core
await staking.delegate(ethers.parseEther('1000'), 365); // stake 1000 BKC for 1 year
const rewards = await staking.pendingRewards();
await staking.claimRewards();
```

## API

### Write Methods

**`delegate(amount: bigint, lockDays: number): Promise<TransactionResult>`**
Delegate BKC tokens to the staking pool. `lockDays` must be between 1 and 3650. Higher lock durations increase pStake weight, resulting in a larger share of rewards.

**`unstake(index: number): Promise<TransactionResult>`**
Unstake a delegation by index after its lock period has expired. Returns principal plus accrued rewards.

**`forceUnstake(index: number): Promise<TransactionResult>`**
Unstake before the lock period ends. Subject to an early-exit burn penalty. NFT boosters held by the caller reduce the burn rate.

**`claimRewards(): Promise<TransactionResult>`**
Claim all pending BKC rewards without unstaking. 95% of distributed rewards go to stakers; 5% is burned. NFT boosters reduce the burn applied to the caller's claim.

### Read Methods

**`getDelegations(): Promise<Delegation[]>`**
Returns all active delegations for the connected wallet.

**`getDelegation(address: string, index: number): Promise<Delegation>`**
Returns a single delegation by owner address and index.

**`pendingRewards(): Promise<bigint>`**
Returns the amount of BKC rewards currently claimable by the connected wallet.

**`previewClaim(): Promise<ClaimPreview>`**
Returns a breakdown of a claim: gross rewards, burn amount after any NFT booster discount, and net amount received.

**`previewForceUnstake(address: string, index: number): Promise<ForceUnstakePreview>`**
Returns the expected payout and burn penalty for an early unstake of the given delegation.

**`getUserSummary(): Promise<UserSummary>`**
Returns aggregated staking data for the connected wallet: total staked, total pStake, pending rewards, and active delegation count.

**`getStats(): Promise<StakingStats>`**
Returns global pool statistics: total staked BKC, total pStake, APY estimate, and number of stakers.

### Utility

**`calculatePStake(amount: bigint, lockDays: number): bigint`**
Pure JS calculation of pStake weight. Formula mirrors the on-chain contract: `amount * (10000 + lockDays * 5918 / 365) / 10000`. No network call required.

## License

MIT
