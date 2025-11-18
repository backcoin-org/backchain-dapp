// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IDelegationManager
 * @dev Interface to manage user pStake and rewards.
 */
interface IDelegationManager {
    /**
     * @notice Returns the total pStake of a user.
     */
    function userTotalPStake(address _user) external view returns (uint256);

    /**
     * @notice Deposits reward shares from the MiningManager.
     * @dev Updated for the Single Pool model: receives the total amount to be distributed to all delegators.
     */
    function depositMiningRewards(uint256 _amount) external;

    /**
     * @notice Returns the total network pStake.
     */
    function totalNetworkPStake() external view returns (uint256);
}

// ---

/**
 * @title IMiningManager
 * @dev Interface for the Guardian contract that handles all token minting and distribution.
 */
interface IMiningManager {
    /**
     * @notice The central point for all "Proof-of-Purchase" mining and fee distribution.
     * @dev This function triggers both minting (new tokens) and fee distribution (original tokens).
     * @dev No longer returns a bonus; 100% of revenue is distributed to pools.
     */
    function performPurchaseMining(
        string calldata _serviceKey,
        uint256 _purchaseAmount
    ) external;

    /**
     * @notice Calculates the amount of BKC to be minted for a given purchase amount, applying dynamic scarcity.
     */
    function getMintAmount(uint256 _purchaseAmount) external view returns (uint256);
}

// ---

/**
 * @title IRewardBoosterNFT
 * @dev Interface to verify a Booster NFT.
 */
interface IRewardBoosterNFT {
    /**
     * @notice Returns the owner of a tokenId.
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice Returns the Bips value of the booster.
     */
    function boostBips(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Mints a single NFT when called by the authorized sale contract.
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
 * @dev Interface for the Factory that creates NFT Liquidity Pools.
 */
interface INFTLiquidityPoolFactory {
    /**
     * @notice Gets the address of an existing pool for a specific NFT boost tier.
     */
    function getPoolAddress(uint256 _boostBips) external view returns (address);
}

// ---

/**
 * @title INFTLiquidityPool
 * @dev Interface for the individual NFT Liquidity Pool contract.
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
     * @notice Adds more NFTs to an existing pool.
     */
    function addMoreNFTsToPool(uint256[] calldata _tokenIds) external;
}

// ---

/**
 * @title IEcosystemManager
 * @dev The PUBLIC interface of the "Brain" (Hub).
 */
interface IEcosystemManager {
    // --- Rule Getters ---

    /**
     * @notice Returns the service fee and pStake minimum for a given service.
     */
    function getServiceRequirements(
        string calldata _serviceKey
    ) external view returns (uint256 fee, uint256 pStake);
    
    /**
     * @notice Returns the service fee only.
     */
    function getFee(string calldata _serviceKey) external view returns (uint256);

    /**
     * @notice Returns the discount BIPS for a given booster level.
     */
    function getBoosterDiscount(uint256 _boostBips) external view returns (uint256);

    /**
     * @notice Returns the distribution BIPS for *newly minted* tokens (PoP).
     */
    function getMiningDistributionBips(string calldata _poolKey) external view returns (uint256);

    /**
     * @notice Returns the distribution BIPS for *original fee* tokens (PoP).
     */
    function getFeeDistributionBips(string calldata _poolKey) external view returns (uint256);


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