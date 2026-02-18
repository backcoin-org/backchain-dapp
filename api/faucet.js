// api/faucet.js
// Vercel Serverless Relayer — SimpleBKCFaucet gasless claims
//
// GET /api/faucet?address=0x...
//
// Calls distributeTo(address) on the faucet contract, paying gas via FAUCET_RELAYER_KEY.
// User receives BKC + ETH without needing any gas.

import { ethers } from 'ethers';

// --- CORS ---
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
    );
};

// --- Contract config ---
const FAUCET_ADDRESS = '0x7485AF4f996753B85f701960661d67D40FCaCE85';
const FAUCET_ABI = [
    'function distributeTo(address recipient) external',
    'function canClaim(address user) view returns (bool)',
    'function getCooldownRemaining(address user) view returns (uint256)',
    'function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)',
    'function paused() view returns (bool)'
];

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    const address = req.query.address;
    if (!address || !ethers.isAddress(address)) {
        return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    // --- Check env vars ---
    const relayerKey = (process.env.FAUCET_RELAYER_KEY || '').trim();

    if (!relayerKey) {
        console.error('[Faucet API] FAUCET_RELAYER_KEY not configured');
        return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    // Arbitrum Sepolia RPC (runtime)
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    const rpcUrl = alchemyKey
        ? `https://arb-sepolia.g.alchemy.com/v2/${alchemyKey}`
        : 'https://sepolia-rollup.arbitrum.io/rpc';

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);

        // 1. Check if paused
        const isPaused = await faucet.paused();
        if (isPaused) {
            return res.status(503).json({ success: false, error: 'Faucet is paused' });
        }

        // 2. Check eligibility
        const canClaimNow = await faucet.canClaim(address);
        if (!canClaimNow) {
            const cooldownLeft = await faucet.getCooldownRemaining(address);
            const cooldownSecs = Number(cooldownLeft);
            // One-time per wallet (100yr cooldown) → show "already claimed"
            if (cooldownSecs > 31536000) {
                return res.status(429).json({
                    success: false,
                    error: 'Already claimed. This faucet is one-time per wallet.',
                    alreadyClaimed: true
                });
            }
            const hoursLeft = Math.ceil(cooldownSecs / 3600);
            return res.status(429).json({
                success: false,
                error: `Cooldown active. Try again in ${hoursLeft} hours.`,
                cooldownSeconds: cooldownSecs
            });
        }

        // 3. Check funds
        const status = await faucet.getFaucetStatus();
        const ethBalance = status[0];
        const tokenBalance = status[1];
        const ethPerDrip = status[2];
        const tokensPerDrip = status[3];

        if (tokenBalance < tokensPerDrip) {
            return res.status(503).json({ success: false, error: 'Faucet out of BKC tokens' });
        }
        if (ethPerDrip > 0n && ethBalance < ethPerDrip) {
            return res.status(503).json({ success: false, error: 'Faucet out of ETH' });
        }

        // 4. Execute distributeTo
        const wallet = new ethers.Wallet(relayerKey, provider);
        const faucetSigner = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, wallet);

        console.log(`[Faucet API] Distributing to ${address}...`);
        const tx = await faucetSigner.distributeTo(address, { gasLimit: 350000 });
        const receipt = await tx.wait();

        console.log(`[Faucet API] Success: ${receipt.hash}`);

        return res.status(200).json({
            success: true,
            txHash: receipt.hash,
            bkcAmount: ethers.formatEther(tokensPerDrip),
            ethAmount: ethers.formatEther(ethPerDrip),
            message: 'Tokens sent successfully!'
        });

    } catch (e) {
        console.error('[Faucet API] Error:', e.message);

        if (e.message?.includes('NotRelayer')) {
            return res.status(403).json({ success: false, error: 'Relayer not authorized on contract. Contact admin.' });
        }
        if (e.message?.includes('CooldownActive')) {
            return res.status(429).json({ success: false, error: 'Cooldown active. Try again later.' });
        }
        if (e.message?.includes('InsufficientTokens')) {
            return res.status(503).json({ success: false, error: 'Faucet out of BKC tokens' });
        }
        if (e.message?.includes('InsufficientETH')) {
            return res.status(503).json({ success: false, error: 'Faucet out of ETH' });
        }

        return res.status(500).json({ success: false, error: e.message || 'Transaction failed. Try again later.' });
    }
}
