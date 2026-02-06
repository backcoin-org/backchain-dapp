# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backchain is a full-stack Web3 DApp ecosystem deployed on Arbitrum (Sepolia testnet / One mainnet). It includes a Vanilla JS frontend (no framework), 16 Solidity smart contracts, a Rust/Stylus oracle, Firebase backend, and Vercel deployment. The BKC token (ERC-20) powers the ecosystem.

**Philosophy:** Unstoppable, permissionless DeFi infrastructure. No admin keys, no pause functions, no blacklists. All contracts support the "Operator System" where third-party builders earn commissions by passing their wallet address as the `operator` parameter.

## Build & Development Commands

```bash
# Frontend
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Build to dist/
npm run preview          # Preview production build

# Smart Contracts
npm run compile          # Compile Solidity contracts via Hardhat
npm run test             # Run Hardhat tests

# Deployment
npm run deploy           # Deploy contracts to Arbitrum Sepolia
npm run deploy:master    # Deploy via master script to Arbitrum Sepolia

# Specific script execution
npx hardhat run scripts/deploy_ecosystem.ts --network arbitrumSepolia
npx hardhat run scripts/verify_contracts.ts --network arbitrumSepolia
```

**Required env vars** (in `.env`): `VITE_ALCHEMY_API_KEY`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`, `VITE_ADMIN_WALLET`, `VITE_GAS_POLICY_ID`. Frontend vars use `VITE_` prefix (Vite convention).

## Architecture

### Frontend (Vanilla JS SPA)

No React/Vue/Angular. The app is a single-page application with manual routing:

- **`index.html`** — Entry point, loads Tailwind via CDN and ethers.js from ESM
- **`app.js`** — Bootstrap, defines `routes` object mapping page IDs to page components, manages SPA navigation
- **`state.js`** — Global reactive state using ES6 `Proxy`. Changes to tracked properties (balances, connection status) auto-trigger UI updates
- **`config.js`** — Network configuration, RPC URLs (multi-RPC failover system), contract ABIs, MetaMask auto-config
- **`utils.js`** — Formatting helpers (`formatBigNumber`, `formatPStake`, etc.)
- **`ui-feedback.js`** — Toast notifications, modals, share dialogs
- **`dom-elements.js`** — Cached DOM element references

**Page pattern:** Each page in `pages/` exports a class with `render()` and optionally cleanup. Pages have their own local state objects. Pages import transaction handlers from `modules/transactions/` and data loaders from `modules/data.js`.

### Routing

```js
// app.js — routes object maps hash-based navigation
const routes = {
    'dashboard': DashboardPage,
    'mine': EarnPage,
    'store': StorePage,
    'actions': FortunePoolPage,
    // ...18 total routes
};
```

### Module System (`modules/`)

**Core infrastructure** (`modules/core/`):
- **`transaction-engine.js`** — Central transaction executor. All blockchain writes go through `txEngine.execute()`. Flow: anti-reentrancy → network validation → balance check → domain validation → approval → gas simulation → execute → confirm → cache invalidation
- **`cache-manager.js`** — TTL-based caching for RPC data with auto-cleanup
- **`error-handler.js`** — Typed error codes (`ErrorTypes`) and user-friendly messages
- **`network-manager.js`** — Chain detection, auto-switching, network change listeners
- **`gas-manager.js`** — Gas estimation with safety margins
- **`validation-layer.js`** — Input validation (addresses, amounts, balances)
- **`operator.js`** — Operator system (third-party builder commissions via `resolveOperator()`)

Import via barrel: `import { txEngine, CacheManager, ErrorHandler } from './core/index.js'`

**Transaction handlers** (`modules/transactions/`):
Each feature has a dedicated `-tx.js` file exposing a namespace object and individual functions:
- `charity-tx.js` → `CharityTx` (donate, createCampaign, withdraw)
- `staking-tx.js` → `StakingTx` (delegate, unstake, claimRewards)
- `nft-tx.js` → `NftTx` (buyNft, sellNft via bonding curves)
- `fortune-tx.js` → `FortuneTx` (commit-reveal game pattern)
- `rental-tx.js` → `RentalTx` (list, rent, withdraw NFTs)
- `notary-tx.js` → `NotaryTx` (notarize documents on-chain)
- `backchat-tx.js` → BackchatTx (social posts, likes, follows)
- `faucet-tx.js` → `FaucetTx` (testnet token claims)

Import via barrel: `import { CharityTx, StakingTx } from './transactions/index.js'`

**Support services:**
- **`wallet.js`** — Web3Modal + ethers.js v6 integration. Creates both signer contracts (MetaMask, for writes) and public contracts (Alchemy RPC, for reads). Multi-RPC failover system
- **`firebase-auth-service.js`** — Firebase Auth with wallet-based sign-in
- **`data.js`** — Data loading, API endpoints, contract read helpers

### Dual Provider Pattern

The app maintains two sets of contract instances in `state.js`:
- **Signer contracts** (`bkcTokenContract`, etc.) — Connected to MetaMask, used for transactions
- **Public contracts** (`bkcTokenContractPublic`, etc.) — Connected to Alchemy RPC, used for background reads without triggering MetaMask popups

### Smart Contracts (`contracts/solidity/`)

Solidity 0.8.28 compiled with Hardhat. Optimizer: `runs: 1` + `viaIR: true` (aggressive size optimization for Arbitrum's contract size limits). Key contracts:

- **`EcosystemManager.sol`** — Master orchestrator, manages fees and pStake requirements
- **`BKCToken.sol`** — ERC-20 with activity-based minting (80% distributed as rewards)
- **`DelegationManager.sol`** / **`MiningManager.sol`** — Staking and reward distribution
- **`FortunePool.sol`** — Commit-reveal gaming with oracle randomness
- **`NFTLiquidityPool.sol`** + **`Factory`** — Bonding curve NFT trading (4 tiers: Diamond/Gold/Silver/Bronze)
- **`Backchat.sol`** — On-chain social network (largest contract ~59KB)
- **`CharityPool.sol`**, **`RentalManager.sol`**, **`DecentralizedNotary.sol`** — Feature contracts
- **`BackchainGovernance.sol`** — DAO voting
- **`IInterfaces.sol`** — All interface definitions shared across contracts

**Rust/Stylus oracle** (`contracts/stylus/backcoin-oracle/`): Free randomness oracle for Arbitrum, built with Arbitrum Stylus (Rust→WASM).

### Contract Addresses

All deployed addresses are in `deployment-addresses.json` at the project root. Loaded at runtime by `config.js` via `loadAddresses()`. Network: Arbitrum Sepolia (Chain ID: 421614).

### Deployment & Infrastructure

- **Frontend hosting:** Vercel (configured in `vercel.json`). API routes in `api/` run as Vercel serverless functions
- **Backend:** Firebase (project: `airdropbackchainnew`). Cloud Functions in `functions/`, Auth + Realtime DB
- **IPFS:** NFT metadata uploaded via Pinata SDK and nft.storage (`api/upload.js`)
- **Contract deployment:** `scripts/deploy_ecosystem.ts` deploys all contracts. Uses OpenZeppelin upgradeable proxies (tracked in `.openzeppelin/`)

## Key Conventions

- All frontend code is Vanilla JS (ES modules), no TypeScript, no framework. Only `scripts/` and `hardhat.config.cts` use TypeScript
- `ethers` is loaded globally via CDN (`window.ethers`), not imported from node_modules in frontend code
- Comments and variable names are mixed Portuguese/English
- Version comments at file tops (e.g., `// ✅ PRODUCTION V1.5`) track changes
- The `scripts/deletar/` folder contains archived/deprecated scripts (deletar = "delete" in Portuguese)
- NFT tiers: Diamond (50% boost), Gold (40%), Silver (25%), Bronze (10%) — boost reduces burn rate on rewards
