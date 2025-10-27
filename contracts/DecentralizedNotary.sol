// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Importações necessárias
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol";
// <-- NOVO: Importa as interfaces do Hub e do DM
import "./EcosystemManager.sol"; 

/**
 * @title DecentralizedNotary
 * @dev Contrato "Spoke" refatorado para usar o EcosystemManager.
 * @notice Todas as taxas, requisitos de pStake e descontos são agora
 * gerenciados pelo EcosystemManager (Hub).
 */
contract DecentralizedNotary is ERC721Enumerable, Ownable, ReentrancyGuard {

    // --- Contratos do Ecossistema ---
    BKCToken public immutable bkcToken;
    // <-- NOVO: O Hub que gerencia as regras
    IEcosystemManager public immutable ecosystemManager;

    // <-- REMOVIDO: delegationManager
    // <-- REMOVIDO: treasuryWallet
    // <-- REMOVIDO: minimumPStakeRequired
    // <-- REMOVIDO: notarizeFeeBKC
    // <-- REMOVIDO: treasuryFeeBips

    // --- Armazenamento dos NFTs ---
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _documentURIs;

    // --- State variable para Base URI ---
    string private _baseTokenURI;

    // --- Eventos ---
    event DocumentNotarized(
        address indexed user,
        uint256 indexed tokenId,
        string documentURI,
        uint256 feePaid
    );
    // <-- REMOVIDO: event NotarySettingsChanged

    /**
     * @dev Construtor do contrato.
     * @notice Agora recebe o endereço do Hub (EcosystemManager) e do Token.
     */
    constructor(
        address _bkcTokenAddress,
        address _ecosystemManagerAddress, // <-- NOVO
        address _initialOwner
    ) ERC721("Backchain Notary Certificate", "BKCN") Ownable(_initialOwner) {

        require(
            _bkcTokenAddress != address(0) &&
            _ecosystemManagerAddress != address(0), // <-- NOVO
            "Notary: Endereços inválidos"
        );

        bkcToken = BKCToken(_bkcTokenAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress); // <-- NOVO
    }

    // --- Função Principal (para Usuários) ---

    /**
     * @notice Registra um documento no blockchain.
     * @dev O usuário DEVE ter o pStake mínimo definido no Hub.
     * @dev A taxa é definida no Hub e o desconto do booster é aplicado.
     * @param _documentURI O hash ou URI do documento (ex: "ipfs://...").
     * @param _boosterTokenId O tokenId do Booster NFT do usuário (enviado pelo frontend).
     * Envie 0 se o usuário não tiver ou não quiser usar um booster.
     */
    function notarizeDocument(
        string calldata _documentURI,
        uint256 _boosterTokenId // <-- NOVO
    ) external nonReentrant {
        require(bytes(_documentURI).length > 0, "Notary: URI não pode ser vazia");

        // 1. CHAVE MESTRA: Autoriza e calcula a taxa em UMA chamada
        // Esta chamada verifica o pStake (reverte se insuficiente)
        // e retorna a taxa final com desconto aplicado.
        uint256 finalFee = ecosystemManager.authorizeService(
            "NOTARY_SERVICE", // Chave do Serviço (você define no Hub)
            msg.sender,       // O usuário a ser verificado
            _boosterTokenId   // O "cupom de desconto"
        );

        require(finalFee >= 0, "Notary: Taxa inválida");

        // 2. PEGA ENDEREÇOS ATUALIZADOS DO HUB
        address treasuryWallet = ecosystemManager.getTreasuryAddress();
        address delegationManager = ecosystemManager.getDelegationManagerAddress();
        require(treasuryWallet != address(0) && delegationManager != address(0), "Notary: Hub não configurado");

        // 3. COLETA E DISTRIBUIÇÃO (Regra 50/50)
        
        // Puxa a taxa final (já com desconto) do usuário
        require(bkcToken.transferFrom(msg.sender, address(this), finalFee), "Notary: Falha ao transferir taxa");

        uint256 treasuryAmount = finalFee / 2;
        uint256 delegatorAmount = finalFee - treasuryAmount;

        // A. Envia 50% para a Tesouraria
        if (treasuryAmount > 0) {
            require(bkcToken.transfer(treasuryWallet, treasuryAmount), "Notary: Falha ao enviar para Tesouraria");
        }

        // B. Envia 50% para o pool de Delegadores (CORREÇÃO DO BUG)
        if (delegatorAmount > 0) {
            // Aprova o DM para ele puxar os tokens
            bkcToken.approve(delegationManager, delegatorAmount);
            // Chama o DM, que agora irá puxar os tokens deste contrato
            IDelegationManager(delegationManager).depositRewards(0, delegatorAmount);
        }

        // 4. MINT DO NFT (Lógica original)
        uint256 tokenId = _tokenIdCounter++;
        _documentURIs[tokenId] = _documentURI;
        _safeMint(msg.sender, tokenId);

        emit DocumentNotarized(msg.sender, tokenId, _documentURI, finalFee);
    }

    // --- Funções de Administração (Owner) ---

    // <-- REMOVIDO: setNotarySettings (Agora é feito no EcosystemManager)

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    // --- Funções de Consulta (View) ---

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Retorna o URI completo do token.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");
        string memory base = _baseURI();
        string memory docURI = _documentURIs[tokenId];

        if (bytes(base).length == 0) {
            return docURI;
        }
        
        // Lógica para concatenar URI base e URI do documento (como antes)
        if (! (bytes(docURI).length > 7 && (
                 (bytes(docURI)[0] == 'i' && bytes(docURI)[1] == 'p' && bytes(docURI)[2] == 'f' && bytes(docURI)[3] == 's' && bytes(docURI)[4] == ':' && bytes(docURI)[5] == '/' && bytes(docURI)[6] == '/') ||
                 (bytes(docURI)[0] == 'h' && bytes(docURI)[1] == 't' && bytes(docURI)[2] == 't' && bytes(docURI)[3] == 'p' && bytes(docURI)[4] == 's' && bytes(docURI)[5] == ':' && bytes(docURI)[6] == '/') ||
                 (bytes(docURI)[0] == 'h' && bytes(docURI)[1] == 't' && bytes(docURI)[2] == 't' && bytes(docURI)[3] == 'p' && bytes(docURI)[4. == ':' && bytes(docURI)[5] == '/' && bytes(docURI)[6] == '/')
             ))) {
            return string(abi.encodePacked(base, docURI));
        }

        return docURI;
    }

    // --- Funções Internas (Overrides do ERC721Enumerable) ---
    // (Permanecem exatamente como estavam)
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721Enumerable)
    {
         super._increaseBalance(account, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}