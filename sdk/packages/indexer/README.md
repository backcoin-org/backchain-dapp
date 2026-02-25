# @backchain/indexer

Resumable blockchain event indexer for the Backchain DeFi ecosystem.

## Install

```bash
npm install @backchain/indexer
```

## Quick Start

```ts
import { EventIndexer, FileCheckpoint, EventPipeline } from '@backchain/indexer';
import { STAKING_EVENTS } from '@backchain/events';

const checkpoint = new FileCheckpoint('./checkpoint.json');
const indexer = new EventIndexer({
  provider,
  contracts: [{ address: addresses.StakingPool, events: STAKING_EVENTS }],
  checkpoint,
  fromBlock: 10_308_450n,
  pollingInterval: 5000,
  batchSize: 2000,
});

indexer.on('Staked', async (event) => {
  await db.insert(event);
});

await indexer.start();
```

## API

### `EventIndexer`

The main polling engine. Fetches events in batches, applies handlers, and persists progress.

- `new EventIndexer(config: IndexerConfig): EventIndexer`
- `on(eventName: string, handler: EventHandler): this` — register a handler for a named event.
- `use(pipeline: EventPipeline): this` — attach a pipeline of chained handlers.
- `start(): Promise<void>` — begin polling; resolves only when `stop()` is called.
- `stop(): Promise<void>` — gracefully stop polling after the current batch completes.
- `getStatus(): IndexerStatus` — returns current block, lag behind head, and events processed.

### `InMemoryCheckpoint`

Stores the last indexed block in memory. Resets on process restart.

- `new InMemoryCheckpoint(initialBlock?: bigint): InMemoryCheckpoint`
- `get(): Promise<bigint>` — returns the last saved block number.
- `set(block: bigint): Promise<void>` — saves the current block number.

### `FileCheckpoint`

Persists the last indexed block to a JSON file on disk. Safe across restarts.

- `new FileCheckpoint(filePath: string): FileCheckpoint`
- `get(): Promise<bigint>` — reads and returns the saved block number.
- `set(block: bigint): Promise<void>` — writes the current block number to disk.

### `EventPipeline`

Chains multiple event handlers into a sequential processing pipeline.

- `new EventPipeline(): EventPipeline`
- `pipe(handler: EventHandler): this` — append a handler to the pipeline.
- `run(event: ParsedEvent): Promise<void>` — execute all handlers in order for a single event.

### `IndexerConfig`

| Field | Type | Description |
|---|---|---|
| `provider` | `Provider` | ethers.js v6 provider |
| `contracts` | `ContractConfig[]` | Contracts and event sets to watch |
| `checkpoint` | `Checkpoint` | Persistence backend |
| `fromBlock` | `bigint` | Block to start from if no checkpoint exists |
| `pollingInterval` | `number` | Milliseconds between polls (default: 5000) |
| `batchSize` | `number` | Max blocks per `eth_getLogs` call (default: 2000) |
| `rateLimit` | `number` | Max RPC calls per second (default: 10) |

## License

MIT
