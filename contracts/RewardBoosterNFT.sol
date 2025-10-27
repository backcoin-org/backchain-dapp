// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RewardBoosterNFT (V2 - Mint on Demand Support)
 * @notice Permite que um contrato de venda autorizado minte NFTs sob demanda.
 */
contract RewardBoosterNFT is ERC721, Ownable {
    using Strings for uint256;

    // --- State Variables ---
    mapping(uint256 => uint256) public boostBips; //
    mapping(uint256 => string) public tokenMetadataFile; //
    string private _customBaseURI; //
    uint256 private _tokenIdCounter; //

    // --- NOVO: Endereço do Contrato de Venda Autorizado ---
    address public saleContractAddress;

    // --- Events ---
    event BoosterMinted(uint256 indexed tokenId, address indexed owner, uint256 boostInBips); //
    event SaleContractAddressSet(address indexed saleContract); // Novo evento

    // --- Constructor ---
    constructor(
        address _initialOwner
    ) ERC721("Backchain Reward Booster", "BKCB") Ownable(_initialOwner) {} //

    // --- Funções de Configuração (Apenas para o Dono) ---

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _customBaseURI = newBaseURI; //
    }

    /**
     * @notice (Owner) Define o endereço do contrato PublicSale autorizado a mintar.
     * @param _saleAddress O endereço do contrato PublicSale implantado.
     */
    function setSaleContractAddress(address _saleAddress) external onlyOwner {
        require(_saleAddress != address(0), "RBNFT: Endereço inválido");
        saleContractAddress = _saleAddress;
        emit SaleContractAddressSet(_saleAddress);
    }

    // --- Funções de Mint ---

    /**
     * @notice (Owner) Minta um lote de NFTs para um endereço específico.
     * @dev Útil para mintar NFTs para liquidez inicial ou outras distribuições controladas pelo dono.
     */
    function ownerMintBatch(
        address to,
        uint256 quantity,
        uint256 boostInBips,
        string calldata metadataFile
    ) external onlyOwner {
        require(quantity > 0, "RBNFT: Quantidade deve ser > 0"); //
        for (uint256 i = 0; i < quantity; i++) {
            _mintInternal(to, boostInBips, metadataFile);
        }
    }

    /**
     * @notice (PublicSale Contract) Minta um único NFT quando chamado pelo contrato de venda autorizado.
     * @param to O endereço do comprador que receberá o NFT.
     * @param boostInBips O valor do boost associado ao tier comprado.
     * @param metadataFile O nome/URI do arquivo de metadados para este tier.
     * @return tokenId O ID do token recém-criado.
     */
    function mintFromSale(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) external returns (uint256) {
        require(msg.sender == saleContractAddress, "RBNFT: Chamador não autorizado");
        require(to != address(0), "RBNFT: Mint para endereço zero");
        return _mintInternal(to, boostInBips, metadataFile);
    }

    /**
     * @dev Função interna para a lógica de mint, chamada por ownerMintBatch e mintFromSale.
     */
    function _mintInternal(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) internal returns (uint256) {
         uint256 tokenId = _tokenIdCounter++; //
        _safeMint(to, tokenId); //

        boostBips[tokenId] = boostInBips; //
        tokenMetadataFile[tokenId] = metadataFile; //

        emit BoosterMinted(tokenId, to, boostInBips); //
        return tokenId;
    }


    // --- Funções de Transferência (Mantidas) ---
    // (Útil se o dono precisar mover NFTs mintados para liquidez, etc.)

    function batchTransferFrom(address from, address to, uint256[] calldata tokenIds) external {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "ERC721: caller is not token owner or approved"); //
        for (uint i = 0; i < tokenIds.length; i++) {
            _transfer(from, to, tokenIds[i]); //
        }
    }

    // --- Funções de Consulta (View) ---

    // Função getHighestBoost ainda causa revert, forçando cálculo off-chain
    function getHighestBoost(address user) public view returns (uint256) {
        revert("RBNFT: Highest boost must be calculated off-chain or requires ERC721Enumerable."); //
    }

    // Função de enumeração removida
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        revert("RBNFT: Enumeration function removed for gas efficiency."); //
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token"); //
        string memory baseURI = _customBaseURI; //
        // Retorna URI base + metadataFile se baseURI estiver definida, senão string vazia
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenMetadataFile[tokenId])) : "";
    }

    // Função _exists mantida
    function _exists(uint256 tokenId) internal view returns (bool) {
        // Usa ownerOf(tokenId) != address(0) para verificar existência
        // NOTA: ownerOf reverte se o token não existe, então _exists pode precisar ser ajustado
        //       se você quiser um booleano `false` em vez de revert.
        //       Uma alternativa é usar `_owners[tokenId] != address(0)` se estiver usando
        //       a implementação padrão do OZ ERC721.
        try this.ownerOf(tokenId) returns (address owner) {
             return owner != address(0);
        } catch {
             return false; // Retorna false se ownerOf reverter (token não existe)
        }
    }
}