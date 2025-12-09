// js/pages/CreditCardPage.js
// Mockup: BKC Crypto Credit Card

// Inject Styles locally
const style = document.createElement('style');
style.innerHTML = `
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;
document.head.appendChild(style);

export const CreditCardPage = {
    render: async (isActive) => {
        if (!isActive) return;
        const container = document.getElementById('creditcard');
        if (!container) return;

        container.innerHTML = `
            <div class="animate-fadeIn max-w-5xl mx-auto py-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <i class="fa-solid fa-credit-card text-amber-500"></i> BKC Black Card
                        </h1>
                        <p class="text-zinc-400 text-sm">Spend your crypto anywhere. Earn 3% Cashback in $BKC instantly.</p>
                    </div>
                    <div class="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Coming Soon
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    <div class="space-y-8">
                        <div class="relative w-full aspect-[1.586/1] max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500 cursor-pointer group perspective-1000">
                            <div class="absolute inset-0 card-gradient rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
                                <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div class="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
                                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>

                                <div class="relative z-10 p-6 h-full flex flex-col justify-between">
                                    <div class="flex justify-between items-start">
                                        <img src="assets/bkc_logo_3d.png" class="w-12 h-12 opacity-90" alt="Logo">
                                        <div class="text-white/50 font-mono text-xs tracking-widest">DEBIT</div>
                                    </div>
                                    
                                    <div class="my-auto pl-2">
                                        <div class="w-12 h-9 rounded-md chip mb-4 shadow-inner border border-yellow-600/30"></div>
                                        <div class="flex gap-4">
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">****</div>
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">****</div>
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">****</div>
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">4288</div>
                                        </div>
                                    </div>

                                    <div class="flex justify-between items-end">
                                        <div>
                                            <div class="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Card Holder</div>
                                            <div class="text-white font-medium tracking-wide uppercase">Early Adopter</div>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <div class="text-[8px] text-zinc-400 uppercase tracking-wider mb-1">Valid Thru</div>
                                            <div class="text-white font-mono">12/28</div>
                                        </div>
                                        <i class="fa-brands fa-cc-visa text-3xl text-white/80 ml-4"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="glass-mockup p-4 rounded-xl text-center">
                                <i class="fa-solid fa-rotate-left text-2xl text-green-400 mb-2"></i>
                                <div class="text-lg font-bold text-white">3% Back</div>
                                <div class="text-xs text-zinc-500">On every purchase</div>
                            </div>
                            <div class="glass-mockup p-4 rounded-xl text-center">
                                <i class="fa-solid fa-globe text-2xl text-blue-400 mb-2"></i>
                                <div class="text-lg font-bold text-white">No Fees</div>
                                <div class="text-xs text-zinc-500">International usage</div>
                            </div>
                        </div>
                        
                        <div class="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                            <h4 class="text-amber-400 font-bold text-sm mb-2"><i class="fa-solid fa-star mr-2"></i> Join the Waitlist</h4>
                            <p class="text-zinc-400 text-xs mb-4">Be among the first to receive the physical metal card. Top 1000 holders get priority shipping.</p>
                            <button class="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-lg transition-colors cursor-not-allowed opacity-80" disabled>
                                Reserve Spot (Opens Soon)
                            </button>
                        </div>
                    </div>

                    <div class="glass-mockup rounded-2xl p-6 h-full flex flex-col">
                        <h3 class="text-white font-bold mb-6 flex items-center gap-2">
                            <i class="fa-solid fa-mobile-screen text-zinc-500"></i> App Simulation
                        </h3>

                        <div class="bg-zinc-800 rounded-xl p-6 mb-6 text-center border border-zinc-700">
                            <div class="text-zinc-400 text-xs uppercase tracking-wider mb-1">Card Balance</div>
                            <div class="text-3xl font-bold text-white mb-2">$ 4,250.00</div>
                            <div class="text-xs text-green-400 font-mono flex items-center justify-center gap-1">
                                <i class="fa-solid fa-arrow-trend-up"></i> +$128.50 (Cashback this month)
                            </div>
                        </div>

                        <div class="flex-1">
                            <h4 class="text-zinc-500 text-xs font-bold uppercase mb-4 px-1">Recent Activity</h4>
                            <div class="space-y-2">
                                ${generateMockTransaction("Starbucks Coffee", "Today, 8:30 AM", "- $5.40", "+ 15 BKC", "fa-mug-hot")}
                                ${generateMockTransaction("Uber Ride", "Yesterday, 6:15 PM", "- $24.50", "+ 82 BKC", "fa-car")}
                                ${generateMockTransaction("Netflix Subscription", "Oct 24, 2025", "- $15.99", "+ 53 BKC", "fa-film")}
                                ${generateMockTransaction("Amazon Purchase", "Oct 22, 2025", "- $142.00", "+ 475 BKC", "fa-box-open")}
                                ${generateMockTransaction("Shell Station", "Oct 20, 2025", "- $45.00", "+ 150 BKC", "fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
};

function generateMockTransaction(name, date, amount, cashback, icon) {
    return `
        <div class="transaction-row flex items-center justify-between p-3 rounded-lg cursor-default transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <div class="text-white text-sm font-medium">${name}</div>
                    <div class="text-zinc-500 text-xs">${date}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-white text-sm font-bold">${amount}</div>
                <div class="text-amber-500 text-xs font-mono">${cashback}</div>
            </div>
        </div>
    `;
}