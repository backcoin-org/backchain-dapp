// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Necessary imports
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol";
// <-- NEW: Import Hub and DM interfaces
import "./EcosystemManager.sol";

/**
 * @title DecentralizedNotary
 * @dev "Spoke" contract refactored to use EcosystemManager.
 * @notice All fees, pStake requirements, and discounts are now
 * managed by the EcosystemManager (Hub).
 */
contract DecentralizedNotary is ERC721Enumerable, Ownable, ReentrancyGuard {

    // --- Ecosystem Contracts ---
    BKCToken public immutable bkcToken;
    // <-- NEW: The Hub that manages the rules
    IEcosystemManager public immutable ecosystemManager;

    // <-- REMOVED: delegationManager
    // <-- REMOVED: treasuryWallet
    // <-- REMOVED: minimumPStakeRequired
    // <-- REMOVED: notarizeFeeBKC
    // <-- REMOVED: treasuryFeeBips

    // --- NFT Storage ---
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _documentURIs;

    // --- State variable for Base URI ---
    string private _baseTokenURI;

    // --- Events ---
    event DocumentNotarized(
        address indexed user,
        uint256 indexed tokenId,
        string documentURI,
        uint256 feePaid
    );
    // <-- REMOVED: event NotarySettingsChanged

    /**
     * @dev Contract constructor.
     * @notice Now receives the address of the Hub (EcosystemManager) and the Token.
     */
    constructor(
        address _bkcTokenAddress,
        address _ecosystemManagerAddress, // <-- NEW
        address _initialOwner
    ) ERC721("Backchain Notary Certificate", "BKCN") Ownable(_initialOwner) {

        require(
            _bkcTokenAddress != address(0) &&
            _ecosystemManagerAddress != address(0), // <-- NEW
            "Notary: Invalid addresses" // <-- CORRECTION: Translated message
        );

        bkcToken = BKCToken(_bkcTokenAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress); // <-- NEW
    }

    // --- Main Function (for Users) ---

    /**
     * @notice Registers a document on the blockchain.
     * @dev The user MUST have the minimum pStake defined in the Hub.
     * @dev The fee is defined in the Hub, and the booster discount is applied.
     * @param _documentURI The hash or URI of the document (e.g., "ipfs://...").
     * @param _boosterTokenId The user's Booster NFT tokenId (sent by the frontend).
     * Send 0 if the user doesn't have or doesn't want to use a booster.
     */
    function notarizeDocument(
        string calldata _documentURI,
        uint256 _boosterTokenId // <-- NEW
    ) external nonReentrant {
        require(bytes(_documentURI).length > 0, "Notary: URI cannot be empty");

        // 1. MASTER KEY: Authorizes and calculates the fee in ONE call
        // This call checks pStake (reverts if insufficient)
        // and returns the final fee with discount applied.
        uint256 finalFee = ecosystemManager.authorizeService(
            "NOTARY_SERVICE", // Service Key (you define this in the Hub)
            msg.sender,       // The user to be checked
            _boosterTokenId   // The "discount coupon"
        );
        // Although authorizeService should handle underflow, add check for safety
        require(finalFee >= 0, "Notary: Invalid fee calculated");

        // 2. GET UPDATED ADDRESSES FROM HUB
        address treasuryWallet = ecosystemManager.getTreasuryAddress();
        address delegationManager = ecosystemManager.getDelegationManagerAddress();
        require(treasuryWallet != address(0), "Notary: Treasury not configured in Hub");
        require(delegationManager != address(0), "Notary: Delegation Manager not configured in Hub");


        // 3. COLLECTION AND DISTRIBUTION (50/50 Rule)

        // Pull the final fee (already discounted) from the user
        require(bkcToken.transferFrom(msg.sender, address(this), finalFee), "Notary: Fee transfer failed");

        uint256 treasuryAmount = finalFee / 2;
        uint256 delegatorAmount = finalFee - treasuryAmount; // Remainder goes to delegators

        // A. Send 50% to Treasury
        if (treasuryAmount > 0) {
            require(bkcToken.transfer(treasuryWallet, treasuryAmount), "Notary: Treasury transfer failed");
        }

        // B. Send 50% to the Delegator pool (BUG FIX)
        if (delegatorAmount > 0) {
            // Approve the DM to pull the tokens
            bkcToken.approve(delegationManager, delegatorAmount);
            // Call the DM, which will now pull the tokens from this contract
            IDelegationManager(delegationManager).depositRewards(0, delegatorAmount);
        }

        // 4. MINT NFT (Original logic)
        uint256 tokenId = _tokenIdCounter++;
        _documentURIs[tokenId] = _documentURI;
        _safeMint(msg.sender, tokenId);

        emit DocumentNotarized(msg.sender, tokenId, _documentURI, finalFee);
    }

    // --- Admin Functions (Owner) ---

    // <-- REMOVED: setNotarySettings (Now done in EcosystemManager)

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    // --- View Functions ---

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Returns the full token URI.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");

        string memory base = _baseURI();
        string memory docURI = _documentURIs[tokenId];

        // If base URI is not set, return document URI directly
        if (bytes(base).length == 0) {
            return docURI;
        }

        // If docURI is already absolute (starts with ipfs://, http://, https://), return it directly
        // Corrected the check for http://
        if (bytes(docURI).length >= 7) {
            bytes memory docBytes = bytes(docURI);
            if ((docBytes[0] == 'i' && docBytes[1] == 'p' && docBytes[2] == 'f' && docBytes[3] == 's' && docBytes[4] == ':' && docBytes[5] == '/' && docBytes[6] == '/') ||
                (docBytes[0] == 'h' && docBytes[1] == 't' && docBytes[2] == 't' && docBytes[3] == 'p' && docBytes[4] == 's' && docBytes[5] == ':' && docBytes[6] == '/') ||
                (docBytes[0] == 'h' && docBytes[1] == 't' && docBytes[2] == 't' && docBytes[3] == 'p' && docBytes[4] == ':' && docBytes[5] == '/' && docBytes[6] == '/')) {
                return docURI;
            }
        }

        // Otherwise, concatenate base URI and document URI
        return string(abi.encodePacked(base, docURI));
    }

    // --- Internal Functions (ERC721Enumerable Overrides) ---
    // (Remain exactly as they were)

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721Enumerable)
    {
         super._increaseBalance(account, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}