// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol";
import "./DelegationManager.sol"; 
import "./EcosystemManager.sol"; // <-- NEW: Import Hub interfaces

/**
 * @title RewardManager (Vesting Certificate NFT + PoP Mining)
 * @dev Manages "Proof-of-Purchase" Mining and the distribution of mining rewards.
 * @notice CHANGED: Mining logic is now based solely on dynamic scarcity.
 * @notice NEW: Vesting certificate recipients receive a 10% bonus on the mined amount,
 * which is added to their certificate and locked for 5 years.
 * @notice V4: Now connected to EcosystemManager to apply discounts to early withdrawal penalties.
 */
contract RewardManager is ERC721Enumerable, Ownable, ReentrancyGuard {
    BKCToken public immutable bkcToken;
    DelegationManager public delegationManager;
    IEcosystemManager public immutable ecosystemManager; // <-- NEW
    address public immutable treasuryWallet;
    string private baseURI;

    uint256 public constant MAX_SUPPLY = 200_000_000 * 10**18;
    uint256 public constant TGE_SUPPLY = 40_000_000 * 10**18;
    uint256 public constant MINT_POOL = MAX_SUPPLY - TGE_SUPPLY;

    uint256 private _tokenIdCounter;
    mapping(address => uint256) public minerRewardsOwed;
    
    uint256 private nextValidatorIndex;

    struct VestingPosition {
        uint256 totalAmount;
        uint256 startTime;
    }
    mapping(uint256 => VestingPosition) public vestingPositions;

    uint256 public constant VESTING_DURATION = 5 * 365 days; // 5 years
    uint256 public constant INITIAL_PENALTY_BIPS = 5000; // 50% penalty

    event VestingCertificateCreated(uint256 indexed tokenId, address indexed recipient, uint256 netAmount);
    event CertificateWithdrawn(uint256 indexed tokenId, address indexed owner, uint256 amountToOwner, uint256 penaltyAmount);
    event MinerRewardClaimed(address indexed miner, uint256 amount);

    constructor(
        address _bkcTokenAddress,
        address _treasuryWallet,
        address _ecosystemManagerAddress, // <-- NEW
        address _initialOwner
    ) ERC721("Backchain Vesting Certificate", "BKCV") Ownable(_initialOwner) {
        require(_bkcTokenAddress != address(0), "RM: Invalid BKC Token address");
        require(_treasuryWallet != address(0), "RM: Invalid Treasury address");
        require(_ecosystemManagerAddress != address(0), "RM: Invalid EcosystemManager address"); // <-- NEW
        
        bkcToken = BKCToken(_bkcTokenAddress);
        treasuryWallet = _treasuryWallet;
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress); // <-- NEW
    }

    function setDelegationManager(address _delegationManagerAddress) external onlyOwner {
        require(_delegationManagerAddress != address(0), "RM: Address cannot be zero");
        require(address(delegationManager) == address(0), "RM: Already set");
        delegationManager = DelegationManager(_delegationManagerAddress);
    }
    
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    function createVestingCertificate(address _recipient, uint256 _grossAmount) external nonReentrant {
        require(address(delegationManager) != address(0), "RM: DelegationManager not set");
        require(_grossAmount > 0, "RM: Amount must be greater than zero");
        require(_recipient != address(0), "RM: Invalid recipient");

        // The entry fee logic (if any) remains the same
        uint256 feeAmount = 0;
        uint256 netAmountForVesting = _grossAmount;
        uint256 userPStake = delegationManager.userTotalPStake(msg.sender);
        uint256 totalPStake = delegationManager.totalNetworkPStake();
        
        if (totalPStake > 0) {
            uint256 userShareBIPS = (userPStake * 10000) / totalPStake;
            if (userShareBIPS < 10) { feeAmount = (_grossAmount * 5) / 100; } 
            else if (userShareBIPS < 100) { feeAmount = (_grossAmount * 2) / 100; }
        } else {
            feeAmount = (_grossAmount * 5) / 100;
        }
        
        if (feeAmount > 0) {
            netAmountForVesting = _grossAmount - feeAmount;
            require(netAmountForVesting > 0, "RM: Amount after fee is zero");
            require(bkcToken.transferFrom(msg.sender, treasuryWallet, feeAmount), "RM: Fee transfer failed");
        }
        
        require(bkcToken.transferFrom(msg.sender, address(this), netAmountForVesting), "RM: Token transfer failed");

        // --- NEW MINING AND BONUS LOGIC ---
        uint256 totalMintAmount = _calculateMintAmount(_grossAmount);
        uint256 finalVestingAmount = netAmountForVesting;

        if (totalMintAmount > 0) {
            // 1. Calculate and allocate the 10% bonus for the recipient
            uint256 recipientRewardAmount = (totalMintAmount * 10) / 100;
            // 2. The final amount locked in the NFT is the sum of the user's value + the bonus
            finalVestingAmount += recipientRewardAmount;
            // 3. Mint the bonus directly to this contract to be added to the vesting
            if (recipientRewardAmount > 0) {
                bkcToken.mint(address(this), recipientRewardAmount);
            }

            // 4. Select the miner and distribute the remaining rewards (90%)
            address selectedMiner = _selectNextValidator();
            require(selectedMiner != address(0), "RM: Could not select a miner");

            uint256 treasuryAmount = (totalMintAmount * 10) / 100; // 10%
            uint256 minerRewardAmount = (totalMintAmount * 15) / 100; // 15%
            uint256 delegatorPoolAmount = (totalMintAmount * 65) / 100; // 65%

            if (treasuryAmount > 0) bkcToken.mint(treasuryWallet, treasuryAmount);
            if (minerRewardAmount > 0) {
                minerRewardsOwed[selectedMiner] += minerRewardAmount;
                bkcToken.mint(address(this), minerRewardAmount);
            }
            
            if (delegatorPoolAmount > 0) {
                bkcToken.mint(address(this), delegatorPoolAmount);
                bkcToken.approve(address(delegationManager), delegatorPoolAmount);
                // Send 100% of the pool funds to delegators (0 for validators)
                delegationManager.depositRewards(0, delegatorPoolAmount);
            }
        }
        
        // 5. Create the NFT with the final amount (user's value + bonus if any)
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(_recipient, tokenId);
        vestingPositions[tokenId] = VestingPosition({ totalAmount: finalVestingAmount, startTime: block.timestamp });
        emit VestingCertificateCreated(tokenId, _recipient, finalVestingAmount);
    }

    /**
     * @notice Withdraws a vesting certificate.
     * @dev NEW V4: Accepts boosterTokenId to apply discount to the early withdrawal penalty.
     * @param _tokenId The ID of the vesting NFT.
     * @param _boosterTokenId The user's Booster NFT token ID (0 if none) to get a discount.
     */
    function withdraw(uint256 _tokenId, uint256 _boosterTokenId) external nonReentrant {
        require(ownerOf(_tokenId) == msg.sender, "RM: Not the owner");
        VestingPosition storage position = vestingPositions[_tokenId];

        // --- NEW DISCOUNT LOGIC ---
        uint256 basePenaltyBips = 0;
        uint256 elapsedTime = block.timestamp - position.startTime;

        if (elapsedTime < VESTING_DURATION) {
             basePenaltyBips = INITIAL_PENALTY_BIPS; // 5000
        }
        
        uint256 discountBips = 0;
        
        if (basePenaltyBips > 0) { // Only check for discount if there is a penalty
            address rewardBoosterAddress = ecosystemManager.getBoosterAddress();
            
            if (_boosterTokenId > 0 && rewardBoosterAddress != address(0)) {
                try IRewardBoosterNFT(rewardBoosterAddress).ownerOf(_boosterTokenId) returns (address owner) {
                    if (owner == msg.sender) {
                        uint256 userBoostBips = IRewardBoosterNFT(rewardBoosterAddress).boostBips(_boosterTokenId);
                        discountBips = ecosystemManager.getBoosterDiscount(userBoostBips);
                    }
                } catch { /* Ignore */ }
            }
        }

        uint256 finalPenaltyBips = (basePenaltyBips > discountBips) ? (basePenaltyBips - discountBips) : 0;
        // --- END OF NEW LOGIC ---

        // Call the internal calculation function
        (uint256 amountToOwner, uint256 penaltyAmount) = _calculateWithdrawalAmounts(position, finalPenaltyBips);
        
        delete vestingPositions[_tokenId];
        _burn(_tokenId);
        
        if (penaltyAmount > 0) require(bkcToken.transfer(treasuryWallet, penaltyAmount), "RM: Penalty transfer failed");
        if (amountToOwner > 0) require(bkcToken.transfer(msg.sender, amountToOwner), "RM: Withdrawal transfer failed");
        
        emit CertificateWithdrawn(_tokenId, msg.sender, amountToOwner, penaltyAmount);
    }
    
    function claimMinerRewards() external nonReentrant {
        uint256 amountToClaim = minerRewardsOwed[msg.sender];
        require(amountToClaim > 0, "RM: No miner rewards to claim");
        minerRewardsOwed[msg.sender] = 0;
        require(bkcToken.transfer(msg.sender, amountToClaim), "RM: Failed to transfer miner rewards");
        emit MinerRewardClaimed(msg.sender, amountToClaim);
    }

    /**
     * @notice Internal function to calculate withdrawal amounts based on a given penalty.
     * @param _pos The vesting position.
     * @param _penaltyBips The final, discounted penalty bips (0 if no penalty).
     */
    function _calculateWithdrawalAmounts(
        VestingPosition memory _pos,
        uint256 _penaltyBips
    ) internal pure returns (uint256 amountToOwner, uint256 penaltyAmount) {
        
        if (_penaltyBips == 0) {
            // No penalty (either time is up or discount was 100%)
            return (_pos.totalAmount, 0);
        }

        // Apply the final (potentially discounted) penalty
        penaltyAmount = (_pos.totalAmount * _penaltyBips) / 10000;
        amountToOwner = _pos.totalAmount - penaltyAmount;
        return (amountToOwner, penaltyAmount);
    }

    // --- SIMPLIFIED MINING LOGIC ---
    function _calculateMintAmount(uint256 _purchaseAmount) internal view returns (uint256) {
        uint256 currentSupply = bkcToken.totalSupply();
        if (currentSupply >= MAX_SUPPLY) { return 0; }

        uint256 currentMinted = currentSupply > TGE_SUPPLY ?
            currentSupply - TGE_SUPPLY : 0;
        uint256 remainingMintable = MINT_POOL - currentMinted;
        if (remainingMintable == 0) { return 0; }

        // Only dynamic scarcity is used
        uint256 scarcityRate = (remainingMintable * 1e18) / MINT_POOL;
        uint256 finalMintAmount = (_purchaseAmount * scarcityRate) / 1e18;

        // Ensure it doesn't exceed MAX_SUPPLY
        if (currentSupply + finalMintAmount > MAX_SUPPLY) {
            finalMintAmount = MAX_SUPPLY - currentSupply;
        }

        return finalMintAmount;
    }

    function _selectNextValidator() internal returns (address) {
        address[] memory validators = delegationManager.getAllValidators();
        uint256 count = validators.length;
        if (count == 0) return address(0); // No validators registered

        if (nextValidatorIndex >= count) { nextValidatorIndex = 0; }
        
        address selectedValidator = validators[nextValidatorIndex];
        nextValidatorIndex = (nextValidatorIndex + 1) % count; // Round-robin
        return selectedValidator;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721: invalid token ID");
        // Example metadata file name
        return string(abi.encodePacked(baseURI, "vesting_cert.json"));
    }

    // --- Internal Overrides ---

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
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