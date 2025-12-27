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

**Document:** AirBNFT (Rental Manager) — NFT Rental Marketplace  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# AirBNFT — NFT Rentals

Rent NFTs for temporary utility access. Owners earn passive income. Renters access benefits without buying.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` |
| **Network** | Arbitrum Sepolia |
| **Supported NFTs** | Reward Booster NFTs |
| **Payment** | BKC Token |

---

## What is AirBNFT?

A peer-to-peer NFT rental marketplace where:

- **Owners** list NFTs and earn passive income
- **Renters** access NFT utility without buying
- **Protocol** facilitates trustless rentals

Think "Airbnb for NFTs" — use what you need, when you need it.

---

## How It Works

### Rental Flow

```
┌─────────────────────────────────────────────────────┐
│                  RENTAL PROCESS                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  OWNER                        RENTER               │
│    │                            │                  │
│    ▼                            │                  │
│  List NFT with price            │                  │
│    │                            │                  │
│    │◄───────────────────────────┤                  │
│    │                      Browse listings          │
│    │                            │                  │
│    │                            ▼                  │
│    │                      Select NFT               │
│    │                            │                  │
│    │                            ▼                  │
│    │                      Pay rental + fee         │
│    │                            │                  │
│    ▼                            ▼                  │
│  Receive payment          Get NFT utility          │
│    │                            │                  │
│    │         [Rental Period]    │                  │
│    │                            │                  │
│    ▼                            ▼                  │
│  NFT returns              Utility ends             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Non-custodial** | NFT never leaves owner's wallet |
| **Utility Access** | Renter gets benefits during rental |
| **Automatic Return** | Utility reverts after rental period |
| **Flexible Pricing** | Owners set their own rates |

---

## Real-World Value

### Why This Isn't Circular

AirBNFT creates **external value** by enabling:

| Use Case | External Value |
|----------|----------------|
| **Try Before Buy** | Users test NFT benefits before purchasing |
| **Occasional Use** | Pay only when needed |
| **Capital Efficiency** | No need to lock funds in NFT purchase |
| **Passive Income** | Owners monetize idle assets |

### Who Uses AirBNFT?

| User Type | Motivation |
|-----------|------------|
| **Casual Users** | Need occasional fee discounts |
| **Traders** | Rent high-tier NFT for large transactions |
| **New Users** | Try protocol with premium benefits |
| **NFT Holders** | Earn income on unused NFTs |

---

## Reward Booster NFT Rentals

Primary use case: Renting fee discount NFTs

### Available Tiers

| Tier | Discount | Rental Appeal |
|------|----------|---------------|
| Diamond | 70% off | High demand, premium price |
| Platinum | 60% off | Popular choice |
| Gold | 50% off | Balanced value |
| Silver | 40% off | Affordable option |
| Bronze | 30% off | Budget friendly |
| Iron | 20% off | Entry level |
| Crystal | 10% off | Starter |

### Rental Economics Example

**Scenario:** User needs to stake 10,000 BKC

| Without Rental | With Gold Rental |
|----------------|------------------|
| Full fee applies | 50% discount |
| Higher cost | Lower net cost |
| No rental fee | Small rental fee |
| | **Net savings** |

---

## For NFT Owners

### Listing Your NFT

```
Step 1: Connect wallet

Step 2: Select NFT to list

Step 3: Set rental price (per day/week)

Step 4: Set minimum/maximum rental period

Step 5: Approve NFT for rental contract

Step 6: Confirm listing

Step 7: Start earning ✓
```

### Owner Benefits

| Benefit | Description |
|---------|-------------|
| **Passive Income** | Earn while keeping ownership |
| **No Risk** | NFT stays in your wallet |
| **Flexible** | Delist anytime |
| **Price Control** | Set your own rates |

### Earnings Flow

```
Renter pays → Platform fee deducted → Owner receives payment
```

---

## For Renters

### Renting an NFT

```
Step 1: Connect wallet

Step 2: Browse available listings

Step 3: Select NFT and rental period

Step 4: Approve BKC payment

Step 5: Confirm rental

Step 6: Utility active immediately ✓
```

### Renter Benefits

| Benefit | Description |
|---------|-------------|
| **No Commitment** | Use only when needed |
| **Lower Cost** | Cheaper than buying |
| **Instant Access** | Utility starts immediately |
| **Flexibility** | Choose rental duration |

---

## Fees

| Action | Fee |
|--------|-----|
| **List NFT** | Configurable |
| **Rental (Platform Fee)** | Configurable % of rental price |
| **Rental Payment** | Set by owner |

### Fee Distribution

```
Rental Payment
      │
      ├──► Owner (majority)
      │
      └──► Protocol (platform fee)
              │
              ├──► Stakers
              └──► Treasury
```

---

## Smart Contract Interface

### Key Functions

```solidity
// List NFT for rental
function listForRental(
    address nftContract,
    uint256 tokenId,
    uint256 dailyPrice,
    uint256 minDays,
    uint256 maxDays
) external;

// Rent an NFT
function rent(
    uint256 listingId,
    uint256 days
) external;

// End rental (auto or manual)
function endRental(uint256 rentalId) external;

// Delist NFT
function delist(uint256 listingId) external;

// View functions
function getListing(uint256 listingId) external view returns (Listing memory);
function getActiveRentals(address user) external view returns (Rental[] memory);
function getRentalUtility(address user) external view returns (uint256 discountTier);
```

### JavaScript Example

```javascript
import { ethers } from 'ethers';

const RENTAL = '0xD387B3Fd06085676e85130fb07ae06D675cb201f';
const NFT = '0x748b4770D6685629Ed9faf48CFa81e3E4641A341';
const BKC = '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f';

// List NFT for rental (Owner)
async function listNFT(tokenId, dailyPrice, signer) {
    // Approve NFT
    const nft = new ethers.Contract(NFT, ERC721_ABI, signer);
    await nft.approve(RENTAL, tokenId);
    
    // List
    const rental = new ethers.Contract(RENTAL, RENTAL_ABI, signer);
    const tx = await rental.listForRental(
        NFT,
        tokenId,
        ethers.parseEther(dailyPrice.toString()),
        1,  // min 1 day
        30  // max 30 days
    );
    
    await tx.wait();
    console.log('NFT listed for rental!');
}

// Rent NFT (Renter)
async function rentNFT(listingId, days, signer) {
    // Get listing details
    const rental = new ethers.Contract(RENTAL, RENTAL_ABI, signer);
    const listing = await rental.getListing(listingId);
    
    // Calculate total cost
    const totalCost = listing.dailyPrice * BigInt(days);
    
    // Approve BKC
    const bkc = new ethers.Contract(BKC, ERC20_ABI, signer);
    await bkc.approve(RENTAL, totalCost);
    
    // Rent
    const tx = await rental.rent(listingId, days);
    await tx.wait();
    
    console.log('NFT rented! Utility now active.');
}

// Check rental utility
async function checkUtility(address, provider) {
    const rental = new ethers.Contract(RENTAL, RENTAL_ABI, provider);
    const discount = await rental.getRentalUtility(address);
    console.log('Current discount tier:', discount);
}
```

---

## Safety Mechanisms

| Mechanism | Purpose |
|-----------|---------|
| **Non-custodial** | NFT stays in owner's wallet |
| **Utility Delegation** | Only utility is transferred, not ownership |
| **Automatic Expiry** | Rental ends at scheduled time |
| **Dispute Resolution** | Coming in future versions |

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| RentalManager | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` | Main rental |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | NFTs for rent |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Payments |
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

*This document is part of Backcoin Protocol's public documentation. All rental activity is verifiable on-chain.*
