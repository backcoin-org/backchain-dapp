// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// CHARITY POOL — IMMUTABLE (Tier 1: ETH only)
// ============================================================================
//
// Permissionless fundraising campaigns. Anyone can create, anyone can donate.
//
// Lifecycle:
//   CREATE  → campaign is active, accepting donations
//   DONATE  → ETH flows in, small fee to ecosystem, net stored for creator
//   CLOSE   → creator ends campaign early (can still withdraw raised funds)
//   WITHDRAW→ creator claims all raised ETH after campaign ends
//
// Economics:
//   - Value-based ETH fee on donations → ecosystem (operator/treasury/buyback)
//   - Small ETH fee on creation (spam prevention) → ecosystem
//   - Creator receives 100% of raised ETH (no penalty, no minimum goal)
//   - Pure donation model: no refunds, no all-or-nothing
//
// Security:
//   - Funds stored in contract until withdrawal (pull pattern)
//   - Only creator can withdraw their campaign
//   - CEI on all ETH transfers
//   - No admin. No pause. Fully immutable.
//
// ============================================================================

contract CharityPool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID      = keccak256("CHARITY");
    bytes32 public constant ACTION_CREATE  = keccak256("CHARITY_CREATE");
    bytes32 public constant ACTION_DONATE  = keccak256("CHARITY_DONATE");
    bytes32 public constant ACTION_BOOST   = keccak256("CHARITY_BOOST");

    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 365 days;
    uint256 public constant BOOST_DURATION = 24 hours;

    // Status
    uint8 private constant S_ACTIVE    = 0;
    uint8 private constant S_CLOSED    = 1;
    uint8 private constant S_WITHDRAWN = 2;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Campaign data — 2 packed slots + dynamic strings
    ///      Slot 1: owner(20) + deadline(6) + status(1) = 27 bytes
    ///      Slot 2: raised(12) + goal(12) + donorCount(4) + boostExpiry(6) = 34... too much
    ///      Actually: raised(12) + goal(12) + donorCount(4) = 28 bytes
    ///      Slot 3: boostExpiry(6) — or pack into slot 1 spare bytes
    struct Campaign {
        // Slot 1 (27 bytes)
        address owner;
        uint48  deadline;
        uint8   status;
        // Slot 2 (28 bytes)
        uint96  raised;
        uint96  goal;
        uint32  donorCount;
        // Slot 3 (6 bytes + padding)
        uint48  boostExpiry;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => string)   public titles;
    mapping(uint256 => string)   public metadataUris;

    uint256 public campaignCount;

    // Stats
    uint256 public totalDonated;
    uint256 public totalWithdrawn;
    uint256 public totalEthFees;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event CampaignCreated(
        uint256 indexed campaignId, address indexed owner,
        uint96 goal, uint48 deadline, address operator
    );
    event DonationMade(
        uint256 indexed campaignId, address indexed donor,
        uint256 grossAmount, uint256 netAmount, address operator
    );
    event CampaignBoosted(
        uint256 indexed campaignId, address indexed booster,
        uint48 boostExpiry, address operator
    );
    event CampaignClosed(
        uint256 indexed campaignId, address indexed owner, uint96 raised
    );
    event FundsWithdrawn(
        uint256 indexed campaignId, address indexed owner, uint96 amount
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error ZeroAmount();
    error InvalidGoal();
    error InvalidDuration();
    error EmptyTitle();
    error CampaignNotActive();
    error CampaignStillActive();
    error NotCampaignOwner();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error InsufficientFee();
    error TransferFailed();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem) {
        ecosystem = IBackchainEcosystem(_ecosystem);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CREATE CAMPAIGN
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Create a fundraising campaign. Pays small ETH fee (spam prevention).
    ///
    /// @param title        Campaign title (stored on-chain)
    /// @param metadataUri  IPFS URI with full description, images, etc.
    /// @param goal         ETH goal in wei (informational, no enforcement)
    /// @param durationDays Campaign duration in days (1-365)
    /// @param operator     Frontend operator
    /// @return campaignId  Assigned campaign ID
    function createCampaign(
        string calldata title,
        string calldata metadataUri,
        uint96 goal,
        uint256 durationDays,
        address operator
    ) external payable returns (uint256 campaignId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (goal == 0) revert InvalidGoal();

        uint256 duration = durationDays * 1 days;
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();

        // ETH fee for creation → ecosystem
        uint256 fee = ecosystem.calculateFee(ACTION_CREATE, 0);
        if (msg.value < fee) revert InsufficientFee();

        campaignId = ++campaignCount;

        campaigns[campaignId] = Campaign({
            owner: msg.sender,
            deadline: uint48(block.timestamp + duration),
            status: S_ACTIVE,
            raised: 0,
            goal: goal,
            donorCount: 0,
            boostExpiry: 0
        });

        titles[campaignId] = title;
        if (bytes(metadataUri).length > 0) {
            metadataUris[campaignId] = metadataUri;
        }

        // Send fee to ecosystem
        if (msg.value > 0) {
            totalEthFees += msg.value;
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit CampaignCreated(campaignId, msg.sender, goal, uint48(block.timestamp + duration), operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DONATE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Donate ETH to a campaign. Value-based fee to ecosystem.
    ///         Net donation is stored for the campaign creator to withdraw.
    ///
    /// @param campaignId Campaign to donate to
    /// @param operator   Frontend operator
    function donate(uint256 campaignId, address operator) external payable {
        Campaign storage c = campaigns[campaignId];
        if (c.status != S_ACTIVE) revert CampaignNotActive();
        if (block.timestamp > c.deadline) revert CampaignNotActive();
        if (msg.value == 0) revert ZeroAmount();

        // Value-based fee on donation amount
        uint256 fee = ecosystem.calculateFee(ACTION_DONATE, msg.value);
        uint256 netDonation = msg.value - fee;

        // Store net donation for creator
        c.raised += uint96(netDonation);
        c.donorCount++;

        totalDonated += netDonation;
        totalEthFees += fee;

        // Fee → ecosystem (creator is customRecipient for their share)
        if (fee > 0) {
            ecosystem.collectFee{value: fee}(
                msg.sender, operator, c.owner, MODULE_ID, 0
            );
        }

        emit DonationMade(campaignId, msg.sender, msg.value, netDonation, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // BOOST
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Boost a campaign's visibility for 24 hours.
    ///         Anyone can boost any active campaign. ETH fee to ecosystem.
    ///
    /// @param campaignId Campaign to boost
    /// @param operator   Frontend operator
    function boostCampaign(uint256 campaignId, address operator) external payable {
        Campaign storage c = campaigns[campaignId];
        if (c.status != S_ACTIVE) revert CampaignNotActive();
        if (block.timestamp > c.deadline) revert CampaignNotActive();

        uint256 fee = ecosystem.calculateFee(ACTION_BOOST, 0);
        if (msg.value < fee) revert InsufficientFee();

        c.boostExpiry = uint48(block.timestamp + BOOST_DURATION);

        totalEthFees += msg.value;
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, c.owner, MODULE_ID, 0
        );

        emit CampaignBoosted(campaignId, msg.sender, c.boostExpiry, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLOSE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Close a campaign early. Creator can still withdraw raised funds.
    function closeCampaign(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        if (c.owner != msg.sender) revert NotCampaignOwner();
        if (c.status != S_ACTIVE) revert CampaignNotActive();

        c.status = S_CLOSED;
        emit CampaignClosed(campaignId, msg.sender, c.raised);
    }

    // ════════════════════════════════════════════════════════════════════════
    // WITHDRAW
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Withdraw raised ETH. Available after deadline or close.
    ///         Creator receives 100% of raised amount. No penalties.
    function withdraw(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        if (c.owner != msg.sender) revert NotCampaignOwner();
        if (c.status == S_WITHDRAWN) revert AlreadyWithdrawn();

        // Must be closed or past deadline
        if (c.status == S_ACTIVE && block.timestamp <= c.deadline)
            revert CampaignStillActive();

        uint96 amount = c.raised;
        if (amount == 0) revert NothingToWithdraw();

        // Auto-close if still active (deadline passed)
        if (c.status == S_ACTIVE) {
            c.status = S_CLOSED;
        }

        // ── EFFECTS (CEI) ──
        c.status = S_WITHDRAWN;
        c.raised = 0;
        totalWithdrawn += amount;

        // ── INTERACTION ──
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit FundsWithdrawn(campaignId, msg.sender, amount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Full campaign data
    function getCampaign(uint256 campaignId) external view returns (
        address owner,
        uint48  deadline,
        uint8   status,
        uint96  raised,
        uint96  goal,
        uint32  donorCount,
        bool    isBoosted,
        string  memory title,
        string  memory metadataUri
    ) {
        Campaign memory c = campaigns[campaignId];
        return (
            c.owner, c.deadline, c.status,
            c.raised, c.goal, c.donorCount,
            block.timestamp < c.boostExpiry,
            titles[campaignId],
            metadataUris[campaignId]
        );
    }

    /// @notice Check if creator can withdraw
    function canWithdraw(uint256 campaignId) external view returns (bool) {
        Campaign memory c = campaigns[campaignId];
        if (c.status == S_WITHDRAWN) return false;
        if (c.raised == 0) return false;
        if (c.status == S_CLOSED) return true;
        return block.timestamp > c.deadline;
    }

    /// @notice Preview fee split for a donation amount
    function previewDonation(uint256 amount) external view returns (
        uint256 fee, uint256 netToCampaign
    ) {
        fee = ecosystem.calculateFee(ACTION_DONATE, amount);
        netToCampaign = amount - fee;
    }

    /// @notice Protocol statistics
    function getStats() external view returns (
        uint256 _campaignCount,
        uint256 _totalDonated,
        uint256 _totalWithdrawn,
        uint256 _totalEthFees
    ) {
        return (campaignCount, totalDonated, totalWithdrawn, totalEthFees);
    }

    /// @notice Contract version
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
