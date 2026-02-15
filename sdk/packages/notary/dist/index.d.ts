import type { BackchainContext } from '@backchain/core';
import type { TxResult, Certificate } from '@backchain/core';
export declare class NotaryModule {
    private ctx;
    constructor(ctx: BackchainContext);
    certify(documentHash: string, meta: string, docType?: number): Promise<TxResult & {
        certId: bigint;
    }>;
    batchCertify(documents: Array<{
        hash: string;
        meta: string;
        docType: number;
    }>): Promise<TxResult & {
        startId: bigint;
    }>;
    transferCertificate(documentHash: string, newOwner: string): Promise<TxResult>;
    verify(documentHash: string): Promise<Certificate>;
    getCertificate(certId: bigint): Promise<Certificate & {
        documentHash: string;
    }>;
    getStats(): Promise<{
        certCount: bigint;
        totalEthCollected: bigint;
    }>;
    getFee(): Promise<bigint>;
    static hashDocument(data: string | ArrayBuffer): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map