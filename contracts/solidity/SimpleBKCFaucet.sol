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
 *  Contract    : SimpleBKCFaucet
 *  Version     : 2.0.0
 *  Network     : Arbitrum Sepolia (Testnet)
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
 *  Testnet faucet for distributing BKC tokens and native ETH.
 *  Implements relayer-based distribution for gas-efficient claims.
 *
 *  Flow:
 *  1. User requests tokens via off-chain interface (website/bot)
 *  2. Relayer verifies request and eligibility
 *  3. Relayer calls distributeTo() paying gas on behalf of user
 *  4. User receives BKC + ETH for future transactions
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./TimelockUpgradeable.sol";

contract SimpleBKCFaucet is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    TimelockUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // =========================================================================
    //                              STATE
    // =========================================================================

    IERC20Upgradeable public bkcToken;

    address public relayerAddress;

    uint256 public tokensPerRequest;

    uint256 public ethPerRequest;

    uint256 public cooldownPeriod;

    mapping(address => uint256) public lastRequestTime;

    mapping(address => uint256) public userClaimCount;

    uint256 public totalTokensDistributed;

    uint256 public totalEthDistributed;

    uint256 public totalUniqueUsers;

    uint256 public totalDistributions;

    bool public paused;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[40] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event TokensDistributed(
        address indexed recipient,
        uint256 tokenAmount,
        uint256 ethAmount,
        address indexed relayer,
        uint256 timestamp
    );

    event RelayerUpdated(
        address indexed previousRelayer,
        address indexed newRelayer
    );

    event AmountsUpdated(
        uint256 previousTokenAmount,
        uint256 newTokenAmount,
        uint256 previousEthAmount,
        uint256 newEthAmount
    );

    event CooldownUpdated(
        uint256 previousCooldown,
        uint256 newCooldown
    );

    event FundsDeposited(
        address indexed sender,
        uint256 ethAmount,
        uint256 tokenAmount
    );

    event EmergencyWithdrawal(
        address indexed to,
        uint256 ethAmount,
        uint256 tokenAmount
    );

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

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    // =========================================================================
    //                        DISTRIBUTION FUNCTIONS
    // =========================================================================

    function distributeTo(address _recipient) external nonReentrant {
        if (paused) revert FaucetPaused();
        if (msg.sender != relayerAddress) revert UnauthorizedRelayer();
        if (_recipient == address(0)) revert ZeroAddress();

        _distribute(_recipient);
    }

    function distributeToBatch(address[] calldata _recipients) external nonReentrant {
        if (paused) revert FaucetPaused();
        if (msg.sender != relayerAddress) revert UnauthorizedRelayer();

        uint256 length = _recipients.length;
        for (uint256 i; i < length;) {
            if (_recipients[i] != address(0)) {
                if (_canClaimInternal(_recipients[i])) {
                    _distribute(_recipients[i]);
                }
            }
            unchecked { ++i; }
        }
    }

    function ownerDistribute(address _recipient) external onlyOwner nonReentrant {
        if (_recipient == address(0)) revert ZeroAddress();
        _distributeWithoutCooldown(_recipient);
    }

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    function setRelayer(address _newRelayer) external onlyOwner {
        if (_newRelayer == address(0)) revert ZeroAddress();

        address previousRelayer = relayerAddress;
        relayerAddress = _newRelayer;

        emit RelayerUpdated(previousRelayer, _newRelayer);
    }

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

    function setCooldown(uint256 _newCooldown) external onlyOwner {
        uint256 previousCooldown = cooldownPeriod;
        cooldownPeriod = _newCooldown;

        emit CooldownUpdated(previousCooldown, _newCooldown);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PauseStatusChanged(_paused);
    }

    function resetUserCooldown(address _user) external onlyOwner {
        lastRequestTime[_user] = 0;
    }

    function resetUserCooldownBatch(address[] calldata _users) external onlyOwner {
        uint256 length = _users.length;
        for (uint256 i; i < length;) {
            lastRequestTime[_users[i]] = 0;
            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                       FUNDING & WITHDRAWAL
    // =========================================================================

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, 0);
    }

    function depositTokens(uint256 _amount) external {
        if (_amount == 0) revert ZeroAmount();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit FundsDeposited(msg.sender, 0, _amount);
    }

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

    function withdrawETH(uint256 _amount) external onlyOwner {
        if (_amount > address(this).balance) {
            revert InsufficientEthBalance(address(this).balance, _amount);
        }

        (bool success,) = owner().call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit EmergencyWithdrawal(owner(), _amount, 0);
    }

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

    function getCooldownRemaining(address _user) external view returns (uint256) {
        uint256 lastClaim = lastRequestTime[_user];
        if (lastClaim == 0) return 0;

        uint256 elapsed = block.timestamp - lastClaim;
        if (elapsed >= cooldownPeriod) return 0;

        return cooldownPeriod - elapsed;
    }

    function canClaim(address _user) external view returns (bool) {
        return _canClaimInternal(_user);
    }

    function getNextClaimTime(address _user) external view returns (uint256) {
        uint256 lastClaim = lastRequestTime[_user];
        if (lastClaim == 0) return block.timestamp;

        uint256 nextClaim = lastClaim + cooldownPeriod;
        return nextClaim > block.timestamp ? nextClaim : block.timestamp;
    }

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

    function _distribute(address _recipient) internal {
        uint256 lastClaim = lastRequestTime[_recipient];
        if (lastClaim > 0) {
            uint256 elapsed = block.timestamp - lastClaim;
            if (elapsed < cooldownPeriod) {
                revert CooldownActive(cooldownPeriod - elapsed);
            }
        }

        _executeDistribution(_recipient);
    }

    function _distributeWithoutCooldown(address _recipient) internal {
        _executeDistribution(_recipient);
    }

    function _executeDistribution(address _recipient) internal {
        uint256 tokenBalance = bkcToken.balanceOf(address(this));
        if (tokenBalance < tokensPerRequest) {
            revert InsufficientTokenBalance(tokenBalance, tokensPerRequest);
        }

        uint256 ethBalance = address(this).balance;
        if (ethBalance < ethPerRequest) {
            revert InsufficientEthBalance(ethBalance, ethPerRequest);
        }

        if (userClaimCount[_recipient] == 0) {
            totalUniqueUsers++;
        }

        lastRequestTime[_recipient] = block.timestamp;
        userClaimCount[_recipient]++;
        totalDistributions++;
        totalTokensDistributed += tokensPerRequest;
        totalEthDistributed += ethPerRequest;

        bkcToken.safeTransfer(_recipient, tokensPerRequest);

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

    function _canClaimInternal(address _user) internal view returns (bool) {
        if (paused) return false;

        uint256 lastClaim = lastRequestTime[_user];
        if (lastClaim == 0) return true;

        return (block.timestamp - lastClaim) >= cooldownPeriod;
    }
}
