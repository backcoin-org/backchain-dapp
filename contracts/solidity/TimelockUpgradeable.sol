// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * ============================================================================
 *
 *                          BACKCHAIN PROTOCOL
 *
 *             ████████╗██╗███╗   ███╗███████╗██╗      ██████╗  ██████╗██╗  ██╗
 *             ╚══██╔══╝██║████╗ ████║██╔════╝██║     ██╔═══██╗██╔════╝██║ ██╔╝
 *                ██║   ██║██╔████╔██║█████╗  ██║     ██║   ██║██║     █████╔╝
 *                ██║   ██║██║╚██╔╝██║██╔══╝  ██║     ██║   ██║██║     ██╔═██╗
 *                ██║   ██║██║ ╚═╝ ██║███████╗███████╗╚██████╔╝╚██████╗██║  ██╗
 *                ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
 *
 *                P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : TimelockUpgradeable
 *  Purpose     : 48-hour timelock for UUPS proxy upgrades (A-01 fix)
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  SECURITY: Uses ERC-7201 namespaced storage to avoid layout conflicts
 *  with existing upgradeable contracts.
 *
 *  UPGRADE FLOW:
 *  1. Admin calls scheduleUpgrade(newImplementation)
 *  2. 48 hours must pass
 *  3. Admin calls upgradeTo(newImplementation) — timelock is verified
 *  4. Users have 48h to exit if they disagree with the upgrade
 *
 * ============================================================================
 */

abstract contract TimelockUpgradeable {

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    uint256 public constant UPGRADE_TIMELOCK = 48 hours;

    // =========================================================================
    //                     NAMESPACED STORAGE (ERC-7201)
    // =========================================================================

    /// @custom:storage-location erc7201:backchain.storage.TimelockUpgradeable
    struct TimelockStorage {
        address pendingImplementation;
        uint256 upgradeReadyAt;
    }

    // keccak256(abi.encode(uint256(keccak256("backchain.storage.TimelockUpgradeable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant TIMELOCK_STORAGE_SLOT =
        0xcdb67dc5407565fc7774ef88464caf8dc4b654731c3eb9e6ef35210c7c945700;

    function _getTimelockStorage() private pure returns (TimelockStorage storage s) {
        bytes32 slot = TIMELOCK_STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event UpgradeScheduled(address indexed newImplementation, uint256 readyAt);
    event UpgradeCancelled(address indexed cancelledImplementation);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error UpgradeNotScheduled();
    error UpgradeTimelockNotElapsed(uint256 readyAt);
    error UpgradeImplementationMismatch(address expected, address actual);
    error ZeroImplementation();

    // =========================================================================
    //                         ACCESS CONTROL
    // =========================================================================

    /// @dev Must be overridden to enforce access control (e.g., onlyOwner)
    function _requireUpgradeAccess() internal view virtual;

    // =========================================================================
    //                        PUBLIC FUNCTIONS
    // =========================================================================

    /// @notice Schedule a contract upgrade (starts 48h countdown)
    /// @param _newImplementation Address of the new implementation contract
    function scheduleUpgrade(address _newImplementation) external {
        _requireUpgradeAccess();
        if (_newImplementation == address(0)) revert ZeroImplementation();

        TimelockStorage storage ts = _getTimelockStorage();
        ts.pendingImplementation = _newImplementation;
        ts.upgradeReadyAt = block.timestamp + UPGRADE_TIMELOCK;

        emit UpgradeScheduled(_newImplementation, ts.upgradeReadyAt);
    }

    /// @notice Cancel a pending upgrade
    function cancelUpgrade() external {
        _requireUpgradeAccess();

        TimelockStorage storage ts = _getTimelockStorage();
        address impl = ts.pendingImplementation;

        ts.pendingImplementation = address(0);
        ts.upgradeReadyAt = 0;

        emit UpgradeCancelled(impl);
    }

    /// @notice View the pending upgrade details
    function pendingUpgrade() external view returns (
        address implementation,
        uint256 readyAt
    ) {
        TimelockStorage storage ts = _getTimelockStorage();
        return (ts.pendingImplementation, ts.upgradeReadyAt);
    }

    // =========================================================================
    //                       INTERNAL FUNCTIONS
    // =========================================================================

    /// @dev Call from _authorizeUpgrade to enforce the 48h timelock
    function _checkTimelock(address _newImplementation) internal {
        TimelockStorage storage ts = _getTimelockStorage();

        if (ts.pendingImplementation == address(0)) {
            revert UpgradeNotScheduled();
        }
        if (_newImplementation != ts.pendingImplementation) {
            revert UpgradeImplementationMismatch(
                ts.pendingImplementation,
                _newImplementation
            );
        }
        if (block.timestamp < ts.upgradeReadyAt) {
            revert UpgradeTimelockNotElapsed(ts.upgradeReadyAt);
        }

        // Clear pending state after successful verification
        ts.pendingImplementation = address(0);
        ts.upgradeReadyAt = 0;
    }
}
