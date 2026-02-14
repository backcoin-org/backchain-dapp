// @backchain/sdk — Contract Addresses per Network
// ============================================================================

import type { ContractAddresses, NetworkId } from '../types/index.js';

/** Arbitrum Sepolia testnet addresses (current deployment) */
const SEPOLIA_ADDRESSES: ContractAddresses = {
    bkcToken: '0x4d8bF6a6ebCa6FEc94Ac975Ee4B097d5b194dDa3',
    backchainEcosystem: '0xE08F491C07BFdA63dfd50b7305a756f527398065',
    liquidityPool: '0x58B4284Ce727bffe3439bEE9441dcfA8B9E61052',
    stakingPool: '0x74Cb45E5aE1e15E0816C072E4BDC2227158196E7',
    buybackMiner: '0xbac1622A845d4A27f5B3f5714ba4a2231Bd49d0E',
    rewardBooster: '0xff95a8dB84dFc2f7562d17436Ceb1C4e1b9563f6',
    nftFusion: '0x5477cD750d920eEc0F73E5A55aA33a667D5DD30a',
    poolBronze: '0x59F0197FA5D4b75ADC32A6cdD19aA2807dDf8093',
    poolSilver: '0x619C4482b68934B0e3519a941406ddF54F9F2204',
    poolGold: '0xfc4340f72AEFfa6Aa9F0D3c878f1BfC3b27A3641',
    poolDiamond: '0xAf667626998A6a4320c9DD3A62930578e35043d4',
    fortunePool: '0x2d2CB332f61A1dB1cCfD67002fE38b846CA1F063',
    agora: '0x822aDceaa6F88B8c1c9DE736a412265B58aE9039',
    notary: '0x19518B29BbC8b085B68c8AceC42317b0db581CB5',
    charityPool: '0x1645974236BE5548df645010e5bc2ac5DF59Edf7',
    rentalManager: '0x13323724a20cd48C5dD78f78b5aa07D8Cc46EDf3',
    simpleBkcFaucet: '0x350888B5dCB1D616350c0da2929A0b093DeBF03D',
    backchainGovernance: '0x8507A1BEcEAA3D31af35E31212c9f4E475C027C8',
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
    poolSilver: '',
    poolGold: '',
    poolDiamond: '',
    fortunePool: '',
    agora: '',
    notary: '',
    charityPool: '',
    rentalManager: '',
    simpleBkcFaucet: '',
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
    const pools = [addresses.poolBronze, addresses.poolSilver, addresses.poolGold, addresses.poolDiamond];
    if (tier < 0 || tier > 3) throw new Error(`Invalid tier: ${tier}. Must be 0-3.`);
    return pools[tier];
}
