// js/core/cache-manager.js
// ✅ PRODUCTION V1.0 - Intelligent Cache System for Backchain dApp
// 
// Este módulo gerencia cache em memória para evitar chamadas repetidas
// à blockchain. Cada entrada tem um TTL (time-to-live) após o qual expira.
//
// ============================================================================
// BENEFÍCIOS:
// - Reduz chamadas RPC (menos rate limiting)
// - Melhora performance da UI (respostas instantâneas)
// - Economiza recursos do usuário
// ============================================================================

// ============================================================================
// 1. CONFIGURAÇÃO DE TTL (Time-To-Live) POR TIPO DE DADO
// ============================================================================

/**
 * TTLs pré-definidos em milissegundos
 * Ajuste conforme a frequência de mudança dos dados
 */
export const CacheTTL = {
    // ─────────────────────────────────────────────────────────────────────
    // DADOS QUE MUDAM FREQUENTEMENTE
    // ─────────────────────────────────────────────────────────────────────
    BALANCE: 10_000,           // 10s - Saldos mudam após cada transação
    ALLOWANCE: 30_000,         // 30s - Allowance muda menos frequentemente
    GAS_PRICE: 15_000,         // 15s - Gas price varia bastante
    
    // ─────────────────────────────────────────────────────────────────────
    // DADOS QUE MUDAM MODERADAMENTE
    // ─────────────────────────────────────────────────────────────────────
    POOL_INFO: 30_000,         // 30s - Info de pools (NFT, Fortune)
    CAMPAIGN: 60_000,          // 1min - Dados de campanhas
    DELEGATION: 60_000,        // 1min - Dados de delegações
    RENTAL: 60_000,            // 1min - Status de aluguel
    PENDING_REWARDS: 30_000,   // 30s - Rewards acumulados
    
    // ─────────────────────────────────────────────────────────────────────
    // DADOS QUE MUDAM RARAMENTE
    // ─────────────────────────────────────────────────────────────────────
    STATS: 120_000,            // 2min - Estatísticas globais
    CONFIG: 300_000,           // 5min - Configurações do protocolo
    FEE_CONFIG: 300_000,       // 5min - Taxas configuradas
    TIER_CONFIG: 600_000,      // 10min - Configuração de tiers
};

// ============================================================================
// 2. STORAGE INTERNO
// ============================================================================

/**
 * Map interno que armazena os dados em cache
 * Estrutura: key => { value, expiresAt }
 */
const cache = new Map();

/**
 * Contador de hits/misses para métricas (opcional)
 */
const metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0
};

// ============================================================================
// 3. FUNÇÕES PRINCIPAIS
// ============================================================================

export const CacheManager = {
    
    /**
     * Busca um valor do cache
     * 
     * @param {string} key - Chave única do cache
     * @returns {*} Valor armazenado ou undefined se não existir/expirou
     * 
     * @example
     * const balance = CacheManager.get('balance-0x123');
     * if (balance !== undefined) {
     *     console.log('Cache hit!', balance);
     * }
     */
    get(key) {
        const entry = cache.get(key);
        
        // Não existe no cache
        if (!entry) {
            metrics.misses++;
            return undefined;
        }
        
        // Expirou - remove e retorna undefined
        if (Date.now() > entry.expiresAt) {
            cache.delete(key);
            metrics.misses++;
            return undefined;
        }
        
        // Cache hit!
        metrics.hits++;
        return entry.value;
    },

    /**
     * Armazena um valor no cache com TTL
     * 
     * @param {string} key - Chave única
     * @param {*} value - Valor a armazenar (qualquer tipo)
     * @param {number} ttlMs - Tempo de vida em milissegundos
     * 
     * @example
     * CacheManager.set('balance-0x123', 1000000000000000000n, CacheTTL.BALANCE);
     */
    set(key, value, ttlMs) {
        // Não cachear valores undefined/null (podem indicar erro)
        if (value === undefined || value === null) {
            return;
        }
        
        cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
            createdAt: Date.now()
        });
        
        metrics.sets++;
    },

    /**
     * Remove um item específico do cache
     * 
     * @param {string} key - Chave a remover
     * 
     * @example
     * CacheManager.delete('balance-0x123');
     */
    delete(key) {
        cache.delete(key);
    },

    /**
     * Limpa o cache por padrão ou completamente
     * 
     * @param {string} [pattern] - Padrão a buscar nas chaves (opcional)
     *                             Se não fornecido, limpa TUDO
     * 
     * @example
     * // Limpar todos os balances
     * CacheManager.clear('balance-');
     * 
     * // Limpar tudo relacionado a charity
     * CacheManager.clear('charity-');
     * 
     * // Limpar TODO o cache
     * CacheManager.clear();
     */
    clear(pattern) {
        if (!pattern) {
            cache.clear();
            metrics.invalidations++;
            return;
        }

        // Remove apenas chaves que contêm o padrão
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
        metrics.invalidations++;
    },

    /**
     * Busca do cache OU executa função e cacheia o resultado
     * Esta é a função mais útil - evita código repetitivo
     * 
     * @param {string} key - Chave do cache
     * @param {Function} fetchFn - Função async que busca o dado
     * @param {number} ttlMs - TTL para o cache
     * @returns {Promise<*>} Valor do cache ou resultado da função
     * 
     * @example
     * // Antes (verboso):
     * let balance = CacheManager.get(key);
     * if (balance === undefined) {
     *     balance = await token.balanceOf(user);
     *     CacheManager.set(key, balance, CacheTTL.BALANCE);
     * }
     * 
     * // Depois (limpo):
     * const balance = await CacheManager.getOrFetch(
     *     `balance-${token}-${user}`,
     *     () => token.balanceOf(user),
     *     CacheTTL.BALANCE
     * );
     */
    async getOrFetch(key, fetchFn, ttlMs) {
        // Tenta buscar do cache primeiro
        const cached = this.get(key);
        
        if (cached !== undefined) {
            return cached;
        }

        // Cache miss - executa a função
        try {
            const value = await fetchFn();
            
            // Só cacheia se retornou valor válido
            if (value !== undefined && value !== null) {
                this.set(key, value, ttlMs);
            }
            
            return value;
        } catch (error) {
            // Em caso de erro, não cacheia nada
            console.warn(`[Cache] Error fetching ${key}:`, error.message);
            throw error;
        }
    },

    /**
     * Verifica se uma chave existe e está válida
     * 
     * @param {string} key - Chave a verificar
     * @returns {boolean} true se existe e não expirou
     */
    has(key) {
        return this.get(key) !== undefined;
    },

    /**
     * Retorna tempo restante até expiração
     * 
     * @param {string} key - Chave a verificar
     * @returns {number} Milissegundos restantes (0 se expirado/não existe)
     */
    getTTL(key) {
        const entry = cache.get(key);
        if (!entry) return 0;
        
        const remaining = entry.expiresAt - Date.now();
        return remaining > 0 ? remaining : 0;
    },

    // =========================================================================
    // INVALIDAÇÃO POR TRANSAÇÃO
    // =========================================================================

    /**
     * Invalida caches relevantes após uma transação
     * Cada tipo de transação afeta diferentes caches
     * 
     * @param {string} txType - Tipo da transação executada
     * 
     * @example
     * // Após doar para campanha
     * CacheManager.invalidateByTx('Donate');
     * // Isso limpa: campaign-, charity-stats, token-balance-
     */
    invalidateByTx(txType) {
        // Mapa de transação => padrões de cache a invalidar
        const invalidationMap = {
            // ─────────────────────────────────────────────────────────────
            // CHARITY
            // ─────────────────────────────────────────────────────────────
            'CreateCampaign': [
                'campaign-',
                'charity-stats',
                'user-campaigns-',
                'campaign-list'
            ],
            'Donate': [
                'campaign-',
                'charity-stats',
                'token-balance-',
                'allowance-'
            ],
            'CancelCampaign': [
                'campaign-',
                'charity-stats',
                'user-campaigns-'
            ],
            'Withdraw': [
                'campaign-',
                'charity-stats',
                'token-balance-'
            ],

            // ─────────────────────────────────────────────────────────────
            // STAKING / DELEGATION
            // ─────────────────────────────────────────────────────────────
            'Delegate': [
                'delegation-',
                'token-balance-',
                'allowance-',
                'user-pstake-',
                'pending-rewards-',
                'network-pstake'
            ],
            'Unstake': [
                'delegation-',
                'token-balance-',
                'user-pstake-',
                'pending-rewards-',
                'network-pstake'
            ],
            'ForceUnstake': [
                'delegation-',
                'token-balance-',
                'user-pstake-',
                'pending-rewards-',
                'network-pstake'
            ],
            'ClaimReward': [
                'pending-rewards-',
                'token-balance-',
                'saved-rewards-'
            ],

            // ─────────────────────────────────────────────────────────────
            // NFT POOL
            // ─────────────────────────────────────────────────────────────
            'BuyNFT': [
                'pool-info-',
                'pool-nfts-',
                'token-balance-',
                'allowance-',
                'user-nfts-',
                'buy-price-',
                'sell-price-'
            ],
            'SellNFT': [
                'pool-info-',
                'pool-nfts-',
                'token-balance-',
                'user-nfts-',
                'buy-price-',
                'sell-price-'
            ],

            // ─────────────────────────────────────────────────────────────
            // FORTUNE POOL
            // ─────────────────────────────────────────────────────────────
            'PlayGame': [
                'fortune-pool-',
                'fortune-stats-',
                'token-balance-',
                'allowance-',
                'user-fortune-history-'
            ],

            // ─────────────────────────────────────────────────────────────
            // RENTAL
            // ─────────────────────────────────────────────────────────────
            'ListNFT': [
                'rental-listings-',
                'rental-listing-',
                'user-nfts-'
            ],
            'RentNFT': [
                'rental-listing-',
                'rental-active-',
                'token-balance-',
                'allowance-'
            ],
            'WithdrawNFT': [
                'rental-listing-',
                'rental-listings-',
                'user-nfts-'
            ],
            'UpdateListing': [
                'rental-listing-'
            ],

            // ─────────────────────────────────────────────────────────────
            // NOTARY
            // ─────────────────────────────────────────────────────────────
            'Notarize': [
                'notary-',
                'token-balance-',
                'allowance-',
                'user-documents-'
            ],

            // ─────────────────────────────────────────────────────────────
            // GENERIC / FALLBACK
            // ─────────────────────────────────────────────────────────────
            'TokenTransfer': [
                'token-balance-',
                'allowance-'
            ],
            'Approval': [
                'allowance-'
            ]
        };

        const patterns = invalidationMap[txType];
        
        if (!patterns) {
            console.warn(`[Cache] Unknown transaction type: ${txType}`);
            return;
        }

        // Invalida cada padrão
        patterns.forEach(pattern => {
            this.clear(pattern);
        });

        console.log(`[Cache] Invalidated patterns for ${txType}:`, patterns);
    },

    // =========================================================================
    // MÉTRICAS E DEBUG
    // =========================================================================

    /**
     * Retorna estatísticas do cache
     * Útil para debug e otimização
     * 
     * @returns {Object} Estatísticas de uso
     */
    getStats() {
        const entries = cache.size;
        const hitRate = metrics.hits + metrics.misses > 0
            ? (metrics.hits / (metrics.hits + metrics.misses) * 100).toFixed(1)
            : 0;

        return {
            entries,
            hits: metrics.hits,
            misses: metrics.misses,
            sets: metrics.sets,
            invalidations: metrics.invalidations,
            hitRate: `${hitRate}%`
        };
    },

    /**
     * Lista todas as chaves no cache (para debug)
     * 
     * @returns {string[]} Array de chaves
     */
    keys() {
        return Array.from(cache.keys());
    },

    /**
     * Retorna tamanho do cache
     * 
     * @returns {number} Número de entradas
     */
    size() {
        return cache.size;
    },

    /**
     * Limpa entradas expiradas (garbage collection manual)
     * Útil chamar periodicamente em apps de longa duração
     * 
     * @returns {number} Número de entradas removidas
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of cache.entries()) {
            if (now > entry.expiresAt) {
                cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[Cache] Cleanup removed ${removed} expired entries`);
        }

        return removed;
    },

    /**
     * Reseta métricas (para testes)
     */
    resetMetrics() {
        metrics.hits = 0;
        metrics.misses = 0;
        metrics.sets = 0;
        metrics.invalidations = 0;
    }
};

// ============================================================================
// 4. AUTO-CLEANUP (Opcional)
// ============================================================================

/**
 * Executa cleanup a cada 5 minutos para remover entradas expiradas
 * Isso evita memory leaks em sessões longas
 */
let cleanupInterval = null;

export function startAutoCleanup(intervalMs = 300_000) { // 5 min default
    if (cleanupInterval) return; // Já está rodando
    
    cleanupInterval = setInterval(() => {
        CacheManager.cleanup();
    }, intervalMs);
    
    console.log('[Cache] Auto-cleanup started');
}

export function stopAutoCleanup() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('[Cache] Auto-cleanup stopped');
    }
}

// ============================================================================
// 5. HELPERS PARA GERAR CHAVES
// ============================================================================

/**
 * Helpers para gerar chaves de cache padronizadas
 * Garante consistência em todo o app
 */
export const CacheKeys = {
    // Balances
    tokenBalance: (token, user) => `token-balance-${token.toLowerCase()}-${user.toLowerCase()}`,
    ethBalance: (user) => `eth-balance-${user.toLowerCase()}`,
    allowance: (token, owner, spender) => `allowance-${token.toLowerCase()}-${owner.toLowerCase()}-${spender.toLowerCase()}`,
    
    // Charity
    campaign: (id) => `campaign-${id}`,
    campaignList: () => `campaign-list`,
    charityStats: () => `charity-stats`,
    userCampaigns: (user) => `user-campaigns-${user.toLowerCase()}`,
    
    // Staking
    delegation: (user, index) => `delegation-${user.toLowerCase()}-${index}`,
    delegations: (user) => `delegation-list-${user.toLowerCase()}`,
    userPStake: (user) => `user-pstake-${user.toLowerCase()}`,
    pendingRewards: (user) => `pending-rewards-${user.toLowerCase()}`,
    networkPStake: () => `network-pstake`,
    
    // NFT Pool
    poolInfo: (pool) => `pool-info-${pool.toLowerCase()}`,
    poolNfts: (pool) => `pool-nfts-${pool.toLowerCase()}`,
    buyPrice: (pool) => `buy-price-${pool.toLowerCase()}`,
    sellPrice: (pool) => `sell-price-${pool.toLowerCase()}`,
    userNfts: (user) => `user-nfts-${user.toLowerCase()}`,
    
    // Fortune
    fortunePool: () => `fortune-pool`,
    fortuneTiers: () => `fortune-tiers`,
    fortuneStats: () => `fortune-stats`,
    userFortuneHistory: (user) => `user-fortune-history-${user.toLowerCase()}`,
    
    // Rental
    rentalListings: () => `rental-listings`,
    rentalListing: (tokenId) => `rental-listing-${tokenId}`,
    rentalActive: (tokenId) => `rental-active-${tokenId}`,
    
    // Notary
    notaryDocument: (tokenId) => `notary-doc-${tokenId}`,
    userDocuments: (user) => `user-documents-${user.toLowerCase()}`,
    
    // Config
    feeConfig: (key) => `fee-config-${key}`,
    protocolConfig: () => `protocol-config`
};

// ============================================================================
// 6. EXPORT DEFAULT
// ============================================================================

export default CacheManager;