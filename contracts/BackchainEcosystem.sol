// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// BACKCHAIN ECOSYSTEM — CENTRAL HUB
// ============================================================================
//
// The ONLY configurable contract in the Backchain protocol.
// All module contracts call collectFee() here to distribute fees.
//
// Responsibilities:
//   - Fee calculation (gas-based or value-based, per action)
//   - ETH distribution: tutor → custom recipient → operator → treasury → buyback
//   - BKC distribution for Tier 2 modules: burn → stakers → treasury
//   - Global tutor registry (mutable — can change tutor with higher fee)
//   - Module registry (authorize/deauthorize contracts)
//   - ETH accumulation for the buyback mechanism
//   - Withdrawal system for operators and treasury
//
// Owner can change:  fees, splits, addresses, BKC distribution params.
// Owner CANNOT change: distribution logic, tutor logic, fee math.
//
// Security:
//   - Two-step ownership transfer (prevents accidental loss)
//   - CEI pattern on all ETH transfers (effects before interactions)
//   - Missing operator/customRecipient → share goes to buyback (nothing lost)
//   - Rounding dust → goes to buyback (nothing lost)
//   - Fee config validation with safe bounds
//   - Emergency ERC20 recovery (not BKC, which has its own flows)
//
// Tutor system:
//   - Users can set a "tutor" (mentor) who earns 5% of their staking claims
//   - First time: small ETH fee (tutorFee). Changing tutor: higher fee (changeTutorFee)
//   - Tutor also earns tutorBps% of ALL ETH fees across the ecosystem
//   - Self-tutoring is forbidden
//
// ============================================================================

contract BackchainEcosystem is IBackchainEcosystem {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    uint256 private constant BPS = 10_000;

    // Safe bounds — prevent owner from setting unreasonable values
    uint256 public constant MAX_GAS_MULTIPLIER = 2_000_000; // 2Mx max (for premium badge pricing on cheap L2 gas)
    uint256 public constant MAX_FEE_BPS        = 5_000;    // 50% max for value-based fees
    uint256 public constant MAX_GAS_ESTIMATE   = 30_000_000; // 30M gas max

    // ════════════════════════════════════════════════════════════════════════
    // GOVERNANCE (two-step ownership)
    // ════════════════════════════════════════════════════════════════════════

    address public owner;
    address public pendingOwner;

    // ════════════════════════════════════════════════════════════════════════
    // ADDRESSES (configurable by owner)
    // ════════════════════════════════════════════════════════════════════════

    IBKCToken public immutable bkcToken;
    address public override treasury;
    address public buybackMiner;
    address public stakingPool;

    // ════════════════════════════════════════════════════════════════════════
    // TUTOR REGISTRY (global, mutable — can change tutor with higher fee)
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => address) public override tutorOf;
    mapping(address => uint256) public override tutorCount;
    address public override tutorRelayer;
    uint16  public override tutorBps;  // global tutor share (e.g., 500 = 5% of ETH fees)

    // ════════════════════════════════════════════════════════════════════════
    // TUTOR BKC BONUS (welcome gift for new users)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice BKC bonus for the tutored user (default 0.1 BKC)
    uint256 public tutorBonusAmount = 0.1e18;

    /// @notice BKC reserved for tutor bonuses (funded by owner/anyone)
    uint256 public tutorBonusPool;

    /// @notice Total bonuses paid out
    uint256 public tutorBonusesPaid;

    /// @notice ETH fee to set tutor first time (~$0.05 anti-spam). Goes to buyback.
    uint256 public tutorFee = 0.00002 ether;

    /// @notice ETH fee to CHANGE tutor (5x higher than first-time fee)
    uint256 public changeTutorFee = 0.0001 ether;

    // ════════════════════════════════════════════════════════════════════════
    // MODULE REGISTRY
    // ════════════════════════════════════════════════════════════════════════

    struct ModuleConfig {
        bool   active;       // if false, collectFee reverts for this module
        uint16 customBps;    // % for custom recipient (creator, pool, seller)
        uint16 operatorBps;  // % for frontend operator
        uint16 treasuryBps;  // % for dev fund
        uint16 buybackBps;   // % for buyback accumulation
        // customBps + operatorBps + treasuryBps + buybackBps MUST = 10000
    }

    mapping(bytes32 => ModuleConfig) public modules;
    mapping(address => bytes32) public authorizedContracts;

    // Module ID enumeration (for frontend discovery)
    bytes32[] public moduleIds;
    mapping(bytes32 => bool) private _moduleIdTracked;

    // ════════════════════════════════════════════════════════════════════════
    // FEE CONFIG (per action)
    // ════════════════════════════════════════════════════════════════════════

    /// @dev feeType: 0 = gas-based, 1 = value-based
    ///      Gas-based: fee = gasEstimate × tx.gasprice × bps × multiplier / BPS
    ///      Value-based: fee = txValue × bps / BPS
    struct FeeConfig {
        uint8  feeType;      // 0 = gas-based, 1 = value-based
        uint16 bps;          // basis points (e.g., 100 = 1%)
        uint32 multiplier;   // gas-based multiplier (uint32 for premium pricing on cheap L2)
        uint32 gasEstimate;  // gas-based: estimated gas units for this action
    }

    mapping(bytes32 => FeeConfig) public feeConfigs;

    // ════════════════════════════════════════════════════════════════════════
    // BKC FEE DISTRIBUTION PARAMS (Tier 2 modules)
    // ════════════════════════════════════════════════════════════════════════

    uint16 public bkcBurnBps     = 0;      // 0% burn (deflation via StakingPool claims)
    uint16 public bkcOperatorBps = 1500;   // 15% to frontend operator
    uint16 public bkcStakerBps   = 7000;   // 70% to stakers
    uint16 public bkcTreasuryBps = 1500;   // 15% to treasury
    // must sum to BPS (10000)

    // ════════════════════════════════════════════════════════════════════════
    // BALANCES & ACCOUNTING
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => uint256) public override pendingEth;
    uint256 public override buybackAccumulated;

    // Global stats (for frontend dashboards)
    uint256 public totalEthCollected;
    uint256 public totalBkcCollected;
    uint256 public totalBkcBurned;
    uint256 public totalFeeEvents;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    // ── Core ──
    event FeeCollected(
        bytes32 indexed moduleId,
        address indexed user,
        address operator,
        address customRecipient,
        uint256 ethAmount,
        uint256 bkcFee
    );
    event EthDistributed(
        uint256 toReferrer,
        uint256 toCustom,
        uint256 toOperator,
        uint256 toTreasury,
        uint256 toBuyback
    );
    event BkcFeeDistributed(uint256 burned, uint256 toOperator, uint256 toStakers, uint256 toTreasury);

    // ── Withdrawals ──
    event EthWithdrawn(address indexed recipient, uint256 amount);
    event BuybackETHWithdrawn(address indexed buyback, uint256 amount);

    // ── Tutor ──
    event TutorSet(address indexed user, address indexed tutor);
    event TutorChanged(address indexed user, address indexed oldTutor, address indexed newTutor);
    event TutorRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event TutorBpsUpdated(uint16 newBps);
    event TutorBonusPaid(address indexed user, uint256 amount);
    event TutorBonusFunded(address indexed funder, uint256 amount, uint256 newPool);
    event TutorBonusAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event TutorFeeUpdated(uint256 oldFee, uint256 newFee);
    event ChangeTutorFeeUpdated(uint256 oldFee, uint256 newFee);

    // ── Module management ──
    event ModuleRegistered(bytes32 indexed moduleId, address indexed contractAddr);
    event ContractDeauthorized(bytes32 indexed moduleId, address indexed contractAddr);
    event ModuleConfigUpdated(bytes32 indexed moduleId);
    event ModuleActivated(bytes32 indexed moduleId);
    event ModuleDeactivated(bytes32 indexed moduleId);

    // ── Fee config ──
    event FeeConfigUpdated(bytes32 indexed actionId);

    // ── Admin changes (all configurable params emit events) ──
    event TreasuryUpdated(address indexed oldAddr, address indexed newAddr);
    event BuybackMinerUpdated(address indexed oldAddr, address indexed newAddr);
    event StakingPoolUpdated(address indexed oldAddr, address indexed newAddr);
    event BkcDistributionUpdated(uint16 burnBps, uint16 operatorBps, uint16 stakerBps, uint16 treasuryBps);

    // ── Ownership ──
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Recovery ──
    event TokenRecovered(address indexed token, address indexed to, uint256 amount);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotOwner();
    error NotPendingOwner();
    error NotAuthorizedModule();
    error ZeroAmount();
    error NotBuybackMiner();
    error ModuleNotActive();
    error InvalidSplit();
    error InvalidBkcSplit();
    error InvalidAddress();
    error CannotTutorSelf();
    error NothingToWithdraw();
    error TransferFailed();
    error ZeroAddress();
    error ArrayLengthMismatch();
    error InvalidFeeBps();
    error CannotRecoverBKC();
    error NotTutorRelayer();
    error InsufficientTutorFee();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRegisteredModule() {
        bytes32 moduleId = authorizedContracts[msg.sender];
        if (moduleId == bytes32(0)) revert NotAuthorizedModule();
        if (!modules[moduleId].active) revert ModuleNotActive();
        _;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _bkcToken, address _treasury) {
        if (_bkcToken == address(0) || _treasury == address(0)) revert ZeroAddress();
        bkcToken = IBKCToken(_bkcToken);
        treasury = _treasury;
        owner = msg.sender;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CORE: CALCULATE FEE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Calculate the ETH fee for a given action.
    /// @dev    Gas-based: fee = gasEstimate × tx.gasprice × bps × multiplier / BPS
    ///         Value-based: fee = txValue × bps / BPS
    ///
    ///         IMPORTANT: tx.gasprice is 0 in static calls (eth_call).
    ///         Frontend should pass { gasPrice } override from provider.getFeeData()
    ///         when calling this as a view for fee preview.
    ///
    /// @param actionId keccak256 of the action name (e.g., "BACKCHAT_POST")
    /// @param txValue  Transaction value (used only for value-based fees)
    /// @return fee     The ETH fee amount in wei
    function calculateFee(
        bytes32 actionId,
        uint256 txValue
    ) external view override returns (uint256 fee) {
        FeeConfig memory cfg = feeConfigs[actionId];

        // If bps is 0 or fee config not set, fee is naturally 0
        if (cfg.bps == 0) return 0;

        if (cfg.feeType == 0) {
            // Gas-based: gasEstimate × gasPrice × bps × multiplier / BPS
            fee = uint256(cfg.gasEstimate)
                * tx.gasprice
                * uint256(cfg.bps)
                * uint256(cfg.multiplier)
                / BPS;
        } else {
            // Value-based: txValue × bps / BPS
            fee = txValue * uint256(cfg.bps) / BPS;
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // CORE: COLLECT FEE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Modules call this to deposit and distribute fees.
    ///
    ///         ETH: sent as msg.value, split per ModuleConfig percentages.
    ///         BKC (Tier 2 only): pulled from msg.sender (the calling module),
    ///              NOT from the end user. Module must have approved this contract.
    ///
    ///         When operator == address(0), operator share → buyback.
    ///         When customRecipient == address(0), custom share → buyback.
    ///         Rounding dust → buyback. Nothing is ever lost.
    ///
    /// @param user            End user performing the action
    /// @param operator        Frontend builder earning operator share
    /// @param customRecipient Module-specific recipient (creator, pool, seller)
    /// @param moduleId        Registered module identifier
    /// @param bkcFee          BKC fee amount (0 for Tier 1 modules)
    function collectFee(
        address user,
        address operator,
        address customRecipient,
        bytes32 moduleId,
        uint256 bkcFee
    ) external payable override onlyRegisteredModule {
        ModuleConfig memory cfg = modules[moduleId];

        // ── ETH DISTRIBUTION ──
        if (msg.value > 0) {
            _distributeEth(msg.value, user, operator, customRecipient, cfg);
            totalEthCollected += msg.value;
        }

        // ── BKC FEE (Tier 2 only) ──
        // BKC is pulled from msg.sender (the calling module contract).
        // The module must have already called bkcToken.approve(ecosystem, bkcFee).
        if (bkcFee > 0) {
            bkcToken.transferFrom(msg.sender, address(this), bkcFee);
            _distributeBkc(bkcFee, operator);
            totalBkcCollected += bkcFee;
        }

        totalFeeEvents++;
        emit FeeCollected(moduleId, user, operator, customRecipient, msg.value, bkcFee);
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: ETH DISTRIBUTION
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Split ETH: tutor off-the-top, then module config split on remaining.
    ///      Uses CEI pattern: all storage writes BEFORE external calls.
    ///
    ///      When an address is missing (address(0)), their share flows to buyback.
    ///      Any rounding dust also flows to buyback. Nothing is ever lost.
    function _distributeEth(
        uint256 amount,
        address user,
        address operator,
        address customRecipient,
        ModuleConfig memory cfg
    ) internal {
        uint256 distributed;

        // ── TUTOR CUT (off-the-top, before module split) ──
        uint256 tutorAmt;
        address tut = tutorOf[user];
        if (tut != address(0) && tutorBps > 0) {
            tutorAmt = amount * tutorBps / BPS;
            pendingEth[tut] += tutorAmt;
            distributed += tutorAmt;
        }

        // ── Module split operates on remaining amount ──
        uint256 remaining = amount - tutorAmt;

        uint256 customAmt   = remaining * cfg.customBps / BPS;
        uint256 operatorAmt = remaining * cfg.operatorBps / BPS;
        uint256 treasuryAmt = remaining * cfg.treasuryBps / BPS;

        // ── EFFECTS (storage writes first — CEI pattern) ──

        // Operator (frontend builder) — accumulates, withdraws later
        if (operator != address(0) && operatorAmt > 0) {
            pendingEth[operator] += operatorAmt;
            distributed += operatorAmt;
        }

        // Treasury (dev fund) — accumulates, withdraws later
        if (treasuryAmt > 0) {
            pendingEth[treasury] += treasuryAmt;
            distributed += treasuryAmt;
        }

        // Buyback — everything not distributed to referrer/operator/treasury
        // Includes: explicit buybackBps + unallocated custom + unallocated operator + dust
        // If customRecipient is present, customAmt will be sent below and subtracted
        uint256 toBuyback;
        if (customRecipient != address(0) && customAmt > 0) {
            distributed += customAmt;
            toBuyback = amount - distributed;
        } else {
            toBuyback = amount - distributed;
        }

        if (toBuyback > 0) {
            buybackAccumulated += toBuyback;
        }

        // ── INTERACTION (external call last — CEI pattern) ──

        // Custom recipient (creator, prize pool, seller) — instant ETH transfer
        if (customRecipient != address(0) && customAmt > 0) {
            _sendEth(customRecipient, customAmt);
        }

        emit EthDistributed(tutorAmt, customAmt, operatorAmt, treasuryAmt, toBuyback);
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: BKC DISTRIBUTION (Tier 2)
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Split BKC fee: burn → operator → staking rewards → treasury.
    ///      If operator is address(0), operator share → treasury.
    ///      If staking pool is not yet set, staker share → treasury.
    ///      Treasury absorbs rounding dust.
    function _distributeBkc(uint256 amount, address operator) internal {
        // Burn
        uint256 burnAmt = amount * bkcBurnBps / BPS;
        if (burnAmt > 0) {
            bkcToken.burn(burnAmt);
            totalBkcBurned += burnAmt;
        }

        // Operator (frontend builder)
        uint256 operatorAmt = amount * bkcOperatorBps / BPS;
        if (operatorAmt > 0) {
            if (operator != address(0)) {
                bkcToken.transfer(operator, operatorAmt);
            } else {
                bkcToken.transfer(treasury, operatorAmt);
            }
        }

        // Staking rewards
        uint256 stakerAmt = amount * bkcStakerBps / BPS;
        if (stakerAmt > 0) {
            if (stakingPool != address(0)) {
                bkcToken.transfer(stakingPool, stakerAmt);
                IStakingPool(stakingPool).notifyReward(stakerAmt);
            } else {
                bkcToken.transfer(treasury, stakerAmt);
            }
        }

        // Treasury (remainder absorbs rounding dust)
        uint256 treasuryAmt = amount - burnAmt - operatorAmt - stakerAmt;
        if (treasuryAmt > 0) {
            bkcToken.transfer(treasury, treasuryAmt);
        }

        emit BkcFeeDistributed(burnAmt, operatorAmt, stakerAmt, treasuryAmt);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TUTOR SYSTEM (global, mutable — can change tutor with higher fee)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Set or change your tutor (mentor).
    ///         First time: tutorFee (cheap). Changing: changeTutorFee (5x more).
    ///         The tutored user receives a BKC welcome bonus on first set (if pool has funds).
    ///         The tutor earns: (1) tutorBps% of ALL ETH fees across the ecosystem,
    ///         and (2) 5% of the user's staking reward claims (in BKC via StakingPool).
    function setTutor(address _tutor) external payable override {
        if (_tutor == address(0)) revert InvalidAddress();
        if (_tutor == msg.sender) revert CannotTutorSelf();

        address oldTutor = tutorOf[msg.sender];
        bool isFirstTime = (oldTutor == address(0));

        // Fee: cheaper first time, more expensive to change
        uint256 requiredFee = isFirstTime ? tutorFee : changeTutorFee;
        if (msg.value < requiredFee) revert InsufficientTutorFee();

        // Update tutor
        if (!isFirstTime) {
            tutorCount[oldTutor]--;
        }
        tutorOf[msg.sender] = _tutor;
        tutorCount[_tutor]++;

        // ETH fee → buyback (feeds the ecosystem)
        if (msg.value > 0) {
            buybackAccumulated += msg.value;
        }

        // BKC bonus only on first tutor set
        if (isFirstTime) {
            _payTutorBonus(msg.sender);
            emit TutorSet(msg.sender, _tutor);
        } else {
            emit TutorChanged(msg.sender, oldTutor, _tutor);
        }
    }

    /// @notice Owner sets the authorized relayer for gasless tutor onboarding.
    function setTutorRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert ZeroAddress();
        emit TutorRelayerUpdated(tutorRelayer, _relayer);
        tutorRelayer = _relayer;
    }

    /// @notice Owner sets the global tutor share (% of ETH fees to tutors).
    ///         Max 3000 (30%). Set to 0 to disable tutor ETH rewards.
    function setTutorBps(uint16 _bps) external onlyOwner {
        if (_bps > 3000) revert InvalidFeeBps();
        tutorBps = _bps;
        emit TutorBpsUpdated(_bps);
    }

    /// @notice Relayer sets a tutor on behalf of a user (gasless onboarding).
    ///         No ETH fee (relayer already pays gas). User still gets BKC bonus.
    ///         Only for first-time tutor set (relayer cannot change existing tutor).
    function setTutorFor(address _user, address _tutor) external {
        if (msg.sender != tutorRelayer) revert NotTutorRelayer();
        if (_user == address(0) || _tutor == address(0)) revert InvalidAddress();
        if (_tutor == _user) revert CannotTutorSelf();
        if (tutorOf[_user] != address(0)) revert InsufficientTutorFee(); // relayer can only set first time

        tutorOf[_user] = _tutor;
        tutorCount[_tutor]++;

        _payTutorBonus(_user);

        emit TutorSet(_user, _tutor);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TUTOR BONUS MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Fund the tutor bonus pool. Anyone can deposit BKC.
    ///         Must have approved this contract for the amount.
    function fundTutorBonus(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        bkcToken.transferFrom(msg.sender, address(this), amount);
        tutorBonusPool += amount;
        emit TutorBonusFunded(msg.sender, amount, tutorBonusPool);
    }

    /// @notice Owner adjusts the BKC bonus for new users.
    ///         Set to 0 to disable BKC bonuses (tutor system still works).
    function setTutorBonusAmount(uint256 _amount) external onlyOwner {
        emit TutorBonusAmountUpdated(tutorBonusAmount, _amount);
        tutorBonusAmount = _amount;
    }

    /// @notice Owner adjusts the ETH fee for first-time setTutor().
    function setTutorFee(uint256 _fee) external onlyOwner {
        emit TutorFeeUpdated(tutorFee, _fee);
        tutorFee = _fee;
    }

    /// @notice Owner adjusts the ETH fee for changing tutor.
    function setChangeTutorFee(uint256 _fee) external onlyOwner {
        emit ChangeTutorFeeUpdated(changeTutorFee, _fee);
        changeTutorFee = _fee;
    }

    /// @dev Pay BKC welcome bonus to the tutored user only.
    ///      Graceful: if pool is empty or insufficient, no bonus is paid.
    function _payTutorBonus(address user) internal {
        uint256 bonus = tutorBonusAmount;
        if (bonus == 0) return;
        if (tutorBonusPool < bonus) return;

        tutorBonusPool -= bonus;
        tutorBonusesPaid += bonus;

        bkcToken.transfer(user, bonus);

        emit TutorBonusPaid(user, bonus);
    }

    // ════════════════════════════════════════════════════════════════════════
    // WITHDRAWALS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Operators and treasury withdraw accumulated ETH.
    ///         CEI: balance zeroed before sending.
    function withdrawEth() external override {
        uint256 amount = pendingEth[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingEth[msg.sender] = 0; // Effect before interaction
        _sendEth(msg.sender, amount);

        emit EthWithdrawn(msg.sender, amount);
    }

    /// @notice BuybackMiner pulls accumulated buyback ETH.
    ///         Only callable by the designated buybackMiner contract.
    function withdrawBuybackETH() external override returns (uint256) {
        if (msg.sender != buybackMiner) revert NotBuybackMiner();

        uint256 amount = buybackAccumulated;
        if (amount == 0) revert NothingToWithdraw();

        buybackAccumulated = 0; // Effect before interaction
        _sendEth(msg.sender, amount);

        emit BuybackETHWithdrawn(msg.sender, amount);
        return amount;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: MODULE MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Register a module contract with its ETH distribution config.
    ///         The 4 bps values must sum to exactly 10000 (100%).
    /// @param _contract  The module contract address
    /// @param _moduleId  keccak256 of the module name (e.g., "BACKCHAT")
    /// @param _cfg       Distribution config (custom + operator + treasury + buyback = 10000)
    function registerModule(
        address _contract,
        bytes32 _moduleId,
        ModuleConfig calldata _cfg
    ) external onlyOwner {
        if (_contract == address(0)) revert ZeroAddress();
        _validateModuleSplit(_cfg);

        authorizedContracts[_contract] = _moduleId;
        modules[_moduleId] = _cfg;

        // Track moduleId for enumeration
        if (!_moduleIdTracked[_moduleId]) {
            moduleIds.push(_moduleId);
            _moduleIdTracked[_moduleId] = true;
        }

        emit ModuleRegistered(_moduleId, _contract);
    }

    /// @notice Register multiple module contracts at once.
    function registerModuleBatch(
        address[] calldata _contracts,
        bytes32[] calldata _moduleIds,
        ModuleConfig[] calldata _cfgs
    ) external onlyOwner {
        uint256 len = _contracts.length;
        if (len != _moduleIds.length || len != _cfgs.length) revert ArrayLengthMismatch();

        for (uint256 i; i < len; ++i) {
            if (_contracts[i] == address(0)) revert ZeroAddress();
            _validateModuleSplit(_cfgs[i]);

            authorizedContracts[_contracts[i]] = _moduleIds[i];
            modules[_moduleIds[i]] = _cfgs[i];

            if (!_moduleIdTracked[_moduleIds[i]]) {
                moduleIds.push(_moduleIds[i]);
                _moduleIdTracked[_moduleIds[i]] = true;
            }

            emit ModuleRegistered(_moduleIds[i], _contracts[i]);
        }
    }

    /// @notice Deauthorize a contract (removes its module binding).
    ///         The module config itself remains — only the contract loses access.
    ///         Useful when migrating to a new contract for the same module.
    function deauthorizeContract(address _contract) external onlyOwner {
        bytes32 moduleId = authorizedContracts[_contract];
        if (moduleId == bytes32(0)) revert NotAuthorizedModule();

        delete authorizedContracts[_contract];
        emit ContractDeauthorized(moduleId, _contract);
    }

    /// @notice Update the ETH distribution config for a module.
    function updateModuleConfig(
        bytes32 _moduleId,
        ModuleConfig calldata _cfg
    ) external onlyOwner {
        _validateModuleSplit(_cfg);
        modules[_moduleId] = _cfg;
        emit ModuleConfigUpdated(_moduleId);
    }

    /// @notice Activate a previously deactivated module.
    function activateModule(bytes32 _moduleId) external onlyOwner {
        modules[_moduleId].active = true;
        emit ModuleActivated(_moduleId);
    }

    /// @notice Deactivate a module. Transactions through this module will revert.
    function deactivateModule(bytes32 _moduleId) external onlyOwner {
        modules[_moduleId].active = false;
        emit ModuleDeactivated(_moduleId);
    }

    function _validateModuleSplit(ModuleConfig calldata _cfg) internal pure {
        uint256 total = uint256(_cfg.customBps) + _cfg.operatorBps + _cfg.treasuryBps + _cfg.buybackBps;
        if (total != BPS) revert InvalidSplit();
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: FEE CONFIGURATION
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Set fee config for a specific action.
    ///         Set bps = 0 to make an action free.
    function setFeeConfig(bytes32 _actionId, FeeConfig calldata _cfg) external onlyOwner {
        _validateFeeConfig(_cfg);
        feeConfigs[_actionId] = _cfg;
        emit FeeConfigUpdated(_actionId);
    }

    /// @notice Batch set fee configs for multiple actions.
    function setFeeConfigBatch(
        bytes32[] calldata _actionIds,
        FeeConfig[] calldata _cfgs
    ) external onlyOwner {
        uint256 len = _actionIds.length;
        if (len != _cfgs.length) revert ArrayLengthMismatch();

        for (uint256 i; i < len; ++i) {
            _validateFeeConfig(_cfgs[i]);
            feeConfigs[_actionIds[i]] = _cfgs[i];
            emit FeeConfigUpdated(_actionIds[i]);
        }
    }

    function _validateFeeConfig(FeeConfig calldata _cfg) internal pure {
        if (_cfg.bps > uint16(MAX_FEE_BPS)) revert InvalidFeeBps();
        if (_cfg.feeType == 0 && _cfg.multiplier > MAX_GAS_MULTIPLIER) revert InvalidFeeBps();
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: ADDRESSES
    // ════════════════════════════════════════════════════════════════════════

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    function setBuybackMiner(address _buyback) external onlyOwner {
        if (_buyback == address(0)) revert ZeroAddress();
        emit BuybackMinerUpdated(buybackMiner, _buyback);
        buybackMiner = _buyback;
    }

    function setStakingPool(address _staking) external onlyOwner {
        if (_staking == address(0)) revert ZeroAddress();
        emit StakingPoolUpdated(stakingPool, _staking);
        stakingPool = _staking;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: BKC DISTRIBUTION PARAMS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Update BKC fee split (Tier 2 modules). Must sum to 10000.
    function setBkcDistribution(
        uint16 _burnBps,
        uint16 _operatorBps,
        uint16 _stakerBps,
        uint16 _treasuryBps
    ) external onlyOwner {
        if (uint256(_burnBps) + _operatorBps + _stakerBps + _treasuryBps != BPS) revert InvalidBkcSplit();
        bkcBurnBps = _burnBps;
        bkcOperatorBps = _operatorBps;
        bkcStakerBps = _stakerBps;
        bkcTreasuryBps = _treasuryBps;
        emit BkcDistributionUpdated(_burnBps, _operatorBps, _stakerBps, _treasuryBps);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: TWO-STEP OWNERSHIP
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Initiate ownership transfer. The new owner must call acceptOwnership().
    ///         This prevents accidental transfer to a wrong address.
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    /// @notice Accept the pending ownership transfer.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: EMERGENCY RECOVERY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Recover accidentally sent ERC20 tokens.
    ///         Cannot recover BKC — it has its own distribution flows.
    function recoverToken(address _token, address _to, uint256 _amount) external onlyOwner {
        if (_token == address(bkcToken)) revert CannotRecoverBKC();
        if (_to == address(0)) revert ZeroAddress();

        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSelector(0xa9059cbb, _to, _amount) // transfer(address,uint256)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) revert TransferFailed();

        emit TokenRecovered(_token, _to, _amount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ════════════════════════════════════════════════════════════════════════

    function _sendEth(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get full module config by module ID
    function getModuleConfig(bytes32 _moduleId) external view returns (ModuleConfig memory) {
        return modules[_moduleId];
    }

    /// @notice Get fee config by action ID
    function getFeeConfig(bytes32 _actionId) external view returns (FeeConfig memory) {
        return feeConfigs[_actionId];
    }

    /// @notice Check if a contract address is authorized and active
    function isAuthorized(address _contract) external view returns (bool) {
        bytes32 moduleId = authorizedContracts[_contract];
        return moduleId != bytes32(0) && modules[moduleId].active;
    }

    /// @notice Get the module ID for a contract address
    function getModuleIdByContract(address _contract) external view returns (bytes32) {
        return authorizedContracts[_contract];
    }

    /// @notice Total number of registered module types
    function moduleCount() external view returns (uint256) {
        return moduleIds.length;
    }

    /// @notice Get ecosystem stats for frontend dashboards
    function getStats() external view returns (
        uint256 _totalEthCollected,
        uint256 _totalBkcCollected,
        uint256 _totalBkcBurned,
        uint256 _totalFeeEvents,
        uint256 _buybackAccumulated
    ) {
        return (totalEthCollected, totalBkcCollected, totalBkcBurned, totalFeeEvents, buybackAccumulated);
    }

    /// @notice Accept ETH directly (e.g., from buyback refunds)
    receive() external payable {}
}
