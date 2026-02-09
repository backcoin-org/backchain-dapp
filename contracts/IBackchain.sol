// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================================
// BACKCHAIN ECOSYSTEM — INTERFACES
// ============================================================================
// All module contracts reference these interfaces.
// Logic is immutable. Parameters are configurable via BackchainEcosystem.
// ============================================================================

// ─── BKC Token ─────────────────────────────────────────────────────────────

interface IBKCToken {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
    function totalBurned() external view returns (uint256);
    function mintableRemaining() external view returns (uint256);
}

// ─── Backchain Ecosystem (Central Hub) ─────────────────────────────────────

interface IBackchainEcosystem {
    /// @notice Modules call this to collect and distribute fees.
    ///         ETH is sent as msg.value.
    ///         BKC (Tier 2) must be pre-approved by the calling module (msg.sender).
    /// @param user          The end user performing the action (for event logging)
    /// @param operator      Frontend builder earning operator share
    /// @param customRecipient Module-specific recipient (creator, pool, seller)
    /// @param moduleId      Registered module identifier
    /// @param bkcFee        BKC fee amount (0 for Tier 1 modules)
    function collectFee(
        address user,
        address operator,
        address customRecipient,
        bytes32 moduleId,
        uint256 bkcFee
    ) external payable;

    /// @notice Calculate the ETH fee for an action.
    /// @dev    Gas-based fees use tx.gasprice which is 0 in eth_call.
    ///         Frontend should pass { gasPrice } override from provider.getFeeData().
    /// @param actionId  keccak256 of the action name (e.g., "BACKCHAT_POST")
    /// @param txValue   Transaction value (used for value-based fees)
    /// @return fee      The ETH fee amount in wei
    function calculateFee(
        bytes32 actionId,
        uint256 txValue
    ) external view returns (uint256 fee);

    /// @notice Set referrer (once, global, permanent)
    function setReferrer(address _referrer) external;

    /// @notice Get a user's referrer
    function referredBy(address user) external view returns (address);

    /// @notice Get the treasury address
    function treasury() external view returns (address);

    /// @notice Withdraw accumulated ETH (for operators and treasury)
    function withdrawEth() external;

    /// @notice BuybackMiner calls this to pull accumulated buyback ETH
    function withdrawBuybackETH() external returns (uint256);

    /// @notice ETH accumulated for buyback
    function buybackAccumulated() external view returns (uint256);

    /// @notice Pending ETH for a given address (operator or treasury)
    function pendingEth(address account) external view returns (uint256);

    /// @notice Referral count for a given address
    function referralCount(address referrer) external view returns (uint256);
}

// ─── Staking Pool ──────────────────────────────────────────────────────────

interface IStakingPool {
    /// @notice Called by BuybackMiner/Ecosystem to notify new rewards
    function notifyReward(uint256 bkcAmount) external;

    /// @notice Delegate BKC with time lock
    function delegate(uint256 amount, uint256 lockDays, address operator) external payable;

    /// @notice Claim accumulated staking rewards
    function claimRewards() external;

    /// @notice Unstake after lock period
    function unstake(uint256 index) external;

    /// @notice View pending rewards for a user
    function pendingRewards(address user) external view returns (uint256);

    /// @notice Total pStake in the system
    function totalPStake() external view returns (uint256);

    /// @notice Total BKC currently delegated
    function totalBkcDelegated() external view returns (uint256);

    /// @notice Number of delegations for a user
    function delegationCount(address user) external view returns (uint256);

    /// @notice User's total pStake
    function userTotalPStake(address user) external view returns (uint256);
}

// ─── Liquidity Pool (AMM Bonding Curve) ────────────────────────────────────

interface ILiquidityPool {
    /// @notice Swap ETH for BKC via constant-product AMM
    /// @param minBkcOut Minimum BKC to receive (slippage protection)
    /// @return bkcOut Amount of BKC received
    function swapETHforBKC(uint256 minBkcOut) external payable returns (uint256 bkcOut);

    /// @notice Swap BKC for ETH via constant-product AMM
    /// @param bkcAmount BKC to sell (must have approved this contract)
    /// @param minEthOut Minimum ETH to receive (slippage protection)
    /// @return ethOut Amount of ETH received
    function swapBKCforETH(uint256 bkcAmount, uint256 minEthOut) external returns (uint256 ethOut);

    /// @notice Quote: how much BKC for a given ETH amount
    function getQuote(uint256 ethAmount) external view returns (uint256 bkcOut);

    /// @notice Quote: how much ETH for a given BKC amount
    function getQuoteBKCtoETH(uint256 bkcAmount) external view returns (uint256 ethOut);

    /// @notice Current BKC reserve in the pool
    function bkcReserve() external view returns (uint256);

    /// @notice Current ETH reserve in the pool
    function ethReserve() external view returns (uint256);

    /// @notice Current price: BKC per 1 ETH
    function currentPrice() external view returns (uint256);

    /// @notice Total LP shares issued
    function totalLPShares() external view returns (uint256);
}

// ─── Reward Booster (NFT Boost System) ─────────────────────────────────────

interface IRewardBooster {
    /// @notice Get the best boost for a user (owned or rented NFTs)
    /// @return boostBips Boost in basis points:
    ///         0 = none, 1000 = Bronze, 2500 = Silver, 4000 = Gold, 5000 = Diamond
    function getUserBestBoost(address user) external view returns (uint256 boostBips);
}

// ─── Buyback Miner ─────────────────────────────────────────────────────────

interface IBuybackMiner {
    /// @notice Execute buyback + mining (permissionless, caller earns 1%)
    function executeBuyback() external;

    /// @notice Current mining rate in bps (10000 = 100%, 0 = no mining)
    function currentMiningRate() external view returns (uint256 rateBps);

    /// @notice ETH accumulated and ready for buyback
    function pendingBuybackETH() external view returns (uint256);
}
