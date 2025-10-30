// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19; // Kept the version you used, compatible with OZ 5.x

// Imports with the correct path for OZ v5.x
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Ensure dependencies are installed:
// npm install @openzeppelin/contracts

/**
 * @title SimpleBKCFaucet
 * @dev A simple faucet to distribute BKC tokens once per address.
 */
contract SimpleBKCFaucet is Ownable, ReentrancyGuard {
    IERC20 public immutable token; // Address of the BKC token, set at deploy
    uint256 public immutable claimAmount = 12500 * 10**18; // 12,500 BKC with 18 decimals

    // Mapping to track who has already claimed
    mapping(address => bool) public hasClaimed;

    // Event emitted when someone claims tokens
    event TokensClaimed(address indexed recipient, uint256 amount);

    /**
     * @dev Contract constructor.
     * @param _tokenAddress The address of the ERC20 token contract (BKC).
     */
    constructor(address _tokenAddress) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Faucet: Invalid token address"); // Translated
        token = IERC20(_tokenAddress);
    }

    /**
     * @dev Allows a user to claim the defined amount of tokens, one time only.
     * Ensures the user hasn't claimed before and the faucet has funds.
     * Uses nonReentrant to prevent reentrancy attacks.
     */
    function claim() external nonReentrant {
        require(!hasClaimed[msg.sender], "Faucet: Address has already claimed tokens"); // Translated
        require(token.balanceOf(address(this)) >= claimAmount, "Faucet: Insufficient funds in faucet"); // Translated

        // Mark the user as having claimed *before* the transfer
        hasClaimed[msg.sender] = true;

        // Transfer the tokens
        bool sent = token.transfer(msg.sender, claimAmount);
        require(sent, "Faucet: Token transfer failed"); // Translated

        // Emit the event
        emit TokensClaimed(msg.sender, claimAmount);
    }

    /**
     * @dev Allows the contract owner to withdraw all remaining BKC tokens.
     * Useful for recovering unused funds or moving to another faucet.
     */
    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            bool sent = token.transfer(msg.sender, balance); // Send to owner
            require(sent, "Faucet: Withdrawal transfer failed"); // Translated
        }
    }

    /**
     * @dev Fallback function to reject direct ETH sends to the contract.
     */
    receive() external payable {
        revert("Faucet: Contract does not accept ETH"); // Translated
    }

    /**
     * @dev Allows the owner to withdraw any ETH accidentally sent to the contract.
     */
    function withdrawETH() external onlyOwner {
         (bool success, ) = owner().call{value: address(this).balance}("");
         require(success, "Faucet: ETH withdrawal failed"); // Translated
    }
}