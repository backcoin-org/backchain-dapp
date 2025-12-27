// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title BackchainRandomness
 * @author Backchain Protocol
 * @notice Oracle de números aleatórios para Arbitrum
 * @dev Sistema híbrido: Stylus (Rust) para entropia + Solidity para interface
 *
 *      ╔═══════════════════════════════════════════════════════════════════╗
 *      ║                     ARCHITECTURE                                   ║
 *      ╠═══════════════════════════════════════════════════════════════════╣
 *      ║  BackchainEntropy (Stylus/Rust)                                   ║
 *      ║  └── increment() → raw entropy (LCG algorithm)                   ║
 *      ║                                                                   ║
 *      ║  BackchainRandomness (Solidity) ← THIS CONTRACT                  ║
 *      ║  ├── getRandom(min, max) → single number                         ║
 *      ║  └── getRandoms(mins[], maxs[]) → multiple numbers               ║
 *      ╚═══════════════════════════════════════════════════════════════════╝
 *
 *      Usage: FREE - no fees required for random number generation
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */

interface IStylusEntropy {
    function increment() external returns (uint256);
}

contract BackchainRandomness {
    
    // =========================================================================
    //                              STATE
    // =========================================================================
    
    /// @notice Stylus entropy contract (Rust/WASM)
    IStylusEntropy public immutable stylusEntropy;
    
    /// @notice Contract owner
    address public owner;
    
    // Commit-Reveal Configuration (optional secure mode)
    uint256 public minBlocksWait = 3;
    uint256 public maxBlocksWait = 250;
    uint256 public feePerRequest = 0;
    
    /// @notice Request storage for commit-reveal mode
    struct Request {
        address requester;
        bytes32 commitHash;
        uint256 commitBlock;
        uint256 numCount;
        bool fulfilled;
        uint256 entropy;
    }
    
    mapping(bytes32 => Request) public requests;
    uint256 public requestNonce;
    
    // =========================================================================
    //                              EVENTS
    // =========================================================================
    
    event RequestCommitted(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 numCount,
        uint256 commitBlock
    );
    
    event RequestRevealed(
        bytes32 indexed requestId,
        address indexed requester,
        uint256[] results
    );
    
    event QuickRandom(
        address indexed requester,
        uint256[] results
    );
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // =========================================================================
    //                            CONSTRUCTOR
    // =========================================================================
    
    constructor(address _stylusEntropy) {
        require(_stylusEntropy != address(0), "Invalid entropy address");
        stylusEntropy = IStylusEntropy(_stylusEntropy);
        owner = msg.sender;
    }
    
    // =========================================================================
    //                    QUICK MODE (1 transaction) - MAIN API
    // =========================================================================
    
    /**
     * @notice Get a single random number in range [min, max] inclusive
     * @dev This is the main function used by FortunePoolV2
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @return Random number in range
     */
    function getRandom(uint256 min, uint256 max) external returns (uint256) {
        require(max > min, "Invalid range");
        
        uint256 entropy = stylusEntropy.increment();
        uint256 seed = uint256(keccak256(abi.encodePacked(
            entropy,
            msg.sender,
            block.timestamp,
            block.prevrandao
        )));
        
        uint256 range = max - min + 1;
        return min + (seed % range);
    }
    
    /**
     * @notice Get multiple random numbers with different ranges
     * @dev Used by FortunePoolV2 for cumulative mode (5x)
     * @param mins Array of minimum values
     * @param maxs Array of maximum values
     * @return results Array of random numbers
     */
    function getRandoms(
        uint256[] calldata mins,
        uint256[] calldata maxs
    ) external returns (uint256[] memory results) {
        require(mins.length == maxs.length, "Length mismatch");
        require(mins.length > 0 && mins.length <= 100, "Count: 1-100");
        
        results = new uint256[](mins.length);
        
        for (uint256 i = 0; i < mins.length; i++) {
            require(maxs[i] > mins[i], "Invalid range");
            
            uint256 entropy = stylusEntropy.increment();
            uint256 seed = uint256(keccak256(abi.encodePacked(
                entropy,
                msg.sender,
                block.timestamp,
                block.prevrandao,
                i
            )));
            
            uint256 range = maxs[i] - mins[i] + 1;
            results[i] = mins[i] + (seed % range);
        }
        
        emit QuickRandom(msg.sender, results);
        return results;
    }
    
    // =========================================================================
    //                    SECURE MODE: COMMIT-REVEAL (Optional)
    // =========================================================================
    
    /**
     * @notice Step 1: Commit - register intention to generate numbers
     * @param secret Secret value (keep for reveal!)
     * @param numCount Number of random numbers needed (1-100)
     * @return requestId Unique request ID
     */
    function commit(bytes32 secret, uint256 numCount) external payable returns (bytes32) {
        require(numCount > 0 && numCount <= 100, "Count: 1-100");
        require(msg.value >= feePerRequest, "Insufficient fee");
        
        requestNonce++;
        bytes32 requestId = keccak256(abi.encodePacked(
            requestNonce,
            msg.sender,
            block.number,
            blockhash(block.number - 1)
        ));
        
        bytes32 commitHash = keccak256(abi.encodePacked(secret, msg.sender));
        
        requests[requestId] = Request({
            requester: msg.sender,
            commitHash: commitHash,
            commitBlock: block.number,
            numCount: numCount,
            fulfilled: false,
            entropy: 0
        });
        
        emit RequestCommitted(requestId, msg.sender, numCount, block.number);
        return requestId;
    }
    
    /**
     * @notice Step 2: Reveal - reveal secret and get numbers
     * @param requestId ID returned from commit
     * @param secret Same value used in commit
     * @param mins Array of minimum values
     * @param maxs Array of maximum values
     * @return results Array of random numbers
     */
    function reveal(
        bytes32 requestId,
        bytes32 secret,
        uint256[] calldata mins,
        uint256[] calldata maxs
    ) external returns (uint256[] memory results) {
        Request storage req = requests[requestId];
        
        require(req.commitBlock > 0, "Request not found");
        require(!req.fulfilled, "Already fulfilled");
        require(msg.sender == req.requester, "Not requester");
        require(mins.length == maxs.length, "Length mismatch");
        require(mins.length == req.numCount, "Count mismatch");
        
        uint256 blocksPassed = block.number - req.commitBlock;
        require(blocksPassed >= minBlocksWait, "Too early");
        require(blocksPassed <= maxBlocksWait, "Too late, expired");
        
        bytes32 computedHash = keccak256(abi.encodePacked(secret, msg.sender));
        require(computedHash == req.commitHash, "Invalid secret");
        
        req.fulfilled = true;
        
        uint256 stylusEntropy1 = stylusEntropy.increment();
        uint256 stylusEntropy2 = stylusEntropy.increment();
        
        uint256 masterEntropy = uint256(keccak256(abi.encodePacked(
            secret,
            requestId,
            stylusEntropy1,
            stylusEntropy2,
            blockhash(req.commitBlock),
            block.timestamp,
            block.prevrandao
        )));
        
        req.entropy = masterEntropy;
        
        results = new uint256[](mins.length);
        for (uint256 i = 0; i < mins.length; i++) {
            require(maxs[i] > mins[i], "Invalid range");
            
            uint256 itemEntropy = uint256(keccak256(abi.encodePacked(masterEntropy, i)));
            uint256 range = maxs[i] - mins[i] + 1;
            results[i] = mins[i] + (itemEntropy % range);
        }
        
        emit RequestRevealed(requestId, msg.sender, results);
        return results;
    }
    
    // =========================================================================
    //                         VIEW FUNCTIONS
    // =========================================================================
    
    function getRequest(bytes32 requestId) external view returns (
        address requester,
        uint256 commitBlock,
        uint256 numCount,
        bool fulfilled,
        uint256 blocksRemaining
    ) {
        Request storage req = requests[requestId];
        requester = req.requester;
        commitBlock = req.commitBlock;
        numCount = req.numCount;
        fulfilled = req.fulfilled;
        
        if (commitBlock > 0 && !fulfilled) {
            uint256 targetBlock = commitBlock + minBlocksWait;
            blocksRemaining = block.number >= targetBlock ? 0 : targetBlock - block.number;
        }
    }
    
    function canReveal(bytes32 requestId) external view returns (bool) {
        Request storage req = requests[requestId];
        if (req.commitBlock == 0 || req.fulfilled) return false;
        uint256 blocksPassed = block.number - req.commitBlock;
        return blocksPassed >= minBlocksWait && blocksPassed <= maxBlocksWait;
    }
    
    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function setMinBlocksWait(uint256 _blocks) external onlyOwner {
        require(_blocks >= 1 && _blocks <= 50, "1-50 blocks");
        minBlocksWait = _blocks;
    }
    
    function setMaxBlocksWait(uint256 _blocks) external onlyOwner {
        require(_blocks >= 100 && _blocks <= 500, "100-500 blocks");
        maxBlocksWait = _blocks;
    }
    
    function setFee(uint256 _fee) external onlyOwner {
        feePerRequest = _fee;
    }
    
    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
