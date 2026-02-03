// scripts/genesis_message.ts
// ════════════════════════════════════════════════════════════════════════════
// VERIFICAR GENESIS - Lê perfil e post do Backchat
// ════════════════════════════════════════════════════════════════════════════

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    console.log("════════════════════════════════════════════════════════════════");
    console.log("   🔍 VERIFICAR GENESIS - Backchat V3.0");
    console.log("════════════════════════════════════════════════════════════════\n");

    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const backchat = await ethers.getContractAt("Backchat", addresses.backchat);

    // ════════════════════════════════════════════════════════════════════════
    // VERIFICAR PERFIL
    // ════════════════════════════════════════════════════════════════════════
    
    console.log("   👤 PERFIL @back_genesis:");
    console.log("   ────────────────────────────────────────────────────────────");
    
    try {
        // Por username
        const addr = await backchat.getAddressByUsername("back_genesis");
        console.log(`   Endereço: ${addr}`);
        
        // Dados completos
        const profile = await backchat.getProfile(addr);
        console.log(`   Username: @${profile.username}`);
        console.log(`   Display Name: ${profile.displayName}`);
        console.log(`   Bio: ${profile.bio}`);
        console.log(`   Created At: ${new Date(Number(profile.createdAt) * 1000).toISOString()}`);
        console.log(`   Posts: ${profile.postCount || 0}`);
        console.log(`   Followers: ${profile.followerCount || 0}`);
        console.log(`   Following: ${profile.followingCount || 0}`);
    } catch (e: any) {
        console.log(`   ❌ Erro: ${e.message?.slice(0, 50)}`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VERIFICAR POST #1
    // ════════════════════════════════════════════════════════════════════════
    
    console.log("\n   📝 POST #1:");
    console.log("   ────────────────────────────────────────────────────────────");
    
    try {
        const post = await backchat.getPost(1);
        console.log(`   ID: ${post.id || 1}`);
        console.log(`   Author: ${post.author}`);
        console.log(`   Content: ${post.content?.slice(0, 100)}...`);
        console.log(`   Created At: ${new Date(Number(post.createdAt) * 1000).toISOString()}`);
        console.log(`   Likes: ${post.likeCount || 0}`);
        console.log(`   Comments: ${post.commentCount || 0}`);
        console.log(`   Reposts: ${post.repostCount || 0}`);
        console.log(`   Spotlight: ${post.spotlightAmount || 0}`);
    } catch (e: any) {
        console.log(`   ❌ Erro: ${e.message?.slice(0, 50)}`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ESTATÍSTICAS GERAIS
    // ════════════════════════════════════════════════════════════════════════
    
    console.log("\n   📊 ESTATÍSTICAS:");
    console.log("   ────────────────────────────────────────────────────────────");
    
    try {
        const totalUsers = await backchat.totalUsers();
        console.log(`   Total Users: ${totalUsers}`);
    } catch (e) {}

    try {
        const totals = await backchat.getTotals();
        console.log(`   Total Posts: ${totals.totalPosts || totals[0]}`);
        console.log(`   Total Comments: ${totals.totalComments || totals[1]}`);
    } catch (e) {}

    try {
        const stats = await backchat.getEconomyStats();
        console.log(`   BKC Distributed: ${ethers.formatEther(stats.totalBkcDistributed || stats[0])} BKC`);
        console.log(`   BKC to Creators: ${ethers.formatEther(stats.totalBkcToCreators || stats[1])} BKC`);
        console.log(`   BKC to Ecosystem: ${ethers.formatEther(stats.totalBkcToEcosystem || stats[2])} BKC`);
    } catch (e) {}

    console.log("\n════════════════════════════════════════════════════════════════\n");
}

import hre from "hardhat";
runScript(hre).catch(console.error);