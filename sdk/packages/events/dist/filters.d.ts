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
export declare class FilterBuilder {
    private _filter;
    /** Filter by contract address(es). */
    address(addr: string | string[]): this;
    /** Set topic0 from a full event signature (auto-hashes). */
    event(signature: string): this;
    /** Set topic0 directly (pre-hashed). */
    topic0(hash: string): this;
    /** Set an indexed parameter topic (position 1-3). */
    indexed(position: 1 | 2 | 3, value: string | string[] | null): this;
    /** Set block range. */
    range(from: number | 'latest', to: number | 'latest'): this;
    /** Set starting block. */
    fromBlock(block: number | 'latest'): this;
    /** Set ending block. */
    toBlock(block: number | 'latest'): this;
    /** Build the filter object. */
    build(): EventFilter;
}
/** Shorthand: create a filter for a specific event signature. */
export declare function eventFilter(signature: string): FilterBuilder;
//# sourceMappingURL=filters.d.ts.map