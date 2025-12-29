// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IBackcoinOracle
 * @author Backchain Protocol
 * @notice Interface for Backcoin Oracle - Free Randomness for Arbitrum Ecosystem
 * @dev This interface allows Solidity contracts to interact with the Backcoin Oracle,
 *      which is deployed as a Stylus (Rust/WASM) contract on Arbitrum.
 *
 *      ┌─────────────────────────────────────────────────────────────────────────┐
 *      │                         BACKCOIN ORACLE                                 │
 *      │                 "Free Randomness for Everyone"                          │
 *      ├─────────────────────────────────────────────────────────────────────────┤
 *      │                                                                         │
 *      │  This is Backchain Protocol's contribution to the Arbitrum ecosystem.  │
 *      │  Any project can use it - no fees, no tokens, no restrictions.         │
 *      │                                                                         │
 *      │  Features:                                                              │
 *      │  • FREE - No fees, no subscriptions, no LINK tokens                    │
 *      │  • SIMPLE - One function call, instant results                         │
 *      │  • SECURE - 5 entropy sources + keccak256                              │
 *      │  • FAST - Single transaction, immediate response                       │
 *      │  • BATCH - Multiple requests in one transaction                        │
 *      │                                                                         │
 *      ├─────────────────────────────────────────────────────────────────────────┤
 *      │                                                                         │
 *      │  Security Model:                                                        │
 *      │  The oracle is 100% SECURE while Arbitrum is secure.                   │
 *      │  Same trust assumption as Uniswap, Aave, GMX ($18B+ TVL).              │
 *      │                                                                         │
 *      ├─────────────────────────────────────────────────────────────────────────┤
 *      │                                                                         │
 *      │  Functions:                                                             │
 *      │  • get_numbers(count, min, max)        → Random numbers (can repeat)   │
 *      │  • get_unique_numbers(count, min, max) → Unique numbers (no repeats)   │
 *      │  • get_batch(counts[], mins[], maxs[]) → Multiple groups at once       │
 *      │  • get_batch_unique(...)               → Multiple unique groups        │
 *      │                                                                         │
 *      └─────────────────────────────────────────────────────────────────────────┘
 *
 *      Usage Example:
 *      ```solidity
 *      import "./IBackcoinOracle.sol";
 *
 *      contract MyGame {
 *          IBackcoinOracle public oracle;
 *
 *          constructor(address _oracle) {
 *              oracle = IBackcoinOracle(_oracle);
 *          }
 *
 *          function rollDice() external returns (uint256) {
 *              uint256[] memory result = oracle.get_numbers(1, 1, 6);
 *              return result[0];
 *          }
 *
 *          function drawLottery() external returns (uint256[] memory) {
 *              return oracle.get_unique_numbers(6, 1, 60);
 *          }
 *
 *          function playFortunePool() external returns (uint256[][] memory) {
 *              return oracle.get_batch(
 *                  [1, 1, 1],      // counts
 *                  [1, 1, 1],      // mins
 *                  [3, 10, 100]    // maxs (tier1, tier2, tier3)
 *              );
 *          }
 *      }
 *      ```
 *
 *      Entropy Sources (5):
 *      1. block.timestamp  - Block creation time
 *      2. block.number     - Current block number
 *      3. block.basefee    - Network gas price
 *      4. msg.sender       - Caller address
 *      5. nonce            - Internal counter
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:docs https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * @custom:network Arbitrum
 */
interface IBackcoinOracle {

    // =========================================================================
    //                         RANDOM NUMBER GENERATION
    // =========================================================================

    /**
     * @notice Generate random numbers (CAN repeat)
     * @dev Use this for dice rolls, coin flips, damage calculations, etc.
     *      Numbers may appear more than once in the result.
     *
     *      Examples:
     *      - Dice roll: get_numbers(1, 1, 6) → [4]
     *      - Coin flip: get_numbers(1, 0, 1) → [1]
     *      - Multiple dice: get_numbers(5, 1, 6) → [2, 5, 2, 6, 1]
     *      - Damage range: get_numbers(1, 10, 100) → [73]
     *
     * @param count How many random numbers to generate (1-500)
     * @param min Minimum value inclusive
     * @param max Maximum value inclusive
     * @return Array of random numbers
     */
    function get_numbers(
        uint64 count,
        uint64 min,
        uint64 max
    ) external returns (uint256[] memory);

    /**
     * @notice Generate UNIQUE random numbers (NO repeats)
     * @dev Use this for lotteries, raffles, card games, etc.
     *      All numbers in the result are guaranteed to be different.
     *
     *      Examples:
     *      - Lottery (6 of 60): get_unique_numbers(6, 1, 60) → [7, 14, 23, 38, 45, 52]
     *      - Raffle winners: get_unique_numbers(3, 1, 100) → [17, 42, 89]
     *      - Poker hand: get_unique_numbers(5, 1, 52) → [7, 23, 45, 12, 38]
     *
     *      Requirements:
     *      - Range (max - min + 1) must be >= count
     *      - Cannot request 10 unique numbers from a range of only 5
     *
     * @param count How many unique numbers to generate (1-500)
     * @param min Minimum value inclusive
     * @param max Maximum value inclusive
     * @return Array of unique random numbers
     */
    function get_unique_numbers(
        uint64 count,
        uint64 min,
        uint64 max
    ) external returns (uint256[] memory);

    /**
     * @notice Generate multiple groups of random numbers in ONE transaction (CAN repeat per group)
     * @dev Use this for games with multiple random elements, like Fortune Pool.
     *      More gas-efficient than multiple separate calls.
     *
     *      Examples:
     *      - Fortune Pool (3 tiers):
     *        get_batch([1,1,1], [1,1,1], [3,10,100]) → [[2], [7], [42]]
     *
     *      - Multi-dice game (3d6 + 2d20):
     *        get_batch([3,2], [1,1], [6,20]) → [[4,2,6], [15,8]]
     *
     *      - NFT traits (background, body, eyes):
     *        get_batch([1,1,1], [1,1,1], [10,20,15]) → [[7], [14], [9]]
     *
     * @param counts Array of how many numbers per group [1, 1, 1]
     * @param mins Array of minimum values per group [1, 1, 1]
     * @param maxs Array of maximum values per group [3, 10, 100]
     * @return Array of arrays with random numbers per group
     */
    function get_batch(
        uint64[] calldata counts,
        uint64[] calldata mins,
        uint64[] calldata maxs
    ) external returns (uint256[][] memory);

    /**
     * @notice Generate multiple groups of UNIQUE random numbers in ONE transaction
     * @dev Each group will have unique numbers within itself.
     *      Perfect for multiple independent drawings.
     *
     *      Examples:
     *      - Two lotteries:
     *        get_batch_unique([6,5], [1,1], [60,45]) → [[7,14,23,38,45,52], [3,12,28,33,41]]
     *
     *      - Bingo + Raffle:
     *        get_batch_unique([15,3], [1,1], [75,100]) → [[...15 numbers...], [...3 numbers...]]
     *
     * @param counts Array of how many unique numbers per group
     * @param mins Array of minimum values per group
     * @param maxs Array of maximum values per group
     * @return Array of arrays with unique random numbers per group
     */
    function get_batch_unique(
        uint64[] calldata counts,
        uint64[] calldata mins,
        uint64[] calldata maxs
    ) external returns (uint256[][] memory);

    // =========================================================================
    //                            VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Get oracle statistics
     * @return version Contract version (100 = v1.0.0)
     * @return total_requests Total number of requests processed
     * @return total_numbers Total random numbers generated
     * @return max_per_request Maximum numbers allowed per request (500)
     * @return max_batch_size Maximum batch groups allowed (50)
     */
    function get_stats() external view returns (
        uint64 version,
        uint256 total_requests,
        uint256 total_numbers,
        uint64 max_per_request,
        uint64 max_batch_size
    );

    /**
     * @notice Get current nonce value
     * @dev Nonce increments with every request, ensuring uniqueness
     * @return Current nonce value
     */
    function get_nonce() external view returns (uint256);

    /**
     * @notice Get total requests processed by the oracle
     * @return Total number of requests
     */
    function get_total_requests() external view returns (uint256);

    /**
     * @notice Get total random numbers generated
     * @return Total count of all numbers generated
     */
    function get_total_numbers() external view returns (uint256);

    /**
     * @notice Get current entropy state (for verification)
     * @dev This value evolves with each request
     * @return Current 32-byte entropy state
     */
    function get_entropy_state() external view returns (bytes32);

    /**
     * @notice Get contract version
     * @dev Version 100 = v1.0.0, 101 = v1.0.1, etc.
     * @return Version number
     */
    function get_version() external view returns (uint64);

    /**
     * @notice Get maximum numbers allowed per request
     * @return Maximum count (500)
     */
    function get_max_per_request() external view returns (uint64);

    /**
     * @notice Get maximum batch size (groups) allowed
     * @return Maximum batch size (50)
     */
    function get_max_batch_size() external view returns (uint64);

    /**
     * @notice Get contract owner address
     * @return Owner address
     */
    function get_owner() external view returns (address);

    /**
     * @notice Check if contract is paused
     * @dev When paused, all random generation functions will revert
     * @return True if paused, false otherwise
     */
    function is_paused() external view returns (bool);

    /**
     * @notice Check if contract is initialized
     * @return True if initialized, false otherwise
     */
    function is_initialized() external view returns (bool);
}
