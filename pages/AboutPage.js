// pages/AboutPage.js
// ✅ PRODUCTION V5.1 — Complete ecosystem overview — modular architecture

import { showToast } from '../ui-feedback.js';

// ==========================================================
//  1. STYLES INJECTION
// ==========================================================
const injectAboutStyles = () => {
    if (document.getElementById('about-styles-v5')) return;

    const style = document.createElement('style');
    style.id = 'about-styles-v5';
    style.innerHTML = `
        @keyframes pulse-hub {
            0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.3), 0 0 40px rgba(251,191,36,0.1); }
            50% { box-shadow: 0 0 40px rgba(251,191,36,0.5), 0 0 80px rgba(251,191,36,0.2); }
        }

        @keyframes flow-down {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }

        @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .ab-fade-up { animation: fade-in-up 0.6s ease-out forwards; }
        .ab-pulse-hub { animation: pulse-hub 3s ease-in-out infinite; }
        .ab-rotate { animation: rotate-slow 30s linear infinite; }

        .ab-section {
            background: linear-gradient(180deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 1.5rem;
            padding: 2rem;
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
        }

        .ab-card {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 1rem;
            padding: 1.25rem;
            transition: all 0.3s ease;
        }

        .ab-card:hover {
            border-color: rgba(251,191,36,0.4);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .ab-hub {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(9,9,11,1) 70%);
            border: 3px solid #f59e0b;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 10;
        }

        .ab-flow-line {
            position: relative;
            height: 40px;
            width: 2px;
            background: rgba(63,63,70,0.5);
            overflow: hidden;
        }

        .ab-flow-line::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 50%;
            background: linear-gradient(180deg, transparent, #f59e0b, transparent);
            animation: flow-down 1.5s linear infinite;
        }

        .ab-icon-box {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }

        .ab-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 600;
        }

        .ab-gradient-text {
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .ab-orbit-container {
            position: relative;
            width: 280px;
            height: 280px;
        }

        .ab-orbit-ring {
            position: absolute;
            border: 1px dashed rgba(251,191,36,0.3);
            border-radius: 50%;
        }

        .ab-orbit-item {
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(24,24,27,0.9);
            border: 2px solid;
            font-size: 14px;
        }

        .ab-module-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 10px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .ab-module-pill:hover {
            transform: translateX(4px);
        }
    `;
    document.head.appendChild(style);
};

// ==========================================================
//  2. RENDER SECTIONS
// ==========================================================

function renderHeroSection() {
    return `
        <div class="text-center mb-10 ab-fade-up">
            <div class="relative inline-block mb-6">
                <div class="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl"></div>
                <img src="./assets/bkc_logo_3d.png" class="w-24 h-24 relative z-10" alt="Backcoin">
            </div>

            <h1 class="text-3xl md:text-4xl font-black text-white mb-3">
                The <span class="ab-gradient-text">Backchain</span> Ecosystem
            </h1>

            <p class="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed mb-5">
                An unstoppable, permissionless DeFi ecosystem on <span class="text-yellow-400 font-medium">opBNB</span>.
                No admin keys. No blacklists.
                A <span class="text-amber-400 font-medium">modular smart contract ecosystem</span> working together to create a self-sustaining digital economy.
            </p>

            <div class="flex items-center justify-center gap-3 flex-wrap">
                <span class="ab-badge bg-amber-500/20 text-amber-400">
                    <i class="fa-solid fa-users mr-1"></i>Community-Owned
                </span>
                <span class="ab-badge bg-emerald-500/20 text-emerald-400">
                    <i class="fa-solid fa-infinity mr-1"></i>Self-Sustaining
                </span>
                <span class="ab-badge bg-blue-500/20 text-blue-400">
                    <i class="fa-solid fa-shield-halved mr-1"></i>Unstoppable
                </span>
                <span class="ab-badge bg-purple-500/20 text-purple-400">
                    <i class="fa-solid fa-code mr-1"></i>Open Source
                </span>
            </div>
        </div>
    `;
}

function renderPhilosophySection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.05s">
            <div class="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-scroll text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">The Philosophy</h2>
                    <p class="text-zinc-500 text-xs">Why Backchain exists</p>
                </div>
            </div>

            <p class="text-zinc-400 text-sm leading-relaxed mb-4">
                Most DeFi protocols are controlled by teams that can pause contracts, blacklist wallets, or change the rules. Backchain was built with a different philosophy: <strong class="text-white">once deployed, the code runs forever</strong> — no admin can stop it, no company can shut it down, and no government can censor it.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="ab-card text-center p-4">
                    <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-key text-red-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">No Admin Keys</h3>
                    <p class="text-zinc-500 text-[11px]">No one can modify contracts after deployment. Rules are enforced by code, not people.</p>
                </div>
                <div class="ab-card text-center p-4">
                    <div class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-ban text-amber-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">No Blacklists</h3>
                    <p class="text-zinc-500 text-[11px]">Every wallet has equal access. No addresses can be blocked or restricted.</p>
                </div>
                <div class="ab-card text-center p-4">
                    <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">Immutable Core</h3>
                    <p class="text-zinc-500 text-[11px]">Core contracts are immutable. Modules can be added or removed without changing existing code.</p>
                </div>
            </div>
        </div>
    `;
}

function renderHubSpokeSection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.1s">
            <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-sitemap text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Hub & Spoke Architecture</h2>
                    <p class="text-zinc-500 text-xs">Modular design for infinite scalability</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                    <p class="text-zinc-400 text-sm leading-relaxed mb-4">
                        Backchain uses a <strong class="text-white">modular architecture</strong>.
                        The <span class="text-amber-400 font-medium">Hub</span> (BackchainEcosystem) is the immutable core — it manages all fees, reward distribution, operator commissions, and tutor referrals.
                        The <span class="text-emerald-400 font-medium">Spokes</span> are independent services that plug into the Hub. New spokes can be added anytime without changing existing contracts.
                    </p>

                    <div class="ab-card bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 mb-3">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-brain text-amber-400"></i>
                            <span class="text-white font-bold text-sm">The Hub (BackchainEcosystem)</span>
                        </div>
                        <ul class="text-zinc-400 text-xs space-y-1">
                            <li><i class="fa-solid fa-check text-amber-500/60 mr-1.5"></i>Fee collection & per-module distribution</li>
                            <li><i class="fa-solid fa-check text-amber-500/60 mr-1.5"></i>Operator commissions (10-20% to builders)</li>
                            <li><i class="fa-solid fa-check text-amber-500/60 mr-1.5"></i>Tutor referral system (10% BNB + 5% BKC)</li>
                            <li><i class="fa-solid fa-check text-amber-500/60 mr-1.5"></i>Buyback & Burn engine (deflationary)</li>
                        </ul>
                    </div>

                    <div class="ab-card bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-puzzle-piece text-emerald-400"></i>
                            <span class="text-white font-bold text-sm">The Spokes (Service Modules)</span>
                        </div>
                        <ul class="text-zinc-400 text-xs space-y-1">
                            <li><i class="fa-solid fa-check text-emerald-500/60 mr-1.5"></i>Each spoke generates fees for the ecosystem</li>
                            <li><i class="fa-solid fa-check text-emerald-500/60 mr-1.5"></i>Independent deployment & upgradability</li>
                            <li><i class="fa-solid fa-check text-emerald-500/60 mr-1.5"></i>More spokes = more revenue = higher rewards</li>
                        </ul>
                    </div>
                </div>

                <!-- Visual Diagram -->
                <div class="flex justify-center">
                    <div class="ab-orbit-container">
                        <div class="ab-orbit-ring ab-rotate" style="width: 100%; height: 100%; top: 0; left: 0;"></div>
                        <div class="ab-orbit-ring" style="width: 70%; height: 70%; top: 15%; left: 15%;"></div>

                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div class="ab-hub ab-pulse-hub">
                                <i class="fa-solid fa-brain text-3xl text-amber-400 mb-1"></i>
                                <span class="text-[10px] font-bold text-white">HUB</span>
                            </div>
                        </div>

                        <!-- 8 Spokes around the orbit -->
                        <div class="ab-orbit-item border-purple-500 bg-purple-500/10" style="top: 2%; left: 50%; transform: translateX(-50%);">
                            <i class="fa-solid fa-dice text-purple-400"></i>
                        </div>
                        <div class="ab-orbit-item border-cyan-500 bg-cyan-500/10" style="top: 17%; right: 8%; transform: rotate(45deg);">
                            <i class="fa-solid fa-stamp text-cyan-400" style="transform: rotate(-45deg);"></i>
                        </div>
                        <div class="ab-orbit-item border-pink-500 bg-pink-500/10" style="top: 50%; right: 2%; transform: translateY(-50%);">
                            <i class="fa-solid fa-store text-pink-400"></i>
                        </div>
                        <div class="ab-orbit-item border-teal-500 bg-teal-500/10" style="bottom: 17%; right: 8%;">
                            <i class="fa-solid fa-rocket text-teal-400"></i>
                        </div>
                        <div class="ab-orbit-item border-emerald-500 bg-emerald-500/10" style="bottom: 2%; left: 50%; transform: translateX(-50%);">
                            <i class="fa-solid fa-landmark text-emerald-400"></i>
                        </div>
                        <div class="ab-orbit-item border-red-500 bg-red-500/10" style="bottom: 17%; left: 8%;">
                            <i class="fa-solid fa-hand-holding-heart text-red-400"></i>
                        </div>
                        <div class="ab-orbit-item border-blue-500 bg-blue-500/10" style="top: 50%; left: 2%; transform: translateY(-50%);">
                            <i class="fa-solid fa-layer-group text-blue-400"></i>
                        </div>
                        <div class="ab-orbit-item border-amber-500 bg-amber-500/10" style="top: 17%; left: 8%;">
                            <i class="fa-solid fa-coins text-amber-400"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAllModulesSection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.15s">
            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-purple-500/20">
                    <i class="fa-solid fa-cubes text-purple-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">The Ecosystem Map</h2>
                    <p class="text-zinc-500 text-xs">Modular smart contracts, one interconnected economy</p>
                </div>
            </div>

            <!-- DeFi Core -->
            <p class="text-zinc-500 text-[10px] uppercase font-bold mb-3 tracking-wider">DeFi Core</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                <div class="ab-module-pill bg-amber-500/5 border border-amber-500/20" onclick="window.navigateTo&&window.navigateTo('tokenomics')">
                    <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-coins text-amber-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">BKC Token</p>
                        <p class="text-zinc-500 text-[10px]">ERC-20 with activity-based minting. 200M cap.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-blue-500/5 border border-blue-500/20" onclick="window.navigateTo&&window.navigateTo('tokenomics')">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-water text-blue-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Liquidity Pool</p>
                        <p class="text-zinc-500 text-[10px]">Constant-product AMM for BNB/BKC trading.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-purple-500/5 border border-purple-500/20" onclick="window.navigateTo&&window.navigateTo('staking')">
                    <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-layer-group text-purple-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Staking Pool</p>
                        <p class="text-zinc-500 text-[10px]">Delegate BKC with time-locks. Earn BNB + BKC rewards.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-orange-500/5 border border-orange-500/20">
                    <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-fire text-orange-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Buyback Miner</p>
                        <p class="text-zinc-500 text-[10px]">Converts BNB fees into BKC via scarcity curve mining.</p>
                    </div>
                </div>
            </div>

            <!-- NFT Ecosystem -->
            <p class="text-zinc-500 text-[10px] uppercase font-bold mb-3 tracking-wider">NFT Ecosystem</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                <div class="ab-module-pill bg-pink-500/5 border border-pink-500/20" onclick="window.navigateTo&&window.navigateTo('store')">
                    <div class="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-gem text-pink-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">RewardBooster NFTs</p>
                        <p class="text-zinc-500 text-[10px]">4-tier NFTs (Diamond/Gold/Silver/Bronze) that reduce staking burn rate.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-pink-500/5 border border-pink-500/20" onclick="window.navigateTo&&window.navigateTo('store')">
                    <div class="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-store text-pink-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">NFT Pool</p>
                        <p class="text-zinc-500 text-[10px]">Bonding curve marketplace. Buy low, sell high.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-violet-500/5 border border-violet-500/20" onclick="window.navigateTo&&window.navigateTo('store')">
                    <div class="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-wand-magic-sparkles text-violet-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">NFT Fusion</p>
                        <p class="text-zinc-500 text-[10px]">Fuse 2 same-tier NFTs into 1 higher tier, or split down.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-teal-500/5 border border-teal-500/20" onclick="window.navigateTo&&window.navigateTo('rental')">
                    <div class="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-rocket text-teal-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Rental Manager</p>
                        <p class="text-zinc-500 text-[10px]">Rent NFT boosts from other users. AirBNFT marketplace.</p>
                    </div>
                </div>
            </div>

            <!-- Community & Services -->
            <p class="text-zinc-500 text-[10px] uppercase font-bold mb-3 tracking-wider">Community & Services</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                <div class="ab-module-pill bg-green-500/5 border border-green-500/20" onclick="window.navigateTo&&window.navigateTo('fortune')">
                    <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-dice text-green-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Fortune Pool</p>
                        <p class="text-zinc-500 text-[10px]">3-tier commit-reveal game. Win up to 4.5x your entry.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-cyan-500/5 border border-cyan-500/20" onclick="window.navigateTo&&window.navigateTo('agora')">
                    <div class="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-landmark text-cyan-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Agora</p>
                        <p class="text-zinc-500 text-[10px]">Decentralized social protocol. Posts, likes, follows on-chain.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-slate-500/5 border border-slate-500/20" onclick="window.navigateTo&&window.navigateTo('notary')">
                    <div class="w-8 h-8 rounded-lg bg-slate-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-stamp text-slate-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Notary</p>
                        <p class="text-zinc-500 text-[10px]">Certify documents on-chain. Immutable proof of existence.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-red-500/5 border border-red-500/20" onclick="window.navigateTo&&window.navigateTo('charity')">
                    <div class="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-hand-holding-heart text-red-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Charity Pool</p>
                        <p class="text-zinc-500 text-[10px]">Transparent fundraising. On-chain donation tracking.</p>
                    </div>
                </div>
            </div>

            <!-- Infrastructure -->
            <p class="text-zinc-500 text-[10px] uppercase font-bold mb-3 tracking-wider">Infrastructure & Governance</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div class="ab-module-pill bg-amber-500/5 border border-amber-500/20">
                    <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-brain text-amber-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">BackchainEcosystem</p>
                        <p class="text-zinc-500 text-[10px]">Master hub — fees, operators, tutors, reward splits.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-indigo-500/5 border border-indigo-500/20">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-landmark-dome text-indigo-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Governance</p>
                        <p class="text-zinc-500 text-[10px]">Progressive decentralization: Admin → Multisig → Timelock → DAO.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-sky-500/5 border border-sky-500/20">
                    <div class="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-faucet-drip text-sky-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">Testnet Faucet</p>
                        <p class="text-zinc-500 text-[10px]">Free BKC for testing on opBNB testnet.</p>
                    </div>
                </div>
                <div class="ab-module-pill bg-zinc-500/5 border border-zinc-500/20">
                    <div class="w-8 h-8 rounded-lg bg-zinc-500/15 flex items-center justify-center shrink-0"><i class="fa-solid fa-file-code text-zinc-400 text-sm"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium">IBackchain</p>
                        <p class="text-zinc-500 text-[10px]">Shared interfaces for all contract interactions.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderFeeSystemSection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.2s">
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-cyan-500/20">
                    <i class="fa-solid fa-arrows-split-up-and-left text-cyan-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">The Fee System</h2>
                    <p class="text-zinc-500 text-xs">How every action creates value for everyone</p>
                </div>
            </div>

            <p class="text-zinc-400 text-sm leading-relaxed mb-5">
                Every protocol action generates a small BNB fee. The smart contract automatically splits this fee among multiple beneficiaries — creating aligned incentives for users, builders, referrers, and the protocol.
            </p>

            <!-- Fee Flow -->
            <div class="ab-card bg-zinc-900/50 mb-5">
                <p class="text-zinc-500 text-[10px] uppercase font-bold mb-4 tracking-wider">Where Your Fees Go</p>
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-user text-zinc-300 text-sm"></i>
                    </div>
                    <div class="flex-1 text-sm text-white font-medium">User pays fee (BNB)</div>
                </div>
                <div class="ml-5 border-l-2 border-zinc-700 pl-4 py-1 text-[11px] text-zinc-500 mb-4">
                    <i class="fa-solid fa-arrow-down mr-1"></i> BackchainEcosystem splits automatically
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                        <p class="text-amber-400 text-lg font-extrabold">10%</p>
                        <p class="text-amber-400/80 text-[10px] font-bold uppercase">Tutor</p>
                        <p class="text-zinc-500 text-[10px]">Who referred you</p>
                    </div>
                    <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                        <p class="text-emerald-400 text-lg font-extrabold">10-20%</p>
                        <p class="text-emerald-400/80 text-[10px] font-bold uppercase">Operator</p>
                        <p class="text-zinc-500 text-[10px]">App builder</p>
                    </div>
                    <div class="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                        <p class="text-orange-400 text-lg font-extrabold">30-50%</p>
                        <p class="text-orange-400/80 text-[10px] font-bold uppercase">Buyback</p>
                        <p class="text-zinc-500 text-[10px]">Buy + burn BKC</p>
                    </div>
                    <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                        <p class="text-blue-400 text-lg font-extrabold">10-30%</p>
                        <p class="text-blue-400/80 text-[10px] font-bold uppercase">Treasury</p>
                        <p class="text-zinc-500 text-[10px]">Protocol growth</p>
                    </div>
                </div>
                <p class="text-zinc-600 text-[10px] text-center mt-3">Exact split varies by module. All percentages are immutable on-chain.</p>
            </div>

            <!-- Key Insight -->
            <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-lightbulb text-amber-400 mt-0.5"></i>
                    <div>
                        <p class="text-amber-400 font-bold text-sm">Everyone Wins</p>
                        <p class="text-zinc-400 text-xs leading-relaxed">
                            No tutor? → 10% is burned instead. No operator? → Operator share is burned. Every scenario either rewards a participant or makes BKC more scarce. The system has no leaks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderMiningSection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.25s">
            <div class="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-emerald-500/20">
                    <i class="fa-solid fa-hammer text-emerald-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Mining by Purchase</h2>
                    <p class="text-zinc-500 text-xs">Proof-of-Purchase: Using = Mining</p>
                </div>
            </div>

            <p class="text-zinc-400 text-sm leading-relaxed mb-5">
                In Backchain, <strong class="text-white">using the platform IS mining</strong>. When you buy an NFT Booster,
                the BuybackMiner converts the BNB spent into newly minted BKC tokens via a scarcity curve — the more that's been mined, the harder it gets, just like Bitcoin.
            </p>

            <!-- Mining Flow -->
            <div class="ab-card mb-5">
                <p class="text-zinc-500 text-[10px] uppercase font-bold mb-4 tracking-wider">How Mining Works</p>

                <div class="space-y-4">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span class="text-blue-400 font-bold">1</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-medium text-sm">You Buy an NFT Booster</p>
                            <p class="text-zinc-500 text-xs">From the bonding curve pool (Diamond, Gold, Silver, Bronze)</p>
                        </div>
                    </div>

                    <div class="flex justify-center"><div class="ab-flow-line"></div></div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <span class="text-emerald-400 font-bold">2</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-medium text-sm">BuybackMiner Converts BNB → BKC</p>
                            <p class="text-zinc-500 text-xs">Scarcity curve: earlier miners get more BKC per BNB</p>
                        </div>
                    </div>

                    <div class="flex justify-center"><div class="ab-flow-line"></div></div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span class="text-purple-400 font-bold">3</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-medium text-sm">Rewards Distributed</p>
                            <p class="text-zinc-500 text-xs">70% to stakers (proportional to pStake), 30% to treasury</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Distribution Cards -->
            <div class="grid grid-cols-2 gap-3">
                <div class="ab-card text-center bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30 p-4">
                    <div class="text-3xl font-black text-purple-400 mb-1">70%</div>
                    <p class="text-white font-bold text-sm">Staker Rewards</p>
                    <p class="text-zinc-500 text-[10px]">Distributed based on pStake weight</p>
                </div>
                <div class="ab-card text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 p-4">
                    <div class="text-3xl font-black text-blue-400 mb-1">30%</div>
                    <p class="text-white font-bold text-sm">Treasury</p>
                    <p class="text-zinc-500 text-[10px]">Funds ecosystem development</p>
                </div>
            </div>
        </div>
    `;
}

function renderGrowthPrograms() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.3s">
            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-violet-500/20">
                    <i class="fa-solid fa-rocket text-violet-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Growth Programs</h2>
                    <p class="text-zinc-500 text-xs">Two systems to grow the ecosystem</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Tutor System -->
                <div class="ab-card bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-graduation-cap text-amber-400 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm">Tutor System</p>
                            <p class="text-zinc-500 text-[10px]">Tutor new users, earn forever</p>
                        </div>
                    </div>
                    <p class="text-zinc-400 text-xs leading-relaxed mb-3">
                        Share your tutor link. When someone joins through it, they become your Tutter and you earn <strong class="text-white">10% of their BNB fees</strong> + <strong class="text-white">5% of their BKC claims</strong> — forever.
                    </p>
                    <div class="flex items-center gap-2">
                        <span class="ab-badge bg-amber-500/20 text-amber-400"><i class="fa-solid fa-percentage mr-1"></i>10% BNB</span>
                        <span class="ab-badge bg-amber-500/20 text-amber-400"><i class="fa-solid fa-percentage mr-1"></i>5% BKC</span>
                        <span class="ab-badge bg-zinc-700/50 text-zinc-400"><i class="fa-solid fa-infinity mr-1"></i>Forever</span>
                    </div>
                    <button onclick="window.navigateTo&&window.navigateTo('referral')" class="w-full mt-3 text-center text-xs text-amber-400 hover:text-amber-300 font-medium py-2 bg-amber-500/10 rounded-lg transition-colors">
                        Learn More <i class="fa-solid fa-arrow-right ml-1"></i>
                    </button>
                </div>

                <!-- Operator System -->
                <div class="ab-card bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-code text-emerald-400 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm">Operator System</p>
                            <p class="text-zinc-500 text-[10px]">Build an app, earn commissions</p>
                        </div>
                    </div>
                    <p class="text-zinc-400 text-xs leading-relaxed mb-3">
                        Build your own frontend, bot, or integration. Set your wallet as the <strong class="text-white">operator</strong> and earn <strong class="text-white">10-20% of every fee</strong> generated through your app. No registration needed.
                    </p>
                    <div class="flex items-center gap-2">
                        <span class="ab-badge bg-emerald-500/20 text-emerald-400"><i class="fa-solid fa-percentage mr-1"></i>10-20%</span>
                        <span class="ab-badge bg-zinc-700/50 text-zinc-400"><i class="fa-solid fa-lock-open mr-1"></i>Permissionless</span>
                    </div>
                    <button onclick="window.navigateTo&&window.navigateTo('operator')" class="w-full mt-3 text-center text-xs text-emerald-400 hover:text-emerald-300 font-medium py-2 bg-emerald-500/10 rounded-lg transition-colors">
                        Learn More <i class="fa-solid fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderWhyBackcoinSection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.35s">
            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-star text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Why Backchain?</h2>
                    <p class="text-zinc-500 text-xs">What makes this different</p>
                </div>
            </div>

            <div class="space-y-3">
                <div class="ab-card flex gap-4 items-start">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-users-slash text-amber-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">No VCs, No Pre-mine, No Insiders</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">35% of TGE (14M BKC) goes directly to the community via airdrop. 65% goes to the liquidity pool. No investors dumping tokens on you. The team earns the same way you do — by using the protocol.</p>
                    </div>
                </div>
                <div class="ab-card flex gap-4 items-start">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-bolt text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Real Utility, Not Vapor</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">Notarize legal documents. Play verifiably fair games. Trade NFTs on bonding curves. Rent boost power. Post on a censorship-resistant social network. Donate to transparent charities. These aren't promises — they're live contracts on opBNB.</p>
                    </div>
                </div>
                <div class="ab-card flex gap-4 items-start">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-chart-line text-purple-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Sustainable Yield, Not Inflation</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">Staking rewards come from real protocol fees (BNB) and mining activity — not from printing tokens. The more the ecosystem is used, the higher the real yield. No ponzinomics.</p>
                    </div>
                </div>
                <div class="ab-card flex gap-4 items-start">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-scale-balanced text-blue-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Aligned Incentives at Every Level</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">Users earn by staking. Tutors earn by inviting. Operators earn by building. The protocol earns by growing. No participant is extracting value from another — everyone benefits from usage growth.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTechStackSection() {
    return `
        <div class="ab-section ab-fade-up" style="animation-delay: 0.4s">
            <div class="flex items-center gap-3 mb-5">
                <div class="ab-icon-box bg-blue-500/20">
                    <i class="fa-solid fa-microchip text-blue-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Technology Stack</h2>
                    <p class="text-zinc-500 text-xs">Built on battle-tested infrastructure</p>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div class="ab-card text-center p-4">
                    <div class="h-8 flex items-center justify-center mb-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <span class="text-sm font-black text-white">B</span>
                        </div>
                    </div>
                    <p class="text-white font-bold text-xs">opBNB</p>
                    <p class="text-zinc-500 text-[10px]">BNB Chain L2 network</p>
                </div>
                <div class="ab-card text-center p-4">
                    <div class="h-8 flex items-center justify-center mb-2">
                        <i class="fa-solid fa-code text-2xl text-zinc-400"></i>
                    </div>
                    <p class="text-white font-bold text-xs">Solidity 0.8.28</p>
                    <p class="text-zinc-500 text-[10px]">Smart contracts</p>
                </div>
                <div class="ab-card text-center p-4">
                    <div class="h-8 flex items-center justify-center mb-2">
                        <i class="fa-brands fa-js text-2xl text-yellow-400/80"></i>
                    </div>
                    <p class="text-white font-bold text-xs">ethers.js v6</p>
                    <p class="text-zinc-500 text-[10px]">Blockchain interaction</p>
                </div>
                <div class="ab-card text-center p-4">
                    <img src="./assets/alchemy.svg" class="h-8 mx-auto mb-2 opacity-80" alt="Alchemy">
                    <p class="text-white font-bold text-xs">Alchemy</p>
                    <p class="text-zinc-500 text-[10px]">RPC infrastructure</p>
                </div>
                <div class="ab-card text-center p-4">
                    <img src="./assets/metamask_icon.png" class="h-8 mx-auto mb-2 opacity-80" alt="MetaMask">
                    <p class="text-white font-bold text-xs">MetaMask</p>
                    <p class="text-zinc-500 text-[10px]">Wallet connection</p>
                </div>
                <div class="ab-card text-center p-4">
                    <div class="h-8 flex items-center justify-center mb-2">
                        <i class="fa-solid fa-globe text-2xl text-cyan-400/80"></i>
                    </div>
                    <p class="text-white font-bold text-xs">Arweave / IPFS</p>
                    <p class="text-zinc-500 text-[10px]">Permanent storage</p>
                </div>
            </div>
        </div>
    `;
}

function renderCTASection() {
    return `
        <div class="ab-section ab-fade-up text-center bg-gradient-to-b from-amber-500/5 to-transparent" style="animation-delay: 0.45s">
            <img src="./assets/bkc_logo_3d.png" class="w-16 h-16 mx-auto mb-4 opacity-80" alt="BKC">

            <h2 class="text-2xl font-bold text-white mb-2">Ready to Join?</h2>
            <p class="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                Start earning airdrop points today. Stake, trade, play, or build — every action counts.
            </p>

            <div class="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <button onclick="window.navigateTo && window.navigateTo('airdrop')"
                    class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:scale-105 transition-transform">
                    <i class="fa-solid fa-parachute-box mr-2"></i>Join Airdrop
                </button>
                <button onclick="window.navigateTo && window.navigateTo('staking')"
                    class="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 hover:border-amber-500/50 transition-colors">
                    <i class="fa-solid fa-layer-group mr-2"></i>Start Staking
                </button>
                <button id="openWhitepaperBtn"
                    class="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 hover:border-cyan-500/50 transition-colors">
                    <i class="fa-solid fa-file-lines mr-2"></i>Whitepaper
                </button>
            </div>

            <div class="flex justify-center gap-6 pt-2">
                <a href="https://x.com/backcoin" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-white transition-colors text-lg" title="Twitter"><i class="fa-brands fa-twitter"></i></a>
                <a href="https://web.telegram.org/k/#@BackCoinorg" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-white transition-colors text-lg" title="Telegram"><i class="fa-brands fa-telegram"></i></a>
                <a href="https://www.youtube.com/@Backcoin" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-white transition-colors text-lg" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
            </div>
        </div>
    `;
}

function renderWhitepaperModal() {
    return `
        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden opacity-0 transition-opacity duration-300">
            <div class="ab-card bg-zinc-900 border-zinc-700 w-full max-w-md transform scale-95 transition-transform duration-300">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-white">Documentation</h3>
                    <button id="closeWhitepaperBtn" class="text-zinc-500 hover:text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div class="space-y-3">
                    <a href="./assets/backchain-tokenomics-v3.html" target="_blank"
                        class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 transition-all group">
                        <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-coins text-amber-400"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">Tokenomics Paper V3</p>
                            <p class="text-zinc-500 text-xs">Distribution, Mining & Scarcity Engines</p>
                        </div>
                        <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-white"></i>
                    </a>

                    <a href="./assets/backchain-ecosystem-whitepaper-v2.html" target="_blank"
                        class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-cyan-500/50 transition-all group">
                        <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-network-wired text-cyan-400"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Technical Whitepaper V2</p>
                            <p class="text-zinc-500 text-xs">Architecture, Contracts & Fee System</p>
                        </div>
                        <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-white"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================
//  3. MAIN RENDER & EVENT HANDLERS
// ==========================================================
function setupEventListeners() {
    const openBtn = document.getElementById('openWhitepaperBtn');
    const closeBtn = document.getElementById('closeWhitepaperBtn');
    const modal = document.getElementById('whitepaperModal');

    if (!modal) return;

    const openModal = () => {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.ab-card').classList.remove('scale-95');
            modal.querySelector('.ab-card').classList.add('scale-100');
        }, 10);
    };

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modal.querySelector('.ab-card').classList.remove('scale-100');
        modal.querySelector('.ab-card').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    openBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

export function render() {
    const container = document.getElementById('about');
    if (!container) return;

    injectAboutStyles();

    container.innerHTML = `
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${renderHeroSection()}
            ${renderPhilosophySection()}
            ${renderHubSpokeSection()}
            ${renderAllModulesSection()}
            ${renderFeeSystemSection()}
            ${renderMiningSection()}
            ${renderGrowthPrograms()}
            ${renderWhyBackcoinSection()}
            ${renderTechStackSection()}
            ${renderCTASection()}
            ${renderWhitepaperModal()}

            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community.</p>
                <p class="mt-1">BACKCHAIN &copy; 2024-2026</p>
            </div>
        </div>
    `;

    setupEventListeners();
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function cleanup() {
    // Remove old style tag if present
    const oldStyle = document.getElementById('about-styles-v4');
    if (oldStyle) oldStyle.remove();
}

// Legacy export for compatibility
export const AboutPage = {
    render,
    init: setupEventListeners,
    update: setupEventListeners
};
