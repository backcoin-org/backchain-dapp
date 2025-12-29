// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Backchain Protocol Interfaces
 * @author Backchain Protocol
 * @notice Defines communication standards between ecosystem contracts
 * @dev All ecosystem contracts reference these interfaces for interoperability.
 *
 *      Architecture Overview:
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                     ECOSYSTEM MANAGER (Hub)                     │
 *      │         Central configuration and address registry              │
 *      └─────────────────────────────────────────────────────────────────┘
 *                                    │
 *          ┌─────────────┬──────────┼──────────┬─────────────┐
 *          ▼             ▼          ▼          ▼             ▼
 *    ┌──────────┐  ┌──────────┐ ┌────────┐ ┌────────┐  ┌──────────┐
 *    │ BKCToken │  │ Mining   │ │Delegate│ │Notary  │  │ Fortune  │
 *    │          │  │ Manager  │ │Manager │ │        │  │ Pool     │
 *    └──────────┘  └──────────┘ └────────┘ └────────┘  └──────────┘
 *          │             │          │          │             │
 *          └─────────────┴──────────┼──────────┴─────────────┘
 *                                   ▼
 *                    ┌─────────────────────────────┐
 *                    │   NFT Liquidity System      │
 *                    │  (Factory + Pools + NFT)    │
 *                    └─────────────────────────────┘
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */

// =============================================================================
//                           ECOSYSTEM MANAGER
// =============================================================================

/**
 * @title IEcosystemManager
 * @notice Central hub for ecosystem configuration and contract registry
 * @dev All ecosystem contracts query this interface for:
 *      - Service fees
 *      - NFT discount tiers
 *      - Distribution ratios
 *      - Contract addresses
 */
interface IEcosystemManager {
    // ─────────────────────────────────────────────────────────────────────────
    // Fee Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the fee for a specific service
     * @dev Fee keys are keccak256 hashes:
     *      - keccak256("DELEGATION_FEE_BIPS") - Staking entry fee
     *      - keccak256("UNSTAKE_FEE_BIPS") - Normal unstake fee
     *      - keccak256("FORCE_UNSTAKE_PENALTY_BIPS") - Early withdrawal penalty
     *      - keccak256("CLAIM_REWARD_FEE_BIPS") - Reward claim fee
     *      - keccak256("NOTARY_SERVICE") - Document notarization fee
     *      - keccak256("NFT_POOL_BUY_TAX_BIPS") - NFT purchase tax
     *      - keccak256("NFT_POOL_SELL_TAX_BIPS") - NFT sale tax
     * @param _serviceKey Service identifier (bytes32 hash)
     * @return Fee amount (interpretation depends on service)
     */
    function getFee(bytes32 _serviceKey) external view returns (uint256);

    /**
     * @notice Returns the discount percentage for an NFT boost tier
     * @dev Maps NFT boost power to fee discount:
     *      - 1000 bips boost → 1000 bips discount (10%)
     *      - 7000 bips boost → 7000 bips discount (70%)
     * @param _boostBips NFT boost power in basis points
     * @return Discount percentage in basis points
     */
    function getBoosterDiscount(uint256 _boostBips) external view returns (uint256);

    // ─────────────────────────────────────────────────────────────────────────
    // Distribution Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns distribution ratio for newly minted tokens
     * @dev Pool keys:
     *      - keccak256("TREASURY") - Protocol treasury
     *      - keccak256("DELEGATOR_POOL") - Staking rewards pool
     * @param _poolKey Pool identifier (bytes32 hash)
     * @return Distribution percentage in basis points (10000 = 100%)
     */
    function getMiningDistributionBips(bytes32 _poolKey) external view returns (uint256);

    /**
     * @notice Returns distribution ratio for fee revenue
     * @param _poolKey Pool identifier (bytes32 hash)
     * @return Distribution percentage in basis points
     */
    function getFeeDistributionBips(bytes32 _poolKey) external view returns (uint256);

    // ─────────────────────────────────────────────────────────────────────────
    // Address Registry
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns BKC token contract address
    function getBKCTokenAddress() external view returns (address);

    /// @notice Returns protocol treasury address
    function getTreasuryAddress() external view returns (address);

    /// @notice Returns DelegationManager contract address
    function getDelegationManagerAddress() external view returns (address);

    /// @notice Returns RewardBoosterNFT contract address
    function getBoosterAddress() external view returns (address);

    /// @notice Returns MiningManager contract address
    function getMiningManagerAddress() external view returns (address);

    /// @notice Returns DecentralizedNotary contract address
    function getDecentralizedNotaryAddress() external view returns (address);

    /// @notice Returns FortunePool contract address
    function getFortunePoolAddress() external view returns (address);

    /// @notice Returns NFTLiquidityPoolFactory contract address
    function getNFTLiquidityPoolFactoryAddress() external view returns (address);
}

// =============================================================================
//                           DELEGATION MANAGER
// =============================================================================

/**
 * @title IDelegationManager
 * @notice Manages staking, time-locks, and reward distribution
 * @dev Implements weighted staking with:
 *      - pStake = amount × lockDays (stake weight)
 *      - Proportional reward distribution
 *      - NFT-based fee discounts
 */
interface IDelegationManager {
    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when tokens are delegated (staked)
     * @param user Staker address
     * @param delegationIndex Index in user's delegation array
     * @param amount Net staked amount (after fees)
     * @param pStakeGenerated Weighted stake value
     * @param feeAmount Fee paid
     */
    event Delegated(
        address indexed user,
        uint256 delegationIndex,
        uint256 amount,
        uint256 pStakeGenerated,
        uint256 feeAmount
    );

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns total weighted stake for a user
     * @param _user User address
     * @return Total pStake value
     */
    function userTotalPStake(address _user) external view returns (uint256);

    /**
     * @notice Returns total weighted stake across all users
     * @return Network-wide pStake sum
     */
    function totalNetworkPStake() external view returns (uint256);

    // ─────────────────────────────────────────────────────────────────────────
    // Reward Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deposits mining rewards for distribution to stakers
     * @dev Only callable by MiningManager
     * @param _amount Amount of BKC to distribute
     */
    function depositMiningRewards(uint256 _amount) external;
}

// =============================================================================
//                            MINING MANAGER
// =============================================================================

/**
 * @title IMiningManager
 * @notice Handles Proof-of-Purchase mining and fee distribution
 * @dev Implements linear scarcity model:
 *      mintAmount = purchaseAmount × (remainingSupply / 160M)
 */
interface IMiningManager {
    /**
     * @notice Processes purchase mining and fee distribution
     * @dev Called by authorized ecosystem contracts when fees are collected.
     *      Caller must transfer fees to MiningManager before calling.
     * @param _serviceKey Service identifier for authorization
     * @param _purchaseAmount Fee amount received
     */
    function performPurchaseMining(
        bytes32 _serviceKey,
        uint256 _purchaseAmount
    ) external;

    /**
     * @notice Calculates mint amount based on current scarcity
     * @param _purchaseAmount Purchase/fee amount
     * @return Amount of new BKC to mint
     */
    function getMintAmount(uint256 _purchaseAmount) external view returns (uint256);
}

// =============================================================================
//                          REWARD BOOSTER NFT
// =============================================================================

/**
 * @title IRewardBoosterNFT
 * @notice Utility NFTs providing fee discounts across the ecosystem
 * @dev Each NFT has a boost power (bips) determining discount tier
 */
interface IRewardBoosterNFT {
    /**
     * @notice Returns the owner of a token
     * @param _tokenId Token identifier
     * @return Owner address
     */
    function ownerOf(uint256 _tokenId) external view returns (address);

    /**
     * @notice Returns the boost power of a token
     * @param _tokenId Token identifier
     * @return Boost value in basis points
     */
    function boostBips(uint256 _tokenId) external view returns (uint256);

    /**
     * @notice Mints NFT from authorized sale contract
     * @dev Only callable by saleContract address
     * @param _to Recipient address
     * @param _boostBips Boost power for the NFT
     * @param _metadataFile Metadata filename
     * @return tokenId Minted token ID
     */
    function mintFromSale(
        address _to,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external returns (uint256 tokenId);

    /**
     * @notice Returns all tokens owned by an address
     * @param _owner Owner address
     * @return Array of token IDs
     */
    function tokensOfOwner(address _owner) external view returns (uint256[] memory);

    /**
     * @notice Returns highest boost NFT owned by address
     * @param _owner Owner address
     * @return tokenId Token with highest boost
     * @return boost Boost value in bips
     */
    function getHighestBoostOf(address _owner) external view returns (
        uint256 tokenId,
        uint256 boost
    );

    /**
     * @notice Checks if address owns any booster NFT
     * @param _owner Address to check
     * @return True if owns at least one NFT
     */
    function hasBooster(address _owner) external view returns (bool);
}

// =============================================================================
//                       NFT LIQUIDITY POOL FACTORY
// =============================================================================

/**
 * @title INFTLiquidityPoolFactory
 * @notice Factory for deploying and tracking NFT liquidity pools
 * @dev Creates one pool per NFT boost tier
 */
interface INFTLiquidityPoolFactory {
    /**
     * @notice Returns pool address for a specific boost tier
     * @param _boostBips NFT boost tier
     * @return Pool contract address (address(0) if not deployed)
     */
    function getPoolAddress(uint256 _boostBips) external view returns (address);

    /**
     * @notice Returns all deployed boost tiers
     * @return Array of boost bips values
     */
    function getDeployedBoostBips() external view returns (uint256[] memory);

    /**
     * @notice Validates if address is a legitimate pool
     * @param _pool Address to check
     * @return True if created by this factory
     */
    function isPool(address _pool) external view returns (bool);

    /**
     * @notice Returns total number of deployed pools
     * @return Pool count
     */
    function getPoolCount() external view returns (uint256);
}

// =============================================================================
//                          NFT LIQUIDITY POOL
// =============================================================================

/**
 * @title INFTLiquidityPool
 * @notice AMM-style liquidity pool for NFT trading
 * @dev Implements bonding curve for NFT price discovery
 */
interface INFTLiquidityPool {
    /**
     * @notice Initializes pool with NFTs and BKC liquidity
     * @dev Only callable once by owner
     * @param _tokenIds Array of NFT token IDs
     * @param _bkcAmount Initial BKC liquidity
     */
    function addInitialLiquidity(
        uint256[] calldata _tokenIds,
        uint256 _bkcAmount
    ) external;

    /**
     * @notice Adds more NFTs to existing pool
     * @dev Can only be called after initialization
     * @param _tokenIds Array of NFT token IDs to add
     */
    function addMoreNFTsToPool(uint256[] calldata _tokenIds) external;

    /**
     * @notice Returns current NFT buy price
     * @return Price in BKC (wei)
     */
    function getBuyPrice() external view returns (uint256);

    /**
     * @notice Returns current NFT sell price
     * @return Price in BKC (wei)
     */
    function getSellPrice() external view returns (uint256);

    /**
     * @notice Returns number of NFTs available in pool
     * @return NFT count
     */
    function getNFTBalance() external view returns (uint256);

    /**
     * @notice Returns BKC liquidity in pool
     * @return BKC balance (wei)
     */
    function getBKCBalance() external view returns (uint256);

    /**
     * @notice Buys NFT from pool
     * @return tokenId Purchased NFT token ID
     */
    function buyNFT() external returns (uint256 tokenId);

    /**
     * @notice Sells NFT to pool
     * @param _tokenId NFT token ID to sell
     */
    function sellNFT(uint256 _tokenId) external;
}

// =============================================================================
//                              BKC TOKEN
// =============================================================================

/**
 * @title IBKCToken
 * @notice Interface for the BKC token
 * @dev Extended ERC20 with controlled minting (no burn functionality)
 */
interface IBKCToken {
    /// @notice Maximum token supply
    function MAX_SUPPLY() external view returns (uint256);

    /// @notice Current total supply
    function totalSupply() external view returns (uint256);

    /// @notice Mints tokens (only owner/MiningManager)
    function mint(address _to, uint256 _amount) external;

    /// @notice Checks if address is blacklisted
    function isBlacklisted(address _account) external view returns (bool);

    /// @notice Returns remaining mintable supply
    function remainingMintableSupply() external view returns (uint256);
}

// =============================================================================
//                            FORTUNE POOL
// =============================================================================

/**
 * @title IFortunePool
 * @notice Interface for the Fortune Pool lottery game
 */
interface IFortunePool {
    /**
     * @notice Returns jackpot tier ID (highest tier)
     * @return Tier ID
     */
    function getJackpotTierId() external view returns (uint256);

    /**
     * @notice Returns required oracle fee for a game mode
     * @param _isCumulative true = 5x mode, false = 1x mode
     * @return Oracle fee in native currency
     */
    function getRequiredOracleFee(bool _isCumulative) external view returns (uint256);

    /**
     * @notice Returns expected guess count for a game mode
     * @param _isCumulative true = all tiers, false = jackpot only
     * @return Number of guesses required
     */
    function getExpectedGuessCount(bool _isCumulative) external view returns (uint256);

    /**
     * @notice Participates in a Fortune Pool game
     * @param _wagerAmount Wager in BKC
     * @param _guesses Player's predictions
     * @param _isCumulative Game mode (false = 1x, true = 5x)
     */
    function participate(
        uint256 _wagerAmount,
        uint256[] calldata _guesses,
        bool _isCumulative
    ) external payable;
}

// =============================================================================
//                        DECENTRALIZED NOTARY
// =============================================================================

/**
 * @title IDecentralizedNotary
 * @notice Interface for document certification
 */
interface IDecentralizedNotary {
    /**
     * @notice Notarizes a document on the blockchain
     * @param _ipfsCid IPFS content identifier
     * @param _description Document description
     * @param _contentHash SHA-256 hash of content
     * @param _boosterTokenId NFT for fee discount (0 = none)
     * @return tokenId Minted certificate NFT ID
     */
    function notarize(
        string calldata _ipfsCid,
        string calldata _description,
        bytes32 _contentHash,
        uint256 _boosterTokenId
    ) external returns (uint256 tokenId);

    /**
     * @notice Returns current notarization fee
     * @return Fee in BKC
     */
    function getBaseFee() external view returns (uint256);

    /**
     * @notice Calculates fee with potential NFT discount
     * @param _boosterTokenId NFT token ID
     * @return Discounted fee
     */
    function calculateFee(uint256 _boosterTokenId) external view returns (uint256);
}
