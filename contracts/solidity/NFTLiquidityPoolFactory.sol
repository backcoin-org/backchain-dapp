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
 *  Contract    : NFTLiquidityPoolFactory
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
 *  Factory for deploying NFT liquidity pools using EIP-1167 minimal proxy
 *  pattern (Clones) for gas-efficient deployment.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │                         FACTORY ARCHITECTURE                            │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │                                                                         │
 *  │                      ┌──────────────────────┐                           │
 *  │                      │  POOL FACTORY        │                           │
 *  │                      │  (This Contract)     │                           │
 *  │                      └──────────┬───────────┘                           │
 *  │                                 │                                       │
 *  │         ┌───────────────────────┼───────────────────────┐               │
 *  │         │           │           │           │           │               │
 *  │         ▼           ▼           ▼           ▼           ▼               │
 *  │    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
 *  │    │ Bronze  │ │ Silver  │ │  Gold   │ │Diamond  │                      │
 *  │    │  1000   │ │  2500   │ │  4000   │ │  5000   │                      │
 *  │    │ 40%burn │ │ 25%burn │ │ 10%burn │ │  0%burn │                      │
 *  │    └─────────┘ └─────────┘ └─────────┘ └─────────┘                      │
 *  │                                                                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
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
 *  Clone Pattern Benefits:
 *  • ~90% gas savings vs full deployment
 *  • All clones share same implementation
 *  • Each clone has its own storage
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
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./NFTLiquidityPool.sol";
import "./IInterfaces.sol";

contract NFTLiquidityPoolFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    INFTLiquidityPoolFactory
{
    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Valid boost values for each tier
    uint256 public constant BOOST_BRONZE = 1000;   // 40% burn
    uint256 public constant BOOST_SILVER = 2500;   // 25% burn
    uint256 public constant BOOST_GOLD = 4000;     // 10% burn
    uint256 public constant BOOST_DIAMOND = 5000;  // 0% burn

    /// @notice Total number of tiers
    uint256 public constant TOTAL_TIERS = 4;

    // =========================================================================
    //                              STATE
    // =========================================================================

    address public poolImplementation;

    address public ecosystemManagerAddress;

    mapping(address => bool) public isPool;

    mapping(uint256 => address) public getPoolAddress;

    uint256[] public deployedBoostBips;

    uint256 public poolCount;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[43] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event PoolImplementationUpdated(
        address indexed previousImplementation,
        address indexed newImplementation
    );

    event EcosystemManagerUpdated(
        address indexed previousManager,
        address indexed newManager
    );

    event PoolDeployed(
        uint256 indexed boostBips,
        address indexed poolAddress,
        uint256 poolIndex
    );

    event PoolDisabled(address indexed poolAddress);

    event PoolEnabled(address indexed poolAddress);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error InvalidBoostBips();
    error PoolAlreadyExists();
    error PoolNotFound();
    error ImplementationNotSet();
    error ArrayLengthMismatch();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _ecosystemManager,
        address _poolImplementation
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();
        if (_poolImplementation == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);

        ecosystemManagerAddress = _ecosystemManager;
        poolImplementation = _poolImplementation;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    function setEcosystemManager(address _ecosystemManager) external onlyOwner {
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        address previousManager = ecosystemManagerAddress;
        ecosystemManagerAddress = _ecosystemManager;

        emit EcosystemManagerUpdated(previousManager, _ecosystemManager);
    }

    function setPoolImplementation(address _poolImplementation) external onlyOwner {
        if (_poolImplementation == address(0)) revert ZeroAddress();

        address previousImplementation = poolImplementation;
        poolImplementation = _poolImplementation;

        emit PoolImplementationUpdated(previousImplementation, _poolImplementation);
    }

    function disablePool(address _poolAddress) external onlyOwner {
        if (!isPool[_poolAddress]) revert PoolNotFound();

        isPool[_poolAddress] = false;

        emit PoolDisabled(_poolAddress);
    }

    function enablePool(address _poolAddress) external onlyOwner {
        bool wasDeployed = false;
        uint256 length = deployedBoostBips.length;

        for (uint256 i; i < length;) {
            if (getPoolAddress[deployedBoostBips[i]] == _poolAddress) {
                wasDeployed = true;
                break;
            }
            unchecked { ++i; }
        }

        if (!wasDeployed) revert PoolNotFound();

        isPool[_poolAddress] = true;

        emit PoolEnabled(_poolAddress);
    }

    // =========================================================================
    //                        DEPLOYMENT FUNCTIONS
    // =========================================================================

    /// @notice Deploy a single pool (must be a valid tier)
    function deployPool(uint256 _boostBips) external onlyOwner returns (address poolAddress) {
        if (!_isValidTier(_boostBips)) revert InvalidBoostBips();
        if (getPoolAddress[_boostBips] != address(0)) revert PoolAlreadyExists();
        if (poolImplementation == address(0)) revert ImplementationNotSet();

        poolAddress = Clones.clone(poolImplementation);

        isPool[poolAddress] = true;
        getPoolAddress[_boostBips] = poolAddress;
        deployedBoostBips.push(_boostBips);
        poolCount++;

        NFTLiquidityPool(payable(poolAddress)).initialize(
            owner(),
            ecosystemManagerAddress,
            _boostBips
        );

        emit PoolDeployed(_boostBips, poolAddress, poolCount);
    }

    /// @notice Deploy multiple pools at once (all must be valid tiers)
    function deployPoolsBatch(
        uint256[] calldata _boostBipsArray
    ) external onlyOwner returns (address[] memory poolAddresses) {
        uint256 length = _boostBipsArray.length;
        poolAddresses = new address[](length);

        if (poolImplementation == address(0)) revert ImplementationNotSet();

        for (uint256 i; i < length;) {
            uint256 boostBips = _boostBipsArray[i];

            if (!_isValidTier(boostBips)) revert InvalidBoostBips();
            if (getPoolAddress[boostBips] != address(0)) revert PoolAlreadyExists();

            address poolAddress = Clones.clone(poolImplementation);

            isPool[poolAddress] = true;
            getPoolAddress[boostBips] = poolAddress;
            deployedBoostBips.push(boostBips);
            poolCount++;

            NFTLiquidityPool(payable(poolAddress)).initialize(
                owner(),
                ecosystemManagerAddress,
                boostBips
            );

            poolAddresses[i] = poolAddress;

            emit PoolDeployed(boostBips, poolAddress, poolCount);

            unchecked { ++i; }
        }
    }

    /// @notice Deploy all 4 standard tier pools at once
    /// @return addresses Array of pool addresses [Bronze, Silver, Gold, Diamond]
    function deployAllStandardPools() external onlyOwner returns (address[4] memory addresses) {
        uint256[4] memory standardTiers = [
            BOOST_BRONZE,   // 1000
            BOOST_SILVER,   // 2500
            BOOST_GOLD,     // 4000
            BOOST_DIAMOND   // 5000
        ];

        if (poolImplementation == address(0)) revert ImplementationNotSet();

        for (uint256 i; i < TOTAL_TIERS;) {
            uint256 boostBips = standardTiers[i];

            // Skip if already deployed
            if (getPoolAddress[boostBips] != address(0)) {
                addresses[i] = getPoolAddress[boostBips];
                unchecked { ++i; }
                continue;
            }

            address poolAddress = Clones.clone(poolImplementation);

            isPool[poolAddress] = true;
            getPoolAddress[boostBips] = poolAddress;
            deployedBoostBips.push(boostBips);
            poolCount++;

            NFTLiquidityPool(payable(poolAddress)).initialize(
                owner(),
                ecosystemManagerAddress,
                boostBips
            );

            addresses[i] = poolAddress;

            emit PoolDeployed(boostBips, poolAddress, poolCount);

            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function getDeployedBoostBips() external view override returns (uint256[] memory) {
        return deployedBoostBips;
    }

    function getPoolCount() external view override returns (uint256) {
        return poolCount;
    }

    function getAllPools() external view returns (address[] memory pools) {
        uint256 length = deployedBoostBips.length;
        pools = new address[](length);

        for (uint256 i; i < length;) {
            pools[i] = getPoolAddress[deployedBoostBips[i]];
            unchecked { ++i; }
        }
    }

    function getPoolInfo(uint256 _boostBips) external view returns (
        address poolAddress,
        bool exists,
        bool active
    ) {
        poolAddress = getPoolAddress[_boostBips];
        exists = poolAddress != address(0);
        active = exists && isPool[poolAddress];
    }

    function getAllPoolsInfo() external view returns (
        uint256[] memory boostTiers,
        address[] memory poolAddresses,
        bool[] memory activeStatus
    ) {
        uint256 length = deployedBoostBips.length;

        boostTiers = new uint256[](length);
        poolAddresses = new address[](length);
        activeStatus = new bool[](length);

        for (uint256 i; i < length;) {
            boostTiers[i] = deployedBoostBips[i];
            poolAddresses[i] = getPoolAddress[deployedBoostBips[i]];
            activeStatus[i] = isPool[poolAddresses[i]];
            unchecked { ++i; }
        }
    }

    function hasPool(uint256 _boostBips) external view returns (bool) {
        return getPoolAddress[_boostBips] != address(0);
    }

    function predictPoolAddress(bytes32 _salt) external view returns (address) {
        return Clones.predictDeterministicAddress(poolImplementation, _salt);
    }

    /// @notice Get all valid tier boost values
    function getValidTiers() external pure returns (uint256[4] memory) {
        return [BOOST_BRONZE, BOOST_SILVER, BOOST_GOLD, BOOST_DIAMOND];
    }

    /// @notice Get the tier name for a given boost value
    function getTierName(uint256 _boostBips) external pure returns (string memory) {
        if (_boostBips == BOOST_DIAMOND) return "Diamond";
        if (_boostBips == BOOST_GOLD) return "Gold";
        if (_boostBips == BOOST_SILVER) return "Silver";
        if (_boostBips == BOOST_BRONZE) return "Bronze";
        return "Invalid";
    }

    /// @notice Check if a boost value is a valid tier
    function isValidTier(uint256 _boostBips) external pure returns (bool) {
        return _isValidTier(_boostBips);
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /// @notice Validates that boost value is one of the valid tiers
    function _isValidTier(uint256 _boostBips) internal pure returns (bool) {
        return _boostBips == BOOST_BRONZE ||
               _boostBips == BOOST_SILVER ||
               _boostBips == BOOST_GOLD ||
               _boostBips == BOOST_DIAMOND;
    }
}
