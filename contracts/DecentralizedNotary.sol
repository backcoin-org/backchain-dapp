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
 * @title Backcoin Digital Notary
 * @notice Enterprise-grade document certification.
 * @dev Optimized for OpenSea/Arbiscan display.
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

    // --- Structs ---
    struct Document {
        string ipfsCid;      // Ex: ipfs://QmHash...
        string description;  
        bytes32 contentHash; 
        uint256 timestamp;   
    }

    // --- State Variables ---
    IEcosystemManager public ecosystemManager;
    IDelegationManager public delegationManager;
    BKCToken public bkcToken;
    address public miningManagerAddress;

    uint256 private _nextTokenId;

    mapping(uint256 => Document) public documents;
    mapping(uint256 => uint256) public notarizationFeePaid;

    bytes32 public constant SERVICE_KEY = keccak256("NOTARY_SERVICE");

    event NotarizationEvent(
        uint256 indexed tokenId,
        address indexed owner,
        string ipfsCid,
        bytes32 contentHash
    );

    error InvalidAddress();
    error InvalidMetadata();
    error InsufficientPStake();
    error FeeTransferFailed();
    error InvalidFee();
    error TokenDoesNotExist();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC721_init("Backchain Digital Notary", "BKCN");
        __ReentrancyGuard_init();
        
        _transferOwnership(_initialOwner);

        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        address _miningManagerAddr = ecosystemManager.getMiningManagerAddress();

        if (_bkcTokenAddress == address(0) || _dmAddress == address(0) || _miningManagerAddr == address(0)) revert InvalidAddress();

        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        miningManagerAddress = _miningManagerAddr;
        
        _nextTokenId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Core Functions ---

    function notarize(
        string calldata _ipfsCid,
        string calldata _description,
        bytes32 _contentHash,
        uint256 _boosterTokenId
    ) external nonReentrant returns (uint256 tokenId) {
        if (bytes(_ipfsCid).length == 0) revert InvalidMetadata();

        (uint256 baseFee, uint256 minPStake) = ecosystemManager.getServiceRequirements(SERVICE_KEY);

        if (minPStake > 0) {
            uint256 userPStake = delegationManager.userTotalPStake(msg.sender);
            if (userPStake < minPStake) revert InsufficientPStake();
        }
        
        uint256 feeToPay = baseFee;
        if (feeToPay > 0 && _boosterTokenId > 0) {
            address boosterAddress = ecosystemManager.getBoosterAddress();
            if (boosterAddress != address(0)) {
                try IRewardBoosterNFT(boosterAddress).ownerOf(_boosterTokenId) returns (address owner) {
                    if (owner == msg.sender) {
                        uint256 boostBips = IRewardBoosterNFT(boosterAddress).boostBips(_boosterTokenId);
                        uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);
                        if (discountBips > 0) {
                            uint256 discountAmount = (baseFee * discountBips) / 10000;
                            feeToPay = (baseFee > discountAmount) ? baseFee - discountAmount : 0;
                        }
                    }
                } catch {}
            }
        }
 
        if (feeToPay > 0) {
            bkcToken.safeTransferFrom(msg.sender, address(this), feeToPay);
            bkcToken.safeTransfer(miningManagerAddress, feeToPay);
            IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, feeToPay);
        }

        tokenId = _nextTokenId;
        unchecked { _nextTokenId++; }
        
        _safeMint(msg.sender, tokenId);

        documents[tokenId] = Document({
            ipfsCid: _ipfsCid,
            description: _description,
            contentHash: _contentHash,
            timestamp: block.timestamp
        });

        notarizationFeePaid[tokenId] = feeToPay;

        emit NotarizationEvent(tokenId, msg.sender, _ipfsCid, _contentHash);
        return tokenId;
    }

    // --- MARKETPLACE METADATA GENERATOR (Fixed for Visibility) ---

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);

        Document memory doc = documents[tokenId];

        // Converte ipfs:// para https://ipfs.io/ipfs/ para garantir visibilidade no Explorer
        string memory imageHttp = _convertToHttp(doc.ipfsCid);

        string memory fullDescription = string(abi.encodePacked(
            _escapeJson(doc.description),
            "\\n\\n-------------------\\n",
            "**Verified by Backchain Protocol.**\\n",
            "Content Hash (SHA-256): ", _bytes32ToString(doc.contentHash)
        ));

        bytes memory dataURI = abi.encodePacked(
            '{',
                '"name": "Notary Registry #', tokenId.toString(), '",',
                '"description": "', fullDescription, '",', 
                '"external_url": "https://backcoin.org/notary",', 
                '"image": "', imageHttp, '",', // Link HTTP direto
                '"attributes": [',
                    '{"trait_type": "Verification", "value": "Secured"},',
                    '{"trait_type": "Timestamp", "display_type": "date", "value": ', uint256(doc.timestamp).toString(), '},',
                    '{"trait_type": "Data Integrity", "value": "SHA-256"}',
                ']',
            '}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64Upgradeable.encode(dataURI)
            )
        );
    }

    function getDocumentInfo(uint256 tokenId) external view returns (Document memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return documents[tokenId];
    }

    // --- Helpers ---

    // Remove "ipfs://" e adiciona gateway público
    function _convertToHttp(string memory _ipfsUri) internal pure returns (string memory) {
        bytes memory uriBytes = bytes(_ipfsUri);
        if (uriBytes.length > 7) {
            // Checa se começa com ipfs://
            // 0x697066733a2f2f é "ipfs://" em hex
            if (keccak256(abi.encodePacked(substring(_ipfsUri, 0, 7))) == keccak256(abi.encodePacked("ipfs://"))) {
                string memory cid = substring(_ipfsUri, 7, uriBytes.length);
                return string(abi.encodePacked("https://ipfs.io/ipfs/", cid));
            }
        }
        return _ipfsUri; // Retorna original se não for ipfs://
    }

    // Função auxiliar para substring em Solidity
    function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        return StringsUpgradeable.toHexString(uint256(_bytes32), 32);
    }

    function _escapeJson(string memory _str) internal pure returns (string memory) {
        return string(abi.encodePacked(_str)); 
    }
}