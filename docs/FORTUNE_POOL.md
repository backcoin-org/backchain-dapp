# Fortune Pool

A provably fair on-chain game where players wager BKC tokens for a chance to win multiplied payouts. The game uses a commit-reveal mechanism — nobody (not even miners) can predict or manipulate the outcome.

**Contract:** `0x319bfC89f4d9F2364E7e454e4950ca6e440211ED`

## How It Works

1. **Choose tiers** — Pick Easy, Medium, Hard, or any combination
2. **Pick your numbers** — Guess a number within each tier's range
3. **Commit** — Your guesses are hashed with a secret and sent on-chain
4. **Wait** — 5 blocks pass (generates unpredictable randomness)
5. **Reveal** — The contract rolls numbers using future blockhash + game ID
6. **Win or lose** — If your guess matches, you win the multiplier

## Tiers

| Tier | Range | Multiplier | Win Chance | House Edge |
|------|-------|-----------|------------|------------|
| Easy | 1-4 | 3x | 25% | 25% |
| Medium | 1-20 | 15x | 5% | 25% |
| Hard | 1-100 | 75x | 1% | 25% |

All tiers have the same expected value (0.75x per wager). The difference is risk tolerance — Easy pays small wins often, Hard pays massive wins rarely.

## Combo Mode

Play multiple tiers in one game by combining them with a bitmask:

| Combo | Tiers Active | Max Multiplier |
|-------|-------------|----------------|
| 1 | Easy only | 3x |
| 2 | Medium only | 15x |
| 4 | Hard only | 75x |
| 3 | Easy + Medium | 18x (3 + 15) |
| 7 | All three | 93x (3 + 15 + 75) |

When you play multiple tiers, you pay one wager and each tier is rolled independently. Winnings stack.

## BKC Fee

Every wager has a 20% BKC fee:
- 80% of your wager enters the prize pool
- 20% goes to the ecosystem (burn + stakers + treasury + operator)

**Example:** You wager 1,000 BKC on Easy. 800 BKC goes to the prize pool. If you win, you get 3x your gross wager = 3,000 BKC.

## Prize Pool

- Funded by player wagers and direct funding
- **Cap: 1,000,000 BKC** — Any excess above the cap is burned
- **Max payout per game: 10% of pool** — This protects the pool from depletion
- Expired games (not revealed within 200 blocks) forfeit their wager to the pool

## Why It's Fair

The commit-reveal mechanism makes manipulation impossible:

1. When you commit, your guesses are hidden (hashed with a random secret)
2. The reveal block number is set 5 blocks in the future
3. The winning number is derived from `keccak256(blockhash, gameId, tierIndex)`
4. Nobody knows the blockhash until after it's mined — not you, not miners, not anyone

Even miners can't profit: they would need to both know your guess AND control the blockhash, which is economically impractical.

## ETH Fee

Each tier has its own ETH fee (gas-based), paid to the ecosystem. When playing combos, you pay the sum of all active tier fees.

## Operator Support

Operators earn commissions on Fortune Pool games. Every commit transaction can include an operator address, and they earn their share of both ETH and BKC fees.

## Pool Sustainability

The math is designed for long-term sustainability:
- Each tier has the same 25% house edge
- The pool retains approximately 5% of all wagers over time
- The 1M BKC cap prevents over-accumulation, burning excess
- Expired games add to the pool without any payout

This means the pool grows slowly while rewarding players fairly. It's not a casino that needs to break players — it's a self-sustaining game where the math works for both sides.

See also: [Fee Schedule](./FEES.md) | [Tokenomics](./TOKENOMICS.md)
