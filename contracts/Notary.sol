// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NOTARY V5 — CARTÓRIO DIGITAL (ERC-721)
// ============================================================================
//
// Decentralized digital registry combining document certification with
// asset registration, ownership transfer, and on-chain annotations.
//
// V5 Changes (over V4):
//   - REMOVED: Boost system entirely (boostCertificate, isBoosted, boostExpiry)
//   - REMOVED: totalEthCollected, totalBoostRevenue counters
//   - REMOVED: DOC_* constants (unused, only MAX_DOC_TYPE kept)
//   - ADDED: Asset Registry (registerAsset, transferAsset)
//   - ADDED: Annotations/Averbações (addAnnotation)
//   - ADDED: setBaseURI (ecosystem owner only)
//   - MODIFIED: ownerOf/_transferNFT handle both certificates and assets
//   - MODIFIED: verify/getCertificate return 5 fields (no boost)
//   - MODIFIED: getStats returns (certCount, totalTransfers, assetCount, annotationTotal)
//
// Asset Types: 0=Imóvel, 1=Veículo, 2=Propriedade Intelectual, 3=Outros
// Annotation Types: 0=Hipoteca, 1=Penhora, 2=Ordem Judicial, 3=Seguro,
//                   4=Reforma, 5=Observação, 6=Cancelamento
//
// Shared tokenId sequence: certificates and assets use the same counter.
// Both are ERC-721 NFTs in the same collection.
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

    // Certificate actions
    bytes32 public constant ACTION_CERTIFY   = keccak256("NOTARY_CERTIFY");
    bytes32 public constant ACTION_TRANSFER  = keccak256("NOTARY_TRANSFER");

    // Asset actions
    bytes32 public constant ACTION_ASSET_REGISTER = keccak256("ASSET_REGISTER");
    bytes32 public constant ACTION_ASSET_TRANSFER = keccak256("ASSET_TRANSFER");
    bytes32 public constant ACTION_ASSET_ANNOTATE = keccak256("ASSET_ANNOTATE");

    uint8 public constant MAX_BATCH_SIZE = 20;
    uint8 private constant MAX_DOC_TYPE = 9;
    uint8 public constant MAX_ASSET_TYPE = 3;
    uint8 public constant MAX_ANNOTATION_TYPE = 6;

    // ERC165 interface IDs
    bytes4 private constant ERC165_ID          = 0x01ffc9a7;
    bytes4 private constant ERC721_ID          = 0x80ac58cd;
    bytes4 private constant ERC721_METADATA_ID = 0x5b5e139f;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — CERTIFICATES
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Certificate data — packed in 1 storage slot (27 bytes)
    struct Certificate {
        address owner;      // 20 bytes
        uint48  timestamp;  // 6 bytes
        uint8   docType;    // 1 byte
    }

    mapping(bytes32 => Certificate) public certs;
    mapping(bytes32 => string) public metadata;
    mapping(uint256 => bytes32) public certById;
    mapping(bytes32 => uint256) public certIdByHash;

    uint256 public certCount;       // shared tokenId counter (certs + assets)
    uint256 public totalTransfers;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — ASSET REGISTRY
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Asset data — packed in 1 storage slot (32 bytes)
    struct Asset {
        address owner;           // 20 bytes
        uint48  registeredAt;    // 6 bytes
        uint8   assetType;       // 1 byte
        uint8   annotationCount; // 1 byte (max 255)
        uint32  transferCount;   // 4 bytes
    }

    /// @dev Annotation — packed in 1 storage slot (27 bytes)
    struct Annotation {
        address author;          // 20 bytes
        uint48  timestamp;       // 6 bytes
        uint8   annotationType;  // 1 byte
    }

    mapping(uint256 => Asset) public assets;
    mapping(uint256 => string) public assetMeta;
    mapping(uint256 => bytes32) public assetDocHash;
    mapping(uint256 => mapping(uint256 => Annotation)) public annotations;
    mapping(uint256 => mapping(uint256 => string)) public annotationMeta;

    uint256 public assetCount;
    uint256 public annotationTotal;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — ERC-721
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    string private _baseTokenURI;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS — CERTIFICATES
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
    // EVENTS — ASSET REGISTRY
    // ════════════════════════════════════════════════════════════════════════

    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed owner,
        uint8   assetType,
        bytes32 documentHash,
        address operator
    );

    event AssetTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 declaredValue,
        uint48  timestamp
    );

    event AnnotationAdded(
        uint256 indexed tokenId,
        uint256 indexed annotationId,
        address indexed author,
        uint8   annotationType
    );

    event BaseURIUpdated(string newBaseURI);

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
    error NotCertified();
    error TokenNotFound();
    error NotOwnerOrApproved();
    error NonERC721Receiver();
    error InvalidAssetType();
    error InvalidAnnotationType();
    error NotEcosystemOwner();

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
            docType: docType
        });

        if (bytes(meta).length > 0) {
            metadata[documentHash] = meta;
        }

        certId = ++certCount;
        certById[certId] = documentHash;
        certIdByHash[documentHash] = certId;

        _balances[msg.sender]++;

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
                docType: docTypes[i]
            });

            if (bytes(metas[i]).length > 0) {
                metadata[hash] = metas[i];
            }

            uint256 cid = ++certCount;
            certById[cid] = hash;
            certIdByHash[hash] = cid;

            emit Transfer(address(0), msg.sender, cid);
            emit Certified(cid, msg.sender, hash, docTypes[i], operator);

            unchecked { ++i; }
        }

        _balances[msg.sender] += count;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit BatchCertified(msg.sender, startId, count, operator);
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
        uint256 cid = certIdByHash[documentHash];

        cert.owner = newOwner;
        _balances[oldOwner]--;
        _balances[newOwner]++;
        delete _tokenApprovals[cid];
        ++totalTransfers;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit Transfer(oldOwner, newOwner, cid);
        emit CertificateTransferred(documentHash, oldOwner, newOwner);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REGISTER ASSET (mints ERC-721 NFT)
    // ════════════════════════════════════════════════════════════════════════

    function registerAsset(
        uint8 assetType,
        string calldata meta,
        bytes32 documentHash,
        address operator
    ) external payable returns (uint256 tokenId) {
        if (assetType > MAX_ASSET_TYPE) revert InvalidAssetType();

        uint256 fee = ecosystem.calculateFee(ACTION_ASSET_REGISTER, 0);
        if (msg.value < fee) revert InsufficientFee();

        tokenId = ++certCount; // shared sequence

        assets[tokenId] = Asset({
            owner: msg.sender,
            registeredAt: uint48(block.timestamp),
            assetType: assetType,
            annotationCount: 0,
            transferCount: 0
        });

        if (bytes(meta).length > 0) assetMeta[tokenId] = meta;
        if (documentHash != bytes32(0)) assetDocHash[tokenId] = documentHash;

        ++assetCount;
        _balances[msg.sender]++;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit Transfer(address(0), msg.sender, tokenId);
        emit AssetRegistered(tokenId, msg.sender, assetType, documentHash, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TRANSFER ASSET (ownership change with audit trail)
    // ════════════════════════════════════════════════════════════════════════

    function transferAsset(
        uint256 tokenId,
        address newOwner,
        uint256 declaredValue,
        string calldata meta,
        address operator
    ) external payable {
        Asset storage asset = assets[tokenId];
        if (asset.registeredAt == 0) revert TokenNotFound();
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotOwnerOrApproved();
        if (newOwner == address(0)) revert ZeroAddress();

        uint256 fee = ecosystem.calculateFee(ACTION_ASSET_TRANSFER, 0);
        if (msg.value < fee) revert InsufficientFee();

        address oldOwner = asset.owner;
        asset.owner = newOwner;
        asset.transferCount++;

        _balances[oldOwner]--;
        _balances[newOwner]++;
        delete _tokenApprovals[tokenId];
        ++totalTransfers;

        // Store transfer details as annotation if meta provided
        if (bytes(meta).length > 0) {
            uint256 annId = asset.annotationCount;
            annotations[tokenId][annId] = Annotation({
                author: msg.sender,
                timestamp: uint48(block.timestamp),
                annotationType: 5 // Observação — transfer note
            });
            annotationMeta[tokenId][annId] = meta;
            asset.annotationCount++;
            ++annotationTotal;
        }

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit Transfer(oldOwner, newOwner, tokenId);
        emit AssetTransferred(tokenId, oldOwner, newOwner, declaredValue, uint48(block.timestamp));
    }

    // ════════════════════════════════════════════════════════════════════════
    // ANNOTATIONS (averbações)
    // ════════════════════════════════════════════════════════════════════════

    function addAnnotation(
        uint256 tokenId,
        uint8 annotationType,
        string calldata meta,
        address operator
    ) external payable returns (uint256 annotationId) {
        Asset storage asset = assets[tokenId];
        if (asset.registeredAt == 0) revert TokenNotFound();
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotOwnerOrApproved();
        if (annotationType > MAX_ANNOTATION_TYPE) revert InvalidAnnotationType();

        uint256 fee = ecosystem.calculateFee(ACTION_ASSET_ANNOTATE, 0);
        if (msg.value < fee) revert InsufficientFee();

        annotationId = asset.annotationCount;
        annotations[tokenId][annotationId] = Annotation({
            author: msg.sender,
            timestamp: uint48(block.timestamp),
            annotationType: annotationType
        });
        if (bytes(meta).length > 0) {
            annotationMeta[tokenId][annotationId] = meta;
        }

        asset.annotationCount++;
        ++annotationTotal;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit AnnotationAdded(tokenId, annotationId, msg.sender, annotationType);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SET BASE URI (ecosystem owner only)
    // ════════════════════════════════════════════════════════════════════════

    function setBaseURI(string calldata newBaseURI) external {
        (bool ok, bytes memory data) = address(ecosystem).staticcall(
            abi.encodeWithSignature("owner()")
        );
        if (!ok || data.length != 32 || msg.sender != abi.decode(data, (address)))
            revert NotEcosystemOwner();

        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ERC-721 — VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function totalSupply() external view returns (uint256) {
        return certCount;
    }

    function ownerOf(uint256 tokenId) public view returns (address owner) {
        // Check certificate
        bytes32 hash = certById[tokenId];
        if (hash != bytes32(0)) {
            owner = certs[hash].owner;
            if (owner != address(0)) return owner;
        }
        // Check asset
        Asset memory a = assets[tokenId];
        if (a.registeredAt != 0) return a.owner;
        revert TokenNotFound();
    }

    function balanceOf(address owner) public view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balances[owner];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        // Validate token exists (cert or asset)
        bytes32 hash = certById[tokenId];
        if (hash == bytes32(0) && assets[tokenId].registeredAt == 0) revert TokenNotFound();
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        // Validate token exists
        bytes32 hash = certById[tokenId];
        if (hash == bytes32(0) && assets[tokenId].registeredAt == 0) revert TokenNotFound();
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
    // NOTARY — VIEWS (Certificates)
    // ════════════════════════════════════════════════════════════════════════

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

    function getCertificatesBatch(uint256 start, uint256 count) external view returns (
        bytes32[] memory hashes,
        address[] memory owners,
        uint48[]  memory timestamps,
        uint8[]   memory docTypes
    ) {
        uint256 end = start + count;
        if (end > certCount + 1) end = certCount + 1;
        uint256 len = end > start ? end - start : 0;

        hashes     = new bytes32[](len);
        owners     = new address[](len);
        timestamps = new uint48[](len);
        docTypes   = new uint8[](len);

        for (uint256 i = 0; i < len; i++) {
            bytes32 h = certById[start + i];
            Certificate memory c = certs[h];
            hashes[i]     = h;
            owners[i]     = c.owner;
            timestamps[i] = c.timestamp;
            docTypes[i]   = c.docType;
        }
    }

    function getFee() external view returns (uint256) {
        return ecosystem.calculateFee(_getCertifyAction(0), 0);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ASSET — VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function getAsset(uint256 tokenId) external view returns (
        address owner,
        uint48  registeredAt,
        uint8   assetType,
        uint8   annotationCount,
        uint32  transferCount,
        string  memory meta,
        bytes32 documentHash
    ) {
        Asset memory a = assets[tokenId];
        if (a.registeredAt == 0) return (address(0), 0, 0, 0, 0, "", bytes32(0));
        return (a.owner, a.registeredAt, a.assetType, a.annotationCount, a.transferCount, assetMeta[tokenId], assetDocHash[tokenId]);
    }

    function getAnnotation(uint256 tokenId, uint256 index) external view returns (
        address author,
        uint48  timestamp,
        uint8   annotationType,
        string  memory meta
    ) {
        Annotation memory ann = annotations[tokenId][index];
        return (ann.author, ann.timestamp, ann.annotationType, annotationMeta[tokenId][index]);
    }

    function getAnnotationCount(uint256 tokenId) external view returns (uint256) {
        return assets[tokenId].annotationCount;
    }

    function isAsset(uint256 tokenId) external view returns (bool) {
        return assets[tokenId].registeredAt != 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // GLOBAL VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function getStats() external view returns (
        uint256 _certCount,
        uint256 _totalTransfers,
        uint256 _assetCount,
        uint256 _annotationTotal
    ) {
        return (certCount, totalTransfers, assetCount, annotationTotal);
    }

    function version() external pure returns (string memory) {
        return "5.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — ERC-721
    // ════════════════════════════════════════════════════════════════════════

    function _transferNFT(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) revert ZeroAddress();

        // Check certificate
        bytes32 hash = certById[tokenId];
        if (hash != bytes32(0)) {
            Certificate storage cert = certs[hash];
            if (cert.owner != from) revert NotOwnerOrApproved();
            cert.owner = to;
        } else {
            // Check asset
            Asset storage asset = assets[tokenId];
            if (asset.registeredAt == 0) revert TokenNotFound();
            if (asset.owner != from) revert NotOwnerOrApproved();
            asset.owner = to;
            asset.transferCount++;
        }

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
