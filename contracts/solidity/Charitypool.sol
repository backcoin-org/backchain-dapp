// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *              ██████╗██╗  ██╗ █████╗ ██████╗ ██╗████████╗██╗   ██╗
 *             ██╔════╝██║  ██║██╔══██╗██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝
 *             ██║     ███████║███████║██████╔╝██║   ██║    ╚████╔╝
 *             ██║     ██╔══██║██╔══██║██╔══██╗██║   ██║     ╚██╔╝
 *             ╚██████╗██║  ██║██║  ██║██║  ██║██║   ██║      ██║
 *              ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝
 *
 *                  P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : CharityPool
 *  Version     : 6.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchain
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn a percentage of ALL fees (BKC + ETH) generated
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 * ============================================================================
 *
 *  PURPOSE
 *
 *  Transparent charitable fundraising on blockchain.
 *
 *  Use Cases (examples, not exhaustive):
 *  - Animal welfare and rescue campaigns
 *  - Humanitarian aid and disaster relief
 *  - Medical expenses and treatments
 *  - Educational support and scholarships
 *  - Environmental and social causes
 *
 *  Key Characteristic: DONATIONS (no financial return expected)
 *
 * ============================================================================
 *
 *  FEE STRUCTURE (configurable by governance)
 *
 *  +-------------+------------------+----------------------------------------+
 *  | Action      | Default Fee      | Destination                            |
 *  +-------------+------------------+----------------------------------------+
 *  | Create      | 1 BKC            | MiningManager                          |
 *  | Donate      | 5% ETH           | MiningManager (Operator + Treasury)    |
 *  | Boost       | 0.5 BKC + ETH    | MiningManager                          |
 *  | Withdraw    | 0.5 BKC          | MiningManager                          |
 *  +-------------+------------------+----------------------------------------+
 *
 *  NO PENALTIES - Creator receives 100% of raised ETH regardless of goal
 *
 * ============================================================================
 *
 *  FEE DISTRIBUTION
 *
 *  BKC Flow (Create, Withdraw, Boost):
 *  +------------------------------------------------------------------+
 *  |                      BKC FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |      +----------------------+----------------------+             |
 *  |      |          |           |                      |             |
 *  |      v          v           v                      v             |
 *  |  OPERATOR     BURN      TREASURY             DELEGATORS          |
 *  |  (config%)  (config%)   (config%)             (config%)          |
 *  +------------------------------------------------------------------+
 *
 *  ETH Flow (Donations, Boost):
 *  +------------------------------------------------------------------+
 *  |                      ETH FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |           +-----------------+-----------------+                  |
 *  |           |                                   |                  |
 *  |           v                                   v                  |
 *  |       OPERATOR                            TREASURY               |
 *  |       (config%)                           (remaining)            |
 *  +------------------------------------------------------------------+
 *
 * ============================================================================
 *
 *  CAMPAIGN LIFECYCLE
 *
 *  1. Creator creates campaign (pays BKC) with goal and deadline
 *  2. Donors contribute ETH (5% fee to protocol, 95% to campaign)
 *  3. Anyone can boost campaign (pays BKC + ETH)
 *  4. After deadline OR cancellation, creator withdraws (pays BKC)
 *
 *  Status Flow:
 *  ACTIVE --> COMPLETED (deadline reached) --> WITHDRAWN
 *     |
 *     +--> CANCELLED (by creator) --> WITHDRAWN
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// ============================================================================
//                              INTERFACES
// ============================================================================

interface IBKC {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IMiningManagerV3 {
    function performPurchaseMiningWithOperator(
        bytes32 serviceKey,
        uint256 purchaseAmount,
        address operator
    ) external payable;
}

// ============================================================================
//                              CONTRACT
// ============================================================================

contract CharityPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // ========================================================================
    //                              CONSTANTS
    // ========================================================================

    bytes32 private constant SERVICE_KEY = keccak256("CHARITY_POOL_SERVICE");
    
    uint256 private constant BIPS = 10_000;
    
    uint256 private constant MIN_DURATION = 1 days;
    uint256 private constant MAX_DURATION = 180 days;
    
    uint256 private constant MAX_TITLE = 100;
    uint256 private constant MAX_DESCRIPTION = 1000;

    // ========================================================================
    //                              ENUMS
    // ========================================================================

    enum Status {
        ACTIVE,
        COMPLETED,
        CANCELLED,
        WITHDRAWN
    }

    // ========================================================================
    //                              STRUCTS
    // ========================================================================

    /// @notice Campaign data (packed for gas efficiency)
    struct Campaign {
        address creator;
        uint96 goalAmount;          // ETH goal (max ~79B ETH)
        uint96 raisedAmount;        // ETH raised
        uint32 donationCount;
        uint64 deadline;
        uint64 createdAt;
        uint96 boostAmount;         // Total ETH boosted
        uint64 boostTime;           // Last boost timestamp
        Status status;
    }

    /// @notice Donation record
    struct Donation {
        address donor;
        uint64 campaignId;
        uint96 grossAmount;         // ETH sent
        uint96 netAmount;           // ETH to campaign
        uint64 timestamp;
    }

    // ========================================================================
    //                              ERRORS
    // ========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error InvalidDuration();
    error InvalidGoal();
    error EmptyTitle();
    error TitleTooLong();
    error DescriptionTooLong();
    error CampaignNotFound();
    error CampaignNotActive();
    error CampaignStillActive();
    error NotCampaignCreator();
    error MaxActiveCampaigns();
    error InsufficientBkc();
    error InsufficientEth();
    error TransferFailed();

    // ========================================================================
    //                              STORAGE
    // ========================================================================

    // Addresses
    address public bkcToken;
    address public miningManager;
    address public treasury;

    // Counters
    uint64 public campaignCounter;
    uint64 public donationCounter;

    // Fee Configuration (packed in 1 slot)
    uint96 public createCostBkc;        // BKC to create campaign
    uint96 public withdrawCostBkc;      // BKC to withdraw
    uint16 public donationFeeBips;      // ETH fee on donations (e.g., 500 = 5%)
    
    // Boost Configuration (packed in 1 slot)
    uint96 public boostCostBkc;         // BKC for boost
    uint96 public boostCostEth;         // ETH for boost
    
    // Limits
    uint8 public maxActiveCampaigns;

    // Mappings
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => string) public campaignTitles;
    mapping(uint256 => string) public campaignDescriptions;
    mapping(uint256 => Donation) public donations;
    mapping(uint256 => uint256[]) public campaignDonations;
    mapping(address => uint256[]) public userDonations;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint8) public userActiveCampaigns;

    // Statistics
    uint256 public totalRaisedAllTime;
    uint256 public totalDonationsAllTime;
    uint256 public totalFeesCollected;

    // ========================================================================
    //                           STORAGE GAP
    // ========================================================================

    uint256[40] private __gap;

    // ========================================================================
    //                              EVENTS
    // ========================================================================

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint96 goalAmount,
        uint64 deadline,
        address operator
    );

    event DonationMade(
        uint256 indexed campaignId,
        uint256 indexed donationId,
        address indexed donor,
        uint96 grossAmount,
        uint96 netAmount,
        uint96 feeAmount,
        address operator
    );

    event CampaignBoosted(
        uint256 indexed campaignId,
        address indexed booster,
        uint96 bkcAmount,
        uint96 ethAmount,
        address operator
    );

    event CampaignCancelled(
        uint256 indexed campaignId,
        address indexed creator,
        uint96 raisedAmount
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint96 amount,
        address operator
    );

    event ConfigUpdated();

    // ========================================================================
    //                           INITIALIZATION
    // ========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _bkcToken,
        address _miningManager,
        address _treasury
    ) external initializer {
        if (_bkcToken == address(0)) revert ZeroAddress();
        if (_miningManager == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        if (_owner != address(0) && _owner != msg.sender) {
            _transferOwnership(_owner);
        }

        bkcToken = _bkcToken;
        miningManager = _miningManager;
        treasury = _treasury;

        // Default fees
        createCostBkc = 1 ether;        // 1 BKC
        withdrawCostBkc = 0.5 ether;    // 0.5 BKC
        donationFeeBips = 500;          // 5%
        
        boostCostBkc = 0.5 ether;       // 0.5 BKC
        boostCostEth = 0.001 ether;     // 0.001 ETH
        
        maxActiveCampaigns = 3;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ========================================================================
    //                         CAMPAIGN MANAGEMENT
    // ========================================================================

    /// @notice Create a new fundraising campaign
    /// @param _title Campaign title
    /// @param _description Campaign description
    /// @param _goalAmount ETH goal amount
    /// @param _durationDays Duration in days
    /// @param _operator Frontend operator address
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint96 _goalAmount,
        uint256 _durationDays,
        address _operator
    ) external nonReentrant returns (uint256 campaignId) {
        // Validations
        if (bytes(_title).length == 0) revert EmptyTitle();
        if (bytes(_title).length > MAX_TITLE) revert TitleTooLong();
        if (bytes(_description).length > MAX_DESCRIPTION) revert DescriptionTooLong();
        if (_goalAmount == 0) revert InvalidGoal();
        
        uint256 duration = _durationDays * 1 days;
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();
        
        if (userActiveCampaigns[msg.sender] >= maxActiveCampaigns) revert MaxActiveCampaigns();

        // Collect BKC fee
        _collectBkcFee(createCostBkc, _operator);

        // Create campaign
        campaignId = ++campaignCounter;

        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            goalAmount: _goalAmount,
            raisedAmount: 0,
            donationCount: 0,
            deadline: uint64(block.timestamp + duration),
            createdAt: uint64(block.timestamp),
            boostAmount: 0,
            boostTime: 0,
            status: Status.ACTIVE
        });

        campaignTitles[campaignId] = _title;
        campaignDescriptions[campaignId] = _description;

        userCampaigns[msg.sender].push(campaignId);
        
        unchecked {
            userActiveCampaigns[msg.sender]++;
        }

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _goalAmount,
            uint64(block.timestamp + duration),
            _operator
        );
    }

    /// @notice Cancel an active campaign
    /// @param _campaignId Campaign ID to cancel
    function cancelCampaign(uint256 _campaignId) external {
        Campaign storage c = campaigns[_campaignId];

        if (c.creator == address(0)) revert CampaignNotFound();
        if (c.creator != msg.sender) revert NotCampaignCreator();
        if (c.status != Status.ACTIVE) revert CampaignNotActive();

        c.status = Status.CANCELLED;

        emit CampaignCancelled(_campaignId, msg.sender, c.raisedAmount);
    }

    // ========================================================================
    //                              DONATIONS
    // ========================================================================

    /// @notice Donate ETH to a campaign
    /// @param _campaignId Campaign to donate to
    /// @param _operator Frontend operator address
    function donate(
        uint256 _campaignId,
        address _operator
    ) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        
        Campaign storage c = campaigns[_campaignId];

        if (c.creator == address(0)) revert CampaignNotFound();
        if (c.status != Status.ACTIVE) revert CampaignNotActive();
        if (block.timestamp >= c.deadline) revert CampaignNotActive();

        // Calculate fee split
        uint256 feeAmount;
        uint256 netAmount;
        
        unchecked {
            feeAmount = (msg.value * donationFeeBips) / BIPS;
            netAmount = msg.value - feeAmount;
        }

        // Send fee to MiningManager (Operator + Treasury)
        if (feeAmount > 0) {
            _sendEthToMining(feeAmount, _operator);
        }

        // Record donation
        uint256 donationId = ++donationCounter;

        donations[donationId] = Donation({
            donor: msg.sender,
            campaignId: uint64(_campaignId),
            grossAmount: uint96(msg.value),
            netAmount: uint96(netAmount),
            timestamp: uint64(block.timestamp)
        });

        // Update campaign
        unchecked {
            c.raisedAmount += uint96(netAmount);
            c.donationCount++;
            
            totalRaisedAllTime += netAmount;
            totalDonationsAllTime++;
            totalFeesCollected += feeAmount;
        }

        campaignDonations[_campaignId].push(donationId);
        userDonations[msg.sender].push(donationId);

        emit DonationMade(
            _campaignId,
            donationId,
            msg.sender,
            uint96(msg.value),
            uint96(netAmount),
            uint96(feeAmount),
            _operator
        );
    }

    // ========================================================================
    //                              BOOST
    // ========================================================================

    /// @notice Boost a campaign for visibility (BKC + ETH)
    /// @param _campaignId Campaign to boost
    /// @param _operator Frontend operator address
    function boostCampaign(
        uint256 _campaignId,
        address _operator
    ) external payable nonReentrant {
        Campaign storage c = campaigns[_campaignId];

        if (c.creator == address(0)) revert CampaignNotFound();
        if (c.status != Status.ACTIVE) revert CampaignNotActive();
        if (msg.value < boostCostEth) revert InsufficientEth();

        // Collect BKC fee
        _collectBkcFee(boostCostBkc, _operator);

        // Send ETH to MiningManager
        _sendEthToMining(msg.value, _operator);

        // Update boost info
        unchecked {
            c.boostAmount += uint96(msg.value);
        }
        c.boostTime = uint64(block.timestamp);

        emit CampaignBoosted(
            _campaignId,
            msg.sender,
            uint96(boostCostBkc),
            uint96(msg.value),
            _operator
        );
    }

    // ========================================================================
    //                             WITHDRAW
    // ========================================================================

    /// @notice Withdraw funds from completed/cancelled campaign
    /// @param _campaignId Campaign ID
    /// @param _operator Frontend operator address
    function withdraw(
        uint256 _campaignId,
        address _operator
    ) external nonReentrant {
        Campaign storage c = campaigns[_campaignId];

        if (c.creator == address(0)) revert CampaignNotFound();
        if (c.creator != msg.sender) revert NotCampaignCreator();
        if (c.status == Status.WITHDRAWN) revert CampaignNotActive();

        // Check if campaign can be withdrawn
        if (c.status == Status.ACTIVE) {
            if (block.timestamp < c.deadline) revert CampaignStillActive();
            c.status = Status.COMPLETED;
        }

        // Collect BKC fee
        _collectBkcFee(withdrawCostBkc, _operator);

        uint96 amount = c.raisedAmount;
        c.status = Status.WITHDRAWN;

        // Decrease active campaigns count
        if (userActiveCampaigns[msg.sender] > 0) {
            unchecked {
                userActiveCampaigns[msg.sender]--;
            }
        }

        // Transfer ETH to creator (100% - NO penalty)
        if (amount > 0) {
            (bool success, ) = msg.sender.call{value: amount}("");
            if (!success) revert TransferFailed();
        }

        emit FundsWithdrawn(_campaignId, msg.sender, amount, _operator);
    }

    // ========================================================================
    //                          VIEW FUNCTIONS
    // ========================================================================

    /// @notice Get campaign details
    function getCampaign(uint256 _campaignId) external view returns (
        address creator,
        string memory title,
        string memory description,
        uint96 goalAmount,
        uint96 raisedAmount,
        uint32 donationCount,
        uint64 deadline,
        uint64 createdAt,
        uint96 boostAmount,
        uint64 boostTime,
        Status status,
        bool goalReached
    ) {
        Campaign storage c = campaigns[_campaignId];
        
        creator = c.creator;
        title = campaignTitles[_campaignId];
        description = campaignDescriptions[_campaignId];
        goalAmount = c.goalAmount;
        raisedAmount = c.raisedAmount;
        donationCount = c.donationCount;
        deadline = c.deadline;
        createdAt = c.createdAt;
        boostAmount = c.boostAmount;
        boostTime = c.boostTime;
        status = c.status;
        goalReached = c.raisedAmount >= c.goalAmount;
    }

    /// @notice Get donation details
    function getDonation(uint256 _donationId) external view returns (Donation memory) {
        return donations[_donationId];
    }

    /// @notice Get donations for a campaign
    function getCampaignDonations(uint256 _campaignId) external view returns (uint256[] memory) {
        return campaignDonations[_campaignId];
    }

    /// @notice Get donations by user
    function getUserDonations(address _user) external view returns (uint256[] memory) {
        return userDonations[_user];
    }

    /// @notice Get campaigns created by user
    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }

    /// @notice Preview donation fee
    function previewDonation(uint256 _amount) external view returns (
        uint256 netToCampaign,
        uint256 feeToProtocol
    ) {
        unchecked {
            feeToProtocol = (_amount * donationFeeBips) / BIPS;
            netToCampaign = _amount - feeToProtocol;
        }
    }

    /// @notice Check if campaign can be withdrawn
    function canWithdraw(uint256 _campaignId) external view returns (
        bool allowed,
        string memory reason
    ) {
        Campaign storage c = campaigns[_campaignId];

        if (c.creator == address(0)) {
            return (false, "Campaign not found");
        }
        if (c.status == Status.WITHDRAWN) {
            return (false, "Already withdrawn");
        }
        if (c.status == Status.ACTIVE && block.timestamp < c.deadline) {
            return (false, "Campaign still active");
        }

        return (true, "Ready");
    }

    /// @notice Check if campaign is boosted (within 24h)
    function isBoosted(uint256 _campaignId) external view returns (bool) {
        Campaign storage c = campaigns[_campaignId];
        return c.boostTime > 0 && (block.timestamp - c.boostTime) < 1 days;
    }

    /// @notice Get global statistics
    function getStats() external view returns (
        uint64 totalCampaigns,
        uint256 totalRaised,
        uint256 totalDonations,
        uint256 totalFees
    ) {
        return (
            campaignCounter,
            totalRaisedAllTime,
            totalDonationsAllTime,
            totalFeesCollected
        );
    }

    /// @notice Get fee configuration
    function getFeeConfig() external view returns (
        uint96 createBkc,
        uint96 withdrawBkc,
        uint16 donationBips,
        uint96 boostBkc,
        uint96 boostEth
    ) {
        return (
            createCostBkc,
            withdrawCostBkc,
            donationFeeBips,
            boostCostBkc,
            boostCostEth
        );
    }

    // ========================================================================
    //                         ADMIN FUNCTIONS
    // ========================================================================

    function setFees(
        uint96 _createBkc,
        uint96 _withdrawBkc,
        uint16 _donationBips,
        uint96 _boostBkc,
        uint96 _boostEth
    ) external onlyOwner {
        require(_donationBips <= 1000, "Max 10%"); // Cap at 10%
        
        createCostBkc = _createBkc;
        withdrawCostBkc = _withdrawBkc;
        donationFeeBips = _donationBips;
        boostCostBkc = _boostBkc;
        boostCostEth = _boostEth;
        
        emit ConfigUpdated();
    }

    function setMaxActiveCampaigns(uint8 _max) external onlyOwner {
        require(_max > 0, "Min 1");
        maxActiveCampaigns = _max;
        emit ConfigUpdated();
    }

    function setAddresses(
        address _bkcToken,
        address _miningManager,
        address _treasury
    ) external onlyOwner {
        if (_bkcToken != address(0)) bkcToken = _bkcToken;
        if (_miningManager != address(0)) miningManager = _miningManager;
        if (_treasury != address(0)) treasury = _treasury;
        emit ConfigUpdated();
    }

    /// @notice Emergency recover stuck tokens
    function emergencyRecover(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        if (_token == address(0)) {
            // Recover ETH (only excess, not campaign funds)
            (bool success, ) = _to.call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            IBKC(_token).transfer(_to, _amount);
        }
    }

    // ========================================================================
    //                       INTERNAL FUNCTIONS
    // ========================================================================

    /// @dev Collect BKC fee and send to MiningManager
    function _collectBkcFee(uint256 _amount, address _operator) internal {
        if (_amount == 0) return;
        
        IBKC bkc = IBKC(bkcToken);
        
        // Transfer BKC from user to MiningManager
        bkc.transferFrom(msg.sender, miningManager, _amount);
        
        // Notify MiningManager
        try IMiningManagerV3(miningManager).performPurchaseMiningWithOperator(
            SERVICE_KEY,
            _amount,
            _operator
        ) {} catch {}
    }

    /// @dev Send ETH to MiningManager
    function _sendEthToMining(uint256 _amount, address _operator) internal {
        if (_amount == 0) return;

        try IMiningManagerV3(miningManager).performPurchaseMiningWithOperator{value: _amount}(
            SERVICE_KEY,
            0,
            _operator
        ) {} catch {
            // Fallback to treasury
            (bool success, ) = treasury.call{value: _amount}("");
            if (!success) revert TransferFailed();
        }
    }

    // ========================================================================
    //                              UUPS
    // ========================================================================

    function version() external pure returns (string memory) {
        return "6.0.0";
    }

    receive() external payable {}
}
