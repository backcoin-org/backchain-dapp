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

    // CONSTRUTOR REMOVIDO PARA EVITAR ERRO DE UPGRADE DE SEGURANÇA (TS9053)

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

    function performPurchaseMining(
        string calldata _serviceKey,
        uint256 _purchaseAmount
    ) external nonReentrant returns (uint256 bonusAmount) {
        // NOTE: The caller (Spoke) must have transferred _purchaseAmount to this contract BEFORE calling.
        require(msg.sender == authorizedMiners[_serviceKey], "MM: Caller not authorized for service");

        uint256 totalMintAmount = getMintAmount(_purchaseAmount);
        if (totalMintAmount == 0) return 0;

        // --- Distribution Rules from Hub ---
        uint256 treasuryShareBips = ecosystemManager.getMiningDistributionBips("TREASURY");
        uint256 validatorShareBips = ecosystemManager.getMiningDistributionBips("VALIDATOR_POOL");
        uint256 delegatorShareBips = ecosystemManager.getMiningDistributionBips("DELEGATOR_POOL");
        uint256 buyerBonusBips = ecosystemManager.getMiningBonusBips(_serviceKey);

        // --- Shares Calculation ---
        uint256 treasuryAmount = (totalMintAmount * treasuryShareBips) / 10000;
        uint256 validatorAmount = (totalMintAmount * validatorShareBips) / 10000;
        uint256 delegatorAmount = (totalMintAmount * delegatorShareBips) / 10000;
        uint256 totalPoolShares = treasuryAmount + validatorAmount + delegatorAmount;
        uint256 baseBonusAmount = totalMintAmount - totalPoolShares;

        // Apply Buyer Bonus Bips
        bonusAmount = (baseBonusAmount * buyerBonusBips) / 10000;

        // --- Execute Minting and Transfer ---
        uint256 finalMintAmount = totalPoolShares + bonusAmount;

        // CRÍTICO: Cunhagem de novos tokens
        bkcToken.mint(address(this), finalMintAmount);

        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasuryAmount > 0) {
            bkcToken.transfer(treasury, treasuryAmount);
        }

        address dm = ecosystemManager.getDelegationManagerAddress();
        uint256 totalDMShare = validatorAmount + delegatorAmount;
        if (totalDMShare > 0) {
            bkcToken.approve(dm, totalDMShare);
            IDelegationManager(dm).depositMiningRewards(validatorAmount, delegatorAmount);
        }
        
        // Retorna o bônus para o Spoke chamador
        if (bonusAmount > 0) {
            bkcToken.transfer(msg.sender, bonusAmount);
        }

        return bonusAmount;
    }

    function getMintAmount(uint256 _purchaseAmount) public view returns (uint256) {
        uint256 maxSupply = bkcToken.MAX_SUPPLY();
        uint256 currentSupply = bkcToken.totalSupply();

        if (currentSupply >= maxSupply) {
            return 0;
        }

        // Cálculo da Escassez Dinâmica
        uint256 remainingToMint = maxSupply - currentSupply;
        uint256 mintRatioBips = 10000; // Default 100%

        if (remainingToMint < THRESHOLD_20M) {
            mintRatioBips = 1250;
        } else if (remainingToMint < THRESHOLD_40M) {
            mintRatioBips = 2500;
        } else if (remainingToMint < THRESHOLD_80M) {
            mintRatioBips = 5000;
        }
        // Se remainingToMint >= 80M, ratio é 100%

        return (_purchaseAmount * mintRatioBips) / 10000;
    }
    
    function transferTokensFromGuardian(address to, uint256 amount) external onlyOwner {
        bkcToken.transfer(to, amount);
    }
    
    function approveTokensFromGuardian(address spender, uint256 amount) external onlyOwner {
        bkcToken.approve(spender, amount);
    }
}