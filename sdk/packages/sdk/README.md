# @backchain/sdk

Build DeFi frontends on the **Backchain ecosystem** and earn **10-20% operator commissions** on every transaction.

```bash
npm install @backchain/sdk ethers
```

## Quick Start

```typescript
import { Backchain } from '@backchain/sdk';
import { ethers } from 'ethers';

// 1. Initialize with your operator wallet
const bkc = new Backchain({
    operator: '0xYOUR_WALLET_ADDRESS',
    network: 'sepolia',  // or 'opbnb-mainnet' for mainnet
});

// 2. Connect user's wallet (MetaMask popup)
await bkc.connect();

// 3. Use any module
const balance = await bkc.getBkcBalance();
console.log('BKC Balance:', ethers.formatEther(balance));
```

## How You Earn

Every transaction routed through your app includes your operator address. The smart contract automatically splits fees:

| Recipient | Share | Description |
|-----------|-------|-------------|
| **You (Operator)** | **10-20%** | Paid to your wallet per transaction |
| Tutor (Referrer) | 10% | Goes to user's referrer (or burned) |
| Buyback & Burn | 30-50% | Buys + burns BKC from liquidity pool |
| Treasury | 10-30% | Protocol development |

No registration. No API key. No approval needed. Just pass your address.

## Modules

### Staking

```typescript
// Delegate BKC with time-lock (higher lock = more pStake = more rewards)
await bkc.staking.delegate(ethers.parseEther('1000'), 365); // 1000 BKC, 1 year

// Preview claim (see burn/recycle breakdown)
const preview = await bkc.staking.previewClaim();
console.log('You receive:', ethers.formatEther(preview.userReceives), 'BKC');

// Claim rewards
await bkc.staking.claimRewards();

// Unstake after lock expires
await bkc.staking.unstake(0); // delegation index
```

### NFT Boosters (Bonding Curves)

```typescript
// Buy an NFT from the bonding curve
const result = await bkc.nft.buy(0); // 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
console.log('Token ID:', result.events.tokenId);

// Get prices
const { bkcCost, ethFee } = await bkc.nft.getBuyPrice(2); // Gold tier

// Sell NFT back to the pool
await bkc.nft.sell(0, tokenId);

// Check user's NFTs
const { tokenIds, tiers } = await bkc.nft.getUserTokens();
```

### NFT Fusion

```typescript
// Fuse 2 Bronze -> 1 Silver
const { newTokenId } = await bkc.fusion.fuse(tokenId1, tokenId2);

// Split 1 Diamond -> 2 Gold
const { newTokenIds } = await bkc.fusion.split(diamondTokenId);

// Cascade: 1 Diamond -> 8 Bronze
const { newTokenIds } = await bkc.fusion.splitTo(diamondTokenId, 0);
```

### Fortune Pool (Commit-Reveal Game)

```typescript
// Play (auto-generates secret and commits)
const { gameId, secret } = await bkc.fortune.play(
    ethers.parseEther('10'),  // 10 BKC wager
    [42, 7, 99],               // guesses (one per tier)
    7                           // tierMask: 7 = all 3 tiers
);

// Wait for reveal delay, then reveal
const status = await bkc.fortune.getGameStatus(gameId);
if (status.canReveal) {
    const { prizeWon } = await bkc.fortune.reveal(gameId, [42, 7, 99], secret);
    console.log('Prize:', ethers.formatEther(prizeWon), 'BKC');
}
```

### Notary (Document Certification)

```typescript
// Hash a document
const hash = await NotaryModule.hashDocument('My important document content');

// Certify on-chain
const { certId } = await bkc.notary.certify(hash, 'Contract v2.0', 1); // docType 1 = Contract

// Verify a document
const cert = await bkc.notary.verify(hash);
console.log('Certified:', cert.exists, 'Owner:', cert.owner);
```

### Agora (Social Protocol)

```typescript
// Create profile
await bkc.agora.createProfile('myname', 'ar://metadata-hash');

// Create post (text is free)
const { postId } = await bkc.agora.createPost('Hello Backchain!', 0, 0);

// Like, follow, tip
await bkc.agora.like(postId);
await bkc.agora.follow('0xUserAddress');
await bkc.agora.tipPost(postId, ethers.parseEther('0.01'));
```

### Charity (Fundraising)

```typescript
// Create campaign
const { campaignId } = await bkc.charity.createCampaign(
    'Save the Rainforest',
    'ar://campaign-metadata',
    ethers.parseEther('10'),  // 10 BNB goal
    30                         // 30 days
);

// Donate (5% fee deducted on-chain)
await bkc.charity.donate(campaignId, ethers.parseEther('0.5'));
```

### Rental (NFT Marketplace / AirBNFT)

```typescript
// List NFT for rent
await bkc.rental.listNft(tokenId, ethers.parseEther('0.001')); // 0.001 BNB/day

// Rent an NFT (auto-calculates cost)
await bkc.rental.rentNft(tokenId);

// Withdraw earnings
await bkc.rental.withdrawEarnings();
```

### Swap (AMM / Liquidity Pool)

```typescript
// Buy BKC with BNB
await bkc.swap.buyBkc(ethers.parseEther('0.1')); // 0.1 BNB -> BKC

// Sell BKC for BNB
await bkc.swap.sellBkc(ethers.parseEther('1000')); // 1000 BKC -> BNB

// Get quotes
const bkcOut = await bkc.swap.getQuote(ethers.parseEther('0.1'));
const bnbOut = await bkc.swap.getQuoteBkcToEth(ethers.parseEther('1000'));
```

### Buyback (Proof-of-Purchase Mining)

```typescript
// Preview next buyback
const preview = await bkc.buyback.preview();
if (preview.isReady) {
    console.log('Caller reward:', ethers.formatEther(preview.estimatedCallerReward), 'BKC');
    await bkc.buyback.execute(); // Earn 5% of mined BKC!
}
```

### Faucet (Testnet)

```typescript
const canClaim = await bkc.faucet.canClaim();
if (canClaim) {
    await bkc.faucet.claim(); // Receive testnet BNB for gas
}
```

## Ecosystem Info

```typescript
// Your operator earnings
const earnings = await bkc.getPendingEarnings();
await bkc.withdrawEarnings();

// Ecosystem stats
const stats = await bkc.getEcosystemStats();

// Explorer links
console.log(bkc.txUrl(txHash));
console.log(bkc.addressUrl(address));
```

## Custom Signer (Server-Side / WalletConnect)

```typescript
import { ethers } from 'ethers';
import { Backchain } from '@backchain/sdk';

// Use a private key (e.g., for bots or server-side)
const provider = new ethers.JsonRpcProvider('https://opbnb-mainnet-rpc.bnbchain.org');
const wallet = new ethers.Wallet('0xPRIVATE_KEY', provider);

const bkc = new Backchain({ operator: '0xYOUR_WALLET', network: 'opbnb-mainnet' });
await bkc.connectWithSigner(wallet);
```

## Fee Calculation

```typescript
import { calculateFee, ACTION_IDS, nftActionId } from '@backchain/sdk';

// Calculate any action's BNB fee
const stakeFee = await bkc.calculateFee(ACTION_IDS.STAKING_DELEGATE);
const nftBuyFee = await bkc.calculateFee(nftActionId('NFT_BUY_T', 2)); // Gold tier
```

## Architecture

```
@backchain/sdk
├── Backchain (main class)
│   ├── .staking   -> StakingPool contract
│   ├── .nft       -> NFTPool + RewardBooster contracts
│   ├── .fusion    -> NFTFusion contract
│   ├── .fortune   -> FortunePool contract
│   ├── .notary    -> Notary contract
│   ├── .agora     -> Agora contract
│   ├── .charity   -> CharityPool contract
│   ├── .rental    -> RentalManager contract
│   ├── .swap      -> LiquidityPool contract
│   ├── .buyback   -> BuybackMiner contract
│   └── .faucet    -> SimpleBKCFaucet contract
├── ProviderManager (dual provider: public RPC reads + MetaMask writes)
├── Fee Calculator (client-side, avoids eth_call gasPrice=0 issue)
└── Contract ABIs + Addresses (per network)
```

## Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Sepolia | 11155111 | Active (testnet) |
| opBNB Mainnet | 204 | Coming soon |
| opBNB Testnet | 5611 | Coming soon |

## NFT Tiers

| Tier | Boost | Effect |
|------|-------|--------|
| Bronze | 10% | Reduces burn on reward claims |
| Silver | 25% | |
| Gold | 40% | |
| Diamond | 50% | Nearly eliminates burn |

## Packages

Use the full SDK or install individual modules:

| Package | Description |
|---------|-------------|
| `@backchain/sdk` | Full SDK (this package) |
| `@backchain/core` | Provider, fees, types, ABIs |
| `@backchain/staking` | Staking module |
| `@backchain/nft` | NFT bonding curve trading |
| `@backchain/fusion` | NFT fusion & split |
| `@backchain/fortune` | Fortune pool game |
| `@backchain/notary` | Document certification |
| `@backchain/agora` | Social protocol |
| `@backchain/charity` | Fundraising campaigns |
| `@backchain/rental` | NFT rental marketplace |
| `@backchain/swap` | AMM / liquidity pool |
| `@backchain/buyback` | Buyback & burn mining |
| `@backchain/faucet` | Testnet faucet |
| `@backchain/events` | Event definitions & parser |
| `@backchain/indexer` | Event polling & streaming |
| `@backchain/api` | Server-side helpers |

## License

MIT

## Links

- Website: [backcoin.org](https://backcoin.org)
- GitHub: [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp)
- Contracts: Verified on [Etherscan (Sepolia)](https://sepolia.etherscan.io)
