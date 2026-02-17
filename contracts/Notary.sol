// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NOTARY V4 — IMMUTABLE ERC-721 CERTIFICATE NFTs (Tier 1: ETH only)
// ============================================================================
//
// On-chain document certification with native ERC-721 NFT minting.
// Each certified document becomes a real, transferable NFT.
//
// V4 Changes (over V3):
//   - Native ERC-721 compliance (ownerOf, balanceOf, tokenURI, transferFrom, etc.)
//   - certify() mints an NFT (emits Transfer + Certified)
//   - transferCertificate() emits ERC-721 Transfer event (with fee)
//   - Standard transferFrom/safeTransferFrom (free, no ecosystem fee)
//   - tokenURI() returns metadata API URL
//   - supportsInterface for ERC165 + ERC721 + ERC721Metadata
//   - Reverse mapping certIdByHash for efficient lookups
//
// Preserved from V3:
//   - Per-docType fees (10 action IDs)
//   - Certificate boost (1-30 days)
//   - transferCertificate with fee + operator
//   - getCertificatesBatch, verify, getStats
//
// No admin. No pause. Fully immutable and permissionless.
//
// ============================================================================

/// @dev ERC721 receiver interface for safeTransferFrom
interface IERC721Receiver {
    function onERC721Received(
        address operator, address from, uint256 tokenId, bytes calldata data
    ) external returns (bytes4);
}

contract Notary {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    string  public constant name   = "Backchain Notary Certificate";
    string  public constant symbol = "BKCN";

    bytes32 public constant MODULE_ID        = keccak256("NOTARY");
    bytes32 public constant ACTION_CERTIFY   = keccak256("NOTARY_CERTIFY");
    bytes32 public constant ACTION_BOOST     = keccak256("NOTARY_BOOST");
    bytes32 public constant ACTION_TRANSFER  = keccak256("NOTARY_TRANSFER");

    /// @notice Maximum documents per batch transaction
    uint8 public constant MAX_BATCH_SIZE = 20;

    /// @notice Maximum boost duration in days
    uint8 public constant MAX_BOOST_DAYS = 30;

    // Document types
    uint8 public constant DOC_GENERAL     = 0;
    uint8 public constant DOC_CONTRACT    = 1;
    uint8 public constant DOC_IDENTITY    = 2;
    uint8 public constant DOC_DIPLOMA     = 3;
    uint8 public constant DOC_PROPERTY    = 4;
    uint8 public constant DOC_FINANCIAL   = 5;
    uint8 public constant DOC_LEGAL       = 6;
    uint8 public constant DOC_MEDICAL     = 7;
    uint8 public constant DOC_IP          = 8;
    uint8 public constant DOC_OTHER       = 9;

    uint8 private constant MAX_DOC_TYPE = 9;

    // ERC165 interface IDs
    bytes4 private constant ERC165_ID          = 0x01ffc9a7;
    bytes4 private constant ERC721_ID          = 0x80ac58cd;
    bytes4 private constant ERC721_METADATA_ID = 0x5b5e139f;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — NOTARY
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Certificate data — packed in 1 storage slot (31 bytes)
    struct Certificate {
        address owner;
        uint48  timestamp;
        uint8   docType;
        uint32  boostExpiry;
    }

    mapping(bytes32 => Certificate) public certs;
    mapping(bytes32 => string) public metadata;
    mapping(uint256 => bytes32) public certById;
    mapping(bytes32 => uint256) public certIdByHash;

    uint256 public certCount;
    uint256 public totalEthCollected;
    uint256 public totalBoostRevenue;
    uint256 public totalTransfers;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — ERC-721
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    string private _baseTokenURI;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS — NOTARY
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
    // EVENTS — ERC-721
    // ════════════════════════════════════════════════════════════════════════

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

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
    error TokenNotFound();
    error NotOwnerOrApproved();
    error NonERC721Receiver();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem, string memory baseTokenURI_) {
        ecosystem = IBackchainEcosystem(_ecosystem);
        _baseTokenURI = baseTokenURI_;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: PER-DOCTYPE ACTION ID
    // ════════════════════════════════════════════════════════════════════════

    function _getCertifyAction(uint8 docType) internal pure returns (bytes32) {
        return keccak256(abi.encode("NOTARY_CERTIFY_T", docType));
    }

    // ════════════════════════════════════════════════════════════════════════
    // CERTIFY (mints ERC-721 NFT)
    // ════════════════════════════════════════════════════════════════════════

    function certify(
        bytes32 documentHash,
        string calldata meta,
        uint8 docType,
        address operator
    ) external payable returns (uint256 certId) {
        if (documentHash == bytes32(0)) revert EmptyHash();
        if (certs[documentHash].timestamp != 0) revert AlreadyCertified();
        if (docType > MAX_DOC_TYPE) revert InvalidDocType();

        uint256 fee = ecosystem.calculateFee(_getCertifyAction(docType), 0);
        if (msg.value < fee) revert InsufficientFee();

        certs[documentHash] = Certificate({
            owner: msg.sender,
            timestamp: uint48(block.timestamp),
            docType: docType,
            boostExpiry: 0
        });

        if (bytes(meta).length > 0) {
            metadata[documentHash] = meta;
        }

        certId = ++certCount;
        certById[certId] = documentHash;
        certIdByHash[documentHash] = certId;

        // ERC-721 mint
        _balances[msg.sender]++;

        totalEthCollected += msg.value;
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit Transfer(address(0), msg.sender, certId);
        emit Certified(certId, msg.sender, documentHash, docType, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BATCH CERTIFY (mints ERC-721 NFTs)
    // ════════════════════════════════════════════════════════════════════════

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
            certIdByHash[hash] = certId;

            emit Transfer(address(0), msg.sender, certId);
            emit Certified(certId, msg.sender, hash, docTypes[i], operator);

            unchecked { ++i; }
        }

        // ERC-721 balance update (batch)
        _balances[msg.sender] += count;

        totalEthCollected += msg.value;
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit BatchCertified(msg.sender, startId, count, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BOOST
    // ════════════════════════════════════════════════════════════════════════

    function boostCertificate(bytes32 documentHash, uint256 days_, address operator) external payable {
        Certificate storage cert = certs[documentHash];
        if (cert.timestamp == 0) revert NotCertified();
        if (days_ == 0) revert ZeroDays();
        if (days_ > MAX_BOOST_DAYS) revert TooManyDays();

        uint256 feePerDay = ecosystem.calculateFee(ACTION_BOOST, 0);
        uint256 totalFee = feePerDay * days_;
        if (msg.value < totalFee) revert InsufficientFee();

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
    // TRANSFER CERTIFICATE (with fee + operator)
    // ════════════════════════════════════════════════════════════════════════

    function transferCertificate(bytes32 documentHash, address newOwner, address operator) external payable {
        Certificate storage cert = certs[documentHash];
        if (cert.owner != msg.sender) revert NotCertOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        uint256 fee = ecosystem.calculateFee(ACTION_TRANSFER, 0);
        if (msg.value < fee) revert InsufficientFee();

        address oldOwner = cert.owner;
        uint256 certId = certIdByHash[documentHash];

        cert.owner = newOwner;
        _balances[oldOwner]--;
        _balances[newOwner]++;
        delete _tokenApprovals[certId];
        ++totalTransfers;

        if (msg.value > 0) {
            totalEthCollected += msg.value;
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit Transfer(oldOwner, newOwner, certId);
        emit CertificateTransferred(documentHash, oldOwner, newOwner);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ERC-721 — VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function totalSupply() external view returns (uint256) {
        return certCount;
    }

    function ownerOf(uint256 tokenId) public view returns (address owner) {
        bytes32 hash = certById[tokenId];
        if (hash == bytes32(0)) revert TokenNotFound();
        owner = certs[hash].owner;
        if (owner == address(0)) revert TokenNotFound();
    }

    function balanceOf(address owner) public view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balances[owner];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        bytes32 hash = certById[tokenId];
        if (hash == bytes32(0)) revert TokenNotFound();
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        bytes32 hash = certById[tokenId];
        if (hash == bytes32(0)) revert TokenNotFound();
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == ERC165_ID || id == ERC721_ID || id == ERC721_METADATA_ID;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ERC-721 — MUTATIONS (free, no ecosystem fee)
    // ════════════════════════════════════════════════════════════════════════

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender))
            revert NotOwnerOrApproved();
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotOwnerOrApproved();
        _transferNFT(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        _safeTransfer(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external {
        _safeTransfer(from, to, tokenId, data);
    }

    // ════════════════════════════════════════════════════════════════════════
    // NOTARY — VIEWS
    // ════════════════════════════════════════════════════════════════════════

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

    function getFee() external view returns (uint256) {
        return ecosystem.calculateFee(_getCertifyAction(0), 0);
    }

    function isBoosted(bytes32 documentHash) external view returns (bool) {
        return block.timestamp < certs[documentHash].boostExpiry;
    }

    function getStats() external view returns (
        uint256 _certCount,
        uint256 _totalEthCollected,
        uint256 _totalBoostRevenue,
        uint256 _totalTransfers
    ) {
        return (certCount, totalEthCollected, totalBoostRevenue, totalTransfers);
    }

    function version() external pure returns (string memory) {
        return "4.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — ERC-721
    // ════════════════════════════════════════════════════════════════════════

    function _transferNFT(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) revert ZeroAddress();
        bytes32 hash = certById[tokenId];
        if (hash == bytes32(0)) revert TokenNotFound();
        Certificate storage cert = certs[hash];
        if (cert.owner != from) revert NotOwnerOrApproved();

        cert.owner = to;
        _balances[from]--;
        _balances[to]++;
        delete _tokenApprovals[tokenId];
        ++totalTransfers;

        emit Transfer(from, to, tokenId);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        transferFrom(from, to, tokenId);
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data)
            returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector)
                    revert NonERC721Receiver();
            } catch {
                revert NonERC721Receiver();
            }
        }
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return spender == owner
            || _tokenApprovals[tokenId] == spender
            || _operatorApprovals[owner][spender];
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
        return string(buffer);
    }
}
