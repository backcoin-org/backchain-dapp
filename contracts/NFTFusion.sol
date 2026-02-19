// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NFT FUSION — IMMUTABLE (Tier 1: ETH only)
// ============================================================================
//
// Two-way NFT tier transformation:
//
// FUSE (up):   Burn 2 same-tier NFTs → Mint 1 next-tier NFT
//   2 Bronze  → 1 Silver
//   2 Silver  → 1 Gold
//   2 Gold    → 1 Diamond
//
// SPLIT (down): Burn 1 NFT → Mint 2 lower-tier NFTs
//   1 Silver  → 2 Bronze
//   1 Gold    → 2 Silver
//   1 Diamond → 2 Gold
//
// SPLIT TO (multi-level down): Burn 1 NFT → Mint 2^N target-tier NFTs
//   1 Diamond → 2 Gold   (1 level)
//   1 Diamond → 4 Silver (2 levels)
//   1 Diamond → 8 Bronze (3 levels)
//   1 Gold    → 2 Silver (1 level)
//   1 Gold    → 4 Bronze (2 levels)
//   1 Silver  → 2 Bronze (1 level)
//
// Economics:
//   - ETH fee per operation → ecosystem (operator/treasury/buyback)
//   - Split fee > Fuse fee (splitting is a premium service)
//   - Creates bidirectional arbitrage between tier pools
//   - Generates continuous ETH fee revenue from tier trading
//
// No admin. No pause. Fully immutable.
//
// ============================================================================

/// @dev Minimal ERC721 interface
interface IERC721Fusion {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract NFTFusion is INFTFusion {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID = keccak256("NFT_FUSION");

    /// @notice Fuse fee action IDs (per source tier)
    bytes32 public constant ACTION_FUSE_BRONZE = keccak256("FUSION_BRONZE");
    bytes32 public constant ACTION_FUSE_SILVER = keccak256("FUSION_SILVER");
    bytes32 public constant ACTION_FUSE_GOLD   = keccak256("FUSION_GOLD");

    /// @notice Split fee action IDs (per source tier)
    bytes32 public constant ACTION_SPLIT_SILVER  = keccak256("SPLIT_SILVER");
    bytes32 public constant ACTION_SPLIT_GOLD    = keccak256("SPLIT_GOLD");
    bytes32 public constant ACTION_SPLIT_DIAMOND = keccak256("SPLIT_DIAMOND");

    uint8 public constant TIER_BRONZE  = 0;
    uint8 public constant TIER_SILVER  = 1;
    uint8 public constant TIER_GOLD    = 2;
    uint8 public constant TIER_DIAMOND = 3;

    /// @notice Premium surcharge on splitTo (multi-level split convenience fee)
    uint256 public constant SPLITTO_PREMIUM_BPS = 2000; // 20% premium
    uint256 private constant BPS = 10_000;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IRewardBoosterV2    public immutable booster;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    uint256 public totalFusions;
    uint256 public totalSplits;
    mapping(uint8 => uint256) public fusionsByTier;  // count per source tier
    mapping(uint8 => uint256) public splitsByTier;   // count per source tier

    // Reentrancy guard
    uint8 private _locked;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event Fused(
        address indexed user,
        uint256 indexed tokenId1,
        uint256 indexed tokenId2,
        uint256 newTokenId,
        uint8 sourceTier,
        uint8 resultTier,
        address operator
    );

    event Split(
        address indexed user,
        uint256 indexed burnedTokenId,
        uint8 sourceTier,
        uint8 targetTier,
        uint256 mintCount,
        uint256[] newTokenIds,
        address operator
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotNFTOwner();
    error TierMismatch();
    error MaxTierReached();
    error MinTierReached();
    error InvalidTargetTier();
    error SameToken();
    error InsufficientFee();
    error Reentrancy();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    modifier nonReentrant() {
        if (_locked == 1) revert Reentrancy();
        _locked = 1;
        _;
        _locked = 0;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem, address _booster) {
        ecosystem = IBackchainEcosystem(_ecosystem);
        booster   = IRewardBoosterV2(_booster);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FUSE (2 → 1 higher)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Fuse 2 NFTs of the same tier into 1 of the next tier.
    ///         Both NFTs must be approved for this contract.
    ///
    /// @param tokenId1 First NFT to burn
    /// @param tokenId2 Second NFT to burn
    /// @param operator Frontend operator earning commission
    /// @return newTokenId The newly minted higher-tier NFT
    function fuse(
        uint256 tokenId1,
        uint256 tokenId2,
        address operator
    ) external payable override nonReentrant returns (uint256 newTokenId) {
        if (tokenId1 == tokenId2) revert SameToken();

        IERC721Fusion nft = IERC721Fusion(address(booster));
        if (nft.ownerOf(tokenId1) != msg.sender) revert NotNFTOwner();
        if (nft.ownerOf(tokenId2) != msg.sender) revert NotNFTOwner();

        uint8 sourceTier = booster.tokenTier(tokenId1);
        if (booster.tokenTier(tokenId2) != sourceTier) revert TierMismatch();
        if (sourceTier >= TIER_DIAMOND) revert MaxTierReached();

        uint8 resultTier = sourceTier + 1;

        // ETH fee
        uint256 ethFee = _getFusionFee(sourceTier);
        if (msg.value < ethFee) revert InsufficientFee();

        // Pull + burn both NFTs
        nft.transferFrom(msg.sender, address(this), tokenId1);
        nft.transferFrom(msg.sender, address(this), tokenId2);
        booster.fusionBurn(tokenId1);
        booster.fusionBurn(tokenId2);

        // Mint higher-tier NFT
        newTokenId = booster.fusionMint(msg.sender, resultTier);

        // Stats
        totalFusions++;
        fusionsByTier[sourceTier]++;

        // ETH fee to ecosystem
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit Fused(
            msg.sender, tokenId1, tokenId2,
            newTokenId, sourceTier, resultTier, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SPLIT (1 → 2 lower)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Split 1 NFT into 2 of the tier below.
    ///         e.g., 1 Diamond → 2 Gold, 1 Silver → 2 Bronze
    ///         NFT must be approved for this contract.
    ///
    /// @param tokenId  NFT to split
    /// @param operator Frontend operator earning commission
    /// @return newTokenIds The 2 newly minted lower-tier NFTs
    function split(
        uint256 tokenId,
        address operator
    ) external payable nonReentrant returns (uint256[] memory newTokenIds) {
        IERC721Fusion nft = IERC721Fusion(address(booster));
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();

        uint8 sourceTier = booster.tokenTier(tokenId);
        if (sourceTier == TIER_BRONZE) revert MinTierReached();

        uint8 targetTier = sourceTier - 1;

        // ETH fee (based on source tier being split)
        uint256 ethFee = _getSplitFee(sourceTier);
        if (msg.value < ethFee) revert InsufficientFee();

        // Pull + burn source NFT
        nft.transferFrom(msg.sender, address(this), tokenId);
        booster.fusionBurn(tokenId);

        // Mint 2 lower-tier NFTs
        newTokenIds = new uint256[](2);
        newTokenIds[0] = booster.fusionMint(msg.sender, targetTier);
        newTokenIds[1] = booster.fusionMint(msg.sender, targetTier);

        // Stats
        totalSplits++;
        splitsByTier[sourceTier]++;

        // ETH fee to ecosystem
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit Split(
            msg.sender, tokenId,
            sourceTier, targetTier, 2,
            newTokenIds, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SPLIT TO (1 → 2^N target tier, multi-level)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Split 1 NFT into multiple lower-tier NFTs in a single tx.
    ///         e.g., 1 Diamond → 8 Bronze (3 levels), 1 Gold → 4 Bronze (2 levels)
    ///         Mints 2^(sourceTier - targetTier) NFTs of the target tier.
    ///         Fee = sum of split fees for each level traversed.
    ///
    /// @param tokenId    NFT to split
    /// @param targetTier Target tier (must be < source tier)
    /// @param operator   Frontend operator earning commission
    /// @return newTokenIds All newly minted NFTs
    function splitTo(
        uint256 tokenId,
        uint8 targetTier,
        address operator
    ) external payable nonReentrant returns (uint256[] memory newTokenIds) {
        IERC721Fusion nft = IERC721Fusion(address(booster));
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();

        uint8 sourceTier = booster.tokenTier(tokenId);
        if (sourceTier == TIER_BRONZE) revert MinTierReached();
        if (targetTier >= sourceTier) revert InvalidTargetTier();

        uint8 levels = sourceTier - targetTier;

        // Calculate total fee (sum of fees for each level + 20% convenience premium)
        uint256 baseFee = _getMultiSplitFee(sourceTier, targetTier);
        uint256 totalFee = baseFee + (baseFee * SPLITTO_PREMIUM_BPS / BPS);
        if (msg.value < totalFee) revert InsufficientFee();

        // Pull + burn source NFT
        nft.transferFrom(msg.sender, address(this), tokenId);
        booster.fusionBurn(tokenId);

        // Calculate mint count: 2^levels
        uint256 mintCount = 1 << levels; // 2^1=2, 2^2=4, 2^3=8

        // Mint all target-tier NFTs
        newTokenIds = new uint256[](mintCount);
        for (uint256 i; i < mintCount;) {
            newTokenIds[i] = booster.fusionMint(msg.sender, targetTier);
            unchecked { ++i; }
        }

        // Stats
        totalSplits++;
        splitsByTier[sourceTier]++;

        // ETH fee to ecosystem
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit Split(
            msg.sender, tokenId,
            sourceTier, targetTier, mintCount,
            newTokenIds, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get ETH fee for a fusion (2 → 1 up)
    function getFusionFee(uint8 sourceTier) external view returns (uint256) {
        return _getFusionFee(sourceTier);
    }

    /// @notice Get ETH fee for a split (1 → 2 down, one level)
    function getSplitFee(uint8 sourceTier) external view returns (uint256) {
        return _getSplitFee(sourceTier);
    }

    /// @notice Get total ETH fee for a multi-level split (1 → 2^N target tier)
    ///         Includes 20% convenience premium over step-by-step splits
    function getMultiSplitFee(uint8 sourceTier, uint8 targetTier) external view returns (uint256) {
        uint256 baseFee = _getMultiSplitFee(sourceTier, targetTier);
        return baseFee + (baseFee * SPLITTO_PREMIUM_BPS / BPS);
    }

    /// @notice Statistics
    function getStats() external view returns (
        uint256 _totalFusions,
        uint256 _totalSplits,
        uint256 bronzeFusions,
        uint256 silverFusions,
        uint256 goldFusions,
        uint256 silverSplits,
        uint256 goldSplits,
        uint256 diamondSplits
    ) {
        return (
            totalFusions,
            totalSplits,
            fusionsByTier[TIER_BRONZE],
            fusionsByTier[TIER_SILVER],
            fusionsByTier[TIER_GOLD],
            splitsByTier[TIER_SILVER],
            splitsByTier[TIER_GOLD],
            splitsByTier[TIER_DIAMOND]
        );
    }

    /// @notice Preview fusion result
    function previewFusion(uint256 tokenId1, uint256 tokenId2) external view returns (
        uint8 sourceTier,
        uint8 resultTier,
        uint256 ethFee,
        bool canFuse
    ) {
        IERC721Fusion nft = IERC721Fusion(address(booster));

        try nft.ownerOf(tokenId1) returns (address) {
            try nft.ownerOf(tokenId2) returns (address) {
                sourceTier = booster.tokenTier(tokenId1);
                uint8 tier2 = booster.tokenTier(tokenId2);

                if (sourceTier == tier2 && sourceTier < TIER_DIAMOND && tokenId1 != tokenId2) {
                    resultTier = sourceTier + 1;
                    ethFee = _getFusionFee(sourceTier);
                    canFuse = true;
                }
            } catch {}
        } catch {}
    }

    /// @notice Preview split result (includes 20% splitTo premium for multi-level)
    function previewSplit(uint256 tokenId, uint8 targetTier) external view returns (
        uint8 sourceTier,
        uint256 mintCount,
        uint256 ethFee,
        bool canSplit
    ) {
        IERC721Fusion nft = IERC721Fusion(address(booster));

        try nft.ownerOf(tokenId) returns (address) {
            sourceTier = booster.tokenTier(tokenId);

            if (sourceTier > TIER_BRONZE && targetTier < sourceTier) {
                uint8 levels = sourceTier - targetTier;
                mintCount = 1 << levels;
                uint256 baseFee = _getMultiSplitFee(sourceTier, targetTier);
                ethFee = baseFee + (baseFee * SPLITTO_PREMIUM_BPS / BPS);
                canSplit = true;
            }
        } catch {}
    }

    function version() external pure returns (string memory) {
        return "3.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    function _getFusionFee(uint8 sourceTier) internal view returns (uint256) {
        if (sourceTier == TIER_BRONZE) return ecosystem.calculateFee(ACTION_FUSE_BRONZE, 0);
        if (sourceTier == TIER_SILVER) return ecosystem.calculateFee(ACTION_FUSE_SILVER, 0);
        if (sourceTier == TIER_GOLD)   return ecosystem.calculateFee(ACTION_FUSE_GOLD, 0);
        return 0;
    }

    function _getSplitFee(uint8 sourceTier) internal view returns (uint256) {
        if (sourceTier == TIER_SILVER)  return ecosystem.calculateFee(ACTION_SPLIT_SILVER, 0);
        if (sourceTier == TIER_GOLD)    return ecosystem.calculateFee(ACTION_SPLIT_GOLD, 0);
        if (sourceTier == TIER_DIAMOND) return ecosystem.calculateFee(ACTION_SPLIT_DIAMOND, 0);
        return 0;
    }

    /// @dev Sum of split fees for each level: Diamond→Bronze = split(Diamond) + split(Gold) + split(Silver)
    function _getMultiSplitFee(uint8 sourceTier, uint8 targetTier) internal view returns (uint256 total) {
        for (uint8 t = sourceTier; t > targetTier;) {
            total += _getSplitFee(t);
            unchecked { --t; }
        }
    }
}
