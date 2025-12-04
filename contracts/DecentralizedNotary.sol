// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title Decentralized Notary
 * @notice A key service in the Backcoin Protocol ($BKC) for immutable document certification.
 * @dev Mints NFTs representing notarized documents.  Optimized for Arbitrum Network.:
 * - Removes ERC721Enumerable (saves ~40% gas on mint).
 * - Uses bytes32 keys for service identification.
 * - Integrates with the $BKC revenue funnel.
 */
contract DecentralizedNotary is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721Upgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    IDelegationManager public delegationManager;
    BKCToken public bkcToken;
    address public miningManagerAddress;

    // Optimized Counter (replaces OpenZeppelin Counters to save bytecode)
    uint256 private _nextTokenId;

    mapping(uint256 => string) public documentMetadataURI;
    mapping(uint256 => uint256) public notarizationFeePaid;

    // Optimized Service Key (Hash pre-calculated)
    bytes32 public constant SERVICE_KEY = keccak256("NOTARY_SERVICE");

    // --- Events ---

    event NotarizationEvent(
        uint256 indexed tokenId,
        address indexed owner,
        string indexed documentMetadataHash,
        uint256 feePaid
    );

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidMetadata();
    error InsufficientPStake();
    error FeeTransferFailed();
    error InvalidFee();

    // --- Initialization ---

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
        __ERC721_init("Notary Certificate", "NOTARY");
        __ReentrancyGuard_init();
        
        _transferOwnership(_initialOwner);

        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        address _miningManagerAddr = ecosystemManager.getMiningManagerAddress();

        if (
            _bkcTokenAddress == address(0) ||
            _dmAddress == address(0) ||
            _miningManagerAddr == address(0)
        ) revert InvalidAddress();

        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        miningManagerAddress = _miningManagerAddr;
        
        // Start IDs at 1
        _nextTokenId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Core Functions ---

    /**
     * @notice Notarizes a document by minting an NFT linked to its metadata URI.
     * @dev 100% of the fee is transferred to the MiningManager to trigger PoP mining.
     * @param _documentMetadataURI The IPFS or storage link to the document data.
     * @param _boosterTokenId Optional Booster NFT ID for fee discount.
     */
    function notarize(
        string calldata _documentMetadataURI,
        uint256 _boosterTokenId
    ) external nonReentrant returns (uint256 tokenId) {
        if (bytes(_documentMetadataURI).length == 0) revert InvalidMetadata();

        // 1. Get Base Fee and pStake Minimum from Hub (using optimized bytes32 key)
        (uint256 baseFee, uint256 minPStake) = ecosystemManager.getServiceRequirements(SERVICE_KEY);

        // 2. Check pStake Minimum
        if (minPStake > 0) {
            // Direct call saves gas compared to getting address every time
            uint256 userPStake = delegationManager.userTotalPStake(msg.sender);
            if (userPStake < minPStake) revert InsufficientPStake();
        }
        
        // 3. Apply Booster Discount
        uint256 feeToPay = baseFee;
        if (feeToPay > 0 && _boosterTokenId > 0) {
            address boosterAddress = ecosystemManager.getBoosterAddress();
            if (boosterAddress != address(0)) {
                IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);
                // Wrap in try/catch to prevent reversion if NFT is invalid
                try booster.ownerOf(_boosterTokenId) returns (address owner) {
                    if (owner == msg.sender) {
                        uint256 boostBips = booster.boostBips(_boosterTokenId);
                        uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);
                        
                        if (discountBips > 0) {
                            uint256 discountAmount = (baseFee * discountBips) / 10000;
                            feeToPay = (baseFee > discountAmount) ? baseFee - discountAmount : 0;
                        }
                    }
                } catch {
                    // Ignore if NFT is invalid/burned
                }
            }
        }
 
        if (feeToPay == 0) revert InvalidFee();

        // 4. Pull Fee from User
        // Using SafeERC20 internally handles boolean checking
        bkcToken.safeTransferFrom(msg.sender, address(this), feeToPay);

        // 5. Transfer 100% Fee to MiningManager (PoP Trigger)
        bkcToken.safeTransfer(miningManagerAddress, feeToPay);

        // 6. Call MiningManager to perform PoP mining ($BKC Minting & Distribution)
        IMiningManager(miningManagerAddress)
            .performPurchaseMining(
                SERVICE_KEY,
                feeToPay 
            );

        // 7. Mint the Notary NFT
        // Unchecked increment saves gas, uint256 overflow is practically impossible here
        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId++;
        }
        
        _safeMint(msg.sender, tokenId);

        // 8. Store Metadata and Fee Record
        documentMetadataURI[tokenId] = _documentMetadataURI;
        notarizationFeePaid[tokenId] = feeToPay;
        
        // 9. Emit Event
        emit NotarizationEvent(
            tokenId, 
            msg.sender, 
            _documentMetadataURI, 
            feeToPay 
        );
        
        return tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireMinted(tokenId);
        return documentMetadataURI[tokenId];
    }

    /**
     * @dev Overridden to resolve inheritance conflicts if any, 
     * though simpler now without Enumerable.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}