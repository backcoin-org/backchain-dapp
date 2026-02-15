// @backchain/fortune — Fortune Pool Module (Commit-Reveal Game)
// ============================================================================
import { ethers } from 'ethers';
import { FORTUNE_POOL_ABI, calculateFee, ACTION_IDS, } from '@backchain/core';
export class FortuneModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async play(wagerAmount, guesses, tierMask = 7) {
        if (tierMask < 1 || tierMask > 7)
            throw new Error('tierMask must be 1-7');
        const addr = this.ctx.addresses;
        const allowance = await this.ctx.getBkcAllowance(addr.fortunePool);
        if (allowance < wagerAmount) {
            await this.ctx.approveBkc(addr.fortunePool, wagerAmount);
        }
        const secret = ethers.hexlify(ethers.randomBytes(32));
        const guessesBI = guesses.map(g => BigInt(g));
        const commitHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['uint256[]', 'bytes32'], [guessesBI, secret]));
        let fee = 0n;
        if (tierMask & 1)
            fee += await calculateFee(this.ctx.provider, addr.backchainEcosystem, ACTION_IDS.FORTUNE_TIER0);
        if (tierMask & 2)
            fee += await calculateFee(this.ctx.provider, addr.backchainEcosystem, ACTION_IDS.FORTUNE_TIER1);
        if (tierMask & 4)
            fee += await calculateFee(this.ctx.provider, addr.backchainEcosystem, ACTION_IDS.FORTUNE_TIER2);
        const contract = this.ctx.provider.getWriteContract(addr.fortunePool, FORTUNE_POOL_ABI);
        const tx = await contract.commitPlay(commitHash, wagerAmount, tierMask, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(FORTUNE_POOL_ABI);
        let gameId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'GameCommitted')
                    gameId = parsed.args[0];
            }
            catch { /* skip */ }
        }
        return {
            hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed,
            events: { gameId }, gameId, secret,
        };
    }
    async reveal(gameId, guesses, secret) {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const guessesBI = guesses.map(g => BigInt(g));
        const tx = await contract.revealPlay(gameId, guessesBI, secret);
        const receipt = await tx.wait(1);
        const iface = new ethers.Interface(FORTUNE_POOL_ABI);
        let prizeWon = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'GameRevealed')
                    prizeWon = parsed.args[3];
            }
            catch { /* skip */ }
        }
        return {
            hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed,
            events: { prizeWon }, prizeWon,
        };
    }
    async getGame(gameId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const g = await c.getGame(gameId);
        return { player: g[0], commitBlock: g[1], tierMask: Number(g[2]), status: Number(g[3]), operator: g[4], wagerAmount: g[5] };
    }
    async getGameResult(gameId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const r = await c.getGameResult(gameId);
        return { player: r[0], grossWager: r[1], prizeWon: r[2], tierMask: Number(r[3]), matchCount: Number(r[4]), revealBlock: r[5] };
    }
    async getGameStatus(gameId) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const s = await c.getGameStatus(gameId);
        return { status: Number(s[0]), canReveal: s[1], blocksUntilReveal: s[2], blocksUntilExpiry: s[3] };
    }
    async activeGame(address) {
        const addr = address || this.ctx.provider.address;
        if (!addr)
            throw new Error('No address');
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        return c.activeGame(addr);
    }
    async getTierInfo(tier) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const t = await c.getTierInfo(tier);
        return { range: t[0], multiplier: t[1], winChanceBps: t[2] };
    }
    async getAllTiers() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const t = await c.getAllTiers();
        return { ranges: t[0], multipliers: t[1], winChances: t[2] };
    }
    async getPoolStats() {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const s = await c.getPoolStats();
        return {
            prizePool: s[0], totalGamesPlayed: s[1], totalBkcWagered: s[2],
            totalBkcWon: s[3], totalBkcForfeited: s[4], totalBkcBurned: s[5],
            maxPayoutNow: s[6],
        };
    }
    async calculateWinnings(wagerAmount, tierMask) {
        const c = this.ctx.provider.getReadContract(this.ctx.addresses.fortunePool, FORTUNE_POOL_ABI);
        const w = await c.calculatePotentialWinnings(wagerAmount, tierMask);
        return { netToPool: w[0], bkcFee: w[1], maxPrize: w[2], maxPrizeAfterCap: w[3] };
    }
}
//# sourceMappingURL=index.js.map