// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title MiningManager
 * @notice The economic heart of the Backcoin Protocol ($BKC).
 * @dev Handles the "Proof-of-Purchase" mining mechanism with LINEAR DYNAMIC SCARCITY.
 * Optimized for Arbitrum Network.
.
 */
contract MiningManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IMiningManager
{
    using SafeERC20Upgradeable for BKCToken;

    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    address public bkcTokenAddress;
    
    // Mapping optimized with bytes32 keys for gas savings
    mapping(bytes32 => address) public authorizedMiners;
    bool private tgeMinted;

    // --- Constants ---

    uint256 private constant E18 = 10**18;
    // Dynamic Scarcity Base: 160M Tokens available for mining
    // This is the denominator for the linear scarcity curve.
    uint256 private constant MAX_MINTABLE_SUPPLY = 160000000 * E18;

    // Pre-computed hashes for distribution keys to save gas during mining
    bytes32 public constant POOL_TREASURY = keccak256("TREASURY");
    bytes32 public constant POOL_DELEGATOR = keccak256("DELEGATOR_POOL");

    // --- Custom Errors ---

    error InvalidAddress();
    error Unauthorized();
    error TGEAlreadyMinted();
    error DistributionConfigError(); // Sum of BIPs != 10000

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _ecosystemManagerAddress
    ) public initializer {
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        tgeMinted = false;
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        
        if (bkcTokenAddress == address(0)) revert InvalidAddress();
        bkcToken = BKCToken(bkcTokenAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // --- Admin Functions ---

    /**
     * @notice Authorizes a Spoke contract (e.g., Notary, Game) to trigger mining.
     */
    function setAuthorizedMiner(bytes32 _serviceKey, address _spokeAddress) external onlyOwner {
        if (_spokeAddress == address(0)) revert InvalidAddress();
        authorizedMiners[_serviceKey] = _spokeAddress;
    }
    
    function initialTgeMint(address to, uint256 amount) external onlyOwner {
        if (tgeMinted) revert TGEAlreadyMinted();
        tgeMinted = true;
        bkcToken.mint(to, amount);
    }

    // --- Core Mining Logic ---

    /**
     * @notice Universal revenue funnel for PoP mining ($BKC creation) and Fee Distribution.
     */
    function performPurchaseMining(
        bytes32 _serviceKey,
        uint256 _purchaseAmount
    ) external nonReentrant override {
        // 1. Authorization Check
        bool isAuthorized = false;
        
        // Check 1: Direct Authorization (Notary, Game, etc)
        if (authorizedMiners[_serviceKey] == msg.sender) {
            isAuthorized = true;
        } else {
            // Check 2: Valid Liquidity Pool via Factory
            // CLEANUP: Removed complex staticcall, using clean interface
            address factoryAddress = ecosystemManager.getNFTLiquidityPoolFactoryAddress();
            if (factoryAddress != address(0)) {
                try INFTLiquidityPoolFactory(factoryAddress).isPool(msg.sender) returns (bool valid) {
                    isAuthorized = valid;
                } catch {
                    // If call fails (e.g. invalid address), remains unauthorized
                }
            }
        }

        if (!isAuthorized) revert Unauthorized();

        // 2. Cache addresses to save gas
        address treasury = ecosystemManager.getTreasuryAddress();
        address dm = ecosystemManager.getDelegationManagerAddress();
        
        // 3. --- MINING DISTRIBUTION (New Tokens) ---
        // Uses the Linear Scarcity Logic
        uint256 totalMintAmount = getMintAmount(_purchaseAmount);
        if (totalMintAmount > 0) {
            uint256 miningTreasuryBips = ecosystemManager.getMiningDistributionBips(POOL_TREASURY);
            uint256 miningDelegatorBips = ecosystemManager.getMiningDistributionBips(POOL_DELEGATOR);

            if (miningTreasuryBips + miningDelegatorBips != 10000) revert DistributionConfigError();

            uint256 mintTreasuryAmount = (totalMintAmount * miningTreasuryBips) / 10000;
            uint256 mintDelegatorAmount = totalMintAmount - mintTreasuryAmount;

            // Mint the total new amount to this contract first
            bkcToken.mint(address(this), totalMintAmount);
            
            if (mintTreasuryAmount > 0) {
                bkcToken.safeTransfer(treasury, mintTreasuryAmount);
            }

            if (mintDelegatorAmount > 0) {
                // Direct transfer + Notify
                bkcToken.safeTransfer(dm, mintDelegatorAmount);
                IDelegationManager(dm).depositMiningRewards(mintDelegatorAmount);
            }
        }

        // 4. --- FEE DISTRIBUTION (Original Tokens) ---
        if (_purchaseAmount > 0) {
            uint256 feeTreasuryBips = ecosystemManager.getFeeDistributionBips(POOL_TREASURY);
            uint256 feeDelegatorBips = ecosystemManager.getFeeDistributionBips(POOL_DELEGATOR);

            if (feeTreasuryBips + feeDelegatorBips != 10000) revert DistributionConfigError();

            uint256 feeTreasuryAmount = (_purchaseAmount * feeTreasuryBips) / 10000;
            uint256 feeDelegatorAmount = _purchaseAmount - feeTreasuryAmount;

            // Tokens are already in this contract (transferred by the Spoke)
            if (feeTreasuryAmount > 0) {
                bkcToken.safeTransfer(treasury, feeTreasuryAmount);
            }

            if (feeDelegatorAmount > 0) {
                // Direct transfer + Notify
                bkcToken.safeTransfer(dm, feeDelegatorAmount);
                IDelegationManager(dm).depositMiningRewards(feeDelegatorAmount);
            }
        }
    }

    /**
     * @notice Calculates mint amount based on LINEAR dynamic scarcity.
     * @dev 
     * Formula: Mint = Purchase * (RemainingSupply / 160M)
     * - At 160M remaining (start): Mint = Purchase * 1.0 (100%)
     * - At 80M remaining: Mint = Purchase * 0.5 (50%)
     * - At 0M remaining: Mint = 0
     */
    function getMintAmount(uint256 _purchaseAmount) public view override returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        if (currentSupply >= maxSupply) {
            return 0;
        }

        uint256 remainingToMint;
        unchecked {
            remainingToMint = maxSupply - currentSupply;
        }
        
        // Safety cap: If burned tokens cause remaining > 160M, cap ratio at 100% (1:1)
        if (remainingToMint > MAX_MINTABLE_SUPPLY) {
            return _purchaseAmount;
        }
        
        // Linear Calculation:
        // (Purchase * Remaining) / 160,000,000
        // Multiplication first to maintain precision
        return (_purchaseAmount * remainingToMint) / MAX_MINTABLE_SUPPLY;
    }
    
    function transferTokensFromGuardian(address to, uint256 amount) external onlyOwner {
        bkcToken.safeTransfer(to, amount);
    }
    
    function approveTokensFromGuardian(address spender, uint256 amount) external onlyOwner {
        bkcToken.safeApprove(spender, amount);
    }
}