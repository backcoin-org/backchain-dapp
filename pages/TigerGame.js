// pages/TigerGame.js - Versão V5: Correção da Renderização Silenciosa e Inicialização
// ARQUIVO AJUSTADO PARA 4 PISCINAS E TRADUZIDO (INTERNACIONAL)

import { State } from '../state.js';
import { loadUserData } from '../modules/data.js';
import { formatBigNumber, formatAddress, formatPStake } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { safeContractCall } from '../modules/data.js';

const ethers = window.ethers;

// ============================================
// I. GAMIFICATION & GAME STATE (Aprimorado)
// ============================================

const gameState = {
    currentLevel: 1,
    currentXP: 0,
    xpPerLevel: 1000,
    totalSpins: 0,
    achievements: [
        { id: 'first-spin', name: 'The Cub', desc: 'Complete your first 10 spins.', unlocked: false, requirement: 10 },
        { id: 'hundred-spins', name: 'The Hunter', desc: 'Complete 100 total spins.', unlocked: false, requirement: 100 },
        { id: 'millionaire', name: 'The Millionaire', desc: 'Win a prize over 1,000,000 $BKC.', unlocked: false, requirement: 1000000 },
        { id: 'multiplier-master', name: 'Multiplier Master', desc: 'Hit the x1000 multiplier.', unlocked: false, requirement: 1000 },
        { id: 'daily-fortune', name: 'Daily Fortune', desc: 'Claim 7 consecutive daily bonuses.', unlocked: false, requirement: 7 },
        { id: 'den-founder', name: 'Den Founder', desc: 'Play with the maximum wager.', unlocked: false, requirement: 'max' },
        // Novas conquistas ligadas às piscinas
        { id: 'x10-hunter', name: 'x10 Hunter', desc: 'Win from the x10 pool 5 times.', unlocked: false, requirement: 5, count: 0 },
        { id: 'x100-predator', name: 'x100 Predator', desc: 'Win from the x100 pool 3 times.', unlocked: false, requirement: 3, count: 0 },
        { id: 'x1000-king', name: 'x1000 King', desc: 'Win from the x1000 pool once.', unlocked: false, requirement: 1, count: 0 }
    ],
    dailyStreak: 0, // Contador de streak diário
    lastDailyClaim: null, // Timestamp do último claim (use localStorage para persistir)
    poolBalances: {}, 
    isSpinning: false,
    lastWin: 0,
    // NOVO: Estado de Giros Múltiplos
    currentSpinRound: 0,
    maxSpinRounds: 4, // (4 Piscinas)
};

// Persistir streak no localStorage (para produção, considere backend ou wallet)
function loadGameState() {
    const savedStreak = localStorage.getItem('dailyStreak');
    const savedLastClaim = localStorage.getItem('lastDailyClaim');
    if (savedStreak) gameState.dailyStreak = parseInt(savedStreak);
    if (savedLastClaim) gameState.lastDailyClaim = savedLastClaim;
}
function saveGameState() {
    localStorage.setItem('dailyStreak', gameState.dailyStreak);
    localStorage.setItem('lastDailyClaim', gameState.lastDailyClaim);
}
loadGameState(); // Carregar ao iniciar

// ============================================
// II. CONFIGURAÇÕES E CONSTANTES
// ============================================

const PRIZE_POOLS_CONFIG = [
    { poolId: 3, multiplier: 4, chance: '1 in 4', style: 'bg-blue-800 border-blue-500/50' }, // (Piscina de 25% chance)
    { poolId: 0, multiplier: 10, chance: '1 in 10', style: 'bg-yellow-800 border-yellow-500/50' },
    { poolId: 1, multiplier: 100, chance: '1 in 100', style: 'bg-orange-800 border-orange-500/50' },
    { poolId: 2, multiplier: 1000, chance: '1 in 1000', style: 'bg-red-800 border-red-500/50' },
];

// ATENÇÃO: Corrigido o caminho/extensão da imagem e do áudio para corresponder ao padrão esperado pelo navegador (geralmente .png e .mp3).
// Se seus arquivos NÃO têm extensão, você deve RENOMEÁ-LOS no disco para bkc_logo_3d.png, spin.mp3 e win.mp3
const WINNING_SYMBOL_HTML = '<div class="bkc-logo-symbol"><img src="./assets/bkc_logo_3d.png" alt="BKC" style="width: 70%; height: 70%; object-fit: contain;"></div>';
const FALLBACK_SYMBOLS = ['🍋', '🍒', '💰', '💎', '7️⃣', '🔔', '🐯', WINNING_SYMBOL_HTML]; // Adicionado 🍋 para a piscina x4
const REEL_COUNT = 3;
const SYMBOL_HEIGHT_PX = 120; 
const MAX_PRIZE_POOL_BIPS = 8000; 

// Opcional: Áudio para realismo (adicione assets spin.mp3 e win.mp3 no diretório)
const spinSound = new Audio('./assets/spin.mp3');
const winSound = new Audio('./assets/win.mp3');

// ============================================
// III. LÓGICA DE CONTRATO E CÁLCULO (Mantida)
// ============================================

async function loadPoolBalances() {
    if (!State.actionsManagerContract) return;
    try {
        for (const pool of PRIZE_POOLS_CONFIG) {
            const poolInfo = await safeContractCall(
                State.actionsManagerContract, 
                'prizePools', 
                [pool.poolId], 
                [0n, 0n, 0n, 0n]
            );
            gameState.poolBalances[pool.multiplier] = poolInfo[2]; 
        }
        TigerGamePage.updatePoolDisplay(); 
        TigerGamePage.updatePayoutDisplay(); 
    } catch (e) {
        console.error("Failed to load pool balances:", e);
    }
}

function calculatePrizePotentials(amount) {
    let amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
        amountFloat = 0; 
    }
    
    const results = {};

    for (const pool of PRIZE_POOLS_CONFIG) {
        const multiplier = pool.multiplier;
        const poolBalance = gameState.poolBalances[multiplier] || 0n;
        const poolBalanceFloat = formatBigNumber(poolBalance);
        
        const maxPrizeMultiplier = amountFloat * multiplier; 
        const maxPrizeSustainability = poolBalanceFloat * (MAX_PRIZE_POOL_BIPS / 10000); 
        const potentialPrize = Math.min(maxPrizeMultiplier, maxPrizeSustainability);

        results[multiplier] = potentialPrize;
    }
    return results;
}

async function processGameResult(receipt, amountWagered) {
    const abi = ["event GamePlayed(address indexed user, uint256 amountWagered, uint256 totalPrizeWon)"];
    const iface = new ethers.Interface(abi);
    
    let totalPrizeWon = 0n;
    const wonMultipliers = [];

    for (const log of receipt.logs) {
        try {
            const parsedLog = iface.parseLog(log);
            if (parsedLog && parsedLog.name === "GamePlayed") {
                totalPrizeWon = parsedLog.args.totalPrizeWon;

                const prizeFloat = formatBigNumber(totalPrizeWon);
                const wagerFloat = formatBigNumber(amountWagered);
                
                if (prizeFloat > 0) {
                    const calculatedMultiplier = prizeFloat / wagerFloat;
                    // Ajustado para incluir o multiplicador x4
                    if (calculatedMultiplier >= 3.8) wonMultipliers.push(4); // (Tolerância)
                    if (calculatedMultiplier >= 9.5) wonMultipliers.push(10);
                    if (calculatedMultiplier >= 95) wonMultipliers.push(100);
                    if (calculatedMultiplier >= 950) wonMultipliers.push(1000);
                }
                
                break; 
            }
        } catch (e) {
             // Ignora logs
        }
    }

    wonMultipliers.sort((a, b) => a - b);
    const highestMultiplier = wonMultipliers.length > 0 ? wonMultipliers[wonMultipliers.length - 1] : 0;
    
    return { totalPrizeWon, wonMultipliers, highestMultiplier };
}


// ============================================
// IV. ANIMAÇÕES DE SLOT (Aprimoradas para Realismo)
// ============================================

function getWinningSymbol(multiplier) {
    if (multiplier === 4) return '🍋'; // <-- Símbolo para x4
    if (multiplier === 10) return '🍒'; 
    if (multiplier === 100) return '💰';
    if (multiplier === 1000) return WINNING_SYMBOL_HTML;
    return FALLBACK_SYMBOLS[Math.floor(Math.random() * FALLBACK_SYMBOLS.length)];
}

function updateSpinRoundDisplay() {
    const el = document.getElementById('spinRoundDisplay');
    if (el) {
        el.textContent = `Spin: ${gameState.currentSpinRound} / ${gameState.maxSpinRounds}`;
    }
}

function startSlotAnimation(isFinalSpin) {
    const reelsContainer = document.getElementById('reelsContainer');
    const resultDisplay = document.getElementById('resultDisplay');
    
    // NOVO: Limpa a roleta apenas no primeiro spin
    if (gameState.currentSpinRound === 1) {
        reelsContainer.innerHTML = ''; 
    }
    
    resultDisplay.classList.remove('win');
    resultDisplay.innerHTML = `<h3>SPINNING... (${gameState.currentSpinRound}/${gameState.maxSpinRounds})</h3>`;
    document.querySelector('.winning-line').classList.remove('active');
    document.querySelectorAll('.reel').forEach(reel => reel.classList.remove('win-highlight'));
    
    // Novo: Se a roleta ainda não existe, crie-a.
    if (reelsContainer.children.length === 0) {
        for (let i = 0; i < REEL_COUNT; i++) {
            const reel = document.createElement('div');
            reel.id = `reel-${i}`;
            reel.classList.add('reel'); 
            
            let symbolsHTML = '';
            // Cria um loop longo de símbolos para simular a rolagem contínua (aumentado para 100 para mais realismo)
            for (let j = 0; j < 100; j++) { 
                const symbolIndex = Math.floor(Math.random() * FALLBACK_SYMBOLS.length);
                symbolsHTML += `<div class="symbol">${FALLBACK_SYMBOLS[symbolIndex]}</div>`;
            }
            reel.innerHTML = symbolsHTML;
            reelsContainer.appendChild(reel);
        }
    }

    // Inicia a animação (gira o carretel existente) com variação na velocidade para realismo
    for (let i = 0; i < REEL_COUNT; i++) {
        const reel = document.getElementById(`reel-${i}`);
        if (reel) {
             reel.classList.add('spinning');
             reel.style.transition = 'none';
             // Reseta o transform para o CSS poder aplicar a animação reel-roll
             reel.style.transform = 'translateY(0)'; 
             // Variação na velocidade
             reel.style.animation = `reel-roll ${Math.random() * 0.5 + 2}s linear infinite`;
        }
    }
    
    updateSpinRoundDisplay();
    // Opcional: Tocar som de spin
    // spinSound.play();
}

async function stopSlotAnimation(prizeWon) {
    const reels = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];
    
    let targetSymbol = FALLBACK_SYMBOLS[0]; 
    if (prizeWon.highestMultiplier > 0) {
        targetSymbol = getWinningSymbol(prizeWon.highestMultiplier);
    }
    
    const stopOffset = 55; // Posição alvo na coluna (quanto maior, mais ele gira antes de parar)
    const winSymbols = [targetSymbol, targetSymbol, targetSymbol];

    for (let i = 0; i < REEL_COUNT; i++) {
        const reel = reels[i];
        if (!reel) continue;
        
        reel.classList.remove('spinning'); 
        reel.style.transition = 'none';
        
        // 1. Reconstroi o HTML do carretel com a roleta posicionada
        let symbolsHTML = '';
        const symbolsToPrecede = 5; // Número de símbolos visíveis antes do ponto de parada
        
        // Símbolos aleatórios antes
        for(let j = 0; j < stopOffset; j++) { 
            const symbolIndex = Math.floor(Math.random() * FALLBACK_SYMBOLS.length);
            symbolsHTML += `<div class="symbol">${FALLBACK_SYMBOLS[symbolIndex]}</div>`;
        }
        
        // Símbolo de parada (o alvo - ex: logo BKC)
        symbolsHTML += `<div class="symbol">${winSymbols[i]}</div>`;
        
        // Símbolos aleatórios depois
        for(let j = 0; j < symbolsToPrecede; j++) { 
            const symbolIndex = Math.floor(Math.random() * FALLBACK_SYMBOLS.length);
            symbolsHTML += `<div class="symbol">${FALLBACK_SYMBOLS[symbolIndex]}</div>`;
        }
        
        // Aplica o novo HTML
        reel.innerHTML = symbolsHTML;

        // Calcula a posição final (o símbolo alvo ficará no centro)
        // O centro é a altura do símbolo (SYMBOL_HEIGHT_PX) * offset (55)
        const totalHeightOffset = SYMBOL_HEIGHT_PX * (stopOffset); 
        
        // 2. Aplica a transição suave para a parada com easing mais realista (overshoot)
        reel.style.transition = `transform ${3 + i * 0.5}s cubic-bezier(0.33, 1, 0.68, 1)`; 
        reel.style.transform = `translateY(-${totalHeightOffset}px)`;
        
        // Efeito cascata (delay maior para realismo)
        await new Promise(resolve => setTimeout(resolve, 1000 + (i * 500))); 
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); 
}

function stopSlotAnimationOnError() {
    const reels = document.querySelectorAll('.reel');
    reels.forEach(reel => {
        reel.classList.remove('spinning');
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0)';
        reel.innerHTML = `<div class="symbol">❌</div>`;
        reel.classList.add('win-highlight'); 
    });
    
    const resultDisplay = document.getElementById('resultDisplay');
    if (resultDisplay) {
        resultDisplay.classList.remove('win');
        resultDisplay.classList.add('win-highlight');
        resultDisplay.innerHTML = '<h3>⚠️ TRANSACTION FAILED!</h3>';
    }
}


// ============================================
// V. FUNÇÃO PRINCIPAL DE JOGO (Contrato e Sequência de Giros)
// ============================================

async function startFourSpinSequence(prizeWon) {
    let totalPrizeWonFloat = formatBigNumber(prizeWon.totalPrizeWon);
    const wagerInput = document.getElementById('wagerInput');
    const wager = parseFloat(wagerInput?.value) || 0;
    const potentials = calculatePrizePotentials(wager);
    
    const poolTargets = [4, 10, 100, 1000]; // Associar Spin 1: x4, Spin 2: x10, Spin 3: x100, Spin 4: x1000
    
    for (let i = 1; i <= gameState.maxSpinRounds; i++) {
        gameState.currentSpinRound = i;
        const targetMultiplier = poolTargets[i-1];
        
        // Atualiza display com piscina alvo e prêmio potencial
        const resultDisplay = document.getElementById('resultDisplay');
        const potentialPrize = potentials[targetMultiplier] !== undefined ? potentials[targetMultiplier] : 0;
        resultDisplay.innerHTML = `<h3>SPINNING for x${targetMultiplier} Pool... (Potential: ${potentialPrize.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC)</h3>`;
        
        // Determina se este é o spin de vitória
        const isFinalWinningSpin = (i === gameState.maxSpinRounds && prizeWon.highestMultiplier > 0);
        
        const currentSpinResult = isFinalWinningSpin ? prizeWon : { highestMultiplier: 0 };
        
        startSlotAnimation(); // Inicia o giro
        await stopSlotAnimation(currentSpinResult); // Para o giro

        // Feedback Visual
        const winningLine = document.querySelector('.winning-line');
        const reels = document.querySelectorAll('.reel');
        
        resultDisplay.classList.remove('win');
        winningLine.classList.remove('active');
        reels.forEach(reel => reel.classList.remove('win-highlight', 'shake'));
        
        if (isFinalWinningSpin) {
            resultDisplay.classList.add('win');
            resultDisplay.innerHTML = `<h3>🎉 FINAL ROAR! x${prizeWon.highestMultiplier} MULTIPLIER! Won ${totalPrizeWonFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC!</h3>`;
            winningLine.classList.add('active');
            reels.forEach(reel => {
                reel.classList.add('win-highlight', 'shake'); // Adiciona shake para realismo
            });
            
            // Opcional: Tocar som de vitória
            // winSound.play();
            
            // Pausa um pouco para a celebração
            await new Promise(resolve => setTimeout(resolve, 1500));
            
        } else if (i < gameState.maxSpinRounds) {
            // <-- AJUSTE TRADUÇÃO
            resultDisplay.innerHTML = `<h3>Miss on x${targetMultiplier}! Prepare for Spin ${i + 1}.</h3>`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Pós-Sequência (Feedback Final e Atualização do Estado)
    gameState.currentSpinRound = 0;
    
    // Feedback de Toast e Gamificação (APÓS A ANIMAÇÃO)
    if (prizeWon.totalPrizeWon > 0n) {
        showToast(`🎉 BIG WIN! You won ${totalPrizeWonFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC!`, 'success');
        TigerGamePage.checkAchievements(totalPrizeWonFloat, prizeWon.highestMultiplier);
    } else {
        showToast('No win this round. Try again!', 'info');
    }
    
    // Atualiza estado final
    gameState.totalSpins++;
    TigerGamePage.addXP(100);
    TigerGamePage.checkDailyStreak();
    await loadUserData(); 
    await loadPoolBalances(); 
}


async function executeSpinGame() {
    if (gameState.isSpinning) return;
    if (!State.isConnected) {
        showToast("Connect wallet first.", "error");
        return;
    }

    const wagerInput = document.getElementById('wagerInput');
    const spinButton = document.getElementById('spinButton');
    const wager = parseFloat(wagerInput?.value) || 0;

    if (wager <= 0 || isNaN(wager)) {
        showToast("Please enter a valid wager amount.", "error");
        return;
    }
    
    const amountWei = ethers.parseEther(wager.toString());
    if (amountWei > State.currentUserBalance) {
        showToast("Insufficient BKC balance for this bet.", "error");
        return;
    }

    gameState.isSpinning = true;
    if (spinButton) {
        spinButton.disabled = true;
        spinButton.innerHTML = '<div class="loader inline-block"></div> TIGER IS ROLLING...';
    }

    // A chamada de animação inicial será feita dentro da sequência
    
    try {
        // 1. Verificação de pStake (Mantido)
        const [ignoredFee, pStakeReq] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            ["TIGER_GAME_SERVICE"], 
            [0n, 0n]
        );
        if (State.userTotalPStake < pStakeReq) {
            throw new Error(`PStake requirement failed validation. Required: ${formatPStake(pStakeReq)}`);
        }
        
        // 2. Aprovação (Mantido)
        showToast(`Approving ${wager.toFixed(2)} $BKC for the game...`, "info");
        const approveTx = await State.bkcTokenContract.approve(addresses.actionsManager, amountWei);
        await approveTx.wait();
        showToast('Approval successful! Submitting bet...', "success");
        
        // 3. Executa a função play
        const boosterId = State.userBoosterId || 0n;
        const playTx = await State.actionsManagerContract.play(amountWei, boosterId);
        const receipt = await playTx.wait();
        
        // 4. Processa o resultado real do contrato
        const prizeWon = await processGameResult(receipt, amountWei);
        
        // 5. INICIA A NOVA SEQUÊNCIA DE 4 GIROS
        await startFourSpinSequence(prizeWon); 

    } catch (error) {
        console.error("Game error:", error);
        let errorMessage = error.reason || error.message || 'Transaction reverted.';
        if (errorMessage.includes("pStake requirement failed")) {
            errorMessage = "Insufficient pStake requirement. Delegate more BKC!";
        } else if (errorMessage.includes("transfer amount exceeds balance")) {
            errorMessage = "Insufficient BKC balance.";
        }
        showToast(`Game Failed: ${errorMessage}`, "error");
        
        stopSlotAnimationOnError();
    } finally {
        gameState.isSpinning = false;
        if (spinButton) {
            spinButton.disabled = false;
            spinButton.innerHTML = 'SPIN THE REELS';
        }
        TigerGamePage.updateUIState();
        TigerGamePage.updatePayoutDisplay(); 
    }
}


// ============================================
// VI. PAGE COMPONENT EXPORT (Com UI Aprimorada)
// ============================================

export const TigerGamePage = {
    
    // CORREÇÃO: Função render modificada para atribuir innerHTML E chamar initializeEventListeners.
    render(isActive) {
        if (!isActive) return;

        const pageContainer = document.getElementById('actions');
        if (!pageContainer) {
            console.error("Page container 'actions' not found.");
            return;
        }

        // 1. CÓDIGO HTML (ajustado)
        
        // <-- AJUSTE TRADUÇÃO
        const prizePotentialsHTML = PRIZE_POOLS_CONFIG.map(pool => `
            <div class="info-row">
                <span class="info-label">x${pool.multiplier} Potential (Max)</span>
                <span class="info-value text-amber-400" id="potentialPrize-${pool.multiplier}">-- $BKC</span>
            </div>
        `).join('');
        
        const htmlContent = `
            <div class="tiger-game-wrapper">
                <header class="tiger-header">
                    <div class="header-top">
                        <h1 class="game-title">🐯 THE TIGER'S DEN</h1>
                        <div class="legacy-badge">
                            <span class="legacy-icon">🐾</span>
                            <span class="legacy-level">Lvl <span id="currentLevel">${gameState.currentLevel}</span></span>
                        </div>
                    </div>
                    
                    <div class="legacy-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <span class="progress-text" id="progressText">${gameState.currentXP} / ${gameState.xpPerLevel} XP</span>
                    </div>

                    <div class="pools-info">
                        <div class="pool-item" title="x4 Pool: 1/4 chance, up to 4x wager">
                            <span class="pool-label">x4 Liquidity</span>
                            <span class="pool-value" id="pool4">0.00</span>
                        </div>
                        <div class="pool-item" title="x10 Pool: 1/10 chance, up to 10x wager">
                            <span class="pool-label">x10 Liquidity</span>
                            <span class="pool-value" id="pool10">0.00</span>
                        </div>
                        <div class="pool-item" title="x100 Pool: 1/100 chance, up to 100x wager">
                            <span class="pool-label">x100 Liquidity</span>
                            <span class="pool-value" id="pool100">0.00</span>
                        </div>
                        <div class="pool-item" title="x1000 Pool: 1/1000 chance, up to 1000x wager">
                            <span class="pool-label">x1000 Liquidity</span>
                            <span class="pool-value" id="pool1000">0.00</span>
                        </div>
                    </div>
                </header>

                <section class="tiger-game-area">
                    <div class="reel-frame">
                        <div class="reels-container" id="reelsContainer">
                            <div class="reel" id="reel-0"><div class="symbol">🐯</div></div>
                            <div class="reel" id="reel-1"><div class="symbol">💎</div></div>
                            <div class="reel" id="reel-2"><div class="symbol">💰</div></div>
                        </div>
                        <div class="winning-line"></div>
                    </div>

                    <div class="result-display" id="resultDisplay">
                        <h3><span id="spinRoundDisplay">Spin: 0 / 4</span> - GOOD LUCK</h3>
                    </div>
                </section>

                <section class="tiger-control-panel">
                    <div class="wager-section">
                        <label for="wagerInput" class="control-label">WAGER AMOUNT</label>
                        <div class="wager-input-group">
                            <input type="number" id="wagerInput" class="wager-input" placeholder="0.00" min="0.01" step="any">
                            <span class="currency">$BKC</span>
                        </div>

                        <div class="quick-bets">
                            <button class="quick-bet-btn" data-action="add" data-value="1000">+1K</button>
                            <button class="quick-bet-btn" data-action="add" data-value="100">+100</button>
                            <button class="quick-bet-btn" data-action="add" data-value="10">+10</button>
                            <button class="quick-bet-btn" data-action="add" data-value="1">+1</button>
                            <button class="quick-bet-btn" data-action="add" data-value="0.1">+0.1</button>
                            <button class="quick-bet-btn" data-action="add" data-value="0.01">+0.01</button>
                            <button class="quick-bet-btn reset-btn" data-action="reset">RESET</button>
                        </div>
                    </div>

                    <div class="payout-info">
                        <p class="control-label mb-2">MAX PRIZE POTENTIALS</p>
                        ${prizePotentialsHTML}
                        <div class="info-row mt-3 pt-2 border-t border-zinc-700">
                            <span class="info-label">PSTAKE STATUS</span>
                            <span class="info-value" id="pstakeStatus">
                                <span class="status-icon">...</span> Checking
                            </span>
                        </div>
                    </div>
                </section>

                <section class="tiger-action-bar">
                    <button class="spin-button" id="spinButton">SPIN THE REELS</button>
                    
                    <div class="secondary-actions">
                        <button class="icon-button" id="achievementsBtn" title="Achievements">
                            🏆
                            <span class="notification-badge" id="achievementBadge" style="display: none;">!</span>
                        </button>
                        <button class="icon-button" id="rulesBtn" title="Game Rules">❓</button>
                    </div>
                </section>

                <div class="modal" id="achievementsModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>🏆 DEN ACHIEVEMENTS</h2>
                            <button class="modal-close" onclick="document.getElementById('achievementsModal').classList.remove('active')">✕</button>
                        </div>
                        <div class="modal-body" id="achievementsBody"></div>
                    </div>
                </div>

                <div class="modal" id="rulesModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>📋 GAME RULES</h2>
                            <button class="modal-close" onclick="document.getElementById('rulesModal').classList.remove('active')">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="rules-content">
                                <h3>How to Play</h3>
                                <p>Enter your wager amount and click "SPIN THE REELS" to begin. The game will spin three reels with various symbols. Match symbols to win prizes based on the multiplier pools.</p>
                                
                                <h3>Multiplier Pools</h3>
                                <p><strong>x4 Pool:</strong> 1 in 4 chance (25%). Win up to 4x your wager (capped at 80% pool liquidity). Symbol: 🍋 (Lemon)</p>
                                <p><strong>x10 Pool:</strong> 1 in 10 chance. Win up to 10x your wager (capped at 80% pool liquidity). Symbol: 🍒 (Cherry)</p>
                                <p><strong>x100 Pool:</strong> 1 in 100 chance. Win up to 100x your wager (capped at 80% pool liquidity). Symbol: 💰 (Coins)</p>
                                <p><strong>x1000 Pool:</strong> 1 in 1000 chance. Win up to 1000x your wager (capped at 80% pool liquidity). Symbol: $BKC (Logo)</p>
                                <p><strong>Pool Mechanics:</strong> Each spin sequence targets pools progressively: Spin 1 aims for x4, Spin 2 for x10, Spin 3 for x100, Spin 4 for x1000. Prizes are calculated based on your wager and pool liquidity.</p>
                                
                                <h3>Tiger's Legacy</h3>
                                <p>Every spin earns XP. Level up to unlock rewards and boosters!</p>
                                
                                <h3>Important Notes</h3>
                                <p>Maximum payout is capped at 80% of the liquidity pool to ensure sustainability. You must have sufficient pStake to play.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal" id="levelUpModal">
                    <div class="modal-content level-up-content">
                        <div class="level-up-header">
                            <h2>🎉 LEGACY LEVEL UP!</h2>
                        </div>
                        <div class="level-up-body">
                            <p>You have reached <strong>Level <span id="newLevelNumber">2</span></strong>!</p>
                            <p>Claim your reward of <span class="reward-amount">+${gameState.currentLevel * 5} $BKC</span> and a <strong>1-Hour Spin Booster</strong>.</p>
                            <button class="btn-claim" onclick="document.getElementById('levelUpModal').classList.remove('active')">CLAIM REWARD</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 2. FORÇA A INJEÇÃO DE HTML
        if (pageContainer.innerHTML.trim() === '') {
             pageContainer.innerHTML = htmlContent;

             // 3. CHAMA AS FUNÇÕES DE INICIALIZAÇÃO APÓS A INJEÇÃO DO HTML
             this.initializeEventListeners();
        }
        
        // 4. CHAMA AS FUNÇÕES DE ATUALIZAÇÃO DE DADOS SEMPRE QUE A PÁGINA FOR NAVEGADA
        this.loadPoolBalances();
        this.updateUIState();
    },

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        const wagerInput = document.getElementById('wagerInput');
        const achievementsBtn = document.getElementById('achievementsBtn');
        const rulesBtn = document.getElementById('rulesBtn');

        if (wagerInput) {
            wagerInput.addEventListener('input', () => this.updatePayoutDisplay());
        }

        document.querySelectorAll('.quick-bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDecimalBet(e.currentTarget));
        });

        if (spinButton) {
            spinButton.addEventListener('click', executeSpinGame); 
        }

        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.showAchievements());
        }
        if (rulesBtn) {
            rulesBtn.addEventListener('click', () => this.showRules());
        }

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        this.updatePayoutDisplay();
    },

    handleDecimalBet(btnElement) {
        const wagerInput = document.getElementById('wagerInput');
        if (!wagerInput) return;

        const action = btnElement.dataset.action;
        const value = parseFloat(btnElement.dataset.value || 0);
        let currentValue = parseFloat(wagerInput.value) || 0;

        if (action === 'reset') {
            currentValue = 0;
        } else if (action === 'add') {
            currentValue = Number((currentValue + value).toFixed(2)); 
        }

        wagerInput.value = currentValue > 0 ? currentValue : '';
        this.updatePayoutDisplay();
    },
    
    loadPoolBalances, 

    updatePoolDisplay() {
        const pool4 = document.getElementById('pool4');
        const pool10 = document.getElementById('pool10');
        const pool100 = document.getElementById('pool100');
        const pool1000 = document.getElementById('pool1000');

        if (pool4) pool4.textContent = formatBigNumber(gameState.poolBalances[4] || 0n).toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (pool10) pool10.textContent = formatBigNumber(gameState.poolBalances[10] || 0n).toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (pool100) pool100.textContent = formatBigNumber(gameState.poolBalances[100] || 0n).toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (pool1000) pool1000.textContent = formatBigNumber(gameState.poolBalances[1000] || 0n).toLocaleString('en-US', { maximumFractionDigits: 2 });
    },
    
    async checkPStakeStatus() {
        const pstakeStatusEl = document.getElementById('pstakeStatus');
        const spinButton = document.getElementById('spinButton');
        if (!pstakeStatusEl || !State.ecosystemManagerContract) return;

        if (!State.isConnected) {
            pstakeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Connect Wallet';
            return;
        }
        
        pstakeStatusEl.innerHTML = '<span class="status-icon">...</span> Checking';
        
        try {
            const [ignoredFee, pStakeReq] = await safeContractCall( 
                State.ecosystemManagerContract, 
                'getServiceRequirements', 
                ["TIGER_GAME_SERVICE"], 
                [0n, 0n]
            );
            
            const meetsPStake = State.userTotalPStake >= pStakeReq;
            
            if (meetsPStake) {
                pstakeStatusEl.innerHTML = '<span class="status-icon">✅</span> Requirement Met';
                pstakeStatusEl.classList.remove('text-red-400');
                pstakeStatusEl.classList.add('text-green-400');
                if (spinButton && !gameState.isSpinning) spinButton.disabled = false;
            } else {
                const reqFormatted = formatPStake(pStakeReq);
                pstakeStatusEl.innerHTML = `<span class="status-icon error">❌</span> Min ${reqFormatted} pStake Required`;
                pstakeStatusEl.classList.remove('text-green-400');
                pstakeStatusEl.classList.add('text-red-400');
                if (spinButton) spinButton.disabled = true;
            }
        } catch (e) {
            pstakeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Error Check';
            if (spinButton) spinButton.disabled = true;
        }
    },

    updatePayoutDisplay() {
        const wagerInput = document.getElementById('wagerInput');
        const wager = parseFloat(wagerInput?.value) || 0;

        const potentials = calculatePrizePotentials(wager);
        
        PRIZE_POOLS_CONFIG.forEach(pool => {
            const el = document.getElementById(`potentialPrize-${pool.multiplier}`);
            if (el) {
                const prize = potentials[pool.multiplier] || 0;
                el.textContent = `${prize.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC`;
                if (wager === 0 || isNaN(wager)) {
                     el.classList.remove('text-amber-400');
                     el.classList.add('text-zinc-500');
                } else {
                     el.classList.remove('text-zinc-500');
                     el.classList.add('text-amber-400');
                }
            }
        });
    },

    addXP(amount) {
        gameState.currentXP += amount;
        while (gameState.currentXP >= gameState.xpPerLevel) { this.levelUp(); }
        this.updateProgressBar();
    },

    levelUp() {
        gameState.currentLevel++;
        const levelUpModal = document.getElementById('levelUpModal');
        if (levelUpModal) {
            document.getElementById('newLevelNumber').textContent = gameState.currentLevel;
            levelUpModal.classList.add('active');
        }
        showToast(`🎉 LEGACY LEVEL UP! You reached Level ${gameState.currentLevel}!`, "success");
        // Recompensa escalável (ex: integrar com contrato para BKC real)
    },

    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const currentLevelSpan = document.getElementById('currentLevel');

        if (progressFill) {
            const percentage = (gameState.currentXP / gameState.xpPerLevel) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${gameState.currentXP} / ${gameState.xpPerLevel} XP`;
        }
        if (currentLevelSpan) {
            currentLevelSpan.textContent = gameState.currentLevel;
        }
    },

    checkAchievements(prizeWon, multiplier) {
        gameState.achievements.forEach(achievement => {
            if (achievement.unlocked) return;
            let shouldUnlock = false;
            if (achievement.id === 'first-spin' && gameState.totalSpins >= 10) { shouldUnlock = true; } 
            else if (achievement.id === 'hundred-spins' && gameState.totalSpins >= 100) { shouldUnlock = true; } 
            else if (achievement.id === 'millionaire' && prizeWon >= 1000000) { shouldUnlock = true; } 
            else if (achievement.id === 'multiplier-master' && multiplier === 1000) { shouldUnlock = true; }
            else if (achievement.id === 'x10-hunter') {
                if (multiplier === 10) achievement.count++;
                if (achievement.count >= achievement.requirement) shouldUnlock = true;
            }
            else if (achievement.id === 'x100-predator') {
                if (multiplier === 100) achievement.count++;
                if (achievement.count >= achievement.requirement) shouldUnlock = true;
            }
            else if (achievement.id === 'x1000-king') {
                if (multiplier === 1000) achievement.count++;
                if (achievement.count >= achievement.requirement) shouldUnlock = true;
            }
            if (shouldUnlock) { this.unlockAchievement(achievement); }
        });
    },

    checkDailyStreak() {
        const today = new Date().toDateString();
        if (gameState.lastDailyClaim !== today) {
            gameState.dailyStreak++;
            gameState.lastDailyClaim = today;
            saveGameState();
            const dailyAchievement = gameState.achievements.find(a => a.id === 'daily-fortune');
            if (gameState.dailyStreak >= dailyAchievement.requirement) {
                this.unlockAchievement(dailyAchievement);
                showToast('🎉 7-Day Streak! Claim your bonus: +1 Free Spin!', 'success');
                // Integre com contrato para bônus real, se aplicável
            }
        } else {
            gameState.dailyStreak = 1; // Reset se não consecutivo
            saveGameState();
        }
    },

    unlockAchievement(achievement) {
        achievement.unlocked = true;
        document.getElementById('achievementBadge').style.display = 'block';
        showToast(`🏆 Achievement Unlocked: ${achievement.name}!`, 'success');
    },

    showAchievements() {
        const achievementsModal = document.getElementById('achievementsModal');
        const achievementsBody = document.getElementById('achievementsBody');
        if (!achievementsModal || !achievementsBody) return;
        achievementsBody.innerHTML = gameState.achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? '' : 'locked'}">
                <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc} ${achievement.count ? `(${achievement.count}/${achievement.requirement})` : ''}</div>
                </div>
            </div>
        `).join('');
        achievementsModal.classList.add('active');
    },

    showRules() {
        const rulesModal = document.getElementById('rulesModal');
        if (rulesModal) {
            rulesModal.classList.add('active');
        }
    },

    updateUIState() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            if (!State.isConnected) {
                spinButton.disabled = true;
                spinButton.innerHTML = 'CONNECT WALLET';
            } else if (gameState.isSpinning) {
                spinButton.disabled = true;
                spinButton.innerHTML = '<div class="loader inline-block"></div> TIGER IS ROLLING...';
            } else {
                spinButton.innerHTML = 'SPIN THE REELS';
                this.checkPStakeStatus();
            }
        }
    }
};