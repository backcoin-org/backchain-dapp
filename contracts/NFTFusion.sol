// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// NFT FUSION — IMMUTABLE (Tier 1: ETH only)
// ============================================================================
//
// Burn 2 NFTs of the same tier → Mint 1 NFT of the next tier.
//
//   2 Bronze  → 1 Silver
//   2 Silver  → 1 Gold
//   2 Gold    → 1 Diamond
//
// Economics:
//   - ETH fee per fusion → ecosystem (operator/treasury/buyback)
//   - Per-tier fee IDs allow different costs per tier level
//   - Deflationary: net -1 NFT per fusion
//   - Creates organic demand for lower tiers (need 8 Bronze to make 1 Diamond)
//
// Community-driven supply:
//   - Only Bronze is minted initially (1000 total)
//   - All higher tiers are created ONLY through player fusion
//   - Maximum possible from 1000 Bronze:
//     500 Silver, 250 Gold, 125 Diamond (if ALL are fused)
//
// Security:
//   - Both NFTs must be owned by caller
//   - Both must be same tier
//   - Cannot fuse Diamond (already max tier)
//   - CEI pattern
//   - Reentrancy guard
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

    /// @notice Per-tier ETH fee action IDs
    bytes32 public constant ACTION_FUSE_BRONZE = keccak256("FUSION_BRONZE");
    bytes32 public constant ACTION_FUSE_SILVER = keccak256("FUSION_SILVER");
    bytes32 public constant ACTION_FUSE_GOLD   = keccak256("FUSION_GOLD");

    uint8 public constant TIER_BRONZE  = 0;
    uint8 public constant TIER_SILVER  = 1;
    uint8 public constant TIER_GOLD    = 2;
    uint8 public constant TIER_DIAMOND = 3;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IRewardBoosterV2    public immutable booster;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    uint256 public totalFusions;
    mapping(uint8 => uint256) public fusionsByTier;  // count per source tier

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

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotNFTOwner();
    error TierMismatch();
    error MaxTierReached();
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
    // FUSE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Fuse 2 NFTs of the same tier into 1 of the next tier.
    ///         Both NFTs must be approved for this contract.
    ///         msg.value must cover the ETH fee.
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

        // Verify ownership
        IERC721Fusion nft = IERC721Fusion(address(booster));
        if (nft.ownerOf(tokenId1) != msg.sender) revert NotNFTOwner();
        if (nft.ownerOf(tokenId2) != msg.sender) revert NotNFTOwner();

        // Verify same tier
        uint8 sourceTier = booster.tokenTier(tokenId1);
        if (booster.tokenTier(tokenId2) != sourceTier) revert TierMismatch();
        if (sourceTier >= TIER_DIAMOND) revert MaxTierReached();

        uint8 resultTier = sourceTier + 1;

        // ETH fee
        uint256 ethFee = _getFusionFee(sourceTier);
        if (msg.value < ethFee) revert InsufficientFee();

        // Pull both NFTs from user to this contract
        nft.transferFrom(msg.sender, address(this), tokenId1);
        nft.transferFrom(msg.sender, address(this), tokenId2);

        // Burn both NFTs via booster
        booster.fusionBurn(tokenId1);
        booster.fusionBurn(tokenId2);

        // Mint new higher-tier NFT
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
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get ETH fee required for a fusion at given tier
    function getFusionFee(uint8 sourceTier) external view returns (uint256) {
        return _getFusionFee(sourceTier);
    }

    /// @notice Fusion statistics
    function getStats() external view returns (
        uint256 total,
        uint256 bronzeFusions,
        uint256 silverFusions,
        uint256 goldFusions
    ) {
        return (
            totalFusions,
            fusionsByTier[TIER_BRONZE],
            fusionsByTier[TIER_SILVER],
            fusionsByTier[TIER_GOLD]
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

        // Check if tokens exist and get tiers
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

    function version() external pure returns (string memory) {
        return "1.0.0";
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
}
