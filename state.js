// state.js

export const State = {
    // Wallet & Connection
    provider: null,
    publicProvider: null,
    signer: null,
    userAddress: null,
    isConnected: false,

    // Contracts
    bkcTokenContract: null,
    delegationManagerContract: null,
    rewardManagerContract: null,
    rewardBoosterContract: null,
    nftBondingCurveContract: null,
    actionsManagerContract: null, 
    faucetContract: null, // <-- NOVO
    decentralizedNotaryContract: null, // <-- NOVO
    ecosystemManagerContract: null, // <-- (NOVO) ADICIONE ESTA LINHA

    // User Data
    currentUserBalance: 0n,
    userDelegations: [],
    activityHistory: [], 
    myCertificates: [],
    myBoosters: [],
    
    // Public Data
    allValidatorsData: [],
};