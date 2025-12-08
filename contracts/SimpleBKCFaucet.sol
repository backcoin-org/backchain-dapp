// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleBKCFaucet V2
 * @notice Oracle paga o claim e distribui BKC + ETH para o usuário
 */
contract SimpleBKCFaucet is Ownable, ReentrancyGuard {
    
    IERC20 public bkcToken;
    address public relayerAddress; // Oracle address
    
    uint256 public tokensPerRequest;  // BKC a distribuir
    uint256 public ethPerRequest;     // ETH a distribuir (0.008 ETH)
    uint256 public cooldownPeriod;    // 1 hora
    
    mapping(address => uint256) public lastRequestTime;
    
    event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer);
    event RelayerSet(address indexed relayer);
    event AmountsUpdated(uint256 newTokenAmount, uint256 newEthAmount);
    event FundsDeposited(address indexed sender, uint256 ethAmount, uint256 tokenAmount);
    
    error CooldownActive(uint256 timeRemaining);
    error InsufficientContractTokens();
    error InsufficientContractETH();
    error Unauthorized();
    error InvalidAddress();
    error TransferFailed();
    
    constructor(
        address _bkcToken,
        address _relayer,
        uint256 _tokensPerRequest,
        uint256 _ethPerRequest
    ) {
        if (_bkcToken == address(0)) revert InvalidAddress();
        if (_relayer == address(0)) revert InvalidAddress();
        
        bkcToken = IERC20(_bkcToken);
        relayerAddress = _relayer;
        tokensPerRequest = _tokensPerRequest;
        ethPerRequest = _ethPerRequest;
        cooldownPeriod = 1 hours;
    }
    
    /**
     * @notice Distribui BKC + ETH para o usuário
     * @dev Apenas relayer (oracle) pode chamar. Oracle paga o gas.
     * @param _recipient Endereço do usuário
     */
    function distributeTo(address _recipient) external nonReentrant {
        // Apenas relayer pode chamar
        if (msg.sender != relayerAddress) revert Unauthorized();
        if (_recipient == address(0)) revert InvalidAddress();
        
        // Verificar cooldown
        uint256 timeSinceLastRequest = block.timestamp - lastRequestTime[_recipient];
        if (timeSinceLastRequest < cooldownPeriod) {
            revert CooldownActive(cooldownPeriod - timeSinceLastRequest);
        }
        
        // Verificar saldos do contrato
        uint256 contractTokenBalance = bkcToken.balanceOf(address(this));
        if (contractTokenBalance < tokensPerRequest) {
            revert InsufficientContractTokens();
        }
        
        uint256 contractEthBalance = address(this).balance;
        if (contractEthBalance < ethPerRequest) {
            revert InsufficientContractETH();
        }
        
        // Atualizar timestamp
        lastRequestTime[_recipient] = block.timestamp;
        
        // Transferir BKC
        bool tokenSuccess = bkcToken.transfer(_recipient, tokensPerRequest);
        if (!tokenSuccess) revert TransferFailed();
        
        // Transferir ETH
        (bool ethSuccess, ) = _recipient.call{value: ethPerRequest}("");
        if (!ethSuccess) revert TransferFailed();
        
        emit TokensDistributed(_recipient, tokensPerRequest, ethPerRequest, msg.sender);
    }
    
    /**
     * @notice Permite que qualquer um deposite ETH no faucet
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, 0);
    }
    
    /**
     * @notice Owner pode depositar BKC
     */
    function depositTokens(uint256 _amount) external {
        bool success = bkcToken.transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TransferFailed();
        emit FundsDeposited(msg.sender, 0, _amount);
    }
    
    /**
     * @notice Atualizar relayer (oracle)
     */
    function setRelayer(address _newRelayer) external onlyOwner {
        if (_newRelayer == address(0)) revert InvalidAddress();
        relayerAddress = _newRelayer;
        emit RelayerSet(_newRelayer);
    }
    
    /**
     * @notice Atualizar quantidades distribuídas
     */
    function setAmounts(uint256 _tokensPerRequest, uint256 _ethPerRequest) external onlyOwner {
        tokensPerRequest = _tokensPerRequest;
        ethPerRequest = _ethPerRequest;
        emit AmountsUpdated(_tokensPerRequest, _ethPerRequest);
    }
    
    /**
     * @notice Atualizar cooldown
     */
    function setCooldown(uint256 _newCooldown) external onlyOwner {
        cooldownPeriod = _newCooldown;
    }
    
    /**
     * @notice Emergency withdraw (owner)
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    function emergencyWithdrawTokens(uint256 _amount) external onlyOwner {
        bool success = bkcToken.transfer(owner(), _amount);
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Verificar tempo restante de cooldown
     */
    function getCooldownRemaining(address _user) external view returns (uint256) {
        uint256 timeSinceLastRequest = block.timestamp - lastRequestTime[_user];
        if (timeSinceLastRequest >= cooldownPeriod) {
            return 0;
        }
        return cooldownPeriod - timeSinceLastRequest;
    }
    
    /**
     * @notice Verificar se usuário pode clamar
     */
    function canClaim(address _user) external view returns (bool) {
        uint256 timeSinceLastRequest = block.timestamp - lastRequestTime[_user];
        return timeSinceLastRequest >= cooldownPeriod;
    }
    
    /**
     * @notice Info do contrato
     */
    function getContractInfo() external view returns (
        uint256 tokenBalance,
        uint256 ethBalance,
        uint256 tokensPerDist,
        uint256 ethPerDist,
        uint256 cooldown,
        address relayer
    ) {
        return (
            bkcToken.balanceOf(address(this)),
            address(this).balance,
            tokensPerRequest,
            ethPerRequest,
            cooldownPeriod,
            relayerAddress
        );
    }
}
