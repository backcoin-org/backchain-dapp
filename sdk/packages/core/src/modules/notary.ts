// @backchain/sdk — Notary Module (On-Chain Document Certification)
// ============================================================================

import { ethers } from 'ethers';
import { NOTARY_ABI } from '../contracts/abis.js';
import { calculateFee, notaryActionId, ACTION_IDS } from '../fees.js';
import type { Backchain } from '../backchain.js';
import type { TxResult, Certificate, DocType } from '../types/index.js';

export class NotaryModule {
    constructor(private sdk: Backchain) {}

    // ── Write ───────────────────────────────────────────────────────────────

    /**
     * Certify a document on-chain (permanent proof of existence).
     *
     * @param documentHash - keccak256 hash of the document (bytes32)
     * @param meta - Metadata string (title, description, etc.)
     * @param docType - Document type (0-9). See DocType enum.
     */
    async certify(documentHash: string, meta: string, docType: number = 0): Promise<TxResult & { certId: bigint }> {
        if (docType < 0 || docType > 9) throw new Error('docType must be 0-9');

        const fee = await calculateFee(
            this.sdk.provider, this.sdk.addresses.backchainEcosystem,
            notaryActionId(docType)
        );

        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.notary, NOTARY_ABI);
        const tx = await contract.certify(documentHash, meta, docType, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);

        // Parse Certified event
        const iface = new ethers.Interface(NOTARY_ABI);
        let certId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Certified') certId = parsed.args[0];
            } catch { /* skip */ }
        }

        return {
            hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed,
            events: { certId }, certId,
        };
    }

    /**
     * Batch certify multiple documents in a single transaction.
     */
    async batchCertify(
        documents: Array<{ hash: string; meta: string; docType: number }>
    ): Promise<TxResult & { startId: bigint }> {
        const hashes = documents.map(d => d.hash);
        const metas = documents.map(d => d.meta);
        const types = documents.map(d => d.docType);

        // Fee = per-doc fee × count (use first doc type for fee calc)
        const perDocFee = await calculateFee(
            this.sdk.provider, this.sdk.addresses.backchainEcosystem,
            notaryActionId(types[0])
        );
        const totalFee = perDocFee * BigInt(documents.length);

        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.notary, NOTARY_ABI);
        const tx = await contract.batchCertify(hashes, metas, types, this.sdk.operator, { value: totalFee });
        const receipt = await tx.wait(1);

        const iface = new ethers.Interface(NOTARY_ABI);
        let startId = 0n;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'BatchCertified') startId = parsed.args[1];
            } catch { /* skip */ }
        }

        return {
            hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed,
            events: { startId }, startId,
        };
    }

    /**
     * Transfer certificate ownership to another address.
     */
    async transferCertificate(documentHash: string, newOwner: string): Promise<TxResult> {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.notary, NOTARY_ABI);
        const tx = await contract.transferCertificate(documentHash, newOwner);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    /** Verify a document by its hash */
    async verify(documentHash: string): Promise<Certificate> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.notary, NOTARY_ABI);
        const r = await contract.verify(documentHash);
        return { exists: r[0], owner: r[1], timestamp: r[2], docType: Number(r[3]), meta: r[4] };
    }

    /** Get certificate by ID */
    async getCertificate(certId: bigint): Promise<Certificate & { documentHash: string }> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.notary, NOTARY_ABI);
        const r = await contract.getCertificate(certId);
        return { documentHash: r[0], exists: true, owner: r[1], timestamp: r[2], docType: Number(r[3]), meta: r[4] };
    }

    /** Get notary statistics */
    async getStats(): Promise<{ certCount: bigint; totalEthCollected: bigint }> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.notary, NOTARY_ABI);
        const s = await contract.getStats();
        return { certCount: s[0], totalEthCollected: s[1] };
    }

    /** Get certification fee */
    async getFee(): Promise<bigint> {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.notary, NOTARY_ABI);
        return contract.getFee();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** Hash a file (browser File object or string data) for certification */
    static async hashDocument(data: string | ArrayBuffer): Promise<string> {
        if (typeof data === 'string') {
            return ethers.keccak256(ethers.toUtf8Bytes(data));
        }
        return ethers.keccak256(new Uint8Array(data));
    }
}
