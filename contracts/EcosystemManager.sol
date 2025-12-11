// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IInterfaces.sol";

/**
 * @title EcosystemManager
 * @author Backchain Protocol
 * @notice Central configuration hub for the Backcoin ecosystem
 * @dev Manages:
 *      - Contract addresses registry
 *      - Service fees configuration
 *      - NFT booster discount tiers
 *      - Mining and fee distribution rules
 *
 *      All ecosystem contracts reference this hub for configuration,
 *      enabling centralized parameter updates without redeployment.
 *
 *      Fee Keys (bytes32):
 *      - keccak256("DELEGATION_FEE_BIPS") - Staking entry fee
 *      - keccak256("UNSTAKE_FEE_BIPS") - Normal unstake fee
 *      - keccak256("FORCE_UNSTAKE_PENALTY_BIPS") - Early unstake penalty
 *      - keccak256("CLAIM_REWARD_FEE_BIPS") - Reward claim fee
 *      - keccak256("NOTARY_SERVICE") - Document notarization fee
 *      - keccak256("NFT_POOL_BUY_TAX_BIPS") - NFT purchase tax
 *      - keccak256("NFT_POOL_SELL_TAX_BIPS") - NFT sale tax
 *
 * @custom:security-contact security@backcoin.org
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
    //                              STATE
    // =========================================================================

    // ─────────────────────────────────────────────────────────────────────────
    // Contract Registry
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

    /// @notice Emitted when a contract address is updated
    event AddressUpdated(
        string indexed key,
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
    //                      ADDRESS CONFIGURATION
    // =========================================================================

    /**
     * @notice Sets all ecosystem contract addresses in a single transaction
     * @dev Only BKC token and treasury are mandatory (cannot be zero)
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
     * @notice Updates a single contract address
     * @param _key Address identifier
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
        }

        emit AddressUpdated(_key, previousAddress, _newAddress);
    }

    // =========================================================================
    //                       FEE CONFIGURATION
    // =========================================================================

    /**
     * @notice Sets a service fee
     * @dev Fee interpretation depends on the service:
     *      - BIPS fees: Value represents basis points (10000 = 100%)
     *      - Fixed fees: Value represents BKC amount in wei
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
     * @dev Discount is applied proportionally to fees:
     *      finalFee = baseFee - (baseFee × discountBips / 10000)
     *
     *      Example tiers:
     *      - Crystal (1000 boost) => 1000 discount (10%)
     *      - Diamond (7000 boost) => 7000 discount (70%)
     *
     * @param _boostBips NFT boost value in basis points
     * @param _discountBips Discount percentage in basis points
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
     * @param _bips Distribution percentage in basis points
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
     * @param _bips Distribution percentage in basis points
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
    //                       ADDRESS GETTERS
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

    // =========================================================================
    //                       CONVENIENCE FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns all configured addresses
     * @return bkcToken BKC token address
     * @return treasury Treasury wallet address
     * @return delegation DelegationManager address
     * @return booster RewardBoosterNFT address
     * @return mining MiningManager address
     * @return notary DecentralizedNotary address
     * @return fortune FortunePool address
     * @return nftFactory NFTLiquidityPoolFactory address
     */
    function getAllAddresses() external view returns (
        address bkcToken,
        address treasury,
        address delegation,
        address booster,
        address mining,
        address notary,
        address fortune,
        address nftFactory
    ) {
        return (
            bkcTokenAddress,
            treasuryWallet,
            delegationManagerAddress,
            rewardBoosterAddress,
            miningManagerAddress,
            decentralizedNotaryAddress,
            fortunePoolAddress,
            nftLiquidityPoolFactoryAddress
        );
    }
}
