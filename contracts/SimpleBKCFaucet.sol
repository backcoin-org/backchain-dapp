// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SimpleBKCFaucet V3 (Production)
 * @notice Distributes ERC20 tokens + Native ETH to users via Oracle/Relayer.
 * @dev UUPS Upgradeable implementation.
 */
contract SimpleBKCFaucet is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // --- State Variables ---
    IERC20Upgradeable public bkcToken;
    address public relayerAddress; // The Oracle/Indexer wallet
    
    uint256 public tokensPerRequest;  
    uint256 public ethPerRequest;     
    uint256 public cooldownPeriod;    
    
    mapping(address => uint256) public lastRequestTime;
    
    // --- Events ---
    event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer);
    event RelayerSet(address indexed relayer);
    event AmountsUpdated(uint256 newTokenAmount, uint256 newEthAmount);
    event FundsDeposited(address indexed sender, uint256 ethAmount, uint256 tokenAmount);
    event CooldownUpdated(uint256 newCooldown);

    // --- Custom Errors (Gas Efficient) ---
    error CooldownActive(uint256 timeRemaining);
    error InsufficientContractTokens();
    error InsufficientContractETH();
    error Unauthorized();
    error InvalidAddress();
    error TransferFailed();
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the proxy state (Replaces constructor)
     * @param _bkcToken Address of the ERC20 token
     * @param _relayer Address of the Oracle/Indexer
     * @param _tokensPerRequest Amount of BKC to give (in Wei)
     * @param _ethPerRequest Amount of ETH to give (in Wei)
     */
    function initialize(
        address _bkcToken,
        address _relayer,
        uint256 _tokensPerRequest,
        uint256 _ethPerRequest
    ) public initializer {
        if (_bkcToken == address(0)) revert InvalidAddress();
        if (_relayer == address(0)) revert InvalidAddress();

        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        bkcToken = IERC20Upgradeable(_bkcToken);
        relayerAddress = _relayer;
        tokensPerRequest = _tokensPerRequest;
        ethPerRequest = _ethPerRequest;
        cooldownPeriod = 1 hours; // Default cooldown
    }

    /**
     * @dev Required by UUPS pattern to authorize upgrades.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ========================================================================
    // 🚀 CORE FUNCTIONALITY
    // ========================================================================

    /**
     * @notice Distributes BKC + ETH to the recipient.
     * @dev Called by the Relayer (Oracle) who pays the gas.
     */
    function distributeTo(address _recipient) external nonReentrant {
        if (msg.sender != relayerAddress) revert Unauthorized();
        if (_recipient == address(0)) revert InvalidAddress();
        
        // 1. Check Cooldown
        uint256 timeSinceLastRequest = block.timestamp - lastRequestTime[_recipient];
        if (timeSinceLastRequest < cooldownPeriod) {
            revert CooldownActive(cooldownPeriod - timeSinceLastRequest);
        }
        
        // 2. Check Contract Balances
        uint256 contractTokenBalance = bkcToken.balanceOf(address(this));
        if (contractTokenBalance < tokensPerRequest) {
            revert InsufficientContractTokens();
        }
        
        uint256 contractEthBalance = address(this).balance;
        if (contractEthBalance < ethPerRequest) {
            revert InsufficientContractETH();
        }
        
        // 3. Update State
        lastRequestTime[_recipient] = block.timestamp;
        
        // 4. Transfer BKC
        bool tokenSuccess = bkcToken.transfer(_recipient, tokensPerRequest);
        if (!tokenSuccess) revert TransferFailed();
        
        // 5. Transfer ETH
        (bool ethSuccess, ) = _recipient.call{value: ethPerRequest}("");
        if (!ethSuccess) revert TransferFailed();
        
        emit TokensDistributed(_recipient, tokensPerRequest, ethPerRequest, msg.sender);
    }
    
    // ========================================================================
    // ⚙️ ADMIN FUNCTIONS (Dynamic Updates)
    // ========================================================================

    /**
     * @notice Updates the Relayer/Oracle address.
     */
    function setRelayer(address _newRelayer) external onlyOwner {
        if (_newRelayer == address(0)) revert InvalidAddress();
        relayerAddress = _newRelayer;
        emit RelayerSet(_newRelayer);
    }
    
    /**
     * @notice Updates distribution amounts instantly.
     */
    function setAmounts(uint256 _tokensPerRequest, uint256 _ethPerRequest) external onlyOwner {
        tokensPerRequest = _tokensPerRequest;
        ethPerRequest = _ethPerRequest;
        emit AmountsUpdated(_tokensPerRequest, _ethPerRequest);
    }
    
    /**
     * @notice Updates cooldown period (in seconds).
     */
    function setCooldown(uint256 _newCooldown) external onlyOwner {
        cooldownPeriod = _newCooldown;
        emit CooldownUpdated(_newCooldown);
    }

    // ========================================================================
    // 💰 FUNDING & WITHDRAWAL
    // ========================================================================

    /**
     * @notice Allows anyone to fund the contract with ETH.
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, 0);
    }
    
    /**
     * @notice Allows funding with BKC (requires approval).
     */
    function depositTokens(uint256 _amount) external {
        bool success = bkcToken.transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TransferFailed();
        emit FundsDeposited(msg.sender, 0, _amount);
    }
    
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    function emergencyWithdrawTokens(uint256 _amount) external onlyOwner {
        bool success = bkcToken.transfer(owner(), _amount);
        if (!success) revert TransferFailed();
    }
    
    // ========================================================================
    // 🔍 VIEW FUNCTIONS
    // ========================================================================

    function getCooldownRemaining(address _user) external view returns (uint256) {
        uint256 timeSinceLastRequest = block.timestamp - lastRequestTime[_user];
        if (timeSinceLastRequest >= cooldownPeriod) {
            return 0;
        }
        return cooldownPeriod - timeSinceLastRequest;
    }
    
    function canClaim(address _user) external view returns (bool) {
        uint256 timeSinceLastRequest = block.timestamp - lastRequestTime[_user];
        return timeSinceLastRequest >= cooldownPeriod;
    }
}