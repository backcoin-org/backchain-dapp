// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol";
// <-- NOVO: Importa as interfaces do Hub e do DM
import "./EcosystemManager.sol"; 

/**
 * @title FortuneTiger (ActionsManager)
 * @dev Contrato "Spoke" refatorado para usar o EcosystemManager.
 * @notice Taxas, pStake mínimo e distribuição são gerenciados pelo Hub.
 */
contract FortuneTiger is Ownable, ReentrancyGuard {
    
    // <-- NOVO: O Hub e o Token
    IEcosystemManager public immutable ecosystemManager;
    BKCToken public immutable bkcToken;

    // <-- REMOVIDO: delegationManager
    // <-- REMOVIDO: treasuryWallet

    enum ActionType { Esportiva, Beneficente }
    enum Status { Open, Finalized }

    struct Action {
        uint256 id;
        address creator;
        string description;
        ActionType actionType;
        Status status;
        uint256 endTime;
        uint256 totalPot;
        uint256 creatorStake;
        bool isStakeReturned;
        address beneficiary;
        uint256 totalCoupons;
        address winner;
        uint256 closingBlock;
        uint256 winningCoupon;
    }

    mapping(uint256 => Action) public actions;
    mapping(uint256 => address[]) public couponOwners;
    mapping(uint256 => uint256[]) public couponRanges;

    uint256 public actionCounter;
    uint256 public constant COUPONS_PER_BKC = 1000;
    uint256 public constant DRAW_MAX_OFFSET_BLOCKS = 100;

    // <-- REMOVIDO: Todas as constantes ..._BIPS (taxas)
    
    event ActionCreated(uint256 indexed actionId, address indexed creator, ActionType actionType, uint256 endTime, string description);
    event Participation(uint256 indexed actionId, address indexed participant, uint256 bkcAmount, uint256 couponsIssued);
    event ActionFinalized(uint256 indexed actionId, address indexed finalRecipient, uint256 prizeAmount);
    event StakeReturned(uint256 indexed actionId, address indexed creator, uint256 stakeAmount);
    // <-- NOVO: Evento para taxa de criação
    event CreationFeePaid(address indexed creator, uint256 feeAmount);

    /**
     * @dev Construtor agora recebe o Hub.
     */
    constructor(
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_ecosystemManagerAddress != address(0), "FT: Hub não pode ser zero");
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        
        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(_bkcTokenAddress != address(0), "FT: Token não configurado no Hub");
        bkcToken = BKCToken(_bkcTokenAddress);
    }

    /**
     * @notice Pega o stake mínimo do criador (lógica antiga mantida).
     */
    function getMinCreatorStake() public view returns (uint256) {
        uint256 stake = bkcToken.totalSupply() / 1_000_000;
        return stake > 0 ? stake : 1;
    }

    /**
     * @notice Cria uma nova Ação.
     * @dev ALTERADO: Agora verifica pStake mínimo e cobra uma taxa de criação (opcional).
     * @param _boosterTokenId O ID do booster do usuário (0 se não tiver) para desconto na taxa.
     */
    function createAction(
        uint256 _duration,
        ActionType _actionType,
        uint256 _charityStake,
        string calldata _description,
        uint256 _boosterTokenId // <-- NOVO
    ) external nonReentrant {
        
        // --- 1. AUTORIZAÇÃO E TAXA DE CRIAÇÃO (NOVO) ---
        // Verifica pStake mínimo e calcula a taxa (pode ser 0)
        uint256 creationFee = ecosystemManager.authorizeService(
            "ACTION_CREATE_SERVICE", // Chave do Serviço
            msg.sender,
            _boosterTokenId
        );

        // Se houver taxa de criação, coleta e distribui
        if (creationFee > 0) {
            require(bkcToken.transferFrom(msg.sender, address(this), creationFee), "FT: Falha ao pagar taxa de criação");
            _distributeFees(creationFee); // Distribui 50/50
            emit CreationFeePaid(msg.sender, creationFee);
        }

        // --- 2. LÓGICA DE STAKE (Antiga) ---
        actionCounter++;
        uint256 newActionId = actionCounter;
        uint256 stakeAmount;
        address beneficiary;
        string memory finalDescription;

        if (_actionType == ActionType.Esportiva) {
            stakeAmount = getMinCreatorStake();
            require(stakeAmount > 0, "Min stake cannot be zero");
            beneficiary = address(0);
            finalDescription = "Sports Lottery Draw";
        } else {
            require(_charityStake > 0, "Charity stake must be > 0");
            stakeAmount = _charityStake;
            beneficiary = msg.sender;
            require(bytes(_description).length > 0 && bytes(_description).length < 500, "Invalid description length");
            finalDescription = _description;
        }
        
        require(bkcToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");

        // --- 3. CRIA A AÇÃO (Antiga) ---
        actions[newActionId] = Action({
            id: newActionId, creator: msg.sender, description: finalDescription, actionType: _actionType,
            status: Status.Open, endTime: block.timestamp + _duration, totalPot: 0, creatorStake: stakeAmount,
            isStakeReturned: false, beneficiary: beneficiary, totalCoupons: 0, winner: address(0),
            closingBlock: 0, winningCoupon: 0
        });
        
        emit ActionCreated(newActionId, msg.sender, _actionType, actions[newActionId].endTime, finalDescription);
    }

    /**
     * @notice Participa de uma Ação.
     * @dev ALTERADO: Agora verifica pStake e cobra taxa de participação (opcional).
     * @param _boosterTokenId O ID do booster do usuário (0 se não tiver) para desconto na taxa.
     */
    function participate(
        uint256 _actionId, 
        uint256 _bkcAmount,
        uint256 _boosterTokenId // <-- NOVO
    ) external nonReentrant {
        Action storage action = actions[_actionId];
        require(action.status == Status.Open, "Action is not open");
        require(block.timestamp < action.endTime, "Participation time has ended");
        require(_bkcAmount > 0, "Amount must be positive");

        // --- 1. AUTORIZAÇÃO E TAXA DE PARTICIPAÇÃO (NOVO) ---
        uint256 participationFee = ecosystemManager.authorizeService(
            "ACTION_PARTICIPATE_SERVICE", // Chave do Serviço
            msg.sender,
            _boosterTokenId
        );
        
        // 2. COLETA TOTAL (Taxa + Valor do Pot)
        uint256 totalAmount = _bkcAmount + participationFee;
        require(bkcToken.transferFrom(msg.sender, address(this), totalAmount), "Token transfer failed");

        // 3. DISTRIBUI TAXA (se houver)
        if (participationFee > 0) {
            _distributeFees(participationFee);
        }

        // --- 4. LÓGICA DE PARTICIPAÇÃO (Antiga) ---
        action.totalPot += _bkcAmount; // Apenas _bkcAmount vai para o pot
        uint256 couponsToIssue = 0;
        
        if (action.actionType == ActionType.Esportiva) {
            couponsToIssue = _bkcAmount * COUPONS_PER_BKC / (10**18);
            require(couponsToIssue > 0, "Amount too small for coupons");
            action.totalCoupons += couponsToIssue;
            couponOwners[_actionId].push(msg.sender);
            couponRanges[_actionId].push(action.totalCoupons);
        }
        
        emit Participation(_actionId, msg.sender, _bkcAmount, couponsToIssue);
    }
    
    /**
     * @notice Finaliza uma Ação.
     * @dev ALTERADO: A divisão de taxas do pot agora é buscada no Hub.
     */
    function finalizeAction(uint256 _actionId) external nonReentrant {
        Action storage action = actions[_actionId];
        require(action.status == Status.Open, "Action not open or already finalized");
        require(block.timestamp >= action.endTime, "Action has not ended yet");
        
        uint256 pot = action.totalPot;
        address finalRecipient;
        uint256 prizeAmount;

        if (action.actionType == ActionType.Esportiva) {
            // Lógica de Sorteio (antiga)
            action.closingBlock = block.number;
            uint256 randomSeed = uint256(blockhash(action.closingBlock));
            require(randomSeed != 0, "Closing blockhash not available yet");
            uint256 randomOffset = (randomSeed % DRAW_MAX_OFFSET_BLOCKS) + 1;
            uint256 drawBlock = action.closingBlock + randomOffset;
            bytes32 blockHash = blockhash(drawBlock);
            require(uint256(blockHash) != 0, "Draw blockhash not available yet, try again later");
            
            uint256 winningCouponNumber = (uint256(blockHash) % action.totalCoupons) + 1;
            action.winningCoupon = winningCouponNumber;
            action.winner = _findCouponOwner(_actionId, winningCouponNumber);
            require(action.winner != address(0), "Could not find winner");

            // Lógica de Distribuição (nova)
            finalRecipient = action.winner;
            uint256 winnerBips = ecosystemManager.getFee("ACTION_SPORT_WINNER_BIPS");
            prizeAmount = (pot * winnerBips) / 10000;
            _distributeSportFees(pot, action.creator);
        
        } else { // Beneficente
            finalRecipient = action.beneficiary;
            uint256 causeBips = ecosystemManager.getFee("ACTION_CAUSE_BIPS");
            prizeAmount = (pot * causeBips) / 10000;
            _distributeBeneficentFees(pot, action.creator);
        }

        action.status = Status.Finalized;
        _returnCreatorStake(action);
        
        if (prizeAmount > 0) {
            bkcToken.transfer(finalRecipient, prizeAmount);
        }
        
        emit ActionFinalized(_actionId, finalRecipient, prizeAmount);
    }

    /**
     * @notice (NOVO) Função interna de distribuição de taxas 50/50.
     * @dev Usada pelas taxas de *serviço* (criação, participação).
     */
    function _distributeFees(uint256 _amount) internal {
        if (_amount == 0) return;

        address treasury = ecosystemManager.getTreasuryAddress();
        address dm = ecosystemManager.getDelegationManagerAddress();
        require(treasury != address(0) && dm != address(0), "FT: Hub não configurado");

        uint256 treasuryAmount = _amount / 2;
        uint256 delegatorAmount = _amount - treasuryAmount;

        if (treasuryAmount > 0) {
            require(bkcToken.transfer(treasury, treasuryAmount), "FT: Fee to Treasury failed");
        }
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }
    }
    
    /**
     * @dev Distribui as porcentagens do *pot* Beneficente.
     * @notice ALTERADO: Busca BIPS e endereços do Hub.
     */
    function _distributeBeneficentFees(uint256 _pot, address _creator) internal {
        // Pega endereços do Hub
        address dm = ecosystemManager.getDelegationManagerAddress();
        address treasury = ecosystemManager.getTreasuryAddress();
        require(dm != address(0) && treasury != address(0), "FT: Hub não configurado");

        // Pega BIPS do Hub
        uint256 delegatorBips = ecosystemManager.getFee("ACTION_CAUSE_DELEGATOR_BIPS");
        uint256 treasuryBips = ecosystemManager.getFee("ACTION_CAUSE_TREASURY_BIPS");
        uint256 creatorBips = ecosystemManager.getFee("ACTION_CAUSE_CREATOR_BIPS");

        uint256 delegatorAmount = (_pot * delegatorBips) / 10000;
        uint256 treasuryAmount = (_pot * treasuryBips) / 10000;
        uint256 creatorAmount = (_pot * creatorBips) / 10000;
        
        if (creatorAmount > 0) bkcToken.transfer(_creator, creatorAmount);
        if (treasuryAmount > 0) bkcToken.transfer(treasury, treasuryAmount);
        
        // CORREÇÃO DO BUG: Aprova o DM antes de chamar
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }
    }

    /**
     * @dev Distribui as porcentagens do *pot* Esportivo.
     * @notice ALTERADO: Busca BIPS e endereços do Hub.
     */
    function _distributeSportFees(uint256 _pot, address _creator) internal {
        // Pega endereços do Hub
        address dm = ecosystemManager.getDelegationManagerAddress();
        address treasury = ecosystemManager.getTreasuryAddress();
        require(dm != address(0) && treasury != address(0), "FT: Hub não configurado");
        
        // Pega BIPS do Hub
        uint256 creatorBips = ecosystemManager.getFee("ACTION_SPORT_CREATOR_BIPS");
        uint256 delegatorBips = ecosystemManager.getFee("ACTION_SPORT_DELEGATOR_BIPS");
        uint256 treasuryBips = ecosystemManager.getFee("ACTION_SPORT_TREASURY_BIPS");

        uint256 creatorAmount = (_pot * creatorBips) / 10000;
        uint256 delegatorAmount = (_pot * delegatorBips) / 10000;
        uint256 treasuryAmount = (_pot * treasuryBips) / 10000;
        
        if (creatorAmount > 0) bkcToken.transfer(_creator, creatorAmount);
        if (treasuryAmount > 0) bkcToken.transfer(treasury, treasuryAmount);
        
        // CORREÇÃO DO BUG: Aprova o DM antes de chamar
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }
    }
    
    /**
     * @dev Retorna o stake ao criador (lógica antiga mantida).
     */
    function _returnCreatorStake(Action storage action) internal {
        if (!action.isStakeReturned && action.creatorStake > 0) {
            action.isStakeReturned = true;
            bkcToken.transfer(action.creator, action.creatorStake);
            emit StakeReturned(action.id, action.creator, action.creatorStake);
        }
    }
    
    /**
     * @dev Encontra o dono do cupom (lógica antiga mantida).
     */
    function _findCouponOwner(uint256 _actionId, uint256 _couponNumber) internal view returns (address) {
        uint256[] memory ranges = couponRanges[_actionId];
        uint256 low = 0;
        uint256 high = ranges.length - 1;
        while (low <= high) {
            uint256 mid = (low + high) / 2;
            uint256 prevRange = (mid == 0) ? 0 : ranges[mid - 1];
            if (_couponNumber > prevRange && _couponNumber <= ranges[mid]) {
                return couponOwners[_actionId][mid];
            } else if (_couponNumber > ranges[mid]) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return address(0);
    }
}