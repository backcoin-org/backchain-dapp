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
 *  Contract    : MiningManager
 *  Version     : 3.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is the economic heart of a fully decentralized,
 *  permissionless, and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchain
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn a percentage of ALL fees (BKC + ETH) generated through their interface
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 *  This creates an open ecosystem where developers worldwide are
 *  incentivized to build interfaces and applications that interact
 *  with the Backchain protocol.
 *
 * ============================================================================
 *
 *  TOKEN ECONOMICS
 *
 *  1. PROOF-OF-PURCHASE MINING
 *     Every fee collected triggers new BKC creation.
 *     Mining rate decreases linearly as supply approaches max cap.
 *     Formula: mintAmount = fee x (remainingSupply / 160M)
 *
 *  2. DEFLATIONARY BURN
 *     Configurable percentage of BKC fees is permanently burned.
 *     Reduces total supply over time, increasing scarcity.
 *     Note: ETH is not burned, it flows to Treasury.
 *
 *  3. OPERATOR REWARDS
 *     Frontend operators earn percentage of fees they generate.
 *     Both BKC and ETH are accumulated for gas-efficient claiming.
 *     Creates permissionless, decentralized frontend ecosystem.
 *
 *  4. DELEGATOR REWARDS
 *     BKC fees distributed to delegators (stakers).
 *     Incentivizes long-term holding and protocol security.
 *
 * ============================================================================
 *
 *  FEE DISTRIBUTION (With Operator)
 *
 *  BKC Flow:
 *  +------------------------------------------------------------------+
 *  |                      BKC FEES RECEIVED                           |
 *  |                             |                                    |
 *  |      +----------------------+----------------------+             |
 *  |      |                      |                      |             |
 *  |      v                      v                      v             |
 *  |   OPERATOR               BURN                  REMAINING         |
 *  |   (config%)             (config%)                  |             |
 *  |   accumulated           destroyed       +----------+----------+  |
 *  |                                         v                     v  |
 *  |                                     TREASURY            DELEGATORS|
 *  |                                     (config%)           (config%) |
 *  +------------------------------------------------------------------+
 *
 *  ETH Flow:
 *  +------------------------------------------------------------------+
 *  |                      ETH FEES RECEIVED                           |
 *  |                             |                                    |
 *  |           +-----------------+-----------------+                  |
 *  |           |                                   |                  |
 *  |           v                                   v                  |
 *  |       OPERATOR                            TREASURY               |
 *  |       (config%)                           (remaining)            |
 *  |       accumulated                         immediate              |
 *  +------------------------------------------------------------------+
 *
 * ============================================================================
 *
 *  LINEAR SCARCITY CURVE
 *
 *  +--------------------------------------------------------------------+
 *  |  Remaining Supply    |  Mining Rate   |  Example                   |
 *  +----------------------+----------------+----------------------------+
 *  |  160M (start)        |  100%          |  100 BKC fee -> 100 BKC    |
 *  |  120M                |  75%           |  100 BKC fee -> 75 BKC     |
 *  |  80M                 |  50%           |  100 BKC fee -> 50 BKC     |
 *  |  40M                 |  25%           |  100 BKC fee -> 25 BKC     |
 *  |  0M (max supply)     |  0%            |  100 BKC fee -> 0 BKC      |
 *  +--------------------------------------------------------------------+
 *
 * ============================================================================
 *
 *  AUTHORIZED SERVICES (Examples, may be modified by governance)
 *
 *  - Social networks, messaging platforms
 *  - Gaming and lottery systems
 *  - NFT trading and rental markets
 *  - Staking and delegation services
 *  - Document certification systems
 *  - Charitable donation platforms
 *  - And any future ecosystem services
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://docs.backcoin.org
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";
import "./TimelockUpgradeable.sol";

contract MiningManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IMiningManager,
    TimelockUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Precision multiplier for calculations
    uint256 private constant PRECISION = 1e18;

    /// @notice Basis points denominator (100% = 10000)
    uint256 private constant BIPS_DENOMINATOR = 10_000;

    /// @notice Maximum tokens available for mining (160M BKC)
    uint256 public constant MAX_MINTABLE_SUPPLY = 160_000_000 * PRECISION;

    /// @notice Maximum burn rate (50% = 5000 bips)
    uint256 public constant MAX_BURN_BIPS = 5_000;

    uint256 public constant MAX_OPERATOR_FEE_BIPS = 5_000;

    /// @notice Distribution pool key for Treasury
    bytes32 public constant POOL_TREASURY = keccak256("TREASURY");

    /// @notice Distribution pool key for Delegators
    bytes32 public constant POOL_DELEGATOR = keccak256("DELEGATOR_POOL");

    // =========================================================================
    //                         PACKED CONFIG (1 slot)
    // =========================================================================

    /// @notice Operator fee rate in basis points
    /// @dev Anyone can become an operator - no permission required
    uint64 public operatorFeeBips;

    /// @notice Burn rate for fee distribution (in basis points)
    uint64 public burnFeeBips;

    /// @notice Burn rate for newly minted tokens (in basis points)
    uint64 public burnMiningBips;

    /// @notice Reserved for future config
    uint64 private __configReserved;

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

    // =========================================================================
    //                         COUNTERS (256-bit for max range)
    // =========================================================================

    /// @notice Total BKC minted through mining (all time)
    uint256 public totalMined;

    /// @notice Total fees processed (all time)
    uint256 public totalFeesProcessed;

    /// @notice Total BKC burned from fees (all time)
    uint256 public totalBurnedFromFees;

    /// @notice Total BKC burned from mining (all time)
    uint256 public totalBurnedFromMining;

    /// @notice Total BKC claimed by operators (all time)
    uint256 public totalOperatorClaimedBKC;

    /// @notice Total ETH claimed by operators (all time)
    uint256 public totalOperatorClaimedETH;

    // =========================================================================
    //                       OPERATOR BALANCES (Packed Struct)
    // =========================================================================

    /// @notice Packed operator balance for gas efficiency
    /// @dev Using uint128 allows up to 340 billion tokens (sufficient)
    struct OperatorBalance {
        uint128 pendingBKC;
        uint128 pendingETH;
    }

    /// @notice Operator address => accumulated earnings
    mapping(address => OperatorBalance) public operatorBalances;

    /// @notice Operator address => total claimed BKC (historical)
    mapping(address => uint256) public operatorTotalClaimedBKC;

    /// @notice Operator address => total claimed ETH (historical)
    mapping(address => uint256) public operatorTotalClaimedETH;

    // =========================================================================
    //                     STATE V3.1 - Pending Operator Totals
    // =========================================================================

    /// @notice Total BKC pending across all operators (protects recoverTokens)
    uint256 public totalPendingOperatorBKC;

    /// @notice Total ETH pending across all operators (protects recoverETH)
    uint256 public totalPendingOperatorETH;

    // =========================================================================
    //                         STORAGE GAP
    // =========================================================================

    /// @dev Reserved storage slots for future upgrades
    uint256[42] private __gap;

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

    /// @notice Emitted when tokens are burned (deflationary)
    event TokensBurned(
        bytes32 indexed serviceKey,
        uint256 amount,
        string burnType,
        uint256 totalBurnedAllTime
    );

    /// @notice Emitted when burn rates are updated
    event BurnRatesUpdated(uint64 burnFeeBips, uint64 burnMiningBips);

    /// @notice Emitted when a service is authorized to mine
    event MinerAuthorized(bytes32 indexed serviceKey, address indexed minerAddress);

    /// @notice Emitted when a service authorization is revoked
    event MinerRevoked(bytes32 indexed serviceKey);

    /// @notice Emitted when TGE is completed
    event TGECompleted(address indexed recipient, uint256 amount);

    /// @notice Emitted on emergency token recovery
    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    /// @notice Emitted when operator earnings are accumulated
    event OperatorEarningsAccumulated(
        bytes32 indexed serviceKey,
        address indexed operator,
        uint128 bkcAmount,
        uint128 ethAmount
    );

    /// @notice Emitted when operator claims earnings
    event OperatorClaimed(
        address indexed operator,
        uint256 bkcAmount,
        uint256 ethAmount
    );

    /// @notice Emitted when operator fee rate is updated
    event OperatorFeeUpdated(uint64 oldBips, uint64 newBips);

    /// @notice Emitted when ETH is sent to treasury
    event TreasuryETHReceived(uint256 amount);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error UnauthorizedMiner();
    error TGEAlreadyCompleted();
    error InvalidDistributionConfig();
    error TokenNotConfigured();
    error BurnRateTooHigh();
    error NothingToClaim();
    error ETHTransferFailed();
    error ArrayLengthMismatch();
    error InsufficientRecoverable();
    error OperatorFeeTooHigh();

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

        // Default config (packed in single slot)
        operatorFeeBips = 1000;  // 10% to operator
        burnFeeBips = 1000;      // 10% of fees burned
        burnMiningBips = 0;      // 0% of mined tokens burned
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    /**
     * @notice Allows contract to receive ETH
     */
    receive() external payable {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Sets burn rates for fees and mining
     * @param _burnFeeBips Percentage of fees to burn (max 50%)
     * @param _burnMiningBips Percentage of mined tokens to burn (max 50%)
     */
    function setBurnRates(
        uint64 _burnFeeBips,
        uint64 _burnMiningBips
    ) external onlyOwner {
        if (_burnFeeBips > MAX_BURN_BIPS) revert BurnRateTooHigh();
        if (_burnMiningBips > MAX_BURN_BIPS) revert BurnRateTooHigh();

        burnFeeBips = _burnFeeBips;
        burnMiningBips = _burnMiningBips;

        emit BurnRatesUpdated(_burnFeeBips, _burnMiningBips);
    }

    /**
     * @notice Sets operator fee rate
     * @dev This controls how much operators earn from fees they generate
     * @param _operatorFeeBips Percentage in basis points (no max limit)
     */
    function setOperatorFee(uint64 _operatorFeeBips) external onlyOwner {
        if (_operatorFeeBips > MAX_OPERATOR_FEE_BIPS) revert OperatorFeeTooHigh();
        uint64 oldBips = operatorFeeBips;
        operatorFeeBips = _operatorFeeBips;

        emit OperatorFeeUpdated(oldBips, _operatorFeeBips);
    }

    /**
     * @notice Authorizes a contract to trigger mining
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
     * @notice Batch authorizes multiple miners in a single transaction
     * @param _serviceKeys Array of service identifiers
     * @param _minerAddresses Array of miner addresses
     */
    function setAuthorizedMinersBatch(
        bytes32[] calldata _serviceKeys,
        address[] calldata _minerAddresses
    ) external onlyOwner {
        uint256 length = _serviceKeys.length;
        if (length != _minerAddresses.length) revert ArrayLengthMismatch();

        for (uint256 i; i < length;) {
            if (_minerAddresses[i] == address(0)) revert ZeroAddress();

            authorizedMiners[_serviceKeys[i]] = _minerAddresses[i];

            emit MinerAuthorized(_serviceKeys[i], _minerAddresses[i]);

            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                         MINING FUNCTIONS
    // =========================================================================

    /**
     * @notice Core mining function - backward compatible (no operator)
     * @param _serviceKey Identifier of the calling service
     * @param _purchaseAmount Amount of BKC fees received
     */
    function performPurchaseMining(
        bytes32 _serviceKey,
        uint256 _purchaseAmount
    ) external nonReentrant override {
        _performPurchaseMining(_serviceKey, _purchaseAmount, address(0));
    }

    /**
     * @notice Core mining function with OPERATOR support
     *
     * @dev This is the heart of the decentralized operator system.
     *
     *      ANYONE CAN BE AN OPERATOR
     *
     *      How it works:
     *      1. Developer builds a frontend/app for Backchain
     *      2. Frontend passes developer's wallet as _operator
     *      3. Developer earns percentage of ALL fees (BKC + ETH)
     *      4. No registration, no approval, no permission needed
     *
     *      This creates an UNSTOPPABLE, permissionless ecosystem where:
     *      - Developers worldwide can build and earn
     *      - Multiple competing frontends improve user experience
     *      - Protocol cannot be shut down (no single point of failure)
     *      - Censorship resistant by design
     *
     * @param _serviceKey Identifier of the calling service
     * @param _purchaseAmount Amount of BKC fees received
     * @param _operator Address to receive operator fee (address(0) = no operator)
     */
    function performPurchaseMiningWithOperator(
        bytes32 _serviceKey,
        uint256 _purchaseAmount,
        address _operator
    ) external payable nonReentrant {
        _performPurchaseMining(_serviceKey, _purchaseAmount, _operator);
    }

    /**
     * @dev Internal mining logic with operator support
     */
    function _performPurchaseMining(
        bytes32 _serviceKey,
        uint256 _purchaseAmount,
        address _operator
    ) internal {
        // ─────────────────────────────────────────────────────────────────────
        // 1. AUTHORIZATION CHECK
        // ─────────────────────────────────────────────────────────────────────

        if (!_isAuthorizedMiner(_serviceKey, msg.sender)) {
            revert UnauthorizedMiner();
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. CACHE CONFIG (save ~6,300 gas on repeated reads)
        // ─────────────────────────────────────────────────────────────────────

        uint256 _operatorFeeBips = operatorFeeBips;
        uint256 _burnFeeBips = burnFeeBips;
        uint256 _burnMiningBips = burnMiningBips;

        address treasury = ecosystemManager.getTreasuryAddress();
        address delegationManager = ecosystemManager.getDelegationManagerAddress();

        // ─────────────────────────────────────────────────────────────────────
        // 3. ETH PROCESSING (if any)
        // ─────────────────────────────────────────────────────────────────────

        uint256 ethReceived = msg.value;
        if (ethReceived > 0) {
            uint128 ethToOperator;
            uint256 ethToTreasury;

            if (_operator != address(0) && _operatorFeeBips > 0) {
                unchecked {
                    ethToOperator = uint128((ethReceived * _operatorFeeBips) / BIPS_DENOMINATOR);
                    ethToTreasury = ethReceived - ethToOperator;
                }

                // Accumulate for operator (gas efficient - no transfer)
                operatorBalances[_operator].pendingETH += ethToOperator;
                totalPendingOperatorETH += ethToOperator;
            } else {
                ethToTreasury = ethReceived;
            }

            // Transfer ETH to treasury immediately
            if (ethToTreasury > 0 && treasury != address(0)) {
                _safeTransferETH(treasury, ethToTreasury);
                emit TreasuryETHReceived(ethToTreasury);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. BKC PROCESSING
        // ─────────────────────────────────────────────────────────────────────

        if (_purchaseAmount == 0) {
            // Emit operator event if ETH was processed
            if (ethReceived > 0 && _operator != address(0) && _operatorFeeBips > 0) {
                emit OperatorEarningsAccumulated(
                    _serviceKey,
                    _operator,
                    0,
                    uint128((ethReceived * _operatorFeeBips) / BIPS_DENOMINATOR)
                );
            }
            return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. OPERATOR BKC PAYMENT (Accumulated)
        // ─────────────────────────────────────────────────────────────────────

        uint128 bkcToOperator;
        uint256 amountAfterOperator = _purchaseAmount;

        if (_operator != address(0) && _operatorFeeBips > 0) {
            unchecked {
                bkcToOperator = uint128((_purchaseAmount * _operatorFeeBips) / BIPS_DENOMINATOR);
                amountAfterOperator = _purchaseAmount - bkcToOperator;
            }

            // Accumulate for operator (gas efficient - no transfer)
            operatorBalances[_operator].pendingBKC += bkcToOperator;
            totalPendingOperatorBKC += bkcToOperator;

            emit OperatorEarningsAccumulated(
                _serviceKey,
                _operator,
                bkcToOperator,
                ethReceived > 0 ? uint128((ethReceived * _operatorFeeBips) / BIPS_DENOMINATOR) : 0
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // 6. MINING: CREATE NEW TOKENS (Linear Scarcity)
        // ─────────────────────────────────────────────────────────────────────

        uint256 mintAmount = getMintAmount(amountAfterOperator);

        if (mintAmount > 0) {
            uint256 mintBurn;
            uint256 mintAfterBurn;

            unchecked {
                mintBurn = (mintAmount * _burnMiningBips) / BIPS_DENOMINATOR;
                mintAfterBurn = mintAmount - mintBurn;
            }

            // Get distribution ratios
            uint256 miningTreasuryBips = ecosystemManager.getMiningDistributionBips(POOL_TREASURY);
            uint256 miningDelegatorBips = ecosystemManager.getMiningDistributionBips(POOL_DELEGATOR);

            if (miningTreasuryBips + miningDelegatorBips != BIPS_DENOMINATOR) {
                revert InvalidDistributionConfig();
            }

            uint256 mintToTreasury;
            uint256 mintToDelegators;

            unchecked {
                mintToTreasury = (mintAfterBurn * miningTreasuryBips) / BIPS_DENOMINATOR;
                mintToDelegators = mintAfterBurn - mintToTreasury;
            }

            // Mint new tokens
            bkcToken.mint(address(this), mintAmount);

            totalMined += mintAmount;

            // Burn from mining (if enabled)
            if (mintBurn > 0) {
                bkcToken.burn(mintBurn);

                totalBurnedFromMining += mintBurn;

                emit TokensBurned(
                    _serviceKey,
                    mintBurn,
                    "mining",
                    totalBurnedFromFees + totalBurnedFromMining
                );
            }

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
                amountAfterOperator,
                mintAmount,
                mintToTreasury,
                mintToDelegators
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // 7. BURN FROM FEES (Deflationary Mechanism)
        // ─────────────────────────────────────────────────────────────────────

        uint256 feeToBurn;
        uint256 feeAfterBurn;

        unchecked {
            feeToBurn = (amountAfterOperator * _burnFeeBips) / BIPS_DENOMINATOR;
            feeAfterBurn = amountAfterOperator - feeToBurn;
        }

        if (feeToBurn > 0) {
            bkcToken.burn(feeToBurn);

            totalBurnedFromFees += feeToBurn;

            emit TokensBurned(
                _serviceKey,
                feeToBurn,
                "fee",
                totalBurnedFromFees + totalBurnedFromMining
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // 8. FEE DISTRIBUTION: REMAINING TO TREASURY & DELEGATORS
        // ─────────────────────────────────────────────────────────────────────

        uint256 feeTreasuryBips = ecosystemManager.getFeeDistributionBips(POOL_TREASURY);
        uint256 feeDelegatorBips = ecosystemManager.getFeeDistributionBips(POOL_DELEGATOR);

        if (feeTreasuryBips + feeDelegatorBips != BIPS_DENOMINATOR) {
            revert InvalidDistributionConfig();
        }

        uint256 feeToTreasury;
        uint256 feeToDelegators;

        unchecked {
            feeToTreasury = (feeAfterBurn * feeTreasuryBips) / BIPS_DENOMINATOR;
            feeToDelegators = feeAfterBurn - feeToTreasury;
        }
        totalFeesProcessed += _purchaseAmount;

        // Distribute to Treasury
        if (feeToTreasury > 0 && treasury != address(0)) {
            bkcToken.safeTransfer(treasury, feeToTreasury);
        }

        // Distribute to Delegators
        if (feeToDelegators > 0 && delegationManager != address(0)) {
            bkcToken.safeTransfer(delegationManager, feeToDelegators);
            IDelegationManager(delegationManager).depositMiningRewards(feeToDelegators);
        }

        emit FeesDistributed(
            _serviceKey,
            amountAfterOperator,
            feeToTreasury,
            feeToDelegators
        );
    }

    // =========================================================================
    //                       OPERATOR CLAIM FUNCTIONS
    // =========================================================================

    /**
     * @notice Operator claims accumulated BKC and ETH earnings
     * @dev Gas efficient - operator calls once for all accumulated earnings
     */
    function claimOperatorEarnings() external override nonReentrant {
        OperatorBalance storage balance = operatorBalances[msg.sender];

        uint128 bkcAmount = balance.pendingBKC;
        uint128 ethAmount = balance.pendingETH;

        if (bkcAmount == 0 && ethAmount == 0) revert NothingToClaim();

        // Clear balances first (reentrancy protection)
        balance.pendingBKC = 0;
        balance.pendingETH = 0;

        // Decrement pending totals
        totalPendingOperatorBKC -= bkcAmount;
        totalPendingOperatorETH -= ethAmount;

        // Update totals
        if (bkcAmount > 0) {
            totalOperatorClaimedBKC += bkcAmount;
            operatorTotalClaimedBKC[msg.sender] += bkcAmount;
            bkcToken.safeTransfer(msg.sender, bkcAmount);
        }

        if (ethAmount > 0) {
            totalOperatorClaimedETH += ethAmount;
            operatorTotalClaimedETH[msg.sender] += ethAmount;
            _safeTransferETH(msg.sender, ethAmount);
        }

        emit OperatorClaimed(msg.sender, bkcAmount, ethAmount);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Calculates mint amount based on linear scarcity curve
     * @param _purchaseAmount Amount of BKC in fees
     * @return Amount of new BKC to mint
     */
    function getMintAmount(uint256 _purchaseAmount) public view override returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        if (currentSupply >= maxSupply) {
            return 0;
        }

        uint256 remainingSupply;
        unchecked {
            remainingSupply = maxSupply - currentSupply;
        }

        if (remainingSupply > MAX_MINTABLE_SUPPLY) {
            return _purchaseAmount;
        }

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
            return BIPS_DENOMINATOR;
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

        unchecked {
            return maxSupply - currentSupply;
        }
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
     * @notice Returns comprehensive mining statistics
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
            unchecked {
                remaining = maxSupply - currentSupply;
            }
            rate = remaining >= MAX_MINTABLE_SUPPLY
                ? BIPS_DENOMINATOR
                : (remaining * BIPS_DENOMINATOR) / MAX_MINTABLE_SUPPLY;
        }
    }

    /**
     * @notice Returns burn statistics
     */
    function getBurnStats() external view returns (
        uint256 burnedFromFees,
        uint256 burnedFromMining,
        uint256 totalBurned,
        uint256 currentFeeBurnBips,
        uint256 currentMiningBurnBips
    ) {
        burnedFromFees = totalBurnedFromFees;
        burnedFromMining = totalBurnedFromMining;
        unchecked {
            totalBurned = totalBurnedFromFees + totalBurnedFromMining;
        }
        currentFeeBurnBips = burnFeeBips;
        currentMiningBurnBips = burnMiningBips;
    }

    /**
     * @notice Returns operator system statistics
     */
    function getOperatorStats() external view returns (
        uint256 totalClaimedBKC,
        uint256 totalClaimedETH,
        uint256 currentFeeBips
    ) {
        totalClaimedBKC = totalOperatorClaimedBKC;
        totalClaimedETH = totalOperatorClaimedETH;
        currentFeeBips = operatorFeeBips;
    }

    /**
     * @notice Returns pending earnings for a specific operator
     * @param _operator Operator address to query
     */
    function getOperatorPendingEarnings(address _operator) external view returns (
        uint256 pendingBKC,
        uint256 pendingETH
    ) {
        OperatorBalance storage balance = operatorBalances[_operator];
        pendingBKC = balance.pendingBKC;
        pendingETH = balance.pendingETH;
    }

    /**
     * @notice Returns total claimed earnings for a specific operator
     * @param _operator Operator address to query
     */
    function getOperatorClaimedEarnings(address _operator) external view returns (
        uint256 claimedBKC,
        uint256 claimedETH
    ) {
        claimedBKC = operatorTotalClaimedBKC[_operator];
        claimedETH = operatorTotalClaimedETH[_operator];
    }

    /**
     * @notice Returns operator configuration and totals (IMiningManager interface)
     * @return bips Operator fee in basis points
     * @return totalBkc Total BKC claimed by all operators
     * @return totalEth Total ETH claimed by all operators
     */
    function getOperatorConfig() external view override returns (
        uint256 bips,
        uint256 totalBkc,
        uint256 totalEth
    ) {
        bips = operatorFeeBips;
        totalBkc = totalOperatorClaimedBKC;
        totalEth = totalOperatorClaimedETH;
    }

    /**
     * @notice Returns pending earnings for a specific operator (IMiningManager interface)
     * @param _operator Operator address to query
     * @return bkcEarnings Pending BKC earnings
     * @return ethEarnings Pending ETH earnings
     */
    function getOperatorEarnings(address _operator) external view override returns (
        uint256 bkcEarnings,
        uint256 ethEarnings
    ) {
        OperatorBalance storage balance = operatorBalances[_operator];
        bkcEarnings = balance.pendingBKC;
        ethEarnings = balance.pendingETH;
    }

    /**
     * @notice Returns current config values
     */
    function getConfig() external view returns (
        uint64 _operatorFeeBips,
        uint64 _burnFeeBips,
        uint64 _burnMiningBips
    ) {
        _operatorFeeBips = operatorFeeBips;
        _burnFeeBips = burnFeeBips;
        _burnMiningBips = burnMiningBips;
    }

    // =========================================================================
    //                       EMERGENCY FUNCTIONS
    // =========================================================================

    /**
     * @notice Recovers ERC20 tokens sent to this contract by mistake
     * @param _token Token address to recover
     * @param _to Recipient address
     * @param _amount Amount to recover
     */
    function recoverTokens(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        // Protect operator pending BKC earnings
        if (_token == bkcTokenAddress) {
            uint256 balance = IERC20Upgradeable(_token).balanceOf(address(this));
            if (_amount > balance - totalPendingOperatorBKC) {
                revert InsufficientRecoverable();
            }
        }

        IERC20Upgradeable(_token).transfer(_to, _amount);

        emit TokensRecovered(_token, _to, _amount);
    }

    /**
     * @notice Recovers ETH sent to this contract by mistake
     * @dev Only recovers ETH not owed to operators
     * @param _to Recipient address
     * @param _amount Amount to recover
     */
    function recoverETH(address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        // Protect operator pending ETH earnings
        uint256 available = address(this).balance - totalPendingOperatorETH;
        if (_amount > available) revert InsufficientRecoverable();

        _safeTransferETH(_to, _amount);

        emit TokensRecovered(address(0), _to, _amount);
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

    /**
     * @dev Safe ETH transfer with error handling
     * @param _to Recipient address
     * @param _amount Amount to transfer
     */
    function _safeTransferETH(address _to, uint256 _amount) internal {
        (bool success, ) = _to.call{value: _amount}("");
        if (!success) revert ETHTransferFailed();
    }
}
