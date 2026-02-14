// @backchain/sdk — Fortune Pool Module (Commit-Reveal Game)
// ============================================================================
import { ethers } from 'ethers';
import { FORTUNE_POOL_ABI } from '../contracts/abis.js';
import { calculateFee, ACTION_IDS } from '../fees.js';
export class FortuneModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Write ───────────────────────────────────────────────────────────────
    /**
     * Play a Fortune Pool game (auto commit-reveal).
     * Generates a random secret, computes the commit hash, and submits.
     *
     * @param wagerAmount - BKC wager in wei
     * @param guesses - Array of guesses (one per enabled tier)
     * @param tierMask - Bitmask: 1=Tier0, 2=Tier1, 4=Tier2, 7=all
     * @returns TxResult with gameId in events
     */
    async play(wagerAmount, guesses, tierMask = 7) {
        if (tierMask < 1 || tierMask > 7)
            throw new Error('tierMask must be 1-7');
        const addr = this.sdk.addresses;
        // Auto-approve BKC
        const allowance = await this.sdk.getBkcAllowance(addr.fortunePool);
        if (allowance < wagerAmount) {
            await this.sdk.approveBkc(addr.fortunePool, wagerAmount);
        }
        // Generate secret
        const secret = ethers.hexlify(ethers.randomBytes(32));
        const guessesBI = guesses.map(g => BigInt(g));
        // Compute commit hash
        const commitHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['uint256[]', 'bytes32'], [guessesBI, secret]));
        // Calculate ETH fee (sum per-tier)
        let fee = 0n;
        if (tierMask & 1)
            fee += await calculateFee(this.sdk.provider, addr.backchainEcosystem, ACTION_IDS.FORTUNE_TIER0);
        if (tierMask & 2)
            fee += await calculateFee(this.sdk.provider, addr.backchainEcosystem, ACTION_IDS.FORTUNE_TIER1);
        if (tierMask & 4)
            fee += await calculateFee(this.sdk.provider, addr.backchainEcosystem, ACTION_IDS.FORTUNE_TIER2);
        const contract = this.sdk.provider.getWriteContract(addr.fortunePool, FORTUNE_POOL_ABI);
        const tx = await contract.commitPlay(commitHash, wagerAmount, tierMask, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        // Parse GameCommitted event
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
    /**
     * Reveal a committed game to determine the result.
     * Must wait for REVEAL_DELAY blocks after commit.
     *
     * @param gameId - Game ID from play()
     * @param guesses - Same guesses used in commit
     * @param secret - Secret from play()
     */
    async reveal(gameId, guesses, secret) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const guessesBI = guesses.map(g => BigInt(g));
        const tx = await contract.revealPlay(gameId, guessesBI, secret);
        const receipt = await tx.wait(1);
        // Parse GameRevealed event
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
    // ── Read ────────────────────────────────────────────────────────────────
    /** Get game info by ID */
    async getGame(gameId) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const g = await c.getGame(gameId);
        return { player: g[0], commitBlock: g[1], tierMask: Number(g[2]), status: Number(g[3]), operator: g[4], wagerAmount: g[5] };
    }
    /** Get game result (after reveal) */
    async getGameResult(gameId) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const r = await c.getGameResult(gameId);
        return { player: r[0], grossWager: r[1], prizeWon: r[2], tierMask: Number(r[3]), matchCount: Number(r[4]), revealBlock: r[5] };
    }
    /** Get game status (can reveal, blocks remaining) */
    async getGameStatus(gameId) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const s = await c.getGameStatus(gameId);
        return { status: Number(s[0]), canReveal: s[1], blocksUntilReveal: s[2], blocksUntilExpiry: s[3] };
    }
    /** Get the active game ID for a player (0 if none) */
    async activeGame(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        return c.activeGame(addr);
    }
    /** Get tier info (range, multiplier, win chance) */
    async getTierInfo(tier) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const t = await c.getTierInfo(tier);
        return { range: t[0], multiplier: t[1], winChanceBps: t[2] };
    }
    /** Get all tier info at once */
    async getAllTiers() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const t = await c.getAllTiers();
        return { ranges: t[0], multipliers: t[1], winChances: t[2] };
    }
    /** Get prize pool and stats */
    async getPoolStats() {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const s = await c.getPoolStats();
        return {
            prizePool: s[0], totalGamesPlayed: s[1], totalBkcWagered: s[2],
            totalBkcWon: s[3], totalBkcForfeited: s[4], totalBkcBurned: s[5],
            maxPayoutNow: s[6],
        };
    }
    /** Calculate potential winnings for a wager */
    async calculateWinnings(wagerAmount, tierMask) {
        const c = this.sdk.provider.getReadContract(this.sdk.addresses.fortunePool, FORTUNE_POOL_ABI);
        const w = await c.calculatePotentialWinnings(wagerAmount, tierMask);
        return { netToPool: w[0], bkcFee: w[1], maxPrize: w[2], maxPrizeAfterCap: w[3] };
    }
}
//# sourceMappingURL=fortune.js.map