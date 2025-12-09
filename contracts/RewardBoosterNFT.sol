// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @title Backchain Reward Booster ($BKCB)
 * @notice Utility NFTs for the Backcoin Ecosystem.
 * @dev Holders earn fee discounts in Staking, Notary, and other ecosystem services.
 * Stores the "Boost Power" (Bips) which acts as a tier level.
 * Part of the Backcoin Ecosystem.
 * Website: Backcoin.org
 * Optimized for Arbitrum Network.
 */
contract RewardBoosterNFT is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    using StringsUpgradeable for uint256;

    // --- State Variables ---

    // Maps TokenID -> Boost Power (e.g. 100 = Level 1, 500 = Level 5)
    mapping(uint256 => uint256) public boostBips;
    // Maps TokenID -> Specific metadata file (e.g. "gold_tier.json")
    mapping(uint256 => string) public tokenMetadataFile;

    string private _customBaseURI;
    uint256 private _nextTokenId; 
    
    address public saleContractAddress;

    // --- Events ---

    event BoosterMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 boostInBips
    );
    event SaleContractAddressSet(address indexed saleContract);

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error InvalidBoostValue(); // Must be 0-10000
    error Unauthorized();
    error TokenDoesNotExist();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();

        __ERC721_init("Backchain Reward Booster", "BKCB");
        
        // Adjusted for OZ v4 compatibility
        __Ownable_init(); 
        __UUPSUpgradeable_init();
        
        _transferOwnership(_initialOwner);
        _nextTokenId = 1; // Start IDs at 1
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin Functions ---

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _customBaseURI = newBaseURI;
    }

    function setSaleContractAddress(address _saleAddress) external onlyOwner {
        if (_saleAddress == address(0)) revert InvalidAddress();
        saleContractAddress = _saleAddress;
        emit SaleContractAddressSet(_saleAddress);
    }

    /**
     * @notice Owner/Admin minting for giveaways, partnerships or treasury reserves.
     */
    function ownerMintBatch(
        address to,
        uint256 quantity,
        uint256 boostValueInBips,
        string calldata metadataFile
    ) external onlyOwner {
        if (quantity == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAddress();
        if (boostValueInBips == 0 || boostValueInBips > 10000) revert InvalidBoostValue();

        // Gas Optimization: Loop handling with unchecked increment
        for (uint256 i = 0; i < quantity;) {
            _mintInternal(to, boostValueInBips, metadataFile);
            unchecked { ++i; }
        }
    }

    // --- Sale Integration ---

    /**
     * @notice Allows the authorized Sale Contract to mint Boosters directly to buyers.
     */
    function mintFromSale(
        address to,
        uint256 boostValueInBips,
        string calldata metadataFile
    ) external returns (uint256) {
        if (msg.sender != saleContractAddress) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (boostValueInBips == 0 || boostValueInBips > 10000) revert InvalidBoostValue();

        return _mintInternal(to, boostValueInBips, metadataFile);
    }

    // --- Internal Logic ---

    function _mintInternal(
        address to,
        uint256 boostValueInBips,
        string calldata metadataFile
    ) internal returns (uint256) {
        uint256 tokenId = _nextTokenId;
        unchecked {
            _nextTokenId++;
        }

        _safeMint(to, tokenId);

        boostBips[tokenId] = boostValueInBips;
        tokenMetadataFile[tokenId] = metadataFile;

        emit BoosterMinted(tokenId, to, boostValueInBips);
        return tokenId;
    }

    // --- View Functions ---

    /**
     * @notice Returns the Metadata URI.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        // FIX: Replaced _requireOwned(tokenId) (v5) with _exists (v4)
        if (!_exists(tokenId)) revert TokenDoesNotExist();

        string memory baseURI = _customBaseURI;
        string memory metadataFile = tokenMetadataFile[tokenId];

        // Efficient concatenation
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, metadataFile))
            : metadataFile;
    }
}