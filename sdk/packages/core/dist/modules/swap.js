// @backchain/sdk — Swap Module (Liquidity Pool / AMM)
// ============================================================================
import { LIQUIDITY_POOL_ABI } from '../contracts/abis.js';
export class SwapModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Write ───────────────────────────────────────────────────────────────
    /**
     * Swap ETH for BKC.
     * @param ethAmount - Amount of ETH to swap (in wei)
     * @param slippageBps - Max slippage in basis points (default 300 = 3%)
     */
    async buyBkc(ethAmount, slippageBps = 300) {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const expectedBkc = await pool.getQuote(ethAmount);
        const minBkcOut = expectedBkc - (expectedBkc * BigInt(slippageBps) / 10000n);
        const writePool = this.sdk.provider.getWriteContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const tx = await writePool.swapETHforBKC(minBkcOut, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /**
     * Swap BKC for ETH.
     * @param bkcAmount - Amount of BKC to swap (in wei)
     * @param slippageBps - Max slippage in basis points (default 300 = 3%)
     */
    async sellBkc(bkcAmount, slippageBps = 300) {
        // Auto-approve BKC
        const allowance = await this.sdk.getBkcAllowance(this.sdk.addresses.liquidityPool);
        if (allowance < bkcAmount) {
            await this.sdk.approveBkc(this.sdk.addresses.liquidityPool, bkcAmount);
        }
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const expectedEth = await pool.getQuoteBKCtoETH(bkcAmount);
        const minEthOut = expectedEth - (expectedEth * BigInt(slippageBps) / 10000n);
        const writePool = this.sdk.provider.getWriteContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const tx = await writePool.swapBKCforETH(bkcAmount, minEthOut);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Read ────────────────────────────────────────────────────────────────
    /** Get BKC output for a given ETH input */
    async getQuote(ethAmount) {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.getQuote(ethAmount);
    }
    /** Get ETH output for a given BKC input */
    async getQuoteBkcToEth(bkcAmount) {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.getQuoteBKCtoETH(bkcAmount);
    }
    /** Get current BKC price in ETH */
    async getCurrentPrice() {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.currentPrice();
    }
    /** Get pool reserves */
    async getReserves() {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const [eth, bkc] = await Promise.all([pool.ethReserve(), pool.bkcReserve()]);
        return { ethReserve: eth, bkcReserve: bkc };
    }
    /** Get swap fee in basis points */
    async getSwapFeeBps() {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.SWAP_FEE_BPS();
    }
    /** Get pool statistics */
    async getStats() {
        const pool = this.sdk.provider.getReadContract(this.sdk.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const [ethRes, bkcRes, totalLP, price, swapCount, ethVol, bkcVol] = await Promise.all([
            pool.ethReserve(), pool.bkcReserve(), pool.totalLPShares(),
            pool.currentPrice(), pool.totalSwapCount(), pool.totalEthVolume(), pool.totalBkcVolume(),
        ]);
        return { ethReserve: ethRes, bkcReserve: bkcRes, totalLPShares: totalLP, currentPrice: price, totalSwapCount: swapCount, totalEthVolume: ethVol, totalBkcVolume: bkcVol };
    }
}
//# sourceMappingURL=swap.js.map