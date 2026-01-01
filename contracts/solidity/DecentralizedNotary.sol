// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title Backchain Digital Notary
 * @author Backchain Protocol
 * @notice Enterprise-grade document certification and timestamping on the blockchain
 * @dev Each notarization mints an NFT containing:
 *      - IPFS content identifier (CID)
 *      - Document description
 *      - SHA-256 content hash
 *      - Immutable timestamp
 *
 *      Features:
 *      - On-chain metadata using Base64 encoding
 *      - NFT-based fee discounts via RewardBoosterNFT
 *      - Proof-of-Purchase mining integration
 *      - OpenSea compatible metadata
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract DecentralizedNotary is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721Upgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;
    using StringsUpgradeable for uint256;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Basis points denominator (100% = 10000)
    uint256 private constant BIPS_DENOMINATOR = 10_000;

    /// @notice Service key for MiningManager authorization
    bytes32 public constant SERVICE_KEY = keccak256("NOTARY_SERVICE");

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /// @notice Document certification record
    struct Document {
        string ipfsCid;       // IPFS content identifier (e.g., "ipfs://Qm...")
        string description;   // Human-readable description
        bytes32 contentHash;  // SHA-256 hash of document content
        uint256 timestamp;    // Block timestamp when notarized
    }

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to the ecosystem hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice Address of the mining manager
    address public miningManagerAddress;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @notice Token ID => Document data
    mapping(uint256 => Document) public documents;

    /// @notice Token ID => Fee paid for notarization
    mapping(uint256 => uint256) public notarizationFeePaid;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when a document is notarized
    event DocumentNotarized(
        uint256 indexed tokenId,
        address indexed owner,
        string ipfsCid,
        bytes32 indexed contentHash,
        uint256 feePaid
    );

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error EmptyMetadata();
    error TokenNotFound();
    error CoreContractNotSet();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Digital Notary contract
     * @param _owner Contract owner address
     * @param _ecosystemManager Address of the ecosystem hub
     */
    function initialize(
        address _owner,
        address _ecosystemManager
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC721_init("Backchain Digital Notary", "BKCN");
        __ReentrancyGuard_init();

        _transferOwnership(_owner);

        ecosystemManager = IEcosystemManager(_ecosystemManager);

        address bkcAddress = ecosystemManager.getBKCTokenAddress();
        address mmAddress = ecosystemManager.getMiningManagerAddress();

        if (bkcAddress == address(0) || mmAddress == address(0)) {
            revert CoreContractNotSet();
        }

        bkcToken = BKCToken(bkcAddress);
        miningManagerAddress = mmAddress;

        _nextTokenId = 1;
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         CORE FUNCTIONS
    // =========================================================================

    /**
     * @notice Notarizes a document on the blockchain
     * @dev Mints an NFT containing the document certification
     *
     *      Fee Calculation with NFT Discount:
     *      - Base fee retrieved from EcosystemManager
     *      - If user owns a RewardBoosterNFT, discount is applied proportionally
     *      - Example: 1 BKC fee with 70% discount = 0.3 BKC
     *
     * @param _ipfsCid IPFS content identifier (e.g., "ipfs://QmHash...")
     * @param _description Brief description of the document
     * @param _contentHash SHA-256 hash of the document content
     * @param _boosterTokenId RewardBoosterNFT token ID for fee discount (0 = no discount)
     * @return tokenId The minted NFT token ID
     */
    function notarize(
        string calldata _ipfsCid,
        string calldata _description,
        bytes32 _contentHash,
        uint256 _boosterTokenId
    ) external nonReentrant returns (uint256 tokenId) {
        if (bytes(_ipfsCid).length == 0) revert EmptyMetadata();

        // Calculate fee with potential NFT discount
        uint256 feeToPay = _calculateFeeWithDiscount(_boosterTokenId);

        // Process payment
        if (feeToPay > 0) {
            bkcToken.safeTransferFrom(msg.sender, address(this), feeToPay);
            bkcToken.safeTransfer(miningManagerAddress, feeToPay);
            IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, feeToPay);
        }

        // Mint NFT
        tokenId = _nextTokenId;
        unchecked {
            ++_nextTokenId;
        }

        _safeMint(msg.sender, tokenId);

        // Store document data
        documents[tokenId] = Document({
            ipfsCid: _ipfsCid,
            description: _description,
            contentHash: _contentHash,
            timestamp: block.timestamp
        });

        notarizationFeePaid[tokenId] = feeToPay;

        emit DocumentNotarized(tokenId, msg.sender, _ipfsCid, _contentHash, feeToPay);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns the document data for a token
     * @param _tokenId Token ID to query
     * @return Document struct containing all certification data
     */
    function getDocument(uint256 _tokenId) external view returns (Document memory) {
        if (!_exists(_tokenId)) revert TokenNotFound();
        return documents[_tokenId];
    }

    /**
     * @notice Returns the current notarization fee (without discount)
     * @return Base fee in BKC
     */
    function getBaseFee() external view returns (uint256) {
        return ecosystemManager.getFee(SERVICE_KEY);
    }

    /**
     * @notice Calculates the fee a user would pay
     * @param _boosterTokenId NFT token ID for discount calculation
     * @return Fee amount after discount
     */
    function calculateFee(uint256 _boosterTokenId) external view returns (uint256) {
        return _calculateFeeWithDiscount(_boosterTokenId);
    }

    /**
     * @notice Returns total number of notarized documents
     * @return Current token count
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Returns fully on-chain metadata for OpenSea compatibility
     * @param _tokenId Token ID to query
     * @return Base64-encoded JSON metadata
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert TokenNotFound();

        Document memory doc = documents[_tokenId];
        string memory imageUrl = _convertIpfsToHttp(doc.ipfsCid);

        // Build description with verification info
        string memory fullDescription = string(abi.encodePacked(
            _escapeJson(doc.description),
            "\\n\\n---\\n",
            "Verified by Backchain Protocol\\n",
            "Content Hash: ", _bytes32ToHex(doc.contentHash)
        ));

        // Build JSON metadata
        bytes memory json = abi.encodePacked(
            '{"name":"Notary Certificate #', _tokenId.toString(), '",',
            '"description":"', fullDescription, '",',
            '"external_url":"https://backcoin.org/notary/',  _tokenId.toString(), '",',
            '"image":"', imageUrl, '",',
            '"attributes":[',
                '{"trait_type":"Status","value":"Verified"},',
                '{"trait_type":"Timestamp","display_type":"date","value":', doc.timestamp.toString(), '},',
                '{"trait_type":"Algorithm","value":"SHA-256"},',
                '{"trait_type":"Network","value":"Arbitrum"}',
            ']}'
        );

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64Upgradeable.encode(json)
        ));
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Calculates fee with NFT booster discount
     *
     *      Discount Calculation (PROPORTIONAL):
     *      - discountAmount = baseFee × discountBips / 10000
     *      - finalFee = baseFee - discountAmount
     *
     *      Example with Diamond NFT (70% discount = 7000 bips):
     *      - Base Fee: 1.0 BKC
     *      - Discount: 1.0 × 7000 / 10000 = 0.7 BKC
     *      - Final Fee: 1.0 - 0.7 = 0.3 BKC
     */
    function _calculateFeeWithDiscount(uint256 _boosterTokenId) internal view returns (uint256) {
        uint256 baseFee = ecosystemManager.getFee(SERVICE_KEY);

        if (baseFee == 0 || _boosterTokenId == 0) {
            return baseFee;
        }

        address boosterAddress = ecosystemManager.getBoosterAddress();
        if (boosterAddress == address(0)) {
            return baseFee;
        }

        IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);

        // Try/catch prevents revert if NFT doesn't exist
        try booster.ownerOf(_boosterTokenId) returns (address owner) {
            if (owner == msg.sender) {
                uint256 boostBips = booster.boostBips(_boosterTokenId);
                uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);

                if (discountBips > 0) {
                    // Calculate PROPORTIONAL discount
                    uint256 discountAmount = (baseFee * discountBips) / BIPS_DENOMINATOR;
                    return baseFee > discountAmount ? baseFee - discountAmount : 0;
                }
            }
        } catch {}

        return baseFee;
    }

    /**
     * @dev Converts IPFS URI to HTTP gateway URL
     */
    function _convertIpfsToHttp(string memory _ipfsUri) internal pure returns (string memory) {
        bytes memory uriBytes = bytes(_ipfsUri);

        // Check for "ipfs://" prefix (7 characters)
        if (uriBytes.length > 7) {
            bytes memory prefix = new bytes(7);
            for (uint256 i = 0; i < 7; i++) {
                prefix[i] = uriBytes[i];
            }

            if (keccak256(prefix) == keccak256("ipfs://")) {
                // Extract CID (everything after "ipfs://")
                bytes memory cid = new bytes(uriBytes.length - 7);
                for (uint256 i = 7; i < uriBytes.length; i++) {
                    cid[i - 7] = uriBytes[i];
                }
                return string(abi.encodePacked("https://ipfs.io/ipfs/", cid));
            }
        }

        return _ipfsUri;
    }

    /**
     * @dev Converts bytes32 to hexadecimal string
     */
    function _bytes32ToHex(bytes32 _data) internal pure returns (string memory) {
        return StringsUpgradeable.toHexString(uint256(_data), 32);
    }

    /**
     * @dev Simple JSON string escaping
     */
    function _escapeJson(string memory _str) internal pure returns (string memory) {
        // Basic implementation - extend as needed for special characters
        return _str;
    }
}
