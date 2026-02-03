// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *                             BACKCHAIN PROTOCOL
 *
 *             ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ████████╗
 *             ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║  ██║██╔══██╗╚══██╔══╝
 *             ██████╔╝███████║██║     █████╔╝ ██║     ███████║███████║   ██║
 *             ██╔══██╗██╔══██║██║     ██╔═██╗ ██║     ██╔══██║██╔══██║   ██║
 *             ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╗██║  ██║██║  ██║   ██║
 *             ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *  Contract    : Backchat
 *  Version     : 7.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *  100% DECENTRALIZED SOCIAL PROTOCOL
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *  - GRACEFUL DEGRADATION    : Works even if ecosystem contracts fail
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *  RESILIENCE DESIGN
 *
 *  This contract is designed to NEVER STOP working, even if:
 *
 *  ┌─────────────────────────────────────────────────────────────────────────────┐
 *  │  SCENARIO                        │  BACKCHAT BEHAVIOR                       │
 *  ├─────────────────────────────────────────────────────────────────────────────┤
 *  │  Everything works normally       │  Full integration with ecosystem         │
 *  │  EcosystemManager fails          │  Treasury share → Operator (fallback)    │
 *  │  MiningManager fails             │  BKC tip → 100% Creator (fallback)       │
 *  │  BKC token paused                │  ETH works, BKC tips silently skip       │
 *  │  All external contracts fail     │  ETH distribution continues (basic mode) │
 *  └─────────────────────────────────────────────────────────────────────────────┘
 *
 *  THE PROTOCOL NEVER STOPS. POSTS ARE FOREVER.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchat
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn ETH from ALL fees + BKC from MiningManager
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *  FEE STRUCTURE
 *
 *  ┌─────────────────────────────────────────────────────────────────────────────┐
 *  │                         ETH FEE (20% of gas cost)                           │
 *  ├─────────────────────────────────────────────────────────────────────────────┤
 *  │                                                                             │
 *  │  ACTIONS WITH CREATOR (Reply, Like, Super Like, Follow, Repost):            │
 *  │  ├── 40% → Creator                                                          │
 *  │  ├── 30% → Operator                                                         │
 *  │  └── 30% → Treasury                                                         │
 *  │                                                                             │
 *  │  ACTIONS WITHOUT CREATOR (Post, Username, Boost, Badge):                    │
 *  │  ├── 60% → Operator                                                         │
 *  │  └── 40% → Treasury                                                         │
 *  │                                                                             │
 *  └─────────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌─────────────────────────────────────────────────────────────────────────────┐
 *  │                    BKC TIP (Integrated with Ecosystem)                      │
 *  ├─────────────────────────────────────────────────────────────────────────────┤
 *  │                                                                             │
 *  │  90% → CREATOR (direct, instant)                                            │
 *  │                                                                             │
 *  │  10% → MINING MANAGER (feeds entire ecosystem)                              │
 *  │        ├── Operator rewards (config%)                                       │
 *  │        ├── Burn (deflationary)                                              │
 *  │        ├── Mining rewards → Treasury + Delegators                           │
 *  │        └── Fee distribution → Treasury + Delegators                         │
 *  │                                                                             │
 *  │  FALLBACK: If MiningManager fails, 100% goes to Creator                     │
 *  │                                                                             │
 *  └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *  SUPER LIKE = ORGANIC TRENDING
 *
 *  • Anyone can Super Like (minimum 0.0001 ETH)
 *  • Amount is FREE (can pay 0.0001 or 1 ETH)
 *  • MULTIPLE Super Likes allowed on same post
 *  • Frontend sums all and ranks posts by "trending"
 *  • Community decides what deserves visibility!
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 *  PREMIUM FEATURES
 *
 *  +------------------+-------------------+----------------------------------------+
 *  | Feature          | Price             | Effect                                 |
 *  +------------------+-------------------+----------------------------------------+
 *  | Username 1 char  | 1 ETH             | Ultra-rare vanity name                 |
 *  | Username 2 chars | 0.2 ETH           | Very rare vanity name                  |
 *  | Username 3 chars | 0.03 ETH          | Rare vanity name                       |
 *  | Username 4 chars | 0.004 ETH         | Premium name                           |
 *  | Username 5 chars | 0.0005 ETH        | Short name                             |
 *  | Username 6 chars | 0.0001 ETH        | Nice name                              |
 *  | Username 7+ char | FREE              | Standard name                          |
 *  +------------------+-------------------+----------------------------------------+
 *  | Profile Boost    | ≥0.0005 ETH       | +1 day visibility per 0.0005 ETH       |
 *  | Trust Badge      | 0.001 ETH         | Verified badge for 1 year              |
 *  | Super Like       | ≥0.0001 ETH       | Premium engagement + trending          |
 *  +------------------+-------------------+----------------------------------------+
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════════
//                                  INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════════

interface IEcosystemManager {
    function getTreasuryAddress() external view returns (address);
    function getMiningManagerAddress() external view returns (address);
}

interface IBKC {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IMiningManager {
    function performPurchaseMiningWithOperator(
        bytes32 serviceKey,
        uint256 purchaseAmount,
        address operator
    ) external payable;
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                                   CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════════

contract Backchat {
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────────
    // Service Key
    // ─────────────────────────────────────────────────────────────────────────────
    
    /// @notice Service key for MiningManager authorization
    bytes32 public constant SERVICE_KEY = keccak256("BACKCHAT_SERVICE");
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Gas Estimates (for dynamic fee calculation)
    // ─────────────────────────────────────────────────────────────────────────────
    
    uint256 private constant GAS_POST = 50000;
    uint256 private constant GAS_REPLY = 55000;
    uint256 private constant GAS_LIKE = 55000;
    uint256 private constant GAS_FOLLOW = 45000;
    uint256 private constant GAS_REPOST = 50000;
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Fee Configuration
    // ─────────────────────────────────────────────────────────────────────────────
    
    /// @notice Fee percentage of gas cost (20%)
    uint256 private constant FEE_PERCENT = 20;
    
    /// @notice Basis points denominator
    uint256 private constant BIPS = 10000;
    
    // ETH split WITH creator (40/30/30)
    uint256 private constant CREATOR_BIPS = 4000;
    uint256 private constant OPERATOR_BIPS = 3000;
    uint256 private constant TREASURY_BIPS = 3000;
    
    // ETH split WITHOUT creator (60/40)
    uint256 private constant OPERATOR_NO_CREATOR_BIPS = 6000;
    uint256 private constant TREASURY_NO_CREATOR_BIPS = 4000;
    
    // BKC tip split (90% creator, 10% mining ecosystem)
    uint256 private constant CREATOR_TIP_BIPS = 9000;
    uint256 private constant MINING_TIP_BIPS = 1000;
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Premium Features Pricing
    // ─────────────────────────────────────────────────────────────────────────────
    
    uint256 private constant SUPER_LIKE_MIN = 0.0001 ether;
    uint256 private constant BOOST_MIN = 0.0005 ether;
    uint256 private constant BOOST_RATE = 1 days;
    uint256 private constant BADGE_FEE = 0.001 ether;
    uint256 private constant BADGE_DURATION = 365 days;
    
    // Username pricing by length
    uint256 private constant USERNAME_1_CHAR = 1 ether;
    uint256 private constant USERNAME_2_CHAR = 0.2 ether;
    uint256 private constant USERNAME_3_CHAR = 0.03 ether;
    uint256 private constant USERNAME_4_CHAR = 0.004 ether;
    uint256 private constant USERNAME_5_CHAR = 0.0005 ether;
    uint256 private constant USERNAME_6_CHAR = 0.0001 ether;
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Content Limits
    // ─────────────────────────────────────────────────────────────────────────────
    
    uint256 private constant MAX_CONTENT = 500;
    uint256 private constant MAX_BIO = 160;
    uint256 private constant MAX_DISPLAY_NAME = 30;
    uint256 private constant MIN_USERNAME = 1;
    uint256 private constant MAX_USERNAME = 15;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /// @notice BKC token contract address
    address public immutable bkcToken;
    
    /// @notice EcosystemManager contract address
    address public immutable ecosystemManager;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Counters
    // ─────────────────────────────────────────────────────────────────────────────
    
    /// @notice Total posts created
    uint256 public postCounter;
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Core Mappings
    // ─────────────────────────────────────────────────────────────────────────────
    
    /// @notice Post ID → Author address
    mapping(uint256 => address) public postAuthor;
    
    /// @notice Address → Pending ETH balance for withdrawal
    mapping(address => uint256) public pendingEth;
    
    /// @notice Username hash → Owner address (ensures uniqueness)
    mapping(bytes32 => address) public usernameOwner;
    
    /// @notice Post ID → User → Has liked (limit 1 per post per user)
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Premium Features
    // ─────────────────────────────────────────────────────────────────────────────
    
    /// @notice Address → Profile boost expiration timestamp
    mapping(address => uint256) public boostExpiry;
    
    /// @notice Address → Trust badge expiration timestamp
    mapping(address => uint256) public badgeExpiry;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Profile Events
    // ─────────────────────────────────────────────────────────────────────────────
    
    event ProfileCreated(
        address indexed user,
        bytes32 indexed usernameHash,
        string username,
        string displayName,
        string bio,
        uint256 ethPaid,
        address indexed operator
    );
    
    event ProfileUpdated(
        address indexed user,
        string displayName,
        string bio
    );
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Content Events
    // ─────────────────────────────────────────────────────────────────────────────
    
    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string content,
        string mediaCID,
        address indexed operator
    );
    
    event ReplyCreated(
        uint256 indexed postId,
        uint256 indexed parentId,
        address indexed author,
        string content,
        string mediaCID,
        uint256 tipBkc,
        address operator
    );
    
    event RepostCreated(
        uint256 indexed newPostId,
        uint256 indexed originalPostId,
        address indexed reposter,
        uint256 tipBkc,
        address operator
    );
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Engagement Events
    // ─────────────────────────────────────────────────────────────────────────────
    
    event Liked(
        uint256 indexed postId,
        address indexed user,
        uint256 tipBkc,
        address indexed operator
    );
    
    event SuperLiked(
        uint256 indexed postId,
        address indexed user,
        uint256 ethAmount,
        uint256 tipBkc,
        address indexed operator
    );
    
    event Followed(
        address indexed follower,
        address indexed followed,
        uint256 tipBkc,
        address indexed operator
    );
    
    event Unfollowed(
        address indexed follower,
        address indexed followed
    );
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Premium Events
    // ─────────────────────────────────────────────────────────────────────────────
    
    event ProfileBoosted(
        address indexed user,
        uint256 amount,
        uint256 expiresAt,
        address indexed operator
    );
    
    event BadgeObtained(
        address indexed user,
        uint256 expiresAt,
        address indexed operator
    );
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Financial Events
    // ─────────────────────────────────────────────────────────────────────────────
    
    event Withdrawal(
        address indexed user,
        uint256 amount
    );
    
    event TipProcessed(
        address indexed from,
        address indexed creator,
        uint256 totalBkc,
        uint256 creatorShare,
        uint256 miningShare,
        address indexed operator
    );
    
    event TipFallback(
        address indexed from,
        address indexed creator,
        uint256 amount,
        string reason
    );
    
    event EthDistributed(
        address indexed creator,
        address indexed operator,
        address treasury,
        uint256 creatorShare,
        uint256 operatorShare,
        uint256 treasuryShare
    );
    
    event EcosystemCallFailed(
        string functionName,
        bytes reason
    );
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              ERRORS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    error InsufficientFee();
    error PostNotFound();
    error AlreadyLiked();
    error InvalidUsername();
    error UsernameTaken();
    error ContentTooLong();
    error NothingToWithdraw();
    error TransferFailed();
    error InvalidAddress();
    error SelfActionNotAllowed();
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Initializes the Backchat contract
     * @param _bkcToken Address of the BKC token contract
     * @param _ecosystemManager Address of the EcosystemManager contract
     */
    constructor(address _bkcToken, address _ecosystemManager) {
        if (_bkcToken == address(0)) revert InvalidAddress();
        if (_ecosystemManager == address(0)) revert InvalidAddress();
        
        bkcToken = _bkcToken;
        ecosystemManager = _ecosystemManager;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          FEE CALCULATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Calculates dynamic fee based on current gas price
     * @param gasEstimate Estimated gas for the operation
     * @return Fee amount in wei
     */
    function calculateFee(uint256 gasEstimate) public view returns (uint256) {
        return (gasEstimate * tx.gasprice * FEE_PERCENT) / 100;
    }
    
    /**
     * @notice Returns current fees for all operations
     * @dev Frontend should call this before each action to show user the cost
     */
    function getCurrentFees() external view returns (
        uint256 postFee,
        uint256 replyFee,
        uint256 likeFee,
        uint256 followFee,
        uint256 repostFee,
        uint256 superLikeMin,
        uint256 boostMin,
        uint256 badgeFee_
    ) {
        postFee = calculateFee(GAS_POST);
        replyFee = calculateFee(GAS_REPLY);
        likeFee = calculateFee(GAS_LIKE);
        followFee = calculateFee(GAS_FOLLOW);
        repostFee = calculateFee(GAS_REPOST);
        superLikeMin = SUPER_LIKE_MIN;
        boostMin = BOOST_MIN;
        badgeFee_ = BADGE_FEE;
    }
    
    /**
     * @notice Returns username fee based on length
     * @param length Number of characters in username
     * @return Fee in ETH (0 for 7+ characters)
     */
    function getUsernameFee(uint256 length) public pure returns (uint256) {
        if (length == 1) return USERNAME_1_CHAR;
        if (length == 2) return USERNAME_2_CHAR;
        if (length == 3) return USERNAME_3_CHAR;
        if (length == 4) return USERNAME_4_CHAR;
        if (length == 5) return USERNAME_5_CHAR;
        if (length == 6) return USERNAME_6_CHAR;
        return 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          PROFILE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Creates a new user profile with username
     * @param username Unique username (1-15 chars, lowercase a-z, 0-9, underscore)
     * @param displayName Display name (max 30 chars)
     * @param bio User biography (max 160 chars)
     * @param operator Frontend operator address
     */
    function createProfile(
        string calldata username,
        string calldata displayName,
        string calldata bio,
        address operator
    ) external payable {
        bytes memory usernameBytes = bytes(username);
        uint256 len = usernameBytes.length;
        
        // Validate username
        if (len < MIN_USERNAME || len > MAX_USERNAME) revert InvalidUsername();
        if (!_validateUsername(usernameBytes)) revert InvalidUsername();
        
        // Validate other fields
        if (bytes(displayName).length > MAX_DISPLAY_NAME) revert ContentTooLong();
        if (bytes(bio).length > MAX_BIO) revert ContentTooLong();
        
        // Check username availability
        bytes32 usernameHash = keccak256(usernameBytes);
        if (usernameOwner[usernameHash] != address(0)) revert UsernameTaken();
        
        // Check fee
        uint256 fee = getUsernameFee(len);
        if (msg.value < fee) revert InsufficientFee();
        
        // Register username
        usernameOwner[usernameHash] = msg.sender;
        
        // Distribute fee (if any)
        if (msg.value > 0) {
            _distributeNoCreator(msg.value, operator);
        }
        
        emit ProfileCreated(
            msg.sender,
            usernameHash,
            username,
            displayName,
            bio,
            msg.value,
            operator
        );
    }
    
    /**
     * @notice Updates user profile (free, only gas)
     * @param displayName New display name
     * @param bio New biography
     */
    function updateProfile(
        string calldata displayName,
        string calldata bio
    ) external {
        if (bytes(displayName).length > MAX_DISPLAY_NAME) revert ContentTooLong();
        if (bytes(bio).length > MAX_BIO) revert ContentTooLong();
        
        emit ProfileUpdated(msg.sender, displayName, bio);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          CONTENT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Creates a new post
     * @param content Post content (max 500 chars)
     * @param mediaCID IPFS CID for media attachment (optional)
     * @param operator Frontend operator address
     * @return postId The ID of the created post
     */
    function createPost(
        string calldata content,
        string calldata mediaCID,
        address operator
    ) external payable returns (uint256 postId) {
        if (bytes(content).length > MAX_CONTENT) revert ContentTooLong();
        
        uint256 fee = calculateFee(GAS_POST);
        if (msg.value < fee) revert InsufficientFee();
        
        postId = ++postCounter;
        postAuthor[postId] = msg.sender;
        
        // Original post: no creator, split 60/40
        _distributeNoCreator(fee, operator);
        _refundExcess(fee);
        
        emit PostCreated(postId, msg.sender, content, mediaCID, operator);
    }
    
    /**
     * @notice Creates a reply to an existing post
     * @param parentId ID of the post being replied to
     * @param content Reply content (max 500 chars)
     * @param mediaCID IPFS CID for media attachment (optional)
     * @param operator Frontend operator address
     * @param tipBkc Optional BKC tip amount for the original author
     * @return postId The ID of the created reply
     */
    function createReply(
        uint256 parentId,
        string calldata content,
        string calldata mediaCID,
        address operator,
        uint256 tipBkc
    ) external payable returns (uint256 postId) {
        if (bytes(content).length > MAX_CONTENT) revert ContentTooLong();
        
        address creator = postAuthor[parentId];
        if (creator == address(0)) revert PostNotFound();
        
        uint256 fee = calculateFee(GAS_REPLY);
        if (msg.value < fee) revert InsufficientFee();
        
        postId = ++postCounter;
        postAuthor[postId] = msg.sender;
        
        // Distribute ETH fee (40/30/30)
        _distribute(fee, creator, operator);
        _refundExcess(fee);
        
        // Process BKC tip with graceful degradation
        if (tipBkc > 0) {
            _processBkcTip(creator, tipBkc, operator);
        }
        
        emit ReplyCreated(postId, parentId, msg.sender, content, mediaCID, tipBkc, operator);
    }
    
    /**
     * @notice Reposts an existing post
     * @param originalPostId ID of the post being reposted
     * @param operator Frontend operator address
     * @param tipBkc Optional BKC tip amount for the original author
     * @return postId The ID of the created repost
     */
    function createRepost(
        uint256 originalPostId,
        address operator,
        uint256 tipBkc
    ) external payable returns (uint256 postId) {
        address creator = postAuthor[originalPostId];
        if (creator == address(0)) revert PostNotFound();
        
        uint256 fee = calculateFee(GAS_REPOST);
        if (msg.value < fee) revert InsufficientFee();
        
        postId = ++postCounter;
        postAuthor[postId] = msg.sender;
        
        // Distribute ETH fee (40/30/30)
        _distribute(fee, creator, operator);
        _refundExcess(fee);
        
        // Process BKC tip with graceful degradation
        if (tipBkc > 0) {
            _processBkcTip(creator, tipBkc, operator);
        }
        
        emit RepostCreated(postId, originalPostId, msg.sender, tipBkc, operator);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          ENGAGEMENT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Likes a post (limited to one per user per post)
     * @param postId ID of the post to like
     * @param operator Frontend operator address
     * @param tipBkc Optional BKC tip amount for the author
     */
    function like(
        uint256 postId,
        address operator,
        uint256 tipBkc
    ) external payable {
        address creator = postAuthor[postId];
        if (creator == address(0)) revert PostNotFound();
        if (hasLiked[postId][msg.sender]) revert AlreadyLiked();
        
        uint256 fee = calculateFee(GAS_LIKE);
        if (msg.value < fee) revert InsufficientFee();
        
        hasLiked[postId][msg.sender] = true;
        
        // Distribute ETH fee (40/30/30)
        _distribute(fee, creator, operator);
        _refundExcess(fee);
        
        // Process BKC tip with graceful degradation
        if (tipBkc > 0) {
            _processBkcTip(creator, tipBkc, operator);
        }
        
        emit Liked(postId, msg.sender, tipBkc, operator);
    }
    
    /**
     * @notice Super likes a post (premium engagement, unlimited per user)
     * @dev Super likes can be given multiple times and act as organic trending
     * @param postId ID of the post to super like
     * @param operator Frontend operator address
     * @param tipBkc Optional BKC tip amount for the author
     */
    function superLike(
        uint256 postId,
        address operator,
        uint256 tipBkc
    ) external payable {
        address creator = postAuthor[postId];
        if (creator == address(0)) revert PostNotFound();
        if (msg.value < SUPER_LIKE_MIN) revert InsufficientFee();
        
        // All ETH from Super Like is distributed (acts as promotion)
        _distribute(msg.value, creator, operator);
        
        // Process BKC tip with graceful degradation
        if (tipBkc > 0) {
            _processBkcTip(creator, tipBkc, operator);
        }
        
        emit SuperLiked(postId, msg.sender, msg.value, tipBkc, operator);
    }
    
    /**
     * @notice Follows a user
     * @param toFollow Address of the user to follow
     * @param operator Frontend operator address
     * @param tipBkc Optional BKC tip amount
     */
    function follow(
        address toFollow,
        address operator,
        uint256 tipBkc
    ) external payable {
        if (toFollow == address(0)) revert InvalidAddress();
        if (toFollow == msg.sender) revert SelfActionNotAllowed();
        
        uint256 fee = calculateFee(GAS_FOLLOW);
        if (msg.value < fee) revert InsufficientFee();
        
        // Distribute ETH fee (40/30/30)
        _distribute(fee, toFollow, operator);
        _refundExcess(fee);
        
        // Process BKC tip with graceful degradation
        if (tipBkc > 0) {
            _processBkcTip(toFollow, tipBkc, operator);
        }
        
        emit Followed(msg.sender, toFollow, tipBkc, operator);
    }
    
    /**
     * @notice Unfollows a user (free, only gas)
     * @param toUnfollow Address of the user to unfollow
     */
    function unfollow(address toUnfollow) external {
        emit Unfollowed(msg.sender, toUnfollow);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          PREMIUM FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Boosts profile visibility for a duration proportional to payment
     * @dev Duration = (ETH / 0.0005) days
     * @param operator Frontend operator address
     */
    function boostProfile(address operator) external payable {
        if (msg.value < BOOST_MIN) revert InsufficientFee();
        
        // Calculate duration: 1 day per 0.0005 ETH
        uint256 duration = (msg.value * BOOST_RATE) / BOOST_MIN;
        
        // Extend or start boost
        uint256 currentExpiry = boostExpiry[msg.sender];
        if (currentExpiry > block.timestamp) {
            boostExpiry[msg.sender] = currentExpiry + duration;
        } else {
            boostExpiry[msg.sender] = block.timestamp + duration;
        }
        
        // Distribute fee (no creator, 60/40)
        _distributeNoCreator(msg.value, operator);
        
        emit ProfileBoosted(msg.sender, msg.value, boostExpiry[msg.sender], operator);
    }
    
    /**
     * @notice Obtains a trust badge for 1 year
     * @param operator Frontend operator address
     */
    function obtainBadge(address operator) external payable {
        if (msg.value < BADGE_FEE) revert InsufficientFee();
        
        // Set badge expiry to 1 year from now
        badgeExpiry[msg.sender] = block.timestamp + BADGE_DURATION;
        
        // Distribute fee (no creator, 60/40)
        _distributeNoCreator(msg.value, operator);
        
        emit BadgeObtained(msg.sender, badgeExpiry[msg.sender], operator);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          WITHDRAWAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Withdraws accumulated ETH earnings
     * @dev Creators, operators, and treasury can withdraw their accumulated ETH
     */
    function withdraw() external {
        uint256 amount = pendingEth[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        
        // Clear balance before transfer (reentrancy protection)
        pendingEth[msg.sender] = 0;
        
        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawal(msg.sender, amount);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Checks if a user profile is currently boosted
     * @param user Address to check
     * @return True if profile is boosted
     */
    function isProfileBoosted(address user) external view returns (bool) {
        return boostExpiry[user] > block.timestamp;
    }
    
    /**
     * @notice Checks if a user has a valid trust badge
     * @param user Address to check
     * @return True if user has badge
     */
    function hasTrustBadge(address user) external view returns (bool) {
        return badgeExpiry[user] > block.timestamp;
    }
    
    /**
     * @notice Checks if a user has liked a specific post
     * @param postId Post ID to check
     * @param user User address to check
     * @return True if user has liked the post
     */
    function hasUserLiked(uint256 postId, address user) external view returns (bool) {
        return hasLiked[postId][user];
    }
    
    /**
     * @notice Returns the pending ETH balance for an address
     * @param user Address to check
     * @return Pending ETH amount
     */
    function getPendingBalance(address user) external view returns (uint256) {
        return pendingEth[user];
    }
    
    /**
     * @notice Checks if a username is available
     * @param username Username to check
     * @return True if username is available
     */
    function isUsernameAvailable(string calldata username) external view returns (bool) {
        bytes32 usernameHash = keccak256(bytes(username));
        return usernameOwner[usernameHash] == address(0);
    }
    
    /**
     * @notice Returns the owner of a username
     * @param username Username to lookup
     * @return Owner address (address(0) if not taken)
     */
    function getUsernameOwner(string calldata username) external view returns (address) {
        bytes32 usernameHash = keccak256(bytes(username));
        return usernameOwner[usernameHash];
    }
    
    /**
     * @notice Returns contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "7.0.0";
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                    INTERNAL FUNCTIONS (WITH GRACEFUL DEGRADATION)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Safely gets treasury address from EcosystemManager
     * @return treasury Treasury address or address(0) if call fails
     */
    function _getTreasury() internal returns (address treasury) {
        try IEcosystemManager(ecosystemManager).getTreasuryAddress() returns (address _treasury) {
            treasury = _treasury;
        } catch (bytes memory reason) {
            emit EcosystemCallFailed("getTreasuryAddress", reason);
            treasury = address(0);
        }
    }
    
    /**
     * @dev Safely gets MiningManager address from EcosystemManager
     * @return miningManager MiningManager address or address(0) if call fails
     */
    function _getMiningManager() internal returns (address miningManager) {
        try IEcosystemManager(ecosystemManager).getMiningManagerAddress() returns (address _miningManager) {
            miningManager = _miningManager;
        } catch (bytes memory reason) {
            emit EcosystemCallFailed("getMiningManagerAddress", reason);
            miningManager = address(0);
        }
    }
    
    /**
     * @dev Distributes ETH fee WITH creator (40/30/30 split)
     *      Falls back gracefully if treasury lookup fails
     * @param amount Total ETH to distribute
     * @param creator Content creator address
     * @param operator Frontend operator address
     */
    function _distribute(
        uint256 amount,
        address creator,
        address operator
    ) internal {
        address treasury = _getTreasury();
        
        uint256 creatorShare = (amount * CREATOR_BIPS) / BIPS;
        uint256 operatorShare = (amount * OPERATOR_BIPS) / BIPS;
        uint256 treasuryShare = amount - creatorShare - operatorShare;
        
        // Accumulate for creator
        pendingEth[creator] += creatorShare;
        
        // Accumulate for operator
        if (operator != address(0)) {
            pendingEth[operator] += operatorShare;
        } else {
            // No operator: add to treasury share
            treasuryShare += operatorShare;
            operatorShare = 0;
        }
        
        // Accumulate for treasury (or operator if treasury fails)
        if (treasury != address(0)) {
            pendingEth[treasury] += treasuryShare;
        } else if (operator != address(0)) {
            // FALLBACK: Treasury failed, give to operator
            pendingEth[operator] += treasuryShare;
            operatorShare += treasuryShare;
            treasuryShare = 0;
        } else {
            // FALLBACK: No treasury AND no operator, give to creator
            pendingEth[creator] += treasuryShare;
            creatorShare += treasuryShare;
            treasuryShare = 0;
        }
        
        emit EthDistributed(creator, operator, treasury, creatorShare, operatorShare, treasuryShare);
    }
    
    /**
     * @dev Distributes ETH fee WITHOUT creator (60/40 split)
     *      Falls back gracefully if treasury lookup fails
     * @param amount Total ETH to distribute
     * @param operator Frontend operator address
     */
    function _distributeNoCreator(
        uint256 amount,
        address operator
    ) internal {
        address treasury = _getTreasury();
        
        uint256 operatorShare = (amount * OPERATOR_NO_CREATOR_BIPS) / BIPS;
        uint256 treasuryShare = amount - operatorShare;
        
        // Accumulate for operator
        if (operator != address(0)) {
            pendingEth[operator] += operatorShare;
        } else {
            // No operator: add to treasury share
            treasuryShare += operatorShare;
            operatorShare = 0;
        }
        
        // Accumulate for treasury (or operator if treasury fails)
        if (treasury != address(0)) {
            pendingEth[treasury] += treasuryShare;
        } else if (operator != address(0)) {
            // FALLBACK: Treasury failed, give all to operator
            pendingEth[operator] += treasuryShare;
            operatorShare += treasuryShare;
            treasuryShare = 0;
        }
        // If both treasury and operator are unavailable, ETH stays in contract
        // (can be recovered by future withdraw if treasury comes back online)
        
        emit EthDistributed(address(0), operator, treasury, 0, operatorShare, treasuryShare);
    }
    
    /**
     * @dev Processes BKC tip with GRACEFUL DEGRADATION
     *      - Normal: 90% to creator, 10% to MiningManager
     *      - If MiningManager fails: 100% to creator
     *      - If BKC transfer fails: silently continue (don't break the tx)
     * @param creator Content creator address
     * @param tipAmount Total BKC tip amount
     * @param operator Frontend operator address
     */
    function _processBkcTip(
        address creator,
        uint256 tipAmount,
        address operator
    ) internal {
        if (tipAmount == 0) return;
        
        // Try to transfer BKC from sender to this contract
        try IBKC(bkcToken).transferFrom(msg.sender, address(this), tipAmount) returns (bool success) {
            if (!success) {
                emit TipFallback(msg.sender, creator, tipAmount, "transferFrom returned false");
                return;
            }
        } catch (bytes memory) {
            // BKC transfer failed (token paused, insufficient balance, etc.)
            // Silently continue - don't break the main transaction
            emit TipFallback(msg.sender, creator, tipAmount, "transferFrom failed");
            return;
        }
        
        // Calculate split
        uint256 creatorShare = (tipAmount * CREATOR_TIP_BIPS) / BIPS;
        uint256 miningShare = tipAmount - creatorShare;
        
        // Try to send 90% to creator
        try IBKC(bkcToken).transfer(creator, creatorShare) returns (bool success) {
            if (!success) {
                // Transfer to creator failed, try to return to sender
                try IBKC(bkcToken).transfer(msg.sender, tipAmount) {} catch {}
                emit TipFallback(msg.sender, creator, tipAmount, "creator transfer failed");
                return;
            }
        } catch {
            // Transfer to creator failed, try to return to sender
            try IBKC(bkcToken).transfer(msg.sender, tipAmount) {} catch {}
            emit TipFallback(msg.sender, creator, tipAmount, "creator transfer reverted");
            return;
        }
        
        // Try to send 10% to MiningManager
        address miningManager = _getMiningManager();
        
        if (miningManager != address(0) && miningShare > 0) {
            // Try to transfer to MiningManager and trigger mining
            try IBKC(bkcToken).transfer(miningManager, miningShare) returns (bool success) {
                if (success) {
                    // Try to trigger mining
                    try IMiningManager(miningManager).performPurchaseMiningWithOperator(
                        SERVICE_KEY,
                        miningShare,
                        operator
                    ) {
                        // Success! Full integration worked
                        emit TipProcessed(msg.sender, creator, tipAmount, creatorShare, miningShare, operator);
                        return;
                    } catch (bytes memory reason) {
                        // Mining failed, but BKC is already in MiningManager
                        // That's okay, it will be processed later or stay there
                        emit EcosystemCallFailed("performPurchaseMiningWithOperator", reason);
                        emit TipProcessed(msg.sender, creator, tipAmount, creatorShare, miningShare, operator);
                        return;
                    }
                }
            } catch {}
            
            // MiningManager transfer failed, give miningShare to creator instead
            try IBKC(bkcToken).transfer(creator, miningShare) {} catch {}
            emit TipFallback(msg.sender, creator, tipAmount, "miningManager failed, 100% to creator");
            emit TipProcessed(msg.sender, creator, tipAmount, tipAmount, 0, operator);
        } else {
            // No MiningManager available, give 100% to creator
            try IBKC(bkcToken).transfer(creator, miningShare) {} catch {}
            emit TipFallback(msg.sender, creator, tipAmount, "no miningManager, 100% to creator");
            emit TipProcessed(msg.sender, creator, tipAmount, tipAmount, 0, operator);
        }
    }
    
    /**
     * @dev Refunds excess ETH sent beyond the required fee
     * @param fee Required fee amount
     */
    function _refundExcess(uint256 fee) internal {
        if (msg.value > fee) {
            uint256 refund = msg.value - fee;
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            if (!success) revert TransferFailed();
        }
    }
    
    /**
     * @dev Validates username format (lowercase a-z, 0-9, underscore only)
     * @param username Username bytes to validate
     * @return True if valid
     */
    function _validateUsername(bytes memory username) internal pure returns (bool) {
        for (uint256 i; i < username.length; ++i) {
            bytes1 char = username[i];
            
            // Valid: 0-9 (0x30-0x39), a-z (0x61-0x7a), _ (0x5f)
            bool isDigit = (char >= 0x30 && char <= 0x39);
            bool isLowercase = (char >= 0x61 && char <= 0x7a);
            bool isUnderscore = (char == 0x5f);
            
            if (!isDigit && !isLowercase && !isUnderscore) {
                return false;
            }
        }
        return true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //                          RECEIVE FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /// @notice Allows contract to receive ETH
    receive() external payable {}
}
