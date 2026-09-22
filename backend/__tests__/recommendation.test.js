const mongoose = require('mongoose');
const RecommendationEngine = require('../algorithms/recommendation');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
require('../models/Review');
const { createUser, createSeller, createProduct } = require('./helpers');

let orderCounter = 0;

const createOrderForProducts = async (userId, sellerId, products) => {
  const order = await Order.create({
    userId,
    orderNumber: `TEST-${Date.now()}-${orderCounter++}`,
    totalAmount: products.reduce((sum, p) => sum + p.price, 0),
    deliveryAddress: 'Test Address, Kathmandu',
  });

  await OrderItem.insertMany(
    products.map((p) => ({
      orderId: order._id,
      productId: p._id,
      quantity: 1,
      price: p.price,
      sellerId,
    }))
  );

  return order;
};

describe('RecommendationEngine - Collaborative Filtering (Sprint 1, Ticket 1.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new RecommendationEngine();
  });

  test('getUserPurchaseVector returns [] for a user with no orders', async () => {
    const { user } = await createUser({ role: 'customer' });
    const vector = await engine.getUserPurchaseVector(user._id);
    expect(vector).toEqual([]);
  });

  test('getUserPurchaseVector returns the distinct product ids a user has ordered', async () => {
    const { user } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: productA } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: productB } = await createProduct({ sellerId: seller._id, price: 200 });

    await createOrderForProducts(user._id, seller._id, [productA, productB]);

    const vector = await engine.getUserPurchaseVector(user._id);
    expect(vector.sort()).toEqual([productA._id.toString(), productB._id.toString()].sort());
  });

  test('getUserSimilarity is 1 for two users with identical purchases', async () => {
    const { user: userA } = await createUser({ role: 'customer' });
    const { user: userB } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, price: 100 });

    await createOrderForProducts(userA._id, seller._id, [product]);
    await createOrderForProducts(userB._id, seller._id, [product]);

    const similarity = await engine.getUserSimilarity(userA._id, userB._id);
    expect(similarity).toBeCloseTo(1);
  });

  test('getUserSimilarity is 0 for two users with disjoint purchases', async () => {
    const { user: userA } = await createUser({ role: 'customer' });
    const { user: userB } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: productA } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: productB } = await createProduct({ sellerId: seller._id, price: 100 });

    await createOrderForProducts(userA._id, seller._id, [productA]);
    await createOrderForProducts(userB._id, seller._id, [productB]);

    const similarity = await engine.getUserSimilarity(userA._id, userB._id);
    expect(similarity).toBe(0);
  });

  test('getUserSimilarity is 0 when neither user has purchases', async () => {
    const { user: userA } = await createUser({ role: 'customer' });
    const { user: userB } = await createUser({ role: 'customer' });

    const similarity = await engine.getUserSimilarity(userA._id, userB._id);
    expect(similarity).toBe(0);
  });

  test('getCollaborativeRecommendations recommends products a similar user bought that this user has not', async () => {
    const { user: targetUser } = await createUser({ role: 'customer' });
    const { user: similarUser } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: shared } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: newForTarget } = await createProduct({ sellerId: seller._id, price: 150 });

    // Both users buy the shared product, making them similar
    await createOrderForProducts(targetUser._id, seller._id, [shared]);
    // The similar user also bought a second product the target user hasn't
    await createOrderForProducts(similarUser._id, seller._id, [shared, newForTarget]);

    const result = await engine.getCollaborativeRecommendations(targetUser._id, 5);

    expect(result.recommendations.length).toBeGreaterThan(0);
    const recommendedIds = result.recommendations.map((r) => r.productId);
    expect(recommendedIds).toContain(newForTarget._id.toString());
    expect(recommendedIds).not.toContain(shared._id.toString());
    expect(result.recommendations[0].method).toBe('collaborative');
  });

  test('getCollaborativeRecommendations returns [] when no other users overlap', async () => {
    const { user: targetUser } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, price: 100 });

    await createOrderForProducts(targetUser._id, seller._id, [product]);

    const result = await engine.getCollaborativeRecommendations(targetUser._id, 5);
    expect(result.recommendations).toEqual([]);
  });
});

describe('RecommendationEngine - Content-Based Filtering (Sprint 1, Ticket 1.2)', () => {
  let engine;

  beforeAll(() => {
    engine = new RecommendationEngine();
  });

  test('getProductFeatureVector returns null for a missing product', async () => {
    const features = await engine.getProductFeatureVector(new mongoose.Types.ObjectId());
    expect(features).toBeNull();
  });

  test('getProductFeatureVector reads category, price, seller, isLocal and average rating', async () => {
    const { seller } = await createSeller();
    const { product, category } = await createProduct({ sellerId: seller._id, price: 250 });
    const { user: reviewer } = await createUser({ role: 'customer' });

    await mongoose.model('Review').create({ productId: product._id, userId: reviewer._id, rating: 4 });
    await mongoose.model('Review').create({ productId: product._id, userId: reviewer._id, rating: 2 });

    const features = await engine.getProductFeatureVector(product._id);

    expect(features.category).toBe(category._id.toString());
    expect(features.price).toBe(250);
    expect(features.seller).toBe(seller._id.toString());
    expect(features.rating).toBe(3); // average of 4 and 2
  });

  test('getProductSimilarity is 1 for a product compared with itself', async () => {
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, price: 100 });

    const similarity = await engine.getProductSimilarity(product._id, product._id);
    expect(similarity).toBeCloseTo(1);
  });

  test('getProductSimilarity is lower for products with different category, price, and seller', async () => {
    const { seller: sellerA } = await createSeller();
    const { seller: sellerB } = await createSeller();
    const { product: productA } = await createProduct({ sellerId: sellerA._id, price: 100 });
    const { product: productB } = await createProduct({ sellerId: sellerB._id, price: 900 });

    const similarity = await engine.getProductSimilarity(productA._id, productB._id);
    expect(similarity).toBeLessThan(1);
    expect(similarity).toBeGreaterThanOrEqual(0);
  });

  test('getContentBasedRecommendations returns a reason when the user has no purchase history', async () => {
    const { user } = await createUser({ role: 'customer' });
    const result = await engine.getContentBasedRecommendations(user._id, 5);

    expect(result.recommendations).toEqual([]);
    expect(result.reason).toMatch(/no purchase history/i);
  });

  test('getContentBasedRecommendations ranks products in the same category above unrelated ones', async () => {
    const { user } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: purchased, category } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: sameCategory } = await createProduct({ sellerId: seller._id, categoryId: category._id, price: 110 });
    const { product: differentCategory } = await createProduct({ sellerId: seller._id, price: 5000 });

    await createOrderForProducts(user._id, seller._id, [purchased]);

    const result = await engine.getContentBasedRecommendations(user._id, 5);
    const ids = result.recommendations.map((r) => r.productId);

    expect(ids).toContain(sameCategory._id.toString());
    expect(ids).toContain(differentCategory._id.toString());
    expect(ids.indexOf(sameCategory._id.toString())).toBeLessThan(ids.indexOf(differentCategory._id.toString()));
    expect(ids).not.toContain(purchased._id.toString());
  });
});

describe('RecommendationEngine - Hybrid (Sprint 1, Ticket 1.3)', () => {
  let engine;

  beforeAll(() => {
    engine = new RecommendationEngine();
  });

  test('normalizeScores divides every score by the max, and returns {} for an empty list', () => {
    expect(RecommendationEngine.normalizeScores([])).toEqual({});

    const normalized = RecommendationEngine.normalizeScores([
      { productId: 'a', score: 4 },
      { productId: 'b', score: 2 },
    ]);
    expect(normalized).toEqual({ a: 1, b: 0.5 });
  });

  test('getHybridRecommendations returns [] with zeroed stats for a brand new user', async () => {
    const { user } = await createUser({ role: 'customer' });
    const result = await engine.getHybridRecommendations(user._id, 10);

    expect(result.recommendations).toEqual([]);
    expect(result.stats.totalProcessed).toBe(0);
  });

  test('getHybridRecommendations attaches product details and a score that is the 0.4/0.6 weighted blend', async () => {
    const { user: targetUser } = await createUser({ role: 'customer' });
    const { user: similarUser } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: shared, category } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: collabPick } = await createProduct({ sellerId: seller._id, price: 500 });
    const { product: contentPick } = await createProduct({ sellerId: seller._id, categoryId: category._id, price: 105 });

    // targetUser and similarUser both buy `shared`, making them collaboratively similar;
    // similarUser also bought collabPick, which becomes a collaborative candidate.
    await createOrderForProducts(targetUser._id, seller._id, [shared]);
    await createOrderForProducts(similarUser._id, seller._id, [shared, collabPick]);

    const result = await engine.getHybridRecommendations(targetUser._id, 10);
    const ids = result.recommendations.map((r) => r.productId);

    // contentPick shares a category with `shared` (the only purchase), so it should surface via content scoring
    expect(ids).toContain(contentPick._id.toString());
    expect(ids).toContain(collabPick._id.toString());

    for (const rec of result.recommendations) {
      const expected = 0.4 * rec.collaborativeScore + 0.6 * rec.contentScore;
      expect(Math.abs(rec.hybridScore - expected)).toBeLessThan(0.01);
      expect(rec.product).toBeDefined();
      expect(rec.product._id.toString()).toBe(rec.productId);
    }
  });

  test('getHybridRecommendations completes in under 5 seconds (Sprint 1 performance target)', async () => {
    const { user } = await createUser({ role: 'customer' });
    const result = await engine.getHybridRecommendations(user._id, 10);
    expect(result.executionTime).toBeLessThan(5000);
  });
});
