# Notary — On-Chain Document Certification

Certify any document on the blockchain. Prove that it existed at a specific point in time, without revealing its contents. Verification is free and permanent.

**Contract:** `0x89DE7ea670CeEeEFA21e4dAC499313D3E0cfbB0e`

## How It Works

1. **Hash your document** locally (the document never leaves your device)
2. **Certify** the hash on-chain — it's timestamped and linked to your wallet
3. **Share** the certificate with anyone who needs to verify it
4. **Verify** — Anyone can check if a document hash was certified, for free

The blockchain stores only the hash — a fingerprint of your document. The actual document stays private. If someone has the same document, they can hash it and verify it matches the on-chain record.

## What You Can Certify

| Category | Examples |
|----------|---------|
| Contracts | Legal agreements, NDAs, service contracts |
| Identity | ID copies, passport scans, KYC records |
| Financial | Invoices, receipts, tax documents |
| Intellectual Property | Patents, designs, creative works |
| Academic | Diplomas, certificates, transcripts |
| Medical | Records, prescriptions, test results |
| Real Estate | Deeds, leases, property records |
| Legal | Court documents, testimonies, evidence |
| Corporate | Board minutes, resolutions, filings |
| Other | Anything you need to prove existed |

## Batch Certification

Certify up to 20 documents in a single transaction. Each gets its own certificate with individual metadata. Great for organizations that need to certify multiple documents regularly.

## Verification Is Free

Checking if a document was certified costs nothing — it's a read-only blockchain query. Anyone with the document (or its hash) can verify instantly. No account needed, no fees, no registration.

## Certificate Ownership

Each certification creates an on-chain record linked to the certifier's wallet. Certificates can be transferred to other wallets, which is useful for:
- Transferring ownership of certified documents
- Moving records between wallets
- Organizational transfers

## Privacy Model

- **Document stays local** — Only the hash goes on-chain
- **Hash is one-way** — Nobody can reconstruct your document from the hash
- **Metadata is optional** — You choose what description to attach
- **Public verification** — Anyone can check the hash, but they need the original document to know what it certifies

## Fees

- **Certify** — ETH fee (gas-based), goes to ecosystem
- **Batch certify** — ETH fee per document
- **Verify** — Free, always
- **Transfer** — Free (standard ERC-721 transfer)

## Operator Support

The Notary supports operators. Build a document certification service and earn commissions on every certification through your frontend. Potential applications:

- Legal tech platforms
- Academic credential verification
- Supply chain proof-of-origin
- Insurance document management
- Digital notary services

## Contributing to the Network

Every certification is a permanent record on Arbitrum. As more documents are certified, the network becomes a trusted source of truth — a global, decentralized notary that works 24/7 and can never be shut down.

See also: [Fee Schedule](./FEES.md) | [Operator Guide](./BE_YOUR_OWN_CEO.md)
