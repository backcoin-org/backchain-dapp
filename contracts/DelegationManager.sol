// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title DelegationManager
 * @notice Manages staking and rewards within the Backcoin Protocol.
 * @dev Implements "Saved Rewards" logic: rewards accumulate and are only transferred upon manual claim.
 * Optimized for Arbitrum Network.

 */
contract DelegationManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IDelegationManager
{
    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;

    uint256 public constant MIN_LOCK_DURATION = 1 days;
    uint256 public constant MAX_LOCK_DURATION = 3650 days;
    uint256 private constant E18 = 10**18;

    // Fee Keys
    bytes32 public constant DELEGATION_FEE_KEY = keccak256("DELEGATION_FEE_BIPS");
    bytes32 public constant UNSTAKE_FEE_KEY = keccak256("UNSTAKE_FEE_BIPS");
    bytes32 public constant FORCE_UNSTAKE_PENALTY_KEY = keccak256("FORCE_UNSTAKE_PENALTY_BIPS");
    bytes32 public constant CLAIM_REWARD_FEE_KEY = keccak256("CLAIM_REWARD_FEE_BIPS");

    struct Delegation {
        uint256 amount;
        uint64 unlockTime;
        uint64 lockDuration;
    }

    mapping(address => Delegation[]) public userDelegations;
    mapping(address => uint256) public userTotalPStake;
    mapping(address => uint256) public rewardDebt;
    
    // [CRÍTICO] Variável que armazena o lucro sem enviar para a carteira
    mapping(address => uint256) public savedRewards; 

    uint256 public totalNetworkPStake;
    uint256 public accRewardPerStake; 

    // --- Events ---
    event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid);
    event RewardsDeposited(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    // --- Errors ---
    error InvalidAddress();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidIndex();
    error Unauthorized();
    error LockPeriodNotOver();
    error DelegationUnlocked();
    error TransferFailed();
    error TokenNotSet();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        if (_bkcTokenAddress == address(0)) revert TokenNotSet();
        
        bkcToken = BKCToken(_bkcTokenAddress);
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Core Logic ---

    function depositMiningRewards(uint256 _amount) external override { 
        if (msg.sender != ecosystemManager.getMiningManagerAddress()) revert Unauthorized();
        if (_amount > 0 && totalNetworkPStake > 0) {
            accRewardPerStake += (_amount * E18) / totalNetworkPStake;
            emit RewardsDeposited(_amount);
        }
    }

    /**
     * @notice DELEGATE (Depositar)
     * @dev Calcula recompensas pendentes e SALVA no `savedRewards`, mas não transfere.
     */
    function delegate(
        uint256 _totalAmount, 
        uint256 _lockDuration,
        uint256 /* _boosterTokenId */ 
    ) external nonReentrant {
        if (_totalAmount == 0) revert InvalidAmount();
        if (_lockDuration < MIN_LOCK_DURATION || _lockDuration > MAX_LOCK_DURATION) revert InvalidDuration();

        // 1. Snapshot do lucro atual para o cofre interno
        _updateUserData(msg.sender);

        // 2. Lógica de Taxa de Entrada (Delegation Fee)
        uint256 delegationFeeBips = ecosystemManager.getFee(DELEGATION_FEE_KEY);
        uint256 netAmount = _totalAmount;
        uint256 feeAmount = 0;

        if (delegationFeeBips > 0) {
            feeAmount = (_totalAmount * delegationFeeBips) / 10000;
            netAmount = _totalAmount - feeAmount;
            if (netAmount == 0) revert InvalidAmount();
        }

        // 3. Transferência de tokens do usuário para o contrato
        if (!bkcToken.transferFrom(msg.sender, address(this), _totalAmount)) revert TransferFailed();

        // 4. Envia taxa para mineração (Proof-of-Purchase)
        if (feeAmount > 0) {
            _sendFeeToMiningManager(DELEGATION_FEE_KEY, feeAmount);
        }

        // 5. Registra Delegação
        uint256 delegationIndex = userDelegations[msg.sender].length;
        userDelegations[msg.sender].push(Delegation({
            amount: netAmount,
            unlockTime: uint64(block.timestamp + _lockDuration),
            lockDuration: uint64(_lockDuration)
        }));

        // 6. Calcula novo pStake
        uint256 pStake = _calculatePStake(netAmount, _lockDuration);

        // 7. Atualiza estado global
        totalNetworkPStake += pStake;
        userTotalPStake[msg.sender] += pStake;

        // 8. Reseta a "dívida" matemática para o novo patamar de pStake
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;

        emit Delegated(msg.sender, delegationIndex, netAmount, pStake, feeAmount);
    }

    /**
     * @notice UNSTAKE (Sacar Principal)
     * @dev Calcula recompensas pendentes e SALVA no `savedRewards`, devolve apenas o principal.
     */
    function unstake(
        uint256 _delegationIndex, 
        uint256 /* _boosterTokenId */ 
    ) external nonReentrant {
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        if (_delegationIndex >= delegationsOfUser.length) revert InvalidIndex();
        
        Delegation storage d = delegationsOfUser[_delegationIndex];

        // 1. Snapshot do lucro atual
        _updateUserData(msg.sender);

        if (block.timestamp < d.unlockTime) revert LockPeriodNotOver();

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        // 2. Taxa de Saída (Unstake Fee)
        uint256 feeBips = ecosystemManager.getFee(UNSTAKE_FEE_KEY);
        uint256 feeAmount = (amount * feeBips) / 10000;
        uint256 amountToUser = amount - feeAmount;

        // 3. Remove pStake
        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        if (feeAmount > 0) {
            _sendFeeToMiningManager(UNSTAKE_FEE_KEY, feeAmount);
        }

        // 4. Remove da lista
        uint256 lastIndex = delegationsOfUser.length - 1;
        if (_delegationIndex != lastIndex) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[lastIndex];
        }
        delegationsOfUser.pop();

        // 5. Devolve Principal
        if (!bkcToken.transfer(msg.sender, amountToUser)) revert TransferFailed();

        // 6. Atualiza dívida
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount);
    }

    /**
     * @notice FORCE UNSTAKE (Saque Antecipado com Penalidade)
     */
    function forceUnstake(uint256 _delegationIndex, uint256 /* _boosterTokenId */) external nonReentrant {
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        if (_delegationIndex >= delegationsOfUser.length) revert InvalidIndex();
        
        Delegation storage d = delegationsOfUser[_delegationIndex];

        // 1. Snapshot
        _updateUserData(msg.sender);

        if (block.timestamp >= d.unlockTime) revert DelegationUnlocked();

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        // 2. Penalidade
        uint256 penaltyBips = ecosystemManager.getFee(FORCE_UNSTAKE_PENALTY_KEY);
        uint256 penaltyAmount = (amount * penaltyBips) / 10000;
        uint256 amountToUser = amount - penaltyAmount;

        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        if (penaltyAmount > 0) {
            _sendFeeToMiningManager(FORCE_UNSTAKE_PENALTY_KEY, penaltyAmount);
        }
        
        uint256 lastIndex = delegationsOfUser.length - 1;
        if (_delegationIndex != lastIndex) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[lastIndex];
        }
        delegationsOfUser.pop();
        
        if (!bkcToken.transfer(msg.sender, amountToUser)) revert TransferFailed();

        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount);
    }

    /**
     * @notice CLAIM REWARD (Saque Manual de Lucros)
     * @dev Única função que transfere recompensas. Aplica o Booster aqui.
     */
    function claimReward(uint256 _boosterTokenId) external nonReentrant {
        // 1. Calcula lucro dos últimos segundos
        _updateUserData(msg.sender);
        
        // 2. Pega tudo que está no cofre
        uint256 totalToClaim = savedRewards[msg.sender];
        
        if (totalToClaim > 0) {
            // Zera o cofre (Proteção contra reentrância)
            savedRewards[msg.sender] = 0;
            
            // Atualiza dívida para evitar contagem dupla no futuro
            rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;

            // 3. Aplica Taxa de Saque e Desconto de Booster
            uint256 baseFeeBips = ecosystemManager.getFee(CLAIM_REWARD_FEE_KEY);
            uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);
            uint256 feeAmount = (totalToClaim * finalFeeBips) / 10000;
            uint256 amountToUser = totalToClaim - feeAmount;

            // 4. Distribui taxa e paga usuário
            if (feeAmount > 0) {
                _sendFeeToMiningManager(CLAIM_REWARD_FEE_KEY, feeAmount);
            }

            if (amountToUser > 0) {
                if (!bkcToken.transfer(msg.sender, amountToUser)) revert TransferFailed();
            }

            emit RewardClaimed(msg.sender, amountToUser);
        }
    }

    // --- Internal Helpers ---

    /**
     * @dev Calcula rendimentos matemáticos e guarda no cofre `savedRewards`.
     */
    function _updateUserData(address _user) internal {
        if (userTotalPStake[_user] > 0) {
            uint256 pending = (userTotalPStake[_user] * accRewardPerStake / E18) - rewardDebt[_user];
            if (pending > 0) {
                savedRewards[_user] += pending;
            }
        }
    }

    function _sendFeeToMiningManager(bytes32 _serviceKey, uint256 _feeAmount) internal {
        address miningManagerAddress = ecosystemManager.getMiningManagerAddress();
        if (miningManagerAddress == address(0)) revert InvalidAddress();
        
        if (!bkcToken.transfer(miningManagerAddress, _feeAmount)) revert TransferFailed();
        IMiningManager(miningManagerAddress).performPurchaseMining(
            _serviceKey,
            _feeAmount
        );
    }

    function _applyBoosterDiscount(uint256 _baseFeeBips, uint256 _boosterTokenId) internal view returns (uint256 finalFeeBips) {
        if (_boosterTokenId == 0) return _baseFeeBips;
        address boosterAddress = ecosystemManager.getBoosterAddress();
        if (boosterAddress == address(0)) return _baseFeeBips;
        
        IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);
        // Try/Catch para evitar que um NFT inválido trave o saque
        try booster.ownerOf(_boosterTokenId) returns (address owner) {
            if (owner == msg.sender) {
                uint256 boostBips = booster.boostBips(_boosterTokenId);
                uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);
                
                if (discountBips > 0) {
                    return (_baseFeeBips > discountBips) ? _baseFeeBips - discountBips : 0;
                }
            }
        } catch { }
        return _baseFeeBips;
    }

    function _calculatePStake(uint256 _amount, uint256 _lockDuration) internal pure returns (uint256) {
        return (_amount * (_lockDuration / 1 days)) / E18;
    }

    // --- View Functions ---

    /**
     * @notice Exibe no site o total disponível (Novo + Acumulado).
     */
    function pendingRewards(address _user) public view returns (uint256) {
        uint256 currentPending = 0;
        if (userTotalPStake[_user] > 0) {
            currentPending = (userTotalPStake[_user] * accRewardPerStake / E18) - rewardDebt[_user];
        }
        return currentPending + savedRewards[_user];
    }

    function getDelegationsOf(address _user) external view returns (Delegation[] memory) {
        return userDelegations[_user];
    }
}