// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./IBackchain.sol";

// ============================================================================
// AIRDROP CLAIM — MERKLE-BASED AUTO-STAKE MODULE
// ============================================================================
//
// Distributes BKC tokens to qualified users via Merkle proof verification.
// Claimed tokens are automatically delegated to StakingPool with a time lock.
//
// FLOW:
//   1. Deployer deposits BKC tokens into this contract
//   2. Deployer sets merkle root (off-chain allocation tree)
//   3. User calls claim(amount, proof, operator)
//   4. Contract verifies proof, marks claimed, pays fee to ecosystem
//   5. Tokens delegated to StakingPool via delegateFor(user, amount, lockDays)
//   6. User earns staking rewards while locked
//   7. User can forceUnstake with penalty or wait for lock expiry
//
// PHASES:
//   Phase 1: 3.5M BKC — initial airdrop
//   Phase 2: 3.5M BKC — second round / affiliates (new merkle root)
//   Each phase resets claimed status, allowing users to claim again.
//
// FEE:
//   ~$1 in native token (configurable). Goes through ecosystem.collectFee()
//   to distribute to tutor, operator, treasury, and buyback.
//
// SECURITY:
//   - Merkle proof prevents unauthorized claims
//   - claimed[phase][user] prevents double claims per phase
//   - Only deployer can set merkle root and configure parameters
//   - withdrawUnclaimed() only after deadline (prevents rug)
//
// ============================================================================

contract AirdropClaim is IAirdropClaim {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    uint256 private constant BPS = 10_000;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE REFERENCES
    // ════════════════════════════════════════════════════════════════════════

    IBKCToken public immutable bkcToken;
    IStakingPool public immutable stakingPool;
    IBackchainEcosystem public immutable ecosystem;
    address public immutable deployer;

    // ════════════════════════════════════════════════════════════════════════
    // CONFIGURABLE STATE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Merkle root for current phase's allocation tree
    bytes32 public merkleRoot;

    /// @notice Current phase number (increments on each setMerkleRoot)
    uint256 public currentPhase;

    /// @notice Native token fee to claim (~$1, feeds ecosystem mechanisms)
    uint256 public claimFee;

    /// @notice Lock duration for auto-staked tokens (in days)
    uint256 public lockDays;

    /// @notice Module ID for ecosystem fee collection
    bytes32 public moduleId;

    /// @notice Deadline after which unclaimed tokens can be withdrawn
    uint256 public claimDeadline;

    // ════════════════════════════════════════════════════════════════════════
    // TRACKING STATE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice phase => user => claimed
    mapping(uint256 => mapping(address => bool)) public phaseClaimed;

    /// @notice Total BKC claimed across all phases
    uint256 public totalClaimed;

    /// @notice Total claims count
    uint256 public totalClaimCount;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event Claimed(
        address indexed user,
        uint256 indexed phase,
        uint256 amount,
        uint256 feePaid,
        address operator
    );

    event PhaseStarted(
        uint256 indexed phase,
        bytes32 merkleRoot,
        uint256 claimDeadline
    );

    event UnclaimedWithdrawn(address indexed to, uint256 amount);
    event ClaimFeeUpdated(uint256 oldFee, uint256 newFee);
    event LockDaysUpdated(uint256 oldDays, uint256 newDays);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotDeployer();
    error AlreadyClaimed();
    error InvalidProof();
    error InsufficientFee();
    error NoMerkleRoot();
    error ZeroAmount();
    error ZeroAddress();
    error DeadlineNotReached();
    error PhaseStillActive();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    modifier onlyDeployer() {
        if (msg.sender != deployer) revert NotDeployer();
        _;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    /// @param _bkcToken     BKC token contract
    /// @param _stakingPool  StakingPool for auto-delegation
    /// @param _ecosystem    BackchainEcosystem for fee collection
    /// @param _claimFee     Initial claim fee in native token (wei)
    /// @param _lockDays     Lock duration for staked tokens
    /// @param _moduleId     Module ID for ecosystem fee routing
    constructor(
        address _bkcToken,
        address _stakingPool,
        address _ecosystem,
        uint256 _claimFee,
        uint256 _lockDays,
        bytes32 _moduleId
    ) {
        if (_bkcToken == address(0) || _stakingPool == address(0) || _ecosystem == address(0))
            revert ZeroAddress();

        bkcToken = IBKCToken(_bkcToken);
        stakingPool = IStakingPool(_stakingPool);
        ecosystem = IBackchainEcosystem(_ecosystem);
        deployer = msg.sender;

        claimFee = _claimFee;
        lockDays = _lockDays;
        moduleId = _moduleId;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM (user action)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim airdrop tokens. Verifies merkle proof, pays fee,
    ///         and auto-delegates tokens to StakingPool.
    /// @param amount       User's allocation for this phase
    /// @param merkleProof  Proof path from leaf to merkle root
    /// @param operator     Frontend operator earning commission
    function claim(
        uint256 amount,
        bytes32[] calldata merkleProof,
        address operator
    ) external payable override {
        if (merkleRoot == bytes32(0)) revert NoMerkleRoot();
        if (amount == 0) revert ZeroAmount();
        if (phaseClaimed[currentPhase][msg.sender]) revert AlreadyClaimed();
        if (msg.value < claimFee) revert InsufficientFee();

        // Verify merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert InvalidProof();

        // Mark claimed BEFORE external calls (CEI pattern)
        phaseClaimed[currentPhase][msg.sender] = true;
        totalClaimed += amount;
        totalClaimCount++;

        // Pay fee to ecosystem (distributes to tutor, operator, treasury, buyback)
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender,     // user
                operator,       // frontend operator
                address(0),     // no custom recipient — share goes to buyback
                moduleId,       // AIRDROP_CLAIM module
                0               // no BKC fee (ETH only)
            );
        }

        // Approve StakingPool to pull tokens
        bkcToken.approve(address(stakingPool), amount);

        // Auto-delegate to StakingPool on behalf of user
        stakingPool.delegateFor(msg.sender, amount, lockDays);

        emit Claimed(msg.sender, currentPhase, amount, msg.value, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PHASE MANAGEMENT (deployer only)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Start a new phase with a new merkle root.
    ///         Increments phase counter, resets claimed status for all users.
    ///         Deployer must deposit BKC tokens before calling this.
    /// @param _merkleRoot   New allocation tree root
    /// @param _deadlineDays Days from now until unclaimed tokens can be recovered
    function setMerkleRoot(bytes32 _merkleRoot, uint256 _deadlineDays) external onlyDeployer {
        currentPhase++;
        merkleRoot = _merkleRoot;
        claimDeadline = block.timestamp + (_deadlineDays * 1 days);

        emit PhaseStarted(currentPhase, _merkleRoot, claimDeadline);
    }

    /// @notice Withdraw unclaimed BKC after deadline passes.
    ///         Returns tokens to deployer for next phase or reallocation.
    function withdrawUnclaimed(address to) external onlyDeployer {
        if (block.timestamp < claimDeadline) revert DeadlineNotReached();
        if (to == address(0)) revert ZeroAddress();

        uint256 balance = bkcToken.balanceOf(address(this));
        if (balance > 0) {
            bkcToken.transfer(to, balance);
        }

        // Clear merkle root to prevent claims after withdrawal
        merkleRoot = bytes32(0);

        emit UnclaimedWithdrawn(to, balance);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONFIGURATION (deployer only)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Update claim fee (adjust for native token price changes)
    function setClaimFee(uint256 _newFee) external onlyDeployer {
        emit ClaimFeeUpdated(claimFee, _newFee);
        claimFee = _newFee;
    }

    /// @notice Update lock duration for future claims
    function setLockDays(uint256 _newLockDays) external onlyDeployer {
        emit LockDaysUpdated(lockDays, _newLockDays);
        lockDays = _newLockDays;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Check if user has claimed in current phase
    function hasClaimed(address user) external view override returns (bool) {
        return phaseClaimed[currentPhase][user];
    }

    /// @notice Get claim info for frontend display
    function getClaimInfo(address user) external view override returns (
        bool claimed,
        uint256 _claimFee,
        uint256 _lockDays,
        uint256 phase
    ) {
        claimed = phaseClaimed[currentPhase][user];
        _claimFee = claimFee;
        _lockDays = lockDays;
        phase = currentPhase;
    }

    /// @notice BKC balance available for claims
    function availableBalance() external view returns (uint256) {
        return bkcToken.balanceOf(address(this));
    }

    /// @notice Verify a merkle proof without executing (for frontend pre-check)
    function verifyProof(
        address user,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external view returns (bool valid) {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(user, amount))));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }
}
