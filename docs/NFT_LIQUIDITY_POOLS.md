# NFT Liquidity Pools

Automated bonding curve markets for trading Reward Booster NFTs. No listings, no auctions, no waiting — instant buy and sell at market price.

## Pool Addresses

| Tier | Address |
|------|---------|
| Bronze | `0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD` |
| Silver | `0xA8e76C5E21235fC2889A25Dff0769fFf5C784639` |
| Gold | `0xbcDc78a2C985722C170153015957Acb73df08F89` |
| Diamond | `0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea` |

## How Bonding Curves Work

Each pool uses the constant product formula (XY=K):

```
K = NFT_COUNT × BKC_BALANCE

Buy Price  = K / (NFT_COUNT - 1) - BKC_BALANCE
Sell Price = BKC_BALANCE - K / (NFT_COUNT + 1)
```

**The key insight:** Prices move automatically based on supply and demand. When more people buy, the price goes up. When more people sell, the price goes down. No order book needed.

### Price Example

Suppose a pool has 10 NFTs and 50,000 BKC (K = 500,000):

| Action | NFTs After | BKC After | Price |
|--------|-----------|-----------|-------|
| Buy 1 NFT | 9 | ~55,556 BKC | 5,556 BKC |
| Buy another | 8 | ~62,500 BKC | 6,944 BKC |
| Sell 1 NFT | 11 | ~45,455 BKC | 4,545 BKC |

Prices increase with each purchase and decrease with each sale — the classic bonding curve behavior.

## Fees

NFT Pool trades pay ETH fees only (gas-based):
- Each tier can have different ETH fee amounts
- Fees go to the ecosystem (operator, referrer, treasury, buyback)
- No BKC fee on trades

## Safety Features

- **Last NFT protection** — The pool won't sell its last NFT (always maintains liquidity)
- **Slippage protection** — Set maxPrice on buys and minPayout on sells to avoid surprises
- **No rug pull** — Pool liquidity (BKC) cannot be removed by anyone, ever
- **Immutable** — No admin functions, no parameter changes after deployment

## Trading Strategy

Since prices move with each trade:
- **Early buyers** get lower prices when the pool has more NFTs
- **Sellers** get better prices when the pool has fewer NFTs (high demand)
- **Arbitrage** is possible between bonding curves and the rental market

## Operator Support

Every NFT buy and sell transaction supports the Operator System. Pass your wallet as the operator to earn ETH commissions on trades through your frontend.

This is one of the most active trading markets in the ecosystem — great for operators who want consistent commission revenue.

See also: [Reward Booster NFTs](./REWARD_BOOSTER_NFT.md) | [Rental Market](./RENTAL.md) | [Fee Schedule](./FEES.md)
