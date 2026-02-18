// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// ============================================================================
// BKC TOKEN — IMMUTABLE
// ============================================================================
//
// ERC-20 token powering the Backchain ecosystem.
//
//   - Name: "Backcoin", Symbol: "BKC", 18 decimals
//   - Max supply: 200,000,000 BKC (hard cap, enforced on-chain)
//   - TGE (Token Generation Event): 20,000,000 BKC minted to treasury
//   - Remaining 180,000,000 BKC minted via BuybackMiner scarcity curve
//   - EIP-2612 Permit: gasless approvals via off-chain signatures
//   - Public burn: anyone can burn their own tokens
//   - Authorized minters: deployer adds minters (BuybackMiner), then
//     can optionally renounce minter admin to lock the minter list forever
//
// Once deployed, the contract logic NEVER changes.
//
// ============================================================================

contract BKCToken is ERC20, ERC20Permit {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Absolute maximum supply. No BKC can ever be minted beyond this.
    uint256 public constant MAX_SUPPLY = 200_000_000 ether; // 200M

    /// @notice Initial supply minted to treasury at deployment.
    uint256 public constant TGE_AMOUNT = 20_000_000 ether;  // 20M

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Cumulative BKC burned across all time (totalSupply decreases, this increases)
    uint256 public totalBurned;

    /// @notice Deployer address — manages minter roles until renounced
    address public immutable deployer;

    /// @notice Whether the deployer has permanently renounced minter admin
    bool public minterAdminRenounced;

    /// @notice Authorized minters (typically only BuybackMiner)
    mapping(address => bool) public isMinter;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event MinterAdminRenounced(address indexed deployer);
    event TokensBurned(
        address indexed from,
        uint256 amount,
        uint256 newTotalSupply,
        uint256 totalBurnedAllTime
    );
    event TokensMinted(
        address indexed to,
        uint256 amount,
        uint256 newTotalSupply
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotDeployer();
    error NotMinter();
    error MinterAdminIsRenounced();
    error ExceedsMaxSupply(uint256 requested, uint256 available);
    error ZeroAmount();
    error ZeroAddress();

    // ════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════════════════════

    modifier onlyDeployer() {
        if (msg.sender != deployer) revert NotDeployer();
        _;
    }

    modifier onlyMinter() {
        if (!isMinter[msg.sender]) revert NotMinter();
        _;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Deploy BKC token with TGE mint to treasury.
    /// @param _treasury Address receiving the initial 20M BKC supply.
    constructor(address _treasury)
        ERC20("Backcoin", "BKC")
        ERC20Permit("Backcoin")
    {
        if (_treasury == address(0)) revert ZeroAddress();
        deployer = msg.sender;
        _mint(_treasury, TGE_AMOUNT);
        emit TokensMinted(_treasury, TGE_AMOUNT, totalSupply());
    }

    // ════════════════════════════════════════════════════════════════════════
    // MINTER MANAGEMENT (deployer only)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Authorize an address to mint BKC (typically BuybackMiner).
    ///         Reverts if minter admin has been renounced.
    function addMinter(address _minter) external onlyDeployer {
        if (minterAdminRenounced) revert MinterAdminIsRenounced();
        if (_minter == address(0)) revert ZeroAddress();
        isMinter[_minter] = true;
        emit MinterAdded(_minter);
    }

    /// @notice Remove minting authorization from an address.
    ///         Reverts if minter admin has been renounced.
    function removeMinter(address _minter) external onlyDeployer {
        if (minterAdminRenounced) revert MinterAdminIsRenounced();
        isMinter[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /// @notice Permanently renounce minter admin role.
    ///         After calling this, no minters can ever be added or removed.
    ///         Call this AFTER all minters (BuybackMiner) are configured.
    ///         This is IRREVERSIBLE — the minter list is locked forever.
    function renounceMinterAdmin() external onlyDeployer {
        minterAdminRenounced = true;
        emit MinterAdminRenounced(msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════
    // MINT (authorized minters only, respects max supply)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Mint new BKC tokens. Only callable by authorized minters.
    ///         Reverts if minting would exceed MAX_SUPPLY (200M).
    /// @param _to     Recipient of minted tokens
    /// @param _amount Amount to mint (in wei, 18 decimals)
    function mint(address _to, uint256 _amount) external onlyMinter {
        if (_amount == 0) revert ZeroAmount();
        if (_to == address(0)) revert ZeroAddress();

        uint256 available = MAX_SUPPLY - totalSupply();
        if (_amount > available) revert ExceedsMaxSupply(_amount, available);

        _mint(_to, _amount);
        emit TokensMinted(_to, _amount, totalSupply());
    }

    // ════════════════════════════════════════════════════════════════════════
    // BURN (public — anyone can burn their own tokens)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Burn your own BKC tokens. Reduces totalSupply, increases totalBurned.
    /// @param _amount Amount to burn
    function burn(uint256 _amount) external {
        if (_amount == 0) revert ZeroAmount();
        _burn(msg.sender, _amount);
        totalBurned += _amount;
        emit TokensBurned(msg.sender, _amount, totalSupply(), totalBurned);
    }

    /// @notice Burn BKC from another address (requires prior allowance).
    ///         Used by BackchainEcosystem to burn BKC fees from Tier 2 modules.
    /// @param _from   Address to burn from
    /// @param _amount Amount to burn
    function burnFrom(address _from, uint256 _amount) external {
        if (_amount == 0) revert ZeroAmount();
        _spendAllowance(_from, msg.sender, _amount);
        _burn(_from, _amount);
        totalBurned += _amount;
        emit TokensBurned(_from, _amount, totalSupply(), totalBurned);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice How many BKC can still be minted before reaching MAX_SUPPLY.
    ///         Returns 0 when cap is reached (no more mining possible).
    function mintableRemaining() external view returns (uint256) {
        uint256 supply = totalSupply();
        return supply >= MAX_SUPPLY ? 0 : MAX_SUPPLY - supply;
    }

    /// @notice Lifetime total of all BKC ever minted (TGE + mining).
    ///         Unlike totalSupply(), this never decreases when tokens are burned.
    ///         Useful for tracking total minting activity.
    function totalMinted() external view returns (uint256) {
        return totalSupply() + totalBurned;
    }
}
