// @backchain/notary — On-Chain Document Certification
// ============================================================================

import { ethers } from 'ethers';
import { NOTARY_ABI, calculateFee, notaryActionId, ACTION_IDS } from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type { TxResult, Certificate } from '@backchain/core';

export class NotaryModule {
    constructor(private ctx: BackchainContext) {}

    async certify(documentHash: string, meta: string, docType: number = 0): Promise<TxResult & { certId: bigint }> {
        if (docType < 0 || docType > 9) throw new Error('docType must be 0-9');

        const fee = await calculateFee(
            this.ctx.provider, this.ctx.addresses.backchainEcosystem,
            notaryActionId(docType)
        );

        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.notary, NOTARY_ABI);
        const tx = await contract.certify(documentHash, meta, docType, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);

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

    async batchCertify(
        documents: Array<{ hash: string; meta: string; docType: number }>
    ): Promise<TxResult & { startId: bigint }> {
        const hashes = documents.map(d => d.hash);
        const metas = documents.map(d => d.meta);
        const types = documents.map(d => d.docType);

        const perDocFee = await calculateFee(
            this.ctx.provider, this.ctx.addresses.backchainEcosystem,
            notaryActionId(types[0])
        );
        const totalFee = perDocFee * BigInt(documents.length);

        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.notary, NOTARY_ABI);
        const tx = await contract.batchCertify(hashes, metas, types, this.ctx.operator, { value: totalFee });
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

    async transferCertificate(documentHash: string, newOwner: string): Promise<TxResult> {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.notary, NOTARY_ABI);
        const tx = await contract.transferCertificate(documentHash, newOwner);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async verify(documentHash: string): Promise<Certificate> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.notary, NOTARY_ABI);
        const r = await contract.verify(documentHash);
        return { exists: r[0], owner: r[1], timestamp: r[2], docType: Number(r[3]), meta: r[4] };
    }

    async getCertificate(certId: bigint): Promise<Certificate & { documentHash: string }> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.notary, NOTARY_ABI);
        const r = await contract.getCertificate(certId);
        return { documentHash: r[0], exists: true, owner: r[1], timestamp: r[2], docType: Number(r[3]), meta: r[4] };
    }

    async getStats(): Promise<{ certCount: bigint; totalEthCollected: bigint }> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.notary, NOTARY_ABI);
        const s = await contract.getStats();
        return { certCount: s[0], totalEthCollected: s[1] };
    }

    async getFee(): Promise<bigint> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.notary, NOTARY_ABI);
        return contract.getFee();
    }

    static async hashDocument(data: string | ArrayBuffer): Promise<string> {
        if (typeof data === 'string') {
            return ethers.keccak256(ethers.toUtf8Bytes(data));
        }
        return ethers.keccak256(new Uint8Array(data));
    }
}
