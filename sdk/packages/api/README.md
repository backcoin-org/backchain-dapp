# @backchain/api

Server-side helpers for building REST APIs and batched reads on top of the Backchain SDK.

## Install

```bash
npm install @backchain/api
```

## Quick Start

```ts
import express from 'express';
import { backchainMiddleware, setupBackchainRoutes } from '@backchain/api';

const app = express();
app.use(backchainMiddleware({ provider, addresses }));
setupBackchainRoutes(app);
app.listen(3000);
```

## API

### `Multicall`

Batches multiple read calls into a single `eth_call` using Multicall3 at `0xcA11bde05977b3631167028862bE2a173976CA11`.

- `new Multicall(provider: Provider): Multicall`
- `add(target: string, calldata: string): this` — queue a call.
- `execute(): Promise<MulticallResult[]>` — submit all queued calls in one RPC request and return decoded results.
- `executeTyped<T>(calls: TypedCall<T>[]): Promise<T[]>` — typed variant that decodes results according to provided ABI fragments.

```ts
const mc = new Multicall(provider);
mc.add(addresses.BKCToken, iface.encodeFunctionData('totalSupply'));
mc.add(addresses.StakingPool, iface.encodeFunctionData('totalStaked'));
const [supply, staked] = await mc.execute();
```

### `backchainMiddleware(options: MiddlewareOptions)`

Express middleware that constructs a `BackchainContext` and attaches it to `req.backchain` on every request.

- `options.provider` — ethers.js v6 provider instance.
- `options.addresses` — contract address map (loaded from `deployment-addresses.json`).
- `options.signerKey?` — optional private key for server-side signing.

### `generateRoutes(modules: ModuleMap): Router`

Introspects the provided module map and auto-generates `GET` routes for every public read method. Routes follow the pattern `/:module/:method`.

```ts
const router = generateRoutes({ swap: new SwapModule(ctx), staking: new StakingModule(ctx) });
app.use('/api', router);
// GET /api/swap/getCurrentPrice
// GET /api/staking/getTotalStaked
```

### `setupBackchainRoutes(app: Express, options?: SetupOptions)`

Convenience function that calls `backchainMiddleware()` and `generateRoutes()` together and mounts all routes under `/api` (configurable via `options.prefix`).

## Notes

- `Multicall3` is available on all major EVM networks at the canonical address.
- `backchainMiddleware` is stateless; a new `BackchainContext` is created per-request.
- Generated routes are read-only (`GET`). Write operations must be implemented manually with a signer.

## License

MIT
