// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================================
// BACKCHAIN GOVERNANCE — IMMUTABLE
// ============================================================================
//
// Progressive decentralization governance for the Backchain ecosystem.
// Controls BackchainEcosystem parameters (fees, splits, treasury).
// All other V9 contracts are fully immutable — governance only touches Ecosystem.
//
//   Phase 1: Admin Only   — single admin, instant execution
//   Phase 2: Multisig     — transfer admin to Gnosis Safe, instant execution
//   Phase 3: Timelock     — all changes go through queue + delay + execute
//   Phase 4: DAO          — community votes, proposals execute through timelock
//
// Phases advance forward only (irreversible). Once Timelock is active,
// no more instant execution — everything goes through proposals.
//
// Migration: admin can transfer ecosystem ownership to a new governance
// contract if this one needs to be replaced. No upgrades needed.
//
// No proxy. No upgrades. Permanent governance infrastructure.
//
// ============================================================================

contract BackchainGovernance {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    uint256 public constant MIN_DELAY    = 1 hours;
    uint256 public constant MAX_DELAY    = 30 days;
    uint256 public constant GRACE_PERIOD = 7 days;

    // ════════════════════════════════════════════════════════════════════════
    // ENUMS
    // ════════════════════════════════════════════════════════════════════════

    enum Phase {
        AdminOnly,   // 0 — single admin, direct execution
        Multisig,    // 1 — admin is a multisig, direct execution
        Timelock,    // 2 — all changes require delay
        DAO          // 3 — community DAO controls governance
    }

    enum ProposalState {
        Pending,     // queued, waiting for delay
        Ready,       // delay passed, can execute
        Executed,    // successfully executed
        Cancelled,   // cancelled by governance
        Expired      // grace period passed without execution
    }

    // ════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Proposal data — stored on-chain for transparency
    struct Proposal {
        address target;
        uint256 value;
        uint256 eta;          // earliest execution time
        bool    executed;
        bool    cancelled;
        bytes   data;         // encoded function call
    }

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    address public admin;
    address public pendingAdmin;
    address public dao;

    Phase   public currentPhase;
    uint256 public timelockDelay;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) internal _proposals;
    mapping(bytes32 => bool)     public queuedTransactions;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event AdminTransferred(address indexed previous, address indexed current);
    event PendingAdminSet(address indexed pending);
    event PhaseAdvanced(Phase indexed previous, Phase indexed current);
    event DAOSet(address indexed daoAddress);
    event TimelockDelayUpdated(uint256 previous, uint256 current);

    event ProposalCreated(
        uint256 indexed proposalId, address indexed target,
        uint256 value, bytes data, uint256 eta, string description
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    event DirectExecution(address indexed target, uint256 value, bytes data);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error Unauthorized();
    error ZeroAddress();
    error InvalidDelay();
    error TimelockRequired();
    error AlreadyMaxPhase();
    error DAONotSet();
    error NotPendingAdmin();
    error ProposalNotReady();
    error ProposalAlreadyExecuted();
    error ProposalCancelledOrExpired();
    error ProposalNotQueued();
    error ExecutionFailed();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    /// @dev In DAO phase, only the DAO contract can act.
    ///      In all other phases, only admin.
    modifier onlyGovernance() {
        if (currentPhase == Phase.DAO) {
            if (msg.sender != dao) revert Unauthorized();
        } else {
            if (msg.sender != admin) revert Unauthorized();
        }
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    /// @param _timelockDelay Initial delay for timelock proposals (1h–30d)
    constructor(uint256 _timelockDelay) {
        if (_timelockDelay < MIN_DELAY || _timelockDelay > MAX_DELAY)
            revert InvalidDelay();

        admin         = msg.sender;
        currentPhase  = Phase.AdminOnly;
        timelockDelay = _timelockDelay;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN TRANSFER (2-step)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Nominate a new admin. Must be accepted by the nominee.
    function setPendingAdmin(address _pending) external onlyAdmin {
        if (_pending == address(0)) revert ZeroAddress();
        pendingAdmin = _pending;
        emit PendingAdminSet(_pending);
    }

    /// @notice Accept admin role. Only callable by the pending admin.
    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        address previous = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previous, admin);
    }

    /// @notice Cancel pending admin nomination.
    function cancelPendingAdmin() external onlyAdmin {
        pendingAdmin = address(0);
        emit PendingAdminSet(address(0));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PHASE MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Advance to the next governance phase. Irreversible.
    ///         AdminOnly → Multisig → Timelock → DAO
    ///         DAO phase requires dao address to be set first.
    function advancePhase() external onlyAdmin {
        Phase prev = currentPhase;

        if (prev == Phase.AdminOnly) {
            currentPhase = Phase.Multisig;
        } else if (prev == Phase.Multisig) {
            currentPhase = Phase.Timelock;
        } else if (prev == Phase.Timelock) {
            if (dao == address(0)) revert DAONotSet();
            currentPhase = Phase.DAO;
        } else {
            revert AlreadyMaxPhase();
        }

        emit PhaseAdvanced(prev, currentPhase);
    }

    /// @notice Set the DAO contract address. Required before advancing to DAO phase.
    function setDAO(address _dao) external onlyAdmin {
        if (_dao == address(0)) revert ZeroAddress();
        dao = _dao;
        emit DAOSet(_dao);
    }

    /// @notice Update timelock delay. Subject to its own governance rules.
    /// @notice Update timelock delay. In Timelock/DAO phase, must go through proposal.
    function setTimelockDelay(uint256 _delay) external {
        if (isTimelockActive()) {
            // In Timelock/DAO phase, only callable by this contract (via executeProposal)
            if (msg.sender != address(this)) revert TimelockRequired();
        } else {
            // Pre-Timelock: only admin
            if (msg.sender != admin) revert Unauthorized();
        }
        if (_delay < MIN_DELAY || _delay > MAX_DELAY) revert InvalidDelay();
        uint256 prev = timelockDelay;
        timelockDelay = _delay;
        emit TimelockDelayUpdated(prev, _delay);
    }

    /// @notice Check if timelock is active (Phase.Timelock or Phase.DAO).
    function isTimelockActive() public view returns (bool) {
        return currentPhase >= Phase.Timelock;
    }

    // ════════════════════════════════════════════════════════════════════════
    // DIRECT EXECUTION (pre-Timelock only)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Execute a call immediately. Only in AdminOnly or Multisig phases.
    ///         Once Timelock phase is reached, this function is permanently disabled.
    ///
    /// @param target  Contract to call
    /// @param data    Encoded function call
    function execute(
        address target,
        bytes calldata data
    ) external payable onlyGovernance returns (bytes memory) {
        if (isTimelockActive()) revert TimelockRequired();
        if (target == address(0)) revert ZeroAddress();

        (bool ok, bytes memory ret) = target.call{value: msg.value}(data);
        if (!ok) revert ExecutionFailed();

        emit DirectExecution(target, msg.value, data);
        return ret;
    }

    // ════════════════════════════════════════════════════════════════════════
    // TIMELOCK PROPOSALS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Queue a proposal with timelock delay.
    ///         Available in all phases but required in Timelock/DAO.
    ///
    /// @param target      Contract to call
    /// @param data        Encoded function call
    /// @param value       ETH to send (usually 0)
    /// @param description Human-readable description (emitted in event)
    /// @return proposalId Sequential proposal ID
    function queueProposal(
        address target,
        bytes calldata data,
        uint256 value,
        string calldata description
    ) external onlyGovernance returns (uint256 proposalId) {
        if (target == address(0)) revert ZeroAddress();

        uint256 eta = block.timestamp + timelockDelay;
        proposalId = ++proposalCount;

        _proposals[proposalId] = Proposal({
            target: target,
            value: value,
            eta: eta,
            executed: false,
            cancelled: false,
            data: data
        });

        bytes32 txHash = keccak256(abi.encode(target, data, value, eta));
        queuedTransactions[txHash] = true;

        emit ProposalCreated(
            proposalId, target, value, data, eta, description
        );
    }

    /// @notice Execute a queued proposal after its delay has passed.
    ///         Must be executed within the grace period or it expires.
    function executeProposal(uint256 proposalId) external onlyGovernance {
        Proposal storage p = _proposals[proposalId];

        if (p.executed) revert ProposalAlreadyExecuted();
        if (p.cancelled) revert ProposalCancelledOrExpired();
        if (block.timestamp < p.eta) revert ProposalNotReady();
        if (block.timestamp > p.eta + GRACE_PERIOD)
            revert ProposalCancelledOrExpired();

        bytes32 txHash = keccak256(abi.encode(
            p.target, p.data, p.value, p.eta
        ));
        if (!queuedTransactions[txHash]) revert ProposalNotQueued();

        p.executed = true;
        queuedTransactions[txHash] = false;

        (bool ok, ) = p.target.call{value: p.value}(p.data);
        if (!ok) revert ExecutionFailed();

        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancel a pending proposal.
    function cancelProposal(uint256 proposalId) external onlyGovernance {
        Proposal storage p = _proposals[proposalId];
        if (p.executed) revert ProposalAlreadyExecuted();

        p.cancelled = true;

        bytes32 txHash = keccak256(abi.encode(
            p.target, p.data, p.value, p.eta
        ));
        queuedTransactions[txHash] = false;

        emit ProposalCancelled(proposalId);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get proposal details
    function getProposal(uint256 proposalId) external view returns (
        address target, uint256 value, uint256 eta,
        bool executed, bool cancelled, bytes memory data
    ) {
        Proposal memory p = _proposals[proposalId];
        return (p.target, p.value, p.eta, p.executed, p.cancelled, p.data);
    }

    /// @notice Get computed proposal state
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        Proposal memory p = _proposals[proposalId];
        if (p.executed) return ProposalState.Executed;
        if (p.cancelled) return ProposalState.Cancelled;
        if (p.eta == 0) return ProposalState.Cancelled; // non-existent
        if (block.timestamp > p.eta + GRACE_PERIOD) return ProposalState.Expired;
        if (block.timestamp >= p.eta) return ProposalState.Ready;
        return ProposalState.Pending;
    }

    /// @notice Governance status overview
    function getStatus() external view returns (
        address currentAdmin,
        address currentPendingAdmin,
        address currentDAO,
        Phase phase,
        uint256 delay,
        bool timelockActive,
        uint256 totalProposals
    ) {
        return (
            admin, pendingAdmin, dao,
            currentPhase, timelockDelay,
            isTimelockActive(), proposalCount
        );
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // RECEIVE ETH (for proposals that need to send ETH)
    // ════════════════════════════════════════════════════════════════════════

    receive() external payable {}
}
