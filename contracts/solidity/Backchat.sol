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
 *  Version     : 8.0.0
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
 *  VIRAL REFERRAL SYSTEM (V8)
 *
 *  Users set a referrer ONCE (immutable). Every social action distributes
 *  20% of gas cost as fees:
 *
 *  ┌─────────────────────────────────────────────────────────────────────────────┐
 *  │                    SOCIAL ACTIONS (20% of gas cost)                          │
 *  ├─────────────────────────────────────────────────────────────────────────────┤
 *  │                                                                             │
 *  │  WITH OPERATOR + REFERRER:                                                  │
 *  │  ├── 50% → Operator (frontend/app builder)                                  │
 *  │  ├── 30% → Referrer (influencer who invited the user)                       │
 *  │  └── 20% → Protocol (treasury)                                              │
 *  │                                                                             │
 *  │  WITH OPERATOR, NO REFERRER:                                                │
 *  │  ├── 80% → Operator                                                         │
 *  │  └── 20% → Protocol                                                         │
 *  │                                                                             │
 *  │  WITHOUT OPERATOR:                                                          │
 *  │  └── 100% → Protocol                                                        │
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
 *  | Profile Boost    | >=0.0005 ETH      | +1 day visibility per 0.0005 ETH       |
 *  | Trust Badge      | 0.001 ETH         | Verified badge for 1 year              |
 *  | Super Like       | >=0.0001 ETH      | Premium engagement + trending          |
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

    uint256 private constant POST_GAS = 80000;
    uint256 private constant REPLY_GAS = 90000;
    uint256 private constant LIKE_GAS = 50000;
    uint256 private constant FOLLOW_GAS = 60000;
    uint256 private constant REPOST_GAS = 80000;

    // ─────────────────────────────────────────────────────────────────────────────
    // Fee Configuration
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Fee as basis points of gas cost (20%)
    uint256 private constant FEE_BASIS_POINTS = 2000;

    /// @notice Maximum fee cap per operation (0.01 ETH)
    uint256 private constant MAX_FEE_WEI = 0.01 ether;

    /// @notice Basis points denominator
    uint256 private constant BIPS = 10000;

    // ─────────────────────────────────────────────────────────────────────────────
    // Viral Fee Distribution (Social Actions)
    // ─────────────────────────────────────────────────────────────────────────────

    // With referrer: 50% operator / 30% referrer / 20% protocol
    uint256 private constant OPERATOR_SHARE = 5000;
    uint256 private constant REFERRER_SHARE = 3000;
    uint256 private constant PROTOCOL_SHARE = 2000;

    // Without referrer: 80% operator / 20% protocol
    uint256 private constant OPERATOR_NO_REFERRER_SHARE = 8000;

    // ─────────────────────────────────────────────────────────────────────────────
    // Premium Feature Distribution (Username, Badge, Boost)
    // ─────────────────────────────────────────────────────────────────────────────

    uint256 private constant PREMIUM_OPERATOR_BIPS = 6000;
    uint256 private constant PREMIUM_PROTOCOL_BIPS = 4000;

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

    /// @notice Post ID -> Author address
    mapping(uint256 => address) public postAuthor;

    /// @notice Address -> Pending ETH balance for withdrawal
    mapping(address => uint256) public pendingEth;

    /// @notice Username hash -> Owner address (ensures uniqueness)
    mapping(bytes32 => address) public usernameOwner;

    /// @notice Post ID -> User -> Has liked (limit 1 per post per user)
    mapping(uint256 => mapping(address => bool)) public hasLiked;

    // ─────────────────────────────────────────────────────────────────────────────
    // Premium Features
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Address -> Profile boost expiration timestamp
    mapping(address => uint256) public boostExpiry;

    /// @notice Address -> Trust badge expiration timestamp
    mapping(address => uint256) public badgeExpiry;

    // ─────────────────────────────────────────────────────────────────────────────
    // Viral Referral System (V8)
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice User -> Who referred them (immutable once set)
    mapping(address => address) public referredBy;

    /// @notice Referrer -> Total users referred
    mapping(address => uint256) public referralCount;

    /// @notice Referrer -> Total ETH earned from referrals
    mapping(address => uint256) public referralEarnings;

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

    event EarningsWithdrawn(
        address indexed user,
        uint256 amount
    );

    event ActionFeeCollected(
        address indexed user,
        address indexed operator,
        address referrer,
        uint256 fee,
        string actionType
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

    // ─────────────────────────────────────────────────────────────────────────────
    // Referral Events
    // ─────────────────────────────────────────────────────────────────────────────

    event ReferrerSet(
        address indexed user,
        address indexed referrer
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
    error NoRecipientAvailable();
    error ReferrerAlreadySet();
    error CannotReferSelf();

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
    //                          REFERRAL SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Sets the referrer for msg.sender (ONE TIME ONLY, immutable)
     * @dev This creates the viral loop: referrers earn 30% of all fees
     *      generated by the users they invite.
     * @param _referrer Address of the person who referred this user
     */
    function setReferrer(address _referrer) external {
        if (_referrer == address(0)) revert InvalidAddress();
        if (_referrer == msg.sender) revert CannotReferSelf();
        if (referredBy[msg.sender] != address(0)) revert ReferrerAlreadySet();

        referredBy[msg.sender] = _referrer;
        referralCount[_referrer]++;

        emit ReferrerSet(msg.sender, _referrer);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //                          FEE CALCULATION
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Calculates dynamic fee based on current gas price
     * @param gasEstimate Estimated gas for the operation
     * @return Fee amount in wei (20% of gas cost, capped at 0.01 ETH)
     */
    function calculateFee(uint256 gasEstimate) public view returns (uint256) {
        uint256 fee = (gasEstimate * tx.gasprice * FEE_BASIS_POINTS) / BIPS;
        return fee > MAX_FEE_WEI ? MAX_FEE_WEI : fee;
    }

    /**
     * @notice Returns estimated fee for an average social action
     * @dev Uses average gas across post/reply/like/follow
     * @return Estimated fee in wei
     */
    function calculateActionFee() public view returns (uint256) {
        return calculateFee((POST_GAS + REPLY_GAS + LIKE_GAS + FOLLOW_GAS) / 4);
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
        postFee = calculateFee(POST_GAS);
        replyFee = calculateFee(REPLY_GAS);
        likeFee = calculateFee(LIKE_GAS);
        followFee = calculateFee(FOLLOW_GAS);
        repostFee = calculateFee(REPOST_GAS);
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

        // Distribute fee (premium feature: 60/40 operator/protocol)
        if (msg.value > 0) {
            _distributePremium(msg.value, operator);
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

        uint256 fee = calculateFee(POST_GAS);
        if (msg.value < fee) revert InsufficientFee();

        postId = ++postCounter;
        postAuthor[postId] = msg.sender;

        // Viral distribution: 50/30/20 or 80/20 or 100% protocol
        _distributeViralFee(fee, operator, "post");
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

        uint256 fee = calculateFee(REPLY_GAS);
        if (msg.value < fee) revert InsufficientFee();

        postId = ++postCounter;
        postAuthor[postId] = msg.sender;

        // Viral distribution: 50/30/20 or 80/20 or 100% protocol
        _distributeViralFee(fee, operator, "reply");
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

        uint256 fee = calculateFee(REPOST_GAS);
        if (msg.value < fee) revert InsufficientFee();

        postId = ++postCounter;
        postAuthor[postId] = msg.sender;

        // Viral distribution: 50/30/20 or 80/20 or 100% protocol
        _distributeViralFee(fee, operator, "repost");
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

        uint256 fee = calculateFee(LIKE_GAS);
        if (msg.value < fee) revert InsufficientFee();

        hasLiked[postId][msg.sender] = true;

        // Viral distribution: 50/30/20 or 80/20 or 100% protocol
        _distributeViralFee(fee, operator, "like");
        _refundExcess(fee);

        // Process BKC tip with graceful degradation
        if (tipBkc > 0) {
            _processBkcTip(creator, tipBkc, operator);
        }

        emit Liked(postId, msg.sender, tipBkc, operator);
    }

    /**
     * @notice Super likes a post (premium engagement, unlimited per user)
     * @dev Super likes can be given multiple times and act as organic trending.
     *      ALL ETH is distributed with viral split (no refund).
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

        // All ETH distributed with viral split (no refund — acts as promotion)
        _distributeViralFee(msg.value, operator, "superlike");

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

        uint256 fee = calculateFee(FOLLOW_GAS);
        if (msg.value < fee) revert InsufficientFee();

        // Viral distribution: 50/30/20 or 80/20 or 100% protocol
        _distributeViralFee(fee, operator, "follow");
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

        // Premium distribution: 60/40 operator/protocol
        _distributePremium(msg.value, operator);

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

        // Premium distribution: 60/40 operator/protocol
        _distributePremium(msg.value, operator);

        emit BadgeObtained(msg.sender, badgeExpiry[msg.sender], operator);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //                          WITHDRAWAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Withdraws accumulated ETH earnings
     * @dev Operators, referrers, and treasury can withdraw accumulated ETH
     */
    function withdraw() external {
        uint256 amount = pendingEth[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // Clear balance before transfer (reentrancy protection)
        pendingEth[msg.sender] = 0;

        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EarningsWithdrawn(msg.sender, amount);
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
     * @notice Returns pending ETH earnings for an address (alias for frontend)
     * @param user Address to check
     * @return Pending ETH amount
     */
    function getEarnings(address user) external view returns (uint256) {
        return pendingEth[user];
    }

    /**
     * @notice Returns referral statistics for a referrer
     * @param referrer Address to check
     * @return totalReferred Number of users this address has referred
     * @return totalEarned Total ETH earned from referral fees
     */
    function getReferralStats(address referrer) external view returns (
        uint256 totalReferred,
        uint256 totalEarned
    ) {
        totalReferred = referralCount[referrer];
        totalEarned = referralEarnings[referrer];
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
        return "8.0.0";
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
     * @dev Distributes ETH fee using the VIRAL REFERRAL model
     *      - With operator + referrer: 50% operator / 30% referrer / 20% protocol
     *      - With operator, no referrer: 80% operator / 20% protocol
     *      - Without operator: 100% protocol
     *      Falls back gracefully if treasury lookup fails
     * @param amount Total ETH fee to distribute
     * @param operator Frontend operator address
     * @param actionType Action type string for event tracking
     */
    function _distributeViralFee(
        uint256 amount,
        address operator,
        string memory actionType
    ) internal {
        address treasury = _getTreasury();
        address referrer = referredBy[msg.sender];

        uint256 operatorShare;
        uint256 referrerAmount;
        uint256 protocolShare;

        if (operator != address(0)) {
            if (referrer != address(0)) {
                // Full viral split: 50/30/20
                operatorShare = (amount * OPERATOR_SHARE) / BIPS;
                referrerAmount = (amount * REFERRER_SHARE) / BIPS;
                protocolShare = amount - operatorShare - referrerAmount;
            } else {
                // No referrer: 80/20
                operatorShare = (amount * OPERATOR_NO_REFERRER_SHARE) / BIPS;
                protocolShare = amount - operatorShare;
            }
        } else {
            // No operator: 100% protocol
            protocolShare = amount;
        }

        // Accumulate earnings
        if (operatorShare > 0) {
            pendingEth[operator] += operatorShare;
        }

        if (referrerAmount > 0) {
            pendingEth[referrer] += referrerAmount;
            referralEarnings[referrer] += referrerAmount;
        }

        // Protocol share to treasury
        if (protocolShare > 0) {
            if (treasury != address(0)) {
                pendingEth[treasury] += protocolShare;
            } else if (operator != address(0)) {
                // FALLBACK: Treasury unavailable, give to operator
                pendingEth[operator] += protocolShare;
            }
            // If both unavailable, ETH stays in contract (recoverable)
        }

        emit ActionFeeCollected(msg.sender, operator, referrer, amount, actionType);
    }

    /**
     * @dev Distributes ETH fee for PREMIUM features (60/40 operator/protocol)
     *      Used by: createProfile, boostProfile, obtainBadge
     *      Falls back gracefully if treasury lookup fails
     * @param amount Total ETH to distribute
     * @param operator Frontend operator address
     */
    function _distributePremium(
        uint256 amount,
        address operator
    ) internal {
        address treasury = _getTreasury();

        uint256 operatorShare = (amount * PREMIUM_OPERATOR_BIPS) / BIPS;
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
        } else {
            // Both unavailable: revert to prevent locking user's ETH
            revert NoRecipientAvailable();
        }

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
        for (uint256 i; i < username.length;) {
            bytes1 char = username[i];

            // Valid: 0-9 (0x30-0x39), a-z (0x61-0x7a), _ (0x5f)
            bool isDigit = (char >= 0x30 && char <= 0x39);
            bool isLowercase = (char >= 0x61 && char <= 0x7a);
            bool isUnderscore = (char == 0x5f);

            if (!isDigit && !isLowercase && !isUnderscore) {
                return false;
            }
            unchecked { ++i; }
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //                          RECEIVE FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Allows contract to receive ETH
    receive() external payable {}
}
