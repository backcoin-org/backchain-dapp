// scripts/update_faucet_config.ts
// ════════════════════════════════════════════════════════════════════════════
// Atualiza config do SimpleBKCFaucet: valores de distribuição + relayer
// ════════════════════════════════════════════════════════════════════════════
//
// npx hardhat run scripts/update_faucet_config.ts --network arbitrumSepolia
//
// ════════════════════════════════════════════════════════════════════════════

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const FAUCET_ABI = [
    "function setConfig(address _relayer, uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown) external",
    "function relayer() view returns (address)",
    "function tokensPerClaim() view returns (uint256)",
    "function ethPerClaim() view returns (uint256)",
    "function cooldown() view returns (uint256)",
    "function paused() view returns (bool)",
    "function deployer() view returns (address)",
    "function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)"
];

// ════════════════════════════════════════════════════════════════════════════
// NOVA CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════════════════════

const NEW_TOKENS_PER_CLAIM = ethers.parseEther("1000");    // 1000 BKC
const NEW_ETH_PER_CLAIM    = ethers.parseEther("0.01");    // 0.01 ETH
const NEW_COOLDOWN         = 86400;                        // 24 horas

async function main() {
    const [deployer] = await ethers.getSigners();
    const addressPath = path.resolve(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));

    const faucetAddr = addresses.simpleBkcFaucet;
    if (!faucetAddr) {
        console.error("❌ simpleBkcFaucet não encontrado em deployment-addresses.json");
        process.exit(1);
    }

    console.log(`\n🔑 Deployer: ${deployer.address}`);
    console.log(`🚰 Faucet:   ${faucetAddr}`);

    const faucet = new ethers.Contract(faucetAddr, FAUCET_ABI, deployer);

    // Verificar que somos o deployer
    const contractDeployer = await faucet.deployer();
    if (contractDeployer.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error(`❌ Deployer mismatch! Contract deployer: ${contractDeployer}`);
        process.exit(1);
    }

    // Status atual
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   CONFIGURAÇÃO ATUAL");
    console.log("═══════════════════════════════════════════════════════════════");
    const currentRelayer = await faucet.relayer();
    const currentTokens = await faucet.tokensPerClaim();
    const currentEth = await faucet.ethPerClaim();
    const currentCooldown = await faucet.cooldown();
    const isPaused = await faucet.paused();

    console.log(`   Relayer:        ${currentRelayer}`);
    console.log(`   Tokens/claim:   ${ethers.formatEther(currentTokens)} BKC`);
    console.log(`   ETH/claim:      ${ethers.formatEther(currentEth)} ETH`);
    console.log(`   Cooldown:       ${Number(currentCooldown) / 3600}h`);
    console.log(`   Pausado:        ${isPaused}`);

    // Fundos atuais
    const status = await faucet.getFaucetStatus();
    console.log(`\n   ETH no faucet:  ${ethers.formatEther(status[0])}`);
    console.log(`   BKC no faucet:  ${ethers.formatEther(status[1])}`);

    // Aplicar nova config
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   NOVA CONFIGURAÇÃO");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`   Relayer:        ${deployer.address} (deployer)`);
    console.log(`   Tokens/claim:   ${ethers.formatEther(NEW_TOKENS_PER_CLAIM)} BKC`);
    console.log(`   ETH/claim:      ${ethers.formatEther(NEW_ETH_PER_CLAIM)} ETH`);
    console.log(`   Cooldown:       ${NEW_COOLDOWN / 3600}h`);

    console.log(`\n   📤 Chamando setConfig()...`);
    const tx = await faucet.setConfig(
        deployer.address,       // relayer = deployer
        NEW_TOKENS_PER_CLAIM,
        NEW_ETH_PER_CLAIM,
        NEW_COOLDOWN
    );
    const receipt = await tx.wait();
    console.log(`   ✅ TX: ${receipt!.hash}`);

    // Verificar
    const newTokens = await faucet.tokensPerClaim();
    const newEth = await faucet.ethPerClaim();
    const newRelayer = await faucet.relayer();
    console.log(`\n   Verificação:`);
    console.log(`   Relayer:      ${newRelayer}`);
    console.log(`   Tokens/claim: ${ethers.formatEther(newTokens)} BKC`);
    console.log(`   ETH/claim:    ${ethers.formatEther(newEth)} ETH`);

    // Calcular claims disponíveis
    const ethBal = status[0];
    const tokenBal = status[1];
    const ethClaims = NEW_ETH_PER_CLAIM > 0n ? ethBal / NEW_ETH_PER_CLAIM : 999999n;
    const tokenClaims = tokenBal / NEW_TOKENS_PER_CLAIM;

    console.log(`\n   Claims disponíveis:`);
    console.log(`   BKC: ${tokenClaims} claims (${ethers.formatEther(tokenBal)} BKC / ${ethers.formatEther(NEW_TOKENS_PER_CLAIM)} per claim)`);
    console.log(`   ETH: ${ethClaims} claims (${ethers.formatEther(ethBal)} ETH / ${ethers.formatEther(NEW_ETH_PER_CLAIM)} per claim)`);

    if (ethClaims < 20n) {
        console.log(`\n   ⚠️ ATENÇÃO: Apenas ${ethClaims} claims ETH disponíveis!`);
        console.log(`   Considere enviar mais ETH ao faucet: ${faucetAddr}`);
    }

    console.log("\n✅ Configuração atualizada com sucesso!\n");
}

main().catch((error) => {
    console.error("\n❌ Erro:", error);
    process.exit(1);
});
