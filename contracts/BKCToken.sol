// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Backcoin ($BKC)
 * @notice The fuel of the Backchain Protocol.
 * @dev Implementation of the ERC20 Token with UUPS Upgradeability and Blacklist mechanism.
 * * --- TOKENOMICS ---
 * Max Supply: 200,000,000 BKC
 * TGE Supply:  40,000,000 BKC (Minted at genesis via Script/Manager)
 * ------------------
 *
 * Part of the Backcoin Ecosystem.
 * Website: Backcoin.org
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

    // --- State Variables (Blacklist) ---
    /// @notice Mapping to store blacklisted addresses
    mapping(address => bool) private _blacklisted;

    // --- Events ---
    /// @notice Emitted when an address is added or removed from the blacklist
    event BlacklistUpdated(address indexed account, bool isBlacklisted);

    // --- Custom Errors ---
    error InvalidAddress();
    error MaxSupplyExceeded();
    /// @notice Thrown when a blacklisted address attempts to transfer or receive tokens
    error AddressBlacklisted(address account);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializer for the Upgradeable contract.
     * @param _initialOwner The address of the initial owner (usually the Deployer or DAO).
     */
    function initialize(address _initialOwner) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();

        __ERC20_init("Backcoin", "BKC");
        
        // CORREÇÃO v4: Ownable_init não recebe argumentos nesta versão
        __Ownable_init(); 
        
        _transferOwnership(_initialOwner);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Blacklist Management ---

    /**
     * @notice Adds or removes an address from the blacklist.
     * @dev Only callable by the contract owner.
     * @param account The address to modify.
     * @param state True to blacklist, false to unblacklist.
     */
    function setBlacklist(address account, bool state) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        _blacklisted[account] = state;
        emit BlacklistUpdated(account, state);
    }

    /**
     * @notice Checks if an address is blacklisted.
     * @param account The address to check.
     * @return True if the address is blacklisted, false otherwise.
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    // --- Overrides (Hook) ---

    /**
     * @dev Hook that is called before any transfer of tokens.
     * CORREÇÃO v4: Usando _beforeTokenTransfer ao invés de _update
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        super._beforeTokenTransfer(from, to, amount);

        // Se "from" não é endereço zero (não é mint) e está na blacklist, reverte
        if (from != address(0) && _blacklisted[from]) {
            revert AddressBlacklisted(from);
        }
        // Se "to" não é endereço zero (não é burn) e está na blacklist, reverte
        if (to != address(0) && _blacklisted[to]) {
            revert AddressBlacklisted(to);
        }
    }

    // --- Mint Function (For the MiningManager) ---

    /**
     * @dev Allows the owner (MiningManager) to mint new tokens up to MAX_SUPPLY.
     * @param to The address receiving the tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();
        _mint(to, amount);
    }
}