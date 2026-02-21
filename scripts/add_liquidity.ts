// scripts/add_liquidity.ts
// Adiciona liquidez ao LiquidityPool (BKC + ETH)
//
// Uso: npx hardhat run scripts/add_liquidity.ts --network arbitrumSepolia
//
// Se o pool estiver vazio, cria a liquidez inicial.
// Se já tiver liquidez, calcula BKC proporcional ao ETH enviado.

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Carregar endereços
    const addrPath = path.join(__dirname, "..", "deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addrPath, "utf8"));

    const bkcAddr = addresses.bkcToken;
    const lpAddr = addresses.liquidityPool;

    if (!bkcAddr || !lpAddr) {
        throw new Error("bkcToken or liquidityPool not found in deployment-addresses.json");
    }

    console.log("BKC Token:", bkcAddr);
    console.log("LiquidityPool:", lpAddr);

    // Contratos
    const bkc = await ethers.getContractAt("BKCToken", bkcAddr, deployer);
    const lp = await ethers.getContractAt("LiquidityPool", lpAddr, deployer);

    // Estado atual
    const ethReserve = await lp.ethReserve();
    const bkcReserve = await lp.bkcReserve();
    const totalShares = await lp.totalLPShares();
    const bkcBalance = await bkc.balanceOf(deployer.address);
    const ethBalance = await ethers.provider.getBalance(deployer.address);

    console.log("\n=== Estado Atual ===");
    console.log("Pool ETH Reserve:", ethers.formatEther(ethReserve), "ETH");
    console.log("Pool BKC Reserve:", ethers.formatEther(bkcReserve), "BKC");
    console.log("Pool Total Shares:", ethers.formatEther(totalShares));
    console.log("Deployer BKC:", ethers.formatEther(bkcBalance), "BKC");
    console.log("Deployer ETH:", ethers.formatEther(ethBalance), "ETH");

    // Quantidade de ETH a adicionar
    const ethToAdd = ethers.parseEther("1.0"); // 1 ETH

    let bkcToAdd: bigint;

    if (totalShares === 0n) {
        // Pool vazio — primeira liquidez, define preço inicial
        // 4M BKC + 1 ETH → preço: 0.00000025 ETH/BKC (4M BKC per ETH)
        bkcToAdd = ethers.parseEther("4000000"); // 4M BKC
        console.log("\n=== Pool vazio — criando liquidez inicial ===");
    } else {
        // Pool com liquidez — calcular BKC proporcional
        bkcToAdd = await lp.getOptimalBkcForEth(ethToAdd);
        // Adicionar 0.5% extra para evitar arredondamento
        bkcToAdd = bkcToAdd * 1005n / 1000n;
        console.log("\n=== Pool com liquidez — adicionando proporcionalmente ===");
    }

    console.log("ETH a adicionar:", ethers.formatEther(ethToAdd), "ETH");
    console.log("BKC a adicionar:", ethers.formatEther(bkcToAdd), "BKC");

    // Verificar saldos
    if (bkcBalance < bkcToAdd) {
        throw new Error(`BKC insuficiente! Tem ${ethers.formatEther(bkcBalance)}, precisa ${ethers.formatEther(bkcToAdd)}`);
    }
    if (ethBalance < ethToAdd + ethers.parseEther("0.01")) {
        throw new Error(`ETH insuficiente! Tem ${ethers.formatEther(ethBalance)}, precisa ~${ethers.formatEther(ethToAdd)} + gas`);
    }

    // Approve BKC
    console.log("\n1. Aprovando BKC...");
    const appTx = await bkc.approve(lpAddr, bkcToAdd);
    await appTx.wait();
    console.log("   Aprovado:", appTx.hash);

    // Add Liquidity
    console.log("2. Adicionando liquidez...");
    const addTx = await lp.addLiquidity(bkcToAdd, 0, { value: ethToAdd });
    const receipt = await addTx.wait();
    console.log("   TX:", addTx.hash);

    // Estado final
    const newEthRes = await lp.ethReserve();
    const newBkcRes = await lp.bkcReserve();
    const newShares = await lp.totalLPShares();
    const myShares = await lp.lpShares(deployer.address);

    console.log("\n=== Estado Final ===");
    console.log("Pool ETH Reserve:", ethers.formatEther(newEthRes), "ETH");
    console.log("Pool BKC Reserve:", ethers.formatEther(newBkcRes), "BKC");
    console.log("Pool Total Shares:", ethers.formatEther(newShares));
    console.log("Minhas Shares:", ethers.formatEther(myShares));
    console.log("Preço: 1 ETH =", Number(ethers.formatEther(newBkcRes)) / Number(ethers.formatEther(newEthRes)), "BKC");
    console.log("\n✅ Liquidez adicionada com sucesso!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
