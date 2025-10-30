// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol";
// <-- NEW: Import Hub and DM interfaces
import "./EcosystemManager.sol";

/**
 * @title FortuneTiger (ActionsManager)
 * @dev "Spoke" contract refactored to use EcosystemManager.
 * @notice Fees, minimum pStake, and distribution are managed by the Hub.
 */
contract FortuneTiger is Ownable, ReentrancyGuard {

    // <-- NEW: The Hub and the Token
    IEcosystemManager public immutable ecosystemManager;
    BKCToken public immutable bkcToken;

    // <-- REMOVED: delegationManager
    // <-- REMOVED: treasuryWallet

    enum ActionType { Sporting, Charitable } // Translated enum values
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
        address beneficiary; // For charitable actions
        uint256 totalCoupons; // For sporting actions
        address winner; // For sporting actions
        uint256 closingBlock; // For sporting actions
        uint256 winningCoupon; // For sporting actions
    }

    mapping(uint256 => Action) public actions;
    mapping(uint256 => address[]) public couponOwners; // Sporting: Who owns which coupon range
    mapping(uint256 => uint256[]) public couponRanges; // Sporting: Upper bound of coupon numbers for each participant

    uint256 public actionCounter;
    uint256 public constant COUPONS_PER_BKC = 1000; // 1000 coupons per 1 BKC (1e18)
    uint256 public constant DRAW_MAX_OFFSET_BLOCKS = 100; // Max block offset for random draw
    // <-- REMOVED: All ..._BIPS constants (fees managed by Hub)

    event ActionCreated(uint256 indexed actionId, address indexed creator, ActionType actionType, uint256 endTime, string description);
    event Participation(uint256 indexed actionId, address indexed participant, uint256 bkcAmount, uint256 couponsIssued);
    event ActionFinalized(uint256 indexed actionId, address indexed finalRecipient, uint256 prizeAmount);
    event StakeReturned(uint256 indexed actionId, address indexed creator, uint256 stakeAmount);
    // <-- NEW: Event for creation fee
    event CreationFeePaid(address indexed creator, uint256 feeAmount);
    /**
     * @dev Constructor now receives the Hub address.
     */
    constructor(
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_ecosystemManagerAddress != address(0), "FT: Hub cannot be zero"); // <-- Translated
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(_bkcTokenAddress != address(0), "FT: Token not configured in Hub"); // <-- Translated
        bkcToken = BKCToken(_bkcTokenAddress);
    }

    /**
     * @notice Gets the minimum creator stake (old logic maintained).
     */
    function getMinCreatorStake() public view returns (uint256) {
        // Example dynamic stake: 0.0001% of total supply
        uint256 stake = bkcToken.totalSupply() / 1_000_000;
        // Ensure minimum stake is at least 1 wei if calculation results in 0
        return stake > 0 ? stake : 1;
    }

    /**
     * @notice Creates a new Action.
     * @dev CHANGED: Now checks minimum pStake and charges a creation fee (optional) via Hub.
     * @param _duration Duration of the action in seconds.
     * @param _actionType The type of action (Sporting or Charitable).
     * @param _charityStake The amount the creator stakes for a Charitable action (ignored for Sporting).
     * @param _description Description for a Charitable action (ignored for Sporting).
     * @param _boosterTokenId The user's booster ID (0 if none) for fee discount.
     */
    function createAction(
        uint256 _duration,
        ActionType _actionType,
        uint256 _charityStake,
        string calldata _description,
        uint256 _boosterTokenId // <-- NEW
    ) external nonReentrant {

        // --- 1. AUTHORIZATION AND CREATION FEE (NEW) ---
        // Checks minimum pStake and calculates the fee (can be 0)
     
       uint256 creationFee = ecosystemManager.authorizeService(
            "ACTION_CREATE_SERVICE", // Service Key defined in Hub
            msg.sender,
            _boosterTokenId
        );
        // If there's a creation fee, collect and distribute it
        if (creationFee > 0) {
            require(bkcToken.transferFrom(msg.sender, address(this), creationFee), "FT: Failed to pay creation fee");
            _distributeServiceFees(creationFee); // Distributes 50/50
            emit CreationFeePaid(msg.sender, creationFee);
        }

        // --- 2. STAKE LOGIC (Old) ---
        actionCounter++;
        uint256 newActionId = actionCounter;
        uint256 stakeAmount;
        address beneficiary;
        string memory finalDescription;
        if (_actionType == ActionType.Sporting) {
            stakeAmount = getMinCreatorStake();
            require(stakeAmount > 0, "FT: Min stake cannot be zero"); // Translated
            beneficiary = address(0); // Winner determined by draw
            finalDescription = "Sporting Lottery Draw"; // Default description
        } else { // Charitable
            require(_charityStake > 0, "FT: Charity stake must be > 0"); // Translated
            stakeAmount = _charityStake;
            beneficiary = msg.sender; // Creator is the beneficiary (can transfer ownership later if needed)
            require(bytes(_description).length > 0 && bytes(_description).length < 500, "FT: Invalid description length"); // Translated
            finalDescription = _description;
        }

        require(bkcToken.transferFrom(msg.sender, address(this), stakeAmount), "FT: Stake transfer failed"); // Translated

        // --- 3. CREATE THE ACTION (Old) ---
        actions[newActionId] = Action({
            id: newActionId, creator: msg.sender, description: finalDescription, actionType: _actionType,
            status: Status.Open, endTime: block.timestamp + _duration, totalPot: 0, creatorStake: stakeAmount,
            isStakeReturned: false, beneficiary: beneficiary, totalCoupons: 0, winner: address(0),
            closingBlock: 0, winningCoupon: 0
        });

        emit ActionCreated(newActionId, msg.sender, _actionType, actions[newActionId].endTime, finalDescription);
    }

    /**
     * @notice Participates in an Action.
     * @dev CHANGED: Now checks pStake and charges a participation fee (optional) via Hub.
     * @param _actionId The ID of the action to participate in.
     * @param _bkcAmount The amount of BKC to contribute to the pot.
     * @param _boosterTokenId The user's booster ID (0 if none) for fee discount.
     */
    function participate(
        uint256 _actionId,
        uint256 _bkcAmount,
        uint256 _boosterTokenId // <-- NEW
    ) external nonReentrant {
        Action storage action = actions[_actionId];
        require(action.status == Status.Open, "FT: Action is not open"); // Translated
        require(block.timestamp < action.endTime, "FT: Participation time has ended"); // Translated
        require(_bkcAmount > 0, "FT: Amount must be positive"); // Translated

        // --- 1. AUTHORIZATION AND PARTICIPATION FEE (NEW) ---
        uint256 participationFee = ecosystemManager.authorizeService(
            "ACTION_PARTICIPATE_SERVICE", // Service Key defined in Hub
            msg.sender,
            _boosterTokenId
        );
        // 2. COLLECT TOTAL (Fee + Pot Amount)
        uint256 totalAmount = _bkcAmount + participationFee;
        require(bkcToken.transferFrom(msg.sender, address(this), totalAmount), "FT: Token transfer failed"); // Translated

        // 3. DISTRIBUTE FEE (if any)
        if (participationFee > 0) {
            _distributeServiceFees(participationFee);
        }

        // --- 4. PARTICIPATION LOGIC (Old) ---
        action.totalPot += _bkcAmount; // Only _bkcAmount goes to the pot
        uint256 couponsToIssue = 0;
        if (action.actionType == ActionType.Sporting) {
            couponsToIssue = (_bkcAmount * COUPONS_PER_BKC) / (10**18);
            require(couponsToIssue > 0, "FT: Amount too small for coupons"); // Translated
            
            // ====================================================================
            // ======================= INÍCIO DA CORREÇÃO =======================
            // ====================================================================

            // A linha 'uint256 previousTotal = action.totalCoupons' foi removida
            // pois estava causando o aviso de 'unused variable' E o
            // erro de 'missing semicolon' (ParserError).

            // ==================================================================
            // ======================== FIM DA CORREÇÃO =========================
            // ==================================================================
            
            action.totalCoupons += couponsToIssue;
            couponOwners[_actionId].push(msg.sender);
            couponRanges[_actionId].push(action.totalCoupons); // Store upper bound
        }

        emit Participation(_actionId, msg.sender, _bkcAmount, couponsToIssue);
    }

    /**
     * @notice Finalizes an Action after its end time.
     * @dev CHANGED: Pot fee distribution percentages are fetched from the Hub.
     */
    function finalizeAction(uint256 _actionId) external nonReentrant {
        Action storage action = actions[_actionId];
        require(action.status == Status.Open, "FT: Action not open or already finalized"); // Translated
        require(block.timestamp >= action.endTime, "FT: Action has not ended yet"); // Translated

        uint256 pot = action.totalPot;
        address finalRecipient;
        uint256 prizeAmount;
        if (action.actionType == ActionType.Sporting) {
            // Draw Logic (old)
            require(action.totalCoupons > 0, "FT: No participants in sporting action"); // Add check
            action.closingBlock = block.number; // Use blockhash of a future block for better randomness source
            uint256 randomSeed = uint256(blockhash(action.closingBlock - 1)); // Use previous blockhash as seed base
             if (randomSeed == 0 && action.closingBlock > 256) {
                 // Fallback if blockhash is unavailable (older blocks) - Less secure
                 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _actionId)));
             }
            require(randomSeed != 0, "FT: Could not determine random seed"); // Translated

            uint256 winningCouponNumber = (randomSeed % action.totalCoupons) + 1; // 1 to totalCoupons
            action.winningCoupon = winningCouponNumber;
            action.winner = _findCouponOwner(_actionId, winningCouponNumber);
            require(action.winner != address(0), "FT: Could not find winner"); // Translated

            // Distribution Logic (new)
            finalRecipient = action.winner;
            uint256 winnerBips = ecosystemManager.getFee("ACTION_SPORT_WINNER_BIPS");
            prizeAmount = (pot * winnerBips) / 10000;
            _distributeSportFees(pot - prizeAmount, action.creator); // Distribute remaining fees

        } else { // Charitable
            finalRecipient = action.beneficiary;
            uint256 causeBips = ecosystemManager.getFee("ACTION_CAUSE_BIPS");
            prizeAmount = (pot * causeBips) / 10000;
            _distributeBeneficentFees(pot - prizeAmount, action.creator); // Distribute remaining fees
        }

        action.status = Status.Finalized;
        _returnCreatorStake(action); // Return stake regardless of pot

        if (prizeAmount > 0) {
            require(bkcToken.transfer(finalRecipient, prizeAmount), "FT: Failed to transfer prize"); // Translated
        }

        emit ActionFinalized(_actionId, finalRecipient, prizeAmount);
    }

    /**
     * @notice (NEW) Internal function for distributing *service* fees (50/50).
     * @dev Used by creation and participation fees.
     */
    function _distributeServiceFees(uint256 _amount) internal {
        if (_amount == 0) return;
        address treasury = ecosystemManager.getTreasuryAddress();
        address dm = ecosystemManager.getDelegationManagerAddress();
        require(treasury != address(0), "FT: Treasury not configured in Hub"); // Translated
        require(dm != address(0), "FT: Delegation Manager not configured in Hub"); // Translated

        uint256 treasuryAmount = _amount / 2;
        uint256 delegatorAmount = _amount - treasuryAmount;

        if (treasuryAmount > 0) {
            require(bkcToken.transfer(treasury, treasuryAmount), "FT: Fee to Treasury failed"); // Translated
        }
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }
    }

    /**
     * @dev Distributes the percentages of the Charitable *pot*.
     * @notice CHANGED: Fetches BIPS and addresses from the Hub.
     */
    function _distributeBeneficentFees(uint256 _feeAmount, address _creator) internal {
        if (_feeAmount == 0) return;
        // Fetch addresses from Hub
        address dm = ecosystemManager.getDelegationManagerAddress();
        address treasury = ecosystemManager.getTreasuryAddress();
        require(dm != address(0), "FT: Delegation Manager not configured in Hub"); // Translated
        require(treasury != address(0), "FT: Treasury not configured in Hub"); // Translated

        // Fetch BIPS from Hub
        uint256 delegatorBips = ecosystemManager.getFee("ACTION_CAUSE_DELEGATOR_BIPS");
        uint256 treasuryBips = ecosystemManager.getFee("ACTION_CAUSE_TREASURY_BIPS");
        uint256 creatorBips = ecosystemManager.getFee("ACTION_CAUSE_CREATOR_BIPS");

        uint256 delegatorAmount = (_feeAmount * delegatorBips) / 10000;
        uint256 treasuryAmount = (_feeAmount * treasuryBips) / 10000;
        uint256 creatorAmount = (_feeAmount * creatorBips) / 10000;
        // Ensure total distribution doesn't exceed the fee amount due to rounding
        uint256 totalDistributed = delegatorAmount + treasuryAmount + creatorAmount;
        if (totalDistributed > _feeAmount) {
             // Prioritize delegators slightly in case of rounding dust
             if (delegatorAmount > 0) delegatorAmount -= (totalDistributed - _feeAmount);
             else if(treasuryAmount > 0) treasuryAmount -= (totalDistributed - _feeAmount); // Should not happen if percentages sum <= 10000
             else if(creatorAmount > 0) creatorAmount -= (totalDistributed - _feeAmount);
        }


        if (creatorAmount > 0) require(bkcToken.transfer(_creator, creatorAmount), "FT: Fee to Creator failed"); // Translated
        if (treasuryAmount > 0) require(bkcToken.transfer(treasury, treasuryAmount), "FT: Fee to Treasury failed"); // Translated
        // BUG FIX: Approve DM before calling
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }
    }

    /**
     * @dev Distributes the percentages of the Sporting *pot*.
     * @notice CHANGED: Fetches BIPS and addresses from the Hub.
     */
    function _distributeSportFees(uint256 _feeAmount, address _creator) internal {
         if (_feeAmount == 0) return;
        // Fetch addresses from Hub
        address dm = ecosystemManager.getDelegationManagerAddress();
        address treasury = ecosystemManager.getTreasuryAddress();
        require(dm != address(0), "FT: Delegation Manager not configured in Hub"); // Translated
        require(treasury != address(0), "FT: Treasury not configured in Hub"); // Translated

        // Fetch BIPS from Hub
        uint256 creatorBips = ecosystemManager.getFee("ACTION_SPORT_CREATOR_BIPS");
        uint256 delegatorBips = ecosystemManager.getFee("ACTION_SPORT_DELEGATOR_BIPS");
        uint256 treasuryBips = ecosystemManager.getFee("ACTION_SPORT_TREASURY_BIPS");

        uint256 creatorAmount = (_feeAmount * creatorBips) / 10000;
        uint256 delegatorAmount = (_feeAmount * delegatorBips) / 10000;
        uint256 treasuryAmount = (_feeAmount * treasuryBips) / 10000;
        // Ensure total distribution doesn't exceed the fee amount due to rounding
        uint256 totalDistributed = delegatorAmount + treasuryAmount + creatorAmount;
        if (totalDistributed > _feeAmount) {
             if (delegatorAmount > 0) delegatorAmount -= (totalDistributed - _feeAmount);
             else if(treasuryAmount > 0) treasuryAmount -= (totalDistributed - _feeAmount);
             else if(creatorAmount > 0) creatorAmount -= (totalDistributed - _feeAmount);
        }


        if (creatorAmount > 0) require(bkcToken.transfer(_creator, creatorAmount), "FT: Fee to Creator failed"); // Translated
        if (treasuryAmount > 0) require(bkcToken.transfer(treasury, treasuryAmount), "FT: Fee to Treasury failed"); // Translated
        // BUG FIX: Approve DM before calling
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }
    }

    /**
     * @dev Returns the stake to the creator (old logic maintained).
     */
    function _returnCreatorStake(Action storage action) internal {
        if (!action.isStakeReturned && action.creatorStake > 0) {
            action.isStakeReturned = true;
            // Transfer stake back - make sure contract holds the stake
            require(bkcToken.transfer(action.creator, action.creatorStake), "FT: Failed to return creator stake"); // Translated
            emit StakeReturned(action.id, action.creator, action.creatorStake);
        }
    }

    /**
     * @dev Finds the owner of a specific coupon number using binary search (old logic maintained).
     * @param _actionId The action ID.
     * @param _couponNumber The winning coupon number (1-based index).
     * @return The address of the winner, or address(0) if not found (should not happen if _couponNumber is valid).
     Ambos os erros podem ser corrigidos editando apenas um arquivo: EcosystemManager.sol.
     */
    function _findCouponOwner(uint256 _actionId, uint256 _couponNumber) internal view returns (address) {
        uint256[] memory ranges = couponRanges[_actionId];
        address[] memory owners = couponOwners[_actionId]; // Get owners array

        // Basic validation
        if (ranges.length == 0 || owners.length != ranges.length || _couponNumber == 0 || _couponNumber > ranges[ranges.length - 1]) {
            return address(0);
        }

        // Binary search to find the correct range
        uint256 low = 0;
        uint256 high = ranges.length - 1;
        uint256 winnerIndex = ranges.length; // Initialize to invalid index

        while (low <= high) {
            uint256 mid = low + (high - low) / 2; // Avoid overflow
            uint256 lowerBound = (mid == 0) ? 0 : ranges[mid - 1]; // Lower bound is 0 or the previous range's upper bound

            if (_couponNumber > lowerBound && _couponNumber <= ranges[mid]) {
                // Found the range
                winnerIndex = mid;
                break;
            } else if (_couponNumber > ranges[mid]) {
                // Search in the right half
                low = mid + 1;
            } else {
                 // Coupon number must be <= lowerBound, only possible if mid==0 and _couponNumber==0 (handled above)
                 // Or search in the left half (adjust high)
                 // Check to prevent underflow if mid is 0
                 
                 if (mid == 0) break; // Should not happen if _couponNumber > 0
                 high = mid - 1;
            }
        }

        if (winnerIndex < owners.length) {
            return owners[winnerIndex];
        } else {
            return address(0); // Should not happen with valid input
        }
    }

     // --- View Functions ---

    /**
     * @notice Gets details of a specific action.
     */
    function getAction(uint256 _actionId) external view returns (Action memory) {
        return actions[_actionId];
    }

    /**
     * @notice Gets the list of participants and their coupon ranges for a sporting action.
     * @param _actionId The action ID.
     */
    function getParticipants(uint256 _actionId) external view returns (address[] memory, uint256[] memory) {
        require(actions[_actionId].actionType == ActionType.Sporting, "FT: Not a sporting action"); // Translated
        return (couponOwners[_actionId], couponRanges[_actionId]);
    }
}