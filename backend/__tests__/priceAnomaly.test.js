const mongoose = require('mongoose');
const PriceAnomalyEngine = require('../algorithms/priceAnomaly');
const MarketPrice = require('../models/MarketPrice');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { createSeller, createProduct, createCategory, createUser } = require('./helpers');

describe('PriceAnomalyEngine (Sprint 3, Ticket 3.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new PriceAnomalyEngine();
  });

  test('getPeerPrices returns [] for a product with no same-name peers', async () => {
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, name: 'Unique Widget', price: 100 });

    const peers = await engine.getPeerPrices(product._id);
    expect(peers).toEqual([]);
  });

  test('getPeerPrices finds same-name, same-category products from other sellers (case-insensitive), excluding itself', async () => {
    const category = await createCategory();
    const { seller: sellerA } = await createSeller();
    const { seller: sellerB } = await createSeller();
    const { seller: sellerC } = await createSeller();

    const { product: target } = await createProduct({ sellerId: sellerA._id, categoryId: category._id, name: 'Basmati Rice 5kg', price: 500 });
    await createProduct({ sellerId: sellerB._id, categoryId: category._id, name: 'basmati rice 5kg', price: 520 });
    await createProduct({ sellerId: sellerC._id, categoryId: category._id, name: 'BASMATI RICE 5KG', price: 480 });
    await createProduct({ sellerId: sellerB._id, categoryId: category._id, name: 'Something Else', price: 999 });

    const peers = await engine.getPeerPrices(target._id);
    expect(peers.sort((a, b) => a - b)).toEqual([480, 520]);
  });

  test('detectAnomaly reports insufficient data with fewer than 3 peers', async () => {
    const category = await createCategory();
    const { seller: sellerA } = await createSeller();
    const { seller: sellerB } = await createSeller();
    const { product: target } = await createProduct({ sellerId: sellerA._id, categoryId: category._id, name: 'Rare Spice', price: 1000 });
    await createProduct({ sellerId: sellerB._id, categoryId: category._id, name: 'Rare Spice', price: 100 });

    const result = await engine.detectAnomaly(target._id);
    expect(result.isAnomaly).toBe(false);
    expect(result.reason).toMatch(/not enough/i);
  });

  test('detectAnomaly flags a price far above its peers as an overpriced anomaly', async () => {
    const category = await createCategory();
    const sellers = await Promise.all(Array.from({ length: 5 }).map(() => createSeller()));

    // Four sellers cluster tightly around 100; one is wildly overpriced.
    const [s0, s1, s2, s3, s4] = sellers.map((s) => s.seller);
    await createProduct({ sellerId: s1._id, categoryId: category._id, name: 'Cooking Oil 1L', price: 100 });
    await createProduct({ sellerId: s2._id, categoryId: category._id, name: 'Cooking Oil 1L', price: 102 });
    await createProduct({ sellerId: s3._id, categoryId: category._id, name: 'Cooking Oil 1L', price: 98 });
    await createProduct({ sellerId: s4._id, categoryId: category._id, name: 'Cooking Oil 1L', price: 101 });
    const { product: overpriced } = await createProduct({ sellerId: s0._id, categoryId: category._id, name: 'Cooking Oil 1L', price: 300 });

    const result = await engine.detectAnomaly(overpriced._id);

    expect(result.isAnomaly).toBe(true);
    expect(result.direction).toBe('overpriced');
    expect(result.zScoreValue).toBeGreaterThan(2);
  });

  test('detectAnomaly does not flag a price within normal range of its peers', async () => {
    const category = await createCategory();
    const sellers = await Promise.all(Array.from({ length: 5 }).map(() => createSeller()));
    const [s0, s1, s2, s3, s4] = sellers.map((s) => s.seller);

    await createProduct({ sellerId: s1._id, categoryId: category._id, name: 'Green Tea 250g', price: 200 });
    await createProduct({ sellerId: s2._id, categoryId: category._id, name: 'Green Tea 250g', price: 210 });
    await createProduct({ sellerId: s3._id, categoryId: category._id, name: 'Green Tea 250g', price: 195 });
    await createProduct({ sellerId: s4._id, categoryId: category._id, name: 'Green Tea 250g', price: 205 });
    const { product: normal } = await createProduct({ sellerId: s0._id, categoryId: category._id, name: 'Green Tea 250g', price: 202 });

    const result = await engine.detectAnomaly(normal._id);
    expect(result.isAnomaly).toBe(false);
  });

  test('detectAnomaly returns a graceful non-anomaly result for a missing product', async () => {
    const result = await engine.detectAnomaly(new mongoose.Types.ObjectId());
    expect(result.isAnomaly).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });
});

describe('PriceAnomalyEngine - scanProduct / scanAllProducts (Sprint 3, Ticket 3.2)', () => {
  let engine;

  beforeAll(() => {
    engine = new PriceAnomalyEngine();
  });

  test('scanProduct skips a product with too few peers and creates no MarketPrice record', async () => {
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, name: 'Solo Product', price: 100 });

    const result = await engine.scanProduct(product._id);
    expect(result.scanned).toBe(false);

    const record = await MarketPrice.findOne({ productId: product._id });
    expect(record).toBeNull();
  });

  test('scanProduct creates a MarketPrice record with a computed averageMarketPrice and review_required status for an outlier', async () => {
    const category = await createCategory();
    const sellers = await Promise.all(Array.from({ length: 5 }).map(() => createSeller()));
    const [s0, s1, s2, s3, s4] = sellers.map((s) => s.seller);

    await createProduct({ sellerId: s1._id, categoryId: category._id, name: 'Instant Noodles', price: 50 });
    await createProduct({ sellerId: s2._id, categoryId: category._id, name: 'Instant Noodles', price: 52 });
    await createProduct({ sellerId: s3._id, categoryId: category._id, name: 'Instant Noodles', price: 48 });
    await createProduct({ sellerId: s4._id, categoryId: category._id, name: 'Instant Noodles', price: 51 });
    const { product: outlier } = await createProduct({ sellerId: s0._id, categoryId: category._id, name: 'Instant Noodles', price: 200 });

    const result = await engine.scanProduct(outlier._id);
    expect(result.scanned).toBe(true);
    expect(result.isAnomaly).toBe(true);

    const record = await MarketPrice.findById(result.priceId);
    expect(record.status).toBe('review_required');
    expect(record.averageMarketPrice).toBeCloseTo(50.25, 1);
    expect(record.history.length).toBe(1);
  });

  test('scanProduct preserves existing remarks/monitoredBy on an already-reviewed record while refreshing computed fields', async () => {
    const category = await createCategory();
    const sellers = await Promise.all(Array.from({ length: 5 }).map(() => createSeller()));
    const [s0, s1, s2, s3, s4] = sellers.map((s) => s.seller);
    const { user: officerUser } = await createUser({ role: 'officer' });
    const officer = await GovernmentOfficer.create({ userId: officerUser._id, department: 'Market Watch' });

    await createProduct({ sellerId: s1._id, categoryId: category._id, name: 'Bottled Water 1L', price: 20 });
    await createProduct({ sellerId: s2._id, categoryId: category._id, name: 'Bottled Water 1L', price: 21 });
    await createProduct({ sellerId: s3._id, categoryId: category._id, name: 'Bottled Water 1L', price: 19 });
    await createProduct({ sellerId: s4._id, categoryId: category._id, name: 'Bottled Water 1L', price: 20 });
    const { product } = await createProduct({ sellerId: s0._id, categoryId: category._id, name: 'Bottled Water 1L', price: 22 });

    await MarketPrice.create({
      productId: product._id,
      sellerId: s0._id,
      price: 22,
      averageMarketPrice: 20,
      status: 'normal',
      remarks: 'Reviewed and approved by officer',
      monitoredBy: officer._id,
    });

    const result = await engine.scanProduct(product._id);
    expect(result.scanned).toBe(true);

    const record = await MarketPrice.findById(result.priceId);
    expect(record.remarks).toBe('Reviewed and approved by officer');
    expect(record.monitoredBy.toString()).toBe(officer._id.toString());
  });

  test('scanAllProducts checks every active product and reports how many were flagged', async () => {
    const category = await createCategory();
    const sellers = await Promise.all(Array.from({ length: 5 }).map(() => createSeller()));
    const [s0, s1, s2, s3, s4] = sellers.map((s) => s.seller);

    await createProduct({ sellerId: s1._id, categoryId: category._id, name: 'Detergent Powder', price: 150 });
    await createProduct({ sellerId: s2._id, categoryId: category._id, name: 'Detergent Powder', price: 148 });
    await createProduct({ sellerId: s3._id, categoryId: category._id, name: 'Detergent Powder', price: 152 });
    await createProduct({ sellerId: s4._id, categoryId: category._id, name: 'Detergent Powder', price: 149 });
    await createProduct({ sellerId: s0._id, categoryId: category._id, name: 'Detergent Powder', price: 500 }); // outlier

    const result = await engine.scanAllProducts();

    expect(result.success).toBe(true);
    expect(result.flagged).toBeGreaterThanOrEqual(1);
    const flaggedRecords = await MarketPrice.countDocuments({ status: 'review_required' });
    expect(flaggedRecords).toBeGreaterThanOrEqual(1);
  });
});
