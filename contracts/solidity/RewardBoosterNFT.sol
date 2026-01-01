// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./IInterfaces.sol";

/**
 * @title RewardBoosterNFT
 * @author Backchain Protocol
 * @notice Utility NFTs that provide fee discounts across the Backcoin ecosystem
 * @dev Each NFT has a "boost power" (in basis points) that determines the discount tier.
 *
 *      Tier System:
 *      ┌──────────┬────────────┬──────────────┐
 *      │ Tier     │ Boost Bips │ Discount     │
 *      ├──────────┼────────────┼──────────────┤
 *      │ Crystal  │ 1000       │ 10%          │
 *      │ Iron     │ 2000       │ 20%          │
 *      │ Bronze   │ 3000       │ 30%          │
 *      │ Silver   │ 4000       │ 40%          │
 *      │ Gold     │ 5000       │ 50%          │
 *      │ Platinum │ 6000       │ 60%          │
 *      │ Diamond  │ 7000       │ 70%          │
 *      └──────────┴────────────┴──────────────┘
 *
 *      The actual discount percentage is configured in EcosystemManager.
 *      This contract only stores the boost power for each token.
 *
 *      Minting:
 *      - Owner can mint for giveaways/partnerships via ownerMintBatch()
 *      - Authorized minters can mint via mintFromSale()
 *      - NFTLiquidityPools are authorized via Factory integration
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract RewardBoosterNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using StringsUpgradeable for uint256;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Maximum boost value (100% = 10000 bips)
    uint256 public constant MAX_BOOST_BIPS = 10_000;

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Token ID => Boost power in basis points
    mapping(uint256 => uint256) public boostBips;

    /// @notice Token ID => Metadata file name (e.g., "diamond.json")
    mapping(uint256 => string) public tokenMetadataFile;

    /// @notice Base URI for metadata (e.g., "https://api.backcoin.org/nft/")
    string private _baseTokenURI;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @notice Authorized minters mapping (address => authorized)
    mapping(address => bool) public authorizedMinters;

    /// @notice NFTLiquidityPoolFactory address for automatic pool authorization
    address public poolFactory;

    /// @notice Legacy: single sale contract (kept for backward compatibility)
    /// @dev New deployments should use authorizedMinters mapping
    address public saleContract;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when a booster NFT is minted
    event BoosterMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 boostBips,
        string metadataFile
    );

    /// @notice Emitted when base URI is updated
    event BaseURIUpdated(string previousURI, string newURI);

    /// @notice Emitted when sale contract is updated (legacy)
    event SaleContractUpdated(
        address indexed previousContract,
        address indexed newContract
    );

    /// @notice Emitted when a minter is authorized or revoked
    event MinterAuthorizationChanged(
        address indexed minter,
        bool authorized
    );

    /// @notice Emitted when pool factory is updated
    event PoolFactoryUpdated(
        address indexed previousFactory,
        address indexed newFactory
    );

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroQuantity();
    error InvalidBoostValue();
    error UnauthorizedMinter();
    error TokenNotFound();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the RewardBoosterNFT contract
     * @param _owner Contract owner address
     */
    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __ERC721_init("Backchain Reward Booster", "BKCB");
        __ERC721Enumerable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);
        _nextTokenId = 1;
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Sets the base URI for token metadata
     * @param _newBaseURI New base URI (e.g., "https://api.backcoin.org/nft/")
     */
    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        string memory previousURI = _baseTokenURI;
        _baseTokenURI = _newBaseURI;

        emit BaseURIUpdated(previousURI, _newBaseURI);
    }

    /**
     * @notice Sets the authorized sale contract (legacy - single contract)
     * @dev Kept for backward compatibility. Use setMinterAuthorization for multiple minters.
     * @param _saleContract Address of the sale contract
     */
    function setSaleContract(address _saleContract) external onlyOwner {
        address previousContract = saleContract;
        saleContract = _saleContract;

        emit SaleContractUpdated(previousContract, _saleContract);
    }

    /**
     * @notice Sets authorization for a minter address
     * @dev Use this for authorizing multiple pools or sale contracts
     * @param _minter Address to authorize/revoke
     * @param _authorized True to authorize, false to revoke
     */
    function setMinterAuthorization(address _minter, bool _authorized) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();
        
        authorizedMinters[_minter] = _authorized;
        
        emit MinterAuthorizationChanged(_minter, _authorized);
    }

    /**
     * @notice Batch authorize multiple minters
     * @param _minters Array of addresses to authorize
     * @param _authorized Authorization status for all
     */
    function setMinterAuthorizationBatch(
        address[] calldata _minters,
        bool _authorized
    ) external onlyOwner {
        for (uint256 i = 0; i < _minters.length;) {
            if (_minters[i] == address(0)) revert ZeroAddress();
            
            authorizedMinters[_minters[i]] = _authorized;
            emit MinterAuthorizationChanged(_minters[i], _authorized);
            
            unchecked { ++i; }
        }
    }

    /**
     * @notice Sets the NFTLiquidityPoolFactory address
     * @dev Pools created by this factory are automatically authorized
     * @param _factory Address of the pool factory
     */
    function setPoolFactory(address _factory) external onlyOwner {
        address previousFactory = poolFactory;
        poolFactory = _factory;

        emit PoolFactoryUpdated(previousFactory, _factory);
    }

    /**
     * @notice Mints multiple NFTs to a recipient (owner only)
     * @dev Used for giveaways, partnerships, and treasury reserves
     * @param _to Recipient address
     * @param _quantity Number of NFTs to mint
     * @param _boostBips Boost power for all minted NFTs
     * @param _metadataFile Metadata file name for all minted NFTs
     */
    function ownerMintBatch(
        address _to,
        uint256 _quantity,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        if (_quantity == 0) revert ZeroQuantity();
        if (_boostBips == 0 || _boostBips > MAX_BOOST_BIPS) revert InvalidBoostValue();

        for (uint256 i = 0; i < _quantity;) {
            _mintBooster(_to, _boostBips, _metadataFile);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Mints a single NFT to a recipient (owner only)
     * @param _to Recipient address
     * @param _boostBips Boost power
     * @param _metadataFile Metadata file name
     * @return tokenId The minted token ID
     */
    function ownerMint(
        address _to,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external onlyOwner returns (uint256) {
        if (_to == address(0)) revert ZeroAddress();
        if (_boostBips == 0 || _boostBips > MAX_BOOST_BIPS) revert InvalidBoostValue();

        return _mintBooster(_to, _boostBips, _metadataFile);
    }

    // =========================================================================
    //                         SALE INTEGRATION
    // =========================================================================

    /**
     * @notice Mints an NFT from an authorized minter
     * @dev Called by NFTLiquidityPool during public sales.
     *      Authorization checked in order:
     *      1. Legacy saleContract
     *      2. authorizedMinters mapping
     *      3. Pool created by poolFactory (via INFTLiquidityPoolFactory.isPool)
     * @param _to Recipient address
     * @param _boostBips Boost power for the NFT
     * @param _metadataFile Metadata file name
     * @return tokenId The minted token ID
     */
    function mintFromSale(
        address _to,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external returns (uint256) {
        // Check authorization
        if (!_isAuthorizedMinter(msg.sender)) revert UnauthorizedMinter();
        if (_to == address(0)) revert ZeroAddress();
        if (_boostBips == 0 || _boostBips > MAX_BOOST_BIPS) revert InvalidBoostValue();

        return _mintBooster(_to, _boostBips, _metadataFile);
    }

    /**
     * @notice Checks if an address is authorized to mint
     * @param _minter Address to check
     * @return True if authorized
     */
    function isAuthorizedMinter(address _minter) external view returns (bool) {
        return _isAuthorizedMinter(_minter);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns the metadata URI for a token
     * @param _tokenId Token ID to query
     * @return Full metadata URI
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721Upgradeable)
        returns (string memory)
    {
        if (!_exists(_tokenId)) revert TokenNotFound();

        string memory baseURI = _baseTokenURI;
        string memory metadataFile = tokenMetadataFile[_tokenId];

        if (bytes(baseURI).length > 0) {
            return string(abi.encodePacked(baseURI, metadataFile));
        }

        return metadataFile;
    }

    /**
     * @notice Returns the boost power for a token
     * @param _tokenId Token ID to query
     * @return Boost power in basis points
     */
    function getBoostBips(uint256 _tokenId) external view returns (uint256) {
        if (!_exists(_tokenId)) revert TokenNotFound();
        return boostBips[_tokenId];
    }

    /**
     * @notice Returns the total number of minted NFTs
     * @return Total supply
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Returns the next token ID to be minted
     * @return Next token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Returns all tokens owned by an address
     * @param _owner Owner address
     * @return Array of token IDs
     */
    function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(_owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance;) {
            tokens[i] = tokenOfOwnerByIndex(_owner, i);
            unchecked { ++i; }
        }

        return tokens;
    }

    /**
     * @notice Returns the highest boost NFT owned by an address
     * @param _owner Owner address
     * @return tokenId Token ID with highest boost (0 if none)
     * @return boost Boost value in bips (0 if none)
     */
    function getHighestBoostOf(address _owner) external view returns (
        uint256 tokenId,
        uint256 boost
    ) {
        uint256 balance = balanceOf(_owner);

        for (uint256 i = 0; i < balance;) {
            uint256 id = tokenOfOwnerByIndex(_owner, i);
            uint256 tokenBoost = boostBips[id];

            if (tokenBoost > boost) {
                boost = tokenBoost;
                tokenId = id;
            }

            unchecked { ++i; }
        }
    }

    /**
     * @notice Checks if an address owns any booster NFT
     * @param _owner Address to check
     * @return True if owner has at least one NFT
     */
    function hasBooster(address _owner) external view returns (bool) {
        return balanceOf(_owner) > 0;
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Checks if an address is authorized to mint
     *      Authorization hierarchy:
     *      1. Legacy saleContract (backward compatibility)
     *      2. authorizedMinters mapping
     *      3. Valid pool from poolFactory
     */
    function _isAuthorizedMinter(address _minter) internal view returns (bool) {
        // Check legacy single sale contract
        if (_minter == saleContract && saleContract != address(0)) {
            return true;
        }
        
        // Check authorized minters mapping
        if (authorizedMinters[_minter]) {
            return true;
        }
        
        // Check if minter is a valid pool from factory
        if (poolFactory != address(0)) {
            try INFTLiquidityPoolFactory(poolFactory).isPool(_minter) returns (bool isPool) {
                if (isPool) return true;
            } catch {
                // Factory call failed, continue to return false
            }
        }
        
        return false;
    }

    /**
     * @dev Internal function to mint a booster NFT
     */
    function _mintBooster(
        address _to,
        uint256 _boostBips,
        string calldata _metadataFile
    ) internal returns (uint256) {
        uint256 tokenId = _nextTokenId;

        unchecked {
            ++_nextTokenId;
        }

        _safeMint(_to, tokenId);

        boostBips[tokenId] = _boostBips;
        tokenMetadataFile[tokenId] = _metadataFile;

        emit BoosterMinted(tokenId, _to, _boostBips, _metadataFile);

        return tokenId;
    }

    // =========================================================================
    //                    REQUIRED OVERRIDES (ERC721Enumerable)
    // =========================================================================

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
