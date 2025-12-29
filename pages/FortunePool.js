// js/pages/FortunePool.js
// ✅ PRODUCTION V2.1 - Instant Resolution with Service Fee Display
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Fortune Pool - Decentralized Lottery
// ═══════════════════════════════════════════════════════════════════════════════
// 
// V2.1 Changes:
// - Service fee (ETH) displayed in mode select and wager screens
// - Reads tier data and fees from contract
// - Full BackchainRandomness Oracle integration
// - Instant game resolution
//
// V2.0 Changes:
// - Integrated with BackchainRandomness Oracle
// - Games resolve INSTANTLY in the same transaction
// - No more polling for results
// - Simplified flow: play() returns results directly
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

import { State } from '../state.js';
import { loadUserData, API_ENDPOINTS } from '../modules/data.js';
import { executeFortunePlay } from '../modules/transactions.js';
import { formatBigNumber } from '../utils.js';
import { showToast, openModal, closeModal } from '../ui-feedback.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const ORACLE_ADDRESS = "0x16346f5a45f9615f1c894414989f0891c54ef07b"; // BackchainRandomness Oracle
const FORTUNE_POOL_ADDRESS = "0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526"; // Fortune Pool Contract
const TIGER_IMAGE = "./assets/fortune.png";
const SHARE_POINTS = 1000;

// Multi-language UI texts
const MODAL_UI = {
    pt: { title: 'Compartilhe & Ganhe!', subtitle: `+${1000} pontos para o Airdrop`, later: 'Talvez depois' },
    en: { title: 'Share & Earn!', subtitle: `+${1000} points for Airdrop`, later: 'Maybe later' },
    es: { title: '¡Comparte y Gana!', subtitle: `+${1000} puntos para el Airdrop`, later: 'Quizás después' }
};

const SHARE_TEXTS = {
    pt: {
        win: (prize) => `🎉 Ganhei ${prize.toLocaleString()} BKC no Fortune Pool!\n\n🐯 Loteria on-chain com resultados instantâneos!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 Jogando Fortune Pool no @backcoin!\n\nLoteria on-chain verificável com Oracle seguro!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    },
    en: {
        win: (prize) => `🎉 Just won ${prize.toLocaleString()} BKC on Fortune Pool!\n\n🐯 On-chain lottery with instant results!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 Playing Fortune Pool on @backcoin!\n\nVerifiable on-chain lottery with secure Oracle!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    },
    es: {
        win: (prize) => `🎉 ¡Gané ${prize.toLocaleString()} BKC en Fortune Pool!\n\n🐯 ¡Lotería on-chain con resultados instantáneos!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 ¡Jugando Fortune Pool en @backcoin!\n\nLotería on-chain verificable con Oracle seguro!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    }
};

// Flag images for language selector
const FLAG_IMAGES = {
    pt: './assets/pt.png',
    en: './assets/en.png',
    es: './assets/es.png'
};

let currentLang = 'en';

const TIERS = [
    { 
        id: 1, name: "Easy", emoji: "🍀", range: 3, multiplier: 200, chance: "33%",
        color: "emerald", hex: "#10b981",
        bgFrom: "from-emerald-500/20", bgTo: "to-green-600/10",
        borderColor: "border-emerald-500/50", textColor: "text-emerald-400"
    },
    { 
        id: 2, name: "Medium", emoji: "⚡", range: 10, multiplier: 500, chance: "10%",
        color: "violet", hex: "#8b5cf6",
        bgFrom: "from-violet-500/20", bgTo: "to-purple-600/10",
        borderColor: "border-violet-500/50", textColor: "text-violet-400"
    },
    { 
        id: 3, name: "Hard", emoji: "👑", range: 100, multiplier: 5000, chance: "1%",
        color: "amber", hex: "#f59e0b",
        bgFrom: "from-amber-500/20", bgTo: "to-orange-600/10",
        borderColor: "border-amber-500/50", textColor: "text-amber-400"
    }
];

const MAX_COMBO_MULTIPLIER = 5700; // 200 + 500 + 5000

// ============================================================================
// GAME STATE
// ============================================================================
const Game = {
    mode: null,           // 'jackpot' or 'combo'
    phase: 'select',      // 'select' | 'pick' | 'wager' | 'processing' | 'result'
    guess: 50,            // Single guess for jackpot mode
    guesses: [2, 5, 50],  // Array of guesses for combo mode
    comboStep: 0,         // Current step in combo picker (0-2)
    wager: 10,            // Wager amount
    gameId: null,         // Game ID from contract
    result: null,         // Result data: { rolls, prizeWon, matches }
    txHash: null,         // Transaction hash
    poolStatus: null,
    history: [],
    // V2: Service Fee (ETH) for project funding
    serviceFee: 0n,       // Base fee in wei
    serviceFee1x: 0n,     // Fee for 1x mode
    serviceFee5x: 0n,     // Fee for 5x mode
    tiersData: null       // Tier data from contract
};

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('fortune-styles-v2')) return;
    
    const style = document.createElement('style');
    style.id = 'fortune-styles-v2';
    style.textContent = `
        /* Tiger Mascot Animations */
        @keyframes tiger-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes tiger-pulse {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(249,115,22,0.3)); }
            50% { filter: drop-shadow(0 0 40px rgba(249,115,22,0.6)); }
        }
        @keyframes tiger-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes tiger-celebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.1) rotate(10deg); }
            75% { transform: scale(1.15) rotate(-5deg); }
        }
        .tiger-float { animation: tiger-float 4s ease-in-out infinite; }
        .tiger-pulse { animation: tiger-pulse 2s ease-in-out infinite; }
        .tiger-spin { animation: tiger-spin 1s linear infinite; }
        .tiger-celebrate { animation: tiger-celebrate 0.8s ease-out infinite; }
        
        /* Processing Animation */
        @keyframes processing-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
        }
        .processing-pulse { animation: processing-pulse 1.5s ease-in-out infinite; }
        
        /* Slot Machine Numbers */
        @keyframes slot-spin {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        .slot-spin { animation: slot-spin 0.1s linear infinite; }
        
        /* Number Reveal */
        @keyframes number-reveal {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(10deg); }
            70% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .number-reveal { animation: number-reveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        
        /* Match/Miss Animations */
        @keyframes match-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .match-pulse { animation: match-pulse 0.8s ease-out 3; }
        
        @keyframes miss-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
        }
        .miss-shake { animation: miss-shake 0.5s ease-out; }
        
        /* Glow Effects */
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(249,115,22,0.3)); }
            50% { box-shadow: 0 0 40px var(--glow-color, rgba(249,115,22,0.6)); }
        }
        .glow-pulse { animation: glow-pulse 1s ease-in-out infinite; }
        
        /* Confetti */
        @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti { 
            position: fixed; 
            pointer-events: none; 
            animation: confetti-fall 3s ease-out forwards;
            z-index: 9999;
        }
        .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        }
        
        /* Coin Rain */
        @keyframes coin-fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .coin {
            position: fixed;
            font-size: 24px;
            pointer-events: none;
            animation: coin-fall 3s ease-out forwards;
            z-index: 9999;
        }
        
        /* Slider Styles */
        .fortune-slider {
            -webkit-appearance: none;
            height: 8px;
            border-radius: 4px;
            background: #27272a;
        }
        .fortune-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
        }
        .fortune-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer;
            border: none;
        }
        
        /* Waiting Dots */
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .waiting-dots::after {
            content: '';
            animation: dots 1.5s infinite;
        }
        
        /* V2 Badge */
        .v2-badge {
            background: linear-gradient(135deg, #10b981, #059669);
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    injectStyles();
    
    // O container da página Fortune Pool é a section com id="actions"
    const app = document.getElementById('actions');
    if (!app) {
        console.error("❌ FortunePool: Container #actions not found!");
        return;
    }

    app.innerHTML = `
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${TIGER_IMAGE}" 
                         class="w-28 h-28 object-contain mx-auto tiger-float tiger-pulse" 
                         alt="Fortune Tiger"
                         onerror="this.style.display='none'; document.getElementById('tiger-fallback').style.display='flex';">
                    <div id="tiger-fallback" class="hidden items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/30 mx-auto">
                        <span class="text-5xl">🐯</span>
                    </div>
                </div>
                <div class="flex items-center justify-center gap-2 mt-2">
                    <h1 class="text-2xl font-bold text-white">Fortune Pool</h1>
                </div>
                <p class="text-zinc-500 text-sm mt-1">🎰 Instant Results • Verifiable Randomness</p>
                
                <!-- Contract Verification Links -->
                <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <a href="${EXPLORER_ADDRESS}${ORACLE_ADDRESS}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${EXPLORER_ADDRESS}${FORTUNE_POOL_ADDRESS}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors">
                        <i class="fa-solid fa-file-contract text-amber-400 text-[10px]"></i>
                        <span class="text-amber-400 text-[10px] font-medium">Game Contract</span>
                        <i class="fa-solid fa-external-link text-amber-400/50 text-[8px]"></i>
                    </a>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-2 mb-6">
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">🏆 Prize Pool</p>
                    <p id="prize-pool" class="text-orange-400 font-bold">--</p>
                </div>
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">💰 Balance</p>
                    <p id="user-balance" class="text-white font-bold">--</p>
                </div>
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">🎮 Games</p>
                    <p id="total-games" class="text-zinc-300 font-bold">--</p>
                </div>
            </div>

            <!-- Game Area -->
            <div id="game-area" class="mb-6"></div>

            <!-- History -->
            <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div class="flex items-center justify-between p-3 border-b border-zinc-800/50">
                    <span class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-paw text-orange-500 text-xs"></i>
                        Recent Games
                    </span>
                    <span id="win-rate" class="text-xs text-zinc-500"></span>
                </div>
                <div id="history-list" class="max-h-[300px] overflow-y-auto p-2">
                    <div class="p-6 text-center text-zinc-600 text-sm">
                        <img src="${TIGER_IMAGE}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `;

    loadPoolData();
    renderPhase();
}

function cleanup() {
    // Cleanup any intervals or listeners
}

// ============================================================================
// PHASE ROUTER
// ============================================================================
function renderPhase() {
    const area = document.getElementById('game-area');
    if (!area) return;

    updateTigerAnimation(Game.phase);

    switch (Game.phase) {
        case 'select': renderModeSelect(area); break;
        case 'pick': renderPicker(area); break;
        case 'wager': renderWager(area); break;
        case 'processing': renderProcessing(area); break;
        case 'result': renderResult(area); break;
        default: renderModeSelect(area);
    }
}

function updateTigerAnimation(phase) {
    const tiger = document.getElementById('tiger-mascot');
    if (!tiger) return;
    
    tiger.className = 'w-28 h-28 object-contain mx-auto';
    tiger.style.filter = '';
    
    switch (phase) {
        case 'select':
            tiger.classList.add('tiger-float', 'tiger-pulse');
            break;
        case 'pick':
        case 'wager':
            tiger.classList.add('tiger-float');
            break;
        case 'processing':
            tiger.classList.add('tiger-spin');
            break;
        case 'result':
            if (Game.result?.prizeWon > 0) {
                tiger.classList.add('tiger-celebrate');
            } else {
                tiger.style.filter = 'grayscale(0.5)';
                tiger.classList.add('tiger-float');
            }
            break;
    }
}

// ============================================================================
// PHASE 1: MODE SELECT
// ============================================================================
function renderModeSelect(container) {
    // V2: Format service fees
    const fee1x = Game.serviceFee1x > 0n ? (Number(Game.serviceFee1x) / 1e18).toFixed(6) : '0';
    const fee5x = Game.serviceFee5x > 0n ? (Number(Game.serviceFee5x) / 1e18).toFixed(6) : '0';
    const hasFees = Game.serviceFee1x > 0n || Game.serviceFee5x > 0n;
    
    container.innerHTML = `
        <div class="space-y-4">
            <!-- JACKPOT MODE -->
            <button id="btn-jackpot" class="game-mode-card w-full text-left p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border-2 border-zinc-700/50 rounded-2xl hover:border-amber-500/50 transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="text-4xl">👑</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold text-white">Jackpot</h3>
                            <span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-black">5000x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 1 number from 1-100</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span class="text-xs text-zinc-400">1% chance</span>
                            </div>
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                <i class="fa-solid fa-bolt text-amber-400 text-[10px]"></i>
                                <span class="text-xs text-amber-400">Big Win</span>
                            </div>
                            ${hasFees ? `
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <i class="fa-brands fa-ethereum text-blue-400 text-[10px]"></i>
                                <span class="text-xs text-blue-400">${fee1x} ETH</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </button>

            <!-- COMBO MODE -->
            <button id="btn-combo" class="game-mode-card w-full text-left p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/20 border-2 border-zinc-700/50 rounded-2xl hover:border-violet-500/50 transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="text-4xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold text-white">Combo</h3>
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${MAX_COMBO_MULTIPLIER}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, win on each match</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${TIERS.map(t => `
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${t.emoji}</span>
                                    <span class="text-xs ${t.textColor} font-bold">${t.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${t.chance}</span>
                                </div>
                            `).join('')}
                            ${hasFees ? `
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <i class="fa-brands fa-ethereum text-blue-400 text-[10px]"></i>
                                <span class="text-xs text-blue-400">${fee5x} ETH</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </button>

            ${!State.isConnected ? `
                <div class="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 text-center">
                    <i class="fa-solid fa-wallet text-zinc-600 text-xl mb-2"></i>
                    <p class="text-zinc-500 text-sm">Connect wallet to play</p>
                </div>
            ` : ''}
            
            <!-- Oracle Security Info -->
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    <span class="text-emerald-400 text-sm font-medium">Provably Fair Gaming</span>
                </div>
                <p class="text-zinc-400 text-xs">Results generated by on-chain Oracle. 100% verifiable and tamper-proof.</p>
                <a href="${EXPLORER_ADDRESS}${ORACLE_ADDRESS}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `;

    document.getElementById('btn-jackpot')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'jackpot';
        Game.guess = 50;
        Game.phase = 'pick';
        renderPhase();
    });

    document.getElementById('btn-combo')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'combo';
        Game.guesses = [2, 5, 50];
        Game.comboStep = 0;
        Game.phase = 'pick';
        renderPhase();
    });
}

// ============================================================================
// PHASE 2: NUMBER PICKER
// ============================================================================
function renderPicker(container) {
    if (Game.mode === 'jackpot') {
        renderJackpotPicker(container);
    } else {
        renderComboPicker(container);
    }
}

function renderJackpotPicker(container) {
    const tier = TIERS[2]; // Hard tier
    const current = Game.guess;
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-full mb-2">
                    <span class="text-2xl">${tier.emoji}</span>
                    <span class="${tier.textColor} font-bold">Jackpot Mode</span>
                </div>
                <p class="text-zinc-400 text-sm">Choose your lucky number!</p>
                <p class="text-xs text-zinc-500 mt-1">Range <span class="text-white font-bold">1-100</span> • Chance <span class="text-emerald-400">1%</span> • Win <span class="${tier.textColor} font-bold">5000x</span></p>
            </div>

            <!-- Number Input with +/- buttons -->
            <div class="flex items-center justify-center gap-4 mb-4">
                <button id="btn-minus-10" class="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">
                    -10
                </button>
                <button id="btn-minus" class="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-2xl transition-all border border-zinc-700">
                    −
                </button>
                
                <div class="relative">
                    <input type="number" id="number-input" min="1" max="100" value="${current}" 
                        class="w-24 h-24 text-center text-4xl font-black rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} ${tier.textColor} focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
                        style="-moz-appearance: textfield;">
                </div>
                
                <button id="btn-plus" class="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-2xl transition-all border border-zinc-700">
                    +
                </button>
                <button id="btn-plus-10" class="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">
                    +10
                </button>
            </div>

            <!-- Slider -->
            <div class="mb-4 px-2">
                <input type="range" id="number-slider" min="1" max="100" value="${current}" 
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${current}%, #27272a ${current}%, #27272a 100%)">
                <div class="flex justify-between text-xs text-zinc-500 mt-2 px-1">
                    <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
            </div>
            
            <!-- Quick Select -->
            <div class="flex justify-center gap-2 mb-4 flex-wrap">
                <button class="quick-pick px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="7">Lucky 7</button>
                <button class="quick-pick px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="13">13</button>
                <button class="quick-pick px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="21">21</button>
                <button class="quick-pick px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="50">50</button>
                <button class="quick-pick px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="77">77</button>
                <button class="quick-pick px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="99">99</button>
                <button id="btn-random" class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                    <i class="fa-solid fa-dice mr-1"></i>Random
                </button>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Previous
                </button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    Continue<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `;

    const input = document.getElementById('number-input');
    const slider = document.getElementById('number-slider');
    const tier3 = TIERS[2];
    
    const updateValue = (val) => {
        // Clamp between 1 and 100
        val = Math.max(1, Math.min(100, val));
        Game.guess = val;
        
        if (input) input.value = val;
        if (slider) {
            slider.value = val;
            slider.style.background = `linear-gradient(to right, ${tier3.hex} 0%, ${tier3.hex} ${val}%, #27272a ${val}%, #27272a 100%)`;
        }
    };
    
    // Input change
    input?.addEventListener('input', (e) => {
        let val = parseInt(e.target.value) || 1;
        updateValue(val);
    });
    
    input?.addEventListener('blur', (e) => {
        let val = parseInt(e.target.value) || 1;
        updateValue(val);
    });
    
    // Slider change
    slider?.addEventListener('input', (e) => {
        updateValue(parseInt(e.target.value));
    });
    
    // +/- buttons
    document.getElementById('btn-minus')?.addEventListener('click', () => updateValue(Game.guess - 1));
    document.getElementById('btn-plus')?.addEventListener('click', () => updateValue(Game.guess + 1));
    document.getElementById('btn-minus-10')?.addEventListener('click', () => updateValue(Game.guess - 10));
    document.getElementById('btn-plus-10')?.addEventListener('click', () => updateValue(Game.guess + 10));
    
    // Quick picks
    document.querySelectorAll('.quick-pick').forEach(btn => {
        btn.addEventListener('click', () => updateValue(parseInt(btn.dataset.number)));
    });
    
    // Random button
    document.getElementById('btn-random')?.addEventListener('click', () => {
        updateValue(Math.floor(Math.random() * 100) + 1);
    });

    document.getElementById('btn-back')?.addEventListener('click', () => { 
        Game.phase = 'select'; 
        renderPhase(); 
    });
    
    document.getElementById('btn-next')?.addEventListener('click', () => { 
        Game.phase = 'wager'; 
        renderPhase(); 
    });
}

function renderComboPicker(container) {
    const tier = TIERS[Game.comboStep];
    const current = Game.guesses[Game.comboStep];
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-3 mb-5">
                ${TIERS.map((t, i) => {
                    const isActive = i === Game.comboStep;
                    const isDone = i < Game.comboStep;
                    return `
                        <div class="flex items-center gap-2 px-3 py-2 rounded-xl border ${isActive ? `bg-gradient-to-br ${t.bgFrom} ${t.bgTo} ${t.borderColor}` : isDone ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-800/50 border-zinc-700/50'}">
                            <span class="text-xl">${isDone ? '✓' : t.emoji}</span>
                            <div class="text-left">
                                <p class="text-xs font-bold ${isActive ? t.textColor : isDone ? 'text-emerald-400' : 'text-zinc-500'}">${t.name}</p>
                                <p class="text-[10px] ${isDone ? 'text-emerald-400 font-bold' : 'text-zinc-600'}">${isDone ? Game.guesses[i] : t.multiplier + 'x'}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-full mb-2">
                    <span class="text-2xl">${tier.emoji}</span>
                    <span class="${tier.textColor} font-bold">${tier.name} Tier</span>
                </div>
                <p class="text-zinc-400 text-sm">Pick <span class="text-white font-bold">1-${tier.range}</span> • <span class="text-emerald-400">${tier.chance}</span> • <span class="${tier.textColor} font-bold">${tier.multiplier}x</span></p>
            </div>

            <!-- Number Selection -->
            <div class="flex justify-center gap-2 mb-5">
                ${Array.from({length: tier.range}, (_, i) => i + 1).map(n => `
                    <button class="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all ${n === current ? `bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} ${tier.textColor}` : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}" data-num="${n}">
                        ${n}
                    </button>
                `).join('')}
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>${Game.comboStep > 0 ? 'Previous' : 'Back'}
                </button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-${tier.color}-500 to-${tier.color}-600 text-black font-bold rounded-xl transition-all">
                    ${Game.comboStep < 2 ? 'Next' : 'Continue'}<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `;

    // Number selection
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = parseInt(btn.dataset.num);
            Game.guesses[Game.comboStep] = num;
            
            // Update visual
            document.querySelectorAll('.num-btn').forEach(b => {
                const n = parseInt(b.dataset.num);
                if (n === num) {
                    b.className = `num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} ${tier.textColor}`;
                } else {
                    b.className = 'num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600';
                }
            });
        });
    });

    // Navigation
    document.getElementById('btn-back')?.addEventListener('click', () => {
        if (Game.comboStep > 0) {
            Game.comboStep--;
            renderPhase();
        } else {
            Game.phase = 'select';
            renderPhase();
        }
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        if (Game.comboStep < 2) {
            Game.comboStep++;
            renderPhase();
        } else {
            Game.phase = 'wager';
            renderPhase();
        }
    });
}

// ============================================================================
// PHASE 3: WAGER
// ============================================================================
function renderWager(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const maxMulti = isJackpot ? 50 : MAX_COMBO_MULTIPLIER;
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const hasBalance = balanceNum >= 1;
    
    // V2: Get service fee for current mode
    const serviceFeeWei = isJackpot ? Game.serviceFee1x : Game.serviceFee5x;
    const serviceFeeEth = serviceFeeWei > 0n ? Number(serviceFeeWei) / 1e18 : 0;
    const hasFee = serviceFeeWei > 0n;

    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-5">
                <h2 class="text-xl font-bold text-white mb-2">🎰 Your Selection</h2>
                <div class="flex justify-center gap-3">
                    ${(isJackpot ? [{ tier: TIERS[2], pick: picks[0] }] : picks.map((p, i) => ({ tier: TIERS[i], pick: p }))).map(({ tier, pick }) => `
                        <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-xl">
                            <span class="text-xl">${tier.emoji}</span>
                            <span class="text-2xl font-black ${tier.textColor}">${pick}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Wager Input -->
            <div class="mb-5">
                <label class="block text-sm text-zinc-400 mb-2">Wager Amount (BKC)</label>
                <div class="flex items-center gap-3 mb-3">
                    <input type="number" id="custom-wager" value="${Game.wager}" min="1" max="${Math.floor(balanceNum)}"
                        class="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold text-center text-xl focus:outline-none focus:border-amber-500/50">
                    <span class="text-zinc-500 text-sm">/ ${balanceNum.toFixed(2)}</span>
                </div>
                
                <!-- Quick Buttons -->
                <div class="grid grid-cols-4 gap-2">
                    ${[10, 50, 100, Math.floor(balanceNum)].map(val => `
                        <button class="percent-btn py-2 text-sm font-bold rounded-lg transition-all ${Game.wager === val ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}" data-value="${val}">
                            ${val === Math.floor(balanceNum) ? 'MAX' : val}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Potential Win -->
            <div class="p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/10 border border-emerald-500/30 rounded-xl mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-zinc-400 mb-1">🏆 Max Potential Win</p>
                        <p class="text-3xl font-black text-emerald-400" id="potential-win">${(Game.wager * maxMulti).toLocaleString()}</p>
                        <p class="text-xs text-emerald-400/60">BKC</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-zinc-400 mb-1">Multiplier</p>
                        <p class="text-2xl font-bold text-white">${maxMulti}x</p>
                        <p class="text-[10px] text-zinc-500">${isJackpot ? 'if you match!' : 'if all match!'}</p>
                    </div>
                </div>
            </div>

            ${hasFee ? `
            <!-- Service Fee Info -->
            <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-brands fa-ethereum text-blue-400"></i>
                        <span class="text-sm text-zinc-300">Game Fee</span>
                    </div>
                    <div class="text-right">
                        <span class="text-blue-400 font-bold">${serviceFeeEth.toFixed(6)} ETH</span>
                        <p class="text-[10px] text-zinc-500">${isJackpot ? '1x mode' : '5x mode'}</p>
                    </div>
                </div>
            </div>
            ` : ''}

            ${!hasBalance ? `
                <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 text-center">
                    <p class="text-red-400 text-sm">Insufficient BKC balance</p>
                    <button id="btn-faucet" class="mt-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-colors">
                        <i class="fa-solid fa-faucet mr-2"></i>Get Test Tokens
                    </button>
                </div>
            ` : ''}

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Back
                </button>
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all ${!hasBalance ? 'opacity-50 cursor-not-allowed' : ''}" ${!hasBalance ? 'disabled' : ''}>
                    <i class="fa-solid fa-paw mr-2"></i>Play Now
                </button>
            </div>
        </div>
    `;

    setupWagerEvents(maxMulti, balanceNum);
}

function setupWagerEvents(maxMulti, balanceNum) {
    const updateWager = (amount) => {
        Game.wager = Math.max(1, Math.min(Math.floor(amount), Math.floor(balanceNum)));
        
        const customInput = document.getElementById('custom-wager');
        const potentialWin = document.getElementById('potential-win');
        
        if (customInput) customInput.value = Game.wager;
        if (potentialWin) potentialWin.textContent = (Game.wager * maxMulti).toLocaleString();
        
        document.querySelectorAll('.percent-btn').forEach(btn => {
            const value = parseInt(btn.dataset.value);
            const isSelected = Game.wager === value;
            btn.classList.toggle('bg-amber-500/20', isSelected);
            btn.classList.toggle('border-amber-500/50', isSelected);
            btn.classList.toggle('text-amber-400', isSelected);
            btn.classList.toggle('border-zinc-700/50', !isSelected);
            btn.classList.toggle('bg-zinc-800/60', !isSelected);
            btn.classList.toggle('text-zinc-400', !isSelected);
        });
    };

    document.querySelectorAll('.percent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateWager(parseInt(btn.dataset.value) || 1);
        });
    });
    
    document.getElementById('custom-wager')?.addEventListener('input', (e) => {
        updateWager(parseInt(e.target.value) || 1);
    });
    
    document.getElementById('btn-faucet')?.addEventListener('click', async () => {
        showToast('Requesting tokens...', 'info');
        try {
            const res = await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${State.userAddress}`);
            const data = await res.json();
            if (data.success) { 
                showToast('🎉 Tokens received!', 'success'); 
                await loadUserData(); 
                renderPhase(); 
            } else {
                showToast(data.error || 'Error', 'error');
            }
        } catch { 
            showToast('Faucet error', 'error'); 
        }
    });
    
    document.getElementById('btn-back')?.addEventListener('click', () => { 
        Game.phase = 'pick'; 
        if (Game.mode === 'combo') Game.comboStep = 2; 
        renderPhase(); 
    });
    
    document.getElementById('btn-play')?.addEventListener('click', async () => {
        if (Game.wager < 1) return showToast('Min: 1 BKC', 'warning');
        
        // Start processing
        Game.phase = 'processing';
        renderPhase();
        
        try {
            // V2: Call play() which returns results instantly!
            const guesses = Game.mode === 'jackpot' ? [Game.guess] : Game.guesses;
            const isCumulative = Game.mode === 'combo';
            
            const result = await executeFortunePlay(Game.wager, guesses, isCumulative);
            
            if (result?.success) {
                // V2: Results are returned immediately!
                Game.gameId = result.gameId;
                Game.txHash = result.txHash;
                Game.result = {
                    rolls: result.rolls,
                    prizeWon: result.prizeWon,
                    matches: result.matches || []
                };
                
                // Small delay for dramatic effect, then show result
                setTimeout(() => {
                    Game.phase = 'result';
                    renderPhase();
                    loadPoolData();
                }, 1500);
            } else {
                showToast(result?.error || 'Transaction failed', 'error');
                Game.phase = 'wager';
                renderPhase();
            }
        } catch (e) {
            console.error('Play error:', e);
            showToast('Error: ' + e.message, 'error');
            Game.phase = 'wager';
            renderPhase();
        }
    });
}

// ============================================================================
// PHASE 4: PROCESSING (V2 - Brief animation while tx confirms)
// ============================================================================
function renderProcessing(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 processing-pulse">
            <div class="text-center mb-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-3xl text-amber-400 animate-bounce"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">🎰 Rolling<span class="waiting-dots"></span></h2>
                <p class="text-zinc-400 text-sm">Transaction processing...</p>
            </div>
            
            <!-- Animated Numbers -->
            <div class="flex justify-center gap-4 mb-6">
                ${tiersToShow.map((tier, idx) => `
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${tier.emoji} ${tier.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${tier.hex}50">
                            <span class="text-4xl font-black ${tier.textColor} slot-spin" id="spin-${idx}">?</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${tiersToShow.map((tier, idx) => {
                        const pick = isJackpot ? picks[0] : picks[idx];
                        return `
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${tier.textColor}">${pick}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <p class="text-xs text-zinc-500 mt-6 text-center">
                <i class="fa-solid fa-bolt text-emerald-400 mr-1"></i>
                V2: Instant resolution in progress...
            </p>
        </div>
    `;
    
    // Animate spinning numbers
    tiersToShow.forEach((tier, idx) => {
        const el = document.getElementById(`spin-${idx}`);
        if (!el) return;
        
        const spin = () => {
            el.textContent = Math.floor(Math.random() * tier.range) + 1;
        };
        
        setInterval(spin, 80);
    });
}

// ============================================================================
// PHASE 5: RESULT
// ============================================================================
function renderResult(container) {
    const result = Game.result;
    if (!result) return renderPhase();
    
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const rolls = result.rolls || [];
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;
    
    // Calculate matches
    const matches = picks.map((pick, i) => {
        const roll = rolls[i] !== undefined ? Number(rolls[i]) : null;
        return roll !== null && roll === pick;
    });
    const matchCount = matches.filter(m => m).length;
    const isWin = result.prizeWon > 0 || matchCount > 0;
    
    // Calculate display prize
    let displayPrize = result.prizeWon;
    if (!displayPrize && matchCount > 0) {
        displayPrize = 0;
        matches.forEach((hit, i) => {
            if (hit) {
                const tier = isJackpot ? TIERS[2] : TIERS[i];
                displayPrize += Game.wager * tier.multiplier;
            }
        });
    }
    
    container.innerHTML = `
        <div class="bg-gradient-to-br ${isWin ? 'from-emerald-900/30 to-green-900/10 border-emerald-500/30' : 'from-zinc-900 to-zinc-800/50 border-zinc-700/50'} border rounded-2xl p-6 relative overflow-hidden" id="result-container">
            
            <!-- Result Header -->
            <div class="text-center mb-6">
                ${isWin ? `
                    <div class="text-6xl mb-3">🎉</div>
                    <h2 class="text-3xl font-black text-emerald-400 mb-2">YOU WON!</h2>
                    <p class="text-4xl font-black text-white">${displayPrize.toLocaleString()} BKC</p>
                ` : `
                    <div class="text-6xl mb-3">😔</div>
                    <h2 class="text-2xl font-bold text-zinc-400 mb-2">No Match</h2>
                    <p class="text-zinc-500">Better luck next time!</p>
                `}
            </div>
            
            <!-- Results Grid -->
            <div class="grid ${isJackpot ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-6">
                ${tiersToShow.map((tier, idx) => {
                    const pick = isJackpot ? picks[0] : picks[idx];
                    const roll = rolls[idx];
                    const isMatch = matches[idx];
                    
                    return `
                        <div class="text-center p-4 rounded-xl ${isMatch ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-zinc-800/50 border border-zinc-700/50'}">
                            <p class="text-xs text-zinc-500 mb-2">${tier.emoji} ${tier.name}</p>
                            <div class="flex items-center justify-center gap-3">
                                <div class="text-center">
                                    <p class="text-[10px] text-zinc-600 mb-1">YOU</p>
                                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} flex items-center justify-center">
                                        <span class="text-xl font-black ${tier.textColor}">${pick}</span>
                                    </div>
                                </div>
                                <span class="text-2xl ${isMatch ? 'text-emerald-400' : 'text-red-400'}">${isMatch ? '=' : '≠'}</span>
                                <div class="text-center">
                                    <p class="text-[10px] text-zinc-600 mb-1">ROLL</p>
                                    <div class="w-12 h-12 rounded-lg ${isMatch ? 'bg-emerald-500/30 border-emerald-500' : 'bg-zinc-700/50 border-zinc-600'} border flex items-center justify-center ${isMatch ? 'match-pulse' : 'miss-shake'}">
                                        <span class="text-xl font-black ${isMatch ? 'text-emerald-400' : 'text-zinc-300'}">${roll}</span>
                                    </div>
                                </div>
                            </div>
                            ${isMatch ? `<p class="text-emerald-400 text-sm font-bold mt-2">+${tier.multiplier}x WIN!</p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- TX Link -->
            ${Game.txHash ? `
                <div class="text-center mb-4">
                    <a href="${EXPLORER_TX}${Game.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Transaction
                    </a>
                </div>
            ` : ''}
            
            <!-- Share Section (ALWAYS SHOW - win and lose) -->
            <div class="bg-gradient-to-r ${isWin ? 'from-amber-500/10 to-orange-500/10 border-amber-500/30' : 'from-zinc-800/50 to-zinc-700/30 border-zinc-600/30'} border rounded-xl p-4 mb-4">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full ${isWin ? 'bg-amber-500/20' : 'bg-zinc-700/50'} flex items-center justify-center">
                        <i class="fa-solid fa-gift ${isWin ? 'text-amber-400' : 'text-zinc-400'}"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${isWin ? 'Share Your Win!' : 'Share & Try Again!'}</p>
                        <p class="text-amber-400 text-xs font-medium">+${SHARE_POINTS} Airdrop Points</p>
                    </div>
                </div>
                <button id="btn-share" class="w-full py-3 ${isWin ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black' : 'bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600'} font-bold rounded-xl transition-all">
                    <i class="fa-solid fa-share-nodes mr-2"></i>${isWin ? 'Share Now' : 'Share Anyway'}
                </button>
            </div>
            
            <button id="btn-new-game" class="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                <i class="fa-solid fa-paw mr-2"></i>Play Again
            </button>
        </div>
    `;
    
    // Trigger animations
    if (isWin) {
        triggerConfetti();
        if (displayPrize > Game.wager * 10) {
            triggerCoinRain();
        }
    }
    
    // Event listeners
    document.getElementById('btn-new-game')?.addEventListener('click', () => { 
        Game.phase = 'select'; 
        Game.result = null;
        Game.txHash = null;
        Game.gameId = null;
        renderPhase(); 
        loadPoolData(); 
    });
    
    document.getElementById('btn-share')?.addEventListener('click', () => {
        showShareModal(isWin, displayPrize);
    });
}

// ============================================================================
// ANIMATIONS
// ============================================================================
function triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
    const shapes = ['●', '■', '★', '🐯', '🎉'];
    
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.cssText = `
            left: ${Math.random() * 100}%;
            color: ${colors[i % colors.length]};
            font-size: ${8 + Math.random() * 12}px;
            animation-delay: ${Math.random() * 2}s;
            animation-duration: ${2 + Math.random() * 2}s;
        `;
        c.textContent = shapes[i % shapes.length];
        container.appendChild(c);
    }
    
    setTimeout(() => container.remove(), 5000);
}

function triggerCoinRain() {
    const coins = ['🪙', '💰', '✨', '⭐', '🎉'];
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.textContent = coins[Math.floor(Math.random() * coins.length)];
            coin.style.left = `${Math.random() * 100}%`;
            coin.style.animationDelay = `${Math.random() * 0.5}s`;
            coin.style.animationDuration = `${2 + Math.random() * 2}s`;
            document.body.appendChild(coin);
            setTimeout(() => coin.remove(), 4000);
        }, i * 100);
    }
}

// ============================================================================
// SHARE MODAL
// ============================================================================
function showShareModal(isWin, prize) {
    const ui = MODAL_UI[currentLang];
    
    const getShareText = () => {
        const texts = SHARE_TEXTS[currentLang];
        return isWin ? texts.win(prize) : texts.lose;
    };
    
    const modalContent = `
        <div class="text-center">
            <img src="${TIGER_IMAGE}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${ui.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${ui.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentLang === 'pt' ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'} border" data-lang="pt">
                    <img src="${FLAG_IMAGES.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${currentLang === 'pt' ? 'text-amber-400' : 'text-zinc-400'}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentLang === 'en' ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'} border" data-lang="en">
                    <img src="${FLAG_IMAGES.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${currentLang === 'en' ? 'text-amber-400' : 'text-zinc-400'}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentLang === 'es' ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'} border" data-lang="es">
                    <img src="${FLAG_IMAGES.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
                    <span class="${currentLang === 'es' ? 'text-amber-400' : 'text-zinc-400'}">ES</span>
                </button>
            </div>
            
            <!-- Share Buttons -->
            <div class="grid grid-cols-5 gap-2 mb-4">
                <button id="share-twitter" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
                    <i class="fa-brands fa-x-twitter text-lg text-white mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Twitter</span>
                </button>
                <button id="share-telegram" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#0088cc]/20 border border-zinc-700 hover:border-[#0088cc]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-telegram text-lg text-[#0088cc] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Telegram</span>
                </button>
                <button id="share-whatsapp" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#25D366]/20 border border-zinc-700 hover:border-[#25D366]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-whatsapp text-lg text-[#25D366] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">WhatsApp</span>
                </button>
                <button id="share-instagram" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#E4405F]/20 border border-zinc-700 hover:border-[#E4405F]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-instagram text-lg text-[#E4405F] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Instagram</span>
                </button>
                <button id="share-copy" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
                    <i class="fa-solid fa-copy text-lg text-zinc-400 mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Copy</span>
                </button>
            </div>
            
            <button id="btn-close-share" class="text-zinc-500 hover:text-zinc-300 text-xs">${ui.later}</button>
        </div>
    `;
    
    openModal(modalContent, 'max-w-xs');
    
    // Language switcher
    const updateModalLanguage = (lang) => {
        currentLang = lang;
        const newUi = MODAL_UI[lang];
        
        const titleEl = document.getElementById('share-modal-title');
        const subtitleEl = document.getElementById('share-modal-subtitle');
        const laterEl = document.getElementById('btn-close-share');
        
        if (titleEl) titleEl.textContent = newUi.title;
        if (subtitleEl) subtitleEl.textContent = newUi.subtitle;
        if (laterEl) laterEl.textContent = newUi.later;
        
        // Update button styles with flag images
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const btnLang = btn.dataset.lang;
            const textSpan = btn.querySelector('span');
            if (btnLang === lang) {
                btn.className = 'lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border';
                if (textSpan) textSpan.className = 'text-amber-400';
            } else {
                btn.className = 'lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border';
                if (textSpan) textSpan.className = 'text-zinc-400';
            }
        });
    };
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => updateModalLanguage(btn.dataset.lang));
    });
    
    // Track share on server
    const trackShareOnServer = async (platform) => {
        if (!State.userAddress) return false;
        
        try {
            const response = await fetch('https://us-central1-backchain-backand.cloudfunctions.net/trackShare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: State.userAddress,
                    gameId: Game.gameId || Date.now(),
                    type: 'fortune',
                    platform
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(`🎉 +${data.pointsAwarded || SHARE_POINTS} Airdrop Points!`, 'success');
                return true;
            } else if (data.reason === 'already_shared') {
                console.log('Already shared this game');
                return false;
            }
            return false;
        } catch (e) {
            console.error('Share tracking error:', e);
            // Still count as success for UX
            showToast(`🎉 +${SHARE_POINTS} Airdrop Points!`, 'success');
            return true;
        }
    };
    
    const shareAndTrack = async (platform, url) => {
        await trackShareOnServer(platform);
        window.open(url, '_blank');
        closeModal();
    };
    
    // Twitter/X
    document.getElementById('share-twitter')?.addEventListener('click', () => {
        const text = getShareText();
        shareAndTrack('twitter', `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    });
    
    // Telegram - abre o grupo do Backcoin
    document.getElementById('share-telegram')?.addEventListener('click', () => {
        const text = getShareText();
        shareAndTrack('telegram', `https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(text)}`);
    });
    
    // WhatsApp
    document.getElementById('share-whatsapp')?.addEventListener('click', () => {
        const text = getShareText();
        shareAndTrack('whatsapp', `https://wa.me/?text=${encodeURIComponent(text)}`);
    });
    
    // Instagram - abre o perfil do Backcoin (não tem share direto)
    document.getElementById('share-instagram')?.addEventListener('click', async () => {
        const text = getShareText();
        try {
            await navigator.clipboard.writeText(text);
            showToast('📋 Text copied! Opening Instagram...', 'success');
            await trackShareOnServer('instagram');
        } catch {
            // Continue anyway
        }
        window.open('https://www.instagram.com/backcoin.bkc/', '_blank');
        closeModal();
    });
    
    // Copy
    document.getElementById('share-copy')?.addEventListener('click', async () => {
        const text = getShareText();
        try {
            await navigator.clipboard.writeText(text);
            showToast('📋 Copied!', 'success');
            await trackShareOnServer('copy');
        } catch {
            showToast('Copy failed', 'error');
        }
        closeModal();
    });
    
    document.getElementById('btn-close-share')?.addEventListener('click', closeModal);
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function getFortunePoolStatus() {
    const contract = State.fortunePoolContract || State.fortunePoolContractPublic;
    if (!contract) {
        console.log("No fortune contract available");
        return null;
    }

    try {
        // V2: Get all data including service fees and tiers
        const [prizePool, gameCount, serviceFee, fee1x, fee5x, tierCount] = await Promise.all([
            contract.prizePoolBalance().catch(() => 0n),
            contract.gameCounter().catch(() => 0),
            contract.serviceFee().catch(() => 0n),
            contract.getRequiredServiceFee(false).catch(() => 0n), // 1x mode
            contract.getRequiredServiceFee(true).catch(() => 0n),  // 5x mode
            contract.activeTierCount().catch(() => 3)
        ]);
        
        // Store service fees in Game state
        Game.serviceFee = serviceFee || 0n;
        Game.serviceFee1x = fee1x || 0n;
        Game.serviceFee5x = fee5x || 0n;
        
        // Try to get tier data
        try {
            const [ranges, multipliers] = await contract.getAllTiers();
            Game.tiersData = ranges.map((range, i) => ({
                range: Number(range),
                multiplier: Number(multipliers[i]) / 10000 // Convert from bips
            }));
            console.log("Tiers from contract:", Game.tiersData);
        } catch (e) {
            console.log("Using default tiers");
        }
        
        return {
            prizePool: prizePool || 0n,
            gameCounter: Number(gameCount) || 0,
            serviceFee: serviceFee || 0n,
            serviceFee1x: fee1x || 0n,
            serviceFee5x: fee5x || 0n,
            tierCount: Number(tierCount) || 3
        };
    } catch (e) {
        console.error("getFortunePoolStatus error:", e);
        return { prizePool: 0n, gameCounter: 0, serviceFee: 0n };
    }
}

async function loadPoolData() {
    try {
        const status = await getFortunePoolStatus();
        if (status) {
            const poolEl = document.getElementById('prize-pool');
            const gamesEl = document.getElementById('total-games');
            if (poolEl) poolEl.textContent = formatBigNumber(status.prizePool || 0n).toFixed(2) + ' BKC';
            if (gamesEl) gamesEl.textContent = (status.gameCounter || 0).toLocaleString();
        }
        
        const balanceEl = document.getElementById('user-balance');
        if (balanceEl) balanceEl.textContent = formatBigNumber(State.currentUserBalance || 0n).toFixed(2) + ' BKC';
        
        loadHistory();
    } catch (e) { 
        console.error('Pool error:', e); 
    }
}

async function loadHistory() {
    try {
        const endpoint = API_ENDPOINTS.fortuneGames || 'https://getfortunegames-4wvdcuoouq-uc.a.run.app';
        const url = State.userAddress ? `${endpoint}?player=${State.userAddress}&limit=15` : `${endpoint}?limit=15`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.games?.length > 0) {
            renderHistoryList(data.games);
            const wins = data.games.filter(g => g.isWin || (g.prizeWon && BigInt(g.prizeWon) > 0n)).length;
            const el = document.getElementById('win-rate');
            if (el) el.textContent = `🏆 ${wins}/${data.games.length} wins`;
        } else {
            const list = document.getElementById('history-list');
            if (list) list.innerHTML = `
                <div class="p-8 text-center">
                    <img src="${TIGER_IMAGE}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `;
        }
    } catch (e) { 
        console.error("loadHistory error:", e);
    }
}

function renderHistoryList(games) {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    list.innerHTML = games.map(game => {
        const isWin = game.isWin || (game.prizeWon && BigInt(game.prizeWon) > 0n);
        const prize = game.prizeWon ? formatBigNumber(BigInt(game.prizeWon)) : 0;
        const wager = game.wagerAmount ? formatBigNumber(BigInt(game.wagerAmount)) : 0;
        const isCumulative = game.isCumulative;
        const rolls = game.rolls || [];
        const guesses = game.guesses || [];
        
        const timeAgo = getTimeAgo(game.timestamp);
        const shortAddr = game.player ? `${game.player.slice(0,6)}...${game.player.slice(-4)}` : '???';
        const isMe = State.userAddress && game.player?.toLowerCase() === State.userAddress.toLowerCase();
        
        return `
            <div class="p-3 rounded-xl mb-2 ${isWin ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-zinc-800/30 border border-zinc-700/30'} transition-all hover:scale-[1.01]">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${isWin ? '🏆' : '🎲'}</span>
                        <span class="text-xs ${isMe ? 'text-amber-400 font-bold' : 'text-zinc-500'}">${isMe ? 'You' : shortAddr}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isCumulative ? 'bg-violet-500/20 text-violet-400' : 'bg-amber-500/20 text-amber-400'}">${isCumulative ? 'Combo' : 'Jackpot'}</span>
                    </div>
                    <span class="text-[10px] text-zinc-600">${timeAgo}</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">Bet: ${wager.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${isWin ? 'text-emerald-400 font-bold' : 'text-zinc-500'}">
                            ${isWin ? `+${prize.toFixed(0)} BKC` : 'No win'}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(isCumulative ? TIERS : [TIERS[2]]).map((tier, i) => {
                            const guess = guesses[i];
                            const roll = rolls[i];
                            const match = guess !== undefined && roll !== undefined && Number(guess) === Number(roll);
                            return `
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${match ? 'bg-emerald-500/30 text-emerald-400' : 'bg-zinc-700/50 text-zinc-500'}">
                                    ${roll ?? '?'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    
    const now = Date.now();
    const time = typeof timestamp === 'number' ? timestamp * 1000 : new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// ============================================================================
// EXPORTS
// ============================================================================
export const FortunePoolPage = { render, cleanup };
export default { render, cleanup };