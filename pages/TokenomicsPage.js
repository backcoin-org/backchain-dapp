// pages/TokenomicsPage.js

const renderTokenomicsContent = () => {
    const container = document.getElementById('tokenomics'); // O ID da <section>
    if (!container) return;

    // Remove a margem negativa da <section> de pré-venda, se ela existir
    container.style.margin = ""; 

    container.innerHTML = `
        <div class="container mx-auto max-w-6xl py-8">
            <div class="text-center mb-16">
                <span class="text-sm font-bold text-amber-400 tracking-widest">TOKEN ECONOMICS</span>
                <h1 class="text-5xl md:text-6xl font-black mb-4 tracking-tight text-gradient">A Fair Launch Economy</h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
                    Designed for the community, funded by utility. Our tokenomics reflect our philosophy:
                    <strong>no team allocation, no private investors, 100% focused on the ecosystem.</strong>
                </p>

                <div class="mt-10">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 inline-block">
                        <i class="fa-solid fa-file-lines mr-2"></i> Download Whitepaper
                    </a>
                </div>
            </div>

            <section id="tge" class="mb-20">
                <div class="text-center mb-16">
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Initial Distribution (TGE)</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        An initial supply of <strong>40,000,000 $BKC</strong> will be generated, with a maximum cap of <strong>200,000,000 $BKC</strong> reachable only through platform utility.
                    </p>
                </div>
                
                <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div class="relative w-64 h-64 mx-auto">
                                <svg class="w-full h-full" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.91549430918953" fill="transparent" stroke="#52525b" stroke-width="4"></circle>
                                    <circle cx="18" cy="18" r="15.91549430918953" fill="transparent" stroke="#f59e0b" stroke-width="4" stroke-dasharray="65 35" stroke-dashoffset="0"></circle>
                                    <circle cx="18" cy="18" r="15.91549430918953" fill="transparent" stroke="#34d399" stroke-width="4" stroke-dasharray="35 65" stroke-dashoffset="-65"></circle>
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span class="text-4xl font-bold">40M</span>
                                    <span class="text-sm text-zinc-400">TGE Supply</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-8">
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-lg font-bold text-green-400">35% — Community Airdrop</span>
                                    <span class="font-mono text-zinc-400">14,000,000</span>
                                </div>
                                <p class="text-sm text-zinc-400">Distributed for free to community members who participate in growth and engagement campaigns.</p>
                            </div>
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-lg font-bold text-amber-400">65% — Liquidity & Treasury</span>
                                    <span class="font-mono text-zinc-400">26,000,000</span>
                                </div>
                                <p class="text-sm text-zinc-400">Allocated to provide initial liquidity on exchanges and for the DAO Treasury, which will fund ongoing marketing and development (funded by the NFT sale).</p>
                            </div>
                            <div class="pt-4 border-t border-border-color">
                                <p class="text-lg font-semibold text-white"><i class="fa-solid fa-hand-fist mr-2 text-amber-400"></i> Fair Launch</p>
                                <ul class="list-disc list-inside text-zinc-400 mt-2 space-y-1">
                                    <li><strong class="text-white">Zero</strong> team tokens.</li>
                                    <li><strong class="text-white">Zero</strong> investor tokens.</li>
                                    <li>100% self-funded development with over 10,000 hours invested.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div class="border-t border-border-color my-20"></div>

            <section id="pop" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-cyan-400 tracking-widest">UTILITY INFLATION</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Proof-of-Purchase Mining (PoP)</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        The remaining <strong>160,000,000 $BKC</strong> (the "Mint Pool") are not pre-mined. They can only be created when a user performs a real economic action, such as creating a Vesting Certificate.
                    </p>
                </div>
                <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                    <h3 class="text-2xl font-bold text-center mb-8">Distribution of Each Mined Block (PoP)</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div class="text-center bg-main p-6 rounded-lg border border-border-color">
                            <i class="fa-solid fa-users text-4xl text-purple-400 mb-3"></i>
                            <p class="text-3xl font-bold text-white">65%</p>
                            <p class="text-zinc-400">To the Delegator Pool (Stakers).</p>
                        </div>
                        <div class="text-center bg-main p-6 rounded-lg border border-border-color">
                            <i class="fa-solid fa-user-shield text-4xl text-cyan-400 mb-3"></i>
                            <p class="text-3xl font-bold text-white">15%</p>
                            <p class="text-zinc-400">To the selected Validator (Miner).</p>
                        </div>
                        <div class="text-center bg-main p-6 rounded-lg border border-border-color">
                            <i class="fa-solid fa-gem text-4xl text-green-400 mb-3"></i>
                            <p class="text-3xl font-bold text-white">10%</p>
                            <p class="text-zinc-400">Vesting Bonus for the Buyer.</p>
                        </div>
                        <div class="text-center bg-main p-6 rounded-lg border border-border-color">
                            <i class="fa-solid fa-landmark text-4xl text-amber-400 mb-3"></i>
                            <p class="text-3xl font-bold text-white">10%</p>
                            <p class="text-zinc-400">To the DAO Treasury.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div class="border-t border-border-color my-20"></div>

            <section id="utility" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-green-400 tracking-widest">TOKEN UTILITY</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">$BKC: The Ecosystem's Fuel</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        $BKC is fundamental to all interactions within the platform, creating a constant demand cycle.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-6">
                            <i class="fa-solid fa-shield-halved text-3xl text-purple-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">Staking (pStake)</h3>
                        <p class="text-zinc-400">Delegate $BKC to validators to earn passive rewards. pStake (stake power) increases with lock time (up to 10 years).</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-6">
                            <i class="fa-solid fa-user-shield text-3xl text-cyan-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">Run a Validator</h3>
                        <p class="text-zinc-400">Lock $BKC (dynamic stake) for 5 years to become a validator, process transactions, and earn PoP Mining rewards.</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                            <i class="fa-solid fa-store text-3xl text-amber-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">Booster Market</h3>
                        <p class="text-zinc-400">$BKC is the currency used to buy and sell Booster NFTs in the native liquidity pool, allowing users to trade their reward multipliers.</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
                            <i class="fa-solid fa-dice text-3xl text-green-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">Decentralized Actions</h3>
                        <p class="text-zinc-400">Creators must lock $BKC as stake to start Actions. Participants use $BKC to enter sports lotteries or support charitable causes.</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-6">
                            <i class="fa-solid fa-id-card-clip text-3xl text-blue-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">Vesting Certificates</h3>
                        <p class="text-zinc-400">The primary 'Proof-of-Purchase' action. Lock $BKC in a 5-year Vesting Certificate to mint new tokens and earn a 10% bonus.</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
                            <i class="fa-solid fa-landmark text-3xl text-red-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">Governance (DAO)</h3>
                        <p class="text-zinc-400">$BKC will be used to vote on proposals that control the Treasury and the protocol's future, ensuring full community control.</p>
                    </div>
                </div>
            </section>

            <div class="border-t border-border-color my-20"></div>

            <section id="locking" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-purple-400 tracking-widest">VALUE MECHANICS</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Locking Mechanisms & Fee Redirection</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        The system is designed for maximum token lock-up. Platform utility actively removes tokens from circulation, sending them to the Treasury or to Stakers.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-sidebar border border-border-color rounded-xl p-8">
                        <h3 class="text-2xl font-bold mb-6"><i class="fa-solid fa-lock mr-3 text-purple-400"></i> Long-Term Locking</h3>
                        <ul class="space-y-4">
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Delegator pStake:</strong> Locks from 1 day up to 10 years.</div></li>
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Validator Stake:</strong> Mandatory 5-year lock.</div></li>
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Vesting Certificates:</strong> 5-year lock for the principal amount and the bonus.</div></li>
                        </ul>
                    </div>
                    <div class="bg-sidebar border border-border-color rounded-xl p-8">
                        <h3 class="text-2xl font-bold mb-6"><i class="fa-solid fa-fire-alt mr-3 text-amber-400"></i> Fee Collection (Redirection)</h3>
                        <ul class="space-y-4">
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Staking Fees:</strong> 0.5% (delegate) and 1% (ontime unstake) go to the Treasury.</div></li>
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Penalties:</strong> 50% (force unstake) and 50% (early vesting) go to the Treasury.</div></li>
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Action/NFT Fees:</strong> Fees from Actions and NFT sales are split between Stakers and the Treasury.</div></li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    `;
};

export const TokenomicsPage = {
    render() {
        renderTokenomicsContent();
    },
    init() {
        // Initialization logic, if needed (e.g., interactive charts)
    },
    update(isConnected) {
        // Update logic, if needed
    }
};