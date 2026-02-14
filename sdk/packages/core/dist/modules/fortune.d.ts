import type { Backchain } from '../backchain.js';
import type { TxResult, GameInfo, GameResult, GameStatus, TierInfo } from '../types/index.js';
export declare class FortuneModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Play a Fortune Pool game (auto commit-reveal).
     * Generates a random secret, computes the commit hash, and submits.
     *
     * @param wagerAmount - BKC wager in wei
     * @param guesses - Array of guesses (one per enabled tier)
     * @param tierMask - Bitmask: 1=Tier0, 2=Tier1, 4=Tier2, 7=all
     * @returns TxResult with gameId in events
     */
    play(wagerAmount: bigint, guesses: number[], tierMask?: number): Promise<TxResult & {
        gameId: bigint;
        secret: string;
    }>;
    /**
     * Reveal a committed game to determine the result.
     * Must wait for REVEAL_DELAY blocks after commit.
     *
     * @param gameId - Game ID from play()
     * @param guesses - Same guesses used in commit
     * @param secret - Secret from play()
     */
    reveal(gameId: bigint, guesses: number[], secret: string): Promise<TxResult & {
        prizeWon: bigint;
    }>;
    /** Get game info by ID */
    getGame(gameId: bigint): Promise<GameInfo>;
    /** Get game result (after reveal) */
    getGameResult(gameId: bigint): Promise<GameResult>;
    /** Get game status (can reveal, blocks remaining) */
    getGameStatus(gameId: bigint): Promise<GameStatus>;
    /** Get the active game ID for a player (0 if none) */
    activeGame(address?: string): Promise<bigint>;
    /** Get tier info (range, multiplier, win chance) */
    getTierInfo(tier: number): Promise<TierInfo>;
    /** Get all tier info at once */
    getAllTiers(): Promise<{
        ranges: bigint[];
        multipliers: bigint[];
        winChances: bigint[];
    }>;
    /** Get prize pool and stats */
    getPoolStats(): Promise<{
        prizePool: bigint;
        totalGamesPlayed: bigint;
        totalBkcWagered: bigint;
        totalBkcWon: bigint;
        totalBkcForfeited: bigint;
        totalBkcBurned: bigint;
        maxPayoutNow: bigint;
    }>;
    /** Calculate potential winnings for a wager */
    calculateWinnings(wagerAmount: bigint, tierMask: number): Promise<{
        netToPool: bigint;
        bkcFee: bigint;
        maxPrize: bigint;
        maxPrizeAfterCap: bigint;
    }>;
}
//# sourceMappingURL=fortune.d.ts.map