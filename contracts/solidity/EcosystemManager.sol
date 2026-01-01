// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IInterfaces.sol";

/**
 * @title EcosystemManager
 * @author Backchain Protocol
 * @notice Central configuration hub for the Backcoin Real World Asset (RWA) ecosystem
 * @dev Manages contract registry, fees, discounts, and distribution rules for all modules.
 *
 *      ╔═══════════════════════════════════════════════════════════════════╗
 *      ║                    BACKCOIN ECOSYSTEM                             ║
 *      ║            Real World Asset (RWA) Infrastructure                  ║
 *      ╠═══════════════════════════════════════════════════════════════════╣
 *      ║  Backcoin is a comprehensive RWA ecosystem enabling:              ║
 *      ║  • Document notarization & certification on-chain                 ║
 *      ║  • NFT-backed utility with fee discounts                          ║
 *      ║  • Decentralized staking & delegation                             ║
 *      ║  • Charitable crowdfunding (vaquinha beneficente)                 ║
 *      ║  • Community project tokenization                                 ║
 *      ║  • NFT rental marketplace                                         ║
 *      ║  • Prediction games with on-chain resolution                      ║
 *      ╚═══════════════════════════════════════════════════════════════════╝
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                    ARCHITECTURE OVERVIEW                        │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │                                                                 │
 *      │                    ┌──────────────────┐                         │
 *      │                    │ EcosystemManager │ ◄── Central Hub         │
 *      │                    └────────┬─────────┘                         │
 *      │                             │                                   │
 *      │    ┌────────────────────────┼────────────────────────┐          │
 *      │    │            │           │           │            │          │
 *      │    ▼            ▼           ▼           ▼            ▼          │
 *      │ ┌──────┐  ┌──────────┐  ┌───────┐  ┌────────┐  ┌─────────┐      │
 *      │ │ BKC  │  │Delegation│  │Mining │  │ Notary │  │ Fortune │      │
 *      │ │Token │  │ Manager  │  │Manager│  │        │  │  Pool   │      │
 *      │ └──────┘  └──────────┘  └───────┘  └────────┘  └─────────┘      │
 *      │                                                                 │
 *      │    ┌────────────────────────┼────────────────────────┐          │
 *      │    │            │           │           │            │          │
 *      │    ▼            ▼           ▼           ▼            ▼          │
 *      │ ┌──────┐  ┌──────────┐  ┌───────┐  ┌────────┐  ┌─────────┐      │
 *      │ │Booste│  │NFT Pool  │  │Rental │  │Charity │  │Community│      │
 *      │ │ NFT  │  │ Factory  │  │Manager│  │ Pool   │  │ Funding │      │
 *      │ └──────┘  └──────────┘  └───────┘  └────────┘  └─────────┘      │
 *      │                                                                 │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │               EXTENSIBILITY: ADDING NEW MODULES                 │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │                                                                 │
 *      │  The EcosystemManager supports TWO registration methods:        │
 *      │                                                                 │
 *      │  ┌─────────────────────────────────────────────────────────┐    │
 *      │  │ METHOD 1: Core Addresses (requires upgrade)             │    │
 *      │  │ ─────────────────────────────────────────────────────── │    │
 *      │  │ • Used for: Essential system contracts                  │    │
 *      │  │ • Storage: Dedicated state variables                    │    │
 *      │  │ • Getters: Named functions (getBKCTokenAddress, etc.)   │    │
 *      │  │ • To add: Upgrade contract, add variable + getter       │    │
 *      │  │                                                         │    │
 *      │  │ Current core contracts:                                 │    │
 *      │  │ - BKCToken, Treasury, DelegationManager                 │    │
 *      │  │ - RewardBoosterNFT, MiningManager, Notary               │    │
 *      │  │ - FortunePool, NFTPoolFactory, RentalManager            │    │
 *      │  └─────────────────────────────────────────────────────────┘    │
 *      │                                                                 │
 *      │  ┌─────────────────────────────────────────────────────────┐    │
 *      │  │ METHOD 2: Module Registry (NO upgrade needed)           │    │
 *      │  │ ─────────────────────────────────────────────────────── │    │
 *      │  │ • Used for: New/optional modules                        │    │
 *      │  │ • Storage: mapping(bytes32 => address) moduleRegistry   │    │
 *      │  │ • Getters: getModule(bytes32 key)                       │    │
 *      │  │ • To add: Call setModule(key, address) - NO UPGRADE!    │    │
 *      │  │                                                         │    │
 *      │  │ Example - Adding CharityPool:                           │    │
 *      │  │ ───────────────────────────────                         │    │
 *      │  │ bytes32 key = keccak256("CHARITY_POOL");                │    │
 *      │  │ ecosystemManager.setModule(key, charityPoolAddress);    │    │
 *      │  │                                                         │    │
 *      │  │ // From any contract:                                   │    │
 *      │  │ address pool = ecosystemManager.getModule(key);         │    │
 *      │  └─────────────────────────────────────────────────────────┘    │
 *      │                                                                 │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                    FEE CONFIGURATION                            │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │                                                                 │
 *      │  Fee Keys (bytes32):                                            │
 *      │  ┌────────────────────────────────────┬──────────────────────┐  │
 *      │  │ Key                                │ Description          │  │
 *      │  ├────────────────────────────────────┼──────────────────────┤  │
 *      │  │ DELEGATION_FEE_BIPS                │ Staking entry fee    │  │
 *      │  │ UNSTAKE_FEE_BIPS                   │ Normal unstake fee   │  │
 *      │  │ FORCE_UNSTAKE_PENALTY_BIPS         │ Early unstake penalty│  │
 *      │  │ CLAIM_REWARD_FEE_BIPS              │ Reward claim fee     │  │
 *      │  │ NOTARY_SERVICE                     │ Notarization fee     │  │
 *      │  │ NFT_POOL_BUY_TAX_BIPS              │ NFT purchase tax     │  │
 *      │  │ NFT_POOL_SELL_TAX_BIPS             │ NFT sale tax         │  │
 *      │  │ FORTUNE_SERVICE_FEE                │ Fortune Pool fee     │  │
 *      │  │ RENTAL_FEE_BIPS                    │ NFT rental fee       │  │
 *      │  └────────────────────────────────────┴──────────────────────┘  │
 *      │                                                                 │
 *      │  Usage: serviceFees[keccak256("DELEGATION_FEE_BIPS")]           │
 *      │                                                                 │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                 NFT BOOSTER DISCOUNT TIERS                      │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │                                                                 │
 *      │  ┌──────────┬────────────┬──────────────┐                       │
 *      │  │ Tier     │ Boost Bips │ Discount     │                       │
 *      │  ├──────────┼────────────┼──────────────┤                       │
 *      │  │ Crystal  │ 1000       │ 10%          │                       │
 *      │  │ Iron     │ 2000       │ 20%          │                       │
 *      │  │ Bronze   │ 3000       │ 30%          │                       │
 *      │  │ Silver   │ 4000       │ 40%          │                       │
 *      │  │ Gold     │ 5000       │ 50%          │                       │
 *      │  │ Platinum │ 6000       │ 60%          │                       │
 *      │  │ Diamond  │ 7000       │ 70%          │                       │
 *      │  └──────────┴────────────┴──────────────┘                       │
 *      │                                                                 │
 *      │  Formula: finalFee = baseFee - (baseFee × discountBips / 10000) │
 *      │                                                                 │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract EcosystemManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IEcosystemManager
{
    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Module key for RentalManager
    bytes32 public constant MODULE_RENTAL_MANAGER = keccak256("RENTAL_MANAGER");

    /// @notice Module key for CharityPool
    bytes32 public constant MODULE_CHARITY_POOL = keccak256("CHARITY_POOL");

    /// @notice Module key for future CommunityFundingPool
    bytes32 public constant MODULE_COMMUNITY_FUNDING = keccak256("COMMUNITY_FUNDING");

    // =========================================================================
    //                              STATE
    // =========================================================================

    // ─────────────────────────────────────────────────────────────────────────
    // Core Contract Registry (fixed addresses - upgrade required to add new)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice BKC token contract address
    address public bkcTokenAddress;

    /// @notice Treasury wallet for protocol revenue
    address public treasuryWallet;

    /// @notice DelegationManager (staking) contract address
    address public delegationManagerAddress;

    /// @notice RewardBoosterNFT contract address
    address public rewardBoosterAddress;

    /// @notice MiningManager contract address
    address public miningManagerAddress;

    /// @notice DecentralizedNotary contract address
    address public decentralizedNotaryAddress;

    /// @notice FortunePool (lottery) contract address
    address public fortunePoolAddress;

    /// @notice NFTLiquidityPoolFactory contract address
    address public nftLiquidityPoolFactoryAddress;

    /// @notice RentalManager contract address
    address public rentalManagerAddress;

    // ─────────────────────────────────────────────────────────────────────────
    // Extensible Module Registry (NO upgrade needed to add new modules)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Module key => Contract address
    /// @dev Use setModule() to register new modules without upgrading this contract
    ///
    ///      Example usage:
    ///      ```solidity
    ///      // Register a new module
    ///      ecosystemManager.setModule(keccak256("MY_MODULE"), moduleAddress);
    ///
    ///      // Query from any contract
    ///      address module = IEcosystemManager(ecosystemManager).getModule(keccak256("MY_MODULE"));
    ///      ```
    mapping(bytes32 => address) public moduleRegistry;

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration Mappings
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Service key => Fee amount (in BKC or bips depending on service)
    mapping(bytes32 => uint256) public serviceFees;

    /// @notice NFT boost bips => Discount bips (e.g., 7000 boost => 7000 discount = 70%)
    mapping(uint256 => uint256) public boosterDiscounts;

    /// @notice Pool key => Distribution percentage for new mining rewards
    mapping(bytes32 => uint256) public miningDistributionBips;

    /// @notice Pool key => Distribution percentage for fee revenue
    mapping(bytes32 => uint256) public feeDistributionBips;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when a core contract address is updated
    event AddressUpdated(
        string indexed key,
        address indexed previousAddress,
        address indexed newAddress
    );

    /// @notice Emitted when a module is registered/updated in extensible registry
    event ModuleUpdated(
        bytes32 indexed moduleKey,
        address indexed previousAddress,
        address indexed newAddress
    );

    /// @notice Emitted when a service fee is updated
    event ServiceFeeUpdated(
        bytes32 indexed serviceKey,
        uint256 previousFee,
        uint256 newFee
    );

    /// @notice Emitted when a booster discount tier is configured
    event BoosterDiscountUpdated(
        uint256 indexed boostBips,
        uint256 previousDiscount,
        uint256 newDiscount
    );

    /// @notice Emitted when mining distribution is updated
    event MiningDistributionUpdated(
        bytes32 indexed poolKey,
        uint256 previousBips,
        uint256 newBips
    );

    /// @notice Emitted when fee distribution is updated
    event FeeDistributionUpdated(
        bytes32 indexed poolKey,
        uint256 previousBips,
        uint256 newBips
    );

    /// @notice Emitted when all addresses are set in batch
    event AddressesBatchUpdated(address indexed updatedBy);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error InvalidBips();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the EcosystemManager contract
     * @param _owner Contract owner address
     */
    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                      CORE ADDRESS CONFIGURATION
    // =========================================================================

    /**
     * @notice Sets all core ecosystem contract addresses in a single transaction
     * @dev Only BKC token and treasury are mandatory (cannot be zero).
     *      Use this for initial setup or major reconfiguration.
     *
     * @param _bkcToken BKC token contract address
     * @param _treasury Treasury wallet address
     * @param _delegationManager DelegationManager contract address
     * @param _rewardBooster RewardBoosterNFT contract address
     * @param _miningManager MiningManager contract address
     * @param _notary DecentralizedNotary contract address
     * @param _fortunePool FortunePool contract address
     * @param _nftPoolFactory NFTLiquidityPoolFactory contract address
     */
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
        if (_bkcToken == address(0) || _treasury == address(0)) {
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

    /**
     * @notice Updates a single core contract address
     * @dev Valid keys: "bkcToken", "treasury", "delegationManager", "rewardBooster",
     *      "miningManager", "notary", "fortunePool", "nftPoolFactory", "rentalManager"
     *
     * @param _key Address identifier (string)
     * @param _newAddress New contract address
     */
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
        }

        emit AddressUpdated(_key, previousAddress, _newAddress);
    }

    // =========================================================================
    //                      MODULE REGISTRY (EXTENSIBLE)
    // =========================================================================

    /**
     * @notice Registers or updates a module in the extensible registry
     * @dev ┌─────────────────────────────────────────────────────────────┐
     *      │ USE THIS TO ADD NEW MODULES WITHOUT UPGRADING THE CONTRACT │
     *      └─────────────────────────────────────────────────────────────┘
     *
     *      Predefined module keys (constants):
     *      - MODULE_RENTAL_MANAGER: NFT rental marketplace
     *      - MODULE_CHARITY_POOL: Charitable crowdfunding
     *      - MODULE_COMMUNITY_FUNDING: Project tokenization (future)
     *
     *      Creating custom keys:
     *      ```solidity
     *      bytes32 myModuleKey = keccak256("MY_MODULE_NAME");
     *      ecosystemManager.setModule(myModuleKey, moduleAddress);
     *      ```
     *
     *      Querying modules from other contracts:
     *      ```solidity
     *      address module = IEcosystemManager(ecosystemManager).getModule(
     *          keccak256("MY_MODULE_NAME")
     *      );
     *      require(module != address(0), "Module not registered");
     *      ```
     *
     * @param _moduleKey Module identifier (bytes32)
     * @param _moduleAddress Module contract address (use address(0) to unregister)
     */
    function setModule(bytes32 _moduleKey, address _moduleAddress) external onlyOwner {
        address previousAddress = moduleRegistry[_moduleKey];
        moduleRegistry[_moduleKey] = _moduleAddress;

        emit ModuleUpdated(_moduleKey, previousAddress, _moduleAddress);
    }

    /**
     * @notice Batch registers multiple modules
     * @dev Efficient for registering multiple modules at once.
     *
     *      Example:
     *      ```solidity
     *      bytes32[] memory keys = new bytes32[](2);
     *      keys[0] = keccak256("CHARITY_POOL");
     *      keys[1] = keccak256("COMMUNITY_FUNDING");
     *
     *      address[] memory addrs = new address[](2);
     *      addrs[0] = charityPoolAddress;
     *      addrs[1] = communityFundingAddress;
     *
     *      ecosystemManager.setModulesBatch(keys, addrs);
     *      ```
     *
     * @param _moduleKeys Array of module identifiers
     * @param _moduleAddresses Array of module addresses
     */
    function setModulesBatch(
        bytes32[] calldata _moduleKeys,
        address[] calldata _moduleAddresses
    ) external onlyOwner {
        uint256 length = _moduleKeys.length;
        require(length == _moduleAddresses.length, "Length mismatch");

        for (uint256 i = 0; i < length;) {
            address previousAddress = moduleRegistry[_moduleKeys[i]];
            moduleRegistry[_moduleKeys[i]] = _moduleAddresses[i];

            emit ModuleUpdated(_moduleKeys[i], previousAddress, _moduleAddresses[i]);

            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns a module address from the extensible registry
     * @param _moduleKey Module identifier
     * @return Module contract address (address(0) if not registered)
     */
    function getModule(bytes32 _moduleKey) external view returns (address) {
        return moduleRegistry[_moduleKey];
    }

    /**
     * @notice Checks if a module is registered
     * @param _moduleKey Module identifier
     * @return True if module has a non-zero address
     */
    function isModuleRegistered(bytes32 _moduleKey) external view returns (bool) {
        return moduleRegistry[_moduleKey] != address(0);
    }

    // =========================================================================
    //                       FEE CONFIGURATION
    // =========================================================================

    /**
     * @notice Sets a service fee
     * @dev Fee interpretation depends on the service:
     *      - BIPS fees: Value represents basis points (10000 = 100%)
     *      - Fixed fees: Value represents BKC amount in wei
     *
     *      Example keys:
     *      - keccak256("DELEGATION_FEE_BIPS") → 500 (5%)
     *      - keccak256("NOTARY_SERVICE") → 100e18 (100 BKC fixed)
     *
     * @param _serviceKey Service identifier (keccak256 hash)
     * @param _fee Fee amount
     */
    function setServiceFee(bytes32 _serviceKey, uint256 _fee) external onlyOwner {
        uint256 previousFee = serviceFees[_serviceKey];
        serviceFees[_serviceKey] = _fee;

        emit ServiceFeeUpdated(_serviceKey, previousFee, _fee);
    }

    /**
     * @notice Batch sets multiple service fees
     * @param _serviceKeys Array of service identifiers
     * @param _fees Array of fee amounts
     */
    function setServiceFeesBatch(
        bytes32[] calldata _serviceKeys,
        uint256[] calldata _fees
    ) external onlyOwner {
        uint256 length = _serviceKeys.length;
        require(length == _fees.length, "Length mismatch");

        for (uint256 i = 0; i < length;) {
            uint256 previousFee = serviceFees[_serviceKeys[i]];
            serviceFees[_serviceKeys[i]] = _fees[i];
            emit ServiceFeeUpdated(_serviceKeys[i], previousFee, _fees[i]);

            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                    BOOSTER DISCOUNT CONFIGURATION
    // =========================================================================

    /**
     * @notice Sets discount for a specific NFT boost tier
     * @dev Formula: finalFee = baseFee - (baseFee × discountBips / 10000)
     *
     *      Example configuration:
     *      ```solidity
     *      // Crystal tier: 1000 boost → 10% discount
     *      setBoosterDiscount(1000, 1000);
     *
     *      // Diamond tier: 7000 boost → 70% discount
     *      setBoosterDiscount(7000, 7000);
     *      ```
     *
     * @param _boostBips NFT boost value in basis points
     * @param _discountBips Discount percentage in basis points (max 10000)
     */
    function setBoosterDiscount(
        uint256 _boostBips,
        uint256 _discountBips
    ) external onlyOwner {
        if (_discountBips > 10000) revert InvalidBips();

        uint256 previousDiscount = boosterDiscounts[_boostBips];
        boosterDiscounts[_boostBips] = _discountBips;

        emit BoosterDiscountUpdated(_boostBips, previousDiscount, _discountBips);
    }

    /**
     * @notice Batch sets multiple booster discounts
     * @param _boostBipsArray Array of boost values
     * @param _discountBipsArray Array of discount values
     */
    function setBoosterDiscountsBatch(
        uint256[] calldata _boostBipsArray,
        uint256[] calldata _discountBipsArray
    ) external onlyOwner {
        uint256 length = _boostBipsArray.length;
        require(length == _discountBipsArray.length, "Length mismatch");

        for (uint256 i = 0; i < length;) {
            if (_discountBipsArray[i] > 10000) revert InvalidBips();

            uint256 previousDiscount = boosterDiscounts[_boostBipsArray[i]];
            boosterDiscounts[_boostBipsArray[i]] = _discountBipsArray[i];

            emit BoosterDiscountUpdated(
                _boostBipsArray[i],
                previousDiscount,
                _discountBipsArray[i]
            );

            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                   DISTRIBUTION CONFIGURATION
    // =========================================================================

    /**
     * @notice Sets mining reward distribution percentage for a pool
     * @param _poolKey Pool identifier
     * @param _bips Distribution percentage in basis points (max 10000)
     */
    function setMiningDistributionBips(
        bytes32 _poolKey,
        uint256 _bips
    ) external onlyOwner {
        if (_bips > 10000) revert InvalidBips();

        uint256 previousBips = miningDistributionBips[_poolKey];
        miningDistributionBips[_poolKey] = _bips;

        emit MiningDistributionUpdated(_poolKey, previousBips, _bips);
    }

    /**
     * @notice Sets fee revenue distribution percentage for a pool
     * @param _poolKey Pool identifier
     * @param _bips Distribution percentage in basis points (max 10000)
     */
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

    /**
     * @notice Returns the discount for a specific NFT boost tier
     * @param _boostBips NFT boost value in basis points
     * @return Discount percentage in basis points
     */
    function getBoosterDiscount(uint256 _boostBips) external view override returns (uint256) {
        return boosterDiscounts[_boostBips];
    }

    /**
     * @notice Returns the fee for a specific service
     * @param _serviceKey Service identifier
     * @return Fee amount
     */
    function getFee(bytes32 _serviceKey) external view override returns (uint256) {
        return serviceFees[_serviceKey];
    }

    /**
     * @notice Returns the mining distribution for a pool
     * @param _poolKey Pool identifier
     * @return Distribution percentage in basis points
     */
    function getMiningDistributionBips(bytes32 _poolKey) external view override returns (uint256) {
        return miningDistributionBips[_poolKey];
    }

    /**
     * @notice Returns the fee distribution for a pool
     * @param _poolKey Pool identifier
     * @return Distribution percentage in basis points
     */
    function getFeeDistributionBips(bytes32 _poolKey) external view override returns (uint256) {
        return feeDistributionBips[_poolKey];
    }

    // =========================================================================
    //                       CORE ADDRESS GETTERS
    // =========================================================================

    /// @inheritdoc IEcosystemManager
    function getBKCTokenAddress() external view override returns (address) {
        return bkcTokenAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getTreasuryAddress() external view override returns (address) {
        return treasuryWallet;
    }

    /// @inheritdoc IEcosystemManager
    function getDelegationManagerAddress() external view override returns (address) {
        return delegationManagerAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getBoosterAddress() external view override returns (address) {
        return rewardBoosterAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getMiningManagerAddress() external view override returns (address) {
        return miningManagerAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getDecentralizedNotaryAddress() external view override returns (address) {
        return decentralizedNotaryAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getFortunePoolAddress() external view override returns (address) {
        return fortunePoolAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getNFTLiquidityPoolFactoryAddress() external view override returns (address) {
        return nftLiquidityPoolFactoryAddress;
    }

    /// @inheritdoc IEcosystemManager
    function getRentalManagerAddress() external view override returns (address) {
        return rentalManagerAddress;
    }

    // =========================================================================
    //                       CONVENIENCE FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns all configured core addresses
     * @return bkcToken BKC token address
     * @return treasury Treasury wallet address
     * @return delegation DelegationManager address
     * @return booster RewardBoosterNFT address
     * @return mining MiningManager address
     * @return notary DecentralizedNotary address
     * @return fortune FortunePool address
     * @return nftFactory NFTLiquidityPoolFactory address
     * @return rental RentalManager address
     */
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
