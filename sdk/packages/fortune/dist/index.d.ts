import type { BackchainContext } from '@backchain/core';
import type { TxResult, GameInfo, GameResult, GameStatus, TierInfo } from '@backchain/core';
export declare class FortuneModule {
    private ctx;
    constructor(ctx: BackchainContext);
    play(wagerAmount: bigint, guesses: number[], tierMask?: number): Promise<TxResult & {
        gameId: bigint;
        secret: string;
    }>;
    reveal(gameId: bigint, guesses: number[], secret: string): Promise<TxResult & {
        prizeWon: bigint;
    }>;
    getGame(gameId: bigint): Promise<GameInfo>;
    getGameResult(gameId: bigint): Promise<GameResult>;
    getGameStatus(gameId: bigint): Promise<GameStatus>;
    activeGame(address?: string): Promise<bigint>;
    getTierInfo(tier: number): Promise<TierInfo>;
    getAllTiers(): Promise<{
        ranges: bigint[];
        multipliers: bigint[];
        winChances: bigint[];
    }>;
    getPoolStats(): Promise<{
        prizePool: bigint;
        totalGamesPlayed: bigint;
        totalBkcWagered: bigint;
        totalBkcWon: bigint;
        totalBkcForfeited: bigint;
        totalBkcBurned: bigint;
        maxPayoutNow: bigint;
    }>;
    calculateWinnings(wagerAmount: bigint, tierMask: number): Promise<{
        netToPool: bigint;
        bkcFee: bigint;
        maxPrize: bigint;
        maxPrizeAfterCap: bigint;
    }>;
}
//# sourceMappingURL=index.d.ts.map