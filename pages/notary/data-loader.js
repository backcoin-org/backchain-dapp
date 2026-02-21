// pages/notary/data-loader.js
// Notary V10 — Data loading
// ============================================================================

import { State } from '../../state.js';
import { NotaryTx } from '../../modules/transactions/index.js';
import { getUploadPrice } from '../../modules/core/index.js';
import { addresses } from '../../config.js';
import { NT, NOTARY_ABI_EVENTS } from './state.js';
import { parseMetaJson, extractStorageUri } from './utils.js';

const ethers = window.ethers;

export async function loadFees(docType = 0) {
    try {
        const result = await NotaryTx.getCertifyFee(docType);
        NT.ethFee = result.fee;
        NT.feesLoaded = true;
    } catch {
        NT.ethFee = ethers?.parseEther('0.0001') || 0n;
        NT.feesLoaded = true;
    }

    // Also calculate upload cost if file is selected
    if (NT.wizFile?.size) {
        try {
            NT.wizUploadCost = await getUploadPrice(NT.wizFile.size);
        } catch (e) {
            console.warn('[NotaryPage] Could not estimate upload cost:', e.message);
            NT.wizUploadCost = null;
        }
    }
}

export async function loadCertificates() {
    if (!State.isConnected || !State.userAddress) return;

    NT.certsLoading = true;
    NT._render();

    try {
        const certs = await loadCertificatesFromContract();
        NT.certificates = certs;
        console.log('[NotaryPage] Loaded', certs.length, 'certificates from contract');
    } catch (err) {
        console.error('[NotaryPage] Contract load failed:', err);
        NT.certificates = [];
    }

    NT.certsLoading = false;
    NT._render();
}

async function loadCertificatesFromContract() {
    const total = await NotaryTx.getTotalDocuments();
    if (total === 0) return [];

    console.log(`[NotaryPage] Total certs on-chain: ${total}, scanning for owner: ${State.userAddress}`);

    const userAddr = State.userAddress.toLowerCase();
    const userCerts = [];
    const BATCH = 50;

    for (let start = 1; start <= total; start += BATCH) {
        const count = Math.min(BATCH, total - start + 1);
        const batch = await NotaryTx.getCertificatesBatch(start, count);
        for (const cert of batch) {
            if (cert.owner?.toLowerCase() === userAddr) {
                userCerts.push(cert);
            }
        }
    }

    // Enrich with metadata via individual getCertificate calls
    const enriched = [];
    for (const cert of userCerts) {
        try {
            const detail = await NotaryTx.getCertificate(cert.id);
            const parsed = parseMetaJson(detail?.meta || '');
            enriched.push({
                id: cert.id,
                hash: cert.documentHash || detail?.documentHash || '',
                description: parsed.desc || parsed.name || '',
                docType: cert.docType ?? detail?.docType ?? 0,
                timestamp: cert.timestamp || detail?.timestamp || 0,
                owner: cert.owner,
                isBoosted: cert.isBoosted || detail?.isBoosted || false,
                boostExpiry: cert.boostExpiry || detail?.boostExpiry || 0,
                ipfs: parsed.uri || extractStorageUri(detail?.meta || ''),
                mimeType: parsed.type || '',
                fileName: parsed.name || '',
                rawMeta: detail?.meta || '',
                txHash: ''
            });
        } catch {
            enriched.push({
                id: cert.id,
                hash: cert.documentHash || '',
                description: '',
                docType: cert.docType ?? 0,
                timestamp: cert.timestamp || 0,
                owner: cert.owner,
                ipfs: '',
                txHash: ''
            });
        }
    }

    // Detect received certificates via CertificateTransferred events
    if (enriched.length > 0) {
        try {
            const { NetworkManager } = await import('../../modules/core/index.js');
            const provider = NetworkManager.getProvider();
            if (provider && addresses?.notary) {
                const contract = new ethers.Contract(addresses.notary, NOTARY_ABI_EVENTS, provider);
                // V12 deploy block on Sepolia — use fixed fromBlock for public RPC compat
                const fromBlock = 10_308_450;

                // Query transfers TO current user
                const transferFilter = contract.filters.CertificateTransferred(null, null, State.userAddress);
                const transferEvents = await contract.queryFilter(transferFilter, fromBlock);

                // Build set of received document hashes
                const receivedHashes = new Set(transferEvents.map(ev => ev.args.documentHash.toLowerCase()));

                // Mark enriched certs as received
                for (const cert of enriched) {
                    if (receivedHashes.has(cert.hash?.toLowerCase())) {
                        cert.received = true;
                    }
                }
            }
        } catch (e) {
            console.warn('[NotaryPage] Could not check transfer events:', e.message);
        }
    }

    return enriched.sort((a, b) => b.id - a.id);
}

export async function loadStats() {
    NT.statsLoading = true;

    try {
        const [stats, supply] = await Promise.all([
            NotaryTx.getStats(),
            NotaryTx.getTotalDocuments()
        ]);

        NT.stats = stats;
        NT.totalSupply = supply;
    } catch (err) {
        console.warn('[NotaryPage] Stats load error:', err);
    }

    try {
        await loadRecentNotarizations();
    } catch {}

    NT.statsLoading = false;

    if (NT.view === 'stats') NT._render();
}

async function loadRecentNotarizations() {
    if (!ethers || !addresses?.notary) return;

    const { NetworkManager } = await import('../../modules/core/index.js');
    const provider = NetworkManager.getProvider();
    if (!provider) return;

    const contract = new ethers.Contract(addresses.notary, NOTARY_ABI_EVENTS, provider);
    const filter = contract.filters.Certified();

    // V12 deploy block on Sepolia — use fixed fromBlock for public RPC compat
    const fromBlock = 10_308_450;

    const events = await contract.queryFilter(filter, fromBlock);

    // Get 20 most recent
    const recent = events.slice(-20).reverse();

    // V9: Certified event args: certId, owner, documentHash, docType, operator
    NT.recentNotarizations = recent.map(ev => ({
        tokenId: Number(ev.args.certId),
        owner: ev.args.owner,
        hash: ev.args.documentHash,
        docType: Number(ev.args.docType || 0),
        timestamp: null,
        blockNumber: ev.blockNumber
    }));

    // Try to get timestamps from blocks (batch)
    try {
        const uniqueBlocks = [...new Set(recent.map(e => e.blockNumber))];
        const blockData = {};
        await Promise.all(uniqueBlocks.slice(0, 10).map(async bn => {
            const block = await provider.getBlock(bn);
            if (block) blockData[bn] = block.timestamp;
        }));

        NT.recentNotarizations.forEach(item => {
            if (blockData[item.blockNumber]) {
                item.timestamp = blockData[item.blockNumber];
            }
        });
    } catch {}
}
