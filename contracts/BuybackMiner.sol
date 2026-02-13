// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// BUYBACK MINER V2 — IMMUTABLE ECONOMICS + CONFIGURABLE EXECUTION FEE
// ============================================================================
//
// The economic engine of Backchain. Converts accumulated ETH protocol fees
// into BKC rewards for stakers via a buy-and-mint mechanism.
//
// When ANY ETH accumulates in the BackchainEcosystem,
// ANYONE can call executeBuyback() to trigger the cycle:
//
//   1. Caller pays small execution fee (anti-spam, added to buyback)
//   2. Pull ETH from BackchainEcosystem
//   3. Caller earns 5% of TOTAL ETH (ecosystem + fee) as incentive
//   4. Buy BKC from LiquidityPool with remaining 95%
//   5. Mint NEW BKC proportional to scarcity (linear curve → 200M cap)
//   6. Burn 5% of total BKC (purchased + mined)
//   7. Send 95% to StakingPool as rewards for delegators
//
// The execution fee is ADDED to the buyback amount, amplifying the purchase.
// Caller receives 5% of the total (ecosystem + fee), so net cost is 95% of fee.
//
// MINING SCARCITY CURVE (linear decrease):
//   rate = (MAX_SUPPLY - currentSupply) / MAX_MINTABLE
//
//   Supply  40M (start) → mining rate 100% (1:1 with purchased)
//   Supply 120M          → mining rate  50%
//   Supply 160M          → mining rate  25%
//   Supply 200M (cap)    → mining rate   0% (pure real yield, no inflation)
//
// Owner can change: swap target (liquidity pool), execution fee.
// Owner CANNOT change: caller reward, mining curve, burn rate.
//
// ============================================================================

contract BuybackMiner is IBuybackMiner {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Absolute max BKC supply (matches BKCToken)
    uint256 public constant MAX_SUPPLY = 200_000_000 ether; // 200M

    /// @notice Maximum BKC that can ever be minted via mining (200M - 40M TGE)
    uint256 public constant MAX_MINTABLE = 160_000_000 ether; // 160M

    /// @notice Caller incentive: 5% of ETH goes to whoever calls executeBuyback()
    uint256 public constant CALLER_BPS = 500; // 5%

    /// @notice Burn rate: 5% of total BKC (purchased + mined) is burned
    uint256 public constant BURN_BPS = 500; // 5%

    uint256 private constant BPS = 10_000;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE ADDRESSES
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IBKCToken public immutable bkcToken;
    ILiquidityPool public liquidityPool;        // configurable — owner can redirect to new pool
    IStakingPool public immutable stakingPool;

    /// @notice Anti-spam fee to execute buyback (configurable by owner, added to buyback)
    uint256 public executionFee;

    // ════════════════════════════════════════════════════════════════════════
    // GOVERNANCE (two-step ownership — for swap target management)
    // ════════════════════════════════════════════════════════════════════════

    address public owner;
    address public pendingOwner;

    // ════════════════════════════════════════════════════════════════════════
    // STATS (lifetime counters — packed into 2 structs for fewer SSTOREs)
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Lifetime stats — all 256-bit for accuracy, 7 storage slots
    uint256 public totalEthSpent;         // ETH used for buybacks (excluding caller rewards)
    uint256 public totalBkcPurchased;     // BKC bought from LiquidityPool
    uint256 public totalBkcMined;         // BKC minted via scarcity curve
    uint256 public totalBkcBurned;        // BKC burned (5% of each buyback)
    uint256 public totalBkcToStakers;     // BKC sent to StakingPool as rewards
    uint256 public totalCallerRewards;    // ETH paid to callers as incentive
    uint256 public totalBuybacks;         // Number of buybacks executed

    /// @dev Last buyback info — packed into 2 slots instead of 5
    ///      Slot 1: caller(20) + timestamp(5) + block(5) = 30 bytes
    ///      Slot 2: eth(16) + bkcTotal(16) = 32 bytes
    struct LastBuyback {
        address caller;        // 20 bytes
        uint40  timestamp;     // 5 bytes (good until year 36812)
        uint40  blockNumber;   // 5 bytes
        uint128 ethSpent;      // 16 bytes
        uint128 bkcTotal;      // 16 bytes
    }
    LastBuyback internal _lastBuyback;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event BuybackExecuted(
        address indexed caller,
        uint256 indexed buybackNumber,
        uint256 callerReward,
        uint256 ethSpent,
        uint256 bkcPurchased,
        uint256 bkcMined,
        uint256 bkcBurned,
        uint256 bkcToStakers,
        uint256 miningRateBps
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NoPurchase();
    error SlippageExceeded();
    error TransferFailed();
    error InsufficientFee();
    error NotOwner();
    error NotPendingOwner();
    error ZeroAddress();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(
        address _ecosystem,
        address _bkcToken,
        address _liquidityPool,
        address _stakingPool
    ) {
        ecosystem = IBackchainEcosystem(_ecosystem);
        bkcToken = IBKCToken(_bkcToken);
        liquidityPool = ILiquidityPool(_liquidityPool);
        stakingPool = IStakingPool(_stakingPool);
        owner = msg.sender;
    }

    // ════════════════════════════════════════════════════════════════════════
    // EXECUTE BUYBACK (permissionless — anyone can call, earns 5%)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Execute the buyback cycle. Permissionless — anyone can call.
    ///         Caller must send >= executionFee ETH (anti-spam).
    ///         Fee is ADDED to buyback, amplifying BKC purchase.
    ///         Caller earns 5% of total ETH (ecosystem + fee) as incentive.
    function executeBuyback() external payable override {
        if (msg.value < executionFee) revert InsufficientFee();
        _executeBuyback(0);
    }

    /// @notice Execute buyback with slippage protection.
    ///         Same as executeBuyback() but reverts if total BKC output
    ///         (purchased + mined) is less than minTotalBkcOut.
    function executeBuybackWithSlippage(uint256 minTotalBkcOut) external payable {
        if (msg.value < executionFee) revert InsufficientFee();
        _executeBuyback(minTotalBkcOut);
    }

    function _executeBuyback(uint256 minTotalBkcOut) internal {
        // 1. Pull ETH from ecosystem + add caller's fee (amplifies buyback)
        uint256 ethFromEcosystem = ecosystem.withdrawBuybackETH();
        uint256 ethAmount = ethFromEcosystem + msg.value;
        if (ethAmount == 0) revert NoPurchase();

        // 2. Caller incentive (5% of ETH)
        uint256 callerReward = ethAmount * CALLER_BPS / BPS;
        uint256 ethForBuyback = ethAmount - callerReward;

        // 3. Capture mining rate BEFORE mint (for accurate event)
        uint256 miningRate = currentMiningRate();

        // 4. Buy BKC from liquidity pool
        //    minBkcOut=1 here; slippage check on total (purchased+mined) below
        uint256 bkcPurchased = liquidityPool.swapETHforBKC{value: ethForBuyback}(1);
        if (bkcPurchased == 0) revert NoPurchase();

        // 5. Mine new BKC (scarcity curve)
        uint256 bkcMined = _calculateMining(bkcPurchased);
        if (bkcMined > 0) {
            bkcToken.mint(address(this), bkcMined);
        }

        // 6. Slippage check on total output
        uint256 totalBkc = bkcPurchased + bkcMined;
        if (minTotalBkcOut > 0 && totalBkc < minTotalBkcOut) revert SlippageExceeded();

        // 7. Burn 5%
        uint256 burnAmount = totalBkc * BURN_BPS / BPS;
        if (burnAmount > 0) {
            bkcToken.burn(burnAmount);
        }

        // 8. Staking rewards = 95%
        uint256 rewardAmount = totalBkc - burnAmount;
        if (rewardAmount > 0) {
            bkcToken.transfer(address(stakingPool), rewardAmount);
            stakingPool.notifyReward(rewardAmount);
        }

        // 9. Update stats (before caller reward to follow CEI)
        totalBuybacks++;
        totalEthSpent += ethForBuyback;
        totalBkcPurchased += bkcPurchased;
        totalBkcMined += bkcMined;
        totalBkcBurned += burnAmount;
        totalBkcToStakers += rewardAmount;
        totalCallerRewards += callerReward;

        // Last buyback info (packed struct — 2 SSTOREs instead of 5)
        _lastBuyback = LastBuyback({
            caller: msg.sender,
            timestamp: uint40(block.timestamp),
            blockNumber: uint40(block.number),
            ethSpent: uint128(ethForBuyback),
            bkcTotal: uint128(totalBkc)
        });

        // 10. Pay caller reward LAST (CEI: external call after all state changes)
        (bool ok, ) = payable(msg.sender).call{value: callerReward}("");
        if (!ok) revert TransferFailed();

        emit BuybackExecuted(
            msg.sender,
            totalBuybacks,
            callerReward,
            ethForBuyback,
            bkcPurchased,
            bkcMined,
            burnAmount,
            rewardAmount,
            miningRate
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // MINING: SCARCITY CURVE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Calculate new BKC to mint based on linear scarcity.
    ///
    ///         rate = (MAX_SUPPLY - currentSupply) / MAX_MINTABLE
    ///
    ///         At 40M supply (start): rate = 160M/160M = 100%
    ///         At 80M supply:         rate = 120M/160M = 75%
    ///         At 120M supply:        rate = 80M/160M  = 50%
    ///         At 160M supply:        rate = 40M/160M  = 25%
    ///         At 200M supply (cap):  rate = 0/160M    = 0%
    ///
    ///         mintAmount = bkcPurchased × rate
    ///
    /// @param bkcPurchased Amount of BKC bought from pool (basis for mining calc)
    /// @return mintAmount  New BKC to mint (0 if cap reached)
    function _calculateMining(uint256 bkcPurchased) internal view returns (uint256) {
        uint256 currentSupply = bkcToken.totalSupply();

        // Cap reached — no more mining
        if (currentSupply >= MAX_SUPPLY) return 0;

        uint256 remaining = MAX_SUPPLY - currentSupply;

        // Early stage: if remaining >= MAX_MINTABLE, cap rate at 100%
        if (remaining >= MAX_MINTABLE) return bkcPurchased;

        // Linear decrease: mint proportionally to remaining capacity
        return (bkcPurchased * remaining) / MAX_MINTABLE;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: MINING & SUPPLY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Current mining rate in basis points (10000 = 100%, 0 = no mining)
    function currentMiningRate() public view override returns (uint256 rateBps) {
        uint256 currentSupply = bkcToken.totalSupply();
        if (currentSupply >= MAX_SUPPLY) return 0;

        uint256 remaining = MAX_SUPPLY - currentSupply;
        if (remaining >= MAX_MINTABLE) return BPS; // 100%

        return (remaining * BPS) / MAX_MINTABLE;
    }

    /// @notice How much ETH is waiting for buyback in the ecosystem
    function pendingBuybackETH() external view override returns (uint256) {
        return ecosystem.buybackAccumulated();
    }

    /// @notice Supply information for frontend dashboards
    function getSupplyInfo() external view returns (
        uint256 currentSupply,
        uint256 maxSupply,
        uint256 totalMintedViaMining,
        uint256 remainingMintable,
        uint256 miningRateBps,
        uint256 totalBurnedLifetime
    ) {
        currentSupply = bkcToken.totalSupply();
        maxSupply = MAX_SUPPLY;
        totalMintedViaMining = totalBkcMined;
        remainingMintable = bkcToken.mintableRemaining();
        miningRateBps = currentMiningRate();
        totalBurnedLifetime = bkcToken.totalBurned();
    }

    /// @notice Preview what mining would produce at a given supply level.
    ///         Useful for charting the scarcity curve on frontend.
    ///
    /// @param supplyLevel   Hypothetical total supply (in wei)
    /// @param purchaseAmount Hypothetical BKC purchase amount
    /// @return miningAmount BKC that would be minted
    /// @return rateBps      Mining rate at that supply level
    function previewMiningAtSupply(
        uint256 supplyLevel,
        uint256 purchaseAmount
    ) external pure returns (uint256 miningAmount, uint256 rateBps) {
        if (supplyLevel >= MAX_SUPPLY) return (0, 0);

        uint256 remaining = MAX_SUPPLY - supplyLevel;

        if (remaining >= MAX_MINTABLE) {
            return (purchaseAmount, BPS); // 100%
        }

        rateBps = (remaining * BPS) / MAX_MINTABLE;
        miningAmount = (purchaseAmount * remaining) / MAX_MINTABLE;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: BUYBACK PREVIEW & STATS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Preview what a buyback would produce right now.
    ///         All values are estimates (actual swap may differ slightly).
    function previewBuyback() external view returns (
        uint256 ethAvailable,
        uint256 estimatedBkcPurchased,
        uint256 estimatedBkcMined,
        uint256 estimatedBurn,
        uint256 estimatedToStakers,
        uint256 estimatedCallerReward,
        uint256 currentMiningRateBps,
        bool    isReady
    ) {
        ethAvailable = ecosystem.buybackAccumulated();
        isReady = ethAvailable > 0;

        if (!isReady) return (ethAvailable, 0, 0, 0, 0, 0, currentMiningRate(), false);

        estimatedCallerReward = ethAvailable * CALLER_BPS / BPS;
        uint256 ethForBuyback = ethAvailable - estimatedCallerReward;

        estimatedBkcPurchased = liquidityPool.getQuote(ethForBuyback);
        estimatedBkcMined = _calculateMining(estimatedBkcPurchased);

        uint256 total = estimatedBkcPurchased + estimatedBkcMined;
        estimatedBurn = total * BURN_BPS / BPS;
        estimatedToStakers = total - estimatedBurn;
        currentMiningRateBps = currentMiningRate();
    }

    /// @notice Comprehensive buyback statistics for frontend dashboards
    function getBuybackStats() external view returns (
        uint256 _totalBuybacks,
        uint256 _totalEthSpent,
        uint256 _totalBkcPurchased,
        uint256 _totalBkcMined,
        uint256 _totalBkcBurned,
        uint256 _totalBkcToStakers,
        uint256 _totalCallerRewards,
        uint256 _averageEthPerBuyback,
        uint256 _averageBkcPerBuyback
    ) {
        _totalBuybacks = totalBuybacks;
        _totalEthSpent = totalEthSpent;
        _totalBkcPurchased = totalBkcPurchased;
        _totalBkcMined = totalBkcMined;
        _totalBkcBurned = totalBkcBurned;
        _totalBkcToStakers = totalBkcToStakers;
        _totalCallerRewards = totalCallerRewards;

        if (totalBuybacks > 0) {
            _averageEthPerBuyback = totalEthSpent / totalBuybacks;
            _averageBkcPerBuyback = (totalBkcPurchased + totalBkcMined) / totalBuybacks;
        }
    }

    /// @notice Info about the most recent buyback execution
    function getLastBuyback() external view returns (
        uint256 timestamp,
        uint256 blockNumber,
        address caller,
        uint256 ethSpent,
        uint256 bkcTotal,
        uint256 timeSinceLast
    ) {
        LastBuyback memory lb = _lastBuyback;
        timestamp = uint256(lb.timestamp);
        blockNumber = uint256(lb.blockNumber);
        caller = lb.caller;
        ethSpent = uint256(lb.ethSpent);
        bkcTotal = uint256(lb.bkcTotal);
        timeSinceLast = lb.timestamp > 0
            ? block.timestamp - uint256(lb.timestamp)
            : 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN: SWAP TARGET (configurable — follow liquidity across DEXs)
    // ════════════════════════════════════════════════════════════════════════

    event SwapTargetUpdated(address indexed oldPool, address indexed newPool);
    event ExecutionFeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Change the liquidity pool used for buyback swaps.
    ///         Allows DAO to redirect buybacks to wherever liquidity is deepest.
    function setSwapTarget(address _pool) external onlyOwner {
        if (_pool == address(0)) revert ZeroAddress();
        emit SwapTargetUpdated(address(liquidityPool), _pool);
        liquidityPool = ILiquidityPool(_pool);
    }

    /// @notice Set the execution fee for buyback (anti-spam, added to buyback).
    ///         Set to 0 for free buybacks. Fee goes into the buyback itself.
    function setExecutionFee(uint256 _fee) external onlyOwner {
        emit ExecutionFeeUpdated(executionFee, _fee);
        executionFee = _fee;
    }

    /// @notice Initiate ownership transfer. New owner must call acceptOwnership().
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    /// @notice Accept the pending ownership transfer.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice Accept ETH from ecosystem (via withdrawBuybackETH)
    receive() external payable {}
}
