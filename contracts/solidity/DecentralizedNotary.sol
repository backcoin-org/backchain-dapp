// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *                    ██╗   ██╗███╗   ██╗███████╗████████╗ ██████╗ ██████╗
 *                    ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
 *                    ██║   ██║██╔██╗ ██║███████╗   ██║   ██║   ██║██████╔╝
 *                    ██║   ██║██║╚██╗██║╚════██║   ██║   ██║   ██║██╔═══╝
 *                    ╚██████╔╝██║ ╚████║███████║   ██║   ╚██████╔╝██║
 *                     ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : DecentralizedNotary
 *  Version     : 6.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchain
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn a percentage of ALL fees (BKC + ETH) generated
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 * ============================================================================
 *
 *  PURPOSE
 *
 *  Enterprise-grade document certification and timestamping on blockchain.
 *  Each notarization mints an NFT containing:
 *
 *  - IPFS content identifier (CID)
 *  - Document description
 *  - SHA-256 content hash
 *  - Immutable timestamp
 *
 *  Use Cases (examples, not exhaustive):
 *  - Legal document certification
 *  - Intellectual property timestamping
 *  - Academic credential verification
 *  - Contract and agreement notarization
 *  - Evidence preservation
 *
 * ============================================================================
 *
 *  FEE STRUCTURE (V6 - EQUAL FOR ALL)
 *
 *  +-------------+------------------+----------------------------------------+
 *  | Action      | Default Fee      | Destination                            |
 *  +-------------+------------------+----------------------------------------+
 *  | Notarize    | 1 BKC            | MiningManager                          |
 *  | Notarize    | 0.0001 ETH       | MiningManager                          |
 *  +-------------+------------------+----------------------------------------+
 *
 *  IMPORTANT: Fees are the SAME for all users. NFT ownership does NOT
 *             provide discounts on notarization fees. NFTs only affect
 *             the burn rate when claiming rewards from DelegationManager.
 *
 * ============================================================================
 *
 *  FEE DISTRIBUTION
 *
 *  BKC Flow:
 *  +------------------------------------------------------------------+
 *  |                      BKC FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |      +----------------------+----------------------+             |
 *  |      |          |           |                      |             |
 *  |      v          v           v                      v             |
 *  |  OPERATOR     BURN      TREASURY             DELEGATORS          |
 *  |  (config%)  (config%)   (config%)             (config%)          |
 *  +------------------------------------------------------------------+
 *
 *  ETH Flow:
 *  +------------------------------------------------------------------+
 *  |                      ETH FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |           +-----------------+-----------------+                  |
 *  |           |                                   |                  |
 *  |           v                                   v                  |
 *  |       OPERATOR                            TREASURY               |
 *  |       (config%)                           (remaining)            |
 *  +------------------------------------------------------------------+
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

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

interface IMiningManagerV3 {
    function performPurchaseMiningWithOperator(
        bytes32 serviceKey,
        uint256 purchaseAmount,
        address operator
    ) external payable;
}

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

    bytes32 public constant SERVICE_KEY = keccak256("NOTARY_SERVICE");

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    struct Document {
        string ipfsCid;
        string description;
        bytes32 contentHash;
        uint256 timestamp;
    }

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error EmptyMetadata();
    error TokenNotFound();
    error CoreContractNotSet();
    error InsufficientETHFee();
    error TransferFailed();

    // =========================================================================
    //                              STATE
    // =========================================================================

    IEcosystemManager public ecosystemManager;

    BKCToken public bkcToken;

    address public miningManagerAddress;

    uint256 private _nextTokenId;

    /// @notice ETH fee for notarization (default: 0.0001 ETH)
    uint256 public notarizationFeeETH;

    // -------------------------------------------------------------------------
    // Mappings
    // -------------------------------------------------------------------------

    mapping(uint256 => Document) public documents;

    mapping(uint256 => uint256) public notarizationFeePaid;

    /// @notice Reverse lookup: content hash => token ID
    /// @dev Allows anyone to verify if a document was notarized
    mapping(bytes32 => uint256) public hashToTokenId;

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    uint256 public totalNotarizations;

    uint256 public totalBKCCollected;

    uint256 public totalETHCollected;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    /**
     * @dev Reserved storage slots for future upgrades.
     *
     *      Current usage: 8 slots (non-mapping state variables)
     *      Reserved: 44 slots
     *
     *      Future features may include:
     *      - Document categories
     *      - Expiration dates
     *      - Witness/signature system
     *      - Batch notarization roots
     *      - Subscription system
     *
     *      When adding new state variables, reduce __gap accordingly.
     */
    uint256[44] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event DocumentNotarized(
        uint256 indexed tokenId,
        address indexed owner,
        string ipfsCid,
        bytes32 indexed contentHash,
        uint256 bkcFeePaid,
        uint256 ethFeePaid,
        address operator
    );

    event ETHFeeUpdated(uint256 oldFee, uint256 newFee);

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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

        // Default ETH fee
        notarizationFeeETH = 0.0001 ether;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         CORE FUNCTIONS
    // =========================================================================

    /**
     * @notice Notarizes a document on the blockchain
     * @dev Mints an NFT containing the document certification
     *
     *      Fee Structure (V6 - EQUAL FOR ALL):
     *      - BKC fee: Retrieved from EcosystemManager (NO discount)
     *      - ETH fee: Fixed amount (NO discount)
     *
     *      Both fees go to MiningManager which distributes to:
     *      - Operator (if provided)
     *      - Burn (BKC only)
     *      - Treasury
     *      - Delegators (BKC only)
     *
     * @param _ipfsCid IPFS content identifier
     * @param _description Brief description of the document
     * @param _contentHash SHA-256 hash of the document content
     * @param _operator Address of the frontend operator (can be address(0))
     * @return tokenId The minted NFT token ID
     */
    function notarize(
        string calldata _ipfsCid,
        string calldata _description,
        bytes32 _contentHash,
        address _operator
    ) external payable nonReentrant returns (uint256 tokenId) {
        if (bytes(_ipfsCid).length == 0) revert EmptyMetadata();
        if (msg.value < notarizationFeeETH) revert InsufficientETHFee();

        // Get BKC fee (same for all users - NO discount)
        uint256 bkcFeeToPay = ecosystemManager.getFee(SERVICE_KEY);

        // Process BKC payment
        if (bkcFeeToPay > 0) {
            bkcToken.safeTransferFrom(msg.sender, address(this), bkcFeeToPay);
            bkcToken.safeTransfer(miningManagerAddress, bkcFeeToPay);

            unchecked {
                totalBKCCollected += bkcFeeToPay;
            }
        }

        // Process ETH payment
        uint256 ethFeeToPay = msg.value;
        if (ethFeeToPay > 0) {
            unchecked {
                totalETHCollected += ethFeeToPay;
            }
        }

        // Send both fees to MiningManager with operator info
        _sendToMining(bkcFeeToPay, ethFeeToPay, _operator);

        // Mint NFT
        tokenId = _nextTokenId;
        unchecked {
            ++_nextTokenId;
            ++totalNotarizations;
        }

        _safeMint(msg.sender, tokenId);

        // Store document data
        documents[tokenId] = Document({
            ipfsCid: _ipfsCid,
            description: _description,
            contentHash: _contentHash,
            timestamp: block.timestamp
        });

        // Register reverse lookup
        hashToTokenId[_contentHash] = tokenId;

        notarizationFeePaid[tokenId] = bkcFeeToPay;

        emit DocumentNotarized(
            tokenId,
            msg.sender,
            _ipfsCid,
            _contentHash,
            bkcFeeToPay,
            ethFeeToPay,
            _operator
        );
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function getDocument(uint256 _tokenId) external view returns (Document memory) {
        if (!_exists(_tokenId)) revert TokenNotFound();
        return documents[_tokenId];
    }

    /**
     * @notice Verifies if a document hash was notarized
     * @dev Allows anyone to verify document authenticity without knowing the token ID
     *      This is useful for public verification pages and APIs
     *
     * @param _contentHash SHA-256 hash to verify
     * @return exists True if document was notarized
     * @return tokenId The NFT token ID (0 if not found)
     * @return owner Current owner of the certificate
     * @return timestamp When the document was notarized
     */
    function verifyByHash(bytes32 _contentHash) external view returns (
        bool exists,
        uint256 tokenId,
        address owner,
        uint256 timestamp
    ) {
        tokenId = hashToTokenId[_contentHash];
        
        if (tokenId == 0) {
            return (false, 0, address(0), 0);
        }
        
        return (
            true,
            tokenId,
            ownerOf(tokenId),
            documents[tokenId].timestamp
        );
    }

    /// @notice Get the current fee for notarization
    /// @return bkcFee BKC fee amount
    /// @return ethFee ETH fee amount
    function getFee() external view returns (uint256 bkcFee, uint256 ethFee) {
        bkcFee = ecosystemManager.getFee(SERVICE_KEY);
        ethFee = notarizationFeeETH;
    }

    function totalSupply() external view returns (uint256) {
        unchecked {
            return _nextTokenId - 1;
        }
    }

    function getStats() external view returns (
        uint256 notarizations,
        uint256 bkcCollected,
        uint256 ethCollected
    ) {
        return (totalNotarizations, totalBKCCollected, totalETHCollected);
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert TokenNotFound();

        Document memory doc = documents[_tokenId];
        string memory imageUrl = _convertIpfsToHttp(doc.ipfsCid);

        string memory fullDescription = string(abi.encodePacked(
            _escapeJson(doc.description),
            "\\n\\n---\\n",
            "Verified by Backchain Protocol\\n",
            "Content Hash: ", _bytes32ToHex(doc.contentHash)
        ));

        bytes memory json = abi.encodePacked(
            '{"name":"Notary Certificate #', _tokenId.toString(), '",',
            '"description":"', fullDescription, '",',
            '"external_url":"https://backcoin.org/notary/', _tokenId.toString(), '",',
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
    //                         ADMIN FUNCTIONS
    // =========================================================================

    function setETHFee(uint256 _newFee) external onlyOwner {
        emit ETHFeeUpdated(notarizationFeeETH, _newFee);
        notarizationFeeETH = _newFee;
    }

    function updateMiningManager() external onlyOwner {
        address mmAddress = ecosystemManager.getMiningManagerAddress();
        if (mmAddress == address(0)) revert CoreContractNotSet();
        miningManagerAddress = mmAddress;
    }

    function emergencyRecover(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        if (_token == address(0)) {
            (bool success, ) = _to.call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            SafeERC20Upgradeable.safeTransfer(
                IERC20Upgradeable(_token),
                _to,
                _amount
            );
        }
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    function _sendToMining(
        uint256 _bkcAmount,
        uint256 _ethAmount,
        address _operator
    ) internal {
        if (miningManagerAddress == address(0)) return;

        // Call MiningManager with BKC amount and ETH value
        try IMiningManagerV3(miningManagerAddress).performPurchaseMiningWithOperator{value: _ethAmount}(
            SERVICE_KEY,
            _bkcAmount,
            _operator
        ) {} catch {
            // Fallback: send ETH to treasury if MiningManager fails
            if (_ethAmount > 0) {
                address treasury = ecosystemManager.getTreasuryAddress();
                if (treasury != address(0)) {
                    (bool success, ) = treasury.call{value: _ethAmount}("");
                    if (!success) revert TransferFailed();
                }
            }
        }
    }

    function _convertIpfsToHttp(string memory _ipfsUri) internal pure returns (string memory) {
        bytes memory uriBytes = bytes(_ipfsUri);

        if (uriBytes.length > 7) {
            bytes memory prefix = new bytes(7);
            for (uint256 i; i < 7;) {
                prefix[i] = uriBytes[i];
                unchecked { ++i; }
            }

            if (keccak256(prefix) == keccak256("ipfs://")) {
                bytes memory cid = new bytes(uriBytes.length - 7);
                for (uint256 i = 7; i < uriBytes.length;) {
                    cid[i - 7] = uriBytes[i];
                    unchecked { ++i; }
                }
                return string(abi.encodePacked("https://ipfs.io/ipfs/", cid));
            }
        }

        return _ipfsUri;
    }

    function _bytes32ToHex(bytes32 _data) internal pure returns (string memory) {
        return StringsUpgradeable.toHexString(uint256(_data), 32);
    }

    function _escapeJson(string memory _str) internal pure returns (string memory) {
        return _str;
    }

    receive() external payable {}
}
