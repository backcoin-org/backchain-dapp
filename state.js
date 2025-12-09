// state.js
// ✅ VERSÃO FINAL: State Reativo (Proxy) + Separação Público/Privado + Cache de Sistema

const initialState = {
    // ============================================================
    // 1. WALLET & CONNECTION
    // ============================================================
    provider: null,           // BrowserProvider (Metamask/WalletConnect) - Para Transações
    publicProvider: null,     // JsonRpcProvider (Infura) - Para Leitura Rápida
    web3Provider: null,       // Provider original do Web3Modal
    signer: null,             // Signer atual
    userAddress: null,        // Endereço conectado (0x...)
    isConnected: false,       // Flag de conexão

    // ============================================================
    // 2. CONTRACTS (SIGNER - Para Escrita/Transações)
    // ============================================================
    bkcTokenContract: null,
    delegationManagerContract: null,
    rewardBoosterContract: null,
    nftLiquidityPoolContract: null, // Antigo nftBondingCurve
    actionsManagerContract: null,   // FortunePool
    faucetContract: null,
    decentralizedNotaryContract: null,
    ecosystemManagerContract: null,
    publicSaleContract: null,

    // ============================================================
    // 3. CONTRACTS (PUBLIC - Para Leitura em Background)
    // ============================================================
    // Estes contratos usam a chave da Infura e nunca pedem assinatura
    bkcTokenContractPublic: null,
    delegationManagerContractPublic: null,
    faucetContractPublic: null,

    // ============================================================
    // 4. USER DATA (Dados do Usuário Conectado)
    // ============================================================
    currentUserBalance: 0n,          // Saldo BKC
    currentUserNativeBalance: 0n,    // Saldo ETH (Sepolia)
    userTotalPStake: 0n,             // pStake total do usuário
    userDelegations: [],             // Lista de delegações
    myBoosters: [],                  // Lista de NFTs de Booster
    activityHistory: [],             // Histórico de txs

    // ============================================================
    // 5. SYSTEM DATA (Cache Global - Carregado via API/RPC)
    // ============================================================
    totalNetworkPStake: 0n,          // pStake total da rede
    allValidatorsData: [],           // Dados de validadores (se houver)
    
    // Regras do Sistema (Carregadas do EcosystemManager ou API)
    systemFees: {},                  // Ex: { CLAIM_REWARD_FEE: 50n }
    systemPStakes: {},               // Ex: { NOTARY_SERVICE: 500n }
    boosterDiscounts: {},            // Tabela de descontos por Bips
    
    // Dados Específicos de Páginas (Cache)
    notaryFee: undefined,            // Taxa atual do cartório
    notaryMinPStake: undefined,      // Requisito do cartório
};

// ============================================================
// STATE PROXY (Reatividade Automática)
// ============================================================
// Isso permite que a UI saiba quando dados importantes mudaram.

const handler = {
    set(target, property, value) {
        // Atualiza o valor
        target[property] = value;

        // Lista de propriedades que devem disparar atualização visual imediata
        const uiTriggers = [
            'currentUserBalance', 
            'isConnected', 
            'userTotalPStake',
            'totalNetworkPStake'
        ];

        // Se a propriedade alterada for importante, avisa o app.js
        if (uiTriggers.includes(property)) {
            if (window.updateUIState) {
                window.updateUIState();
            }
        }

        return true;
    }
};

// Exporta o State protegido pelo Proxy
export const State = new Proxy(initialState, handler);