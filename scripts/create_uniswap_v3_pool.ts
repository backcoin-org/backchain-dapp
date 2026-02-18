// scripts/create_uniswap_v3_pool.ts
// Create BKC/WETH Uniswap V3 pool on Arbitrum Sepolia and add full-range liquidity
//
// npx hardhat run scripts/create_uniswap_v3_pool.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════════════
// UNISWAP V3 ADDRESSES (Arbitrum Sepolia)
// ════════════════════════════════════════════════════════════════════════════
const FACTORY         = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
const POSITION_MGR    = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
const SWAP_ROUTER     = "0x101F443B4d1b059569D643917553c771E1b9663E";
const WETH9           = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";

// Project tokens
const BKC_TOKEN       = "0x888b9422bbEeaB772E035734A6a91a07c23550d1";

// Pool config
const FEE_TIER        = 3000;      // 0.3%
const TICK_SPACING    = 60;        // 0.3% tier → tick spacing 60

// Liquidity
const BKC_AMOUNT      = ethers.parseEther("7000000");   // 7M BKC
const ETH_AMOUNT      = ethers.parseEther("3");          // 3 ETH

// Full range ticks (must be multiples of TICK_SPACING)
const TICK_LOWER      = -887220;   // floor(887272 / 60) * 60 = 887220
const TICK_UPPER      =  887220;

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Calculate sqrtPriceX96 for Uniswap V3 pool initialization.
 * price = token1PerToken0 = amount1 / amount0
 * sqrtPriceX96 = sqrt(price) * 2^96
 *
 * For BKC(token0)/WETH(token1): price = 3 ETH / 7M BKC = 4.2857e-7
 */
function calculateSqrtPriceX96(amount0: bigint, amount1: bigint): bigint {
    // sqrtPriceX96 = sqrt(amount1 / amount0) * 2^96
    // = sqrt(amount1 * 2^192 / amount0)
    // Using integer sqrt via Newton's method
    const numerator = amount1 * (2n ** 192n);
    const ratio = numerator / amount0;
    return sqrt(ratio);
}

function sqrt(value: bigint): bigint {
    if (value === 0n) return 0n;
    let z = value;
    let x = value / 2n + 1n;
    while (x < z) {
        z = x;
        x = (value / x + x) / 2n;
    }
    return z;
}

async function sendTx(fn: () => Promise<any>, desc: string, retries = 3) {
    for (let i = 1; i <= retries; i++) {
        try {
            console.log(`   ⏳ ${desc}...`);
            const tx = await fn();
            const receipt = await tx.wait();
            if (!receipt) throw new Error("Null receipt");
            console.log(`   ✅ ${desc}`);
            console.log(`      TX: ${receipt.hash}`);
            console.log(`      Gas: ${receipt.gasUsed.toString()}`);
            await sleep(2000);
            return receipt;
        } catch (e: any) {
            console.log(`   ❌ Attempt ${i}/${retries}: ${(e.message || '').slice(0, 120)}`);
            if (i === retries) throw e;
            await sleep(5000 * i);
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// ABIs
// ════════════════════════════════════════════════════════════════════════════

const ERC20_ABI = [
    "function approve(address, uint256) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

const WETH_ABI = [
    ...ERC20_ABI,
    "function deposit() payable"
];

const FACTORY_ABI = [
    "function getPool(address, address, uint24) view returns (address)"
];

const POSITION_MGR_ABI = [
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
    `function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)`,
    "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

const POOL_ABI = [
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() view returns (uint128)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    const [deployer] = await ethers.getSigners();
    const addr = deployer.address;

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   🦄 UNISWAP V3: BKC/WETH POOL CREATION");
    console.log("════════════════════════════════════════════════════════════════");

    // ── Check balances ─────────────────────────────────────────────────
    const bkc = new ethers.Contract(BKC_TOKEN, ERC20_ABI, deployer);
    const weth = new ethers.Contract(WETH9, WETH_ABI, deployer);

    const ethBal = await ethers.provider.getBalance(addr);
    const bkcBal = await bkc.balanceOf(addr);

    console.log(`   Deployer:  ${addr}`);
    console.log(`   ETH:       ${ethers.formatEther(ethBal)}`);
    console.log(`   BKC:       ${ethers.formatEther(bkcBal)}`);
    console.log(`   Need:      ${ethers.formatEther(ETH_AMOUNT)} ETH + ${ethers.formatEther(BKC_AMOUNT)} BKC`);

    if (ethBal < ETH_AMOUNT + ethers.parseEther("0.01")) {
        throw new Error(`Insufficient ETH. Have ${ethers.formatEther(ethBal)}, need ~${ethers.formatEther(ETH_AMOUNT)} + gas`);
    }
    if (bkcBal < BKC_AMOUNT) {
        throw new Error(`Insufficient BKC. Have ${ethers.formatEther(bkcBal)}, need ${ethers.formatEther(BKC_AMOUNT)}`);
    }
    console.log(`   ✅ Balances sufficient\n`);

    // ── Token ordering ─────────────────────────────────────────────────
    // Uniswap V3: token0 < token1 (by address)
    const bkcLower = BKC_TOKEN.toLowerCase() < WETH9.toLowerCase();
    const token0 = bkcLower ? BKC_TOKEN : WETH9;
    const token1 = bkcLower ? WETH9 : BKC_TOKEN;
    const amount0 = bkcLower ? BKC_AMOUNT : ETH_AMOUNT;
    const amount1 = bkcLower ? ETH_AMOUNT : BKC_AMOUNT;

    console.log(`   Token0 (${bkcLower ? 'BKC' : 'WETH'}): ${token0}`);
    console.log(`   Token1 (${bkcLower ? 'WETH' : 'BKC'}): ${token1}`);
    console.log(`   Price:  ${Number(ethers.formatEther(BKC_AMOUNT)) / Number(ethers.formatEther(ETH_AMOUNT))} BKC per ETH`);

    // ── Step 1: Wrap ETH → WETH ────────────────────────────────────────
    console.log("\n[1/5] Wrapping ETH → WETH...");
    const wethBal = await weth.balanceOf(addr);
    console.log(`   Current WETH: ${ethers.formatEther(wethBal)}`);

    if (wethBal < ETH_AMOUNT) {
        const needed = ETH_AMOUNT - wethBal;
        await sendTx(
            () => weth.deposit({ value: needed }),
            `Deposit ${ethers.formatEther(needed)} ETH → WETH`
        );
    } else {
        console.log(`   ⏩ Already have enough WETH`);
    }

    // ── Step 2: Create + Initialize Pool ───────────────────────────────
    console.log("\n[2/5] Creating & initializing pool...");
    const factory = new ethers.Contract(FACTORY, FACTORY_ABI, deployer);
    const positionMgr = new ethers.Contract(POSITION_MGR, POSITION_MGR_ABI, deployer);

    // Check if pool already exists
    let poolAddr = await factory.getPool(BKC_TOKEN, WETH9, FEE_TIER);
    if (poolAddr !== ethers.ZeroAddress) {
        console.log(`   ⚠️ Pool already exists: ${poolAddr}`);
        const pool = new ethers.Contract(poolAddr, POOL_ABI, deployer);
        const slot0 = await pool.slot0();
        console.log(`   Current sqrtPriceX96: ${slot0.sqrtPriceX96}`);
        console.log(`   Current tick: ${slot0.tick}`);
    } else {
        // Calculate initial sqrtPriceX96
        const sqrtPriceX96 = calculateSqrtPriceX96(amount0, amount1);
        console.log(`   sqrtPriceX96: ${sqrtPriceX96}`);

        await sendTx(
            () => positionMgr.createAndInitializePoolIfNecessary(
                token0, token1, FEE_TIER, sqrtPriceX96
            ),
            "Create & initialize pool"
        );

        poolAddr = await factory.getPool(BKC_TOKEN, WETH9, FEE_TIER);
        console.log(`   ✅ Pool created: ${poolAddr}`);
    }

    // ── Step 3: Approve tokens ─────────────────────────────────────────
    console.log("\n[3/5] Approving tokens...");
    await sendTx(
        () => bkc.approve(POSITION_MGR, BKC_AMOUNT),
        `Approve ${ethers.formatEther(BKC_AMOUNT)} BKC`
    );
    await sendTx(
        () => weth.approve(POSITION_MGR, ETH_AMOUNT),
        `Approve ${ethers.formatEther(ETH_AMOUNT)} WETH`
    );

    // ── Step 4: Mint full-range liquidity position ─────────────────────
    console.log("\n[4/5] Minting liquidity position...");
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const mintParams = {
        token0,
        token1,
        fee: FEE_TIER,
        tickLower: TICK_LOWER,
        tickUpper: TICK_UPPER,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: addr,
        deadline
    };

    console.log(`   Tick range: [${TICK_LOWER}, ${TICK_UPPER}] (full range)`);
    console.log(`   Amount0: ${ethers.formatEther(amount0)} ${bkcLower ? 'BKC' : 'WETH'}`);
    console.log(`   Amount1: ${ethers.formatEther(amount1)} ${bkcLower ? 'WETH' : 'BKC'}`);

    const mintReceipt = await sendTx(
        () => positionMgr.mint(mintParams),
        "Mint full-range position"
    );

    // Extract tokenId from Transfer event (ERC721)
    let tokenId = "unknown";
    for (const log of mintReceipt.logs) {
        try {
            // Transfer(address from, address to, uint256 tokenId) — topic0 for ERC721 Transfer
            if (log.topics[0] === ethers.id("Transfer(address,address,uint256)") &&
                log.topics.length === 4) {
                tokenId = BigInt(log.topics[3]).toString();
                break;
            }
        } catch {}
    }
    console.log(`   🎟️ Position NFT ID: ${tokenId}`);

    // ── Step 5: Verify ─────────────────────────────────────────────────
    console.log("\n[5/5] Verifying pool state...");
    const pool = new ethers.Contract(poolAddr, POOL_ABI, deployer);
    const slot0 = await pool.slot0();
    const liq = await pool.liquidity();

    console.log(`   sqrtPriceX96: ${slot0.sqrtPriceX96}`);
    console.log(`   Current tick: ${slot0.tick}`);
    console.log(`   Liquidity:    ${liq}`);

    // ── Save results ───────────────────────────────────────────────────
    const result = {
        timestamp: new Date().toISOString(),
        network: "arbitrum-sepolia",
        pool: poolAddr,
        positionNftId: tokenId,
        token0,
        token1,
        feeTier: "0.3%",
        tickRange: [TICK_LOWER, TICK_UPPER],
        bkcAmount: ethers.formatEther(BKC_AMOUNT),
        ethAmount: ethers.formatEther(ETH_AMOUNT),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        liquidity: liq.toString()
    };

    const outPath = path.resolve(__dirname, "../uniswap-v3-pool.json");
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

    // ── Summary ────────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   ✅ UNISWAP V3 POOL READY!");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`   Pool:         ${poolAddr}`);
    console.log(`   Position:     NFT #${tokenId}`);
    console.log(`   Fee Tier:     0.3%`);
    console.log(`   BKC:          ${ethers.formatEther(BKC_AMOUNT)}`);
    console.log(`   WETH:         ${ethers.formatEther(ETH_AMOUNT)}`);
    console.log(`   Price:        ~${(7_000_000 / 3).toLocaleString()} BKC/ETH`);
    console.log(`   Saved:        ${outPath}`);
    console.log("════════════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
