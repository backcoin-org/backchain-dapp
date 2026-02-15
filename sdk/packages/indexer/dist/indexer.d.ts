import { ethers } from 'ethers';
import type { BaseEvent } from '@backchain/events';
import { EventParser } from '@backchain/events';
import type { CheckpointStore } from './checkpoint.js';
import type { EventHandler } from './pipeline.js';
export interface IndexerConfig {
    /** JSON-RPC provider (read-only). */
    provider: ethers.JsonRpcProvider;
    /** Event parser with registered ABIs. */
    parser: EventParser;
    /** Checkpoint store for resumable indexing (default: InMemory). */
    checkpoint?: CheckpointStore;
    /** Polling interval in ms (default: 2000). */
    pollInterval?: number;
    /** Max blocks per queryFilter call (default: 2000). */
    batchSize?: number;
    /** Min delay between RPC calls in ms (default: 100). */
    rateLimit?: number;
}
/**
 * Index blockchain events with automatic polling, backfilling, and checkpointing.
 *
 * @example
 * ```ts
 * import { EventIndexer } from '@backchain/indexer';
 * import { EventParser, STAKING_EVENTS } from '@backchain/events';
 *
 * const parser = new EventParser();
 * parser.register('StakingPool', STAKING_EVENTS);
 *
 * const indexer = new EventIndexer({
 *   provider: new ethers.JsonRpcProvider(RPC_URL),
 *   parser,
 * });
 *
 * // Live polling
 * await indexer.index('StakingPool', ADDRESS, 'Delegated', (event) => {
 *   console.log(event.args.user, 'delegated', event.args.amount);
 * });
 * ```
 */
export declare class EventIndexer {
    private config;
    private running;
    constructor(config: IndexerConfig);
    /**
     * Start live-polling for events. Resumes from checkpoint if available.
     * Runs until stop() is called.
     */
    index<T extends BaseEvent = BaseEvent>(contractName: string, address: string, eventName: string, handler: EventHandler<T>, fromBlock?: number): Promise<void>;
    /**
     * Backfill historical events (one-time, non-blocking).
     */
    backfill<T extends BaseEvent = BaseEvent>(contractName: string, address: string, eventName: string, handler: EventHandler<T>, fromBlock: number, toBlock?: number | 'latest'): Promise<number>;
    /**
     * Stream events as an async iterator.
     *
     * @example
     * ```ts
     * for await (const event of indexer.stream('StakingPool', addr, 'Delegated')) {
     *   console.log(event.args);
     * }
     * ```
     */
    stream<T extends BaseEvent = BaseEvent>(contractName: string, address: string, eventName: string, fromBlock?: number): AsyncIterableIterator<T>;
    /** Stop all running index/stream loops. */
    stop(): void;
    /** Whether the indexer is currently running. */
    get isRunning(): boolean;
    private _queryAndParse;
    private _sleep;
}
//# sourceMappingURL=indexer.d.ts.map