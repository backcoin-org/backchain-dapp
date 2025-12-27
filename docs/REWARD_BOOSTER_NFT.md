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

**Document:** Reward Booster NFT — Utility NFT Collection  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Reward Booster NFT

Utility NFTs that provide fee discounts across all Backcoin Protocol services.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` |
| **Network** | Arbitrum Sepolia |
| **Standard** | ERC-721 |
| **Tiers** | 7 (Crystal to Diamond) |

---

## What Are Reward Booster NFTs?

These are **utility NFTs** that:

- Provide **fee discounts** on all protocol services
- Can be **bought/sold** in NFT Liquidity Pools
- Can be **rented** for temporary utility
- Have **real value** tied to fee savings

---

## NFT Tiers

### 7 Tiers with Different Discounts

| Tier | Discount | Rarity | Color |
|------|----------|--------|-------|
| **Diamond** | 70% | Ultra Rare | 💎 Blue |
| **Platinum** | 60% | Very Rare | ⬜ Silver |
| **Gold** | 50% | Rare | 🟨 Gold |
| **Silver** | 40% | Uncommon | ⬜ Light Gray |
| **Bronze** | 30% | Common | 🟫 Bronze |
| **Iron** | 20% | Common | ⬛ Dark Gray |
| **Crystal** | 10% | Starter | 🔷 Cyan |

### Discount Application

Discounts apply to ALL protocol services:

| Service | Base Fee | With Gold (50%) | With Diamond (70%) |
|---------|----------|-----------------|-------------------|
| Staking Entry | 100 BKC | 50 BKC | 30 BKC |
| Staking Exit | 100 BKC | 50 BKC | 30 BKC |
| Fortune Pool | 100 BKC | 50 BKC | 30 BKC |
| Notary | 100 BKC | 50 BKC | 30 BKC |
| NFT Buy | 100 BKC | 50 BKC | 30 BKC |

---

## How to Get NFTs

### Option 1: Buy from Liquidity Pools

Each tier has its own AMM pool:

| Tier | Pool Address |
|------|--------------|
| Diamond | `0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9` |
| Platinum | `0x76Edd1f3c42f607a92b9354D14F5F25278403808` |
| Gold | `0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B` |
| Silver | `0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4` |
| Bronze | `0x9eFB21b279873D04e337c371c90fF00130aB8581` |
| Iron | `0x99259cF2cE5158fcC995aCf6282574f6563a048e` |
| Crystal | `0xe7Ae6A7B48460b3c581158c80F67E566CC800271` |

**Factory:** `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423`

### Option 2: Rent from Marketplace

Don't want to buy? Rent for temporary use:

**Rental Contract:** `0xD387B3Fd06085676e85130fb07ae06D675cb201f`

### Option 3: Secondary Market

Trade on any NFT marketplace that supports Arbitrum.

---

## NFT Utility

### Fee Discounts

The primary utility — automatic fee reduction:

```
When user interacts with any service:
    │
    ▼
Check wallet for Reward Booster NFT
    │
    ├─► Found → Apply highest tier discount
    │
    └─► Not found → Full fee applies
```

### Multiple NFTs

If you own multiple NFTs:
- **Highest tier applies** (discounts don't stack)
- You can sell/rent lower tier NFTs for income

### Rental Utility

NFT owners can rent out for passive income:
- Set your rental price
- Earn while keeping ownership
- Utility transferred to renter during rental period

---

## Value Proposition

### Why NFTs Have Real Value

| Factor | Explanation |
|--------|-------------|
| **Utility** | Real fee savings on every transaction |
| **Scarcity** | Limited supply in pools |
| **Demand** | Anyone using protocol benefits from discounts |
| **Income** | Can generate rental income |
| **Liquidity** | Instant buy/sell in AMM pools |

### ROI Calculation

**Example:** You buy a Gold NFT (50% discount)

If you pay 1,000 BKC in fees monthly:
- Without NFT: 1,000 BKC
- With Gold: 500 BKC
- **Monthly savings: 500 BKC**

NFT pays for itself based on your activity level.

---

## Smart Contract Interface

### Key Functions

```solidity
// View NFT info
function balanceOf(address owner) external view returns (uint256);
function ownerOf(uint256 tokenId) external view returns (address);
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

// Get tier info
function getTier(uint256 tokenId) external view returns (uint8 tier);
function getDiscount(uint256 tokenId) external view returns (uint256 discountPercent);

// Get user's best discount
function getUserDiscount(address user) external view returns (uint256 discountPercent);

// Standard ERC-721
function transferFrom(address from, address to, uint256 tokenId) external;
function approve(address to, uint256 tokenId) external;
function setApprovalForAll(address operator, bool approved) external;
```

### JavaScript Example

```javascript
import { ethers } from 'ethers';

const NFT_ADDRESS = '0x748b4770D6685629Ed9faf48CFa81e3E4641A341';

const NFT_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function getTier(uint256 tokenId) view returns (uint8)',
    'function getDiscount(uint256 tokenId) view returns (uint256)',
    'function getUserDiscount(address user) view returns (uint256)'
];

const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const nft = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);

// Check user's discount
async function checkDiscount(userAddress) {
    const discount = await nft.getUserDiscount(userAddress);
    console.log(`Discount: ${discount}%`);
    return discount;
}

// List user's NFTs
async function listUserNFTs(userAddress) {
    const balance = await nft.balanceOf(userAddress);
    console.log(`User owns ${balance} NFTs`);
    
    const tierNames = ['Crystal', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    
    for (let i = 0; i < balance; i++) {
        const tokenId = await nft.tokenOfOwnerByIndex(userAddress, i);
        const tier = await nft.getTier(tokenId);
        const discount = await nft.getDiscount(tokenId);
        
        console.log(`Token #${tokenId}: ${tierNames[tier]} (${discount}% discount)`);
    }
}
```

---

## NFT Metadata

Each NFT contains:

| Field | Description |
|-------|-------------|
| **Token ID** | Unique identifier |
| **Tier** | 0-6 (Crystal to Diamond) |
| **Discount** | 10-70% |
| **Image** | Tier-specific artwork |
| **Attributes** | Tier name, discount percentage |

### Metadata Example

```json
{
    "name": "Reward Booster #1234",
    "description": "Gold tier Reward Booster NFT - 50% fee discount",
    "image": "ipfs://...",
    "attributes": [
        {
            "trait_type": "Tier",
            "value": "Gold"
        },
        {
            "trait_type": "Discount",
            "value": "50%"
        }
    ]
}
```

---

## Integration with Protocol

### Automatic Detection

All protocol contracts check for NFT ownership:

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────┐
│    User      │────►│  Protocol Service │────►│ NFT Contract│
│  (has NFT)   │     │  (any service)    │     │  (check)    │
└──────────────┘     └───────────────────┘     └─────────────┘
                              │                       │
                              │◄──────────────────────┘
                              │    discount = 50%
                              ▼
                     Apply discounted fee
```

### Services That Check NFT

| Service | Contract | Checks NFT |
|---------|----------|------------|
| Staking | DelegationManager | ✅ |
| Gaming | FortunePool | ✅ |
| Notary | DecentralizedNotary | ✅ |
| NFT Pools | NFT Pool Factory | ✅ |
| Rentals | RentalManager | ✅ |

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | NFT contract |
| NFT Pool Factory | `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423` | Buy/sell pools |
| RentalManager | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` | Rent NFTs |
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | Configuration |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All NFT data is verifiable on-chain.*
