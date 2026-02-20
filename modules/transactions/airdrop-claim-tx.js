// modules/js/transactions/airdrop-claim-tx.js
// ✅ V11 - AirdropClaim module (Merkle-based token distribution + auto-staking)
//
// FLOW:
//   1. User's allocation stored off-chain (Firebase merkle tree data)
//   2. Frontend fetches proof + amount for user
//   3. User calls claim(amount, proof, operator) — pays ETH fee
//   4. Contract verifies proof, auto-delegates to StakingPool
//   5. User earns staking rewards immediately
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - claimAirdrop: Claim tokens with merkle proof (auto-stakes)
// ============================================================================

import { txEngine } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses, airdropClaimABI } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getAirdropClaimAddress() {
    return addresses?.airdropClaim ||
           contractAddresses?.airdropClaim ||
           window.contractAddresses?.airdropClaim ||
           null;
}

function getContract(providerOrSigner) {
    const addr = getAirdropClaimAddress();
    if (!addr) throw new Error('AirdropClaim contract not configured');
    return new window.ethers.Contract(addr, airdropClaimABI, providerOrSigner);
}

async function getProvider() {
    const { NetworkManager } = await import('../core/index.js');
    return NetworkManager.getProvider();
}

// ============================================================================
// 2. CLAIM TRANSACTION
// ============================================================================

/**
 * Claim airdrop tokens with merkle proof.
 * Tokens are auto-delegated to StakingPool with a lock period.
 *
 * @param {Object} opts
 * @param {bigint} opts.amount - User's allocation amount (wei)
 * @param {string[]} opts.merkleProof - Merkle proof array (bytes32[])
 * @param {string} [opts.operator] - Operator address
 * @param {HTMLElement} [opts.button] - Button element for loading state
 * @param {Function} [opts.onSuccess] - Success callback
 * @param {Function} [opts.onError] - Error callback
 */
export async function claimAirdrop({
    amount,
    merkleProof,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const addr = getAirdropClaimAddress();
    if (!addr) throw new Error('AirdropClaim contract not configured');

    let storedOperator = operator;

    return await txEngine.execute({
        name: 'AirdropClaim',
        button,
        skipSimulation: true,
        fixedGasLimit: 350000n,

        getContract: async (signer) => getContract(signer),
        method: 'claim',
        args: () => [amount, merkleProof, resolveOperator(storedOperator)],

        value: async () => {
            // Read fee from contract
            const provider = await getProvider();
            const contract = getContract(provider);
            const fee = await contract.claimFee();
            return fee;
        },

        validate: async (signer, userAddress) => {
            const provider = await getProvider();
            const contract = getContract(provider);

            // Check merkle root is set (active phase)
            const root = await contract.merkleRoot();
            if (root === window.ethers.ZeroHash) {
                throw new Error('No active airdrop phase');
            }

            // Check not already claimed
            const claimed = await contract.hasClaimed(userAddress);
            if (claimed) {
                throw new Error('Already claimed in this phase');
            }

            // Verify proof on-chain before sending TX
            const valid = await contract.verifyProof(userAddress, amount, merkleProof);
            if (!valid) {
                throw new Error('Invalid proof — you may not be eligible for this phase');
            }
        },

        onSuccess: async (receipt) => {
            if (typeof window.showToast === 'function') {
                const formatted = window.ethers.formatEther(amount);
                window.showToast(`Claimed ${formatted} BKC! Auto-staked for you.`, 'success');
            }
            if (onSuccess) onSuccess(receipt);
        },

        onError: (error) => {
            if (typeof window.showToast === 'function') {
                window.showToast(error.message || 'Claim failed', 'error');
            }
            if (onError) onError(error);
        }
    });
}

// ============================================================================
// 3. READ FUNCTIONS
// ============================================================================

/**
 * Get claim info for a user in the current phase
 */
export async function getClaimInfo(userAddress) {
    const addr = getAirdropClaimAddress();
    if (!addr) return null;

    try {
        const provider = await getProvider();
        const contract = getContract(provider);

        const [info, root, available, phase, totalClaimedVal, totalCountVal] = await Promise.all([
            contract.getClaimInfo(userAddress),
            contract.merkleRoot(),
            contract.availableBalance(),
            contract.currentPhase(),
            contract.totalClaimed(),
            contract.totalClaimCount()
        ]);

        return {
            claimed: info[0],
            claimFee: info[1],
            lockDays: Number(info[2]),
            phase: Number(info[3]),
            merkleRoot: root,
            isActive: root !== window.ethers.ZeroHash,
            availableBalance: available,
            totalClaimed: totalClaimedVal,
            totalClaimCount: Number(totalCountVal)
        };
    } catch (e) {
        console.warn('[AirdropClaim] getClaimInfo error:', e.message);
        return null;
    }
}

/**
 * Verify a merkle proof on-chain (pre-check before claiming)
 */
export async function verifyProof(userAddress, amount, merkleProof) {
    const addr = getAirdropClaimAddress();
    if (!addr) return false;

    try {
        const provider = await getProvider();
        const contract = getContract(provider);
        return await contract.verifyProof(userAddress, amount, merkleProof);
    } catch (e) {
        console.warn('[AirdropClaim] verifyProof error:', e.message);
        return false;
    }
}

/**
 * Get airdrop stats for display
 */
export async function getAirdropStats() {
    const addr = getAirdropClaimAddress();
    if (!addr) return null;

    try {
        const provider = await getProvider();
        const contract = getContract(provider);

        const [available, totalClaimed, totalCount, phase, root, fee, lock, deadline] = await Promise.all([
            contract.availableBalance(),
            contract.totalClaimed(),
            contract.totalClaimCount(),
            contract.currentPhase(),
            contract.merkleRoot(),
            contract.claimFee(),
            contract.lockDays(),
            contract.claimDeadline()
        ]);

        return {
            availableBalance: available,
            totalClaimed,
            totalClaimCount: Number(totalCount),
            currentPhase: Number(phase),
            isActive: root !== window.ethers.ZeroHash,
            claimFee: fee,
            lockDays: Number(lock),
            claimDeadline: Number(deadline)
        };
    } catch (e) {
        console.warn('[AirdropClaim] getAirdropStats error:', e.message);
        return null;
    }
}

/**
 * Fetch merkle proof data for a user from Firebase.
 * Expected data at `airdropProofs/{phase}/{userAddress}`:
 *   { amount: "1000000000000000000000", proof: ["0x...", "0x..."] }
 *
 * Falls back to a static JSON file at /airdrop-proofs/{phase}.json
 */
export async function getMerkleProof(userAddress, phase) {
    if (!userAddress || !phase) return null;

    const normalizedAddress = userAddress.toLowerCase();

    // Try Firebase first
    try {
        const db = await import('../firebase-auth-service.js');
        if (typeof db.getAirdropProof === 'function') {
            const data = await db.getAirdropProof(normalizedAddress, phase);
            if (data && data.amount && data.proof) {
                return {
                    amount: BigInt(data.amount),
                    proof: data.proof
                };
            }
        }
    } catch (e) {
        console.warn('[AirdropClaim] Firebase proof fetch failed:', e.message);
    }

    // Fallback: try static JSON
    try {
        const resp = await fetch(`/airdrop-proofs/${phase}.json`);
        if (resp.ok) {
            const allProofs = await resp.json();
            const entry = allProofs[normalizedAddress] || allProofs[userAddress];
            if (entry && entry.amount && entry.proof) {
                return {
                    amount: BigInt(entry.amount),
                    proof: entry.proof
                };
            }
        }
    } catch (e) {
        console.warn('[AirdropClaim] Static proof fetch failed:', e.message);
    }

    return null;
}

// ============================================================================
// 4. EXPORTS
// ============================================================================

export const AirdropClaimTx = {
    claimAirdrop,
    getClaimInfo,
    verifyProof,
    getAirdropStats,
    getMerkleProof,
    getAirdropClaimAddress
};

export default AirdropClaimTx;
