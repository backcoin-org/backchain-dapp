# Staking (Delegation)

Lock your BKC tokens to earn mining rewards. The longer you lock, the more power you get, and the bigger your share of rewards.

**Contract:** `0xeA5D34520783564a736258a9fd29775c9c1C8E78`

## How It Works

1. **Delegate** — Lock BKC for a period between 1 and 3,650 days (10 years)
2. **Earn** — Receive mining rewards proportional to your delegation power (pStake)
3. **Claim** — Withdraw your rewards at any time (subject to burn rate)
4. **Unstake** — Get your BKC back when the lock period ends

## Delegation Power (pStake)

Your share of rewards is based on pStake, not just the amount you staked. Longer locks give you more power:

```
pStake = Amount × (10000 + lockDays × 5918 / 365) / 10000
```

**Examples:**

| Amount | Lock Period | pStake | Power Multiplier |
|--------|-----------|--------|-----------------|
| 10,000 BKC | 30 days | 10,486 | 1.05x |
| 10,000 BKC | 180 days | 12,919 | 1.29x |
| 10,000 BKC | 365 days | 15,918 | 1.59x |
| 10,000 BKC | 1,825 days | 39,590 | 3.96x |

Locking longer doesn't just earn more — it earns disproportionately more. A 5-year lock gives nearly 4x the power of a 1-day lock.

## Burn Rate on Claims

When you claim rewards, a percentage is burned. This is by design — it creates deflationary pressure and makes NFT Boosters valuable.

| NFT Booster | Burn Rate | You Keep |
|------------|-----------|----------|
| None | 50% | 50% |
| Bronze | 40% | 60% |
| Silver | 25% | 75% |
| Gold | 10% | 90% |
| Diamond | 0% | 100% |

Without an NFT, you keep half your rewards. With a Diamond NFT, you keep everything. This is why Booster NFTs are the most important utility items in the ecosystem.

You can buy NFTs on the [NFT Pools](./NFT_LIQUIDITY_POOLS.md) or rent them on the [Rental Market](./RENTAL.md).

## Force Unstake

Need your tokens before the lock expires? You can force unstake, but it costs:

- **10% penalty** of your staked amount (this BKC is burned)
- Your rewards are preserved — they're not lost, just not auto-claimed

Force unstake is a safety valve, not a recommended strategy. The penalty is burned, which benefits all remaining holders.

## Referral Rewards

When you claim staking rewards, 5% of your net rewards goes to the person who referred you (or to treasury if you have no referrer). This incentivizes growth and rewards people who bring new users to the ecosystem.

## Operator Support

Every staking action supports the operator system. When users stake through your frontend, you earn a commission on the ETH fee.

Supported actions:
- `STAKING_DELEGATE` — When a user stakes BKC
- `STAKING_CLAIM` — When a user claims rewards
- `STAKING_FORCE_UNSTAKE` — When a user breaks a lock early

## Strategy Tips

- **Lock longer for more power.** A 1-year lock gives 1.59x power vs a 1-day lock.
- **Get an NFT Booster.** Even a Bronze NFT saves you 10% on every claim. Over time, this adds up massively.
- **Claim at the right time.** Rewards accumulate continuously. You don't lose rewards by waiting.
- **Use referrals.** If someone referred you, 5% of your rewards go to them. Set your referrer early.
- **Stack delegations.** You can have multiple active delegations with different lock periods.

## Fees

- ETH fee on delegate, claim, and force unstake (gas-based, goes to ecosystem)
- No BKC fee on staking actions

See also: [Mining](./MINING.md) | [NFT Boosters](./REWARD_BOOSTER_NFT.md) | [Rental Market](./RENTAL.md)
