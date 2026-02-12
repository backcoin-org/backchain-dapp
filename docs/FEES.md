# Fee Schedule

All Backcoin fees are transparent and verifiable on-chain. The ecosystem uses a dual-fee model: ETH fees (gas-based) and BKC fees (value-based).

## How Fees Work

**ETH fees** are calculated based on network gas prices and a multiplier per action. They flow through the ecosystem to operators, referrers, treasury, and buyback.

**BKC fees** are a percentage of the BKC value involved in the transaction. They are split between burn, stakers, and treasury.

Both fee types support the Operator System — builders who run their own frontends earn a share automatically.

## Fee Distribution

### ETH Fee Flow
```
User pays ETH fee
    → Referrer cut (if referrer is set)
    → Operator cut (if operator is set)
    → Treasury
    → Buyback accumulator (feeds the Miner)
```

### BKC Fee Flow
```
User pays BKC fee
    → Burn (reduces total supply)
    → Staking Pool (rewards for delegators)
    → Treasury
```

## Service Fees

### Staking
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Delegate (Stake) | Gas-based | None |
| Claim Rewards | Gas-based | None |
| Force Unstake | Gas-based | 10% penalty (burned) |

### Fortune Pool
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Play Easy (1-4, 3x) | Gas-based per tier | 20% of wager |
| Play Medium (1-20, 15x) | Gas-based per tier | 20% of wager |
| Play Hard (1-100, 75x) | Gas-based per tier | 20% of wager |
| Combo (multiple tiers) | Sum of active tiers | 20% of wager |

### NFT Pools (Bonding Curve)
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Buy NFT (any tier) | Gas-based per tier | None |
| Sell NFT (any tier) | Gas-based per tier | None |

### NFT Rental
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Rent an NFT | Gas-based | None |
| List for Rent | None | None |

### Agora (Social)
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Create Post | Gas-based (varies by media type) | None |
| Reply | Gas-based | None |
| Like | Free | None |
| SuperLike | 100 gwei per like | None |
| Downvote | 100 gwei per vote | None |
| Register Username | Length-based pricing | None |

### Notary
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Certify Document | Gas-based | None |
| Batch Certify | Gas-based (per document) | None |
| Verify Document | Free | Free |

### Charity
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Create Campaign | Gas-based (small) | None |
| Donate | Value-based (% of donation) | None |

### Liquidity Pool
| Action | ETH Fee | BKC Fee |
|--------|---------|---------|
| Swap ETH/BKC | 0.3% swap fee | None |
| Add Liquidity | None | None |
| Remove Liquidity | None | None |

## Why Fees Exist

Fees aren't a tax — they're the fuel that powers the entire ecosystem:

1. **Operators earn** from every transaction on their frontend
2. **Referrers earn** for bringing new users
3. **Stakers earn** through buyback mining cycles
4. **Burns reduce supply** — making remaining BKC more scarce
5. **Treasury funds** ecosystem growth and maintenance

The more activity, the more fees, the more everyone earns. It's a positive-sum system.

## Fee Configuration

Fees are configured in the BackchainEcosystem contract and can be adjusted through the [Governance](./GOVERNANCE.md) process. The ecosystem enforces maximum bounds:

- Max ETH fee: 50% (5,000 basis points)
- Max gas multiplier: 2,000,000x
- Max gas estimate: 30,000,000

These limits are hardcoded and cannot be bypassed by governance.

See also: [Tokenomics](./TOKENOMICS.md) | [Operator Guide](./BE_YOUR_OWN_CEO.md) | [Mining](./MINING.md)
