import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("BKCToken", function () {
  const MAX_SUPPLY = ethers.parseEther("200000000"); // 200M

  async function deployFixture() {
    const [owner, user1, user2, attacker] = await ethers.getSigners();

    const BKCToken = await ethers.getContractFactory("BKCToken");
    const bkc = await upgrades.deployProxy(BKCToken, [owner.address], {
      kind: "uups",
    });
    await bkc.waitForDeployment();

    return { bkc, owner, user1, user2, attacker };
  }

  // ===========================================================================
  //  INITIALIZATION
  // ===========================================================================

  describe("Initialization", function () {
    it("sets correct name and symbol", async function () {
      const { bkc } = await loadFixture(deployFixture);
      expect(await bkc.name()).to.equal("Backcoin");
      expect(await bkc.symbol()).to.equal("BKC");
    });

    it("sets owner correctly", async function () {
      const { bkc, owner } = await loadFixture(deployFixture);
      expect(await bkc.owner()).to.equal(owner.address);
    });

    it("starts with 0 total supply", async function () {
      const { bkc } = await loadFixture(deployFixture);
      expect(await bkc.totalSupply()).to.equal(0n);
    });

    it("MAX_SUPPLY is 200M", async function () {
      const { bkc } = await loadFixture(deployFixture);
      expect(await bkc.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("cannot initialize twice", async function () {
      const { bkc, owner } = await loadFixture(deployFixture);
      await expect(bkc.initialize(owner.address)).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });
  });

  // ===========================================================================
  //  MINTING
  // ===========================================================================

  describe("Minting", function () {
    it("owner can mint tokens", async function () {
      const { bkc, owner, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await expect(bkc.mint(user1.address, amount))
        .to.emit(bkc, "TokensMinted")
        .withArgs(user1.address, amount, amount);

      expect(await bkc.balanceOf(user1.address)).to.equal(amount);
      expect(await bkc.totalSupply()).to.equal(amount);
    });

    it("reverts when non-owner tries to mint", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await expect(
        bkc.connect(user1).mint(user1.address, ethers.parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts when minting to zero address", async function () {
      const { bkc } = await loadFixture(deployFixture);
      await expect(
        bkc.mint(ethers.ZeroAddress, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(bkc, "ZeroAddress");
    });

    it("reverts when minting zero amount", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await expect(
        bkc.mint(user1.address, 0)
      ).to.be.revertedWithCustomError(bkc, "ZeroAmount");
    });

    it("reverts when exceeding MAX_SUPPLY", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      const excess = MAX_SUPPLY + 1n;
      await expect(bkc.mint(user1.address, excess)).to.be.revertedWithCustomError(
        bkc,
        "MaxSupplyExceeded"
      );
    });

    it("allows minting up to exactly MAX_SUPPLY", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await bkc.mint(user1.address, MAX_SUPPLY);
      expect(await bkc.totalSupply()).to.equal(MAX_SUPPLY);
      expect(await bkc.remainingMintableSupply()).to.equal(0);
    });

    it("reverts minting 1 wei after MAX_SUPPLY reached", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await bkc.mint(user1.address, MAX_SUPPLY);
      await expect(bkc.mint(user1.address, 1)).to.be.revertedWithCustomError(
        bkc,
        "MaxSupplyExceeded"
      );
    });

    describe("mintBatch", function () {
      it("mints to multiple recipients", async function () {
        const { bkc, user1, user2 } = await loadFixture(deployFixture);
        const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];

        await bkc.mintBatch([user1.address, user2.address], amounts);

        expect(await bkc.balanceOf(user1.address)).to.equal(amounts[0]);
        expect(await bkc.balanceOf(user2.address)).to.equal(amounts[1]);
        expect(await bkc.totalSupply()).to.equal(amounts[0] + amounts[1]);
      });

      it("reverts on array length mismatch", async function () {
        const { bkc, user1 } = await loadFixture(deployFixture);
        await expect(
          bkc.mintBatch([user1.address], [ethers.parseEther("1"), ethers.parseEther("2")])
        ).to.be.revertedWithCustomError(bkc, "ArrayLengthMismatch");
      });

      it("reverts if batch exceeds MAX_SUPPLY", async function () {
        const { bkc, user1, user2 } = await loadFixture(deployFixture);
        const half = MAX_SUPPLY / 2n;
        const overHalf = half + 1n;
        await expect(
          bkc.mintBatch([user1.address, user2.address], [half, overHalf])
        ).to.be.revertedWithCustomError(bkc, "MaxSupplyExceeded");
      });

      it("skips zero-amount entries without reverting", async function () {
        const { bkc, user1, user2 } = await loadFixture(deployFixture);
        await bkc.mintBatch(
          [user1.address, user2.address],
          [ethers.parseEther("100"), 0]
        );
        expect(await bkc.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
        expect(await bkc.balanceOf(user2.address)).to.equal(0);
      });
    });
  });

  // ===========================================================================
  //  BURNING
  // ===========================================================================

  describe("Burning", function () {
    async function mintedFixture() {
      const base = await deployFixture();
      const amount = ethers.parseEther("1000");
      await base.bkc.mint(base.user1.address, amount);
      return { ...base, mintedAmount: amount };
    }

    it("burn reduces balance, supply, and tracks totalBurned", async function () {
      const { bkc, user1, mintedAmount } = await loadFixture(mintedFixture);
      const burnAmount = ethers.parseEther("300");

      await expect(bkc.connect(user1).burn(burnAmount))
        .to.emit(bkc, "TokensBurned")
        .withArgs(user1.address, burnAmount, mintedAmount - burnAmount, burnAmount);

      expect(await bkc.balanceOf(user1.address)).to.equal(mintedAmount - burnAmount);
      expect(await bkc.totalSupply()).to.equal(mintedAmount - burnAmount);
      expect(await bkc.totalBurned()).to.equal(burnAmount);
    });

    it("reverts when burning zero", async function () {
      const { bkc, user1 } = await loadFixture(mintedFixture);
      await expect(
        bkc.connect(user1).burn(0)
      ).to.be.revertedWithCustomError(bkc, "ZeroAmount");
    });

    it("reverts when burning more than balance", async function () {
      const { bkc, user1, mintedAmount } = await loadFixture(mintedFixture);
      await expect(
        bkc.connect(user1).burn(mintedAmount + 1n)
      ).to.be.revertedWithCustomError(bkc, "InsufficientBalance");
    });

    it("burn restores mintable supply", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await bkc.mint(user1.address, MAX_SUPPLY);
      expect(await bkc.remainingMintableSupply()).to.equal(0);

      const burnAmount = ethers.parseEther("1000");
      await bkc.connect(user1).burn(burnAmount);

      // After burn, supply decreased, so mintable increased
      expect(await bkc.remainingMintableSupply()).to.equal(burnAmount);
    });

    describe("burnFrom", function () {
      it("burns with allowance and updates totalBurned", async function () {
        const { bkc, user1, user2, mintedAmount } = await loadFixture(mintedFixture);
        const burnAmount = ethers.parseEther("200");

        await bkc.connect(user1).approve(user2.address, burnAmount);
        await bkc.connect(user2).burnFrom(user1.address, burnAmount);

        expect(await bkc.balanceOf(user1.address)).to.equal(mintedAmount - burnAmount);
        expect(await bkc.totalBurned()).to.equal(burnAmount);
      });

      it("reverts without sufficient allowance", async function () {
        const { bkc, user1, user2 } = await loadFixture(mintedFixture);
        await expect(
          bkc.connect(user2).burnFrom(user1.address, ethers.parseEther("1"))
        ).to.be.revertedWithCustomError(bkc, "InsufficientAllowance");
      });

      it("reverts when burning from zero address", async function () {
        const { bkc } = await loadFixture(mintedFixture);
        await expect(
          bkc.burnFrom(ethers.ZeroAddress, ethers.parseEther("1"))
        ).to.be.revertedWithCustomError(bkc, "ZeroAddress");
      });
    });
  });

  // ===========================================================================
  //  A-02 FIX: BLACKLIST REMOVED
  // ===========================================================================

  describe("Censorship Resistance (A-02)", function () {
    it("blacklist functions do not exist on contract", async function () {
      const { bkc } = await loadFixture(deployFixture);
      // Verify blacklist functions were removed from the ABI
      expect(bkc.setBlacklist).to.be.undefined;
      expect(bkc.setBlacklistBatch).to.be.undefined;
      expect(bkc.isBlacklisted).to.be.undefined;
    });

    it("any address can freely transfer tokens", async function () {
      const { bkc, user1, user2 } = await loadFixture(deployFixture);
      await bkc.mint(user1.address, ethers.parseEther("1000"));

      // Transfers work without any censorship
      await bkc.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      expect(await bkc.balanceOf(user2.address)).to.equal(ethers.parseEther("500"));
    });
  });

  // ===========================================================================
  //  VIEW FUNCTIONS
  // ===========================================================================

  describe("View Functions", function () {
    it("remainingMintableSupply decreases with minting", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      const minted = ethers.parseEther("50000000"); // 50M
      await bkc.mint(user1.address, minted);
      expect(await bkc.remainingMintableSupply()).to.equal(MAX_SUPPLY - minted);
    });

    it("getTokenStats returns correct values", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      const minted = ethers.parseEther("1000");
      await bkc.mint(user1.address, minted);

      const burnAmount = ethers.parseEther("100");
      await bkc.connect(user1).burn(burnAmount);

      const stats = await bkc.getTokenStats();
      expect(stats.maxSupply).to.equal(MAX_SUPPLY);
      expect(stats.currentSupply).to.equal(minted - burnAmount);
      expect(stats.mintable).to.equal(MAX_SUPPLY - minted + burnAmount);
      expect(stats.burned).to.equal(burnAmount);
    });

    it("mintedPercentage is correct", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      // Mint 20% of MAX_SUPPLY = 40M
      await bkc.mint(user1.address, ethers.parseEther("40000000"));
      expect(await bkc.mintedPercentage()).to.equal(2000n); // 20% = 2000 bips
    });

    it("getBurnStats calculates percentages", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await bkc.mint(user1.address, ethers.parseEther("1000"));
      await bkc.connect(user1).burn(ethers.parseEther("500"));

      const stats = await bkc.getBurnStats();
      expect(stats.burnedTotal).to.equal(ethers.parseEther("500"));
      // 500 burned / 1000 total ever minted = 50% = 5000 bips
      expect(stats.burnedPercentage).to.equal(5000n);
    });

    it("circulatingSupply equals totalSupply", async function () {
      const { bkc, user1 } = await loadFixture(deployFixture);
      await bkc.mint(user1.address, ethers.parseEther("1000"));
      expect(await bkc.circulatingSupply()).to.equal(await bkc.totalSupply());
    });
  });
});
