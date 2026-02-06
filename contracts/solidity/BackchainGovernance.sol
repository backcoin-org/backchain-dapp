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
 *  Contract    : BackchainGovernance
 *  Version     : 2.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  PURPOSE
 *
 *  Centralized governance hub with progressive decentralization path.
 *  Controls all ecosystem contracts with timelock protection.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │                        GOVERNANCE PHASES                                │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │                                                                         │
 *  │  PHASE 1: Admin Only   → Single admin controls everything               │
 *  │  PHASE 2: Multisig     → Transfer to Gnosis Safe (2-of-3)               │
 *  │  PHASE 3: Timelock     → Enable delays for critical changes             │
 *  │  PHASE 4: DAO          → Community votes on proposals                   │
 *  │                                                                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │                        CONTROLLED CONTRACTS                             │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │                                                                         │
 *  │                      ┌─────────────────┐                                │
 *  │                      │   BACKCHAIN     │                                │
 *  │                      │   GOVERNANCE    │                                │
 *  │                      └────────┬────────┘                                │
 *  │                               │                                         │
 *  │       ┌───────────────────────┼───────────────────────┐                 │
 *  │       │           │           │           │           │                 │
 *  │       ▼           ▼           ▼           ▼           ▼                 │
 *  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
 *  │  │Ecosystem│ │ Mining  │ │Delegate │ │ Notary  │ │ Fortune │           │
 *  │  │ Manager │ │ Manager │ │ Manager │ │         │ │  Pool   │           │
 *  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
 *  │       │           │           │           │           │                 │
 *  │       └───────────────────────┼───────────────────────┘                 │
 *  │                               │                                         │
 *  │                               ▼                                         │
 *  │                      ┌─────────────────┐                                │
 *  │                      │  ALL ECOSYSTEM  │                                │
 *  │                      │   CONTRACTS     │                                │
 *  │                      └─────────────────┘                                │
 *  │                                                                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./TimelockUpgradeable.sol";

contract BackchainGovernance is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    TimelockUpgradeable
{
    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    uint256 public constant MIN_TIMELOCK_DELAY = 1 hours;

    uint256 public constant MAX_TIMELOCK_DELAY = 30 days;

    uint256 public constant GRACE_PERIOD = 7 days;

    // =========================================================================
    //                              ENUMS
    // =========================================================================

    enum GovernancePhase {
        AdminOnly,
        Multisig,
        Timelock,
        DAO
    }

    enum ProposalState {
        Pending,
        Ready,
        Executed,
        Cancelled,
        Expired
    }

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    struct Proposal {
        uint256 id;
        address target;
        bytes data;
        uint256 value;
        uint256 eta;
        bool executed;
        bool cancelled;
        string description;
    }

    // =========================================================================
    //                              STATE
    // =========================================================================

    address public admin;

    address public pendingAdmin;

    address public dao;

    GovernancePhase public currentPhase;

    uint256 public timelockDelay;

    /// @dev Deprecated: timelock is now determined by currentPhase >= Timelock.
    /// Kept for storage layout compatibility with deployed proxy.
    bool private __deprecated_timelockEnabled;

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;

    mapping(bytes32 => bool) public queuedTransactions;

    // ─────────────────────────────────────────────────────────────────────────
    // MANAGED CONTRACTS
    // ─────────────────────────────────────────────────────────────────────────

    address public ecosystemManager;

    address public miningManager;

    address public delegationManager;

    address public bkcToken;

    address public rewardBoosterNFT;

    address public backchat;

    address public fortunePool;

    address public charityPool;

    address public rentalManager;

    address public decentralizedNotary;

    address public nftPoolFactory;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[40] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    event PendingAdminSet(address indexed pendingAdmin);

    event GovernancePhaseChanged(GovernancePhase indexed previousPhase, GovernancePhase indexed newPhase);

    event TimelockDelayUpdated(uint256 previousDelay, uint256 newDelay);

    event DAOEnabled(address indexed daoAddress);

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed target,
        uint256 value,
        bytes data,
        uint256 eta,
        string description
    );

    event ProposalExecuted(uint256 indexed proposalId);

    event ProposalCancelled(uint256 indexed proposalId);

    event ManagedContractUpdated(string indexed contractName, address indexed newAddress);

    event EmergencyAction(string action, address indexed target);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error Unauthorized();
    error ZeroAddress();
    error InvalidPhase();
    error InvalidDelay();
    error TimelockActive();
    error ProposalNotReady();
    error ProposalAlreadyExecuted();
    error ProposalCancelledOrExpired();
    error ProposalNotQueued();
    error TransactionFailed();
    error PendingAdminOnly();
    error DAONotEnabled();
    error AlreadyInPhase();

    // =========================================================================
    //                              MODIFIERS
    // =========================================================================

    modifier onlyGovernance() {
        if (currentPhase == GovernancePhase.DAO) {
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

    modifier onlyPendingAdmin() {
        if (msg.sender != pendingAdmin) revert PendingAdminOnly();
        _;
    }

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        uint256 _timelockDelay
    ) external initializer {
        if (_admin == address(0)) revert ZeroAddress();

        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        admin = _admin;
        currentPhase = GovernancePhase.AdminOnly;
        
        if (_timelockDelay > 0) {
            if (_timelockDelay < MIN_TIMELOCK_DELAY || _timelockDelay > MAX_TIMELOCK_DELAY) {
                revert InvalidDelay();
            }
            timelockDelay = _timelockDelay;
        } else {
            timelockDelay = 48 hours;
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        if (msg.sender != admin) revert Unauthorized();
    }

    // =========================================================================
    //                    MANAGED CONTRACTS SETUP
    // =========================================================================

    function setManagedContracts(
        address _ecosystemManager,
        address _miningManager,
        address _delegationManager,
        address _bkcToken,
        address _rewardBoosterNFT,
        address _backchat,
        address _fortunePool,
        address _charityPool,
        address _rentalManager,
        address _decentralizedNotary,
        address _nftPoolFactory
    ) external onlyAdmin {
        ecosystemManager = _ecosystemManager;
        miningManager = _miningManager;
        delegationManager = _delegationManager;
        bkcToken = _bkcToken;
        rewardBoosterNFT = _rewardBoosterNFT;
        backchat = _backchat;
        fortunePool = _fortunePool;
        charityPool = _charityPool;
        rentalManager = _rentalManager;
        decentralizedNotary = _decentralizedNotary;
        nftPoolFactory = _nftPoolFactory;

        emit ManagedContractUpdated("ecosystemManager", _ecosystemManager);
        emit ManagedContractUpdated("miningManager", _miningManager);
        emit ManagedContractUpdated("delegationManager", _delegationManager);
        emit ManagedContractUpdated("bkcToken", _bkcToken);
        emit ManagedContractUpdated("rewardBoosterNFT", _rewardBoosterNFT);
        emit ManagedContractUpdated("backchat", _backchat);
        emit ManagedContractUpdated("fortunePool", _fortunePool);
        emit ManagedContractUpdated("charityPool", _charityPool);
        emit ManagedContractUpdated("rentalManager", _rentalManager);
        emit ManagedContractUpdated("decentralizedNotary", _decentralizedNotary);
        emit ManagedContractUpdated("nftPoolFactory", _nftPoolFactory);
    }

    function updateManagedContract(
        string calldata _name,
        address _newAddress
    ) external onlyGovernance {
        if (_newAddress == address(0)) revert ZeroAddress();

        bytes32 nameHash = keccak256(bytes(_name));

        if (nameHash == keccak256("ecosystemManager")) ecosystemManager = _newAddress;
        else if (nameHash == keccak256("miningManager")) miningManager = _newAddress;
        else if (nameHash == keccak256("delegationManager")) delegationManager = _newAddress;
        else if (nameHash == keccak256("bkcToken")) bkcToken = _newAddress;
        else if (nameHash == keccak256("rewardBoosterNFT")) rewardBoosterNFT = _newAddress;
        else if (nameHash == keccak256("backchat")) backchat = _newAddress;
        else if (nameHash == keccak256("fortunePool")) fortunePool = _newAddress;
        else if (nameHash == keccak256("charityPool")) charityPool = _newAddress;
        else if (nameHash == keccak256("rentalManager")) rentalManager = _newAddress;
        else if (nameHash == keccak256("decentralizedNotary")) decentralizedNotary = _newAddress;
        else if (nameHash == keccak256("nftPoolFactory")) nftPoolFactory = _newAddress;

        emit ManagedContractUpdated(_name, _newAddress);
    }

    // =========================================================================
    //                       ADMIN TRANSFER (2-STEP)
    // =========================================================================

    function setPendingAdmin(address _pendingAdmin) external onlyAdmin {
        if (_pendingAdmin == address(0)) revert ZeroAddress();
        
        pendingAdmin = _pendingAdmin;
        
        emit PendingAdminSet(_pendingAdmin);
    }

    function acceptAdmin() external onlyPendingAdmin {
        address previousAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);

        emit AdminTransferred(previousAdmin, admin);
    }

    function cancelPendingAdmin() external onlyAdmin {
        pendingAdmin = address(0);
        
        emit PendingAdminSet(address(0));
    }

    // =========================================================================
    //                       GOVERNANCE PHASE MANAGEMENT
    // =========================================================================

    function advancePhase() external onlyAdmin {
        GovernancePhase previousPhase = currentPhase;

        if (currentPhase == GovernancePhase.AdminOnly) {
            currentPhase = GovernancePhase.Multisig;
        } else if (currentPhase == GovernancePhase.Multisig) {
            currentPhase = GovernancePhase.Timelock;
        } else if (currentPhase == GovernancePhase.Timelock) {
            if (dao == address(0)) revert DAONotEnabled();
            currentPhase = GovernancePhase.DAO;
        } else {
            revert AlreadyInPhase();
        }

        emit GovernancePhaseChanged(previousPhase, currentPhase);
    }

    function setDAO(address _dao) external onlyAdmin {
        if (_dao == address(0)) revert ZeroAddress();
        
        dao = _dao;
        
        emit DAOEnabled(_dao);
    }

    function setTimelockDelay(uint256 _newDelay) external onlyGovernance {
        if (_newDelay < MIN_TIMELOCK_DELAY || _newDelay > MAX_TIMELOCK_DELAY) {
            revert InvalidDelay();
        }

        uint256 previousDelay = timelockDelay;
        timelockDelay = _newDelay;

        emit TimelockDelayUpdated(previousDelay, _newDelay);
    }

    /// @notice Timelock is now controlled by governance phase (irreversible).
    /// Use advancePhase() to enable timelock. Cannot be disabled once active.
    function isTimelockActive() public view returns (bool) {
        return currentPhase >= GovernancePhase.Timelock;
    }

    // =========================================================================
    //                       TIMELOCK PROPOSALS
    // =========================================================================

    function queueProposal(
        address _target,
        bytes calldata _data,
        uint256 _value,
        string calldata _description
    ) external onlyGovernance returns (uint256 proposalId) {
        if (_target == address(0)) revert ZeroAddress();

        uint256 eta = block.timestamp + timelockDelay;
        proposalId = ++proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            target: _target,
            data: _data,
            value: _value,
            eta: eta,
            executed: false,
            cancelled: false,
            description: _description
        });

        bytes32 txHash = keccak256(abi.encode(_target, _data, _value, eta));
        queuedTransactions[txHash] = true;

        emit ProposalCreated(
            proposalId,
            _target,
            _value,
            _data,
            eta,
            _description
        );
    }

    function executeProposal(uint256 _proposalId) external onlyGovernance nonReentrant {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelledOrExpired();
        if (block.timestamp < proposal.eta) revert ProposalNotReady();
        if (block.timestamp > proposal.eta + GRACE_PERIOD) revert ProposalCancelledOrExpired();

        bytes32 txHash = keccak256(abi.encode(
            proposal.target,
            proposal.data,
            proposal.value,
            proposal.eta
        ));

        if (!queuedTransactions[txHash]) revert ProposalNotQueued();

        proposal.executed = true;
        queuedTransactions[txHash] = false;

        (bool success, ) = proposal.target.call{value: proposal.value}(proposal.data);
        if (!success) revert TransactionFailed();

        emit ProposalExecuted(_proposalId);
    }

    function cancelProposal(uint256 _proposalId) external onlyGovernance {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.executed) revert ProposalAlreadyExecuted();

        proposal.cancelled = true;

        bytes32 txHash = keccak256(abi.encode(
            proposal.target,
            proposal.data,
            proposal.value,
            proposal.eta
        ));
        queuedTransactions[txHash] = false;

        emit ProposalCancelled(_proposalId);
    }

    function getProposalState(uint256 _proposalId) external view returns (ProposalState) {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.executed) return ProposalState.Executed;
        if (proposal.cancelled) return ProposalState.Cancelled;
        if (block.timestamp > proposal.eta + GRACE_PERIOD) return ProposalState.Expired;
        if (block.timestamp >= proposal.eta) return ProposalState.Ready;
        return ProposalState.Pending;
    }

    // =========================================================================
    //                    DIRECT EXECUTION (NO TIMELOCK)
    // =========================================================================

    /// @notice Direct execution only available in AdminOnly or Multisig phases.
    /// Once timelock phase is reached, all actions must go through proposals.
    function executeDirectly(
        address _target,
        bytes calldata _data,
        uint256 _value
    ) external onlyGovernance nonReentrant returns (bytes memory) {
        if (currentPhase >= GovernancePhase.Timelock) {
            revert TimelockActive();
        }

        (bool success, bytes memory returnData) = _target.call{value: _value}(_data);
        if (!success) revert TransactionFailed();

        return returnData;
    }

    // =========================================================================
    //                    ECOSYSTEM HELPER FUNCTIONS
    // =========================================================================

    function setBurnRates(
        uint256 _burnFeeBips,
        uint256 _burnMiningBips
    ) external onlyGovernance {
        bytes memory data = abi.encodeWithSignature(
            "setBurnRates(uint256,uint256)",
            _burnFeeBips,
            _burnMiningBips
        );

        if (isTimelockActive()) {
            _queueAndEmit(miningManager, data, 0, "Set burn rates");
        } else {
            (bool success, ) = miningManager.call(data);
            if (!success) revert TransactionFailed();
        }
    }

    function setServiceFee(
        bytes32 _key,
        uint256 _bips
    ) external onlyGovernance {
        bytes memory data = abi.encodeWithSignature(
            "setServiceFee(bytes32,uint256)",
            _key,
            _bips
        );

        if (isTimelockActive()) {
            _queueAndEmit(ecosystemManager, data, 0, "Set service fee");
        } else {
            (bool success, ) = ecosystemManager.call(data);
            if (!success) revert TransactionFailed();
        }
    }

    function setOperatorBips(uint256 _bips) external onlyGovernance {
        bytes memory data = abi.encodeWithSignature(
            "setOperatorBips(uint256)",
            _bips
        );

        if (isTimelockActive()) {
            _queueAndEmit(miningManager, data, 0, "Set operator bips");
        } else {
            (bool success, ) = miningManager.call(data);
            if (!success) revert TransactionFailed();
        }
    }

    function pauseContract(address _contract) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature("pause()");
        
        (bool success, ) = _contract.call(data);
        if (!success) revert TransactionFailed();

        emit EmergencyAction("pause", _contract);
    }

    function unpauseContract(address _contract) external onlyGovernance {
        bytes memory data = abi.encodeWithSignature("unpause()");

        if (isTimelockActive()) {
            _queueAndEmit(_contract, data, 0, "Unpause contract");
        } else {
            (bool success, ) = _contract.call(data);
            if (!success) revert TransactionFailed();
        }
    }

    // =========================================================================
    //                    OWNERSHIP TRANSFER HELPERS
    // =========================================================================

    function claimOwnership(address _contract) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature("acceptOwnership()");
        
        (bool success, ) = _contract.call(data);
        require(success, "Call failed");
        
        emit EmergencyAction("claimOwnership", _contract);
    }

    function transferContractOwnership(
        address _contract,
        address _newOwner
    ) external onlyGovernance {
        if (_newOwner == address(0)) revert ZeroAddress();

        bytes memory data = abi.encodeWithSignature(
            "transferOwnership(address)",
            _newOwner
        );

        if (isTimelockActive()) {
            _queueAndEmit(_contract, data, 0, "Transfer contract ownership");
        } else {
            (bool success, ) = _contract.call(data);
            if (!success) revert TransactionFailed();
        }
    }

    // =========================================================================
    //                         VIEW FUNCTIONS
    // =========================================================================

    function getManagedContracts() external view returns (
        address _ecosystemManager,
        address _miningManager,
        address _delegationManager,
        address _bkcToken,
        address _rewardBoosterNFT,
        address _backchat,
        address _fortunePool,
        address _charityPool,
        address _rentalManager,
        address _decentralizedNotary,
        address _nftPoolFactory
    ) {
        return (
            ecosystemManager,
            miningManager,
            delegationManager,
            bkcToken,
            rewardBoosterNFT,
            backchat,
            fortunePool,
            charityPool,
            rentalManager,
            decentralizedNotary,
            nftPoolFactory
        );
    }

    function getGovernanceStatus() external view returns (
        address currentAdmin,
        address currentPendingAdmin,
        address currentDAO,
        GovernancePhase phase,
        uint256 delay,
        bool timelockActive,
        uint256 totalProposals
    ) {
        return (
            admin,
            pendingAdmin,
            dao,
            currentPhase,
            timelockDelay,
            isTimelockActive(),
            proposalCount
        );
    }

    // =========================================================================
    //                       INTERNAL FUNCTIONS
    // =========================================================================

    function _queueAndEmit(
        address _target,
        bytes memory _data,
        uint256 _value,
        string memory _description
    ) internal returns (uint256) {
        uint256 eta = block.timestamp + timelockDelay;
        uint256 proposalId = ++proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            target: _target,
            data: _data,
            value: _value,
            eta: eta,
            executed: false,
            cancelled: false,
            description: _description
        });

        bytes32 txHash = keccak256(abi.encode(_target, _data, _value, eta));
        queuedTransactions[txHash] = true;

        emit ProposalCreated(
            proposalId,
            _target,
            _value,
            _data,
            eta,
            _description
        );

        return proposalId;
    }

    // =========================================================================
    //                         RECEIVE ETH
    // =========================================================================

    receive() external payable {}
}
