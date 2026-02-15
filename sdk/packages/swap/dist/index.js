// @backchain/swap — Liquidity Pool / AMM
// ============================================================================
import { LIQUIDITY_POOL_ABI } from '@backchain/core';
export class SwapModule {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async buyBkc(ethAmount, slippageBps = 300) {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const expectedBkc = await pool.getQuote(ethAmount);
        const minBkcOut = expectedBkc - (expectedBkc * BigInt(slippageBps) / 10000n);
        const writePool = this.ctx.provider.getWriteContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const tx = await writePool.swapETHforBKC(minBkcOut, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async sellBkc(bkcAmount, slippageBps = 300) {
        const allowance = await this.ctx.getBkcAllowance(this.ctx.addresses.liquidityPool);
        if (allowance < bkcAmount) {
            await this.ctx.approveBkc(this.ctx.addresses.liquidityPool, bkcAmount);
        }
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const expectedEth = await pool.getQuoteBKCtoETH(bkcAmount);
        const minEthOut = expectedEth - (expectedEth * BigInt(slippageBps) / 10000n);
        const writePool = this.ctx.provider.getWriteContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const tx = await writePool.swapBKCforETH(bkcAmount, minEthOut);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    async getQuote(ethAmount) {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.getQuote(ethAmount);
    }
    async getQuoteBkcToEth(bkcAmount) {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.getQuoteBKCtoETH(bkcAmount);
    }
    async getCurrentPrice() {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.currentPrice();
    }
    async getReserves() {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const [eth, bkc] = await Promise.all([pool.ethReserve(), pool.bkcReserve()]);
        return { ethReserve: eth, bkcReserve: bkc };
    }
    async getSwapFeeBps() {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.SWAP_FEE_BPS();
    }
    async getStats() {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const [ethRes, bkcRes, totalLP, price, swapCount, ethVol, bkcVol] = await Promise.all([
            pool.ethReserve(), pool.bkcReserve(), pool.totalLPShares(),
            pool.currentPrice(), pool.totalSwapCount(), pool.totalEthVolume(), pool.totalBkcVolume(),
        ]);
        return { ethReserve: ethRes, bkcReserve: bkcRes, totalLPShares: totalLP, currentPrice: price, totalSwapCount: swapCount, totalEthVolume: ethVol, totalBkcVolume: bkcVol };
    }
}
//# sourceMappingURL=index.js.map