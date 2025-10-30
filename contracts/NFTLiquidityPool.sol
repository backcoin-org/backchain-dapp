// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
// Import Hub, Token, and Booster interfaces
import "./EcosystemManager.sol";
import "./BKCToken.sol";

/**
 * @title NFTLiquidityPool (AMM for RewardBoosterNFT)
 * @dev V2: "Spoke" contract refactored to use EcosystemManager.
 * @notice V3: Added "Tax" on sale (10%) with 4/4/2 distribution and booster discount.
 */
contract NFTLiquidityPool is Ownable, ReentrancyGuard, IERC721Receiver {

    IEcosystemManager public immutable ecosystemManager;
    BKCToken public immutable bkcToken;

    struct Pool {
        uint256 tokenBalance; // BKC balance
        uint256 nftCount;     // Number of NFTs held
        uint256 k;            // Invariant k = tokenBalance * nftCount
        bool isInitialized;
    }

    mapping(uint256 => Pool) public pools; // Maps boostBips => Pool

    // --- KEYS FOR HUB (Examples) ---
    // You will define the actual values in EcosystemManager
    string public constant PSTAKE_SERVICE_KEY = "NFT_POOL_ACCESS"; // Key to check pStake
    string public constant TAX_BIPS_KEY = "NFT_POOL_TAX_BIPS"; // Key for base tax bips (e.g., 1000 = 10%)
    string public constant TAX_TREASURY_SHARE_KEY = "NFT_POOL_TAX_TREASURY_SHARE_BIPS"; // Key for Treasury % of tax (e.g., 4000 = 40%)
    string public constant TAX_DELEGATOR_SHARE_KEY = "NFT_POOL_TAX_DELEGATOR_SHARE_BIPS"; // Key for Delegator % of tax (e.g., 4000 = 40%)
    string public constant TAX_LIQUIDITY_SHARE_KEY = "NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS"; // Key for Liquidity % of tax (e.g., 2000 = 20%)


    event PoolCreated(uint256 indexed boostBips);
    event LiquidityAdded(uint256 indexed boostBips, uint256 nftAmount, uint256 bkcAmount);
    event NFTsAddedToPool(uint256 indexed boostBips, uint256 nftAmount);
    event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price);
    event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid); // Changed feePaid to taxPaid

    constructor(
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_ecosystemManagerAddress != address(0), "NLP: Hub cannot be zero"); // <-- Translated
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(_bkcTokenAddress != address(0), "NLP: Token not configured in Hub"); // <-- Translated
        bkcToken = BKCToken(_bkcTokenAddress);
    }

    // Required by IERC721Receiver
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // --- Admin Functions (Owner) ---
    // (Remain the same as the previous version)

    /**
     * @notice (Owner) Creates the structure for a new liquidity pool for a specific booster tier.
     * @param _boostBips The boostBips value identifying the NFT tier (e.g., 5000 for Diamond).
     */
    function createPool(uint256 _boostBips) external onlyOwner {
        require(!pools[_boostBips].isInitialized, "NLP: Pool already exists"); // Translated
        pools[_boostBips].isInitialized = true;
        emit PoolCreated(_boostBips);
    }

    /**
     * @notice (Owner) Adds the very first liquidity (NFTs + BKC) to initialize a pool.
     * @param _boostBips The tier's boostBips.
     * @param _tokenIds Array of token IDs for this tier to add.
     * @param _bkcAmount The amount of BKC tokens to add.
     */
    function addInitialLiquidity(uint256 _boostBips, uint256[] calldata _tokenIds, uint256 _bkcAmount) external onlyOwner nonReentrant {
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster not configured in Hub"); // Translated
        IERC721 rewardBoosterNFT = IERC721(rewardBoosterAddress);

        Pool storage pool = pools[_boostBips];
        require(pool.isInitialized, "NLP: Pool not initialized"); // Translated
        require(pool.nftCount == 0, "NLP: Liquidity already added"); // Translated
        require(_tokenIds.length > 0, "NLP: Must add at least one NFT"); // Translated
        require(_bkcAmount > 0, "NLP: Must add BKC liquidity"); // Translated

        for (uint i = 0; i < _tokenIds.length; i++) {
            // Owner must approve this contract first off-chain
            rewardBoosterNFT.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            // Optional: Check if boostBips matches, though owner is trusted here
        }

        // Owner must approve this contract first off-chain
        require(bkcToken.transferFrom(msg.sender, address(this), _bkcAmount), "NLP: BKC transfer failed"); // Translated

        pool.nftCount = _tokenIds.length;
        pool.tokenBalance = _bkcAmount;
        pool.k = pool.nftCount * pool.tokenBalance; // Initialize k

        emit LiquidityAdded(_boostBips, pool.nftCount, pool.tokenBalance);
    }

    /**
     * @notice (Owner) Adds more NFTs to an already initialized pool (increases supply).
     * @dev Does NOT require adding BKC. The pool price adjusts automatically.
     * @param _boostBips The tier's boostBips.
     * @param _tokenIds Array of token IDs for this tier to add.
     */
    function addMoreNFTsToPool(uint256 _boostBips, uint256[] calldata _tokenIds) external onlyOwner nonReentrant {
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster not configured in Hub"); // Translated
        IERC721 rewardBoosterNFT = IERC721(rewardBoosterAddress);

        Pool storage pool = pools[_boostBips];
        require(pool.isInitialized && pool.k > 0, "NLP: Pool not initialized with liquidity yet"); // Check k > 0
        require(_tokenIds.length > 0, "NLP: Token IDs array cannot be empty"); // Translated

        for (uint i = 0; i < _tokenIds.length; i++) {
             // Owner must approve this contract first off-chain
            rewardBoosterNFT.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
             // Optional: Check boostBips
        }

        pool.nftCount += _tokenIds.length;
        pool.k = pool.nftCount * pool.tokenBalance; // Recalculate k

        emit NFTsAddedToPool(_boostBips, _tokenIds.length);
    }

    // --- Trading Functions ---

    /**
     * @notice Buys an NFT from the pool.
     * @dev Requires minimum pStake. No additional tax on purchase (for now).
     * @param _boostBips The tier of NFT to buy.
     * @param _tokenId The specific token ID to buy (must be owned by this contract).
     * @param _boosterTokenId User's booster for pStake check (fee discount is not applied here).
     */
    function buyNFT(uint256 _boostBips, uint256 _tokenId, uint256 _boosterTokenId) external nonReentrant {
        // 1. AUTHORIZATION: Check minimum pStake (Service fee = 0)
        uint256 serviceFee = ecosystemManager.authorizeService(
            PSTAKE_SERVICE_KEY,
            msg.sender,
            _boosterTokenId // Booster only used for pStake check discount if fee > 0
        );
         require(serviceFee == 0, "NLP: Buy service fee should be zero"); // Ensure no fee configured accidentally

        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster not configured in Hub"); // Translated
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);

        Pool storage pool = pools[_boostBips];
        require(pool.isInitialized && pool.nftCount > 0, "NLP: No NFTs available in this pool"); // Translated
        require(IERC721(rewardBoosterAddress).ownerOf(_tokenId) == address(this), "NLP: Contract does not own this NFT"); // Translated
        require(rewardBoosterNFT.boostBips(_tokenId) == _boostBips, "NLP: Token tier mismatch"); // Translated

        uint256 price = getBuyPrice(_boostBips); // Get price before state changes
        require(bkcToken.transferFrom(msg.sender, address(this), price), "NLP: BKC transfer failed"); // Translated

        // Update pool state
        pool.tokenBalance += price;
        pool.nftCount--;
        // Recalculate k only if nftCount > 0, otherwise k becomes 0
        pool.k = (pool.nftCount == 0) ? 0 : pool.tokenBalance * pool.nftCount;

        // Transfer NFT to buyer
        IERC721(rewardBoosterAddress).safeTransferFrom(address(this), msg.sender, _tokenId);
        emit NFTBought(msg.sender, _boostBips, _tokenId, price);
    }

    /**
     * @notice Sells an NFT to the pool.
     * @dev Requires pStake, charges Tax (with discount), and distributes 4/4/2.
     * @param _tokenId The token ID to sell.
     * @param _boosterTokenId User's booster for pStake check AND tax discount.
     */
    function sellNFT(uint256 _tokenId, uint256 _boosterTokenId) external nonReentrant {

        // 1. AUTHORIZATION: Check minimum pStake (Service fee = 0)
         uint256 serviceFee = ecosystemManager.authorizeService(
            PSTAKE_SERVICE_KEY,
            msg.sender,
            _boosterTokenId
        );
        require(serviceFee == 0, "NLP: Sell service fee should be zero");

        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster not configured in Hub"); // Translated
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);

        // Check ownership and validity
        require(IERC721(rewardBoosterAddress).ownerOf(_tokenId) == msg.sender, "NLP: Not the owner"); // Translated
        uint256 boostBips = rewardBoosterNFT.boostBips(_tokenId);
        require(boostBips > 0, "NLP: Not a valid Booster NFT"); // Translated

        Pool storage pool = pools[boostBips];
        require(pool.isInitialized, "NLP: Pool does not exist for this tier"); // Translated

        uint256 sellValue = getSellPrice(boostBips); // Get value before state changes
        require(pool.tokenBalance >= sellValue, "NLP: Pool has insufficient BKC liquidity"); // Translated

        // --- 2. TAX CALCULATION (NEW) ---
        uint256 taxBipsBase = ecosystemManager.getFee(TAX_BIPS_KEY); // e.g., 1000 (10%)
        uint256 discountBips = 0;

        // Calculate discount if a valid booster is provided
        if (_boosterTokenId > 0) {
            try rewardBoosterNFT.ownerOf(_boosterTokenId) returns (address owner) {
                if (owner == msg.sender) {
                    uint256 userBoostBips = rewardBoosterNFT.boostBips(_boosterTokenId);
                    discountBips = ecosystemManager.getBoosterDiscount(userBoostBips); // Get immutable discount
                }
            } catch { /* Token doesn't exist or error, ignore discount */ }
        }

        // Calculate final tax rate
        uint256 finalTaxBips = (taxBipsBase > discountBips) ? taxBipsBase - discountBips : 0;

        uint256 finalTaxAmount = (sellValue * finalTaxBips) / 10000;
        uint256 payoutToSeller = sellValue - finalTaxAmount;

        // --- 3. TRANSFERS ---
        // Pull NFT from seller to this contract
        IERC721(rewardBoosterAddress).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Pay the seller the net amount (after tax)
        if (payoutToSeller > 0) {
            require(bkcToken.transfer(msg.sender, payoutToSeller), "NLP: Payout transfer failed"); // Translated
        }

        // --- 4. TAX DISTRIBUTION (4/4/2) ---
        if (finalTaxAmount > 0) {
            _distributeTax(finalTaxAmount); // New internal distribution function
        }

        // --- 5. UPDATE POOL STATE (Considering the tax) ---
        // The total amount that LEFT the contract's balance is:
        // payoutToSeller + treasuryAmount + delegatorAmount
        // The liquidityAmount portion of the tax never left.

        // It's easier to think: The balance initially decreased by the full sellValue,
        // but then the liquidityAmount part "stayed" or was added back.
        uint256 liquidityShareBips = ecosystemManager.getFee(TAX_LIQUIDITY_SHARE_KEY); // e.g., 2000 (20% of tax)
        uint256 liquidityAmount = (finalTaxAmount * liquidityShareBips) / 10000;

        pool.tokenBalance -= sellValue; // Deduct the gross amount that should have been paid
        pool.tokenBalance += liquidityAmount; // Add back the portion that stays as liquidity
        pool.nftCount++;
        pool.k = pool.tokenBalance * pool.nftCount; // Recalculate k

        emit NFTSold(msg.sender, boostBips, _tokenId, payoutToSeller, finalTaxAmount);
    }

    /**
     * @notice (NEW) Internal function for distributing Tax (4/4/2).
     */
    function _distributeTax(uint256 _taxAmount) internal {
        if (_taxAmount == 0) return;

        address treasury = ecosystemManager.getTreasuryAddress();
        address dm = ecosystemManager.getDelegationManagerAddress();
        require(treasury != address(0), "NLP: Treasury not configured in Hub"); // Translated
        require(dm != address(0), "NLP: Delegation Manager not configured in Hub"); // Translated

        // Get distribution percentages from Hub
        uint256 treasuryShareBips = ecosystemManager.getFee(TAX_TREASURY_SHARE_KEY); // e.g., 4000
        uint256 delegatorShareBips = ecosystemManager.getFee(TAX_DELEGATOR_SHARE_KEY); // e.g., 4000
        // Liquidity share is the remainder, calculation needed for precision

        uint256 treasuryAmount = (_taxAmount * treasuryShareBips) / 10000;
        uint256 delegatorAmount = (_taxAmount * delegatorShareBips) / 10000;
        // Calculate liquidity amount precisely as the remainder
        uint256 liquidityAmount = _taxAmount - treasuryAmount - delegatorAmount;

        // 1. Send to Treasury
        if (treasuryAmount > 0) {
            // Tokens are already in this contract (from the sellValue deduction), so use transfer()
            require(bkcToken.transfer(treasury, treasuryAmount), "NLP: Tax to Treasury failed"); // Translated
        }

        // 2. Send to Delegators (BUG FIX)
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }

        // 3. The Liquidity portion (liquidityAmount) is already accounted for
        // by adjusting pool.tokenBalance in the sellNFT function.
        // No additional transfer is needed here.
    }

    // --- View Functions ---
    // (Remain the same)

    /**
     * @notice Calculates the current price to buy 1 NFT of a given tier.
     * @return Price in BKC (Wei), or type(uint256).max if pool empty/uninitialized.
     */
    function getBuyPrice(uint256 _boostBips) public view returns (uint256) {
        Pool storage pool = pools[_boostBips];
        if (!pool.isInitialized || pool.nftCount == 0) return type(uint256).max; // Return max for invalid/empty pool

        // Formula: price = k / (x - 1) - y
        // where x = nftCount, y = tokenBalance
        // Avoid division by zero if only 1 NFT left
        if (pool.nftCount <= 1) return type(uint256).max; // Cannot buy the last NFT

        uint256 newY = pool.k / (pool.nftCount - 1);
        // Check for potential overflow before subtraction (shouldn't happen if k is correct)
        if (newY < pool.tokenBalance) return 0; // Should not happen in a balanced pool

        return newY - pool.tokenBalance;
    }

    /**
     * @notice Calculates the current payout for selling 1 NFT of a given tier (before tax).
     * @return Payout in BKC (Wei), or 0 if pool uninitialized or has max uint NFTs.
     */
    function getSellPrice(uint256 _boostBips) public view returns (uint256) {
        Pool storage pool = pools[_boostBips];
        // Cannot sell to uninitialized pool or if pool somehow has max uint NFTs
        if (!pool.isInitialized || pool.nftCount == type(uint256).max) return 0;

        // Formula: payout = y - k / (x + 1)
        // where x = nftCount, y = tokenBalance
        uint256 newY = pool.k / (pool.nftCount + 1); // Avoids overflow for nftCount + 1

        // Avoid underflow if newY is larger than tokenBalance (imbalanced pool)
        return (pool.tokenBalance > newY) ? pool.tokenBalance - newY : 0;
    }

     /**
     * @notice Returns the state of a specific pool.
     */
    function getPoolInfo(uint256 _boostBips) external view returns (Pool memory) {
        return pools[_boostBips];
    }
}