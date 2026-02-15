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
export class EventParser {
    private interfaces = new Map<string, ethers.Interface>();
    private addressMap = new Map<string, string>();

    /**
     * Register a contract ABI for event parsing.
     * @param contractName Identifier (e.g. 'StakingPool')
     * @param abi Human-readable ABI strings or ethers Interface
     * @param address Optional contract address for auto-detection in parseReceipt()
     */
    register(contractName: string, abi: readonly string[] | string[] | ethers.Interface, address?: string): void {
        const iface = abi instanceof ethers.Interface ? abi : new ethers.Interface([...abi]);
        this.interfaces.set(contractName, iface);
        if (address) {
            this.addressMap.set(address.toLowerCase(), contractName);
        }
    }

    /**
     * Register all contracts at once with an address map.
     * @param contracts Map of contractName → { abi, address }
     */
    registerAll(contracts: Record<string, { abi: readonly string[]; address: string }>): void {
        for (const [name, { abi, address }] of Object.entries(contracts)) {
            this.register(name, abi, address);
        }
    }

    /**
     * Parse a single log into a typed event.
     * @returns ParsedEvent or null if the log doesn't match
     */
    parse<T extends BaseEvent = BaseEvent>(
        log: ethers.Log,
        contractName: string,
    ): ParsedEvent<T> | null {
        const iface = this.interfaces.get(contractName);
        if (!iface) return null;

        try {
            const desc = iface.parseLog({ topics: log.topics as string[], data: log.data });
            if (!desc) return null;

            const args: Record<string, unknown> = {};
            for (const input of desc.fragment.inputs) {
                args[input.name] = desc.args[input.name];
            }

            return {
                raw: log,
                parsed: {
                    event: desc.name,
                    args,
                    blockNumber: log.blockNumber,
                    blockHash: log.blockHash,
                    transactionHash: log.transactionHash,
                    transactionIndex: log.transactionIndex,
                    logIndex: log.index,
                    address: log.address,
                    removed: log.removed,
                } as T,
            };
        } catch {
            return null;
        }
    }

    /**
     * Parse multiple logs (batch).
     */
    parseMany<T extends BaseEvent = BaseEvent>(
        logs: readonly ethers.Log[],
        contractName: string,
    ): ParsedEvent<T>[] {
        const results: ParsedEvent<T>[] = [];
        for (const log of logs) {
            const parsed = this.parse<T>(log, contractName);
            if (parsed) results.push(parsed);
        }
        return results;
    }

    /**
     * Parse all logs from a transaction receipt.
     * Auto-detects contract from log.address if registered via address.
     */
    parseReceipt(receipt: ethers.TransactionReceipt): ParsedEvent[] {
        const results: ParsedEvent[] = [];
        for (const log of receipt.logs) {
            // Try address-based lookup first
            const contractName = this.addressMap.get(log.address.toLowerCase());
            if (contractName) {
                const parsed = this.parse(log, contractName);
                if (parsed) { results.push(parsed); continue; }
            }
            // Fallback: try all registered interfaces
            for (const name of this.interfaces.keys()) {
                const parsed = this.parse(log, name);
                if (parsed) { results.push(parsed); break; }
            }
        }
        return results;
    }
}
