// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IInterfaces.sol";

/**
 * @title EcosystemManager (The Hub)
 * @notice The central brain of the Backcoin Protocol.
 * @dev Manages fees, addresses, and economic rules.
 * Part of the Backcoin Ecosystem.
 * Website: Backcoin.org
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

    // Configuration Mappings
    mapping(bytes32 => uint256) public serviceFees;
    // Key: BoostBips (e.g., 100) -> Value: DiscountBips
    mapping(uint256 => uint256) public boosterDiscounts;
    // Distribution Rules
    mapping(bytes32 => uint256) public miningDistributionBips; // For new mints
    mapping(bytes32 => uint256) public feeDistributionBips;    // For fee revenue

    // --- Events ---

    event AddressSet(string indexed key, address indexed newAddress);
    event RuleSet(bytes32 indexed key, uint256 newValue);
    event BoosterDiscountSet(uint256 indexed boostBips, uint256 discountBips);

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidValue();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _initialOwner) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();

        // CORREÇÃO v4: __Ownable_init() sem argumentos
        __Ownable_init();
        
        _transferOwnership(_initialOwner);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Configuration Functions ---

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
        if (_bkcToken == address(0) || _treasuryWallet == address(0)) revert InvalidAddress();

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

    function setServiceFee(bytes32 _serviceKey, uint256 _fee) external onlyOwner {
        serviceFees[_serviceKey] = _fee;
        emit RuleSet(_serviceKey, _fee);
    }

    function setBoosterDiscount(uint256 _boostBips, uint256 _discountBips) external onlyOwner {
        boosterDiscounts[_boostBips] = _discountBips;
        emit BoosterDiscountSet(_boostBips, _discountBips);
    }
    
    function setMiningDistributionBips(bytes32 _poolKey, uint256 _bips) external onlyOwner {
        miningDistributionBips[_poolKey] = _bips;
        emit RuleSet(_poolKey, _bips);
    }

    function setFeeDistributionBips(bytes32 _poolKey, uint256 _bips) external onlyOwner {
        feeDistributionBips[_poolKey] = _bips;
        emit RuleSet(_poolKey, _bips);
    }

    // --- View Functions ---

    function getBoosterDiscount(uint256 _boostBips) external view override returns (uint256) {
        return boosterDiscounts[_boostBips];
    }

    function getFee(bytes32 _serviceKey) external view override returns (uint256) {
        return serviceFees[_serviceKey];
    }

    function getMiningDistributionBips(bytes32 _poolKey) external view override returns (uint256) {
        return miningDistributionBips[_poolKey];
    }

    function getFeeDistributionBips(bytes32 _poolKey) external view override returns (uint256) {
        return feeDistributionBips[_poolKey];
    }

    // --- Address Getters ---

    function getTreasuryAddress() external view override returns (address) { return treasuryWallet; }
    function getDelegationManagerAddress() external view override returns (address) { return delegationManagerAddress; }
    function getBKCTokenAddress() external view override returns (address) { return bkcTokenAddress; }
    function getBoosterAddress() external view override returns (address) { return rewardBoosterAddress; }
    function getMiningManagerAddress() external view override returns (address) { return miningManagerAddress; }
    function getDecentralizedNotaryAddress() external view override returns (address) { return decentralizedNotaryAddress; }
    function getFortunePoolAddress() external view override returns (address) { return fortunePoolAddress; }
    function getNFTLiquidityPoolFactoryAddress() external view override returns (address) { return nftLiquidityPoolFactoryAddress; }
}