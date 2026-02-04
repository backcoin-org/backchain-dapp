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

**Document:** AirBNFT (Rental Manager) — Permissionless NFT Rentals  
**Version:** 2.0.0 (V6 with Operator System)  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# AirBNFT — NFT Rentals

## Share Value Without Permission

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    RENT. EARN. NO MIDDLEMAN.                                      ║
║                                                                                   ║
║   Just as Voltaire advocated for the free exchange of ideas,                     ║
║   we advocate for the free exchange of digital assets.                           ║
║                                                                                   ║
║   No marketplace approval needed.                                                 ║
║   No platform gatekeepers.                                                        ║
║   No permission required.                                                         ║
║                                                                                   ║
║   List your NFT. Set your price. Earn passive income.                            ║
║   The smart contract handles everything trustlessly.                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Rent NFTs for temporary utility access. Owners earn passive income. Renters access benefits without buying. No middleman takes a cut beyond transparent protocol fees.

---

## 📍 Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` |
| **Network** | Arbitrum Sepolia |
| **Supported NFTs** | Reward Booster NFTs |
| **Payment** | BKC + ETH (V6) |
| **Operator Support** | ⚡ Yes |

---

## 🌍 Become an Operator

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD A RENTAL PLATFORM. EARN COMMISSIONS.                     ║
║                                                                                   ║
║   Anyone in the world can:                                                        ║
║                                                                                   ║
║   1. Build their own NFT rental interface                                        ║
║   2. Pass their wallet address as the "operator" parameter                       ║
║   3. Earn BKC + ETH from EVERY rental through their platform                     ║
║                                                                                   ║
║   No registration. No approval. No KYC.                                          ║
║   Build the next "Airbnb for NFTs" and earn from every transaction.             ║
║                                                                                   ║
║   Ideas for YOUR platform:                                                        ║
║   • Gaming NFT rentals                                                            ║
║   • Metaverse asset sharing                                                       ║
║   • Event access passes                                                           ║
║   • Premium membership rentals                                                    ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ How It Works

### Rental Flow (V6)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   RENTAL PROCESS                                                                 ║
║   ══════════════                                                                 ║
║                                                                                   ║
║   OWNER                                    RENTER                                ║
║     │                                        │                                    ║
║     ▼                                        │                                    ║
║   List NFT with price + operator             │                                    ║
║     │                                        │                                    ║
║     │◄──────────────────────────────────────┤                                    ║
║     │                                  Browse listings                            ║
║     │                                        │                                    ║
║     │                                        ▼                                    ║
║     │                                  Select NFT                                 ║
║     │                                        │                                    ║
║     │                                        ▼                                    ║
║     │                         Pay rental + BKC fee + ETH fee                     ║
║     │                                        │                                    ║
║     ▼                                        ▼                                    ║
║   Receive payment                      Get NFT utility                           ║
║     │                                        │                                    ║
║     │              [Rental Period]           │                                    ║
║     │                                        │                                    ║
║     ▼                                        ▼                                    ║
║   NFT returns                          Utility ends                              ║
║                                                                                   ║
║   FEES DISTRIBUTED TO: Operator ⚡ + Stakers + Treasury                          ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Non-custodial** | NFT never leaves owner's wallet |
| **Utility Access** | Renter gets burn reduction benefits during rental |
| **Automatic Return** | Utility reverts after rental period |
| **Flexible Pricing** | Owners set their own rates |
| **Operator Earnings** | Builders earn from every rental ⚡ |

---

## 💎 Reward Booster NFT Rentals

Primary use case: Renting NFTs that reduce burn penalty when unstaking

### Available Tiers

| Tier | Burn Reduction | Rental Appeal |
|------|----------------|---------------|
| **Diamond** | 0% (no burn) | Highest demand, premium price |
| **Gold** | 25% burn | Popular choice |
| **Silver** | 35% burn | Balanced value |
| **Bronze** | 50% burn | Budget friendly |

### Rental Economics Example

**Scenario:** User needs to unstake 10,000 BKC

| Without Rental | With Diamond Rental |
|----------------|---------------------|
| 50% burned = 5,000 BKC lost | 0% burned = 0 BKC lost |
| Net: 5,000 BKC | Net: 10,000 BKC |
| | Rental cost: ~100 BKC |
| | **Net savings: ~4,900 BKC** |

**Renting makes economic sense!**

---

## 🔥 Why This Matters

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   TRADITIONAL NFT RENTAL                   BACKCHAIN RENTALS                     ║
║   ══════════════════════                   ══════════════════                    ║
║                                                                                   ║
║   ❌ Custodial (risky)                      ✅ Non-custodial (safe)              ║
║   ❌ Platform approval needed               ✅ Permissionless                    ║
║   ❌ High platform fees                     ✅ Transparent, low fees             ║
║   ❌ Limited to platform NFTs               ✅ Any supported NFT                 ║
║   ❌ Can be censored                        ✅ Unstoppable smart contract        ║
║   ❌ Platform takes large cut               ✅ YOU can be the operator           ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Who Uses AirBNFT?

| User Type | Motivation |
|-----------|------------|
| **Casual Users** | Need occasional burn protection |
| **Large Stakers** | Rent Diamond for big unstakes |
| **New Users** | Try protocol with premium benefits |
| **NFT Holders** | Earn passive income on idle NFTs |
| **Builders** | Create rental platforms, earn commissions |

---

## 💰 V6 Fee Structure

V6 introduces **dual fees** (BKC + ETH) with operator support:

| Action | BKC Fee | ETH Fee | Operator Earns |
|--------|---------|---------|----------------|
| **List NFT** | Gas only | — | — |
| **Rent NFT** | Platform % | Dynamic | ⚡ Both BKC + ETH |
| **Spotlight** | Variable | Variable | ⚡ Both BKC + ETH |
| **Delist** | Gas only | — | — |

### Fee Distribution

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   RENTAL PAYMENT FLOW                                                            ║
║   ═══════════════════                                                            ║
║                                                                                   ║
║   Renter Pays                                                                    ║
║        │                                                                          ║
║        ├──────────────► OWNER (rental price)                                     ║
║        │                                                                          ║
║        └──────────────► PLATFORM FEE                                             ║
║                              │                                                    ║
║                              ├──► Operator ⚡ (commission)                        ║
║                              ├──► Stakers (rewards)                              ║
║                              └──► Treasury (protocol)                            ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📝 For NFT Owners

### Listing Your NFT (V6)

```
Step 1: Connect wallet

Step 2: Select NFT to list

Step 3: Set rental price (per day/week)

Step 4: Set minimum/maximum rental period

Step 5: Approve NFT for rental contract

Step 6: Call list() with your operator address (or use default)

Step 7: Start earning! ✓
```

### Owner Benefits

| Benefit | Description |
|---------|-------------|
| **Passive Income** | Earn while keeping ownership |
| **No Risk** | NFT stays in your wallet |
| **Flexible** | Delist anytime |
| **Price Control** | Set your own rates |
| **Spotlight** | Pay to promote your listing |

---

## 🎯 For Renters

### Renting an NFT (V6)

```
Step 1: Connect wallet

Step 2: Browse available listings

Step 3: Select NFT and rental period

Step 4: Pay: Rental price + BKC fee + ETH fee

Step 5: Utility active immediately! ✓

Step 6: Use burn reduction benefits while staking/unstaking
```

### Renter Benefits

| Benefit | Description |
|---------|-------------|
| **No Commitment** | Use only when needed |
| **Lower Cost** | Much cheaper than buying |
| **Instant Access** | Utility starts immediately |
| **Flexibility** | Choose rental duration |
| **Savings** | Save thousands on unstaking burns |

---

## 💻 Smart Contract Interface (V6)

### Key Functions

```solidity
// ═══════════════════════════════════════════════════════════════════════════════
// OWNER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// List NFT for rental
function list(
    address _nftContract,
    uint256 _tokenId,
    uint256 _dailyPrice,
    uint256 _minDays,
    uint256 _maxDays,
    address _operator       // ⚡ Operator earns from rentals of your NFT!
) external;

// Delist NFT
function delist(uint256 _listingId) external;

// Update listing price
function updatePrice(uint256 _listingId, uint256 _newDailyPrice) external;

// Spotlight listing (promote visibility)
function spotlight(
    uint256 _listingId,
    address _operator       // ⚡ Operator earns from spotlight
) external payable;

// ═══════════════════════════════════════════════════════════════════════════════
// RENTER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Rent an NFT
function rent(
    uint256 _listingId,
    uint256 _days,
    address _operator       // ⚡ Operator earns commission!
) external payable;

// End rental early (if allowed)
function endRental(uint256 _rentalId) external;

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get listing details
function getListing(uint256 _listingId) external view returns (
    address owner,
    address nftContract,
    uint256 tokenId,
    uint256 dailyPrice,
    uint256 minDays,
    uint256 maxDays,
    bool active
);

// Get active rentals for user
function getActiveRentals(address _user) external view returns (uint256[] memory);

// Check if user has rental utility (burn reduction)
function getRentalUtility(address _user) external view returns (uint256 tier);

// Get rental fee
function getRentalFee(uint256 _listingId, uint256 _days) external view returns (
    uint256 totalBkc,
    uint256 ethFee
);
```

### Events

```solidity
// Emitted when NFT is listed
event NFTListed(
    uint256 indexed listingId,
    address indexed owner,
    address nftContract,
    uint256 tokenId,
    uint256 dailyPrice
);

// Emitted when NFT is rented
event NFTRented(
    uint256 indexed listingId,
    uint256 indexed rentalId,
    address indexed renter,
    uint256 days,
    uint256 totalPaid,
    address operator
);

// Emitted when rental ends
event RentalEnded(
    uint256 indexed rentalId,
    address indexed renter,
    uint256 endTime
);

// Emitted when fees are distributed
event FeesDistributed(
    uint256 bkcToOperator,
    uint256 bkcToOwner,
    uint256 ethToOperator,
    address indexed operator
);
```

---

## 🔧 JavaScript Integration (V6)

### List NFT for Rental (Owner)

```javascript
import { ethers } from 'ethers';

const RENTAL = '0x593A842d214516F216EB6E6E9A97cC84F42f6821';
const NFT = '0xf2EA307686267dC674859da28C58CBb7a5866BCf';
const BKC_TOKEN = '0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396';
const MY_OPERATOR_ADDRESS = '0xYourAddress'; // YOUR address to earn commissions!

const rentalABI = [
    "function list(address _nftContract, uint256 _tokenId, uint256 _dailyPrice, uint256 _minDays, uint256 _maxDays, address _operator) external",
    "function rent(uint256 _listingId, uint256 _days, address _operator) external payable",
    "function getListing(uint256 _listingId) view returns (address, address, uint256, uint256, uint256, uint256, bool)",
    "function getRentalFee(uint256 _listingId, uint256 _days) view returns (uint256, uint256)",
    "function getRentalUtility(address _user) view returns (uint256)",
    "event NFTRented(uint256 indexed listingId, uint256 indexed rentalId, address indexed renter, uint256 days, uint256 totalPaid, address operator)"
];

// List NFT for rental
async function listNFTForRental(tokenId, dailyPriceBKC, signer) {
    // Approve NFT
    const nft = new ethers.Contract(NFT, ["function approve(address, uint256)"], signer);
    await nft.approve(RENTAL, tokenId);
    
    // List
    const rental = new ethers.Contract(RENTAL, rentalABI, signer);
    const tx = await rental.list(
        NFT,
        tokenId,
        ethers.parseEther(dailyPriceBKC.toString()),
        1,   // min 1 day
        30,  // max 30 days
        MY_OPERATOR_ADDRESS  // ⚡ Earn from rentals!
    );
    
    await tx.wait();
    console.log('NFT listed for rental!');
}
```

### Rent NFT (Renter)

```javascript
// Rent NFT
async function rentNFT(listingId, days, signer) {
    const rental = new ethers.Contract(RENTAL, rentalABI, signer);
    const bkc = new ethers.Contract(BKC_TOKEN, ["function approve(address, uint256)"], signer);
    
    // Get fees
    const [totalBkc, ethFee] = await rental.getRentalFee(listingId, days);
    
    console.log('═══════════════════════════════════════════════');
    console.log('RENT NFT');
    console.log('═══════════════════════════════════════════════');
    console.log('Days:', days);
    console.log('BKC Cost:', ethers.formatEther(totalBkc), 'BKC');
    console.log('ETH Fee:', ethers.formatEther(ethFee), 'ETH');
    
    // Approve BKC
    await bkc.approve(RENTAL, totalBkc);
    
    // Rent (pass YOUR address as operator to earn from YOUR interface!)
    const tx = await rental.rent(listingId, days, MY_OPERATOR_ADDRESS, { value: ethFee });
    const receipt = await tx.wait();
    
    console.log('NFT rented! Utility now active.');
    
    // Parse event
    const iface = new ethers.Interface(rentalABI);
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'NFTRented') {
                console.log('Rental ID:', parsed.args.rentalId.toString());
                console.log('Operator:', parsed.args.operator);
            }
        } catch {}
    }
}

// Check if user has rental utility
async function checkRentalUtility(address, provider) {
    const rental = new ethers.Contract(RENTAL, rentalABI, provider);
    const tier = await rental.getRentalUtility(address);
    
    const tierNames = ['None', 'Bronze', 'Silver', 'Gold', 'Diamond'];
    console.log('Current rental tier:', tierNames[tier] || 'Unknown');
    return tier;
}
```

---

## 🛡️ Safety Mechanisms

| Mechanism | Purpose |
|-----------|---------|
| **Non-custodial** | NFT stays in owner's wallet |
| **Utility Delegation** | Only utility is transferred, not ownership |
| **Automatic Expiry** | Rental ends at scheduled time |
| **No Early Termination** | Owner cannot cancel active rental |
| **On-chain Proof** | All rentals verifiable on Arbiscan |

---

## 📋 Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | Main rental |
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | NFTs for rent |
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Payments |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | Fee distribution |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | Configuration |
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | Staking (uses rental utility) |

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
║   AirBNFT is not just a rental platform. It's economic freedom.                  ║
║                                                                                   ║
║   Freedom to rent without platform approval.                                      ║
║   Freedom to list without marketplace fees.                                       ║
║   Freedom to build and earn as an operator.                                       ║
║                                                                                   ║
║   Owners earn passive income. Renters save on burns.                             ║
║   Operators earn commissions. Everyone wins.                                      ║
║                                                                                   ║
║   No one can stop your listing. No one can censor your rental.                   ║
║                                                                                   ║
║                         THE RENTALS ARE UNSTOPPABLE.                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All rental activity is verifiable on-chain. Trust the code, not the words.*
