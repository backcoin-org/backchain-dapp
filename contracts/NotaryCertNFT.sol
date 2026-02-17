// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================================
// NOTARY CERT NFT — Read-Only ERC-721 Wrapper (Immutable)
// ============================================================================
//
// Lightweight ERC-721 view contract that wraps the Notary contract.
// - ownerOf() reads live from Notary (always in sync)
// - tokenURI() returns API endpoint URL for ERC-721 metadata
// - No transfers (all cert management via Notary contract)
// - No minting (any existing Notary cert is automatically visible)
//
// Deploy once, never upgrade. Zero admin. Zero state changes.
//
// ============================================================================

interface INotary {
    function certById(uint256 certId) external view returns (bytes32);
    function certs(bytes32 hash) external view returns (
        address owner, uint48 timestamp, uint8 docType, uint32 boostExpiry
    );
    function certCount() external view returns (uint256);
}

contract NotaryCertNFT {

    // ERC165 interface IDs
    bytes4 private constant ERC165_ID          = 0x01ffc9a7;
    bytes4 private constant ERC721_ID          = 0x80ac58cd;
    bytes4 private constant ERC721_METADATA_ID = 0x5b5e139f;

    string public constant name   = "Backchain Notary Certificate";
    string public constant symbol = "BKCN";

    INotary public immutable notary;
    string  public baseTokenURI;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    error TokenNotFound();
    error TransfersDisabled();

    constructor(address _notary, string memory _baseTokenURI) {
        notary = INotary(_notary);
        baseTokenURI = _baseTokenURI;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERC-165
    // ═══════════════════════════════════════════════════════════════════════

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == ERC165_ID
            || interfaceId == ERC721_ID
            || interfaceId == ERC721_METADATA_ID;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERC-721 VIEWS (read-only delegation to Notary)
    // ═══════════════════════════════════════════════════════════════════════

    function ownerOf(uint256 tokenId) external view returns (address owner) {
        bytes32 hash = notary.certById(tokenId);
        if (hash == bytes32(0)) revert TokenNotFound();
        (owner,,,) = notary.certs(hash);
        if (owner == address(0)) revert TokenNotFound();
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        bytes32 hash = notary.certById(tokenId);
        if (hash == bytes32(0)) revert TokenNotFound();
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId)));
    }

    function balanceOf(address) external pure returns (uint256) {
        return 1; // Approximate — MetaMask needs non-zero for display
    }

    function totalSupply() external view returns (uint256) {
        return notary.certCount();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERC-721 MUTATIONS — ALL DISABLED
    // ═══════════════════════════════════════════════════════════════════════

    function approve(address, uint256) external pure { revert TransfersDisabled(); }
    function setApprovalForAll(address, bool) external pure { revert TransfersDisabled(); }
    function getApproved(uint256) external pure returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }
    function transferFrom(address, address, uint256) external pure { revert TransfersDisabled(); }
    function safeTransferFrom(address, address, uint256) external pure { revert TransfersDisabled(); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert TransfersDisabled(); }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════════════════

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
