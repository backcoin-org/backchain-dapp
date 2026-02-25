# @backchain/notary

Notary module for the Backchain DeFi ecosystem on opBNB. Certify document hashes on-chain, verify authenticity, and transfer certificate ownership.

## Install

```bash
npm install @backchain/notary
```

## Quick Start

```js
import { NotaryModule } from '@backchain/notary';

const notary = new NotaryModule(context); // context from @backchain/core
const hash = NotaryModule.hashDocument('contract text or file buffer');
await notary.certify(hash, 'Service Agreement v1', 1); // DocType.Contract
const record = await notary.verify(hash);
```

## API

### Document Types

| Value | Name       | Value | Name      |
|-------|------------|-------|-----------|
| 0     | General    | 5     | Financial |
| 1     | Contract   | 6     | Legal     |
| 2     | Identity   | 7     | Medical   |
| 3     | Diploma    | 8     | IP        |
| 4     | Property   | 9     | Other     |

### Write Methods

**`certify(hash: string, meta: string, docType: number): Promise<TransactionResult>`**
Register a document hash on-chain. `hash` must be a 32-byte hex string (use `hashDocument` to generate it). `meta` is a short human-readable label stored with the certificate. `docType` is one of the values from the table above. Reverts if the hash is already certified.

**`batchCertify(docs: Array<{ hash: string, meta: string, docType: number }>): Promise<TransactionResult>`**
Certify multiple documents in a single transaction. Each entry follows the same rules as `certify`. More gas-efficient than calling `certify` repeatedly.

**`transferCertificate(hash: string, newOwner: string): Promise<TransactionResult>`**
Transfer ownership of a certificate to another address. Only the current certificate owner can call this.

### Read Methods

**`verify(hash: string): Promise<Certificate | null>`**
Look up a certificate by its hash. Returns `null` if the hash has not been certified. Otherwise returns: owner address, metadata, document type, certification timestamp, and block number.

**`getAllCertificates(address?: string): Promise<Certificate[]>`**
Returns all certificates owned by the given address (defaults to the connected wallet), ordered by certification date.

### Static Methods

**`NotaryModule.hashDocument(content: string | Uint8Array): string`**
Hashes content with keccak256 and returns a 32-byte hex string suitable for use as the `hash` parameter. Pure JS — no network call. Pass raw file bytes or a UTF-8 string.

## License

MIT
