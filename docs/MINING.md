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

**Document:** Activity Rewards (MiningManager) — Token Distribution System  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Activity Rewards

Earn BKC tokens by using protocol services. The more the ecosystem is used, the more tokens are released—but at a decreasing rate over time.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` |
| **Network** | Arbitrum Sepolia |
| **Reserve** | 160,000,000 BKC |
| **Model** | Linear Scarcity |

---

## How It Works

### The Concept

When users pay fees for protocol services, new BKC tokens are released from the 160M reserve:

```
User uses service (pays fee)
        │
        ▼
MiningManager receives fee
        │
        ├──► Calculate release rate
        │
        ├──► Release new tokens from reserve
        │
        ├──► Distribute to stakers
        │
        └──► Send remainder to treasury
```

### Not Pre-Minted

The 160M tokens are **NOT** pre-minted. They are released only when:
- Users pay fees for real services
- Real protocol activity occurs
- Value is actually generated

---

## Linear Scarcity Model

### The Formula

```
Release Rate = Remaining Reserve / 160,000,000
```

As more tokens are released, the rate decreases:

| Reserve Status | Remaining | Rate | Effect |
|----------------|-----------|------|--------|
| Start | 160,000,000 | 100% | Full release |
| 25% released | 120,000,000 | 75% | Slower release |
| 50% released | 80,000,000 | 50% | Half rate |
| 75% released | 40,000,000 | 25% | Much slower |
| 100% released | 0 | 0% | Complete |

---

## Why This Model?

### Addressing the "Inflation" Concern

**The criticism:** "Protocol rewards create continuous inflation."

**Our response:**

| Feature | Explanation |
|---------|-------------|
| **Capped** | Maximum 160M can ever be released |
| **Decreasing** | Rate drops over time |
| **Activity-Based** | No activity = no release |
| **Finite** | Eventually reaches zero |

---

## Release Examples

### How Fees Trigger Releases

**Scenario:** User pays 100 BKC fee

| Reserve Status | Rate | New Tokens Released |
|----------------|------|---------------------|
| 160M remaining | 100% | 100 BKC |
| 120M remaining | 75% | 75 BKC |
| 80M remaining | 50% | 50 BKC |
| 40M remaining | 25% | 25 BKC |
| 0 remaining | 0% | 0 BKC |

---

## Fee Distribution

MiningManager handles ALL protocol fees:

### Fee Sources

| Service | Fee Type |
|---------|----------|
| Staking | Entry, exit, claim fees |
| Fortune Pool | Game fees |
| Notary | Certification fees |
| NFT Pools | Buy/sell fees |
| Rentals | Platform fees |

### Distribution

```
New Tokens Released + Fee Collected
        │
        ├──► Stakers (configurable %)
        │
        └──► Treasury (configurable %)
```

---

## Long-Term Sustainability

| Phase | Reserve | Rate | Model |
|-------|---------|------|-------|
| Bootstrap | 160M → 120M | 100% → 75% | High incentives |
| Growth | 120M → 80M | 75% → 50% | Medium incentives |
| Maturity | 80M → 40M | 50% → 25% | Low incentives |
| Stability | 40M → 0 | 25% → 0% | Minimal release |
| Complete | 0 | 0% | Fee-only model |

After all 160M are released, protocol runs purely on fee redistribution.

---

## Smart Contract Interface

### Key Functions

```solidity
// View functions
function getRemainingReserve() external view returns (uint256);
function getCurrentRate() external view returns (uint256);
function getTotalReleased() external view returns (uint256);
function getMiningStats() external view returns (
    uint256 remainingReserve,
    uint256 totalReleased,
    uint256 currentRate,
    uint256 totalFeesProcessed
);
```

### JavaScript Example

```javascript
import { ethers } from 'ethers';

const MINING = '0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB';

const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const mining = new ethers.Contract(MINING, MINING_ABI, provider);

// Get current stats
async function getStats() {
    const remaining = await mining.getRemainingReserve();
    const rate = await mining.getCurrentRate();
    
    console.log('Remaining:', ethers.formatEther(remaining), 'BKC');
    console.log('Rate:', (Number(rate) / 1e16).toFixed(2), '%');
}
```

---

## Authorized Services

| Contract | Address |
|----------|---------|
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` |
| FortunePool | `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631` |
| DecentralizedNotary | `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9` |
| NFT Pool Factory | `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423` |
| RentalManager | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` |

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | This contract |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Token |
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` | Staking rewards |
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | Configuration |
| Treasury | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | Fee recipient |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All activity rewards are verifiable on-chain.*
