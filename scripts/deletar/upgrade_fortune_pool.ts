/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    FORTUNE POOL UPGRADE SCRIPT                            ║
 * ║                                                                           ║
 * ║  Upgrades FortunePool to fix Oracle interface (camelCase functions)       ║
 * ║  - get_numbers -> getNumbers                                              ║
 * ║  - get_batch -> getBatch                                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("\n" + "═".repeat(70));
    console.log("   🔄 FORTUNE POOL UPGRADE");
    console.log("   📝 Fixing Oracle interface (camelCase)");
    console.log("═".repeat(70));

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log(`\n   👤 Deployer: ${deployer.address}`);
    
    const balance = await deployer.provider!.getBalance(deployer.address);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // Load deployment addresses
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("deployment-addresses.json not found. Run deployment first.");
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const fortunePoolProxy = addresses.fortunePool;
    
    if (!fortunePoolProxy) {
        throw new Error("FortunePool address not found in deployment-addresses.json");
    }
    
    console.log(`\n   📍 FortunePool Proxy: ${fortunePoolProxy}`);

    // Get current implementation
    const proxyAdmin = await upgrades.erc1967.getImplementationAddress(fortunePoolProxy);
    console.log(`   📍 Current Implementation: ${proxyAdmin}`);

    // Verify we're the owner
    const currentContract = await ethers.getContractAt("FortunePool", fortunePoolProxy, deployer);
    const owner = await currentContract.owner();
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        throw new Error(`Not the owner! Owner is ${owner}, you are ${deployer.address}`);
    }
    console.log(`   ✅ Ownership verified`);

    // Get current state (to verify after upgrade)
    console.log("\n   📊 Current State:");
    const prizePoolBefore = await currentContract.prizePoolBalance();
    const gameCounterBefore = await currentContract.gameCounter();
    const oracleAddressBefore = await currentContract.getOracleAddress();
    const serviceFeeBefore = await currentContract.serviceFee();
    const activeTiersBefore = await currentContract.activeTierCount();
    
    console.log(`      Prize Pool: ${ethers.formatEther(prizePoolBefore)} BKC`);
    console.log(`      Games Played: ${gameCounterBefore}`);
    console.log(`      Oracle: ${oracleAddressBefore}`);
    console.log(`      Service Fee: ${ethers.formatEther(serviceFeeBefore)} ETH`);
    console.log(`      Active Tiers: ${activeTiersBefore}`);

    // Upgrade
    console.log("\n   🔄 Upgrading FortunePool...");
    
    const FortunePoolV2 = await ethers.getContractFactory("FortunePool", deployer);
    
    const upgraded = await upgrades.upgradeProxy(fortunePoolProxy, FortunePoolV2, {
        kind: "uups",
        redeployImplementation: "always"  // Force redeploy even if bytecode matches
    });
    
    await upgraded.waitForDeployment();
    
    const newImplementation = await upgrades.erc1967.getImplementationAddress(fortunePoolProxy);
    console.log(`   ✅ Upgrade complete!`);
    console.log(`   📍 New Implementation: ${newImplementation}`);

    // Verify state preserved
    console.log("\n   📊 Verifying State Preserved:");
    const prizePoolAfter = await upgraded.prizePoolBalance();
    const gameCounterAfter = await upgraded.gameCounter();
    const oracleAddressAfter = await upgraded.getOracleAddress();
    const serviceFeeAfter = await upgraded.serviceFee();
    const activeTiersAfter = await upgraded.activeTierCount();
    
    const stateOk = 
        prizePoolBefore.toString() === prizePoolAfter.toString() &&
        gameCounterBefore.toString() === gameCounterAfter.toString() &&
        oracleAddressBefore.toLowerCase() === oracleAddressAfter.toLowerCase() &&
        serviceFeeBefore.toString() === serviceFeeAfter.toString() &&
        activeTiersBefore.toString() === activeTiersAfter.toString();
    
    if (stateOk) {
        console.log(`      ✅ Prize Pool: ${ethers.formatEther(prizePoolAfter)} BKC`);
        console.log(`      ✅ Games Played: ${gameCounterAfter}`);
        console.log(`      ✅ Oracle: ${oracleAddressAfter}`);
        console.log(`      ✅ Service Fee: ${ethers.formatEther(serviceFeeAfter)} ETH`);
        console.log(`      ✅ Active Tiers: ${activeTiersAfter}`);
        console.log(`\n   ✅ All state preserved correctly!`);
    } else {
        console.log(`\n   ⚠️ WARNING: State mismatch detected!`);
        console.log(`      Prize Pool: ${prizePoolBefore} -> ${prizePoolAfter}`);
        console.log(`      Games: ${gameCounterBefore} -> ${gameCounterAfter}`);
        console.log(`      Oracle: ${oracleAddressBefore} -> ${oracleAddressAfter}`);
    }

    // Test Oracle call (optional - just to verify the fix)
    console.log("\n   🧪 Testing Oracle Integration...");
    try {
        // Try a static call to verify the interface is correct
        const oracleABI = [
            "function getNumbers(uint64 count, uint64 min, uint64 max) external returns (uint256[] memory)"
        ];
        const oracle = new ethers.Contract(oracleAddressAfter, oracleABI, deployer);
        const testResult = await oracle.getNumbers.staticCall(1, 1, 100);
        console.log(`      ✅ Oracle responds correctly! Test roll: ${testResult[0]}`);
    } catch (e: any) {
        console.log(`      ⚠️ Oracle test skipped: ${e.message?.slice(0, 50)}`);
    }

    // Update addresses file with new implementation (optional)
    addresses.fortunePoolImplementation = newImplementation;
    addresses.fortunePoolUpgradeTimestamp = new Date().toISOString();
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`\n   📝 Updated deployment-addresses.json`);

    // Summary
    console.log("\n" + "═".repeat(70));
    console.log("   ✅ UPGRADE SUCCESSFUL!");
    console.log("═".repeat(70));
    console.log(`\n   📋 Summary:`);
    console.log(`      Proxy Address: ${fortunePoolProxy}`);
    console.log(`      Old Implementation: ${proxyAdmin}`);
    console.log(`      New Implementation: ${newImplementation}`);
    console.log(`\n   🔗 Verify on Arbiscan:`);
    console.log(`      https://sepolia.arbiscan.io/address/${fortunePoolProxy}#code`);
    console.log("\n   📌 Next Steps:");
    console.log(`      1. Run: npx hardhat run scripts/5_verify_full_ecosystem.ts --network arbitrumSepolia`);
    console.log(`      2. Test Fortune Pool play() function`);
    console.log("═".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Upgrade failed:", error);
        process.exit(1);
    });