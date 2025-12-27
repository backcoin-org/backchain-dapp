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

**Document:** BKC Token — Native Utility Token  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# BKC Token

The native utility token powering all services in Backcoin Protocol.

---

## Token Information

| Property | Value |
|----------|-------|
| **Name** | Backcoin |
| **Symbol** | BKC |
| **Network** | Arbitrum |
| **Standard** | ERC-20 |
| **Decimals** | 18 |
| **Max Supply** | 200,000,000 BKC |
| **Contract** | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` |

---

## Supply Model

### Total: 200,000,000 BKC (Fixed Forever)

```
┌─────────────────────────────────────────────────────────┐
│                    TOKEN SUPPLY                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TGE:              40,000,000 BKC   (20%)              │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                         │
│  Activity Rewards: 160,000,000 BKC  (80%)              │
│  ░░░░░░░░████████████████████████████████████████████  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### TGE Distribution (40M)

| Allocation | Amount | % of TGE |
|------------|--------|----------|
| Community Airdrop | 14,000,000 | 35% |
| NFT Pool Liquidity | 7,000,000 | 17.5% |
| DEX Liquidity | 7,000,000 | 17.5% |
| Strategic Reserve | 10,000,000 | 25% |
| Fortune Pool Prize | 2,000,000 | 5% |
| **Developer/Team** | **0** | **0%** |

### Activity Rewards (160M)

Released through ecosystem usage—not pre-minted:

```
User uses service → Pays fee → Tokens released proportionally
```

Release rate decreases over time:
- Rate = Remaining / 160,000,000
- Eventually reaches zero (no inflation)

---

## Token Utility

BKC is required across all Backcoin services:

| Service | Use Case |
|---------|----------|
| **Staking** | Lock BKC to earn protocol fees |
| **Fortune Pool** | Wager on prediction games |
| **NFT Pools** | Buy/sell Reward Booster NFTs |
| **Notary** | Pay for document certification |
| **Rentals** | Pay rental fees |
| **Governance** | Vote on proposals (coming soon) |

---

## Token Features

### Standard ERC-20

Full compatibility with:
- All Arbitrum DEXs (Camelot, Uniswap, etc.)
- Wallets (MetaMask, Rabby, etc.)
- DeFi protocols
- Bridges

### Capped Supply

```solidity
uint256 public constant MAX_SUPPLY = 200_000_000 * 10**18;
```

- No mint function beyond max supply
- Cannot be changed or upgraded
- Deflationary pressure over time

### Burnable

Tokens can be burned, permanently reducing supply:
- Decreases total supply
- Increases scarcity
- Community-driven burns possible

---

## How to Get BKC

### Testnet (Current)

1. **Faucet:** Get free testnet BKC
   - Contract: `0x9dbf3591239Dd2D2Cc2e93b6E5086E8651e488bb`
   - Limit: Once per address

2. **Activity Rewards:** Use protocol services
   - Stake, play, notarize, trade NFTs
   - Earn rewards proportional to fees

### Mainnet (Coming Soon)

1. **Airdrop:** Phase 1 & 2 distributions
2. **DEX:** Trade on Camelot/Uniswap
3. **CEX:** Future exchange listings
4. **Activity Rewards:** Use protocol services

---

## Smart Contract

### Verified Source

The BKC token contract is fully verified on Arbiscan:

**Address:** `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f`

### Key Functions

```solidity
// Standard ERC-20
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);

// View functions
function balanceOf(address account) external view returns (uint256);
function totalSupply() external view returns (uint256);
function allowance(address owner, address spender) external view returns (uint256);

// Token info
function name() external view returns (string memory);      // "Backcoin"
function symbol() external view returns (string memory);    // "BKC"
function decimals() external view returns (uint8);          // 18
```

---

## Integration

### Add to Wallet

**MetaMask / Rabby:**

| Field | Value |
|-------|-------|
| Network | Arbitrum Sepolia |
| Contract | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` |
| Symbol | BKC |
| Decimals | 18 |

### JavaScript Example

```javascript
import { ethers } from 'ethers';

const BKC_ADDRESS = '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f';
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const bkc = new ethers.Contract(BKC_ADDRESS, ERC20_ABI, provider);

// Check balance
const balance = await bkc.balanceOf(walletAddress);
console.log('Balance:', ethers.formatEther(balance), 'BKC');
```

---

## Security

### Contract Security

| Feature | Status |
|---------|--------|
| Verified on Arbiscan | ✅ |
| Standard ERC-20 | ✅ |
| No admin mint | ✅ |
| Capped supply | ✅ |
| No pause function | ✅ |
| No blacklist | ✅ |

### Holder Protection

- No hidden fees on transfer
- No special privileges for team
- No ability to freeze accounts
- Fully decentralized after deployment

---

## Related Contracts

| Contract | Address | Relation |
|----------|---------|----------|
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | This contract |
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | Configuration |
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | Activity rewards |
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` | Staking |
| Faucet | `0x9dbf3591239Dd2D2Cc2e93b6E5086E8651e488bb` | Testnet tokens |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All data is verifiable on-chain.*
