# @backchain/fortune

Fortune module for the Backchain DeFi ecosystem on opBNB. Provably fair commit-reveal lottery with three risk tiers.

## Install

```bash
npm install @backchain/fortune
```

## Quick Start

```js
import { FortuneModule } from '@backchain/fortune';

const fortune = new FortuneModule(context); // context from @backchain/core
const { gameId, secret } = await fortune.play(ethers.parseEther('0.01'), [3], 0b001);
// wait for the reveal delay (~60s on opBNB), then reveal
await fortune.reveal(gameId, [3], secret);
const result = await fortune.getGameResult(gameId);
```

## API

### Tiers

| Tier | Odds     | Multiplier |
|------|----------|------------|
| 0    | 1 in 5   | 2x         |
| 1    | 1 in 10  | 5x         |
| 2    | 1 in 150 | 100x       |

### Write Methods

**`play(wagerAmount: bigint, guesses: number[], tierMask: number): Promise<PlayResult>`**
Commit to a game. `wagerAmount` is the BNB bet. `guesses` is an array of numbers the player predicts. `tierMask` is a bitmask selecting which tiers to participate in (bit 0 = Tier 0, bit 1 = Tier 1, bit 2 = Tier 2). Returns `{ gameId, secret }`. Store `secret` — it is required to reveal.

**`reveal(gameId: bigint, guesses: number[], secret: string): Promise<TransactionResult>`**
Reveal a committed game. Must be called after the reveal delay has passed (approximately 60 seconds). Provide the same `guesses` and the `secret` returned by `play`. If the player wins, BNB is transferred automatically.

### Read Methods

**`getGame(gameId: bigint): Promise<Game>`**
Returns full state of a game: player address, wager, tiers, commit hash, reveal block, status, and payout.

**`getGameResult(gameId: bigint): Promise<GameResult>`**
Returns the outcome of a revealed game: whether the player won, the winning number drawn, the player's guesses, and the payout amount.

**`getGameStatus(gameId: bigint): Promise<GameStatus>`**
Returns a simple status string for a game: `'pending'`, `'ready_to_reveal'`, `'revealed'`, or `'expired'`.

**`getTierInfo(tier: number): Promise<TierInfo>`**
Returns configuration for a tier: range of valid numbers, multiplier, and current pool balance available for payouts.

## License

MIT
