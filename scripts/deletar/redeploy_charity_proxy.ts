// scripts/redeploy_charity_proxy.ts
import { ethers, upgrades } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("\n🔄 Re-deploying CharityPool Proxy...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Load addresses
    const addressPath = "./deployment-addresses.json";
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));

    const ecosystemManager = addresses.ecosystemManager;
    const miningManager = addresses.miningManager;

    console.log("\nDependencies:");
    console.log("  Owner (deployer):", deployer.address);
    console.log("  EcosystemManager:", ecosystemManager);

    // Deploy new proxy
    // initialize(address _owner, address _ecosystemManager)
    const CharityPool = await ethers.getContractFactory("CharityPool");
    
    const charityPool = await upgrades.deployProxy(
        CharityPool,
        [deployer.address, ecosystemManager],  // ← _owner, _ecosystemManager
        { 
            initializer: "initialize",
            kind: "uups"
        }
    );

    await charityPool.waitForDeployment();
    const newAddress = await charityPool.getAddress();

    console.log("\n✅ New CharityPool Proxy:", newAddress);

    // Verify initialization
    const owner = await charityPool.owner();
    const eco = await charityPool.ecosystemManager();
    console.log("\nVerification:");
    console.log("  Owner:", owner);
    console.log("  EcosystemManager:", eco);

    // Update addresses file
    addresses.charityPool = newAddress;
    fs.writeFileSync(addressPath, JSON.stringify(addresses, null, 2));
    console.log("\n📝 Updated deployment-addresses.json");

    // Re-authorize in MiningManager
    console.log("\n🔐 Authorizing new CharityPool in MiningManager...");
    const MiningManager = await ethers.getContractFactory("MiningManager");
    const miningMgr = MiningManager.attach(miningManager);
    
    const serviceKey = ethers.keccak256(ethers.toUtf8Bytes("CHARITY_POOL_SERVICE"));
    const tx = await miningMgr.setAuthorizedMiner(serviceKey, newAddress);
    await tx.wait();
    console.log("✅ Authorized!");

    console.log("\n═══════════════════════════════════════");
    console.log("✅ RE-DEPLOY COMPLETE!");
    console.log("   New CharityPool:", newAddress);
    console.log("═══════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });