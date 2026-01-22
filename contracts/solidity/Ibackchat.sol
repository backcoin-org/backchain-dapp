// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IBackchat
 * @author Backchain Protocol
 * @notice Interface for the Backchat decentralized social network
 * @dev Defines public functions for ecosystem integration
 *
 *      +===================================================================+
 *      |                    BACKCHAT PHILOSOPHY                            |
 *      +===================================================================+
 *      |                                                                   |
 *      |   - 1 PERSON = 1 VOTE (no weight by NFT or balance)               |
 *      |   - NFT serves ONLY to withdraw tips                              |
 *      |   - COMMUNITY moderates, not administrators                       |
 *      |   - COMMUNITY NOTES with scoring system                           |
 *      |   - AUTOMATIC MODERATION based on collective scoring              |
 *      |   - SINGLE FEE to use the platform (creator receives nothing)     |
 *      |   - FLEXIBLE TIPPING to reward creators (min, no max)             |
 *      |                                                                   |
 *      +===================================================================+
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
interface IBackchat {
    // =========================================================================
    //                              ENUMS
    // =========================================================================

    /// @notice Status of a post or comment based on community voting
    enum ContentStatus {
        Neutral,      // Score between thresholds
        Trusted,      // Score >= trustedThreshold
        Warning,      // Score <= -warningThreshold
        Hidden        // Score <= -hiddenThreshold
    }

    /// @notice Status of a community note
    enum NoteStatus {
        Pending,      // Score between 0 and approvalThreshold
        Approved,     // Score >= approvalThreshold
        Rejected      // Score < 0
    }

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /// @notice Public post structure
    struct Post {
        uint256 id;
        address author;
        string content;
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    /// @notice Comment structure (supports threading)
    struct Comment {
        uint256 id;
        uint256 postId;
        uint256 parentCommentId;  // 0 = direct reply to post
        address author;
        string content;
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    /// @notice Community note structure
    struct CommunityNote {
        uint256 id;
        uint256 postId;
        address author;
        string content;
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    /// @notice Private message structure (E2EE)
    struct PrivateMessage {
        uint256 id;
        uint256 conversationId;
        uint256 parentMessageId;  // 0 = initial message
        address sender;
        address recipient;
        string encryptedContent;
        string encryptedIpfsHash;
        uint256 timestamp;
        bool exists;
    }

    /// @notice Content score structure
    struct ContentScore {
        uint256 safeVotes;
        uint256 unsafeVotes;
        uint256 totalVoters;
    }

    /// @notice Note score structure
    struct NoteScore {
        uint256 believeVotes;
        uint256 dontBelieveVotes;
        uint256 totalVoters;
    }

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    // --- Posts ---
    event PublicMessagePosted(
        uint256 indexed postId,
        address indexed author,
        string content,
        string ipfsHash,
        uint256 feePaid,
        uint256 timestamp
    );

    // --- Comments ---
    event CommentPosted(
        uint256 indexed commentId,
        uint256 indexed postId,
        uint256 parentCommentId,
        address indexed author,
        string content,
        string ipfsHash,
        uint256 feePaid,
        uint256 timestamp
    );

    // --- Private Messages ---
    event PrivateMessagePosted(
        uint256 indexed messageId,
        uint256 indexed conversationId,
        address indexed sender,
        address recipient,
        uint256 feePaid,
        uint256 timestamp
    );

    event PrivateMessageReplied(
        uint256 indexed messageId,
        uint256 indexed conversationId,
        uint256 parentMessageId,
        address indexed sender,
        uint256 feePaid,
        uint256 timestamp
    );

    event PublicKeyRegistered(
        address indexed user,
        bytes publicKey,
        uint256 timestamp
    );

    // --- Voting ---
    event PostVoted(
        uint256 indexed postId,
        address indexed voter,
        bool isSafe,
        int256 newScore,
        uint256 feePaid,
        uint256 timestamp
    );

    event CommentVoted(
        uint256 indexed commentId,
        address indexed voter,
        bool isSafe,
        int256 newScore,
        uint256 feePaid,
        uint256 timestamp
    );

    // --- Community Notes ---
    event NoteProposed(
        uint256 indexed noteId,
        uint256 indexed postId,
        address indexed author,
        string content,
        string ipfsHash,
        uint256 feePaid,
        uint256 timestamp
    );

    event NoteVoted(
        uint256 indexed noteId,
        address indexed voter,
        bool believe,
        int256 newScore,
        uint256 feePaid,
        uint256 timestamp
    );

    // --- Tips & Rewards ---
    event TipSent(
        address indexed sender,
        address indexed creator,
        uint256 totalAmount,
        uint256 miningFee,
        uint256 creatorAmount,
        uint256 timestamp
    );

    event RewardClaimed(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event BalanceBurned(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    // --- Boost ---
    event PostBoosted(
        uint256 indexed postId,
        address indexed booster,
        uint256 ethAmount,
        uint256 timestamp
    );

    // =========================================================================
    //                         PUBLIC FUNCTIONS
    // =========================================================================

    // --- Posts ---
    function postPublicMessage(
        string calldata _content,
        string calldata _ipfsHash
    ) external returns (uint256 postId);

    // --- Comments ---
    function commentOnPost(
        uint256 _postId,
        string calldata _content,
        string calldata _ipfsHash
    ) external returns (uint256 commentId);

    function replyToComment(
        uint256 _commentId,
        string calldata _content,
        string calldata _ipfsHash
    ) external returns (uint256 replyId);

    // --- Private Messages ---
    function setPublicKey(bytes calldata _publicKey) external;

    function postPrivateMessage(
        address _to,
        string calldata _encryptedContent,
        string calldata _encryptedIpfsHash
    ) external returns (uint256 messageId);

    function replyToPrivateMessage(
        uint256 _messageId,
        string calldata _encryptedContent,
        string calldata _encryptedIpfsHash
    ) external returns (uint256 replyId);

    // --- Voting ---
    function voteOnPost(uint256 _postId, bool _isSafe) external;
    function voteOnComment(uint256 _commentId, bool _isSafe) external;

    // --- Community Notes ---
    function proposeNote(
        uint256 _postId,
        string calldata _content,
        string calldata _ipfsHash
    ) external returns (uint256 noteId);

    function voteOnNote(uint256 _noteId, bool _believe) external;

    // --- Tips ---
    function sendTip(address _creator, uint256 _amount) external;

    // --- Rewards ---
    function claimRewards() external;

    // --- Boost ---
    function boostPost(uint256 _postId) external payable;

    // --- Burn Inactive ---
    function burnInactiveBalance(address _creator) external;

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    // --- Posts ---
    function getPost(uint256 _postId) external view returns (Post memory);
    function getPostScore(uint256 _postId) external view returns (ContentScore memory);
    function getPostStatus(uint256 _postId) external view returns (ContentStatus);
    function getTotalPosts() external view returns (uint256);

    // --- Comments ---
    function getComment(uint256 _commentId) external view returns (Comment memory);
    function getCommentScore(uint256 _commentId) external view returns (ContentScore memory);
    function getCommentStatus(uint256 _commentId) external view returns (ContentStatus);
    function getPostComments(uint256 _postId) external view returns (uint256[] memory);
    function getCommentReplies(uint256 _commentId) external view returns (uint256[] memory);

    // --- Private Messages ---
    function getPublicKey(address _user) external view returns (bytes memory);
    function getConversation(uint256 _conversationId) external view returns (uint256[] memory messageIds);
    function getUserConversations(address _user) external view returns (uint256[] memory conversationIds);

    // --- Notes ---
    function getNote(uint256 _noteId) external view returns (CommunityNote memory);
    function getNoteScore(uint256 _noteId) external view returns (NoteScore memory);
    function getNoteStatus(uint256 _noteId) external view returns (NoteStatus);
    function getPostNotes(uint256 _postId) external view returns (uint256[] memory);

    // --- Creator Balances ---
    function getCreatorBalance(address _creator) external view returns (uint256);
    function getLastActivity(address _creator) external view returns (uint256);

    // --- Fee Configuration ---
    function getPlatformFee() external view returns (uint256);
    function getMinTipAmount() external view returns (uint256);
    function getTipMiningFeeBips() external view returns (uint256);

    // --- Thresholds ---
    function getVisibilityThresholds() external view returns (
        uint256 trusted,
        uint256 warning,
        uint256 hidden
    );
    function getNoteApprovalThreshold() external view returns (uint256);

    // --- User Checks ---
    function hasVotedOnPost(address _user, uint256 _postId) external view returns (bool);
    function hasVotedOnComment(address _user, uint256 _commentId) external view returns (bool);
    function hasVotedOnNote(address _user, uint256 _noteId) external view returns (bool);
    function hasBoosterAccess(address _user) external view returns (bool);
}
