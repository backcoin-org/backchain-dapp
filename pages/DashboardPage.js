// js/pages/DashboardPage.js
// ✅ FINAL VERSION V5.3: VPS Ready + Faucet Fix + History Optimized

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData,
    calculateUserTotalRewards,
    getHighestBoosterBoostFromAPI,
    safeContractCall,
    calculateClaimDetails,
    API_ENDPOINTS
} from '../modules/data.js';
import { executeUniversalClaim } from '../modules/transactions.js';
import {
    formatBigNumber, formatPStake, renderLoading,
    renderNoData, renderError
} from '../utils.js';
import { showToast, addNftToWallet } from '../ui-feedback.js';
import { addresses, boosterTiers } from '../config.js'; 

// --- LOCAL STATE ---
const DashboardState = {
    hasRenderedOnce: false,
    lastUpdate: 0,
    activities: [], 
    filteredActivities: [], 
    userProfile: null, 
    pagination: {
        currentPage: 1,
        itemsPerPage: 5 
    },
    filters: {
        type: 'ALL', 
        sort: 'NEWEST' 
    }
};

// -----------------------------------------------------------
// CONFIGS
// -----------------------------------------------------------
const EXPLORER_BASE_URL = "https://sepolia.arbiscan.io/address/";

// ⚠️ AJUSTE PARA SUA VPS:
// Se você ainda não configurou o domínio 'api.backcoin.org', troque pela URL da sua VPS.
// Exemplo: "http://SEU_IP_DA_DIGITALOCEAN:8080/faucet"
const FAUCET_API_URL = "https://api.backcoin.org/faucet"; 

const EXTERNAL_FAUCETS = [
    { name: "Alchemy Faucet", url: "https://www.alchemy.com/faucets/arbitrum-sepolia" },
    { name: "QuickNode Faucet", url: "https://faucet.quicknode.com/arbitrum/sepolia" },
    { name: "Google Cloud Faucet", url: "https://cloud.google.com/application/web3/faucet/arbitrum/sepolia" }
];

// --- HELPER: DATE FORMAT ---
function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        // Compatibilidade com Firestore Timestamp (_seconds) e Date ISO
        if (timestamp.seconds || timestamp._seconds) {
            const secs = timestamp.seconds || timestamp._seconds;
            return new Date(secs * 1000).toLocaleString(); 
        }
        return new Date(timestamp).toLocaleString();
    } catch (e) { return 'Recent'; }
}

// --- REWARDS ANIMATION ---
let animationFrameId = null;
let displayedRewardValue = 0n;

function animateClaimableRewards(targetNetValue) {
    const rewardsEl = document.getElementById('dash-user-rewards');
    if (!rewardsEl || !State.isConnected) {
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
    }
    const diff = targetNetValue - displayedRewardValue;
    // Animação suave (Lerp)
    if (diff > -1000000000n && diff < 1000000000n) displayedRewardValue = targetNetValue;
    else displayedRewardValue += diff / 8n; 
    
    if (displayedRewardValue < 0n) displayedRewardValue = 0n;
    
    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(4)} <span class="text-sm text-amber-500">$BKC</span>`;
    
    if (displayedRewardValue !== targetNetValue) {
        animationFrameId = requestAnimationFrame(() => animateClaimableRewards(targetNetValue));
    }
}

// -------------------------------------------------------------
// ⚡ REQUISITAR FAUCET AO BACKEND (VPS)
// -------------------------------------------------------------
async function requestSmartFaucet(btnElement) {
    if (!State.isConnected || !State.userAddress) return showToast("Connect wallet first", "error");

    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...`;

    try {
        // Faz a chamada para a sua API na VPS
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`);
        const data = await response.json();

        if (response.ok && data.success) {
            showToast("✅ Starter Pack Sent! (0.002 ETH + 20 BKC)", "success");
            
            // Esconde o widget após sucesso
            const widget = document.getElementById('dashboard-faucet-widget');
            if(widget) widget.classList.add('hidden');
            const modal = document.getElementById('no-gas-modal-dash');
            if(modal) modal.classList.add('hidden');

            // Atualiza a tela após alguns segundos para refletir o saldo
            setTimeout(() => DashboardPage.update(true), 4000); 
        } else {
            const msg = data.error || "Faucet unavailable";
            // Se for erro de cooldown, avisa o usuário
            if (msg.includes("Cooldown")) showToast(`⏳ ${msg}`, "warning");
            else showToast(`❌ ${msg}`, "error");
        }
    } catch (e) {
        console.error("Faucet API Error:", e);
        showToast("Faucet Service Offline. Check VPS connection.", "error");
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHTML;
    }
}

// -------------------------------------------------------------
// GAS GUARD: Check for Sepolia ETH
// -------------------------------------------------------------
async function checkGasAndWarn() {
    try {
        const nativeBalance = await State.provider.getBalance(State.userAddress);
        const minGas = ethers.parseEther("0.002"); 
        
        if (nativeBalance < minGas) {
            console.warn("⚠️ Low Gas Detected:", ethers.formatEther(nativeBalance));
            const modal = document.getElementById('no-gas-modal-dash');
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            return false;
        }
        return true;
    } catch (e) {
        console.error("Gas check failed", e);
        return true; // Assume success if check fails to avoid blocking
    }
}

// ============================================================================
// 1. RENDER LAYOUT
// ============================================================================

function renderDashboardLayout() {
    if (!DOMElements.dashboard) return;

    DOMElements.dashboard.innerHTML = `
        <div class="flex flex-col gap-8 pb-10">
            
            <div class="flex justify-end">
                <button id="manual-refresh-btn" class="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
                    <i class="fa-solid fa-rotate"></i> Sync Data
                </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                ${renderMetricCard('Total Supply', 'fa-coins', 'text-zinc-400', 'dash-metric-supply')}
                ${renderMetricCard('Net pStake', 'fa-layer-group', 'text-purple-400', 'dash-metric-pstake')}
                ${renderMetricCard('Supply Locked', 'fa-lock', 'text-blue-400', 'dash-metric-locked')}
                ${renderMetricCard('Scarcity Rate', 'fa-fire', 'text-orange-500', 'dash-metric-scarcity')}
                ${renderMetricCard('Active Users', 'fa-users', 'text-green-400', 'dash-metric-users')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div class="lg:col-span-8 flex flex-col gap-6">
                    
                    <div id="dashboard-faucet-widget" class="hidden glass-panel border-l-4 transition-all duration-500 bg-gradient-to-r from-zinc-900/50 to-transparent">
                        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 id="faucet-title" class="text-white font-bold flex items-center gap-2"></h3>
                                <p id="faucet-desc" class="text-sm text-zinc-400 mt-1"></p>
                            </div>
                            <button id="faucet-action-btn" class="w-full sm:w-auto font-bold py-2.5 px-6 rounded-lg shadow-lg transition-transform hover:scale-105 whitespace-nowrap"></button>
                        </div>
                    </div>

                    <div class="glass-panel relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <i class="fa-solid fa-rocket text-9xl"></i>
                        </div>
                        
                        <div class="flex flex-col md:flex-row gap-8 relative z-10">
                            <div class="flex-1 space-y-6">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <p class="text-zinc-400 text-sm font-medium">Your Current Payout</p>
                                        <i class="fa-solid fa-circle-info text-zinc-600 text-xs cursor-help" title="Net amount you receive based on your Efficiency Score"></i>
                                    </div>
                                    
                                    <div id="dash-user-rewards" class="text-4xl font-bold text-white mt-2">--</div>
                                    
                                    <div id="dash-user-gain-area" class="hidden mt-2 p-2 bg-green-900/20 border border-green-500/20 rounded-lg inline-block animate-pulse">
                                        <p class="text-xs text-green-400 font-bold font-mono flex items-center gap-2">
                                            <i class="fa-solid fa-arrow-up"></i>
                                            Potential: <span id="dash-user-potential-gain">0.0000</span> BKC Extra
                                        </p>
                                    </div>

                                    <div class="mt-6">
                                        <button id="dashboardClaimBtn" class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                            <i class="fa-solid fa-gift mr-2"></i> Claim Rewards
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="border-t border-zinc-700/50 pt-4 flex items-center gap-4">
                                    <div>
                                        <p class="text-zinc-400 text-xs">Your Net pStake</p>
                                        <p id="dash-user-pstake" class="text-xl font-bold text-purple-400 font-mono">--</p>
                                    </div>
                                    <div class="h-8 w-px bg-zinc-700"></div>
                                    <button class="text-sm text-purple-400 hover:text-white font-medium delegate-link transition-colors">
                                        <i class="fa-solid fa-plus-circle mr-1"></i> Delegate More
                                    </button>
                                </div>
                            </div>

                            <div id="dash-booster-area" class="flex-1 md:border-l md:border-zinc-700/50 md:pl-8 flex flex-col justify-center min-h-[180px]">
                                ${renderLoading()}
                            </div>
                        </div>
                    </div>

                    <div id="dash-presale-stats" class="hidden glass-panel border border-amber-500/20">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-amber-500 uppercase tracking-widest">
                                <i class="fa-solid fa-star mr-2"></i> Presale Portfolio
                            </h3>
                            <span class="text-xs text-zinc-500">Synced via Indexer V5.2</span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div class="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                                <p class="text-xs text-zinc-500">Total Spent</p>
                                <p id="stats-total-spent" class="text-lg font-bold text-white">0 ETH</p>
                            </div>
                            <div class="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                                <p class="text-xs text-zinc-500">Boosters Owned</p>
                                <p id="stats-total-boosters" class="text-lg font-bold text-white">0</p>
                            </div>
                            <div class="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 col-span-2">
                                <p class="text-xs text-zinc-500 mb-1">Top Tiers</p>
                                <div id="stats-tier-badges" class="flex gap-1 flex-wrap">
                                    <span class="text-xs text-zinc-600">No data yet</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel">
                        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-zinc-400"></i> Activity History
                            </h3>
                            
                            <div class="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                                <select id="activity-filter-type" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-500 cursor-pointer">
                                    <option value="ALL">All Types</option>
                                    <option value="STAKE">Staking</option>
                                    <option value="CLAIM">Claims</option>
                                    <option value="NFT">Market/NFT</option>
                                    <option value="GAME">Fortune Pool</option>
                                </select>
                                <button id="activity-sort-toggle" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 hover:bg-zinc-700 transition-colors">
                                    <i class="fa-solid fa-arrow-down-wide-short mr-1"></i> Newest
                                </button>
                            </div>
                        </div>

                        <div id="dash-activity-list" class="space-y-3 min-h-[200px]">
                            ${renderNoData("Connect wallet to view history.")}
                        </div>
                        
                        <div id="dash-pagination-controls" class="flex justify-between items-center mt-6 pt-4 border-t border-zinc-700/30 hidden">
                            <button class="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" id="page-prev">
                                <i class="fa-solid fa-chevron-left mr-1"></i> Prev
                            </button>
                            <span class="text-xs text-zinc-500 font-mono" id="page-indicator">Page 1</span>
                            <button class="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" id="page-next">
                                Next <i class="fa-solid fa-chevron-right ml-1"></i>
                            </button>
                        </div>
                    </div>

                </div>

                <div class="lg:col-span-4 flex flex-col gap-6">
                    <div class="glass-panel bg-gradient-to-b from-purple-900/20 to-transparent border-purple-500/20">
                        <h3 class="font-bold text-white mb-2">Grow your Capital</h3>
                        <p class="text-sm text-zinc-400 mb-4">Delegate $BKC to the Global Consensus Pool to earn passive yield.</p>
                        <button class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors delegate-link shadow-lg shadow-purple-900/20">
                            Go to Stake Pool <i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>

                    <div class="glass-panel">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-white">Network Status</h3>
                            <span class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 animate-pulse">Operational</span>
                        </div>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-zinc-500">Validator Node</span>
                                <span class="text-white">Global Pool</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-zinc-500">Contract</span>
                                <a href="${addresses.delegationManager ? EXPLORER_BASE_URL + addresses.delegationManager : '#'}" target="_blank" class="text-blue-400 hover:underline">View on Scan</a>
                            </div>
                        </div>
                    </div>

                      <div class="glass-panel relative overflow-hidden border-cyan-500/20">
                        <div class="absolute inset-0 bg-cyan-900/10"></div>
                        <h3 class="font-bold text-white mb-2 relative z-10">Need a Boost?</h3>
                        <p class="text-sm text-zinc-400 mb-4 relative z-10">Don't want to buy an NFT? Rent one by the hour.</p>
                        <button class="w-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20 font-bold py-2 px-4 rounded-lg transition-colors relative z-10 go-to-rental">
                            Visit AirBNFT Market
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="booster-info-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-zinc-900 border border-amber-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl shadow-amber-900/20 transform scale-95 transition-transform duration-300 relative">
                <button id="close-booster-modal" class="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
                <div class="text-center mb-6">
                    <div class="inline-block bg-amber-500/20 p-4 rounded-full mb-3 animate-bounce">
                        <i class="fa-solid fa-rocket text-4xl text-amber-500"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Maximize Your Efficiency</h3>
                    <p class="text-zinc-400 text-sm mt-2">NFT holders can earn up to 2x more.</p>
                </div>
                
                <div class="space-y-4 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                    <div class="flex justify-between items-center text-sm border-b border-zinc-700 pb-2">
                        <span class="text-zinc-400">No NFT:</span>
                        <span class="text-zinc-500 font-bold">50% Efficiency</span>
                    </div>
                    <div class="flex justify-between items-center text-sm border-b border-zinc-700 pb-2">
                        <span class="text-zinc-400">Bronze Booster:</span>
                        <span class="text-green-300 font-bold">80% Efficiency (+60% Profit)</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-amber-400 font-bold">Gold/Diamond:</span>
                        <span class="text-green-400 font-bold">100% Efficiency (2x Profit)</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mt-6">
                    <button class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg go-to-store" onclick="document.getElementById('booster-info-modal').classList.add('hidden')">
                        Buy NFT
                    </button>
                    <button class="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg go-to-rental" onclick="document.getElementById('booster-info-modal').classList.add('hidden')">
                        Rent NFT
                    </button>
                </div>
            </div>
        </div>

        <div id="no-gas-modal-dash" class="absolute inset-0 z-50 hidden flex-col items-center justify-center glass-panel rounded-3xl bg-black/95 backdrop-blur-xl">
            <div class="p-6 max-w-sm text-center animate-fadeIn bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
                <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                    <i class="fa-solid fa-gas-pump text-2xl text-red-500"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Insufficient Gas (ETH)</h3>
                <p class="text-zinc-400 text-sm mb-6">You need Arbitrum Sepolia ETH. We can send you a small amount to get started.</p>
                
                <div class="flex flex-col gap-3">
                    <button id="emergency-faucet-btn" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-transform hover:scale-105">
                        <i class="fa-solid fa-hand-holding-medical"></i> Get Gas + Tokens (Free)
                    </button>
                    
                    <div class="relative flex py-2 items-center">
                        <div class="flex-grow border-t border-zinc-700"></div>
                        <span class="flex-shrink-0 mx-2 text-zinc-600 text-xs">OR USE EXTERNAL</span>
                        <div class="flex-grow border-t border-zinc-700"></div>
                    </div>

                    ${EXTERNAL_FAUCETS.map(f => `
                        <a href="${f.url}" target="_blank" class="w-full bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded-lg flex justify-between items-center text-xs transition-colors">
                            <span>${f.name}</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    `).join('')}
                    <button id="close-gas-modal-dash" class="mt-2 text-zinc-500 hover:text-white text-xs underline">Close</button>
                </div>
            </div>
        </div>
    `;
    
    attachDashboardListeners();
}

function renderMetricCard(label, icon, iconColor, id) {
    return `
        <div class="glass-panel p-4 flex flex-col items-center text-center sm:items-start sm:text-left transition-transform hover:-translate-y-1">
            <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid ${icon} ${iconColor}"></i>
                <span class="text-xs text-zinc-500 uppercase font-bold tracking-wider">${label}</span>
            </div>
            <p id="${id}" class="text-lg md:text-xl font-bold text-white truncate w-full">--</p>
        </div>
    `;
}

// ============================================================================
// 2. DATA LOGIC (GLOBAL + USER)
// ============================================================================

async function updateGlobalMetrics() {
    try {
        if (!State.bkcTokenContractPublic) return;

        const [totalSupply, totalPStake, maxSupply, tgeSupply] = await Promise.all([
            safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
            safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'MAX_SUPPLY', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'TGE_SUPPLY', [], 0n)
        ]);

        let totalLocked = 0n;
        const contractKeys = ['delegationManager', 'fortunePool', 'rentalManager', 'rewardBoosterNFT', 'ecosystemManager', 'decentralizedNotary', 'faucet', 'publicSale', 'bkcDexPoolAddress'];
        if (addresses) Object.keys(addresses).forEach(k => { if (k.startsWith('pool_')) contractKeys.push(k); });

        const uniqueAddrs = new Set();
        for (const k of contractKeys) {
            const addr = addresses[k];
            if (addr && ethers.isAddress(addr)) uniqueAddrs.add(addr);
        }

        // Calcula Supply Bloqueado aproximado
        for (const addr of uniqueAddrs) {
            try { 
                const bal = await safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [addr], 0n);
                totalLocked += bal;
                await new Promise(r => setTimeout(r, 20)); 
            } catch {}
        }

        const scarcityPool = maxSupply - tgeSupply;
        const minted = totalSupply - tgeSupply;
        const scarcityRate = scarcityPool > 0n ? ((scarcityPool - minted) * 10000n / scarcityPool) : 0n;

        const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
        
        setTxt('dash-metric-supply', formatBigNumber(totalSupply).toLocaleString('en-US', { maximumFractionDigits: 0 }));
        setTxt('dash-metric-pstake', formatPStake(totalPStake));
        
        let lockedText = "0%";
        if (totalSupply > 0n) {
            const percent = (Number(totalLocked * 10000n / totalSupply)/100).toFixed(1);
            const amount = formatBigNumber(totalLocked).toLocaleString('en-US', { maximumFractionDigits: 1, notation: "compact", compactDisplay: "short" });
            lockedText = `${percent}% <span class="text-lg text-zinc-300 ml-2 font-bold">(${amount} BKC)</span>`;
        }
        setTxt('dash-metric-locked', lockedText);
        setTxt('dash-metric-scarcity', `${(Number(scarcityRate)/100).toFixed(2)}%`);
        setTxt('dash-metric-users', (State.systemData?.activeUsers || 1240).toLocaleString());

    } catch (e) { console.error("Metrics Error", e); }
}

async function fetchUserProfile() {
    if (!State.userAddress) return;
    try {
        const response = await fetch(`${API_ENDPOINTS.getBoosters.replace('/boosters/', '/profile/')}/${State.userAddress}`);
        if (response.ok) {
            DashboardState.userProfile = await response.json();
            renderPresaleStats(DashboardState.userProfile);
        }
    } catch (e) { console.error("Profile Fetch Error", e); }
}

function renderPresaleStats(profile) {
    const statsDiv = document.getElementById('dash-presale-stats');
    if (!statsDiv || !profile || !profile.presale) return;

    statsDiv.classList.remove('hidden');

    const spentWei = profile.presale.totalSpentWei || 0;
    const spentEth = parseFloat(ethers.formatEther(BigInt(spentWei))).toFixed(4);
    
    document.getElementById('stats-total-spent').innerText = `${spentEth} ETH`;
    document.getElementById('stats-total-boosters').innerText = profile.presale.totalBoosters || 0;

    const badgesContainer = document.getElementById('stats-tier-badges');
    if (badgesContainer && profile.presale.tiersOwned) {
        let html = '';
        Object.entries(profile.presale.tiersOwned).forEach(([tierId, count]) => {
            const tierConfig = boosterTiers[Number(tierId)-1]; 
            const color = tierConfig ? tierConfig.color.replace('text-', 'bg-').replace('300', '500/20').replace('400', '500/20').replace('500', '500/20') : 'bg-zinc-700';
            const name = tierConfig ? tierConfig.name : `Tier ${tierId}`;
            
            html += `<span class="text-[10px] ${color} text-white px-2 py-0.5 rounded border border-white/10">${count}x ${name}</span>`;
        });
        if(html) badgesContainer.innerHTML = html;
    }
}

async function updateUserHub(forceRefresh = false) {
    if (!State.isConnected) {
        const boosterArea = document.getElementById('dash-booster-area');
        if(boosterArea) {
            boosterArea.innerHTML = `
                <div class="text-center">
                    <p class="text-zinc-500 text-sm mb-2">Connect wallet to view status</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-sm font-bold border border-amber-400/30 px-4 py-2 rounded hover:bg-amber-400/10 transition-all">Connect Wallet</button>
                </div>`;
        }
        const faucetWidget = document.getElementById('dashboard-faucet-widget');
        if(faucetWidget) faucetWidget.classList.add('hidden');
        return;
    }

    try {
        const rewardsEl = document.getElementById('dash-user-rewards');
        if (forceRefresh && rewardsEl) {
            rewardsEl.classList.add('animate-pulse', 'opacity-70');
        }

        await loadUserData(forceRefresh); 
        fetchUserProfile();

        // ------------------------------------------------
        // ✅ SMART WIDGET LOGIC (GAS > BKC)
        // ------------------------------------------------
        const widget = document.getElementById('dashboard-faucet-widget');
        
        if (widget) {
            const ethBalance = await State.provider.getBalance(State.userAddress);
            const bkcBalance = State.currentUserBalance;
            const minEth = ethers.parseEther("0.002");
            const minBkc = ethers.parseUnits("10", 18);

            const title = widget.querySelector('#faucet-title');
            const desc = widget.querySelector('#faucet-desc');
            const btn = widget.querySelector('#faucet-action-btn');

            if (ethBalance < minEth) {
                // PRIORIDADE 1: FALTA GÁS (ETH)
                widget.classList.remove('hidden', 'border-l-amber-500');
                widget.classList.add('border-l-red-500');
                
                title.innerHTML = '<i class="fa-solid fa-gas-pump text-red-500 animate-bounce"></i> Low Gas Detected';
                desc.innerHTML = 'You need <strong>Arbitrum Sepolia ETH</strong> to transact.';
                btn.innerHTML = '<i class="fa-solid fa-hand-holding-medical mr-2"></i> Get Gas + Tokens';
                btn.className = "w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-transform hover:scale-105 whitespace-nowrap";
                
                btn.dataset.action = "gasless";

            } else if (bkcBalance < minBkc) {
                // PRIORIDADE 2: FALTA TOKEN (BKC)
                widget.classList.remove('hidden', 'border-l-red-500');
                widget.classList.add('border-l-amber-500');
                
                title.innerHTML = '<i class="fa-solid fa-faucet text-amber-500 animate-bounce"></i> Need Tokens?';
                desc.innerHTML = 'Claim <strong>20 Free BKC</strong> to explore the ecosystem.';
                btn.innerHTML = '<i class="fa-solid fa-coins mr-2"></i> Get 20 BKC';
                btn.className = "w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-transform hover:scale-105 whitespace-nowrap";
                
                btn.dataset.action = "gasless"; // Usa o mesmo endpoint de faucet
            } else {
                widget.classList.add('hidden');
            }
        }

        const claimDetails = await calculateClaimDetails();
        const { totalRewards, netClaimAmount, feeAmount } = claimDetails;
        
        animateClaimableRewards(netClaimAmount);

        const gainArea = document.getElementById('dash-user-gain-area');
        const gainVal = document.getElementById('dash-user-potential-gain');

        if (gainArea && gainVal) {
            if (totalRewards > 0n && feeAmount > 0n) {
                gainVal.textContent = formatBigNumber(feeAmount).toFixed(4);
                gainArea.classList.remove('hidden');
            } else {
                gainArea.classList.add('hidden');
            }
        }
        
        const claimBtn = document.getElementById('dashboardClaimBtn');
        if(claimBtn) claimBtn.disabled = netClaimAmount <= 0n;

        const pStakeEl = document.getElementById('dash-user-pstake');
        if(pStakeEl) pStakeEl.textContent = formatPStake(State.userTotalPStake);

        const boosterData = await getHighestBoosterBoostFromAPI();
        renderBoosterCard(boosterData, claimDetails);

        if (rewardsEl) rewardsEl.classList.remove('animate-pulse', 'opacity-70');

    } catch (e) { console.error("User Hub Error", e); }
}

function renderBoosterCard(data, claimDetails) {
    const container = document.getElementById('dash-booster-area');
    if (!container) return;

    const totalPending = claimDetails ? claimDetails.totalRewards : 0n;
    
    const hasValidBooster = data && data.highestBoost > 0 && data.source !== 'none';
    const currentBoostBips = hasValidBooster ? data.highestBoost : 0;
    
    let efficiency = 50 + (currentBoostBips / 100);
    if (efficiency > 100) efficiency = 100;

    // --- SCENARIO 1: LOW EFFICIENCY (UPSELL) ---
    if (efficiency < 100) {
        const feeAmount = claimDetails?.feeAmount || 0n; 
        const lostFormatted = formatBigNumber(feeAmount).toFixed(4);

        const copyText = totalPending > 0n && feeAmount > 0n
            ? `Leaving <span class="text-amber-400 font-bold">${lostFormatted} BKC</span> on the table.`
            : "Boost your efficiency to 100% to claim full rewards.";

        const progressBar = `
            <div class="w-full bg-zinc-800 rounded-full h-2.5 mb-2 border border-zinc-700 overflow-hidden relative">
                <div class="bg-gradient-to-r from-red-500 to-amber-500 h-2.5 rounded-full transition-all duration-1000" style="width: ${efficiency}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-zinc-500 mb-3 font-mono">
                <span>${efficiency}% Efficiency</span>
                <span>Goal: 100%</span>
            </div>
        `;

        container.innerHTML = `
            <div class="text-center animate-fadeIn">
                <h4 class="text-white font-bold mb-2 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-gauge-high text-amber-500"></i> Yield Efficiency
                </h4>
                
                ${progressBar}

                <p class="text-xs text-zinc-300 mb-4 max-w-[220px] mx-auto">
                    ${copyText} <br>
                    <button id="open-booster-info" class="text-amber-400 hover:text-amber-300 underline font-bold mt-1">
                        Upgrade Now
                    </button>
                </p>
                
                <div class="flex gap-2 justify-center">
                    <button class="go-to-store bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded shadow-lg transition-colors">
                        Buy Booster
                    </button>
                    <button class="go-to-rental bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold py-2 px-4 rounded shadow-lg transition-colors">
                        Rent Booster
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // --- SCENARIO 2: MAX EFFICIENCY (SUCCESS) ---
    const isRented = data.source === 'rented';
    const badgeColor = isRented ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30';
    const badgeText = isRented ? 'Rented Active' : 'Owner Active';

    let upgradeText = `<span class="text-green-400 font-bold"><i class="fa-solid fa-check-circle"></i> Max Yield Active!</span>`;
    
    let finalImageUrl = data.imageUrl;
    if (!finalImageUrl || finalImageUrl.includes('placeholder')) {
        const tierInfo = boosterTiers.find(t => t.boostBips === currentBoostBips);
        if (tierInfo && tierInfo.realImg) finalImageUrl = tierInfo.realImg;
    }

    container.innerHTML = `
        <div class="flex flex-col items-center w-full animate-fadeIn">
            <div class="relative w-full bg-zinc-800/40 border border-zinc-700 rounded-xl p-3 flex items-center gap-4 overflow-hidden group hover:border-green-500/30 transition-all nft-clickable-image cursor-pointer" data-address="${addresses.rewardBoosterNFT}" data-tokenid="${data.tokenId}">
                
                <div class="relative w-20 h-20 flex-shrink-0">
                    <img src="${finalImageUrl}" class="w-full h-full object-cover rounded-lg shadow-lg transition-transform group-hover:scale-105" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div class="absolute -top-2 -left-2 bg-green-500 text-black font-black text-xs px-2 py-1 rounded shadow-lg z-10">
                        100%
                    </div>
                </div>

                <div class="flex-1 min-w-0 z-10">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-bold ${badgeColor} px-2 py-0.5 rounded border uppercase tracking-wider">${badgeText}</span>
                        <span class="text-[10px] text-zinc-500 font-mono">#${data.tokenId}</span>
                    </div>
                    <h4 class="text-white font-bold text-sm truncate">${data.boostName}</h4>
                    <p class="text-[11px] text-zinc-400 mt-1">${upgradeText}</p>
                </div>
                
                <div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none"></div>
            </div>
            
            <button id="open-booster-info" class="text-[10px] text-zinc-500 hover:text-zinc-300 mt-2 underline">
                View Benefits
            </button>
        </div>
    `;
}

// ============================================================================
// 4. ACTIVITY TABLE
// ============================================================================

async function fetchAndProcessActivities() {
    const listEl = document.getElementById('dash-activity-list');
    if (!State.isConnected) {
        if(listEl) listEl.innerHTML = renderNoData("Connect wallet to view history.");
        return;
    }

    try {
        if (listEl && (listEl.innerHTML === "" || listEl.innerText.includes("Connect"))) {
            listEl.innerHTML = renderLoading();
        }

        if (DashboardState.activities.length === 0) {
            // Usa o endpoint centralizado do Indexer
            const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            if (!response.ok) throw new Error("API Error");
            DashboardState.activities = await response.json();
        }
        
        applyFiltersAndRender();

    } catch (e) {
        console.error("Fetch Error:", e);
        if(listEl) listEl.innerHTML = renderError("Failed to load history.");
    }
}

function applyFiltersAndRender() {
    let result = [...DashboardState.activities];
    const type = DashboardState.filters.type;
    const normalize = (t) => (t || '').toUpperCase();

    if (type !== 'ALL') {
        result = result.filter(item => {
            const t = normalize(item.type);
            if (type === 'STAKE') return t.includes('DELEGATION');
            if (type === 'CLAIM') return t.includes('REWARD') || t.includes('CLAIM');
            if (type === 'NFT') return t.includes('BOOSTER') || t.includes('RENT') || t.includes('TRANSFER') || t.includes('NFTBOUGHT') || t.includes('NFTSOLD');
            if (type === 'GAME') return t.includes('FORTUNE') || t.includes('GAME') || t.includes('REQUEST') || t.includes('RESULT');
            return true;
        });
    }

    result.sort((a, b) => {
        const getTime = (obj) => {
            if (obj.timestamp && obj.timestamp._seconds) return obj.timestamp._seconds;
            if (obj.createdAt && obj.createdAt._seconds) return obj.createdAt._seconds;
            if (obj.timestamp) return new Date(obj.timestamp).getTime() / 1000;
            return 0;
        };
        return DashboardState.filters.sort === 'NEWEST' ? getTime(b) - getTime(a) : getTime(a) - getTime(b);
    });

    DashboardState.filteredActivities = result;
    DashboardState.pagination.currentPage = 1; 
    renderActivityPage();
}

function renderActivityPage() {
    const listEl = document.getElementById('dash-activity-list');
    const controlsEl = document.getElementById('dash-pagination-controls');
    if (!listEl) return;

    if (DashboardState.filteredActivities.length === 0) {
        listEl.innerHTML = renderNoData("No activities found.");
        if(controlsEl) controlsEl.classList.add('hidden');
        return;
    }

    const start = (DashboardState.pagination.currentPage - 1) * DashboardState.pagination.itemsPerPage;
    const end = start + DashboardState.pagination.itemsPerPage;
    const pageItems = DashboardState.filteredActivities.slice(start, end);

    listEl.innerHTML = pageItems.map(item => {
        const dateStr = formatDate(item.timestamp || item.createdAt);
        const timeStr = (item.timestamp && (item.timestamp.seconds || item.timestamp._seconds)) 
            ? new Date((item.timestamp.seconds || item.timestamp._seconds) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
        
        let icon = 'fa-circle', color = 'text-zinc-500', label = item.type;
        const t = (item.type || '').toUpperCase();
        
        if(t.includes('DELEGATION')) { icon = 'fa-layer-group'; color = 'text-purple-400'; label = 'Staked BKC'; }
        else if(t.includes('UNSTAKE')) { icon = 'fa-unlock'; color = 'text-zinc-400'; label = 'Unstaked'; }
        else if(t.includes('REWARD') || t.includes('CLAIM')) { icon = 'fa-gift'; color = 'text-amber-400'; label = 'Rewards Claimed'; }
        else if(t === 'NFTBOUGHT') { icon = 'fa-cart-shopping'; color = 'text-green-400'; label = 'Bought Booster'; }
        else if(t === 'BOOSTERBUY') { icon = 'fa-star'; color = 'text-yellow-300'; label = 'Minted from Sale'; }
        else if(t === 'NFTSOLD') { icon = 'fa-money-bill-transfer'; color = 'text-orange-400'; label = 'Sold to Pool'; }
        else if(t.includes('RENTALR') || t.includes('RENTED')) { icon = 'fa-house-user'; color = 'text-blue-400'; label = 'Rented NFT'; }
        else if(t.includes('RENTALLIST')) { icon = 'fa-sign-hanging'; color = 'text-blue-300'; label = 'Listed for Rent'; }
        else if(t === 'GAMEREQUESTED') { icon = 'fa-ticket'; color = 'text-amber-500'; label = 'Fortune Pool: Bet'; }
        else if(t === 'GAMERESULT') { icon = 'fa-robot'; color = 'text-cyan-400'; label = 'Fortune Oracle: Result'; }
        else if(t.includes('FORTUNE') || t.includes('GAME')) { icon = 'fa-trophy'; color = 'text-yellow-400'; label = 'Fortune Game'; }
        else if(t.includes('NOTARY')) { icon = 'fa-stamp'; color = 'text-indigo-400'; label = 'Document Notarized'; }
        
        const txLink = item.txHash ? `${EXPLORER_BASE_URL}${item.txHash}` : '#';
        let rawAmount = item.amount || item.details?.amount || item.data?.amount || "0";
        const amountDisplay = (rawAmount && rawAmount !== "0") ? `${formatBigNumber(BigInt(rawAmount)).toFixed(2)}` : '';

        return `
            <a href="${txLink}" target="_blank" class="block bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-3 transition-colors group">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 group-hover:border-zinc-500">
                            <i class="fa-solid ${icon} ${color} text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white text-sm font-bold">${label}</p>
                            <p class="text-xs text-zinc-500">${dateStr} ${timeStr ? '• ' + timeStr : ''}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        ${amountDisplay ? `<p class="text-white text-sm font-mono">${amountDisplay} <span class="text-xs text-zinc-500">BKC</span></p>` : ''}
                        <span class="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></span>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    if(controlsEl) {
        controlsEl.classList.remove('hidden');
        const maxPage = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
        document.getElementById('page-indicator').innerText = `Page ${DashboardState.pagination.currentPage} of ${maxPage}`;
        
        const prevBtn = document.getElementById('page-prev');
        const nextBtn = document.getElementById('page-next');
        prevBtn.disabled = DashboardState.pagination.currentPage === 1;
        nextBtn.disabled = DashboardState.pagination.currentPage >= maxPage;
        prevBtn.style.opacity = DashboardState.pagination.currentPage === 1 ? '0.3' : '1';
        nextBtn.style.opacity = DashboardState.pagination.currentPage >= maxPage ? '0.3' : '1';
    }
}

// ============================================================================
// 5. LISTENERS
// ============================================================================

function attachDashboardListeners() {
    if (DOMElements.dashboard) {
        DOMElements.dashboard.addEventListener('click', async (e) => {
            const target = e.target;

            if (target.closest('#manual-refresh-btn')) {
                const btn = target.closest('#manual-refresh-btn');
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> Syncing...`;
                
                await updateUserHub(true); 
                DashboardState.activities = []; 
                await fetchAndProcessActivities(); 
                
                setTimeout(() => { btn.innerHTML = `<i class="fa-solid fa-rotate"></i> Sync Data`; btn.disabled = false; }, 1000);
            }

            // --- SMART BUTTON LISTENER (GAS OR BKC) ---
            if (target.closest('#faucet-action-btn')) {
                const btn = target.closest('#faucet-action-btn');
                // Chama a mesma função para Gas e BKC, pois o backend entrega ambos
                await requestSmartFaucet(btn);
            }
            
            // --- EMERGENCY BUTTON NO MODAL ---
            if (target.closest('#emergency-faucet-btn')) {
                const btn = target.closest('#emergency-faucet-btn');
                await requestSmartFaucet(btn);
            }

            // --- NAVIGATION LINKS ---
            if (target.closest('.delegate-link')) { e.preventDefault(); window.navigateTo('mine'); }
            if (target.closest('.go-to-store')) { e.preventDefault(); window.navigateTo('store'); }
            if (target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); }

            // --- BOOSTER MODAL ---
            if (target.closest('#open-booster-info')) {
                e.preventDefault();
                const modal = document.getElementById('booster-info-modal');
                if(modal) {
                    modal.classList.remove('hidden');
                    setTimeout(() => { modal.classList.remove('opacity-0'); modal.firstElementChild.classList.remove('scale-95'); }, 10);
                }
            }

            if (target.closest('#close-booster-modal') || target === document.getElementById('booster-info-modal')) {
                e.preventDefault();
                const modal = document.getElementById('booster-info-modal');
                if(modal) {
                    modal.classList.add('opacity-0');
                    modal.firstElementChild.classList.add('scale-95');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                }
            }

            // --- GAS MODAL ---
            if (target.closest('#close-gas-modal-dash') || target === document.getElementById('no-gas-modal-dash')) {
                e.preventDefault();
                const modal = document.getElementById('no-gas-modal-dash');
                if(modal) {
                    modal.classList.remove('flex');
                    modal.classList.add('hidden');
                }
            }

            // --- NFT WALLET ADD ---
            const nftClick = target.closest('.nft-clickable-image');
            if (nftClick) {
                const address = nftClick.dataset.address;
                const id = nftClick.dataset.tokenid;
                if(address && id) addNftToWallet(address, id);
            }

            // --- CLAIM BUTTON ---
            const claimBtn = target.closest('#dashboardClaimBtn');
            if (claimBtn && !claimBtn.disabled) {
                try {
                    claimBtn.innerHTML = '<div class="loader inline-block"></div>';
                    claimBtn.disabled = true;

                    // --- GAS GUARD CHECK ---
                    const hasGas = await checkGasAndWarn();
                    if (!hasGas) {
                        claimBtn.innerHTML = '<i class="fa-solid fa-gift mr-2"></i> Claim Rewards';
                        claimBtn.disabled = false;
                        return;
                    }

                    const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                    if (stakingRewards > 0n || minerRewards > 0n) {
                        const success = await executeUniversalClaim(stakingRewards, minerRewards, null);
                        if (success) {
                            showToast("Rewards claimed!", "success");
                            await updateUserHub(true); 
                            DashboardState.activities = []; 
                            fetchAndProcessActivities();
                        }
                    }
                } catch (err) {
                    console.error(err);
                    showToast("Claim failed. Check console.", "error");
                } finally {
                    claimBtn.innerHTML = '<i class="fa-solid fa-gift mr-2"></i> Claim Rewards';
                    claimBtn.disabled = false;
                }
            }

            // --- PAGINATION ---
            if (target.closest('#page-prev') && DashboardState.pagination.currentPage > 1) {
                DashboardState.pagination.currentPage--; renderActivityPage();
            }
            if (target.closest('#page-next')) {
                const max = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
                if (DashboardState.pagination.currentPage < max) {
                    DashboardState.pagination.currentPage++; renderActivityPage();
                }
            }

            if (target.closest('#activity-sort-toggle')) {
                DashboardState.filters.sort = DashboardState.filters.sort === 'NEWEST' ? 'OLDEST' : 'NEWEST';
                applyFiltersAndRender();
            }
        });

        const filterSelect = document.getElementById('activity-filter-type');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                DashboardState.filters.type = e.target.value;
                applyFiltersAndRender();
            });
        }
    }
}

export const DashboardPage = {
    async render(isNewPage) {
        renderDashboardLayout();
        updateGlobalMetrics();
        if (State.isConnected) {
            await updateUserHub(false); 
            fetchAndProcessActivities();
        }
    },

    update(isConnected) {
        const now = Date.now();
        if (isConnected) {
            const activityListEl = document.getElementById('dash-activity-list');
            const hasActivityData = DashboardState.activities.length > 0;
            const isShowingPlaceholder = activityListEl && activityListEl.innerText.includes("Connect");

            // Atualiza a cada 10s ou se não houver dados
            if ((now - DashboardState.lastUpdate > 10000) || (!hasActivityData && isShowingPlaceholder)) {
                DashboardState.lastUpdate = now;
                updateUserHub(false); 
                fetchAndProcessActivities(); 
            }
        }
    }
};