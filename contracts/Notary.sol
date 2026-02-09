// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NOTARY — IMMUTABLE (Tier 1: ETH only)
// ============================================================================
//
// On-chain document certification. Hash a file, store proof forever.
//
// Features:
//   - Single or batch notarization (multiple docs in one tx)
//   - Document type classification (10 categories)
//   - Certificate ownership transfer
//   - Hash-based verification (anyone can verify, no account needed)
//   - Operator commissions on every certification
//
// Storage:
//   - 1 slot per certificate (27 bytes packed)
//   - Metadata stored separately (only if provided)
//   - Hash is the primary key (no duplication)
//
// Fee: ETH only (Tier 1) → ecosystem (operator/treasury/buyback)
//
// No admin. No pause. Fully immutable and permissionless.
//
// ============================================================================

contract Notary {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID       = keccak256("NOTARY");
    bytes32 public constant ACTION_CERTIFY  = keccak256("NOTARY_CERTIFY");

    /// @notice Maximum documents per batch transaction
    uint8 public constant MAX_BATCH_SIZE = 20;

    // Document types
    uint8 public constant DOC_GENERAL     = 0;
    uint8 public constant DOC_CONTRACT    = 1;  // contracts, agreements
    uint8 public constant DOC_IDENTITY    = 2;  // ID, passport, KYC
    uint8 public constant DOC_DIPLOMA     = 3;  // diplomas, certificates
    uint8 public constant DOC_PROPERTY    = 4;  // deeds, titles
    uint8 public constant DOC_FINANCIAL   = 5;  // invoices, receipts
    uint8 public constant DOC_LEGAL       = 6;  // court documents, patents
    uint8 public constant DOC_MEDICAL     = 7;  // records, prescriptions
    uint8 public constant DOC_IP          = 8;  // intellectual property, copyright
    uint8 public constant DOC_OTHER       = 9;

    uint8 private constant MAX_DOC_TYPE = 9;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Certificate data — packed in 1 storage slot (27 bytes)
    ///      owner(20) + timestamp(6) + docType(1) = 27 bytes
    struct Certificate {
        address owner;
        uint48  timestamp;
        uint8   docType;
    }

    /// @notice Primary storage: document hash → certificate data (1 slot)
    mapping(bytes32 => Certificate) public certs;

    /// @notice Metadata storage: document hash → IPFS CID or description
    ///         Stored separately to save gas when metadata is empty
    mapping(bytes32 => string) public metadata;

    /// @notice Sequential index: cert ID → document hash
    ///         Allows iterating certificates by order of creation
    mapping(uint256 => bytes32) public certById;

    /// @notice Total certificates issued
    uint256 public certCount;

    /// @notice Lifetime ETH collected
    uint256 public totalEthCollected;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event Certified(
        uint256 indexed certId,
        address indexed owner,
        bytes32 indexed documentHash,
        uint8   docType,
        address operator
    );

    event BatchCertified(
        address indexed owner,
        uint256 startId,
        uint256 count,
        address operator
    );

    event CertificateTransferred(
        bytes32 indexed documentHash,
        address indexed from,
        address indexed to
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error EmptyHash();
    error AlreadyCertified();
    error InsufficientFee();
    error InvalidDocType();
    error NotCertOwner();
    error ZeroAddress();
    error EmptyBatch();
    error BatchTooLarge();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem) {
        ecosystem = IBackchainEcosystem(_ecosystem);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CERTIFY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Notarize a document on-chain.
    ///
    ///         The documentHash is the SHA-256 (or keccak256) of the file content.
    ///         Once certified, the hash can never be re-certified — proof is permanent.
    ///
    /// @param documentHash Hash of the document content
    /// @param meta         IPFS CID or description (can be empty to save gas)
    /// @param docType      Document category (0-9, see DOC_* constants)
    /// @param operator     Frontend operator earning commission
    /// @return certId      Sequential certificate ID
    function certify(
        bytes32 documentHash,
        string calldata meta,
        uint8 docType,
        address operator
    ) external payable returns (uint256 certId) {
        if (documentHash == bytes32(0)) revert EmptyHash();
        if (certs[documentHash].timestamp != 0) revert AlreadyCertified();
        if (docType > MAX_DOC_TYPE) revert InvalidDocType();

        uint256 fee = ecosystem.calculateFee(ACTION_CERTIFY, 0);
        if (msg.value < fee) revert InsufficientFee();

        // Store certificate (1 slot)
        certs[documentHash] = Certificate({
            owner: msg.sender,
            timestamp: uint48(block.timestamp),
            docType: docType
        });

        // Store metadata only if provided
        if (bytes(meta).length > 0) {
            metadata[documentHash] = meta;
        }

        // Sequential index
        certId = ++certCount;
        certById[certId] = documentHash;

        // ETH fee → ecosystem
        totalEthCollected += msg.value;
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit Certified(certId, msg.sender, documentHash, docType, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BATCH CERTIFY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Notarize multiple documents in one transaction.
    ///         Gas efficient: one ecosystem.collectFee() call for the entire batch.
    ///         ETH fee = per-document fee × count.
    ///
    /// @param documentHashes Array of document hashes
    /// @param metas          Array of metadata strings (same length as hashes)
    /// @param docTypes       Array of document types (same length as hashes)
    /// @param operator       Frontend operator
    /// @return startId       First certificate ID in the batch
    function batchCertify(
        bytes32[] calldata documentHashes,
        string[] calldata metas,
        uint8[] calldata docTypes,
        address operator
    ) external payable returns (uint256 startId) {
        uint256 count = documentHashes.length;
        if (count == 0) revert EmptyBatch();
        if (count > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (metas.length != count || docTypes.length != count) revert EmptyBatch();

        // Total fee = per-doc fee × count
        uint256 feePerDoc = ecosystem.calculateFee(ACTION_CERTIFY, 0);
        if (msg.value < feePerDoc * count) revert InsufficientFee();

        startId = certCount + 1;
        uint48 ts = uint48(block.timestamp);

        for (uint256 i; i < count;) {
            bytes32 hash = documentHashes[i];
            if (hash == bytes32(0)) revert EmptyHash();
            if (certs[hash].timestamp != 0) revert AlreadyCertified();
            if (docTypes[i] > MAX_DOC_TYPE) revert InvalidDocType();

            certs[hash] = Certificate({
                owner: msg.sender,
                timestamp: ts,
                docType: docTypes[i]
            });

            if (bytes(metas[i]).length > 0) {
                metadata[hash] = metas[i];
            }

            uint256 certId = ++certCount;
            certById[certId] = hash;

            emit Certified(certId, msg.sender, hash, docTypes[i], operator);

            unchecked { ++i; }
        }

        // Single fee call for entire batch
        totalEthCollected += msg.value;
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit BatchCertified(msg.sender, startId, count, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TRANSFER
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Transfer certificate ownership to another address.
    ///         Useful for selling certified assets or transferring rights.
    ///
    /// @param documentHash The certified document hash
    /// @param newOwner     New owner address
    function transferCertificate(bytes32 documentHash, address newOwner) external {
        Certificate storage cert = certs[documentHash];
        if (cert.owner != msg.sender) revert NotCertOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        address oldOwner = cert.owner;
        cert.owner = newOwner;

        emit CertificateTransferred(documentHash, oldOwner, newOwner);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Verify a document hash — anyone can check, no account needed.
    ///         Returns all certificate data if the hash was notarized.
    function verify(bytes32 documentHash) external view returns (
        bool    exists,
        address owner,
        uint48  timestamp,
        uint8   docType,
        string  memory meta
    ) {
        Certificate memory cert = certs[documentHash];
        if (cert.timestamp == 0) return (false, address(0), 0, 0, "");

        return (true, cert.owner, cert.timestamp, cert.docType, metadata[documentHash]);
    }

    /// @notice Get certificate by sequential ID
    function getCertificate(uint256 certId) external view returns (
        bytes32 documentHash,
        address owner,
        uint48  timestamp,
        uint8   docType,
        string  memory meta
    ) {
        documentHash = certById[certId];
        if (documentHash == bytes32(0)) return (bytes32(0), address(0), 0, 0, "");

        Certificate memory cert = certs[documentHash];
        return (documentHash, cert.owner, cert.timestamp, cert.docType, metadata[documentHash]);
    }

    /// @notice Get the ETH fee for certifying a document
    function getFee() external view returns (uint256) {
        return ecosystem.calculateFee(ACTION_CERTIFY, 0);
    }

    /// @notice Protocol statistics
    function getStats() external view returns (
        uint256 _certCount,
        uint256 _totalEthCollected
    ) {
        return (certCount, totalEthCollected);
    }

    /// @notice Contract version
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
