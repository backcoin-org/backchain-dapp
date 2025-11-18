// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

contract MiningManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IMiningManager
{
    using SafeERC20Upgradeable for BKCToken;

    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    address public bkcTokenAddress;
    
    mapping(string => address) public authorizedMiners;
    bool private tgeMinted;

    // Constants for Dynamic Scarcity Logic (160M Max Mintable Supply)
    uint256 private constant E18 = 10**18;
    uint256 private constant MAX_MINTABLE_SUPPLY = 160000000 * E18;
    uint256 private constant THRESHOLD_80M = 80000000 * E18;
    uint256 private constant THRESHOLD_40M = 40000000 * E18;
    uint256 private constant THRESHOLD_20M = 20000000 * E18;

    function initialize(
        address _ecosystemManagerAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        tgeMinted = false;
        require(_ecosystemManagerAddress != address(0), "MM: Hub cannot be zero");
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(bkcTokenAddress != address(0), "MM: BKC Token not set in Hub");
        bkcToken = BKCToken(bkcTokenAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    function setAuthorizedMiner(string calldata _serviceKey, address _spokeAddress) external onlyOwner {
        require(_spokeAddress != address(0), "MM: Address cannot be zero");
        authorizedMiners[_serviceKey] = _spokeAddress;
    }
    
    function initialTgeMint(address to, uint256 amount) external onlyOwner {
        require(!tgeMinted, "MM: TGE already minted");
        tgeMinted = true;
        bkcToken.mint(to, amount);
    }

    /**
     * @notice Universal revenue funnel for PoP mining (new tokens) and Fee Distribution (existing tokens).
     * @dev The calling contract (Spoke) must have transferred the `_purchaseAmount` (fee) to this contract.
     * @dev UPDATED: Distribution is now split only between Treasury and Delegator Pool (Single Staking Pool).
     */
    function performPurchaseMining(
        string calldata _serviceKey,
        uint256 _purchaseAmount // This is the original fee paid by the user
    ) external nonReentrant {
        require(msg.sender == authorizedMiners[_serviceKey], "MM: Caller not authorized for service");

        address treasury = ecosystemManager.getTreasuryAddress();
        address dm = ecosystemManager.getDelegationManagerAddress();
        require(treasury != address(0) && dm != address(0), "MM: Core addresses not set in Hub");

        // --- 1. MINING DISTRIBUTION (New Tokens) ---
        uint256 totalMintAmount = getMintAmount(_purchaseAmount);

        if (totalMintAmount > 0) {
            uint256 miningTreasuryBips = ecosystemManager.getMiningDistributionBips("TREASURY");
            // "DELEGATOR_POOL" now represents the single Global Staking Pool
            uint256 miningDelegatorBips = ecosystemManager.getMiningDistributionBips("DELEGATOR_POOL");

            require(
                miningTreasuryBips + miningDelegatorBips == 10000,
                "MM: Mining Distribution BIPS must equal 10000 (Treasury + Delegator)"
            );

            uint256 mintTreasuryAmount = (totalMintAmount * miningTreasuryBips) / 10000;
            uint256 mintDelegatorAmount = totalMintAmount - mintTreasuryAmount;

            // Mint the total new amount to this contract
            bkcToken.mint(address(this), totalMintAmount);

            if (mintTreasuryAmount > 0) {
                bkcToken.transfer(treasury, mintTreasuryAmount);
            }

            if (mintDelegatorAmount > 0) {
                bkcToken.approve(dm, mintDelegatorAmount);
                // UPDATED CALL: Only passes the total amount for the single pool
                IDelegationManager(dm).depositMiningRewards(mintDelegatorAmount);
            }
        }

        // --- 2. FEE DISTRIBUTION (Original Tokens) ---
        if (_purchaseAmount > 0) {
            uint256 feeTreasuryBips = ecosystemManager.getFeeDistributionBips("TREASURY");
            uint256 feeDelegatorBips = ecosystemManager.getFeeDistributionBips("DELEGATOR_POOL");

            require(
                feeTreasuryBips + feeDelegatorBips == 10000,
                "MM: Fee Distribution BIPS must equal 10000 (Treasury + Delegator)"
            );

            uint256 feeTreasuryAmount = (_purchaseAmount * feeTreasuryBips) / 10000;
            uint256 feeDelegatorAmount = _purchaseAmount - feeTreasuryAmount;

            // Tokens are already in this contract (transferred by the Spoke)
            if (feeTreasuryAmount > 0) {
                bkcToken.transfer(treasury, feeTreasuryAmount);
            }

            if (feeDelegatorAmount > 0) {
                bkcToken.approve(dm, feeDelegatorAmount);
                // UPDATED CALL: Only passes the total amount for the single pool
                IDelegationManager(dm).depositMiningRewards(feeDelegatorAmount);
            }
        }
    }

    function getMintAmount(uint256 _purchaseAmount) public view returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        if (currentSupply >= maxSupply) {
            return 0;
        }

        // Dynamic Scarcity Calculation
        uint256 remainingToMint = maxSupply - currentSupply;
        uint256 mintRatioBips = 10000; // Default 100% (1.0x)

        if (remainingToMint < THRESHOLD_20M) {
            mintRatioBips = 1250; // 12.5% (0.125x)
        } else if (remainingToMint < THRESHOLD_40M) {
            mintRatioBips = 2500; // 25% (0.25x)
        } else if (remainingToMint < THRESHOLD_80M) {
            mintRatioBips = 5000; // 50% (0.5x)
        }
        
        return (_purchaseAmount * mintRatioBips) / 10000;
    }
    
    function transferTokensFromGuardian(address to, uint256 amount) external onlyOwner {
        bkcToken.transfer(to, amount);
    }
    
    function approveTokensFromGuardian(address spender, uint256 amount) external onlyOwner {
        bkcToken.approve(spender, amount);
    }
}