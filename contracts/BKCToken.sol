// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BKCToken
 * @dev The main token contract for the Backchain ecosystem.
 * @notice CHANGED: The fee on P2P transfers has been REMOVED to ensure
 * maximum compatibility with the DeFi ecosystem.
 */
contract BKCToken is ERC20, Ownable {
    // --- Constants ---
    uint256 public constant MAX_SUPPLY = 200_000_000 * 10**18;
    uint256 public constant TGE_SUPPLY = 40_000_000 * 10**18;

    // --- System Addresses ---
    // Kept for reference, but no longer used in transfer logic.
    address public treasuryWallet;
    address public delegationManagerAddress;
    address public rewardManagerAddress;

    // --- Events ---
    event TreasuryWalletSet(address indexed treasury);
    event DelegationManagerSet(address indexed manager);
    event RewardManagerSet(address indexed manager);

    /**
     * @dev Constructor mints the initial TGE supply to the owner.
     * @param _initialOwner The initial owner of the contract and TGE supply.
     */
    constructor(address _initialOwner) ERC20("Backcoin", "BKC") Ownable(_initialOwner) {
        require(_initialOwner != address(0), "BKC: Owner cannot be zero address"); // Translated
        _mint(_initialOwner, TGE_SUPPLY);
    }

    // --- Configuration Functions (Owner Only) ---

    /**
     * @notice (Owner) Sets the treasury wallet address.
     * @dev Used for reference or potential future use. Not used in current transfer logic.
     */
    function setTreasuryWallet(address _treasury) external onlyOwner {
        require(_treasury != address(0), "BKC: Treasury cannot be zero address"); // Translated
        treasuryWallet = _treasury;
        emit TreasuryWalletSet(_treasury);
    }

    /**
     * @notice (Owner) Sets the Delegation Manager address.
     * @dev Used for reference or potential future use. Not used in current transfer logic.
     */
    function setDelegationManager(address _manager) external onlyOwner {
        require(_manager != address(0), "BKC: Manager cannot be zero address"); // Translated
        delegationManagerAddress = _manager;
        emit DelegationManagerSet(_manager);
    }

    /**
     * @notice (Owner) Sets the Reward Manager address.
     * @dev Used for reference or potential future use. Not used in current transfer logic.
     */
    function setRewardManager(address _manager) external onlyOwner {
        require(_manager != address(0), "BKC: RewardManager cannot be zero address"); // Translated
        rewardManagerAddress = _manager;
        emit RewardManagerSet(_manager);
    }

    // --- Core Transfer Logic ---

    /**
     * @dev Overrides the internal _update function from ERC20.
     * @notice The fee logic has been removed. This is now a standard ERC20 transfer.
     */
    function _update(address from, address to, uint256 amount) internal virtual override {
        // Fee logic removed. Executes a standard transfer.
        super._update(from, to, amount);
    }

    // --- Mint Function ---

    /**
     * @dev Allows the owner (intended to be the RewardManager after ownership transfer)
     * to create new tokens up to MAX_SUPPLY.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint (in Wei).
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "BKC: Exceeds max supply"); // Translated
        _mint(to, amount);
    }
}