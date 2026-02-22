# SDK do Backchain — Guia para Desenvolvedores

Construa DApps, indexadores e APIs no ecossistema Backchain. Ganhe **10-20% de comissao** em cada transacao como operador.

---

## Instalacao

Tres modos de instalar:

```bash
# Tudo de uma vez (DApp completo)
npm install @backchain/sdk ethers

# So o que voce precisa (leve)
npm install @backchain/core @backchain/staking ethers

# Scaffolder interativo
npx create-backchain-app
```

---

## Inicio Rapido

### DApp Frontend (5 minutos)

```typescript
import { Backchain } from '@backchain/sdk';
import { ethers } from 'ethers';

const bkc = new Backchain({
    operator: '0xSUA_CARTEIRA',       // voce recebe comissoes
    network: 'sepolia',               // testnet (default)
});

await bkc.connect();                   // popup MetaMask

// Staking
await bkc.staking.delegate(ethers.parseEther('1000'), 365);

// NFT
const { bkcCost, ethFee } = await bkc.nft.getBuyPrice(0); // Bronze
await bkc.nft.buy(0);

// Fortune Pool
const { gameId, secret } = await bkc.fortune.play(
    ethers.parseEther('10'), [42, 7, 99], 7
);
```

### Indexador de Eventos (10 minutos)

```typescript
import { EventParser, STAKING_EVENTS } from '@backchain/events';
import { EventIndexer, FileCheckpoint } from '@backchain/indexer';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

const parser = new EventParser();
parser.register('StakingPool', STAKING_EVENTS);

const indexer = new EventIndexer({
    provider,
    parser,
    checkpoint: new FileCheckpoint('./checkpoint.json'), // persiste progresso
});

// Indexar eventos Delegated em tempo real
await indexer.index(
    'StakingPool',
    '0xSEU_STAKING_POOL_ADDRESS',
    'Delegated',
    async (event) => {
        console.log(`${event.args.user} delegou ${ethers.formatEther(event.args.amount)} BKC`);
        // Salvar no banco, enviar notificacao, etc.
    }
);
```

### API Server (5 minutos)

```typescript
import express from 'express';
import { setupBackchainRoutes } from '@backchain/api';

const app = express();
app.use(express.json());

setupBackchainRoutes(app, {
    operator: '0xSUA_CARTEIRA',
    network: 'sepolia',
});

app.listen(3000);
// GET /api/staking/stats
// GET /api/staking/delegations/0xAddress
// GET /api/nft/pool/0/info
// GET /api/swap/price
// GET /api/buyback/preview
// ... 30+ endpoints auto-gerados
```

---

## Todos os Pacotes

| Pacote | Descricao | Deps |
|--------|-----------|------|
| `@backchain/core` | Provider, fees, tipos, ABIs, enderecos, BackchainContext | ethers |
| `@backchain/staking` | Delegar BKC, clamar recompensas | core |
| `@backchain/nft` | Comprar/vender NFT Boosters (bonding curves) | core |
| `@backchain/fusion` | Fundir/dividir NFT Boosters | core |
| `@backchain/fortune` | Jogo commit-reveal | core |
| `@backchain/notary` | Certificacao de documentos on-chain | core |
| `@backchain/agora` | Rede social descentralizada | core |
| `@backchain/charity` | Campanhas de arrecadacao | core |
| `@backchain/rental` | Marketplace de aluguel de NFT | core |
| `@backchain/swap` | AMM ETH/BKC | core |
| `@backchain/faucet` | Distribuicao de tokens testnet | core |
| `@backchain/buyback` | Mineracao proof-of-purchase | core |
| `@backchain/events` | 117 event ABIs, tipos, parser | ethers |
| `@backchain/indexer` | Polling, backfill, streaming de eventos | events |
| `@backchain/api` | Multicall, middleware Express, REST routes | core + events + indexer |
| `@backchain/sdk` | Tudo junto (re-exporta todos os pacotes) | todos |
| `create-backchain-app` | CLI scaffolder interativo | — |

---

## Padrao 1: SDK Completo (DApps)

Ideal para frontends completos. Instale `@backchain/sdk` e use a classe `Backchain`:

```typescript
import { Backchain } from '@backchain/sdk';

const bkc = new Backchain({ operator: '0x...' });
await bkc.connect(); // MetaMask

// Todos os modulos disponiveis
bkc.staking.delegate(...)
bkc.nft.buy(...)
bkc.fortune.play(...)
bkc.agora.createPost(...)
bkc.notary.certify(...)
bkc.charity.donate(...)
bkc.rental.rentNft(...)
bkc.swap.buyBkc(...)
bkc.buyback.execute()
bkc.faucet.claim()
bkc.fusion.fuse(...)
```

### Signer Server-Side

Para bots ou backends, use chave privada em vez de MetaMask:

```typescript
const bkc = new Backchain({ operator: '0x...' });
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
await bkc.connectWithSigner(wallet);
```

---

## Padrao 2: Modulos Individuais (Leve)

Ideal quando voce so precisa de 1-2 funcionalidades. Instale apenas o necessario:

```bash
npm install @backchain/core @backchain/staking ethers
```

```typescript
import { createContext } from '@backchain/core';
import { StakingModule } from '@backchain/staking';

const ctx = createContext({ operator: '0x...' });
await ctx.connect(); // MetaMask

const staking = new StakingModule(ctx);
await staking.delegate(ethers.parseEther('1000'), 365);
```

Beneficio: seu bundle final tem so o codigo que voce usa. Ideal pra apps que so fazem staking, ou so NFT trading, etc.

---

## @backchain/events — Fundacao de Eventos

O pacote `events` contem ABIs completos para **todos os 117 eventos** dos 17 contratos Backchain, interfaces tipadas, e utilitarios de parsing.

### ABIs por Contrato

```typescript
import {
    STAKING_EVENTS,          // 9 eventos
    NFT_POOL_EVENTS,         // 3 eventos
    NFT_FUSION_EVENTS,       // 2 eventos
    FORTUNE_EVENTS,          // 6 eventos
    AGORA_EVENTS,            // 21 eventos
    ECOSYSTEM_EVENTS,        // 27 eventos
    NOTARY_EVENTS,           // 4 eventos
    CHARITY_EVENTS,          // 5 eventos
    RENTAL_EVENTS,           // 6 eventos
    BKC_TOKEN_EVENTS,        // 7 eventos
    LIQUIDITY_POOL_EVENTS,   // 4 eventos
    BUYBACK_EVENTS,          // 5 eventos
    REWARD_BOOSTER_EVENTS,   // 7 eventos
    FAUCET_EVENTS,           // 5 eventos
    GOVERNANCE_EVENTS,       // 9 eventos
    AIRDROP_EVENTS,          // 5 eventos
    ALL_EVENT_ABIS,          // Todos agrupados por contrato
    ALL_EVENTS_FLAT,         // Array plano com todos os 117
} from '@backchain/events';
```

### EventParser

```typescript
import { EventParser, STAKING_EVENTS, AGORA_EVENTS } from '@backchain/events';

const parser = new EventParser();

// Registrar um contrato
parser.register('StakingPool', STAKING_EVENTS, '0xStakingPoolAddress');
parser.register('Agora', AGORA_EVENTS, '0xAgoraAddress');

// Parsear um log
const event = parser.parse(log, 'StakingPool');
// → { raw: Log, parsed: { event: 'Delegated', args: { user, amount, ... } } }

// Parsear logs em batch
const events = parser.parseMany(logs, 'StakingPool');

// Parsear receipt inteiro (auto-detecta contrato pelo endereco)
const events = parser.parseReceipt(txReceipt);
```

### Tipos Tipados

```typescript
import type {
    DelegatedEvent,
    NFTPurchasedEvent,
    PostCreatedEvent,
    BuybackExecutedEvent,
    BackchainEvent, // Union de todos
} from '@backchain/events';

// TypeScript sabe exatamente os campos
const event: DelegatedEvent = ...;
event.args.user;           // string
event.args.amount;         // bigint
event.args.pStake;         // bigint
event.args.lockDays;       // bigint
event.args.operator;       // string
```

### FilterBuilder

```typescript
import { FilterBuilder } from '@backchain/events';

const filter = new FilterBuilder()
    .address('0xStakingPoolAddress')
    .event('Delegated(address,uint256,uint256,uint256,uint256,address)')
    .indexed(1, '0xUserAddress')  // filtrar por user especifico
    .range(1000000, 'latest')
    .build();

const logs = await provider.getLogs(filter);
```

---

## @backchain/indexer — Infraestrutura de Indexacao

### EventIndexer

Tres modos de uso:

#### 1. Live Polling (continuo)

```typescript
import { EventIndexer } from '@backchain/indexer';
import { EventParser, STAKING_EVENTS } from '@backchain/events';

const parser = new EventParser();
parser.register('StakingPool', STAKING_EVENTS);

const indexer = new EventIndexer({
    provider,
    parser,
    pollInterval: 2000,   // checar a cada 2s
    batchSize: 2000,      // blocos por query
});

// Roda infinitamente ate indexer.stop()
await indexer.index('StakingPool', address, 'Delegated', async (event) => {
    await db.insert('delegations', {
        user: event.args.user,
        amount: event.args.amount.toString(),
        block: event.blockNumber,
    });
});
```

#### 2. Backfill Historico (unico)

```typescript
// Buscar todos os eventos desde o bloco de deploy
const total = await indexer.backfill(
    'StakingPool', address, 'Delegated',
    (event) => console.log(event.args),
    0,       // fromBlock
    'latest' // toBlock
);
console.log(`${total} eventos indexados`);
```

#### 3. Async Stream (iterador)

```typescript
for await (const event of indexer.stream('StakingPool', address, 'Delegated')) {
    console.log(event.args.user, 'delegou', event.args.amount);
    // break quando quiser parar
}
```

### Checkpoint (Persistencia)

```typescript
import { FileCheckpoint } from '@backchain/indexer';

const indexer = new EventIndexer({
    provider,
    parser,
    checkpoint: new FileCheckpoint('./my-checkpoint.json'),
    // Se o processo reiniciar, continua de onde parou
});
```

Ou implemente seu proprio `CheckpointStore`:

```typescript
import type { CheckpointStore } from '@backchain/indexer';

class RedisCheckpoint implements CheckpointStore {
    async get(key: string): Promise<number | null> { ... }
    async set(key: string, blockNumber: number): Promise<void> { ... }
    async delete(key: string): Promise<void> { ... }
    async clear(): Promise<void> { ... }
}
```

### EventPipeline (Filtros)

```typescript
import { EventPipeline } from '@backchain/indexer';
import type { DelegatedEvent } from '@backchain/events';

const pipeline = new EventPipeline<DelegatedEvent>(async (event) => {
    await db.insert('big_delegations', event.args);
});

// So indexar delegacoes > 1000 BKC
pipeline.use((event) =>
    event.args.amount > ethers.parseEther('1000') ? event : null
);

// Processar batch
await pipeline.process(parsedEvents);
```

---

## @backchain/api — Helpers Server-Side

### Multicall (Batch Reads)

Leia N valores em 1 chamada RPC:

```typescript
import { createContext } from '@backchain/core';
import { Multicall } from '@backchain/api';

const ctx = createContext({ operator: '0x...' });
const mc = new Multicall(ctx);

const bkcToken = new ethers.Contract(bkcAddress, BKC_TOKEN_ABI, ctx.provider.reader);

// 3 reads em 1 RPC call
const [balance, allowance, supply] = await mc.batch([
    { contract: bkcToken, method: 'balanceOf', args: [user] },
    { contract: bkcToken, method: 'allowance', args: [user, spender] },
    { contract: bkcToken, method: 'totalSupply', args: [] },
]);
```

### Express Middleware

```typescript
import express from 'express';
import { backchainMiddleware } from '@backchain/api';
import { StakingModule } from '@backchain/staking';

const app = express();

app.use(backchainMiddleware({
    operator: '0x...',
    network: 'sepolia',
    privateKey: process.env.PRIVATE_KEY, // opcional, pra writes server-side
}));

app.get('/my-custom-endpoint', async (req, res) => {
    const ctx = req.backchain;
    const staking = new StakingModule(ctx);
    const stats = await staking.getStats();
    res.json(stats);
});
```

### Auto-Generated Routes

30+ endpoints REST gerados automaticamente para todos os 11 modulos:

```typescript
import express from 'express';
import { setupBackchainRoutes } from '@backchain/api';

const app = express();
app.use(express.json());

setupBackchainRoutes(app, {
    operator: '0x...',
    routes: {
        basePath: '/api',
        modules: ['staking', 'nft', 'swap', 'buyback'], // opcional: filtrar modulos
    },
});

app.listen(3000);
```

**Endpoints gerados:**

| Endpoint | Modulo | Descricao |
|----------|--------|-----------|
| `GET /api/staking/stats` | Staking | Stats globais de staking |
| `GET /api/staking/delegations/:address` | Staking | Delegacoes de um usuario |
| `GET /api/staking/summary/:address` | Staking | Resumo completo do usuario |
| `GET /api/nft/pool/:tier/info` | NFT | Info do pool por tier (0-3) |
| `GET /api/nft/pool/:tier/stats` | NFT | Stats do pool |
| `GET /api/nft/user/:address/tokens` | NFT | NFTs de um usuario |
| `GET /api/fortune/tiers` | Fortune | Configuracao de todos os tiers |
| `GET /api/fortune/stats` | Fortune | Stats do Fortune Pool |
| `GET /api/fortune/game/:address` | Fortune | Jogo ativo de um player |
| `GET /api/notary/verify/:hash` | Notary | Verificar certificado |
| `GET /api/notary/certificate/:id` | Notary | Buscar certificado por ID |
| `GET /api/notary/stats` | Notary | Stats do cartorio |
| `GET /api/agora/post/:id` | Agora | Buscar post |
| `GET /api/agora/profile/:address` | Agora | Perfil de usuario |
| `GET /api/agora/stats` | Agora | Stats globais |
| `GET /api/charity/campaign/:id` | Charity | Detalhes de campanha |
| `GET /api/charity/stats` | Charity | Stats de arrecadacao |
| `GET /api/rental/listing/:tokenId` | Rental | Detalhes de um listing |
| `GET /api/rental/listings` | Rental | Listings disponiveis |
| `GET /api/rental/earnings/:address` | Rental | Earnings pendentes |
| `GET /api/rental/stats` | Rental | Stats do marketplace |
| `GET /api/swap/stats` | Swap | Stats do AMM |
| `GET /api/swap/quote/eth-to-bkc/:amount` | Swap | Cotacao ETH→BKC |
| `GET /api/swap/quote/bkc-to-eth/:amount` | Swap | Cotacao BKC→ETH |
| `GET /api/swap/price` | Swap | Preco atual BKC |
| `GET /api/faucet/status` | Faucet | Status do faucet |
| `GET /api/faucet/user/:address` | Faucet | Info do usuario no faucet |
| `GET /api/buyback/stats` | Buyback | Stats de buyback |
| `GET /api/buyback/preview` | Buyback | Preview do proximo buyback |
| `GET /api/buyback/mining-rate` | Buyback | Taxa de mineracao atual |

### Routes Framework-Agnostic

Se voce usa Hono, Fastify ou outro framework:

```typescript
import { generateRoutes } from '@backchain/api';

const routes = generateRoutes({ basePath: '/api' });

// Wire manualmente no seu framework
for (const route of routes) {
    myFramework.on(route.method, route.path, async (ctx) => {
        const result = await route.handler(backchainCtx, ctx.params, ctx.query);
        return result;
    });
}
```

---

## create-backchain-app — CLI Scaffolder

```bash
npx create-backchain-app
```

O CLI interativo pergunta:
1. Nome do projeto
2. Endereco do operador (sua carteira)
3. Quais modulos adicionais incluir (nft, fortune, notary, agora, charity, rental, swap, fusion, buyback)
4. Rede (Sepolia, opBNB Testnet ou opBNB Mainnet)

**Modulos Core** (sempre incluidos em todo projeto):
- Dashboard — Visao geral do ecossistema
- Stake & Earn — Delegar BKC, ganhar recompensas
- Tutor System — Ganhos com referrals, info do tutor
- Tokenomics — Supply, taxas, info do ecossistema
- Invite & Earn — Link de referral, rastrear convites

Gera um projeto Vite pronto com paginas, navegacao e imports corretos.

---

## Calculo de Fees

Cada acao no Backchain cobra uma taxa ETH. Calcule client-side:

```typescript
import { calculateFee, ACTION_IDS, nftActionId } from '@backchain/core';

// Taxa de staking
const stakeFee = await ctx.calculateFee(ACTION_IDS.STAKING_DELEGATE);

// Taxa de NFT (varia por tier)
const nftBuyFee = await ctx.calculateFee(nftActionId('NFT_BUY_T', 2)); // Gold

// Taxa de fortune (soma por tier)
const fortuneFee = await ctx.calculateFee(ACTION_IDS.FORTUNE_TIER0);
```

---

## Arquitetura

```
@backchain/sdk (tudo junto)
├── Backchain (classe principal)
│   ├── .staking   → StakingPool
│   ├── .nft       → NFTPool + RewardBooster
│   ├── .fusion    → NFTFusion
│   ├── .fortune   → FortunePool
│   ├── .notary    → Notary
│   ├── .agora     → Agora
│   ├── .charity   → CharityPool
│   ├── .rental    → RentalManager
│   ├── .swap      → LiquidityPool
│   ├── .buyback   → BuybackMiner
│   └── .faucet    → SimpleBKCFaucet
│
@backchain/core (fundacao)
├── BackchainContext (interface)
├── createContext()
├── ProviderManager (Alchemy reads + MetaMask writes)
├── calculateFee() (client-side)
├── ABIs + Enderecos (por rede)
└── Tipos TypeScript
│
@backchain/events (eventos)
├── 117 event ABIs (17 contratos)
├── Tipos tipados (DelegatedEvent, etc.)
├── EventParser
└── FilterBuilder
│
@backchain/indexer (indexacao)
├── EventIndexer (poll, backfill, stream)
├── CheckpointStore (InMemory, File, custom)
└── EventPipeline (filter/transform)
│
@backchain/api (server-side)
├── Multicall (batch reads via Multicall3)
├── backchainMiddleware() (Express)
├── generateRoutes() (30+ endpoints)
└── setupBackchainRoutes() (one-liner)
```

---

## Redes

| Rede | Chain ID | Status |
|------|----------|--------|
| Ethereum Sepolia | 11155111 | Ativa (testnet) |
| opBNB Testnet | 5611 | Em breve |
| opBNB Mainnet | 204 | Em breve (producao) |

---

## Exemplos Praticos

### Bot de Notificacao (Telegram)

```typescript
import { EventIndexer } from '@backchain/indexer';
import { EventParser, STAKING_EVENTS, NFT_POOL_EVENTS } from '@backchain/events';

const parser = new EventParser();
parser.register('StakingPool', STAKING_EVENTS);
parser.register('NFTPool', NFT_POOL_EVENTS);

const indexer = new EventIndexer({ provider, parser });

// Notificar quando alguem delega > 10k BKC
indexer.index('StakingPool', stakingAddr, 'Delegated', async (event) => {
    if (event.args.amount > ethers.parseEther('10000')) {
        await telegram.send(`Whale alert: ${event.args.user} delegou ${ethers.formatEther(event.args.amount)} BKC`);
    }
});

// Notificar compras de Diamond NFT
indexer.index('NFTPool', nftPoolAddr, 'NFTPurchased', async (event) => {
    await telegram.send(`Diamond NFT comprado por ${event.args.buyer}`);
});
```

### Dashboard Analytics

```typescript
import { createContext } from '@backchain/core';
import { Multicall } from '@backchain/api';
import { StakingModule } from '@backchain/staking';
import { SwapModule } from '@backchain/swap';
import { BuybackModule } from '@backchain/buyback';

const ctx = createContext({ operator: '0x...' });
const staking = new StakingModule(ctx);
const swap = new SwapModule(ctx);
const buyback = new BuybackModule(ctx);

// Ler tudo de uma vez
const [stakingStats, swapStats, buybackStats] = await Promise.all([
    staking.getStats(),
    swap.getStats(),
    buyback.getStats(),
]);

console.log('TVL:', stakingStats.totalStaked);
console.log('Preco BKC:', await swap.getCurrentPrice());
console.log('Total Buybacks:', buybackStats.buybackCount);
```

---

## Links

- Website: [backcoin.org](https://backcoin.org)
- GitHub: [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp)
- Contratos: Verificados no [Etherscan Sepolia](https://sepolia.etherscan.io)
- Enderecos: [Tabela Completa](./Addresses_All-Contracts.md)
- Taxas: [Tabela de Taxas](./Fees_Complete-Table.md)
- Telegram: [t.me/BackCoinorg](https://t.me/BackCoinorg)
