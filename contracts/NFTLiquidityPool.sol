// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// Importa as interfaces do Hub, Token e Booster
import "./EcosystemManager.sol"; 
import "./BKCToken.sol"; 

/**
 * @title NFTLiquidityPool (AMM para RewardBoosterNFT)
 * @dev V2: Contrato "Spoke" refatorado para usar o EcosystemManager.
 * @notice V3: Adicionado "Imposto" na venda (10%) com distribuição 4/4/2 e desconto de booster.
 */
contract NFTLiquidityPool is Ownable, ReentrancyGuard, IERC721Receiver {
    
    IEcosystemManager public immutable ecosystemManager;
    BKCToken public immutable bkcToken;
    
    struct Pool {
        uint256 tokenBalance;
        uint256 nftCount;
        uint256 k;
        bool isInitialized;
    }

    mapping(uint256 => Pool) public pools;

    // --- CHAVES PARA O HUB (Exemplos) ---
    // Você definirá os valores no EcosystemManager
    string public constant PSTAKE_SERVICE_KEY = "NFT_POOL_ACCESS"; // Chave para verificar pStake
    string public constant TAX_BIPS_KEY = "NFT_POOL_TAX_BIPS"; // Chave para taxa base do imposto (ex: 1000 = 10%)
    string public constant TAX_TREASURY_SHARE_KEY = "NFT_POOL_TAX_TREASURY_SHARE_BIPS"; // Chave para % da Tesouraria sobre o imposto (ex: 4000 = 40%)
    string public constant TAX_DELEGATOR_SHARE_KEY = "NFT_POOL_TAX_DELEGATOR_SHARE_BIPS"; // Chave para % dos Delegadores sobre o imposto (ex: 4000 = 40%)
    string public constant TAX_LIQUIDITY_SHARE_KEY = "NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS"; // Chave para % da Liquidez sobre o imposto (ex: 2000 = 20%)


    event PoolCreated(uint256 indexed boostBips);
    event LiquidityAdded(uint256 indexed boostBips, uint256 nftAmount, uint256 bkcAmount);
    event NFTsAddedToPool(uint256 indexed boostBips, uint256 nftAmount);
    event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price);
    event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid); // Alterado feePaid para taxPaid

    constructor(
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_ecosystemManagerAddress != address(0), "NLP: Hub não pode ser zero");
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(_bkcTokenAddress != address(0), "NLP: Token não configurado no Hub");
        bkcToken = BKCToken(_bkcTokenAddress);
    }

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // --- Funções de Administração (Owner) ---
    // (Permanecem as mesmas da versão anterior)

    function createPool(uint256 _boostBips) external onlyOwner {
        require(!pools[_boostBips].isInitialized, "Pool already exists");
        pools[_boostBips].isInitialized = true;
        emit PoolCreated(_boostBips);
    }

    function addInitialLiquidity(uint256 _boostBips, uint256[] calldata _tokenIds, uint256 _bkcAmount) external onlyOwner nonReentrant {
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster não configurado no Hub");
        IERC721 rewardBoosterNFT = IERC721(rewardBoosterAddress);

        Pool storage pool = pools[_boostBips];
        require(pool.isInitialized, "Pool not initialized");
        require(pool.nftCount == 0, "Liquidity already added");
        require(_tokenIds.length > 0 && _bkcAmount > 0, "Invalid initial liquidity");

        for (uint i = 0; i < _tokenIds.length; i++) {
            rewardBoosterNFT.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
        }

        require(bkcToken.transferFrom(msg.sender, address(this), _bkcAmount), "BKC transfer failed");

        pool.nftCount = _tokenIds.length;
        pool.tokenBalance = _bkcAmount;
        pool.k = pool.nftCount * pool.tokenBalance;

        emit LiquidityAdded(_boostBips, pool.nftCount, pool.tokenBalance);
    }
    
    function addMoreNFTsToPool(uint256 _boostBips, uint256[] calldata _tokenIds) external onlyOwner nonReentrant {
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster não configurado no Hub");
        IERC721 rewardBoosterNFT = IERC721(rewardBoosterAddress);

        Pool storage pool = pools[_boostBips];
        require(pool.isInitialized && pool.nftCount > 0, "Pool not initialized with liquidity yet");
        require(_tokenIds.length > 0, "Token IDs array cannot be empty");

        for (uint i = 0; i < _tokenIds.length; i++) {
            rewardBoosterNFT.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
        }

        pool.nftCount += _tokenIds.length;
        pool.k = pool.nftCount * pool.tokenBalance;

        emit NFTsAddedToPool(_boostBips, _tokenIds.length);
    }

    // --- Funções de Negociação ---

    /**
     * @notice Compra um NFT do pool.
     * @dev Requer pStake mínimo. Sem imposto adicional na compra (por enquanto).
     */
    function buyNFT(uint256 _boostBips, uint256 _tokenId, uint256 _boosterTokenId) external nonReentrant {
        // 1. AUTORIZAÇÃO: Verifica o pStake mínimo (Taxa de serviço = 0)
        ecosystemManager.authorizeService(
            PSTAKE_SERVICE_KEY, 
            msg.sender,
            _boosterTokenId
        );

        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster não configurado no Hub");
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);

        Pool storage pool = pools[_boostBips];
        require(pool.isInitialized && pool.nftCount > 0, "No NFTs available");
        require(rewardBoosterNFT.ownerOf(_tokenId) == address(this), "Contract does not own");
        require(rewardBoosterNFT.boostBips(_tokenId) == _boostBips, "Token tier mismatch");

        uint256 price = getBuyPrice(_boostBips);
        require(bkcToken.transferFrom(msg.sender, address(this), price), "BKC transfer failed");
        
        pool.tokenBalance += price;
        pool.nftCount--;
        pool.k = pool.tokenBalance * pool.nftCount;
        
        IERC721(rewardBoosterAddress).safeTransferFrom(address(this), msg.sender, _tokenId);
        emit NFTBought(msg.sender, _boostBips, _tokenId, price);
    }
    
    /**
     * @notice Vende um NFT para o pool.
     * @dev Requer pStake, cobra Imposto (com desconto) e distribui 4/4/2.
     */
    function sellNFT(uint256 _tokenId, uint256 _boosterTokenId) external nonReentrant {
        
        // 1. AUTORIZAÇÃO: Verifica o pStake mínimo (Taxa de serviço = 0)
        ecosystemManager.authorizeService(
            PSTAKE_SERVICE_KEY,
            msg.sender,
            _boosterTokenId
        );

        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
        require(rewardBoosterAddress != address(0), "NLP: Booster não configurado no Hub");
        IRewardBoosterNFT rewardBoosterNFT = IRewardBoosterNFT(rewardBoosterAddress);

        require(rewardBoosterNFT.ownerOf(_tokenId) == msg.sender, "Not the owner");
        
        uint256 boostBips = rewardBoosterNFT.boostBips(_tokenId);
        require(boostBips > 0, "Not a valid Booster NFT");
        
        Pool storage pool = pools[boostBips];
        require(pool.isInitialized, "Pool does not exist");
        
        uint256 sellValue = getSellPrice(boostBips);
        require(pool.tokenBalance >= sellValue, "Pool insufficient liquidity");
        
        // --- 2. CÁLCULO DO IMPOSTO (NOVO) ---
        uint256 taxBipsBase = ecosystemManager.getFee(TAX_BIPS_KEY); // Ex: 1000 (10%)
        uint256 discountBips = 0;

        // Calcula desconto se booster válido for fornecido
        if (_boosterTokenId > 0) {
            try IRewardBoosterNFT(rewardBoosterAddress).ownerOf(_boosterTokenId) returns (address owner) {
                if (owner == msg.sender) {
                    uint256 userBoostBips = IRewardBoosterNFT(rewardBoosterAddress).boostBips(_boosterTokenId);
                    discountBips = ecosystemManager.getBoosterDiscount(userBoostBips);
                }
            } catch { /* O token não existe ou erro, ignora desconto */ }
        }

        uint256 finalTaxBips = (taxBipsBase > discountBips) ? taxBipsBase - discountBips : 0;
        uint256 finalTaxAmount = (sellValue * finalTaxBips) / 10000;
        uint256 payoutToSeller = sellValue - finalTaxAmount;

        // --- 3. TRANSFERÊNCIAS ---
        IERC721(rewardBoosterAddress).safeTransferFrom(msg.sender, address(this), _tokenId);
        if (payoutToSeller > 0) {
            bkcToken.transfer(msg.sender, payoutToSeller);
        }

        // --- 4. DISTRIBUIÇÃO DO IMPOSTO (4/4/2) ---
        if (finalTaxAmount > 0) {
            _distributeTax(finalTaxAmount); // Nova função de distribuição
        }

        // --- 5. ATUALIZA ESTADO DO POOL (Levando em conta o imposto) ---
        // O valor total que saiu do balanço para fora do contrato é:
        // payoutToSeller + treasuryAmount + delegatorAmount
        // O liquidityAmount nunca saiu.
        // É mais fácil pensar: O balanço diminuiu pelo sellValue total inicialmente,
        // mas depois o liquidityAmount "ficou".
        
        uint256 liquidityShareBips = ecosystemManager.getFee(TAX_LIQUIDITY_SHARE_KEY); // Ex: 2000 (20% do imposto)
        uint256 liquidityAmount = (finalTaxAmount * liquidityShareBips) / 10000;

        pool.tokenBalance -= sellValue; // Tira o valor bruto que deveria ter sido pago
        pool.tokenBalance += liquidityAmount; // Adiciona de volta a parte que ficou para liquidez
        pool.nftCount++;
        pool.k = pool.tokenBalance * pool.nftCount;
        
        emit NFTSold(msg.sender, boostBips, _tokenId, payoutToSeller, finalTaxAmount);
    }

    /**
     * @notice (NOVO) Função interna de distribuição do Imposto (4/4/2).
     */
    function _distributeTax(uint256 _taxAmount) internal {
        if (_taxAmount == 0) return;

        address treasury = ecosystemManager.getTreasuryAddress();
        address dm = ecosystemManager.getDelegationManagerAddress();
        require(treasury != address(0) && dm != address(0), "NLP: Hub não configurado");

        // Pega as porcentagens de distribuição do Hub
        uint256 treasuryShareBips = ecosystemManager.getFee(TAX_TREASURY_SHARE_KEY); // Ex: 4000
        uint256 delegatorShareBips = ecosystemManager.getFee(TAX_DELEGATOR_SHARE_KEY); // Ex: 4000
        // A parte da liquidez não precisa ser buscada, é o que sobrar

        uint256 treasuryAmount = (_taxAmount * treasuryShareBips) / 10000;
        uint256 delegatorAmount = (_taxAmount * delegatorShareBips) / 10000;
        uint256 liquidityAmount = _taxAmount - treasuryAmount - delegatorAmount; // O restante (2%)

        // 1. Envia para Tesouraria
        if (treasuryAmount > 0) {
            // Os tokens já estão neste contrato, então usamos transfer()
            require(bkcToken.transfer(treasury, treasuryAmount), "NLP: Tax to Treasury failed");
        }
        
        // 2. Envia para Delegadores (CORREÇÃO DO BUG)
        if (delegatorAmount > 0) {
            bkcToken.approve(dm, delegatorAmount);
            IDelegationManager(dm).depositRewards(0, delegatorAmount);
        }

        // 3. A parte da Liquidez (liquidityAmount) já está contabilizada
        // ao ajustar o pool.tokenBalance na função sellNFT.
        // Não há transferência adicional aqui.
    }
    
    // --- Funções de Consulta (View) ---
    // (Permanecem as mesmas)

    function getBuyPrice(uint256 _boostBips) public view returns (uint256) {
        Pool storage pool = pools[_boostBips];
        if (!pool.isInitialized || pool.nftCount == 0) return type(uint256).max;
        // Evita divisão por zero se nftCount for 1
        if (pool.nftCount <= 1) return type(uint256).max; 
        uint256 newY = pool.k / (pool.nftCount - 1);
        return newY - pool.tokenBalance;
    }

    function getSellPrice(uint256 _boostBips) public view returns (uint256) {
        Pool storage pool = pools[_boostBips];
        if (!pool.isInitialized || pool.nftCount == type(uint256).max) return 0;
        uint256 newY = pool.k / (pool.nftCount + 1);
        // Evita underflow se newY for maior que tokenBalance (pool desbalanceado)
        return (pool.tokenBalance > newY) ? pool.tokenBalance - newY : 0;
    }
}