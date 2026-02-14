// =============================================================================
// NOTARY V3 — EXHAUSTIVE TESTS
// =============================================================================
// Covers: certify (10 doc types), batchCertify, boostCertificate,
//         transferCertificate, all views, all errors, events, stats, edge cases.
// =============================================================================

import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function id(str: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

function certifyActionId(docType: number): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NOTARY_CERTIFY_T", docType]));
}

function docHash(label: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(label));
}

const MOD_NOTARY = id("NOTARY");
const ACTION_BOOST = id("NOTARY_BOOST");
const ACTION_TRANSFER = id("NOTARY_TRANSFER");
const ZERO = ethers.ZeroAddress;
const DAY = 86400;

// Doc types
const DOC_GENERAL = 0;
const DOC_CONTRACT = 1;
const DOC_IDENTITY = 2;
const DOC_DIPLOMA = 3;
const DOC_PROPERTY = 4;
const DOC_FINANCIAL = 5;
const DOC_LEGAL = 6;
const DOC_MEDICAL = 7;
const DOC_IP = 8;
const DOC_OTHER = 9;

const DOC_TYPE_NAMES = [
  "GENERAL", "CONTRACT", "IDENTITY", "DIPLOMA", "PROPERTY",
  "FINANCIAL", "LEGAL", "MEDICAL", "IP", "OTHER"
];

// Multipliers matching deploy script
const DOC_MULTIPLIERS: Record<number, number> = {
  0: 200, 1: 2000, 2: 200, 3: 1000, 4: 2700,
  5: 2000, 6: 2700, 7: 2700, 8: 1000, 9: 200,
};

// ============================================================================
// FIXTURE
// ============================================================================

async function deployNotaryFixture() {
  const [deployer, treasury, operator, alice, bob, charlie] = await ethers.getSigners();

  // BKCToken (needed for ecosystem constructor)
  const BKCToken = await ethers.getContractFactory("contracts/BKCToken.sol:BKCToken");
  const bkcToken = await BKCToken.deploy(treasury.address);
  await bkcToken.waitForDeployment();
  const bkcAddr = await bkcToken.getAddress();

  // BackchainEcosystem
  const Ecosystem = await ethers.getContractFactory("contracts/BackchainEcosystem.sol:BackchainEcosystem");
  const ecosystem = await Ecosystem.deploy(bkcAddr, treasury.address);
  await ecosystem.waitForDeployment();
  const ecosystemAddr = await ecosystem.getAddress();

  // Notary V3
  const Notary = await ethers.getContractFactory("contracts/Notary.sol:Notary");
  const notary = await Notary.deploy(ecosystemAddr);
  await notary.waitForDeployment();
  const notaryAddr = await notary.getAddress();

  // Register module
  const moduleCfg = { active: true, customBps: 0, operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500 };
  await ecosystem.registerModule(notaryAddr, MOD_NOTARY, moduleCfg);

  // Set fee configs for all 10 doc types
  for (let t = 0; t <= 9; t++) {
    const actionId = certifyActionId(t);
    // gas-based: feeType=0, bps=100, multiplier, gasEstimate=200000
    await ecosystem.setFeeConfig(actionId, [0, 100, DOC_MULTIPLIERS[t], 200000]);
  }

  // Boost fee config
  await ecosystem.setFeeConfig(ACTION_BOOST, [0, 100, 2700, 300000]);

  // Transfer fee config
  await ecosystem.setFeeConfig(ACTION_TRANSFER, [0, 100, 200, 200000]);

  return {
    deployer, treasury, operator, alice, bob, charlie,
    bkcToken, ecosystem, notary,
    ecosystemAddr, notaryAddr,
  };
}

// BPS constant matching contract
const BPS = 10_000n;

// Fee config cache per action (avoids repeated reads)
const feeConfigCache = new Map<string, { bps: bigint; multiplier: bigint; gasEstimate: bigint }>();

/**
 * Compute gas-based fee client-side (matching contract formula):
 *   fee = gasEstimate × gasPrice × bps × multiplier / BPS
 *
 * In Hardhat, tx.gasprice is 0 in view calls (eth_call), so ecosystem.calculateFee()
 * always returns 0 for gas-based fees. We compute it in JS with a 20% safety buffer
 * to account for slight gasPrice differences between static call and actual tx.
 */
async function computeFee(ecosystem: any, actionId: string): Promise<bigint> {
  // Read fee config from ecosystem contract
  let cfg = feeConfigCache.get(actionId);
  if (!cfg) {
    const raw = await ecosystem.feeConfigs(actionId);
    cfg = {
      bps: BigInt(raw.bps || raw[1]),
      multiplier: BigInt(raw.multiplier || raw[2]),
      gasEstimate: BigInt(raw.gasEstimate || raw[3]),
    };
    feeConfigCache.set(actionId, cfg);
  }

  if (cfg.bps === 0n) return 0n;

  // Get gas price from provider (Hardhat default is ~1 gwei initially)
  const provider = ecosystem.runner?.provider ?? ethers.provider;
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 1000000000n; // fallback 1 gwei

  const baseFee = cfg.gasEstimate * gasPrice * cfg.bps * cfg.multiplier / BPS;
  // Add 20% buffer to handle EIP-1559 gas price fluctuations in Hardhat
  return baseFee * 120n / 100n;
}

/**
 * Compute the RAW fee (no buffer) for relative comparisons only.
 * Do NOT use this as msg.value — use computeFee() instead.
 */
async function computeFeeRaw(ecosystem: any, actionId: string): Promise<bigint> {
  let cfg = feeConfigCache.get(actionId);
  if (!cfg) {
    const raw = await ecosystem.feeConfigs(actionId);
    cfg = {
      bps: BigInt(raw.bps || raw[1]),
      multiplier: BigInt(raw.multiplier || raw[2]),
      gasEstimate: BigInt(raw.gasEstimate || raw[3]),
    };
    feeConfigCache.set(actionId, cfg);
  }

  if (cfg.bps === 0n) return 0n;

  const provider = ecosystem.runner?.provider ?? ethers.provider;
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 1000000000n;

  return cfg.gasEstimate * gasPrice * cfg.bps * cfg.multiplier / BPS;
}

/**
 * Generous fee: 1 ETH (always enough for any test action).
 */
const GENEROUS_FEE = ethers.parseEther("1");

// ============================================================================
// TESTS
// ============================================================================

describe("Notary V3 — Exhaustive Tests", function () {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. DEPLOYMENT & CONSTANTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("1. Deployment & Constants", function () {
    it("deploys with correct version", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.version()).to.equal("3.0.0");
    });

    it("ecosystem is set correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ecosystem()).to.equal(f.ecosystemAddr);
    });

    it("MODULE_ID matches keccak256('NOTARY')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MODULE_ID()).to.equal(id("NOTARY"));
    });

    it("ACTION_CERTIFY is backward-compat constant", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_CERTIFY()).to.equal(id("NOTARY_CERTIFY"));
    });

    it("ACTION_BOOST matches keccak256('NOTARY_BOOST')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_BOOST()).to.equal(ACTION_BOOST);
    });

    it("ACTION_TRANSFER matches keccak256('NOTARY_TRANSFER')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_TRANSFER()).to.equal(ACTION_TRANSFER);
    });

    it("MAX_BATCH_SIZE is 20", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MAX_BATCH_SIZE()).to.equal(20);
    });

    it("MAX_BOOST_DAYS is 30", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MAX_BOOST_DAYS()).to.equal(30);
    });

    it("all DOC_TYPE constants are correct (0-9)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.DOC_GENERAL()).to.equal(0);
      expect(await f.notary.DOC_CONTRACT()).to.equal(1);
      expect(await f.notary.DOC_IDENTITY()).to.equal(2);
      expect(await f.notary.DOC_DIPLOMA()).to.equal(3);
      expect(await f.notary.DOC_PROPERTY()).to.equal(4);
      expect(await f.notary.DOC_FINANCIAL()).to.equal(5);
      expect(await f.notary.DOC_LEGAL()).to.equal(6);
      expect(await f.notary.DOC_MEDICAL()).to.equal(7);
      expect(await f.notary.DOC_IP()).to.equal(8);
      expect(await f.notary.DOC_OTHER()).to.equal(9);
    });

    it("initial state: certCount=0, totalEthCollected=0, totalBoostRevenue=0, totalTransfers=0", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.certCount()).to.equal(0);
      expect(await f.notary.totalEthCollected()).to.equal(0);
      expect(await f.notary.totalBoostRevenue()).to.equal(0);
      expect(await f.notary.totalTransfers()).to.equal(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. CERTIFY — Single Document
  // ══════════════════════════════════════════════════════════════════════════

  describe("2. Certify — Single Document", function () {
    it("certifies a DOC_GENERAL document with metadata", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("general_doc");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));

      const tx = await f.notary.connect(f.alice).certify(hash, "QmMeta123", DOC_GENERAL, f.operator.address, { value: fee });
      await expect(tx).to.emit(f.notary, "Certified").withArgs(1, f.alice.address, hash, DOC_GENERAL, f.operator.address);

      const result = await f.notary.verify(hash);
      expect(result.exists).to.be.true;
      expect(result.owner).to.equal(f.alice.address);
      expect(result.docType).to.equal(DOC_GENERAL);
      expect(result.meta).to.equal("QmMeta123");
      expect(result.boosted).to.be.false;
      expect(result.boostExpiry).to.equal(0);
    });

    it("certifies without metadata (empty string saves gas)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("no_meta_doc");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));

      await f.notary.connect(f.alice).certify(hash, "", DOC_GENERAL, ZERO, { value: fee });

      const result = await f.notary.verify(hash);
      expect(result.exists).to.be.true;
      expect(result.meta).to.equal("");
    });

    it("certifies all 10 document types successfully", async function () {
      const f = await loadFixture(deployNotaryFixture);

      for (let t = 0; t <= 9; t++) {
        const hash = docHash(`doc_type_${t}`);
        const fee = await computeFee(f.ecosystem, certifyActionId(t));
        await f.notary.connect(f.alice).certify(hash, `meta_${t}`, t, ZERO, { value: fee });

        const result = await f.notary.verify(hash);
        expect(result.exists).to.be.true;
        expect(result.docType).to.equal(t);
      }
      expect(await f.notary.certCount()).to.equal(10);
    });

    it("certId increments sequentially (1, 2, 3...)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      for (let i = 1; i <= 5; i++) {
        const hash = docHash(`seq_${i}`);
        const tx = await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: fee });
        await expect(tx).to.emit(f.notary, "Certified").withArgs(i, f.alice.address, hash, 0, ZERO);
      }
      expect(await f.notary.certCount()).to.equal(5);
    });

    it("certById maps ID to hash correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("certById_test");
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: fee });

      expect(await f.notary.certById(1)).to.equal(hash);
    });

    it("totalEthCollected tracks fees correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));

      await f.notary.connect(f.alice).certify(docHash("eth_track_1"), "", 0, ZERO, { value: fee });
      expect(await f.notary.totalEthCollected()).to.equal(fee);

      await f.notary.connect(f.alice).certify(docHash("eth_track_2"), "", 0, ZERO, { value: fee });
      expect(await f.notary.totalEthCollected()).to.equal(fee * 2n);
    });

    it("overpaying is accepted (excess goes to ecosystem)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));
      const overpay = fee + ethers.parseEther("0.01");

      await f.notary.connect(f.alice).certify(docHash("overpay_doc"), "", 0, ZERO, { value: overpay });
      expect(await f.notary.totalEthCollected()).to.equal(overpay);
    });

    it("premium doc types (Legal/Property/Medical) cost more than General", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const feeGeneral = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));
      const feeLegal = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));
      const feeProperty = await computeFee(f.ecosystem, certifyActionId(DOC_PROPERTY));
      const feeMedical = await computeFee(f.ecosystem, certifyActionId(DOC_MEDICAL));

      // Multipliers: General=200, Legal/Property/Medical=2700
      expect(feeLegal).to.be.gt(feeGeneral);
      expect(feeProperty).to.be.gt(feeGeneral);
      expect(feeMedical).to.be.gt(feeGeneral);
      // All premium should be same price
      expect(feeLegal).to.equal(feeProperty);
      expect(feeLegal).to.equal(feeMedical);
    });

    // ERROR CASES

    it("reverts on empty hash (bytes32(0))", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).certify(ethers.ZeroHash, "", 0, ZERO)
      ).to.be.revertedWithCustomError(f.notary, "EmptyHash");
    });

    it("reverts on already certified hash", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("dupe_doc");
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: fee });
      await expect(
        f.notary.connect(f.bob).certify(hash, "", 0, ZERO, { value: fee })
      ).to.be.revertedWithCustomError(f.notary, "AlreadyCertified");
    });

    it("reverts on invalid doc type (> 9)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).certify(docHash("invalid_type"), "", 10, ZERO)
      ).to.be.revertedWithCustomError(f.notary, "InvalidDocType");
    });

    it("reverts on invalid doc type (255)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).certify(docHash("type_255"), "", 255, ZERO)
      ).to.be.revertedWithCustomError(f.notary, "InvalidDocType");
    });

    it("reverts on insufficient fee (0 ETH when fee required)", async function () {
      const f = await loadFixture(deployNotaryFixture);

      // Fee configs are set, so fee > 0 in tx context. Sending 0 should revert.
      await expect(
        f.notary.connect(f.alice).certify(docHash("low_fee"), "", DOC_LEGAL, ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });

    it("different users can certify different documents", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      const hash1 = docHash("alice_doc");
      const hash2 = docHash("bob_doc");
      await f.notary.connect(f.alice).certify(hash1, "", 0, ZERO, { value: fee });
      await f.notary.connect(f.bob).certify(hash2, "", 0, ZERO, { value: fee });

      expect((await f.notary.verify(hash1)).owner).to.equal(f.alice.address);
      expect((await f.notary.verify(hash2)).owner).to.equal(f.bob.address);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. BATCH CERTIFY
  // ══════════════════════════════════════════════════════════════════════════

  describe("3. Batch Certify", function () {
    it("batch certifies 3 documents with mixed types", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hashes = [docHash("batch1"), docHash("batch2"), docHash("batch3")];
      const metas = ["meta1", "", "meta3"];
      const types = [DOC_GENERAL, DOC_LEGAL, DOC_PROPERTY];

      // Calculate total fee
      let totalFee = 0n;
      for (const t of types) {
        totalFee += await computeFee(f.ecosystem, certifyActionId(t));
      }

      const tx = await f.notary.connect(f.alice).batchCertify(hashes, metas, types, f.operator.address, { value: totalFee });
      await expect(tx).to.emit(f.notary, "BatchCertified").withArgs(f.alice.address, 1, 3, f.operator.address);
      await expect(tx).to.emit(f.notary, "Certified").withArgs(1, f.alice.address, hashes[0], DOC_GENERAL, f.operator.address);
      await expect(tx).to.emit(f.notary, "Certified").withArgs(2, f.alice.address, hashes[1], DOC_LEGAL, f.operator.address);
      await expect(tx).to.emit(f.notary, "Certified").withArgs(3, f.alice.address, hashes[2], DOC_PROPERTY, f.operator.address);

      expect(await f.notary.certCount()).to.equal(3);

      // Verify each
      for (let i = 0; i < 3; i++) {
        const r = await f.notary.verify(hashes[i]);
        expect(r.exists).to.be.true;
        expect(r.owner).to.equal(f.alice.address);
        expect(r.docType).to.equal(types[i]);
      }

      // Metadata stored only where provided
      expect((await f.notary.verify(hashes[0])).meta).to.equal("meta1");
      expect((await f.notary.verify(hashes[1])).meta).to.equal("");
      expect((await f.notary.verify(hashes[2])).meta).to.equal("meta3");
    });

    it("batch certify with MAX_BATCH_SIZE=20 documents", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hashes: string[] = [];
      const metas: string[] = [];
      const types: number[] = [];
      let totalFee = 0n;

      for (let i = 0; i < 20; i++) {
        hashes.push(docHash(`max_batch_${i}`));
        metas.push("");
        types.push(i % 10);
        totalFee += await computeFee(f.ecosystem, certifyActionId(i % 10));
      }

      await f.notary.connect(f.alice).batchCertify(hashes, metas, types, ZERO, { value: totalFee });
      expect(await f.notary.certCount()).to.equal(20);
    });

    it("batch certify startId is correct after prior single certify", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      // Certify 2 singles first → certCount=2
      await f.notary.connect(f.alice).certify(docHash("pre1"), "", 0, ZERO, { value: fee });
      await f.notary.connect(f.alice).certify(docHash("pre2"), "", 0, ZERO, { value: fee });

      // Batch of 3 → startId should be 3
      const hashes = [docHash("b1"), docHash("b2"), docHash("b3")];
      const tx = await f.notary.connect(f.alice).batchCertify(hashes, ["", "", ""], [0, 0, 0], ZERO, { value: fee * 3n });
      await expect(tx).to.emit(f.notary, "BatchCertified").withArgs(f.alice.address, 3, 3, ZERO);

      expect(await f.notary.certCount()).to.equal(5);
    });

    it("batch totalFee is sum of per-docType fees", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hashes = [docHash("sum1"), docHash("sum2")];
      const types = [DOC_GENERAL, DOC_LEGAL]; // cheap + premium

      const feeGeneral = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));
      const feeLegal = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));
      const totalFee = feeGeneral + feeLegal;

      // Exact fee works
      await f.notary.connect(f.alice).batchCertify(hashes, ["", ""], types, ZERO, { value: totalFee });

      // Zero value fails when fees are configured
      const hashes2 = [docHash("sum3"), docHash("sum4")];
      await expect(
        f.notary.connect(f.alice).batchCertify(hashes2, ["", ""], types, ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });

    // ERROR CASES

    it("reverts on empty batch (0 documents)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).batchCertify([], [], [], ZERO)
      ).to.be.revertedWithCustomError(f.notary, "EmptyBatch");
    });

    it("reverts on batch > MAX_BATCH_SIZE (21)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hashes = Array.from({ length: 21 }, (_, i) => docHash(`too_many_${i}`));
      const metas = Array(21).fill("");
      const types = Array(21).fill(0);

      await expect(
        f.notary.connect(f.alice).batchCertify(hashes, metas, types, ZERO)
      ).to.be.revertedWithCustomError(f.notary, "BatchTooLarge");
    });

    it("reverts on array length mismatch (metas shorter)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).batchCertify(
          [docHash("mm1"), docHash("mm2")], ["meta1"], [0, 0], ZERO
        )
      ).to.be.revertedWithCustomError(f.notary, "EmptyBatch");
    });

    it("reverts on array length mismatch (docTypes shorter)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).batchCertify(
          [docHash("mt1"), docHash("mt2")], ["", ""], [0], ZERO
        )
      ).to.be.revertedWithCustomError(f.notary, "EmptyBatch");
    });

    it("reverts if any hash in batch is empty", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).batchCertify(
          [docHash("ok"), ethers.ZeroHash], ["", ""], [0, 0], ZERO, { value: GENEROUS_FEE }
        )
      ).to.be.revertedWithCustomError(f.notary, "EmptyHash");
    });

    it("reverts if any hash in batch is already certified", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const existing = docHash("existing");

      await f.notary.connect(f.alice).certify(existing, "", 0, ZERO, { value: GENEROUS_FEE });

      await expect(
        f.notary.connect(f.alice).batchCertify(
          [docHash("new_one"), existing], ["", ""], [0, 0], ZERO, { value: GENEROUS_FEE }
        )
      ).to.be.revertedWithCustomError(f.notary, "AlreadyCertified");
    });

    it("reverts if any docType in batch is invalid", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).batchCertify(
          [docHash("valid_t"), docHash("invalid_t")], ["", ""], [0, 10], ZERO, { value: GENEROUS_FEE }
        )
      ).to.be.revertedWithCustomError(f.notary, "InvalidDocType");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. BOOST CERTIFICATE
  // ══════════════════════════════════════════════════════════════════════════

  describe("4. Boost Certificate", function () {
    it("boosts a certificate for 1 day", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("boost_1day");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFeePerDay = await computeFee(f.ecosystem, ACTION_BOOST);
      const tx = await f.notary.connect(f.bob).boostCertificate(hash, 1, f.operator.address, { value: boostFeePerDay });

      await expect(tx).to.emit(f.notary, "CertificateBoosted");

      const result = await f.notary.verify(hash);
      expect(result.boosted).to.be.true;
      expect(result.boostExpiry).to.be.gt(0);
    });

    it("anyone can boost any certificate (not just owner)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("bob_boosts_alice");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      // Bob (not the owner) boosts Alice's cert
      await f.notary.connect(f.bob).boostCertificate(hash, 5, ZERO, { value: boostFee * 5n });

      expect((await f.notary.verify(hash)).boosted).to.be.true;
    });

    it("boost is additive: stacking extends expiry", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("stack_boost");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);

      // First boost: 5 days
      await f.notary.connect(f.alice).boostCertificate(hash, 5, ZERO, { value: boostFee * 5n });
      const expiry1 = (await f.notary.verify(hash)).boostExpiry;

      // Second boost: 10 more days (adds to existing expiry)
      await f.notary.connect(f.alice).boostCertificate(hash, 10, ZERO, { value: boostFee * 10n });
      const expiry2 = (await f.notary.verify(hash)).boostExpiry;

      // expiry2 should be ~10 days after expiry1
      expect(Number(expiry2) - Number(expiry1)).to.be.closeTo(10 * DAY, 5);
    });

    it("boost after expiry starts from current block.timestamp", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("expired_reboost");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);

      // Boost 1 day
      await f.notary.connect(f.alice).boostCertificate(hash, 1, ZERO, { value: boostFee });

      // Advance 2 days → boost expired
      await time.increase(2 * DAY);
      expect((await f.notary.verify(hash)).boosted).to.be.false;

      // Re-boost 3 days — should start from now, not from old expiry
      const nowBefore = await time.latest();
      await f.notary.connect(f.alice).boostCertificate(hash, 3, ZERO, { value: boostFee * 3n });
      const expiry = Number((await f.notary.verify(hash)).boostExpiry);

      // Should be ~3 days from now
      expect(expiry).to.be.closeTo(nowBefore + 3 * DAY, 5);
    });

    it("MAX_BOOST_DAYS (30) is accepted", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("max_boost");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      await f.notary.connect(f.alice).boostCertificate(hash, 30, ZERO, { value: boostFee * 30n });

      expect((await f.notary.verify(hash)).boosted).to.be.true;
    });

    it("isBoosted() view returns correct status", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("is_boosted_check");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      // Not boosted initially
      expect(await f.notary.isBoosted(hash)).to.be.false;

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      await f.notary.connect(f.alice).boostCertificate(hash, 1, ZERO, { value: boostFee });

      expect(await f.notary.isBoosted(hash)).to.be.true;

      // Advance past expiry
      await time.increase(2 * DAY);
      expect(await f.notary.isBoosted(hash)).to.be.false;
    });

    it("totalBoostRevenue tracks correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("boost_rev");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      const payment1 = boostFee * 3n;
      await f.notary.connect(f.alice).boostCertificate(hash, 3, ZERO, { value: payment1 });
      expect(await f.notary.totalBoostRevenue()).to.equal(payment1);

      const payment2 = boostFee * 7n;
      await f.notary.connect(f.bob).boostCertificate(hash, 7, ZERO, { value: payment2 });
      expect(await f.notary.totalBoostRevenue()).to.equal(payment1 + payment2);
    });

    // ERROR CASES

    it("reverts on boost for non-existing certificate", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).boostCertificate(docHash("nonexistent"), 1, ZERO, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(f.notary, "NotCertified");
    });

    it("reverts on 0 days", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("zero_days");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      await expect(
        f.notary.connect(f.alice).boostCertificate(hash, 0, ZERO)
      ).to.be.revertedWithCustomError(f.notary, "ZeroDays");
    });

    it("reverts on > MAX_BOOST_DAYS (31)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("too_many_days");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      await expect(
        f.notary.connect(f.alice).boostCertificate(hash, 31, ZERO, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(f.notary, "TooManyDays");
    });

    it("reverts on insufficient boost fee", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("low_boost_fee");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      // Sending 0 should always fail when fee is configured
      await expect(
        f.notary.connect(f.alice).boostCertificate(hash, 5, ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. TRANSFER CERTIFICATE
  // ══════════════════════════════════════════════════════════════════════════

  describe("5. Transfer Certificate", function () {
    it("owner transfers certificate to another address", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("transfer_basic");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);
      const tx = await f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, f.operator.address, { value: transferFee });

      await expect(tx).to.emit(f.notary, "CertificateTransferred").withArgs(hash, f.alice.address, f.bob.address);

      const result = await f.notary.verify(hash);
      expect(result.owner).to.equal(f.bob.address);
    });

    it("totalTransfers increments on each transfer", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      const hash1 = docHash("xfer_count_1");
      const hash2 = docHash("xfer_count_2");
      await f.notary.connect(f.alice).certify(hash1, "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).certify(hash2, "", 0, ZERO, { value: certFee });

      await f.notary.connect(f.alice).transferCertificate(hash1, f.bob.address, ZERO, { value: transferFee });
      expect(await f.notary.totalTransfers()).to.equal(1);

      await f.notary.connect(f.alice).transferCertificate(hash2, f.bob.address, ZERO, { value: transferFee });
      expect(await f.notary.totalTransfers()).to.equal(2);
    });

    it("new owner can transfer again (chain of custody)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("chain_custody");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      // Alice certifies
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      // Alice → Bob
      await f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: transferFee });
      expect((await f.notary.verify(hash)).owner).to.equal(f.bob.address);

      // Bob → Charlie
      await f.notary.connect(f.bob).transferCertificate(hash, f.charlie.address, ZERO, { value: transferFee });
      expect((await f.notary.verify(hash)).owner).to.equal(f.charlie.address);
    });

    it("transfer fee is tracked in totalEthCollected", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("xfer_eth_track");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });
      const ethAfterCertify = await f.notary.totalEthCollected();

      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);
      await f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: transferFee });
      expect(await f.notary.totalEthCollected()).to.equal(ethAfterCertify + transferFee);
    });

    it("boost persists after transfer", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("boost_persists");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      await f.notary.connect(f.alice).boostCertificate(hash, 10, ZERO, { value: boostFee * 10n });
      expect((await f.notary.verify(hash)).boosted).to.be.true;

      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);
      await f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: transferFee });

      // Boost still active after ownership change
      const result = await f.notary.verify(hash);
      expect(result.owner).to.equal(f.bob.address);
      expect(result.boosted).to.be.true;
    });

    // ERROR CASES

    it("reverts if caller is not certificate owner", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("not_owner_xfer");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      await expect(
        f.notary.connect(f.bob).transferCertificate(hash, f.charlie.address, ZERO, { value: transferFee })
      ).to.be.revertedWithCustomError(f.notary, "NotCertOwner");
    });

    it("reverts on transfer to zero address", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("zero_addr_xfer");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      await expect(
        f.notary.connect(f.alice).transferCertificate(hash, ZERO, ZERO, { value: transferFee })
      ).to.be.revertedWithCustomError(f.notary, "ZeroAddress");
    });

    it("reverts on insufficient transfer fee", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("low_xfer_fee");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      // Sending 0 should always fail when fee is configured
      await expect(
        f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });

    it("reverts when transferring non-existent certificate (NotCertOwner since owner=0x0)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).transferCertificate(docHash("ghost"), f.bob.address, ZERO, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(f.notary, "NotCertOwner");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. VIEW FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("6. View Functions", function () {
    it("verify returns (false, ...) for non-existent hash", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.verify(docHash("nonexistent"));
      expect(result.exists).to.be.false;
      expect(result.owner).to.equal(ZERO);
      expect(result.timestamp).to.equal(0);
      expect(result.docType).to.equal(0);
      expect(result.meta).to.equal("");
      expect(result.boosted).to.be.false;
      expect(result.boostExpiry).to.equal(0);
    });

    it("verify returns all 7 fields correctly for existing cert", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("verify_full");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_DIPLOMA));

      await f.notary.connect(f.alice).certify(hash, "QmDiploma", DOC_DIPLOMA, f.operator.address, { value: fee });
      const ts = await time.latest();

      const result = await f.notary.verify(hash);
      expect(result.exists).to.be.true;
      expect(result.owner).to.equal(f.alice.address);
      expect(Number(result.timestamp)).to.be.closeTo(ts, 2);
      expect(result.docType).to.equal(DOC_DIPLOMA);
      expect(result.meta).to.equal("QmDiploma");
      expect(result.boosted).to.be.false;
      expect(result.boostExpiry).to.equal(0);
    });

    it("getCertificate by ID returns correct data", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("get_by_id");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_IP));

      await f.notary.connect(f.bob).certify(hash, "QmIP", DOC_IP, ZERO, { value: fee });

      const result = await f.notary.getCertificate(1);
      expect(result.documentHash).to.equal(hash);
      expect(result.owner).to.equal(f.bob.address);
      expect(result.docType).to.equal(DOC_IP);
      expect(result.meta).to.equal("QmIP");
      expect(result.boosted).to.be.false;
    });

    it("getCertificate returns empty for non-existent ID", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.getCertificate(999);
      expect(result.documentHash).to.equal(ethers.ZeroHash);
      expect(result.owner).to.equal(ZERO);
    });

    it("getCertificatesBatch returns correct data for range", async function () {
      const f = await loadFixture(deployNotaryFixture);

      // Certify 5 documents with different types (use GENEROUS_FEE to cover any type)
      const hashes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const h = docHash(`batch_read_${i}`);
        hashes.push(h);
        await f.notary.connect(f.alice).certify(h, "", i % 10, ZERO, { value: GENEROUS_FEE });
      }

      // Read batch [1..5]
      const result = await f.notary.getCertificatesBatch(1, 5);
      expect(result.hashes.length).to.equal(5);
      for (let i = 0; i < 5; i++) {
        expect(result.hashes[i]).to.equal(hashes[i]);
        expect(result.owners[i]).to.equal(f.alice.address);
        expect(result.docTypes[i]).to.equal(i);
      }
    });

    it("getCertificatesBatch handles partial range (start + count > certCount)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      // Only 3 certs
      for (let i = 0; i < 3; i++) {
        await f.notary.connect(f.alice).certify(docHash(`partial_${i}`), "", 0, ZERO, { value: fee });
      }

      // Request 10, but only 3 exist → should clamp
      const result = await f.notary.getCertificatesBatch(1, 10);
      expect(result.hashes.length).to.equal(3);
    });

    it("getCertificatesBatch returns empty for start > certCount", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.getCertificatesBatch(100, 10);
      expect(result.hashes.length).to.equal(0);
    });

    it("getCertificatesBatch includes boost data", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));
      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);

      const h1 = docHash("batch_boost_1");
      const h2 = docHash("batch_boost_2");
      await f.notary.connect(f.alice).certify(h1, "", 0, ZERO, { value: fee });
      await f.notary.connect(f.alice).certify(h2, "", 0, ZERO, { value: fee });

      // Boost only cert #1
      await f.notary.connect(f.alice).boostCertificate(h1, 5, ZERO, { value: boostFee * 5n });

      const result = await f.notary.getCertificatesBatch(1, 2);
      expect(result.boostedFlags[0]).to.be.true;
      expect(result.boostedFlags[1]).to.be.false;
      expect(result.boostExpiries[0]).to.be.gt(0);
      expect(result.boostExpiries[1]).to.equal(0);
    });

    it("getFee calls ecosystem.calculateFee for type 0 (returns 0 in view due to gasPrice=0)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      // In view calls tx.gasprice=0, so gas-based fee returns 0
      // This is expected — frontend uses client-side fee computation
      expect(await f.notary.getFee()).to.equal(0);
    });

    it("getStats returns correct 4-tuple", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      // Certify
      const h1 = docHash("stats_1");
      const h2 = docHash("stats_2");
      await f.notary.connect(f.alice).certify(h1, "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).certify(h2, "", 0, ZERO, { value: certFee });

      // Boost
      const boostPayment = boostFee * 3n;
      await f.notary.connect(f.alice).boostCertificate(h1, 3, ZERO, { value: boostPayment });

      // Transfer
      await f.notary.connect(f.alice).transferCertificate(h1, f.bob.address, ZERO, { value: transferFee });

      const stats = await f.notary.getStats();
      expect(stats[0]).to.equal(2);                          // certCount
      expect(stats[1]).to.equal(certFee * 2n + transferFee); // totalEthCollected
      expect(stats[2]).to.equal(boostPayment);               // totalBoostRevenue
      expect(stats[3]).to.equal(1);                          // totalTransfers
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("7. Events", function () {
    it("Certified event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("event_cert");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_FINANCIAL));

      await expect(
        f.notary.connect(f.alice).certify(hash, "meta", DOC_FINANCIAL, f.operator.address, { value: fee })
      ).to.emit(f.notary, "Certified").withArgs(1, f.alice.address, hash, DOC_FINANCIAL, f.operator.address);
    });

    it("BatchCertified event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hashes = [docHash("ev_b1"), docHash("ev_b2")];
      let totalFee = 0n;
      for (const t of [0, 1]) totalFee += await computeFee(f.ecosystem, certifyActionId(t));

      await expect(
        f.notary.connect(f.bob).batchCertify(hashes, ["", ""], [0, 1], f.operator.address, { value: totalFee })
      ).to.emit(f.notary, "BatchCertified").withArgs(f.bob.address, 1, 2, f.operator.address);
    });

    it("CertificateTransferred event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("ev_xfer");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      await expect(
        f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: transferFee })
      ).to.emit(f.notary, "CertificateTransferred").withArgs(hash, f.alice.address, f.bob.address);
    });

    it("CertificateBoosted event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("ev_boost");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      const tx = await f.notary.connect(f.bob).boostCertificate(hash, 7, f.operator.address, { value: boostFee * 7n });

      // CertificateBoosted(documentHash, booster, boostExpiry, operator)
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => {
          try {
            return f.notary.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "CertificateBoosted";
          } catch { return false; }
        }
      );
      expect(event).to.not.be.undefined;
      const parsed = f.notary.interface.parseLog({ topics: event!.topics as string[], data: event!.data });
      expect(parsed!.args.documentHash).to.equal(hash);
      expect(parsed!.args.booster).to.equal(f.bob.address);
      expect(parsed!.args.operator).to.equal(f.operator.address);
      expect(Number(parsed!.args.boostExpiry)).to.be.gt(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. FEE SYSTEM & ECOSYSTEM INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("8. Fee System & Ecosystem Integration", function () {
    it("per-docType fees reflect different multipliers", async function () {
      const f = await loadFixture(deployNotaryFixture);

      const feeGeneral = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));   // mult=200
      const feeContract = await computeFee(f.ecosystem, certifyActionId(DOC_CONTRACT)); // mult=2000
      const feeDiploma = await computeFee(f.ecosystem, certifyActionId(DOC_DIPLOMA));   // mult=1000
      const feeLegal = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));       // mult=2700

      // Verify ordering: General < Diploma < Contract < Legal
      expect(feeGeneral).to.be.lt(feeDiploma);
      expect(feeDiploma).to.be.lt(feeContract);
      expect(feeContract).to.be.lt(feeLegal);
    });

    it("fees are proportional to multiplier ratios", async function () {
      const f = await loadFixture(deployNotaryFixture);

      const feeGeneral = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));  // mult=200
      const feeLegal = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));      // mult=2700

      // Legal/General ratio should be 2700/200 = 13.5x
      if (feeGeneral > 0n) {
        const ratio = Number(feeLegal) / Number(feeGeneral);
        expect(ratio).to.be.closeTo(13.5, 0.1);
      }
    });

    it("operator receives commission from certify", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("operator_comm");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));

      const opBalBefore = await f.ecosystem.pendingEth(f.operator.address);
      await f.notary.connect(f.alice).certify(hash, "", DOC_LEGAL, f.operator.address, { value: fee });
      const opBalAfter = await f.ecosystem.pendingEth(f.operator.address);

      expect(opBalAfter).to.be.gt(opBalBefore);
    });

    it("operator receives commission from boost", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("op_boost");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      const opBalBefore = await f.ecosystem.pendingEth(f.operator.address);
      await f.notary.connect(f.alice).boostCertificate(hash, 5, f.operator.address, { value: boostFee * 5n });
      const opBalAfter = await f.ecosystem.pendingEth(f.operator.address);

      expect(opBalAfter).to.be.gt(opBalBefore);
    });

    it("operator receives commission from transfer", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("op_xfer");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);
      const opBalBefore = await f.ecosystem.pendingEth(f.operator.address);
      await f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, f.operator.address, { value: transferFee });
      const opBalAfter = await f.ecosystem.pendingEth(f.operator.address);

      expect(opBalAfter).to.be.gt(opBalBefore);
    });

    it("zero operator sends operator share to buyback", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("zero_op");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));

      const buybackBefore = await f.ecosystem.buybackAccumulated();
      await f.notary.connect(f.alice).certify(hash, "", DOC_LEGAL, ZERO, { value: fee });
      const buybackAfter = await f.ecosystem.buybackAccumulated();

      // Buyback should receive its share + operator's share
      expect(buybackAfter).to.be.gt(buybackBefore);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. EDGE CASES & STRESS TESTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("9. Edge Cases & Stress Tests", function () {
    it("certify with zero fee config (fresh ecosystem, no fees set) succeeds with 0 ETH", async function () {
      const [deployer, treasury, , alice] = await ethers.getSigners();

      // Deploy a fresh ecosystem with NO fee configs
      const BKCToken = await ethers.getContractFactory("contracts/BKCToken.sol:BKCToken");
      const bkc = await BKCToken.deploy(treasury.address);
      await bkc.waitForDeployment();

      const Ecosystem = await ethers.getContractFactory("contracts/BackchainEcosystem.sol:BackchainEcosystem");
      const eco2 = await Ecosystem.deploy(await bkc.getAddress(), treasury.address);
      await eco2.waitForDeployment();
      const eco2Addr = await eco2.getAddress();

      const Notary = await ethers.getContractFactory("contracts/Notary.sol:Notary");
      const notary2 = await Notary.deploy(eco2Addr);
      await notary2.waitForDeployment();
      const notary2Addr = await notary2.getAddress();

      // Register module but NO fee configs → calculateFee returns 0
      await eco2.registerModule(notary2Addr, id("NOTARY"), {
        active: true, customBps: 0, operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500
      });

      // Fee = 0, so certify with 0 ETH should work
      const hash = docHash("no_fee_type");
      await notary2.connect(alice).certify(hash, "", 0, ZERO, { value: 0 });

      expect((await notary2.verify(hash)).exists).to.be.true;
    });

    it("multiple certifications by same user across different types", async function () {
      const f = await loadFixture(deployNotaryFixture);

      for (let t = 0; t <= 9; t++) {
        const hash = docHash(`alice_multi_${t}`);
        const fee = await computeFee(f.ecosystem, certifyActionId(t));
        await f.notary.connect(f.alice).certify(hash, `type_${t}`, t, ZERO, { value: fee });
      }

      expect(await f.notary.certCount()).to.equal(10);

      // Verify each one
      for (let t = 0; t <= 9; t++) {
        const hash = docHash(`alice_multi_${t}`);
        const r = await f.notary.verify(hash);
        expect(r.exists).to.be.true;
        expect(r.docType).to.equal(t);
        expect(r.meta).to.equal(`type_${t}`);
      }
    });

    it("boost, let expire, boost again — correct expiry", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("expire_reboost");
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });

      // Boost 2 days
      await f.notary.connect(f.alice).boostCertificate(hash, 2, ZERO, { value: boostFee * 2n });
      expect(await f.notary.isBoosted(hash)).to.be.true;

      // Fast-forward 3 days → expired
      await time.increase(3 * DAY);
      expect(await f.notary.isBoosted(hash)).to.be.false;

      // Boost again 5 days → starts from now
      const nowBefore = await time.latest();
      await f.notary.connect(f.alice).boostCertificate(hash, 5, ZERO, { value: boostFee * 5n });
      const expiry = Number((await f.notary.verify(hash)).boostExpiry);
      expect(expiry).to.be.closeTo(nowBefore + 5 * DAY, 5);
      expect(await f.notary.isBoosted(hash)).to.be.true;
    });

    it("batch certify + boost individual certs in batch", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hashes = [docHash("bb1"), docHash("bb2"), docHash("bb3")];
      const types = [DOC_GENERAL, DOC_LEGAL, DOC_MEDICAL];
      let totalFee = 0n;
      for (const t of types) totalFee += await computeFee(f.ecosystem, certifyActionId(t));

      await f.notary.connect(f.alice).batchCertify(hashes, ["", "", ""], types, ZERO, { value: totalFee });

      // Boost the middle one
      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      await f.notary.connect(f.bob).boostCertificate(hashes[1], 7, ZERO, { value: boostFee * 7n });

      expect(await f.notary.isBoosted(hashes[0])).to.be.false;
      expect(await f.notary.isBoosted(hashes[1])).to.be.true;
      expect(await f.notary.isBoosted(hashes[2])).to.be.false;
    });

    it("metadata storage: only stored when non-empty", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      const h1 = docHash("has_meta");
      const h2 = docHash("no_meta");
      await f.notary.connect(f.alice).certify(h1, "QmSomeCID", 0, ZERO, { value: fee });
      await f.notary.connect(f.alice).certify(h2, "", 0, ZERO, { value: fee });

      expect(await f.notary.metadata(h1)).to.equal("QmSomeCID");
      expect(await f.notary.metadata(h2)).to.equal("");
    });

    it("certs mapping returns packed struct data", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("packed_struct");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_CONTRACT));

      await f.notary.connect(f.alice).certify(hash, "", DOC_CONTRACT, ZERO, { value: fee });

      const cert = await f.notary.certs(hash);
      expect(cert.owner).to.equal(f.alice.address);
      expect(cert.timestamp).to.be.gt(0);
      expect(cert.docType).to.equal(DOC_CONTRACT);
      expect(cert.boostExpiry).to.equal(0);
    });

    it("large metadata string is stored correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));
      const longMeta = "QmLoremIpsumDolorSitAmetConsecteturAdipiscingElitSedDoEiusmodTemporIncididuntUtLaboreEtDoloreMagnaAliquaUtEnimAdMinimVeniamQuisNostrud";

      const hash = docHash("long_meta");
      await f.notary.connect(f.alice).certify(hash, longMeta, 0, ZERO, { value: fee });

      expect((await f.notary.verify(hash)).meta).to.equal(longMeta);
    });

    it("getCertificatesBatch with count=0 returns empty arrays", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.getCertificatesBatch(1, 0);
      expect(result.hashes.length).to.equal(0);
    });

    it("getStats 4-tuple matches individual counters", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const boostFee = await computeFee(f.ecosystem, ACTION_BOOST);
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);

      // Do various actions
      await f.notary.connect(f.alice).certify(docHash("s1"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).certify(docHash("s2"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).boostCertificate(docHash("s1"), 2, ZERO, { value: boostFee * 2n });
      await f.notary.connect(f.alice).transferCertificate(docHash("s2"), f.bob.address, ZERO, { value: transferFee });

      const stats = await f.notary.getStats();
      expect(stats[0]).to.equal(await f.notary.certCount());
      expect(stats[1]).to.equal(await f.notary.totalEthCollected());
      expect(stats[2]).to.equal(await f.notary.totalBoostRevenue());
      expect(stats[3]).to.equal(await f.notary.totalTransfers());
    });
  });
});
