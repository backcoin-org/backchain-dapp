# @backchain/events

Type-safe event parsing and log filtering for all Backchain smart contracts.

## Install

```bash
npm install @backchain/events
```

## Quick Start

```ts
import { EventParser, FilterBuilder, ALL_EVENT_ABIS } from '@backchain/events';

const parser = new EventParser(ALL_EVENT_ABIS);
const events = parser.parseReceipt(txReceipt);

const filter = new FilterBuilder()
  .contract(addresses.StakingPool)
  .event('Staked')
  .fromBlock(10_308_450n)
  .build();
const logs = await provider.getLogs(filter);
```

## API

### Classes

#### `EventParser`
Parses raw transaction receipts or log arrays into typed event objects.

- `new EventParser(abis: Abi[]): EventParser` — instantiate with one or more contract ABI arrays.
- `parseReceipt(receipt: TransactionReceipt): ParsedEvent[]` — parse all logs in a receipt.
- `parseLogs(logs: Log[]): ParsedEvent[]` — parse an arbitrary array of logs.
- `parseLog(log: Log): ParsedEvent | null` — parse a single log; returns `null` if unrecognised.

#### `FilterBuilder`
Fluent builder for constructing `eth_getLogs` filter objects.

- `contract(address: string): this` — filter by contract address.
- `event(name: string): this` — filter by event name (resolved to topic0).
- `fromBlock(block: bigint | 'latest'): this` — set the starting block.
- `toBlock(block: bigint | 'latest'): this` — set the ending block.
- `topic(index: 1 | 2 | 3, value: string): this` — add an indexed topic filter.
- `build(): Filter` — return the final filter object.

### Exports

#### `ALL_EVENT_ABIS`
Array of all event ABI fragments across all Backchain contracts (117 event signatures).

#### `ALL_EVENTS_FLAT`
Flat array of parsed `EventFragment` objects from every contract.

### Per-Contract Event Sets

Each export contains the event ABI fragments for a single contract:

| Export | Contract |
|---|---|
| `BKC_TOKEN_EVENTS` | BKCToken |
| `ECOSYSTEM_EVENTS` | BackchainEcosystem |
| `STAKING_EVENTS` | StakingPool |
| `LIQUIDITY_EVENTS` | LiquidityPool |
| `BUYBACK_EVENTS` | BuybackMiner |
| `BOOSTER_EVENTS` | RewardBooster |
| `NFT_POOL_EVENTS` | NFTPool |
| `NFT_FUSION_EVENTS` | NFTFusion |
| `RENTAL_EVENTS` | RentalManager |
| `FORTUNE_EVENTS` | FortunePool |
| `AGORA_EVENTS` | Agora |
| `NOTARY_EVENTS` | Notary |
| `CHARITY_EVENTS` | CharityPool |
| `GOVERNANCE_EVENTS` | BackchainGovernance |
| `FAUCET_EVENTS` | SimpleBKCFaucet |

## License

MIT
