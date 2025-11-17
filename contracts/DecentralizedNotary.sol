// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./IInterfaces.sol";
import "./BKCToken.sol";

contract DecentralizedNotary is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721EnumerableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    IEcosystemManager public ecosystemManager;
    IDelegationManager public delegationManager;
    BKCToken public bkcToken;
    address public miningManagerAddress;

    CountersUpgradeable.Counter private _tokenIdCounter;
    mapping(uint256 => string) public documentMetadataURI; // <-- CORRIGIDO AQUI
    string public constant SERVICE_KEY = "NOTARY_SERVICE";

    event NotarizationEvent(
        uint256 indexed tokenId,
        address indexed owner,
        string indexed documentMetadataHash
    );

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC721_init("Notary Certificate", "NOTARY");
        __ERC721Enumerable_init();
        __ReentrancyGuard_init();

        require(
            _ecosystemManagerAddress != address(0),
            "Notary: EcosystemManager cannot be zero"
        );
        require(_initialOwner != address(0), "Notary: Invalid owner address");
        
        _transferOwnership(_initialOwner);

        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        address _miningManagerAddr = ecosystemManager.getMiningManagerAddress();

        require(
            _bkcTokenAddress != address(0) &&
                _dmAddress != address(0) &&
                _miningManagerAddr != address(0),
            "Notary: Core contracts not set in Brain"
        );
        
        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        miningManagerAddress = _miningManagerAddr;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Notarizes a document by minting an NFT linked to its metadata URI.
     * @dev 100% of the fee is transferred to the MiningManager to trigger PoP mining.
     */
    function notarize(
        string calldata _documentMetadataURI,
        uint256 _boosterTokenId
    ) external nonReentrant returns (uint256 tokenId) {
        require(
            bytes(_documentMetadataURI).length > 0,
            "Notary: Hash cannot be empty"
        );
        
        // 1. Get Base Fee and pStake Minimum from Hub
        (uint256 baseFee, uint256 minPStake) = ecosystemManager.getServiceRequirements(SERVICE_KEY);
        
        // 2. Check pStake Minimum
        if (minPStake > 0) {
            uint256 userPStake = IDelegationManager(ecosystemManager.getDelegationManagerAddress()).userTotalPStake(msg.sender);
            require(userPStake >= minPStake, "Notary: Insufficient pStake");
        }
        
        // 3. Apply Booster Discount
        uint256 feeToPay = baseFee;
        if (feeToPay > 0 && _boosterTokenId > 0) {
            address boosterAddress = ecosystemManager.getBoosterAddress();
            if (boosterAddress != address(0)) {
                IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);
                try booster.ownerOf(_boosterTokenId) returns (address owner) {
                    if (owner == msg.sender) {
                        uint256 boostBips = booster.boostBips(_boosterTokenId);
                        uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);
                        
                        if (discountBips > 0) {
                            uint256 discountAmount = (baseFee * discountBips) / 10000;
                            feeToPay = (baseFee > discountAmount) ? baseFee - discountAmount : 0;
                        }
                    }
                } catch {
                    // Ignore if NFT is invalid
                }
            }
        }
        
        require(feeToPay > 0, "Notary: Fee cannot be zero");

        // 4. Pull Fee from User
        require(bkcToken.transferFrom(msg.sender, address(this), feeToPay), "Notary: Fee transfer failed or insufficient allowance");
        
        // 5. Transfer 100% Fee to MiningManager (PoP Trigger)
        require(
            bkcToken.transfer(miningManagerAddress, feeToPay),
            "Notary: Transfer to MiningManager failed"
        );
        
        // 6. Call MiningManager to perform PoP mining.
        // The MiningManager handles all distribution (Treasury/Validator/Delegator).
        IMiningManager(miningManagerAddress)
            .performPurchaseMining(
                SERVICE_KEY,
                feeToPay // The fee is the PoP purchase amount
            );
        
        // 7. Mint the Notary NFT
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);

        documentMetadataURI[tokenId] = _documentMetadataURI;
        emit NotarizationEvent(tokenId, msg.sender, _documentMetadataURI);
        return tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721: URI query for nonexistent token"
         );
        return documentMetadataURI[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}