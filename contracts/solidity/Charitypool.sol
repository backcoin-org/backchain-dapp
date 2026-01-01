// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title CharityPool
 * @author Backchain Protocol
 * @notice Decentralized charitable crowdfunding for humanitarian and animal causes
 * 
 * @dev CharityPool is one of the crowdfunding modules in the Backchain RWA ecosystem.
 *      It enables transparent, blockchain-based fundraising for CHARITABLE purposes
 *      with built-in burn mechanisms that create deflationary pressure on BKC.
 *
 * ============================================================================
 *                         BACKCOIN RWA ECOSYSTEM
 * ============================================================================
 *
 *  Backcoin is a comprehensive Real World Asset (RWA) infrastructure that
 *  bridges traditional services with blockchain technology:
 *
 *  Core Services:
 *  - Document notarization and certification on-chain
 *  - NFT-backed utility with tiered fee discounts
 *  - Decentralized staking and delegation rewards
 *  - Charitable crowdfunding (this contract)
 *  - Community project tokenization (upcoming)
 *  - NFT rental marketplace
 *  - Prediction games with on-chain resolution
 *
 * ============================================================================
 *                         MODULAR ARCHITECTURE
 * ============================================================================
 *
 *  CharityPool follows the Backcoin modular design pattern:
 *
 *  +------------------------------------------------------------------+
 *  |                    ECOSYSTEM MANAGER (Hub)                       |
 *  |              Central configuration and registry                  |
 *  +------------------------------------------------------------------+
 *                                  |
 *          +-----------+-----------+-----------+-----------+
 *          |           |           |           |           |
 *          v           v           v           v           v
 *     +--------+  +--------+  +--------+  +--------+  +--------+
 *     |  BKC   |  | Mining |  |Delegate|  | Notary |  |Fortune |
 *     | Token  |  |Manager |  |Manager |  |        |  | Pool   |
 *     +--------+  +--------+  +--------+  +--------+  +--------+
 *          |           |           |           |           |
 *          +-----------+-----------+-----------+-----------+
 *                                  |
 *                                  v
 *  +------------------------------------------------------------------+
 *  |                      EXTENSION MODULES                           |
 *  +------------------------------------------------------------------+
 *  |                                                                  |
 *  |  +------------------+  +------------------+  +------------------+|
 *  |  |   CharityPool    |  | CommunityFunding |  |  RentalManager   ||
 *  |  |   (this)         |  |    (upcoming)    |  |                  ||
 *  |  +------------------+  +------------------+  +------------------+|
 *  |                                                                  |
 *  +------------------------------------------------------------------+
 *
 *  Module Registration:
 *  - Registered via EcosystemManager.setModule(key, address)
 *  - Query via EcosystemManager.getModule(key)
 *  - No upgrade required to add new modules
 *
 * ============================================================================
 *                           CHARITY POOL
 * ============================================================================
 *
 *  Purpose: Transparent charitable fundraising with deflationary mechanics
 *
 *  Use Cases:
 *  - Animal welfare and rescue campaigns
 *  - Humanitarian aid and disaster relief
 *  - Medical expenses and treatments
 *  - Educational support and scholarships
 *  - Environmental and social causes
 *
 *  Key Characteristic: DONATIONS (no financial return expected)
 *
 * ============================================================================
 *                         FEE STRUCTURE
 * ============================================================================
 *
 *  All fees are configurable via setFees():
 *
 *  +-------------+------------------+--------------------------------+
 *  | Action      | Default Fee      | Destination                    |
 *  +-------------+------------------+--------------------------------+
 *  | Create      | Free             | -                              |
 *  | Donate      | 4% BKC           | MiningManager (PoP trigger)    |
 *  | Donate      | 1% BKC           | Burn (deflationary)            |
 *  | Withdraw    | 0.001 ETH        | Treasury                       |
 *  | Withdraw    | 10% BKC          | Burn (only if goal not met)    |
 *  +-------------+------------------+--------------------------------+
 *
 * ============================================================================
 *                       CAMPAIGN LIFECYCLE
 * ============================================================================
 *
 *  1. Creator creates charitable campaign (free) with goal and deadline
 *  2. Donors contribute BKC (fees applied per configuration)
 *  3. After deadline OR cancellation, creator withdraws
 *  4. If goal not met: configurable percentage of funds burned as penalty
 *
 *  Status Flow:
 *  ACTIVE --> COMPLETED (deadline reached) --> WITHDRAWN
 *     |
 *     +--> CANCELLED (by creator) --> WITHDRAWN
 *
 * ============================================================================
 *                       MODULE CHARACTERISTICS
 * ============================================================================
 *
 *  - 100% modular and plug-and-play
 *  - Reads configuration from EcosystemManager
 *  - Requires no changes to existing contracts
 *  - Deflationary mechanics benefit all BKC holders
 *  - Triggers Proof-of-Purchase mining on donations
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract CharityPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BIPS_DENOMINATOR = 10_000;

    /// @notice Service key for MiningManager authorization
    bytes32 public constant SERVICE_KEY = keccak256("CHARITY_POOL_SERVICE");

    /// @notice Minimum campaign duration (1 day)
    uint256 public constant MIN_CAMPAIGN_DURATION = 1 days;

    /// @notice Maximum campaign duration (180 days)
    uint256 public constant MAX_CAMPAIGN_DURATION = 180 days;

    // =========================================================================
    //                              ENUMS
    // =========================================================================

    /// @notice Campaign status
    enum CampaignStatus {
        ACTIVE,             // Campaign is accepting donations
        COMPLETED,          // Deadline reached, awaiting withdrawal
        CANCELLED,          // Creator cancelled, awaiting withdrawal
        WITHDRAWN           // Funds have been withdrawn
    }

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /// @notice Campaign data structure
    struct Campaign {
        address creator;            // Creator and beneficiary
        string title;               // Campaign title
        string description;         // Description or IPFS CID
        uint256 goalAmount;         // Target amount in BKC
        uint256 raisedAmount;       // Total raised (net, after donation fees)
        uint256 donationCount;      // Number of donations received
        uint256 deadline;           // Unix timestamp deadline
        uint256 createdAt;          // Unix timestamp creation
        CampaignStatus status;      // Current status
    }

    /// @notice Donation record
    struct Donation {
        address donor;              // Donor address
        uint256 campaignId;         // Campaign ID
        uint256 grossAmount;        // Amount before fees
        uint256 netAmount;          // Amount after fees (added to campaign)
        uint256 timestamp;          // Donation timestamp
    }

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to ecosystem configuration hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice Campaign counter (also serves as next campaign ID)
    uint256 public campaignCounter;

    /// @notice Donation counter
    uint256 public donationCounter;

    // -------------------------------------------------------------------------
    // Fee Configuration (in basis points)
    // -------------------------------------------------------------------------

    /// @notice Fee sent to MiningManager on donation (default: 400 = 4%)
    uint256 public donationMiningFeeBips;

    /// @notice Fee burned on donation (default: 100 = 1%)
    uint256 public donationBurnFeeBips;

    /// @notice ETH fee for withdrawal (default: 0.001 ETH)
    uint256 public withdrawalFeeETH;

    /// @notice Burn penalty if goal not reached (default: 1000 = 10%)
    uint256 public goalNotMetBurnBips;

    // -------------------------------------------------------------------------
    // Limits Configuration
    // -------------------------------------------------------------------------

    /// @notice Minimum donation amount (default: 1 BKC)
    uint256 public minDonationAmount;

    /// @notice Maximum active campaigns per wallet (default: 3)
    uint256 public maxActiveCampaignsPerWallet;

    // -------------------------------------------------------------------------
    // Mappings
    // -------------------------------------------------------------------------

    /// @notice Campaign ID => Campaign data
    mapping(uint256 => Campaign) public campaigns;

    /// @notice Donation ID => Donation data
    mapping(uint256 => Donation) public donations;

    /// @notice User address => Number of active campaigns
    mapping(address => uint256) public userActiveCampaigns;

    /// @notice Campaign ID => Array of donation IDs
    mapping(uint256 => uint256[]) public campaignDonations;

    /// @notice User address => Array of donation IDs made by user
    mapping(address => uint256[]) public userDonations;

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    /// @notice Total BKC raised across all campaigns (gross)
    uint256 public totalRaisedAllTime;

    /// @notice Total BKC burned through this contract
    uint256 public totalBurnedAllTime;

    /// @notice Total campaigns created
    uint256 public totalCampaignsCreated;

    /// @notice Total successful withdrawals
    uint256 public totalSuccessfulWithdrawals;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when a new campaign is created
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goalAmount,
        uint256 deadline
    );

    /// @notice Emitted when a donation is made
    event DonationMade(
        uint256 indexed campaignId,
        uint256 indexed donationId,
        address indexed donor,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 miningFee,
        uint256 burnedAmount
    );

    /// @notice Emitted when a campaign is cancelled
    event CampaignCancelled(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 raisedAmount
    );

    /// @notice Emitted when funds are withdrawn
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 burnedAmount,
        bool goalReached
    );

    /// @notice Emitted when tokens are burned
    event TokensBurned(
        uint256 indexed campaignId,
        uint256 amount,
        string reason
    );

    /// @notice Emitted when fee configuration is updated
    event FeesUpdated(
        uint256 donationMiningFeeBips,
        uint256 donationBurnFeeBips,
        uint256 withdrawalFeeETH,
        uint256 goalNotMetBurnBips
    );

    /// @notice Emitted when limits are updated
    event LimitsUpdated(
        uint256 minDonationAmount,
        uint256 maxActiveCampaignsPerWallet
    );

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error InvalidDuration();
    error InvalidGoal();
    error CampaignNotFound();
    error CampaignNotActive();
    error CampaignStillActive();
    error NotCampaignCreator();
    error MaxActiveCampaignsReached();
    error DonationTooSmall();
    error InsufficientETHFee();
    error InvalidFeeBips();
    error TransferFailed();
    error EmptyTitle();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the CharityPool contract
     * @param _owner Contract owner address
     * @param _ecosystemManager Address of the ecosystem configuration hub
     */
    function initialize(address _owner, address _ecosystemManager) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _transferOwnership(_owner);

        ecosystemManager = IEcosystemManager(_ecosystemManager);
        
        // Get BKC token address from ecosystem
        address bkcAddress = ecosystemManager.getBKCTokenAddress();
        if (bkcAddress == address(0)) revert ZeroAddress();
        bkcToken = BKCToken(bkcAddress);

        // Set default fees
        donationMiningFeeBips = 400;    // 4%
        donationBurnFeeBips = 100;      // 1%
        withdrawalFeeETH = 0.001 ether; // 0.001 ETH
        goalNotMetBurnBips = 1000;      // 10%

        // Set default limits
        minDonationAmount = 1 * 1e18;   // 1 BKC
        maxActiveCampaignsPerWallet = 3;
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         CAMPAIGN MANAGEMENT
    // =========================================================================

    /**
     * @notice Creates a new fundraising campaign
     * @dev Free to create. Creator will be the beneficiary.
     *
     * @param _title Campaign title (required)
     * @param _description Campaign description or IPFS CID
     * @param _goalAmount Target amount in BKC (wei)
     * @param _durationInDays Campaign duration in days (1-180)
     * @return campaignId The ID of the created campaign
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goalAmount,
        uint256 _durationInDays
    ) external returns (uint256 campaignId) {
        // Validations
        if (bytes(_title).length == 0) revert EmptyTitle();
        if (_goalAmount == 0) revert InvalidGoal();
        
        uint256 durationInSeconds = _durationInDays * 1 days;
        if (durationInSeconds < MIN_CAMPAIGN_DURATION || durationInSeconds > MAX_CAMPAIGN_DURATION) {
            revert InvalidDuration();
        }
        
        if (userActiveCampaigns[msg.sender] >= maxActiveCampaignsPerWallet) {
            revert MaxActiveCampaignsReached();
        }

        // Create campaign
        unchecked {
            ++campaignCounter;
        }
        campaignId = campaignCounter;

        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            goalAmount: _goalAmount,
            raisedAmount: 0,
            donationCount: 0,
            deadline: block.timestamp + durationInSeconds,
            createdAt: block.timestamp,
            status: CampaignStatus.ACTIVE
        });

        // Update counters
        unchecked {
            ++userActiveCampaigns[msg.sender];
            ++totalCampaignsCreated;
        }

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _goalAmount,
            block.timestamp + durationInSeconds
        );
    }

    /**
     * @notice Cancels an active campaign
     * @dev Only creator can cancel. Funds can still be withdrawn after cancellation.
     *
     * @param _campaignId Campaign ID to cancel
     */
    function cancelCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (campaign.creator != msg.sender) revert NotCampaignCreator();
        if (campaign.status != CampaignStatus.ACTIVE) revert CampaignNotActive();

        campaign.status = CampaignStatus.CANCELLED;

        emit CampaignCancelled(_campaignId, msg.sender, campaign.raisedAmount);
    }

    // =========================================================================
    //                            DONATIONS
    // =========================================================================

    /**
     * @notice Donates BKC to a campaign
     * @dev Fee breakdown (default values):
     *      - 4% goes to MiningManager (triggers PoP mining)
     *      - 1% is burned immediately (deflationary)
     *      - 95% goes to campaign
     *
     * @param _campaignId Campaign ID to donate to
     * @param _amount Amount of BKC to donate (gross, before fees)
     */
    function donate(
        uint256 _campaignId,
        uint256 _amount
    ) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        
        // Validations
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (campaign.status != CampaignStatus.ACTIVE) revert CampaignNotActive();
        if (block.timestamp >= campaign.deadline) revert CampaignNotActive();
        if (_amount < minDonationAmount) revert DonationTooSmall();

        // Calculate fees
        uint256 miningFee = (_amount * donationMiningFeeBips) / BIPS_DENOMINATOR;
        uint256 burnFee = (_amount * donationBurnFeeBips) / BIPS_DENOMINATOR;
        uint256 netAmount = _amount - miningFee - burnFee;

        // Transfer tokens from donor
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Process mining fee
        if (miningFee > 0) {
            address miningManager = ecosystemManager.getMiningManagerAddress();
            if (miningManager != address(0)) {
                bkcToken.safeTransfer(miningManager, miningFee);
                IMiningManager(miningManager).performPurchaseMining(SERVICE_KEY, miningFee);
            }
        }

        // Burn tokens (deflationary mechanism)
        if (burnFee > 0) {
            bkcToken.burn(burnFee);
            unchecked {
                totalBurnedAllTime += burnFee;
            }
            emit TokensBurned(_campaignId, burnFee, "donation_fee");
        }

        // Record donation
        unchecked {
            ++donationCounter;
        }
        uint256 donationId = donationCounter;

        donations[donationId] = Donation({
            donor: msg.sender,
            campaignId: _campaignId,
            grossAmount: _amount,
            netAmount: netAmount,
            timestamp: block.timestamp
        });

        // Update campaign
        unchecked {
            campaign.raisedAmount += netAmount;
            campaign.donationCount++;
            totalRaisedAllTime += _amount;
        }

        // Track donation references
        campaignDonations[_campaignId].push(donationId);
        userDonations[msg.sender].push(donationId);

        emit DonationMade(
            _campaignId,
            donationId,
            msg.sender,
            _amount,
            netAmount,
            miningFee,
            burnFee
        );
    }

    // =========================================================================
    //                            WITHDRAWALS
    // =========================================================================

    /**
     * @notice Withdraws funds from a completed/cancelled campaign
     * @dev Requirements:
     *      - Campaign must be past deadline OR cancelled
     *      - Only creator can withdraw
     *      - Requires ETH fee payment
     *      - If goal not met: penalty percentage of funds burned
     *
     * @param _campaignId Campaign ID to withdraw from
     */
    function withdraw(uint256 _campaignId) external payable nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        
        // Validations
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (campaign.creator != msg.sender) revert NotCampaignCreator();
        if (campaign.status == CampaignStatus.WITHDRAWN) revert CampaignNotActive();
        
        // Must be past deadline or cancelled
        if (campaign.status == CampaignStatus.ACTIVE) {
            if (block.timestamp < campaign.deadline) revert CampaignStillActive();
            campaign.status = CampaignStatus.COMPLETED;
        }

        // Check ETH fee
        if (msg.value < withdrawalFeeETH) revert InsufficientETHFee();

        uint256 raisedAmount = campaign.raisedAmount;
        uint256 burnAmount = 0;
        uint256 netAmount = raisedAmount;
        bool goalReached = raisedAmount >= campaign.goalAmount;

        // Apply burn penalty if goal not reached
        if (!goalReached && raisedAmount > 0) {
            burnAmount = (raisedAmount * goalNotMetBurnBips) / BIPS_DENOMINATOR;
            netAmount = raisedAmount - burnAmount;

            // Burn tokens (deflationary penalty)
            if (burnAmount > 0) {
                bkcToken.burn(burnAmount);
                unchecked {
                    totalBurnedAllTime += burnAmount;
                }
                emit TokensBurned(_campaignId, burnAmount, "goal_not_met_penalty");
            }
        }

        // Update campaign status
        campaign.status = CampaignStatus.WITHDRAWN;
        
        // Decrease active campaigns counter
        if (userActiveCampaigns[msg.sender] > 0) {
            unchecked {
                --userActiveCampaigns[msg.sender];
            }
        }

        // Transfer ETH fee to treasury
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury != address(0) && msg.value > 0) {
            (bool success, ) = treasury.call{value: msg.value}("");
            if (!success) revert TransferFailed();
        }

        // Transfer BKC to creator
        if (netAmount > 0) {
            bkcToken.safeTransfer(msg.sender, netAmount);
        }

        unchecked {
            ++totalSuccessfulWithdrawals;
        }

        emit FundsWithdrawn(
            _campaignId,
            msg.sender,
            raisedAmount,
            netAmount,
            burnAmount,
            goalReached
        );
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns campaign details
     * @param _campaignId Campaign ID
     * @return Campaign struct
     */
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    /**
     * @notice Returns donation details
     * @param _donationId Donation ID
     * @return Donation struct
     */
    function getDonation(uint256 _donationId) external view returns (Donation memory) {
        return donations[_donationId];
    }

    /**
     * @notice Returns all donation IDs for a campaign
     * @param _campaignId Campaign ID
     * @return Array of donation IDs
     */
    function getCampaignDonations(uint256 _campaignId) external view returns (uint256[] memory) {
        return campaignDonations[_campaignId];
    }

    /**
     * @notice Returns all donation IDs made by a user
     * @param _user User address
     * @return Array of donation IDs
     */
    function getUserDonations(address _user) external view returns (uint256[] memory) {
        return userDonations[_user];
    }

    /**
     * @notice Calculates net amount after donation fees
     * @param _grossAmount Amount before fees
     * @return netAmount Amount after fees
     * @return miningFee Fee sent to mining
     * @return burnFee Fee to be burned
     */
    function calculateDonationFees(uint256 _grossAmount) external view returns (
        uint256 netAmount,
        uint256 miningFee,
        uint256 burnFee
    ) {
        miningFee = (_grossAmount * donationMiningFeeBips) / BIPS_DENOMINATOR;
        burnFee = (_grossAmount * donationBurnFeeBips) / BIPS_DENOMINATOR;
        netAmount = _grossAmount - miningFee - burnFee;
    }

    /**
     * @notice Calculates withdrawal amounts
     * @param _campaignId Campaign ID
     * @return grossAmount Total raised
     * @return netAmount Amount after potential burn
     * @return burnAmount Amount to be burned (if goal not met)
     * @return goalReached Whether goal was reached
     */
    function calculateWithdrawal(uint256 _campaignId) external view returns (
        uint256 grossAmount,
        uint256 netAmount,
        uint256 burnAmount,
        bool goalReached
    ) {
        Campaign memory campaign = campaigns[_campaignId];
        
        grossAmount = campaign.raisedAmount;
        goalReached = grossAmount >= campaign.goalAmount;
        
        if (!goalReached && grossAmount > 0) {
            burnAmount = (grossAmount * goalNotMetBurnBips) / BIPS_DENOMINATOR;
            netAmount = grossAmount - burnAmount;
        } else {
            netAmount = grossAmount;
            burnAmount = 0;
        }
    }

    /**
     * @notice Returns whether a campaign can be withdrawn
     * @param _campaignId Campaign ID
     * @return canWithdraw_ True if withdrawal is possible
     * @return reason Explanation string
     */
    function canWithdraw(uint256 _campaignId) external view returns (
        bool canWithdraw_,
        string memory reason
    ) {
        Campaign memory campaign = campaigns[_campaignId];
        
        if (campaign.creator == address(0)) {
            return (false, "Campaign not found");
        }
        if (campaign.status == CampaignStatus.WITHDRAWN) {
            return (false, "Already withdrawn");
        }
        if (campaign.status == CampaignStatus.ACTIVE && block.timestamp < campaign.deadline) {
            return (false, "Campaign still active");
        }
        
        return (true, "Ready for withdrawal");
    }

    /**
     * @notice Returns global statistics
     * @return totalCampaigns Total campaigns created
     * @return totalRaised Total BKC raised (gross)
     * @return totalBurned Total BKC burned
     * @return totalWithdrawals Total successful withdrawals
     */
    function getGlobalStats() external view returns (
        uint256 totalCampaigns,
        uint256 totalRaised,
        uint256 totalBurned,
        uint256 totalWithdrawals
    ) {
        return (
            totalCampaignsCreated,
            totalRaisedAllTime,
            totalBurnedAllTime,
            totalSuccessfulWithdrawals
        );
    }

    /**
     * @notice Returns current fee configuration
     * @return miningFeeBips Mining fee in bips
     * @return burnFeeBips Burn fee in bips
     * @return ethFee ETH withdrawal fee
     * @return penaltyBips Goal not met penalty in bips
     */
    function getFeeConfig() external view returns (
        uint256 miningFeeBips,
        uint256 burnFeeBips,
        uint256 ethFee,
        uint256 penaltyBips
    ) {
        return (
            donationMiningFeeBips,
            donationBurnFeeBips,
            withdrawalFeeETH,
            goalNotMetBurnBips
        );
    }

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Updates fee configuration
     * @dev Only owner. Total donation fees cannot exceed 20%.
     *
     * @param _miningFeeBips Mining fee in basis points
     * @param _burnFeeBips Burn fee in basis points
     * @param _withdrawalFeeETH ETH fee for withdrawals
     * @param _goalNotMetBurnBips Penalty if goal not met
     */
    function setFees(
        uint256 _miningFeeBips,
        uint256 _burnFeeBips,
        uint256 _withdrawalFeeETH,
        uint256 _goalNotMetBurnBips
    ) external onlyOwner {
        // Total donation fee cannot exceed 20%
        if (_miningFeeBips + _burnFeeBips > 2000) revert InvalidFeeBips();
        // Penalty cannot exceed 50%
        if (_goalNotMetBurnBips > 5000) revert InvalidFeeBips();

        donationMiningFeeBips = _miningFeeBips;
        donationBurnFeeBips = _burnFeeBips;
        withdrawalFeeETH = _withdrawalFeeETH;
        goalNotMetBurnBips = _goalNotMetBurnBips;

        emit FeesUpdated(
            _miningFeeBips,
            _burnFeeBips,
            _withdrawalFeeETH,
            _goalNotMetBurnBips
        );
    }

    /**
     * @notice Updates limit configuration
     * @dev Only owner.
     *
     * @param _minDonationAmount Minimum donation in BKC (wei)
     * @param _maxActiveCampaigns Maximum active campaigns per wallet
     */
    function setLimits(
        uint256 _minDonationAmount,
        uint256 _maxActiveCampaigns
    ) external onlyOwner {
        if (_minDonationAmount == 0) revert ZeroAmount();
        if (_maxActiveCampaigns == 0) revert ZeroAmount();

        minDonationAmount = _minDonationAmount;
        maxActiveCampaignsPerWallet = _maxActiveCampaigns;

        emit LimitsUpdated(_minDonationAmount, _maxActiveCampaigns);
    }

    /**
     * @notice Emergency function to recover stuck tokens
     * @dev Only owner. Cannot recover tokens allocated to active campaigns.
     *
     * @param _token Token address (address(0) for ETH)
     * @param _to Recipient address
     * @param _amount Amount to recover
     */
    function emergencyRecover(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();

        if (_token == address(0)) {
            (bool success, ) = _to.call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20Upgradeable(_token).safeTransfer(_to, _amount);
        }
    }

    /**
     * @notice Allows contract to receive ETH
     */
    receive() external payable {}
}
