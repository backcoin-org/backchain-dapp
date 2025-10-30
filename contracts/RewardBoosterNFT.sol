// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RewardBoosterNFT (V2 - Mint on Demand Support)
 * @notice Allows an authorized sale contract to mint NFTs on demand.
 */
contract RewardBoosterNFT is ERC721, Ownable {
    using Strings for uint256;

    // --- State Variables ---
    mapping(uint256 => uint256) public boostBips; // tokenId => boost value (e.g., 5000)
    mapping(uint256 => string) public tokenMetadataFile; // tokenId => metadata filename (e.g., "diamond.json")
    string private _customBaseURI; // Base URI for metadata (e.g., "ipfs://CID/")
    uint256 private _tokenIdCounter; // Counter for generating new token IDs

    // --- NEW: Address of the Authorized Sale Contract ---
    address public saleContractAddress;
    
    // --- Events ---
    event BoosterMinted(uint256 indexed tokenId, address indexed owner, uint256 boostInBips);
    event SaleContractAddressSet(address indexed saleContract); // New event

    // --- Constructor ---
    constructor(
        address _initialOwner
    ) ERC721("Backchain Reward Booster", "BKCB") Ownable(_initialOwner) {}

    // --- Configuration Functions (Owner Only) ---

    /**
     * @notice (Owner) Sets the base URI for token metadata.
     * @param newBaseURI The base URI string (e.g., "ipfs://your_cid_hash/").
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _customBaseURI = newBaseURI;
    }

    /**
     * @notice (Owner) Sets the address of the PublicSale contract authorized to mint.
     * @param _saleAddress The address of the deployed PublicSale contract.
     */
    function setSaleContractAddress(address _saleAddress) external onlyOwner {
        require(_saleAddress != address(0), "RBNFT: Invalid address");
        saleContractAddress = _saleAddress;
        emit SaleContractAddressSet(_saleAddress);
    }

    // --- Minting Functions ---

    /**
     * @notice (Owner) Mints a batch of NFTs to a specific address.
     * @dev Useful for minting NFTs for initial liquidity or other owner-controlled distributions.
     * @param to The recipient address.
     * @param quantity The number of NFTs to mint.
     * @param boostInBips The boost value for all NFTs in this batch.
     * @param metadataFile The metadata filename for all NFTs in this batch.
     */
    function ownerMintBatch(
        address to,
        uint256 quantity,
        uint256 boostInBips,
        string calldata metadataFile
    ) external onlyOwner {
        require(quantity > 0, "RBNFT: Quantity must be > 0");
        require(to != address(0), "RBNFT: Mint to zero address");
        for (uint256 i = 0; i < quantity; i++) {
            _mintInternal(to, boostInBips, metadataFile);
        }
    }

    /**
     * @notice (PublicSale Contract) Mints a single NFT when called by the authorized sale contract.
     * @param to The address of the buyer receiving the NFT.
     * @param boostInBips The boost value associated with the purchased tier.
     * @param metadataFile The metadata filename for this tier.
     * @return tokenId The ID of the newly created token.
     */
    function mintFromSale(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) external returns (uint256) {
        require(msg.sender == saleContractAddress, "RBNFT: Caller not authorized");
        require(to != address(0), "RBNFT: Mint to zero address");
        return _mintInternal(to, boostInBips, metadataFile);
    }

    /**
     * @dev Internal function for minting logic, called by ownerMintBatch and mintFromSale.
     */
    function _mintInternal(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) internal returns (uint256) {
         uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId); // Mints the NFT

        // Store associated data
        boostBips[tokenId] = boostInBips;
        tokenMetadataFile[tokenId] = metadataFile;

        emit BoosterMinted(tokenId, to, boostInBips);
        return tokenId;
    }


    // --- Transfer Functions (Kept) ---
    // (Useful if the owner needs to move NFTs minted for liquidity, etc.)

    /**
     * @notice Transfers multiple tokens from one address to another.
     * @dev Requires the caller to be the owner or approved for all tokens.
     */
    function batchTransferFrom(address from, address to, uint256[] calldata tokenIds) external {
        // Use `_isApprovedOrOwner` which is internal;
        // alternatively, check approval within the loop
        // require(from == msg.sender || isApprovedForAll(from, msg.sender), "ERC721: caller is not token owner or approved for all");
        for (uint i = 0; i < tokenIds.length; i++) {
            // safeTransferFrom handles ownership and approval checks internally
            safeTransferFrom(from, to, tokenIds[i]);
        }
    }

    // --- View Functions ---

    // Function getHighestBoost still causes revert, forcing off-chain calculation
    function getHighestBoost(address user) public view returns (uint256) {
        revert("RBNFT: Highest boost must be calculated off-chain or requires ERC721Enumerable.");
    }

    // Enumeration function removed
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        revert("RBNFT: Enumeration function removed for gas efficiency.");
    }

    /**
     * @notice Returns the metadata URI for a given token ID.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // ====================================================================
        // ======================= INÍCIO DA CORREÇÃO =======================
        // ====================================================================

        // Usar 'ownerOf' é a forma mais robusta de verificar a existência
        // em todas as versões do OpenZeppelin.
        require(ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");

        // ==================================================================
        // ======================== FIM DA CORREÇÃO =========================
        // ==================================================================

        string memory baseURI = _customBaseURI;
        string memory metadataFile = tokenMetadataFile[tokenId];

        // Returns baseURI + metadataFile if baseURI is set, otherwise just the metadataFile (or empty if not set)
        return bytes(baseURI).length > 0 ?
            string(abi.encodePacked(baseURI, metadataFile)) : metadataFile;
    }

    // --- Internal _exists function override (Standard ERC721 pattern) ---
    /**
     * @dev See {ERC721-_exists}.
     */
     /*
      * The default OpenZeppelin ERC721 _exists check uses internal state (_owners mapping).
      * No need to override unless custom logic is needed.
      * The check in tokenURI() is sufficient.
      * If you *were* using ERC721Enumerable, _exists would be provided.
      */
    // function _exists(uint256 tokenId) internal view returns (bool) {
    //     return ownerOf(tokenId) != address(0);
    // }

    // Use OpenZeppelin's standard _exists if needed elsewhere, otherwise rely on checks in functions like tokenURI
}