// scripts/fund_faucet.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚰 REABASTECER ECOSSISTEMA — Faucet + FortunePool + NFT Pools
// ════════════════════════════════════════════════════════════════════════════
//
// Uso:
//   npx hardhat run scripts/fund_faucet.ts --network arbitrumSepolia
//
// ════════════════════════════════════════════════════════════════════════════

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════════════════════

const FAUCET_BKC  = ethers.parseEther("2000000");  // 2M BKC
const FAUCET_ETH  = ethers.parseEther("0.05");      // 0.05 ETH
const FORTUNE_BKC = ethers.parseEther("500000");     // 500K BKC
const NFT_POOL_BKC_EACH = ethers.parseEther("500000"); // 500K BKC por pool

const TIER_NAMES = ["bronze", "silver", "gold", "diamond"];
const TIER_NFT_COUNTS = [100, 50, 30, 10]; // NFTs mintados por tier no deploy

// ════════════════════════════════════════════════════════════════════════════
// ABIs MÍNIMAS
// ════════════════════════════════════════════════════════════════════════════

const FAUCET_ABI = [
    "function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)",
    "function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)",
    "function paused() view returns (bool)"
];

const FORTUNE_ABI = [
    "function prizePool() view returns (uint256)",
    "function fundPrizePool(uint256 amount) external",
    "function TIER_COUNT() view returns (uint256)"
];

const NFT_POOL_ABI = [
    "function initialized() view returns (bool)",
    "function bkcBalance() view returns (uint256)",
    "function nftCount() view returns (uint256)",
    "function k() view returns (uint256)",
    "function tier() view returns (uint8)",
    "function initializePool(uint256[] calldata tokenIds, uint256 bkcAmount) external"
];

const BOOSTER_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenTier(uint256 tokenId) view returns (uint8)",
    "function setApprovalForAll(address operator, bool approved) external",
    "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

// ════════════════════════════════════════════════════════════════════════════

async function main() {
    const [deployer] = await ethers.getSigners();
    const addressPath = path.resolve(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));

    console.log(`\n🔑 Deployer: ${deployer.address}`);

    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    const deployerBkc = await bkc.balanceOf(deployer.address);
    const deployerEth = await ethers.provider.getBalance(deployer.address);

    console.log(`💰 Saldo: ${ethers.formatEther(deployerBkc)} BKC / ${ethers.formatEther(deployerEth)} ETH\n`);

    // ══════════════════════════════════════════════════════════════════════
    // 1. FAUCET
    // ══════════════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   🚰 FAUCET");
    console.log("═══════════════════════════════════════════════════════════════");

    const faucetAddr = addresses.simpleBkcFaucet;
    if (!faucetAddr) {
        console.log("   ⚠️ simpleBkcFaucet não encontrado. Pulando.\n");
    } else {
        const faucet = new ethers.Contract(faucetAddr, FAUCET_ABI, deployer);

        try {
            const status = await faucet.getFaucetStatus();
            console.log(`   Antes → ETH: ${ethers.formatEther(status[0])} | BKC: ${ethers.formatEther(status[1])}`);
            console.log(`   Claims restantes → ETH: ${status[4]} | BKC: ${status[5]}`);
        } catch { console.log("   (status indisponível)"); }

        // Enviar BKC
        console.log(`\n   📤 Enviando ${ethers.formatEther(FAUCET_BKC)} BKC...`);
        let tx = await bkc.transfer(faucetAddr, FAUCET_BKC);
        let r = await tx.wait();
        console.log(`   ✅ BKC TX: ${r!.hash}`);

        // Enviar ETH
        console.log(`   📤 Enviando ${ethers.formatEther(FAUCET_ETH)} ETH...`);
        tx = await deployer.sendTransaction({ to: faucetAddr, value: FAUCET_ETH });
        r = await tx.wait();
        console.log(`   ✅ ETH TX: ${r!.hash}`);

        try {
            const after = await faucet.getFaucetStatus();
            console.log(`   Depois → ETH: ${ethers.formatEther(after[0])} | BKC: ${ethers.formatEther(after[1])}`);
            console.log(`   Claims restantes → ETH: ${after[4]} | BKC: ${after[5]}`);
        } catch {}
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. FORTUNE POOL
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🎰 FORTUNE POOL");
    console.log("═══════════════════════════════════════════════════════════════");

    const fortuneAddr = addresses.fortunePool;
    if (!fortuneAddr) {
        console.log("   ⚠️ fortunePool não encontrado. Pulando.\n");
    } else {
        const fortune = new ethers.Contract(fortuneAddr, FORTUNE_ABI, deployer);

        const poolBefore = await fortune.prizePool();
        console.log(`   Antes → Prize Pool: ${ethers.formatEther(poolBefore)} BKC`);

        console.log(`\n   📤 Approve ${ethers.formatEther(FORTUNE_BKC)} BKC...`);
        let tx = await bkc.approve(fortuneAddr, FORTUNE_BKC);
        await tx.wait();

        console.log(`   📤 fundPrizePool(${ethers.formatEther(FORTUNE_BKC)})...`);
        tx = await fortune.fundPrizePool(FORTUNE_BKC);
        const r = await tx.wait();
        console.log(`   ✅ TX: ${r!.hash}`);

        const poolAfter = await fortune.prizePool();
        console.log(`   Depois → Prize Pool: ${ethers.formatEther(poolAfter)} BKC`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. NFT POOLS
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🎨 NFT POOLS");
    console.log("═══════════════════════════════════════════════════════════════");

    const boosterAddr = addresses.rewardBooster;
    if (!boosterAddr) {
        console.log("   ⚠️ rewardBooster não encontrado. Pulando.\n");
    } else {
        const booster = new ethers.Contract(boosterAddr, BOOSTER_ABI, deployer);

        const poolKeys = ["pool_bronze", "pool_silver", "pool_gold", "pool_diamond"];

        for (let i = 0; i < 4; i++) {
            const poolAddr = addresses[poolKeys[i]];
            const tierName = TIER_NAMES[i].toUpperCase();

            console.log(`\n   --- ${tierName} ---`);

            if (!poolAddr) {
                console.log(`   ⚠️ ${poolKeys[i]} não encontrado. Pulando.`);
                continue;
            }

            const pool = new ethers.Contract(poolAddr, NFT_POOL_ABI, deployer);
            const isInit = await pool.initialized();

            if (isInit) {
                const bkcBal = await pool.bkcBalance();
                const nfts = await pool.nftCount();
                const kVal = await pool.k();
                console.log(`   ✅ Já inicializado → ${ethers.formatEther(bkcBal)} BKC | ${nfts} NFTs | K=${ethers.formatEther(kVal)}`);
                continue;
            }

            // Pool NÃO inicializado — precisa de NFTs do tier correto
            console.log(`   ❌ NÃO inicializado. Buscando NFTs do deployer...`);

            const nftBalance = await booster.balanceOf(deployer.address);
            console.log(`   Deployer tem ${nftBalance} NFTs total no RewardBooster`);

            if (nftBalance === 0n) {
                console.log(`   ⚠️ Deployer não tem NFTs. Não é possível inicializar.`);
                continue;
            }

            // Coletar tokenIds do tier correto
            const tierTokenIds: bigint[] = [];
            const targetTier = i; // 0=bronze, 1=silver, 2=gold, 3=diamond

            for (let j = 0; j < Number(nftBalance); j++) {
                const tokenId = await booster.tokenOfOwnerByIndex(deployer.address, j);
                const tokenTier = await booster.tokenTier(tokenId);
                if (Number(tokenTier) === targetTier) {
                    tierTokenIds.push(tokenId);
                }
                if (tierTokenIds.length >= TIER_NFT_COUNTS[i]) break;
            }

            console.log(`   Encontrados ${tierTokenIds.length}/${TIER_NFT_COUNTS[i]} NFTs tier ${tierName}`);

            if (tierTokenIds.length === 0) {
                console.log(`   ⚠️ Sem NFTs deste tier. Não é possível inicializar.`);
                continue;
            }

            // Approve NFTs
            const isApproved = await booster.isApprovedForAll(deployer.address, poolAddr);
            if (!isApproved) {
                console.log(`   📤 Aprovando NFTs para o pool...`);
                const txApprove = await booster.setApprovalForAll(poolAddr, true);
                await txApprove.wait();
            }

            // Approve BKC
            console.log(`   📤 Approve ${ethers.formatEther(NFT_POOL_BKC_EACH)} BKC...`);
            let tx = await bkc.approve(poolAddr, NFT_POOL_BKC_EACH);
            await tx.wait();

            // Initialize
            console.log(`   📤 initializePool(${tierTokenIds.length} NFTs, ${ethers.formatEther(NFT_POOL_BKC_EACH)} BKC)...`);
            tx = await pool.initializePool(tierTokenIds, NFT_POOL_BKC_EACH);
            const r = await tx.wait();
            console.log(`   ✅ TX: ${r!.hash}`);

            const bkcAfter = await pool.bkcBalance();
            const nftsAfter = await pool.nftCount();
            console.log(`   Pool ${tierName}: ${ethers.formatEther(bkcAfter)} BKC | ${nftsAfter} NFTs`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ══════════════════════════════════════════════════════════════════════
    const finalBkc = await bkc.balanceOf(deployer.address);
    const finalEth = await ethers.provider.getBalance(deployer.address);
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   📊 RESUMO FINAL");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`   Deployer: ${ethers.formatEther(finalBkc)} BKC / ${ethers.formatEther(finalEth)} ETH`);
    console.log(`   BKC gasto: ${ethers.formatEther(deployerBkc - finalBkc)}`);
    console.log(`   ETH gasto: ${ethers.formatEther(deployerEth - finalEth)}`);
    console.log("\n✅ Reabastecimento concluído!\n");
}

main().catch((error) => {
    console.error("\n❌ Erro:", error);
    process.exit(1);
});
