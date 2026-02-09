// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// LIQUIDITY POOL — IMMUTABLE
// ============================================================================
//
// Constant-product AMM (x × y = k) for ETH/BKC swaps.
//
//   - Two-way swaps: ETH → BKC and BKC → ETH
//   - 0.3% swap fee (stays in pool, rewards LPs)
//   - Slippage protection on all operations (min amounts)
//   - Minimum liquidity lock on first deposit (Uniswap V2 pattern)
//   - Permissionless: anyone can add/remove liquidity or swap
//
// Primary consumer: BuybackMiner calls swapETHforBKC() to convert
// accumulated protocol fees into BKC for staking rewards.
//
// Security:
//   - CEI pattern: all state changes before external calls
//   - Minimum liquidity prevents price manipulation on empty pools
//   - Slippage protection prevents sandwich attacks
//   - No admin functions — fully immutable after deployment
//
// ============================================================================

contract LiquidityPool is ILiquidityPool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Swap fee in basis points (0.3% — standard AMM fee, rewards LPs)
    uint256 public constant SWAP_FEE_BPS = 30;
    uint256 private constant BPS = 10_000;

    /// @notice Minimum LP shares permanently locked on first deposit.
    ///         Prevents price manipulation on empty/near-empty pools.
    ///         First provider must deposit enough that sqrt(eth × bkc) > 1000.
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    IBKCToken public immutable bkcToken;

    uint256 public override ethReserve;
    uint256 public override bkcReserve;

    uint256 public override totalLPShares;
    mapping(address => uint256) public lpShares;

    // Stats (for frontend dashboards)
    // Packed into a single slot: swapCount(64) + ethVolume(96) + bkcVolume(96) = 256 bits
    uint64  public totalSwapCount;
    uint96  public totalEthVolume;  // cumulative ETH swapped (both directions)
    uint96  public totalBkcVolume;  // cumulative BKC swapped (both directions)

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 bkcAmount,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 ethAmount,
        uint256 bkcAmount,
        uint256 shares
    );
    event SwapETHforBKC(address indexed buyer, uint256 ethIn, uint256 bkcOut);
    event SwapBKCforETH(address indexed seller, uint256 bkcIn, uint256 ethOut);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error ZeroAmount();
    error ZeroAddress();
    error InsufficientLiquidity();
    error InsufficientShares();
    error InsufficientInitialLiquidity();
    error SlippageExceeded();
    error TransferFailed();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _bkcToken) {
        if (_bkcToken == address(0)) revert ZeroAddress();
        bkcToken = IBKCToken(_bkcToken);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADD LIQUIDITY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Add ETH + BKC liquidity. Returns LP shares proportional to deposit.
    ///
    ///         First provider: sets the initial price ratio. Must deposit enough
    ///         that sqrt(eth × bkc) > MINIMUM_LIQUIDITY (1000). MINIMUM_LIQUIDITY
    ///         shares are permanently locked to prevent price manipulation.
    ///
    ///         Subsequent providers: shares based on the lesser of two ratios
    ///         (ETH-based and BKC-based). Send tokens in the current pool ratio
    ///         to avoid leaving excess in the pool.
    ///
    /// @param bkcAmount Amount of BKC to deposit (must have approved this contract)
    /// @param minShares Minimum LP shares to receive (slippage protection, 0 to skip)
    /// @return shares   LP shares minted to the caller
    function addLiquidity(
        uint256 bkcAmount,
        uint256 minShares
    ) external payable returns (uint256 shares) {
        if (msg.value == 0 || bkcAmount == 0) revert ZeroAmount();

        // Pull BKC from sender
        bkcToken.transferFrom(msg.sender, address(this), bkcAmount);

        if (totalLPShares == 0) {
            // ── First liquidity provider ──
            // Shares = sqrt(eth × bkc) minus MINIMUM_LIQUIDITY (locked forever)
            shares = _sqrt(msg.value * bkcAmount);
            if (shares <= MINIMUM_LIQUIDITY) revert InsufficientInitialLiquidity();

            shares -= MINIMUM_LIQUIDITY;
            // MINIMUM_LIQUIDITY shares belong to no one — permanently locked
            // This prevents the total share supply from ever reaching 0
            // and makes pool drainage attacks uneconomical
            totalLPShares = MINIMUM_LIQUIDITY;
        } else {
            // ── Subsequent providers ──
            // Take the lesser ratio to maintain price stability
            uint256 sharesByEth = msg.value * totalLPShares / ethReserve;
            uint256 sharesByBkc = bkcAmount * totalLPShares / bkcReserve;
            shares = sharesByEth < sharesByBkc ? sharesByEth : sharesByBkc;
        }

        if (shares == 0) revert ZeroAmount();
        if (shares < minShares) revert SlippageExceeded();

        // Update state
        ethReserve += msg.value;
        bkcReserve += bkcAmount;
        totalLPShares += shares;
        lpShares[msg.sender] += shares;

        emit LiquidityAdded(msg.sender, msg.value, bkcAmount, shares);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REMOVE LIQUIDITY
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Remove liquidity and receive ETH + BKC proportionally.
    ///         Uses CEI pattern: state updates before transfers.
    ///
    /// @param shares    LP shares to burn
    /// @param minEthOut Minimum ETH to receive (slippage protection, 0 to skip)
    /// @param minBkcOut Minimum BKC to receive (slippage protection, 0 to skip)
    /// @return ethAmount ETH returned to caller
    /// @return bkcAmount BKC returned to caller
    function removeLiquidity(
        uint256 shares,
        uint256 minEthOut,
        uint256 minBkcOut
    ) external returns (uint256 ethAmount, uint256 bkcAmount) {
        if (shares == 0) revert ZeroAmount();
        if (shares > lpShares[msg.sender]) revert InsufficientShares();

        // Calculate proportional amounts
        ethAmount = shares * ethReserve / totalLPShares;
        bkcAmount = shares * bkcReserve / totalLPShares;

        // Slippage check
        if (ethAmount < minEthOut || bkcAmount < minBkcOut) revert SlippageExceeded();

        // ── EFFECTS (state changes first — CEI) ──
        lpShares[msg.sender] -= shares;
        totalLPShares -= shares;
        ethReserve -= ethAmount;
        bkcReserve -= bkcAmount;

        // ── INTERACTIONS (external calls last — CEI) ──
        bkcToken.transfer(msg.sender, bkcAmount);
        _sendEth(msg.sender, ethAmount);

        emit LiquidityRemoved(msg.sender, ethAmount, bkcAmount, shares);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SWAP: ETH → BKC
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Swap ETH for BKC using constant-product formula.
    ///         0.3% fee stays in the pool (rewards LPs).
    ///
    ///         Formula: bkcOut = (bkcReserve × ethAfterFee) / (ethReserve + ethAfterFee)
    ///
    /// @param minBkcOut Minimum BKC to receive (slippage protection, pass 1 for no limit)
    /// @return bkcOut   Amount of BKC received
    function swapETHforBKC(
        uint256 minBkcOut
    ) external payable override returns (uint256 bkcOut) {
        if (msg.value == 0) revert ZeroAmount();
        if (bkcReserve == 0) revert InsufficientLiquidity();

        // Apply 0.3% fee (fee stays in pool for LPs)
        uint256 ethInAfterFee = msg.value * (BPS - SWAP_FEE_BPS) / BPS;

        // Constant product: bkcOut = bkcReserve × ethAfterFee / (ethReserve + ethAfterFee)
        bkcOut = (bkcReserve * ethInAfterFee) / (ethReserve + ethInAfterFee);

        if (bkcOut == 0) revert ZeroAmount();
        if (bkcOut > bkcReserve) revert InsufficientLiquidity();
        if (bkcOut < minBkcOut) revert SlippageExceeded();

        // Update reserves (full ETH including fee stays in pool)
        ethReserve += msg.value;
        bkcReserve -= bkcOut;

        // Stats (packed in 1 slot — single SSTORE)
        totalSwapCount++;
        totalEthVolume += uint96(msg.value);
        totalBkcVolume += uint96(bkcOut);

        // Transfer BKC to buyer
        bkcToken.transfer(msg.sender, bkcOut);

        emit SwapETHforBKC(msg.sender, msg.value, bkcOut);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SWAP: BKC → ETH
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Swap BKC for ETH using constant-product formula.
    ///         0.3% fee stays in the pool (rewards LPs).
    ///         Caller must have approved this contract for bkcAmount.
    ///
    ///         Uses CEI: BKC pull + state update before ETH send.
    ///
    /// @param bkcAmount BKC to sell
    /// @param minEthOut Minimum ETH to receive (slippage protection)
    /// @return ethOut   Amount of ETH received
    function swapBKCforETH(
        uint256 bkcAmount,
        uint256 minEthOut
    ) external override returns (uint256 ethOut) {
        if (bkcAmount == 0) revert ZeroAmount();
        if (ethReserve == 0) revert InsufficientLiquidity();

        // Apply 0.3% fee
        uint256 bkcInAfterFee = bkcAmount * (BPS - SWAP_FEE_BPS) / BPS;

        // Constant product: ethOut = ethReserve × bkcAfterFee / (bkcReserve + bkcAfterFee)
        ethOut = (ethReserve * bkcInAfterFee) / (bkcReserve + bkcInAfterFee);

        if (ethOut == 0) revert ZeroAmount();
        if (ethOut > ethReserve) revert InsufficientLiquidity();
        if (ethOut < minEthOut) revert SlippageExceeded();

        // ── EFFECTS (CEI) ──
        // Pull BKC first (incoming asset)
        bkcToken.transferFrom(msg.sender, address(this), bkcAmount);

        // Update reserves (full BKC including fee stays in pool)
        bkcReserve += bkcAmount;
        ethReserve -= ethOut;

        // Stats (packed in 1 slot — single SSTORE)
        totalSwapCount++;
        totalBkcVolume += uint96(bkcAmount);
        totalEthVolume += uint96(ethOut);

        // ── INTERACTION (CEI) ──
        _sendEth(msg.sender, ethOut);

        emit SwapBKCforETH(msg.sender, bkcAmount, ethOut);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Quote: how much BKC you'd get for a given ETH amount (after fee)
    function getQuote(uint256 ethAmount) external view override returns (uint256 bkcOut) {
        if (ethAmount == 0 || bkcReserve == 0 || ethReserve == 0) return 0;

        uint256 ethAfterFee = ethAmount * (BPS - SWAP_FEE_BPS) / BPS;
        bkcOut = (bkcReserve * ethAfterFee) / (ethReserve + ethAfterFee);
    }

    /// @notice Quote: how much ETH you'd get for a given BKC amount (after fee)
    function getQuoteBKCtoETH(uint256 bkcAmount) external view override returns (uint256 ethOut) {
        if (bkcAmount == 0 || ethReserve == 0 || bkcReserve == 0) return 0;

        uint256 bkcAfterFee = bkcAmount * (BPS - SWAP_FEE_BPS) / BPS;
        ethOut = (ethReserve * bkcAfterFee) / (bkcReserve + bkcAfterFee);
    }

    /// @notice Current spot price: how many BKC per 1 ETH (before fees)
    function currentPrice() external view override returns (uint256) {
        if (ethReserve == 0) return 0;
        return bkcReserve * 1 ether / ethReserve;
    }

    /// @notice Get the ETH and BKC value of an LP's shares
    function getLPValue(address provider) external view returns (
        uint256 ethValue,
        uint256 bkcValue,
        uint256 shares,
        uint256 sharePercent // in BPS (10000 = 100%)
    ) {
        shares = lpShares[provider];
        if (shares == 0 || totalLPShares == 0) return (0, 0, 0, 0);

        ethValue = shares * ethReserve / totalLPShares;
        bkcValue = shares * bkcReserve / totalLPShares;
        sharePercent = shares * BPS / totalLPShares;
    }

    /// @notice Get the optimal BKC amount to pair with a given ETH deposit
    ///         (for frontend to suggest the right ratio)
    function getOptimalBkcForEth(uint256 ethAmount) external view returns (uint256 bkcAmount) {
        if (totalLPShares == 0 || ethReserve == 0) return 0;
        bkcAmount = ethAmount * bkcReserve / ethReserve;
    }

    /// @notice Pool statistics for frontend dashboards
    function getPoolStats() external view returns (
        uint256 _ethReserve,
        uint256 _bkcReserve,
        uint256 _totalLPShares,
        uint64  _totalSwapCount,
        uint96  _totalEthVolume,
        uint96  _totalBkcVolume,
        uint256 _currentPrice
    ) {
        _ethReserve = ethReserve;
        _bkcReserve = bkcReserve;
        _totalLPShares = totalLPShares;
        _totalSwapCount = totalSwapCount;
        _totalEthVolume = totalEthVolume;
        _totalBkcVolume = totalBkcVolume;
        _currentPrice = ethReserve > 0 ? bkcReserve * 1 ether / ethReserve : 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    function _sendEth(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice Integer square root (Babylonian method)
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /// @notice Accept ETH directly (e.g., for initial funding or refunds)
    receive() external payable {}
}
