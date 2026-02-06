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
 *  Contract    : RewardBoosterNFT
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
 *  PURPOSE
 *
 *  Utility NFTs that reduce the burn rate when claiming mining rewards
 *  from the DelegationManager. Without an NFT, 50% of rewards are burned.
 *  Each tier reduces this burn rate progressively.
 *
 *  TIER SYSTEM (4 Tiers):
 *  ┌──────────┬────────────┬───────────┬─────────────┐
 *  │ Tier     │ Boost Bips │ Burn Rate │ User Gets   │
 *  ├──────────┼────────────┼───────────┼─────────────┤
 *  │ No NFT   │ 0          │ 50%       │ 50%         │
 *  │ Bronze   │ 1000       │ 40%       │ 60%         │
 *  │ Silver   │ 2500       │ 25%       │ 75%         │
 *  │ Gold     │ 4000       │ 10%       │ 90%         │
 *  │ Diamond  │ 5000       │ 0%        │ 100%        │
 *  └──────────┴────────────┴───────────┴─────────────┘
 *
 *  NOTE: NFTs do NOT affect service fees (Fortune, Charity, Notary, etc).
 *        All users pay the same fees. NFTs only affect mining reward claims.
 *
 * ============================================================================
 *
 *  MINTING
 *
 *  - Owner can mint for giveaways/partnerships via ownerMint()
 *  - Authorized minters (NFTLiquidityPools) via mintFromSale()
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./IInterfaces.sol";
import "./TimelockUpgradeable.sol";

contract RewardBoosterNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    TimelockUpgradeable
{
    using StringsUpgradeable for uint256;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Maximum boost value (100% = 10000 bips)
    uint256 public constant MAX_BOOST_BIPS = 10_000;

    /// @notice Valid boost values for each tier
    uint256 public constant BOOST_BRONZE = 1000;   // 10% boost → 40% burn
    uint256 public constant BOOST_SILVER = 2500;   // 25% boost → 25% burn
    uint256 public constant BOOST_GOLD = 4000;     // 40% boost → 10% burn
    uint256 public constant BOOST_DIAMOND = 5000;  // 50% boost → 0% burn

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Boost power for each token (in basis points)
    mapping(uint256 => uint256) public boostBips;

    /// @notice Metadata file for each token
    mapping(uint256 => string) public tokenMetadataFile;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @notice Addresses authorized to mint
    mapping(address => bool) public authorizedMinters;

    /// @notice NFTLiquidityPoolFactory address
    address public poolFactory;

    /// @notice Sale contract address (legacy, can be used for future sales)
    address public saleContract;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[43] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event BoosterMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 boostBips,
        string metadataFile
    );

    event BaseURIUpdated(string previousURI, string newURI);

    event SaleContractUpdated(
        address indexed previousContract,
        address indexed newContract
    );

    event MinterAuthorizationChanged(
        address indexed minter,
        bool authorized
    );

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

    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __ERC721_init("Backchain Reward Booster", "BKCB");
        __ERC721Enumerable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);
        _nextTokenId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        string memory previousURI = _baseTokenURI;
        _baseTokenURI = _newBaseURI;

        emit BaseURIUpdated(previousURI, _newBaseURI);
    }

    function setSaleContract(address _saleContract) external onlyOwner {
        address previousContract = saleContract;
        saleContract = _saleContract;

        emit SaleContractUpdated(previousContract, _saleContract);
    }

    function setMinterAuthorization(address _minter, bool _authorized) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();

        authorizedMinters[_minter] = _authorized;

        emit MinterAuthorizationChanged(_minter, _authorized);
    }

    function setMinterAuthorizationBatch(
        address[] calldata _minters,
        bool _authorized
    ) external onlyOwner {
        for (uint256 i; i < _minters.length;) {
            if (_minters[i] == address(0)) revert ZeroAddress();

            authorizedMinters[_minters[i]] = _authorized;
            emit MinterAuthorizationChanged(_minters[i], _authorized);

            unchecked { ++i; }
        }
    }

    function setPoolFactory(address _factory) external onlyOwner {
        address previousFactory = poolFactory;
        poolFactory = _factory;

        emit PoolFactoryUpdated(previousFactory, _factory);
    }

    // =========================================================================
    //                         OWNER MINTING
    // =========================================================================

    function ownerMint(
        address _to,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external onlyOwner returns (uint256) {
        if (_to == address(0)) revert ZeroAddress();
        if (!_isValidBoostTier(_boostBips)) revert InvalidBoostValue();

        return _mintBooster(_to, _boostBips, _metadataFile);
    }

    function ownerMintBatch(
        address[] calldata _recipients,
        uint256[] calldata _boostBipsArray,
        string[] calldata _metadataFiles
    ) external onlyOwner returns (uint256[] memory tokenIds) {
        uint256 length = _recipients.length;
        if (length == 0) revert ZeroQuantity();
        if (length != _boostBipsArray.length || length != _metadataFiles.length) {
            revert ZeroQuantity();
        }

        tokenIds = new uint256[](length);

        for (uint256 i; i < length;) {
            if (_recipients[i] == address(0)) revert ZeroAddress();
            if (!_isValidBoostTier(_boostBipsArray[i])) revert InvalidBoostValue();

            tokenIds[i] = _mintBooster(_recipients[i], _boostBipsArray[i], _metadataFiles[i]);

            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                         SALE INTEGRATION
    // =========================================================================

    function mintFromSale(
        address _to,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external returns (uint256) {
        if (!_isAuthorizedMinter(msg.sender)) revert UnauthorizedMinter();
        if (_to == address(0)) revert ZeroAddress();
        if (!_isValidBoostTier(_boostBips)) revert InvalidBoostValue();

        return _mintBooster(_to, _boostBips, _metadataFile);
    }

    function isAuthorizedMinter(address _minter) external view returns (bool) {
        return _isAuthorizedMinter(_minter);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

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

    function getBoostBips(uint256 _tokenId) external view returns (uint256) {
        if (!_exists(_tokenId)) revert TokenNotFound();
        return boostBips[_tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(_owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i; i < balance;) {
            tokens[i] = tokenOfOwnerByIndex(_owner, i);
            unchecked { ++i; }
        }

        return tokens;
    }

    /// @notice Returns the highest boost NFT owned by an address
    /// @param _owner Address to check
    /// @return tokenId The token ID with highest boost (0 if none)
    /// @return boost The boost value in bips (0 if no NFT)
    function getHighestBoostOf(address _owner) external view returns (
        uint256 tokenId,
        uint256 boost
    ) {
        uint256 balance = balanceOf(_owner);

        for (uint256 i; i < balance;) {
            uint256 id = tokenOfOwnerByIndex(_owner, i);
            uint256 tokenBoost = boostBips[id];

            if (tokenBoost > boost) {
                boost = tokenBoost;
                tokenId = id;
            }

            unchecked { ++i; }
        }
    }

    /// @notice Check if address owns any booster NFT
    function hasBooster(address _owner) external view returns (bool) {
        return balanceOf(_owner) > 0;
    }

    /// @notice Get the tier name for a given boost value
    function getTierName(uint256 _boostBips) external pure returns (string memory) {
        if (_boostBips >= BOOST_DIAMOND) return "Diamond";
        if (_boostBips >= BOOST_GOLD) return "Gold";
        if (_boostBips >= BOOST_SILVER) return "Silver";
        if (_boostBips >= BOOST_BRONZE) return "Bronze";
        return "None";
    }

    /// @notice Get all valid tier boost values
    function getValidTiers() external pure returns (uint256[4] memory) {
        return [BOOST_BRONZE, BOOST_SILVER, BOOST_GOLD, BOOST_DIAMOND];
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    function _isAuthorizedMinter(address _minter) internal view returns (bool) {
        if (_minter == saleContract && saleContract != address(0)) {
            return true;
        }

        if (authorizedMinters[_minter]) {
            return true;
        }

        if (poolFactory != address(0)) {
            try INFTLiquidityPoolFactory(poolFactory).isPool(_minter) returns (bool isPool) {
                if (isPool) return true;
            } catch {}
        }

        return false;
    }

    /// @notice Validates that boost value is one of the valid tiers
    function _isValidBoostTier(uint256 _boostBips) internal pure returns (bool) {
        return _boostBips == BOOST_BRONZE ||
               _boostBips == BOOST_SILVER ||
               _boostBips == BOOST_GOLD ||
               _boostBips == BOOST_DIAMOND;
    }

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
