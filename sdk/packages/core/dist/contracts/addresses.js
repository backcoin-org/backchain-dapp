// @backchain/sdk — Contract Addresses per Network
// ============================================================================
/** Sepolia testnet addresses (current active deployment) */
const SEPOLIA_ADDRESSES = {
    bkcToken: '0x9304f20616bC1B257056Efc21Ed4c8fD533f0046',
    backchainEcosystem: '0x332a389b8b8520f87c3A368f6b63AEf3fA11cD95',
    liquidityPool: '0x33c14C91333a74591EAbBBF730c47f02C0408dD8',
    stakingPool: '0x258DFd42d651d8BF26C717800518a0c349ab684e',
    buybackMiner: '0x56c20A44C8a85baF800370eafE4caA1b8Fd929CB',
    rewardBooster: '0x38661F80183e00F47900FdD6b178Aad465dB81eA',
    nftFusion: '0x312683814F1F23649CC01D8b459dE3AEFE669389',
    poolBronze: '0x31B5f95777Fae91fc92b61742a1a342ab33763Bf',
    fortunePool: '0xb006BF04706762D595099FB4caE80Bd2d3Bf3854',
    agora: '0x9a70787D3c3363bF217bE2e087803CF5A68ed128',
    notary: '0x24DE64b742718998eD58426C45fE20298679250F',
    charityPool: '0x848c5F6eA7a78E72ee01E37D64FE325f5Fa20B25',
    rentalManager: '0x4eaf5e1f03458c905907f3bc747B4F9e7B8a3b4a',
    backchainGovernance: '0x0DcFFB8899af2025080c6ab0535C2EE38Cd25F0C',
    simpleBkcFaucet: '0x119F743Cdc45Dc34958dA981b4b5dEA4df6b417B',
};
/** opBNB Testnet addresses (to be updated after deployment) */
const TESTNET_ADDRESSES = {
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
const MAINNET_ADDRESSES = {
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
const ADDRESSES = {
    'sepolia': SEPOLIA_ADDRESSES,
    'opbnb-testnet': TESTNET_ADDRESSES,
    'opbnb-mainnet': MAINNET_ADDRESSES,
};
export function getAddresses(network) {
    return ADDRESSES[network];
}
/** NFT pool address by tier (0=Bronze, 1=Silver, 2=Gold, 3=Diamond) */
export function getPoolAddress(addresses, tier) {
    const pools = [addresses.poolBronze, addresses.poolSilver || '', addresses.poolGold || '', addresses.poolDiamond || ''];
    if (tier < 0 || tier > 3)
        throw new Error(`Invalid tier: ${tier}. Must be 0-3.`);
    const addr = pools[tier];
    if (!addr)
        throw new Error(`Pool for tier ${tier} not yet deployed.`);
    return addr;
}
//# sourceMappingURL=addresses.js.map