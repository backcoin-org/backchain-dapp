// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Backcoin ($BKC)
 * @notice The fuel of the Backchain Protocol.
 * @dev Implementation of the ERC20 Token with UUPS Upgradeability.
 * Optimized for Arbitrum Network.
 */
contract BKCToken is 
    Initializable, 
    ERC20Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    // --- Constants ---
    uint256 public constant MAX_SUPPLY = 200000000 * 10**18;
    uint256 public constant TGE_SUPPLY = 40000000 * 10**18;

    // --- Custom Errors ---
    error InvalidAddress();
    error MaxSupplyExceeded();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializer for the Upgradeable contract.
     */
    function initialize(
        address _initialOwner
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();

        __ERC20_init("Backcoin", "BKC");
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Mint Function (For the MiningManager) ---

    /**
     * @dev Allows the owner (MiningManager) to mint new tokens up to MAX_SUPPLY.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();
        _mint(to, amount);
    }
}