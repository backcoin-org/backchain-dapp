// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BKCToken (Backcoin)
 * @author Backchain Protocol
 * @notice The native utility token powering the Backchain ecosystem
 * 
 * @dev Backcoin ($BKC) is the fuel of the Backchain Protocol - a modular ecosystem
 *      designed to bridge Web2, Web3, and Real World Assets (RWA) into a unified,
 *      accessible, and transparent infrastructure.
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                   BACKCHAIN PROTOCOL                            │
 *      │         "Bridging Web2, Web3 & Real World Assets"               │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │                                                                 │
 *      │   ┌─────────┐      ┌─────────┐      ┌─────────┐                 │
 *      │   │  Web2   │ ◄──► │   BKC   │ ◄──► │  Web3   │                 │
 *      │   │         │      │  Token  │      │         │                 │
 *      │   └─────────┘      └────┬────┘      └─────────┘                 │
 *      │                         │                                       │
 *      │                         ▼                                       │
 *      │                   ┌─────────┐                                   │
 *      │                   │   RWA   │                                   │
 *      │                   │ (Real   │                                   │
 *      │                   │ World)  │                                   │
 *      │                   └─────────┘                                   │
 *      │                                                                 │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      Token Characteristics:
 *      - Fixed maximum supply with deflationary burn mechanism
 *      - Proof-of-Purchase mining with linear scarcity curve
 *      - UUPS upgradeable for future improvements
 *      - Blacklist mechanism for regulatory compliance
 *
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │                      TOKENOMICS                                 │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │  Max Supply:       200,000,000 BKC                              │
 *      │  TGE Supply:        40,000,000 BKC (20%)                        │
 *      │  Mining Reserve:   160,000,000 BKC (80%)                        │
 *      ├─────────────────────────────────────────────────────────────────┤
 *      │  Mining Model:     Proof-of-Purchase (PoP)                      │
 *      │  Scarcity Curve:   Linear decreasing rate                       │
 *      │  Burn Mechanism:   Deflationary pressure via ecosystem usage    │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 *      Ecosystem Modules (Modular & Plug-and-Play):
 *      ┌─────────────────────────────────────────────────────────────────┐
 *      │  Module              │ Function                                 │
 *      ├──────────────────────┼──────────────────────────────────────────┤
 *      │  DelegationManager   │ Staking & weighted reward distribution   │
 *      │  MiningManager       │ PoP mining & fee distribution engine     │
 *      │  FortunePool         │ Prediction games & entertainment         │
 *      │  DecentralizedNotary │ Document certification & timestamping    │
 *      │  NFTLiquidityPool    │ AMM for RewardBooster NFT trading        │
 *      │  CharityPool         │ Crowdfunding with burn mechanism         │
 *      │  [Future Modules]    │ Unlimited expansion possibilities        │
 *      └─────────────────────────────────────────────────────────────────┘
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract BKCToken is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Maximum token supply (200 million with 18 decimals)
    uint256 public constant MAX_SUPPLY = 200_000_000 * 1e18;

    /// @notice Initial TGE supply (40 million with 18 decimals)
    uint256 public constant TGE_SUPPLY = 40_000_000 * 1e18;

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Addresses blocked from transfers
    mapping(address => bool) private _blacklisted;

    /// @notice Total tokens burned (for tracking deflation)
    uint256 public totalBurned;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when blacklist status changes
    event BlacklistUpdated(
        address indexed account,
        bool indexed isBlacklisted,
        address indexed updatedBy
    );

    /// @notice Emitted when tokens are minted
    event TokensMinted(
        address indexed to,
        uint256 amount,
        uint256 newTotalSupply
    );

    /// @notice Emitted when tokens are burned
    event TokensBurned(
        address indexed from,
        uint256 amount,
        uint256 newTotalSupply,
        uint256 totalBurnedAllTime
    );

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error AddressBlacklisted(address account);
    error ArrayLengthMismatch();
    error InsufficientBalance(uint256 requested, uint256 available);
    error InsufficientAllowance(uint256 requested, uint256 available);

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the BKC token contract
     * @param _owner Contract owner (typically MiningManager or deployer initially)
     */
    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __ERC20_init("Backcoin", "BKC");
        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         MINT FUNCTIONS
    // =========================================================================

    /**
     * @notice Mints new tokens to an address
     * @dev Only callable by owner (MiningManager)
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();

        uint256 available = MAX_SUPPLY - totalSupply();
        if (_amount > available) {
            revert MaxSupplyExceeded(_amount, available);
        }

        _mint(_to, _amount);

        emit TokensMinted(_to, _amount, totalSupply());
    }

    /**
     * @notice Mints tokens to multiple addresses in a single transaction
     * @dev Only callable by owner. Useful for TGE distribution.
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to mint
     */
    function mintBatch(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external onlyOwner {
        uint256 length = _recipients.length;
        if (length != _amounts.length) revert ArrayLengthMismatch();

        uint256 totalToMint;
        for (uint256 i = 0; i < length;) {
            totalToMint += _amounts[i];
            unchecked { ++i; }
        }

        uint256 available = MAX_SUPPLY - totalSupply();
        if (totalToMint > available) {
            revert MaxSupplyExceeded(totalToMint, available);
        }

        for (uint256 i = 0; i < length;) {
            if (_recipients[i] == address(0)) revert ZeroAddress();
            if (_amounts[i] > 0) {
                _mint(_recipients[i], _amounts[i]);
                emit TokensMinted(_recipients[i], _amounts[i], totalSupply());
            }
            unchecked { ++i; }
        }
    }

    // =========================================================================
    //                         BURN FUNCTIONS
    // =========================================================================

    /**
     * @notice Burns tokens from caller's balance
     * @dev Anyone can burn their own tokens. Creates deflationary pressure.
     *      This is a fundamental capability enabling ecosystem modules to
     *      implement burn mechanics without requiring token contract changes.
     *
     * @param _amount Amount of tokens to burn
     */
    function burn(uint256 _amount) external {
        if (_amount == 0) revert ZeroAmount();
        
        uint256 balance = balanceOf(msg.sender);
        if (_amount > balance) {
            revert InsufficientBalance(_amount, balance);
        }

        _burn(msg.sender, _amount);
        
        unchecked {
            totalBurned += _amount;
        }

        emit TokensBurned(msg.sender, _amount, totalSupply(), totalBurned);
    }

    /**
     * @notice Burns tokens from a specific address (requires allowance)
     * @dev Allows approved contracts to burn tokens on behalf of users.
     *      Caller must have sufficient allowance from `_from`.
     *
     * @param _from Address to burn tokens from
     * @param _amount Amount of tokens to burn
     */
    function burnFrom(address _from, uint256 _amount) external {
        if (_from == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();

        uint256 currentAllowance = allowance(_from, msg.sender);
        if (_amount > currentAllowance) {
            revert InsufficientAllowance(_amount, currentAllowance);
        }

        uint256 balance = balanceOf(_from);
        if (_amount > balance) {
            revert InsufficientBalance(_amount, balance);
        }

        // Decrease allowance
        _spendAllowance(_from, msg.sender, _amount);
        
        // Burn tokens
        _burn(_from, _amount);
        
        unchecked {
            totalBurned += _amount;
        }

        emit TokensBurned(_from, _amount, totalSupply(), totalBurned);
    }

    // =========================================================================
    //                       BLACKLIST MANAGEMENT
    // =========================================================================

    /**
     * @notice Adds or removes an address from the blacklist
     * @dev Only callable by owner. Used for compliance and security.
     * @param _account Address to modify
     * @param _isBlacklisted True to blacklist, false to remove
     */
    function setBlacklist(address _account, bool _isBlacklisted) external onlyOwner {
        if (_account == address(0)) revert ZeroAddress();

        _blacklisted[_account] = _isBlacklisted;

        emit BlacklistUpdated(_account, _isBlacklisted, msg.sender);
    }

    /**
     * @notice Batch updates blacklist status for multiple addresses
     * @param _accounts Array of addresses
     * @param _isBlacklisted True to blacklist, false to remove
     */
    function setBlacklistBatch(
        address[] calldata _accounts,
        bool _isBlacklisted
    ) external onlyOwner {
        uint256 length = _accounts.length;

        for (uint256 i = 0; i < length;) {
            if (_accounts[i] != address(0)) {
                _blacklisted[_accounts[i]] = _isBlacklisted;
                emit BlacklistUpdated(_accounts[i], _isBlacklisted, msg.sender);
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Checks if an address is blacklisted
     * @param _account Address to check
     * @return True if blacklisted
     */
    function isBlacklisted(address _account) external view returns (bool) {
        return _blacklisted[_account];
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns remaining mintable supply
     * @dev Accounts for burned tokens - they free up space for new minting
     * @return Tokens remaining until max supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        uint256 current = totalSupply();
        return current >= MAX_SUPPLY ? 0 : MAX_SUPPLY - current;
    }

    /**
     * @notice Returns circulating supply
     * @return Current circulating supply
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @notice Returns token statistics
     * @return maxSupply Maximum possible supply
     * @return currentSupply Current total supply
     * @return mintable Remaining mintable tokens
     * @return burned Total tokens burned all time
     */
    function getTokenStats() external view returns (
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 mintable,
        uint256 burned
    ) {
        currentSupply = totalSupply();
        return (
            MAX_SUPPLY,
            currentSupply,
            currentSupply >= MAX_SUPPLY ? 0 : MAX_SUPPLY - currentSupply,
            totalBurned
        );
    }

    /**
     * @notice Returns percentage of max supply minted
     * @return Percentage in basis points (10000 = 100%)
     */
    function mintedPercentage() external view returns (uint256) {
        return (totalSupply() * 10000) / MAX_SUPPLY;
    }

    /**
     * @notice Returns burn statistics
     * @return burnedTotal Total tokens burned all time
     * @return burnedPercentage Percentage of ever-minted tokens that were burned (bips)
     */
    function getBurnStats() external view returns (
        uint256 burnedTotal,
        uint256 burnedPercentage
    ) {
        burnedTotal = totalBurned;
        // Calculate percentage of total ever minted (current supply + burned)
        uint256 totalEverMinted = totalSupply() + totalBurned;
        burnedPercentage = totalEverMinted > 0 
            ? (totalBurned * 10000) / totalEverMinted 
            : 0;
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Hook called before any token transfer
     *      Enforces blacklist restrictions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);

        // Check sender (skip for minting)
        if (from != address(0) && _blacklisted[from]) {
            revert AddressBlacklisted(from);
        }

        // Check recipient (skip for burning)
        if (to != address(0) && _blacklisted[to]) {
            revert AddressBlacklisted(to);
        }
    }
}
