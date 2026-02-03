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
 *  Contract    : IBackcoinOracle
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
 *  FREE RANDOMNESS FOR EVERYONE
 *
 *  This is Backchain Protocol's gift to the Arbitrum ecosystem.
 *  Any project can use it - no fees, no tokens, no restrictions.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  • FREE   - No fees, no subscriptions, no LINK tokens                   │
 *  │  • SIMPLE - One function call, instant results                          │
 *  │  • SECURE - 5 entropy sources + keccak256                               │
 *  │  • FAST   - Single transaction, immediate response                      │
 *  │  • BATCH  - Multiple requests in one transaction                        │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  Security Model:
 *  The oracle is 100% SECURE while Arbitrum is secure.
 *  Same trust assumption as Uniswap, Aave, GMX ($18B+ TVL).
 *
 * ============================================================================
 *
 *  USAGE EXAMPLE
 *
 *  ```solidity
 *  import "./IBackcoinOracle.sol";
 *
 *  contract MyGame {
 *      IBackcoinOracle public oracle;
 *
 *      function rollDice() external returns (uint256) {
 *          uint256[] memory result = oracle.getNumbers(1, 1, 6);
 *          return result[0];
 *      }
 *
 *      function drawLottery() external returns (uint256[] memory) {
 *          return oracle.getUniqueNumbers(6, 1, 60);
 *      }
 *  }
 *  ```
 *
 * ============================================================================
 *
 *  ENTROPY SOURCES (5)
 *
 *  1. block.timestamp  - Block creation time
 *  2. block.number     - Current block number
 *  3. block.basefee    - Network gas price
 *  4. msg.sender       - Caller address
 *  5. nonce            - Internal counter
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

interface IBackcoinOracle {

    // =========================================================================
    //                         RANDOM NUMBER GENERATION
    // =========================================================================

    /**
     * @notice Generate random numbers (CAN repeat)
     * @param count How many random numbers to generate (1-500)
     * @param min Minimum value inclusive
     * @param max Maximum value inclusive
     * @return Array of random numbers
     */
    function getNumbers(
        uint64 count,
        uint64 min,
        uint64 max
    ) external returns (uint256[] memory);

    /**
     * @notice Generate UNIQUE random numbers (NO repeats)
     * @param count How many unique numbers to generate (1-500)
     * @param min Minimum value inclusive
     * @param max Maximum value inclusive
     * @return Array of unique random numbers
     */
    function getUniqueNumbers(
        uint64 count,
        uint64 min,
        uint64 max
    ) external returns (uint256[] memory);

    /**
     * @notice Generate multiple groups of random numbers in ONE transaction
     * @param counts Array of how many numbers per group
     * @param mins Array of minimum values per group
     * @param maxs Array of maximum values per group
     * @return Array of arrays with random numbers per group
     */
    function getBatch(
        uint64[] calldata counts,
        uint64[] calldata mins,
        uint64[] calldata maxs
    ) external returns (uint256[][] memory);

    /**
     * @notice Generate multiple groups of UNIQUE random numbers in ONE transaction
     * @param counts Array of how many unique numbers per group
     * @param mins Array of minimum values per group
     * @param maxs Array of maximum values per group
     * @return Array of arrays with unique random numbers per group
     */
    function getBatchUnique(
        uint64[] calldata counts,
        uint64[] calldata mins,
        uint64[] calldata maxs
    ) external returns (uint256[][] memory);

    // =========================================================================
    //                            VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Get oracle statistics
     */
    function getStats() external view returns (
        uint64 version,
        uint256 totalRequests,
        uint256 totalNumbers,
        uint64 maxPerRequest,
        uint64 maxBatchSize
    );

    /**
     * @notice Get current nonce value
     */
    function getNonce() external view returns (uint256);

    /**
     * @notice Get total requests processed
     */
    function getTotalRequests() external view returns (uint256);

    /**
     * @notice Get total random numbers generated
     */
    function getTotalNumbers() external view returns (uint256);

    /**
     * @notice Get current entropy state
     */
    function getEntropyState() external view returns (bytes32);

    /**
     * @notice Get contract version
     */
    function getVersion() external view returns (uint64);

    /**
     * @notice Get maximum numbers allowed per request
     */
    function getMaxPerRequest() external view returns (uint64);

    /**
     * @notice Get maximum batch size allowed
     */
    function getMaxBatchSize() external view returns (uint64);

    /**
     * @notice Get contract owner address
     */
    function getOwner() external view returns (address);

    /**
     * @notice Check if contract is paused
     */
    function isPaused() external view returns (bool);

    /**
     * @notice Check if contract is initialized
     */
    function isInitialized() external view returns (bool);
}
