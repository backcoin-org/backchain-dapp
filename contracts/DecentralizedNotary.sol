// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Imports for ERC721, Ownable, Reentrancy
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// --- NEW IMPORTS FOR JSON GENERATION ---
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// Ecosystem Imports
import "./BKCToken.sol";
import "./EcosystemManager.sol";

/**
 * @title DecentralizedNotary
 * @dev "Spoke" contract refactored to use EcosystemManager.
 * @notice Fees, pStake, and discounts are now managed by the Hub.
 * @notice NOW INCLUDES: User description and full on-chain metadata.
 */
contract DecentralizedNotary is ERC721Enumerable, Ownable, ReentrancyGuard {

    // --- NEW TOOLS FOR JSON ---
    using Strings for uint256;

    // --- Constants ---
    uint256 public constant MAX_DESCRIPTION_LENGTH = 256;
    
    // --- Constante para conversão Hex ---
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

    // --- Ecosystem Contracts ---
    BKCToken public immutable bkcToken;
    IEcosystemManager public immutable ecosystemManager;

    // --- NFT Storage ---
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _documentURIs;
    mapping(uint256 => uint256) private _mintTimestamps;
    mapping(uint256 => string) private _userDescriptions;

    // --- State variable for Base URI ---
    string private _baseTokenURI;

    // --- Events ---
    event DocumentNotarized(
        address indexed user,
        uint256 indexed tokenId,
        string documentURI,
        uint256 feePaid
    );

    /**
     * @dev Contract constructor.
     */
    constructor(
        address _bkcTokenAddress,
        address _ecosystemManagerAddress,
        address _initialOwner
    ) ERC721("Backchain Notary Certificate", "BKCN") Ownable(_initialOwner) {
        require(
            _bkcTokenAddress != address(0) &&
            _ecosystemManagerAddress != address(0),
            "Notary: Invalid addresses"
        );
        bkcToken = BKCToken(_bkcTokenAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
    }

    // --- Main Function (for Users) ---

    /**
     * @notice Registers a document on the blockchain with a custom description.
     * @param _documentURI The hash or URI of the document (e.g., "ipfs://...").
     * @param _userDescription A description text up to 256 characters.
     * @param _boosterTokenId The user's Booster NFT tokenId (0 if none).
     */
    function notarizeDocument(
        string calldata _documentURI,
        string calldata _userDescription,
        uint256 _boosterTokenId
    ) external nonReentrant {
        require(bytes(_documentURI).length > 0, "Notary: URI cannot be empty");
        
        require(
            bytes(_userDescription).length <= MAX_DESCRIPTION_LENGTH,
            "Notary: Description exceeds 256 characters"
        );

        // 1. Authorize service and calculate final fee (with discount)
        uint256 finalFee = ecosystemManager.authorizeService(
            "NOTARY_SERVICE",
            msg.sender,
            _boosterTokenId
        );

        require(finalFee >= 0, "Notary: Invalid fee calculated");

        // 2. Get addresses from Hub
        address treasuryWallet = ecosystemManager.getTreasuryAddress();
        address delegationManager = ecosystemManager.getDelegationManagerAddress();
        require(treasuryWallet != address(0), "Notary: Treasury not configured");
        require(delegationManager != address(0), "Notary: DM not configured");

        // 3. Fee Collection and Distribution (50/50)
        if (finalFee > 0) {
            require(bkcToken.transferFrom(msg.sender, address(this), finalFee), "Notary: Fee transfer failed");
            
            uint256 treasuryAmount = finalFee / 2;
            uint256 delegatorAmount = finalFee - treasuryAmount;

            if (treasuryAmount > 0) {
                require(bkcToken.transfer(treasuryWallet, treasuryAmount), "Notary: Treasury transfer failed");
            }
            if (delegatorAmount > 0) {
                bkcToken.approve(delegationManager, delegatorAmount);
                IDelegationManager(delegationManager).depositRewards(0, delegatorAmount);
            }
        }

        // 4. Mint NFT and Store Data
        uint256 tokenId = _tokenIdCounter++;
        _documentURIs[tokenId] = _documentURI;
        _mintTimestamps[tokenId] = block.timestamp;
        _userDescriptions[tokenId] = _userDescription;

        _safeMint(msg.sender, tokenId);

        emit DocumentNotarized(msg.sender, tokenId, _documentURI, finalFee);
    }

    // --- Admin Functions (Owner) ---

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    // --- View Functions ---

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Returns the full token URI, generating on-chain JSON.
     * @dev Builds an EIP-721 compatible JSON and Base64 encodes it.
     * OPTIMIZED: Reduced local variables to avoid "Stack too deep" error.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");

        // Build JSON in parts to reduce stack pressure
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(_buildTokenJSON(tokenId)))
        ));
    }
    
    /**
     * @dev Internal function to build the JSON metadata.
     * Separated to reduce stack depth in tokenURI.
     */
    function _buildTokenJSON(uint256 tokenId) private view returns (string memory) {
        // Build the attestation string
        string memory attestation = string(abi.encodePacked(
            "Notarized by backcoin.org decentralized notary on ",
            _mintTimestamps[tokenId].toString(),
            ", wallet ",
            _addressToString(ownerOf(tokenId))
        ));

        // Build and return the complete JSON
        return string(abi.encodePacked(
            _buildJSONPart1(tokenId),
            _buildJSONPart2(tokenId, attestation)
        ));
    }

    /**
     * @dev Build first part of JSON (name, description, image)
     */
    function _buildJSONPart1(uint256 tokenId) private view returns (string memory) {
        return string(abi.encodePacked(
            '{',
                '"name": "Backchain Notary Certificate #', tokenId.toString(), '",',
                '"description": "', _userDescriptions[tokenId], '",',
                '"image": "', _documentURIs[tokenId], '",'
        ));
    }

    /**
     * @dev Build second part of JSON (attributes)
     */
    function _buildJSONPart2(uint256 tokenId, string memory attestation) private view returns (string memory) {
        return string(abi.encodePacked(
                '"attributes": [',
                    '{ "trait_type": "Timestamp", "display_type": "date", "value": ', 
                    _mintTimestamps[tokenId].toString(), 
                    ' },',
                    '{ "trait_type": "Attestation", "value": "', attestation, '" }',
                ']',
            '}'
        ));
    }
    
    /**
     * @dev Converts an address to its string representation (0x...).
     */
    function _addressToString(address account) private pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            uint8 b = uint8(bytes20(account)[i]);
            buffer[2 + i * 2] = _HEX_SYMBOLS[b >> 4];
            buffer[3 + i * 2] = _HEX_SYMBOLS[b & 0x0f];
        }
        return string(buffer);
    }


    // --- Internal Functions (ERC721Enumerable Overrides) ---

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