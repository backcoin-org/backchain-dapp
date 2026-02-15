import { ethers } from 'ethers';
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
    interfaces = new Map();
    addressMap = new Map();
    /**
     * Register a contract ABI for event parsing.
     * @param contractName Identifier (e.g. 'StakingPool')
     * @param abi Human-readable ABI strings or ethers Interface
     * @param address Optional contract address for auto-detection in parseReceipt()
     */
    register(contractName, abi, address) {
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
    registerAll(contracts) {
        for (const [name, { abi, address }] of Object.entries(contracts)) {
            this.register(name, abi, address);
        }
    }
    /**
     * Parse a single log into a typed event.
     * @returns ParsedEvent or null if the log doesn't match
     */
    parse(log, contractName) {
        const iface = this.interfaces.get(contractName);
        if (!iface)
            return null;
        try {
            const desc = iface.parseLog({ topics: log.topics, data: log.data });
            if (!desc)
                return null;
            const args = {};
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
                },
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Parse multiple logs (batch).
     */
    parseMany(logs, contractName) {
        const results = [];
        for (const log of logs) {
            const parsed = this.parse(log, contractName);
            if (parsed)
                results.push(parsed);
        }
        return results;
    }
    /**
     * Parse all logs from a transaction receipt.
     * Auto-detects contract from log.address if registered via address.
     */
    parseReceipt(receipt) {
        const results = [];
        for (const log of receipt.logs) {
            // Try address-based lookup first
            const contractName = this.addressMap.get(log.address.toLowerCase());
            if (contractName) {
                const parsed = this.parse(log, contractName);
                if (parsed) {
                    results.push(parsed);
                    continue;
                }
            }
            // Fallback: try all registered interfaces
            for (const name of this.interfaces.keys()) {
                const parsed = this.parse(log, name);
                if (parsed) {
                    results.push(parsed);
                    break;
                }
            }
        }
        return results;
    }
}
//# sourceMappingURL=parser.js.map