import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Starting deployment...");
    console.log("   Account:", deployer.address);
    console.log("   Balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // CONFIGURAÇÃO: Endereços para a Arbitrum Sepolia
    // ATENÇÃO: Verifique se estes endereços existem nesta rede!
    const addresses = {
        bkcToken: "0x2B006d4924582010c9768B9CfE6f8cCA094Cfe3b", // Seu Token BKC na Arb Sepolia
        oracle: "0xd7e622124b78a28c4c928b271fc9423285804f98"   // Endereço do Relayer/Oracle
    };
    
    // Quantidades conforme definido no contrato 
    const tokensPerRequest = ethers.parseEther("100");  // 100 BKC
    const ethPerRequest = ethers.parseEther("0.008");   // 0.008 ETH
    
    console.log("\nArguments:");
    console.log(" - Token:", addresses.bkcToken);
    console.log(" - Relayer:", addresses.oracle);
    console.log(" - Tokens/Req:", ethers.formatEther(tokensPerRequest));
    console.log(" - ETH/Req:", ethers.formatEther(ethPerRequest));

    // Deploy
    const Faucet = await ethers.getContractFactory("SimpleBKCFaucet");
    
    // Passando argumentos na ordem exata do construtor 
    const faucet = await Faucet.deploy(
        addresses.bkcToken,
        addresses.oracle,
        tokensPerRequest,
        ethPerRequest
    );
    
    console.log("\n⏳ Waiting for deployment confirmation...");
    await faucet.waitForDeployment();
    
    const faucetAddress = await faucet.getAddress();
    
    console.log("✅ SimpleBKCFaucet V2 Deployed!");
    console.log("   Address:", faucetAddress);
    
    // Instruções pós-deploy
    console.log("\n📝 NEXT STEPS:");
    console.log("1. Update deployment-addresses.json with the new address.");
    console.log(`2. Verify contract: npx hardhat verify --network arbitrumSepolia ${faucetAddress} ${addresses.bkcToken} ${addresses.oracle} ${tokensPerRequest} ${ethPerRequest}`);
    console.log("3. Send ETH and BKC tokens to this contract address to fund it.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});