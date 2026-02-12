# Buyback Miner

The Buyback Miner is the economic engine of Backcoin. It converts protocol fees into staking rewards, creates buy pressure on BKC, and reduces supply through burns. Everything is automatic and permissionless.

**Contract:** `0xD0B684Be70213dFbdeFaecaFECB50232897EC843`

## How It Works

1. Users interact with Backcoin services → ETH fees accumulate in the ecosystem
2. Anyone can call `executeBuyback()` to trigger a mining cycle
3. The caller earns **5% of the ETH** as an incentive (permissionless, no whitelist)
4. The remaining 95% buys BKC from the Liquidity Pool
5. New BKC is minted based on the scarcity curve
6. **5% of total BKC** (bought + minted) is burned permanently
7. **95% goes to the Staking Pool** as rewards for delegators

This cycle runs whenever someone triggers it. There's no schedule, no admin, no gatekeeper. If there's ETH to convert, anyone can do it and earn the 5% caller incentive.

## Scarcity Curve

The amount of new BKC minted per cycle decreases as supply grows:

```
Mining Rate = (200M - Current Supply) / 160M

Early stage (40M supply):  100% rate — 1 BKC bought = 1 BKC minted
Mid stage (120M supply):    50% rate — 1 BKC bought = 0.5 BKC minted
Late stage (180M supply):   12.5% rate — 1 BKC bought = 0.125 BKC minted
Cap reached (200M supply):   0% rate — no new minting, pure real yield
```

This is important: rewards never stop. Once the 200M cap is reached, stakers still earn from the buyback portion (BKC purchased from the pool). The mining bonus just goes to zero.

## Why It Matters

The Buyback Miner creates three powerful forces:

1. **Constant buy pressure** — Protocol fees continuously buy BKC from the open market
2. **Supply reduction** — 5% burn per cycle permanently removes BKC from circulation
3. **Staker rewards** — Active participants earn real yield backed by actual protocol usage

This isn't inflationary printing. New BKC is only minted when protocol fees justify it, and the rate decreases over time. Eventually, all rewards come from buybacks alone.

## The 5% Caller Incentive

Anyone can call `executeBuyback()` and earn 5% of the accumulated ETH. This is intentional — it turns the buyback into a permissionless MEV opportunity that keeps the system running without any centralized operator.

In practice, bots and active users compete to trigger buybacks when the accumulated ETH is large enough to justify the gas cost. This is healthy — it means the mining cycle runs itself.

## Numbers

| Parameter | Value |
|-----------|-------|
| Max Mintable | 160,000,000 BKC |
| Caller Incentive | 5% of ETH |
| Burn per Cycle | 5% of total BKC (bought + minted) |
| Rewards per Cycle | 95% of total BKC |
| Min Supply for Mining | 40,000,000 BKC (TGE) |
| Max Supply | 200,000,000 BKC |

## For Operators

The buyback cycle itself supports operators. When you build a frontend, user activity generates fees that feed the miner. More users on your platform means more ETH accumulated, more buybacks, and more rewards for everyone in the ecosystem.

See also: [Tokenomics](./TOKENOMICS.md) | [Staking](./STAKING.md) | [Liquidity Pool — AMM](./NFT_LIQUIDITY_POOLS.md)
