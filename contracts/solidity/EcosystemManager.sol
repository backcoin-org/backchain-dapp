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
 *  Contract    : EcosystemManager
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
 *  Central configuration hub for the Backcoin Real World Asset (RWA)
 *  ecosystem. Manages contract registry, fees, and distribution
 *  rules for all modules.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │                        ARCHITECTURE OVERVIEW                            │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │                                                                         │
 *  │                      ┌──────────────────┐                               │
 *  │                      │ EcosystemManager │ ◄── Central Hub               │
 *  │                      └────────┬─────────┘                               │
 *  │                               │                                         │
 *  │      ┌────────────────────────┼────────────────────────┐                │
 *  │      │            │           │           │            │                │
 *  │      ▼            ▼           ▼           ▼            ▼                │
 *  │  ┌──────┐   ┌──────────┐  ┌───────┐  ┌────────┐  ┌─────────┐           │
 *  │  │ BKC  │   │Delegation│  │Mining │  │ Notary │  │ Fortune │           │
 *  │  │Token │   │ Manager  │  │Manager│  │        │  │  Pool   │           │
 *  │  └──────┘   └──────────┘  └───────┘  └────────┘  └─────────┘           │
 *  │                                                                         │
 *  │      ┌────────────────────────┼────────────────────────┐                │
 *  │      │            │           │           │            │                │
 *  │      ▼            ▼           ▼           ▼            ▼                │
 *  │  ┌──────┐   ┌──────────┐  ┌───────┐  ┌────────┐  ┌─────────┐           │
 *  │  │Booste│   │NFT Pool  │  │Rental │  │Charity │  │Backchat │           │
 *  │  │ NFT  │   │ Factory  │  │Manager│  │ Pool   │  │         │           │
 *  │  └──────┘   └──────────┘  └───────┘  └────────┘  └─────────┘           │
 *  │                                                                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 *  EXTENSIBILITY: ADDING NEW MODULES
 *
 *  The EcosystemManager supports TWO registration methods:
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │ METHOD 1: Core Addresses (requires upgrade)                             │
 *  │ ─────────────────────────────────────────────                           │
 *  │ • Used for: Essential system contracts                                  │
 *  │ • Storage: Dedicated state variables                                    │
 *  │ • Getters: Named functions (getBKCTokenAddress, etc.)                   │
 *  │ • To add: Upgrade contract, add variable + getter                       │
 *  │                                                                         │
 *  │ Current core contracts:                                                 │
 *  │ - BKCToken, Treasury, DelegationManager                                 │
 *  │ - RewardBoosterNFT, MiningManager, Notary                               │
 *  │ - FortunePool, NFTPoolFactory, RentalManager                            │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │ METHOD 2: Module Registry (NO upgrade needed)                           │
 *  │ ─────────────────────────────────────────────                           │
 *  │ • Used for: New/optional modules                                        │
 *  │ • Storage: mapping(bytes32 => address) moduleRegistry                   │
 *  │ • Getters: getModule(bytes32 key)                                       │
 *  │ • To add: Call setModule(key, address) - NO UPGRADE!                    │
 *  │                                                                         │
 *  │ Example - Adding CharityPool:                                           │
 *  │ bytes32 key = keccak256("CHARITY_POOL");                                │
 *  │ ecosystemManager.setModule(key, charityPoolAddress);                    │
 *  │                                                                         │
 *  │ // From any contract:                                                   │
 *  │ address pool = ecosystemManager.getModule(key);                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 *  V6 NFT SYSTEM - 4 TIERS (BURN RATE ONLY)
 *
 *  NFTs have ONE purpose: reduce burn rate when claiming rewards.
 *  Service fees are EQUAL for all users - no discounts.
 *
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
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IInterfaces.sol";
import "./TimelockUpgradeable.sol";

contract EcosystemManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IEcosystemManager,
    TimelockUpgradeable
{
    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    bytes32 public constant MODULE_RENTAL_MANAGER = keccak256("RENTAL_MANAGER");

    bytes32 public constant MODULE_CHARITY_POOL = keccak256("CHARITY_POOL");

    bytes32 public constant MODULE_COMMUNITY_FUNDING = keccak256("COMMUNITY_FUNDING");

    bytes32 public constant MODULE_BACKCHAT = keccak256("BACKCHAT");

    // -------------------------------------------------------------------------
    //                         V6 NFT TIER CONSTANTS
    // -------------------------------------------------------------------------

    uint256 public constant BOOST_BRONZE = 1000;
    uint256 public constant BOOST_SILVER = 2500;
    uint256 public constant BOOST_GOLD = 4000;
    uint256 public constant BOOST_DIAMOND = 5000;

    // =========================================================================
    //                              STATE
    // =========================================================================

    // ─────────────────────────────────────────────────────────────────────────
    // Core Contract Registry
    // ─────────────────────────────────────────────────────────────────────────

    address public bkcTokenAddress;

    address public treasuryWallet;

    address public delegationManagerAddress;

    address public rewardBoosterAddress;

    address public miningManagerAddress;

    address public decentralizedNotaryAddress;

    address public fortunePoolAddress;

    address public nftLiquidityPoolFactoryAddress;

    address public rentalManagerAddress;

    // ─────────────────────────────────────────────────────────────────────────
    // Extensible Module Registry
    // ─────────────────────────────────────────────────────────────────────────

    mapping(bytes32 => address) public moduleRegistry;

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration Mappings
    // ─────────────────────────────────────────────────────────────────────────

    mapping(bytes32 => uint256) public serviceFees;

    mapping(bytes32 => uint256) public miningDistributionBips;

    mapping(bytes32 => uint256) public feeDistributionBips;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[41] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event AddressUpdated(
        string indexed key,
        address indexed previousAddress,
        address indexed newAddress
    );

    event ModuleUpdated(
        bytes32 indexed moduleKey,
        address indexed previousAddress,
        address indexed newAddress
    );

    event ServiceFeeUpdated(
        bytes32 indexed serviceKey,
        uint256 previousFee,
        uint256 newFee
    );

    event MiningDistributionUpdated(
        bytes32 indexed poolKey,
        uint256 previousBips,
        uint256 newBips
    );

    event FeeDistributionUpdated(
        bytes32 indexed poolKey,
        uint256 previousBips,
        uint256 newBips
    );

    event AddressesBatchUpdated(address indexed updatedBy);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error InvalidBips();
    error LengthMismatch();
    error UnrecognizedKey();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    // =========================================================================
    //                      CORE ADDRESS CONFIGURATION
    // =========================================================================

    function setAddresses(
        address _bkcToken,
        address _treasury,
        address _delegationManager,
        address _rewardBooster,
        address _miningManager,
        address _notary,
        address _fortunePool,
        address _nftPoolFactory
    ) external onlyOwner {
        if (
            _bkcToken == address(0) ||
            _treasury == address(0) ||
            _delegationManager == address(0) ||
            _rewardBooster == address(0) ||
            _miningManager == address(0) ||
            _notary == address(0) ||
            _fortunePool == address(0) ||
            _nftPoolFactory == address(0)
        ) {
            revert ZeroAddress();
        }

        bkcTokenAddress = _bkcToken;
        treasuryWallet = _treasury;
        delegationManagerAddress = _delegationManager;
        rewardBoosterAddress = _rewardBooster;
        miningManagerAddress = _miningManager;
        decentralizedNotaryAddress = _notary;
        fortunePoolAddress = _fortunePool;
        nftLiquidityPoolFactoryAddress = _nftPoolFactory;

        emit AddressesBatchUpdated(msg.sender);
    }

    function setAddress(string calldata _key, address _newAddress) external onlyOwner {
        bytes32 keyHash = keccak256(bytes(_key));
        address previousAddress;

        if (keyHash == keccak256("bkcToken")) {
            if (_newAddress == address(0)) revert ZeroAddress();
            previousAddress = bkcTokenAddress;
            bkcTokenAddress = _newAddress;
        } else if (keyHash == keccak256("treasury")) {
            if (_newAddress == address(0)) revert ZeroAddress();
            previousAddress = treasuryWallet;
            treasuryWallet = _newAddress;
        } else if (keyHash == keccak256("delegationManager")) {
            previousAddress = delegationManagerAddress;
            delegationManagerAddress = _newAddress;
        } else if (keyHash == keccak256("rewardBooster")) {
            previousAddress = rewardBoosterAddress;
            rewardBoosterAddress = _newAddress;
        } else if (keyHash == keccak256("miningManager")) {
            previousAddress = miningManagerAddress;
            miningManagerAddress = _newAddress;
        } else if (keyHash == keccak256("notary")) {
            previousAddress = decentralizedNotaryAddress;
            decentralizedNotaryAddress = _newAddress;
        } else if (keyHash == keccak256("fortunePool")) {
            previousAddress = fortunePoolAddress;
            fortunePoolAddress = _newAddress;
        } else if (keyHash == keccak256("nftPoolFactory")) {
            previousAddress = nftLiquidityPoolFactoryAddress;
            nftLiquidityPoolFactoryAddress = _newAddress;
        } else if (keyHash == keccak256("rentalManager")) {
            previousAddress = rentalManagerAddress;
            rentalManagerAddress = _newAddress;
        } else {
            revert UnrecognizedKey();
        }

        emit AddressUpdated(_key, previousAddress, _newAddress);
    }

    // =========================================================================
    //                      MODULE REGISTRY (EXTENSIBLE)
    // =========================================================================

    function setModule(bytes32 _moduleKey, address _moduleAddress) external onlyOwner {
        address previousAddress = moduleRegistry[_moduleKey];
        moduleRegistry[_moduleKey] = _moduleAddress;

        emit ModuleUpdated(_moduleKey, previousAddress, _moduleAddress);
    }

    function setModulesBatch(
        bytes32[] calldata _moduleKeys,
        address[] calldata _moduleAddresses
    ) external onlyOwner {
        uint256 length = _moduleKeys.length;
        if (length != _moduleAddresses.length) revert LengthMismatch();

        for (uint256 i; i < length;) {
            address previousAddress = moduleRegistry[_moduleKeys[i]];
            moduleRegistry[_moduleKeys[i]] = _moduleAddresses[i];

            emit ModuleUpdated(_moduleKeys[i], previousAddress, _moduleAddresses[i]);

            unchecked { ++i; }
        }
    }

    function getModule(bytes32 _moduleKey) external view returns (address) {
        return moduleRegistry[_moduleKey];
    }

    function isModuleRegistered(bytes32 _moduleKey) external view returns (bool) {
        return moduleRegistry[_moduleKey] != address(0);
    }

    // =========================================================================
    //                       FEE CONFIGURATION
    // =========================================================================

    function setServiceFee(bytes32 _serviceKey, uint256 _fee) external onlyOwner {
        uint256 previousFee = serviceFees[_serviceKey];
        serviceFees[_serviceKey] = _fee;

        emit ServiceFeeUpdated(_serviceKey, previousFee, _fee);
    }

    function setServiceFeesBatch(
        bytes32[] calldata _serviceKeys,
        uint256[] calldata _fees
    ) external onlyOwner {
        uint256 length = _serviceKeys.length;
        if (length != _fees.length) revert LengthMismatch();

        for (uint256 i; i < length;) {
            uint256 previousFee = serviceFees[_serviceKeys[i]];
            serviceFees[_serviceKeys[i]] = _fees[i];
            emit ServiceFeeUpdated(_serviceKeys[i], previousFee, _fees[i]);

            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                   DISTRIBUTION CONFIGURATION
    // =========================================================================

    function setMiningDistributionBips(
        bytes32 _poolKey,
        uint256 _bips
    ) external onlyOwner {
        if (_bips > 10000) revert InvalidBips();

        uint256 previousBips = miningDistributionBips[_poolKey];
        miningDistributionBips[_poolKey] = _bips;

        emit MiningDistributionUpdated(_poolKey, previousBips, _bips);
    }

    function setFeeDistributionBips(
        bytes32 _poolKey,
        uint256 _bips
    ) external onlyOwner {
        if (_bips > 10000) revert InvalidBips();

        uint256 previousBips = feeDistributionBips[_poolKey];
        feeDistributionBips[_poolKey] = _bips;

        emit FeeDistributionUpdated(_poolKey, previousBips, _bips);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function getFee(bytes32 _serviceKey) external view override returns (uint256) {
        return serviceFees[_serviceKey];
    }

    function getMiningDistributionBips(bytes32 _poolKey) external view override returns (uint256) {
        return miningDistributionBips[_poolKey];
    }

    function getFeeDistributionBips(bytes32 _poolKey) external view override returns (uint256) {
        return feeDistributionBips[_poolKey];
    }

    // =========================================================================
    //                       V6 TIER HELPER FUNCTIONS
    // =========================================================================

    /// @notice Get all valid V6 tier boost values
    function getValidTiers() external pure returns (uint256[4] memory) {
        return [BOOST_BRONZE, BOOST_SILVER, BOOST_GOLD, BOOST_DIAMOND];
    }

    /// @notice Get the tier name for a boost value
    function getTierName(uint256 _boostBips) external pure returns (string memory) {
        if (_boostBips == BOOST_DIAMOND) return "Diamond";
        if (_boostBips == BOOST_GOLD) return "Gold";
        if (_boostBips == BOOST_SILVER) return "Silver";
        if (_boostBips == BOOST_BRONZE) return "Bronze";
        return "None";
    }

    /// @notice Check if a boost value is a valid V6 tier
    function isValidTier(uint256 _boostBips) external pure returns (bool) {
        return _boostBips == BOOST_BRONZE ||
               _boostBips == BOOST_SILVER ||
               _boostBips == BOOST_GOLD ||
               _boostBips == BOOST_DIAMOND;
    }

    // =========================================================================
    //                       CORE ADDRESS GETTERS
    // =========================================================================

    function getBKCTokenAddress() external view override returns (address) {
        return bkcTokenAddress;
    }

    function getTreasuryAddress() external view override returns (address) {
        return treasuryWallet;
    }

    function getDelegationManagerAddress() external view override returns (address) {
        return delegationManagerAddress;
    }

    function getBoosterAddress() external view override returns (address) {
        return rewardBoosterAddress;
    }

    function getMiningManagerAddress() external view override returns (address) {
        return miningManagerAddress;
    }

    function getDecentralizedNotaryAddress() external view override returns (address) {
        return decentralizedNotaryAddress;
    }

    function getFortunePoolAddress() external view override returns (address) {
        return fortunePoolAddress;
    }

    function getNFTLiquidityPoolFactoryAddress() external view override returns (address) {
        return nftLiquidityPoolFactoryAddress;
    }

    function getRentalManagerAddress() external view override returns (address) {
        return rentalManagerAddress;
    }

    // =========================================================================
    //                       CONVENIENCE FUNCTIONS
    // =========================================================================

    function getAllAddresses() external view returns (
        address bkcToken,
        address treasury,
        address delegation,
        address booster,
        address mining,
        address notary,
        address fortune,
        address nftFactory,
        address rental
    ) {
        return (
            bkcTokenAddress,
            treasuryWallet,
            delegationManagerAddress,
            rewardBoosterAddress,
            miningManagerAddress,
            decentralizedNotaryAddress,
            fortunePoolAddress,
            nftLiquidityPoolFactoryAddress,
            rentalManagerAddress
        );
    }
}
