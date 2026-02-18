// @backchain/sdk — Contract Addresses per Network
// ============================================================================

import type { ContractAddresses, NetworkId } from '../types/index.js';

/** opBNB Testnet addresses (to be updated after deployment) */
const TESTNET_ADDRESSES: ContractAddresses = {
    bkcToken: '',
    backchainEcosystem: '',
    liquidityPool: '',
    stakingPool: '',
    buybackMiner: '',
    rewardBooster: '',
    nftFusion: '',
    poolBronze: '',
    fortunePool: '',
    agora: '',
    notary: '',
    charityPool: '',
    rentalManager: '',
    backchainGovernance: '',
};

/** opBNB Mainnet addresses (TBD) */
const MAINNET_ADDRESSES: ContractAddresses = {
    bkcToken: '',
    backchainEcosystem: '',
    liquidityPool: '',
    stakingPool: '',
    buybackMiner: '',
    rewardBooster: '',
    nftFusion: '',
    poolBronze: '',
    fortunePool: '',
    agora: '',
    notary: '',
    charityPool: '',
    rentalManager: '',
    backchainGovernance: '',
};

const ADDRESSES: Record<NetworkId, ContractAddresses> = {
    'opbnb-testnet': TESTNET_ADDRESSES,
    'opbnb-mainnet': MAINNET_ADDRESSES,
};

export function getAddresses(network: NetworkId): ContractAddresses {
    return ADDRESSES[network];
}

/** NFT pool address by tier (0=Bronze, 1=Silver, 2=Gold, 3=Diamond) */
export function getPoolAddress(addresses: ContractAddresses, tier: number): string {
    const pools = [addresses.poolBronze, addresses.poolSilver || '', addresses.poolGold || '', addresses.poolDiamond || ''];
    if (tier < 0 || tier > 3) throw new Error(`Invalid tier: ${tier}. Must be 0-3.`);
    const addr = pools[tier];
    if (!addr) throw new Error(`Pool for tier ${tier} not yet deployed.`);
    return addr;
}
