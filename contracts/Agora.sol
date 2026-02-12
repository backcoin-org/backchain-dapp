// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// AGORA v2.0 — IMMUTABLE SOCIAL PROTOCOL (Tier 1: ETH only)
// ============================================================================
//
// Decentralized social protocol where ANYONE can build their own social
// network. Each operator runs a frontend = their own network. All networks
// share the same on-chain social graph, but filter by tags (categories).
//
//   "Your protocol. Their networks. One truth."
//
// FEATURES:
//   - Posts with 15 predefined tags (categories = virtual networks)
//   - Threaded replies, reposts with optional quote
//   - Like (1x per user per post), SuperLike (100 gwei each, unlimited)
//   - Downvote (100 gwei each, unlimited) — community scoring
//   - Follow / Unfollow
//   - Username registration (length-based pricing, vanity names)
//   - Profile metadata via IPFS URI (avatar, bio, links)
//   - Profile boost & trust badge (premium features)
//   - Pin post (1 per user), delete post (soft delete)
//   - Operator stats (posts, engagement per operator network)
//   V2 NEW:
//   - Post boost (paid visibility, anyone can boost any post)
//   - Tip post (send ETH directly to post author, free value)
//   - Report post (community flagging, 1 per user per post)
//   - Differentiated fees by content type (text/image/video/live)
//   - TYPE_LIVE content type for live streams
//
// COMMUNITY SCORING:
//   SuperLike (+) → 100 gwei each → author earns via collectFee
//   Downvote  (-) → 100 gwei each → ecosystem earns (author gets nothing)
//   Net score = superLikes - downvotes (frontends calculate, operators decide threshold)
//
// COMMUNITY MODERATION:
//   Report → gas-based fee → reportCount per post incremented
//   Each frontend decides threshold: e.g. 5 reports = hidden, 3 "illegal" = hidden
//   Reporter auto-blocks author: frontend filters ALL posts from reported authors
//   Contract stores raw data. Frontends interpret policy.
//
// TAGS (predefined categories):
//   0=General, 1=News, 2=Politics, 3=Comedy, 4=Sports, 5=Crypto,
//   6=Tech, 7=Art, 8=Music, 9=Gaming, 10=Business, 11=Education,
//   12=Lifestyle, 13=Adult, 14=Random
//   Each operator filters by tags they support = their own curated network.
//
// FEE FLOW:
//   Posts/profiles    → collectFee(customRecipient = address(0))
//   Replies/likes     → collectFee(customRecipient = parent/post author)
//   SuperLikes        → collectFee(customRecipient = post author)
//   Downvotes         → collectFee(customRecipient = address(0))
//   Follow            → collectFee(customRecipient = followed user)
//   Tips              → collectFee(customRecipient = post author)
//   Boosts/Premium    → collectFee(customRecipient = address(0))
//
// WHITE-LABEL MODEL:
//   Any developer deploys a frontend with { startBlock, operator, branding }.
//   Indexer reads events from startBlock onward → fresh network.
//   Operator earns commissions on all activity through their frontend.
//   Same contract, infinite networks.
//
// 18+ ONLY — This is a permissionless protocol for adults.
// No admin functions. No pause. No censorship. Fully immutable.
//
// ============================================================================

contract Agora {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID     = keccak256("AGORA");

    // Action IDs for ecosystem fee calculation
    bytes32 public constant ACTION_POST       = keccak256("AGORA_POST");
    bytes32 public constant ACTION_POST_IMAGE = keccak256("AGORA_POST_IMAGE");
    bytes32 public constant ACTION_POST_VIDEO = keccak256("AGORA_POST_VIDEO");
    bytes32 public constant ACTION_LIVE       = keccak256("AGORA_LIVE");
    bytes32 public constant ACTION_REPLY      = keccak256("AGORA_REPLY");
    bytes32 public constant ACTION_REPOST     = keccak256("AGORA_REPOST");
    bytes32 public constant ACTION_LIKE       = keccak256("AGORA_LIKE");
    bytes32 public constant ACTION_FOLLOW     = keccak256("AGORA_FOLLOW");

    // V10: New gas-based action IDs (replace fixed ETH prices)
    bytes32 public constant ACTION_REPORT          = keccak256("AGORA_REPORT");
    bytes32 public constant ACTION_PROFILE_BOOST   = keccak256("AGORA_PROFILE_BOOST");
    bytes32 public constant ACTION_BADGE_VERIFIED  = keccak256("AGORA_BADGE_VERIFIED");
    bytes32 public constant ACTION_BADGE_PREMIUM   = keccak256("AGORA_BADGE_PREMIUM");
    bytes32 public constant ACTION_BADGE_ELITE     = keccak256("AGORA_BADGE_ELITE");

    /// @notice Price per SuperLike or Downvote (100 gwei)
    uint256 public constant VOTE_PRICE = 100 gwei;

    /// @notice Number of predefined tag categories
    uint8 public constant TAG_COUNT = 15;

    /// @notice Content type flags (metadata for frontend filtering)
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

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: POSTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Global post counter (incremented for every post, reply, repost)
    uint256 public postCounter;

    /// @dev Packed post data — 27 bytes = 1 storage slot
    ///      author(20) + tag(1) + contentType(1) + deleted(1) + createdAt(4)
    struct Post {
        address author;
        uint8   tag;
        uint8   contentType;
        bool    deleted;
        uint32  createdAt;
    }

    mapping(uint256 => Post)    public posts;
    mapping(uint256 => uint256) public replyTo;       // 0 = not a reply
    mapping(uint256 => uint256) public repostOf;      // 0 = not a repost

    // Engagement counters (per post)
    mapping(uint256 => uint256) public likeCount;
    mapping(uint256 => uint256) public superLikeCount;
    mapping(uint256 => uint256) public downvoteCount;
    mapping(uint256 => uint256) public replyCount;
    mapping(uint256 => uint256) public repostCount;

    // Like deduplication (1 per user per post)
    mapping(uint256 => mapping(address => bool)) public hasLiked;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: REPORTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Total reports per post
    mapping(uint256 => uint256) public reportCount;

    /// @notice Reports per category per post (for category-specific thresholds)
    mapping(uint256 => mapping(uint8 => uint256)) public reportsByCategory;

    /// @notice Deduplication: 1 report per user per post
    mapping(uint256 => mapping(address => bool)) public hasReported;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: POST BOOSTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost expiry timestamp per post
    mapping(uint256 => uint64) public postBoostExpiry;

    /// @notice Highest boost tier for each post (0=Standard, 1=Featured)
    mapping(uint256 => uint8) public postBoostTier;

    /// @notice Total ETH spent on boosting each post (lifetime)
    mapping(uint256 => uint256) public postBoostTotal;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: TIPS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Total ETH tipped to each post (lifetime)
    mapping(uint256 => uint256) public tipTotal;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: PROFILES
    // ════════════════════════════════════════════════════════════════════════

    mapping(bytes32 => address) public usernameOwner;   // nameHash → address
    mapping(address => bytes32) public userUsername;     // address → nameHash
    mapping(address => string)  public profileURI;      // IPFS metadata URI
    mapping(address => uint256) public pinnedPost;      // 1 pinned post per user

    // Premium features
    mapping(address => uint64)  public boostExpiry;
    mapping(address => uint64)  public badgeExpiry;
    mapping(address => uint8)   public badgeTier;

    // ════════════════════════════════════════════════════════════════════════
    // STATE: STATS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Posts per tag category (for discovery dashboards)
    mapping(uint8 => uint256)   public tagPostCount;

    /// @notice Posts created through each operator (measures network size)
    mapping(address => uint256) public operatorPostCount;

    /// @notice Engagement actions through each operator (likes, superLikes, etc.)
    mapping(address => uint256) public operatorEngagement;

    /// @notice Total registered profiles
    uint256 public totalProfiles;

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
    event PostDeleted(uint256 indexed postId, address indexed author);
    event TagChanged(uint256 indexed postId, uint8 oldTag, uint8 newTag);

    // ── Engagement ──
    event Liked(
        uint256 indexed postId, address indexed liker,
        address indexed author, address operator
    );
    event SuperLiked(
        uint256 indexed postId, address indexed voter,
        address indexed author, uint256 count, address operator
    );
    event Downvoted(
        uint256 indexed postId, address indexed voter,
        address indexed author, uint256 count, address operator
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
    error AlreadyReported();
    error SelfAction();
    error UsernameTaken();
    error InvalidUsername();
    error AlreadyHasProfile();
    error InvalidTag();
    error InvalidAmount();
    error InvalidCategory();
    error InvalidTier();
    error NotAuthor();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem) {
        ecosystem = IBackchainEcosystem(_ecosystem);
    }

    // ════════════════════════════════════════════════════════════════════════
    // POSTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Create a new post in a tag category.
    ///         Fee varies by content type (text/image/video/live).
    /// @param contentHash  IPFS CID or content hash (emitted in event, not stored)
    /// @param tag          Category (0-14). See TAG constants.
    /// @param contentType  0=text, 1=image, 2=video, 3=link, 4=live
    /// @param operator     Frontend operator earning commissions (address(0) if none)
    function createPost(
        string calldata contentHash,
        uint8 tag,
        uint8 contentType,
        address operator
    ) external payable {
        if (bytes(contentHash).length == 0) revert EmptyContent();
        if (tag >= TAG_COUNT) revert InvalidTag();

        uint256 fee = ecosystem.calculateFee(_getPostActionId(contentType), 0);
        if (msg.value < fee) revert InsufficientFee();

        uint256 postId = ++postCounter;
        posts[postId] = Post({
            author: msg.sender,
            tag: tag,
            contentType: contentType,
            deleted: false,
            createdAt: uint32(block.timestamp)
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
    /// @param parentId     Post being replied to (must exist and not be deleted)
    /// @param contentHash  Reply content hash
    /// @param contentType  0=text, 1=image, 2=video, 3=link
    /// @param operator     Frontend operator
    function createReply(
        uint256 parentId,
        string calldata contentHash,
        uint8 contentType,
        address operator
    ) external payable {
        if (bytes(contentHash).length == 0) revert EmptyContent();

        Post storage parent = _requireActivePost(parentId);

        uint256 fee = ecosystem.calculateFee(ACTION_REPLY, 0);
        if (msg.value < fee) revert InsufficientFee();

        uint8 tag = parent.tag;
        address parentAuthor = parent.author;

        uint256 postId = ++postCounter;
        posts[postId] = Post({
            author: msg.sender,
            tag: tag,
            contentType: contentType,
            deleted: false,
            createdAt: uint32(block.timestamp)
        });
        replyTo[postId] = parentId;

        replyCount[parentId]++;
        tagPostCount[tag]++;
        if (operator != address(0)) operatorPostCount[operator]++;

        // Parent author earns custom recipient share
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, parentAuthor, MODULE_ID, 0
            );
        }

        emit ReplyCreated(postId, parentId, msg.sender, tag, contentType, contentHash, operator);
    }

    /// @notice Repost existing content, optionally with a quote (contentHash).
    ///         Empty contentHash = simple repost. Non-empty = quote repost.
    ///         Inherits original post's tag.
    /// @param originalId   Post being reposted
    /// @param contentHash  Quote text hash (empty for simple repost)
    /// @param operator     Frontend operator
    function createRepost(
        uint256 originalId,
        string calldata contentHash,
        address operator
    ) external payable {
        Post storage original = _requireActivePost(originalId);

        uint256 fee = ecosystem.calculateFee(ACTION_REPOST, 0);
        if (msg.value < fee) revert InsufficientFee();

        uint8 tag = original.tag;
        address originalAuthor = original.author;

        uint256 postId = ++postCounter;
        posts[postId] = Post({
            author: msg.sender,
            tag: tag,
            contentType: TYPE_TEXT,
            deleted: false,
            createdAt: uint32(block.timestamp)
        });
        repostOf[postId] = originalId;

        repostCount[originalId]++;
        tagPostCount[tag]++;
        if (operator != address(0)) operatorPostCount[operator]++;

        // Original author earns custom recipient share
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, originalAuthor, MODULE_ID, 0
            );
        }

        emit RepostCreated(postId, originalId, msg.sender, tag, contentHash, operator);
    }

    /// @notice Soft-delete a post. Content remains in events but post is
    ///         marked as deleted. Engagement on deleted posts is blocked.
    ///         Only the author can delete their own post.
    /// @param postId  Post to delete
    function deletePost(uint256 postId) external {
        Post storage p = posts[postId];
        if (p.author == address(0)) revert PostNotFound();
        if (p.author != msg.sender) revert NotAuthor();
        if (p.deleted) revert PostIsDeleted();

        p.deleted = true;
        tagPostCount[p.tag]--;

        emit PostDeleted(postId, msg.sender);
    }

    /// @notice Change a post's tag (category). Free, only gas.
    ///         Useful for self-correction or after community feedback.
    ///         Only the author can change their post's tag.
    /// @param postId  Post to re-tag
    /// @param newTag  New category (0-14)
    function changeTag(uint256 postId, uint8 newTag) external {
        if (newTag >= TAG_COUNT) revert InvalidTag();

        Post storage p = posts[postId];
        if (p.author == address(0)) revert PostNotFound();
        if (p.author != msg.sender) revert NotAuthor();
        if (p.deleted) revert PostIsDeleted();

        uint8 oldTag = p.tag;
        if (oldTag == newTag) return; // no-op

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
    /// @param postId   Post to like
    /// @param operator Frontend operator
    function like(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (p.author == msg.sender) revert SelfAction();
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

    /// @notice SuperLike a post. 100 gwei per SuperLike, unlimited.
    ///         Acts as a micro-tip + positive signal. Author earns via collectFee.
    ///         Send msg.value as multiples of 100 gwei.
    ///
    ///         Example: 1000 gwei = 10 SuperLikes.
    ///
    /// @param postId   Post to superLike
    /// @param operator Frontend operator
    function superLike(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (p.author == msg.sender) revert SelfAction();
        if (msg.value == 0 || msg.value % VOTE_PRICE != 0) revert InvalidAmount();

        uint256 count = msg.value / VOTE_PRICE;
        superLikeCount[postId] += count;
        if (operator != address(0)) operatorEngagement[operator]++;

        // Author earns from superLikes
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, p.author, MODULE_ID, 0
        );

        emit SuperLiked(postId, msg.sender, p.author, count, operator);
    }

    /// @notice Downvote a post. 100 gwei per downvote, unlimited.
    ///         Negative community signal. Author earns NOTHING — ETH goes
    ///         to ecosystem (buyback/treasury/operator).
    ///         Send msg.value as multiples of 100 gwei.
    ///
    /// @param postId   Post to downvote
    /// @param operator Frontend operator
    function downvote(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (p.author == msg.sender) revert SelfAction();
        if (msg.value == 0 || msg.value % VOTE_PRICE != 0) revert InvalidAmount();

        uint256 count = msg.value / VOTE_PRICE;
        downvoteCount[postId] += count;
        if (operator != address(0)) operatorEngagement[operator]++;

        // customRecipient = address(0) → author earns NOTHING
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit Downvoted(postId, msg.sender, p.author, count, operator);
    }

    /// @notice Follow a user. Standard ecosystem fee.
    ///         Followed user earns custom recipient share.
    ///         Follow state is tracked off-chain via events.
    /// @param user     User to follow
    /// @param operator Frontend operator
    function follow(address user, address operator) external payable {
        if (user == msg.sender) revert SelfAction();

        uint256 fee = ecosystem.calculateFee(ACTION_FOLLOW, 0);
        if (msg.value < fee) revert InsufficientFee();

        if (operator != address(0)) operatorEngagement[operator]++;

        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, user, MODULE_ID, 0
            );
        }

        emit Followed(msg.sender, user, operator);
    }

    /// @notice Unfollow a user. Free (gas only). Tracked via events.
    /// @param user User to unfollow
    function unfollow(address user) external {
        emit Unfollowed(msg.sender, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPORTS (Community Moderation)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Report a post for community moderation. Costs 0.0001 ETH.
    ///         Small fee prevents spam reports. 1 report per wallet per post.
    ///         Cannot report own posts.
    ///         Contract stores raw data — each frontend decides its threshold.
    ///         Reporter's frontend auto-hides ALL posts from the reported author.
    ///
    /// @param postId   Post to report
    /// @param category Report reason: 0=Spam, 1=Harassment, 2=Illegal, 3=Scam, 4=Other
    function reportPost(uint256 postId, uint8 category, address operator) external payable {
        if (category >= REPORT_CATEGORY_COUNT) revert InvalidCategory();
        uint256 fee = ecosystem.calculateFee(ACTION_REPORT, 0);
        if (msg.value < fee) revert InsufficientFee();

        Post storage p = _requireActivePost(postId);
        if (p.author == msg.sender) revert SelfAction();
        if (hasReported[postId][msg.sender]) revert AlreadyReported();

        hasReported[postId][msg.sender] = true;
        reportCount[postId]++;
        reportsByCategory[postId][category]++;

        // Report fee goes to ecosystem (author earns nothing)
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit PostReported(postId, msg.sender, p.author, category, reportCount[postId]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // POST BOOST & TIPS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost a post's visibility. Anyone can boost any post.
    ///         Two tiers: Standard (0.001 ETH/day) and Featured (0.005 ETH/day).
    ///         Featured posts appear at top of feed + cross-tag visibility.
    ///         Stackable — send more ETH = longer boost duration.
    /// @param postId   Post to boost
    /// @param tier     0=Standard, 1=Featured
    /// @param operator Frontend operator
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

        // Upgrade tier if higher (never downgrade)
        if (tier > postBoostTier[postId]) {
            postBoostTier[postId] = tier;
        }

        if (operator != address(0)) operatorEngagement[operator]++;

        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, 0
        );

        emit PostBoosted(postId, msg.sender, tier, msg.value, newExpiry, operator);
    }

    /// @notice Tip a post's author directly with ETH.
    ///         Free-value transfer — send any amount > 0.
    ///         Author earns via ecosystem's custom recipient share.
    ///         Operator earns commission on tips through their frontend.
    /// @param postId   Post to tip
    /// @param operator Frontend operator
    function tipPost(uint256 postId, address operator) external payable {
        Post storage p = _requireActivePost(postId);
        if (p.author == msg.sender) revert SelfAction();
        if (msg.value == 0) revert InvalidAmount();

        tipTotal[postId] += msg.value;
        if (operator != address(0)) operatorEngagement[operator]++;

        // Author earns the tip via ecosystem fee distribution
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, p.author, MODULE_ID, 0
        );

        emit PostTipped(postId, msg.sender, p.author, msg.value, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PROFILES
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Register a unique username and profile metadata.
    ///         Username pricing by length: 1 char = 1 ETH ... 7+ chars = FREE.
    ///         Username is permanent — once claimed, it's yours forever.
    ///         One profile per address.
    ///
    /// @param username     Desired username (1-15 chars, a-z 0-9 _ only)
    /// @param metadataURI  IPFS CID pointing to JSON: {name, bio, avatar, links}
    /// @param operator     Frontend operator
    function createProfile(
        string calldata username,
        string calldata metadataURI,
        address operator
    ) external payable {
        if (userUsername[msg.sender] != bytes32(0)) revert AlreadyHasProfile();

        // Validate and normalize username
        string memory normalized = _validateAndLower(username);
        bytes32 nameHash = keccak256(bytes(normalized));
        if (usernameOwner[nameHash] != address(0)) revert UsernameTaken();

        // Username pricing by length
        uint256 price = _getUsernamePrice(bytes(normalized).length);
        if (msg.value < price) revert InsufficientFee();

        // Store profile
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

    /// @notice Update profile metadata (avatar, bio, links).
    ///         Free — only gas cost.
    /// @param metadataURI  New IPFS CID pointing to profile JSON
    function updateProfile(string calldata metadataURI) external {
        profileURI[msg.sender] = metadataURI;
        emit ProfileUpdated(msg.sender, metadataURI);
    }

    /// @notice Pin a post to your profile (1 per user).
    ///         Pass postId = 0 to unpin.
    /// @param postId  Post to pin (must be your own post, or 0 to unpin)
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

    /// @notice Boost your profile visibility.
    ///         Gas-based pricing per day. Stackable — send more = longer boost.
    ///         Extends current boost if already active.
    /// @param operator Frontend operator
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

    /// @notice Obtain a trust badge. 3 tiers with increasing price and prestige.
    ///         Gas-based pricing per year. Always upgrades to highest tier paid.
    ///         Tier 0 (Verified) — blue checkmark
    ///         Tier 1 (Premium)  — gold checkmark
    ///         Tier 2 (Elite)    — diamond animated checkmark
    /// @param tier     Badge tier (0=Verified, 1=Premium, 2=Elite)
    /// @param operator Frontend operator
    function obtainBadge(uint8 tier, address operator) external payable {
        if (tier >= BADGE_TIER_COUNT) revert InvalidTier();

        uint256 price = ecosystem.calculateFee(_getBadgeActionId(tier), 0);
        if (msg.value < price) revert InsufficientFee();

        uint64 newExpiry = uint64(block.timestamp + 365 days);
        badgeExpiry[msg.sender] = newExpiry;

        // Upgrade tier if higher (never downgrade)
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

    /// @notice Get all data about a post in a single call.
    function getPost(uint256 postId) external view returns (
        address author,
        uint8   tag,
        uint8   contentType,
        bool    deleted,
        uint32  createdAt,
        uint256 _replyTo,
        uint256 _repostOf,
        uint256 likes,
        uint256 superLikes,
        uint256 downvotes,
        uint256 replies,
        uint256 reposts
    ) {
        Post storage p = posts[postId];
        author      = p.author;
        tag         = p.tag;
        contentType = p.contentType;
        deleted     = p.deleted;
        createdAt   = p.createdAt;
        _replyTo    = replyTo[postId];
        _repostOf   = repostOf[postId];
        likes       = likeCount[postId];
        superLikes  = superLikeCount[postId];
        downvotes   = downvoteCount[postId];
        replies     = replyCount[postId];
        reposts     = repostCount[postId];
    }

    /// @notice Get V2 extended data for a post (reports, boost, tips).
    function getPostMeta(uint256 postId) external view returns (
        uint256 reports,
        uint256 illegalReports,
        uint8   boostTier,
        uint64  boostExp,
        bool    isBoosted,
        uint256 boostSpent,
        uint256 tips
    ) {
        reports        = reportCount[postId];
        illegalReports = reportsByCategory[postId][REPORT_ILLEGAL];
        boostTier      = postBoostTier[postId];
        boostExp       = postBoostExpiry[postId];
        isBoosted      = postBoostExpiry[postId] > block.timestamp;
        boostSpent     = postBoostTotal[postId];
        tips           = tipTotal[postId];
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
        uint64  badgeExp
    ) {
        usernameHash = userUsername[user];
        metadataURI  = profileURI[user];
        pinned       = pinnedPost[user];
        boosted      = boostExpiry[user] > block.timestamp;
        hasBadge     = badgeExpiry[user] > block.timestamp;
        _badgeTier   = badgeTier[user];
        boostExp     = boostExpiry[user];
        badgeExp     = badgeExpiry[user];
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
        bytes32 nameHash = keccak256(bytes(normalized));
        return usernameOwner[nameHash] == address(0);
    }

    /// @notice Get the price for a username by character count
    function getUsernamePrice(uint256 length) external pure returns (uint256) {
        return _getUsernamePrice(length);
    }

    /// @notice Get the price per day for a post boost tier
    function getBoostPrice(uint8 tier) external pure returns (uint256) {
        return _getBoostPrice(tier);
    }

    /// @notice Get the price for a badge tier (1 year)
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
        return "2.1.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Validate post exists and is not deleted. Returns storage pointer.
    function _requireActivePost(uint256 postId) internal view returns (Post storage p) {
        p = posts[postId];
        if (p.author == address(0)) revert PostNotFound();
        if (p.deleted) revert PostIsDeleted();
    }

    /// @dev Map content type → fee action ID. Allows different fees for text/image/video/live.
    ///      If a fee config is not registered for a specific type, ecosystem returns 0 fee.
    function _getPostActionId(uint8 contentType) internal pure returns (bytes32) {
        if (contentType == TYPE_IMAGE) return ACTION_POST_IMAGE;
        if (contentType == TYPE_VIDEO) return ACTION_POST_VIDEO;
        if (contentType == TYPE_LIVE)  return ACTION_LIVE;
        return ACTION_POST; // text, link, or unknown
    }

    /// @dev Post boost pricing per tier (per day).
    ///      Standard = 0.001 ETH/day (basic visibility boost)
    ///      Featured = 0.005 ETH/day (top of feed + cross-tag)
    function _getBoostPrice(uint8 tier) internal pure returns (uint256) {
        if (tier == BOOST_STANDARD) return 0.002 ether;   // ~$6/day
        return 0.01 ether; // BOOST_FEATURED               // ~$30/day
    }

    /// @dev Map badge tier → fee action ID for ecosystem.calculateFee().
    function _getBadgeActionId(uint8 tier) internal pure returns (bytes32) {
        if (tier == BADGE_VERIFIED) return ACTION_BADGE_VERIFIED;
        if (tier == BADGE_PREMIUM)  return ACTION_BADGE_PREMIUM;
        return ACTION_BADGE_ELITE;
    }

    /// @dev Username pricing: shorter names are more expensive (vanity pricing).
    ///      1 char = 1 ETH, 2 = 0.2, 3 = 0.03, 4 = 0.004, 5 = 0.0005, 6 = 0.0001, 7+ = free
    function _getUsernamePrice(uint256 length) internal pure returns (uint256) {
        if (length == 0) return type(uint256).max; // invalid
        if (length == 1) return 1 ether;
        if (length == 2) return 0.2 ether;
        if (length == 3) return 0.03 ether;
        if (length == 4) return 0.004 ether;
        if (length == 5) return 0.0005 ether;
        if (length == 6) return 0.0001 ether;
        return 0; // 7+ chars = free
    }

    /// @dev Validate username (1-15 chars, a-z 0-9 _ only) and convert to lowercase.
    ///      Used in state-changing functions (memory allocation allowed).
    function _validateAndLower(string calldata str) internal pure returns (string memory) {
        bytes calldata raw = bytes(str);
        uint256 len = raw.length;
        if (len == 0 || len > 15) revert InvalidUsername();

        bytes memory result = new bytes(len);
        for (uint256 i; i < len;) {
            uint8 c = uint8(raw[i]);

            // Convert A-Z → a-z
            if (c >= 65 && c <= 90) {
                c += 32;
            }

            // Must be a-z (97-122), 0-9 (48-57), or _ (95)
            if (
                !(c >= 97 && c <= 122) &&
                !(c >= 48 && c <= 57) &&
                c != 95
            ) {
                revert InvalidUsername();
            }

            result[i] = bytes1(c);
            unchecked { ++i; }
        }

        return string(result);
    }

    /// @dev View-safe version of username validation (doesn't revert on invalid, returns empty).
    ///      Used by isUsernameAvailable().
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
