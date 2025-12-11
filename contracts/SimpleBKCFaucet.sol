// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SimpleBKCFaucet
 * @author Backchain Protocol
 * @notice Testnet faucet for distributing BKC tokens and native ETH
 * @dev Implements relayer-based distribution for gas-efficient claims:
 *
 *      Flow:
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │  1. User requests tokens via off-chain interface (website/bot) │
 *      │  2. Relayer (oracle) verifies request and eligibility          │
 *      │  3. Relayer calls distributeTo() paying gas on behalf of user  │
 *      │  4. User receives BKC + ETH for future transactions            │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      Features:
 *      - Configurable cooldown period per user
 *      - Adjustable distribution amounts
 *      - Emergency withdrawal functions
 *      - Distribution statistics tracking
 *      - Batch distribution support
 *
 *      Security:
 *      - Only authorized relayer can distribute
 *      - Reentrancy protection
 *      - Cooldown prevents abuse
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum Sepolia (Testnet)
 */
contract SimpleBKCFaucet is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice BKC token contract
    IERC20Upgradeable public bkcToken;

    /// @notice Authorized relayer/oracle address
    address public relayerAddress;

    /// @notice Amount of BKC tokens per distribution
    uint256 public tokensPerRequest;

    /// @notice Amount of native ETH per distribution
    uint256 public ethPerRequest;

    /// @notice Cooldown period between claims (seconds)
    uint256 public cooldownPeriod;

    /// @notice User address => Last claim timestamp
    mapping(address => uint256) public lastRequestTime;

    /// @notice User address => Total times claimed
    mapping(address => uint256) public userClaimCount;

    /// @notice Total BKC distributed
    uint256 public totalTokensDistributed;

    /// @notice Total ETH distributed
    uint256 public totalEthDistributed;

    /// @notice Total unique users served
    uint256 public totalUniqueUsers;

    /// @notice Total distribution transactions
    uint256 public totalDistributions;

    /// @notice Whether faucet is paused
    bool public paused;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when tokens are distributed
    event TokensDistributed(
        address indexed recipient,
        uint256 tokenAmount,
        uint256 ethAmount,
        address indexed relayer,
        uint256 timestamp
    );

    /// @notice Emitted when relayer address changes
    event RelayerUpdated(
        address indexed previousRelayer,
        address indexed newRelayer
    );

    /// @notice Emitted when distribution amounts change
    event AmountsUpdated(
        uint256 previousTokenAmount,
        uint256 newTokenAmount,
        uint256 previousEthAmount,
        uint256 newEthAmount
    );

    /// @notice Emitted when cooldown period changes
    event CooldownUpdated(
        uint256 previousCooldown,
        uint256 newCooldown
    );

    /// @notice Emitted when funds are deposited
    event FundsDeposited(
        address indexed sender,
        uint256 ethAmount,
        uint256 tokenAmount
    );

    /// @notice Emitted on emergency withdrawal
    event EmergencyWithdrawal(
        address indexed to,
        uint256 ethAmount,
        uint256 tokenAmount
    );

    /// @notice Emitted when pause status changes
    event PauseStatusChanged(bool isPaused);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error UnauthorizedRelayer();
    error CooldownActive(uint256 timeRemaining);
    error InsufficientTokenBalance(uint256 available, uint256 required);
    error InsufficientEthBalance(uint256 available, uint256 required);
    error TransferFailed();
    error FaucetPaused();
    error ArrayLengthMismatch();
    error ZeroAmount();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the faucet contract
     * @param _bkcToken BKC token address
     * @param _relayer Authorized relayer address
     * @param _tokensPerRequest BKC amount per claim (wei)
     * @param _ethPerRequest ETH amount per claim (wei)
     */
    function initialize(
        address _bkcToken,
        address _relayer,
        uint256 _tokensPerRequest,
        uint256 _ethPerRequest
    ) external initializer {
        if (_bkcToken == address(0)) revert ZeroAddress();
        if (_relayer == address(0)) revert ZeroAddress();

        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        bkcToken = IERC20Upgradeable(_bkcToken);
        relayerAddress = _relayer;
        tokensPerRequest = _tokensPerRequest;
        ethPerRequest = _ethPerRequest;
        cooldownPeriod = 1 hours;
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                        DISTRIBUTION FUNCTIONS
    // =========================================================================

    /**
     * @notice Distributes BKC and ETH to a recipient
     * @dev Only callable by authorized relayer
     * @param _recipient Address to receive tokens
     */
    function distributeTo(address _recipient) external nonReentrant {
        if (paused) revert FaucetPaused();
        if (msg.sender != relayerAddress) revert UnauthorizedRelayer();
        if (_recipient == address(0)) revert ZeroAddress();

        _distribute(_recipient);
    }

    /**
     * @notice Distributes to multiple recipients in one transaction
     * @dev Gas efficient batch distribution
     * @param _recipients Array of recipient addresses
     */
    function distributeToBatch(address[] calldata _recipients) external nonReentrant {
        if (paused) revert FaucetPaused();
        if (msg.sender != relayerAddress) revert UnauthorizedRelayer();

        uint256 length = _recipients.length;
        for (uint256 i = 0; i < length;) {
            if (_recipients[i] != address(0)) {
                // Skip cooldown check failures silently in batch
                if (_canClaimInternal(_recipients[i])) {
                    _distribute(_recipients[i]);
                }
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Owner can distribute without cooldown (for testing)
     * @param _recipient Address to receive tokens
     */
    function ownerDistribute(address _recipient) external onlyOwner nonReentrant {
        if (_recipient == address(0)) revert ZeroAddress();
        _distributeWithoutCooldown(_recipient);
    }

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Updates the relayer address
     * @param _newRelayer New relayer address
     */
    function setRelayer(address _newRelayer) external onlyOwner {
        if (_newRelayer == address(0)) revert ZeroAddress();

        address previousRelayer = relayerAddress;
        relayerAddress = _newRelayer;

        emit RelayerUpdated(previousRelayer, _newRelayer);
    }

    /**
     * @notice Updates distribution amounts
     * @param _tokensPerRequest New BKC amount per claim
     * @param _ethPerRequest New ETH amount per claim
     */
    function setAmounts(
        uint256 _tokensPerRequest,
        uint256 _ethPerRequest
    ) external onlyOwner {
        uint256 prevTokens = tokensPerRequest;
        uint256 prevEth = ethPerRequest;

        tokensPerRequest = _tokensPerRequest;
        ethPerRequest = _ethPerRequest;

        emit AmountsUpdated(prevTokens, _tokensPerRequest, prevEth, _ethPerRequest);
    }

    /**
     * @notice Updates cooldown period
     * @param _newCooldown New cooldown in seconds
     */
    function setCooldown(uint256 _newCooldown) external onlyOwner {
        uint256 previousCooldown = cooldownPeriod;
        cooldownPeriod = _newCooldown;

        emit CooldownUpdated(previousCooldown, _newCooldown);
    }

    /**
     * @notice Pauses or unpauses the faucet
     * @param _paused True to pause, false to unpause
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PauseStatusChanged(_paused);
    }

    /**
     * @notice Resets cooldown for a specific user
     * @param _user User address to reset
     */
    function resetUserCooldown(address _user) external onlyOwner {
        lastRequestTime[_user] = 0;
    }

    /**
     * @notice Batch reset cooldowns
     * @param _users Array of user addresses
     */
    function resetUserCooldownBatch(address[] calldata _users) external onlyOwner {
        uint256 length = _users.length;
        for (uint256 i = 0; i < length;) {
            lastRequestTime[_users[i]] = 0;
            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                       FUNDING & WITHDRAWAL
    // =========================================================================

    /**
     * @notice Receives ETH deposits
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, 0);
    }

    /**
     * @notice Deposits BKC tokens to faucet
     * @param _amount Amount to deposit
     */
    function depositTokens(uint256 _amount) external {
        if (_amount == 0) revert ZeroAmount();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit FundsDeposited(msg.sender, 0, _amount);
    }

    /**
     * @notice Emergency withdrawal of all funds
     */
    function emergencyWithdrawAll() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = bkcToken.balanceOf(address(this));

        if (tokenBalance > 0) {
            bkcToken.safeTransfer(owner(), tokenBalance);
        }

        if (ethBalance > 0) {
            (bool success,) = owner().call{value: ethBalance}("");
            if (!success) revert TransferFailed();
        }

        emit EmergencyWithdrawal(owner(), ethBalance, tokenBalance);
    }

    /**
     * @notice Withdraws specific amount of ETH
     * @param _amount Amount to withdraw
     */
    function withdrawETH(uint256 _amount) external onlyOwner {
        if (_amount > address(this).balance) {
            revert InsufficientEthBalance(address(this).balance, _amount);
        }

        (bool success,) = owner().call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit EmergencyWithdrawal(owner(), _amount, 0);
    }

    /**
     * @notice Withdraws specific amount of BKC
     * @param _amount Amount to withdraw
     */
    function withdrawTokens(uint256 _amount) external onlyOwner {
        uint256 balance = bkcToken.balanceOf(address(this));
        if (_amount > balance) {
            revert InsufficientTokenBalance(balance, _amount);
        }

        bkcToken.safeTransfer(owner(), _amount);

        emit EmergencyWithdrawal(owner(), 0, _amount);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns remaining cooldown for a user
     * @param _user User address
     * @return Seconds remaining (0 if can claim)
     */
    function getCooldownRemaining(address _user) external view returns (uint256) {
        uint256 lastClaim = lastRequestTime[_user];
        if (lastClaim == 0) return 0;

        uint256 elapsed = block.timestamp - lastClaim;
        if (elapsed >= cooldownPeriod) return 0;

        return cooldownPeriod - elapsed;
    }

    /**
     * @notice Checks if user can claim
     * @param _user User address
     * @return True if eligible to claim
     */
    function canClaim(address _user) external view returns (bool) {
        return _canClaimInternal(_user);
    }

    /**
     * @notice Returns next claim timestamp for user
     * @param _user User address
     * @return Timestamp when user can claim next
     */
    function getNextClaimTime(address _user) external view returns (uint256) {
        uint256 lastClaim = lastRequestTime[_user];
        if (lastClaim == 0) return block.timestamp;

        uint256 nextClaim = lastClaim + cooldownPeriod;
        return nextClaim > block.timestamp ? nextClaim : block.timestamp;
    }

    /**
     * @notice Returns faucet balance information
     * @return ethBalance Current ETH balance
     * @return tokenBalance Current BKC balance
     * @return ethPerClaim ETH given per claim
     * @return tokensPerClaim BKC given per claim
     * @return estimatedEthClaims Number of claims possible with current ETH
     * @return estimatedTokenClaims Number of claims possible with current BKC
     */
    function getFaucetStatus() external view returns (
        uint256 ethBalance,
        uint256 tokenBalance,
        uint256 ethPerClaim,
        uint256 tokensPerClaim,
        uint256 estimatedEthClaims,
        uint256 estimatedTokenClaims
    ) {
        ethBalance = address(this).balance;
        tokenBalance = bkcToken.balanceOf(address(this));
        ethPerClaim = ethPerRequest;
        tokensPerClaim = tokensPerRequest;

        estimatedEthClaims = ethPerRequest > 0 ? ethBalance / ethPerRequest : type(uint256).max;
        estimatedTokenClaims = tokensPerRequest > 0 ? tokenBalance / tokensPerRequest : type(uint256).max;
    }

    /**
     * @notice Returns distribution statistics
     * @return totalTokens Total BKC distributed
     * @return totalEth Total ETH distributed
     * @return uniqueUsers Total unique users
     * @return distributions Total distribution count
     */
    function getDistributionStats() external view returns (
        uint256 totalTokens,
        uint256 totalEth,
        uint256 uniqueUsers,
        uint256 distributions
    ) {
        return (
            totalTokensDistributed,
            totalEthDistributed,
            totalUniqueUsers,
            totalDistributions
        );
    }

    /**
     * @notice Returns user claim history
     * @param _user User address
     * @return lastClaim Timestamp of last claim
     * @return claimCount Total claims by user
     * @return canClaimNow Whether user can claim now
     * @return cooldownLeft Seconds until next claim
     */
    function getUserInfo(address _user) external view returns (
        uint256 lastClaim,
        uint256 claimCount,
        bool canClaimNow,
        uint256 cooldownLeft
    ) {
        lastClaim = lastRequestTime[_user];
        claimCount = userClaimCount[_user];
        canClaimNow = _canClaimInternal(_user);

        if (lastClaim == 0) {
            cooldownLeft = 0;
        } else {
            uint256 elapsed = block.timestamp - lastClaim;
            cooldownLeft = elapsed >= cooldownPeriod ? 0 : cooldownPeriod - elapsed;
        }
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Internal distribution logic with cooldown check
     */
    function _distribute(address _recipient) internal {
        // Check cooldown
        uint256 lastClaim = lastRequestTime[_recipient];
        if (lastClaim > 0) {
            uint256 elapsed = block.timestamp - lastClaim;
            if (elapsed < cooldownPeriod) {
                revert CooldownActive(cooldownPeriod - elapsed);
            }
        }

        _executeDistribution(_recipient);
    }

    /**
     * @dev Internal distribution without cooldown (owner only)
     */
    function _distributeWithoutCooldown(address _recipient) internal {
        _executeDistribution(_recipient);
    }

    /**
     * @dev Executes the actual token/ETH transfer
     */
    function _executeDistribution(address _recipient) internal {
        // Check balances
        uint256 tokenBalance = bkcToken.balanceOf(address(this));
        if (tokenBalance < tokensPerRequest) {
            revert InsufficientTokenBalance(tokenBalance, tokensPerRequest);
        }

        uint256 ethBalance = address(this).balance;
        if (ethBalance < ethPerRequest) {
            revert InsufficientEthBalance(ethBalance, ethPerRequest);
        }

        // Track first-time users
        if (userClaimCount[_recipient] == 0) {
            totalUniqueUsers++;
        }

        // Update state
        lastRequestTime[_recipient] = block.timestamp;
        userClaimCount[_recipient]++;
        totalDistributions++;
        totalTokensDistributed += tokensPerRequest;
        totalEthDistributed += ethPerRequest;

        // Transfer BKC
        bkcToken.safeTransfer(_recipient, tokensPerRequest);

        // Transfer ETH
        if (ethPerRequest > 0) {
            (bool success,) = _recipient.call{value: ethPerRequest}("");
            if (!success) revert TransferFailed();
        }

        emit TokensDistributed(
            _recipient,
            tokensPerRequest,
            ethPerRequest,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Internal cooldown check
     */
    function _canClaimInternal(address _user) internal view returns (bool) {
        if (paused) return false;

        uint256 lastClaim = lastRequestTime[_user];
        if (lastClaim == 0) return true;

        return (block.timestamp - lastClaim) >= cooldownPeriod;
    }
}
