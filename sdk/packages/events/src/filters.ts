import { ethers } from 'ethers';

/** Event filter for use with ethers.js provider.getLogs() */
export interface EventFilter {
    address?: string | string[];
    topics?: Array<string | string[] | null>;
    fromBlock?: number | 'latest';
    toBlock?: number | 'latest';
}

/**
 * Fluent builder for event filters.
 *
 * @example
 * ```ts
 * const filter = new FilterBuilder()
 *   .address('0x...')
 *   .event('Delegated(address,uint256,uint256,uint256,uint256,address)')
 *   .indexed(1, userAddress)
 *   .range(fromBlock, 'latest')
 *   .build();
 *
 * const logs = await provider.getLogs(filter);
 * ```
 */
export class FilterBuilder {
    private _filter: EventFilter = {};

    /** Filter by contract address(es). */
    address(addr: string | string[]): this {
        this._filter.address = addr;
        return this;
    }

    /** Set topic0 from a full event signature (auto-hashes). */
    event(signature: string): this {
        if (!this._filter.topics) this._filter.topics = [];
        this._filter.topics[0] = ethers.id(signature);
        return this;
    }

    /** Set topic0 directly (pre-hashed). */
    topic0(hash: string): this {
        if (!this._filter.topics) this._filter.topics = [];
        this._filter.topics[0] = hash;
        return this;
    }

    /** Set an indexed parameter topic (position 1-3). */
    indexed(position: 1 | 2 | 3, value: string | string[] | null): this {
        if (!this._filter.topics) this._filter.topics = [];
        // Pad address values to 32 bytes
        if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
            this._filter.topics[position] = ethers.zeroPadValue(value, 32);
        } else {
            this._filter.topics[position] = value;
        }
        return this;
    }

    /** Set block range. */
    range(from: number | 'latest', to: number | 'latest'): this {
        this._filter.fromBlock = from;
        this._filter.toBlock = to;
        return this;
    }

    /** Set starting block. */
    fromBlock(block: number | 'latest'): this {
        this._filter.fromBlock = block;
        return this;
    }

    /** Set ending block. */
    toBlock(block: number | 'latest'): this {
        this._filter.toBlock = block;
        return this;
    }

    /** Build the filter object. */
    build(): EventFilter {
        return { ...this._filter };
    }
}

/** Shorthand: create a filter for a specific event signature. */
export function eventFilter(signature: string): FilterBuilder {
    return new FilterBuilder().event(signature);
}
