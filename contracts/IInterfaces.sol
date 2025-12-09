// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Backchain Ecosystem Interfaces
 * @notice Defines the communication standards between the Hub (EcosystemManager) and Spokes.
 * @dev These interfaces are optimized for the BNB Chain using bytes32 for keys to reduce gas costs.
 * Part of the Backchain Protocol (BKC).
 * Optimized for Arbitrum Network.
 */

/**
 * @title IDelegationManager
 * @dev Interface to manage user pStake, rewards, and delegation logic.
 */
interface IDelegationManager {
    /**
     * @notice Returns the total pStake of a user.
     * @param _user The address of the user to query.
     */
    function userTotalPStake(address _user) external view returns (uint256);

    /**
     * @notice Deposits reward shares from the MiningManager.
     * @dev Receives the total amount to be distributed to the Single Global Pool.
     * @param _amount The amount of BKC tokens to distribute.
     */
    function depositMiningRewards(uint256 _amount) external;

    /**
     * @notice Returns the total network pStake.
     */
    function totalNetworkPStake() external view returns (uint256);

    // --- Events ---
    event Delegated(
        address indexed user,
        uint256 delegationIndex,
        uint256 amount,
        uint256 pStakeGenerated,
        uint256 feeAmount
    );
}

// ---

/**
 * @title IMiningManager
 * @dev Interface for the contract handling "Proof-of-Purchase" mining and fee distribution.
 */
interface IMiningManager {
    /**
     * @notice The central point for all "Proof-of-Purchase" mining and fee distribution.
     * @dev Triggers minting (new tokens) and fee distribution (original tokens).
     * @param _serviceKey The hashed service identifier (bytes32) for authorization check.
     * @param _purchaseAmount The amount of fees paid by the user (in Wei).
     */
    function performPurchaseMining(
        bytes32 _serviceKey, 
        uint256 _purchaseAmount
    ) external;

    /**
     * @notice Calculates the amount of BKC to be minted for a given purchase amount.
     * @dev Applies dynamic scarcity logic based on total supply.
     */
    function getMintAmount(uint256 _purchaseAmount) external view returns (uint256);
}

// ---

/**
 * @title IRewardBoosterNFT
 * @dev Interface to interact with the Booster NFT contract.
 */
interface IRewardBoosterNFT {
    /**
     * @notice Returns the owner of a specific token ID.
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice Returns the Boost Bips (power) of a specific token ID.
     */
    function boostBips(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Mints a single NFT when called by an authorized sale contract.
     * @param to Recipient address.
     * @param boostInBips The boost value (e.g., 100 = 1%).
     * @param metadataFile The IPFS/Storage hash or filename.
     */
    function mintFromSale(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) external returns (uint256 tokenId);
}

// ---

/**
 * @title INFTLiquidityPoolFactory
 * @dev Interface for the Factory that deploys and tracks NFT Liquidity Pools.
 */
interface INFTLiquidityPoolFactory {
    /**
     * @notice Gets the address of an existing pool for a specific NFT boost tier.
     */
    function getPoolAddress(uint256 _boostBips) external view returns (address);
    
    /**
     * @notice Returns all BoostBips that have deployed pools.
     * Needed by MiningManager for validation loop.
     */
    function getDeployedBoostBips() external view returns (uint256[] memory);

    /**
     * @notice Checks if an address is a valid pool created by this factory.
     */
    function isPool(address _pool) external view returns (bool);
}

// ---

/**
 * @title INFTLiquidityPool
 * @dev Interface for individual NFT Liquidity Pools (AMM for NFTs).
 */
interface INFTLiquidityPool {
    /**
     * @notice Adds initial liquidity (NFTs + BKC) to the pool.
     */
    function addInitialLiquidity(
        uint256[] calldata _tokenIds,
        uint256 _bkcAmount
    ) external;

    /**
     * @notice Adds more NFTs to an existing initialized pool.
     */
    function addMoreNFTsToPool(uint256[] calldata _tokenIds) external;
}

// ---

/**
 * @title IEcosystemManager
 * @dev The PUBLIC interface of the "Brain" (Hub).
 * Manages configuration and routing.
 */
interface IEcosystemManager {
    // --- Rule Getters ---

    /**
     * @notice Returns the service fee and pStake minimum for a given service.
     * @param _serviceKey The hashed identifier of the service (bytes32).
     */
    function getServiceRequirements(
        bytes32 _serviceKey
    ) external view returns (uint256 fee, uint256 pStake);

    /**
     * @notice Returns the service fee only.
     * @param _serviceKey The hashed identifier of the service (bytes32).
     */
    function getFee(bytes32 _serviceKey) external view returns (uint256);

    /**
     * @notice Returns the discount BIPS for a given booster level.
     */
    function getBoosterDiscount(uint256 _boostBips) external view returns (uint256);

    /**
     * @notice Returns the distribution BIPS for *newly minted* tokens (PoP).
     * @param _poolKey The hashed identifier of the pool (e.g., TREASURY) (bytes32).
     */
    function getMiningDistributionBips(bytes32 _poolKey) external view returns (uint256);

    /**
     * @notice Returns the distribution BIPS for *original fee* tokens (PoP).
     * @param _poolKey The hashed identifier of the pool (bytes32).
     */
    function getFeeDistributionBips(bytes32 _poolKey) external view returns (uint256);

    // --- Address Getters ---
    function getTreasuryAddress() external view returns (address);
    function getDelegationManagerAddress() external view returns (address);
    function getBKCTokenAddress() external view returns (address);
    function getBoosterAddress() external view returns (address);
    function getMiningManagerAddress() external view returns (address);
    function getDecentralizedNotaryAddress() external view returns (address);
    function getFortunePoolAddress() external view returns (address);
    function getNFTLiquidityPoolFactoryAddress() external view returns (address);
}