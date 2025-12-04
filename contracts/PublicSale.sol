// SPDX-License-Identifier: MIT 
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./IInterfaces.sol";

/**
 * @title Public Sale
 * @notice Distributes Reward Booster NFTs ($BKCB) to early adopters.
 * @dev Funds are routed to the Ecosystem Treasury.
 * Optimized for Arbitrum Network.
 */
contract PublicSale is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    IRewardBoosterNFT public rewardBoosterNFT;
    IEcosystemManager public ecosystemManager;

    // Optimized Struct (Packed to save storage slots)
    struct Tier {
        uint256 priceInWei;   // Slot 0 (32 bytes)
        uint64 maxSupply;     // Slot 1 (8 bytes)
        uint64 mintedCount;   // Slot 1 (8 bytes)
        uint16 boostBips;     // Slot 1 (2 bytes)
        bool isConfigured;    // Slot 1 (1 byte)
        // Slot 1 has ~13 bytes left
        string metadataFile;  // Dynamic storage
    }

    mapping(uint256 => Tier) public tiers;

    // --- Events ---
    event NFTSold(
        address indexed buyer,
        uint256 indexed tierId,
        uint256 indexed tokenId,
        uint256 price
    );
    event TierSet(uint256 indexed tierId, uint256 price, uint256 maxSupply);
    event TierPriceUpdated(uint256 indexed tierId, uint256 newPrice);

    // --- Custom Errors ---
    error InvalidAddress();
    error InvalidAmount();
    error InvalidTier();
    error TierNotConfigured();
    error SoldOut();
    error IncorrectValue();
    error WithdrawFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _rewardBoosterAddress,
        address _ecosystemManagerAddress,
        address _initialOwner
    ) public initializer {
        if (_rewardBoosterAddress == address(0)) revert InvalidAddress();
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();
        if (_initialOwner == address(0)) revert InvalidAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();

        rewardBoosterNFT = IRewardBoosterNFT(_rewardBoosterAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin ---

    function setTier(
        uint256 _tierId,
        uint256 _priceInWei,
        uint64 _maxSupply, // Optimized type
        uint16 _boostBips, // Optimized type
        string calldata _metadataFile
    ) external onlyOwner {
        Tier storage tier = tiers[_tierId];
        tier.priceInWei = _priceInWei;
        tier.maxSupply = _maxSupply;
        tier.mintedCount = 0;
        tier.boostBips = _boostBips;
        tier.metadataFile = _metadataFile;
        tier.isConfigured = true;

        emit TierSet(_tierId, _priceInWei, _maxSupply);
    }

    function updateTierPrice(uint256 _tierId, uint256 _newPriceInWei) external onlyOwner {
        if (!tiers[_tierId].isConfigured) revert TierNotConfigured();
        if (_newPriceInWei == 0) revert InvalidAmount();

        tiers[_tierId].priceInWei = _newPriceInWei;
        emit TierPriceUpdated(_tierId, _newPriceInWei);
    }

    function withdrawFunds() external onlyOwner {
        address treasuryWallet = ecosystemManager.getTreasuryAddress();
        if (treasuryWallet == address(0)) revert InvalidAddress();

        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = treasuryWallet.call{value: balance}("");
            if (!success) revert WithdrawFailed();
        }
    }

    // --- Purchase Logic ---

    function buyNFT(uint256 _tierId) external payable {
        buyMultipleNFTs(_tierId, 1);
    }

    function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) public payable {
        if (_quantity == 0) revert InvalidAmount();
        
        Tier storage tier = tiers[_tierId];
        if (!tier.isConfigured) revert TierNotConfigured();

        // Check Supply
        if (tier.mintedCount + _quantity > tier.maxSupply) revert SoldOut();

        // Check Price
        uint256 totalPrice = tier.priceInWei * _quantity;
        if (msg.value != totalPrice) revert IncorrectValue();

        // Update State
        tier.mintedCount += uint64(_quantity);

        // Mint Loop
        for (uint i = 0; i < _quantity;) {
            uint256 newTokenId = rewardBoosterNFT.mintFromSale(
                msg.sender,
                tier.boostBips,
                tier.metadataFile
            );
            emit NFTSold(msg.sender, _tierId, newTokenId, tier.priceInWei);
            unchecked { ++i; }
        }
    }
}