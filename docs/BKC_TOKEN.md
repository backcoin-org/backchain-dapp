# BKC Token

BKC is the native token of the Backcoin ecosystem. It powers staking, gaming, trading, social engagement, and governance across all protocol services.

**Contract:** `0x1c8B7951ae769871470e9a8951d01dB39AA34123`

## Token Specs

| Property | Value |
|----------|-------|
| Name | Backcoin |
| Symbol | BKC |
| Decimals | 18 |
| Max Supply | 200,000,000 BKC (hard cap, forever) |
| Standard | ERC-20 + EIP-2612 Permit |

## Distribution

The supply is split into two parts:

- **40M BKC (20%)** — Minted at launch for initial liquidity, ecosystem growth, and faucet distribution
- **160M BKC (80%)** — Released gradually through the Buyback Miner as activity rewards

There is zero allocation for team, advisors, VCs, or private investors. Every BKC token either went to liquidity or goes directly to active users.

## Key Features

**Hard cap.** The 200M supply limit is coded into the contract and cannot be changed. No inflation, no surprise minting, no governance vote can increase it. Ever.

**Activity-based minting.** New BKC is only created when the Buyback Miner converts protocol fees into rewards. The more people use Backcoin, the more BKC enters circulation — but always within the 200M cap.

**Deflationary pressure.** Multiple burn mechanisms reduce circulating supply over time:
- Staking claim burn (up to 50% without NFT boost)
- Buyback Miner burns 5% per cycle
- Fortune Pool BKC fees include a burn component
- Anyone can burn their own tokens voluntarily

**Gasless approvals.** BKC supports EIP-2612 Permit, so users can approve token spending without a separate transaction. This saves gas and improves the user experience.

**No admin backdoors.** Once deployed, the token contract has no pause function, no blacklist, no transfer restrictions. It works the same way for everyone, forever.

## How BKC Gets Created

1. Users interact with Backcoin services (staking, gaming, trading, etc.)
2. Each interaction generates ETH fees
3. ETH accumulates in the ecosystem contract
4. Anyone can trigger the Buyback Miner (and earn 5% for doing it)
5. The Miner buys BKC from the liquidity pool and mints new BKC based on scarcity
6. Rewards flow to stakers

The mining rate decreases as supply grows — this is the scarcity curve. When supply is low, mining is generous. As supply approaches the cap, new minting slows down and eventually stops. After that, staker rewards come purely from buybacks (real yield).

## Where BKC Is Used

| Service | BKC Usage |
|---------|----------|
| Staking | Lock BKC to earn rewards |
| Fortune Pool | Wager BKC (20% fee, 80% to prize pool) |
| NFT Pools | Buy/sell Booster NFTs with BKC |
| Agora | Pay BKC fees for social features |
| Notary | Pay BKC fees for certifications |

## For Developers

```javascript
// Add BKC to MetaMask
const BKC = {
    address: "0x1c8B7951ae769871470e9a8951d01dB39AA34123",
    symbol: "BKC",
    decimals: 18,
    image: "https://backcoin.org/assets/bkc_logo.png"
};
```

See also: [Tokenomics](./TOKENOMICS.md) | [Mining](./MINING.md) | [Staking](./STAKING.md)
