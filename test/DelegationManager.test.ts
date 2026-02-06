import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  loadFixture,
  time,
  impersonateAccount,
  setBalance,
} from "@nomicfoundation/hardhat-network-helpers";

describe("DelegationManager", function () {
  const ONE_DAY = 86400;
  const ONE_YEAR = ONE_DAY * 365;
  const PRECISION = 10n ** 18n;
  const BIPS = 10000n;

  // Fee keys (must match contract constants)
  const DELEGATION_FEE_KEY = ethers.keccak256(
    ethers.toUtf8Bytes("DELEGATION_FEE_BIPS")
  );
  const UNSTAKE_FEE_KEY = ethers.keccak256(
    ethers.toUtf8Bytes("UNSTAKE_FEE_BIPS")
  );
  const FORCE_UNSTAKE_PENALTY_KEY = ethers.keccak256(
    ethers.toUtf8Bytes("FORCE_UNSTAKE_PENALTY_BIPS")
  );

  // =========================================================================
  //  FIXTURE: Deploy ecosystem for DelegationManager
  // =========================================================================

  async function deployEcosystem() {
    const [owner, treasury, user1, user2, operator, attacker] =
      await ethers.getSigners();

    // 1. EcosystemManager
    const EcoFactory = await ethers.getContractFactory("EcosystemManager");
    const eco = await upgrades.deployProxy(EcoFactory, [owner.address], {
      kind: "uups",
    });

    // 2. BKCToken
    const BKCFactory = await ethers.getContractFactory("BKCToken");
    const bkc = await upgrades.deployProxy(BKCFactory, [owner.address], {
      kind: "uups",
    });

    // 3. Register BKCToken + treasury
    await eco.setAddress("bkcToken", bkc.target);
    await eco.setAddress("treasury", treasury.address);

    // 4. MiningManager
    const MMFactory = await ethers.getContractFactory("MiningManager");
    const mining = await upgrades.deployProxy(MMFactory, [eco.target], {
      kind: "uups",
    });

    // 5. Register MiningManager
    await eco.setAddress("miningManager", mining.target);

    // 6. DelegationManager
    const DelFactory = await ethers.getContractFactory("DelegationManager");
    const delegation = await upgrades.deployProxy(
      DelFactory,
      [owner.address, eco.target],
      { kind: "uups" }
    );

    // 7. Full wiring (register DelegationManager)
    await eco.setAddress("delegationManager", delegation.target);

    // 8. Set fees in EcosystemManager
    await eco.setServiceFee(DELEGATION_FEE_KEY, 500); // 5%
    await eco.setServiceFee(UNSTAKE_FEE_KEY, 500); // 5%
    await eco.setServiceFee(FORCE_UNSTAKE_PENALTY_KEY, 2000); // 20%

    // 9. Set claim ETH fee
    const CLAIM_ETH_FEE = ethers.parseEther("0.001");
    await delegation.setClaimEthFee(CLAIM_ETH_FEE);

    // 10. Distribution config (for MiningManager)
    const POOL_TREASURY = ethers.keccak256(ethers.toUtf8Bytes("TREASURY"));
    const POOL_DELEGATOR = ethers.keccak256(
      ethers.toUtf8Bytes("DELEGATOR_POOL")
    );
    await eco.setMiningDistributionBips(POOL_TREASURY, 5000);
    await eco.setMiningDistributionBips(POOL_DELEGATOR, 5000);
    await eco.setFeeDistributionBips(POOL_TREASURY, 5000);
    await eco.setFeeDistributionBips(POOL_DELEGATOR, 5000);

    // 11. Mint BKC and distribute
    const INITIAL = ethers.parseEther("1000000");
    await bkc.mint(owner.address, INITIAL);

    // NOTE: We do NOT transfer BKC ownership to MiningManager here.
    // This isolates DelegationManager unit tests from mining side-effects.
    // Mining calls in _sendFeeToMining will fail silently (try-catch).

    // Give users BKC
    const USER_BKC = ethers.parseEther("10000");
    await bkc.transfer(user1.address, USER_BKC);
    await bkc.transfer(user2.address, USER_BKC);

    return {
      owner, treasury, user1, user2, operator, attacker,
      eco, bkc, mining, delegation,
      CLAIM_ETH_FEE,
    };
  }

  // =========================================================================
  //  HELPER: Impersonate MiningManager to deposit rewards
  // =========================================================================

  async function depositRewards(
    delegation: any,
    mining: any,
    bkc: any,
    owner: any,
    amount: bigint
  ) {
    // Transfer BKC to DelegationManager (simulating what MiningManager does)
    await bkc.connect(owner).transfer(delegation.target, amount);

    // Impersonate MiningManager
    const miningAddr = mining.target as string;
    await impersonateAccount(miningAddr);
    await setBalance(miningAddr, ethers.parseEther("1"));
    const miningSigner = await ethers.getSigner(miningAddr);

    await delegation.connect(miningSigner).depositMiningRewards(amount);
  }

  // ===========================================================================
  //  INITIALIZATION
  // ===========================================================================

  describe("Initialization", function () {
    it("sets correct initial state", async function () {
      const { delegation, eco, bkc } = await loadFixture(deployEcosystem);
      expect(await delegation.ecosystemManager()).to.equal(eco.target);
      expect(await delegation.bkcToken()).to.equal(bkc.target);
      expect(await delegation.totalNetworkPStake()).to.equal(0);
      expect(await delegation.accRewardPerStake()).to.equal(0);
    });

    it("sets correct constants", async function () {
      const { delegation } = await loadFixture(deployEcosystem);
      expect(await delegation.MIN_LOCK_DURATION()).to.equal(ONE_DAY);
      expect(await delegation.MAX_LOCK_DURATION()).to.equal(3650 * ONE_DAY);
      expect(await delegation.BURN_RATE_NO_NFT()).to.equal(5000);
      expect(await delegation.BURN_RATE_BRONZE()).to.equal(4000);
      expect(await delegation.BURN_RATE_SILVER()).to.equal(2500);
      expect(await delegation.BURN_RATE_GOLD()).to.equal(1000);
      expect(await delegation.BURN_RATE_DIAMOND()).to.equal(0);
    });

    it("cannot initialize twice", async function () {
      const { delegation, owner, eco } = await loadFixture(deployEcosystem);
      await expect(
        delegation.initialize(owner.address, eco.target)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("reverts when initializing with zero owner", async function () {
      const { eco } = await loadFixture(deployEcosystem);
      const DelFactory = await ethers.getContractFactory("DelegationManager");
      await expect(
        upgrades.deployProxy(
          DelFactory,
          [ethers.ZeroAddress, eco.target],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(DelFactory, "ZeroAddress");
    });
  });

  // ===========================================================================
  //  ADMIN
  // ===========================================================================

  describe("Admin", function () {
    it("owner can set claim ETH fee", async function () {
      const { delegation } = await loadFixture(deployEcosystem);
      const newFee = ethers.parseEther("0.01");
      await expect(delegation.setClaimEthFee(newFee))
        .to.emit(delegation, "ClaimEthFeeUpdated");
      expect(await delegation.claimEthFee()).to.equal(newFee);
    });

    it("non-owner cannot set claim ETH fee", async function () {
      const { delegation, user1 } = await loadFixture(deployEcosystem);
      await expect(
        delegation.connect(user1).setClaimEthFee(0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // ===========================================================================
  //  DELEGATE
  // ===========================================================================

  describe("Delegate", function () {
    it("delegates tokens with fee deduction and emits event", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("1000");
      const lockDuration = ONE_YEAR;

      await bkc.connect(user1).approve(delegation.target, amount);

      await expect(
        delegation
          .connect(user1)
          .delegate(amount, lockDuration, operator.address)
      ).to.emit(delegation, "Delegated");

      // Fee = 5% of 1000 = 50 BKC. Net = 950 BKC
      const delegations = await delegation.getDelegationsOf(user1.address);
      expect(delegations.length).to.equal(1);
      expect(delegations[0].amount).to.equal(ethers.parseEther("950"));

      // pStake = (950e18 × 365) / 1e18 = 346750
      const expectedPStake = (ethers.parseEther("950") * 365n) / PRECISION;
      expect(await delegation.userTotalPStake(user1.address)).to.equal(
        expectedPStake
      );
      expect(await delegation.totalNetworkPStake()).to.equal(expectedPStake);
    });

    it("reverts on zero amount", async function () {
      const { delegation, user1, operator } = await loadFixture(
        deployEcosystem
      );
      await expect(
        delegation.connect(user1).delegate(0, ONE_YEAR, operator.address)
      ).to.be.revertedWithCustomError(delegation, "ZeroAmount");
    });

    it("reverts on lock duration too short", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("100");
      await bkc.connect(user1).approve(delegation.target, amount);
      await expect(
        delegation
          .connect(user1)
          .delegate(amount, ONE_DAY - 1, operator.address)
      ).to.be.revertedWithCustomError(delegation, "InvalidDuration");
    });

    it("reverts on lock duration too long", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("100");
      await bkc.connect(user1).approve(delegation.target, amount);
      await expect(
        delegation
          .connect(user1)
          .delegate(amount, 3651 * ONE_DAY, operator.address)
      ).to.be.revertedWithCustomError(delegation, "InvalidDuration");
    });

    it("allows minimum lock duration (1 day)", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("100");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY, operator.address);

      expect(await delegation.getDelegationCount(user1.address)).to.equal(1);
    });

    it("allows maximum lock duration (3650 days)", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("100");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, 3650 * ONE_DAY, operator.address);

      expect(await delegation.getDelegationCount(user1.address)).to.equal(1);
    });

    it("supports multiple delegations from same user", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("500");
      await bkc.connect(user1).approve(delegation.target, amount * 2n);

      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 30, operator.address);

      expect(await delegation.getDelegationCount(user1.address)).to.equal(2);

      const delegations = await delegation.getDelegationsOf(user1.address);
      expect(delegations[0].amount).to.equal(ethers.parseEther("475"));
      expect(delegations[1].amount).to.equal(ethers.parseEther("475"));
    });

    it("pStake increases with longer lock duration", async function () {
      const { delegation, bkc, user1, user2, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("1000");

      await bkc.connect(user1).approve(delegation.target, amount);
      await bkc.connect(user2).approve(delegation.target, amount);

      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 30, operator.address);
      await delegation
        .connect(user2)
        .delegate(amount, ONE_YEAR, operator.address);

      const pStake1 = await delegation.userTotalPStake(user1.address);
      const pStake2 = await delegation.userTotalPStake(user2.address);

      // user2 has ~12.17x more pStake (365/30)
      expect(pStake2).to.be.gt(pStake1);
      const ratio = (pStake2 * 100n) / pStake1;
      expect(ratio).to.be.closeTo(1216n, 5n);
    });
  });

  // ===========================================================================
  //  UNSTAKE
  // ===========================================================================

  describe("Unstake", function () {
    async function delegatedFixture() {
      const base = await deployEcosystem();
      const amount = ethers.parseEther("1000");
      await base.bkc
        .connect(base.user1)
        .approve(base.delegation.target, amount);
      await base.delegation
        .connect(base.user1)
        .delegate(amount, ONE_DAY * 30, base.operator.address);
      return {
        ...base,
        delegatedAmount: amount,
        netAmount: ethers.parseEther("950"),
      };
    }

    it("unstakes after lock period with fee", async function () {
      const { delegation, bkc, user1, operator, netAmount } =
        await loadFixture(delegatedFixture);

      await time.increase(ONE_DAY * 31);

      const balanceBefore = await bkc.balanceOf(user1.address);

      await expect(
        delegation.connect(user1).unstake(0, operator.address)
      ).to.emit(delegation, "Unstaked");

      const balanceAfter = await bkc.balanceOf(user1.address);
      // Unstake fee = 5% of 950 = 47.5 BKC. User gets 902.5 BKC
      const unstakeFee = (netAmount * 500n) / BIPS;
      const expectedReturn = netAmount - unstakeFee;
      expect(balanceAfter - balanceBefore).to.equal(expectedReturn);

      // Delegation removed
      expect(await delegation.getDelegationCount(user1.address)).to.equal(0);
      expect(await delegation.userTotalPStake(user1.address)).to.equal(0);
      expect(await delegation.totalNetworkPStake()).to.equal(0);
    });

    it("reverts when lock is still active", async function () {
      const { delegation, user1, operator } = await loadFixture(
        delegatedFixture
      );
      await expect(
        delegation.connect(user1).unstake(0, operator.address)
      ).to.be.revertedWithCustomError(delegation, "LockPeriodActive");
    });

    it("reverts on invalid index", async function () {
      const { delegation, user1, operator } = await loadFixture(
        delegatedFixture
      );
      await time.increase(ONE_DAY * 31);
      await expect(
        delegation.connect(user1).unstake(99, operator.address)
      ).to.be.revertedWithCustomError(delegation, "InvalidIndex");
    });

    it("swap-and-pop changes index of last delegation (M-04)", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("500");
      await bkc.connect(user1).approve(delegation.target, amount * 3n);

      // Create 3 delegations with different durations for identification
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 10, operator.address);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 20, operator.address);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 30, operator.address);

      expect(await delegation.getDelegationCount(user1.address)).to.equal(3);

      // Fast-forward past all locks
      await time.increase(ONE_DAY * 31);

      // Unstake index 0 — last element (index 2) moves to index 0
      await delegation.connect(user1).unstake(0, operator.address);

      const delegations = await delegation.getDelegationsOf(user1.address);
      expect(delegations.length).to.equal(2);

      // The delegation that was at index 2 (30-day lock) is now at index 0
      expect(delegations[0].lockDuration).to.equal(ONE_DAY * 30);
      // The delegation at index 1 stays (20-day lock)
      expect(delegations[1].lockDuration).to.equal(ONE_DAY * 20);
    });

    it("unstaking last element does not swap", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("500");
      await bkc.connect(user1).approve(delegation.target, amount * 2n);

      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 10, operator.address);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 20, operator.address);

      await time.increase(ONE_DAY * 21);

      // Unstake index 1 (last) — just pop, no swap
      await delegation.connect(user1).unstake(1, operator.address);

      const delegations = await delegation.getDelegationsOf(user1.address);
      expect(delegations.length).to.equal(1);
      expect(delegations[0].lockDuration).to.equal(ONE_DAY * 10);
    });
  });

  // ===========================================================================
  //  FORCE UNSTAKE
  // ===========================================================================

  describe("Force Unstake", function () {
    async function delegatedFixture() {
      const base = await deployEcosystem();
      const amount = ethers.parseEther("1000");
      await base.bkc
        .connect(base.user1)
        .approve(base.delegation.target, amount);
      await base.delegation
        .connect(base.user1)
        .delegate(amount, ONE_YEAR, base.operator.address);
      return {
        ...base,
        delegatedAmount: amount,
        netAmount: ethers.parseEther("950"),
      };
    }

    it("force unstakes with 20% penalty", async function () {
      const { delegation, bkc, user1, operator, netAmount } =
        await loadFixture(delegatedFixture);

      const balanceBefore = await bkc.balanceOf(user1.address);

      await expect(
        delegation.connect(user1).forceUnstake(0, operator.address)
      ).to.emit(delegation, "Unstaked");

      const balanceAfter = await bkc.balanceOf(user1.address);
      // Penalty = 20% of 950 = 190. User gets 760 BKC
      const penalty = (netAmount * 2000n) / BIPS;
      const expectedReturn = netAmount - penalty;
      expect(balanceAfter - balanceBefore).to.equal(expectedReturn);

      expect(await delegation.getDelegationCount(user1.address)).to.equal(0);
    });

    it("reverts when lock has already expired", async function () {
      const { delegation, user1, operator } = await loadFixture(
        delegatedFixture
      );
      await time.increase(ONE_YEAR + 1);
      await expect(
        delegation.connect(user1).forceUnstake(0, operator.address)
      ).to.be.revertedWithCustomError(delegation, "LockPeriodExpired");
    });

    it("reverts on invalid index", async function () {
      const { delegation, user1, operator } = await loadFixture(
        delegatedFixture
      );
      await expect(
        delegation.connect(user1).forceUnstake(99, operator.address)
      ).to.be.revertedWithCustomError(delegation, "InvalidIndex");
    });

    it("cannot force-unstake someone else's delegation", async function () {
      const { delegation, user2, operator } = await loadFixture(
        delegatedFixture
      );
      // user2 has no delegations — index 0 is invalid for them
      await expect(
        delegation.connect(user2).forceUnstake(0, operator.address)
      ).to.be.revertedWithCustomError(delegation, "InvalidIndex");
    });
  });

  // ===========================================================================
  //  REWARDS
  // ===========================================================================

  describe("Rewards", function () {
    async function stakedFixture() {
      const base = await deployEcosystem();
      const amount = ethers.parseEther("1000");
      await base.bkc
        .connect(base.user1)
        .approve(base.delegation.target, amount);
      await base.delegation
        .connect(base.user1)
        .delegate(amount, ONE_YEAR, base.operator.address);
      return { ...base, delegatedAmount: amount };
    }

    it("depositMiningRewards updates accRewardPerStake", async function () {
      const { delegation, mining, bkc, owner } = await loadFixture(
        stakedFixture
      );
      expect(await delegation.accRewardPerStake()).to.equal(0);

      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      expect(await delegation.accRewardPerStake()).to.be.gt(0);
    });

    it("depositMiningRewards reverts for unauthorized caller", async function () {
      const { delegation, user1 } = await loadFixture(stakedFixture);
      await expect(
        delegation
          .connect(user1)
          .depositMiningRewards(ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(delegation, "UnauthorizedCaller");
    });

    it("pendingRewards shows correct amount for sole staker", async function () {
      const { delegation, mining, bkc, owner, user1 } = await loadFixture(
        stakedFixture
      );

      expect(await delegation.pendingRewards(user1.address)).to.equal(0);

      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      // Sole staker gets 100% of rewards (allow 1 wei rounding from division)
      expect(await delegation.pendingRewards(user1.address)).to.be.closeTo(
        rewardAmount, 1
      );
    });

    it("claimReward sends rewards with 50% burn (no NFT)", async function () {
      const {
        delegation, mining, bkc, owner, user1, operator, CLAIM_ETH_FEE,
      } = await loadFixture(stakedFixture);

      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      const balanceBefore = await bkc.balanceOf(user1.address);

      await expect(
        delegation
          .connect(user1)
          .claimReward(operator.address, { value: CLAIM_ETH_FEE })
      ).to.emit(delegation, "RewardClaimed");

      const balanceAfter = await bkc.balanceOf(user1.address);
      // 50% burn (no NFT) → user receives ~500 BKC (allow 1 wei rounding)
      const received = balanceAfter - balanceBefore;
      expect(received).to.be.closeTo(rewardAmount / 2n, 1);

      // Burn tracked (should equal totalRewards - received)
      expect(await delegation.totalBurnedOnClaim()).to.be.closeTo(
        rewardAmount / 2n, 1
      );

      // Rewards cleared
      expect(await delegation.pendingRewards(user1.address)).to.equal(0);
    });

    it("claimReward emits TokensBurnedOnClaim", async function () {
      const {
        delegation, mining, bkc, owner, user1, operator, CLAIM_ETH_FEE,
      } = await loadFixture(stakedFixture);

      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      await expect(
        delegation
          .connect(user1)
          .claimReward(operator.address, { value: CLAIM_ETH_FEE })
      ).to.emit(delegation, "TokensBurnedOnClaim");
    });

    it("claimReward reverts with insufficient ETH fee", async function () {
      const {
        delegation, mining, bkc, owner, user1, operator, CLAIM_ETH_FEE,
      } = await loadFixture(stakedFixture);

      const rewardAmount = ethers.parseEther("100");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      await expect(
        delegation
          .connect(user1)
          .claimReward(operator.address, { value: CLAIM_ETH_FEE - 1n })
      ).to.be.revertedWithCustomError(delegation, "InsufficientETHFee");
    });

    it("claimReward reverts when no rewards to claim", async function () {
      const { delegation, user1, operator, CLAIM_ETH_FEE } =
        await loadFixture(stakedFixture);
      await expect(
        delegation
          .connect(user1)
          .claimReward(operator.address, { value: CLAIM_ETH_FEE })
      ).to.be.revertedWithCustomError(delegation, "NoRewardsToClaim");
    });

    it("rewards distributed proportionally to equal stakers", async function () {
      const { delegation, bkc, mining, owner, user1, user2, operator } =
        await loadFixture(deployEcosystem);

      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await bkc.connect(user2).approve(delegation.target, amount);

      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);
      await delegation
        .connect(user2)
        .delegate(amount, ONE_YEAR, operator.address);

      // Both have equal pStake
      const pStake1 = await delegation.userTotalPStake(user1.address);
      const pStake2 = await delegation.userTotalPStake(user2.address);
      expect(pStake1).to.equal(pStake2);

      // Deposit rewards
      const rewardAmount = ethers.parseEther("2000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      // Each should get exactly half (allow 1 wei rounding)
      const pending1 = await delegation.pendingRewards(user1.address);
      const pending2 = await delegation.pendingRewards(user2.address);
      expect(pending1).to.equal(pending2); // must be exactly equal
      expect(pending1).to.be.closeTo(ethers.parseEther("1000"), 1);
    });

    it("rewards weighted by pStake (amount × lockDays)", async function () {
      const { delegation, bkc, mining, owner, user1, user2, operator } =
        await loadFixture(deployEcosystem);

      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await bkc.connect(user2).approve(delegation.target, amount);

      // user1: 30-day lock → lower pStake
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 30, operator.address);
      // user2: 365-day lock → higher pStake
      await delegation
        .connect(user2)
        .delegate(amount, ONE_YEAR, operator.address);

      // Record pending before depositing known amount
      const beforePending1 = await delegation.pendingRewards(user1.address);
      const beforePending2 = await delegation.pendingRewards(user2.address);

      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      const afterPending1 = await delegation.pendingRewards(user1.address);
      const afterPending2 = await delegation.pendingRewards(user2.address);

      // Check the delta (isolates from any pre-existing rewards)
      const delta1 = afterPending1 - beforePending1;
      const delta2 = afterPending2 - beforePending2;

      // user2 should get ~12.17x more (365/30)
      expect(delta2).to.be.gt(delta1);
      const rewardRatio = (delta2 * 100n) / delta1;
      expect(rewardRatio).to.be.closeTo(1216n, 5n);
    });
  });

  // ===========================================================================
  //  VIEW FUNCTIONS
  // ===========================================================================

  describe("View Functions", function () {
    it("getDelegationsOf returns all delegations", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const amount = ethers.parseEther("500");
      await bkc.connect(user1).approve(delegation.target, amount * 2n);

      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 30, operator.address);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);

      const delegations = await delegation.getDelegationsOf(user1.address);
      expect(delegations.length).to.equal(2);
    });

    it("getDelegationCount returns correct count", async function () {
      const { delegation, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      expect(await delegation.getDelegationCount(user1.address)).to.equal(0);

      const amount = ethers.parseEther("100");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY, operator.address);

      expect(await delegation.getDelegationCount(user1.address)).to.equal(1);
    });

    it("getFeeStats returns correct aggregates", async function () {
      const { delegation, bkc, user1, operator, CLAIM_ETH_FEE } =
        await loadFixture(deployEcosystem);
      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);

      const stats = await delegation.getFeeStats();
      // BKC fee collected from delegation (5% of 1000 = 50)
      expect(stats.bkcCollected).to.equal(ethers.parseEther("50"));
      expect(stats.currentEthFee).to.equal(CLAIM_ETH_FEE);
      expect(stats.totalBurned).to.equal(0); // no claims yet
    });

    it("getBurnRateForBoost returns correct rates for all tiers", async function () {
      const { delegation } = await loadFixture(deployEcosystem);
      expect(await delegation.getBurnRateForBoost(0)).to.equal(5000); // 50%
      expect(await delegation.getBurnRateForBoost(1000)).to.equal(4000); // 40%
      expect(await delegation.getBurnRateForBoost(2500)).to.equal(2500); // 25%
      expect(await delegation.getBurnRateForBoost(4000)).to.equal(1000); // 10%
      expect(await delegation.getBurnRateForBoost(5000)).to.equal(0); // 0%
    });

    it("previewClaim shows correct claim breakdown", async function () {
      const { delegation, bkc, mining, owner, user1, operator } =
        await loadFixture(deployEcosystem);

      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);

      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      const preview = await delegation.previewClaim(user1.address);
      expect(preview.totalRewards).to.be.closeTo(rewardAmount, 1);
      expect(preview.burnRateBips).to.equal(5000); // No NFT → 50%
      // Burn and receive should each be ~50% of totalRewards
      expect(preview.burnAmount).to.equal(preview.totalRewards / 2n);
      expect(preview.userReceives).to.equal(
        preview.totalRewards - preview.burnAmount
      );
      expect(preview.nftBoost).to.equal(0);
    });

    it("getTierName returns correct names", async function () {
      const { delegation } = await loadFixture(deployEcosystem);
      expect(await delegation.getTierName(0)).to.equal("None");
      expect(await delegation.getTierName(1000)).to.equal("Bronze");
      expect(await delegation.getTierName(2500)).to.equal("Silver");
      expect(await delegation.getTierName(4000)).to.equal("Gold");
      expect(await delegation.getTierName(5000)).to.equal("Diamond");
    });
  });

  // ===========================================================================
  //  EDGE CASES
  // ===========================================================================

  describe("Edge Cases", function () {
    it("depositMiningRewards with zero totalNetworkPStake is a no-op", async function () {
      const { delegation, mining, bkc, owner } = await loadFixture(
        deployEcosystem
      );
      expect(await delegation.totalNetworkPStake()).to.equal(0);

      const rewardAmount = ethers.parseEther("100");
      await bkc.connect(owner).transfer(delegation.target, rewardAmount);

      const miningAddr = mining.target as string;
      await impersonateAccount(miningAddr);
      await setBalance(miningAddr, ethers.parseEther("1"));
      const miningSigner = await ethers.getSigner(miningAddr);

      await delegation.connect(miningSigner).depositMiningRewards(rewardAmount);

      // accRewardPerStake unchanged — rewards are lost (no stakers to distribute to)
      expect(await delegation.accRewardPerStake()).to.equal(0);
    });

    it("rewards saved correctly when user makes additional delegation", async function () {
      const {
        delegation, bkc, mining, owner, user1, operator, CLAIM_ETH_FEE,
      } = await loadFixture(deployEcosystem);

      // First delegation
      const amount1 = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount1);
      await delegation
        .connect(user1)
        .delegate(amount1, ONE_YEAR, operator.address);

      // Deposit rewards
      const reward1 = ethers.parseEther("500");
      await depositRewards(delegation, mining, bkc, owner, reward1);
      expect(await delegation.pendingRewards(user1.address)).to.be.closeTo(
        reward1, 1
      );

      // Second delegation triggers _updateUserRewards, saving previous rewards
      const amount2 = ethers.parseEther("500");
      await bkc.connect(user1).approve(delegation.target, amount2);
      await delegation
        .connect(user1)
        .delegate(amount2, ONE_DAY * 30, operator.address);

      // Saved rewards should include the first batch (allow 1 wei rounding)
      expect(await delegation.savedRewards(user1.address)).to.be.closeTo(
        reward1, 1
      );

      // Deposit more rewards
      const reward2 = ethers.parseEther("300");
      await depositRewards(delegation, mining, bkc, owner, reward2);

      // Total pending should include both reward batches (allow 2 wei for cumulative rounding)
      const totalPending = await delegation.pendingRewards(user1.address);
      expect(totalPending).to.be.closeTo(reward1 + reward2, 2);
    });

    it("zero fee configuration means no fee deduction", async function () {
      const { delegation, bkc, eco, user1, operator, owner } =
        await loadFixture(deployEcosystem);

      // Set delegation fee to 0%
      await eco.connect(owner).setServiceFee(DELEGATION_FEE_KEY, 0);

      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);

      // Full amount delegated (no fee)
      const delegations = await delegation.getDelegationsOf(user1.address);
      expect(delegations[0].amount).to.equal(amount);
    });

    it("claim ETH fee of 0 allows free claims", async function () {
      const { delegation, bkc, mining, owner, user1, operator } =
        await loadFixture(deployEcosystem);

      await delegation.setClaimEthFee(0);

      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await delegation
        .connect(user1)
        .delegate(amount, ONE_YEAR, operator.address);

      const rewardAmount = ethers.parseEther("100");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      // Claim with 0 ETH
      await delegation
        .connect(user1)
        .claimReward(operator.address, { value: 0 });

      expect(await delegation.pendingRewards(user1.address)).to.equal(0);
    });

    it("unstake preserves other user's rewards", async function () {
      const { delegation, bkc, mining, owner, user1, user2, operator } =
        await loadFixture(deployEcosystem);

      const amount = ethers.parseEther("1000");
      await bkc.connect(user1).approve(delegation.target, amount);
      await bkc.connect(user2).approve(delegation.target, amount);

      await delegation
        .connect(user1)
        .delegate(amount, ONE_DAY * 30, operator.address);
      await delegation
        .connect(user2)
        .delegate(amount, ONE_YEAR, operator.address);

      // Deposit rewards
      const rewardAmount = ethers.parseEther("1000");
      await depositRewards(delegation, mining, bkc, owner, rewardAmount);

      const pendingBefore = await delegation.pendingRewards(user2.address);
      expect(pendingBefore).to.be.gt(0);

      // user1 unstakes
      await time.increase(ONE_DAY * 31);
      await delegation.connect(user1).unstake(0, operator.address);

      // user2's rewards should be preserved (not reduced by user1's unstake)
      const pendingAfter = await delegation.pendingRewards(user2.address);
      expect(pendingAfter).to.be.gte(pendingBefore);
    });
  });
});
