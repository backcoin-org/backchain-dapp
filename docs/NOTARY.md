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

**Document:** Decentralized Notary — Blockchain Document Certification  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Decentralized Notary

Certify documents on the blockchain. Immutable proof, instant verification, permanent record.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9` |
| **Network** | Arbitrum Sepolia |
| **Certificate** | NFT (ERC-721) |
| **Verification** | Free, public |

---

## What is Decentralized Notary?

A blockchain-based document certification service that:

- Creates **immutable proof** that a document existed at a specific time
- Mints an **NFT certificate** as proof of notarization
- Allows **anyone to verify** documents for free
- Stores **permanent records** on Arbitrum

---

## How It Works

### Notarization Flow

```
┌─────────────────────────────────────────────────────┐
│               NOTARIZATION PROCESS                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. User uploads document                          │
│         │                                          │
│         ▼                                          │
│  2. System generates document hash (SHA-256)       │
│         │                                          │
│         ▼                                          │
│  3. Hash stored on Arbitrum blockchain             │
│         │                                          │
│         ▼                                          │
│  4. NFT certificate minted to user's wallet        │
│         │                                          │
│         ▼                                          │
│  5. Document is officially notarized ✓             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### What Gets Stored?

| Data | Storage |
|------|---------|
| Document hash | On-chain (permanent) |
| Timestamp | On-chain (permanent) |
| Owner address | On-chain (permanent) |
| Original document | **NOT stored** (privacy) |

**Important:** The original document never leaves your device. Only the cryptographic hash is stored on-chain.

---

## Real-World Use Cases

### External Value (Not Circular)

This service brings **external users** to Arbitrum:

| Industry | Use Case | Who Pays |
|----------|----------|----------|
| **Legal** | Contract authentication | Law firms, businesses |
| **Education** | Diploma/certificate verification | Universities, schools |
| **Real Estate** | Property document proof | Buyers, sellers, agents |
| **Healthcare** | Medical record timestamps | Hospitals, clinics |
| **Intellectual Property** | Creation date proof | Artists, inventors |
| **Corporate** | Meeting minutes, board resolutions | Companies |
| **Insurance** | Claim documentation | Insurers, claimants |

### Why Businesses Choose Blockchain Notary

| Traditional Notary | Blockchain Notary |
|-------------------|-------------------|
| Office hours only | 24/7 availability |
| Physical presence required | Remote, instant |
| Paper certificates | NFT certificates |
| Can be forged | Cryptographically secure |
| Single point of failure | Decentralized |
| Expensive | Low cost |

---

## NFT Certificate

Each notarization mints a unique NFT:

### Certificate Contains

| Field | Description |
|-------|-------------|
| **Document Hash** | SHA-256 hash of original |
| **Timestamp** | Block timestamp |
| **Owner** | Wallet that notarized |
| **Token ID** | Unique certificate ID |

### Certificate Benefits

- **Proof of ownership** in your wallet
- **Transferable** to other parties
- **Verifiable** by anyone
- **Permanent** on blockchain

---

## Fees

| Action | Fee |
|--------|-----|
| **Notarize** | Configurable (paid in BKC) |
| **Verify** | **Free** |

### NFT Discounts

Reward Booster NFT holders get fee discounts:

| Tier | Discount |
|------|----------|
| Diamond | 70% off |
| Platinum | 60% off |
| Gold | 50% off |
| Silver | 40% off |
| Bronze | 30% off |
| Iron | 20% off |
| Crystal | 10% off |

---

## Using the Notary

### Notarize a Document

```
Step 1: Connect wallet to Arbitrum Sepolia

Step 2: Navigate to Notary service

Step 3: Upload document (stays local)

Step 4: System generates hash

Step 5: Approve BKC payment

Step 6: Confirm transaction

Step 7: Receive NFT certificate ✓
```

### Verify a Document

```
Step 1: Upload document to verify

Step 2: System generates hash

Step 3: Search blockchain for matching hash

Step 4: View results:
        ├─ Found → Show certificate details
        └─ Not found → Document not notarized
```

**Verification is FREE and PUBLIC**

---

## Smart Contract Interface

### Key Functions

```solidity
// Notarize a document
function notarize(bytes32 documentHash) external returns (uint256 tokenId);

// Verify a document
function verify(bytes32 documentHash) external view returns (
    bool exists,
    address owner,
    uint256 timestamp,
    uint256 tokenId
);

// Get certificate details
function getCertificate(uint256 tokenId) external view returns (
    bytes32 documentHash,
    address owner,
    uint256 timestamp
);

// Check if document is notarized
function isNotarized(bytes32 documentHash) external view returns (bool);
```

### JavaScript Example

```javascript
import { ethers } from 'ethers';
import { createHash } from 'crypto';

const NOTARY = '0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9';
const BKC = '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f';

// Hash document locally
function hashDocument(fileBuffer) {
    return '0x' + createHash('sha256').update(fileBuffer).digest('hex');
}

// Notarize
async function notarize(fileBuffer, signer) {
    const hash = hashDocument(fileBuffer);
    
    // Approve BKC
    const bkc = new ethers.Contract(BKC, ERC20_ABI, signer);
    await bkc.approve(NOTARY, ethers.parseEther('10'));
    
    // Notarize
    const notary = new ethers.Contract(NOTARY, NOTARY_ABI, signer);
    const tx = await notary.notarize(hash);
    const receipt = await tx.wait();
    
    console.log('Document notarized!');
    return receipt;
}

// Verify (free)
async function verify(fileBuffer, provider) {
    const hash = hashDocument(fileBuffer);
    const notary = new ethers.Contract(NOTARY, NOTARY_ABI, provider);
    
    const result = await notary.verify(hash);
    
    if (result.exists) {
        console.log('Document verified!');
        console.log('Owner:', result.owner);
        console.log('Timestamp:', new Date(Number(result.timestamp) * 1000));
        console.log('Certificate ID:', result.tokenId.toString());
    } else {
        console.log('Document not found');
    }
    
    return result;
}
```

---

## Privacy & Security

### What We Protect

| Aspect | Protection |
|--------|------------|
| **Document Content** | Never uploaded, never stored |
| **Personal Data** | Only wallet address on-chain |
| **Hash Reversal** | SHA-256 is one-way (cannot recover original) |

### What is Public

| Data | Visibility |
|------|------------|
| Document hash | Public (but meaningless without original) |
| Timestamp | Public |
| Owner wallet | Public |
| Certificate NFT | Public |

---

## Why Arbitrum?

| Feature | Benefit |
|---------|---------|
| **Low Fees** | Affordable notarization |
| **Fast Finality** | Instant confirmation |
| **Ethereum Security** | Secured by L1 |
| **Ecosystem** | Part of larger DeFi ecosystem |

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| DecentralizedNotary | `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9` | Main notary |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Fee payment |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | Fee discounts |
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

*This document is part of Backcoin Protocol's public documentation. All notarizations are verifiable on-chain.*
