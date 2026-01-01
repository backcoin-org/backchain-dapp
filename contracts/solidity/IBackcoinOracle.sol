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
 *      │  This is Backchain Protocol's contribution to the Arbitrum ecosystem.   │
 *      │  Any project can use it - no fees, no tokens, no restrictions.          │
 *      │                                                                         │
 *      │  Features:                                                              │
 *      │  • FREE - No fees, no subscriptions, no LINK tokens                     │
 *      │  • SIMPLE - One function call, instant results                          │
 *      │  • SECURE - 5 entropy sources + keccak256                               │
 *      │  • FAST - Single transaction, immediate response                        │
 *      │  • BATCH - Multiple requests in one transaction                         │
 *      │                                                                         │
 *      ├─────────────────────────────────────────────────────────────────────────┤
 *      │                                                                         │
 *      │  Security Model:                                                        │
 *      │  The oracle is 100% SECURE while Arbitrum is secure.                    │
 *      │  Same trust assumption as Uniswap, Aave, GMX ($18B+ TVL).               │
 *      │                                                                         │
 *      ├─────────────────────────────────────────────────────────────────────────┤
 *      │                                                                         │
 *      │  Functions:                                                             │
 *      │  • getNumbers(count, min, max)        → Random numbers (can repeat)     │
 *      │  • getUniqueNumbers(count, min, max)  → Unique numbers (no repeats)     │
 *      │  • getBatch(counts[], mins[], maxs[]) → Multiple groups at once         │
 *      │  • getBatchUnique(...)                → Multiple unique groups          │
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
 *              uint256[] memory result = oracle.getNumbers(1, 1, 6);
 *              return result[0];
 *          }
 *
 *          function drawLottery() external returns (uint256[] memory) {
 *              return oracle.getUniqueNumbers(6, 1, 60);
 *          }
 *
 *          function playFortunePool() external returns (uint256[][] memory) {
 *              uint64[] memory counts = new uint64[](3);
 *              uint64[] memory mins = new uint64[](3);
 *              uint64[] memory maxs = new uint64[](3);
 *              
 *              counts[0] = 1; counts[1] = 1; counts[2] = 1;
 *              mins[0] = 1; mins[1] = 1; mins[2] = 1;
 *              maxs[0] = 3; maxs[1] = 10; maxs[2] = 100;
 *              
 *              return oracle.getBatch(counts, mins, maxs);
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
     *      - Dice roll: getNumbers(1, 1, 6) → [4]
     *      - Coin flip: getNumbers(1, 0, 1) → [1]
     *      - Multiple dice: getNumbers(5, 1, 6) → [2, 5, 2, 6, 1]
     *      - Damage range: getNumbers(1, 10, 100) → [73]
     *
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
     * @dev Use this for lotteries, raffles, card games, etc.
     *      All numbers in the result are guaranteed to be different.
     *
     *      Examples:
     *      - Lottery (6 of 60): getUniqueNumbers(6, 1, 60) → [7, 14, 23, 38, 45, 52]
     *      - Raffle winners: getUniqueNumbers(3, 1, 100) → [17, 42, 89]
     *      - Poker hand: getUniqueNumbers(5, 1, 52) → [7, 23, 45, 12, 38]
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
    function getUniqueNumbers(
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
     *        getBatch([1,1,1], [1,1,1], [3,10,100]) → [[2], [7], [42]]
     *
     *      - Multi-dice game (3d6 + 2d20):
     *        getBatch([3,2], [1,1], [6,20]) → [[4,2,6], [15,8]]
     *
     *      - NFT traits (background, body, eyes):
     *        getBatch([1,1,1], [1,1,1], [10,20,15]) → [[7], [14], [9]]
     *
     * @param counts Array of how many numbers per group [1, 1, 1]
     * @param mins Array of minimum values per group [1, 1, 1]
     * @param maxs Array of maximum values per group [3, 10, 100]
     * @return Array of arrays with random numbers per group
     */
    function getBatch(
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
     *        getBatchUnique([6,5], [1,1], [60,45]) → [[7,14,23,38,45,52], [3,12,28,33,41]]
     *
     *      - Bingo + Raffle:
     *        getBatchUnique([15,3], [1,1], [75,100]) → [[...15 numbers...], [...3 numbers...]]
     *
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
     * @return version Contract version (100 = v1.0.0)
     * @return totalRequests Total number of requests processed
     * @return totalNumbers Total random numbers generated
     * @return maxPerRequest Maximum numbers allowed per request (500)
     * @return maxBatchSize Maximum batch groups allowed (50)
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
     * @dev Nonce increments with every request, ensuring uniqueness
     * @return Current nonce value
     */
    function getNonce() external view returns (uint256);

    /**
     * @notice Get total requests processed by the oracle
     * @return Total number of requests
     */
    function getTotalRequests() external view returns (uint256);

    /**
     * @notice Get total random numbers generated
     * @return Total count of all numbers generated
     */
    function getTotalNumbers() external view returns (uint256);

    /**
     * @notice Get current entropy state (for verification)
     * @dev This value evolves with each request
     * @return Current 32-byte entropy state
     */
    function getEntropyState() external view returns (bytes32);

    /**
     * @notice Get contract version
     * @dev Version 100 = v1.0.0, 101 = v1.0.1, etc.
     * @return Version number
     */
    function getVersion() external view returns (uint64);

    /**
     * @notice Get maximum numbers allowed per request
     * @return Maximum count (500)
     */
    function getMaxPerRequest() external view returns (uint64);

    /**
     * @notice Get maximum batch size (groups) allowed
     * @return Maximum batch size (50)
     */
    function getMaxBatchSize() external view returns (uint64);

    /**
     * @notice Get contract owner address
     * @return Owner address
     */
    function getOwner() external view returns (address);

    /**
     * @notice Check if contract is paused
     * @dev When paused, all random generation functions will revert
     * @return True if paused, false otherwise
     */
    function isPaused() external view returns (bool);

    /**
     * @notice Check if contract is initialized
     * @return True if initialized, false otherwise
     */
    function isInitialized() external view returns (bool);
}
