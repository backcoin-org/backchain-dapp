import type { ContractAddresses, NetworkId } from '../types/index.js';
export declare function getAddresses(network: NetworkId): ContractAddresses;
/** NFT pool address by tier (0=Bronze, 1=Silver, 2=Gold, 3=Diamond) */
export declare function getPoolAddress(addresses: ContractAddresses, tier: number): string;
//# sourceMappingURL=addresses.d.ts.map