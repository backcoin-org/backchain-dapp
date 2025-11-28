// js/pages/DexPage.js
// Mockup: BackSwap DEX

export const DexPage = {
    render: async (isActive) => {
        if (!isActive) return;
        const container = document.getElementById('dex');
        if (!container) return;

        container.innerHTML = `
            <div class="animate-fadeIn max-w-xl mx-auto py-12">
                
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-bold text-white mb-2">BackSwap DEX</h1>
                    <p class="text-zinc-400 text-sm">Instant, decentralized token swaps with low fees.</p>
                </div>

                <div class="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
                    
                    <div class="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6">
                        <div class="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm">
                            <i class="fa-solid fa-code-commit text-4xl text-amber-500 mb-4 animate-bounce"></i>
                            <h3 class="text-xl font-bold text-white mb-2">Under Development</h3>
                            <p class="text-zinc-400 text-sm mb-6">Our liquidity pools and router contracts are being audited. The DEX will launch in Phase 3.</p>
                            <button class="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Notify Me</button>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mb-4 px-2 opacity-50">
                        <span class="text-white font-medium">Swap</span>
                        <div class="flex gap-4 text-zinc-400">
                            <i class="fa-solid fa-chart-simple cursor-not-allowed"></i>
                            <i class="fa-solid fa-gear cursor-not-allowed"></i>
                        </div>
                    </div>

                    <div class="bg-black/30 rounded-2xl p-4 mb-2 border border-transparent hover:border-zinc-700 transition-colors opacity-50">
                        <div class="flex justify-between mb-2">
                            <span class="text-zinc-500 text-xs font-medium">You Pay</span>
                            <span class="text-zinc-500 text-xs">Balance: 2.45 ETH</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <input type="number" class="bg-transparent text-3xl text-white font-medium outline-none w-1/2" value="1.0" disabled>
                            <button class="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-1 px-3 rounded-full font-bold text-lg transition-colors cursor-not-allowed">
                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" class="w-6 h-6 rounded-full">
                                ETH
                                <i class="fa-solid fa-chevron-down text-xs ml-1"></i>
                            </button>
                        </div>
                        <div class="text-zinc-500 text-xs mt-2">$1,850.20</div>
                    </div>

                    <div class="relative h-2 opacity-50">
                        <div class="absolute left-1/2 -translate-x-1/2 -top-5 bg-zinc-900 border border-zinc-700 p-2 rounded-xl cursor-not-allowed">
                            <i class="fa-solid fa-arrow-down text-zinc-400"></i>
                        </div>
                    </div>

                    <div class="bg-black/30 rounded-2xl p-4 mt-2 border border-transparent hover:border-zinc-700 transition-colors opacity-50">
                        <div class="flex justify-between mb-2">
                            <span class="text-zinc-500 text-xs font-medium">You Receive</span>
                            <span class="text-zinc-500 text-xs">Balance: 0 BKC</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <input type="number" class="bg-transparent text-3xl text-white font-medium outline-none w-1/2" value="15420.5" disabled>
                            <button class="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-1 px-3 rounded-full font-bold text-lg transition-colors cursor-not-allowed">
                                <img src="assets/bkc_logo_3d.png" class="w-6 h-6 rounded-full">
                                BKC
                                <i class="fa-solid fa-chevron-down text-xs ml-1"></i>
                            </button>
                        </div>
                        <div class="text-zinc-500 text-xs mt-2">$1,845.10 <span class="text-amber-500/50">(-0.2%)</span></div>
                    </div>

                    <div class="flex justify-between items-center px-4 py-4 text-xs font-medium text-amber-500/70 opacity-50">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-circle-info"></i>
                            <span>1 ETH = 15,420.5 BKC</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-gas-pump"></i> $4.20
                        </div>
                    </div>

                    <button class="w-full bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed mb-2 opacity-50">
                        Connect Wallet
                    </button>

                </div>

                <div class="mt-8 grid grid-cols-2 gap-4 opacity-70">
                    <div class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                        <div class="text-zinc-500 text-xs uppercase mb-1">Total Liquidity</div>
                        <div class="text-white font-mono text-lg">$ --</div>
                    </div>
                    <div class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                        <div class="text-zinc-500 text-xs uppercase mb-1">24h Volume</div>
                        <div class="text-white font-mono text-lg">$ --</div>
                    </div>
                </div>

            </div>
        `;
    }
};