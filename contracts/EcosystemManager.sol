// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IDelegationManager
 * @dev Interface to query a user's pStake in the DelegationManager.
 */
interface IDelegationManager {
    /**
     * @notice Returns the total pStake of a user.
     * @dev pStake is already a "whole" number (tokens * days), without 18 decimals.
     */
    function userTotalPStake(address _user) external view returns (uint256);
    /**
     * @notice Used by Spoke contracts (Notary, FortuneTiger) to deposit fees.
     */
    function depositRewards(uint256 validatorAmount, uint256 delegatorAmount) external;
}

/**
 * @title IRewardBoosterNFT
 * @dev Interface to verify a user's Booster NFT.
 */
interface IRewardBoosterNFT {
    /**
     * @notice Returns the owner of a specific tokenId.
     * @dev Used to verify if the user truly owns the discount "coupon".
     */
    function ownerOf(uint256 tokenId) external view returns (address);
    /**
     * @notice Returns the Bips value of the booster (e.g., 5000 for Diamond).
     * @dev Used as the key for the discount mapping.
     */
    function boostBips(uint256 tokenId) external view returns (uint256);

    // ====================================================================
    // ======================= INÍCIO DA CORREÇÃO 1 =======================
    // ====================================================================
    /**
     * @notice (PublicSale Contract) Mints a single NFT.
     * @dev Adicionado à interface para que o PublicSale possa chamá-lo.
     */
    function mintFromSale(
        address to,
        uint256 boostInBips,
        string calldata metadataFile
    ) external returns (uint256);
    // ==================================================================
    // ======================== FIM DA CORREÇÃO 1 =======================
    // ==================================================================
}

/**
 * @title IEcosystemManager
 * @dev A interface que os outros contratos (Spokes) usarão.
 * @notice Esta interface define as funções que o Hub expõe para os Spokes.
 */
interface IEcosystemManager {
    function authorizeService(
        string calldata _serviceKey,
        address _user,
        uint256 _boosterTokenId
    ) external view returns (uint256 finalFee);

    function getServiceRequirements(
        string calldata _serviceKey
    ) external view returns (uint256 fee, uint256 pStake);

    function getBoosterDiscount(uint256 _boostBips) external view returns (uint256);
    
    /**
     * @notice Retorna a taxa para uma chave de serviço (usado pelos Spokes).
     * @dev Esta função estava faltando e é necessária para compatibilidade.
     */
    function getFee(string calldata _serviceKey) external view returns (uint256);

    function getTreasuryAddress() external view returns (address);
    function getDelegationManagerAddress() external view returns (address);
    function getBKCTokenAddress() external view returns (address);
    function getBoosterAddress() external view returns (address);
}


/**
 * @title EcosystemManager
 * @dev "Hub" contract that manages all business rules for the ecosystem.
 * @notice V2: Booster NFT discounts are now IMMUTABLE and set on deploy.
 * @notice This contract centralizes:
 * 1. The registry of contract addresses (Treasury, DM, etc.).
 * 2. The registry of adjustable service fees (e.g., "NOTARY_FEE").
 * 3. The registry of adjustable minimum pStake requirements.
 * 4. The discount logic for Booster NFTs.
 */
// Adiciona a implementação da interface IEcosystemManager
contract EcosystemManager is Ownable, IEcosystemManager {

    // --- 1. ADDRESS REGISTRY ---
    address public bkcTokenAddress;
    address public treasuryWallet;
    address public delegationManagerAddress;
    address public rewardBoosterAddress;
    // (More addresses can be added here, e.g., rewardManagerAddress)

    // --- 2. FEE REGISTRY (ADJUSTABLE) ---
    // Maps a string key (e.g., "NOTARY_FEE") to a fee (in BKC with 18 decimals)
    mapping(string => uint256) public serviceFees;
    // --- 3. MINIMUM PSTAKE REGISTRY (ADJUSTABLE) ---
    // Maps a string key (e.g., "NOTARY_SERVICE") to a minimum pStake
    mapping(string => uint256) public servicePStakeMinimums;
    
    // --- 4. DISCOUNT REGISTRY (BOOSTER - NOW IMMUTABLE) ---
    
    // ====================================================================
    // ======================= INÍCIO DA CORREÇÃO 2 =======================
    // ====================================================================
    // Mappings NÃO PODEM ser 'immutable'. A imutabilidade é alcançada
    // por configurar os valores no constructor e não ter função de set.
    mapping(uint256 => uint256) public boosterDiscountsBips;
    // ==================================================================
    // ======================== FIM DA CORREÇÃO 2 =======================
    // ==================================================================


    // --- EVENTS (For your scripts/frontend) ---
    event AddressesSet(
        address treasury,
        address delegationManager,
        address rewardBooster
    );
    event FeeSet(string indexed serviceKey, uint256 newFee);
    event PStakeMinimumSet(string indexed serviceKey, uint256 newPStake);
    // REMOVED: event DiscountSet(uint256 indexed boostBips, uint256 newDiscountBips);
    /**
     * @dev Sets the initial owner and the IMMUTABLE booster discounts.
     */
    constructor(address _initialOwner) Ownable(_initialOwner) {
        // --- IMMUTABLE DISCOUNTS SET ON DEPLOY ---
        // Maps [boostBips] -> [discountBips]

        // 1. Diamond (Boost 5000)
        boosterDiscountsBips[5000] = 5000;
        // 50% discount
        // 2. Platinum (Boost 4000)
        boosterDiscountsBips[4000] = 4000;
        // 40% discount
        // 3. Gold (Boost 3000)
        boosterDiscountsBips[3000] = 3000;
        // 30% discount
        // 4. Silver (Boost 2000)
        boosterDiscountsBips[2000] = 2000;
        // 20% discount
        // 5. Bronze (Boost 1000)
        boosterDiscountsBips[1000] = 1000;
        // 10% discount
        // 6. Iron (Boost 500)
        boosterDiscountsBips[500] = 500;
        // 5% discount
        // 7. Crystal (Boost 100)
        boosterDiscountsBips[100] = 100;
        // 1% discount
    }

    // --- 5. ADMIN FUNCTIONS (For your scripts) ---

    /**
     * @notice (Owner) Sets the central addresses for the ecosystem.
     */
    function setAddresses(
        address _token,
        address _treasury,
        address _delegationManager,
        address _rewardBooster
    ) external onlyOwner {
        require(
            _token != address(0) &&
            _treasury != address(0) &&
            _delegationManager != 
            address(0) &&
            _rewardBooster != address(0),
            "Ecosystem: Addresses cannot be zero"
        );
        bkcTokenAddress = _token;
        treasuryWallet = _treasury;
        delegationManagerAddress = _delegationManager;
        rewardBoosterAddress = _rewardBooster;

        emit AddressesSet(_treasury, _delegationManager, _rewardBooster);
    }

    /**
     * @notice (Owner) Sets the fee for a service.
     * @param _serviceKey The service key (e.g., "NOTARY_FEE").
     * @param _fee The fee amount in Wei (e.g., 100 * 10**18 for 100 BKC).
     */
    function setFee(string calldata _serviceKey, uint256 _fee) external onlyOwner {
        serviceFees[_serviceKey] = _fee;
        emit FeeSet(_serviceKey, _fee);
    }

    /**
     * @notice (Owner) Sets the minimum pStake required to use a service.
     * @param _serviceKey The service key (e.g., "NOTARY_SERVICE").
     * @param _pStake The minimum pStake required (e.g., 10000).
     */
    function setPStakeMinimum(
        string calldata _serviceKey,
        uint256 _pStake
    ) external onlyOwner {
        servicePStakeMinimums[_serviceKey] = _pStake;
        emit PStakeMinimumSet(_serviceKey, _pStake);
    }

    /**
     * @notice (Owner) Sets the discount for a booster tier.
     * @dev REMOVED: Discounts are now immutable and set in the constructor.
     */
    // function setBoosterDiscount(...) external onlyOwner { ... } // <-- REMOVED


    // --- 6. AUTHORIZATION FUNCTION (The "Master Check") ---

    /**
     * @notice Checks if a user is authorized to use a service and returns the final fee.
     * @dev This is the main function that "Spokes" (other contracts) will call.
     * @dev It verifies pStake and applies the booster discount.
     * @param _serviceKey The service key (e.g., "NOTARY_FEE").
     * @param _user The address of the user attempting to use the service.
     * @param _boosterTokenId The ID of the Booster NFT that the user (via frontend)
     * declared they want to use.
     * Send 0 if they don't have or want to use one.
     * @return finalFee The final fee in Wei (with discount applied, if any).
     */
    function authorizeService(
        string calldata _serviceKey,
        address _user,
        uint256 _boosterTokenId
    ) external view override returns (uint256 finalFee) { // Adicionado 'override'

        // --- A. PSTAKE VERIFICATION ---
        uint256 minPStake = servicePStakeMinimums[_serviceKey];
        if (minPStake > 0) {
            require(delegationManagerAddress != address(0), "Ecosystem: DM not configured");
            // 1. Query the user's pStake
            uint256 userPStake = IDelegationManager(delegationManagerAddress)
                .userTotalPStake(_user);
            // 2. Revert if insufficient (the frontend will catch this)
            require(userPStake >= minPStake, "Ecosystem: Insufficient pStake for this service");
        }

        // --- B. FINAL FEE CALCULATION (With Discount) ---
        uint256 baseFee = serviceFees[_serviceKey];
        finalFee = baseFee; // Default fee

        // If the user provided a booster ID (coupon)
        if (_boosterTokenId > 0 && rewardBoosterAddress != address(0)) {
            IRewardBoosterNFT booster = IRewardBoosterNFT(rewardBoosterAddress);
            // 1. Verify the user is the true owner of the NFT
            // We use a try/catch to prevent reverts if the token is invalid/doesn't exist.
            try booster.ownerOf(_boosterTokenId) returns (address owner) {
                if (owner == _user) {

                    // 2. Get the tier (boostBips) of this NFT
                    uint256 boostBips = booster.boostBips(_boosterTokenId);
                    // 3. Get the IMMUTABLE discount configured for this tier
                    uint256 discountBips = boosterDiscountsBips[boostBips];
                    if (discountBips > 0) {
                        // Apply the discount
                        // Since discountBips can be <= 10000, no underflow risk
                        uint256 discountAmount = (baseFee * discountBips) / 10000;
                        // Protect against potential underflow if discountBips > 10000 (though unlikely now)
                        if (discountAmount <= baseFee) {
                             finalFee = baseFee - discountAmount;
                        } else {
                             finalFee = 0;
                             // Ensure fee doesn't become negative
                        }
                    }
                }
            } catch {
                // If ownerOf reverts (e.g., 
                // token doesn't exist) or any other error,
                // simply ignore it.
                // The user pays the baseFee.
            }
        }

        return finalFee;
    }

    // --- 7. VIEW FUNCTIONS (For Frontend) ---

    /**
     * @notice Returns the requirements for a service (for the frontend).
     * @dev The frontend uses this to display (e.g., "Minimum pStake: 10000").
     */
    function getServiceRequirements(
        string calldata _serviceKey
    ) external view override returns (uint256 fee, uint256 pStake) { // Adicionado 'override'
        return (serviceFees[_serviceKey], servicePStakeMinimums[_serviceKey]);
    }


    /**
     * @notice Retorna a taxa para uma chave de serviço (wrapper para o mapeamento).
     * @dev Adicionado para corresponder à interface IEcosystemManager, usado por Spokes.
     */
    function getFee(string calldata _serviceKey) external view override returns (uint256) { // Adicionado 'override'
        return serviceFees[_serviceKey];
    }


    /**
     * @notice Returns the discount for a booster tier (reads from the immutable map).
     */
    function getBoosterDiscount(
        uint256 _boostBips
    ) external view override returns (uint256) { // Adicionado 'override'
        return boosterDiscountsBips[_boostBips];
    }

    // Getters for addresses (for "Spokes" to use)
    function getTreasuryAddress() external view override returns (address) { // Adicionado 'override'
        return treasuryWallet;
    }
    function getDelegationManagerAddress() external view override returns (address) { // Adicionado 'override'
        return delegationManagerAddress;
    }
    function getBKCTokenAddress() external view override returns (address) { // Adicionado 'override'
        return bkcTokenAddress;
    }
    // New Getter: Allows other contracts to find the Booster NFT contract
    function getBoosterAddress() external view override returns (address) { // Adicionado 'override'
        return rewardBoosterAddress;
    }
}