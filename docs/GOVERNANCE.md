# Governance — Progressive Decentralization

Backcoin follows a progressive decentralization model. The system starts with a single admin for fast iteration, then gradually transfers control to the community through a series of irreversible steps.

**Contract:** `0xA82F69f079566958c16F601A9625E40AeEeFbFf8`

## The Four Phases

Each phase is a one-way transition. Once you advance, you can never go back.

### Phase 1: Admin Only (Current)
- Single admin wallet controls ecosystem parameters
- Changes execute instantly
- Allows rapid iteration during testnet and early mainnet

### Phase 2: Multisig
- Admin transfers control to a Gnosis Safe (multi-signature wallet)
- Multiple signers must agree on any change
- Still instant execution, but no single person can act alone

### Phase 3: Timelock
- All changes must be queued with a time delay (1 hour to 30 days)
- Anyone can inspect pending changes before they execute
- 7-day grace period — if a change isn't executed in time, it expires
- Community has time to react to any proposed change

### Phase 4: DAO
- Community members propose and vote on changes
- Proposals execute through the timelock
- Full community control over ecosystem parameters
- The original team has no special privileges

## What Can Governance Change?

Governance controls **only** the BackchainEcosystem contract parameters:
- Fee amounts and multipliers
- Fee distribution splits (operator, referrer, treasury, buyback)
- BKC distribution parameters (burn, stakers, treasury)
- Treasury and buyback addresses

## What Governance Cannot Change

All other contracts are immutable. Governance cannot:
- Pause or freeze any contract
- Change the BKC token supply or minting rules
- Modify the Staking Pool mechanics
- Alter the Fortune Pool tiers or odds
- Change NFT Booster burn rates
- Modify the Liquidity Pool swap fee
- Blacklist or freeze any user's tokens
- Upgrade or replace any deployed contract

This is by design. The core protocol is unstoppable — governance only fine-tunes the economic parameters.

## Safety Bounds

Even with full DAO control, the ecosystem enforces hardcoded limits:
- Max ETH fee: 50% (cannot charge more)
- Max gas multiplier: 2,000,000x
- Max gas estimate: 30,000,000

These limits are in the contract code and cannot be changed by governance or any admin.

## Why Progressive?

Day one DAO governance sounds great in theory, but in practice:
- Early-stage protocols need to iterate fast
- Token distribution needs time to become broad enough for fair voting
- Smart contract parameters need testing before locking down

By starting centralized and progressively decentralizing, Backcoin gets the best of both worlds: agility when it's needed, and full community control when the system is mature.

## Timeline

There's no fixed timeline for phase transitions. Each advancement happens when the community and ecosystem are ready. The key guarantee is that **every transition is irreversible** — once control is distributed, it can never be recentralized.

See also: [Tokenomics](./TOKENOMICS.md) | [Contract Addresses](./CONTRACTS.md)
