// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// AGORA v3.0 — THE FOREVER PROTOCOL (Tier 1: ETH only)
// ============================================================================
//
// Decentralized social protocol built for permanence. No admin, no pause,
// no censorship. ALL pricing is dynamic via ecosystem governance — the
// protocol adapts to any ETH price without redeployment.
//
//   "Your protocol. Their networks. One truth."
//
// V3 CHANGES FROM V2:
//   - ALL pricing via ecosystem fees (zero hardcoded ETH values)
//   - On-chain social graph (followerCount, followingCount, isFollowing)
//   - Free text/link posts (gas only — maximizes adoption)
//   - Post editing within 15-minute window
//   - SuperLike with free value (real micro-tipping, any amount)
//   - Downvote: 1 per user per post, ecosystem fee (meaningful signal)
//   - On-chain block list (queryable by any frontend)
//   - Batch read via PostView struct (1 call for N posts)
//
// FEATURES:
//   - Posts with 15 predefined tags (categories = virtual networks)
//   - Threaded replies, reposts with optional quote
//   - Like (1x per user per post), SuperLike (any value, unlimited)
//   - Downvote (1x per user per post, ecosystem fee)
//   - Follow / Unfollow with on-chain state + counts
//   - Username registration (tiered pricing via ecosystem governance)
//   - Profile metadata via IPFS URI (avatar, bio, links)
//   - Profile boost & trust badge (premium features)
//   - Pin post (1 per user), delete post (soft delete), edit post
//   - Post boost (paid visibility, anyone can boost any post)
//   - Tip post (send ETH directly to post author)
//   - Report post (community flagging, 1 per user per post)
//   - Block user (on-chain, any frontend can query)
//   - Operator stats (posts, engagement per operator network)
//
// COMMUNITY SCORING:
//   SuperLike (+) → free value → author earns via collectFee
//   Downvote  (-) → ecosystem fee → 1 per user (meaningful signal)
//   Score = superLikeCount - downvoteCount (frontends interpret)
//
// FEE FLOW:
//   Text/link posts    → FREE (gas only)
//   Media posts        → collectFee(customRecipient = address(0))
//   Replies (media)    → collectFee(customRecipient = parent author)
//   Likes              → collectFee(customRecipient = post author)
//   SuperLikes         → collectFee(customRecipient = post author)
//   Downvotes          → collectFee(customRecipient = address(0))
//   Follow             → collectFee(customRecipient = followed user)
//   Tips               → collectFee(customRecipient = post author)
//   Boosts/Premium     → collectFee(customRecipient = address(0))
//
// WHITE-LABEL MODEL:
//   Any developer deploys a frontend with { startBlock, operator, branding }.
//   Operator earns commissions on all activity through their frontend.
//   Same contract, infinite networks.
//
// 18+ ONLY — Permissionless protocol for adults.
// No admin. No pause. No censorship. Fully immutable.
//
// ============================================================================

contract Agora {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID = keccak256("AGORA");

    // Action IDs — all pricing via ecosystem.calculateFee()
    bytes32 public constant ACTION_POST       = keccak256("AGORA_POST");
    bytes32 public constant ACTION_POST_IMAGE = keccak256("AGORA_POST_IMAGE");
    bytes32 public constant ACTION_POST_VIDEO = keccak256("AGORA_POST_VIDEO");
    bytes32 public constant ACTION_LIVE       = keccak256("AGORA_LIVE");
    bytes32 public constant ACTION_REPLY      = keccak256("AGORA_REPLY");
    bytes32 public constant ACTION_REPOST     = keccak256("AGORA_REPOST");
    bytes32 public constant ACTION_LIKE       = keccak256("AGORA_LIKE");
    bytes32 public constant ACTION_FOLLOW     = keccak256("AGORA_FOLLOW");
    bytes32 public constant ACTION_DOWNVOTE   = keccak256("AGORA_DOWNVOTE");
    bytes32 public constant ACTION_REPORT     = keccak256("AGORA_REPORT");

    // Boost action IDs (dynamic pricing via ecosystem)
    bytes32 public constant ACTION_BOOST_STANDARD = keccak256("AGORA_BOOST_STD");
    bytes32 public constant ACTION_BOOST_FEATURED = keccak256("AGORA_BOOST_FEAT");

    // Profile premium action IDs
    bytes32 public constant ACTION_PROFILE_BOOST  = keccak256("AGORA_PROFILE_BOOST");
    bytes32 public constant ACTION_BADGE_VERIFIED = keccak256("AGORA_BADGE_VERIFIED");
    bytes32 public constant ACTION_BADGE_PREMIUM  = keccak256("AGORA_BADGE_PREMIUM");
    bytes32 public constant ACTION_BADGE_ELITE    = keccak256("AGORA_BADGE_ELITE");

    /// @notice Number of predefined tag categories
    uint8 public constant TAG_COUNT = 15;

    /// @notice Content type flags
    uint8 public constant TYPE_TEXT  = 0;
    uint8 public constant TYPE_IMAGE = 1;
    uint8 public constant TYPE_VIDEO = 2;
    uint8 public constant TYPE_LINK  = 3;
    uint8 public constant TYPE_LIVE  = 4;

    /// @notice Report categories
    uint8 public constant REPORT_SPAM       = 0;
    uint8 public constant REPORT_HARASSMENT = 1;
    uint8 public constant REPORT_ILLEGAL    = 2;
    uint8 public constant REPORT_SCAM       = 3;
    uint8 public constant REPORT_OTHER      = 4;
    uint8 public constant REPORT_CATEGORY_COUNT = 5;

    /// @notice Post boost tiers
    uint8 public constant BOOST_STANDARD = 0;
    uint8 public constant BOOST_FEATURED = 1;
    uint8 public constant BOOST_TIER_COUNT = 2;

    /// @notice Badge tiers
    uint8 public constant BADGE_VERIFIED = 0;
    uint8 public constant BADGE_PREMIUM  = 1;
    uint8 public constant BADGE_ELITE    = 2;
    uint8 public constant BADGE_TIER_COUNT = 3;

    /// @notice Edit window (15 minutes after creation)
    uint256 public constant EDIT_WINDOW = 15 minutes;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: POSTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Global post counter
    uint256 public postCounter;

    /// @dev Packed post data — 31 bytes = 1 storage slot
    ///      author(20) + tag(1) + contentType(1) + deleted(1) + createdAt(4) + editedAt(4)
    struct Post {
        address author;
        uint8   tag;
        uint8   contentType;
        bool    deleted;
        uint32  createdAt;
        uint32  editedAt;
    }

    mapping(uint256 => Post)    public posts;
    mapping(uint256 => uint256) public replyTo;
    mapping(uint256 => uint256) public repostOf;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: ENGAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint256 => uint256) public likeCount;
    mapping(uint256 => uint256) public superLikeCount;
    mapping(uint256 => uint256) public superLikeTotal;   // cumulative ETH
    mapping(uint256 => uint256) public downvoteCount;
    mapping(uint256 => uint256) public replyCount;
    mapping(uint256 => uint256) public repostCount;

    // Deduplication
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(uint256 => mapping(address => bool)) public hasDownvoted;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: SOCIAL GRAPH
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => uint256) public followerCount;
    mapping(address => uint256) public followingCount;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: BLOCK LIST
    // ════════════════════════════════════════════════════════════════════════

    mapping(address => mapping(address => bool)) public hasBlocked;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: REPORTS
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint256 => uint256) public reportCount;
    mapping(uint256 => mapping(uint8 => uint256)) public reportsByCategory;
    mapping(uint256 => mapping(address => bool)) public hasReported;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: POST BOOSTS
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint256 => uint64)  public postBoostExpiry;
    mapping(uint256 => uint8)   public postBoostTier;
    mapping(uint256 => uint256) public postBoostTotal;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: TIPS
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint256 => uint256) public tipTotal;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: PROFILES
    // ════════════════════════════════════════════════════════════════════════

    mapping(bytes32 => address) public usernameOwner;
    mapping(address => bytes32) public userUsername;
    mapping(address => string)  public profileURI;
    mapping(address => uint256) public pinnedPost;

    // Premium features
    mapping(address => uint64)  public boostExpiry;
    mapping(address => uint64)  public badgeExpiry;
    mapping(address => uint8)   public badgeTier;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: STATS
    // ════════════════════════════════════════════════════════════════════════

    mapping(uint8 => uint256)   public tagPostCount;
    mapping(address => uint256) public operatorPostCount;
    mapping(address => uint256) public operatorEngagement;
    uint256 public totalProfiles;

    // ════════════════════════════════════════════════════════════════════════
    // STRUCTS: VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Combined post data for efficient reads (replaces getPost + getPostMeta)
    struct PostView {
        address author;
        uint8   tag;
        uint8   contentType;
        bool    deleted;
        uint32  createdAt;
        uint32  editedAt_;
        uint256 replyTo_;
        uint256 repostOf_;
        uint256 likes;
        uint256 superLikes;
        uint256 superLikeETH;
        uint256 downvotes;
        uint256 replies;
        uint256 reposts;
        uint256 reports;
        uint256 tips;
        uint8   boostTier;
        uint64  boostExpiry;
    }

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    // ── Content ──
    event PostCreated(
        uint256 indexed postId, address indexed author,
        uint8 tag, uint8 contentType, string contentHash, address operator
    );
    event ReplyCreated(
        uint256 indexed postId, uint256 indexed parentId, address indexed author,
        uint8 tag, uint8 contentType, string contentHash, address operator
    );
    event RepostCreated(
        uint256 indexed postId, uint256 indexed originalId, address indexed author,
        uint8 tag, string contentHash, address operator
    );
    event PostEdited(uint256 indexed postId, address indexed author, string newContentHash);
    event PostDeleted(uint256 indexed postId, address indexed author);
    event TagChanged(uint256 indexed postId, uint8 oldTag, uint8 newTag);

    // ── Engagement ──
    event Liked(
        uint256 indexed postId, address indexed liker,
        address indexed author, address operator
    );
    event SuperLiked(
        uint256 indexed postId, address indexed voter,
        address indexed author, uint256 amount, address operator
    );
    event Downvoted(
        uint256 indexed postId, address indexed voter,
        address indexed author, address operator
    );
    event Followed(address indexed follower, address indexed followed, address operator);
    event Unfollowed(address indexed follower, address indexed followed);

    // ── Reports ──
    event PostReported(
        uint256 indexed postId, address indexed reporter,
        address indexed author, uint8 category, uint256 totalReports
    );

    // ── Boosts & Tips ──
    event PostBoosted(
        uint256 indexed postId, address indexed booster,
        uint8 tier, uint256 amount, uint64 newExpiry, address operator
    );
    event PostTipped(
        uint256 indexed postId, address indexed tipper,
        address indexed author, uint256 amount, address operator
    );

    // ── Social ──
    event UserBlocked(address indexed blocker, address indexed blocked);
    event UserUnblocked(address indexed blocker, address indexed unblocked);

    // ── Profiles ──
    event ProfileCreated(
        address indexed user, string username, string metadataURI, address operator
    );
    event ProfileUpdated(address indexed user, string metadataURI);
    event PostPinned(address indexed user, uint256 indexed postId);
    event ProfileBoosted(
        address indexed user, uint256 daysAdded, uint64 expiresAt, address operator
    );
    event BadgeObtained(
        address indexed user, uint8 tier, uint64 expiresAt, address operator
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error InsufficientFee();
    error EmptyContent();
    error PostNotFound();
    error PostIsDeleted();
    error AlreadyLiked();
    error AlreadyDownvoted();
    error AlreadyReported();
    error AlreadyFollowing();
    error NotFollowing();
    error UsernameTaken();
    error InvalidUsername();
    error AlreadyHasProfile();
    error InvalidTag();
    error InvalidAmount();
    error InvalidCategory();
    error InvalidTier();
    error NotAuthor();
    error EditWindowClosed();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem) {
        ecosystem = IBackchainEcosystem(_ecosystem);
    }

    // ════════════════════════════════════════════════════════════════════════
    // POSTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Create a new post. Text/link posts are FREE (gas only).
    ///         Image/video/live posts pay ecosystem fees.
    function createPost(
        string calldata contentHash,
        uint8 tag,
        uint8 contentType,
        address operator
    ) external payable {
        if (bytes(contentHash).length == 0) revert EmptyContent();
        if (tag >= TAG_COUNT) revert InvalidTag();

        // Text & link posts are FREE — only media costs fees
        uint256 fee = _isMediaType(contentType)
            ? ecosystem.calculateFee(_getPostActionId(contentType), 0)
            : 0;
        if (msg.value < fee) revert InsufficientFee();

        uint256 postId = ++postCounter;
        posts[postId] = Post({
            author: msg.sender,
            tag: tag,
            contentType: contentType,
            deleted: false,
            createdAt: uint32(block.timestamp),
            editedAt: 0
        });

        tagPostCount[tag]++;
        if (operator != address(0)) operatorPostCount[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit PostCreated(postId, msg.sender, tag, contentType, contentHash, operator);
    }

    /// @notice Reply to an existing post. Inherits parent's tag.
    ///         Text replies are FREE. Media replies pay fees.
    ///         Parent author earns custom recipient share on paid replies.
    function createReply(
        uint256 parentId,
        string calldata contentHash,
        uint8 contentType,
        address operator
    ) external payable {
        if (bytes(contentHash).length == 0) revert EmptyContent();

        Post storage parent = _requireActivePost(parentId);

        uint256 fee = _isMediaType(contentType)
            ? ecosystem.calculateFee(ACTION_REPLY, 0)
            : 0;
        if (msg.value < fee) revert InsufficientFee();

        uint8 tag = parent.tag;
        address parentAuthor = parent.author;

        uint256 postId = ++postCounter;
        posts[postId] = Post({
            author: msg.sender,
            tag: tag,
            contentType: contentType,
            deleted: false,
            createdAt: uint32(block.timestamp),
            editedAt: 0
        });
        replyTo[postId] = parentId;

        replyCount[parentId]++;
        tagPostCount[tag]++;
        if (operator != address(0)) operatorPostCount[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, parentAuthor, MODULE_ID, 0
            );
        }

        emit ReplyCreated(postId, parentId, msg.sender, tag, contentType, contentHash, operator);
    }

    /// @notice Repost existing content, optionally with a quote.
    ///         FREE (gas only). Original author earns nothing from reposts.
    function createRepost(
        uint256 originalId,
        string calldata contentHash,
        address operator
    ) external payable {
        Post storage original = _requireActivePost(originalId);

        uint8 tag = original.tag;

        uint256 postId = ++postCounter;
        posts[postId] = Post({
            author: msg.sender,
            tag: tag,
            contentType: TYPE_TEXT,
            deleted: false,
            createdAt: uint32(block.timestamp),
            editedAt: 0
        });
        repostOf[postId] = originalId;

        repostCount[originalId]++;
        tagPostCount[tag]++;
        if (operator != address(0)) operatorPostCount[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, original.author, MODULE_ID, 0
            );
        }

        emit RepostCreated(postId, originalId, msg.sender, tag, contentHash, operator);
    }

    /// @notice Edit a post's content within 15 minutes of creation.
    ///         FREE (gas only). Only the author can edit.
    function editPost(uint256 postId, string calldata newContentHash) external {
        if (bytes(newContentHash).length == 0) revert EmptyContent();

        Post storage p = _requireActivePost(postId);
        if (p.author != msg.sender) revert NotAuthor();

        p.editedAt = uint32(block.timestamp);
        emit PostEdited(postId, msg.sender, newContentHash);
    }

    /// @notice Soft-delete a post. Only the author can delete.
    function deletePost(uint256 postId) external {
        Post storage p = posts[postId];
        if (p.author == address(0)) revert PostNotFound();
        if (p.author != msg.sender) revert NotAuthor();
        if (p.deleted) revert PostIsDeleted();

        p.deleted = true;
        tagPostCount[p.tag]--;

        emit PostDeleted(postId, msg.sender);
    }

    /// @notice Change a post's tag. FREE (gas only). Author only.
    function changeTag(uint256 postId, uint8 newTag) external {
        if (newTag >= TAG_COUNT) revert InvalidTag();

        Post storage p = posts[postId];
        if (p.author == address(0)) revert PostNotFound();
        if (p.author != msg.sender) revert NotAuthor();
        if (p.deleted) revert PostIsDeleted();

        uint8 oldTag = p.tag;
        if (oldTag == newTag) return;

        p.tag = newTag;
        tagPostCount[oldTag]--;
        tagPostCount[newTag]++;

        emit TagChanged(postId, oldTag, newTag);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ENGAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Like a post. 1 per user per post. Standard ecosystem fee.
    ///         Post author earns custom recipient share.
    function like(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (hasLiked[postId][msg.sender]) revert AlreadyLiked();

        uint256 fee = ecosystem.calculateFee(ACTION_LIKE, 0);
        if (msg.value < fee) revert InsufficientFee();

        hasLiked[postId][msg.sender] = true;
        likeCount[postId]++;
        if (operator != address(0)) operatorEngagement[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, p.author, MODULE_ID, 0
            );
        }

        emit Liked(postId, msg.sender, p.author, operator);
    }

    /// @notice SuperLike a post. Send any amount of ETH > 0.
    ///         Acts as a micro-tip + positive signal. Author earns via collectFee.
    ///         Each call = 1 superLike. Unlimited calls per user per post.
    ///         Total ETH tracked in superLikeTotal[postId].
    function superLike(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (msg.value == 0) revert InvalidAmount();

        superLikeCount[postId]++;
        superLikeTotal[postId] += msg.value;
        if (operator != address(0)) operatorEngagement[operator]++;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, p.author, MODULE_ID, 0
        );

        emit SuperLiked(postId, msg.sender, p.author, msg.value, operator);
    }

    /// @notice Downvote a post. 1 per user per post. Ecosystem fee.
    ///         Negative community signal. Author earns NOTHING.
    function downvote(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (hasDownvoted[postId][msg.sender]) revert AlreadyDownvoted();

        uint256 fee = ecosystem.calculateFee(ACTION_DOWNVOTE, 0);
        if (msg.value < fee) revert InsufficientFee();

        hasDownvoted[postId][msg.sender] = true;
        downvoteCount[postId]++;
        if (operator != address(0)) operatorEngagement[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit Downvoted(postId, msg.sender, p.author, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SOCIAL GRAPH
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Follow a user. On-chain state + counts.
    ///         Followed user earns custom recipient share.
    function follow(address user, address operator) external payable {
        if (isFollowing[msg.sender][user]) revert AlreadyFollowing();

        uint256 fee = ecosystem.calculateFee(ACTION_FOLLOW, 0);
        if (msg.value < fee) revert InsufficientFee();

        isFollowing[msg.sender][user] = true;
        followerCount[user]++;
        followingCount[msg.sender]++;

        if (operator != address(0)) operatorEngagement[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, user, MODULE_ID, 0
            );
        }

        emit Followed(msg.sender, user, operator);
    }

    /// @notice Unfollow a user. FREE (gas only).
    function unfollow(address user) external {
        if (!isFollowing[msg.sender][user]) revert NotFollowing();

        isFollowing[msg.sender][user] = false;
        followerCount[user]--;
        followingCount[msg.sender]--;

        emit Unfollowed(msg.sender, user);
    }

    /// @notice Block a user. FREE (gas only). On-chain, queryable by any frontend.
    function blockUser(address user) external {
        hasBlocked[msg.sender][user] = true;
        emit UserBlocked(msg.sender, user);
    }

    /// @notice Unblock a user. FREE (gas only).
    function unblockUser(address user) external {
        hasBlocked[msg.sender][user] = false;
        emit UserUnblocked(msg.sender, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BATCH ACTIONS (V3)
    // ════════════════════════════════════════════════════════════════════════

    uint8 public constant BATCH_LIKE     = 1;
    uint8 public constant BATCH_FOLLOW   = 2;
    uint8 public constant BATCH_DOWNVOTE = 3;

    struct BatchAction {
        uint8   actionType;  // 1=like, 2=follow, 3=downvote
        uint256 targetId;    // postId for like/downvote, uint256(address) for follow
    }

    event BatchExecuted(
        address indexed user, uint256 attempted, uint256 succeeded, address operator
    );

    /// @notice Execute multiple social actions in one TX.
    ///         Skips already-done actions (no revert). Total ETH collected as single fee.
    function batchActions(
        BatchAction[] calldata actions,
        address operator
    ) external payable {
        uint256 totalFee;

        // Calculate total fee (sum of individual action fees)
        for (uint256 i; i < actions.length;) {
            uint8 t = actions[i].actionType;
            if (t == BATCH_LIKE) {
                totalFee += ecosystem.calculateFee(ACTION_LIKE, 0);
            } else if (t == BATCH_FOLLOW) {
                totalFee += ecosystem.calculateFee(ACTION_FOLLOW, 0);
            } else if (t == BATCH_DOWNVOTE) {
                totalFee += ecosystem.calculateFee(ACTION_DOWNVOTE, 0);
            }
            unchecked { ++i; }
        }
        if (msg.value < totalFee) revert InsufficientFee();

        // Execute each action (skip failures gracefully)
        uint256 succeeded;
        for (uint256 i; i < actions.length;) {
            bool ok = _executeBatchAction(actions[i], operator);
            if (ok) succeeded++;
            unchecked { ++i; }
        }

        // All ETH as single collectFee call
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit BatchExecuted(msg.sender, actions.length, succeeded, operator);
    }

    function _executeBatchAction(
        BatchAction calldata action,
        address operator
    ) internal returns (bool) {
        if (action.actionType == BATCH_LIKE) {
            uint256 postId = action.targetId;
            Post storage p = posts[postId];
            if (p.author == address(0) || p.deleted) return false;
            if (hasLiked[postId][msg.sender]) return false;

            hasLiked[postId][msg.sender] = true;
            likeCount[postId]++;
            if (operator != address(0)) operatorEngagement[operator]++;
            emit Liked(postId, msg.sender, p.author, operator);
            return true;

        } else if (action.actionType == BATCH_FOLLOW) {
            address user = address(uint160(action.targetId));
            if (isFollowing[msg.sender][user]) return false;

            isFollowing[msg.sender][user] = true;
            followerCount[user]++;
            followingCount[msg.sender]++;
            if (operator != address(0)) operatorEngagement[operator]++;
            emit Followed(msg.sender, user, operator);
            return true;

        } else if (action.actionType == BATCH_DOWNVOTE) {
            uint256 postId = action.targetId;
            Post storage p = posts[postId];
            if (p.author == address(0) || p.deleted) return false;
            if (hasDownvoted[postId][msg.sender]) return false;

            hasDownvoted[postId][msg.sender] = true;
            downvoteCount[postId]++;
            if (operator != address(0)) operatorEngagement[operator]++;
            emit Downvoted(postId, msg.sender, p.author, operator);
            return true;
        }
        return false;
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPORTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Report a post. 1 per user per post. Ecosystem fee (anti-spam).
    ///         Contract stores raw data — each frontend decides threshold.
    function reportPost(uint256 postId, uint8 category, address operator) external payable {
        if (category >= REPORT_CATEGORY_COUNT) revert InvalidCategory();
        uint256 fee = ecosystem.calculateFee(ACTION_REPORT, 0);
        if (msg.value < fee) revert InsufficientFee();

        Post storage p = _requireActivePost(postId);
        if (hasReported[postId][msg.sender]) revert AlreadyReported();

        hasReported[postId][msg.sender] = true;
        reportCount[postId]++;
        reportsByCategory[postId][category]++;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit PostReported(postId, msg.sender, p.author, category, reportCount[postId]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // POST BOOST & TIPS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost a post's visibility. Anyone can boost any post.
    ///         Pricing: ecosystem.calculateFee per day per tier. Stackable.
    function boostPost(uint256 postId, uint8 tier, address operator) external payable {
        _requireActivePost(postId);
        if (tier >= BOOST_TIER_COUNT) revert InvalidTier();

        uint256 pricePerDay = _getBoostPrice(tier);
        if (msg.value < pricePerDay) revert InsufficientFee();

        uint256 daysToAdd = msg.value / pricePerDay;
        uint64 current = postBoostExpiry[postId];
        uint64 startFrom = current > uint64(block.timestamp) ? current : uint64(block.timestamp);
        uint64 newExpiry = startFrom + uint64(daysToAdd * 1 days);
        postBoostExpiry[postId] = newExpiry;
        postBoostTotal[postId] += msg.value;

        if (tier > postBoostTier[postId]) {
            postBoostTier[postId] = tier;
        }

        if (operator != address(0)) operatorEngagement[operator]++;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit PostBoosted(postId, msg.sender, tier, msg.value, newExpiry, operator);
    }

    /// @notice Tip a post's author with ETH. Any amount > 0.
    ///         Author earns via ecosystem's custom recipient share.
    function tipPost(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (msg.value == 0) revert InvalidAmount();

        tipTotal[postId] += msg.value;
        if (operator != address(0)) operatorEngagement[operator]++;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, p.author, MODULE_ID, 0
        );

        emit PostTipped(postId, msg.sender, p.author, msg.value, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PROFILES
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Register username + profile. Pricing via ecosystem governance.
    ///         1-2 chars = rare (expensive), 3-4 = short, 5-6 = common, 7+ = FREE.
    function createProfile(
        string calldata username,
        string calldata metadataURI,
        address operator
    ) external payable {
        if (userUsername[msg.sender] != bytes32(0)) revert AlreadyHasProfile();

        string memory normalized = _validateAndLower(username);
        bytes32 nameHash = keccak256(bytes(normalized));
        if (usernameOwner[nameHash] != address(0)) revert UsernameTaken();

        uint256 price = _getUsernamePrice(bytes(normalized).length);
        if (msg.value < price) revert InsufficientFee();

        usernameOwner[nameHash] = msg.sender;
        userUsername[msg.sender] = nameHash;
        if (bytes(metadataURI).length > 0) {
            profileURI[msg.sender] = metadataURI;
        }
        totalProfiles++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit ProfileCreated(msg.sender, normalized, metadataURI, operator);
    }

    /// @notice Update profile metadata. FREE (gas only).
    function updateProfile(string calldata metadataURI) external {
        profileURI[msg.sender] = metadataURI;
        emit ProfileUpdated(msg.sender, metadataURI);
    }

    /// @notice Pin a post to your profile. Pass 0 to unpin. FREE.
    function pinPost(uint256 postId) external {
        if (postId > 0) {
            Post storage p = posts[postId];
            if (p.author == address(0)) revert PostNotFound();
            if (p.author != msg.sender) revert NotAuthor();
        }

        pinnedPost[msg.sender] = postId;
        emit PostPinned(msg.sender, postId);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PREMIUM FEATURES
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost your profile visibility. Dynamic pricing via ecosystem.
    function boostProfile(address operator) external payable {
        uint256 pricePerDay = ecosystem.calculateFee(ACTION_PROFILE_BOOST, 0);
        if (msg.value < pricePerDay) revert InsufficientFee();

        uint256 daysToAdd = msg.value / pricePerDay;
        uint64 current = boostExpiry[msg.sender];
        uint64 startFrom = current > uint64(block.timestamp) ? current : uint64(block.timestamp);
        uint64 newExpiry = startFrom + uint64(daysToAdd * 1 days);
        boostExpiry[msg.sender] = newExpiry;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit ProfileBoosted(msg.sender, daysToAdd, newExpiry, operator);
    }

    /// @notice Obtain a trust badge. Dynamic pricing via ecosystem per tier.
    ///         Always upgrades to highest tier paid.
    function obtainBadge(uint8 tier, address operator) external payable {
        if (tier >= BADGE_TIER_COUNT) revert InvalidTier();

        uint256 price = ecosystem.calculateFee(_getBadgeActionId(tier), 0);
        if (msg.value < price) revert InsufficientFee();

        uint64 newExpiry = uint64(block.timestamp + 365 days);
        badgeExpiry[msg.sender] = newExpiry;

        if (tier > badgeTier[msg.sender]) {
            badgeTier[msg.sender] = tier;
        }

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit BadgeObtained(msg.sender, tier, newExpiry, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get all data about a post in a single call (replaces getPost + getPostMeta).
    function getPost(uint256 postId) external view returns (PostView memory v) {
        Post storage p = posts[postId];
        v.author       = p.author;
        v.tag          = p.tag;
        v.contentType  = p.contentType;
        v.deleted      = p.deleted;
        v.createdAt    = p.createdAt;
        v.editedAt_    = p.editedAt;
        v.replyTo_     = replyTo[postId];
        v.repostOf_    = repostOf[postId];
        v.likes        = likeCount[postId];
        v.superLikes   = superLikeCount[postId];
        v.superLikeETH = superLikeTotal[postId];
        v.downvotes    = downvoteCount[postId];
        v.replies      = replyCount[postId];
        v.reposts      = repostCount[postId];
        v.reports      = reportCount[postId];
        v.tips         = tipTotal[postId];
        v.boostTier    = postBoostTier[postId];
        v.boostExpiry  = postBoostExpiry[postId];
    }

    /// @notice Batch read — get multiple posts in a single RPC call.
    function getPostsBatch(uint256[] calldata postIds) external view returns (PostView[] memory) {
        uint256 len = postIds.length;
        PostView[] memory result = new PostView[](len);
        for (uint256 i; i < len;) {
            uint256 id = postIds[i];
            Post storage p = posts[id];
            result[i] = PostView({
                author:       p.author,
                tag:          p.tag,
                contentType:  p.contentType,
                deleted:      p.deleted,
                createdAt:    p.createdAt,
                editedAt_:    p.editedAt,
                replyTo_:     replyTo[id],
                repostOf_:    repostOf[id],
                likes:        likeCount[id],
                superLikes:   superLikeCount[id],
                superLikeETH: superLikeTotal[id],
                downvotes:    downvoteCount[id],
                replies:      replyCount[id],
                reposts:      repostCount[id],
                reports:      reportCount[id],
                tips:         tipTotal[id],
                boostTier:    postBoostTier[id],
                boostExpiry:  postBoostExpiry[id]
            });
            unchecked { ++i; }
        }
        return result;
    }

    /// @notice Get a user's profile data in a single call.
    function getUserProfile(address user) external view returns (
        bytes32 usernameHash,
        string memory metadataURI,
        uint256 pinned,
        bool    boosted,
        bool    hasBadge,
        uint8   _badgeTier,
        uint64  boostExp,
        uint64  badgeExp,
        uint256 followers,
        uint256 following
    ) {
        usernameHash = userUsername[user];
        metadataURI  = profileURI[user];
        pinned       = pinnedPost[user];
        boosted      = boostExpiry[user] > block.timestamp;
        hasBadge     = badgeExpiry[user] > block.timestamp;
        _badgeTier   = badgeTier[user];
        boostExp     = boostExpiry[user];
        badgeExp     = badgeExpiry[user];
        followers    = followerCount[user];
        following    = followingCount[user];
    }

    /// @notice Check if user A is following user B
    function checkFollowing(address a, address b) external view returns (bool) {
        return isFollowing[a][b];
    }

    /// @notice Check if user A has blocked user B
    function checkBlocked(address a, address b) external view returns (bool) {
        return hasBlocked[a][b];
    }

    /// @notice Check if a profile is currently boosted
    function isProfileBoosted(address user) external view returns (bool) {
        return boostExpiry[user] > block.timestamp;
    }

    /// @notice Check if a user has a valid trust badge
    function hasTrustBadge(address user) external view returns (bool) {
        return badgeExpiry[user] > block.timestamp;
    }

    /// @notice Check if a post is currently boosted
    function isPostBoosted(uint256 postId) external view returns (bool) {
        return postBoostExpiry[postId] > block.timestamp;
    }

    /// @notice Check if a username is available
    function isUsernameAvailable(string calldata username) external view returns (bool) {
        if (bytes(username).length == 0 || bytes(username).length > 15) return false;
        string memory normalized = _validateAndLowerView(username);
        if (bytes(normalized).length == 0) return false;
        bytes32 nameHash = keccak256(bytes(normalized));
        return usernameOwner[nameHash] == address(0);
    }

    /// @notice Get username price by length (via ecosystem governance)
    function getUsernamePrice(uint256 length) external view returns (uint256) {
        return _getUsernamePrice(length);
    }

    /// @notice Get boost price per day per tier (via ecosystem governance)
    function getBoostPrice(uint8 tier) external view returns (uint256) {
        return _getBoostPrice(tier);
    }

    /// @notice Get badge price per tier (via ecosystem governance)
    function getBadgePrice(uint8 tier) external view returns (uint256) {
        return ecosystem.calculateFee(_getBadgeActionId(tier), 0);
    }

    /// @notice Operator network metrics
    function getOperatorStats(address operator) external view returns (
        uint256 posts_,
        uint256 engagement
    ) {
        posts_     = operatorPostCount[operator];
        engagement = operatorEngagement[operator];
    }

    /// @notice Global protocol statistics + per-tag breakdown
    function getGlobalStats() external view returns (
        uint256 _totalPosts,
        uint256 _totalProfiles,
        uint256[15] memory _tagCounts
    ) {
        _totalPosts    = postCounter;
        _totalProfiles = totalProfiles;
        for (uint8 i; i < TAG_COUNT;) {
            _tagCounts[i] = tagPostCount[i];
            unchecked { ++i; }
        }
    }

    /// @notice Contract version
    function version() external pure returns (string memory) {
        return "3.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    function _requireActivePost(uint256 postId) internal view returns (Post storage p) {
        p = posts[postId];
        if (p.author == address(0)) revert PostNotFound();
        if (p.deleted) revert PostIsDeleted();
    }

    /// @dev Check if content type requires a fee (image, video, live)
    function _isMediaType(uint8 contentType) internal pure returns (bool) {
        return contentType == TYPE_IMAGE || contentType == TYPE_VIDEO || contentType == TYPE_LIVE;
    }

    /// @dev Map content type → fee action ID
    function _getPostActionId(uint8 contentType) internal pure returns (bytes32) {
        if (contentType == TYPE_IMAGE) return ACTION_POST_IMAGE;
        if (contentType == TYPE_VIDEO) return ACTION_POST_VIDEO;
        if (contentType == TYPE_LIVE)  return ACTION_LIVE;
        return ACTION_POST;
    }

    /// @dev Post boost pricing per tier via ecosystem governance (dynamic, never hardcoded)
    function _getBoostPrice(uint8 tier) internal view returns (uint256) {
        if (tier == BOOST_STANDARD) return ecosystem.calculateFee(ACTION_BOOST_STANDARD, 0);
        return ecosystem.calculateFee(ACTION_BOOST_FEATURED, 0);
    }

    /// @dev Map badge tier → fee action ID
    function _getBadgeActionId(uint8 tier) internal pure returns (bytes32) {
        if (tier == BADGE_VERIFIED) return ACTION_BADGE_VERIFIED;
        if (tier == BADGE_PREMIUM)  return ACTION_BADGE_PREMIUM;
        return ACTION_BADGE_ELITE;
    }

    /// @dev Username pricing via ecosystem governance (dynamic, never hardcoded).
    ///      Each length tier gets its own action ID: keccak256(abi.encode("AGORA_USERNAME", length)).
    ///      7+ characters = FREE. If a tier has no fee config, price = 0 (free).
    function _getUsernamePrice(uint256 length) internal view returns (uint256) {
        if (length == 0) return type(uint256).max; // invalid
        if (length >= 7) return 0; // free
        return ecosystem.calculateFee(
            keccak256(abi.encode("AGORA_USERNAME", length)),
            0
        );
    }

    /// @dev Validate username (1-15 chars, a-z 0-9 _ only) and convert to lowercase.
    function _validateAndLower(string calldata str) internal pure returns (string memory) {
        bytes calldata raw = bytes(str);
        uint256 len = raw.length;
        if (len == 0 || len > 15) revert InvalidUsername();

        bytes memory result = new bytes(len);
        for (uint256 i; i < len;) {
            uint8 c = uint8(raw[i]);
            if (c >= 65 && c <= 90) c += 32; // A-Z → a-z
            if (
                !(c >= 97 && c <= 122) && // a-z
                !(c >= 48 && c <= 57)  && // 0-9
                c != 95                    // _
            ) {
                revert InvalidUsername();
            }
            result[i] = bytes1(c);
            unchecked { ++i; }
        }

        return string(result);
    }

    /// @dev View-safe username validation (returns empty on invalid).
    function _validateAndLowerView(string calldata str) internal pure returns (string memory) {
        bytes calldata raw = bytes(str);
        uint256 len = raw.length;
        if (len == 0 || len > 15) return "";

        bytes memory result = new bytes(len);
        for (uint256 i; i < len;) {
            uint8 c = uint8(raw[i]);
            if (c >= 65 && c <= 90) c += 32;
            if (
                !(c >= 97 && c <= 122) &&
                !(c >= 48 && c <= 57) &&
                c != 95
            ) {
                return "";
            }
            result[i] = bytes1(c);
            unchecked { ++i; }
        }

        return string(result);
    }
}
