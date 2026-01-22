// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║     ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ████████╗    ║
// ║     ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║  ██║██╔══██╗╚══██╔══╝    ║
// ║     ██████╔╝███████║██║     █████╔╝ ██║     ███████║███████║   ██║       ║
// ║     ██╔══██╗██╔══██║██║     ██╔═██╗ ██║     ██╔══██║██╔══██║   ██║       ║
// ║     ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╗██║  ██║██║  ██║   ██║       ║
// ║     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ║
// ║                                                                          ║
// ║              Decentralized Social Network - Backchain Protocol           ║
// ║                                                                          ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  Contract: Backchat.sol                                                  ║
// ║  Version:  1.0.0                                                         ║
// ║  Network:  Arbitrum One / Arbitrum Sepolia                               ║
// ║  License:  MIT                                                           ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║                                                                          ║
// ║  FEATURES:                                                               ║
// ║  ├─ Community-Driven Moderation (1 person = 1 vote)                      ║
// ║  ├─ Score-Based Content Visibility (Safe/Unsafe voting)                  ║
// ║  ├─ Creator Tips (split: Creator + Mining)                               ║
// ║  ├─ Community Notes for Fact-Checking                                    ║
// ║  ├─ E2EE Private Messaging                                               ║
// ║  ├─ KYC Integration for Withdrawals                                      ║
// ║  ├─ Post Boosting with ETH                                               ║
// ║  └─ Inactive Balance Burning                                             ║
// ║                                                                          ║
// ║  MODERATION SYSTEM:                                                      ║
// ║  ├─ Users vote SAFE or UNSAFE on content                                 ║
// ║  ├─ Score = safeVotes - unsafeVotes                                      ║
// ║  ├─ Score >= +threshold  → TRUSTED (highlighted)                         ║
// ║  ├─ Score in neutral     → NORMAL  (default view)                        ║
// ║  ├─ Score <= -warning    → WARNING (flagged)                             ║
// ║  └─ Score <= -hidden     → HIDDEN  (collapsed)                           ║
// ║                                                                          ║
// ║  TIP DISTRIBUTION:                                                       ║
// ║  ├─ Creator receives: tipAmount * (100% - tipMiningFeeBips)              ║
// ║  └─ Mining receives:  tipAmount * tipMiningFeeBips                       ║
// ║                                                                          ║
// ║  KYC VERIFICATION:                                                       ║
// ║  ├─ Optional (can be enabled/disabled)                                   ║
// ║  ├─ External provider integration                                        ║
// ║  └─ Required only for reward claims                                      ║
// ║                                                                          ║
// ║  ALL PARAMETERS ARE ADJUSTABLE:                                          ║
// ║  ├─ Fees, thresholds, periods                                            ║
// ║  ├─ Limits, denominators                                                 ║
// ║  └─ Service keys, addresses                                              ║
// ║                                                                          ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  Security: dev@backcoin.org | Website: https://backcoin.org              ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title Backchat
 * @author Backchain Protocol
 * @notice Decentralized social network with community-driven moderation
 * @custom:security-contact dev@backcoin.org
 */
contract Backchat is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              ENUMS                                      ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Content visibility status based on community voting
     * @dev Calculated from score = safeVotes - unsafeVotes
     */
    enum ContentStatus {
        Normal,     // Score in neutral range
        Trusted,    // Score >= thresholdTrusted
        Warning,    // Score <= -thresholdWarning
        Hidden      // Score <= -thresholdHidden
    }

    /**
     * @notice Community note approval status
     */
    enum NoteStatus {
        Pending,    // Under review
        Approved,   // Accepted by community
        Rejected    // Rejected by community
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              STRUCTS                                    ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Public post data
    struct Post {
        uint256 id;
        address author;
        string content;
        string ipfsHash;
        uint256 createdAt;
        uint256 editedAt;
        bool exists;
        bool deleted;
    }

    /// @notice Comment with threading support
    struct Comment {
        uint256 id;
        uint256 postId;
        uint256 parentCommentId;    // 0 = direct reply to post
        address author;
        string content;
        string ipfsHash;
        uint256 createdAt;
        bool exists;
        bool deleted;
    }

    /// @notice Community note for fact-checking
    struct CommunityNote {
        uint256 id;
        uint256 postId;
        address author;
        string content;
        string ipfsHash;
        uint256 createdAt;
        bool exists;
    }

    /// @notice Private message (E2EE)
    struct PrivateMessage {
        uint256 id;
        uint256 conversationId;
        uint256 parentMessageId;
        address sender;
        address recipient;
        string encryptedContent;
        string encryptedIpfsHash;
        uint256 sentAt;
        bool exists;
    }

    /// @notice Voting score for content moderation
    struct ModerationScore {
        uint256 safeVotes;
        uint256 unsafeVotes;
        uint256 totalVoters;
    }

    /// @notice Voting score for community notes
    struct NoteVotingScore {
        uint256 believeVotes;
        uint256 dontBelieveVotes;
        uint256 totalVoters;
    }

    /// @notice KYC verification data
    struct KYCData {
        bool verified;
        uint8 level;
        uint256 verifiedAt;
        uint256 expiresAt;
    }

    /// @notice Creator statistics
    struct CreatorStats {
        uint256 totalPosts;
        uint256 totalComments;
        uint256 totalTipsReceived;
        uint256 totalTipsClaimed;
        uint256 reputationScore;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADJUSTABLE PARAMETERS                           ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    // --- Core Parameters (all adjustable) ---
    
    /// @notice Basis points denominator (default: 10000 = 100%)
    uint256 public bipsDenominator;

    /// @notice Service key for MiningManager
    bytes32 public serviceKey;

    // --- Fee Parameters ---

    /// @notice Platform fee for actions (posting, voting, etc.)
    uint256 public platformFee;

    /// @notice Percentage of platform fee to MiningManager (bips)
    uint256 public platformMiningFeeBips;

    /// @notice Percentage of platform fee to Treasury (bips)
    uint256 public platformTreasuryFeeBips;

    /// @notice Minimum tip amount
    uint256 public minTipAmount;

    /// @notice Percentage of tips to MiningManager (bips)
    /// @dev Creator receives: tip * (bipsDenominator - tipMiningFeeBips) / bipsDenominator
    uint256 public tipMiningFeeBips;

    // --- Moderation Thresholds ---

    /// @notice Score threshold for TRUSTED status (positive)
    uint256 public thresholdTrusted;

    /// @notice Score threshold for WARNING status (negative, absolute value)
    uint256 public thresholdWarning;

    /// @notice Score threshold for HIDDEN status (negative, absolute value)
    uint256 public thresholdHidden;

    /// @notice Score threshold for note approval
    uint256 public noteApprovalThreshold;

    /// @notice Score threshold for note rejection (negative)
    uint256 public noteRejectionThreshold;

    // --- Time Parameters ---

    /// @notice Period of inactivity before balance can be burned
    uint256 public inactivityBurnPeriod;

    /// @notice Cooldown between posts (anti-spam)
    uint256 public postCooldown;

    /// @notice Cooldown between comments
    uint256 public commentCooldown;

    // --- Limits ---

    /// @notice Maximum platform fee allowed
    uint256 public maxPlatformFee;

    /// @notice Maximum tip mining fee (bips)
    uint256 public maxTipMiningFeeBips;

    /// @notice Maximum content length (characters)
    uint256 public maxContentLength;

    /// @notice Maximum IPFS hash length
    uint256 public maxIpfsHashLength;

    /// @notice Minimum inactivity burn period
    uint256 public minInactivityBurnPeriod;

    // --- KYC Configuration ---

    /// @notice Whether KYC is required for withdrawals
    bool public kycRequired;

    /// @notice KYC provider contract address
    address public kycProvider;

    /// @notice Minimum KYC level required
    uint8 public kycMinimumLevel;

    /// @notice KYC validity period (0 = never expires)
    uint256 public kycValidityPeriod;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ECOSYSTEM REFERENCES                            ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Ecosystem manager contract
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice Treasury address
    address public treasury;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - POSTS                                 ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Post ID => Post data
    mapping(uint256 => Post) internal _posts;

    /// @notice Post ID => Moderation score
    mapping(uint256 => ModerationScore) internal _postScores;

    /// @notice Post ID => Comment IDs
    mapping(uint256 => uint256[]) internal _postComments;

    /// @notice Post ID => Note IDs
    mapping(uint256 => uint256[]) internal _postNotes;

    /// @notice Post ID => Total ETH boost
    mapping(uint256 => uint256) public postBoostAmount;

    /// @notice Post ID => Total tips received
    mapping(uint256 => uint256) public postTipsReceived;

    /// @notice Total posts counter
    uint256 internal _totalPosts;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - COMMENTS                              ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Comment ID => Comment data
    mapping(uint256 => Comment) internal _comments;

    /// @notice Comment ID => Moderation score
    mapping(uint256 => ModerationScore) internal _commentScores;

    /// @notice Comment ID => Reply IDs
    mapping(uint256 => uint256[]) internal _commentReplies;

    /// @notice Total comments counter
    uint256 internal _totalComments;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - NOTES                                 ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Note ID => Note data
    mapping(uint256 => CommunityNote) internal _notes;

    /// @notice Note ID => Voting score
    mapping(uint256 => NoteVotingScore) internal _noteScores;

    /// @notice Total notes counter
    uint256 internal _totalNotes;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - MESSAGES                              ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Message ID => Message data
    mapping(uint256 => PrivateMessage) internal _messages;

    /// @notice Conversation ID => Message IDs
    mapping(uint256 => uint256[]) internal _conversationMessages;

    /// @notice User => Conversation IDs
    mapping(address => uint256[]) internal _userConversations;

    /// @notice User => E2EE public key
    mapping(address => bytes) internal _publicKeys;

    /// @notice Total messages counter
    uint256 internal _totalMessages;

    /// @notice Total conversations counter
    uint256 internal _totalConversations;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - VOTING                                ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice User => Post ID => Has voted
    mapping(address => mapping(uint256 => bool)) internal _votedOnPost;

    /// @notice User => Comment ID => Has voted
    mapping(address => mapping(uint256 => bool)) internal _votedOnComment;

    /// @notice User => Note ID => Has voted
    mapping(address => mapping(uint256 => bool)) internal _votedOnNote;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - CREATOR ECONOMY                       ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Creator => Pending balance (from tips)
    mapping(address => uint256) public creatorBalance;

    /// @notice Creator => Last activity timestamp
    mapping(address => uint256) public lastActivity;

    /// @notice Creator => Statistics
    mapping(address => CreatorStats) internal _creatorStats;

    /// @notice Creator => KYC data (cached from provider)
    mapping(address => KYCData) internal _kycCache;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - AUTHOR TRACKING                       ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Author => Post IDs
    mapping(address => uint256[]) internal _authorPosts;

    /// @notice Author => Comment IDs
    mapping(address => uint256[]) internal _authorComments;

    /// @notice Author => Note IDs
    mapping(address => uint256[]) internal _authorNotes;

    /// @notice Author => Last post timestamp (for cooldown)
    mapping(address => uint256) internal _lastPostTime;

    /// @notice Author => Last comment timestamp (for cooldown)
    mapping(address => uint256) internal _lastCommentTime;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE - STATISTICS                            ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Total platform fees collected
    uint256 public totalPlatformFees;

    /// @notice Total tips processed
    uint256 public totalTipsProcessed;

    /// @notice Total tips to creators
    uint256 public totalTipsToCreators;

    /// @notice Total tips to mining
    uint256 public totalTipsToMining;

    /// @notice Total ETH boost collected
    uint256 public totalBoostCollected;

    /// @notice Total burned from inactive accounts
    uint256 public totalBurnedInactive;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         STORAGE GAP                                     ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @notice Reserved for future upgrades
    uint256[50] private __gap;

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              EVENTS                                      ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    // --- Content Events ---
    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string content,
        string ipfsHash,
        uint256 timestamp
    );

    event PostEdited(
        uint256 indexed postId,
        address indexed author,
        string newContent,
        string newIpfsHash,
        uint256 timestamp
    );

    event PostDeleted(
        uint256 indexed postId,
        address indexed author,
        uint256 timestamp
    );

    event CommentCreated(
        uint256 indexed commentId,
        uint256 indexed postId,
        uint256 parentCommentId,
        address indexed author,
        uint256 timestamp
    );

    event CommentDeleted(
        uint256 indexed commentId,
        address indexed author,
        uint256 timestamp
    );

    // --- Moderation Events ---
    event ContentVoted(
        uint256 indexed contentId,
        bool isPost,
        address indexed voter,
        bool votedSafe,
        int256 newScore,
        ContentStatus newStatus,
        uint256 timestamp
    );

    event NoteProposed(
        uint256 indexed noteId,
        uint256 indexed postId,
        address indexed author,
        uint256 timestamp
    );

    event NoteVoted(
        uint256 indexed noteId,
        address indexed voter,
        bool believe,
        int256 newScore,
        NoteStatus newStatus,
        uint256 timestamp
    );

    // --- Tip Events ---
    event TipSent(
        address indexed sender,
        address indexed creator,
        uint256 indexed postId,
        uint256 totalAmount,
        uint256 toCreator,
        uint256 toMining,
        uint256 timestamp
    );

    event RewardsClaimed(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event InactiveBalanceBurned(
        address indexed creator,
        uint256 amount,
        address indexed burnedBy,
        uint256 timestamp
    );

    // --- Boost Events ---
    event PostBoosted(
        uint256 indexed postId,
        address indexed booster,
        uint256 amount,
        uint256 totalBoost,
        uint256 timestamp
    );

    // --- Message Events ---
    event PublicKeyRegistered(
        address indexed user,
        uint256 timestamp
    );

    event PrivateMessageSent(
        uint256 indexed messageId,
        uint256 indexed conversationId,
        address indexed sender,
        address recipient,
        uint256 timestamp
    );

    // --- KYC Events ---
    event KYCVerified(
        address indexed user,
        uint8 level,
        uint256 expiresAt,
        uint256 timestamp
    );

    event KYCRevoked(
        address indexed user,
        uint256 timestamp
    );

    // --- Config Events ---
    event ParameterUpdated(
        string indexed parameter,
        uint256 oldValue,
        uint256 newValue,
        uint256 timestamp
    );

    event AddressUpdated(
        string indexed parameter,
        address oldAddress,
        address newAddress,
        uint256 timestamp
    );

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              ERRORS                                      ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    error ZeroAddress();
    error ZeroAmount();
    error EmptyContent();
    error ContentTooLong();
    error PostNotFound();
    error CommentNotFound();
    error NoteNotFound();
    error MessageNotFound();
    error AlreadyVoted();
    error NotAuthor();
    error NotParticipant();
    error NoPublicKey();
    error CooldownActive();
    error NoBalance();
    error BoosterRequired();
    error KYCNotVerified();
    error KYCExpired();
    error AccountNotInactive();
    error InvalidConfiguration();
    error ExceedsLimit();
    error CannotTipSelf();
    error BelowMinimum();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              MODIFIERS                                   ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    modifier validPost(uint256 _postId) {
        if (!_posts[_postId].exists || _posts[_postId].deleted) revert PostNotFound();
        _;
    }

    modifier validComment(uint256 _commentId) {
        if (!_comments[_commentId].exists || _comments[_commentId].deleted) revert CommentNotFound();
        _;
    }

    modifier validNote(uint256 _noteId) {
        if (!_notes[_noteId].exists) revert NoteNotFound();
        _;
    }

    modifier validContent(string calldata _content, string calldata _ipfsHash) {
        if (bytes(_content).length == 0 && bytes(_ipfsHash).length == 0) revert EmptyContent();
        if (bytes(_content).length > maxContentLength) revert ContentTooLong();
        if (bytes(_ipfsHash).length > maxIpfsHashLength) revert ContentTooLong();
        _;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                           INITIALIZATION                                ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Backchat contract
     * @param _owner Contract owner
     * @param _ecosystemManager Ecosystem manager address
     */
    function initialize(
        address _owner,
        address _ecosystemManager
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _transferOwnership(_owner);

        // Ecosystem
        ecosystemManager = IEcosystemManager(_ecosystemManager);
        bkcToken = BKCToken(ecosystemManager.getBKCTokenAddress());
        treasury = ecosystemManager.getTreasuryAddress();

        // Core (adjustable)
        bipsDenominator = 10_000;
        serviceKey = keccak256("BACKCHAT_SERVICE");

        // Fees (adjustable)
        platformFee = 1 ether;                  // 1 BKC
        platformMiningFeeBips = 3000;           // 30% to mining
        platformTreasuryFeeBips = 7000;         // 70% to treasury
        minTipAmount = 1 ether;                 // 1 BKC minimum
        tipMiningFeeBips = 1000;                // 10% of tip to mining

        // Moderation thresholds (adjustable)
        thresholdTrusted = 10;                  // +10 for trusted
        thresholdWarning = 10;                  // -10 for warning
        thresholdHidden = 50;                   // -50 for hidden
        noteApprovalThreshold = 10;             // +10 to approve
        noteRejectionThreshold = 5;             // -5 to reject

        // Time (adjustable)
        inactivityBurnPeriod = 365 days;        // 1 year
        postCooldown = 0;                       // No cooldown by default
        commentCooldown = 0;                    // No cooldown by default

        // Limits (adjustable)
        maxPlatformFee = 10 ether;              // 10 BKC max
        maxTipMiningFeeBips = 5000;             // 50% max
        maxContentLength = 50_000;              // ~50KB
        maxIpfsHashLength = 100;                // IPFS CID
        minInactivityBurnPeriod = 30 days;      // 30 days min

        // KYC (adjustable)
        kycRequired = false;                    // Disabled by default
        kycMinimumLevel = 1;                    // Level 1 minimum
        kycValidityPeriod = 365 days;           // 1 year validity
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              POSTS                                       ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Creates a new public post
     * @param _content Text content
     * @param _ipfsHash IPFS hash for media
     * @return postId Created post ID
     */
    function createPost(
        string calldata _content,
        string calldata _ipfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validContent(_content, _ipfsHash)
        returns (uint256 postId) 
    {
        // Cooldown check
        if (postCooldown > 0 && block.timestamp < _lastPostTime[msg.sender] + postCooldown) {
            revert CooldownActive();
        }

        // Collect fee
        _collectPlatformFee();

        // Create post
        postId = ++_totalPosts;
        _posts[postId] = Post({
            id: postId,
            author: msg.sender,
            content: _content,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp,
            editedAt: 0,
            exists: true,
            deleted: false
        });

        // Track
        _authorPosts[msg.sender].push(postId);
        _lastPostTime[msg.sender] = block.timestamp;
        _creatorStats[msg.sender].totalPosts++;
        _updateActivity(msg.sender);

        emit PostCreated(postId, msg.sender, _content, _ipfsHash, block.timestamp);
    }

    /**
     * @notice Edits an existing post
     * @param _postId Post ID to edit
     * @param _newContent New content
     * @param _newIpfsHash New IPFS hash
     */
    function editPost(
        uint256 _postId,
        string calldata _newContent,
        string calldata _newIpfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validPost(_postId)
        validContent(_newContent, _newIpfsHash)
    {
        Post storage post = _posts[_postId];
        if (post.author != msg.sender) revert NotAuthor();

        post.content = _newContent;
        post.ipfsHash = _newIpfsHash;
        post.editedAt = block.timestamp;

        _updateActivity(msg.sender);

        emit PostEdited(_postId, msg.sender, _newContent, _newIpfsHash, block.timestamp);
    }

    /**
     * @notice Deletes a post (soft delete)
     * @param _postId Post ID to delete
     */
    function deletePost(uint256 _postId) 
        external 
        nonReentrant 
        validPost(_postId) 
    {
        Post storage post = _posts[_postId];
        if (post.author != msg.sender) revert NotAuthor();

        post.deleted = true;

        emit PostDeleted(_postId, msg.sender, block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              COMMENTS                                    ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Creates a comment on a post
     * @param _postId Post to comment on
     * @param _content Comment content
     * @param _ipfsHash IPFS hash
     * @return commentId Created comment ID
     */
    function createComment(
        uint256 _postId,
        string calldata _content,
        string calldata _ipfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validPost(_postId)
        validContent(_content, _ipfsHash)
        returns (uint256 commentId) 
    {
        // Cooldown check
        if (commentCooldown > 0 && block.timestamp < _lastCommentTime[msg.sender] + commentCooldown) {
            revert CooldownActive();
        }

        _collectPlatformFee();

        commentId = ++_totalComments;
        _comments[commentId] = Comment({
            id: commentId,
            postId: _postId,
            parentCommentId: 0,
            author: msg.sender,
            content: _content,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp,
            exists: true,
            deleted: false
        });

        _postComments[_postId].push(commentId);
        _authorComments[msg.sender].push(commentId);
        _lastCommentTime[msg.sender] = block.timestamp;
        _creatorStats[msg.sender].totalComments++;
        _updateActivity(msg.sender);

        emit CommentCreated(commentId, _postId, 0, msg.sender, block.timestamp);
    }

    /**
     * @notice Replies to a comment (threading)
     * @param _commentId Comment to reply to
     * @param _content Reply content
     * @param _ipfsHash IPFS hash
     * @return replyId Created reply ID
     */
    function replyToComment(
        uint256 _commentId,
        string calldata _content,
        string calldata _ipfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validComment(_commentId)
        validContent(_content, _ipfsHash)
        returns (uint256 replyId) 
    {
        if (commentCooldown > 0 && block.timestamp < _lastCommentTime[msg.sender] + commentCooldown) {
            revert CooldownActive();
        }

        _collectPlatformFee();

        Comment storage parent = _comments[_commentId];

        replyId = ++_totalComments;
        _comments[replyId] = Comment({
            id: replyId,
            postId: parent.postId,
            parentCommentId: _commentId,
            author: msg.sender,
            content: _content,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp,
            exists: true,
            deleted: false
        });

        _commentReplies[_commentId].push(replyId);
        _authorComments[msg.sender].push(replyId);
        _lastCommentTime[msg.sender] = block.timestamp;
        _creatorStats[msg.sender].totalComments++;
        _updateActivity(msg.sender);

        emit CommentCreated(replyId, parent.postId, _commentId, msg.sender, block.timestamp);
    }

    /**
     * @notice Deletes a comment (soft delete)
     * @param _commentId Comment to delete
     */
    function deleteComment(uint256 _commentId) 
        external 
        nonReentrant 
        validComment(_commentId) 
    {
        Comment storage comment = _comments[_commentId];
        if (comment.author != msg.sender) revert NotAuthor();

        comment.deleted = true;

        emit CommentDeleted(_commentId, msg.sender, block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         MODERATION (VOTING)                             ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Votes on a post (SAFE or UNSAFE)
     * @dev 1 person = 1 vote, determines content visibility
     * @param _postId Post to vote on
     * @param _voteSafe True = SAFE, False = UNSAFE
     */
    function voteOnPost(
        uint256 _postId,
        bool _voteSafe
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validPost(_postId) 
    {
        if (_votedOnPost[msg.sender][_postId]) revert AlreadyVoted();

        _collectPlatformFee();

        _votedOnPost[msg.sender][_postId] = true;

        ModerationScore storage score = _postScores[_postId];
        if (_voteSafe) {
            score.safeVotes++;
        } else {
            score.unsafeVotes++;
        }
        score.totalVoters++;

        int256 newScore = _calculateScore(score);
        ContentStatus newStatus = _determineContentStatus(newScore);

        _updateActivity(msg.sender);

        emit ContentVoted(
            _postId,
            true,
            msg.sender,
            _voteSafe,
            newScore,
            newStatus,
            block.timestamp
        );
    }

    /**
     * @notice Votes on a comment (SAFE or UNSAFE)
     * @param _commentId Comment to vote on
     * @param _voteSafe True = SAFE, False = UNSAFE
     */
    function voteOnComment(
        uint256 _commentId,
        bool _voteSafe
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validComment(_commentId) 
    {
        if (_votedOnComment[msg.sender][_commentId]) revert AlreadyVoted();

        _collectPlatformFee();

        _votedOnComment[msg.sender][_commentId] = true;

        ModerationScore storage score = _commentScores[_commentId];
        if (_voteSafe) {
            score.safeVotes++;
        } else {
            score.unsafeVotes++;
        }
        score.totalVoters++;

        int256 newScore = _calculateScore(score);
        ContentStatus newStatus = _determineContentStatus(newScore);

        _updateActivity(msg.sender);

        emit ContentVoted(
            _commentId,
            false,
            msg.sender,
            _voteSafe,
            newScore,
            newStatus,
            block.timestamp
        );
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         COMMUNITY NOTES                                 ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Proposes a community note on a post
     * @param _postId Post to annotate
     * @param _content Note content (fact-check, context, etc.)
     * @param _ipfsHash IPFS hash for evidence
     * @return noteId Created note ID
     */
    function proposeNote(
        uint256 _postId,
        string calldata _content,
        string calldata _ipfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validPost(_postId)
        returns (uint256 noteId) 
    {
        if (bytes(_content).length == 0) revert EmptyContent();
        if (bytes(_content).length > maxContentLength) revert ContentTooLong();

        _collectPlatformFee();

        noteId = ++_totalNotes;
        _notes[noteId] = CommunityNote({
            id: noteId,
            postId: _postId,
            author: msg.sender,
            content: _content,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp,
            exists: true
        });

        _postNotes[_postId].push(noteId);
        _authorNotes[msg.sender].push(noteId);
        _updateActivity(msg.sender);

        emit NoteProposed(noteId, _postId, msg.sender, block.timestamp);
    }

    /**
     * @notice Votes on a community note (BELIEVE or DON'T BELIEVE)
     * @param _noteId Note to vote on
     * @param _believe True = believe/helpful, False = don't believe
     */
    function voteOnNote(
        uint256 _noteId,
        bool _believe
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validNote(_noteId) 
    {
        if (_votedOnNote[msg.sender][_noteId]) revert AlreadyVoted();

        _collectPlatformFee();

        _votedOnNote[msg.sender][_noteId] = true;

        NoteVotingScore storage score = _noteScores[_noteId];
        if (_believe) {
            score.believeVotes++;
        } else {
            score.dontBelieveVotes++;
        }
        score.totalVoters++;

        int256 newScore = int256(score.believeVotes) - int256(score.dontBelieveVotes);
        NoteStatus newStatus = _determineNoteStatus(newScore);

        _updateActivity(msg.sender);

        emit NoteVoted(_noteId, msg.sender, _believe, newScore, newStatus, block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         TIPS (CREATOR ECONOMY)                          ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Sends a tip to a creator
     * @dev Tip is split: creator receives (100% - tipMiningFeeBips), mining receives tipMiningFeeBips
     * @param _creator Creator to tip
     * @param _amount Total tip amount in BKC
     * @param _postId Optional post ID (0 for general tip)
     *
     * Example with tipMiningFeeBips = 1000 (10%):
     * - Tip = 100 BKC
     * - Creator receives: 100 * (10000 - 1000) / 10000 = 90 BKC
     * - Mining receives:  100 * 1000 / 10000 = 10 BKC
     */
    function sendTip(
        address _creator,
        uint256 _amount,
        uint256 _postId
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (_creator == address(0)) revert ZeroAddress();
        if (_creator == msg.sender) revert CannotTipSelf();
        if (_amount < minTipAmount) revert BelowMinimum();

        // Validate post if specified
        if (_postId > 0 && !_posts[_postId].exists) revert PostNotFound();

        // Transfer from sender
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Calculate split
        uint256 toMining = (_amount * tipMiningFeeBips) / bipsDenominator;
        uint256 toCreator = _amount - toMining;

        // Send mining portion
        if (toMining > 0) {
            _sendToMining(toMining);
            totalTipsToMining += toMining;
        }

        // Credit creator
        creatorBalance[_creator] += toCreator;
        totalTipsToCreators += toCreator;

        // Stats
        totalTipsProcessed += _amount;
        _creatorStats[_creator].totalTipsReceived += toCreator;
        if (_postId > 0) {
            postTipsReceived[_postId] += _amount;
        }

        _updateActivity(msg.sender);
        _updateActivity(_creator);

        emit TipSent(
            msg.sender,
            _creator,
            _postId,
            _amount,
            toCreator,
            toMining,
            block.timestamp
        );
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         REWARD CLAIMS                                   ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Claims accumulated tip balance
     * @dev Requirements: positive balance, Booster NFT, KYC (if enabled)
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 balance = creatorBalance[msg.sender];
        if (balance == 0) revert NoBalance();

        // Check Booster NFT
        if (!_hasBoosterAccess(msg.sender)) revert BoosterRequired();

        // Check KYC
        if (kycRequired) {
            _verifyKYC(msg.sender);
        }

        // Clear and transfer
        creatorBalance[msg.sender] = 0;
        _creatorStats[msg.sender].totalTipsClaimed += balance;
        _updateActivity(msg.sender);

        bkcToken.safeTransfer(msg.sender, balance);

        emit RewardsClaimed(msg.sender, balance, block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         KYC SYSTEM                                      ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Verifies KYC from external provider and caches result
     * @param _user User to verify
     */
    function verifyKYC(address _user) external nonReentrant {
        if (kycProvider == address(0)) revert ZeroAddress();

        // Call external KYC provider
        (bool verified, uint8 level) = _fetchKYCFromProvider(_user);

        if (verified && level >= kycMinimumLevel) {
            uint256 expiresAt = kycValidityPeriod > 0 
                ? block.timestamp + kycValidityPeriod 
                : type(uint256).max;

            _kycCache[_user] = KYCData({
                verified: true,
                level: level,
                verifiedAt: block.timestamp,
                expiresAt: expiresAt
            });

            emit KYCVerified(_user, level, expiresAt, block.timestamp);
        }
    }

    /**
     * @notice Revokes KYC for a user (admin only)
     * @param _user User to revoke
     */
    function revokeKYC(address _user) external onlyOwner {
        delete _kycCache[_user];
        emit KYCRevoked(_user, block.timestamp);
    }

    /**
     * @notice Gets KYC status for a user
     * @param _user User address
     * @return verified Whether verified
     * @return level KYC level
     * @return expiresAt Expiration timestamp
     */
    function getKYCStatus(address _user) external view returns (
        bool verified,
        uint8 level,
        uint256 expiresAt
    ) {
        KYCData storage kyc = _kycCache[_user];
        if (!kyc.verified || (kyc.expiresAt > 0 && block.timestamp > kyc.expiresAt)) {
            return (false, 0, 0);
        }
        return (kyc.verified, kyc.level, kyc.expiresAt);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         POST BOOST                                      ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Boosts a post with ETH for visibility
     * @dev 100% of ETH goes to Treasury
     * @param _postId Post to boost
     */
    function boostPost(uint256 _postId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validPost(_postId) 
    {
        if (msg.value == 0) revert ZeroAmount();

        postBoostAmount[_postId] += msg.value;
        totalBoostCollected += msg.value;

        // Send to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        require(success);

        _updateActivity(msg.sender);

        emit PostBoosted(_postId, msg.sender, msg.value, postBoostAmount[_postId], block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         BURN INACTIVE                                   ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Burns balance of inactive account
     * @dev Anyone can call after inactivityBurnPeriod expires
     * @param _creator Inactive creator address
     */
    function burnInactiveBalance(address _creator) external nonReentrant {
        uint256 balance = creatorBalance[_creator];
        if (balance == 0) revert NoBalance();

        uint256 inactiveDuration = block.timestamp - lastActivity[_creator];
        if (inactiveDuration < inactivityBurnPeriod) revert AccountNotInactive();

        creatorBalance[_creator] = 0;
        totalBurnedInactive += balance;

        bkcToken.burn(balance);

        emit InactiveBalanceBurned(_creator, balance, msg.sender, block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         PRIVATE MESSAGES                                ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Registers public key for E2EE messaging
     * @param _publicKey User's public encryption key
     */
    function setPublicKey(bytes calldata _publicKey) external {
        _publicKeys[msg.sender] = _publicKey;
        _updateActivity(msg.sender);
        emit PublicKeyRegistered(msg.sender, block.timestamp);
    }

    /**
     * @notice Sends an encrypted private message
     * @param _to Recipient (must have public key registered)
     * @param _encryptedContent Encrypted content
     * @param _encryptedIpfsHash Encrypted IPFS hash
     * @return messageId Created message ID
     */
    function sendPrivateMessage(
        address _to,
        string calldata _encryptedContent,
        string calldata _encryptedIpfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 messageId) 
    {
        if (_to == address(0)) revert ZeroAddress();
        if (_to == msg.sender) revert CannotTipSelf();
        if (_publicKeys[_to].length == 0) revert NoPublicKey();
        if (bytes(_encryptedContent).length == 0) revert EmptyContent();

        _collectPlatformFee();

        uint256 conversationId = ++_totalConversations;
        messageId = ++_totalMessages;

        _messages[messageId] = PrivateMessage({
            id: messageId,
            conversationId: conversationId,
            parentMessageId: 0,
            sender: msg.sender,
            recipient: _to,
            encryptedContent: _encryptedContent,
            encryptedIpfsHash: _encryptedIpfsHash,
            sentAt: block.timestamp,
            exists: true
        });

        _conversationMessages[conversationId].push(messageId);
        _userConversations[msg.sender].push(conversationId);
        _userConversations[_to].push(conversationId);
        _updateActivity(msg.sender);

        emit PrivateMessageSent(messageId, conversationId, msg.sender, _to, block.timestamp);
    }

    /**
     * @notice Replies to a private message
     * @param _messageId Message to reply to
     * @param _encryptedContent Encrypted reply
     * @param _encryptedIpfsHash Encrypted IPFS hash
     * @return replyId Created reply ID
     */
    function replyToMessage(
        uint256 _messageId,
        string calldata _encryptedContent,
        string calldata _encryptedIpfsHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 replyId) 
    {
        PrivateMessage storage parent = _messages[_messageId];
        if (!parent.exists) revert MessageNotFound();
        if (msg.sender != parent.sender && msg.sender != parent.recipient) revert NotParticipant();
        if (bytes(_encryptedContent).length == 0) revert EmptyContent();

        _collectPlatformFee();

        address recipient = msg.sender == parent.sender ? parent.recipient : parent.sender;

        replyId = ++_totalMessages;
        _messages[replyId] = PrivateMessage({
            id: replyId,
            conversationId: parent.conversationId,
            parentMessageId: _messageId,
            sender: msg.sender,
            recipient: recipient,
            encryptedContent: _encryptedContent,
            encryptedIpfsHash: _encryptedIpfsHash,
            sentAt: block.timestamp,
            exists: true
        });

        _conversationMessages[parent.conversationId].push(replyId);
        _updateActivity(msg.sender);

        emit PrivateMessageSent(replyId, parent.conversationId, msg.sender, recipient, block.timestamp);
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADMIN - FEES                                    ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function setPlatformFee(uint256 _fee) external onlyOwner {
        if (_fee > maxPlatformFee) revert ExceedsLimit();
        emit ParameterUpdated("platformFee", platformFee, _fee, block.timestamp);
        platformFee = _fee;
    }

    function setPlatformFeeDistribution(uint256 _miningBips, uint256 _treasuryBips) external onlyOwner {
        if (_miningBips + _treasuryBips != bipsDenominator) revert InvalidConfiguration();
        platformMiningFeeBips = _miningBips;
        platformTreasuryFeeBips = _treasuryBips;
    }

    function setMinTipAmount(uint256 _amount) external onlyOwner {
        emit ParameterUpdated("minTipAmount", minTipAmount, _amount, block.timestamp);
        minTipAmount = _amount;
    }

    function setTipMiningFeeBips(uint256 _bips) external onlyOwner {
        if (_bips > maxTipMiningFeeBips) revert ExceedsLimit();
        emit ParameterUpdated("tipMiningFeeBips", tipMiningFeeBips, _bips, block.timestamp);
        tipMiningFeeBips = _bips;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADMIN - MODERATION                              ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function setModerationThresholds(
        uint256 _trusted,
        uint256 _warning,
        uint256 _hidden
    ) external onlyOwner {
        if (_warning > _hidden) revert InvalidConfiguration();
        thresholdTrusted = _trusted;
        thresholdWarning = _warning;
        thresholdHidden = _hidden;
    }

    function setNoteThresholds(uint256 _approval, uint256 _rejection) external onlyOwner {
        noteApprovalThreshold = _approval;
        noteRejectionThreshold = _rejection;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADMIN - TIMING                                  ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function setInactivityBurnPeriod(uint256 _period) external onlyOwner {
        if (_period < minInactivityBurnPeriod) revert BelowMinimum();
        emit ParameterUpdated("inactivityBurnPeriod", inactivityBurnPeriod, _period, block.timestamp);
        inactivityBurnPeriod = _period;
    }

    function setCooldowns(uint256 _postCooldown, uint256 _commentCooldown) external onlyOwner {
        postCooldown = _postCooldown;
        commentCooldown = _commentCooldown;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADMIN - LIMITS                                  ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function setLimits(
        uint256 _maxPlatformFee,
        uint256 _maxTipMiningFeeBips,
        uint256 _maxContentLength,
        uint256 _minInactivityBurnPeriod
    ) external onlyOwner {
        if (_maxTipMiningFeeBips > bipsDenominator) revert ExceedsLimit();
        if (_minInactivityBurnPeriod < 7 days) revert BelowMinimum();
        
        maxPlatformFee = _maxPlatformFee;
        maxTipMiningFeeBips = _maxTipMiningFeeBips;
        maxContentLength = _maxContentLength;
        minInactivityBurnPeriod = _minInactivityBurnPeriod;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADMIN - KYC                                     ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function setKYCConfig(
        bool _required,
        address _provider,
        uint8 _minimumLevel,
        uint256 _validityPeriod
    ) external onlyOwner {
        kycRequired = _required;
        kycProvider = _provider;
        kycMinimumLevel = _minimumLevel;
        kycValidityPeriod = _validityPeriod;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         ADMIN - CORE                                    ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function setBipsDenominator(uint256 _denominator) external onlyOwner {
        if (_denominator == 0) revert ZeroAmount();
        emit ParameterUpdated("bipsDenominator", bipsDenominator, _denominator, block.timestamp);
        bipsDenominator = _denominator;
    }

    function setServiceKey(bytes32 _key) external onlyOwner {
        serviceKey = _key;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        emit AddressUpdated("treasury", treasury, _treasury, block.timestamp);
        treasury = _treasury;
    }

    function setEcosystemManager(address _manager) external onlyOwner {
        if (_manager == address(0)) revert ZeroAddress();
        ecosystemManager = IEcosystemManager(_manager);
    }

    function refreshFromEcosystem() external onlyOwner {
        bkcToken = BKCToken(ecosystemManager.getBKCTokenAddress());
        treasury = ecosystemManager.getTreasuryAddress();
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         VIEW FUNCTIONS                                  ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function getPost(uint256 _postId) external view returns (Post memory) {
        return _posts[_postId];
    }

    function getPostModerationScore(uint256 _postId) external view returns (
        uint256 safeVotes,
        uint256 unsafeVotes,
        int256 score,
        ContentStatus status
    ) {
        ModerationScore storage s = _postScores[_postId];
        int256 netScore = _calculateScore(s);
        return (s.safeVotes, s.unsafeVotes, netScore, _determineContentStatus(netScore));
    }

    function getComment(uint256 _commentId) external view returns (Comment memory) {
        return _comments[_commentId];
    }

    function getCommentModerationScore(uint256 _commentId) external view returns (
        uint256 safeVotes,
        uint256 unsafeVotes,
        int256 score,
        ContentStatus status
    ) {
        ModerationScore storage s = _commentScores[_commentId];
        int256 netScore = _calculateScore(s);
        return (s.safeVotes, s.unsafeVotes, netScore, _determineContentStatus(netScore));
    }

    function getNote(uint256 _noteId) external view returns (CommunityNote memory) {
        return _notes[_noteId];
    }

    function getNoteVotingScore(uint256 _noteId) external view returns (
        uint256 believeVotes,
        uint256 dontBelieveVotes,
        int256 score,
        NoteStatus status
    ) {
        NoteVotingScore storage s = _noteScores[_noteId];
        int256 netScore = int256(s.believeVotes) - int256(s.dontBelieveVotes);
        return (s.believeVotes, s.dontBelieveVotes, netScore, _determineNoteStatus(netScore));
    }

    function getPostComments(uint256 _postId) external view returns (uint256[] memory) {
        return _postComments[_postId];
    }

    function getPostNotes(uint256 _postId) external view returns (uint256[] memory) {
        return _postNotes[_postId];
    }

    function getCommentReplies(uint256 _commentId) external view returns (uint256[] memory) {
        return _commentReplies[_commentId];
    }

    function getCreatorStats(address _creator) external view returns (CreatorStats memory) {
        return _creatorStats[_creator];
    }

    function getAuthorPosts(address _author) external view returns (uint256[] memory) {
        return _authorPosts[_author];
    }

    function getPublicKey(address _user) external view returns (bytes memory) {
        return _publicKeys[_user];
    }

    function getUserConversations(address _user) external view returns (uint256[] memory) {
        return _userConversations[_user];
    }

    function getConversationMessages(uint256 _conversationId) external view returns (uint256[] memory) {
        return _conversationMessages[_conversationId];
    }

    function getMessage(uint256 _messageId) external view returns (
        address sender,
        address recipient,
        string memory encryptedContent,
        string memory encryptedIpfsHash,
        uint256 sentAt,
        uint256 conversationId,
        uint256 parentMessageId
    ) {
        PrivateMessage storage m = _messages[_messageId];
        return (
            m.sender,
            m.recipient,
            m.encryptedContent,
            m.encryptedIpfsHash,
            m.sentAt,
            m.conversationId,
            m.parentMessageId
        );
    }

    function hasVotedOnPost(address _user, uint256 _postId) external view returns (bool) {
        return _votedOnPost[_user][_postId];
    }

    function hasVotedOnComment(address _user, uint256 _commentId) external view returns (bool) {
        return _votedOnComment[_user][_commentId];
    }

    function hasVotedOnNote(address _user, uint256 _noteId) external view returns (bool) {
        return _votedOnNote[_user][_noteId];
    }

    function hasBoosterAccess(address _user) external view returns (bool) {
        return _hasBoosterAccess(_user);
    }

    function getTotals() external view returns (
        uint256 posts,
        uint256 comments,
        uint256 notes,
        uint256 messages,
        uint256 conversations
    ) {
        return (_totalPosts, _totalComments, _totalNotes, _totalMessages, _totalConversations);
    }

    function getFinancialStats() external view returns (
        uint256 platformFees,
        uint256 tipsProcessed,
        uint256 tipsToCreators,
        uint256 tipsToMining,
        uint256 boostCollected,
        uint256 burnedInactive
    ) {
        return (
            totalPlatformFees,
            totalTipsProcessed,
            totalTipsToCreators,
            totalTipsToMining,
            totalBoostCollected,
            totalBurnedInactive
        );
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         INTERNAL FUNCTIONS                              ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function _collectPlatformFee() internal {
        if (platformFee == 0) return;

        bkcToken.safeTransferFrom(msg.sender, address(this), platformFee);

        uint256 toMining = (platformFee * platformMiningFeeBips) / bipsDenominator;
        uint256 toTreasury = platformFee - toMining;

        if (toMining > 0) _sendToMining(toMining);
        if (toTreasury > 0 && treasury != address(0)) {
            bkcToken.safeTransfer(treasury, toTreasury);
        }

        totalPlatformFees += platformFee;
    }

    function _sendToMining(uint256 _amount) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager != address(0) && _amount > 0) {
            bkcToken.safeTransfer(miningManager, _amount);
            try IMiningManager(miningManager).performPurchaseMining(serviceKey, _amount) {} catch {}
        }
    }

    function _updateActivity(address _user) internal {
        lastActivity[_user] = block.timestamp;
    }

    function _hasBoosterAccess(address _user) internal view returns (bool) {
        address booster = ecosystemManager.getBoosterAddress();
        if (booster != address(0)) {
            try IRewardBoosterNFT(booster).hasBooster(_user) returns (bool has) {
                if (has) return true;
            } catch {}
        }
        return false;
    }

    function _verifyKYC(address _user) internal view {
        KYCData storage kyc = _kycCache[_user];
        if (!kyc.verified) revert KYCNotVerified();
        if (kyc.expiresAt > 0 && block.timestamp > kyc.expiresAt) revert KYCExpired();
        if (kyc.level < kycMinimumLevel) revert KYCNotVerified();
    }

    function _fetchKYCFromProvider(address _user) internal view returns (bool verified, uint8 level) {
        if (kycProvider == address(0)) return (false, 0);

        // Try getKYCLevel first
        try IKYCProvider(kycProvider).getKYCLevel(_user) returns (uint8 _level) {
            return (_level >= kycMinimumLevel, _level);
        } catch {}

        // Fallback to isVerified
        try IKYCProvider(kycProvider).isVerified(_user) returns (bool _verified) {
            return (_verified, _verified ? 1 : 0);
        } catch {}

        return (false, 0);
    }

    function _calculateScore(ModerationScore storage _score) internal view returns (int256) {
        return int256(_score.safeVotes) - int256(_score.unsafeVotes);
    }

    function _determineContentStatus(int256 _score) internal view returns (ContentStatus) {
        if (_score >= int256(thresholdTrusted)) return ContentStatus.Trusted;
        if (_score <= -int256(thresholdHidden)) return ContentStatus.Hidden;
        if (_score <= -int256(thresholdWarning)) return ContentStatus.Warning;
        return ContentStatus.Normal;
    }

    function _determineNoteStatus(int256 _score) internal view returns (NoteStatus) {
        if (_score >= int256(noteApprovalThreshold)) return NoteStatus.Approved;
        if (_score <= -int256(noteRejectionThreshold)) return NoteStatus.Rejected;
        return NoteStatus.Pending;
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                         EMERGENCY                                       ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    function recoverTokens(address _token, address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        if (_token == address(0)) {
            (bool success, ) = _to.call{value: _amount}("");
            require(success);
        } else {
            IERC20Upgradeable(_token).safeTransfer(_to, _amount);
        }
    }

    receive() external payable {}
}

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                         KYC INTERFACE                                       ║
// ╚════════════════════════════════════════════════════════════════════════════╝

interface IKYCProvider {
    function isVerified(address user) external view returns (bool);
    function getKYCLevel(address user) external view returns (uint8);
}
