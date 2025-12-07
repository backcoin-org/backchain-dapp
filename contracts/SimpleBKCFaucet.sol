// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Simple BKC Faucet (Relayer Mode)
 * @notice Stores ETH and BKC to distribute to users via a Relayer (Backend).
 * @dev The Backend pays the gas fees. The user receives assets.
 */
contract SimpleBKCFaucet is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable public token;
    
    // Configurações (Ajustáveis pelo Owner)
    uint256 public claimAmountToken; // Ex: 20 BKC
    uint256 public claimAmountEth;   // Ex: 0.005 ETH
    uint256 public cooldownTime;     // Ex: 1 hora

    // Controle de tempo por usuário
    mapping(address => uint256) public lastClaimTime;

    // Eventos
    event FaucetDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount);
    event ContractRefueled(address indexed donor, uint256 amount);
    event ConfigUpdated(uint256 newTokenAmount, uint256 newEthAmount, uint256 newCooldown);

    // Erros
    error CooldownActive(uint256 nextTry);
    error InsufficientContractETH();
    error InsufficientContractTokens();
    error TransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _tokenAddress,
        address _initialOwner
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        token = IERC20Upgradeable(_tokenAddress);
        _transferOwnership(_initialOwner);

        // Valores Padrão (Ajuste conforme necessário)
        claimAmountToken = 20 * 10**18; // 20 BKC
        claimAmountEth = 0.005 ether;   // 0.005 ETH
        cooldownTime = 1 hours;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Função principal chamada pelo seu BACKEND.
     * @dev O Backend paga o gas desta transação.
     * @param _recipient O endereço do usuário que vai receber os fundos.
     */
    function distributeTo(address _recipient) external onlyOwner nonReentrant {
        // 1. Validar Cooldown
        if (block.timestamp < lastClaimTime[_recipient] + cooldownTime) {
            revert CooldownActive(lastClaimTime[_recipient] + cooldownTime);
        }

        // 2. Validar Saldos do Contrato
        if (address(this).balance < claimAmountEth) revert InsufficientContractETH();
        if (token.balanceOf(address(this)) < claimAmountToken) revert InsufficientContractTokens();

        // 3. Atualizar Tempo
        lastClaimTime[_recipient] = block.timestamp;

        // 4. Transferir Token (BKC)
        token.safeTransfer(_recipient, claimAmountToken);

        // 5. Transferir ETH Nativo (Gas)
        (bool success, ) = _recipient.call{value: claimAmountEth}("");
        if (!success) revert TransferFailed();

        emit FaucetDistributed(_recipient, claimAmountToken, claimAmountEth);
    }

    // --- Admin ---

    function setConfig(uint256 _tokens, uint256 _eth, uint256 _cooldown) external onlyOwner {
        claimAmountToken = _tokens;
        claimAmountEth = _eth;
        cooldownTime = _cooldown;
        emit ConfigUpdated(_tokens, _eth, _cooldown);
    }

    function withdrawEverything() external onlyOwner {
        uint256 ethBal = address(this).balance;
        uint256 tokenBal = token.balanceOf(address(this));
        if (tokenBal > 0) token.safeTransfer(owner(), tokenBal);
        if (ethBal > 0) {
            (bool s, ) = owner().call{value: ethBal}("");
            require(s, "ETH Transfer failed");
        }
    }

    // Aceita depósitos de ETH para recarregar o Faucet
    receive() external payable {
        emit ContractRefueled(msg.sender, msg.value);
    }
}