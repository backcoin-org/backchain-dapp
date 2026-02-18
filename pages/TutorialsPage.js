// pages/TutorialsPage.js — V2.0
// Complete Video Tutorials covering ALL ecosystem features
// PT/EN language support

const YOUTUBE_CHANNEL = 'https://www.youtube.com/@Backcoin';

// ============================================================================
// VIDEO DATA - Update YouTube URLs when videos are ready
// Replace VIDEO_ID_HERE with actual YouTube IDs
// ============================================================================
const videos = {

    // ── CATEGORY 1: What is Backcoin ─────────────────────────────────────
    overview: [
        {
            id: 'ov-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'beginner',
            icon: 'fa-play-circle',
            en: {
                title: 'What is Backcoin?',
                description: 'A complete overview of the Backcoin ecosystem. Unstoppable DeFi on opBNB: staking, NFTs, games, social network, and more — all without admin keys.'
            },
            pt: {
                title: 'O Que é o Backcoin?',
                description: 'Uma visão completa do ecossistema Backcoin. DeFi imparável na opBNB: staking, NFTs, jogos, rede social e mais — tudo sem chaves de admin.'
            }
        },
        {
            id: 'ov-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '4:00',
            tag: 'beginner',
            icon: 'fa-money-bill-trend-up',
            en: {
                title: 'How to Earn Money with Backcoin',
                description: 'Three income streams: be an Operator (commissions), Delegator (staking rewards), or Referrer (5% forever). Learn how to combine all three.'
            },
            pt: {
                title: 'Como Ganhar Dinheiro com Backcoin',
                description: 'Três fontes de renda: seja Operador (comissões), Delegador (recompensas de staking) ou Referenciador (5% pra sempre). Aprenda a combinar as três.'
            }
        },
        {
            id: 'ov-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '5:00',
            tag: 'intermediate',
            icon: 'fa-laptop-code',
            en: {
                title: 'Be an Operator — Build & Earn Commissions',
                description: 'Build your own Backcoin frontend (site, app, bot) and earn automatic commissions on every user transaction. No approval needed. Full guide.'
            },
            pt: {
                title: 'Seja um Operador — Construa e Ganhe Comissões',
                description: 'Construa seu próprio frontend Backcoin (site, app, bot) e ganhe comissões automáticas em cada transação. Sem aprovação. Guia completo.'
            }
        },
        {
            id: 'ov-4',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'beginner',
            icon: 'fa-link',
            en: {
                title: 'Referral System — Passive Income Forever',
                description: 'Share your link and earn 5% of your referrals\' staking rewards — automatically, forever. How to set up and maximize referrals.'
            },
            pt: {
                title: 'Sistema de Referral — Renda Passiva Pra Sempre',
                description: 'Compartilhe seu link e ganhe 5% das recompensas de staking dos seus indicados — automaticamente, pra sempre. Como configurar e maximizar.'
            }
        }
    ],

    // ── CATEGORY 2: Getting Started ──────────────────────────────────────
    gettingStarted: [
        {
            id: 'gs-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:30',
            tag: 'beginner',
            icon: 'fa-wallet',
            en: {
                title: 'MetaMask Setup (PC & Mobile)',
                description: 'Install MetaMask, create your wallet, and add the opBNB Testnet network. Your gateway to the Backcoin universe.'
            },
            pt: {
                title: 'Configurando MetaMask (PC & Mobile)',
                description: 'Instale a MetaMask, crie sua carteira e adicione a rede opBNB Testnet. Sua entrada para o universo Backcoin.'
            }
        },
        {
            id: 'gs-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:00',
            tag: 'beginner',
            icon: 'fa-plug',
            en: {
                title: 'Connect Wallet & Claim Free Tokens',
                description: 'Connect to backcoin.org, use the Faucet to claim free BKC + BNB for gas, and add BKC to MetaMask. Ready in 2 minutes.'
            },
            pt: {
                title: 'Conectar Carteira e Receber Tokens Grátis',
                description: 'Conecte no backcoin.org, use o Faucet para receber BKC + BNB grátis pra gas, e adicione o BKC na MetaMask. Pronto em 2 minutos.'
            }
        },
        {
            id: 'gs-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'beginner',
            icon: 'fa-compass',
            en: {
                title: 'Navigating the Dashboard',
                description: 'Tour of the main dashboard: your balance, rewards, NFT booster status, activity feed, and quick actions. Everything at a glance.'
            },
            pt: {
                title: 'Navegando pelo Dashboard',
                description: 'Tour pelo dashboard principal: seu saldo, recompensas, status do NFT booster, feed de atividades e ações rápidas. Tudo num relance.'
            }
        }
    ],

    // ── CATEGORY 3: Staking & Mining ─────────────────────────────────────
    stakingMining: [
        {
            id: 'sm-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '4:00',
            tag: 'intermediate',
            icon: 'fa-lock',
            en: {
                title: 'Staking — Delegate BKC and Earn Rewards',
                description: 'How to delegate BKC tokens, choose lock period for maximum power (pStake), and understand the reward multiplier. Step-by-step guide.'
            },
            pt: {
                title: 'Staking — Delegue BKC e Ganhe Recompensas',
                description: 'Como delegar tokens BKC, escolher período de lock para máximo poder (pStake) e entender o multiplicador de recompensas. Passo a passo.'
            }
        },
        {
            id: 'sm-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'intermediate',
            icon: 'fa-hand-holding-dollar',
            en: {
                title: 'Claiming Rewards & Understanding Burn Rate',
                description: 'How to claim your staking rewards. Why 50% is burned without NFT Booster, and how to keep up to 100% with a Diamond NFT.'
            },
            pt: {
                title: 'Clamando Recompensas e Entendendo o Burn',
                description: 'Como clamar suas recompensas de staking. Por que 50% é queimado sem NFT Booster, e como manter até 100% com um Diamond NFT.'
            }
        },
        {
            id: 'sm-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:00',
            tag: 'intermediate',
            icon: 'fa-unlock',
            en: {
                title: 'Force Unstake — Emergency Exit',
                description: 'Need your tokens before lock expires? Force unstake with 10% penalty. When to use it and when to wait.'
            },
            pt: {
                title: 'Force Unstake — Saída de Emergência',
                description: 'Precisa dos tokens antes do lock expirar? Force unstake com 10% de penalidade. Quando usar e quando esperar.'
            }
        },
        {
            id: 'sm-4',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:30',
            tag: 'advanced',
            icon: 'fa-hammer',
            en: {
                title: 'Buyback Mining — How Protocol Fees Become Rewards',
                description: 'The Buyback Miner converts BNB fees into BKC rewards. Learn the scarcity curve, the 5% caller incentive, and how to run a mining bot.'
            },
            pt: {
                title: 'Mineração Buyback — Como Taxas Viram Recompensas',
                description: 'O Buyback Miner converte taxas BNB em recompensas BKC. Aprenda a curva de escassez, o incentivo de 5% e como rodar um bot de mineração.'
            }
        }
    ],

    // ── CATEGORY 4: NFTs ─────────────────────────────────────────────────
    nfts: [
        {
            id: 'nft-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'beginner',
            icon: 'fa-gem',
            en: {
                title: 'NFT Boosters Explained — Why You Need One',
                description: 'The 4 tiers (Bronze to Diamond), how they reduce burn rate, and why a Diamond holder earns 2x more than someone without NFT.'
            },
            pt: {
                title: 'NFT Boosters — Por Que Você Precisa de Um',
                description: 'Os 4 tiers (Bronze a Diamond), como reduzem o burn, e por que um Diamond holder ganha 2x mais do que quem não tem NFT.'
            }
        },
        {
            id: 'nft-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:30',
            tag: 'intermediate',
            icon: 'fa-cart-shopping',
            en: {
                title: 'Buying & Selling NFTs — Bonding Curve Trading',
                description: 'How to buy and sell Booster NFTs instantly via bonding curve pools. Understand price movements, slippage protection, and trading strategies.'
            },
            pt: {
                title: 'Comprando e Vendendo NFTs — Trading por Bonding Curve',
                description: 'Como comprar e vender NFTs Booster instantaneamente via pools de bonding curve. Entenda preços, proteção contra slippage e estratégias.'
            }
        },
        {
            id: 'nft-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'intermediate',
            icon: 'fa-clock',
            en: {
                title: 'Renting an NFT — Affordable Boost',
                description: 'Rent a Diamond NFT for a fraction of the purchase price. How to browse, rent, and maximize ROI by timing your claims.'
            },
            pt: {
                title: 'Alugando um NFT — Boost Acessível',
                description: 'Alugue um Diamond NFT por uma fração do preço de compra. Como navegar, alugar e maximizar ROI cronometrando seus claims.'
            }
        },
        {
            id: 'nft-4',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'intermediate',
            icon: 'fa-tag',
            en: {
                title: 'Listing Your NFT for Rent — Earn Passive BNB',
                description: 'Turn idle NFTs into passive income. How to list on the rental market, set daily price, and collect BNB from tenants.'
            },
            pt: {
                title: 'Listando seu NFT pra Aluguel — Ganhe BNB Passivo',
                description: 'Transforme NFTs parados em renda passiva. Como listar no mercado de aluguel, definir preço diário e coletar BNB.'
            }
        },
        {
            id: 'nft-5',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'intermediate',
            icon: 'fa-fire',
            en: {
                title: 'NFT Fusion — Combine, Split & Upgrade',
                description: 'Fuse 2 same-tier NFTs into 1 higher tier. Split a high tier into 2 lower tiers. Advanced strategies for NFT management.'
            },
            pt: {
                title: 'NFT Fusion — Fundir, Dividir e Fazer Upgrade',
                description: 'Funda 2 NFTs do mesmo tier em 1 de tier superior. Divida um tier alto em 2 inferiores. Estratégias avançadas de gestão de NFTs.'
            }
        }
    ],

    // ── CATEGORY 5: Fortune Pool ─────────────────────────────────────────
    fortune: [
        {
            id: 'fp-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:30',
            tag: 'intermediate',
            icon: 'fa-dice',
            en: {
                title: 'Fortune Pool — How to Play',
                description: 'Choose Easy (3x), Medium (15x) or Hard (75x). Understand commit-reveal mechanics, combos, and why no one can cheat.'
            },
            pt: {
                title: 'Fortune Pool — Como Jogar',
                description: 'Escolha Easy (3x), Medium (15x) ou Hard (75x). Entenda o commit-reveal, combos e por que ninguém pode trapacear.'
            }
        },
        {
            id: 'fp-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'intermediate',
            icon: 'fa-layer-group',
            en: {
                title: 'Fortune Pool — Combo Mode & Strategies',
                description: 'Play multiple tiers in one game for up to 93x multiplier. Combo bitmasks, prize pool mechanics, and bankroll management tips.'
            },
            pt: {
                title: 'Fortune Pool — Modo Combo e Estratégias',
                description: 'Jogue múltiplos tiers em um jogo só para até 93x. Bitmasks de combo, mecânica do prize pool e dicas de gestão de banca.'
            }
        }
    ],

    // ── CATEGORY 6: Social & Content ─────────────────────────────────────
    social: [
        {
            id: 'ag-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'beginner',
            icon: 'fa-comments',
            en: {
                title: 'Agora — The Unstoppable Social Network',
                description: 'Post, reply, follow, and earn. Create content that can never be censored or deleted. Your posts live on the blockchain forever.'
            },
            pt: {
                title: 'Agora — A Rede Social Imparável',
                description: 'Poste, responda, siga e ganhe. Crie conteúdo que nunca pode ser censurado ou deletado. Seus posts vivem na blockchain pra sempre.'
            }
        },
        {
            id: 'ag-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:00',
            tag: 'beginner',
            icon: 'fa-heart',
            en: {
                title: 'SuperLikes — Earn BNB from Your Content',
                description: 'How SuperLikes send BNB directly to content creators. Build an audience and monetize without algorithms or middlemen.'
            },
            pt: {
                title: 'SuperLikes — Ganhe BNB com seu Conteúdo',
                description: 'Como SuperLikes enviam BNB direto para criadores de conteúdo. Construa audiência e monetize sem algoritmos ou intermediários.'
            }
        },
        {
            id: 'ag-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'intermediate',
            icon: 'fa-user-tag',
            en: {
                title: 'Register Username & Build Your Profile',
                description: 'Claim your unique handle, set up avatar and bio via IPFS, get a trust badge, and boost your profile visibility.'
            },
            pt: {
                title: 'Registre Username e Monte seu Perfil',
                description: 'Registre seu handle único, configure avatar e bio via IPFS, obtenha badge de confiança e aumente sua visibilidade.'
            }
        }
    ],

    // ── CATEGORY 7: Utilities ────────────────────────────────────────────
    utilities: [
        {
            id: 'ut-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'beginner',
            icon: 'fa-stamp',
            en: {
                title: 'Digital Notary — Certify Documents Forever',
                description: 'Certify any document on-chain without revealing its content. Hash-based proof of existence, batch certification, and free verification.'
            },
            pt: {
                title: 'Cartório Digital — Certifique Documentos pra Sempre',
                description: 'Certifique qualquer documento on-chain sem revelar o conteúdo. Prova por hash, certificação em lote e verificação grátis.'
            }
        },
        {
            id: 'ut-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'beginner',
            icon: 'fa-hand-holding-heart',
            en: {
                title: 'Fundraising — Create Campaigns Without Middlemen',
                description: 'Launch a fundraising campaign in 30 seconds. Receive 100% of donations, withdraw anytime. No platform fees, no approval process.'
            },
            pt: {
                title: 'Arrecadação — Crie Campanhas sem Intermediários',
                description: 'Lance uma campanha em 30 segundos. Receba 100% das doações, saque quando quiser. Sem taxa de plataforma, sem aprovação.'
            }
        },
        {
            id: 'ut-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:00',
            tag: 'beginner',
            icon: 'fa-circle-dollar-to-slot',
            en: {
                title: 'How to Donate to a Campaign',
                description: 'Find campaigns, donate BNB directly to creators, and track donations on-chain. Full transparency, zero hidden fees.'
            },
            pt: {
                title: 'Como Doar para uma Campanha',
                description: 'Encontre campanhas, doe BNB direto para criadores e acompanhe doações on-chain. Transparência total, zero taxas ocultas.'
            }
        },
        {
            id: 'ut-4',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'intermediate',
            icon: 'fa-arrow-right-arrow-left',
            en: {
                title: 'Swap BNB/BKC — Trade on the Liquidity Pool',
                description: 'Swap BNB for BKC and vice-versa on the built-in AMM. Understand the 0.3% fee, price impact, and how the constant product formula works.'
            },
            pt: {
                title: 'Swap BNB/BKC — Troque no Pool de Liquidez',
                description: 'Troque BNB por BKC e vice-versa no AMM integrado. Entenda a taxa de 0.3%, impacto no preço e a fórmula de produto constante.'
            }
        },
        {
            id: 'ut-5',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'intermediate',
            icon: 'fa-droplet',
            en: {
                title: 'Provide Liquidity — Earn 0.3% per Swap',
                description: 'Add BNB and BKC to the liquidity pool and earn fees on every swap. How to add, remove, and calculate your share.'
            },
            pt: {
                title: 'Prover Liquidez — Ganhe 0.3% por Swap',
                description: 'Adicione BNB e BKC ao pool de liquidez e ganhe taxas em cada swap. Como adicionar, remover e calcular sua fatia.'
            }
        }
    ],

    // ── CATEGORY 8: Advanced & Vision ────────────────────────────────────
    advanced: [
        {
            id: 'ad-1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'advanced',
            icon: 'fa-coins',
            en: {
                title: 'BKC Tokenomics — Supply, Burns & Scarcity',
                description: 'Deep dive into BKC economics: 200M cap, 0% team allocation, scarcity curve, 5 burn mechanisms, and why supply shrinks over time.'
            },
            pt: {
                title: 'Tokenomics do BKC — Supply, Burns e Escassez',
                description: 'Mergulho profundo: teto de 200M, 0% pro time, curva de escassez, 5 mecanismos de burn e por que o supply encolhe com o tempo.'
            }
        },
        {
            id: 'ad-2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '2:30',
            tag: 'advanced',
            icon: 'fa-sitemap',
            en: {
                title: 'Fees Explained — Where Every Cent Goes',
                description: 'Complete breakdown of BNB and BKC fees. How fees flow to operators, referrers, stakers, burn, and treasury. Full transparency.'
            },
            pt: {
                title: 'Taxas Explicadas — Pra Onde Vai Cada Centavo',
                description: 'Detalhamento completo das taxas BNB e BKC. Como fluem para operadores, referenciadores, delegadores, burn e tesouro.'
            }
        },
        {
            id: 'ad-3',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'advanced',
            icon: 'fa-landmark',
            en: {
                title: 'Governance — From Admin to DAO',
                description: 'The 4 phases of progressive decentralization: Admin → Multisig → Timelock → DAO. What can change and what\'s immutable forever.'
            },
            pt: {
                title: 'Governança — Do Admin ao DAO',
                description: 'As 4 fases da descentralização progressiva: Admin → Multisig → Timelock → DAO. O que pode mudar e o que é imutável pra sempre.'
            }
        },
        {
            id: 'ad-4',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:00',
            tag: 'advanced',
            icon: 'fa-code',
            en: {
                title: 'For Developers — SDK & Smart Contracts',
                description: 'The @backchain/sdk monorepo: 17 packages, event indexing, API helpers, and how to build on top of Backcoin. Developer quickstart.'
            },
            pt: {
                title: 'Para Desenvolvedores — SDK e Smart Contracts',
                description: 'O monorepo @backchain/sdk: 17 pacotes, indexação de eventos, API helpers e como construir no Backcoin. Quickstart para devs.'
            }
        }
    ]
};

// ============================================================================
// CATEGORY METADATA
// ============================================================================
const categories = [
    {
        key: 'overview',
        icon: 'star',
        color: 'amber',
        en: { title: 'What is Backcoin', desc: '4 videos — Overview, Earning & Operator Guide' },
        pt: { title: 'O Que é o Backcoin', desc: '4 vídeos — Visão Geral, Ganhos e Guia do Operador' }
    },
    {
        key: 'gettingStarted',
        icon: 'rocket',
        color: 'emerald',
        en: { title: 'Getting Started', desc: '3 videos — Setup & First Steps' },
        pt: { title: 'Primeiros Passos', desc: '3 vídeos — Configuração Inicial' }
    },
    {
        key: 'stakingMining',
        icon: 'coins',
        color: 'yellow',
        en: { title: 'Staking & Mining', desc: '4 videos — Delegate, Claim, Unstake & Buyback' },
        pt: { title: 'Staking e Mineração', desc: '4 vídeos — Delegar, Clamar, Unstake e Buyback' }
    },
    {
        key: 'nfts',
        icon: 'gem',
        color: 'purple',
        en: { title: 'NFTs — Boosters, Trading & Rental', desc: '5 videos — Buy, Sell, Rent, List & Fuse' },
        pt: { title: 'NFTs — Boosters, Trading e Aluguel', desc: '5 vídeos — Comprar, Vender, Alugar, Listar e Fundir' }
    },
    {
        key: 'fortune',
        icon: 'dice',
        color: 'red',
        en: { title: 'Fortune Pool', desc: '2 videos — Play & Strategies' },
        pt: { title: 'Fortune Pool', desc: '2 vídeos — Jogar e Estratégias' }
    },
    {
        key: 'social',
        icon: 'comments',
        color: 'cyan',
        en: { title: 'Agora — Social Network', desc: '3 videos — Post, Earn & Build Profile' },
        pt: { title: 'Agora — Rede Social', desc: '3 vídeos — Postar, Ganhar e Montar Perfil' }
    },
    {
        key: 'utilities',
        icon: 'toolbox',
        color: 'blue',
        en: { title: 'Utilities', desc: '5 videos — Notary, Fundraising, Swap & Liquidity' },
        pt: { title: 'Utilidades', desc: '5 vídeos — Cartório, Arrecadação, Swap e Liquidez' }
    },
    {
        key: 'advanced',
        icon: 'graduation-cap',
        color: 'rose',
        en: { title: 'Advanced & Vision', desc: '4 videos — Tokenomics, Fees, Governance & Dev Guide' },
        pt: { title: 'Avançado e Visão', desc: '4 vídeos — Tokenomics, Taxas, Governança e Dev Guide' }
    }
];

// ============================================================================
// TRANSLATIONS
// ============================================================================
const translations = {
    en: {
        heroTitle: 'Master the Backcoin Ecosystem',
        heroSubtitle: 'Complete video tutorials covering every feature — from your first BKC to building your own operator business',
        videoCount: 'Videos',
        languages: '2 Languages',
        allCategories: 'All Categories',
        tagBeginner: 'Beginner',
        tagIntermediate: 'Intermediate',
        tagAdvanced: 'Advanced',
        comingSoon: 'Video coming soon',
        watchNow: 'Watch',
        subscribe: 'Subscribe on YouTube',
        filterAll: 'All',
        filterBeginner: 'Beginner',
        filterIntermediate: 'Intermediate',
        filterAdvanced: 'Advanced'
    },
    pt: {
        heroTitle: 'Domine o Ecossistema Backcoin',
        heroSubtitle: 'Tutoriais completos em vídeo cobrindo cada recurso — do seu primeiro BKC a construir seu próprio negócio de operador',
        videoCount: 'Vídeos',
        languages: '2 Idiomas',
        allCategories: 'Todas as Categorias',
        tagBeginner: 'Iniciante',
        tagIntermediate: 'Intermediário',
        tagAdvanced: 'Avançado',
        comingSoon: 'Vídeo em breve',
        watchNow: 'Assistir',
        subscribe: 'Inscreva-se no YouTube',
        filterAll: 'Todos',
        filterBeginner: 'Iniciante',
        filterIntermediate: 'Intermediário',
        filterAdvanced: 'Avançado'
    }
};

// ============================================================================
// STATE
// ============================================================================
let currentLang = localStorage.getItem('backcoin-tutorials-lang') || 'pt';
let currentFilter = 'all'; // all, beginner, intermediate, advanced

// ============================================================================
// HELPERS
// ============================================================================
function getTotalVideoCount() {
    return Object.values(videos).reduce((sum, arr) => sum + arr.length, 0);
}

function getColorClasses(color) {
    const map = {
        amber:   { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
        emerald: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' },
        yellow:  { bg: 'rgba(250,204,21,0.15)', text: '#facc15', border: 'rgba(250,204,21,0.3)' },
        purple:  { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', border: 'rgba(168,85,247,0.3)' },
        red:     { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
        cyan:    { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee', border: 'rgba(34,211,238,0.3)' },
        blue:    { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
        rose:    { bg: 'rgba(251,113,133,0.15)', text: '#fb7185', border: 'rgba(251,113,133,0.3)' }
    };
    return map[color] || map.amber;
}

function getTagStyle(tag) {
    if (tag === 'beginner') return { bg: 'rgba(52,211,153,0.15)', text: '#34d399' };
    if (tag === 'intermediate') return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' };
    return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
}

function createVideoCard(video, globalIndex) {
    const data = video[currentLang];
    const tagStyle = getTagStyle(video.tag);
    const tagText = translations[currentLang][`tag${video.tag.charAt(0).toUpperCase() + video.tag.slice(1)}`];
    const isPlaceholder = !data.url || data.url === YOUTUBE_CHANNEL;
    const url = isPlaceholder ? YOUTUBE_CHANNEL : data.url;

    return `
        <a href="${url}" target="_blank" rel="noopener noreferrer"
           class="group block rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
           style="background:var(--dash-surface-2, #1c1c21);border:1px solid var(--dash-border, rgba(255,255,255,0.06))">
            <div class="relative overflow-hidden" style="aspect-ratio:16/9;background:#0a0a0f">
                <img src="${video.thumbnail}" alt="${data.title}"
                     style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s"
                     class="group-hover:scale-105"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a2e,#16213e)">
                    <i class="fa-solid ${video.icon || 'fa-play'}" style="font-size:32px;color:rgba(245,158,11,0.3)"></i>
                </div>
                <!-- Play overlay -->
                <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s" class="group-hover:opacity-100">
                    <div style="width:50px;height:50px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(245,158,11,0.4)">
                        <i class="fa-solid fa-play" style="color:#000;font-size:18px;margin-left:3px"></i>
                    </div>
                </div>
                <!-- Number badge -->
                <span style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800;color:#f59e0b">#${globalIndex + 1}</span>
                <!-- Duration -->
                <span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;color:#fff">${video.duration}</span>
            </div>
            <div style="padding:14px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
                    <i class="fa-solid ${video.icon || 'fa-play'}" style="font-size:12px;color:rgba(255,255,255,0.3)"></i>
                    <h3 style="font-weight:700;color:#fff;font-size:13px;margin:0;line-height:1.3;flex:1">${data.title}</h3>
                </div>
                <p style="color:rgba(255,255,255,0.45);font-size:11px;line-height:1.5;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${data.description}</p>
                <span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 8px;border-radius:4px;letter-spacing:0.05em;background:${tagStyle.bg};color:${tagStyle.text}">${tagText}</span>
            </div>
        </a>
    `;
}

function createCategorySection(cat, videoList, startIndex) {
    const t = cat[currentLang];
    const c = getColorClasses(cat.color);

    // Filter videos if filter is active
    const filteredVideos = currentFilter === 'all' ? videoList : videoList.filter(v => v.tag === currentFilter);
    if (filteredVideos.length === 0) return { html: '', nextIndex: startIndex };

    let cardsHtml = '';
    let idx = startIndex;
    filteredVideos.forEach(video => {
        // Find original index for numbering
        const origIdx = Object.values(videos).flat().indexOf(video);
        cardsHtml += createVideoCard(video, origIdx >= 0 ? origIdx : idx);
        idx++;
    });

    const html = `
        <div style="margin-bottom:40px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div style="width:40px;height:40px;border-radius:10px;background:${c.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="fa-solid fa-${cat.icon}" style="color:${c.text};font-size:16px"></i>
                </div>
                <div>
                    <h2 style="font-size:17px;font-weight:700;color:#fff;margin:0">${t.title}</h2>
                    <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:2px 0 0">${t.desc}</p>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
                ${cardsHtml}
            </div>
        </div>
    `;

    return { html, nextIndex: idx };
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('backcoin-tutorials-lang', lang);

    document.querySelectorAll('.tutorials-lang-btn').forEach(btn => {
        const isActive = btn.dataset.lang === lang;
        btn.style.background = isActive ? '#f59e0b' : 'rgba(255,255,255,0.06)';
        btn.style.color = isActive ? '#000' : 'rgba(255,255,255,0.6)';
    });

    renderContent();
}

function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('.tutorials-filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.style.background = isActive ? 'rgba(245,158,11,0.15)' : 'transparent';
        btn.style.color = isActive ? '#f59e0b' : 'rgba(255,255,255,0.4)';
        btn.style.borderColor = isActive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)';
    });

    renderContent();
}

function renderContent() {
    const container = document.getElementById('tutorials-content');
    if (!container) return;

    const t = translations[currentLang];
    const totalVideos = getTotalVideoCount();

    let html = `
        <!-- Hero -->
        <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:28px;font-weight:800;margin:0 0 8px">
                <span style="background:linear-gradient(135deg,#f59e0b,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
                    ${t.heroTitle}
                </span>
            </h1>
            <p style="color:rgba(255,255,255,0.45);max-width:600px;margin:0 auto 16px;font-size:13px;line-height:1.5">${t.heroSubtitle}</p>
            <div style="display:flex;align-items:center;justify-content:center;gap:16px">
                <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4)">
                    <i class="fa-solid fa-video" style="color:#f59e0b"></i>
                    <span>${totalVideos} ${t.videoCount}</span>
                </div>
                <div style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>
                <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4)">
                    <i class="fa-solid fa-language" style="color:#34d399"></i>
                    <span>${t.languages}</span>
                </div>
                <div style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>
                <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4)">
                    <i class="fa-solid fa-layer-group" style="color:#a855f7"></i>
                    <span>8 ${currentLang === 'pt' ? 'Categorias' : 'Categories'}</span>
                </div>
            </div>
        </div>

        <!-- Filter Bar -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:28px;flex-wrap:wrap">
            <button class="tutorials-filter-btn" data-filter="all" onclick="TutorialsPage.setFilter('all')"
                    style="padding:6px 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid ${currentFilter === 'all' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'};background:${currentFilter === 'all' ? 'rgba(245,158,11,0.15)' : 'transparent'};color:${currentFilter === 'all' ? '#f59e0b' : 'rgba(255,255,255,0.4)'};transition:all 0.2s">
                ${t.filterAll} (${totalVideos})
            </button>
            <button class="tutorials-filter-btn" data-filter="beginner" onclick="TutorialsPage.setFilter('beginner')"
                    style="padding:6px 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid ${currentFilter === 'beginner' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'};background:${currentFilter === 'beginner' ? 'rgba(52,211,153,0.15)' : 'transparent'};color:${currentFilter === 'beginner' ? '#34d399' : 'rgba(255,255,255,0.4)'};transition:all 0.2s">
                ${t.filterBeginner}
            </button>
            <button class="tutorials-filter-btn" data-filter="intermediate" onclick="TutorialsPage.setFilter('intermediate')"
                    style="padding:6px 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid ${currentFilter === 'intermediate' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'};background:${currentFilter === 'intermediate' ? 'rgba(245,158,11,0.15)' : 'transparent'};color:${currentFilter === 'intermediate' ? '#f59e0b' : 'rgba(255,255,255,0.4)'};transition:all 0.2s">
                ${t.filterIntermediate}
            </button>
            <button class="tutorials-filter-btn" data-filter="advanced" onclick="TutorialsPage.setFilter('advanced')"
                    style="padding:6px 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid ${currentFilter === 'advanced' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'};background:${currentFilter === 'advanced' ? 'rgba(239,68,68,0.15)' : 'transparent'};color:${currentFilter === 'advanced' ? '#ef4444' : 'rgba(255,255,255,0.4)'};transition:all 0.2s">
                ${t.filterAdvanced}
            </button>
        </div>
    `;

    // Render each category
    let idx = 0;
    for (const cat of categories) {
        const videoList = videos[cat.key];
        if (!videoList) continue;
        const result = createCategorySection(cat, videoList, idx);
        html += result.html;
        idx = result.nextIndex;
    }

    // Subscribe CTA
    html += `
        <div style="text-align:center;padding:32px 20px;margin-top:20px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.05));border:1px solid rgba(245,158,11,0.15);border-radius:16px">
            <i class="fa-brands fa-youtube" style="font-size:36px;color:#ef4444;margin-bottom:12px"></i>
            <h3 style="font-size:16px;font-weight:700;color:#fff;margin:0 0 6px">${t.subscribe}</h3>
            <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 16px">${currentLang === 'pt' ? 'Fique por dentro de novos tutoriais e atualizações' : 'Stay updated with new tutorials and updates'}</p>
            <a href="${YOUTUBE_CHANNEL}" target="_blank" rel="noopener noreferrer"
               style="display:inline-flex;align-items:center;gap:8px;background:#ef4444;color:#fff;padding:10px 24px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;transition:all 0.2s;border:none"
               onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                <i class="fa-brands fa-youtube"></i>
                ${currentLang === 'pt' ? 'Inscrever-se' : 'Subscribe'}
            </a>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================================================
// PAGE EXPORTS
// ============================================================================
export const TutorialsPage = {
    render: function(isNewPage = false) {
        const container = document.getElementById('tutorials');
        if (!container) return;

        if (isNewPage || container.innerHTML.trim() === '') {
            container.innerHTML = `
                <div style="max-width:1100px;margin:0 auto;padding:0 16px">
                    <!-- Header -->
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
                        <div style="display:flex;align-items:center;gap:12px">
                            <div style="width:42px;height:42px;border-radius:12px;background:rgba(34,211,238,0.15);display:flex;align-items:center;justify-content:center">
                                <i class="fa-solid fa-play-circle" style="color:#22d3ee;font-size:20px"></i>
                            </div>
                            <div>
                                <h1 style="font-size:20px;font-weight:800;color:#fff;margin:0">Video Tutorials</h1>
                                <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:2px 0 0">${getTotalVideoCount()} videos — ${currentLang === 'pt' ? 'Todas as funções do ecossistema' : 'Every ecosystem feature'}</p>
                            </div>
                        </div>

                        <!-- Language Switcher -->
                        <div style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.04);padding:4px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                            <button class="tutorials-lang-btn" data-lang="en" onclick="TutorialsPage.setLang('en')"
                                    style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all 0.2s;${currentLang === 'en' ? 'background:#f59e0b;color:#000' : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6)'}">
                                <img src="./assets/en.png" alt="EN" style="width:18px;height:18px;border-radius:50%" onerror="this.style.display='none'">
                                EN
                            </button>
                            <button class="tutorials-lang-btn" data-lang="pt" onclick="TutorialsPage.setLang('pt')"
                                    style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all 0.2s;${currentLang === 'pt' ? 'background:#f59e0b;color:#000' : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6)'}">
                                <img src="./assets/pt.png" alt="PT" style="width:18px;height:18px;border-radius:50%" onerror="this.style.display='none'">
                                PT
                            </button>
                        </div>
                    </div>

                    <!-- Content Container -->
                    <div id="tutorials-content"></div>
                </div>
            `;

            renderContent();
        }
    },

    update: function(isConnected) {
        // No updates needed
    },

    cleanup: function() {
        currentFilter = 'all';
    },

    setLang: setLanguage,
    setFilter: setFilter
};

// Expose to window for onclick handlers
window.TutorialsPage = TutorialsPage;
