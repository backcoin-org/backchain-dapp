# Reward Booster NFTs

Four tiers of utility NFTs that directly increase your staking earnings. They reduce the burn rate when you claim mining rewards — the better the NFT, the more you keep.

**Contract:** `0x5507F70c71b8e1C694841E214fe8F9Dd7c899448` (ERC-721)

## The Four Tiers

| Tier | Boost | Burn Rate | You Keep | Color |
|------|-------|-----------|----------|-------|
| Diamond | 50% | 0% | 100% | Cyan |
| Gold | 40% | 10% | 90% | Yellow |
| Silver | 25% | 25% | 75% | Gray |
| Bronze | 10% | 40% | 60% | Amber |

Without any NFT, the standard burn rate is 50% — you lose half your rewards every time you claim. Even a Bronze NFT saves you 10% on every claim, and over hundreds of claims, that difference is massive.

## Why They Matter

Consider a staker earning 10,000 BKC in rewards:

| NFT | Burn | You Receive | Savings vs No NFT |
|-----|------|------------|-------------------|
| None | 5,000 BKC | 5,000 BKC | — |
| Bronze | 4,000 BKC | 6,000 BKC | +1,000 BKC |
| Silver | 2,500 BKC | 7,500 BKC | +2,500 BKC |
| Gold | 1,000 BKC | 9,000 BKC | +4,000 BKC |
| Diamond | 0 BKC | 10,000 BKC | +5,000 BKC |

A Diamond NFT holder earns twice as much as someone without an NFT, from the exact same staking position.

## How to Get One

Booster NFTs are traded on bonding curve pools. The price changes based on supply and demand — no listings, no auctions, instant trades.

| Pool | Address |
|------|---------|
| Bronze Pool | `0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD` |
| Silver Pool | `0xA8e76C5E21235fC2889A25Dff0769fFf5C784639` |
| Gold Pool | `0xbcDc78a2C985722C170153015957Acb73df08F89` |
| Diamond Pool | `0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea` |

See [NFT Pools](./NFT_LIQUIDITY_POOLS.md) for details on how bonding curve pricing works.

## Renting Instead of Buying

Can't afford a high-tier NFT? Rent one. The Rental Market lets you enjoy the staking boost without buying the NFT outright. Owners earn passive ETH income, renters save on burn rates.

See [Rental Market](./RENTAL.md) for details.

## Key Facts

- **ERC-721 standard** — Compatible with any NFT marketplace
- **Fixed supply** — Once minted, no new NFTs can be created
- **One active boost per wallet** — Your best NFT (owned or rented) is used
- **No admin functions** — Supply is permanent, no minting after configuration
- **Fully tradeable** — Buy, sell, rent, or transfer freely

## For Builders

NFT Pools support the Operator System. Every buy and sell transaction through your frontend earns you a commission on the ETH fee. Since NFT trading is frequent and high-value, this is one of the most profitable operator opportunities.

See also: [NFT Pools](./NFT_LIQUIDITY_POOLS.md) | [Rental Market](./RENTAL.md) | [Staking](./STAKING.md)
