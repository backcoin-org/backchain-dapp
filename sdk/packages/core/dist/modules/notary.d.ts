import type { Backchain } from '../backchain.js';
import type { TxResult, Certificate } from '../types/index.js';
export declare class NotaryModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Certify a document on-chain (permanent proof of existence).
     *
     * @param documentHash - keccak256 hash of the document (bytes32)
     * @param meta - Metadata string (title, description, etc.)
     * @param docType - Document type (0-9). See DocType enum.
     */
    certify(documentHash: string, meta: string, docType?: number): Promise<TxResult & {
        certId: bigint;
    }>;
    /**
     * Batch certify multiple documents in a single transaction.
     */
    batchCertify(documents: Array<{
        hash: string;
        meta: string;
        docType: number;
    }>): Promise<TxResult & {
        startId: bigint;
    }>;
    /**
     * Transfer certificate ownership to another address.
     */
    transferCertificate(documentHash: string, newOwner: string): Promise<TxResult>;
    /** Verify a document by its hash */
    verify(documentHash: string): Promise<Certificate>;
    /** Get certificate by ID */
    getCertificate(certId: bigint): Promise<Certificate & {
        documentHash: string;
    }>;
    /** Get notary statistics */
    getStats(): Promise<{
        certCount: bigint;
        totalEthCollected: bigint;
    }>;
    /** Get certification fee */
    getFee(): Promise<bigint>;
    /** Hash a file (browser File object or string data) for certification */
    static hashDocument(data: string | ArrayBuffer): Promise<string>;
}
//# sourceMappingURL=notary.d.ts.map