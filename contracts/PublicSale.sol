// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EcosystemManager.sol"; // We need the Hub for the treasury
// IRewardBoosterNFT interface is imported via EcosystemManager.sol

/**
 * @title PublicSale (V4 - Limited Supply)
 * @dev Sells NFTs by minting them on demand, paid in BNB.
 * @notice V4: Re-introduced maxSupply to create scarcity.
 */
contract PublicSale is Ownable {
    IRewardBoosterNFT public immutable rewardBoosterNFT; // This still works due to the import
    IEcosystemManager public immutable ecosystemManager;

    struct Tier {
        uint256 priceInWei;   // Price in Wei (BNB)
        uint256 maxSupply;    // <-- NEW: Maximum supply for this tier
        uint256 mintedCount;  // How many have been sold
        uint256 boostBips;    // The associated boost (e.g., 5000)
        string metadataFile;  // JSON file name/URI
        bool isConfigured;  // Flag to know if the tier is set
    }

    mapping(uint256 => Tier) public tiers;

    event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price);
    event TierSet(uint256 indexed tierId, uint256 price, uint256 maxSupply); // <-- NEW: Added maxSupply

    /**
     * @dev Constructor receives the RewardBoosterNFT and Hub addresses.
     */
    constructor(
        address _rewardBoosterAddress, // <-- Address of the contract that MINTS
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_rewardBoosterAddress != address(0), "Sale: Invalid Booster NFT Contract");
        require(_ecosystemManagerAddress != address(0), "Sale: Invalid Hub");

        rewardBoosterNFT = IRewardBoosterNFT(_rewardBoosterAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
    }

    /**
     * @notice (Owner) Configures a sale tier: price, max supply, boost, and metadata.
     * @param _tierId The tier ID (e.g., 0 for Diamond).
     * @param _priceInWei The price of the NFT in Wei (BNB).
     * @param _maxSupply The maximum number of NFTs that can be minted for this tier.
     * @param _boostBips The boost value in BIPS (e.g., 500 for Iron).
     * @param _metadataFile The name/URI of the JSON metadata file.
     */
    function setTier(
        uint256 _tierId,
        uint256 _priceInWei,
        uint256 _maxSupply, // <-- NEW
        uint256 _boostBips,
        string calldata _metadataFile
    ) external onlyOwner {
        Tier storage tier = tiers[_tierId];

        // Allow re-setting a tier, which also resets the minted count
        tier.priceInWei = _priceInWei;
        tier.maxSupply = _maxSupply; // <-- NEW
        tier.mintedCount = 0; // Resets count if reconfigured
        tier.boostBips = _boostBips;
        tier.metadataFile = _metadataFile;
        tier.isConfigured = true; // Mark as configured

        emit TierSet(_tierId, _priceInWei, _maxSupply);
    }

    /**
     * @notice (User) Buys a single NFT from a tier, paying in BNB.
     */
    function buyNFT(uint256 _tierId) external payable {
        buyMultipleNFTs(_tierId, 1);
    }

    /**
     * @notice (User) Buys multiple NFTs from a tier, paying in BNB.
     * @dev Calls the mint function on the RewardBoosterNFT.
     */
    function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) public payable {
        require(_quantity > 0, "Sale: Quantity must be > 0");
        Tier storage tier = tiers[_tierId];
        require(tier.isConfigured, "Sale: Tier not configured");

        uint256 totalPrice = tier.priceInWei * _quantity;
        require(msg.value == totalPrice, "Sale: Incorrect BNB value");

        // --- NEW: Stock check re-enabled ---
        require(
            tier.mintedCount + _quantity <= tier.maxSupply,
            "Sale: Sold out for this tier"
        );
        // -------------------------------------

        // Update count (optimistic update)
        tier.mintedCount += _quantity;

        // Call the mint function on RewardBoosterNFT for each unit
        for (uint i = 0; i < _quantity; i++) {
            // Call the external function on RewardBoosterNFT
            uint256 newTokenId = rewardBoosterNFT.mintFromSale(
                msg.sender,         // 'to' (the buyer)
                tier.boostBips,     // Tier's boost
                tier.metadataFile   // Tier's metadata
            );

            // Emit event with the ID of the token returned
            emit NFTSold(msg.sender, _tierId, newTokenId, tier.priceInWei);
        }
    }

    /**
     * @notice (Owner) Rescues the BNB funds accumulated in the contract.
     * @dev Fetches the treasury address from the Hub.
     */
    function withdrawFunds() external onlyOwner {
        // Fetch address from Hub
        address treasuryWallet = ecosystemManager.getTreasuryAddress();
        require(treasuryWallet != address(0), "Sale: Treasury not configured in Hub");

        uint256 balance = address(this).balance;
        if (balance > 0) {
            // Send the BNB balance to the treasury
            (bool success, ) = treasuryWallet.call{value: balance}("");
            require(success, "Sale: BNB withdrawal failed");
        }
    }
}