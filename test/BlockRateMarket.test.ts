import { expect } from "chai";
import hre from "hardhat";

describe("BlockRateMarket", () => {
  const PRODUCT_ID = "BR-8829-TECH";
  const PRICE_ETH = "0.05";
  const STOCK = 10n;

  async function deployFixture() {
    const connection = await hre.network.connect();
    const { ethers } = connection;
    const [owner, seller, buyer, stranger] = await ethers.getSigners();
    const priceWei = ethers.parseEther(PRICE_ETH);

    const Market = await ethers.getContractFactory("BlockRateMarket");
    const market = await Market.deploy();

    return { ethers, market, priceWei, owner, seller, buyer, stranger };
  }

  describe("Deploy", () => {
    it("should set owner correctly", async () => {
      const { market, owner } = await deployFixture();
      expect(await market.owner()).to.equal(owner.address);
    });
  });

  describe("listProduct", () => {
    it("should list product and emit event", async () => {
      const { market, seller, priceWei } = await deployFixture();
      await expect(market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK))
        .to.emit(market, "ProductListed")
        .withArgs(PRODUCT_ID, seller.address, priceWei, STOCK);
    });

    it("should return correct product data", async () => {
      const { market, seller, priceWei } = await deployFixture();
      await market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK);

      const [sellerAddr, price, stock, totalSold, exists] = await market.getProduct(PRODUCT_ID);
      expect(sellerAddr).to.equal(seller.address);
      expect(price).to.equal(priceWei);
      expect(stock).to.equal(STOCK);
      expect(totalSold).to.equal(0n);
      expect(exists).to.be.true;
    });

    it("should revert on duplicate productId", async () => {
      const { market, seller, priceWei } = await deployFixture();
      await market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK);
      await expect(market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK))
        .to.be.revertedWithCustomError(market, "ProductAlreadyExists");
    });

    it("should revert if price is zero", async () => {
      const { market, seller } = await deployFixture();
      await expect(market.connect(seller).listProduct(PRODUCT_ID, 0n, STOCK))
        .to.be.revertedWith("Price must be > 0");
    });

    it("should revert if stock is zero", async () => {
      const { market, seller, priceWei } = await deployFixture();
      await expect(market.connect(seller).listProduct(PRODUCT_ID, priceWei, 0n))
        .to.be.revertedWith("Stock must be > 0");
    });
  });



  describe("isSeller & updateStock", () => {
    it("should identify seller correctly", async () => {
      const { market, seller, buyer, priceWei } = await deployFixture();
      await market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK);
      expect(await market.isSeller(PRODUCT_ID, seller.address)).to.be.true;
      expect(await market.isSeller(PRODUCT_ID, buyer.address)).to.be.false;
    });

    it("should allow seller to update stock", async () => {
      const { market, seller, priceWei } = await deployFixture();
      await market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK);
      await market.connect(seller).updateStock(PRODUCT_ID, 99n);
      const [, , stock] = await market.getProduct(PRODUCT_ID);
      expect(stock).to.equal(99n);
    });

    it("should revert if non-seller updates stock", async () => {
      const { market, seller, buyer, priceWei } = await deployFixture();
      await market.connect(seller).listProduct(PRODUCT_ID, priceWei, STOCK);
      await expect(market.connect(buyer).updateStock(PRODUCT_ID, 99n))
        .to.be.revertedWithCustomError(market, "NotSeller");
    });
  });
});
