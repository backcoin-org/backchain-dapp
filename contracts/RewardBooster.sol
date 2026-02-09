// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// REWARD BOOSTER — ERC721 NFT (Immutable)
// ============================================================================
//
// 4-tier utility NFT that boosts staking rewards by reducing burn rate.
//
//   Tier        Boost    Burn Rate    User Keeps
//   Bronze      10%      40%          60%
//   Silver      25%      25%          75%
//   Gold        40%      10%          90%
//   Diamond     50%      0%           100%
//   No NFT      0%       50%          50%
//
// Minimal ERC721 implementation (no OpenZeppelin dependency).
// Traded via NFTPool bonding curve contracts.
// getUserBestBoost() called by StakingPool on every claim.
//
// Setup:
//   1. Deploy RewardBooster
//   2. Deploy 4 NFTPools
//   3. Call configurePools() (one-time, locks forever)
//   4. Call mintBatch() for initial inventory (only before configure)
//
// No admin. No pause. Fixed supply after configuration.
//
// ============================================================================

/// @dev ERC721 receiver interface for safeTransferFrom
interface IERC721Receiver {
    function onERC721Received(
        address operator, address from, uint256 tokenId, bytes calldata data
    ) external returns (bytes4);
}

contract RewardBooster is IRewardBooster {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    string  public constant name   = "Backchain Reward Booster";
    string  public constant symbol = "BKCB";

    uint256 public constant BOOST_BRONZE  = 1000;   // 10% boost
    uint256 public constant BOOST_SILVER  = 2500;   // 25% boost
    uint256 public constant BOOST_GOLD    = 4000;   // 40% boost
    uint256 public constant BOOST_DIAMOND = 5000;   // 50% boost

    uint8 public constant TIER_BRONZE  = 0;
    uint8 public constant TIER_SILVER  = 1;
    uint8 public constant TIER_GOLD    = 2;
    uint8 public constant TIER_DIAMOND = 3;
    uint8 public constant TIER_COUNT   = 4;

    // ERC165 interface IDs
    bytes4 private constant ERC165_ID     = 0x01ffc9a7;
    bytes4 private constant ERC721_ID     = 0x80ac58cd;
    bytes4 private constant ERC721META_ID = 0x5b5e139f;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — ERC721
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint256 => address) internal _owners;
    mapping(address => uint256) internal _balances;
    mapping(uint256 => address) internal _tokenApprovals;
    mapping(address => mapping(address => bool)) internal _operatorApprovals;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — NFT TIERS
    // ════════════════════════════════════════════════════════════════════════

    uint256 public totalSupply;
    mapping(uint256 => uint8) public tokenTier;

    /// @dev Per-user token tracking for getUserBestBoost enumeration
    mapping(address => uint256[]) internal _userTokens;
    mapping(uint256 => uint256)   internal _tokenIdx;

    /// @dev Cached best boost — updated on every transfer. O(1) read.
    mapping(address => uint256) internal _bestBoost;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — AUTHORIZATION
    // ════════════════════════════════════════════════════════════════════════

    address public immutable deployer;
    mapping(address => bool) public authorizedPool;
    bool public configured;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event PoolsConfigured(address[4] pools);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error ZeroAddress();
    error NotOwnerOrApproved();
    error TokenNotFound();
    error InvalidTier();
    error NotAuthorized();
    error AlreadyConfigured();
    error NonERC721Receiver();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _deployer) {
        deployer = _deployer;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SETUP (one-time, locks forever)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Register the 4 NFTPool addresses. Can only be called once.
    ///         After this, no more minting is possible — fixed supply forever.
    function configurePools(address[4] calldata pools) external {
        if (msg.sender != deployer) revert NotAuthorized();
        if (configured) revert AlreadyConfigured();
        configured = true;
        for (uint256 i; i < 4;) {
            authorizedPool[pools[i]] = true;
            unchecked { ++i; }
        }
        emit PoolsConfigured(pools);
    }

    /// @notice Mint initial NFT inventory. Only deployer, only before configure.
    /// @param to    Recipient (typically deployer, who then funds pools)
    /// @param tier  NFT tier (0-3)
    /// @param count Number of NFTs to mint
    /// @return startId First minted token ID
    function mintBatch(address to, uint8 tier, uint256 count) external returns (uint256 startId) {
        if (msg.sender != deployer) revert NotAuthorized();
        if (configured) revert AlreadyConfigured();
        if (tier >= TIER_COUNT) revert InvalidTier();

        startId = totalSupply + 1;
        for (uint256 i; i < count;) {
            uint256 tokenId = ++totalSupply;
            tokenTier[tokenId] = tier;
            _mint(to, tokenId);
            unchecked { ++i; }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // IRewardBooster
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get the best boost for a user. O(1) — cached on every transfer.
    ///         Called by StakingPool on every claim to determine burn rate.
    function getUserBestBoost(address user) external view override returns (uint256) {
        return _bestBoost[user];
    }

    // ════════════════════════════════════════════════════════════════════════
    // ERC721 — VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address owner) {
        owner = _owners[tokenId];
        if (owner == address(0)) revert TokenNotFound();
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        if (_owners[tokenId] == address(0)) revert TokenNotFound();
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == ERC165_ID || id == ERC721_ID;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ERC721 — MUTATIONS
    // ════════════════════════════════════════════════════════════════════════

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender))
            revert NotOwnerOrApproved();
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotOwnerOrApproved();
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        _safeTransfer(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external {
        _safeTransfer(from, to, tokenId, data);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS — NFT DATA
    // ════════════════════════════════════════════════════════════════════════

    function getTokenInfo(uint256 tokenId) external view returns (
        address owner, uint8 tier, uint256 boostBips
    ) {
        owner = ownerOf(tokenId);
        tier = tokenTier[tokenId];
        boostBips = _tierBoost(tier);
    }

    function getUserTokens(address user) external view returns (uint256[] memory) {
        return _userTokens[user];
    }

    function getTierBoost(uint8 tier) external pure returns (uint256) {
        return _tierBoost(tier);
    }

    function getTierName(uint8 tier) external pure returns (string memory) {
        if (tier == TIER_BRONZE)  return "Bronze";
        if (tier == TIER_SILVER)  return "Silver";
        if (tier == TIER_GOLD)    return "Gold";
        if (tier == TIER_DIAMOND) return "Diamond";
        return "None";
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — ERC721
    // ════════════════════════════════════════════════════════════════════════

    function _mint(address to, uint256 tokenId) internal {
        if (to == address(0)) revert ZeroAddress();
        _owners[tokenId] = to;
        _balances[to]++;
        _addToUser(to, tokenId);
        _updateBoostAdd(to, tokenId);
        emit Transfer(address(0), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) revert ZeroAddress();
        if (_owners[tokenId] != from) revert NotOwnerOrApproved();

        delete _tokenApprovals[tokenId];

        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;

        _removeFromUser(from, tokenId);
        _addToUser(to, tokenId);
        _updateBoostRemove(from, tokenId);
        _updateBoostAdd(to, tokenId);

        emit Transfer(from, to, tokenId);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        transferFrom(from, to, tokenId);
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data)
            returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector)
                    revert NonERC721Receiver();
            } catch {
                revert NonERC721Receiver();
            }
        }
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return spender == owner
            || _tokenApprovals[tokenId] == spender
            || _operatorApprovals[owner][spender];
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — USER TOKEN TRACKING
    // ════════════════════════════════════════════════════════════════════════

    function _addToUser(address user, uint256 tokenId) internal {
        _tokenIdx[tokenId] = _userTokens[user].length;
        _userTokens[user].push(tokenId);
    }

    function _removeFromUser(address user, uint256 tokenId) internal {
        uint256 idx = _tokenIdx[tokenId];
        uint256 lastIdx = _userTokens[user].length - 1;
        if (idx != lastIdx) {
            uint256 lastId = _userTokens[user][lastIdx];
            _userTokens[user][idx] = lastId;
            _tokenIdx[lastId] = idx;
        }
        _userTokens[user].pop();
        delete _tokenIdx[tokenId];
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL — BOOST CACHE
    // ════════════════════════════════════════════════════════════════════════

    function _updateBoostAdd(address user, uint256 tokenId) internal {
        uint256 boost = _tierBoost(tokenTier[tokenId]);
        if (boost > _bestBoost[user]) {
            _bestBoost[user] = boost;
        }
    }

    function _updateBoostRemove(address user, uint256 tokenId) internal {
        uint256 removed = _tierBoost(tokenTier[tokenId]);
        if (removed >= _bestBoost[user]) {
            // Recalculate — only when removing the best or equal tier
            uint256 best;
            uint256 len = _userTokens[user].length;
            for (uint256 i; i < len;) {
                uint256 b = _tierBoost(tokenTier[_userTokens[user][i]]);
                if (b > best) best = b;
                unchecked { ++i; }
            }
            _bestBoost[user] = best;
        }
    }

    function _tierBoost(uint8 tier) internal pure returns (uint256) {
        if (tier == TIER_BRONZE)  return BOOST_BRONZE;
        if (tier == TIER_SILVER)  return BOOST_SILVER;
        if (tier == TIER_GOLD)    return BOOST_GOLD;
        if (tier == TIER_DIAMOND) return BOOST_DIAMOND;
        return 0;
    }
}
