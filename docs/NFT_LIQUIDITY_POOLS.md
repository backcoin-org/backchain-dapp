# Backchain Protocol

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   "I may not agree with what you say, but I will defend to the death            ║
║    your right to say it."                                                         ║
║                                                                     — Voltaire    ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

| | |
|---|---|
| **Project** | Backchain Protocol |
| **Philosophy** | Unstoppable & Permissionless DeFi Infrastructure |
| **Network** | Arbitrum One |
| **Status** | Testnet Live (Arbitrum Sepolia) |
| **Website** | [backcoin.org](https://backcoin.org) |
| **Documentation** | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **YouTube** | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |
| **Contact** | dev@backcoin.org |

---

**Document:** NFT Liquidity Pools — Instant & Permissionless NFT Trading  
**Version:** 2.0.0 (V6 with Operator System)  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# NFT Liquidity Pools

## Trade NFTs Without Permission

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUY. SELL. INSTANTLY. NO MIDDLEMAN.                            ║
║                                                                                   ║
║   Just as Voltaire fought against gatekeepers of knowledge,                      ║
║   we fight against gatekeepers of liquidity.                                     ║
║                                                                                   ║
║   No order books. No waiting for buyers.                                         ║
║   No marketplace approval. No listing fees.                                      ║
║                                                                                   ║
║   Just you, the smart contract, and instant execution.                           ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Buy and sell Reward Booster NFTs instantly using AMM-style liquidity pools. No waiting for buyers, no order books, no permission needed.

---

## 📍 Contract Information

| Property | Value |
|----------|-------|
| **Factory** | `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` |
| **Implementation** | `0x9E857BE855C8397B188131Be6B85456C7b9d8dB7` |
| **NFT Contract** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` |
| **Network** | Arbitrum Sepolia |
| **Token** | BKC + ETH (V6) |
| **Pools** | 4 (Diamond, Gold, Silver, Bronze) |
| **Operator Support** | ⚡ Yes |

---

## 🌍 Become an Operator

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD AN NFT MARKETPLACE. EARN COMMISSIONS.                    ║
║                                                                                   ║
║   Anyone in the world can:                                                        ║
║                                                                                   ║
║   1. Build their own NFT trading interface                                       ║
║   2. Pass their wallet address as the "operator" parameter                       ║
║   3. Earn BKC + ETH from EVERY trade through their interface                     ║
║                                                                                   ║
║   No registration. No approval. No KYC.                                          ║
║   Just build and earn from every buy/sell transaction.                           ║
║                                                                                   ║
║   V6 NEW: Operators earn BOTH BKC fees AND ETH fees!                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 💎 Pool Addresses

Each Reward Booster tier has its own pool. **All pools support the operator system!**

| Tier | Burn Reduction | Pool Address | Operator |
|------|----------------|--------------|----------|
| **Diamond** | 0% (no burn) | `0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020` | ⚡ Yes |
| **Gold** | 25% burn | `0x9390e12c910C4d2E0796FA754e5C450969F09886` | ⚡ Yes |
| **Silver** | 35% burn | `0x016549ee056442eC30a916335f66ad5183E3fF5b` | ⚡ Yes |
| **Bronze** | 50% burn | `0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8` | ⚡ Yes |

### What is Burn Reduction?

When you unstake BKC from DelegationManager, a portion is burned. Holding or renting a Reward Booster NFT **reduces this burn penalty**:

| NFT Tier | Burn When Unstaking |
|----------|---------------------|
| No NFT | 50% burned |
| Bronze | 50% burned |
| Silver | 35% burned |
| Gold | 25% burned |
| **Diamond** | **0% burned** |

**Diamond = No penalty when unstaking!**

---

## ⚡ How It Works

### AMM Bonding Curve

Price is determined automatically by supply and demand in the pool:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   BONDING CURVE PRICING                                                          ║
║   ═════════════════════                                                          ║
║                                                                                   ║
║   More NFTs in pool     →    Lower price                                         ║
║   Fewer NFTs in pool    →    Higher price                                        ║
║                                                                                   ║
║   Price adjusts AUTOMATICALLY with every trade.                                  ║
║   No manipulation possible. Pure math.                                           ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Buy Flow (V6)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   BUY NFT FLOW                                                                   ║
║   ════════════                                                                   ║
║                                                                                   ║
║   1. User calls buy(operator) with BKC + ETH                                     ║
║           │                                                                       ║
║           ▼                                                                       ║
║   2. Pool calculates price (bonding curve)                                       ║
║           │                                                                       ║
║           ▼                                                                       ║
║   3. User pays: BKC price + BKC fee + ETH fee                                    ║
║           │                                                                       ║
║           ▼                                                                       ║
║   4. Fees distributed to: Operator ⚡ + Stakers + Treasury                       ║
║           │                                                                       ║
║           ▼                                                                       ║
║   5. Pool sends NFT to user                                                      ║
║           │                                                                       ║
║           ▼                                                                       ║
║   6. Price increases for next buyer                                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Sell Flow (V6)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   SELL NFT FLOW                                                                  ║
║   ═════════════                                                                  ║
║                                                                                   ║
║   1. User calls sell(tokenId, operator) with ETH fee                             ║
║           │                                                                       ║
║           ▼                                                                       ║
║   2. Pool calculates price (bonding curve)                                       ║
║           │                                                                       ║
║           ▼                                                                       ║
║   3. User sends NFT to pool + ETH fee                                            ║
║           │                                                                       ║
║           ▼                                                                       ║
║   4. Fees distributed to: Operator ⚡ + Stakers + Treasury                       ║
║           │                                                                       ║
║           ▼                                                                       ║
║   5. Pool pays BKC - BKC fee to user                                             ║
║           │                                                                       ║
║           ▼                                                                       ║
║   6. Price decreases for next seller                                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 💰 V6 Fee Structure

V6 introduces **dual fees** (BKC + ETH) with operator support:

| Action | BKC Fee | ETH Fee | Operator Earns |
|--------|---------|---------|----------------|
| **Buy NFT** | ~5% of price | Dynamic | ⚡ Both BKC + ETH |
| **Sell NFT** | ~10% of price | Dynamic | ⚡ Both BKC + ETH |

### Fee Distribution

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   FEE DISTRIBUTION                                                               ║
║   ════════════════                                                               ║
║                                                                                   ║
║   BKC FEES:                          ETH FEES:                                   ║
║   ─────────                          ─────────                                   ║
║   → Operator ⚡ (commission)          → Operator ⚡ (commission)                  ║
║   → Stakers (rewards)                → Stakers (rewards)                         ║
║   → Treasury (protocol)              → Treasury (protocol)                       ║
║   → Burn (deflationary)                                                          ║
║                                                                                   ║
║   Operators earn from BOTH fee types!                                            ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🔧 Smart Contract Interface (V6)

### Key Functions

```solidity
// ═══════════════════════════════════════════════════════════════════════════════
// BUY NFT (V6 - with operator and ETH fee)
// ═══════════════════════════════════════════════════════════════════════════════
function buy(
    address _operator  // ⚡ Operator earns commission!
) external payable returns (uint256 tokenId);

// Buy specific token ID
function buySpecific(
    uint256 _tokenId,
    address _operator  // ⚡ Operator earns commission!
) external payable returns (uint256 tokenId);

// ═══════════════════════════════════════════════════════════════════════════════
// SELL NFT (V6 - with operator and ETH fee)
// ═══════════════════════════════════════════════════════════════════════════════
function sell(
    uint256 _tokenId,
    address _operator  // ⚡ Operator earns commission!
) external payable returns (uint256 payout);

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get current buy price (BKC)
function getBuyPrice() external view returns (uint256);

// Get current sell price (BKC)
function getSellPrice() external view returns (uint256);

// Get required ETH fee for buy
function getBuyEthFee() external view returns (uint256);

// Get required ETH fee for sell
function getSellEthFee() external view returns (uint256);

// Get pool balance
function getPoolBalance() external view returns (
    uint256 nftCount,
    uint256 bkcBalance
);

// Get tier info
function getTier() external view returns (uint8);

// Get pool statistics
function getPoolStats() external view returns (
    uint256 nftCount,
    uint256 bkcBalance,
    uint256 totalVolume,
    uint256 buyPrice,
    uint256 sellPrice
);
```

### Events

```solidity
// Emitted on buy
event NFTBought(
    address indexed buyer,
    uint256 indexed tokenId,
    uint256 bkcPaid,
    uint256 ethPaid,
    address indexed operator
);

// Emitted on sell
event NFTSold(
    address indexed seller,
    uint256 indexed tokenId,
    uint256 bkcReceived,
    uint256 ethPaid,
    address indexed operator
);

// Emitted when fees are distributed
event FeesDistributed(
    uint256 bkcToOperator,
    uint256 bkcToStakers,
    uint256 bkcBurned,
    uint256 ethToOperator,
    address indexed operator
);
```

---

## 💻 JavaScript Integration (V6)

### Buy an NFT

```javascript
import { ethers } from 'ethers';

const GOLD_POOL = '0x9390e12c910C4d2E0796FA754e5C450969F09886';
const BKC_TOKEN = '0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396';
const MY_OPERATOR_ADDRESS = '0xYourAddress'; // YOUR address to earn commissions!

const poolABI = [
    "function buy(address _operator) external payable returns (uint256)",
    "function sell(uint256 _tokenId, address _operator) external payable returns (uint256)",
    "function getBuyPrice() view returns (uint256)",
    "function getSellPrice() view returns (uint256)",
    "function getBuyEthFee() view returns (uint256)",
    "function getSellEthFee() view returns (uint256)",
    "event NFTBought(address indexed buyer, uint256 indexed tokenId, uint256 bkcPaid, uint256 ethPaid, address indexed operator)"
];

const bkcABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

async function buyNFT(signer) {
    const pool = new ethers.Contract(GOLD_POOL, poolABI, signer);
    const bkc = new ethers.Contract(BKC_TOKEN, bkcABI, signer);
    
    // Get prices
    const bkcPrice = await pool.getBuyPrice();
    const ethFee = await pool.getBuyEthFee();
    
    console.log('═══════════════════════════════════════════════');
    console.log('BUY NFT');
    console.log('═══════════════════════════════════════════════');
    console.log('BKC Price:', ethers.formatEther(bkcPrice), 'BKC');
    console.log('ETH Fee:', ethers.formatEther(ethFee), 'ETH');
    
    // Approve BKC (include buffer for fees)
    const totalBkc = bkcPrice * 110n / 100n; // 10% buffer
    await bkc.approve(GOLD_POOL, totalBkc);
    
    // Buy NFT (pass YOUR address as operator to earn from YOUR interface!)
    const tx = await pool.buy(MY_OPERATOR_ADDRESS, { value: ethFee });
    const receipt = await tx.wait();
    
    // Parse event
    const iface = new ethers.Interface(poolABI);
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'NFTBought') {
                console.log('NFT Token ID:', parsed.args.tokenId.toString());
                console.log('BKC Paid:', ethers.formatEther(parsed.args.bkcPaid));
                console.log('ETH Paid:', ethers.formatEther(parsed.args.ethPaid));
                console.log('Operator:', parsed.args.operator);
            }
        } catch {}
    }
}
```

### Sell an NFT

```javascript
async function sellNFT(tokenId, signer) {
    const pool = new ethers.Contract(GOLD_POOL, poolABI, signer);
    const nft = new ethers.Contract(NFT_ADDRESS, ERC721_ABI, signer);
    
    // Get prices
    const bkcPayout = await pool.getSellPrice();
    const ethFee = await pool.getSellEthFee();
    
    console.log('═══════════════════════════════════════════════');
    console.log('SELL NFT');
    console.log('═══════════════════════════════════════════════');
    console.log('BKC Payout:', ethers.formatEther(bkcPayout), 'BKC');
    console.log('ETH Fee:', ethers.formatEther(ethFee), 'ETH');
    
    // Approve NFT
    await nft.approve(GOLD_POOL, tokenId);
    
    // Sell NFT (pass YOUR address as operator!)
    const tx = await pool.sell(tokenId, MY_OPERATOR_ADDRESS, { value: ethFee });
    await tx.wait();
    
    console.log('NFT sold! BKC received.');
}
```

### Check All Pool Prices

```javascript
async function checkAllPrices(provider) {
    const pools = {
        Diamond: '0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020',
        Gold: '0x9390e12c910C4d2E0796FA754e5C450969F09886',
        Silver: '0x016549ee056442eC30a916335f66ad5183E3fF5b',
        Bronze: '0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8'
    };
    
    console.log('═══════════════════════════════════════════════');
    console.log('NFT POOL PRICES');
    console.log('═══════════════════════════════════════════════');
    
    for (const [tier, address] of Object.entries(pools)) {
        const pool = new ethers.Contract(address, poolABI, provider);
        const buyPrice = await pool.getBuyPrice();
        const sellPrice = await pool.getSellPrice();
        const buyEth = await pool.getBuyEthFee();
        
        console.log(`\n${tier}:`);
        console.log(`  Buy: ${ethers.formatEther(buyPrice)} BKC + ${ethers.formatEther(buyEth)} ETH`);
        console.log(`  Sell: ${ethers.formatEther(sellPrice)} BKC (you receive)`);
    }
}
```

---

## 📊 Price Impact

Large trades affect the price more than small ones:

| Trade Size | Price Impact |
|------------|--------------|
| Small (1-2 NFTs) | Minimal |
| Medium (3-5 NFTs) | Moderate |
| Large (10+ NFTs) | Significant |

**This is by design** — it prevents whales from draining pools and ensures fair prices for everyone.

---

## 🔄 Arbitrage Opportunities

Price differences create permissionless arbitrage opportunities:

| Scenario | Action | Anyone Can Do It |
|----------|--------|------------------|
| Pool price < Market | Buy from pool, sell elsewhere | ✅ Yes |
| Pool price > Market | Buy elsewhere, sell to pool | ✅ Yes |

**No permission needed.** Arbitrage keeps prices aligned with broader market.

---

## 🏆 Why AMM for NFTs?

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   TRADITIONAL NFT MARKETPLACE          BACKCHAIN NFT POOLS                       ║
║   ═════════════════════════            ══════════════════                        ║
║                                                                                   ║
║   ❌ Wait for buyer/seller              ✅ Instant execution                      ║
║   ❌ Listing fees                        ✅ No listing fees                       ║
║   ❌ Marketplace approval               ✅ Permissionless                         ║
║   ❌ Opaque pricing                     ✅ Transparent bonding curve             ║
║   ❌ Can be censored                    ✅ Unstoppable smart contract            ║
║   ❌ Platform takes cut                 ✅ YOU can be the operator               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| **NFT Pool Factory** | `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` | Pool deployment |
| **Pool Implementation** | `0x9E857BE855C8397B188131Be6B85456C7b9d8dB7` | Pool logic |
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | NFT contract |
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Payment |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | Fee processing |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | Configuration |

---

## 📞 Support

| Channel | Link |
|---------|------|
| **Documentation** | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **Email** | dev@backcoin.org |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |

---

## 📄 License

MIT License — The code is free, just like the protocol.

---

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                        BUILT BY BACKCHAIN PROTOCOL                                ║
║                                                                                   ║
║   NFT Liquidity Pools are not just a feature. They're freedom.                   ║
║                                                                                   ║
║   Freedom to buy without permission.                                              ║
║   Freedom to sell without waiting.                                                ║
║   Freedom to build and earn as an operator.                                       ║
║                                                                                   ║
║   No gatekeepers. No middlemen. No censorship.                                   ║
║   Just code, math, and instant execution.                                         ║
║                                                                                   ║
║                          THE POOLS ARE UNSTOPPABLE.                               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All pool data is verifiable on-chain. Trust the code, not the words.*
