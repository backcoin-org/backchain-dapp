# @backchain/core

Foundation package for the Backchain SDK. Provides the dual provider system, fee calculator, contract ABIs, types, and the `BackchainContext` interface that all modules depend on.

```bash
npm install @backchain/core ethers
```

## When to use Core directly

Use `@backchain/core` instead of the full `@backchain/sdk` when you only need 1-2 modules and want a smaller bundle:

```typescript
import { createContext } from '@backchain/core';
import { StakingModule } from '@backchain/staking';

const ctx = createContext({ operator: '0xYOUR_WALLET' });
await ctx.connect();

const staking = new StakingModule(ctx);
await staking.delegate(ethers.parseEther('100'), 365);
```

## BackchainContext

The decoupling interface. All modules depend on this, not on the full Backchain class:

```typescript
interface BackchainContext {
    readonly operator: string;
    readonly network: NetworkId;
    readonly provider: ProviderManager;
    readonly addresses: ContractAddresses;

    connect(): Promise<string>;
    connectWithSigner(signer: ethers.Signer): Promise<string>;
    disconnect(): void;
    calculateFee(actionId: string, txValue?: bigint): Promise<bigint>;
    getBkcAllowance(spender: string, owner?: string): Promise<bigint>;
    approveBkc(spender: string, amount: bigint): Promise<TxResult>;
}
```

## Dual Provider

Separates reads from writes to prevent MetaMask rate-limiting:

- **Reader** (`provider.reader`): Public RPC for background reads, no wallet popups
- **Signer** (`provider.getWriteContract()`): MetaMask/injected wallet for writes

## Fee Calculator

Solves the `eth_call gasPrice=0` problem. Reads fee config from the Ecosystem contract and computes fees client-side:

```typescript
import { calculateFee, ACTION_IDS, nftActionId } from '@backchain/core';

const fee = await calculateFee(provider, ecosystemAddress, ACTION_IDS.STAKING_DELEGATE);
const nftFee = await calculateFee(provider, ecosystemAddress, nftActionId('NFT_BUY_T', 0));
```

## Networks

```typescript
type NetworkId = 'sepolia' | 'opbnb-testnet' | 'opbnb-mainnet';
```

## Exports

- `createContext()` — Lightweight BackchainContext factory
- `ProviderManager` — Dual provider system
- `getNetworkConfig()` — Network configuration
- `calculateFee()` — Client-side fee calculator
- `actionId()`, `nftActionId()`, `notaryActionId()` — Action ID helpers
- `getAddresses()`, `getPoolAddress()` — Contract address lookup
- All contract ABIs (`BKC_TOKEN_ABI`, `ECOSYSTEM_ABI`, etc.)
- All TypeScript types and interfaces

## License

MIT
