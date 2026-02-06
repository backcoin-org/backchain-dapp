// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *                    ██╗   ██╗███╗   ██╗███████╗████████╗ ██████╗ ██████╗
 *                    ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
 *                    ██║   ██║██╔██╗ ██║███████╗   ██║   ██║   ██║██████╔╝
 *                    ██║   ██║██║╚██╗██║╚════██║   ██║   ██║   ██║██╔═══╝
 *                    ╚██████╔╝██║ ╚████║███████║   ██║   ╚██████╔╝██║
 *                     ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : BKCToken (Backcoin)
 *  Version     : 2.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  THE BLOOD OF THE ORGANISM
 *
 *  BKC is the lifeblood that flows through all veins of the Backchain
 *  ecosystem. Every transaction, every service, every interaction -
 *  BKC is there, circulating and keeping everything alive.
 *
 *  Just like blood in a living organism:
 *  - It never stops flowing
 *  - It reaches every part of the system
 *  - It carries value and energy
 *  - It enables the whole organism to function
 *
 *  And just like blood, NO ONE can stop its circulation.
 *
 * ============================================================================
 *
 *  TOKENOMICS
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  Max Supply       : 200,000,000 BKC                                     │
 *  │  TGE Supply       :  40,000,000 BKC (20%)                               │
 *  │  Mining Reserve   : 160,000,000 BKC (80%)                               │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │  Mining Model     : Proof-of-Purchase (PoP)                             │
 *  │  Scarcity Curve   : Linear decreasing rate                              │
 *  │  Burn Mechanism   : Deflationary pressure via ecosystem usage           │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  BKC CIRCULATES THROUGH:
 *
 *  • Staking (DelegationManager)     → BKC flows
 *  • NFT Trading (NFTLiquidityPool)  → BKC flows
 *  • Document Notarization (Notary)  → BKC flows
 *  • Games (FortunePool)             → BKC flows
 *  • Social Network (Backchat)       → BKC flows
 *  • Charity Campaigns (CharityPool) → BKC flows
 *  • NFT Rentals (RentalManager)     → BKC flows
 *
 *  The BKC never stops. The system never stops.
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract BKCToken is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    uint256 public constant MAX_SUPPLY = 200_000_000 * 1e18;

    uint256 public constant TGE_SUPPLY = 40_000_000 * 1e18;

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @dev Deprecated: blacklist removed (A-02). Slot preserved for upgrade safety.
    uint256 private __deprecated_slot_blacklisted;

    uint256 public totalBurned;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[48] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event TokensMinted(
        address indexed to,
        uint256 amount,
        uint256 newTotalSupply
    );

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

    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __ERC20_init("Backcoin", "BKC");
        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(_owner);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         MINT FUNCTIONS
    // =========================================================================

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

    function mintBatch(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external onlyOwner {
        uint256 length = _recipients.length;
        if (length != _amounts.length) revert ArrayLengthMismatch();

        uint256 totalToMint;
        for (uint256 i; i < length;) {
            totalToMint += _amounts[i];
            unchecked { ++i; }
        }

        uint256 available = MAX_SUPPLY - totalSupply();
        if (totalToMint > available) {
            revert MaxSupplyExceeded(totalToMint, available);
        }

        for (uint256 i; i < length;) {
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

        _spendAllowance(_from, msg.sender, _amount);
        _burn(_from, _amount);
        
        unchecked {
            totalBurned += _amount;
        }

        emit TokensBurned(_from, _amount, totalSupply(), totalBurned);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function remainingMintableSupply() external view returns (uint256) {
        uint256 current = totalSupply();
        return current >= MAX_SUPPLY ? 0 : MAX_SUPPLY - current;
    }

    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }

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

    function mintedPercentage() external view returns (uint256) {
        return (totalSupply() * 10000) / MAX_SUPPLY;
    }

    function getBurnStats() external view returns (
        uint256 burnedTotal,
        uint256 burnedPercentage
    ) {
        burnedTotal = totalBurned;
        uint256 totalEverMinted = totalSupply() + totalBurned;
        burnedPercentage = totalEverMinted > 0 
            ? (totalBurned * 10000) / totalEverMinted 
            : 0;
    }

}
