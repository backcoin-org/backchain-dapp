// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// SIMPLE BKC FAUCET — TESTNET UTILITY
// ============================================================================
//
// Distributes BKC tokens + ETH to testnet users.
// Two distribution modes:
//
//   1. Relayer mode  — relayer calls distributeTo() paying gas for the user.
//      Used for new users who don't have ETH yet.
//
//   2. Direct claim  — user calls claim() if they already have gas.
//
// Cooldown prevents abuse. Admin (deployer) can configure parameters.
// Not a core protocol contract — testnet utility with admin controls.
//
// ============================================================================

contract SimpleBKCFaucet {

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBKCToken public immutable bkcToken;
    address   public immutable deployer;

    // ════════════════════════════════════════════════════════════════════════
    // CONFIG (admin-adjustable)
    // ════════════════════════════════════════════════════════════════════════

    address public relayer;
    uint256 public tokensPerClaim;
    uint256 public ethPerClaim;
    uint256 public cooldown;
    bool    public paused;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public claimCount;

    uint256 public totalTokensDistributed;
    uint256 public totalEthDistributed;
    uint256 public totalClaims;
    uint256 public totalUniqueUsers;

    uint8 private _locked;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event Claimed(
        address indexed recipient, uint256 tokens, uint256 eth,
        address indexed via
    );
    event ConfigUpdated(
        address relayer, uint256 tokensPerClaim, uint256 ethPerClaim,
        uint256 cooldown
    );
    event Paused(bool isPaused);
    event FundsDeposited(address indexed sender, uint256 eth, uint256 tokens);
    event FundsWithdrawn(address indexed to, uint256 eth, uint256 tokens);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotDeployer();
    error NotRelayer();
    error ZeroAddress();
    error FaucetPaused();
    error CooldownActive(uint256 remaining);
    error InsufficientTokens();
    error InsufficientETH();
    error TransferFailed();
    error Reentrancy();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    modifier onlyDeployer() {
        if (msg.sender != deployer) revert NotDeployer();
        _;
    }

    modifier nonReentrant() {
        if (_locked == 1) revert Reentrancy();
        _locked = 1;
        _;
        _locked = 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(
        address _bkcToken,
        address _relayer,
        uint256 _tokensPerClaim,
        uint256 _ethPerClaim,
        uint256 _cooldown
    ) {
        bkcToken       = IBKCToken(_bkcToken);
        deployer       = msg.sender;
        relayer        = _relayer;
        tokensPerClaim = _tokensPerClaim;
        ethPerClaim    = _ethPerClaim;
        cooldown       = _cooldown;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM — DIRECT (user pays own gas)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim BKC + ETH directly. User pays gas.
    function claim() external nonReentrant {
        if (paused) revert FaucetPaused();
        _distribute(msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DISTRIBUTE — RELAYER (relayer pays gas for user)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Distribute to a single recipient. Relayer only.
    function distributeTo(address recipient) external nonReentrant {
        if (paused) revert FaucetPaused();
        if (msg.sender != relayer) revert NotRelayer();
        if (recipient == address(0)) revert ZeroAddress();
        _distribute(recipient);
    }

    /// @notice Distribute to multiple recipients. Skips those on cooldown.
    function distributeBatch(address[] calldata recipients) external nonReentrant {
        if (paused) revert FaucetPaused();
        if (msg.sender != relayer) revert NotRelayer();

        for (uint256 i; i < recipients.length;) {
            if (recipients[i] != address(0) && _canClaim(recipients[i])) {
                _distribute(recipients[i]);
            }
            unchecked { ++i; }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN
    // ════════════════════════════════════════════════════════════════════════

    function setConfig(
        address _relayer,
        uint256 _tokensPerClaim,
        uint256 _ethPerClaim,
        uint256 _cooldown
    ) external onlyDeployer {
        relayer        = _relayer;
        tokensPerClaim = _tokensPerClaim;
        ethPerClaim    = _ethPerClaim;
        cooldown       = _cooldown;
        emit ConfigUpdated(_relayer, _tokensPerClaim, _ethPerClaim, _cooldown);
    }

    function setPaused(bool _paused) external onlyDeployer {
        paused = _paused;
        emit Paused(_paused);
    }

    function resetCooldown(address user) external onlyDeployer {
        lastClaimTime[user] = 0;
    }

    /// @notice Withdraw all remaining funds to deployer.
    function withdrawAll() external onlyDeployer nonReentrant {
        uint256 tokenBal = bkcToken.balanceOf(address(this));
        uint256 ethBal   = address(this).balance;

        if (tokenBal > 0) bkcToken.transfer(deployer, tokenBal);
        if (ethBal > 0) {
            (bool ok, ) = deployer.call{value: ethBal}("");
            if (!ok) revert TransferFailed();
        }

        emit FundsWithdrawn(deployer, ethBal, tokenBal);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function canClaim(address user) external view returns (bool) {
        if (paused) return false;
        return _canClaim(user);
    }

    function getCooldownRemaining(address user) external view returns (uint256) {
        uint256 last = lastClaimTime[user];
        if (last == 0) return 0;
        uint256 elapsed = block.timestamp - last;
        return elapsed >= cooldown ? 0 : cooldown - elapsed;
    }

    function getUserInfo(address user) external view returns (
        uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft
    ) {
        lastClaim = lastClaimTime[user];
        claims = claimCount[user];
        eligible = !paused && _canClaim(user);

        if (lastClaim > 0) {
            uint256 elapsed = block.timestamp - lastClaim;
            cooldownLeft = elapsed >= cooldown ? 0 : cooldown - elapsed;
        }
    }

    function getFaucetStatus() external view returns (
        uint256 ethBalance, uint256 tokenBalance,
        uint256 ethPerDrip, uint256 tokensPerDrip,
        uint256 estimatedEthClaims, uint256 estimatedTokenClaims
    ) {
        ethBalance    = address(this).balance;
        tokenBalance  = bkcToken.balanceOf(address(this));
        ethPerDrip    = ethPerClaim;
        tokensPerDrip = tokensPerClaim;
        estimatedEthClaims   = ethPerClaim > 0 ? ethBalance / ethPerClaim : type(uint256).max;
        estimatedTokenClaims = tokensPerClaim > 0 ? tokenBalance / tokensPerClaim : type(uint256).max;
    }

    function getStats() external view returns (
        uint256 tokens, uint256 eth, uint256 claims, uint256 users
    ) {
        return (totalTokensDistributed, totalEthDistributed, totalClaims, totalUniqueUsers);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    function _distribute(address recipient) internal {
        uint256 last = lastClaimTime[recipient];
        if (last > 0 && (block.timestamp - last) < cooldown)
            revert CooldownActive(cooldown - (block.timestamp - last));

        if (bkcToken.balanceOf(address(this)) < tokensPerClaim)
            revert InsufficientTokens();
        if (address(this).balance < ethPerClaim)
            revert InsufficientETH();

        if (claimCount[recipient] == 0) totalUniqueUsers++;
        lastClaimTime[recipient] = block.timestamp;
        claimCount[recipient]++;
        totalClaims++;
        totalTokensDistributed += tokensPerClaim;
        totalEthDistributed    += ethPerClaim;

        bkcToken.transfer(recipient, tokensPerClaim);

        if (ethPerClaim > 0) {
            (bool ok, ) = recipient.call{value: ethPerClaim}("");
            if (!ok) revert TransferFailed();
        }

        emit Claimed(recipient, tokensPerClaim, ethPerClaim, msg.sender);
    }

    function _canClaim(address user) internal view returns (bool) {
        uint256 last = lastClaimTime[user];
        if (last == 0) return true;
        return (block.timestamp - last) >= cooldown;
    }

    // ════════════════════════════════════════════════════════════════════════
    // RECEIVE ETH (funding)
    // ════════════════════════════════════════════════════════════════════════

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, 0);
    }
}
