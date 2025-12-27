# Backcoin Protocol

| | |
|---|---|
| **Project** | Backcoin Protocol |
| **Description** | Modular DeFi Infrastructure for Real-World Utility |
| **Network** | Arbitrum One |
| **Status** | Testnet Live (Arbitrum Sepolia) |
| **Website** | [backcoin.org](https://backcoin.org) |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **YouTube** | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |
| **Contact** | dev@backcoin.org |

---

**Document:** NFT Liquidity Pools — AMM Trading for NFTs  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# NFT Liquidity Pools

Buy and sell Reward Booster NFTs instantly using AMM-style liquidity pools. No waiting for buyers, no order books.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Factory** | `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423` |
| **Network** | Arbitrum Sepolia |
| **NFT Contract** | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` |
| **Token** | BKC |
| **Pools** | 7 (one per tier) |

---

## What Are NFT Liquidity Pools?

Traditional NFT trading requires finding a buyer/seller. Our pools enable:

- **Instant buys** — Get an NFT immediately at market price
- **Instant sells** — Sell your NFT back to the pool anytime
- **Automatic pricing** — Bonding curve determines price
- **Always liquid** — Pool always has NFTs and BKC

---

## Pool Addresses

Each Reward Booster tier has its own pool:

| Tier | Discount | Pool Address | Initial Liquidity |
|------|----------|--------------|-------------------|
| **Diamond** | 70% | `0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9` | 1,000,000 BKC |
| **Platinum** | 60% | `0x76Edd1f3c42f607a92b9354D14F5F25278403808` | 1,000,000 BKC |
| **Gold** | 50% | `0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B` | 1,000,000 BKC |
| **Silver** | 40% | `0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4` | 1,000,000 BKC |
| **Bronze** | 30% | `0x9eFB21b279873D04e337c371c90fF00130aB8581` | 1,000,000 BKC |
| **Iron** | 20% | `0x99259cF2cE5158fcC995aCf6282574f6563a048e` | 1,000,000 BKC |
| **Crystal** | 10% | `0xe7Ae6A7B48460b3c581158c80F67E566CC800271` | 1,000,000 BKC |

**Total TGE Allocation:** 7,000,000 BKC (1M per pool)

---

## How It Works

### Bonding Curve Pricing

Price is determined by supply and demand in the pool:

```
More NFTs in pool     →    Lower price
Fewer NFTs in pool    →    Higher price
```

### Buy Flow

```
1. User wants to buy NFT
        │
        ▼
2. Pool calculates price (bonding curve)
        │
        ▼
3. User pays BKC + fee
        │
        ▼
4. Pool sends NFT to user
        │
        ▼
5. Price increases for next buyer
```

### Sell Flow

```
1. User wants to sell NFT
        │
        ▼
2. Pool calculates price (bonding curve)
        │
        ▼
3. User sends NFT to pool
        │
        ▼
4. Pool pays BKC - fee to user
        │
        ▼
5. Price decreases for next seller
```

---

## Fees

| Action | Fee |
|--------|-----|
| **Buy NFT** | Configurable |
| **Sell NFT** | Configurable |

### Fee Distribution

Fees flow to MiningManager for distribution:
- Portion to stakers
- Portion to treasury

---

## Price Impact

Large trades affect the price more than small ones:

| Trade Size | Price Impact |
|------------|--------------|
| Small | Minimal impact |
| Medium | Moderate impact |
| Large | Significant impact |

### Example

If pool has 100 NFTs at 1,000 BKC base price:

| Action | Price Change |
|--------|--------------|
| Buy 1 NFT | Price increases slightly |
| Buy 10 NFTs | Price increases more |
| Sell 5 NFTs | Price decreases |

---

## Using the Pools

### Buy an NFT

```javascript
import { ethers } from 'ethers';

const GOLD_POOL = '0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B';
const BKC = '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f';

async function buyNFT(signer) {
    const pool = new ethers.Contract(GOLD_POOL, POOL_ABI, signer);
    
    // Get current price
    const price = await pool.getBuyPrice();
    console.log('Price:', ethers.formatEther(price), 'BKC');
    
    // Approve BKC
    const bkc = new ethers.Contract(BKC, ERC20_ABI, signer);
    await bkc.approve(GOLD_POOL, price);
    
    // Buy
    const tx = await pool.buy();
    await tx.wait();
    
    console.log('NFT purchased!');
}
```

### Sell an NFT

```javascript
async function sellNFT(tokenId, signer) {
    const pool = new ethers.Contract(GOLD_POOL, POOL_ABI, signer);
    const nft = new ethers.Contract(NFT_ADDRESS, ERC721_ABI, signer);
    
    // Get current price
    const price = await pool.getSellPrice();
    console.log('Sell price:', ethers.formatEther(price), 'BKC');
    
    // Approve NFT
    await nft.approve(GOLD_POOL, tokenId);
    
    // Sell
    const tx = await pool.sell(tokenId);
    await tx.wait();
    
    console.log('NFT sold!');
}
```

### Check Prices

```javascript
async function checkPrices(provider) {
    const pools = {
        Diamond: '0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9',
        Platinum: '0x76Edd1f3c42f607a92b9354D14F5F25278403808',
        Gold: '0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B',
        Silver: '0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4',
        Bronze: '0x9eFB21b279873D04e337c371c90fF00130aB8581',
        Iron: '0x99259cF2cE5158fcC995aCf6282574f6563a048e',
        Crystal: '0xe7Ae6A7B48460b3c581158c80F67E566CC800271'
    };
    
    for (const [tier, address] of Object.entries(pools)) {
        const pool = new ethers.Contract(address, POOL_ABI, provider);
        const buyPrice = await pool.getBuyPrice();
        const sellPrice = await pool.getSellPrice();
        
        console.log(`${tier}:`);
        console.log(`  Buy: ${ethers.formatEther(buyPrice)} BKC`);
        console.log(`  Sell: ${ethers.formatEther(sellPrice)} BKC`);
    }
}
```

---

## Smart Contract Interface

### Key Functions

```solidity
// Buy NFT from pool
function buy() external returns (uint256 tokenId);

// Sell NFT to pool
function sell(uint256 tokenId) external returns (uint256 payout);

// View functions
function getBuyPrice() external view returns (uint256);
function getSellPrice() external view returns (uint256);
function getPoolBalance() external view returns (uint256 nftCount, uint256 bkcBalance);
function getTier() external view returns (uint8);
```

---

## Pool Statistics

Each pool tracks:

| Metric | Description |
|--------|-------------|
| NFT Count | Number of NFTs in pool |
| BKC Balance | Amount of BKC in pool |
| Total Volume | All-time trading volume |
| Buy Price | Current price to buy |
| Sell Price | Current price to sell |

---

## Arbitrage Opportunities

Price differences between pools and external markets create opportunities:

| Scenario | Action |
|----------|--------|
| Pool price < Market | Buy from pool, sell elsewhere |
| Pool price > Market | Buy elsewhere, sell to pool |

This keeps prices aligned with broader market.

---

## Why AMM for NFTs?

| Benefit | Description |
|---------|-------------|
| **Instant Liquidity** | No waiting for counterparty |
| **Price Discovery** | Market determines value |
| **Always Available** | Trade 24/7 |
| **Transparent** | All prices on-chain |
| **No Order Book** | Simpler UX |

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| NFT Pool Factory | `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423` | Pool deployment |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | NFT contract |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Payment |
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | Fee processing |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All pool data is verifiable on-chain.*
