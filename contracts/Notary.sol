// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NOTARY V3 — IMMUTABLE (Tier 1: ETH only)
// ============================================================================
//
// On-chain document certification. Hash a file, store proof forever.
//
// V3 Changes:
//   - Per-docType fees (10 action IDs, different pricing per category)
//   - Certificate boost (1-30 days, additive expiry, pay-per-day)
//   - Transfer fee (ETH fee for ownership transfer)
//   - getCertificatesBatch for efficient batch reads
//   - Enhanced stats (totalBoostRevenue, totalTransfers)
//
// Features:
//   - Single or batch notarization (multiple docs in one tx)
//   - Document type classification (10 categories)
//   - Certificate ownership transfer (with fee)
//   - Certificate visibility boost (additive, stackable)
//   - Hash-based verification (anyone can verify, no account needed)
//   - Operator commissions on every action
//
// Economics:
//   - Per-docType ETH fee on certification → ecosystem
//   - ETH fee × days on boost → ecosystem
//   - Small ETH fee on transfer → ecosystem
//   - General/Other: cheapest; Legal/Property/Medical: premium
//
// Storage:
//   - 1 slot per certificate (31 bytes packed)
//   - Metadata stored separately (only if provided)
//   - Hash is the primary key (no duplication)
//
// No admin. No pause. Fully immutable and permissionless.
//
// ============================================================================

contract Notary {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID        = keccak256("NOTARY");
    bytes32 public constant ACTION_CERTIFY   = keccak256("NOTARY_CERTIFY"); // backward-compat (unused in V3 logic)
    bytes32 public constant ACTION_BOOST     = keccak256("NOTARY_BOOST");
    bytes32 public constant ACTION_TRANSFER  = keccak256("NOTARY_TRANSFER");

    /// @notice Maximum documents per batch transaction
    uint8 public constant MAX_BATCH_SIZE = 20;

    /// @notice Maximum boost duration in days
    uint8 public constant MAX_BOOST_DAYS = 30;

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

    /// @dev Certificate data — packed in 1 storage slot (31 bytes)
    ///      owner(20) + timestamp(6) + docType(1) + boostExpiry(4) = 31 bytes
    struct Certificate {
        address owner;
        uint48  timestamp;
        uint8   docType;
        uint32  boostExpiry;
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

    /// @notice Lifetime ETH collected from fees
    uint256 public totalEthCollected;

    /// @notice Lifetime ETH collected from boosts
    uint256 public totalBoostRevenue;

    /// @notice Lifetime certificate transfers
    uint256 public totalTransfers;

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

    event CertificateBoosted(
        bytes32 indexed documentHash,
        address indexed booster,
        uint32  boostExpiry,
        address operator
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
    error ZeroDays();
    error TooManyDays();
    error NotCertified();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem) {
        ecosystem = IBackchainEcosystem(_ecosystem);
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: PER-DOCTYPE ACTION ID
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Compute per-docType action ID for fee lookup.
    ///      Pattern: keccak256(abi.encode("NOTARY_CERTIFY_T", docType))
    ///      Each doc type can have its own fee config in ecosystem.
    function _getCertifyAction(uint8 docType) internal pure returns (bytes32) {
        return keccak256(abi.encode("NOTARY_CERTIFY_T", docType));
    }

    // ════════════════════════════════════════════════════════════════════════
    // CERTIFY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Notarize a document on-chain.
    ///
    ///         The documentHash is the SHA-256 (or keccak256) of the file content.
    ///         Once certified, the hash can never be re-certified — proof is permanent.
    ///         Fee depends on document type (Legal/Property > General).
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

        // V3: Per-docType fee
        uint256 fee = ecosystem.calculateFee(_getCertifyAction(docType), 0);
        if (msg.value < fee) revert InsufficientFee();

        // Store certificate (1 slot)
        certs[documentHash] = Certificate({
            owner: msg.sender,
            timestamp: uint48(block.timestamp),
            docType: docType,
            boostExpiry: 0
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
    ///         V3: ETH fee = sum of per-docType fees for each document.
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

        // V3: Sum per-docType fees
        uint256 totalFee;
        for (uint256 i; i < count;) {
            if (docTypes[i] > MAX_DOC_TYPE) revert InvalidDocType();
            totalFee += ecosystem.calculateFee(_getCertifyAction(docTypes[i]), 0);
            unchecked { ++i; }
        }
        if (msg.value < totalFee) revert InsufficientFee();

        startId = certCount + 1;
        uint48 ts = uint48(block.timestamp);

        for (uint256 i; i < count;) {
            bytes32 hash = documentHashes[i];
            if (hash == bytes32(0)) revert EmptyHash();
            if (certs[hash].timestamp != 0) revert AlreadyCertified();

            certs[hash] = Certificate({
                owner: msg.sender,
                timestamp: ts,
                docType: docTypes[i],
                boostExpiry: 0
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
    // BOOST
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost a certificate's visibility for X days. Pays ETH fee per day.
    ///         Anyone can boost any certificate. Stacks with existing boost.
    ///
    /// @param documentHash Certificate to boost
    /// @param days_        Number of days to boost (1-30)
    /// @param operator     Frontend operator
    function boostCertificate(bytes32 documentHash, uint256 days_, address operator) external payable {
        Certificate storage cert = certs[documentHash];
        if (cert.timestamp == 0) revert NotCertified();
        if (days_ == 0) revert ZeroDays();
        if (days_ > MAX_BOOST_DAYS) revert TooManyDays();

        // Fee = ecosystem fee per boost action × days
        uint256 feePerDay = ecosystem.calculateFee(ACTION_BOOST, 0);
        uint256 totalFee = feePerDay * days_;
        if (msg.value < totalFee) revert InsufficientFee();

        // Additive expiry: extend from current expiry if still active
        uint256 baseTime = block.timestamp;
        if (cert.boostExpiry > block.timestamp) {
            baseTime = uint256(cert.boostExpiry);
        }
        cert.boostExpiry = uint32(baseTime + days_ * 1 days);

        totalBoostRevenue += msg.value;
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit CertificateBoosted(documentHash, msg.sender, cert.boostExpiry, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TRANSFER
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Transfer certificate ownership to another address.
    ///         V3: Charges a small ETH fee for the transfer.
    ///
    /// @param documentHash The certified document hash
    /// @param newOwner     New owner address
    /// @param operator     Frontend operator
    function transferCertificate(bytes32 documentHash, address newOwner, address operator) external payable {
        Certificate storage cert = certs[documentHash];
        if (cert.owner != msg.sender) revert NotCertOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        // V3: Transfer fee
        uint256 fee = ecosystem.calculateFee(ACTION_TRANSFER, 0);
        if (msg.value < fee) revert InsufficientFee();

        address oldOwner = cert.owner;
        cert.owner = newOwner;
        ++totalTransfers;

        // Fee → ecosystem
        if (msg.value > 0) {
            totalEthCollected += msg.value;
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit CertificateTransferred(documentHash, oldOwner, newOwner);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Verify a document hash — anyone can check, no account needed.
    ///         V3: Returns isBoosted and boostExpiry.
    function verify(bytes32 documentHash) external view returns (
        bool    exists,
        address owner,
        uint48  timestamp,
        uint8   docType,
        string  memory meta,
        bool    boosted,
        uint32  boostExpiry
    ) {
        Certificate memory cert = certs[documentHash];
        if (cert.timestamp == 0) return (false, address(0), 0, 0, "", false, 0);

        return (
            true, cert.owner, cert.timestamp, cert.docType,
            metadata[documentHash],
            block.timestamp < cert.boostExpiry,
            cert.boostExpiry
        );
    }

    /// @notice Get certificate by sequential ID. V3: includes boost data.
    function getCertificate(uint256 certId) external view returns (
        bytes32 documentHash,
        address owner,
        uint48  timestamp,
        uint8   docType,
        string  memory meta,
        bool    boosted,
        uint32  boostExpiry
    ) {
        documentHash = certById[certId];
        if (documentHash == bytes32(0)) return (bytes32(0), address(0), 0, 0, "", false, 0);

        Certificate memory cert = certs[documentHash];
        return (
            documentHash, cert.owner, cert.timestamp, cert.docType,
            metadata[documentHash],
            block.timestamp < cert.boostExpiry,
            cert.boostExpiry
        );
    }

    /// @notice Batch read certificate data (no strings — too expensive)
    /// @param start First cert ID (1-based)
    /// @param count Number of certificates to read
    function getCertificatesBatch(uint256 start, uint256 count) external view returns (
        bytes32[] memory hashes,
        address[] memory owners,
        uint48[]  memory timestamps,
        uint8[]   memory docTypes,
        bool[]    memory boostedFlags,
        uint32[]  memory boostExpiries
    ) {
        uint256 end = start + count;
        if (end > certCount + 1) end = certCount + 1;
        uint256 len = end > start ? end - start : 0;

        hashes        = new bytes32[](len);
        owners        = new address[](len);
        timestamps    = new uint48[](len);
        docTypes      = new uint8[](len);
        boostedFlags  = new bool[](len);
        boostExpiries = new uint32[](len);

        for (uint256 i = 0; i < len; i++) {
            bytes32 h = certById[start + i];
            Certificate memory c = certs[h];
            hashes[i]        = h;
            owners[i]        = c.owner;
            timestamps[i]    = c.timestamp;
            docTypes[i]      = c.docType;
            boostedFlags[i]  = block.timestamp < c.boostExpiry;
            boostExpiries[i] = c.boostExpiry;
        }
    }

    /// @notice Get the ETH fee for certifying a General document (backward compat)
    function getFee() external view returns (uint256) {
        return ecosystem.calculateFee(_getCertifyAction(0), 0);
    }

    /// @notice Check if certificate is currently boosted
    function isBoosted(bytes32 documentHash) external view returns (bool) {
        return block.timestamp < certs[documentHash].boostExpiry;
    }

    /// @notice Protocol statistics (V3: includes boost revenue + transfers)
    function getStats() external view returns (
        uint256 _certCount,
        uint256 _totalEthCollected,
        uint256 _totalBoostRevenue,
        uint256 _totalTransfers
    ) {
        return (certCount, totalEthCollected, totalBoostRevenue, totalTransfers);
    }

    /// @notice Contract version
    function version() external pure returns (string memory) {
        return "3.0.0";
    }
}
