// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title Fortune Pool (Strategic Betting)
 * @notice A skill-based prediction game fueled by Backcoin ($BKC).
 * @dev Users predict 3 numbers. Fees collected trigger the Proof-of-Purchase mining mechanism.
 * The contract is designed to be gas-efficient for EVM networks like Arbitrum.
 */
contract FortunePool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    IDelegationManager public delegationManager;
    
    address public miningManagerAddress;
    address public oracleAddress;

    uint256 public oracleFeeInWei;
    uint256 public gameCounter;

    // --- Dynamic Game Fee (Adjustable by Owner) ---
    uint256 public gameFeeBips; 

    struct PrizeTier {
        uint128 chanceDenominator; // Max range (e.g., 3, 10, 100)
        uint64 multiplierBips;     // Reward multiplier (e.g., 20000 = 2x)
        bool isInitialized;
    }

    struct GameRequest {
        address user;
        uint256 purchaseAmount; // Net wager amount used for calculation
        uint8[3] guesses;      // User predictions [Tier 1, Tier 2, Tier 3]
        bool isCumulative;     // True = All matching tiers pay; False = Highest tier only
    }

    mapping(uint256 => PrizeTier) public prizeTiers;
    mapping(uint256 => GameRequest) public pendingGames; // Requests waiting for oracle fulfillment
    mapping(uint256 => uint256[3]) public gameResults;   // Final rolls results

    uint256 public prizePoolBalance;
    uint256 public activeTierCount;
    
    // Constants
    uint256 public constant TOTAL_BIPS = 10000;
    uint256 public constant MAX_PRIZE_PAYOUT_BIPS = 5000; // Max 50% of pool per win
    
    // Service Key for MiningManager Authorization
    bytes32 public constant SERVICE_KEY = keccak256("TIGER_GAME_SERVICE");

    // --- Events ---

    event TierCreated(uint256 indexed tierId, uint256 chance, uint256 multiplier);
    event PrizePoolToppedUp(uint256 amount);
    event OracleAddressSet(address indexed oracle);
    event OracleFeeSet(uint256 newFeeInWei);
    event GameFeeSet(uint256 newFeeBips); // New event for dynamic BKC fee change
    
    event GameRequested(
        uint256 indexed gameId, 
        address indexed user, 
        uint256 purchaseAmount,
        uint8[3] guesses,
        bool isCumulative
    );

    event GameFulfilled(
        uint256 indexed gameId,
        address indexed user,
        uint256 prizeWon,
        uint256[3] rolls,
        uint8[3] guesses
    );

    // --- Custom Errors (Gas Optimization) ---

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidTierID();
    error InvalidGuess();
    error OracleTransferFailed();
    error Unauthorized();
    error GameAlreadyFulfilled();
    error CoreContractsNotSet();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Fortune Pool contract and links core ecosystem managers.
     * @param _initialOwner The owner of this contract.
     * @param _ecosystemManagerAddress The address of the central hub.
     */
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
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        address _miningManagerAddr = ecosystemManager.getMiningManagerAddress();

        if (
            _bkcTokenAddress == address(0) ||
            _dmAddress == address(0) ||
            _miningManagerAddr == address(0)
        ) revert CoreContractsNotSet();

        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        miningManagerAddress = _miningManagerAddr;
        
        // Default game fee is 10% (1000 BIPS)
        gameFeeBips = 1000;
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin Functions ---

    /**
     * @notice Sets the address of the Oracle (RNG Service).
     * @param _oracle The EOA address that fulfills the game.
     */
    function setOracleAddress(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert InvalidAddress();
        oracleAddress = _oracle;
        emit OracleAddressSet(_oracle);
    }
    
    /**
     * @notice Sets the native ETH fee required to trigger the oracle.
     * @param _feeInWei The fee amount in Wei.
     */
    function setOracleFee(uint256 _feeInWei) external onlyOwner {
        oracleFeeInWei = _feeInWei;
        emit OracleFeeSet(_feeInWei);
    }

    /**
     * @notice Sets the fee taken from the BKC wager (10% default).
     * @param _newFeeBips The new fee in Basis Points (1000 = 10%). Max 3000.
     */
    function setGameFee(uint256 _newFeeBips) external onlyOwner {
        // Safety cap at 30%
        if (_newFeeBips > 3000) revert InvalidFee(); 
        gameFeeBips = _newFeeBips;
        emit GameFeeSet(_newFeeBips);
    }

    /**
     * @notice Configures a prize tier (up to 3 tiers).
     * @param _tierId The tier ID (1, 2, or 3).
     * @param _chanceDenominator The chance denominator (e.g., 4 for 1/4 chance).
     * @param _multiplierBips The reward multiplier in BIPS (e.g., 15000 = 1.5x).
     */
    function setPrizeTier(
        uint256 _tierId,
        uint128 _chanceDenominator,
        uint64 _multiplierBips
    ) external onlyOwner {
        if (_tierId == 0 || _tierId > 3) revert InvalidTierID(); 
        
        if (!prizeTiers[_tierId].isInitialized) {
            activeTierCount++;
        }
        
        prizeTiers[_tierId] = PrizeTier({
            chanceDenominator: _chanceDenominator,
            multiplierBips: _multiplierBips,
            isInitialized: true
        });

        emit TierCreated(_tierId, _chanceDenominator, _multiplierBips);
    }

    /**
     * @notice Allows the owner to transfer BKC to increase the prize pool.
     * @param _amount The amount of BKC to deposit.
     */
    function topUpPool(uint256 _amount) external onlyOwner {
        if (_amount == 0) revert InvalidAmount();
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        _addAmountToPool(_amount);
        emit PrizePoolToppedUp(_amount);
    }

    /**
     * @notice Emergency function to withdraw all pool balance to the Treasury.
     */
    function emergencyWithdraw() external onlyOwner {
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury == address(0)) revert CoreContractsNotSet();
        
        uint256 totalBalance = prizePoolBalance;
        prizePoolBalance = 0;
        
        if (totalBalance > 0) {
            bkcToken.safeTransfer(treasury, totalBalance);
        }
    }

    // --- Game Logic ---

    /**
     * @notice Allows a user to play the game by submitting a wager and guesses.
     * @dev Pays native ETH fee to the oracle and wagers BKC.
     * @param _amount Amount of BKC to wager.
     * @param _guesses Array of 3 number predictions.
     * @param _isCumulative If true, pays ALL wins (fee 5x). If false, pays HIGHEST win (fee 1x).
     */
    function participate(
        uint256 _amount, 
        uint8[3] calldata _guesses, 
        bool _isCumulative
    ) external payable nonReentrant {
        if (_amount == 0) revert InvalidAmount();
        
        // Validate Guesses (Tiers 1-3, 1-10, 1-100)
        if (_guesses[0] < 1 || _guesses[0] > 3) revert InvalidGuess();
        if (_guesses[1] < 1 || _guesses[1] > 10) revert InvalidGuess();
        if (_guesses[2] < 1 || _guesses[2] > 100) revert InvalidGuess();

        // Calculate required ETH fee (5x for Cumulative)
        uint256 requiredFee = _isCumulative ? oracleFeeInWei * 5 : oracleFeeInWei;
        
        if (msg.value != requiredFee) revert InvalidFee();

        // Forward native fee to Oracle (EOA)
        (bool sent, ) = oracleAddress.call{value: msg.value}("");
        if (!sent) revert OracleTransferFailed();

        // Process BKC (Pool / Mining based on dynamic fee)
        uint256 purchaseAmount = _processFeesAndMining(_amount);

        unchecked {
            gameCounter++;
        }
        
        // Store request for fulfillment
        pendingGames[gameCounter] = GameRequest({
            user: msg.sender,
            purchaseAmount: purchaseAmount, 
            guesses: _guesses,
            isCumulative: _isCumulative
        });

        emit GameRequested(gameCounter, msg.sender, purchaseAmount, _guesses, _isCumulative);
    }
    
    /**
     * @notice Called only by the Oracle to fulfill a pending game request.
     * @dev Calculates the final prize, pays the user, and updates pool balance.
     * @param _gameId The ID of the pending game request.
     * @param _randomNumber The random number generated by the oracle (bytes32 converted to uint256).
     */
    function fulfillGame(
        uint256 _gameId,
        uint256 _randomNumber
    ) external nonReentrant {
        if (msg.sender != oracleAddress) revert Unauthorized();
        // Check if game is already fulfilled
        if (gameResults[_gameId][0] != 0) revert GameAlreadyFulfilled();

        GameRequest memory request = pendingGames[_gameId];
        if (request.user == address(0)) revert Unauthorized(); 

        uint256 totalPrize = 0;
        uint256[3] memory rolls;
        uint256 currentPool = prizePoolBalance;

        // Process 3 Tiers
        for (uint256 i = 1; i <= 3; i++) {
            PrizeTier memory tier = prizeTiers[i];
            if (!tier.isInitialized) continue;

            // Generate Roll (1 to chanceDenominator)
            uint256 roll = (uint256(keccak256(abi.encodePacked(_randomNumber, i))) % tier.chanceDenominator) + 1;
            rolls[i-1] = roll;

            // Check Win (User Guess vs Oracle Roll)
            if (request.guesses[i-1] == roll) {
                uint256 winAmount = (request.purchaseAmount * tier.multiplierBips) / TOTAL_BIPS;
                
                if (request.isCumulative) {
                    totalPrize += winAmount;
                } else {
                    // Keep only the highest single win
                    if (winAmount > totalPrize) {
                        totalPrize = winAmount;
                    }
                }
            }
        }

        // Safety Cap (Max 50% of pool total)
        uint256 maxPayout = (currentPool * MAX_PRIZE_PAYOUT_BIPS) / TOTAL_BIPS;
        if (totalPrize > maxPayout) {
            totalPrize = maxPayout;
        }

        // Save Result
        gameResults[_gameId] = rolls;

        // Payout
        if (totalPrize > 0) {
            prizePoolBalance -= totalPrize;
            bkcToken.safeTransfer(request.user, totalPrize);
        }

        // Clean up storage (Gas Refund)
        delete pendingGames[_gameId];
        
        emit GameFulfilled(_gameId, request.user, totalPrize, rolls, request.guesses);
    }

    // --- Internal Helpers ---

    /**
     * @dev Handles the BKC transfer: user -> contract, pool amount -> pool, fee amount -> MiningManager.
     * @param _amount The gross amount wagered by the user.
     * @return purchaseAmount The gross amount wagered.
     */
    function _processFeesAndMining(uint256 _amount) internal returns (uint256 purchaseAmount) {
        // Calculates dynamic fee (e.g., 10%)
        uint256 totalFee = (_amount * gameFeeBips) / TOTAL_BIPS;
        
        uint256 prizePoolAmount = _amount - totalFee;
        purchaseAmount = _amount; // Multipliers are based on the GROSS amount for UX

        if (miningManagerAddress == address(0)) revert CoreContractsNotSet();

        // 1. Pull tokens from user
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // 2. Add net wager to pool
        _addAmountToPool(prizePoolAmount);
        
        // 3. Fee Mining Logic
        if (totalFee > 0) {
            // Transfer fee to MiningManager
            bkcToken.safeTransfer(miningManagerAddress, totalFee);
            // Trigger PoP mining
            IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, totalFee);
        }
        
        return purchaseAmount;
    }
    
    /**
     * @dev Adds the net wager amount to the prize pool, or sends to treasury if no tiers are active.
     */
    function _addAmountToPool(uint256 _amount) internal {
        if (_amount == 0) return;
        
        if (activeTierCount == 0) {
            address treasury = ecosystemManager.getTreasuryAddress();
            if (treasury != address(0)) {
                bkcToken.safeTransfer(treasury, _amount);
                return;
            }
        }
        prizePoolBalance += _amount;
    }
}