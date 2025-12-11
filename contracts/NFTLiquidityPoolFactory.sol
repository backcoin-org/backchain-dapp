// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./NFTLiquidityPool.sol";
import "./IInterfaces.sol";

/**
 * @title NFTLiquidityPoolFactory
 * @author Backchain Protocol
 * @notice Factory for deploying and managing NFT liquidity pools
 * @dev Uses EIP-1167 minimal proxy pattern (Clones) for gas-efficient deployment.
 *
 *      Architecture:
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                    FACTORY CONTRACT                             │
 *      │  - Deploys one pool per NFT boost tier                         │
 *      │  - Maintains registry of valid pools                           │
 *      │  - MiningManager uses isPool() for authorization               │
 *      └─────────────────────────────────────────────────────────────────┘
 *                                    │
 *          ┌─────────────────────────┼─────────────────────────┐
 *          ▼                         ▼                         ▼
 *    ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
 *    │ Crystal Pool │       │  Gold Pool   │       │ Diamond Pool │
 *    │ (1000 bips)  │       │ (5000 bips)  │       │ (7000 bips)  │
 *    └──────────────┘       └──────────────┘       └──────────────┘
 *
 *      Clone Pattern Benefits:
 *      - ~90% gas savings vs full deployment
 *      - All clones share same implementation
 *      - Each clone has its own storage
 *
 *      Pool Tiers (typical configuration):
 *      ┌────────────┬────────────┬─────────────────┐
 *      │ Tier       │ Boost Bips │ Fee Discount    │
 *      ├────────────┼────────────┼─────────────────┤
 *      │ Crystal    │ 1000       │ 10%             │
 *      │ Iron       │ 2000       │ 20%             │
 *      │ Bronze     │ 3000       │ 30%             │
 *      │ Silver     │ 4000       │ 40%             │
 *      │ Gold       │ 5000       │ 50%             │
 *      │ Platinum   │ 6000       │ 60%             │
 *      │ Diamond    │ 7000       │ 70%             │
 *      └────────────┴────────────┴─────────────────┘
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract NFTLiquidityPoolFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    INFTLiquidityPoolFactory
{
    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Address of the pool implementation contract (template for clones)
    address public poolImplementation;

    /// @notice Address of the ecosystem manager
    address public ecosystemManagerAddress;

    /// @notice Pool address => is valid pool (used by MiningManager for auth)
    mapping(address => bool) public isPool;

    /// @notice Boost bips => Pool address
    mapping(uint256 => address) public getPoolAddress;

    /// @notice Array of all deployed boost tiers
    uint256[] public deployedBoostBips;

    /// @notice Total pools deployed
    uint256 public poolCount;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when pool implementation is updated
    event PoolImplementationUpdated(
        address indexed previousImplementation,
        address indexed newImplementation
    );

    /// @notice Emitted when ecosystem manager is updated
    event EcosystemManagerUpdated(
        address indexed previousManager,
        address indexed newManager
    );

    /// @notice Emitted when a new pool is deployed
    event PoolDeployed(
        uint256 indexed boostBips,
        address indexed poolAddress,
        uint256 poolIndex
    );

    /// @notice Emitted when a pool is disabled
    event PoolDisabled(address indexed poolAddress);

    /// @notice Emitted when a pool is re-enabled
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

    /**
     * @notice Initializes the factory contract
     * @param _owner Factory owner address
     * @param _ecosystemManager Ecosystem manager address
     * @param _poolImplementation Pool implementation address (template)
     */
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

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Updates the ecosystem manager address
     * @param _ecosystemManager New ecosystem manager address
     */
    function setEcosystemManager(address _ecosystemManager) external onlyOwner {
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        address previousManager = ecosystemManagerAddress;
        ecosystemManagerAddress = _ecosystemManager;

        emit EcosystemManagerUpdated(previousManager, _ecosystemManager);
    }

    /**
     * @notice Updates the pool implementation address
     * @dev New pools will use this implementation. Existing pools unchanged.
     * @param _poolImplementation New implementation address
     */
    function setPoolImplementation(address _poolImplementation) external onlyOwner {
        if (_poolImplementation == address(0)) revert ZeroAddress();

        address previousImplementation = poolImplementation;
        poolImplementation = _poolImplementation;

        emit PoolImplementationUpdated(previousImplementation, _poolImplementation);
    }

    /**
     * @notice Disables a pool (removes from isPool registry)
     * @dev Pool contract still exists but MiningManager won't authorize it
     * @param _poolAddress Pool address to disable
     */
    function disablePool(address _poolAddress) external onlyOwner {
        if (!isPool[_poolAddress]) revert PoolNotFound();

        isPool[_poolAddress] = false;

        emit PoolDisabled(_poolAddress);
    }

    /**
     * @notice Re-enables a previously disabled pool
     * @param _poolAddress Pool address to enable
     */
    function enablePool(address _poolAddress) external onlyOwner {
        // Verify it was a pool we deployed (check if it's in any mapping)
        bool wasDeployed = false;
        for (uint256 i = 0; i < deployedBoostBips.length;) {
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

    /**
     * @notice Deploys a new liquidity pool for an NFT boost tier
     * @dev Uses EIP-1167 clone pattern for gas efficiency
     * @param _boostBips NFT boost tier (e.g., 1000 for Crystal, 7000 for Diamond)
     * @return poolAddress Address of the deployed pool
     */
    function deployPool(uint256 _boostBips) external onlyOwner returns (address poolAddress) {
        if (_boostBips == 0 || _boostBips > 10000) revert InvalidBoostBips();
        if (getPoolAddress[_boostBips] != address(0)) revert PoolAlreadyExists();
        if (poolImplementation == address(0)) revert ImplementationNotSet();

        // Deploy minimal proxy clone
        poolAddress = Clones.clone(poolImplementation);

        // Register pool
        isPool[poolAddress] = true;
        getPoolAddress[_boostBips] = poolAddress;
        deployedBoostBips.push(_boostBips);
        poolCount++;

        // Initialize the clone
        NFTLiquidityPool(poolAddress).initialize(
            owner(),
            ecosystemManagerAddress,
            _boostBips
        );

        emit PoolDeployed(_boostBips, poolAddress, poolCount);
    }

    /**
     * @notice Deploys multiple pools in a single transaction
     * @param _boostBipsArray Array of boost tiers to deploy
     * @return poolAddresses Array of deployed pool addresses
     */
    function deployPoolsBatch(
        uint256[] calldata _boostBipsArray
    ) external onlyOwner returns (address[] memory poolAddresses) {
        uint256 length = _boostBipsArray.length;
        poolAddresses = new address[](length);

        if (poolImplementation == address(0)) revert ImplementationNotSet();

        for (uint256 i = 0; i < length;) {
            uint256 boostBips = _boostBipsArray[i];

            if (boostBips == 0 || boostBips > 10000) revert InvalidBoostBips();
            if (getPoolAddress[boostBips] != address(0)) revert PoolAlreadyExists();

            // Deploy clone
            address poolAddress = Clones.clone(poolImplementation);

            // Register
            isPool[poolAddress] = true;
            getPoolAddress[boostBips] = poolAddress;
            deployedBoostBips.push(boostBips);
            poolCount++;

            // Initialize
            NFTLiquidityPool(poolAddress).initialize(
                owner(),
                ecosystemManagerAddress,
                boostBips
            );

            poolAddresses[i] = poolAddress;

            emit PoolDeployed(boostBips, poolAddress, poolCount);

            unchecked { ++i; }
        }
    }

    /**
     * @notice Deploys all standard tier pools (Crystal through Diamond)
     * @dev Convenience function for initial setup
     * @return addresses Array of deployed pool addresses [Crystal, Iron, Bronze, Silver, Gold, Platinum, Diamond]
     */
    function deployAllStandardPools() external onlyOwner returns (address[7] memory addresses) {
        uint256[7] memory standardTiers = [
            uint256(1000),  // Crystal
            uint256(2000),  // Iron
            uint256(3000),  // Bronze
            uint256(4000),  // Silver
            uint256(5000),  // Gold
            uint256(6000),  // Platinum
            uint256(7000)   // Diamond
        ];

        if (poolImplementation == address(0)) revert ImplementationNotSet();

        for (uint256 i = 0; i < 7;) {
            uint256 boostBips = standardTiers[i];

            // Skip if already exists
            if (getPoolAddress[boostBips] != address(0)) {
                addresses[i] = getPoolAddress[boostBips];
                unchecked { ++i; }
                continue;
            }

            // Deploy clone
            address poolAddress = Clones.clone(poolImplementation);

            // Register
            isPool[poolAddress] = true;
            getPoolAddress[boostBips] = poolAddress;
            deployedBoostBips.push(boostBips);
            poolCount++;

            // Initialize
            NFTLiquidityPool(poolAddress).initialize(
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

    /**
     * @notice Returns all deployed boost tiers
     * @return Array of boost bips values
     */
    function getDeployedBoostBips() external view override returns (uint256[] memory) {
        return deployedBoostBips;
    }

    /**
     * @notice Returns number of deployed pools
     * @return Pool count
     */
    function getPoolCount() external view override returns (uint256) {
        return poolCount;
    }

    /**
     * @notice Returns all pool addresses
     * @return pools Array of pool addresses
     */
    function getAllPools() external view returns (address[] memory pools) {
        uint256 length = deployedBoostBips.length;
        pools = new address[](length);

        for (uint256 i = 0; i < length;) {
            pools[i] = getPoolAddress[deployedBoostBips[i]];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns pool information for a specific tier
     * @param _boostBips Boost tier to query
     * @return poolAddress Pool contract address
     * @return exists Whether pool exists
     * @return active Whether pool is active (in isPool registry)
     */
    function getPoolInfo(uint256 _boostBips) external view returns (
        address poolAddress,
        bool exists,
        bool active
    ) {
        poolAddress = getPoolAddress[_boostBips];
        exists = poolAddress != address(0);
        active = exists && isPool[poolAddress];
    }

    /**
     * @notice Returns detailed information for all pools
     * @return boostTiers Array of boost bips
     * @return poolAddresses Array of pool addresses
     * @return activeStatus Array of active status
     */
    function getAllPoolsInfo() external view returns (
        uint256[] memory boostTiers,
        address[] memory poolAddresses,
        bool[] memory activeStatus
    ) {
        uint256 length = deployedBoostBips.length;

        boostTiers = new uint256[](length);
        poolAddresses = new address[](length);
        activeStatus = new bool[](length);

        for (uint256 i = 0; i < length;) {
            boostTiers[i] = deployedBoostBips[i];
            poolAddresses[i] = getPoolAddress[deployedBoostBips[i]];
            activeStatus[i] = isPool[poolAddresses[i]];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Checks if a tier pool has been deployed
     * @param _boostBips Boost tier to check
     * @return True if pool exists
     */
    function hasPool(uint256 _boostBips) external view returns (bool) {
        return getPoolAddress[_boostBips] != address(0);
    }

    /**
     * @notice Predicts the address of a pool before deployment
     * @dev Useful for pre-approvals or UI
     * @param _salt Unique salt for deterministic address
     * @return Predicted pool address
     */
    function predictPoolAddress(bytes32 _salt) external view returns (address) {
        return Clones.predictDeterministicAddress(poolImplementation, _salt);
    }
}
