// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================================
// BACKCHAIN ECOSYSTEM — INTERFACES (V2)
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

    /// @notice Relayer sets referrer on behalf of user (gasless)
    function setReferrerFor(address _user, address _referrer) external;

    /// @notice Get the referral relayer address
    function referralRelayer() external view returns (address);

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

    /// @notice Global referral share in basis points (e.g., 1000 = 10%)
    function referralBps() external view returns (uint16);
}

// ─── Staking Pool ──────────────────────────────────────────────────────────

interface IStakingPool {
    /// @notice Called by BuybackMiner/Ecosystem to notify new rewards
    function notifyReward(uint256 bkcAmount) external;

    /// @notice Delegate BKC with time lock
    function delegate(uint256 amount, uint256 lockDays, address operator) external payable;

    /// @notice Delegate BKC on behalf of a beneficiary (for vesting contracts)
    function delegateFor(address beneficiary, uint256 amount, uint256 lockDays) external;

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

// ─── Reward Booster V2 (with Fusion support) ──────────────────────────────

interface IRewardBoosterV2 is IRewardBooster {
    /// @notice Mint an NFT via fusion (only callable by authorized fusion contract)
    function fusionMint(address to, uint8 tier) external returns (uint256 tokenId);

    /// @notice Burn an NFT for fusion (only callable by authorized fusion contract)
    function fusionBurn(uint256 tokenId) external;

    /// @notice Get token tier
    function tokenTier(uint256 tokenId) external view returns (uint8);

    /// @notice Get all tokens owned by user
    function getUserTokens(address user) external view returns (uint256[] memory);
}

// ─── NFT Fusion ────────────────────────────────────────────────────────────

interface INFTFusion {
    /// @notice Fuse 2 NFTs of the same tier into 1 of the next tier
    /// @param tokenId1 First NFT to burn
    /// @param tokenId2 Second NFT to burn
    /// @param operator Frontend operator earning commission
    /// @return newTokenId The newly minted higher-tier NFT
    function fuse(uint256 tokenId1, uint256 tokenId2, address operator)
        external payable returns (uint256 newTokenId);

    /// @notice Split 1 NFT into 2 of the tier below
    function split(uint256 tokenId, address operator)
        external payable returns (uint256[] memory newTokenIds);

    /// @notice Split 1 NFT into 2^N target-tier NFTs (multi-level)
    function splitTo(uint256 tokenId, uint8 targetTier, address operator)
        external payable returns (uint256[] memory newTokenIds);
}

// ─── Airdrop Vesting ───────────────────────────────────────────────────────

interface IAirdropVesting {
    /// @notice Claim airdrop with instant release (auto-stakes for 6 months)
    function claimAndStake(address operator) external payable;

    /// @notice Claim airdrop with vested release (10% per month, 10 months)
    function claimVested() external;

    /// @notice Withdraw available vested tokens
    function withdrawVested() external;

    /// @notice Check claimable amount for a beneficiary
    function getClaimInfo(address beneficiary) external view returns (
        uint256 totalAllocation,
        bool claimed,
        bool stakedOption,
        uint256 vestedWithdrawn,
        uint256 withdrawableNow
    );
}

// ─── Buyback Miner ─────────────────────────────────────────────────────────

interface IBuybackMiner {
    /// @notice Execute buyback + mining (permissionless, caller earns 5%)
    function executeBuyback() external;

    /// @notice Current mining rate in bps (10000 = 100%, 0 = no mining)
    function currentMiningRate() external view returns (uint256 rateBps);

    /// @notice ETH accumulated and ready for buyback
    function pendingBuybackETH() external view returns (uint256);
}
