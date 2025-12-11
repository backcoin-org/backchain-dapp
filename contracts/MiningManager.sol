// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title MiningManager
 * @author Backchain Protocol
 * @notice Economic engine implementing Proof-of-Purchase mining with linear scarcity
 * @dev Handles two types of token flow:
 *
 *      1. MINING (New Token Creation):
 *         - When ecosystem services collect fees, new BKC is minted
 *         - Mint rate decreases linearly as supply approaches max
 *         - Formula: mintAmount = purchaseAmount × (remainingSupply / 160M)
 *
 *      2. FEE DISTRIBUTION (Existing Tokens):
 *         - Fees collected are distributed to Treasury and Stakers
 *         - Distribution ratios configured in EcosystemManager
 *
 *      Linear Scarcity Curve:
 *      ┌────────────────────────────────────────────────────────────┐
 *      │  Remaining Supply    │  Mining Rate   │  Example           │
 *      ├──────────────────────┼────────────────┼────────────────────┤
 *      │  160M (start)        │  100%          │  100 BKC → 100 BKC │
 *      │  120M                │  75%           │  100 BKC → 75 BKC  │
 *      │  80M                 │  50%           │  100 BKC → 50 BKC  │
 *      │  40M                 │  25%           │  100 BKC → 25 BKC  │
 *      │  0M (max supply)     │  0%            │  100 BKC → 0 BKC   │
 *      └────────────────────────────────────────────────────────────┘
 *
 *      Authorized Miners:
 *      - DecentralizedNotary (document fees)
 *      - FortunePool (game fees)
 *      - NFTLiquidityPool (trading fees)
 *      - DelegationManager (staking fees)
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract MiningManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IMiningManager
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Precision multiplier
    uint256 private constant PRECISION = 1e18;

    /// @notice Basis points denominator (100% = 10000)
    uint256 private constant BIPS_DENOMINATOR = 10_000;

    /// @notice Maximum tokens available for mining (160M)
    /// @dev This is the denominator for the linear scarcity curve
    uint256 public constant MAX_MINTABLE_SUPPLY = 160_000_000 * PRECISION;

    /// @notice Distribution pool key for Treasury
    bytes32 public constant POOL_TREASURY = keccak256("TREASURY");

    /// @notice Distribution pool key for Delegators (Stakers)
    bytes32 public constant POOL_DELEGATOR = keccak256("DELEGATOR_POOL");

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to the ecosystem hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice BKC token address (cached for gas optimization)
    address public bkcTokenAddress;

    /// @notice Service key => Authorized miner address
    mapping(bytes32 => address) public authorizedMiners;

    /// @notice Whether TGE (Token Generation Event) has been executed
    bool public tgeCompleted;

    /// @notice Total BKC minted through mining
    uint256 public totalMined;

    /// @notice Total fees processed
    uint256 public totalFeesProcessed;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when new tokens are mined
    event TokensMined(
        bytes32 indexed serviceKey,
        uint256 purchaseAmount,
        uint256 mintedAmount,
        uint256 toTreasury,
        uint256 toDelegators
    );

    /// @notice Emitted when fees are distributed
    event FeesDistributed(
        bytes32 indexed serviceKey,
        uint256 totalFees,
        uint256 toTreasury,
        uint256 toDelegators
    );

    /// @notice Emitted when a miner is authorized
    event MinerAuthorized(
        bytes32 indexed serviceKey,
        address indexed minerAddress
    );

    /// @notice Emitted when a miner is revoked
    event MinerRevoked(bytes32 indexed serviceKey);

    /// @notice Emitted when TGE is completed
    event TGECompleted(address indexed recipient, uint256 amount);

    /// @notice Emitted on emergency token recovery
    event TokensRecovered(address indexed to, uint256 amount);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error UnauthorizedMiner();
    error TGEAlreadyCompleted();
    error InvalidDistributionConfig();
    error TokenNotConfigured();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the MiningManager contract
     * @param _ecosystemManager Address of the ecosystem hub
     */
    function initialize(address _ecosystemManager) external initializer {
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        ecosystemManager = IEcosystemManager(_ecosystemManager);

        bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        if (bkcTokenAddress == address(0)) revert TokenNotConfigured();

        bkcToken = BKCToken(bkcTokenAddress);
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Authorizes a contract to trigger mining
     * @dev Each service has a unique key (e.g., keccak256("NOTARY_SERVICE"))
     * @param _serviceKey Service identifier
     * @param _minerAddress Contract address to authorize
     */
    function setAuthorizedMiner(
        bytes32 _serviceKey,
        address _minerAddress
    ) external onlyOwner {
        if (_minerAddress == address(0)) revert ZeroAddress();

        authorizedMiners[_serviceKey] = _minerAddress;

        emit MinerAuthorized(_serviceKey, _minerAddress);
    }

    /**
     * @notice Revokes mining authorization for a service
     * @param _serviceKey Service identifier to revoke
     */
    function revokeAuthorizedMiner(bytes32 _serviceKey) external onlyOwner {
        delete authorizedMiners[_serviceKey];

        emit MinerRevoked(_serviceKey);
    }

    /**
     * @notice Batch authorizes multiple miners
     * @param _serviceKeys Array of service identifiers
     * @param _minerAddresses Array of miner addresses
     */
    function setAuthorizedMinersBatch(
        bytes32[] calldata _serviceKeys,
        address[] calldata _minerAddresses
    ) external onlyOwner {
        uint256 length = _serviceKeys.length;
        require(length == _minerAddresses.length, "Length mismatch");

        for (uint256 i = 0; i < length;) {
            if (_minerAddresses[i] == address(0)) revert ZeroAddress();

            authorizedMiners[_serviceKeys[i]] = _minerAddresses[i];
            emit MinerAuthorized(_serviceKeys[i], _minerAddresses[i]);

            unchecked { ++i; }
        }
    }

    /**
     * @notice Performs the Token Generation Event (one-time only)
     * @dev Mints initial supply to specified address (typically Treasury)
     * @param _to Recipient of TGE tokens
     * @param _amount Amount to mint
     */
    function executeTGE(address _to, uint256 _amount) external onlyOwner {
        if (tgeCompleted) revert TGEAlreadyCompleted();
        if (_to == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();

        tgeCompleted = true;

        bkcToken.mint(_to, _amount);

        emit TGECompleted(_to, _amount);
    }

    // =========================================================================
    //                         CORE MINING LOGIC
    // =========================================================================

    /**
     * @notice Processes purchase mining and fee distribution
     * @dev Called by authorized ecosystem contracts when fees are collected.
     *      The calling contract must transfer fees to this contract BEFORE calling.
     *
     *      Flow:
     *      1. Verify caller is authorized
     *      2. Calculate and mint new tokens (linear scarcity)
     *      3. Distribute new tokens to Treasury and Delegators
     *      4. Distribute original fees to Treasury and Delegators
     *
     * @param _serviceKey Identifier of the calling service
     * @param _purchaseAmount Amount of BKC fees received
     */
    function performPurchaseMining(
        bytes32 _serviceKey,
        uint256 _purchaseAmount
    ) external nonReentrant override {
        // ─────────────────────────────────────────────────────────────────────
        // 1. AUTHORIZATION CHECK
        // ─────────────────────────────────────────────────────────────────────

        if (!_isAuthorizedMiner(_serviceKey, msg.sender)) {
            revert UnauthorizedMiner();
        }

        if (_purchaseAmount == 0) return;

        // ─────────────────────────────────────────────────────────────────────
        // 2. CACHE ADDRESSES
        // ─────────────────────────────────────────────────────────────────────

        address treasury = ecosystemManager.getTreasuryAddress();
        address delegationManager = ecosystemManager.getDelegationManagerAddress();

        // ─────────────────────────────────────────────────────────────────────
        // 3. MINING: CREATE NEW TOKENS
        // ─────────────────────────────────────────────────────────────────────

        uint256 mintAmount = getMintAmount(_purchaseAmount);

        if (mintAmount > 0) {
            uint256 miningTreasuryBips = ecosystemManager.getMiningDistributionBips(POOL_TREASURY);
            uint256 miningDelegatorBips = ecosystemManager.getMiningDistributionBips(POOL_DELEGATOR);

            if (miningTreasuryBips + miningDelegatorBips != BIPS_DENOMINATOR) {
                revert InvalidDistributionConfig();
            }

            uint256 mintToTreasury = (mintAmount * miningTreasuryBips) / BIPS_DENOMINATOR;
            uint256 mintToDelegators = mintAmount - mintToTreasury;

            // Mint new tokens
            bkcToken.mint(address(this), mintAmount);
            totalMined += mintAmount;

            // Distribute to Treasury
            if (mintToTreasury > 0 && treasury != address(0)) {
                bkcToken.safeTransfer(treasury, mintToTreasury);
            }

            // Distribute to Delegators
            if (mintToDelegators > 0 && delegationManager != address(0)) {
                bkcToken.safeTransfer(delegationManager, mintToDelegators);
                IDelegationManager(delegationManager).depositMiningRewards(mintToDelegators);
            }

            emit TokensMined(
                _serviceKey,
                _purchaseAmount,
                mintAmount,
                mintToTreasury,
                mintToDelegators
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. FEE DISTRIBUTION: EXISTING TOKENS
        // ─────────────────────────────────────────────────────────────────────

        uint256 feeTreasuryBips = ecosystemManager.getFeeDistributionBips(POOL_TREASURY);
        uint256 feeDelegatorBips = ecosystemManager.getFeeDistributionBips(POOL_DELEGATOR);

        if (feeTreasuryBips + feeDelegatorBips != BIPS_DENOMINATOR) {
            revert InvalidDistributionConfig();
        }

        uint256 feeToTreasury = (_purchaseAmount * feeTreasuryBips) / BIPS_DENOMINATOR;
        uint256 feeToDelegators = _purchaseAmount - feeToTreasury;

        totalFeesProcessed += _purchaseAmount;

        // Distribute fees to Treasury
        if (feeToTreasury > 0 && treasury != address(0)) {
            bkcToken.safeTransfer(treasury, feeToTreasury);
        }

        // Distribute fees to Delegators
        if (feeToDelegators > 0 && delegationManager != address(0)) {
            bkcToken.safeTransfer(delegationManager, feeToDelegators);
            IDelegationManager(delegationManager).depositMiningRewards(feeToDelegators);
        }

        emit FeesDistributed(
            _serviceKey,
            _purchaseAmount,
            feeToTreasury,
            feeToDelegators
        );
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Calculates mint amount based on linear scarcity
     * @dev Formula: mintAmount = purchaseAmount × (remainingSupply / 160M)
     *
     *      The mining rate decreases linearly as tokens are minted:
     *      - At 160M remaining: 100% rate (1:1)
     *      - At 80M remaining: 50% rate (2:1)
     *      - At 0M remaining: 0% rate (no mining)
     *
     * @param _purchaseAmount Amount of BKC spent/fee collected
     * @return Amount of new BKC to mint
     */
    function getMintAmount(uint256 _purchaseAmount) public view override returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        // No more minting if max supply reached
        if (currentSupply >= maxSupply) {
            return 0;
        }

        uint256 remainingSupply;
        unchecked {
            remainingSupply = maxSupply - currentSupply;
        }

        // Cap ratio at 100% if burns caused remaining > 160M
        if (remainingSupply > MAX_MINTABLE_SUPPLY) {
            return _purchaseAmount;
        }

        // Linear calculation: (purchase × remaining) / 160M
        return (_purchaseAmount * remainingSupply) / MAX_MINTABLE_SUPPLY;
    }

    /**
     * @notice Returns current mining rate in basis points
     * @return Mining rate (10000 = 100%, 5000 = 50%, etc.)
     */
    function getCurrentMiningRate() external view returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        if (currentSupply >= maxSupply) {
            return 0;
        }

        uint256 remainingSupply;
        unchecked {
            remainingSupply = maxSupply - currentSupply;
        }

        if (remainingSupply >= MAX_MINTABLE_SUPPLY) {
            return BIPS_DENOMINATOR; // 100%
        }

        return (remainingSupply * BIPS_DENOMINATOR) / MAX_MINTABLE_SUPPLY;
    }

    /**
     * @notice Returns remaining mintable supply
     * @return Tokens remaining until max supply
     */
    function getRemainingMintableSupply() external view returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        if (currentSupply >= maxSupply) {
            return 0;
        }

        return maxSupply - currentSupply;
    }

    /**
     * @notice Checks if an address is authorized to mine
     * @param _serviceKey Service identifier
     * @param _address Address to check
     * @return True if authorized
     */
    function isAuthorizedMiner(
        bytes32 _serviceKey,
        address _address
    ) external view returns (bool) {
        return _isAuthorizedMiner(_serviceKey, _address);
    }

    /**
     * @notice Returns mining statistics
     * @return mined Total tokens minted through mining
     * @return fees Total fees processed
     * @return rate Current mining rate in bips
     * @return remaining Remaining mintable supply
     */
    function getMiningStats() external view returns (
        uint256 mined,
        uint256 fees,
        uint256 rate,
        uint256 remaining
    ) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        mined = totalMined;
        fees = totalFeesProcessed;

        if (currentSupply >= maxSupply) {
            rate = 0;
            remaining = 0;
        } else {
            remaining = maxSupply - currentSupply;
            rate = remaining >= MAX_MINTABLE_SUPPLY
                ? BIPS_DENOMINATOR
                : (remaining * BIPS_DENOMINATOR) / MAX_MINTABLE_SUPPLY;
        }
    }

    // =========================================================================
    //                       EMERGENCY FUNCTIONS
    // =========================================================================

    /**
     * @notice Recovers tokens sent to this contract by mistake
     * @param _to Recipient address
     * @param _amount Amount to recover
     */
    function recoverTokens(address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        bkcToken.safeTransfer(_to, _amount);

        emit TokensRecovered(_to, _amount);
    }

    /**
     * @notice Approves tokens for recovery by external contract
     * @param _spender Spender address
     * @param _amount Amount to approve
     */
    function approveTokenRecovery(
        address _spender,
        uint256 _amount
    ) external onlyOwner {
        if (_spender == address(0)) revert ZeroAddress();

        bkcToken.safeApprove(_spender, _amount);
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Checks if caller is authorized to trigger mining
     */
    function _isAuthorizedMiner(
        bytes32 _serviceKey,
        address _caller
    ) internal view returns (bool) {
        // Check 1: Direct authorization
        if (authorizedMiners[_serviceKey] == _caller) {
            return true;
        }

        // Check 2: Valid NFT Liquidity Pool via Factory
        address factoryAddress = ecosystemManager.getNFTLiquidityPoolFactoryAddress();
        if (factoryAddress != address(0)) {
            try INFTLiquidityPoolFactory(factoryAddress).isPool(_caller) returns (bool isPool) {
                if (isPool) return true;
            } catch {}
        }

        // Check 3: DelegationManager
        if (_caller == ecosystemManager.getDelegationManagerAddress()) {
            return true;
        }

        return false;
    }
}
