// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol"; // Importa BKCToken
import "./EcosystemManager.sol";
// Importa Hub e suas interfaces (incluindo IDelegationManager)

// --- INTERFACE IRewardManager (MANUTIDA, pois é específica do jogo) ---

/**
 * @title IRewardManager
 * @dev Interface necessária para o TigerGame acionar a função de mineração específica.
 */
interface IRewardManager {
    function performGameMiningAndDistribution(uint256 _purchaseAmount) external;
    function setTigerGameAddress(address _gameAddress) external;
}


// A interface IDelegationManager FOI REMOVIDA para resolver o erro de compilação.
// Ela é acessada diretamente via IEcosystemManager(dm).depositRewards().
/**
 * @title FortuneTiger (TigerGame - Refatorado)
 * @dev Contrato refatorado para implementar o jogo de múltiplas piscinas de prêmios.
 * @notice V5: Implementa 10% de Taxa (5/5), 90% de Fundo de Prêmio, PoP Mining e Limite de Prêmio de 80% da Piscina.
 * @notice V6: Limite de Prêmio reduzido para 50% da Piscina.
 */
contract FortuneTiger is Ownable, ReentrancyGuard {

    IEcosystemManager public immutable ecosystemManager;
    BKCToken public immutable bkcToken;
    IRewardManager public immutable rewardManager; 

    // --- CONSTANTES DO JOGO E DISTRIBUIÇÃO ---
    uint256 public constant SERVICE_FEE_BIPS = 1000;
// 10% de taxa
    uint256 public constant PRIZE_POOL_SHARE_BIPS = 9000;
// 90% para as piscinas
    uint256 public constant TREASURY_FEE_BIPS = 500;
// 5% Tesouraria (50% da taxa)
    uint256 public constant DELEGATOR_FEE_BIPS = 500;
// 5% Delegadores (50% da taxa)
    uint256 public constant TOTAL_SHARE_BIPS = 10000;
// 100%
    
    // ======================= MODIFICAÇÃO (50%) =======================
    uint256 public constant MAX_PRIZE_POOL_BIPS = 5000;
// 50% LIMITE DE PAGAMENTO DA PISCINA (Original era 8000)
    // ===================== FIM DA MODIFICAÇÃO ======================


    // --- ESTRUTURA DE DADOS DAS PISCINAS ---
    struct PrizePool {
        uint256 multiplier;
// Ex: 10, 100, 1000
        uint256 chanceDenominator;
// Ex: 10, 100, 1000
        uint256 balance;
// Liquidez atual em BKC
        uint256 contributionShareBips;
// % do fundo de 90% (Ex: 8500, 1000, 500)
    }
    mapping(uint256 => PrizePool) public prizePools;
// 0, 1, 2, 3 para as 4 piscinas

    // --- EVENTOS ---
    event GamePlayed(address indexed user, uint256 amountWagered, uint256 totalPrizeWon);
//
    event PoolConfigured(uint256 indexed poolId, uint256 multiplier, uint256 contributionBips);
//

    // --- CONSTRUTOR ---
    constructor(
        address _ecosystemManager,
        address _bkcToken,
        address _rewardManager,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_ecosystemManager != address(0), "FT: Hub cannot be zero");
//
        ecosystemManager = IEcosystemManager(_ecosystemManager);
//

        require(_bkcToken != address(0), "FT: Token not configured in Hub");
        bkcToken = BKCToken(_bkcToken);
//
        require(_rewardManager != address(0), "FT: RewardManager cannot be zero");
        rewardManager = IRewardManager(_rewardManager);
//
    }
    
    // --- FUNÇÕES DE ADMINISTRAÇÃO ---
    
    /**
     * @notice (Owner) Configura as 4 piscinas de prêmios.
     * @dev O Owner DEVE chamar esta função com os novos valores (ex: 3, 10, 100, 1000)
     */
    function setPools(
        uint256[] calldata _multipliers,
        uint256[] calldata _denominators,
        uint256[] calldata _contributionBips
    ) external onlyOwner {
        // Alterado de 3 para 4
        require(_multipliers.length == 4 && _denominators.length == 4 && _contributionBips.length == 4, "Game: Deve ter 4 piscinas");
//
        
        uint256 totalBips = 0;
//
        for (uint256 i = 0; i < 4; i++) { // Alterado de 3 para 4
            require(_multipliers[i] > 0 && _denominators[i] > 0, "Game: Valores invalidos");
//
            prizePools[i] = PrizePool({
                multiplier: _multipliers[i],
                chanceDenominator: _denominators[i],
                balance: prizePools[i].balance, // Mantém o saldo existente
                contributionShareBips: _contributionBips[i]
            });
//
            totalBips += _contributionBips[i];
//
            emit PoolConfigured(i, _multipliers[i], _contributionBips[i]);
        }
        require(totalBips == TOTAL_SHARE_BIPS, "Game: Contribuicao BIPS deve somar 10000");
//
    }

    /**
     * @notice (Owner) Adiciona liquidez inicial às piscinas.
     */
    function addInitialLiquidity(uint256 _poolId, uint256 _amount) external onlyOwner {
        // Alterado de < 3 para < 4
        require(_poolId < 4, "Game: Invalid pool ID");
//
        
        require(_amount > 0, "Game: Amount must be positive");
//
        // Assume que o owner já transferiu o BKC para este contrato.
        prizePools[_poolId].balance += _amount;
//
    }

    // --- FUNÇÃO PRINCIPAL DE JOGO ---

    /**
     * @notice Joga no Tiger Game, verifica pStake, cobra 10% de taxa, realiza o sorteio e paga IMEDIATAMENTE.
     */
    function play(uint256 _amount, uint256 _boosterTokenId) external nonReentrant {
        require(_amount > 0, "Game: Aposta deve ser positiva");
//
        // 1. AUTORIZAÇÃO E PSTAKE
        ecosystemManager.authorizeService("TIGER_GAME_SERVICE", msg.sender, _boosterTokenId);
//
        // Transfere o valor total da aposta para o contrato
        require(bkcToken.transferFrom(msg.sender, address(this), _amount), "Game: Transferencia de aposta falhou");
//
        // 2. CÁLCULO E DISTRIBUIÇÃO DA TAXA DE SERVIÇO (10%)
        uint256 treasuryAmount = (_amount * TREASURY_FEE_BIPS) / TOTAL_SHARE_BIPS;
//
        uint256 delegatorFeeAmount = (_amount * DELEGATOR_FEE_BIPS) / TOTAL_SHARE_BIPS;
//
        uint256 prizePoolAmount = _amount - treasuryAmount - delegatorFeeAmount;
//

        // A. Tesouraria (5%)
        if (treasuryAmount > 0) {
            require(bkcToken.transfer(ecosystemManager.getTreasuryAddress(), treasuryAmount), "Game: Falha na transferencia p/ Tesouraria");
//
        }

        // B. Delegadores (5%)
        if (delegatorFeeAmount > 0) {
            address dm = ecosystemManager.getDelegationManagerAddress();
//
            bkcToken.approve(dm, delegatorFeeAmount);
//
            IDelegationManager(dm).depositRewards(0, delegatorFeeAmount);
//
        }
        
        // 3. MINERAÇÃO POR COMPRA (POP MINING)
        rewardManager.performGameMiningAndDistribution(_amount);
//
        // 4. DISTRIBUIÇÃO PARA AS PISCINAS (90%) e SORTEIO
        uint256 totalPrizeWon = 0;
//
        uint256 randomSeed = uint256(blockhash(block.number - 1));

        // Alterado de < 3 para < 4
        for (uint256 poolId = 0; poolId < 4; poolId++) {
//
            PrizePool storage pool = prizePools[poolId];
//
            // A. Reabastecimento da Piscina 
            uint256 contribution = (prizePoolAmount * pool.contributionShareBips) / TOTAL_SHARE_BIPS;
//
            pool.balance += contribution;
//
            
            // B. Sorteio 
            if (pool.chanceDenominator > 0 && randomSeed % pool.chanceDenominator == 0) { 
                
                // C. CÁLCULO DO PRÊMIO SUSTENTÁVEL (AGORA 50% da piscina ou Teto Multiplicador)
                
                // 1. O Teto Multiplicador: valor apostado * X
                uint256 maxPrizeMultiplier = _amount * pool.multiplier;
//
                // 2. O Limite de Sustentabilidade (50% da liquidez da piscina)
                uint256 maxPrizeSustainability = (pool.balance * MAX_PRIZE_POOL_BIPS) / 10000;
// (Usa a nova constante de 5000)
                // O prêmio a ser pago é o MÍNIMO dos dois limites:
                uint256 prizeAmount = (maxPrizeMultiplier < maxPrizeSustainability) 
                                        ?
 maxPrizeMultiplier
                                        : maxPrizeSustainability;
//
                if (prizeAmount > 0) {
                    // D. Pagamento Imediato 
                    pool.balance -= prizeAmount;
//
                    require(bkcToken.transfer(msg.sender, prizeAmount), "Game: Falha na transferencia do premio");
//
                    
                    totalPrizeWon += prizeAmount;
//
                }
            }
        }
        
        emit GamePlayed(msg.sender, _amount, totalPrizeWon);
//
    }
}