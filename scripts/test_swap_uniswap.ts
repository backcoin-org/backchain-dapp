// scripts/test_swap_uniswap.ts
// Prove the Uniswap V3 pool is real by executing an actual swap
//
// npx hardhat run scripts/test_swap_uniswap.ts --network arbitrumSepolia

import { ethers } from "hardhat";

const SWAP_ROUTER     = "0x101F443B4d1b059569D643917553c771E1b9663E";
const WETH9           = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const BKC_TOKEN       = "0x8264fa8C238Ca723A5D55D77E7aeC1271bd7E737";
const POOL            = "0x4A434eCcA4c53e79834d74Be0DA6c224b92f0B35";
const FEE_TIER        = 3000;

const SWAP_ROUTER_ABI = [
    `function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)`,
    "function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)",
];

const WETH_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function deposit() payable",
    "function approve(address, uint256) returns (bool)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)"
];

const POOL_ABI = [
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)",
    "function liquidity() view returns (uint128)"
];

async function main() {
    const [deployer] = await ethers.getSigners();
    const addr = deployer.address;

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   🔄 UNISWAP V3 SWAP TEST — PROOF THE POOL IS REAL");
    console.log("════════════════════════════════════════════════════════════════");

    const bkc = new ethers.Contract(BKC_TOKEN, ERC20_ABI, deployer);
    const weth = new ethers.Contract(WETH9, WETH_ABI, deployer);
    const pool = new ethers.Contract(POOL, POOL_ABI, deployer);
    const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, deployer);

    // ── Pool state before ────────────────────────────────────────────
    const slot0 = await pool.slot0();
    const liq = await pool.liquidity();
    console.log(`\n   Pool: ${POOL}`);
    console.log(`   sqrtPriceX96: ${slot0[0]}`);
    console.log(`   Tick: ${slot0[1]}`);
    console.log(`   Liquidity: ${liq}`);

    // ── Balances before ──────────────────────────────────────────────
    const preBkc = await bkc.balanceOf(addr);
    const preEth = await ethers.provider.getBalance(addr);
    console.log(`\n── BEFORE SWAP ──`);
    console.log(`   ETH:  ${ethers.formatEther(preEth)}`);
    console.log(`   BKC:  ${ethers.formatEther(preBkc)}`);

    // ── Swap 0.01 ETH → BKC via Uniswap V3 ──────────────────────────
    const swapAmount = ethers.parseEther("0.01");
    console.log(`\n── SWAPPING ${ethers.formatEther(swapAmount)} ETH → BKC ──`);

    // Step 1: Wrap ETH → WETH
    console.log("   1. Wrapping ETH → WETH...");
    const wrapTx = await weth.deposit({ value: swapAmount });
    await wrapTx.wait();

    // Step 2: Approve router
    console.log("   2. Approving WETH for router...");
    const approveTx = await weth.approve(SWAP_ROUTER, swapAmount);
    await approveTx.wait();

    // Step 3: Execute swap
    console.log("   3. Executing swap on Uniswap V3...");
    const params = {
        tokenIn: WETH9,
        tokenOut: BKC_TOKEN,
        fee: FEE_TIER,
        recipient: addr,
        amountIn: swapAmount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n
    };

    const swapTx = await router.exactInputSingle(params);
    const receipt = await swapTx.wait();
    console.log(`   ✅ Swap TX: ${receipt!.hash}`);
    console.log(`   Gas used: ${receipt!.gasUsed}`);

    // ── Balances after ───────────────────────────────────────────────
    const postBkc = await bkc.balanceOf(addr);
    const postEth = await ethers.provider.getBalance(addr);
    const bkcReceived = postBkc - preBkc;

    console.log(`\n── AFTER SWAP ──`);
    console.log(`   ETH:  ${ethers.formatEther(postEth)}`);
    console.log(`   BKC:  ${ethers.formatEther(postBkc)}`);
    console.log(`\n── RESULT ──`);
    console.log(`   Spent:    ${ethers.formatEther(swapAmount)} ETH`);
    console.log(`   Received: ${ethers.formatEther(bkcReceived)} BKC`);
    console.log(`   Rate:     1 ETH = ${Number(ethers.formatEther(bkcReceived)) / Number(ethers.formatEther(swapAmount))} BKC`);

    // ── Pool state after ─────────────────────────────────────────────
    const slot0After = await pool.slot0();
    const liqAfter = await pool.liquidity();
    console.log(`\n── POOL AFTER ──`);
    console.log(`   sqrtPriceX96: ${slot0After[0]} (was ${slot0[0]})`);
    console.log(`   Tick: ${slot0After[1]} (was ${slot0[1]})`);
    console.log(`   Liquidity: ${liqAfter}`);

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   ✅ SWAP SUCCESSFUL — POOL IS REAL AND FUNCTIONAL");
    console.log("════════════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
