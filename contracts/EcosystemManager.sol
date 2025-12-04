// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IInterfaces.sol";

/**
 * @title EcosystemManager (The Hub)
 * @notice The central brain of the revolutionary Backcoin Protocol.
 * @dev Manages the rules and addresses that power the economy fueled by $BKC.
 * Acts as the source of truth for the entire ecosystem.
 * Optimized for Arbitrum Network.

 */
contract EcosystemManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IEcosystemManager
{
    // --- State Variables ---

    // Core Contract Addresses
    address public bkcTokenAddress;
    address public treasuryWallet;
    address public delegationManagerAddress;
    address public rewardBoosterAddress;
    address public miningManagerAddress;
    address public decentralizedNotaryAddress;
    address public fortunePoolAddress;
    address public nftLiquidityPoolFactoryAddress;

    // Configuration Mappings (Optimized with bytes32)
    mapping(bytes32 => uint256) public serviceFees;
    mapping(bytes32 => uint256) public servicePStakeMinimums;
    mapping(uint256 => uint256) public boosterDiscounts; // Key: BoostBips (e.g., 100) -> Value: DiscountBips
    mapping(bytes32 => uint256) public miningDistributionBips; // For newly minted tokens
    mapping(bytes32 => uint256) public feeDistributionBips;    // For original fee tokens

    // --- Events ---

    event AddressSet(string indexed key, address indexed newAddress);
    event RuleSet(bytes32 indexed key, uint256 newValue);
    event BoosterDiscountSet(uint256 indexed boostBips, uint256 discountBips);

    // --- Custom Errors (Gas Optimization) ---

    error InvalidAddress();
    error InvalidValue();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _initialOwner) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Configuration Functions ---

    /**
     * @notice Sets the core contract addresses.
     * @dev Validation relaxed to allow partial setup (circular dependencies).
     */
    function setAddresses(
        address _bkcToken,
        address _treasuryWallet,
        address _delegationManager,
        address _rewardBooster,
        address _miningManager,
        address _decentralizedNotary,
        address _fortunePool,
        address _nftLiquidityPoolFactory
    ) external onlyOwner {
        // CORREÇÃO: Removemos _delegationManager e _miningManager da validação inicial.
        // Eles podem ser address(0) durante o primeiro deploy e atualizados depois.
        if (
            _bkcToken == address(0) ||
            _treasuryWallet == address(0) ||
            _rewardBooster == address(0)
        ) revert InvalidAddress();

        bkcTokenAddress = _bkcToken;
        treasuryWallet = _treasuryWallet;
        delegationManagerAddress = _delegationManager;
        rewardBoosterAddress = _rewardBooster;
        miningManagerAddress = _miningManager;
        decentralizedNotaryAddress = _decentralizedNotary;
        fortunePoolAddress = _fortunePool;
        nftLiquidityPoolFactoryAddress = _nftLiquidityPoolFactory;
        
        emit AddressSet("bkcToken", _bkcToken);
        emit AddressSet("treasuryWallet", _treasuryWallet);
        emit AddressSet("delegationManager", _delegationManager);
        emit AddressSet("rewardBooster", _rewardBooster);
        emit AddressSet("miningManager", _miningManager);
        emit AddressSet("decentralizedNotary", _decentralizedNotary);
        emit AddressSet("fortunePool", _fortunePool);
        emit AddressSet("nftLiquidityPoolFactory", _nftLiquidityPoolFactory);
    }

    /**
     * @notice Sets the fee for a specific service.
     * @param _serviceKey The keccak256 hash of the service name.
     */
    function setServiceFee(bytes32 _serviceKey, uint256 _fee) external onlyOwner {
        serviceFees[_serviceKey] = _fee;
        emit RuleSet(_serviceKey, _fee);
    }

    /**
     * @notice Sets the minimum pStake required to access a service.
     */
    function setPStakeMinimum(
        bytes32 _serviceKey,
        uint256 _pStake
    ) external onlyOwner {
        servicePStakeMinimums[_serviceKey] = _pStake;
        emit RuleSet(_serviceKey, _pStake);
    }

    /**
     * @notice Sets the discount for a specific Booster level.
     * @param _boostBips The boost power (e.g., 100 = 1%).
     * @param _discountBips The discount percentage (e.g., 500 = 5%).
     */
    function setBoosterDiscount(
        uint256 _boostBips,
        uint256 _discountBips
    ) external onlyOwner {
        boosterDiscounts[_boostBips] = _discountBips;
        emit BoosterDiscountSet(_boostBips, _discountBips);
    }
    
    function setMiningDistributionBips(
        bytes32 _poolKey, 
        uint256 _bips
    ) external onlyOwner {
        miningDistributionBips[_poolKey] = _bips;
        emit RuleSet(_poolKey, _bips);
    }

    /**
     * @notice Sets the distribution BIPS for *original fee* tokens.
     */
    function setFeeDistributionBips(
        bytes32 _poolKey,
        uint256 _bips
    ) external onlyOwner {
        feeDistributionBips[_poolKey] = _bips;
        emit RuleSet(_poolKey, _bips);
    }

    // --- VIEW FUNCTIONS (Optimized for Interface) ---

    function getServiceRequirements(
        bytes32 _serviceKey
    ) external view override returns (uint256 fee, uint256 pStake) {
        return (serviceFees[_serviceKey], servicePStakeMinimums[_serviceKey]);
    }

    function getBoosterDiscount(
        uint256 _boostBips
    ) external view override returns (uint256) {
        return boosterDiscounts[_boostBips];
    }

    function getFee(
        bytes32 _serviceKey
    ) external view override returns (uint256) {
        return serviceFees[_serviceKey];
    }

    function getMiningDistributionBips(
        bytes32 _poolKey
    ) external view override returns (uint256) {
        return miningDistributionBips[_poolKey];
    }

    function getFeeDistributionBips(
        bytes32 _poolKey
    ) external view override returns (uint256) {
        return feeDistributionBips[_poolKey];
    }

    // --- Address Getters ---

    function getTreasuryAddress() external view override returns (address) {
        return treasuryWallet;
    }

    function getDelegationManagerAddress()
        external
        view
        override
        returns (address)
    {
        return delegationManagerAddress;
    }

    function getBKCTokenAddress() external view override returns (address) {
        return bkcTokenAddress;
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

    function getNFTLiquidityPoolFactoryAddress()
        external
        view
        override
        returns (address)
    {
        return nftLiquidityPoolFactoryAddress;
    }
}