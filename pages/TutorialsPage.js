// pages/TutorialsPage.js
// Video Tutorials Page with PT/EN language support

const YOUTUBE_CHANNEL = 'https://www.youtube.com/@Backcoin';

// ============================================================================
// VIDEO DATA - Update YouTube URLs here when videos are ready
// ============================================================================
const videos = {
    gettingStarted: [
        {
            id: 'v1',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '3:42',
            tag: 'beginner',
            en: { title: 'MetaMask Setup (PC & Mobile)', description: 'Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Configurando MetaMask (PC & Mobile)', description: 'Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v2',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '0:53',
            tag: 'beginner',
            en: { title: 'Connect & Claim Starter Pack', description: 'Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Conectar e Receber Starter Pack', description: 'Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v10',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:40',
            tag: 'beginner',
            en: { title: 'Airdrop Ambassador Campaign', description: '35% of TGE for the community! Learn how to earn points by promoting Backcoin.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Campanha de Airdrop - Embaixador', description: '35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.', url: YOUTUBE_CHANNEL }
        }
    ],
    ecosystem: [
        {
            id: 'v4',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '0:48',
            tag: 'intermediate',
            en: { title: 'Staking Pool - Passive Income', description: 'Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!', url: YOUTUBE_CHANNEL },
            pt: { title: 'Staking Pool - Renda Passiva', description: 'Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v5',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '0:50',
            tag: 'intermediate',
            en: { title: 'NFT Market - Boost Your Account', description: 'Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.', url: YOUTUBE_CHANNEL },
            pt: { title: 'NFT Market - Turbine sua Conta', description: 'Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v6',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '0:53',
            tag: 'intermediate',
            en: { title: 'AirBNFT - Rent NFT Power', description: 'Need a boost but don\'t want to buy? Rent NFT power from other players for a fraction of the cost.', url: YOUTUBE_CHANNEL },
            pt: { title: 'AirBNFT - Aluguel de Poder', description: 'Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v7a',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:05',
            tag: 'intermediate',
            en: { title: 'List Your NFT for Rent', description: 'Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Liste seu NFT para Aluguel', description: 'Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v7b',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:31',
            tag: 'intermediate',
            en: { title: 'Decentralized Notary', description: 'Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Cartório Descentralizado', description: 'Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v8',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:34',
            tag: 'intermediate',
            en: { title: 'Fortune Pool - The Big Jackpot', description: 'Test your luck with decentralized oracle results. Up to 100x multipliers!', url: YOUTUBE_CHANNEL },
            pt: { title: 'Fortune Pool - O Grande Jackpot', description: 'Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v9',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:20',
            tag: 'beginner',
            en: { title: 'The Backcoin Manifesto (Promo)', description: 'Economy, Games, Passive Income, Utility. This is not just a token - it\'s a new digital economy.', url: YOUTUBE_CHANNEL },
            pt: { title: 'O Manifesto Backcoin (Promo)', description: 'Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.', url: YOUTUBE_CHANNEL }
        }
    ],
    advanced: [
        {
            id: 'v11',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:25',
            tag: 'advanced',
            en: { title: 'Hub & Spoke Architecture', description: 'Deep dive into Backcoin\'s technical architecture. How the ecosystem manager connects all services.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Arquitetura Hub & Spoke', description: 'Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v12',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:25',
            tag: 'advanced',
            en: { title: 'Mining Evolution: PoW vs PoS vs Backcoin', description: 'From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.', url: YOUTUBE_CHANNEL },
            pt: { title: 'Evolução da Mineração: PoW vs PoS vs Backcoin', description: 'Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v13',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:25',
            tag: 'advanced',
            en: { title: 'The Infinite Future (Roadmap)', description: 'Credit cards, insurance, DEX, lending... What\'s coming next in the Backcoin Super App.', url: YOUTUBE_CHANNEL },
            pt: { title: 'O Futuro Infinito (Roadmap)', description: 'Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.', url: YOUTUBE_CHANNEL }
        },
        {
            id: 'v14',
            thumbnail: 'https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg',
            duration: '1:35',
            tag: 'advanced',
            en: { title: 'The New Wave of Millionaires', description: 'Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.', url: YOUTUBE_CHANNEL },
            pt: { title: 'A Nova Leva de Milionários', description: 'Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.', url: YOUTUBE_CHANNEL }
        }
    ]
};

// ============================================================================
// TRANSLATIONS
// ============================================================================
const translations = {
    en: {
        heroTitle: 'Master the Backcoin Ecosystem',
        heroSubtitle: 'Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more',
        videos: 'Videos',
        languages: '2 Languages',
        catGettingStarted: 'Getting Started',
        catGettingStartedDesc: '3 videos • Setup & First Steps',
        catEcosystem: 'Ecosystem Features',
        catEcosystemDesc: '7 videos • Core Features & Tools',
        catAdvanced: 'Advanced & Vision',
        catAdvancedDesc: '4 videos • Deep Dives & Future',
        tagBeginner: 'Beginner',
        tagIntermediate: 'Intermediate',
        tagAdvanced: 'Advanced'
    },
    pt: {
        heroTitle: 'Domine o Ecossistema Backcoin',
        heroSubtitle: 'Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais',
        videos: 'Vídeos',
        languages: '2 Idiomas',
        catGettingStarted: 'Primeiros Passos',
        catGettingStartedDesc: '3 vídeos • Configuração Inicial',
        catEcosystem: 'Recursos do Ecossistema',
        catEcosystemDesc: '7 vídeos • Ferramentas Principais',
        catAdvanced: 'Avançado & Visão',
        catAdvancedDesc: '4 vídeos • Aprofundamento & Futuro',
        tagBeginner: 'Iniciante',
        tagIntermediate: 'Intermediário',
        tagAdvanced: 'Avançado'
    }
};

// ============================================================================
// STATE
// ============================================================================
let currentLang = localStorage.getItem('backcoin-tutorials-lang') || 'en';

// ============================================================================
// HELPERS
// ============================================================================
function createVideoCard(video, index) {
    const data = video[currentLang];
    const tagClass = video.tag === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' : 
                     video.tag === 'intermediate' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
    const tagText = translations[currentLang][`tag${video.tag.charAt(0).toUpperCase() + video.tag.slice(1)}`];
    
    return `
        <a href="${data.url}" target="_blank" rel="noopener noreferrer" 
           class="group block bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
            <div class="relative aspect-video overflow-hidden bg-zinc-900">
                <img src="${video.thumbnail}" alt="${data.title}" 
                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     onerror="this.src='./assets/bkc_logo_3d.png'; this.style.objectFit='contain'; this.style.padding='40px';">
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fa-solid fa-play text-zinc-900 text-xl ml-1"></i>
                    </div>
                </div>
                <span class="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-bold text-amber-400">#${index + 1}</span>
                <span class="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white">${video.duration}</span>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-white text-sm mb-1 line-clamp-2">${data.title}</h3>
                <p class="text-zinc-400 text-xs line-clamp-2 mb-3">${data.description}</p>
                <span class="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded ${tagClass}">${tagText}</span>
            </div>
        </a>
    `;
}

function createCategorySection(id, icon, iconColor, videos, titleKey, descKey, startIndex) {
    const t = translations[currentLang];
    let html = `
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${iconColor}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${icon} text-${iconColor}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${t[titleKey]}</h2>
                    <p class="text-xs text-zinc-500">${t[descKey]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `;
    
    let idx = startIndex;
    videos.forEach(video => {
        html += createVideoCard(video, idx++);
    });
    
    html += `</div></div>`;
    return { html, nextIndex: idx };
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('backcoin-tutorials-lang', lang);
    
    // Update buttons
    document.getElementById('tutorials-btn-en')?.classList.toggle('bg-amber-500', lang === 'en');
    document.getElementById('tutorials-btn-en')?.classList.toggle('text-zinc-900', lang === 'en');
    document.getElementById('tutorials-btn-en')?.classList.toggle('bg-zinc-700', lang !== 'en');
    document.getElementById('tutorials-btn-en')?.classList.toggle('text-zinc-300', lang !== 'en');
    
    document.getElementById('tutorials-btn-pt')?.classList.toggle('bg-amber-500', lang === 'pt');
    document.getElementById('tutorials-btn-pt')?.classList.toggle('text-zinc-900', lang === 'pt');
    document.getElementById('tutorials-btn-pt')?.classList.toggle('bg-zinc-700', lang !== 'pt');
    document.getElementById('tutorials-btn-pt')?.classList.toggle('text-zinc-300', lang !== 'pt');
    
    // Re-render content
    renderContent();
}

function renderContent() {
    const container = document.getElementById('tutorials-content');
    if (!container) return;
    
    const t = translations[currentLang];
    
    let html = `
        <!-- Hero -->
        <div class="text-center mb-10">
            <h1 class="text-3xl sm:text-4xl font-bold mb-3">
                <span class="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                    ${t.heroTitle}
                </span>
            </h1>
            <p class="text-zinc-400 max-w-2xl mx-auto">${t.heroSubtitle}</p>
            <div class="flex items-center justify-center gap-4 mt-4">
                <div class="flex items-center gap-2 text-sm text-zinc-500">
                    <i class="fa-solid fa-video text-amber-400"></i>
                    <span>14 ${t.videos}</span>
                </div>
                <div class="w-1 h-1 bg-zinc-600 rounded-full"></div>
                <div class="flex items-center gap-2 text-sm text-zinc-500">
                    <i class="fa-solid fa-language text-emerald-400"></i>
                    <span>${t.languages}</span>
                </div>
            </div>
        </div>
    `;
    
    // Getting Started
    let result = createCategorySection('getting-started', 'rocket', 'emerald', videos.gettingStarted, 'catGettingStarted', 'catGettingStartedDesc', 0);
    html += result.html;
    
    // Ecosystem
    result = createCategorySection('ecosystem', 'cubes', 'amber', videos.ecosystem, 'catEcosystem', 'catEcosystemDesc', result.nextIndex);
    html += result.html;
    
    // Advanced
    result = createCategorySection('advanced', 'graduation-cap', 'cyan', videos.advanced, 'catAdvanced', 'catAdvancedDesc', result.nextIndex);
    html += result.html;
    
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
                <div class="max-w-6xl mx-auto">
                    <!-- Header with Language Switcher -->
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-play-circle text-cyan-400 text-xl"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold text-white">Video Tutorials</h1>
                                <p class="text-xs text-zinc-500">Learn how to use Backcoin</p>
                            </div>
                        </div>
                        
                        <!-- Language Switcher -->
                        <div class="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                            <button id="tutorials-btn-en" onclick="TutorialsPage.setLang('en')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${currentLang === 'en' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}">
                                <img src="./assets/en.png" alt="EN" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">EN</span>
                            </button>
                            <button id="tutorials-btn-pt" onclick="TutorialsPage.setLang('pt')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${currentLang === 'pt' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}">
                                <img src="./assets/pt.png" alt="PT" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">PT</span>
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
        // No updates needed based on connection
    },
    
    cleanup: function() {
        // No cleanup needed
    },
    
    setLang: setLanguage
};

// Expose to window for onclick handlers
window.TutorialsPage = TutorialsPage;