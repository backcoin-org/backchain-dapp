// @backchain/sdk — Contract Addresses per Network
// ============================================================================
/** Sepolia testnet addresses (current active deployment) */
const SEPOLIA_ADDRESSES = {
    bkcToken: '0x080627Bd394e0F34535B0F3c70090D181f87d913',
    backchainEcosystem: '0xB0FA8544d8bEF47Fb691c17D3086BA30ed3B400C',
    liquidityPool: '0xAe22a5Dc2424d97F8915A49C99B924D20082Cb24',
    stakingPool: '0xA7B61b8597A00D738FDb3715563F00e5cef0bB7f',
    buybackMiner: '0x47B9F6F8517542eb93130af4B04834E7da279Bcd',
    rewardBooster: '0x99E790Fac2a825654D480492CDBb779e3EB53dF4',
    nftFusion: '0x89605E4cf3c49bE3d7b519D1a7ac91980078D4c7',
    poolBronze: '0xCF6b80128c3A355aE1775bC2E9639305B850459E',
    fortunePool: '0xC76b8F773414D101231FE265Af0A84C32eeb7460',
    agora: '0xa4c0FC770579F644fc4595a82d0d138f7088da90',
    notary: '0xFe3F90C76F1aAEED93b8063238658FF3CAD62d24',
    charityPool: '0x0E0B7277A8d454155b2152d3E0b3BAa9B63F54Ab',
    rentalManager: '0x9c42BF4860ad02e95A6bd944aC2a11036cC959Ed',
    backchainGovernance: '0x28244003181711f09f9573BAf0E26F879A278227',
    simpleBkcFaucet: '0xc4B75392935541Bef1D58e152522ce60559610bf',
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