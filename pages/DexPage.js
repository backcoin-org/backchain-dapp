// js/pages/DexPage.js
// ✅ VERSÃO "PRO" ATUALIZADA: Com Arbitrum (ARB) + UI Avançada + Mining Rewards

export const DexPage = {
    // ⚙️ ESTADO GLOBAL
    state: {
        tokens: {
            ETH: { name: 'Ethereum', symbol: 'ETH', balance: 5.45, price: 3050.00, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026' },
            USDT: { name: 'Tether USD', symbol: 'USDT', balance: 12500.00, price: 1.00, logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=026' },
            ARB: { name: 'Arbitrum', symbol: 'ARB', balance: 2450.00, price: 1.10, logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026' }, // 🆕 Adicionado
            WBTC: { name: 'Wrapped BTC', symbol: 'WBTC', balance: 0.15, price: 62000.00, logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026' },
            MATIC: { name: 'Polygon', symbol: 'MATIC', balance: 5000.00, price: 0.85, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=026' },
            BNB: { name: 'BNB Chain', symbol: 'BNB', balance: 12.50, price: 580.00, logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026' },
            BKC: { name: 'Backcoin', symbol: 'BKC', balance: 1500.00, price: 0.12, logo: 'assets/bkc_logo_3d.png', isNative: true }
        },
        settings: {
            slippage: 0.5, // %
            deadline: 20 // min
        },
        swap: {
            tokenIn: 'ETH',
            tokenOut: 'BKC',
            amountIn: '',
            loading: false
        },
        mining: {
            rate: 0.05 // 5% da taxa vira BKC (Cashback de Mineração)
        }
    },

    // 🔄 LÓGICA DE CÁLCULO
    calculate: () => {
        const { tokens, swap, mining } = DexPage.state;
        if (!swap.amountIn || parseFloat(swap.amountIn) === 0) return null;

        const tIn = tokens[swap.tokenIn];
        const tOut = tokens[swap.tokenOut];
        const valIn = parseFloat(swap.amountIn);

        // Valor em USD
        const usdValue = valIn * tIn.price;
        
        // Taxas (0.3% Padrão DEX)
        const feeUsd = usdValue * 0.003;
        const netUsd = usdValue - feeUsd;

        // Mineração (Reward do Ecossistema: Taxa convertida em BKC)
        // Se estiver comprando BKC, o reward é somado, se for outro token, é calculado no preço do BKC
        const bkcPrice = tokens['BKC'].price;
        const miningRewardBkcs = (feeUsd * mining.rate) / bkcPrice;

        // Saída
        const amountOut = netUsd / tOut.price;
        
        // Price Impact Simulado (Quanto maior a troca, maior o impacto visual)
        const priceImpact = Math.min((usdValue / 100000) * 100, 5.0).toFixed(2); 

        return {
            amountOut: amountOut,
            usdValue: usdValue,
            feeUsd: feeUsd,
            miningReward: miningRewardBkcs,
            priceImpact: priceImpact,
            rate: tIn.price / tOut.price
        };
    },

    // 🖌️ RENDERIZAÇÃO
    render: async (isActive) => {
        if (!isActive) return;
        const container = document.getElementById('dex');
        if (!container) return;

        container.innerHTML = `
            <div class="animate-fadeIn min-h-screen flex items-center justify-center py-12 px-4">
                
                <div class="w-full max-w-[480px] bg-[#131313] border border-zinc-800 rounded-3xl p-2 shadow-2xl relative">
                    
                    <div class="flex justify-between items-center p-4 mb-2">
                        <div class="flex gap-4 text-zinc-400 font-medium text-sm">
                            <span class="text-white border-b-2 border-amber-500 pb-1 cursor-pointer">Swap</span>
                            <span class="hover:text-white cursor-pointer transition-colors">Limit</span>
                            <span class="hover:text-white cursor-pointer transition-colors">Buy Crypto</span>
                        </div>
                        <div class="flex gap-3 text-zinc-400">
                             <div class="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full border border-amber-500/20" title="Mining Rewards Active">
                                <i class="fa-solid fa-pickaxe"></i> Mining On
                            </div>
                            <button class="hover:text-white transition-colors"><i class="fa-solid fa-gear"></i></button>
                        </div>
                    </div>

                    <div class="bg-[#1b1b1b] rounded-2xl p-4 border border-transparent hover:border-zinc-700 transition-colors group">
                        <div class="flex justify-between text-zinc-500 text-xs mb-2">
                            <span>You pay</span>
                            <span class="cursor-pointer hover:text-amber-500 transition-colors" id="btn-max-in">Balance: <span id="bal-in">0.00</span></span>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <input type="number" id="input-in" placeholder="0" class="bg-transparent text-3xl text-white font-medium outline-none w-full placeholder-zinc-600 appearance-none">
                            <button id="btn-token-in" class="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#363636] text-white py-1.5 px-3 rounded-full font-bold text-lg transition-all shrink-0 shadow-lg border border-zinc-700/50">
                                <span id="img-in-container"></span>
                                <span id="symbol-in">ETH</span>
                                <i class="fa-solid fa-chevron-down text-xs ml-1 text-zinc-400"></i>
                            </button>
                        </div>
                        <div class="flex justify-between text-zinc-500 text-xs mt-2 h-4">
                            <span id="usd-in">$0.00</span>
                        </div>
                    </div>

                    <div class="relative h-1 z-10">
                        <div id="btn-switch" class="absolute left-1/2 -translate-x-1/2 -top-4 bg-[#131313] border-[4px] border-[#131313] rounded-xl p-1 cursor-pointer group">
                            <div class="bg-[#2c2c2c] group-hover:bg-zinc-700 p-2 rounded-lg transition-colors border border-zinc-700/50">
                                <i class="fa-solid fa-arrow-down text-zinc-400 group-hover:text-white text-sm transition-colors"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#1b1b1b] rounded-2xl p-4 mt-1 border border-transparent hover:border-zinc-700 transition-colors">
                        <div class="flex justify-between text-zinc-500 text-xs mb-2">
                            <span>You receive</span>
                            <span>Balance: <span id="bal-out">0.00</span></span>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <input type="text" id="input-out" placeholder="0" disabled class="bg-transparent text-3xl text-zinc-300 font-medium outline-none w-full placeholder-zinc-600 cursor-default">
                            <button id="btn-token-out" class="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#363636] text-white py-1.5 px-3 rounded-full font-bold text-lg transition-all shrink-0 shadow-lg border border-zinc-700/50">
                                <span id="img-out-container"></span>
                                <span id="symbol-out">BKC</span>
                                <i class="fa-solid fa-chevron-down text-xs ml-1 text-zinc-400"></i>
                            </button>
                        </div>
                        <div class="flex justify-between text-zinc-500 text-xs mt-2 h-4">
                            <span id="usd-out">$0.00</span>
                            <span id="price-impact" class="hidden text-amber-500 font-medium text-[10px] bg-amber-500/10 px-1 rounded"></span>
                        </div>
                    </div>

                    <div id="swap-details" class="hidden mt-3 px-3 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 animate-fadeIn">
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-zinc-400 flex items-center gap-1"><i class="fa-solid fa-gas-pump text-xs"></i> Network Cost</span>
                            <span class="text-white">~$0.25 (L2)</span>
                        </div>
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-zinc-400">Protocol Fee</span>
                            <span class="text-white" id="fee-display">$0.00</span>
                        </div>
                        <div class="h-px bg-amber-500/20 my-2"></div>
                        <div class="flex justify-between items-center">
                            <span class="text-amber-500 font-bold text-sm flex items-center gap-2">
                                <i class="fa-solid fa-gift animate-pulse"></i> Mining Reward
                            </span>
                            <span class="text-amber-400 font-mono font-bold" id="mining-reward-display">+0.00 BKC</span>
                        </div>
                    </div>

                    <button id="btn-swap" class="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl transition-all duration-300 shadow-lg transform active:scale-[0.99] cursor-not-allowed" disabled>
                        Enter an amount
                    </button>

                </div>

                <div id="token-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div class="bg-[#131313] w-full max-w-md rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div class="p-5 border-b border-zinc-800">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-white font-bold text-lg">Select a token</h3>
                                <button id="close-modal" class="text-zinc-400 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                            </div>
                            <div class="relative">
                                <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                                <input type="text" placeholder="Search name or paste address" class="w-full bg-[#1b1b1b] text-white pl-10 pr-4 py-3 rounded-xl outline-none border border-zinc-800 focus:border-amber-500/50 transition-colors placeholder-zinc-600">
                            </div>
                            <div class="flex gap-2 mt-3">
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="ETH">ETH</button>
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="ARB">ARB</button>
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="USDT">USDT</button>
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="BKC">BKC</button>
                            </div>
                        </div>
                        
                        <div id="token-list" class="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            </div>
                    </div>
                </div>

            </div>
        `;

        DexPage.updateUI();
        DexPage.bindEvents();
    },

    // ⚡ ATUALIZAÇÃO DA UI
    updateUI: () => {
        const { tokens, swap } = DexPage.state;
        const tIn = tokens[swap.tokenIn];
        const tOut = tokens[swap.tokenOut];

        // Atualiza Botões de Token
        const setTokenBtn = (id, token) => {
            document.getElementById(`symbol-${id}`).innerText = token.symbol;
            const imgContainer = document.getElementById(`img-${id}-container`);
            
            // Usa ícone se existir
            if(token.logo) {
                imgContainer.innerHTML = `<img src="${token.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`;
            } else {
                imgContainer.innerHTML = `<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${token.symbol[0]}</div>`;
            }
        };

        setTokenBtn('in', tIn);
        setTokenBtn('out', tOut);

        // Atualiza Saldos
        document.getElementById('bal-in').innerText = tIn.balance.toFixed(4);
        document.getElementById('bal-out').innerText = tOut.balance.toFixed(4);

        // Lógica de Inputs e Botão
        const calc = DexPage.calculate();
        const btnSwap = document.getElementById('btn-swap');
        const detailsPanel = document.getElementById('swap-details');
        
        // Verifica se o input está vazio
        if (!swap.amountIn) {
            document.getElementById('input-out').value = '';
            document.getElementById('usd-in').innerText = '$0.00';
            document.getElementById('usd-out').innerText = '$0.00';
            detailsPanel.classList.add('hidden');
            btnSwap.innerText = 'Enter an amount';
            btnSwap.className = "w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed";
            btnSwap.disabled = true;
        } 
        // Verifica saldo
        else if (parseFloat(swap.amountIn) > tIn.balance) {
            btnSwap.innerText = `Insufficient ${tIn.symbol} balance`;
            btnSwap.className = "w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30";
            btnSwap.disabled = true;
            detailsPanel.classList.add('hidden');
        } 
        // Estado Válido
        else if (calc) {
            document.getElementById('input-out').value = calc.amountOut.toFixed(6);
            document.getElementById('usd-in').innerText = `~$${calc.usdValue.toFixed(2)}`;
            document.getElementById('usd-out').innerText = `~$${(calc.usdValue - calc.feeUsd).toFixed(2)}`;
            
            // Detalhes
            detailsPanel.classList.remove('hidden');
            document.getElementById('fee-display').innerText = `$${calc.feeUsd.toFixed(2)}`;
            document.getElementById('mining-reward-display').innerText = `+${calc.miningReward.toFixed(4)} BKC`;

            // Price Impact
            const piEl = document.getElementById('price-impact');
            if (parseFloat(calc.priceImpact) > 2) {
                piEl.classList.remove('hidden');
                piEl.innerText = `Price Impact: -${calc.priceImpact}%`;
            } else {
                piEl.classList.add('hidden');
            }

            // Botão Ativo
            btnSwap.innerHTML = swap.loading ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...' : 'Swap';
            btnSwap.className = "w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20";
            btnSwap.disabled = swap.loading;
        }
    },

    // 🎮 EVENTOS
    bindEvents: () => {
        // Input Change
        document.getElementById('input-in').addEventListener('input', (e) => {
            DexPage.state.swap.amountIn = e.target.value;
            DexPage.updateUI();
        });

        // Max Button
        document.getElementById('btn-max-in').addEventListener('click', () => {
            const bal = DexPage.state.tokens[DexPage.state.swap.tokenIn].balance;
            DexPage.state.swap.amountIn = bal.toString();
            document.getElementById('input-in').value = bal;
            DexPage.updateUI();
        });

        // Switch Tokens
        document.getElementById('btn-switch').addEventListener('click', () => {
            const temp = DexPage.state.swap.tokenIn;
            DexPage.state.swap.tokenIn = DexPage.state.swap.tokenOut;
            DexPage.state.swap.tokenOut = temp;
            
            DexPage.state.swap.amountIn = ''; 
            document.getElementById('input-in').value = '';
            
            DexPage.updateUI();
        });

        // Swap Action
        document.getElementById('btn-swap').addEventListener('click', async () => {
            const btn = document.getElementById('btn-swap');
            if (btn.disabled) return;

            DexPage.state.swap.loading = true;
            DexPage.updateUI();

            // Simulação de delay de rede
            await new Promise(r => setTimeout(r, 1500));

            // Executar Swap
            const calc = DexPage.calculate();
            const { tokens, swap } = DexPage.state;
            
            // Atualizar Saldos
            tokens[swap.tokenIn].balance -= parseFloat(swap.amountIn);
            tokens[swap.tokenOut].balance += calc.amountOut;
            tokens['BKC'].balance += calc.miningReward; // Mineração

            // Resetar
            DexPage.state.swap.loading = false;
            DexPage.state.swap.amountIn = '';
            document.getElementById('input-in').value = '';
            
            // Notificação Visual
            btn.className = "w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]";
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Swap Success! +${calc.miningReward.toFixed(2)} BKC Mined!`;
            
            // Confetti effect (se tiver biblioteca) ou apenas delay
            setTimeout(() => {
                DexPage.updateUI();
            }, 3000);
        });

        // Modals Logic
        const openModal = (direction) => { // direction: 'in' or 'out'
            const modal = document.getElementById('token-modal');
            const list = document.getElementById('token-list');
            modal.classList.remove('hidden');

            // Render List
            const renderList = () => {
                list.innerHTML = Object.values(DexPage.state.tokens).map(t => {
                    const isSelected = DexPage.state.swap[`token${direction === 'in' ? 'In' : 'Out'}`] === t.symbol;
                    const isDisabled = DexPage.state.swap[`token${direction === 'in' ? 'Out' : 'In'}`] === t.symbol; 
                    
                    if (isDisabled) return ''; 

                    return `
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${isSelected ? 'opacity-50 pointer-events-none' : ''}" data-symbol="${t.symbol}">
                            <div class="flex items-center gap-3">
                                <img src="${t.logo}" class="w-8 h-8 rounded-full bg-zinc-800" onerror="this.src='https://via.placeholder.com/32'">
                                <div>
                                    <div class="text-white font-bold text-sm">${t.symbol}</div>
                                    <div class="text-zinc-500 text-xs">${t.name}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-white text-sm font-medium">${t.balance.toFixed(4)}</div>
                                ${t.isNative ? '<i class="fa-solid fa-star text-[10px] text-amber-500"></i>' : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                // Bind Clicks
                document.querySelectorAll('.token-item').forEach(item => {
                    item.addEventListener('click', () => {
                        DexPage.state.swap[`token${direction === 'in' ? 'In' : 'Out'}`] = item.dataset.symbol;
                        modal.classList.add('hidden');
                        DexPage.updateUI();
                    });
                });
            };
            
            renderList();

            // Quick Tokens Logic
            document.querySelectorAll('.quick-token').forEach(qt => {
                qt.onclick = () => {
                    DexPage.state.swap[`token${direction === 'in' ? 'In' : 'Out'}`] = qt.dataset.symbol;
                    modal.classList.add('hidden');
                    DexPage.updateUI();
                };
            });
        };

        document.getElementById('btn-token-in').addEventListener('click', () => openModal('in'));
        document.getElementById('btn-token-out').addEventListener('click', () => openModal('out'));
        document.getElementById('close-modal').addEventListener('click', () => document.getElementById('token-modal').classList.add('hidden'));
        
        document.getElementById('token-modal').addEventListener('click', (e) => {
            if (e.target.id === 'token-modal') e.target.classList.add('hidden');
        });
    }
};