// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title NFT Liquidity Pool (AMM)
 * @notice Automated Market Maker for Backchain Reward Boosters.
 * @dev Standard Spoke Implementation:
 * - Buys/Sells impact Pool Liquidity (XY=K).
 * - Taxes are collected and sent 100% to MiningManager.
 * - MiningManager splits Tax between Treasury & Delegation.
* Optimized for Arbitrum Network.
 */
contract NFTLiquidityPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC721ReceiverUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    IDelegationManager public delegationManager;

    struct Pool {
        uint256 tokenBalance;
        uint256 nftCount;
        uint256 k; // Constant Product
        bool isInitialized;
        mapping(uint256 => uint256) tokenIdToIndex;
        uint256[] tokenIds;
    }

    Pool private pool;
    uint256 public boostBips;

    // --- Optimized Keys (bytes32) ---
    
    bytes32 public constant PSTAKE_SERVICE_KEY = keccak256("NFT_POOL_ACCESS");
    bytes32 public constant BUY_TAX_KEY = keccak256("NFT_POOL_BUY_TAX_BIPS");
    bytes32 public constant SELL_TAX_KEY = keccak256("NFT_POOL_SELL_TAX_BIPS");

    // --- Events ---

    event LiquidityAdded(uint256 indexed boostBips, uint256 nftAmount, uint256 bkcAmount);
    event NFTsAddedToPool(uint256 indexed boostBips, uint256 nftAmount);
    event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price, uint256 taxPaid);
    event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid);

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error PoolAlreadyInitialized();
    error PoolNotInitialized();
    error BoosterNotConfigured();
    error InsufficientPStake();
    error ContractDoesNotOwnNFT();
    error TierMismatch();
    error NotOwner();
    error InsufficientLiquidity();
    error PriceCheckFailed();
    error MathError();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress,
        uint256 _boostBips
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();
        if (_boostBips == 0) revert InvalidAmount();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        
        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        
        if (_bkcTokenAddress == address(0) || _dmAddress == address(0)) revert InvalidAddress();

        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        boostBips = _boostBips;
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // --- Liquidity Management ---

    function addInitialLiquidity(
        uint256[] calldata _tokenIds,
        uint256 _bkcAmount
    ) external onlyOwner nonReentrant {
        if (pool.isInitialized) revert PoolAlreadyInitialized();
        if (_tokenIds.length == 0) revert InvalidAmount();
        if (_bkcAmount == 0) revert InvalidAmount();

        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable rewardBoosterNFT = IERC721Upgradeable(rewardBoosterAddress);
        
        pool.isInitialized = true;

        for (uint i = 0; i < _tokenIds.length;) {
            rewardBoosterNFT.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _addTokenId(pool, _tokenIds[i]);
            unchecked { ++i; }
        }

        bkcToken.safeTransferFrom(msg.sender, address(this), _bkcAmount);

        pool.nftCount = _tokenIds.length;
        pool.tokenBalance = _bkcAmount;
        pool.k = pool.nftCount * pool.tokenBalance;
        
        emit LiquidityAdded(boostBips, pool.nftCount, pool.tokenBalance);
    }

    function addMoreNFTsToPool(
        uint256[] calldata _tokenIds
    ) external onlyOwner nonReentrant {
        if (!pool.isInitialized) revert PoolNotInitialized();
        if (_tokenIds.length == 0) revert InvalidAmount();
        
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable rewardBoosterNFT = IERC721Upgradeable(rewardBoosterAddress);

        for (uint i = 0; i < _tokenIds.length;) {
            rewardBoosterNFT.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _addTokenId(pool, _tokenIds[i]);
            unchecked { ++i; }
        }

        pool.nftCount += _tokenIds.length;
        pool.k = pool.nftCount * pool.tokenBalance;
        
        emit NFTsAddedToPool(boostBips, _tokenIds.length);
    }

    // --- Trading Functions ---

    // BUY: User pays Price + Tax.
    // Price -> Pool Liquidity.
    // Tax -> MiningManager (Treasury + Delegation).
    function buyNextAvailableNFT(uint256 /* _boosterTokenId */) external nonReentrant {
        _checkPStakeRequirement();
        if (!pool.isInitialized || pool.nftCount == 0) revert InsufficientLiquidity();
        uint256 tokenIdToSell = pool.tokenIds[pool.tokenIds.length - 1];
        _processBuy(tokenIdToSell);
    }
    
    function buySpecificNFT(uint256 _tokenId) external nonReentrant {
        _checkPStakeRequirement();
        if (!pool.isInitialized || pool.nftCount == 0) revert InsufficientLiquidity();
        
        if (pool.tokenIdToIndex[_tokenId] == 0 && (pool.tokenIds.length == 0 || pool.tokenIds[0] != _tokenId)) {
             if(IERC721Upgradeable(ecosystemManager.getBoosterAddress()).ownerOf(_tokenId) != address(this)) {
                 revert ContractDoesNotOwnNFT();
             }
        }
        _processBuy(_tokenId);
    }

    function _processBuy(uint256 _tokenId) internal {
        uint256 price = getBuyPrice();
        if (price == type(uint256).max) revert MathError();

        // 1. Calculate Admin Defined Fee (Buy Tax)
        uint256 taxBips = ecosystemManager.getFee(BUY_TAX_KEY);
        uint256 taxAmount = (price * taxBips) / 10000;
        
        uint256 totalAmountToPull = price + taxAmount;

        // 2. Pull Total BKC from User
        bkcToken.safeTransferFrom(msg.sender, address(this), totalAmountToPull);

        // 3. Send 100% of Tax to MiningManager
        // The MiningManager will split this between Treasury and Delegation based on Hub Rules.
        if (taxAmount > 0) {
            _sendToMiningManager(BUY_TAX_KEY, taxAmount);
        }

        // 4. Update Pool (Price stays in pool)
        pool.tokenBalance += price;
        pool.nftCount--;
        
        pool.k = (pool.nftCount == 0) ? 0 : pool.tokenBalance * pool.nftCount;

        // 5. Transfer NFT
        _removeTokenId(pool, _tokenId);
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        IERC721Upgradeable(rewardBoosterAddress).safeTransferFrom(address(this), msg.sender, _tokenId);

        emit NFTBought(msg.sender, boostBips, _tokenId, price, taxAmount);
    }

    // SELL: User gets Price - Tax.
    // Price -> Leaves Pool Liquidity.
    // Tax -> MiningManager (Treasury + Delegation).
    function sellNFT(
        uint256 _tokenId, 
        uint256 /* _boosterTokenId */, 
        uint256 _minBkcExpected 
    ) external nonReentrant {
        _checkPStakeRequirement();

        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);
        
        if (rewardBoosterNFT.ownerOf(_tokenId) != msg.sender) revert NotOwner();
        if (rewardBoosterNFT.boostBips(_tokenId) != boostBips) revert TierMismatch();
        if (!pool.isInitialized) revert PoolNotInitialized();

        uint256 sellValue = getSellPrice();
        
        // 1. Calculate Admin Defined Fee (Sell Tax)
        uint256 taxBipsBase = ecosystemManager.getFee(SELL_TAX_KEY);
        uint256 taxAmount = (sellValue * taxBipsBase) / 10000;
        
        uint256 payoutToSeller = sellValue - taxAmount;

        if (payoutToSeller < _minBkcExpected) revert PriceCheckFailed();
        if (pool.tokenBalance < sellValue) revert InsufficientLiquidity();

        // 2. Receive NFT
        IERC721Upgradeable(rewardBoosterAddress).safeTransferFrom(msg.sender, address(this), _tokenId);

        // 3. Payout User
        if (payoutToSeller > 0) {
            bkcToken.safeTransfer(msg.sender, payoutToSeller);
        }

        // 4. Send 100% of Tax to MiningManager
        if (taxAmount > 0) {
             _sendToMiningManager(SELL_TAX_KEY, taxAmount);
        }

        // 5. Update Pool
        // Balance Logic: Pool lost `sellValue` (part to user, part to tax/mining)
        pool.tokenBalance -= sellValue;
        pool.nftCount++;
        
        _addTokenId(pool, _tokenId);
        pool.k = pool.tokenBalance * pool.nftCount;

        emit NFTSold(msg.sender, boostBips, _tokenId, payoutToSeller, taxAmount);
    }

    // --- Helpers ---

    function _sendToMiningManager(bytes32 _taxKey, uint256 _amount) internal {
        address miningManagerAddress = ecosystemManager.getMiningManagerAddress();
        if (miningManagerAddress != address(0)) {
            bkcToken.safeTransfer(miningManagerAddress, _amount);
            
            // Calls MiningManager which will check EcosystemManager for Fee Distribution Rules
            IMiningManager(miningManagerAddress).performPurchaseMining(_taxKey, _amount);
        }
    }

    function _checkPStakeRequirement() internal view {
        ( , uint256 minPStake) = ecosystemManager.getServiceRequirements(PSTAKE_SERVICE_KEY);
        if (minPStake > 0) {
            uint256 userPStake = delegationManager.userTotalPStake(msg.sender);
            if (userPStake < minPStake) revert InsufficientPStake();
        }
    }

    function _addTokenId(Pool storage _pool, uint256 _tokenId) internal {
        _pool.tokenIdToIndex[_tokenId] = _pool.tokenIds.length;
        _pool.tokenIds.push(_tokenId);
    }

    function _removeTokenId(Pool storage _pool, uint256 _tokenId) internal {
        uint256 indexToRemove = _pool.tokenIdToIndex[_tokenId];
        uint256 lastIndex = _pool.tokenIds.length - 1;
        if (indexToRemove != lastIndex) {
            uint256 lastTokenId = _pool.tokenIds[lastIndex];
            _pool.tokenIds[indexToRemove] = lastTokenId;
            _pool.tokenIdToIndex[lastTokenId] = indexToRemove;
        }
        _pool.tokenIds.pop();
        delete _pool.tokenIdToIndex[_tokenId];
    }

    // --- Views ---

    function getBuyPrice() public view returns (uint256) {
        if (!pool.isInitialized || pool.nftCount <= 1) return type(uint256).max;
        uint256 newBalance = pool.k / (pool.nftCount - 1);
        if (newBalance < pool.tokenBalance) return 0;
        return newBalance - pool.tokenBalance;
    }

    function getSellPrice() public view returns (uint256) {
        if (!pool.isInitialized) return 0;
        uint256 newBalance = pool.k / (pool.nftCount + 1);
        if (pool.tokenBalance < newBalance) return 0;
        return pool.tokenBalance - newBalance;
    }
    
    function getPoolInfo() external view returns (uint256 tokenBalance, uint256 nftCount, uint256 k) {
        return (pool.tokenBalance, pool.nftCount, pool.k);
    }
    
    function getAvailableTokenIds() external view returns (uint256[] memory) {
        return pool.tokenIds;
    }
}