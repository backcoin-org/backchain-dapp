import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  loadFixture,
  mine,
} from "@nomicfoundation/hardhat-network-helpers";

describe("FortunePool", function () {
  // =========================================================================
  //  FIXTURE: Deploy full ecosystem needed for FortunePool
  // =========================================================================

  async function deployEcosystem() {
    const [owner, treasury, user1, user2, operator] = await ethers.getSigners();

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

    // 3. Register BKCToken + treasury (MiningManager init reads BKCToken)
    await eco.setAddresses(
      bkc.target, treasury.address,
      ethers.ZeroAddress, ethers.ZeroAddress,
      ethers.ZeroAddress, ethers.ZeroAddress,
      ethers.ZeroAddress, ethers.ZeroAddress
    );

    // 4. MiningManager
    const MMFactory = await ethers.getContractFactory("MiningManager");
    const mining = await upgrades.deployProxy(MMFactory, [eco.target], {
      kind: "uups",
    });

    // 5. Register MiningManager (FortunePool init reads it)
    await eco.setAddresses(
      bkc.target, treasury.address,
      ethers.ZeroAddress, ethers.ZeroAddress,
      mining.target, ethers.ZeroAddress,
      ethers.ZeroAddress, ethers.ZeroAddress
    );

    // 6. DelegationManager (needed for mining distribution)
    const DelFactory = await ethers.getContractFactory("DelegationManager");
    const delegation = await upgrades.deployProxy(
      DelFactory,
      [owner.address, eco.target],
      { kind: "uups" }
    );

    // 7. FortunePool
    const FPFactory = await ethers.getContractFactory("FortunePool");
    const fortune = await upgrades.deployProxy(
      FPFactory,
      [owner.address, eco.target],
      { kind: "uups" }
    );

    // 8. Full wiring
    await eco.setAddresses(
      bkc.target, treasury.address,
      delegation.target, ethers.ZeroAddress,
      mining.target, ethers.ZeroAddress,
      fortune.target, ethers.ZeroAddress
    );

    // 9. Mint initial supply (owner is still BKCToken owner)
    const INITIAL = ethers.parseEther("10000000");
    await bkc.mint(owner.address, INITIAL);

    // 10. Transfer BKCToken ownership to MiningManager (so mining can mint)
    await bkc.transferOwnership(mining.target);

    // 11. Authorize FortunePool as miner
    const FORTUNE_KEY = ethers.keccak256(
      ethers.toUtf8Bytes("FORTUNE_POOL_SERVICE")
    );
    await mining.setAuthorizedMiner(FORTUNE_KEY, fortune.target);

    // 12. Distribution config (must sum to 10000)
    const POOL_TREASURY = ethers.keccak256(ethers.toUtf8Bytes("TREASURY"));
    const POOL_DELEGATOR = ethers.keccak256(
      ethers.toUtf8Bytes("DELEGATOR_POOL")
    );
    await eco.setMiningDistributionBips(POOL_TREASURY, 5000);
    await eco.setMiningDistributionBips(POOL_DELEGATOR, 5000);
    await eco.setFeeDistributionBips(POOL_TREASURY, 5000);
    await eco.setFeeDistributionBips(POOL_DELEGATOR, 5000);

    // 13. Configure tiers
    // Tier 1: range 1 (guaranteed win for testing), multiplier 1x (10000 bips)
    await fortune.configureTier(1, 1, 10000);
    // Tier 2: range 100, multiplier 5x (50000 bips) - capped by MAX_PAYOUT_BIPS
    await fortune.configureTier(2, 100, 50000);

    // 14. Fund prize pool
    const PRIZE = ethers.parseEther("100000");
    await bkc.approve(fortune.target, PRIZE);
    await fortune.fundPrizePool(PRIZE);

    // 15. Give users BKC
    const USER_BKC = ethers.parseEther("10000");
    await bkc.transfer(user1.address, USER_BKC);
    await bkc.transfer(user2.address, USER_BKC);

    return {
      owner, treasury, user1, user2, operator,
      eco, bkc, mining, delegation, fortune,
    };
  }

  // =========================================================================
  //  HELPERS
  // =========================================================================

  async function commitGame(
    fortune: any,
    bkc: any,
    player: any,
    guesses: bigint[],
    wager: bigint,
    isCumulative: boolean,
    operatorAddr: string
  ) {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = await fortune.generateCommitmentHash(guesses, secret);
    const fee = await fortune.getRequiredServiceFee(isCumulative);

    await bkc.connect(player).approve(fortune.target, wager);
    const tx = await fortune
      .connect(player)
      .commitPlay(hash, wager, isCumulative, operatorAddr, { value: fee });
    const receipt = await tx.wait();

    // Extract gameId from GameCommitted event
    const event = receipt!.logs.find(
      (l: any) => l.fragment?.name === "GameCommitted"
    );
    const gameId = event ? event.args[0] : await fortune.gameCounter();

    return { gameId, secret, hash, fee };
  }

  // ===========================================================================
  //  INITIALIZATION
  // ===========================================================================

  describe("Initialization", function () {
    it("sets correct initial state", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      expect(await fortune.gameCounter()).to.equal(0);
      expect(await fortune.serviceFee()).to.equal(ethers.parseEther("0.0001"));
      expect(await fortune.gameFeeBips()).to.equal(1000); // 10%
      expect(await fortune.revealDelay()).to.equal(5);
      expect(await fortune.revealWindow()).to.equal(251);
      expect(await fortune.activeTierCount()).to.equal(2);
    });

    it("tier 1 configured correctly (guaranteed win tier)", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      const tier = await fortune.getTier(1);
      expect(tier.maxRange).to.equal(1);
      expect(tier.multiplierBips).to.equal(10000);
      expect(tier.active).to.be.true;
    });

    it("prize pool funded", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      expect(await fortune.prizePoolBalance()).to.equal(
        ethers.parseEther("100000")
      );
    });
  });

  // ===========================================================================
  //  ADMIN
  // ===========================================================================

  describe("Admin", function () {
    it("configureTier by owner", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      await expect(fortune.configureTier(3, 1000, 30000))
        .to.emit(fortune, "TierConfigured")
        .withArgs(3, 1000, 30000, true);
      expect(await fortune.activeTierCount()).to.equal(3);
    });

    it("setGameFee caps at MAX_GAME_FEE_BIPS", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      await expect(fortune.setGameFee(3001)).to.be.revertedWithCustomError(
        fortune,
        "InvalidFee"
      );
      await fortune.setGameFee(3000); // at the cap — should succeed
      expect(await fortune.gameFeeBips()).to.equal(3000);
    });

    it("setServiceFee has no upper bound (M-01 finding)", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      // Owner can set absurdly high fee — this is the M-01 finding
      await fortune.setServiceFee(ethers.parseEther("100"));
      expect(await fortune.serviceFee()).to.equal(ethers.parseEther("100"));
    });

    it("emergencyWithdraw sends to treasury", async function () {
      const { fortune, bkc, treasury } = await loadFixture(deployEcosystem);
      const poolBefore = await fortune.prizePoolBalance();
      const treasuryBefore = await bkc.balanceOf(treasury.address);

      await fortune.emergencyWithdraw();

      expect(await fortune.prizePoolBalance()).to.equal(0);
      expect(await bkc.balanceOf(treasury.address)).to.equal(
        treasuryBefore + poolBefore
      );
    });

    it("non-owner cannot call admin functions", async function () {
      const { fortune, user1 } = await loadFixture(deployEcosystem);
      await expect(
        fortune.connect(user1).setServiceFee(0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        fortune.connect(user1).configureTier(3, 10, 10000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // ===========================================================================
  //  COMMIT PHASE
  // ===========================================================================

  describe("Commit Phase", function () {
    it("commitPlay creates a game correctly", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const { gameId } = await commitGame(
        fortune, bkc, user1, [1n], wager, false, operator.address
      );

      expect(gameId).to.equal(1);
      expect(await fortune.gameCounter()).to.equal(1);

      const commitment = await fortune.getCommitment(gameId);
      expect(commitment.player).to.equal(user1.address);
      expect(commitment.isCumulative).to.be.false;
      expect(commitment.status).to.equal(1); // COMMITTED
      // wager is stored as net (after 10% game fee)
      expect(commitment.wagerAmount).to.equal(ethers.parseEther("90"));
    });

    it("reverts on zero wager", async function () {
      const { fortune, user1, operator } = await loadFixture(deployEcosystem);
      const hash = ethers.keccak256(ethers.toUtf8Bytes("dummy"));
      const fee = await fortune.getRequiredServiceFee(false);
      await expect(
        fortune
          .connect(user1)
          .commitPlay(hash, 0, false, operator.address, { value: fee })
      ).to.be.revertedWithCustomError(fortune, "ZeroAmount");
    });

    it("reverts on zero commitment hash", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("10");
      await bkc.connect(user1).approve(fortune.target, wager);
      const fee = await fortune.getRequiredServiceFee(false);
      await expect(
        fortune
          .connect(user1)
          .commitPlay(ethers.ZeroHash, wager, false, operator.address, {
            value: fee,
          })
      ).to.be.revertedWithCustomError(fortune, "InvalidCommitment");
    });

    it("reverts on insufficient service fee", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("10");
      const hash = ethers.keccak256(ethers.toUtf8Bytes("dummy"));
      await bkc.connect(user1).approve(fortune.target, wager);
      await expect(
        fortune
          .connect(user1)
          .commitPlay(hash, wager, false, operator.address, { value: 0 })
      ).to.be.revertedWithCustomError(fortune, "InsufficientServiceFee");
    });

    it("cumulative mode requires 5x service fee", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      const singleFee = await fortune.getRequiredServiceFee(false);
      const cumulativeFee = await fortune.getRequiredServiceFee(true);
      expect(cumulativeFee).to.equal(singleFee * 5n);
    });

    it("tracks ETH and BKC fees", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const { fee } = await commitGame(
        fortune, bkc, user1, [1n], wager, false, operator.address
      );

      expect(await fortune.totalETHCollected()).to.equal(fee);
      // Game fee = 10% of 100 = 10 BKC
      expect(await fortune.totalBKCFees()).to.equal(ethers.parseEther("10"));
    });
  });

  // ===========================================================================
  //  REVEAL PHASE
  // ===========================================================================

  describe("Reveal Phase", function () {
    it("revealPlay works after revealDelay blocks", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const guesses = [1n]; // Tier 1 has range=1, so guess=1 always wins
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      // Mine revealDelay blocks
      await mine(5);

      // Reveal
      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.emit(fortune, "GameRevealed");

      const result = await fortune.getGameResult(gameId);
      expect(result.player).to.equal(user1.address);
      expect(result.timestamp).to.be.gt(0);
    });

    it("reverts when revealing too early", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const guesses = [1n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      // Mine only 2 blocks (need 5)
      await mine(2);

      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "TooEarlyToReveal");
    });

    it("reverts when revealing too late (expired)", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const guesses = [1n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      // Mine past revealWindow (1000 blocks)
      await mine(1001);

      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "TooLateToReveal");
    });

    it("reverts when wrong player reveals", async function () {
      const { fortune, bkc, user1, user2, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const guesses = [1n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      await mine(5);

      await expect(
        fortune.connect(user2).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "NotCommitmentOwner");
    });

    it("reverts on hash mismatch (wrong guesses)", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const guesses = [1n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      await mine(5);

      // Reveal with different guesses
      const wrongGuesses = [2n];
      await expect(
        fortune.connect(user1).revealPlay(gameId, wrongGuesses, secret)
      ).to.be.revertedWithCustomError(fortune, "HashMismatch");
    });

    it("reverts on double reveal", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      const guesses = [1n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      await mine(5);
      await fortune.connect(user1).revealPlay(gameId, guesses, secret);

      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "AlreadyRevealed");
    });

    it("winning game with guaranteed-win tier pays prize", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      // Tier 1: range=1, guess=1, always wins. Multiplier=10000 bips (1x).
      // Wager=100, game fee=10%, net=90. Prize = 90 * 10000/10000 = 90 BKC
      // But since it's 1x mode (non-cumulative), it uses the JACKPOT tier (tier 2, range=100).
      // So for guaranteed win, we need cumulative mode where tier 1 is checked.

      // Actually for non-cumulative, it only plays the HIGHEST tier (jackpot = tier 2, range=100)
      // For guaranteed win, let's use cumulative mode and check tier 1

      const wager = ethers.parseEther("100");
      const guesses = [1n, 50n]; // tier 1: guaranteed win, tier 2: likely lose
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, true, operator.address
      );

      const balanceBefore = await bkc.balanceOf(user1.address);
      await mine(5);
      await fortune.connect(user1).revealPlay(gameId, guesses, secret);

      const result = await fortune.getGameResult(gameId);
      expect(result.isCumulative).to.be.true;
      // Tier 1 always matches (range=1, guess=1, roll=1)
      expect(result.matchCount).to.be.gte(1);
      expect(result.prizeWon).to.be.gt(0);

      // User received prize
      const balanceAfter = await bkc.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("prize is capped at MAX_PAYOUT_BIPS of pool", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      // Pool has 100k BKC. MAX_PAYOUT_BIPS=5000 (50%). Max payout = 50k BKC.
      // Even with a huge multiplier, prize is capped.
      const poolBalance = await fortune.prizePoolBalance();
      const maxPayout = (poolBalance * 5000n) / 10000n;

      // Very large wager to try to exceed cap
      const wager = ethers.parseEther("5000");
      await bkc.transfer(user1.address, wager); // give user more BKC
      const guesses = [1n, 1n]; // cumulative, tier 1 guaranteed
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, true, operator.address
      );

      await mine(5);
      await fortune.connect(user1).revealPlay(gameId, guesses, secret);

      const result = await fortune.getGameResult(gameId);
      expect(result.prizeWon).to.be.lte(maxPayout);
    });
  });

  // ===========================================================================
  //  EXPIRED GAMES
  // ===========================================================================

  describe("Expired Games", function () {
    it("claimExpiredGame after revealWindow", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("10");
      const { gameId } = await commitGame(
        fortune, bkc, user1, [1n], wager, false, operator.address
      );

      // Mine past revealWindow
      await mine(1001);

      await expect(fortune.claimExpiredGame(gameId))
        .to.emit(fortune, "GameExpired")
        .withArgs(gameId, user1.address, ethers.parseEther("9")); // net wager

      expect(await fortune.totalExpiredGames()).to.equal(1);
    });

    it("cannot claim game that hasn't expired yet", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("10");
      const { gameId } = await commitGame(
        fortune, bkc, user1, [1n], wager, false, operator.address
      );

      await mine(5); // within reveal window

      await expect(
        fortune.claimExpiredGame(gameId)
      ).to.be.revertedWithCustomError(fortune, "CommitmentNotExpired");
    });

    it("cannot claim already revealed game", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("10");
      const guesses = [1n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, false, operator.address
      );

      await mine(5);
      await fortune.connect(user1).revealPlay(gameId, guesses, secret);

      await mine(1001);
      await expect(
        fortune.claimExpiredGame(gameId)
      ).to.be.revertedWithCustomError(fortune, "InvalidCommitment");
    });
  });

  // ===========================================================================
  //  CUMULATIVE MODE (5x)
  // ===========================================================================

  describe("Cumulative Mode", function () {
    it("requires correct number of guesses per active tiers", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      // 2 active tiers, but only 1 guess in cumulative mode
      const wager = ethers.parseEther("10");
      const guesses = [1n]; // only 1 guess, need 2

      const secret = ethers.hexlify(ethers.randomBytes(32));
      const hash = await fortune.generateCommitmentHash(guesses, secret);
      const fee = await fortune.getRequiredServiceFee(true);

      await bkc.connect(user1).approve(fortune.target, wager);
      const tx = await fortune
        .connect(user1)
        .commitPlay(hash, wager, true, operator.address, { value: fee });

      const gameId = await fortune.gameCounter();
      await mine(5);

      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "InvalidGuessCount");
    });

    it("validates guess range per tier", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      // Tier 1 range=1, tier 2 range=100
      // Guess for tier 2 out of range (101)
      const wager = ethers.parseEther("10");
      const guesses = [1n, 101n]; // tier 2 max is 100, so 101 is out of range

      const secret = ethers.hexlify(ethers.randomBytes(32));
      const hash = await fortune.generateCommitmentHash(guesses, secret);
      const fee = await fortune.getRequiredServiceFee(true);

      await bkc.connect(user1).approve(fortune.target, wager);
      await fortune
        .connect(user1)
        .commitPlay(hash, wager, true, operator.address, { value: fee });

      const gameId = await fortune.gameCounter();
      await mine(5);

      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "InvalidGuessRange");
    });
  });

  // ===========================================================================
  //  ATTACK SCENARIOS
  // ===========================================================================

  describe("Attack Scenarios", function () {
    it("C-01 FIX: revealWindow capped at 251 prevents blockhash expiry", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      // After C-01 fix: revealWindow is capped at 251 blocks and
      // blockhash == 0 now causes a revert instead of fallback.
      // With window=251, mining 300 blocks causes TooLateToReveal
      // before the blockhash issue is even reached.

      const wager = ethers.parseEther("10");
      const guesses = [1n, 50n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, true, operator.address
      );

      // Mine past the 251-block window
      await mine(300);

      // Reveal fails because the window has expired
      await expect(
        fortune.connect(user1).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "TooLateToReveal");
    });

    it("C-01 FIX: setRevealWindow rejects values above 251", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      await expect(fortune.setRevealWindow(252)).to.be.revertedWithCustomError(
        fortune,
        "InvalidDelay"
      );
      // 251 is the max — should succeed
      await fortune.setRevealWindow(251);
      expect(await fortune.revealWindow()).to.equal(251);
    });

    it("cannot front-run committed guesses (hash is opaque)", async function () {
      const { fortune, bkc, user1, user2, operator } = await loadFixture(
        deployEcosystem
      );
      // An attacker sees the commitPlay transaction but cannot extract
      // the guesses because only the hash is on-chain.

      const wager = ethers.parseEther("10");
      const guesses = [1n, 42n];
      const { gameId, secret } = await commitGame(
        fortune, bkc, user1, guesses, wager, true, operator.address
      );

      // The commitment hash is on-chain
      const storedHash = await fortune.commitmentHashes(gameId);
      // But it doesn't reveal the guesses — it's a keccak256 hash
      expect(storedHash).to.not.equal(ethers.ZeroHash);

      // Another user cannot reveal for the player
      await mine(5);
      await expect(
        fortune.connect(user2).revealPlay(gameId, guesses, secret)
      ).to.be.revertedWithCustomError(fortune, "NotCommitmentOwner");
    });

    it("multiple concurrent games from same player", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      // Player can have multiple active games
      const wager = ethers.parseEther("10");

      const g1 = await commitGame(
        fortune, bkc, user1, [1n, 1n], wager, true, operator.address
      );
      const g2 = await commitGame(
        fortune, bkc, user1, [1n, 50n], wager, true, operator.address
      );

      expect(g1.gameId).to.not.equal(g2.gameId);

      await mine(5);

      // Both can be revealed independently
      await fortune.connect(user1).revealPlay(g1.gameId, [1n, 1n], g1.secret);
      await fortune.connect(user1).revealPlay(g2.gameId, [1n, 50n], g2.secret);
    });
  });

  // ===========================================================================
  //  VIEW FUNCTIONS
  // ===========================================================================

  describe("View Functions", function () {
    it("getRequiredServiceFee for both modes", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      const single = await fortune.getRequiredServiceFee(false);
      const cumulative = await fortune.getRequiredServiceFee(true);
      expect(single).to.equal(ethers.parseEther("0.0001"));
      expect(cumulative).to.equal(ethers.parseEther("0.0005"));
    });

    it("getExpectedGuessCount", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      expect(await fortune.getExpectedGuessCount(false)).to.equal(1);
      expect(await fortune.getExpectedGuessCount(true)).to.equal(2);
    });

    it("getPoolStats returns correct aggregates", async function () {
      const { fortune, bkc, user1, operator } = await loadFixture(
        deployEcosystem
      );
      const wager = ethers.parseEther("100");
      await commitGame(
        fortune, bkc, user1, [1n, 1n], wager, true, operator.address
      );

      const stats = await fortune.getPoolStats();
      expect(stats.gamesPlayed).to.equal(1);
      expect(stats.wageredAllTime).to.equal(ethers.parseEther("90")); // net
    });

    it("generateCommitmentHash matches on-chain calculation", async function () {
      const { fortune } = await loadFixture(deployEcosystem);
      const guesses = [1n, 42n];
      const secret = ethers.hexlify(ethers.randomBytes(32));
      const hash = await fortune.generateCommitmentHash(guesses, secret);
      expect(hash).to.not.equal(ethers.ZeroHash);

      // Calling again with same inputs gives same hash
      const hash2 = await fortune.generateCommitmentHash(guesses, secret);
      expect(hash).to.equal(hash2);
    });
  });
});
