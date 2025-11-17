// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

contract NFTLiquidityPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC721ReceiverUpgradeable
{
    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    IDelegationManager public delegationManager;

    struct Pool {
        uint256 tokenBalance;
        uint256 nftCount;
        uint256 k;
        bool isInitialized;
        mapping(uint256 => uint256) tokenIdToIndex;
        uint256[] tokenIds;
    }

    Pool private pool;
    uint256 public boostBips;
    string public constant PSTAKE_SERVICE_KEY = "NFT_POOL_ACCESS";
    string public constant TAX_BIPS_KEY = "NFT_POOL_TAX_BIPS";
    // TAX_TREASURY_SHARE_KEY and TAX_DELEGATOR_SHARE_KEY are no longer used here
    string public constant TAX_LIQUIDITY_SHARE_KEY = "NFT_POOL_TAX_LIQUIDITY_SHARE_KEY";
    
    event LiquidityAdded(
        uint256 indexed boostBips,
        uint256 nftAmount,
        uint256 bkcAmount
    );
    event NFTsAddedToPool(uint256 indexed boostBips, uint256 nftAmount);
    event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price);
    event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid);

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress,
        uint256 _boostBips
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(
            _ecosystemManagerAddress != address(0),
            "NLP: EcosystemManager cannot be zero"
        );
        require(_initialOwner != address(0), "NLP: Invalid owner address");
        require(_boostBips > 0, "NLP: Boost Bips must be set");
        
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        require(
            _bkcTokenAddress != address(0) && _dmAddress != address(0),
            "NLP: Core contracts not set in Brain"
        );
        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        
        boostBips = _boostBips;
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function addInitialLiquidity(
        uint256[] calldata _tokenIds,
        uint256 _bkcAmount
    ) external onlyOwner nonReentrant {
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(
            rewardBoosterAddress != address(0),
            "NLP: Booster not configured in Brain"
        );
        IERC721Upgradeable rewardBoosterNFT = IERC721Upgradeable(rewardBoosterAddress);
        
        require(!pool.isInitialized, "NLP: Pool already initialized");
        require(_tokenIds.length > 0, "NLP: Must add at least one NFT");
        require(_bkcAmount > 0, "NLP: Must add BKC liquidity");
        pool.isInitialized = true;
        
        for (uint i = 0; i < _tokenIds.length; i++) {
            rewardBoosterNFT.safeTransferFrom(
                msg.sender,
                address(this),
                _tokenIds[i]
            );
            _addTokenId(pool, _tokenIds[i]);
        }

        require(
            bkcToken.transferFrom(msg.sender, address(this), _bkcAmount),
            "NLP: BKC transfer failed"
        );
        pool.nftCount = _tokenIds.length;
        pool.tokenBalance = _bkcAmount;
        pool.k = pool.nftCount * pool.tokenBalance;
        emit LiquidityAdded(boostBips, pool.nftCount, pool.tokenBalance);
    }

    function addMoreNFTsToPool(
        uint256[] calldata _tokenIds
    ) external onlyOwner nonReentrant {
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(
            rewardBoosterAddress != address(0),
            "NLP: Booster not configured in Brain"
        );
        IERC721Upgradeable rewardBoosterNFT = IERC721Upgradeable(rewardBoosterAddress);
        
        require(
            pool.isInitialized && pool.k > 0,
            "NLP: Pool not initialized with liquidity yet"
        );
        require(_tokenIds.length > 0, "NLP: Token IDs array cannot be empty");
        
        for (uint i = 0; i < _tokenIds.length; i++) {
            rewardBoosterNFT.safeTransferFrom(
                msg.sender,
                address(this),
                _tokenIds[i]
            );
            _addTokenId(pool, _tokenIds[i]);
        }

        pool.nftCount += _tokenIds.length;
        pool.k = pool.nftCount * pool.tokenBalance;
        emit NFTsAddedToPool(_tokenIds.length, boostBips);
    }

    function buyNFT(
        uint256 _tokenId,
        uint256 // _boosterTokenId (no longer used for fee)
    ) external nonReentrant {
        // 1. Authorization & pStake Check
        ( , uint256 minPStake) = ecosystemManager.getServiceRequirements(PSTAKE_SERVICE_KEY);
        if (minPStake > 0) {
            uint256 userPStake = IDelegationManager(ecosystemManager.getDelegationManagerAddress()).userTotalPStake(msg.sender);
            require(userPStake >= minPStake, "NLP: Insufficient pStake");
        }
        
        // No fee is charged on buy, only pStake check
        
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(
            rewardBoosterAddress != address(0),
            "NLP: Booster not configured in Brain"
        );
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);
        
        require(
            pool.isInitialized && pool.nftCount > 0,
            "NLP: No NFTs available in this pool"
        );
        require(
            IERC721Upgradeable(rewardBoosterAddress).ownerOf(_tokenId) == address(this),
            "NLP: Contract does not own this NFT"
        );
        require(
            rewardBoosterNFT.boostBips(_tokenId) == boostBips,
            "NLP: Token tier mismatch"
        );
        
        uint256 price = getBuyPrice();
        require(price < type(uint256).max, "NLP: Price calculation error");
        
        require(
            bkcToken.transferFrom(msg.sender, address(this), price),
            "NLP: BKC transfer failed"
        );
        
        pool.tokenBalance += price;
        pool.nftCount--;
        pool.k = (pool.nftCount == 0) ? 0 : pool.tokenBalance * pool.nftCount;
        _removeTokenId(pool, _tokenId);
        
        IERC721Upgradeable(rewardBoosterAddress).safeTransferFrom(
            address(this),
            msg.sender,
            _tokenId
        );
        
        emit NFTBought(msg.sender, boostBips, _tokenId, price);
    }

    function buyNextAvailableNFT(uint256 /* _boosterTokenId */) external nonReentrant {
        // 1. Authorization & pStake Check
        ( , uint256 minPStake) = ecosystemManager.getServiceRequirements(PSTAKE_SERVICE_KEY);
        if (minPStake > 0) {
            uint256 userPStake = IDelegationManager(ecosystemManager.getDelegationManagerAddress()).userTotalPStake(msg.sender);
            require(userPStake >= minPStake, "NLP: Insufficient pStake");
        }
        
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster not configured in Hub");
        require(pool.isInitialized && pool.nftCount > 0, "NLP: No NFTs available in this pool");
        require(pool.tokenIds.length > 0, "NLP: Pool tracking array is empty, desync");

        uint256 tokenIdToSell = pool.tokenIds[pool.tokenIds.length - 1];
        uint256 price = getBuyPrice();
        
        require(bkcToken.transferFrom(msg.sender, address(this), price), "NLP: BKC transfer failed");

        pool.tokenBalance += price;
        pool.nftCount--;
        pool.k = (pool.nftCount == 0) ? 0 : pool.tokenBalance * pool.nftCount;

        delete pool.tokenIdToIndex[tokenIdToSell];
        pool.tokenIds.pop();

        IERC721Upgradeable(rewardBoosterAddress).safeTransferFrom(address(this), msg.sender, tokenIdToSell);
        emit NFTBought(msg.sender, boostBips, tokenIdToSell, price);
    }

    function sellNFT(uint256 _tokenId, uint256 _boosterTokenId) external nonReentrant {
        // 1. Authorization & pStake Check
        ( , uint256 minPStake) = ecosystemManager.getServiceRequirements(PSTAKE_SERVICE_KEY);
        if (minPStake > 0) {
            uint256 userPStake = IDelegationManager(ecosystemManager.getDelegationManagerAddress()).userTotalPStake(msg.sender);
            require(userPStake >= minPStake, "NLP: Insufficient pStake");
        }
        
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster not configured in Hub");
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);

        require(IERC721Upgradeable(rewardBoosterAddress).ownerOf(_tokenId) == msg.sender, "NLP: Not the owner");
        uint256 nftBoostBips = rewardBoosterNFT.boostBips(_tokenId);
        require(nftBoostBips == boostBips, "NLP: Wrong pool for this NFT tier");
        require(pool.isInitialized, "NLP: Pool does not exist for this tier");
        
        uint256 sellValue = getSellPrice();
        require(pool.tokenBalance >= sellValue, "NLP: Pool has insufficient BKC liquidity");

        // --- 2. TAX CALCULATION ---
        uint256 taxBipsBase = ecosystemManager.getFee(TAX_BIPS_KEY);
        uint256 discountBips = 0;

        if (_boosterTokenId > 0) {
            try rewardBoosterNFT.ownerOf(_boosterTokenId)
            returns (address owner) {
                if (owner == msg.sender) {
                    uint256 userBoostBips = rewardBoosterNFT.boostBips(_boosterTokenId);
                    discountBips = ecosystemManager.getBoosterDiscount(userBoostBips);
                }
            } catch { /* Ignore discount */ }
        }

        uint256 finalTaxBips = (taxBipsBase > discountBips)
            ? taxBipsBase - discountBips
            : 0;
        
        uint256 finalTaxAmount = (sellValue * finalTaxBips) / 10000;
        uint256 payoutToSeller = sellValue - finalTaxAmount;
        
        // --- 3. TRANSFERS ---
        IERC721Upgradeable(rewardBoosterAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId
        );
        
        if (payoutToSeller > 0) {
            require(
                bkcToken.transfer(msg.sender, payoutToSeller),
                "NLP: Payout transfer failed"
            );
        }

        // --- 4. TAX DISTRIBUTION (via MiningManager) ---
        if (finalTaxAmount > 0) {
            _distributeTax(finalTaxAmount);
        }

        // --- 5. UPDATE POOL STATE ---
        // Calculate the portion of tax that stays in the pool
        uint256 liquidityShareBips = ecosystemManager.getFee(TAX_LIQUIDITY_SHARE_KEY);
        uint256 liquidityAmount = (finalTaxAmount * liquidityShareBips) / 10000;

        // Pool balance is reduced by the full sell value...
        pool.tokenBalance -= sellValue;
        // ...but increased by the liquidity share of the tax.
        pool.tokenBalance += liquidityAmount;
        
        pool.nftCount++;
        _addTokenId(pool, _tokenId);
        pool.k = pool.tokenBalance * pool.nftCount; 

        emit NFTSold(
            msg.sender,
            boostBips,
            _tokenId,
            payoutToSeller,
            finalTaxAmount
        );
    }

    // --- Internal Functions ---

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

    /**
     * @notice Distributes the non-liquidity portion of the tax to the MiningManager funnel.
     */
    function _distributeTax(uint256 _taxAmount) internal {
        if (_taxAmount == 0) return;

        address miningManagerAddress = ecosystemManager.getMiningManagerAddress();
        require(miningManagerAddress != address(0), "NLP: MiningManager not configured in Hub");

        // 1. Calculate the portion of the tax that stays in the pool for liquidity
        uint256 liquidityShareBips = ecosystemManager.getFee(TAX_LIQUIDITY_SHARE_KEY);
        uint256 liquidityAmount = (_taxAmount * liquidityShareBips) / 10000;

        // 2. The remaining portion of the tax is sent to the MiningManager
        uint256 popAmount = _taxAmount - liquidityAmount;

        if (popAmount > 0) {
            // 3. Transfer the PoP amount to the MiningManager
            // Note: Tokens are already in this contract (accounted for in sellNFT balance update)
            require(
                bkcToken.transfer(miningManagerAddress, popAmount),
                "NLP: Tax transfer to MiningManager failed"
            );

            // 4. Call the MiningManager to trigger the universal revenue funnel
            IMiningManager(miningManagerAddress)
                .performPurchaseMining(
                    TAX_BIPS_KEY, // Use the tax key as the service key
                    popAmount
                );
        }
        // The `liquidityAmount` is handled in the `sellNFT` function, which adds it back to pool.tokenBalance
    }

    // --- View Functions ---

    function getBuyPrice() public view returns (uint256) {
        if (!pool.isInitialized || pool.nftCount == 0) return type(uint256).max;
        if (pool.nftCount <= 1) return type(uint256).max; 
        uint256 newY = pool.k / (pool.nftCount - 1);
        if (newY < pool.tokenBalance) return 0;
        return newY - pool.tokenBalance;
    }

    function getSellPrice() public view returns (uint256) {
        if (!pool.isInitialized || pool.nftCount == type(uint256).max) return 0;
        uint256 newY = pool.k / (pool.nftCount + 1);
        return (pool.tokenBalance > newY) ? pool.tokenBalance - newY : 0;
    }

    function getPoolInfo() 
        external 
        view 
        returns (
            uint256 tokenBalance, 
            uint256 nftCount, 
            uint256 k, 
            bool isInitialized
        )
    {
        return (
            pool.tokenBalance,
            pool.nftCount,
            pool.k,
            pool.isInitialized
        );
    }

    function getAvailableTokenIds() external view returns (uint256[] memory) {
        return pool.tokenIds;
    }
}