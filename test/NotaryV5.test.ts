// =============================================================================
// NOTARY V5 — EXHAUSTIVE TESTS (Cartório Digital)
// =============================================================================
// Covers: certify (10 doc types), batchCertify, transferCertificate,
//         registerAsset (4 types), transferAsset, addAnnotation (7 types),
//         setBaseURI, all views, all errors, events, stats, edge cases.
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
const ACTION_TRANSFER = id("NOTARY_TRANSFER");
const ACTION_ASSET_REGISTER = id("ASSET_REGISTER");
const ACTION_ASSET_TRANSFER = id("ASSET_TRANSFER");
const ACTION_ASSET_ANNOTATE = id("ASSET_ANNOTATE");
const ZERO = ethers.ZeroAddress;

// Doc types (0-9)
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

// Asset types (0-3)
const ASSET_IMOVEL = 0;
const ASSET_VEICULO = 1;
const ASSET_IP = 2;
const ASSET_OUTROS = 3;

// Annotation types (0-6)
const ANN_HIPOTECA = 0;
const ANN_PENHORA = 1;
const ANN_ORDEM_JUDICIAL = 2;
const ANN_SEGURO = 3;
const ANN_REFORMA = 4;
const ANN_OBSERVACAO = 5;
const ANN_CANCELAMENTO = 6;

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

  // Notary V5
  const Notary = await ethers.getContractFactory("contracts/Notary.sol:Notary");
  const notary = await Notary.deploy(ecosystemAddr, "https://backcoin.org/api/cert-metadata/");
  await notary.waitForDeployment();
  const notaryAddr = await notary.getAddress();

  // Register module
  const moduleCfg = { active: true, customBps: 0, operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500 };
  await ecosystem.registerModule(notaryAddr, MOD_NOTARY, moduleCfg);

  // Set fee configs for all 10 doc types (gas-based: feeType=0)
  for (let t = 0; t <= 9; t++) {
    const actionId = certifyActionId(t);
    await ecosystem.setFeeConfig(actionId, [0, 100, DOC_MULTIPLIERS[t], 200000]);
  }

  // Transfer fee config
  await ecosystem.setFeeConfig(ACTION_TRANSFER, [0, 100, 200, 200000]);

  // Asset Register fee (premium: mult=5000)
  await ecosystem.setFeeConfig(ACTION_ASSET_REGISTER, [0, 100, 5000, 200000]);

  // Asset Transfer fee (financial: mult=2000)
  await ecosystem.setFeeConfig(ACTION_ASSET_TRANSFER, [0, 100, 2000, 200000]);

  // Asset Annotate fee (content: mult=200)
  await ecosystem.setFeeConfig(ACTION_ASSET_ANNOTATE, [0, 100, 200, 200000]);

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
 * always returns 0 for gas-based fees. We compute it in JS with a 20% safety buffer.
 */
async function computeFee(ecosystem: any, actionId: string): Promise<bigint> {
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

  const baseFee = cfg.gasEstimate * gasPrice * cfg.bps * cfg.multiplier / BPS;
  return baseFee * 120n / 100n;
}

/**
 * Generous fee: 1 ETH (always enough for any test action).
 */
const GENEROUS_FEE = ethers.parseEther("1");

// ============================================================================
// TESTS
// ============================================================================

describe("Notary V5 — Cartório Digital Tests", function () {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. DEPLOYMENT & CONSTANTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("1. Deployment & Constants", function () {
    it("deploys with correct version", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.version()).to.equal("5.0.0");
    });

    it("ecosystem is set correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ecosystem()).to.equal(f.ecosystemAddr);
    });

    it("MODULE_ID matches keccak256('NOTARY')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MODULE_ID()).to.equal(id("NOTARY"));
    });

    it("ACTION_CERTIFY matches keccak256('NOTARY_CERTIFY')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_CERTIFY()).to.equal(id("NOTARY_CERTIFY"));
    });

    it("ACTION_TRANSFER matches keccak256('NOTARY_TRANSFER')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_TRANSFER()).to.equal(ACTION_TRANSFER);
    });

    it("ACTION_ASSET_REGISTER matches keccak256('ASSET_REGISTER')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_ASSET_REGISTER()).to.equal(ACTION_ASSET_REGISTER);
    });

    it("ACTION_ASSET_TRANSFER matches keccak256('ASSET_TRANSFER')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_ASSET_TRANSFER()).to.equal(ACTION_ASSET_TRANSFER);
    });

    it("ACTION_ASSET_ANNOTATE matches keccak256('ASSET_ANNOTATE')", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.ACTION_ASSET_ANNOTATE()).to.equal(ACTION_ASSET_ANNOTATE);
    });

    it("MAX_BATCH_SIZE is 20", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MAX_BATCH_SIZE()).to.equal(20);
    });

    it("MAX_ASSET_TYPE is 3", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MAX_ASSET_TYPE()).to.equal(3);
    });

    it("MAX_ANNOTATION_TYPE is 6", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.MAX_ANNOTATION_TYPE()).to.equal(6);
    });

    it("initial state: certCount=0, totalTransfers=0, assetCount=0, annotationTotal=0", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.certCount()).to.equal(0);
      expect(await f.notary.totalTransfers()).to.equal(0);
      expect(await f.notary.assetCount()).to.equal(0);
      expect(await f.notary.annotationTotal()).to.equal(0);
    });

    it("ERC-721: name and symbol correct", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.name()).to.equal("Backchain Notary Certificate");
      expect(await f.notary.symbol()).to.equal("BKCN");
    });

    it("supports ERC165, ERC721, ERC721Metadata interfaces", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.supportsInterface("0x01ffc9a7")).to.be.true;  // ERC165
      expect(await f.notary.supportsInterface("0x80ac58cd")).to.be.true;  // ERC721
      expect(await f.notary.supportsInterface("0x5b5e139f")).to.be.true;  // ERC721Metadata
      expect(await f.notary.supportsInterface("0xdeadbeef")).to.be.false; // random
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

    it("overpaying is accepted (excess goes to ecosystem)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const overpay = ethers.parseEther("0.01");

      await f.notary.connect(f.alice).certify(docHash("overpay_doc"), "", 0, ZERO, { value: overpay });
      expect(await f.notary.certCount()).to.equal(1);
    });

    it("premium doc types (Legal/Property/Medical) cost more than General", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const feeGeneral = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));
      const feeLegal = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));
      const feeProperty = await computeFee(f.ecosystem, certifyActionId(DOC_PROPERTY));
      const feeMedical = await computeFee(f.ecosystem, certifyActionId(DOC_MEDICAL));

      expect(feeLegal).to.be.gt(feeGeneral);
      expect(feeProperty).to.be.gt(feeGeneral);
      expect(feeMedical).to.be.gt(feeGeneral);
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

      for (let i = 0; i < 3; i++) {
        const r = await f.notary.verify(hashes[i]);
        expect(r.exists).to.be.true;
        expect(r.owner).to.equal(f.alice.address);
        expect(r.docType).to.equal(types[i]);
      }

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

      await f.notary.connect(f.alice).certify(docHash("pre1"), "", 0, ZERO, { value: fee });
      await f.notary.connect(f.alice).certify(docHash("pre2"), "", 0, ZERO, { value: fee });

      const hashes = [docHash("b1"), docHash("b2"), docHash("b3")];
      const tx = await f.notary.connect(f.alice).batchCertify(hashes, ["", "", ""], [0, 0, 0], ZERO, { value: fee * 3n });
      await expect(tx).to.emit(f.notary, "BatchCertified").withArgs(f.alice.address, 3, 3, ZERO);

      expect(await f.notary.certCount()).to.equal(5);
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

    it("reverts on array length mismatch", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).batchCertify(
          [docHash("mm1"), docHash("mm2")], ["meta1"], [0, 0], ZERO
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
  // 4. TRANSFER CERTIFICATE
  // ══════════════════════════════════════════════════════════════════════════

  describe("4. Transfer Certificate", function () {
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

      await f.notary.connect(f.alice).certify(hash, "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: transferFee });
      expect((await f.notary.verify(hash)).owner).to.equal(f.bob.address);

      await f.notary.connect(f.bob).transferCertificate(hash, f.charlie.address, ZERO, { value: transferFee });
      expect((await f.notary.verify(hash)).owner).to.equal(f.charlie.address);
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

      await expect(
        f.notary.connect(f.alice).transferCertificate(hash, f.bob.address, ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. REGISTER ASSET
  // ══════════════════════════════════════════════════════════════════════════

  describe("5. Register Asset", function () {
    it("registers an imóvel (real estate) with metadata and docHash", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const dHash = docHash("imovel_escritura");
      const meta = JSON.stringify({ desc: "Apartamento 3 quartos", address: "Rua ABC 123" });

      const tx = await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, meta, dHash, f.operator.address, { value: fee });

      await expect(tx).to.emit(f.notary, "AssetRegistered").withArgs(1, f.alice.address, ASSET_IMOVEL, dHash, f.operator.address);
      await expect(tx).to.emit(f.notary, "Transfer").withArgs(ZERO, f.alice.address, 1);

      const asset = await f.notary.getAsset(1);
      expect(asset.owner).to.equal(f.alice.address);
      expect(asset.assetType).to.equal(ASSET_IMOVEL);
      expect(asset.annotationCount).to.equal(0);
      expect(asset.transferCount).to.equal(0);
      expect(asset.meta).to.equal(meta);
      expect(asset.documentHash).to.equal(dHash);

      expect(await f.notary.assetCount()).to.equal(1);
      expect(await f.notary.isAsset(1)).to.be.true;
    });

    it("registers all 4 asset types successfully", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      for (let t = 0; t <= 3; t++) {
        const dHash = docHash(`asset_type_${t}`);
        await f.notary.connect(f.alice).registerAsset(t, `meta_${t}`, dHash, ZERO, { value: fee });
      }

      expect(await f.notary.assetCount()).to.equal(4);
      expect(await f.notary.certCount()).to.equal(4); // shared counter

      for (let t = 0; t <= 3; t++) {
        const asset = await f.notary.getAsset(t + 1);
        expect(asset.assetType).to.equal(t);
      }
    });

    it("registers without documentHash (bytes32(0) is accepted)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_VEICULO, "Carro X", ethers.ZeroHash, ZERO, { value: fee });

      const asset = await f.notary.getAsset(1);
      expect(asset.documentHash).to.equal(ethers.ZeroHash);
    });

    it("registers without metadata (empty string)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IP, "", docHash("ip_doc"), ZERO, { value: fee });

      const asset = await f.notary.getAsset(1);
      expect(asset.meta).to.equal("");
    });

    it("ownerOf works for assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: fee });
      expect(await f.notary.ownerOf(1)).to.equal(f.alice.address);
    });

    it("balanceOf updates on register", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      expect(await f.notary.balanceOf(f.alice.address)).to.equal(0);
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: fee });
      expect(await f.notary.balanceOf(f.alice.address)).to.equal(1);
      await f.notary.connect(f.alice).registerAsset(ASSET_VEICULO, "", ethers.ZeroHash, ZERO, { value: fee });
      expect(await f.notary.balanceOf(f.alice.address)).to.equal(2);
    });

    it("tokenURI works for assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: fee });
      expect(await f.notary.tokenURI(1)).to.equal("https://backcoin.org/api/cert-metadata/1");
    });

    // ERROR CASES

    it("reverts on invalid asset type (> 3)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).registerAsset(4, "", ethers.ZeroHash, ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "InvalidAssetType");
    });

    it("reverts on invalid asset type (255)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).registerAsset(255, "", ethers.ZeroHash, ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "InvalidAssetType");
    });

    it("reverts on insufficient fee", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. TRANSFER ASSET
  // ══════════════════════════════════════════════════════════════════════════

  describe("6. Transfer Asset", function () {
    it("owner transfers asset to another address", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "Casa", docHash("casa_doc"), ZERO, { value: regFee });

      const declaredValue = ethers.parseEther("100");
      const tx = await f.notary.connect(f.alice).transferAsset(
        1, f.bob.address, declaredValue, "Venda realizada", f.operator.address, { value: xferFee }
      );

      await expect(tx).to.emit(f.notary, "AssetTransferred");
      await expect(tx).to.emit(f.notary, "Transfer").withArgs(f.alice.address, f.bob.address, 1);

      // New owner
      const asset = await f.notary.getAsset(1);
      expect(asset.owner).to.equal(f.bob.address);
      expect(asset.transferCount).to.equal(1);
      expect(await f.notary.ownerOf(1)).to.equal(f.bob.address);
    });

    it("transfer with meta creates automatic annotation", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).transferAsset(
        1, f.bob.address, ethers.parseEther("50"), "Transfer note", ZERO, { value: xferFee }
      );

      // Should have 1 annotation (automatic transfer note)
      const asset = await f.notary.getAsset(1);
      expect(asset.annotationCount).to.equal(1);

      const ann = await f.notary.getAnnotation(1, 0);
      expect(ann.author).to.equal(f.alice.address);
      expect(ann.annotationType).to.equal(ANN_OBSERVACAO); // type 5
      expect(ann.meta).to.equal("Transfer note");
    });

    it("transfer without meta does NOT create annotation", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).transferAsset(1, f.bob.address, 0, "", ZERO, { value: xferFee });

      const asset = await f.notary.getAsset(1);
      expect(asset.annotationCount).to.equal(0);
    });

    it("approved operator can transfer asset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_VEICULO, "Carro", ethers.ZeroHash, ZERO, { value: regFee });
      // Alice approves bob
      await f.notary.connect(f.alice).approve(f.bob.address, 1);

      // Bob transfers on Alice's behalf
      await f.notary.connect(f.bob).transferAsset(1, f.charlie.address, 0, "", ZERO, { value: xferFee });
      expect(await f.notary.ownerOf(1)).to.equal(f.charlie.address);
    });

    it("setApprovalForAll operator can transfer asset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).setApprovalForAll(f.bob.address, true);

      await f.notary.connect(f.bob).transferAsset(1, f.charlie.address, 0, "", ZERO, { value: xferFee });
      expect(await f.notary.ownerOf(1)).to.equal(f.charlie.address);
    });

    it("chain of asset transfers (alice → bob → charlie)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await f.notary.connect(f.alice).transferAsset(1, f.bob.address, 0, "", ZERO, { value: xferFee });
      expect(await f.notary.ownerOf(1)).to.equal(f.bob.address);

      await f.notary.connect(f.bob).transferAsset(1, f.charlie.address, 0, "", ZERO, { value: xferFee });
      expect(await f.notary.ownerOf(1)).to.equal(f.charlie.address);

      const asset = await f.notary.getAsset(1);
      expect(asset.transferCount).to.equal(2);
    });

    it("totalTransfers includes asset transfers", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).transferAsset(1, f.bob.address, 0, "", ZERO, { value: xferFee });

      expect(await f.notary.totalTransfers()).to.equal(1);
    });

    // ERROR CASES

    it("reverts if caller is not owner or approved", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.bob).transferAsset(1, f.charlie.address, 0, "", ZERO, { value: xferFee })
      ).to.be.revertedWithCustomError(f.notary, "NotOwnerOrApproved");
    });

    it("reverts on transfer to zero address", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.alice).transferAsset(1, ZERO, 0, "", ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "ZeroAddress");
    });

    it("reverts on non-existent tokenId", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).transferAsset(999, f.bob.address, 0, "", ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "TokenNotFound");
    });

    it("reverts on insufficient fee", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.alice).transferAsset(1, f.bob.address, 0, "", ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ANNOTATIONS (Averbações)
  // ══════════════════════════════════════════════════════════════════════════

  describe("7. Annotations (Averbações)", function () {
    it("owner adds annotation to asset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      const tx = await f.notary.connect(f.alice).addAnnotation(
        1, ANN_HIPOTECA, "Hipoteca banco XYZ, R$ 500k", f.operator.address, { value: annFee }
      );

      await expect(tx).to.emit(f.notary, "AnnotationAdded").withArgs(1, 0, f.alice.address, ANN_HIPOTECA);

      const ann = await f.notary.getAnnotation(1, 0);
      expect(ann.author).to.equal(f.alice.address);
      expect(ann.annotationType).to.equal(ANN_HIPOTECA);
      expect(ann.meta).to.equal("Hipoteca banco XYZ, R$ 500k");
      expect(ann.timestamp).to.be.gt(0);

      expect(await f.notary.getAnnotationCount(1)).to.equal(1);
      expect(await f.notary.annotationTotal()).to.equal(1);
    });

    it("all 7 annotation types are accepted", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      for (let t = 0; t <= 6; t++) {
        await f.notary.connect(f.alice).addAnnotation(1, t, `ann_${t}`, ZERO, { value: annFee });
      }

      expect(await f.notary.getAnnotationCount(1)).to.equal(7);
      expect(await f.notary.annotationTotal()).to.equal(7);

      // Verify each annotation type
      for (let t = 0; t <= 6; t++) {
        const ann = await f.notary.getAnnotation(1, t);
        expect(ann.annotationType).to.equal(t);
        expect(ann.meta).to.equal(`ann_${t}`);
      }
    });

    it("multiple annotations on same asset increment annotationCount", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await f.notary.connect(f.alice).addAnnotation(1, ANN_HIPOTECA, "First", ZERO, { value: annFee });
      await f.notary.connect(f.alice).addAnnotation(1, ANN_SEGURO, "Second", ZERO, { value: annFee });
      await f.notary.connect(f.alice).addAnnotation(1, ANN_REFORMA, "Third", ZERO, { value: annFee });

      const asset = await f.notary.getAsset(1);
      expect(asset.annotationCount).to.equal(3);

      expect((await f.notary.getAnnotation(1, 0)).meta).to.equal("First");
      expect((await f.notary.getAnnotation(1, 1)).meta).to.equal("Second");
      expect((await f.notary.getAnnotation(1, 2)).meta).to.equal("Third");
    });

    it("approved operator can add annotation", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).approve(f.bob.address, 1);

      await f.notary.connect(f.bob).addAnnotation(1, ANN_ORDEM_JUDICIAL, "Court order", ZERO, { value: annFee });

      const ann = await f.notary.getAnnotation(1, 0);
      expect(ann.author).to.equal(f.bob.address);
      expect(ann.annotationType).to.equal(ANN_ORDEM_JUDICIAL);
    });

    it("setApprovalForAll operator can add annotation", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).setApprovalForAll(f.bob.address, true);

      await f.notary.connect(f.bob).addAnnotation(1, ANN_PENHORA, "Penhora", ZERO, { value: annFee });
      expect(await f.notary.getAnnotationCount(1)).to.equal(1);
    });

    it("annotation without meta is accepted", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).addAnnotation(1, ANN_CANCELAMENTO, "", ZERO, { value: annFee });

      const ann = await f.notary.getAnnotation(1, 0);
      expect(ann.meta).to.equal("");
    });

    it("annotationTotal tracks across multiple assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      // Two assets
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_VEICULO, "", ethers.ZeroHash, ZERO, { value: regFee });

      // 2 annotations on asset #1
      await f.notary.connect(f.alice).addAnnotation(1, ANN_HIPOTECA, "A", ZERO, { value: annFee });
      await f.notary.connect(f.alice).addAnnotation(1, ANN_SEGURO, "B", ZERO, { value: annFee });

      // 1 annotation on asset #2
      await f.notary.connect(f.alice).addAnnotation(2, ANN_REFORMA, "C", ZERO, { value: annFee });

      expect(await f.notary.annotationTotal()).to.equal(3);
      expect(await f.notary.getAnnotationCount(1)).to.equal(2);
      expect(await f.notary.getAnnotationCount(2)).to.equal(1);
    });

    // ERROR CASES

    it("reverts if caller is not owner or approved", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.bob).addAnnotation(1, ANN_HIPOTECA, "", ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "NotOwnerOrApproved");
    });

    it("reverts on non-existent tokenId", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(
        f.notary.connect(f.alice).addAnnotation(999, ANN_HIPOTECA, "", ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "TokenNotFound");
    });

    it("reverts on invalid annotation type (> 6)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.alice).addAnnotation(1, 7, "", ZERO, { value: GENEROUS_FEE })
      ).to.be.revertedWithCustomError(f.notary, "InvalidAnnotationType");
    });

    it("reverts on insufficient fee", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.alice).addAnnotation(1, ANN_HIPOTECA, "", ZERO, { value: 0 })
      ).to.be.revertedWithCustomError(f.notary, "InsufficientFee");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. SET BASE URI
  // ══════════════════════════════════════════════════════════════════════════

  describe("8. setBaseURI", function () {
    it("ecosystem owner can set base URI", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));

      await f.notary.connect(f.alice).certify(docHash("uri_test"), "", 0, ZERO, { value: certFee });

      // deployer is ecosystem owner
      await f.notary.connect(f.deployer).setBaseURI("https://newdomain.com/api/metadata/");

      expect(await f.notary.tokenURI(1)).to.equal("https://newdomain.com/api/metadata/1");
    });

    it("emits BaseURIUpdated event", async function () {
      const f = await loadFixture(deployNotaryFixture);

      await expect(
        f.notary.connect(f.deployer).setBaseURI("https://test.com/")
      ).to.emit(f.notary, "BaseURIUpdated").withArgs("https://test.com/");
    });

    it("reverts if caller is not ecosystem owner", async function () {
      const f = await loadFixture(deployNotaryFixture);

      await expect(
        f.notary.connect(f.alice).setBaseURI("https://evil.com/")
      ).to.be.revertedWithCustomError(f.notary, "NotEcosystemOwner");
    });

    it("empty URI is accepted", async function () {
      const f = await loadFixture(deployNotaryFixture);

      await f.notary.connect(f.deployer).setBaseURI("");
      // No revert means it works
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. VIEW FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("9. View Functions", function () {
    it("verify returns (false, ...) for non-existent hash", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.verify(docHash("nonexistent"));
      expect(result.exists).to.be.false;
      expect(result.owner).to.equal(ZERO);
      expect(result.timestamp).to.equal(0);
      expect(result.docType).to.equal(0);
      expect(result.meta).to.equal("");
    });

    it("verify returns 5 fields correctly for existing cert", async function () {
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
    });

    it("getCertificate returns empty for non-existent ID", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.getCertificate(999);
      expect(result.documentHash).to.equal(ethers.ZeroHash);
      expect(result.owner).to.equal(ZERO);
    });

    it("getCertificatesBatch returns correct data", async function () {
      const f = await loadFixture(deployNotaryFixture);

      const hashes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const h = docHash(`batch_read_${i}`);
        hashes.push(h);
        await f.notary.connect(f.alice).certify(h, "", i % 10, ZERO, { value: GENEROUS_FEE });
      }

      const result = await f.notary.getCertificatesBatch(1, 5);
      expect(result.hashes.length).to.equal(5);
      for (let i = 0; i < 5; i++) {
        expect(result.hashes[i]).to.equal(hashes[i]);
        expect(result.owners[i]).to.equal(f.alice.address);
        expect(result.docTypes[i]).to.equal(i);
      }
    });

    it("getCertificatesBatch handles partial range", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));

      for (let i = 0; i < 3; i++) {
        await f.notary.connect(f.alice).certify(docHash(`partial_${i}`), "", 0, ZERO, { value: fee });
      }

      const result = await f.notary.getCertificatesBatch(1, 10);
      expect(result.hashes.length).to.equal(3);
    });

    it("getCertificatesBatch returns empty for start > certCount", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.getCertificatesBatch(100, 10);
      expect(result.hashes.length).to.equal(0);
    });

    it("getCertificatesBatch with count=0 returns empty arrays", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const result = await f.notary.getCertificatesBatch(1, 0);
      expect(result.hashes.length).to.equal(0);
    });

    it("getAsset returns empty for non-existent asset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const asset = await f.notary.getAsset(999);
      expect(asset.owner).to.equal(ZERO);
      expect(asset.registeredAt).to.equal(0);
    });

    it("getAnnotation returns empty for non-existent annotation", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const ann = await f.notary.getAnnotation(999, 0);
      expect(ann.author).to.equal(ZERO);
      expect(ann.timestamp).to.equal(0);
    });

    it("getAnnotationCount returns 0 for non-existent asset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.getAnnotationCount(999)).to.equal(0);
    });

    it("isAsset returns false for non-existent token", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.isAsset(999)).to.be.false;
    });

    it("isAsset returns false for certificate token", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));
      await f.notary.connect(f.alice).certify(docHash("not_asset"), "", 0, ZERO, { value: fee });
      expect(await f.notary.isAsset(1)).to.be.false;
    });

    it("getFee returns 0 in view (gasPrice=0)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      expect(await f.notary.getFee()).to.equal(0);
    });

    it("getStats returns correct 4-tuple", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      // Certify 2 docs
      await f.notary.connect(f.alice).certify(docHash("s1"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).certify(docHash("s2"), "", 0, ZERO, { value: certFee });

      // Transfer cert
      await f.notary.connect(f.alice).transferCertificate(docHash("s2"), f.bob.address, ZERO, { value: transferFee });

      // Register asset
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      // Add annotation
      await f.notary.connect(f.alice).addAnnotation(3, ANN_HIPOTECA, "", ZERO, { value: annFee });

      const stats = await f.notary.getStats();
      expect(stats[0]).to.equal(3);  // certCount (2 certs + 1 asset = 3 total tokens)
      expect(stats[1]).to.equal(1);  // totalTransfers
      expect(stats[2]).to.equal(1);  // assetCount
      expect(stats[3]).to.equal(1);  // annotationTotal
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. ERC-721 COMPLIANCE
  // ══════════════════════════════════════════════════════════════════════════

  describe("10. ERC-721 Compliance", function () {
    it("ownerOf works for both certs and assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).certify(docHash("erc_cert"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.bob).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      expect(await f.notary.ownerOf(1)).to.equal(f.alice.address);  // cert
      expect(await f.notary.ownerOf(2)).to.equal(f.bob.address);    // asset
    });

    it("ownerOf reverts for non-existent token", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(f.notary.ownerOf(999)).to.be.revertedWithCustomError(f.notary, "TokenNotFound");
    });

    it("balanceOf tracks both certs and assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).certify(docHash("bal_cert"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      expect(await f.notary.balanceOf(f.alice.address)).to.equal(2);
    });

    it("balanceOf reverts for zero address", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(f.notary.balanceOf(ZERO)).to.be.revertedWithCustomError(f.notary, "ZeroAddress");
    });

    it("transferFrom works for certs", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));

      await f.notary.connect(f.alice).certify(docHash("tf_cert"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).transferFrom(f.alice.address, f.bob.address, 1);

      expect(await f.notary.ownerOf(1)).to.equal(f.bob.address);
    });

    it("transferFrom works for assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).transferFrom(f.alice.address, f.bob.address, 1);

      expect(await f.notary.ownerOf(1)).to.equal(f.bob.address);
      // transferFrom on asset increments transferCount
      const asset = await f.notary.getAsset(1);
      expect(asset.transferCount).to.equal(1);
    });

    it("approve and getApproved work for both certs and assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).certify(docHash("appr_cert"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      // Approve for cert
      await f.notary.connect(f.alice).approve(f.bob.address, 1);
      expect(await f.notary.getApproved(1)).to.equal(f.bob.address);

      // Approve for asset
      await f.notary.connect(f.alice).approve(f.charlie.address, 2);
      expect(await f.notary.getApproved(2)).to.equal(f.charlie.address);
    });

    it("getApproved reverts for non-existent token", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(f.notary.getApproved(999)).to.be.revertedWithCustomError(f.notary, "TokenNotFound");
    });

    it("tokenURI works for both certs and assets", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).certify(docHash("uri_c"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      expect(await f.notary.tokenURI(1)).to.equal("https://backcoin.org/api/cert-metadata/1");
      expect(await f.notary.tokenURI(2)).to.equal("https://backcoin.org/api/cert-metadata/2");
    });

    it("tokenURI reverts for non-existent token", async function () {
      const f = await loadFixture(deployNotaryFixture);
      await expect(f.notary.tokenURI(999)).to.be.revertedWithCustomError(f.notary, "TokenNotFound");
    });

    it("totalSupply reflects shared counter", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      await f.notary.connect(f.alice).certify(docHash("ts1"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).certify(docHash("ts2"), "", 0, ZERO, { value: certFee });

      expect(await f.notary.totalSupply()).to.equal(3);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. SHARED TOKEN ID SEQUENCE
  // ══════════════════════════════════════════════════════════════════════════

  describe("11. Shared Token ID Sequence", function () {
    it("certs and assets share the same counter: cert #1, asset #2, cert #3", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      // Cert → tokenId 1
      await f.notary.connect(f.alice).certify(docHash("shared_1"), "", 0, ZERO, { value: certFee });
      expect(await f.notary.certCount()).to.equal(1);

      // Asset → tokenId 2
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      expect(await f.notary.certCount()).to.equal(2);

      // Cert → tokenId 3
      await f.notary.connect(f.alice).certify(docHash("shared_3"), "", 0, ZERO, { value: certFee });
      expect(await f.notary.certCount()).to.equal(3);

      // Verify ownership and types
      expect(await f.notary.ownerOf(1)).to.equal(f.alice.address);
      expect(await f.notary.ownerOf(2)).to.equal(f.alice.address);
      expect(await f.notary.ownerOf(3)).to.equal(f.alice.address);

      // Token 1 is cert, token 2 is asset, token 3 is cert
      expect(await f.notary.isAsset(1)).to.be.false;
      expect(await f.notary.isAsset(2)).to.be.true;
      expect(await f.notary.isAsset(3)).to.be.false;

      // certById for certs, not for assets
      expect(await f.notary.certById(1)).to.equal(docHash("shared_1"));
      expect(await f.notary.certById(2)).to.equal(ethers.ZeroHash); // asset, no certById
      expect(await f.notary.certById(3)).to.equal(docHash("shared_3"));
    });

    it("getCertificatesBatch includes asset slots as empty entries", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      // cert #1, asset #2, cert #3
      await f.notary.connect(f.alice).certify(docHash("mix_1"), "m1", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).certify(docHash("mix_3"), "m3", 0, ZERO, { value: certFee });

      const batch = await f.notary.getCertificatesBatch(1, 3);
      expect(batch.hashes.length).to.equal(3);

      // Slot 0 (tokenId 1): cert
      expect(batch.hashes[0]).to.equal(docHash("mix_1"));
      expect(batch.owners[0]).to.equal(f.alice.address);

      // Slot 1 (tokenId 2): asset → empty cert data
      expect(batch.hashes[1]).to.equal(ethers.ZeroHash);
      expect(batch.owners[1]).to.equal(ZERO);

      // Slot 2 (tokenId 3): cert
      expect(batch.hashes[2]).to.equal(docHash("mix_3"));
      expect(batch.owners[2]).to.equal(f.alice.address);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("12. Events", function () {
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

    it("AssetRegistered event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const dHash = docHash("ev_asset");

      await expect(
        f.notary.connect(f.alice).registerAsset(ASSET_VEICULO, "Carro", dHash, f.operator.address, { value: regFee })
      ).to.emit(f.notary, "AssetRegistered").withArgs(1, f.alice.address, ASSET_VEICULO, dHash, f.operator.address);
    });

    it("AssetTransferred event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      const declaredValue = ethers.parseEther("200");
      const tx = await f.notary.connect(f.alice).transferAsset(
        1, f.bob.address, declaredValue, "", ZERO, { value: xferFee }
      );

      // Parse the event manually to check all fields including timestamp
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => {
          try {
            return f.notary.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "AssetTransferred";
          } catch { return false; }
        }
      );
      expect(event).to.not.be.undefined;
      const parsed = f.notary.interface.parseLog({ topics: event!.topics as string[], data: event!.data });
      expect(parsed!.args.tokenId).to.equal(1);
      expect(parsed!.args.from).to.equal(f.alice.address);
      expect(parsed!.args.to).to.equal(f.bob.address);
      expect(parsed!.args.declaredValue).to.equal(declaredValue);
      expect(Number(parsed!.args.timestamp)).to.be.gt(0);
    });

    it("AnnotationAdded event emits correct args", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      await expect(
        f.notary.connect(f.alice).addAnnotation(1, ANN_PENHORA, "Penhora judicial", ZERO, { value: annFee })
      ).to.emit(f.notary, "AnnotationAdded").withArgs(1, 0, f.alice.address, ANN_PENHORA);
    });

    it("ERC-721 Transfer events on certify, registerAsset, transferFrom", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      // Mint cert
      await expect(
        f.notary.connect(f.alice).certify(docHash("t_evt"), "", 0, ZERO, { value: certFee })
      ).to.emit(f.notary, "Transfer").withArgs(ZERO, f.alice.address, 1);

      // Mint asset
      await expect(
        f.notary.connect(f.bob).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee })
      ).to.emit(f.notary, "Transfer").withArgs(ZERO, f.bob.address, 2);

      // ERC-721 transfer
      await expect(
        f.notary.connect(f.alice).transferFrom(f.alice.address, f.charlie.address, 1)
      ).to.emit(f.notary, "Transfer").withArgs(f.alice.address, f.charlie.address, 1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. FEE SYSTEM & ECOSYSTEM INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("13. Fee System & Ecosystem Integration", function () {
    it("per-docType fees reflect different multipliers", async function () {
      const f = await loadFixture(deployNotaryFixture);

      const feeGeneral = await computeFee(f.ecosystem, certifyActionId(DOC_GENERAL));
      const feeContract = await computeFee(f.ecosystem, certifyActionId(DOC_CONTRACT));
      const feeDiploma = await computeFee(f.ecosystem, certifyActionId(DOC_DIPLOMA));
      const feeLegal = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));

      expect(feeGeneral).to.be.lt(feeDiploma);
      expect(feeDiploma).to.be.lt(feeContract);
      expect(feeContract).to.be.lt(feeLegal);
    });

    it("asset register fee is premium (highest)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const certFee = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL)); // 2700 mult
      // Register fee mult=5000, Legal cert mult=2700
      expect(regFee).to.be.gt(certFee);
    });

    it("operator receives commission from registerAsset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);

      const opBalBefore = await f.ecosystem.pendingEth(f.operator.address);
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, f.operator.address, { value: regFee });
      const opBalAfter = await f.ecosystem.pendingEth(f.operator.address);

      expect(opBalAfter).to.be.gt(opBalBefore);
    });

    it("operator receives commission from transferAsset", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      const opBalBefore = await f.ecosystem.pendingEth(f.operator.address);
      await f.notary.connect(f.alice).transferAsset(1, f.bob.address, 0, "", f.operator.address, { value: xferFee });
      const opBalAfter = await f.ecosystem.pendingEth(f.operator.address);

      expect(opBalAfter).to.be.gt(opBalBefore);
    });

    it("operator receives commission from addAnnotation", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });

      const opBalBefore = await f.ecosystem.pendingEth(f.operator.address);
      await f.notary.connect(f.alice).addAnnotation(1, ANN_HIPOTECA, "", f.operator.address, { value: annFee });
      const opBalAfter = await f.ecosystem.pendingEth(f.operator.address);

      expect(opBalAfter).to.be.gt(opBalBefore);
    });

    it("zero operator sends operator share to buyback", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_LEGAL));

      const buybackBefore = await f.ecosystem.buybackAccumulated();
      await f.notary.connect(f.alice).certify(docHash("zero_op"), "", DOC_LEGAL, ZERO, { value: fee });
      const buybackAfter = await f.ecosystem.buybackAccumulated();

      expect(buybackAfter).to.be.gt(buybackBefore);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 14. EDGE CASES & STRESS TESTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("14. Edge Cases & Stress Tests", function () {
    it("certify with zero fee config succeeds with 0 ETH", async function () {
      const [deployer, treasury, , alice] = await ethers.getSigners();

      const BKCToken = await ethers.getContractFactory("contracts/BKCToken.sol:BKCToken");
      const bkc = await BKCToken.deploy(treasury.address);
      await bkc.waitForDeployment();

      const Ecosystem = await ethers.getContractFactory("contracts/BackchainEcosystem.sol:BackchainEcosystem");
      const eco2 = await Ecosystem.deploy(await bkc.getAddress(), treasury.address);
      await eco2.waitForDeployment();
      const eco2Addr = await eco2.getAddress();

      const Notary = await ethers.getContractFactory("contracts/Notary.sol:Notary");
      const notary2 = await Notary.deploy(eco2Addr, "https://backcoin.org/api/cert-metadata/");
      await notary2.waitForDeployment();
      const notary2Addr = await notary2.getAddress();

      await eco2.registerModule(notary2Addr, id("NOTARY"), {
        active: true, customBps: 0, operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500
      });

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

      for (let t = 0; t <= 9; t++) {
        const hash = docHash(`alice_multi_${t}`);
        const r = await f.notary.verify(hash);
        expect(r.exists).to.be.true;
        expect(r.docType).to.equal(t);
        expect(r.meta).to.equal(`type_${t}`);
      }
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

    it("certs mapping returns packed struct data (no boostExpiry)", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const hash = docHash("packed_struct");
      const fee = await computeFee(f.ecosystem, certifyActionId(DOC_CONTRACT));

      await f.notary.connect(f.alice).certify(hash, "", DOC_CONTRACT, ZERO, { value: fee });

      const cert = await f.notary.certs(hash);
      expect(cert.owner).to.equal(f.alice.address);
      expect(cert.timestamp).to.be.gt(0);
      expect(cert.docType).to.equal(DOC_CONTRACT);
    });

    it("large metadata string is stored correctly", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const fee = await computeFee(f.ecosystem, certifyActionId(0));
      const longMeta = "QmLoremIpsumDolorSitAmetConsecteturAdipiscingElitSedDoEiusmodTemporIncididuntUtLaboreEtDoloreMagnaAliquaUtEnimAdMinimVeniamQuisNostrud";

      const hash = docHash("long_meta");
      await f.notary.connect(f.alice).certify(hash, longMeta, 0, ZERO, { value: fee });

      expect((await f.notary.verify(hash)).meta).to.equal(longMeta);
    });

    it("getStats matches individual counters after mixed operations", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const certFee = await computeFee(f.ecosystem, certifyActionId(0));
      const transferFee = await computeFee(f.ecosystem, ACTION_TRANSFER);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      // Mix of operations
      await f.notary.connect(f.alice).certify(docHash("m1"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).registerAsset(ASSET_IMOVEL, "", ethers.ZeroHash, ZERO, { value: regFee });
      await f.notary.connect(f.alice).certify(docHash("m2"), "", 0, ZERO, { value: certFee });
      await f.notary.connect(f.alice).transferCertificate(docHash("m1"), f.bob.address, ZERO, { value: transferFee });
      await f.notary.connect(f.alice).transferAsset(2, f.bob.address, 0, "note", ZERO, { value: xferFee });
      await f.notary.connect(f.bob).addAnnotation(2, ANN_SEGURO, "Seguro", ZERO, { value: annFee });

      const stats = await f.notary.getStats();
      expect(stats[0]).to.equal(await f.notary.certCount());      // 3 (2 certs + 1 asset)
      expect(stats[1]).to.equal(await f.notary.totalTransfers());  // 2 (1 cert + 1 asset transfer)
      expect(stats[2]).to.equal(await f.notary.assetCount());      // 1
      expect(stats[3]).to.equal(await f.notary.annotationTotal()); // 2 (1 from transfer note + 1 manual)
    });

    it("complex scenario: register, annotate, transfer, annotate by new owner", async function () {
      const f = await loadFixture(deployNotaryFixture);
      const regFee = await computeFee(f.ecosystem, ACTION_ASSET_REGISTER);
      const xferFee = await computeFee(f.ecosystem, ACTION_ASSET_TRANSFER);
      const annFee = await computeFee(f.ecosystem, ACTION_ASSET_ANNOTATE);

      // Alice registers a property
      await f.notary.connect(f.alice).registerAsset(
        ASSET_IMOVEL,
        JSON.stringify({ desc: "Casa 3 quartos", address: "Rua X 100" }),
        docHash("escritura"),
        ZERO,
        { value: regFee }
      );

      // Alice adds mortgage annotation
      await f.notary.connect(f.alice).addAnnotation(1, ANN_HIPOTECA, "Hipoteca Banco Y, 300k", ZERO, { value: annFee });

      // Alice transfers to Bob with declared value
      await f.notary.connect(f.alice).transferAsset(
        1, f.bob.address, ethers.parseEther("500"), "Venda via cartório", ZERO, { value: xferFee }
      );

      // Bob is now the owner
      expect(await f.notary.ownerOf(1)).to.equal(f.bob.address);

      // Bob adds insurance annotation
      await f.notary.connect(f.bob).addAnnotation(1, ANN_SEGURO, "Seguro residencial ABC", ZERO, { value: annFee });

      // Check final state
      const asset = await f.notary.getAsset(1);
      expect(asset.owner).to.equal(f.bob.address);
      expect(asset.annotationCount).to.equal(3); // hipoteca + transfer note + seguro
      expect(asset.transferCount).to.equal(1);

      // Verify annotations
      const ann0 = await f.notary.getAnnotation(1, 0);
      expect(ann0.author).to.equal(f.alice.address);
      expect(ann0.annotationType).to.equal(ANN_HIPOTECA);

      const ann1 = await f.notary.getAnnotation(1, 1);
      expect(ann1.author).to.equal(f.alice.address);
      expect(ann1.annotationType).to.equal(ANN_OBSERVACAO); // transfer note

      const ann2 = await f.notary.getAnnotation(1, 2);
      expect(ann2.author).to.equal(f.bob.address);
      expect(ann2.annotationType).to.equal(ANN_SEGURO);
    });
  });
});
