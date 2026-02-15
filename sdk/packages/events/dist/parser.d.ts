import { ethers } from 'ethers';
import type { BaseEvent, ParsedEvent } from './types.js';
/**
 * Parses raw blockchain logs into typed Backchain events.
 *
 * @example
 * ```ts
 * import { EventParser, STAKING_EVENTS } from '@backchain/events';
 *
 * const parser = new EventParser();
 * parser.register('StakingPool', STAKING_EVENTS);
 *
 * const events = parser.parseMany(logs, 'StakingPool');
 * ```
 */
export declare class EventParser {
    private interfaces;
    private addressMap;
    /**
     * Register a contract ABI for event parsing.
     * @param contractName Identifier (e.g. 'StakingPool')
     * @param abi Human-readable ABI strings or ethers Interface
     * @param address Optional contract address for auto-detection in parseReceipt()
     */
    register(contractName: string, abi: readonly string[] | string[] | ethers.Interface, address?: string): void;
    /**
     * Register all contracts at once with an address map.
     * @param contracts Map of contractName → { abi, address }
     */
    registerAll(contracts: Record<string, {
        abi: readonly string[];
        address: string;
    }>): void;
    /**
     * Parse a single log into a typed event.
     * @returns ParsedEvent or null if the log doesn't match
     */
    parse<T extends BaseEvent = BaseEvent>(log: ethers.Log, contractName: string): ParsedEvent<T> | null;
    /**
     * Parse multiple logs (batch).
     */
    parseMany<T extends BaseEvent = BaseEvent>(logs: readonly ethers.Log[], contractName: string): ParsedEvent<T>[];
    /**
     * Parse all logs from a transaction receipt.
     * Auto-detects contract from log.address if registered via address.
     */
    parseReceipt(receipt: ethers.TransactionReceipt): ParsedEvent[];
}
//# sourceMappingURL=parser.d.ts.map