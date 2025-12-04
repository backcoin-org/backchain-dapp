// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./NFTLiquidityPool.sol";
import "./IInterfaces.sol";

/**
 * @title NFT Liquidity Pool Factory
 * @notice Deploys and tracks AMM pools for Backcoin ($BKC) Boosters.
 * @dev Acts as a registry for valid pools using the 'isPool' mapping.
* Optimized for Arbitrum Network.
 */
contract NFTLiquidityPoolFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    INFTLiquidityPoolFactory
{
    // --- State Variables ---

    address public poolImplementation;
    address public ecosystemManagerAddress;

    // CRÍTICO: Permite que o MiningManager verifique se o chamador é um Pool legítimo
    mapping(address => bool) public isPool; 
    
    mapping(uint256 => address) public getPoolAddress;
    uint256[] public deployedBoostBips;

    // --- Events ---

    event PoolImplementationSet(address indexed implementation);
    event EcosystemManagerSet(address indexed ecosystemManager);
    event PoolDeployed(uint256 indexed boostBips, address indexed poolAddress);

    // --- Custom Errors (Gas Saving) ---

    error InvalidAddress();
    error PoolAlreadyExists();
    error InvalidBoostBips();
    error ImplementationNotSet();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress,
        address _poolImplementation
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();
        if (_poolImplementation == address(0)) revert InvalidAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();

        ecosystemManagerAddress = _ecosystemManagerAddress;
        poolImplementation = _poolImplementation;
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin Functions ---

    function setEcosystemManager(address _ecosystemManagerAddress) external onlyOwner {
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();
        ecosystemManagerAddress = _ecosystemManagerAddress;
        emit EcosystemManagerSet(_ecosystemManagerAddress);
    }

    function setPoolImplementation(address _poolImplementation) external onlyOwner {
        if (_poolImplementation == address(0)) revert InvalidAddress();
        poolImplementation = _poolImplementation;
        emit PoolImplementationSet(_poolImplementation);
    }

    // --- Core Logic ---

    function deployPool(uint256 _boostBips) external onlyOwner {
        if (_boostBips == 0) revert InvalidBoostBips();
        if (getPoolAddress[_boostBips] != address(0)) revert PoolAlreadyExists();
        if (poolImplementation == address(0)) revert ImplementationNotSet();

        // Padrão Clone (EIP-1167) para economizar muito gás no deploy
        address cloneAddress = Clones.clone(poolImplementation);

        // CRÍTICO: Registrar o pool imediatamente
        isPool[cloneAddress] = true;
        getPoolAddress[_boostBips] = cloneAddress;
        deployedBoostBips.push(_boostBips);

        // Inicializa o clone
        NFTLiquidityPool(cloneAddress).initialize(
            owner(),
            ecosystemManagerAddress,
            _boostBips
        );

        emit PoolDeployed(_boostBips, cloneAddress);
    }

    // --- View Functions ---

    function deployedPoolsCount() external view returns (uint256) {
        return deployedBoostBips.length;
    }

    function getDeployedBoostBips() external view returns (uint256[] memory) {
        return deployedBoostBips;
    }
}