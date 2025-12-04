// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Simple BKC Faucet
 * @notice Dispenses $BKC for testing ecosystem interactions.
 * @dev Restricted rate limiting or whitelist logic can be added here.
 * Optimized for Arbitrum Network.
 */
contract SimpleBKCFaucet is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable public token;
    
    uint256 public constant CLAIM_AMOUNT = 20 * 10**18;

    // --- Events ---
    event TokensClaimed(address indexed recipient, uint256 amount);

    // --- Errors ---
    error InvalidAddress();
    error InsufficientFaucetBalance();
    error TransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _tokenAddress,
        address _initialOwner
    ) public initializer {
        if (_tokenAddress == address(0)) revert InvalidAddress();
        if (_initialOwner == address(0)) revert InvalidAddress();

        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        token = IERC20Upgradeable(_tokenAddress);
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function claim() external nonReentrant {
        if (token.balanceOf(address(this)) < CLAIM_AMOUNT) revert InsufficientFaucetBalance();
        token.safeTransfer(msg.sender, CLAIM_AMOUNT);
        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }

    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.safeTransfer(owner(), balance);
        }
    }

    function withdrawNativeCurrency() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner().call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }

    receive() external payable {
        revert TransferFailed(); // Reject direct native transfers
    }
}