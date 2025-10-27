// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IDelegationManager
 * @dev Interface para consultar o pStake do usuário no DelegationManager.
 */
interface IDelegationManager {
    /**
     * @notice Retorna o pStake total de um usuário.
     * @dev O pStake já é um número "redondo" (tokens * dias), sem as 18 casas decimais.
     */
    function userTotalPStake(address _user) external view returns (uint256);
}

/**
 * @title IRewardBoosterNFT
 * @dev Interface para verificar o Booster NFT de um usuário.
 */
interface IRewardBoosterNFT {
    /**
     * @notice Retorna o dono de um tokenId específico.
     * @dev Usado para verificar se o usuário realmente possui o "cupom" de desconto.
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice Retorna o valor em Bips do booster (ex: 5000 para Diamond).
     * @dev Usado como chave para o mapeamento de descontos.
     */
    function boostBips(uint256 tokenId) external view returns (uint256);
}

/**
 * @title EcosystemManager
 * @dev Contrato "Hub" que gerencia todas as regras de negócios do ecossistema.
 * @notice Este contrato centraliza:
 * 1. O registro de endereços de contratos (Tesouraria, DM, etc.).
 * 2. O registro de taxas de serviço ajustáveis (ex: "NOTARY_FEE").
 * 3. O registro de requisitos mínimos de pStake ajustáveis.
 * 4. A lógica de desconto dos Booster NFTs.
 */
contract EcosystemManager is Ownable {

    // --- 1. REGISTRO DE ENDEREÇOS ---
    address public bkcTokenAddress;
    address public treasuryWallet;
    address public delegationManagerAddress;
    address public rewardBoosterAddress;
    // (Pode adicionar mais endereços aqui, ex: rewardManagerAddress)

    // --- 2. REGISTRO DE TAXAS (AJUSTÁVEL) ---
    // Mapeia uma chave de string (ex: "NOTARY_FEE") para uma taxa (em BKC com 18 decimais)
    mapping(string => uint256) public serviceFees;

    // --- 3. REGISTRO DE PSTAKE MÍNIMO (AJUSTÁVEL) ---
    // Mapeia uma chave de string (ex: "NOTARY_SERVICE") para um pStake mínimo
    mapping(string => uint256) public servicePStakeMinimums;

    // --- 4. REGISTRO DE DESCONTOS (BOOSTER) ---
    // Mapeia o "boostBips" do NFT (ex: 5000) para os "bips de desconto" (ex: 1000 = 10% de desconto)
    mapping(uint256 => uint256) public boosterDiscountsBips;

    // --- EVENTOS (Para seus scripts/frontend) ---
    event AddressesSet(
        address treasury,
        address delegationManager,
        address rewardBooster
    );
    event FeeSet(string indexed serviceKey, uint256 newFee);
    event PStakeMinimumSet(string indexed serviceKey, uint256 newPStake);
    event DiscountSet(uint256 indexed boostBips, uint256 newDiscountBips);

    /**
     * @dev Define o dono inicial.
     */
    constructor(address _initialOwner) Ownable(_initialOwner) {}

    // --- 5. FUNÇÕES DE ADMIN (Para seus scripts) ---

    /**
     * @notice (Owner) Define os endereços centrais do ecossistema.
     */
    function setAddresses(
        address _token,
        address _treasury,
        address _delegationManager,
        address _rewardBooster
    ) external onlyOwner {
        require(
            _token != address(0) &&
            _treasury != address(0) &&
            _delegationManager != address(0) &&
            _rewardBooster != address(0),
            "Ecosystem: Endereços não podem ser zero"
        );
        bkcTokenAddress = _token;
        treasuryWallet = _treasury;
        delegationManagerAddress = _delegationManager;
        rewardBoosterAddress = _rewardBooster;

        emit AddressesSet(_treasury, _delegationManager, _rewardBooster);
    }

    /**
     * @notice (Owner) Define a taxa para um serviço.
     * @param _serviceKey A chave do serviço (ex: "NOTARY_FEE").
     * @param _fee O valor da taxa em Wei (ex: 100 * 10**18 para 100 BKC).
     */
    function setFee(string calldata _serviceKey, uint256 _fee) external onlyOwner {
        serviceFees[_serviceKey] = _fee;
        emit FeeSet(_serviceKey, _fee);
    }

    /**
     * @notice (Owner) Define o pStake mínimo para usar um serviço.
     * @param _serviceKey A chave do serviço (ex: "NOTARY_SERVICE").
     * @param _pStake O pStake mínimo necessário (ex: 10000).
     */
    function setPStakeMinimum(
        string calldata _serviceKey,
        uint256 _pStake
    ) external onlyOwner {
        servicePStakeMinimums[_serviceKey] = _pStake;
        emit PStakeMinimumSet(_serviceKey, _pStake);
    }

    /**
     * @notice (Owner) Define o desconto para um tier de booster.
     * @param _boostBips O tier do booster (ex: 5000 para Diamond).
     * @param _discountBips O desconto em BIPS (ex: 1000 para 10%).
     */
    function setBoosterDiscount(
        uint256 _boostBips,
        uint256 _discountBips
    ) external onlyOwner {
        require(_discountBips <= 10000, "Ecosystem: Desconto não pode ser > 10000 BIPS");
        boosterDiscountsBips[_boostBips] = _discountBips;
        emit DiscountSet(_boostBips, _discountBips);
    }

    // --- 6. FUNÇÃO DE AUTORIZAÇÃO (O "Master Check") ---

    /**
     * @notice Verifica se um usuário está autorizado a usar um serviço e retorna a taxa final.
     * @dev Esta é a função principal que os "Spokes" (outros contratos) irão chamar.
     * @dev Ela verifica o pStake e aplica o desconto do booster.
     * @param _serviceKey A chave do serviço (ex: "NOTARY_FEE").
     * @param _user O endereço do usuário que está tentando usar o serviço.
     * @param _boosterTokenId O ID do NFT de booster que o usuário (via frontend)
     * declarou usar. Envie 0 se ele não tiver ou não quiser usar.
     * @return finalFee A taxa final em Wei (com desconto aplicado, se houver).
     */
    function authorizeService(
        string calldata _serviceKey,
        address _user,
        uint256 _boosterTokenId
    ) external view returns (uint256 finalFee) {
        
        // --- A. VERIFICAÇÃO DE PSTAKE (Sua Nova Regra) ---
        uint256 minPStake = servicePStakeMinimums[_serviceKey];
        if (minPStake > 0) {
            require(delegationManagerAddress != address(0), "Ecosystem: DM não configurado");
            
            // 1. Consulta o pStake do usuário
            uint256 userPStake = IDelegationManager(delegationManagerAddress)
                .userTotalPStake(_user);
            
            // 2. Reverte se for insuficiente (o frontend irá capturar isso)
            require(userPStake >= minPStake, "Ecosystem: pStake insuficiente para este servico");
        }

        // --- B. CÁLCULO DA TAXA FINAL (Com Desconto) ---
        uint256 baseFee = serviceFees[_serviceKey];
        finalFee = baseFee; // Taxa padrão

        // Se o usuário forneceu um ID de booster (cupom)
        if (_boosterTokenId > 0 && rewardBoosterAddress != address(0)) {
            IRewardBoosterNFT booster = IRewardBoosterNFT(rewardBoosterAddress);
            
            // 1. Verifica se o usuário é realmente o dono do NFT
            if (booster.ownerOf(_boosterTokenId) == _user) {
                
                // 2. Pega o tier (boostBips) desse NFT
                uint256 boostBips = booster.boostBips(_boosterTokenId);
                
                // 3. Pega o desconto configurado para esse tier
                uint256 discountBips = boosterDiscountsBips[boostBips];

                if (discountBips > 0) {
                    uint256 discountAmount = (baseFee * discountBips) / 10000;
                    finalFee = baseFee - discountAmount;
                }
                // Se finalFee > baseFee (underflow), reverte.
                // Mas com o require no setBoosterDiscount, isso não deve acontecer.
            }
            // Se ele não for o dono, a taxa `finalFee` permanece a `baseFee`.
        }
        
        return finalFee;
    }

    // --- 7. FUNÇÕES DE CONSULTA (Para o Frontend) ---

    /**
     * @notice Retorna os requisitos de um serviço para o frontend.
     * @dev O frontend usa isso para mostrar ao usuário (ex: "pStake mínimo: 10000").
     */
    function getServiceRequirements(
        string calldata _serviceKey
    ) external view returns (uint256 fee, uint256 pStake) {
        return (serviceFees[_serviceKey], servicePStakeMinimums[_serviceKey]);
    }

    /**
     * @notice Retorna o desconto de um tier de booster.
     */
    function getBoosterDiscount(
        uint256 _boostBips
    ) external view returns (uint256) {
        return boosterDiscountsBips[_boostBips];
    }
    
    // Getters para os endereços (para os "Spokes" usarem)
    function getTreasuryAddress() external view returns (address) {
        return treasuryWallet;
    }
    function getDelegationManagerAddress() external view returns (address) {
        return delegationManagerAddress;
    }
    function getBKCTokenAddress() external view returns (address) {
        return bkcTokenAddress;
    }
}