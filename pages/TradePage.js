// pages/TradePage.js
// ✅ PRODUCTION V1.0 — Trade BKC/ETH via Uniswap V3

const ethers = window.ethers;

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { openConnectModal } from '../modules/wallet.js';
import { getBkcPrice, formatUsd } from '../modules/price-service.js';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const SWAP_ROUTER = "0x101F443B4d1b059569D643917553c771E1b9663E";
const WETH9       = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const BKC_TOKEN   = "0x8264fa8C238Ca723A5D55D77E7aeC1271bd7E737";
const POOL        = "0x4A434eCcA4c53e79834d74Be0DA6c224b92f0B35";
const FEE_TIER    = 3000;
const EXPLORER    = "https://sepolia.arbiscan.io";
const PRICE_REFRESH_MS = 15000;
const DEFAULT_SLIPPAGE = 1;
const GAS_RESERVE = ethers.parseEther("0.005");

// ════════════════════════════════════════════════════════════════════════════
// ABIs
// ════════════════════════════════════════════════════════════════════════════

const SWAP_ROUTER_ABI = [
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
    'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)',
    'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
];

const WETH_ABI = [
    'function deposit() payable',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
];

const ERC20_ABI = [
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
];

const POOL_ABI = [
    'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)',
    'function liquidity() view returns (uint128)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
];

// ════════════════════════════════════════════════════════════════════════════
// LOCAL STATE
// ════════════════════════════════════════════════════════════════════════════

const TS = {
    direction: 'buy',          // 'buy' = BNB→BKC, 'sell' = BKC→BNB
    inputAmount: '',
    estimatedOutput: 0n,
    estimatedOutputFormatted: '0',
    priceImpact: 0,

    sqrtPriceX96: 0n,
    liquidity: 0n,
    wethIsToken0: false,
    priceBkcPerEth: 0,
    priceEthPerBkc: 0,

    slippage: DEFAULT_SLIPPAGE,
    showSettings: false,

    isSwapping: false,
    swapPhase: '',

    priceRefreshTimer: null,
    debounceTimer: null,

    ethBalance: 0n,
    bkcBalance: 0n,

    // Chart
    chartRange: '1H',
    priceHistory: [],        // [{ t: timestamp_ms, p: bkcUsd, e: bkcEth }]
};

const CHART_STORAGE_KEY = 'bkc_price_history';
const CHART_MAX_POINTS = 5000;   // ~20h at 15s intervals
const CHART_RANGES = {
    '1H':  3600_000,
    '4H':  14400_000,
    '24H': 86400_000,
    'ALL': Infinity,
};

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

function injectStyles() {
    if (document.getElementById('trade-page-styles')) return;
    const s = document.createElement('style');
    s.id = 'trade-page-styles';
    s.textContent = `
        .trade-shell {
            max-width: 480px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .trade-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem 0.75rem;
        }
        .trade-header h3 { font-size: 1.15rem; font-weight: 600; color: #fff; margin: 0; }
        .trade-settings-btn {
            background: none; border: none; color: #98a1c0; cursor: pointer;
            font-size: 1.1rem; padding: 4px; transition: color 0.2s;
        }
        .trade-settings-btn:hover { color: #fff; }

        /* Settings panel */
        .trade-settings-panel {
            max-height: 0; overflow: hidden; transition: max-height 0.3s ease;
            padding: 0 1.5rem; background: #1a1b1f;
        }
        .trade-settings-panel.open { max-height: 120px; padding-bottom: 1rem; }
        .trade-slippage-row {
            display: flex; gap: 6px; align-items: center; margin-top: 8px;
        }
        .trade-slippage-row label { font-size: 0.8rem; color: #98a1c0; margin-right: auto; }
        .trade-slip-btn {
            padding: 5px 12px; border-radius: 12px; border: 1px solid #2c2f36;
            background: #212429; color: #98a1c0; font-size: 0.8rem; cursor: pointer;
            transition: all 0.15s;
        }
        .trade-slip-btn:hover { border-color: #4c82fb; color: #fff; }
        .trade-slip-btn.active { background: #4c82fb; color: #fff; border-color: #4c82fb; }
        .trade-slip-custom {
            width: 60px; padding: 5px 8px; border-radius: 12px; border: 1px solid #2c2f36;
            background: #212429; color: #fff; font-size: 0.8rem; text-align: center; outline: none;
        }
        .trade-slip-custom:focus { border-color: #4c82fb; }

        /* Balance + MAX row */
        .trade-bal-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-top: 6px; font-size: 0.8rem; color: #98a1c0;
        }
        .trade-max-btn {
            background: none; border: none; color: #f59e0b; cursor: pointer;
            font-size: 0.75rem; font-weight: 600; padding: 2px 6px;
            border-radius: 4px; transition: background 0.15s;
        }
        .trade-max-btn:hover { background: rgba(245,158,11,0.15); }

        /* Info section */
        .trade-info {
            padding: 0.75rem 1.5rem; display: flex; flex-direction: column; gap: 4px;
            font-size: 0.8rem; color: #98a1c0;
        }
        .trade-info-row { display: flex; justify-content: space-between; }
        .trade-impact-warn { color: #f59e0b; }
        .trade-impact-danger { color: #ef4444; }

        /* Pool info bar */
        .trade-pool-info {
            margin-top: 12px; padding: 12px 16px; border-radius: 16px;
            background: #212429; border: 1px solid #2c2f36;
            font-size: 0.75rem; color: #98a1c0;
            display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center;
        }
        .trade-pool-info a { color: #4c82fb; text-decoration: none; }
        .trade-pool-info a:hover { text-decoration: underline; }
        .trade-uni-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 2px 8px; border-radius: 8px; background: rgba(255,0,122,0.1);
            color: #ff007a; font-size: 0.7rem; font-weight: 600;
        }

        /* Swap button states */
        .execute-trade-btn.loading {
            background: #2c2f36; color: #98a1c0; cursor: wait;
        }
        .execute-trade-btn.warning {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            box-shadow: 0 4px 12px rgba(245,158,11,0.3);
        }

        /* Price pulse */
        @keyframes trade-pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .trade-price-pulse { animation: trade-pulse 0.6s ease; }

        /* Output shimmer */
        .trade-output-loading {
            background: linear-gradient(90deg, #2c2f36 25%, #40444f 50%, #2c2f36 75%);
            background-size: 200% 100%; animation: trade-shimmer 1.5s infinite;
            border-radius: 8px; min-height: 2rem; min-width: 100px;
        }
        @keyframes trade-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── Price Chart ── */
        .trade-chart-card {
            margin-top: 12px; border-radius: 16px; background: #131517;
            border: 1px solid #2c2f36; overflow: hidden;
        }
        .trade-chart-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            padding: 16px 20px 8px;
        }
        .trade-chart-price-block { display: flex; flex-direction: column; gap: 2px; }
        .trade-chart-label { font-size: 11px; color: #98a1c0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .trade-chart-current { font-size: 22px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
        .trade-chart-change {
            font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
        }
        .trade-chart-change.up { color: #22c55e; }
        .trade-chart-change.down { color: #ef4444; }
        .trade-chart-change.flat { color: #98a1c0; }
        .trade-chart-ranges {
            display: flex; gap: 4px; padding-top: 4px;
        }
        .trade-chart-range-btn {
            padding: 4px 10px; border-radius: 8px; border: none;
            background: transparent; color: #98a1c0; font-size: 11px;
            font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .trade-chart-range-btn:hover { color: #fff; background: rgba(76,130,251,0.1); }
        .trade-chart-range-btn.active { color: #fff; background: #4c82fb; }
        .trade-chart-canvas-wrap {
            position: relative; width: 100%; height: 180px; padding: 0 4px 8px;
        }
        .trade-chart-canvas-wrap canvas {
            width: 100%; height: 100%; display: block;
        }
        .trade-chart-empty {
            display: flex; align-items: center; justify-content: center;
            height: 180px; color: #98a1c0; font-size: 12px;
            flex-direction: column; gap: 6px;
        }
        .trade-chart-empty i { font-size: 24px; opacity: 0.3; }
        .trade-chart-tooltip {
            position: absolute; pointer-events: none;
            background: #1e2025; border: 1px solid #3c3f46;
            border-radius: 8px; padding: 6px 10px;
            font-size: 11px; color: #fff; white-space: nowrap;
            transform: translate(-50%, -100%); margin-top: -10px;
            z-index: 10; opacity: 0; transition: opacity 0.15s;
        }
        .trade-chart-tooltip.visible { opacity: 1; }
        .trade-chart-crosshair {
            position: absolute; top: 0; width: 1px; height: 100%;
            background: rgba(76,130,251,0.3); pointer-events: none;
            opacity: 0; transition: opacity 0.15s;
        }
        .trade-chart-crosshair.visible { opacity: 1; }
    `;
    document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════════════════
// PRICE & QUOTES
// ════════════════════════════════════════════════════════════════════════════

function getProvider() {
    return State.publicProvider || (State.provider ? State.provider : null);
}

async function getPoolPrice() {
    const provider = getProvider();
    if (!provider) return;

    try {
        const pool = new ethers.Contract(POOL, POOL_ABI, provider);
        const [slot0, liq, t0] = await Promise.all([
            pool.slot0(),
            pool.liquidity(),
            pool.token0(),
        ]);

        TS.sqrtPriceX96 = slot0[0];
        TS.liquidity = liq;
        TS.wethIsToken0 = t0.toLowerCase() === WETH9.toLowerCase();

        // price = (sqrtPriceX96 / 2^96)^2 = token1 per token0
        const sqrtPrice = Number(TS.sqrtPriceX96) / (2 ** 96);
        const price = sqrtPrice * sqrtPrice;

        if (TS.wethIsToken0) {
            // token0=WETH, token1=BKC → price = BKC per WETH
            TS.priceBkcPerEth = price;
            TS.priceEthPerBkc = price > 0 ? 1 / price : 0;
        } else {
            // token0=BKC, token1=WETH → price = WETH per BKC
            TS.priceEthPerBkc = price;
            TS.priceBkcPerEth = price > 0 ? 1 / price : 0;
        }

        updatePriceDisplay();
        recalcOutput();
        recordPricePoint();
    } catch (e) {
        console.error('[Trade] getPoolPrice failed:', e);
    }
}

function calculateEstimatedOutput() {
    const val = parseFloat(TS.inputAmount);
    if (!val || val <= 0 || TS.sqrtPriceX96 === 0n) {
        TS.estimatedOutput = 0n;
        TS.estimatedOutputFormatted = '0';
        TS.priceImpact = 0;
        return;
    }

    const fee = 0.003;
    const sqrtPrice = Number(TS.sqrtPriceX96) / (2 ** 96);
    const L = Number(TS.liquidity);
    if (L === 0 || sqrtPrice === 0) return;

    // Virtual reserves at current price
    const reserve0 = L / sqrtPrice;  // token0
    const reserve1 = L * sqrtPrice;  // token1

    let reserveIn, reserveOut;
    if (TS.direction === 'buy') {
        // ETH→BKC: input is ETH (WETH)
        reserveIn  = TS.wethIsToken0 ? reserve0 : reserve1;
        reserveOut = TS.wethIsToken0 ? reserve1 : reserve0;
    } else {
        // BKC→ETH: input is BKC
        reserveIn  = TS.wethIsToken0 ? reserve1 : reserve0;
        reserveOut = TS.wethIsToken0 ? reserve0 : reserve1;
    }

    const effectiveInput = val * (1 - fee);
    let outputNum = effectiveInput * reserveOut / (reserveIn + effectiveInput);

    if (outputNum <= 0) {
        TS.estimatedOutput = 0n;
        TS.estimatedOutputFormatted = '0';
        TS.priceImpact = 0;
        return;
    }

    // V3 concentrated liquidity: virtual reserves overestimate output when
    // swap crosses tick boundaries. Apply conservative 5% buffer for UI estimate.
    // Actual execution uses staticCall for exact output.
    outputNum *= 0.95;

    // Price impact
    const midPrice = reserveOut / reserveIn;
    const execPrice = outputNum / val;
    TS.priceImpact = Math.abs((midPrice - execPrice) / midPrice) * 100;

    TS.estimatedOutput = ethers.parseEther(outputNum.toFixed(18));
    TS.estimatedOutputFormatted = formatOutput(outputNum);
}

function formatOutput(num) {
    if (num < 0.0001) return num.toExponential(2);
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    if (num < 1e6) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return (num / 1e6).toFixed(2) + 'M';
}

function formatPrice(num) {
    if (num === 0) return '--';
    if (num < 0.0001) return num.toExponential(4);
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// ════════════════════════════════════════════════════════════════════════════
// BALANCES
// ════════════════════════════════════════════════════════════════════════════

async function loadBalances() {
    if (!State.isConnected || !State.userAddress) return;
    const provider = getProvider();
    if (!provider) return;

    try {
        const [ethBal, bkcBal] = await Promise.all([
            provider.getBalance(State.userAddress),
            new ethers.Contract(BKC_TOKEN, ERC20_ABI, provider).balanceOf(State.userAddress),
        ]);
        TS.ethBalance = ethBal;
        TS.bkcBalance = bkcBal;
        updateBalanceDisplays();
    } catch (e) {
        console.error('[Trade] loadBalances:', e);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SWAP EXECUTION
// ════════════════════════════════════════════════════════════════════════════

// Get gas overrides with 2x buffer to prevent "max fee < base fee" on Arbitrum
async function getGasOverrides() {
    const provider = State.publicProvider || State.provider;
    const feeData = await provider.getFeeData();
    const maxFee = (feeData.maxFeePerGas || feeData.gasPrice || 100000000n) * 2n;
    const maxPriority = (feeData.maxPriorityFeePerGas || 0n) * 2n || 1n;
    return { maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriority };
}

async function executeBuySwap(btn) {
    if (TS.isSwapping || !State.isConnected || !State.signer) return;
    TS.isSwapping = true;

    try {
        const amountIn = ethers.parseEther(TS.inputAmount);
        if (amountIn === 0n) throw new Error('Enter an amount');

        // Validate
        if (TS.ethBalance < amountIn + GAS_RESERVE) {
            throw new Error('Insufficient BNB (need amount + gas)');
        }

        const signer = State.signer;
        const weth = new ethers.Contract(WETH9, WETH_ABI, signer);
        const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);

        // Step 1: Wrap ETH → WETH
        setSwapBtn(btn, 'Wrapping BNB...', true);
        let gasOvr = await getGasOverrides();
        const wrapTx = await weth.deposit({ value: amountIn, ...gasOvr });
        await wrapTx.wait();

        // Step 2: Approve WETH (skip if enough allowance)
        setSwapBtn(btn, 'Approving...', true);
        const allowance = await weth.allowance(State.userAddress, SWAP_ROUTER);
        if (allowance < amountIn) {
            gasOvr = await getGasOverrides();
            const appTx = await weth.approve(SWAP_ROUTER, ethers.MaxUint256, gasOvr);
            await appTx.wait();
        }

        // Step 3: Get real output via staticCall, then apply slippage
        setSwapBtn(btn, 'Getting quote...', true);
        const swapParams = {
            tokenIn: WETH9,
            tokenOut: BKC_TOKEN,
            fee: FEE_TIER,
            recipient: State.userAddress,
            amountIn,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n,
        };
        const realOutput = await router.exactInputSingle.staticCall(swapParams, { from: State.userAddress });
        const slippageBps = BigInt(Math.floor(TS.slippage * 100));
        const amountOutMin = realOutput * (10000n - slippageBps) / 10000n;
        console.log(`[Trade] Buy quote: real=${ethers.formatEther(realOutput)} BKC, min=${ethers.formatEther(amountOutMin)} BKC`);

        // Step 4: Swap
        setSwapBtn(btn, 'Confirm in Wallet...', true);
        gasOvr = await getGasOverrides();
        const swapTx = await router.exactInputSingle({
            ...swapParams,
            amountOutMinimum: amountOutMin,
        }, gasOvr);

        setSwapBtn(btn, 'Processing...', true);
        const receipt = await swapTx.wait();

        showToast('Swap successful! Bought BKC', 'success');
        console.log(`[Trade] Buy TX: ${receipt.hash}`);
        resetAfterSwap();

    } catch (err) {
        handleSwapError(err);
    } finally {
        TS.isSwapping = false;
        resetSwapBtn(btn);
    }
}

async function executeSellSwap(btn) {
    if (TS.isSwapping || !State.isConnected || !State.signer) return;
    TS.isSwapping = true;

    try {
        const amountIn = ethers.parseEther(TS.inputAmount);
        if (amountIn === 0n) throw new Error('Enter an amount');

        // Validate
        if (TS.bkcBalance < amountIn) {
            throw new Error(`Insufficient BKC`);
        }

        const signer = State.signer;
        const bkc = new ethers.Contract(BKC_TOKEN, ERC20_ABI, signer);
        const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);

        // Step 1: Approve BKC (skip if enough)
        setSwapBtn(btn, 'Approving BKC...', true);
        const allowance = await bkc.allowance(State.userAddress, SWAP_ROUTER);
        if (allowance < amountIn) {
            let gasOvr = await getGasOverrides();
            const appTx = await bkc.approve(SWAP_ROUTER, ethers.MaxUint256, gasOvr);
            await appTx.wait();
        }

        // Step 2: Get real output via staticCall, then apply slippage
        setSwapBtn(btn, 'Getting quote...', true);
        const realOutput = await router.exactInputSingle.staticCall({
            tokenIn: BKC_TOKEN,
            tokenOut: WETH9,
            fee: FEE_TIER,
            recipient: SWAP_ROUTER,
            amountIn,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n,
        }, { from: State.userAddress });
        const slippageBps = BigInt(Math.floor(TS.slippage * 100));
        const amountOutMin = realOutput * (10000n - slippageBps) / 10000n;
        console.log(`[Trade] Sell quote: real=${ethers.formatEther(realOutput)} ETH, min=${ethers.formatEther(amountOutMin)} ETH`);

        // Step 3: Multicall (exactInputSingle + unwrapWETH9)
        setSwapBtn(btn, 'Confirm in Wallet...', true);
        const iface = new ethers.Interface(SWAP_ROUTER_ABI);

        const swapData = iface.encodeFunctionData('exactInputSingle', [{
            tokenIn: BKC_TOKEN,
            tokenOut: WETH9,
            fee: FEE_TIER,
            recipient: SWAP_ROUTER,
            amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0n,
        }]);

        const unwrapData = iface.encodeFunctionData('unwrapWETH9', [
            amountOutMin,
            State.userAddress,
        ]);

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
        const gasOvr = await getGasOverrides();
        const mcTx = await router.multicall(deadline, [swapData, unwrapData], gasOvr);

        setSwapBtn(btn, 'Processing...', true);
        const receipt = await mcTx.wait();

        showToast('Swap successful! Sold BKC for BNB', 'success');
        console.log(`[Trade] Sell TX: ${receipt.hash}`);
        resetAfterSwap();

    } catch (err) {
        handleSwapError(err);
    } finally {
        TS.isSwapping = false;
        resetSwapBtn(btn);
    }
}

function handleSwapError(err) {
    if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        showToast('Transaction cancelled', 'info');
    } else {
        console.error('[Trade] Swap failed:', err);
        showToast(`Swap failed: ${err.reason || err.shortMessage || err.message}`, 'error');
    }
}

function resetAfterSwap() {
    TS.inputAmount = '';
    TS.estimatedOutput = 0n;
    TS.estimatedOutputFormatted = '0';
    TS.priceImpact = 0;
    const inp = document.getElementById('trade-input');
    if (inp) inp.value = '';
    updateOutputDisplay();
    updateInfoSection();
    loadBalances();
    getPoolPrice();
}

// ════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════════════════════

function setSwapBtn(btn, text, loading) {
    if (!btn) return;
    btn.textContent = text;
    btn.disabled = true;
    if (loading) btn.classList.add('loading');
}

function resetSwapBtn(btn) {
    if (!btn) return;
    btn.classList.remove('loading');
    updateSwapButton();
}

function updateSwapButton() {
    const btn = document.getElementById('trade-swap-btn');
    if (!btn) return;

    if (!State.isConnected) {
        btn.textContent = 'Connect Wallet';
        btn.disabled = false;
        btn.className = 'execute-trade-btn';
        return;
    }

    const val = parseFloat(TS.inputAmount);
    if (!val || val <= 0) {
        btn.textContent = 'Enter amount';
        btn.disabled = true;
        btn.className = 'execute-trade-btn';
        return;
    }

    // Check balance
    const amountIn = ethers.parseEther(TS.inputAmount);
    if (TS.direction === 'buy' && TS.ethBalance < amountIn + GAS_RESERVE) {
        btn.textContent = 'Insufficient BNB';
        btn.disabled = true;
        btn.className = 'execute-trade-btn';
        return;
    }
    if (TS.direction === 'sell' && TS.bkcBalance < amountIn) {
        btn.textContent = 'Insufficient BKC';
        btn.disabled = true;
        btn.className = 'execute-trade-btn';
        return;
    }

    if (TS.priceImpact > 5) {
        btn.textContent = `Swap (${TS.priceImpact.toFixed(1)}% impact)`;
        btn.disabled = false;
        btn.className = 'execute-trade-btn warning';
        return;
    }

    btn.textContent = 'Swap';
    btn.disabled = false;
    btn.className = 'execute-trade-btn';
}

async function updatePriceDisplay() {
    const el = document.getElementById('trade-price');
    if (!el) return;
    let txt = `1 BNB = ${formatPrice(TS.priceBkcPerEth)} BKC`;
    // Add USD price
    const provider = State.publicProvider || State.provider;
    if (provider && TS.priceEthPerBkc > 0) {
        try {
            const price = await getBkcPrice(provider);
            if (price.bkcUsd > 0) txt += `  ·  1 BKC = ${formatUsd(price.bkcUsd)}`;
        } catch (_) {}
    }
    el.textContent = txt;
    el.classList.remove('trade-price-pulse');
    void el.offsetWidth;
    el.classList.add('trade-price-pulse');
}

function updateOutputDisplay() {
    const el = document.getElementById('trade-output');
    if (el) el.textContent = TS.estimatedOutputFormatted;
}

function updateInfoSection() {
    const impact = document.getElementById('trade-impact');
    const slip = document.getElementById('trade-slip-display');
    if (impact) {
        const pct = TS.priceImpact.toFixed(2);
        impact.textContent = `~${pct}%`;
        impact.className = TS.priceImpact > 15 ? 'trade-impact-danger' :
                           TS.priceImpact > 5  ? 'trade-impact-warn' : '';
    }
    if (slip) slip.textContent = `${TS.slippage}%`;
}

function updateBalanceDisplays() {
    const fromBal = document.getElementById('trade-from-bal');
    const toBal = document.getElementById('trade-to-bal');
    if (fromBal) {
        const bal = TS.direction === 'buy' ? TS.ethBalance : TS.bkcBalance;
        const sym = TS.direction === 'buy' ? 'BNB' : 'BKC';
        fromBal.textContent = `Balance: ${formatBal(bal)} ${sym}`;
    }
    if (toBal) {
        const bal = TS.direction === 'buy' ? TS.bkcBalance : TS.ethBalance;
        const sym = TS.direction === 'buy' ? 'BKC' : 'BNB';
        toBal.textContent = `Balance: ${formatBal(bal)} ${sym}`;
    }
    updateSwapButton();
}

function formatBal(wei) {
    if (!wei || wei === 0n) return '0';
    const num = Number(ethers.formatEther(wei));
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1e6) return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return (num / 1e6).toFixed(2) + 'M';
}

function recalcOutput() {
    calculateEstimatedOutput();
    updateOutputDisplay();
    updateInfoSection();
    updateSwapButton();
}

// ════════════════════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════════════════════

function renderSwapCard() {
    const container = document.getElementById('trade');
    if (!container) return;

    const fromSym = TS.direction === 'buy' ? 'BNB' : 'BKC';
    const toSym = TS.direction === 'buy' ? 'BKC' : 'BNB';
    const fromIcon = TS.direction === 'buy'
        ? '<i class="fa-brands fa-ethereum" style="font-size:20px;color:#627eea"></i>'
        : '<img src="./assets/bkc_logo_3d.png" style="width:28px;height:28px;border-radius:50%">';
    const toIcon = TS.direction === 'buy'
        ? '<img src="./assets/bkc_logo_3d.png" style="width:28px;height:28px;border-radius:50%">'
        : '<i class="fa-brands fa-ethereum" style="font-size:20px;color:#627eea"></i>';

    container.innerHTML = `
    <div class="trade-shell">
        <div class="swap-box-container">
            <!-- Header -->
            <div class="trade-header">
                <h3>Trade</h3>
                <button class="trade-settings-btn" id="trade-settings-toggle" title="Slippage settings">
                    <i class="fa-solid fa-gear"></i>
                </button>
            </div>

            <!-- Settings panel -->
            <div class="trade-settings-panel ${TS.showSettings ? 'open' : ''}" id="trade-settings-panel">
                <div class="trade-slippage-row">
                    <label>Slippage</label>
                    <button class="trade-slip-btn ${TS.slippage === 0.5 ? 'active' : ''}" data-slip="0.5">0.5%</button>
                    <button class="trade-slip-btn ${TS.slippage === 1 ? 'active' : ''}" data-slip="1">1%</button>
                    <button class="trade-slip-btn ${TS.slippage === 3 ? 'active' : ''}" data-slip="3">3%</button>
                    <input type="text" class="trade-slip-custom" id="trade-slip-custom"
                           placeholder="Custom" value="${![0.5,1,3].includes(TS.slippage) ? TS.slippage : ''}" />
                </div>
            </div>

            <!-- Swap content -->
            <div id="swap-box-content">
                <!-- FROM -->
                <div class="swap-panel">
                    <div class="swap-panel-header">
                        <span>From</span>
                    </div>
                    <div class="swap-panel-main">
                        <input type="text" class="swap-amount" id="trade-input"
                               placeholder="0" inputmode="decimal" autocomplete="off"
                               value="${TS.inputAmount}" />
                        <div class="token-selector-btn">
                            ${fromIcon}
                            <span>${fromSym}</span>
                        </div>
                    </div>
                    <div class="trade-bal-row">
                        <span id="trade-from-bal">Balance: --</span>
                        <button class="trade-max-btn" id="trade-max-btn">MAX</button>
                    </div>
                </div>

                <!-- Flip arrow -->
                <div class="swap-arrow-button-wrapper">
                    <button class="swap-arrow-btn" id="trade-flip-btn">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                </div>

                <!-- TO -->
                <div class="swap-panel">
                    <div class="swap-panel-header">
                        <span>To (estimated)</span>
                    </div>
                    <div class="swap-panel-main">
                        <span class="swap-amount" id="trade-output" style="color:#98a1c0">${TS.estimatedOutputFormatted}</span>
                        <div class="token-selector-btn">
                            ${toIcon}
                            <span>${toSym}</span>
                        </div>
                    </div>
                    <div class="trade-bal-row">
                        <span id="trade-to-bal">Balance: --</span>
                        <span></span>
                    </div>
                </div>
            </div>

            <!-- Info section -->
            <div class="trade-info" id="trade-info">
                <div class="trade-info-row">
                    <span>Price</span>
                    <span id="trade-price">${TS.priceBkcPerEth ? '1 BNB = ' + formatPrice(TS.priceBkcPerEth) + ' BKC' : 'Loading...'}</span>
                </div>
                <div class="trade-info-row">
                    <span>Price Impact</span>
                    <span id="trade-impact">~0%</span>
                </div>
                <div class="trade-info-row">
                    <span>Max Slippage</span>
                    <span id="trade-slip-display">${TS.slippage}%</span>
                </div>
            </div>

            <!-- Swap button -->
            <div id="swap-box-button-container">
                <button class="execute-trade-btn" id="trade-swap-btn" disabled>
                    ${State.isConnected ? 'Enter amount' : 'Connect Wallet'}
                </button>
            </div>
        </div>

        <!-- Pool info -->
        <div class="trade-pool-info">
            <span>Pool: <a href="${EXPLORER}/address/${POOL}" target="_blank" rel="noopener noreferrer">${POOL.slice(0,6)}...${POOL.slice(-4)}</a></span>
            <span>Fee: 0.3%</span>
            <span class="trade-uni-badge"><i class="fa-solid fa-droplet"></i> Uniswap V3</span>
        </div>

        <!-- Price Chart -->
        <div class="trade-chart-card">
            <div class="trade-chart-header">
                <div class="trade-chart-price-block">
                    <span class="trade-chart-label">BKC Price</span>
                    <span id="chart-current-price" class="trade-chart-current">--</span>
                    <span id="chart-change" class="trade-chart-change flat">--</span>
                </div>
                <div class="trade-chart-ranges">
                    ${Object.keys(CHART_RANGES).map(r => `<button class="trade-chart-range-btn ${r === TS.chartRange ? 'active' : ''}" data-range="${r}">${r}</button>`).join('')}
                </div>
            </div>
            <div class="trade-chart-canvas-wrap" id="chart-wrap">
                <canvas id="trade-chart-canvas"></canvas>
                <div class="trade-chart-crosshair" id="chart-crosshair"></div>
                <div class="trade-chart-tooltip" id="chart-tooltip"></div>
            </div>
        </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════════════════════
// PRICE CHART
// ════════════════════════════════════════════════════════════════════════════

function loadPriceHistory() {
    try {
        const raw = localStorage.getItem(CHART_STORAGE_KEY);
        if (raw) TS.priceHistory = JSON.parse(raw);
    } catch (_) { TS.priceHistory = []; }
}

function savePriceHistory() {
    try {
        // Trim to max points
        if (TS.priceHistory.length > CHART_MAX_POINTS) {
            TS.priceHistory = TS.priceHistory.slice(-CHART_MAX_POINTS);
        }
        localStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(TS.priceHistory));
    } catch (_) {}
}

function recordPricePoint() {
    const provider = State.publicProvider || State.provider;
    if (!provider || TS.priceEthPerBkc <= 0) return;

    getBkcPrice(provider).then(price => {
        const now = Date.now();
        // Avoid duplicates within 10s
        const last = TS.priceHistory[TS.priceHistory.length - 1];
        if (last && now - last.t < 10_000) return;

        TS.priceHistory.push({ t: now, p: price.bkcUsd, e: price.bkcEth });
        savePriceHistory();
        drawChart();
    }).catch(() => {});
}

function getChartData() {
    const rangeMs = CHART_RANGES[TS.chartRange];
    if (rangeMs === Infinity) return [...TS.priceHistory];
    const cutoff = Date.now() - rangeMs;
    return TS.priceHistory.filter(pt => pt.t >= cutoff);
}

function drawChart() {
    const canvas = document.getElementById('trade-chart-canvas');
    const wrap = document.getElementById('chart-wrap');
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const data = getChartData();

    // Update header
    updateChartHeader(data);

    if (data.length < 2) {
        // Show empty state message on canvas
        ctx.fillStyle = '#98a1c0';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Collecting price data...', W / 2, H / 2 - 8);
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Chart updates every 15 seconds', W / 2, H / 2 + 12);
        return;
    }

    // Determine price field — prefer USD, fall back to ETH
    const useUsd = data.some(d => d.p > 0);
    const prices = data.map(d => useUsd ? d.p : d.e);
    const times = data.map(d => d.t);

    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || maxP * 0.01 || 0.0001;

    const padX = 8;
    const padTop = 10;
    const padBot = 22;
    const chartW = W - padX * 2;
    const chartH = H - padTop - padBot;

    const toX = (i) => padX + (i / (data.length - 1)) * chartW;
    const toY = (p) => padTop + (1 - (p - minP) / range) * chartH;

    // Gradient fill
    const isUp = prices[prices.length - 1] >= prices[0];
    const lineColor = isUp ? '#22c55e' : '#ef4444';
    const gradTop = isUp ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
    const gradBot = isUp ? 'rgba(34,197,94,0)' : 'rgba(239,68,68,0)';

    // Draw fill
    const gradient = ctx.createLinearGradient(0, padTop, 0, H - padBot);
    gradient.addColorStop(0, gradTop);
    gradient.addColorStop(1, gradBot);

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(prices[0]));
    for (let i = 1; i < prices.length; i++) {
        ctx.lineTo(toX(i), toY(prices[i]));
    }
    ctx.lineTo(toX(prices.length - 1), H - padBot);
    ctx.lineTo(toX(0), H - padBot);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(prices[0]));
    for (let i = 1; i < prices.length; i++) {
        ctx.lineTo(toX(i), toY(prices[i]));
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Endpoint dot
    const lastX = toX(prices.length - 1);
    const lastY = toY(prices[prices.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Time labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
        const idx = Math.round(i * (data.length - 1) / (labelCount - 1));
        const date = new Date(times[idx]);
        const label = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
        ctx.fillText(label, toX(idx), H - 4);
    }

    // Price labels (min/max)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4b5563';
    ctx.font = '9px system-ui, sans-serif';
    const prefix = useUsd ? '$' : '';
    const decimals = useUsd ? (maxP < 0.01 ? 6 : 4) : 8;
    ctx.fillText(prefix + maxP.toFixed(decimals), W - padX, padTop + 10);
    ctx.fillText(prefix + minP.toFixed(decimals), W - padX, H - padBot - 4);

    // Store chart layout for hover
    canvas._chartMeta = { data, prices, times, useUsd, toX, toY, padX, padTop, padBot, chartW, chartH, W, H };
}

function updateChartHeader(data) {
    const currentEl = document.getElementById('chart-current-price');
    const changeEl = document.getElementById('chart-change');
    if (!currentEl || !changeEl) return;

    if (data.length === 0) {
        currentEl.textContent = '--';
        changeEl.textContent = '--';
        changeEl.className = 'trade-chart-change flat';
        return;
    }

    const last = data[data.length - 1];
    const useUsd = data.some(d => d.p > 0);
    const currentPrice = useUsd ? last.p : last.e;
    const firstPrice = useUsd ? data[0].p : data[0].e;

    if (useUsd) {
        currentEl.textContent = formatUsd(currentPrice);
    } else {
        currentEl.textContent = currentPrice.toFixed(8) + ' BNB';
    }

    if (data.length >= 2 && firstPrice > 0) {
        const changePct = ((currentPrice - firstPrice) / firstPrice) * 100;
        const arrow = changePct >= 0 ? '\u25B2' : '\u25BC';
        changeEl.textContent = `${arrow} ${Math.abs(changePct).toFixed(2)}% (${TS.chartRange})`;
        changeEl.className = `trade-chart-change ${changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat'}`;
    } else {
        changeEl.textContent = '--';
        changeEl.className = 'trade-chart-change flat';
    }
}

function setupChartEvents() {
    const canvas = document.getElementById('trade-chart-canvas');
    const wrap = document.getElementById('chart-wrap');
    if (!canvas || !wrap) return;

    // Range buttons
    wrap.closest('.trade-chart-card')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-range]');
        if (!btn) return;
        TS.chartRange = btn.dataset.range;
        wrap.closest('.trade-chart-card').querySelectorAll('.trade-chart-range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        drawChart();
    });

    // Hover tooltip
    canvas.addEventListener('mousemove', (e) => {
        const meta = canvas._chartMeta;
        if (!meta || meta.data.length < 2) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = (x - meta.padX) / meta.chartW;
        const idx = Math.round(ratio * (meta.data.length - 1));
        if (idx < 0 || idx >= meta.data.length) return;

        const pt = meta.data[idx];
        const price = meta.useUsd ? pt.p : pt.e;
        const prefix = meta.useUsd ? '$' : '';
        const decimals = meta.useUsd ? (price < 0.01 ? 6 : 4) : 8;
        const suffix = meta.useUsd ? '' : ' BNB';
        const date = new Date(pt.t);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const tooltip = document.getElementById('chart-tooltip');
        const crosshair = document.getElementById('chart-crosshair');
        if (tooltip) {
            tooltip.textContent = `${prefix}${price.toFixed(decimals)}${suffix}  ·  ${timeStr}`;
            tooltip.style.left = meta.toX(idx) + 'px';
            tooltip.style.top = meta.toY(price) + 'px';
            tooltip.classList.add('visible');
        }
        if (crosshair) {
            crosshair.style.left = meta.toX(idx) + 'px';
            crosshair.classList.add('visible');
        }
    });

    canvas.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('chart-tooltip');
        const crosshair = document.getElementById('chart-crosshair');
        if (tooltip) tooltip.classList.remove('visible');
        if (crosshair) crosshair.classList.remove('visible');
    });
}

// ════════════════════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════════════════════

function setupEvents() {
    const container = document.getElementById('trade');
    if (!container) return;

    container.addEventListener('click', handleClick);
    container.addEventListener('input', handleInput);
}

function handleClick(e) {
    const target = e.target;

    // Settings toggle
    if (target.closest('#trade-settings-toggle')) {
        TS.showSettings = !TS.showSettings;
        const panel = document.getElementById('trade-settings-panel');
        if (panel) panel.classList.toggle('open', TS.showSettings);
        return;
    }

    // Slippage presets
    const slipBtn = target.closest('[data-slip]');
    if (slipBtn) {
        TS.slippage = parseFloat(slipBtn.dataset.slip);
        const custom = document.getElementById('trade-slip-custom');
        if (custom) custom.value = '';
        document.querySelectorAll('.trade-slip-btn').forEach(b => b.classList.remove('active'));
        slipBtn.classList.add('active');
        updateInfoSection();
        updateSwapButton();
        return;
    }

    // Flip
    if (target.closest('#trade-flip-btn')) {
        TS.direction = TS.direction === 'buy' ? 'sell' : 'buy';
        TS.inputAmount = '';
        TS.estimatedOutput = 0n;
        TS.estimatedOutputFormatted = '0';
        TS.priceImpact = 0;
        renderSwapCard();
        setupEvents();
        loadBalances();
        return;
    }

    // MAX
    if (target.closest('#trade-max-btn')) {
        let max;
        if (TS.direction === 'buy') {
            max = TS.ethBalance > GAS_RESERVE ? TS.ethBalance - GAS_RESERVE : 0n;
        } else {
            max = TS.bkcBalance;
        }
        if (max > 0n) {
            TS.inputAmount = ethers.formatEther(max);
            const inp = document.getElementById('trade-input');
            if (inp) inp.value = TS.inputAmount;
            recalcOutput();
        }
        return;
    }

    // Swap button
    if (target.closest('#trade-swap-btn')) {
        if (!State.isConnected) {
            openConnectModal();
            return;
        }
        const btn = document.getElementById('trade-swap-btn');
        if (TS.direction === 'buy') {
            executeBuySwap(btn);
        } else {
            executeSellSwap(btn);
        }
        return;
    }
}

function handleInput(e) {
    const target = e.target;

    // Amount input
    if (target.id === 'trade-input') {
        // Allow only valid decimal input
        let val = target.value.replace(/[^0-9.]/g, '');
        const dots = val.split('.').length - 1;
        if (dots > 1) val = val.slice(0, val.lastIndexOf('.'));
        target.value = val;
        TS.inputAmount = val;

        clearTimeout(TS.debounceTimer);
        TS.debounceTimer = setTimeout(() => recalcOutput(), 200);
        return;
    }

    // Custom slippage
    if (target.id === 'trade-slip-custom') {
        const val = parseFloat(target.value);
        if (val >= 0.1 && val <= 50) {
            TS.slippage = val;
            document.querySelectorAll('.trade-slip-btn').forEach(b => b.classList.remove('active'));
            updateInfoSection();
            updateSwapButton();
        }
        return;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// REFRESH
// ════════════════════════════════════════════════════════════════════════════

function startPriceRefresh() {
    stopPriceRefresh();
    TS.priceRefreshTimer = setInterval(() => {
        if (!TS.isSwapping) getPoolPrice();
    }, PRICE_REFRESH_MS);
}

function stopPriceRefresh() {
    if (TS.priceRefreshTimer) {
        clearInterval(TS.priceRefreshTimer);
        TS.priceRefreshTimer = null;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ════════════════════════════════════════════════════════════════════════════

function render(isNewPage) {
    injectStyles();
    const container = document.getElementById('trade');
    if (!container) return;

    if (isNewPage) {
        loadPriceHistory();
        renderSwapCard();
        setupEvents();
        setupChartEvents();
        getPoolPrice();
        loadBalances();
        startPriceRefresh();
        drawChart();
    }

    updateSwapButton();
    updateBalanceDisplays();
}

function update(isConnected) {
    loadBalances();
    updateSwapButton();
    updateBalanceDisplays();
}

function cleanup() {
    stopPriceRefresh();
    clearTimeout(TS.debounceTimer);
    TS.isSwapping = false;
}

export const TradePage = { render, update, cleanup };
