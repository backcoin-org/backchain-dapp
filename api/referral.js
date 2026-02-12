// api/referral.js
// Vercel Serverless Relayer — Gasless Referral Onboarding
//
// POST /api/referral  body: { userAddress, referrerAddress }
//
// 1. Calls ecosystem.setReferrerFor(user, referrer) via relayer (gasless for user)
// 2. Optionally calls faucet.distributeTo(user) for welcome BKC bonus
//
// Uses same FAUCET_RELAYER_KEY as faucet.js (deployer wallet = referral relayer)

import { ethers } from 'ethers';

// --- CORS ---
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
    );
};

// --- Contract config ---
// NOTE: Update these addresses after every full redeploy
const ECOSYSTEM_ADDRESS = '0xDC88493D0979AF22e2C387A2fFd5230c62551997';
const FAUCET_ADDRESS = '0xb80e5389b16693CAEe4655b535cc7Bceb4770255';

const ECOSYSTEM_ABI = [
    'function setReferrerFor(address _user, address _referrer) external',
    'function referredBy(address _user) view returns (address)',
    'function referralRelayer() view returns (address)',
];

const FAUCET_ABI = [
    'function distributeTo(address recipient) external',
    'function canClaim(address user) view returns (bool)',
    'function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)',
    'function paused() view returns (bool)',
];

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    const { userAddress, referrerAddress } = req.body || {};

    if (!userAddress || !ethers.isAddress(userAddress)) {
        return res.status(400).json({ success: false, error: 'Invalid userAddress' });
    }
    if (!referrerAddress || !ethers.isAddress(referrerAddress)) {
        return res.status(400).json({ success: false, error: 'Invalid referrerAddress' });
    }
    if (userAddress.toLowerCase() === referrerAddress.toLowerCase()) {
        return res.status(400).json({ success: false, error: 'Cannot refer yourself' });
    }

    // --- Check env vars ---
    const relayerKey = (process.env.FAUCET_RELAYER_KEY || '').trim();
    if (!relayerKey) {
        console.error('[Referral API] FAUCET_RELAYER_KEY not configured');
        return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const serverAlchemyKey = (process.env.ALCHEMY_API_KEY || '').trim();
    const rpcUrl = serverAlchemyKey
        ? `https://arb-sepolia.g.alchemy.com/v2/${serverAlchemyKey}`
        : 'https://sepolia-rollup.arbitrum.io/rpc';

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(relayerKey, provider);

        // ── Step 1: Set Referrer (if not already set) ──
        const eco = new ethers.Contract(ECOSYSTEM_ADDRESS, ECOSYSTEM_ABI, provider);
        const existingReferrer = await eco.referredBy(userAddress);
        let referrerSet = false;
        let referrerTxHash = null;

        if (existingReferrer === ethers.ZeroAddress) {
            console.log(`[Referral API] Setting referrer: ${userAddress} -> ${referrerAddress}`);
            const ecoSigner = new ethers.Contract(ECOSYSTEM_ADDRESS, ECOSYSTEM_ABI, wallet);
            const tx = await ecoSigner.setReferrerFor(userAddress, referrerAddress, { gasLimit: 100000 });
            const receipt = await tx.wait();
            referrerTxHash = receipt.hash;
            referrerSet = true;
            console.log(`[Referral API] Referrer set: ${receipt.hash}`);
        } else {
            console.log(`[Referral API] User ${userAddress} already has referrer: ${existingReferrer}`);
        }

        // ── Step 2: Faucet Drip (if eligible) ──
        const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
        let faucetClaimed = false;
        let faucetTxHash = null;
        let bonusBkc = '0';
        let bonusEth = '0';

        const isPaused = await faucet.paused();
        if (!isPaused) {
            const canClaimNow = await faucet.canClaim(userAddress);
            if (canClaimNow) {
                console.log(`[Referral API] Sending faucet drip to ${userAddress}...`);
                const faucetSigner = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, wallet);
                const fTx = await faucetSigner.distributeTo(userAddress, { gasLimit: 350000 });
                const fReceipt = await fTx.wait();
                faucetTxHash = fReceipt.hash;
                faucetClaimed = true;

                const status = await faucet.getFaucetStatus();
                bonusBkc = ethers.formatEther(status[3]); // tokensPerDrip
                bonusEth = ethers.formatEther(status[2]); // ethPerDrip
                console.log(`[Referral API] Faucet drip sent: ${fReceipt.hash}`);
            } else {
                console.log(`[Referral API] User ${userAddress} on faucet cooldown`);
            }
        }

        return res.status(200).json({
            success: true,
            referrerSet,
            referrerTxHash,
            faucetClaimed,
            faucetTxHash,
            bonusBkc,
            bonusEth,
        });

    } catch (e) {
        console.error('[Referral API] Error:', e.message);

        if (e.message?.includes('NotReferralRelayer')) {
            return res.status(403).json({ success: false, error: 'Relayer not authorized. Contact admin.' });
        }
        if (e.message?.includes('ReferrerAlreadySet')) {
            return res.status(200).json({ success: true, referrerSet: false, faucetClaimed: false, bonusBkc: '0', bonusEth: '0' });
        }
        if (e.message?.includes('CannotReferSelf')) {
            return res.status(400).json({ success: false, error: 'Cannot refer yourself' });
        }
        if (e.message?.includes('NotRelayer')) {
            return res.status(403).json({ success: false, error: 'Faucet relayer not authorized. Contact admin.' });
        }
        if (e.message?.includes('CooldownActive')) {
            return res.status(200).json({ success: true, referrerSet: false, faucetClaimed: false, bonusBkc: '0', bonusEth: '0' });
        }

        return res.status(500).json({ success: false, error: 'Transaction failed. Try again later.' });
    }
}
