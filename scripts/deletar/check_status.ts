// scripts/check_status.ts
// Verifica status de todos os contratos do ecossistema
//
// npx hardhat run scripts/check_status.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    const addressPath = path.resolve(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));

    console.log(`\n🔑 Deployer: ${deployer.address}`);

    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    const deployerBkc = await bkc.balanceOf(deployer.address);
    const deployerEth = await ethers.provider.getBalance(deployer.address);
    const totalSupply = await bkc.totalSupply();
    const totalBurned = await bkc.totalBurned();

    console.log(`💰 Deployer: ${ethers.formatEther(deployerBkc)} BKC / ${ethers.formatEther(deployerEth)} ETH`);
    console.log(`🪙 BKC Supply: ${ethers.formatEther(totalSupply)} | Burned: ${ethers.formatEther(totalBurned)}\n`);

    // ══════════════════════════════════════════════════════════════════════
    // FAUCET
    // ══════════════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   🚰 FAUCET");
    console.log("═══════════════════════════════════════════════════════════════");
    if (addresses.simpleBkcFaucet) {
        const faucetAbi = [
            "function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)",
            "function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)",
            "function paused() view returns (bool)",
            "function cooldown() view returns (uint256)"
        ];
        const faucet = new ethers.Contract(addresses.simpleBkcFaucet, faucetAbi, deployer);
        try {
            const s = await faucet.getFaucetStatus();
            const stats = await faucet.getStats();
            const paused = await faucet.paused();
            const cd = await faucet.cooldown();
            console.log(`   Endereço: ${addresses.simpleBkcFaucet}`);
            console.log(`   BKC:      ${ethers.formatEther(s[1])} (${ethers.formatEther(s[3])} por claim)`);
            console.log(`   ETH:      ${ethers.formatEther(s[0])} (${ethers.formatEther(s[2])} por claim)`);
            console.log(`   Claims BKC restantes: ${s[5]}`);
            console.log(`   Claims ETH restantes: ${s[4]}`);
            console.log(`   Cooldown: ${Number(cd) / 3600}h | Pausado: ${paused}`);
            console.log(`   Total distribuído: ${ethers.formatEther(stats[0])} BKC, ${ethers.formatEther(stats[1])} ETH`);
            console.log(`   Total claims: ${stats[2]} | Usuários únicos: ${stats[3]}`);
        } catch (e: any) { console.log(`   Erro: ${e.message}`); }
    }

    // ══════════════════════════════════════════════════════════════════════
    // FORTUNE POOL
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🎰 FORTUNE POOL");
    console.log("═══════════════════════════════════════════════════════════════");
    if (addresses.fortunePool) {
        const fortuneAbi = [
            "function prizePool() view returns (uint256)",
            "function TIER_COUNT() view returns (uint8)",
            "function getPoolStats() view returns (uint256 _prizePool, uint256 _totalGamesPlayed, uint256 _totalBkcWagered, uint256 _totalBkcWon, uint256 _totalBkcForfeited, uint256 _totalBkcBurned, uint256 _maxPayoutNow)",
            "function getRequiredFee(uint8 tierMask) view returns (uint256 fee)"
        ];
        const fortune = new ethers.Contract(addresses.fortunePool, fortuneAbi, deployer);
        try {
            const stats = await fortune.getPoolStats();
            console.log(`   Endereço:      ${addresses.fortunePool}`);
            console.log(`   Prize Pool:    ${ethers.formatEther(stats[0])} BKC`);
            console.log(`   Jogos:         ${stats[1]}`);
            console.log(`   Total wagered: ${ethers.formatEther(stats[2])} BKC`);
            console.log(`   Total won:     ${ethers.formatEther(stats[3])} BKC`);
            console.log(`   Total forfeit: ${ethers.formatEther(stats[4])} BKC`);
            console.log(`   Total burned:  ${ethers.formatEther(stats[5])} BKC`);
            console.log(`   Max payout:    ${ethers.formatEther(stats[6])} BKC`);
        } catch (e: any) {
            console.log(`   getPoolStats falhou: ${e.message}`);
            // Fallback: try individual reads
            try {
                const pool = await fortune.prizePool();
                console.log(`   Endereço:   ${addresses.fortunePool}`);
                console.log(`   Prize Pool: ${ethers.formatEther(pool)} BKC`);
                console.log(`   Tiers:      ${await fortune.TIER_COUNT()}`);
            } catch (e2: any) {
                console.log(`   prizePool() também falhou: ${e2.message}`);
                // Check if there's code at the address
                const code = await ethers.provider.getCode(addresses.fortunePool);
                console.log(`   Bytecode no endereço: ${code.length > 2 ? `${code.length} bytes` : 'NENHUM (endereço vazio)'}`);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // NFT POOLS
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🎨 NFT POOLS");
    console.log("═══════════════════════════════════════════════════════════════");
    const poolAbi = [
        "function initialized() view returns (bool)",
        "function bkcBalance() view returns (uint256)",
        "function nftCount() view returns (uint256)",
        "function mintableReserves() view returns (uint256)",
        "function k() view returns (uint256)",
        "function tier() view returns (uint8)"
    ];
    const bronzeAddr = addresses["pool_bronze"];
    console.log(`\n   --- BRONZE (single pool, on-demand minting) ---`);
    if (!bronzeAddr) { console.log(`   ⚠️ Não encontrado`); }
    else {
        const pool = new ethers.Contract(bronzeAddr, poolAbi, deployer);
        try {
            const init = await pool.initialized();
            console.log(`   Endereço:     ${bronzeAddr}`);
            console.log(`   Inicializado: ${init}`);
            if (init) {
                const [bkcBal, nfts, mintable, kVal] = await Promise.all([
                    pool.bkcBalance(), pool.nftCount(), pool.mintableReserves(), pool.k()
                ]);
                console.log(`   BKC Balance:  ${ethers.formatEther(bkcBal)}`);
                console.log(`   Real NFTs:    ${nfts}`);
                console.log(`   Mintable:     ${mintable}`);
                console.log(`   K:            ${ethers.formatEther(kVal)}`);
            }
        } catch (e: any) { console.log(`   Erro: ${e.message}`); }
    }

    // ══════════════════════════════════════════════════════════════════════
    // LIQUIDITY POOL
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   💧 LIQUIDITY POOL");
    console.log("═══════════════════════════════════════════════════════════════");
    if (addresses.liquidityPool) {
        const lpAbi = [
            "function getPoolStats() view returns (uint256 _ethReserve, uint256 _bkcReserve, uint256 _totalLPShares, uint64 _totalSwapCount, uint96 _totalEthVolume, uint96 _totalBkcVolume, uint256 _currentPrice)",
            "function ethReserve() view returns (uint256)",
            "function bkcReserve() view returns (uint256)",
            "function totalLPShares() view returns (uint256)"
        ];
        const lp = new ethers.Contract(addresses.liquidityPool, lpAbi, deployer);
        try {
            const stats = await lp.getPoolStats();
            console.log(`   Endereço:    ${addresses.liquidityPool}`);
            console.log(`   ETH:         ${ethers.formatEther(stats[0])}`);
            console.log(`   BKC:         ${ethers.formatEther(stats[1])}`);
            console.log(`   LP Shares:   ${ethers.formatEther(stats[2])}`);
            console.log(`   Swaps:       ${stats[3]}`);
            console.log(`   ETH Volume:  ${ethers.formatEther(stats[4])}`);
            console.log(`   BKC Volume:  ${ethers.formatEther(stats[5])}`);
            console.log(`   Price:       ${ethers.formatEther(stats[6])} BKC/ETH`);
        } catch (e: any) {
            console.log(`   getPoolStats falhou: ${e.message}`);
            try {
                const [ethR, bkcR] = await Promise.all([lp.ethReserve(), lp.bkcReserve()]);
                console.log(`   Endereço: ${addresses.liquidityPool}`);
                console.log(`   ETH:      ${ethers.formatEther(ethR)}`);
                console.log(`   BKC:      ${ethers.formatEther(bkcR)}`);
            } catch (e2: any) {
                console.log(`   ethReserve() também falhou: ${e2.message}`);
                const code = await ethers.provider.getCode(addresses.liquidityPool);
                console.log(`   Bytecode: ${code.length > 2 ? `${code.length} bytes` : 'NENHUM'}`);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STAKING POOL
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🥩 STAKING POOL");
    console.log("═══════════════════════════════════════════════════════════════");
    if (addresses.stakingPool) {
        const stakingAbi = [
            "function getStakingStats() view returns (uint256 _totalPStake, uint256 _totalBkcDelegated, uint256 _totalRewardsDistributed, uint256 _totalBurnedOnClaim, uint256 _totalForceUnstakePenalties, uint256 _totalEthFeesCollected, uint256 _accRewardPerShare)",
            "function totalPStake() view returns (uint256)",
            "function totalBkcDelegated() view returns (uint256)"
        ];
        const staking = new ethers.Contract(addresses.stakingPool, stakingAbi, deployer);
        try {
            const stats = await staking.getStakingStats();
            console.log(`   Endereço:         ${addresses.stakingPool}`);
            console.log(`   Total PStake:     ${ethers.formatEther(stats[0])}`);
            console.log(`   Total Delegated:  ${ethers.formatEther(stats[1])} BKC`);
            console.log(`   Total Rewards:    ${ethers.formatEther(stats[2])} BKC`);
            console.log(`   Burned on Claim:  ${ethers.formatEther(stats[3])} BKC`);
            console.log(`   Force Penalties:  ${ethers.formatEther(stats[4])} BKC`);
            console.log(`   ETH Fees:         ${ethers.formatEther(stats[5])}`);
        } catch (e: any) {
            console.log(`   getStakingStats falhou: ${e.message}`);
            try {
                const [totalP, totalD] = await Promise.all([
                    staking.totalPStake(), staking.totalBkcDelegated()
                ]);
                console.log(`   Endereço:        ${addresses.stakingPool}`);
                console.log(`   Total PStake:    ${ethers.formatEther(totalP)}`);
                console.log(`   Total Delegated: ${ethers.formatEther(totalD)} BKC`);
            } catch (e2: any) {
                console.log(`   totalPStake() também falhou: ${e2.message}`);
                const code = await ethers.provider.getCode(addresses.stakingPool);
                console.log(`   Bytecode: ${code.length > 2 ? `${code.length} bytes` : 'NENHUM'}`);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ECOSYSTEM
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🏛️ ECOSYSTEM");
    console.log("═══════════════════════════════════════════════════════════════");
    if (addresses.backchainEcosystem) {
        const ecoAbi = [
            "function treasury() view returns (address)",
            "function totalEthCollected() view returns (uint256)",
            "function totalBkcCollected() view returns (uint256)"
        ];
        const eco = new ethers.Contract(addresses.backchainEcosystem, ecoAbi, deployer);
        try {
            const [treasury, ethCol, bkcCol] = await Promise.all([
                eco.treasury(), eco.totalEthCollected(), eco.totalBkcCollected()
            ]);
            console.log(`   Endereço:   ${addresses.backchainEcosystem}`);
            console.log(`   Treasury:   ${treasury}`);
            console.log(`   ETH Fees:   ${ethers.formatEther(ethCol)}`);
            console.log(`   BKC Fees:   ${ethers.formatEther(bkcCol)}`);
        } catch (e: any) {
            console.log(`   Erro: ${e.message}`);
            const code = await ethers.provider.getCode(addresses.backchainEcosystem);
            console.log(`   Bytecode: ${code.length > 2 ? `${code.length} bytes` : 'NENHUM'}`);
        }
    }

    console.log("\n✅ Status check concluído.\n");
}

main().catch((error) => {
    console.error("\n❌ Erro:", error);
    process.exit(1);
});
