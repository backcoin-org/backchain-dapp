import { ethers } from 'ethers';
import { InMemoryCheckpoint } from './checkpoint.js';
// ── EventIndexer ────────────────────────────────────────────────────────────
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
export class EventIndexer {
    config;
    running = false;
    constructor(config) {
        this.config = {
            checkpoint: new InMemoryCheckpoint(),
            pollInterval: 2000,
            batchSize: 2000,
            rateLimit: 100,
            ...config,
        };
    }
    /**
     * Start live-polling for events. Resumes from checkpoint if available.
     * Runs until stop() is called.
     */
    async index(contractName, address, eventName, handler, fromBlock) {
        const key = `${contractName}:${eventName}`;
        const checkpoint = await this.config.checkpoint.get(key);
        const startBlock = fromBlock ?? checkpoint ?? await this.config.provider.getBlockNumber();
        this.running = true;
        let current = startBlock;
        while (this.running) {
            try {
                const latest = await this.config.provider.getBlockNumber();
                if (current > latest) {
                    await this._sleep(this.config.pollInterval);
                    continue;
                }
                const end = Math.min(current + this.config.batchSize - 1, latest);
                const events = await this._queryAndParse(contractName, address, eventName, current, end);
                for (const { parsed } of events) {
                    await handler(parsed);
                }
                await this.config.checkpoint.set(key, end + 1);
                current = end + 1;
                if (current <= latest) {
                    await this._sleep(this.config.rateLimit);
                }
                else {
                    await this._sleep(this.config.pollInterval);
                }
            }
            catch (err) {
                console.error(`[indexer] Error at block ${current}:`, err);
                await this._sleep(this.config.pollInterval * 2);
            }
        }
    }
    /**
     * Backfill historical events (one-time, non-blocking).
     */
    async backfill(contractName, address, eventName, handler, fromBlock, toBlock = 'latest') {
        const finalBlock = toBlock === 'latest'
            ? await this.config.provider.getBlockNumber()
            : toBlock;
        let current = fromBlock;
        let total = 0;
        while (current <= finalBlock) {
            const end = Math.min(current + this.config.batchSize - 1, finalBlock);
            const events = await this._queryAndParse(contractName, address, eventName, current, end);
            for (const { parsed } of events) {
                await handler(parsed);
            }
            total += events.length;
            current = end + 1;
            if (current <= finalBlock) {
                await this._sleep(this.config.rateLimit);
            }
        }
        return total;
    }
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
    async *stream(contractName, address, eventName, fromBlock) {
        const startBlock = fromBlock ?? await this.config.provider.getBlockNumber();
        let current = startBlock;
        this.running = true;
        while (this.running) {
            try {
                const latest = await this.config.provider.getBlockNumber();
                if (current > latest) {
                    await this._sleep(this.config.pollInterval);
                    continue;
                }
                const end = Math.min(current + this.config.batchSize - 1, latest);
                const events = await this._queryAndParse(contractName, address, eventName, current, end);
                for (const { parsed } of events) {
                    yield parsed;
                }
                current = end + 1;
                await this._sleep(current <= latest ? this.config.rateLimit : this.config.pollInterval);
            }
            catch (err) {
                console.error(`[indexer] Stream error at block ${current}:`, err);
                await this._sleep(this.config.pollInterval * 2);
            }
        }
    }
    /** Stop all running index/stream loops. */
    stop() {
        this.running = false;
    }
    /** Whether the indexer is currently running. */
    get isRunning() {
        return this.running;
    }
    // ── Private ─────────────────────────────────────────────────────────────
    async _queryAndParse(contractName, address, eventName, fromBlock, toBlock) {
        const contract = new ethers.Contract(address, [`event ${eventName}`], this.config.provider);
        const logs = await contract.queryFilter(eventName, fromBlock, toBlock);
        return this.config.parser.parseMany(logs, contractName);
    }
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=indexer.js.map