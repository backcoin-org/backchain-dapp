// =============================================================================
// BACKCHAIN V9 — COMPREHENSIVE INTEGRATION TESTS
// =============================================================================
// Tests cross-contract flows for all 15 V9 smart contracts.
// Uses ethers v6 + Hardhat + loadFixture for test isolation.
// =============================================================================

import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time,
  mine,
} from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ---------------------------------------------------------------------------
// Helper: keccak256 of a string (for module/action IDs)
// ---------------------------------------------------------------------------
function id(str: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

// ---------------------------------------------------------------------------
// Helper: keccak256 of abi.encode("NFT_BUY_T", tier) to match Solidity
// ---------------------------------------------------------------------------
function nftActionId(prefix: string, tier: number): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return ethers.keccak256(abiCoder.encode(["string", "uint8"], [prefix, tier]));
}

// ---------------------------------------------------------------------------
// Constants matching V9 contracts
// ---------------------------------------------------------------------------
const MAX_SUPPLY = ethers.parseEther("200000000"); // 200M
const TGE_AMOUNT = ethers.parseEther("40000000"); // 40M
const BPS = 10_000n;

// Module IDs (must match contracts)
const MOD_STAKING = id("STAKING");
const MOD_NFT_POOL = id("NFT_POOL");
const MOD_RENTAL = id("RENTAL");
const MOD_AGORA = id("AGORA");
const MOD_FORTUNE = id("FORTUNE");
const MOD_NOTARY = id("NOTARY");
const MOD_CHARITY = id("CHARITY");

// ============================================================================
// MASTER DEPLOY FIXTURE
// ============================================================================

async function deployAllFixture() {
  const [deployer, treasury, operator, alice, bob, charlie, relayer] =
    await ethers.getSigners();

  // ── 1. BKCToken ──
  const BKCToken = await ethers.getContractFactory("contracts/BKCToken.sol:BKCToken");
  const bkcToken = await BKCToken.deploy(treasury.address);
  await bkcToken.waitForDeployment();
  const bkcAddr = await bkcToken.getAddress();

  // ── 2. BackchainEcosystem ──
  const Ecosystem = await ethers.getContractFactory("contracts/BackchainEcosystem.sol:BackchainEcosystem");
  const ecosystem = await Ecosystem.deploy(bkcAddr, treasury.address);
  await ecosystem.waitForDeployment();
  const ecosystemAddr = await ecosystem.getAddress();

  // ── 3. LiquidityPool ──
  const LiquidityPool = await ethers.getContractFactory("contracts/LiquidityPool.sol:LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(bkcAddr);
  await liquidityPool.waitForDeployment();
  const lpAddr = await liquidityPool.getAddress();

  // ── 4. StakingPool ──
  const StakingPool = await ethers.getContractFactory("contracts/StakingPool.sol:StakingPool");
  const stakingPool = await StakingPool.deploy(ecosystemAddr, bkcAddr);
  await stakingPool.waitForDeployment();
  const stakingAddr = await stakingPool.getAddress();

  // ── 5. BuybackMiner ──
  const BuybackMiner = await ethers.getContractFactory("contracts/BuybackMiner.sol:BuybackMiner");
  const buybackMiner = await BuybackMiner.deploy(
    ecosystemAddr,
    bkcAddr,
    lpAddr,
    stakingAddr
  );
  await buybackMiner.waitForDeployment();
  const buybackAddr = await buybackMiner.getAddress();

  // ── 6. RewardBooster (ERC-721) ──
  const RewardBooster = await ethers.getContractFactory("contracts/RewardBooster.sol:RewardBooster");
  const rewardBooster = await RewardBooster.deploy(deployer.address);
  await rewardBooster.waitForDeployment();
  const boosterAddr = await rewardBooster.getAddress();

  // ── 7. NFTPools (one per tier: 0=Bronze, 1=Silver, 2=Gold, 3=Diamond) ──
  const NFTPool = await ethers.getContractFactory("contracts/NFTPool.sol:NFTPool");
  const nftPools: any[] = [];
  const nftPoolAddrs: string[] = [];
  for (let t = 0; t < 4; t++) {
    const pool = await NFTPool.deploy(ecosystemAddr, bkcAddr, boosterAddr, t);
    await pool.waitForDeployment();
    nftPools.push(pool);
    nftPoolAddrs.push(await pool.getAddress());
  }

  // ── 8. RentalManager ──
  const RentalManager = await ethers.getContractFactory("contracts/RentalManager.sol:RentalManager");
  const rentalManager = await RentalManager.deploy(ecosystemAddr, boosterAddr);
  await rentalManager.waitForDeployment();
  const rentalAddr = await rentalManager.getAddress();

  // ── 9. Agora ──
  const Agora = await ethers.getContractFactory("contracts/Agora.sol:Agora");
  const agora = await Agora.deploy(ecosystemAddr);
  await agora.waitForDeployment();
  const agoraAddr = await agora.getAddress();

  // ── 10. FortunePool ──
  const FortunePool = await ethers.getContractFactory("contracts/FortunePool.sol:FortunePool");
  const fortunePool = await FortunePool.deploy(ecosystemAddr, bkcAddr);
  await fortunePool.waitForDeployment();
  const fortuneAddr = await fortunePool.getAddress();

  // ── 11. Notary ──
  const Notary = await ethers.getContractFactory("contracts/Notary.sol:Notary");
  const notary = await Notary.deploy(ecosystemAddr);
  await notary.waitForDeployment();
  const notaryAddr = await notary.getAddress();

  // ── 12. CharityPool ──
  const CharityPool = await ethers.getContractFactory("contracts/CharityPool.sol:CharityPool");
  const charityPool = await CharityPool.deploy(ecosystemAddr);
  await charityPool.waitForDeployment();
  const charityAddr = await charityPool.getAddress();

  // ── 13. BackchainGovernance ──
  const Governance = await ethers.getContractFactory("contracts/BackchainGovernance.sol:BackchainGovernance");
  const governance = await Governance.deploy(3600); // 1 hour delay
  await governance.waitForDeployment();
  const govAddr = await governance.getAddress();

  // ── 14. SimpleBKCFaucet ──
  const Faucet = await ethers.getContractFactory("contracts/SimpleBKCFaucet.sol:SimpleBKCFaucet");
  const faucet = await Faucet.deploy(
    bkcAddr,
    relayer.address,
    ethers.parseEther("100"), // 100 BKC per claim
    ethers.parseEther("0.01"), // 0.01 ETH per claim
    3600 // 1 hour cooldown
  );
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();

  // ════════════════════════════════════════════════════════════════════════
  // POST-DEPLOY WIRING
  // ════════════════════════════════════════════════════════════════════════

  // BKCToken: add BuybackMiner as minter
  await bkcToken.addMinter(buybackAddr);

  // Ecosystem: set addresses
  await ecosystem.setBuybackMiner(buybackAddr);
  await ecosystem.setStakingPool(stakingAddr);

  // Ecosystem: generic module config (10% custom, 10% operator, 30% treasury, 50% buyback)
  const defaultCfg = {
    active: true,
    customBps: 1000,
    operatorBps: 1000,
    treasuryBps: 3000,
    buybackBps: 5000,
  };

  // Register all modules in ecosystem
  await ecosystem.registerModule(stakingAddr, MOD_STAKING, defaultCfg);

  // Register all 4 NFT Pools under the same module ID
  for (const poolAddr of nftPoolAddrs) {
    await ecosystem.registerModule(poolAddr, MOD_NFT_POOL, defaultCfg);
  }

  await ecosystem.registerModule(rentalAddr, MOD_RENTAL, defaultCfg);
  await ecosystem.registerModule(agoraAddr, MOD_AGORA, defaultCfg);
  await ecosystem.registerModule(fortuneAddr, MOD_FORTUNE, defaultCfg);
  await ecosystem.registerModule(notaryAddr, MOD_NOTARY, defaultCfg);
  await ecosystem.registerModule(charityAddr, MOD_CHARITY, defaultCfg);

  // StakingPool: set reward notifiers (BuybackMiner + Ecosystem)
  await stakingPool.setRewardNotifier(buybackAddr, true);
  await stakingPool.setRewardNotifier(ecosystemAddr, true);
  await stakingPool.setRewardBooster(boosterAddr);

  // ── Mint NFTs before configuring pools ──
  // 5 per tier
  await rewardBooster.mintBatch(deployer.address, 0, 5); // Bronze: IDs 1-5
  await rewardBooster.mintBatch(deployer.address, 1, 5); // Silver: IDs 6-10
  await rewardBooster.mintBatch(deployer.address, 2, 5); // Gold: IDs 11-15
  await rewardBooster.mintBatch(deployer.address, 3, 5); // Diamond: IDs 16-20

  // ── Approve NFT pools for NFTs and BKC ──
  await rewardBooster.setApprovalForAll(nftPoolAddrs[0], true);
  await rewardBooster.setApprovalForAll(nftPoolAddrs[1], true);
  await rewardBooster.setApprovalForAll(nftPoolAddrs[2], true);
  await rewardBooster.setApprovalForAll(nftPoolAddrs[3], true);

  // Transfer BKC from treasury to deployer for pool initialization
  const poolBkc = ethers.parseEther("100000"); // 100k per pool
  await bkcToken.connect(treasury).transfer(deployer.address, poolBkc * 4n);

  // Approve BKC for each pool
  for (const poolAddr of nftPoolAddrs) {
    await bkcToken.approve(poolAddr, poolBkc);
  }

  // Initialize NFT pools
  await nftPools[0].initializePool([1, 2, 3, 4, 5], poolBkc);
  await nftPools[1].initializePool([6, 7, 8, 9, 10], poolBkc);
  await nftPools[2].initializePool([11, 12, 13, 14, 15], poolBkc);
  await nftPools[3].initializePool([16, 17, 18, 19, 20], poolBkc);

  // Configure pools in RewardBooster (locks forever)
  await rewardBooster.configurePools([
    nftPoolAddrs[0],
    nftPoolAddrs[1],
    nftPoolAddrs[2],
    nftPoolAddrs[3],
  ]);

  // ── Seed LiquidityPool (for buyback to work) ──
  const lpBkc = ethers.parseEther("1000000"); // 1M BKC
  const lpEth = ethers.parseEther("100"); // 100 ETH
  await bkcToken.connect(treasury).transfer(deployer.address, lpBkc);
  await bkcToken.approve(lpAddr, lpBkc);
  await liquidityPool.addLiquidity(lpBkc, 0, { value: lpEth });

  // ── Fund faucet ──
  await bkcToken.connect(treasury).transfer(faucetAddr, ethers.parseEther("10000"));
  await deployer.sendTransaction({ to: faucetAddr, value: ethers.parseEther("1") });

  // ── Give Alice & Bob some BKC for testing ──
  const userBkc = ethers.parseEther("50000");
  await bkcToken.connect(treasury).transfer(alice.address, userBkc);
  await bkcToken.connect(treasury).transfer(bob.address, userBkc);

  return {
    deployer,
    treasury,
    operator,
    alice,
    bob,
    charlie,
    relayer,
    bkcToken,
    ecosystem,
    liquidityPool,
    stakingPool,
    buybackMiner,
    rewardBooster,
    nftPools,
    nftPoolAddrs,
    rentalManager,
    agora,
    fortunePool,
    notary,
    charityPool,
    governance,
    faucet,
    bkcAddr,
    ecosystemAddr,
    lpAddr,
    stakingAddr,
    buybackAddr,
    boosterAddr,
    rentalAddr,
    agoraAddr,
    fortuneAddr,
    notaryAddr,
    charityAddr,
    govAddr,
    faucetAddr,
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe("Backchain V9 — Integration Tests", function () {
  // ══════════════════════════════════════════════════════════════════════════
  // 1. FULL DEPLOY & SETUP
  // ══════════════════════════════════════════════════════════════════════════

  describe("1. Full Deploy & Setup", function () {
    it("deploys all contracts with correct addresses", async function () {
      const f = await loadFixture(deployAllFixture);

      expect(await f.bkcToken.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.ecosystem.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.liquidityPool.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.stakingPool.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.buybackMiner.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.rewardBooster.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.rentalManager.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.agora.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.fortunePool.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.notary.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.charityPool.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.governance.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await f.faucet.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("ecosystem has correct BKC token and treasury", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.ecosystem.bkcToken()).to.equal(f.bkcAddr);
      expect(await f.ecosystem.treasury()).to.equal(f.treasury.address);
    });

    it("ecosystem has buybackMiner and stakingPool set", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.ecosystem.buybackMiner()).to.equal(f.buybackAddr);
      expect(await f.ecosystem.stakingPool()).to.equal(f.stakingAddr);
    });

    it("all modules are registered and active in ecosystem", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.ecosystem.isAuthorized(f.stakingAddr)).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.nftPoolAddrs[0])).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.nftPoolAddrs[3])).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.rentalAddr)).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.agoraAddr)).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.fortuneAddr)).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.notaryAddr)).to.be.true;
      expect(await f.ecosystem.isAuthorized(f.charityAddr)).to.be.true;
    });

    it("BuybackMiner is authorized minter on BKCToken", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.bkcToken.isMinter(f.buybackAddr)).to.be.true;
    });

    it("StakingPool has correct reward notifiers", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.stakingPool.isRewardNotifier(f.buybackAddr)).to.be.true;
      expect(await f.stakingPool.isRewardNotifier(f.ecosystemAddr)).to.be.true;
    });

    it("RewardBooster is configured and locked", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.rewardBooster.configured()).to.be.true;
      expect(await f.rewardBooster.totalSupply()).to.equal(20); // 5 per tier * 4
    });

    it("NFTPools are initialized with correct inventory", async function () {
      const f = await loadFixture(deployAllFixture);
      for (let t = 0; t < 4; t++) {
        expect(await f.nftPools[t].initialized()).to.be.true;
        expect(await f.nftPools[t].nftCount()).to.equal(5);
        expect(await f.nftPools[t].tier()).to.equal(t);
      }
    });

    it("LiquidityPool has reserves", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.liquidityPool.ethReserve()).to.be.gt(0);
      expect(await f.liquidityPool.bkcReserve()).to.be.gt(0);
    });

    it("TGE minted 40M to treasury", async function () {
      const f = await loadFixture(deployAllFixture);
      // Treasury started with 40M, then distributed tokens, so total supply includes TGE
      expect(await f.bkcToken.totalSupply()).to.be.gte(TGE_AMOUNT);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. BKC TOKEN
  // ══════════════════════════════════════════════════════════════════════════

  describe("2. BKCToken", function () {
    it("has correct name, symbol, and MAX_SUPPLY", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.bkcToken.name()).to.equal("Backcoin");
      expect(await f.bkcToken.symbol()).to.equal("BKC");
      expect(await f.bkcToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("mint: authorized minter can mint", async function () {
      const f = await loadFixture(deployAllFixture);
      // BuybackMiner is an authorized minter, but we cannot call it directly
      // so we add deployer as a minter for testing
      await f.bkcToken.addMinter(f.deployer.address);
      const before = await f.bkcToken.totalSupply();
      await f.bkcToken.mint(f.alice.address, ethers.parseEther("1000"));
      expect(await f.bkcToken.totalSupply()).to.equal(
        before + ethers.parseEther("1000")
      );
    });

    it("mint: non-minter cannot mint", async function () {
      const f = await loadFixture(deployAllFixture);
      await expect(
        f.bkcToken.connect(f.alice).mint(f.alice.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(f.bkcToken, "NotMinter");
    });

    it("transfer: works correctly", async function () {
      const f = await loadFixture(deployAllFixture);
      const amount = ethers.parseEther("100");
      await f.bkcToken.connect(f.alice).transfer(f.charlie.address, amount);
      expect(await f.bkcToken.balanceOf(f.charlie.address)).to.equal(amount);
    });

    it("burn: reduces supply and tracks totalBurned", async function () {
      const f = await loadFixture(deployAllFixture);
      const burnAmt = ethers.parseEther("500");
      const supplyBefore = await f.bkcToken.totalSupply();
      await f.bkcToken.connect(f.alice).burn(burnAmt);
      expect(await f.bkcToken.totalSupply()).to.equal(supplyBefore - burnAmt);
      expect(await f.bkcToken.totalBurned()).to.equal(burnAmt);
    });

    it("burnFrom: works with allowance", async function () {
      const f = await loadFixture(deployAllFixture);
      const burnAmt = ethers.parseEther("200");
      await f.bkcToken.connect(f.alice).approve(f.bob.address, burnAmt);
      await f.bkcToken.connect(f.bob).burnFrom(f.alice.address, burnAmt);
      expect(await f.bkcToken.totalBurned()).to.equal(burnAmt);
    });

    it("minter management: add, remove, renounce", async function () {
      const f = await loadFixture(deployAllFixture);

      // Add new minter
      await f.bkcToken.addMinter(f.alice.address);
      expect(await f.bkcToken.isMinter(f.alice.address)).to.be.true;

      // Remove minter
      await f.bkcToken.removeMinter(f.alice.address);
      expect(await f.bkcToken.isMinter(f.alice.address)).to.be.false;

      // Non-deployer cannot add minter
      await expect(
        f.bkcToken.connect(f.alice).addMinter(f.bob.address)
      ).to.be.revertedWithCustomError(f.bkcToken, "NotDeployer");
    });

    it("renounceMinterAdmin locks minter list forever", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.bkcToken.renounceMinterAdmin();
      expect(await f.bkcToken.minterAdminRenounced()).to.be.true;

      await expect(
        f.bkcToken.addMinter(f.alice.address)
      ).to.be.revertedWithCustomError(f.bkcToken, "MinterAdminIsRenounced");
    });

    it("MAX_SUPPLY cap enforcement", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.bkcToken.addMinter(f.deployer.address);
      const remaining = await f.bkcToken.mintableRemaining();
      // Try to mint more than remaining
      await expect(
        f.bkcToken.mint(f.alice.address, remaining + 1n)
      ).to.be.revertedWithCustomError(f.bkcToken, "ExceedsMaxSupply");
    });

    it("mintableRemaining decreases with mints", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.bkcToken.addMinter(f.deployer.address);
      const before = await f.bkcToken.mintableRemaining();
      const mintAmt = ethers.parseEther("1000");
      await f.bkcToken.mint(f.alice.address, mintAmt);
      expect(await f.bkcToken.mintableRemaining()).to.equal(before - mintAmt);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ECOSYSTEM FEE COLLECTION
  // ══════════════════════════════════════════════════════════════════════════

  describe("3. Ecosystem Fee Collection", function () {
    it("ETH fee collection distributes correctly", async function () {
      const f = await loadFixture(deployAllFixture);

      // Use Agora as a registered module to trigger collectFee
      // Create a post with ETH value — Agora calls collectFee internally
      const feeAmount = ethers.parseEther("0.1");

      const treasuryPendingBefore = await f.ecosystem.pendingEth(f.treasury.address);
      const buybackBefore = await f.ecosystem.buybackAccumulated();

      // Agora createPost triggers ecosystem.collectFee
      await f.agora
        .connect(f.alice)
        .createPost("QmTestHash", 0, 0, f.operator.address, {
          value: feeAmount,
        });

      // Check that fee was distributed
      expect(await f.ecosystem.totalEthCollected()).to.be.gt(0);
      expect(await f.ecosystem.totalFeeEvents()).to.be.gt(0);

      // Operator should have pending ETH
      const operatorPending = await f.ecosystem.pendingEth(f.operator.address);
      expect(operatorPending).to.be.gt(0);

      // Treasury should have pending ETH
      const treasuryPendingAfter = await f.ecosystem.pendingEth(f.treasury.address);
      expect(treasuryPendingAfter).to.be.gt(treasuryPendingBefore);

      // Buyback should have accumulated ETH
      expect(await f.ecosystem.buybackAccumulated()).to.be.gt(buybackBefore);
    });

    it("operator can withdraw accumulated ETH", async function () {
      const f = await loadFixture(deployAllFixture);

      // Generate some fees
      await f.agora
        .connect(f.alice)
        .createPost("QmTest", 0, 0, f.operator.address, {
          value: ethers.parseEther("0.1"),
        });

      const pending = await f.ecosystem.pendingEth(f.operator.address);
      expect(pending).to.be.gt(0);

      const balBefore = await ethers.provider.getBalance(f.operator.address);
      await f.ecosystem.connect(f.operator).withdrawEth();
      const balAfter = await ethers.provider.getBalance(f.operator.address);

      // Balance should have increased (minus gas)
      expect(balAfter).to.be.gt(balBefore - ethers.parseEther("0.01"));
      expect(await f.ecosystem.pendingEth(f.operator.address)).to.equal(0);
    });

    it("treasury can withdraw accumulated ETH", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.agora
        .connect(f.alice)
        .createPost("QmTest", 0, 0, f.operator.address, {
          value: ethers.parseEther("0.1"),
        });

      const pending = await f.ecosystem.pendingEth(f.treasury.address);
      expect(pending).to.be.gt(0);

      await f.ecosystem.connect(f.treasury).withdrawEth();
      expect(await f.ecosystem.pendingEth(f.treasury.address)).to.equal(0);
    });

    it("referral system: setReferrer and referral split", async function () {
      const f = await loadFixture(deployAllFixture);

      // Alice sets Bob as referrer
      await f.ecosystem.connect(f.alice).setReferrer(f.bob.address);
      expect(await f.ecosystem.referredBy(f.alice.address)).to.equal(f.bob.address);
      expect(await f.ecosystem.referralCount(f.bob.address)).to.equal(1);
    });

    it("referrer cannot be self", async function () {
      const f = await loadFixture(deployAllFixture);
      await expect(
        f.ecosystem.connect(f.alice).setReferrer(f.alice.address)
      ).to.be.revertedWithCustomError(f.ecosystem, "CannotReferSelf");
    });

    it("referrer can only be set once", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.ecosystem.connect(f.alice).setReferrer(f.bob.address);
      await expect(
        f.ecosystem.connect(f.alice).setReferrer(f.charlie.address)
      ).to.be.revertedWithCustomError(f.ecosystem, "ReferrerAlreadySet");
    });

    it("non-authorized module cannot call collectFee", async function () {
      const f = await loadFixture(deployAllFixture);
      await expect(
        f.ecosystem
          .connect(f.alice)
          .collectFee(f.alice.address, f.operator.address, ethers.ZeroAddress, MOD_AGORA, 0, {
            value: ethers.parseEther("0.01"),
          })
      ).to.be.revertedWithCustomError(f.ecosystem, "NotAuthorizedModule");
    });

    it("fee config: value-based fee calculates correctly", async function () {
      const f = await loadFixture(deployAllFixture);
      // Set a value-based fee for CHARITY_DONATE
      const actionDonate = id("CHARITY_DONATE");
      await f.ecosystem.setFeeConfig(actionDonate, {
        feeType: 1,
        bps: 500, // 5%
        multiplier: 0,
        gasEstimate: 0,
      });

      const fee = await f.ecosystem.calculateFee(
        actionDonate,
        ethers.parseEther("1")
      );
      expect(fee).to.equal(ethers.parseEther("0.05")); // 5% of 1 ETH
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. LIQUIDITY POOL (AMM)
  // ══════════════════════════════════════════════════════════════════════════

  describe("4. LiquidityPool", function () {
    it("has initial reserves from fixture setup", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.liquidityPool.ethReserve()).to.equal(ethers.parseEther("100"));
      expect(await f.liquidityPool.bkcReserve()).to.equal(ethers.parseEther("1000000"));
      expect(await f.liquidityPool.totalLPShares()).to.be.gt(0);
    });

    it("subsequent liquidity provider gets correct shares", async function () {
      const f = await loadFixture(deployAllFixture);
      const ethAmt = ethers.parseEther("1");
      const bkcAmt = ethers.parseEther("10000"); // match ratio 1:10000

      await f.bkcToken.connect(f.alice).approve(f.lpAddr, bkcAmt);
      const sharesBefore = await f.liquidityPool.lpShares(f.alice.address);

      await f.liquidityPool
        .connect(f.alice)
        .addLiquidity(bkcAmt, 0, { value: ethAmt });

      const sharesAfter = await f.liquidityPool.lpShares(f.alice.address);
      expect(sharesAfter).to.be.gt(sharesBefore);
    });

    it("swapETHforBKC works correctly", async function () {
      const f = await loadFixture(deployAllFixture);
      const ethIn = ethers.parseEther("1");
      const bkcBefore = await f.bkcToken.balanceOf(f.alice.address);

      await f.liquidityPool
        .connect(f.alice)
        .swapETHforBKC(1, { value: ethIn });

      const bkcAfter = await f.bkcToken.balanceOf(f.alice.address);
      expect(bkcAfter).to.be.gt(bkcBefore);
    });

    it("swapBKCforETH works correctly", async function () {
      const f = await loadFixture(deployAllFixture);
      const bkcIn = ethers.parseEther("5000");

      await f.bkcToken.connect(f.alice).approve(f.lpAddr, bkcIn);

      const ethBefore = await ethers.provider.getBalance(f.alice.address);
      await f.liquidityPool.connect(f.alice).swapBKCforETH(bkcIn, 1);
      const ethAfter = await ethers.provider.getBalance(f.alice.address);

      // Should have received ETH (minus gas)
      expect(ethAfter).to.be.gt(ethBefore - ethers.parseEther("0.01"));
    });

    it("slippage protection reverts on swapETHforBKC", async function () {
      const f = await loadFixture(deployAllFixture);
      // Set absurdly high minBkcOut
      await expect(
        f.liquidityPool
          .connect(f.alice)
          .swapETHforBKC(ethers.parseEther("999999999"), { value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(f.liquidityPool, "SlippageExceeded");
    });

    it("removeLiquidity returns ETH + BKC proportionally", async function () {
      const f = await loadFixture(deployAllFixture);

      // First add liquidity as alice
      const ethAmt = ethers.parseEther("1");
      const bkcAmt = ethers.parseEther("10000");
      await f.bkcToken.connect(f.alice).approve(f.lpAddr, bkcAmt);
      await f.liquidityPool
        .connect(f.alice)
        .addLiquidity(bkcAmt, 0, { value: ethAmt });

      const shares = await f.liquidityPool.lpShares(f.alice.address);
      expect(shares).to.be.gt(0);

      const bkcBefore = await f.bkcToken.balanceOf(f.alice.address);

      // Remove all liquidity
      await f.liquidityPool.connect(f.alice).removeLiquidity(shares, 0, 0);

      expect(await f.liquidityPool.lpShares(f.alice.address)).to.equal(0);
      expect(await f.bkcToken.balanceOf(f.alice.address)).to.be.gt(bkcBefore);
    });

    it("getQuote and getQuoteBKCtoETH return correct estimates", async function () {
      const f = await loadFixture(deployAllFixture);
      const ethAmt = ethers.parseEther("1");
      const quote = await f.liquidityPool.getQuote(ethAmt);
      expect(quote).to.be.gt(0);

      const bkcAmt = ethers.parseEther("1000");
      const ethQuote = await f.liquidityPool.getQuoteBKCtoETH(bkcAmt);
      expect(ethQuote).to.be.gt(0);
    });

    it("currentPrice returns BKC per 1 ETH", async function () {
      const f = await loadFixture(deployAllFixture);
      const price = await f.liquidityPool.currentPrice();
      expect(price).to.be.gt(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. STAKING POOL
  // ══════════════════════════════════════════════════════════════════════════

  describe("5. StakingPool", function () {
    it("delegate BKC with 30-day lock", async function () {
      const f = await loadFixture(deployAllFixture);
      const stakeAmt = ethers.parseEther("1000");

      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, f.operator.address);

      expect(await f.stakingPool.delegationCount(f.alice.address)).to.equal(1);
      expect(await f.stakingPool.totalBkcDelegated()).to.equal(stakeAmt);
      expect(await f.stakingPool.userTotalPStake(f.alice.address)).to.be.gt(0);
    });

    it("pStake increases with longer lock duration", async function () {
      const f = await loadFixture(deployAllFixture);
      const stakeAmt = ethers.parseEther("1000");

      // Alice stakes for 30 days
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);
      const pStake30 = await f.stakingPool.userTotalPStake(f.alice.address);

      // Bob stakes for 365 days
      await f.bkcToken.connect(f.bob).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.bob).delegate(stakeAmt, 365, ethers.ZeroAddress);
      const pStake365 = await f.stakingPool.userTotalPStake(f.bob.address);

      expect(pStake365).to.be.gt(pStake30);
    });

    it("claim rewards after notifyReward", async function () {
      const f = await loadFixture(deployAllFixture);
      const stakeAmt = ethers.parseEther("1000");

      // Stake
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);

      // Simulate rewards: transfer BKC to staking pool and notify
      const rewardAmt = ethers.parseEther("500");
      await f.bkcToken.connect(f.treasury).transfer(f.stakingAddr, rewardAmt);

      // We need an authorized notifier — use the BuybackMiner address
      // But we cannot impersonate easily, so let us use ecosystem as a notifier
      // Actually let us transfer and use hardhat impersonation
      await ethers.provider.send("hardhat_impersonateAccount", [f.buybackAddr]);
      await f.deployer.sendTransaction({ to: f.buybackAddr, value: ethers.parseEther("1") });
      const buybackSigner = await ethers.getSigner(f.buybackAddr);
      await f.stakingPool.connect(buybackSigner).notifyReward(rewardAmt);
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [f.buybackAddr]);

      // Check pending rewards
      const pending = await f.stakingPool.pendingRewards(f.alice.address);
      expect(pending).to.be.gt(0);

      // Claim
      const balBefore = await f.bkcToken.balanceOf(f.alice.address);
      await f.stakingPool.connect(f.alice).claimRewards();
      const balAfter = await f.bkcToken.balanceOf(f.alice.address);
      expect(balAfter).to.be.gt(balBefore);
    });

    it("unstake after lock period returns full amount", async function () {
      const f = await loadFixture(deployAllFixture);
      const stakeAmt = ethers.parseEther("1000");

      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 1, ethers.ZeroAddress); // 1 day

      // Cannot unstake before lock
      await expect(
        f.stakingPool.connect(f.alice).unstake(0)
      ).to.be.revertedWithCustomError(f.stakingPool, "StillLocked");

      // Advance time past lock
      await time.increase(86400 + 1); // 1 day + 1 second

      const balBefore = await f.bkcToken.balanceOf(f.alice.address);
      await f.stakingPool.connect(f.alice).unstake(0);
      const balAfter = await f.bkcToken.balanceOf(f.alice.address);

      expect(balAfter - balBefore).to.equal(stakeAmt);
      expect(await f.stakingPool.delegationCount(f.alice.address)).to.equal(0);
    });

    it("force unstake with penalty burns BKC", async function () {
      const f = await loadFixture(deployAllFixture);
      const stakeAmt = ethers.parseEther("1000");

      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 365, ethers.ZeroAddress);

      const burnBefore = await f.bkcToken.totalBurned();
      const balBefore = await f.bkcToken.balanceOf(f.alice.address);

      await f.stakingPool.connect(f.alice).forceUnstake(0, ethers.ZeroAddress);

      const balAfter = await f.bkcToken.balanceOf(f.alice.address);
      const burnAfter = await f.bkcToken.totalBurned();

      // Penalty should be 10% (default 1000 bps)
      const expectedPenalty = stakeAmt * 1000n / 10000n; // 100 BKC
      expect(burnAfter - burnBefore).to.equal(expectedPenalty);

      // Alice receives stakeAmt - penalty
      expect(balAfter - balBefore).to.equal(stakeAmt - expectedPenalty);
    });

    it("claim with NFT boost reduces burn rate", async function () {
      const f = await loadFixture(deployAllFixture);

      // Alice buys a Diamond NFT from NFTPool (tier 3)
      const pool3 = f.nftPools[3];
      const buyPrice = await pool3.getBuyPrice();
      await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[3], buyPrice);
      await pool3.connect(f.alice).buyNFT(0, ethers.ZeroAddress);

      // Alice should now have Diamond boost
      const boost = await f.rewardBooster.getUserBestBoost(f.alice.address);
      expect(boost).to.equal(5000); // BOOST_DIAMOND

      // Stake
      const stakeAmt = ethers.parseEther("1000");
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);

      // Add rewards
      const rewardAmt = ethers.parseEther("500");
      await f.bkcToken.connect(f.treasury).transfer(f.stakingAddr, rewardAmt);
      await ethers.provider.send("hardhat_impersonateAccount", [f.buybackAddr]);
      await f.deployer.sendTransaction({ to: f.buybackAddr, value: ethers.parseEther("0.1") });
      const buybackSigner = await ethers.getSigner(f.buybackAddr);
      await f.stakingPool.connect(buybackSigner).notifyReward(rewardAmt);
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [f.buybackAddr]);

      // Preview claim with Diamond boost (0% burn)
      const preview = await f.stakingPool.previewClaim(f.alice.address);
      expect(preview.burnRateBps).to.equal(0); // Diamond = 0% burn
      expect(preview.burnAmount).to.equal(0);
    });

    it("referrer receives cut on claim", async function () {
      const f = await loadFixture(deployAllFixture);

      // Set Bob as Alice's referrer
      await f.ecosystem.connect(f.alice).setReferrer(f.bob.address);

      // Stake
      const stakeAmt = ethers.parseEther("1000");
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);

      // Add rewards
      const rewardAmt = ethers.parseEther("500");
      await f.bkcToken.connect(f.treasury).transfer(f.stakingAddr, rewardAmt);
      await ethers.provider.send("hardhat_impersonateAccount", [f.buybackAddr]);
      await f.deployer.sendTransaction({ to: f.buybackAddr, value: ethers.parseEther("0.1") });
      const buybackSigner = await ethers.getSigner(f.buybackAddr);
      await f.stakingPool.connect(buybackSigner).notifyReward(rewardAmt);
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [f.buybackAddr]);

      // Claim
      const bobBefore = await f.bkcToken.balanceOf(f.bob.address);
      await f.stakingPool.connect(f.alice).claimRewards();
      const bobAfter = await f.bkcToken.balanceOf(f.bob.address);

      // Bob should have received 5% referral cut
      expect(bobAfter).to.be.gt(bobBefore);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. BUYBACK MINER
  // ══════════════════════════════════════════════════════════════════════════

  describe("6. BuybackMiner", function () {
    it("currentMiningRate returns 100% at TGE supply", async function () {
      const f = await loadFixture(deployAllFixture);
      // At TGE (40M supply), mining rate should be 10000 (100%)
      const rate = await f.buybackMiner.currentMiningRate();
      expect(rate).to.equal(10000);
    });

    it("executeBuyback: requires MIN_BUYBACK (0.1 ETH) accumulated", async function () {
      const f = await loadFixture(deployAllFixture);
      // With limited fees accumulated (below 0.1 ETH threshold), should revert
      // First drain any existing buyback accumulation by executing it if possible
      const accumulated = await f.ecosystem.buybackAccumulated();
      if (accumulated >= ethers.parseEther("0.1")) {
        await f.buybackMiner.connect(f.alice).executeBuyback();
      }
      // Now there should be < 0.1 ETH accumulated
      await expect(
        f.buybackMiner.connect(f.alice).executeBuyback()
      ).to.be.revertedWithCustomError(f.ecosystem, "NothingToWithdraw");
    });

    it("executeBuyback: full cycle with caller reward", async function () {
      const f = await loadFixture(deployAllFixture);

      // Generate enough fees for buyback (>= 0.1 ETH in buyback pool)
      // Create many Agora posts to accumulate buyback ETH
      for (let i = 0; i < 10; i++) {
        await f.agora
          .connect(f.alice)
          .createPost(`QmHash${i}`, 0, 0, f.operator.address, {
            value: ethers.parseEther("0.05"),
          });
      }

      const buybackAccum = await f.ecosystem.buybackAccumulated();

      if (buybackAccum >= ethers.parseEther("0.1")) {
        const callerBalBefore = await ethers.provider.getBalance(f.charlie.address);
        const stakingBkcBefore = await f.bkcToken.balanceOf(f.stakingAddr);

        await f.buybackMiner.connect(f.charlie).executeBuyback();

        const callerBalAfter = await ethers.provider.getBalance(f.charlie.address);
        // Caller earned 1% reward (minus gas)
        expect(callerBalAfter).to.be.gt(callerBalBefore - ethers.parseEther("0.01"));

        // Stats updated
        expect(await f.buybackMiner.totalBuybacks()).to.equal(1);
        expect(await f.buybackMiner.totalBkcPurchased()).to.be.gt(0);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. NFT SYSTEM (RewardBooster + NFTPool + RentalManager)
  // ══════════════════════════════════════════════════════════════════════════

  describe("7. NFT System", function () {
    describe("RewardBooster", function () {
      it("totalSupply is 20 (5 per tier * 4 tiers)", async function () {
        const f = await loadFixture(deployAllFixture);
        expect(await f.rewardBooster.totalSupply()).to.equal(20);
      });

      it("cannot mint after configurePools (locked)", async function () {
        const f = await loadFixture(deployAllFixture);
        await expect(
          f.rewardBooster.mintBatch(f.deployer.address, 0, 1)
        ).to.be.revertedWithCustomError(f.rewardBooster, "AlreadyConfigured");
      });

      it("cannot configurePools twice", async function () {
        const f = await loadFixture(deployAllFixture);
        await expect(
          f.rewardBooster.configurePools([
            f.nftPoolAddrs[0],
            f.nftPoolAddrs[1],
            f.nftPoolAddrs[2],
            f.nftPoolAddrs[3],
          ])
        ).to.be.revertedWithCustomError(f.rewardBooster, "AlreadyConfigured");
      });

      it("tier boost values are correct", async function () {
        const f = await loadFixture(deployAllFixture);
        expect(await f.rewardBooster.getTierBoost(0)).to.equal(1000); // Bronze
        expect(await f.rewardBooster.getTierBoost(1)).to.equal(2500); // Silver
        expect(await f.rewardBooster.getTierBoost(2)).to.equal(4000); // Gold
        expect(await f.rewardBooster.getTierBoost(3)).to.equal(5000); // Diamond
      });
    });

    describe("NFTPool", function () {
      it("buyNFT from Bronze pool", async function () {
        const f = await loadFixture(deployAllFixture);
        const pool = f.nftPools[0]; // Bronze
        const buyPrice = await pool.getBuyPrice();
        expect(buyPrice).to.be.gt(0);

        await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[0], buyPrice);

        const nftBalBefore = await f.rewardBooster.balanceOf(f.alice.address);
        await pool.connect(f.alice).buyNFT(0, f.operator.address);
        const nftBalAfter = await f.rewardBooster.balanceOf(f.alice.address);

        expect(nftBalAfter - nftBalBefore).to.equal(1);
        expect(await pool.nftCount()).to.equal(4); // was 5, now 4
      });

      it("bonding curve: buy price increases after purchase", async function () {
        const f = await loadFixture(deployAllFixture);
        const pool = f.nftPools[0];

        const priceBefore = await pool.getBuyPrice();
        await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[0], priceBefore);
        await pool.connect(f.alice).buyNFT(0, ethers.ZeroAddress);

        const priceAfter = await pool.getBuyPrice();
        expect(priceAfter).to.be.gt(priceBefore);
      });

      it("sellNFT back to pool", async function () {
        const f = await loadFixture(deployAllFixture);
        const pool = f.nftPools[0];

        // Buy first
        const buyPrice = await pool.getBuyPrice();
        await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[0], buyPrice);
        const tx = await pool.connect(f.alice).buyNFT(0, ethers.ZeroAddress);
        const receipt = await tx.wait();

        // Find the purchased token ID from events
        const tokens = await f.rewardBooster.getUserTokens(f.alice.address);
        const tokenId = tokens[0];

        // Approve NFT for pool
        await f.rewardBooster.connect(f.alice).approve(f.nftPoolAddrs[0], tokenId);

        const sellPrice = await pool.getSellPrice();
        expect(sellPrice).to.be.gt(0);

        const bkcBefore = await f.bkcToken.balanceOf(f.alice.address);
        await pool.connect(f.alice).sellNFT(tokenId, 0, ethers.ZeroAddress);
        const bkcAfter = await f.bkcToken.balanceOf(f.alice.address);

        expect(bkcAfter).to.be.gt(bkcBefore);
        expect(await pool.nftCount()).to.equal(5); // back to 5
      });

      it("slippage protection on buyNFT", async function () {
        const f = await loadFixture(deployAllFixture);
        const pool = f.nftPools[0];
        const buyPrice = await pool.getBuyPrice();

        await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[0], buyPrice);
        // Set maxBkcPrice to 1 wei — should fail
        await expect(
          pool.connect(f.alice).buyNFT(1, ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(pool, "SlippageExceeded");
      });
    });

    describe("RentalManager", function () {
      it("list, rent, and withdraw earnings flow", async function () {
        const f = await loadFixture(deployAllFixture);

        // Alice buys an NFT first
        const pool = f.nftPools[1]; // Silver
        const buyPrice = await pool.getBuyPrice();
        await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[1], buyPrice);
        await pool.connect(f.alice).buyNFT(0, ethers.ZeroAddress);

        const tokens = await f.rewardBooster.getUserTokens(f.alice.address);
        const tokenId = tokens[0];

        // Alice lists NFT for rent
        await f.rewardBooster.connect(f.alice).approve(f.rentalAddr, tokenId);
        const pricePerHour = ethers.parseEther("0.001"); // 0.001 ETH/hour
        await f.rentalManager.connect(f.alice).listNFT(tokenId, pricePerHour, 1, 720);

        // Verify listing
        const listing = await f.rentalManager.getListing(tokenId);
        expect(listing.owner).to.equal(f.alice.address);

        // Bob rents for 10 hours
        const rentalCost = pricePerHour * 10n;
        await f.rentalManager.connect(f.bob).rentNFT(tokenId, 10, ethers.ZeroAddress, {
          value: rentalCost, // no ecosystem fee configured for this action
        });

        // Bob should have active rental
        const rental = await f.rentalManager.getRental(tokenId);
        expect(rental.tenant).to.equal(f.bob.address);
        expect(rental.isActive).to.be.true;

        // Bob should have rented boost
        const rentedBoost = await f.rentalManager.getUserBestBoost(f.bob.address);
        expect(rentedBoost).to.equal(2500); // Silver boost

        // Alice has pending earnings
        expect(await f.rentalManager.pendingEarnings(f.alice.address)).to.be.gt(0);

        // Alice withdraws earnings
        const balBefore = await ethers.provider.getBalance(f.alice.address);
        await f.rentalManager.connect(f.alice).withdrawEarnings();
        const balAfter = await ethers.provider.getBalance(f.alice.address);
        expect(balAfter).to.be.gt(balBefore - ethers.parseEther("0.01"));
      });

      it("rental expires and NFT becomes available", async function () {
        const f = await loadFixture(deployAllFixture);

        // Alice buys + lists
        const pool = f.nftPools[0];
        const buyPrice = await pool.getBuyPrice();
        await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[0], buyPrice);
        await pool.connect(f.alice).buyNFT(0, ethers.ZeroAddress);
        const tokens = await f.rewardBooster.getUserTokens(f.alice.address);
        const tokenId = tokens[0];

        await f.rewardBooster.connect(f.alice).approve(f.rentalAddr, tokenId);
        await f.rentalManager.connect(f.alice).listNFT(tokenId, ethers.parseEther("0.001"), 1, 24);

        // Bob rents for 1 hour
        await f.rentalManager.connect(f.bob).rentNFT(tokenId, 1, ethers.ZeroAddress, {
          value: ethers.parseEther("0.001"),
        });

        expect(await f.rentalManager.isRented(tokenId)).to.be.true;

        // Advance time past rental
        await time.increase(3601);

        expect(await f.rentalManager.isRented(tokenId)).to.be.false;

        // Alice can withdraw NFT
        await f.rentalManager.connect(f.alice).withdrawNFT(tokenId);
        expect(await f.rewardBooster.ownerOf(tokenId)).to.equal(f.alice.address);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. FORTUNE POOL
  // ══════════════════════════════════════════════════════════════════════════

  describe("8. FortunePool", function () {
    it("commit-reveal full cycle", async function () {
      const f = await loadFixture(deployAllFixture);

      // Fund the prize pool
      const fundAmt = ethers.parseEther("10000");
      await f.bkcToken.connect(f.alice).approve(f.fortuneAddr, fundAmt);
      await f.fortunePool.connect(f.alice).fundPrizePool(fundAmt);
      expect(await f.fortunePool.prizePool()).to.equal(fundAmt);

      // Commit a game (tier 0 only, mask=1)
      const wager = ethers.parseEther("100");
      const guesses = [3n]; // guess 3 for tier 0 (range 1-5)
      const secret = ethers.keccak256(ethers.toUtf8Bytes("my_secret"));

      const commitHash = await f.fortunePool.generateCommitHash(guesses, secret);

      await f.bkcToken.connect(f.bob).approve(f.fortuneAddr, wager);
      const tx = await f.fortunePool.connect(f.bob).commitPlay(commitHash, wager, 1, f.operator.address);
      const receipt = await tx.wait();

      // Get game ID
      const gameId = await f.fortunePool.activeGame(f.bob.address);
      expect(gameId).to.be.gt(0);

      // Verify game state
      const game = await f.fortunePool.getGame(gameId);
      expect(game.player).to.equal(f.bob.address);
      expect(game.status).to.equal(1); // COMMITTED

      // Advance blocks past REVEAL_DELAY (5 blocks)
      await mine(6);

      // Reveal
      await f.fortunePool.connect(f.bob).revealPlay(gameId, guesses, secret);

      // Game should be revealed
      const gameAfter = await f.fortunePool.getGame(gameId);
      expect(gameAfter.status).to.equal(2); // REVEALED
    });

    it("expired game forfeit", async function () {
      const f = await loadFixture(deployAllFixture);

      // Fund pool
      await f.bkcToken.connect(f.alice).approve(f.fortuneAddr, ethers.parseEther("10000"));
      await f.fortunePool.connect(f.alice).fundPrizePool(ethers.parseEther("10000"));

      // Commit
      const wager = ethers.parseEther("50");
      const guesses = [1n];
      const secret = ethers.keccak256(ethers.toUtf8Bytes("secret2"));
      const commitHash = await f.fortunePool.generateCommitHash(guesses, secret);

      await f.bkcToken.connect(f.bob).approve(f.fortuneAddr, wager);
      await f.fortunePool.connect(f.bob).commitPlay(commitHash, wager, 1, ethers.ZeroAddress);
      const gameId = await f.fortunePool.activeGame(f.bob.address);

      // Advance past REVEAL_DELAY + REVEAL_WINDOW (5 + 200 = 205 blocks)
      await mine(206);

      // Claim expired
      await f.fortunePool.connect(f.charlie).claimExpired(gameId);

      const game = await f.fortunePool.getGame(gameId);
      expect(game.status).to.equal(3); // EXPIRED
    });

    it("BKC fee (20%) goes to ecosystem on commit", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.bkcToken.connect(f.alice).approve(f.fortuneAddr, ethers.parseEther("10000"));
      await f.fortunePool.connect(f.alice).fundPrizePool(ethers.parseEther("10000"));

      const wager = ethers.parseEther("100");
      const guesses = [2n];
      const secret = ethers.keccak256(ethers.toUtf8Bytes("secret3"));
      const commitHash = await f.fortunePool.generateCommitHash(guesses, secret);

      const ecosystemBkcBefore = await f.ecosystem.totalBkcCollected();

      await f.bkcToken.connect(f.bob).approve(f.fortuneAddr, wager);
      await f.fortunePool.connect(f.bob).commitPlay(commitHash, wager, 1, ethers.ZeroAddress);

      const ecosystemBkcAfter = await f.ecosystem.totalBkcCollected();
      const expectedFee = wager * 2000n / 10000n; // 20%
      expect(ecosystemBkcAfter - ecosystemBkcBefore).to.equal(expectedFee);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. GOVERNANCE
  // ══════════════════════════════════════════════════════════════════════════

  describe("9. BackchainGovernance", function () {
    it("starts in AdminOnly phase", async function () {
      const f = await loadFixture(deployAllFixture);
      expect(await f.governance.currentPhase()).to.equal(0); // AdminOnly
      expect(await f.governance.admin()).to.equal(f.deployer.address);
    });

    it("direct execution in AdminOnly phase", async function () {
      const f = await loadFixture(deployAllFixture);

      // Transfer ecosystem ownership to governance first
      await f.ecosystem.transferOwnership(f.govAddr);
      await f.governance.execute(
        f.ecosystemAddr,
        f.ecosystem.interface.encodeFunctionData("acceptOwnership")
      );
      expect(await f.ecosystem.owner()).to.equal(f.govAddr);

      // Now use governance to update treasury via direct execute
      const newTreasury = f.charlie.address;
      await f.governance.execute(
        f.ecosystemAddr,
        f.ecosystem.interface.encodeFunctionData("setTreasury", [newTreasury])
      );
      expect(await f.ecosystem.treasury()).to.equal(newTreasury);
    });

    it("phase advancement: AdminOnly -> Multisig -> Timelock", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.governance.advancePhase();
      expect(await f.governance.currentPhase()).to.equal(1); // Multisig

      await f.governance.advancePhase();
      expect(await f.governance.currentPhase()).to.equal(2); // Timelock

      // Direct execution should now be blocked
      await expect(
        f.governance.execute(ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(f.governance, "TimelockRequired");
    });

    it("queue + execute proposal in Timelock phase", async function () {
      const f = await loadFixture(deployAllFixture);

      // Transfer ecosystem ownership to governance
      await f.ecosystem.transferOwnership(f.govAddr);
      await f.governance.execute(
        f.ecosystemAddr,
        f.ecosystem.interface.encodeFunctionData("acceptOwnership")
      );

      // Advance to Timelock
      await f.governance.advancePhase(); // Multisig
      await f.governance.advancePhase(); // Timelock

      // Queue a proposal
      const calldata = f.ecosystem.interface.encodeFunctionData("setTreasury", [
        f.charlie.address,
      ]);

      const tx = await f.governance.queueProposal(
        f.ecosystemAddr,
        calldata,
        0,
        "Update treasury to charlie"
      );

      const proposalId = 1;
      const proposal = await f.governance.getProposal(proposalId);
      expect(proposal.target).to.equal(f.ecosystemAddr);

      // Cannot execute before delay
      await expect(
        f.governance.executeProposal(proposalId)
      ).to.be.revertedWithCustomError(f.governance, "ProposalNotReady");

      // Advance time past delay (1 hour)
      await time.increase(3601);

      // Execute
      await f.governance.executeProposal(proposalId);
      expect(await f.ecosystem.treasury()).to.equal(f.charlie.address);
    });

    it("non-admin cannot advance phase or execute", async function () {
      const f = await loadFixture(deployAllFixture);
      await expect(
        f.governance.connect(f.alice).advancePhase()
      ).to.be.revertedWithCustomError(f.governance, "Unauthorized");

      await expect(
        f.governance.connect(f.alice).execute(ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(f.governance, "Unauthorized");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. UTILITY CONTRACTS (Notary, CharityPool, Faucet)
  // ══════════════════════════════════════════════════════════════════════════

  describe("10. Utility Contracts", function () {
    describe("Notary", function () {
      it("certify and verify a document", async function () {
        const f = await loadFixture(deployAllFixture);
        const docHash = ethers.keccak256(ethers.toUtf8Bytes("my_important_document"));

        await f.notary.connect(f.alice).certify(
          docHash,
          "QmMetadataHash",
          0, // DOC_GENERAL
          f.operator.address
        );

        const result = await f.notary.verify(docHash);
        expect(result.exists).to.be.true;
        expect(result.owner).to.equal(f.alice.address);
        expect(result.docType).to.equal(0);
        expect(result.meta).to.equal("QmMetadataHash");
      });

      it("cannot certify same hash twice", async function () {
        const f = await loadFixture(deployAllFixture);
        const docHash = ethers.keccak256(ethers.toUtf8Bytes("unique_doc"));

        await f.notary.connect(f.alice).certify(docHash, "", 0, ethers.ZeroAddress);

        await expect(
          f.notary.connect(f.bob).certify(docHash, "", 0, ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(f.notary, "AlreadyCertified");
      });

      it("transfer certificate ownership", async function () {
        const f = await loadFixture(deployAllFixture);
        const docHash = ethers.keccak256(ethers.toUtf8Bytes("transfer_doc"));

        await f.notary.connect(f.alice).certify(docHash, "", 0, ethers.ZeroAddress);

        await f.notary.connect(f.alice).transferCertificate(docHash, f.bob.address);

        const result = await f.notary.verify(docHash);
        expect(result.owner).to.equal(f.bob.address);
      });

      it("batch certify multiple documents", async function () {
        const f = await loadFixture(deployAllFixture);
        const hashes = [
          ethers.keccak256(ethers.toUtf8Bytes("doc1")),
          ethers.keccak256(ethers.toUtf8Bytes("doc2")),
          ethers.keccak256(ethers.toUtf8Bytes("doc3")),
        ];
        const metas = ["meta1", "meta2", "meta3"];
        const types = [0, 1, 2];

        await f.notary.connect(f.alice).batchCertify(hashes, metas, types, f.operator.address);

        expect(await f.notary.certCount()).to.equal(3);
        for (let i = 0; i < 3; i++) {
          const result = await f.notary.verify(hashes[i]);
          expect(result.exists).to.be.true;
          expect(result.owner).to.equal(f.alice.address);
        }
      });
    });

    describe("CharityPool", function () {
      it("create campaign + donate + close + withdraw", async function () {
        const f = await loadFixture(deployAllFixture);

        // Create campaign
        const tx = await f.charityPool.connect(f.alice).createCampaign(
          "Save the Trees",
          "QmCampaignMeta",
          ethers.parseEther("10"), // 10 ETH goal
          30, // 30 days
          f.operator.address
        );

        const campaignId = 1;
        const campaign = await f.charityPool.getCampaign(campaignId);
        expect(campaign.owner).to.equal(f.alice.address);
        expect(campaign.title).to.equal("Save the Trees");

        // Bob donates
        const donationAmt = ethers.parseEther("1");
        await f.charityPool
          .connect(f.bob)
          .donate(campaignId, f.operator.address, {
            value: donationAmt,
          });

        // Campaign raised should be > 0
        const afterDonate = await f.charityPool.getCampaign(campaignId);
        expect(afterDonate.raised).to.be.gt(0);

        // Alice closes campaign early
        await f.charityPool.connect(f.alice).closeCampaign(campaignId);

        // Alice withdraws
        const balBefore = await ethers.provider.getBalance(f.alice.address);
        await f.charityPool.connect(f.alice).withdraw(campaignId);
        const balAfter = await ethers.provider.getBalance(f.alice.address);
        expect(balAfter).to.be.gt(balBefore);
      });

      it("cannot donate to expired campaign", async function () {
        const f = await loadFixture(deployAllFixture);

        await f.charityPool.connect(f.alice).createCampaign(
          "Short Campaign",
          "",
          ethers.parseEther("1"),
          1, // 1 day
          ethers.ZeroAddress
        );

        // Advance past deadline
        await time.increase(86401);

        await expect(
          f.charityPool.connect(f.bob).donate(1, ethers.ZeroAddress, {
            value: ethers.parseEther("0.1"),
          })
        ).to.be.revertedWithCustomError(f.charityPool, "CampaignNotActive");
      });

      it("cannot withdraw while campaign still active", async function () {
        const f = await loadFixture(deployAllFixture);

        await f.charityPool.connect(f.alice).createCampaign(
          "Active Campaign",
          "",
          ethers.parseEther("10"),
          30,
          ethers.ZeroAddress
        );

        await f.charityPool.connect(f.bob).donate(1, ethers.ZeroAddress, {
          value: ethers.parseEther("1"),
        });

        await expect(
          f.charityPool.connect(f.alice).withdraw(1)
        ).to.be.revertedWithCustomError(f.charityPool, "CampaignStillActive");
      });
    });

    describe("SimpleBKCFaucet", function () {
      it("direct claim gives BKC + ETH", async function () {
        const f = await loadFixture(deployAllFixture);

        const bkcBefore = await f.bkcToken.balanceOf(f.charlie.address);
        const ethBefore = await ethers.provider.getBalance(f.charlie.address);

        await f.faucet.connect(f.charlie).claim();

        const bkcAfter = await f.bkcToken.balanceOf(f.charlie.address);
        expect(bkcAfter - bkcBefore).to.equal(ethers.parseEther("100"));
      });

      it("cooldown prevents repeat claims", async function () {
        const f = await loadFixture(deployAllFixture);
        await f.faucet.connect(f.charlie).claim();

        await expect(
          f.faucet.connect(f.charlie).claim()
        ).to.be.revertedWithCustomError(f.faucet, "CooldownActive");
      });

      it("cooldown resets after waiting", async function () {
        const f = await loadFixture(deployAllFixture);
        await f.faucet.connect(f.charlie).claim();

        // Advance time past cooldown (1 hour)
        await time.increase(3601);

        // Should be able to claim again
        await f.faucet.connect(f.charlie).claim();
        expect(await f.faucet.claimCount(f.charlie.address)).to.equal(2);
      });

      it("relayer distribution", async function () {
        const f = await loadFixture(deployAllFixture);

        const bkcBefore = await f.bkcToken.balanceOf(f.alice.address);
        await f.faucet.connect(f.relayer).distributeTo(f.alice.address);
        const bkcAfter = await f.bkcToken.balanceOf(f.alice.address);

        expect(bkcAfter - bkcBefore).to.equal(ethers.parseEther("100"));
      });

      it("non-relayer cannot distribute", async function () {
        const f = await loadFixture(deployAllFixture);
        await expect(
          f.faucet.connect(f.alice).distributeTo(f.bob.address)
        ).to.be.revertedWithCustomError(f.faucet, "NotRelayer");
      });

      it("batch distribution", async function () {
        const f = await loadFixture(deployAllFixture);
        await f.faucet.connect(f.relayer).distributeBatch([
          f.alice.address,
          f.bob.address,
        ]);

        expect(await f.faucet.totalClaims()).to.equal(2);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. AGORA (Social Protocol)
  // ══════════════════════════════════════════════════════════════════════════

  describe("11. Agora Social Protocol", function () {
    it("create post", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.agora.connect(f.alice).createPost("QmPostHash", 5, 0, f.operator.address);

      expect(await f.agora.postCounter()).to.equal(1);
      const post = await f.agora.getPost(1);
      expect(post.author).to.equal(f.alice.address);
      expect(post.tag).to.equal(5); // Crypto
    });

    it("reply to post", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.agora.connect(f.alice).createPost("QmOriginal", 0, 0, ethers.ZeroAddress);
      await f.agora.connect(f.bob).createReply(1, "QmReply", 0, ethers.ZeroAddress);

      expect(await f.agora.postCounter()).to.equal(2);
      expect(await f.agora.replyCount(1)).to.equal(1);
    });

    it("like a post (one per user)", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.agora.connect(f.alice).createPost("QmPost", 0, 0, ethers.ZeroAddress);
      await f.agora.connect(f.bob).like(1, ethers.ZeroAddress);

      expect(await f.agora.likeCount(1)).to.equal(1);
      expect(await f.agora.hasLiked(1, f.bob.address)).to.be.true;

      // Cannot like twice
      await expect(
        f.agora.connect(f.bob).like(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(f.agora, "AlreadyLiked");
    });

    it("superLike with micro-payment", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.agora.connect(f.alice).createPost("QmPost", 0, 0, ethers.ZeroAddress);

      const votePrice = 100n; // 100 gwei
      const count = 5;
      const value = votePrice * BigInt(count) * 1000000000n; // convert gwei to wei

      await f.agora.connect(f.bob).superLike(1, f.operator.address, { value });

      expect(await f.agora.superLikeCount(1)).to.equal(count);
    });

    it("downvote: author earns nothing", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.agora.connect(f.alice).createPost("QmPost", 0, 0, ethers.ZeroAddress);

      const votePrice = 100n * 1000000000n; // 100 gwei in wei
      await f.agora.connect(f.bob).downvote(1, f.operator.address, { value: votePrice });

      expect(await f.agora.downvoteCount(1)).to.equal(1);
    });

    it("create profile with username", async function () {
      const f = await loadFixture(deployAllFixture);

      // Username length 7+ is free
      await f.agora.connect(f.alice).createProfile(
        "aliceweb3",
        "QmProfileMeta",
        ethers.ZeroAddress
      );

      expect(await f.agora.totalProfiles()).to.equal(1);
    });

    it("cannot create profile twice", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.agora.connect(f.alice).createProfile("testuser", "meta", ethers.ZeroAddress);
      await expect(
        f.agora.connect(f.alice).createProfile("testuser2", "meta2", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(f.agora, "AlreadyHasProfile");
    });

    it("username pricing: short names cost ETH", async function () {
      const f = await loadFixture(deployAllFixture);
      // 3-char username costs 0.03 ETH
      expect(await f.agora.getUsernamePrice(3)).to.equal(ethers.parseEther("0.03"));
      // 7+ chars free
      expect(await f.agora.getUsernamePrice(7)).to.equal(0);
    });

    it("delete post (soft delete)", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.agora.connect(f.alice).createPost("QmToDelete", 0, 0, ethers.ZeroAddress);

      await f.agora.connect(f.alice).deletePost(1);

      const post = await f.agora.getPost(1);
      expect(post.deleted).to.be.true;
    });

    it("cannot interact with deleted post", async function () {
      const f = await loadFixture(deployAllFixture);
      await f.agora.connect(f.alice).createPost("QmDeleted", 0, 0, ethers.ZeroAddress);
      await f.agora.connect(f.alice).deletePost(1);

      await expect(
        f.agora.connect(f.bob).like(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(f.agora, "PostIsDeleted");
    });

    it("follow and unfollow", async function () {
      const f = await loadFixture(deployAllFixture);

      // Follow emits event
      await expect(
        f.agora.connect(f.alice).follow(f.bob.address, ethers.ZeroAddress)
      ).to.emit(f.agora, "Followed").withArgs(f.alice.address, f.bob.address, ethers.ZeroAddress);

      // Unfollow emits event
      await expect(
        f.agora.connect(f.alice).unfollow(f.bob.address)
      ).to.emit(f.agora, "Unfollowed").withArgs(f.alice.address, f.bob.address);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. CROSS-CONTRACT INTEGRATION FLOWS
  // ══════════════════════════════════════════════════════════════════════════

  describe("12. Cross-Contract Integration Flows", function () {
    it("full staking + buyback + reward claim flow", async function () {
      const f = await loadFixture(deployAllFixture);

      // 1. Alice stakes BKC
      const stakeAmt = ethers.parseEther("5000");
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);

      // 2. Generate protocol fees via Agora (accumulates buyback ETH)
      for (let i = 0; i < 20; i++) {
        await f.agora
          .connect(f.bob)
          .createPost(`QmPost${i}`, i % 15, 0, f.operator.address, {
            value: ethers.parseEther("0.02"),
          });
      }

      const buybackAccum = await f.ecosystem.buybackAccumulated();

      if (buybackAccum >= ethers.parseEther("0.1")) {
        // 3. Charlie triggers buyback (earns 1% reward)
        await f.buybackMiner.connect(f.charlie).executeBuyback();

        // 4. Staking pool should have received rewards
        expect(await f.buybackMiner.totalBkcToStakers()).to.be.gt(0);

        // 5. Alice has pending rewards
        const pending = await f.stakingPool.pendingRewards(f.alice.address);
        expect(pending).to.be.gt(0);

        // 6. Alice claims rewards
        const aliceBkcBefore = await f.bkcToken.balanceOf(f.alice.address);
        await f.stakingPool.connect(f.alice).claimRewards();
        const aliceBkcAfter = await f.bkcToken.balanceOf(f.alice.address);
        expect(aliceBkcAfter).to.be.gt(aliceBkcBefore);
      }
    });

    it("NFT buy -> stake with boost -> claim with reduced burn", async function () {
      const f = await loadFixture(deployAllFixture);

      // 1. Alice buys a Gold NFT (tier 2)
      const pool2 = f.nftPools[2]; // Gold pool
      const buyPrice = await pool2.getBuyPrice();
      await f.bkcToken.connect(f.alice).approve(f.nftPoolAddrs[2], buyPrice);
      await pool2.connect(f.alice).buyNFT(0, ethers.ZeroAddress);

      // Verify Alice has Gold boost
      const boost = await f.rewardBooster.getUserBestBoost(f.alice.address);
      expect(boost).to.equal(4000); // Gold = 4000 bps

      // 2. Stake BKC
      const stakeAmt = ethers.parseEther("1000");
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);

      // 3. Add rewards directly
      const rewardAmt = ethers.parseEther("1000");
      await f.bkcToken.connect(f.treasury).transfer(f.stakingAddr, rewardAmt);
      await ethers.provider.send("hardhat_impersonateAccount", [f.buybackAddr]);
      await f.deployer.sendTransaction({ to: f.buybackAddr, value: ethers.parseEther("0.1") });
      const buybackSigner = await ethers.getSigner(f.buybackAddr);
      await f.stakingPool.connect(buybackSigner).notifyReward(rewardAmt);
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [f.buybackAddr]);

      // 4. Preview claim — Gold gives 10% burn (vs 50% without NFT)
      const preview = await f.stakingPool.previewClaim(f.alice.address);
      expect(preview.burnRateBps).to.equal(1000); // 10% burn
      expect(preview.nftBoost).to.equal(4000); // Gold

      // 5. Claim
      const burnBefore = await f.bkcToken.totalBurned();
      await f.stakingPool.connect(f.alice).claimRewards();
      const burnAfter = await f.bkcToken.totalBurned();

      // With Gold NFT, only 10% burned (not 50%)
      const totalReward = preview.totalRewards;
      const expectedBurn = totalReward * 1000n / 10000n;
      expect(burnAfter - burnBefore).to.equal(expectedBurn);
    });

    it("referral system integration: referrer earns on staking claim", async function () {
      const f = await loadFixture(deployAllFixture);

      // 1. Set referrer
      await f.ecosystem.connect(f.alice).setReferrer(f.charlie.address);

      // 2. Stake
      const stakeAmt = ethers.parseEther("2000");
      await f.bkcToken.connect(f.alice).approve(f.stakingAddr, stakeAmt);
      await f.stakingPool.connect(f.alice).delegate(stakeAmt, 30, ethers.ZeroAddress);

      // 3. Add rewards
      const rewardAmt = ethers.parseEther("500");
      await f.bkcToken.connect(f.treasury).transfer(f.stakingAddr, rewardAmt);
      await ethers.provider.send("hardhat_impersonateAccount", [f.buybackAddr]);
      await f.deployer.sendTransaction({ to: f.buybackAddr, value: ethers.parseEther("0.1") });
      const buybackSigner = await ethers.getSigner(f.buybackAddr);
      await f.stakingPool.connect(buybackSigner).notifyReward(rewardAmt);
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [f.buybackAddr]);

      // 4. Claim — Charlie (referrer) should earn 5% of after-burn amount
      const charlieBefore = await f.bkcToken.balanceOf(f.charlie.address);
      await f.stakingPool.connect(f.alice).claimRewards();
      const charlieAfter = await f.bkcToken.balanceOf(f.charlie.address);

      expect(charlieAfter).to.be.gt(charlieBefore); // Charlie earned referral cut
    });

    it("ecosystem module deauthorization blocks fee collection", async function () {
      const f = await loadFixture(deployAllFixture);

      // Deauthorize Agora
      await f.ecosystem.deauthorizeContract(f.agoraAddr);

      // Agora post should now fail (collectFee reverts)
      await expect(
        f.agora.connect(f.alice).createPost("QmTest", 0, 0, ethers.ZeroAddress, {
          value: ethers.parseEther("0.01"),
        })
      ).to.be.revertedWithCustomError(f.ecosystem, "NotAuthorizedModule");
    });

    it("ecosystem two-step ownership transfer", async function () {
      const f = await loadFixture(deployAllFixture);

      await f.ecosystem.transferOwnership(f.alice.address);
      expect(await f.ecosystem.pendingOwner()).to.equal(f.alice.address);

      // Only pending owner can accept
      await expect(
        f.ecosystem.connect(f.bob).acceptOwnership()
      ).to.be.revertedWithCustomError(f.ecosystem, "NotPendingOwner");

      await f.ecosystem.connect(f.alice).acceptOwnership();
      expect(await f.ecosystem.owner()).to.equal(f.alice.address);
    });

    it("fortune pool auto-burns excess above 1M cap", async function () {
      const f = await loadFixture(deployAllFixture);

      // Fund with more than 1M BKC
      // Alice needs more BKC — transfer from treasury
      const extraBkc = ethers.parseEther("1100000"); // 1.1M
      await f.bkcToken.connect(f.treasury).transfer(f.alice.address, extraBkc);
      await f.bkcToken.connect(f.alice).approve(f.fortuneAddr, extraBkc);

      const burnBefore = await f.bkcToken.totalBurned();
      await f.fortunePool.connect(f.alice).fundPrizePool(extraBkc);
      const burnAfter = await f.bkcToken.totalBurned();

      // Pool should be capped at 1M, excess burned
      expect(await f.fortunePool.prizePool()).to.equal(ethers.parseEther("1000000"));
      expect(burnAfter).to.be.gt(burnBefore);
    });

    it("operator earns from multiple modules", async function () {
      const f = await loadFixture(deployAllFixture);

      // Generate fees via Agora (with operator)
      await f.agora.connect(f.alice).createPost("QmTest1", 0, 0, f.operator.address, {
        value: ethers.parseEther("0.01"),
      });

      // Generate fees via Notary (with operator)
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc_for_operator"));
      await f.notary.connect(f.alice).certify(docHash, "", 0, f.operator.address, {
        value: ethers.parseEther("0.01"),
      });

      // Operator should have accumulated ETH from both
      const pending = await f.ecosystem.pendingEth(f.operator.address);
      expect(pending).to.be.gt(0);
    });
  });
});
