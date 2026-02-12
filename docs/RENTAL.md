# NFT Rental Market

A non-custodial marketplace where NFT owners earn passive income and renters access staking boosts at a fraction of the buy price.

**Contract:** `0xa2303db7e2D63398a68Ea326a3566bC92f129D44`

## Why Rent?

Buying a Diamond NFT can be expensive. Renting gives you the same boost for a limited time at a much lower cost. Great for trying out higher tiers or for short-term staking strategies.

## Burn Rate Savings

| Rented NFT | Burn Rate | You Keep | Savings vs No NFT |
|-----------|-----------|----------|-------------------|
| Bronze | 40% | 60% | +10% per claim |
| Silver | 25% | 75% | +25% per claim |
| Gold | 10% | 90% | +40% per claim |
| Diamond | 0% | 100% | +50% per claim |

## How It Works

### For Owners
1. **List** your NFT → Set a daily ETH price and duration
2. **Your NFT is escrowed** in the contract (safe, non-custodial)
3. **Earn ETH** each time someone rents it
4. **Withdraw** your NFT when no active rental exists
5. **Claim earnings** anytime — your ETH accumulates in the contract

### For Renters
1. **Browse** available NFTs by tier and price
2. **Rent** — Pay ETH upfront for the rental period
3. **Enjoy the boost** — Your staking rewards immediately benefit from the lower burn rate
4. **Rental expires** automatically — No action needed

## Economics Example

Say you have 100,000 BKC staked and expect to claim 10,000 BKC in rewards:

| Strategy | Burn | You Receive | Cost |
|----------|------|------------|------|
| No NFT | 50% | 5,000 BKC | Free |
| Rent Bronze | 40% | 6,000 BKC | Rental fee |
| Rent Diamond | 0% | 10,000 BKC | Rental fee |

If the Diamond rental costs 0.01 ETH and you save 5,000 BKC worth 0.05 ETH, the rental pays for itself 5x over.

## Key Rules

- **One active rental per user** — Your best boost (owned or rented) applies automatically
- **Owner keeps earning** — ETH accumulates and can be claimed anytime
- **Non-custodial** — The contract holds the NFT, not any admin. Only the owner can withdraw.
- **No early cancellation** — Once rented, the rental runs to completion
- **Rental fee goes to owner** — Minus a small ETH fee to the ecosystem

## Operator Support

Every rental transaction supports operators. When users rent through your frontend, you earn a commission on the ETH fee. Rental is high-frequency activity — users renew regularly.

## For Owners: Passive Income

If you hold an NFT you're not actively using, listing it for rent is free income. Your NFT stays safe in the contract, earns ETH while rented, and you can withdraw it whenever it's not actively rented.

## For Renters: Smart Strategy

Compare the rental cost against your expected staking rewards:
- If the burn savings exceed the rental cost, renting is pure profit
- Higher-tier rentals save more but cost more — find the sweet spot
- Short-term rentals before big claims are the most capital-efficient

See also: [Reward Booster NFTs](./REWARD_BOOSTER_NFT.md) | [Staking](./STAKING.md) | [NFT Pools](./NFT_LIQUIDITY_POOLS.md)
