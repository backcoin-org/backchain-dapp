// @backchain/sdk — Contract Addresses per Network
// ============================================================================

import type { ContractAddresses, NetworkId } from '../types/index.js';

/** Arbitrum Sepolia testnet addresses (current deployment) */
const SEPOLIA_ADDRESSES: ContractAddresses = {
    bkcToken: '0x8264fa8C238Ca723A5D55D77E7aeC1271bd7E737',
    backchainEcosystem: '0x967857764D5Aa4952bEC08684293B1f52e4F6be2',
    liquidityPool: '0xE32D9D147b650100701d36bF91c49c2c43CFFEd8',
    stakingPool: '0xcf21A15853812730C3b22B794A519BE60D8331c7',
    buybackMiner: '0x9a33254a3e37C68be45Dd8Fad0357Cfc2c4B4e47',
    rewardBooster: '0xfa95fB1A4A293d01B2c19c71aAE448a6806465A7',
    nftFusion: '0x72D7E16F34363C04f30b014692ebB7a93335e75F',
    poolBronze: '0x39cB88dC4620902a706bfE210b161EB2c3f427f3',
    fortunePool: '0x0407B1AC0D42c41026161bE10BfeE97223a780ae',
    agora: '0xa879F909A5415A28Eb953F2109cE5590658F80Df',
    notary: '0x34C2541D4196B681C6DA5D4cE30BB4597BC3774A',
    charityPool: '0xBc6876aef3C250e909Ab1312F28C11e4e151A3a7',
    rentalManager: '0x69ef555320F5A8627883E52d5780AD093eFbC908',
    backchainGovernance: '0x74b6A8a77438d5B9Fd8b304Bd2c58F3f036E8C88',
};

/** Arbitrum One mainnet addresses (TBD) */
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
    'arbitrum-sepolia': SEPOLIA_ADDRESSES,
    'arbitrum-one': MAINNET_ADDRESSES,
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
