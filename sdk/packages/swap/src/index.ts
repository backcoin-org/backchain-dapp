// @backchain/swap — Liquidity Pool / AMM
// ============================================================================

import { ethers } from 'ethers';
import { LIQUIDITY_POOL_ABI, BKC_TOKEN_ABI } from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { TxResult, LiquidityPoolStats } from '@backchain/core';

export class SwapModule {
    constructor(private ctx: BackchainContext) {}

    async buyBkc(ethAmount: bigint, slippageBps: number = 300): Promise<TxResult> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const expectedBkc = await pool.getQuote(ethAmount);
        const minBkcOut = expectedBkc - (expectedBkc * BigInt(slippageBps) / 10000n);

        const writePool = this.ctx.provider.getWriteContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const tx = await writePool.swapETHforBKC(minBkcOut, { value: ethAmount });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async sellBkc(bkcAmount: bigint, slippageBps: number = 300): Promise<TxResult> {
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

    async getQuote(ethAmount: bigint): Promise<bigint> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.getQuote(ethAmount);
    }

    async getQuoteBkcToEth(bkcAmount: bigint): Promise<bigint> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.getQuoteBKCtoETH(bkcAmount);
    }

    async getCurrentPrice(): Promise<bigint> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.currentPrice();
    }

    async getReserves(): Promise<{ ethReserve: bigint; bkcReserve: bigint }> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const [eth, bkc] = await Promise.all([pool.ethReserve(), pool.bkcReserve()]);
        return { ethReserve: eth, bkcReserve: bkc };
    }

    async getSwapFeeBps(): Promise<bigint> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        return pool.SWAP_FEE_BPS();
    }

    async getStats(): Promise<LiquidityPoolStats> {
        const pool = this.ctx.provider.getReadContract(this.ctx.addresses.liquidityPool, LIQUIDITY_POOL_ABI);
        const [ethRes, bkcRes, totalLP, price, swapCount, ethVol, bkcVol] = await Promise.all([
            pool.ethReserve(), pool.bkcReserve(), pool.totalLPShares(),
            pool.currentPrice(), pool.totalSwapCount(), pool.totalEthVolume(), pool.totalBkcVolume(),
        ]);
        return { ethReserve: ethRes, bkcReserve: bkcRes, totalLPShares: totalLP, currentPrice: price, totalSwapCount: swapCount, totalEthVolume: ethVol, totalBkcVolume: bkcVol };
    }
}
