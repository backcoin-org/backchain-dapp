// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IInterfaces.sol";

contract EcosystemManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IEcosystemManager
{
    address public bkcTokenAddress;
    address public treasuryWallet;
    address public delegationManagerAddress;
    address public rewardBoosterAddress;
    address public miningManagerAddress;
    address public decentralizedNotaryAddress;
    address public fortunePoolAddress;
    address public nftLiquidityPoolFactoryAddress;

    mapping(string => uint256) public serviceFees;
    mapping(string => uint256) public servicePStakeMinimums;
    mapping(uint256 => uint256) public boosterDiscounts;
    mapping(string => uint256) public miningDistributionBips; // For newly minted tokens
    mapping(string => uint256) public feeDistributionBips;    // For original fee tokens

    event AddressSet(string indexed key, address indexed newAddress);
    event RuleSet(string indexed key, uint256 newValue);
    event BoosterDiscountSet(uint256 indexed boostBips, uint256 discountBips);

    function initialize(address _initialOwner) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

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

    function setServiceFee(string calldata _serviceKey, uint256 _fee) external onlyOwner {
        serviceFees[_serviceKey] = _fee;
        emit RuleSet(_serviceKey, _fee);
    }

    function setPStakeMinimum(
        string calldata _serviceKey,
        uint256 _pStake
    ) external onlyOwner {
        servicePStakeMinimums[_serviceKey] = _pStake;
        emit RuleSet(_serviceKey, _pStake);
    }

    function setBoosterDiscount(
        uint256 _boostBips,
        uint256 _discountBips
    ) external onlyOwner {
        boosterDiscounts[_boostBips] = _discountBips;
        emit BoosterDiscountSet(_boostBips, _discountBips);
    }
    
    function setMiningDistributionBips(
        string calldata _poolKey, 
        uint256 _bips
    ) external onlyOwner {
        miningDistributionBips[_poolKey] = _bips;
        emit RuleSet(_poolKey, _bips);
    }

    /**
     * @notice Sets the distribution BIPS for *original fee* tokens.
     */
    function setFeeDistributionBips(
        string calldata _poolKey,
        uint256 _bips
    ) external onlyOwner {
        feeDistributionBips[_poolKey] = _bips;
        emit RuleSet(_poolKey, _bips);
    }

    // --- VIEW FUNCTIONS ---

    function getServiceRequirements(
        string calldata _serviceKey
    ) external view override returns (uint256 fee, uint256 pStake) {
        return (serviceFees[_serviceKey], servicePStakeMinimums[_serviceKey]);
    }

    function getBoosterDiscount(
        uint256 _boostBips
    ) external view override returns (uint256) {
        return boosterDiscounts[_boostBips];
    }

    function getFee(
        string calldata _serviceKey
    ) external view override returns (uint256) {
        return serviceFees[_serviceKey];
    }

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
    
    function getMiningDistributionBips(
        string calldata _poolKey
    ) external view override returns (uint256) {
        return miningDistributionBips[_poolKey];
    }

    /**
     * @notice Returns the distribution BIPS for *original fee* tokens.
     */
    function getFeeDistributionBips(
        string calldata _poolKey
    ) external view override returns (uint256) {
        return feeDistributionBips[_poolKey];
    }
}