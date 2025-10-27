// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EcosystemManager.sol"; // Precisamos do Hub para a tesouraria

// --- Interface Mínima do RewardBoosterNFT ---
interface IRewardBoosterNFT {
    /**
     * @notice Minta um novo Booster NFT. Chamado pelo PublicSale.
     * @param to O endereço que receberá o NFT (o comprador).
     * @param boostInBips O valor do boost associado ao tier.
     * @param metadataFile O nome/URI do arquivo de metadados para este tier.
     * @return tokenId O ID do token recém-criado.
     */
    function mintFromSale(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) external returns (uint256);
}

/**
 * @title PublicSale (V3 - Venda Ilimitada)
 * @dev Vende NFTs mintando-os sob demanda, pagando em BNB.
 * @notice Venda sem maxSupply. A contagem é apenas informativa.
 */
contract PublicSale is Ownable {
    IRewardBoosterNFT public immutable rewardBoosterNFT;
    IEcosystemManager public immutable ecosystemManager;

    struct Tier {
        uint256 priceInWei;     // Preço em Wei (BNB)
        // --- REMOVIDO ---
        // uint256 maxSupply;      // Não há mais suprimento máximo
        uint256 mintedCount;    // Quantos já foram vendidos (apenas informativo)
        uint256 boostBips;      // O boost associado (ex: 5000, 500, 100)
        string metadataFile;    // Nome/URI do arquivo JSON (ex: "iron_booster.json")
        bool isConfigured;      // Flag para saber se o tier foi setado
    }

    mapping(uint256 => Tier) public tiers;
    event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price);

    /**
     * @dev Construtor recebe o endereço do RewardBoosterNFT e do Hub.
     */
    constructor(
        address _rewardBoosterAddress, // <-- Endereço do contrato que MINTA
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_rewardBoosterAddress != address(0), "Sale: Booster NFT Contract inválido");
        require(_ecosystemManagerAddress != address(0), "Sale: Hub inválido");

        rewardBoosterNFT = IRewardBoosterNFT(_rewardBoosterAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
    }

    /**
     * @notice (Dono) Configura um tier de venda: preço, boost e metadados.
     * @param _tierId O ID do tier (ex: 0 para Diamond, 5 para Iron, 6 para Crystal).
     * @param _priceInWei O preço do NFT em Wei (BNB).
     * @param _boostBips O valor do boost em BIPS (ex: 500 para Iron, 100 para Crystal).
     * @param _metadataFile O nome/URI do arquivo JSON dos metadados.
     */
    function setTier(
        uint256 _tierId,
        uint256 _priceInWei,
        // --- REMOVIDO ---
        // uint256 _maxSupply,
        uint256 _boostBips,
        string calldata _metadataFile
    ) external onlyOwner {
        Tier storage tier = tiers[_tierId];
        tier.priceInWei = _priceInWei;
        // --- REMOVIDO ---
        // tier.maxSupply = _maxSupply;
        tier.mintedCount = 0; // Reseta a contagem se reconfigurar
        tier.boostBips = _boostBips;
        tier.metadataFile = _metadataFile;
        tier.isConfigured = true; // Marca como configurado
    }

    /**
     * @notice (Usuário) Compra um único NFT de um tier, pagando em BNB.
     */
    function buyNFT(uint256 _tierId) external payable {
        buyMultipleNFTs(_tierId, 1);
    }

    /**
     * @notice (Usuário) Compra múltiplos NFTs de um tier, pagando em BNB.
     * @dev Chama a função de mint no RewardBoosterNFT.
     */
    function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) public payable {
        require(_quantity > 0, "Venda: Quantidade deve ser > 0");
        
        Tier storage tier = tiers[_tierId];
        require(tier.isConfigured, "Venda: Tier não configurado");

        uint256 totalPrice = tier.priceInWei * _quantity;
        require(msg.value == totalPrice, "Venda: Valor BNB incorreto");
        
        // --- REMOVIDO ---
        // Checagem de estoque foi removida para permitir venda ilimitada.
        // require(tier.mintedCount + _quantity <= tier.maxSupply, "Venda: Estoque esgotado para este tier");

        // Atualiza a contagem (apenas informativo)
        tier.mintedCount += _quantity;

        // Chama a função de mint no RewardBoosterNFT para cada unidade
        for (uint i = 0; i < _quantity; i++) {
            // Chama a função externa no RewardBoosterNFT
            uint256 newTokenId = rewardBoosterNFT.mintFromSale(
                msg.sender,         // 'to' (o comprador)
                tier.boostBips,     // Boost do tier
                tier.metadataFile   // Metadados do tier
            );
            // Emite o evento com o ID do token retornado
            emit NFTSold(msg.sender, _tierId, newTokenId, tier.priceInWei);
        }
    }

    /**
     * @notice (Dono) Resgata os fundos em BNB acumulados no contrato.
     * @dev Busca o endereço da tesouraria no Hub.
     */
    function withdrawFunds() external onlyOwner {
        // Busca endereço no Hub
        address treasuryWallet = ecosystemManager.getTreasuryAddress();
        require(treasuryWallet != address(0), "Sale: Tesouraria não configurada no Hub");

        uint256 balance = address(this).balance;
        if (balance > 0) {
            // Envia o saldo em BNB para a tesouraria
            (bool success, ) = treasuryWallet.call{value: balance}("");
            require(success, "Saque falhou");
        }
    }
}