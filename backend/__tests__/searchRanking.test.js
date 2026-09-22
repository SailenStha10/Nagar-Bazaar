const SearchRankingEngine = require('../algorithms/searchRanking');
const { createSeller, createProduct, createUser } = require('./helpers');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');

let orderCounter = 0;

const purchase = async (userId, sellerId, product, quantity = 1) => {
  const order = await Order.create({
    userId,
    orderNumber: `SEARCH-${Date.now()}-${orderCounter++}`,
    totalAmount: product.price * quantity,
    deliveryAddress: 'Test Address, Kathmandu',
  });
  await OrderItem.create({ orderId: order._id, productId: product._id, quantity, price: product.price, sellerId });
};

describe('SearchRankingEngine - TF-IDF (Sprint 4, Ticket 4.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new SearchRankingEngine();
  });

  test('computeTfIdfScores gives every candidate 0 for an empty query', () => {
    const scores = engine.computeTfIdfScores('', [{ _id: 'a', name: 'Rice', description: '' }]);
    expect(scores.get('a')).toBe(0);
  });

  test('computeTfIdfScores ranks an exact/frequent term match above an unrelated product', () => {
    const candidates = [
      { _id: 'rice1', name: 'Basmati Rice 5kg', description: 'Premium long grain rice' },
      { _id: 'soap1', name: 'Handmade Soap', description: 'Lavender scented soap bar' },
    ];
    const scores = engine.computeTfIdfScores('rice', candidates);
    expect(scores.get('rice1')).toBeGreaterThan(scores.get('soap1'));
    expect(scores.get('rice1')).toBe(1); // normalized against the max
  });

  test('computeTfIdfScores rewards a rarer term more than a common one shared by every candidate', () => {
    const candidates = [
      { _id: 'a', name: 'Organic Gundruk', description: 'Fermented leafy greens' },
      { _id: 'b', name: 'Organic Honey', description: 'Pure mountain honey' },
      { _id: 'c', name: 'Organic Ghee', description: 'Clarified butter' },
    ];
    // "organic" appears in every doc (low IDF), "gundruk" is rare (high IDF)
    const scores = engine.computeTfIdfScores('organic gundruk', candidates);
    expect(scores.get('a')).toBeGreaterThan(scores.get('b'));
    expect(scores.get('a')).toBeGreaterThan(scores.get('c'));
  });
});

describe('SearchRankingEngine - Popularity / Recency (Sprint 4, Ticket 4.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new SearchRankingEngine();
  });

  test('getPopularityScore is higher for a product with more sales and reviews', async () => {
    const { user: customer } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: popular } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: quiet } = await createProduct({ sellerId: seller._id, price: 100 });

    await purchase(customer._id, seller._id, popular, 3);
    await Review.create({ productId: popular._id, userId: customer._id, rating: 5 });

    const popularScore = await engine.getPopularityScore(popular._id);
    const quietScore = await engine.getPopularityScore(quiet._id);

    expect(popularScore.score).toBeGreaterThan(quietScore.score);
  });

  test('getRecencyScore decays with age', () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now - 400 * 24 * 60 * 60 * 1000);

    expect(engine.getRecencyScore(fiveDaysAgo)).toBe(1.0);
    expect(engine.getRecencyScore(oneYearAgo)).toBe(0);
  });
});

describe('SearchRankingEngine - rankProducts (Sprint 4, Ticket 4.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new SearchRankingEngine();
  });

  test('rankProducts returns [] for an empty product list', async () => {
    const ranked = await engine.rankProducts('rice', []);
    expect(ranked).toEqual([]);
  });

  test('rankProducts sorts by the combined final score, best match first', async () => {
    const { seller } = await createSeller();
    const { product: strongMatch } = await createProduct({ sellerId: seller._id, name: 'Basmati Rice 5kg', description: 'Basmati Rice', price: 500 });
    const { product: weakMatch } = await createProduct({ sellerId: seller._id, name: 'Cooking Oil', description: 'Goes well with rice dishes', price: 300 });

    const ranked = await engine.rankProducts('rice', [weakMatch, strongMatch]);

    expect(ranked[0].product._id.toString()).toBe(strongMatch._id.toString());
    expect(ranked[0].scores.final).toBeGreaterThan(ranked[1].scores.final);
  });
});

describe('SearchRankingEngine - getSearchSuggestions (Sprint 4, Ticket 4.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new SearchRankingEngine();
  });

  test('returns [] for an empty prefix', async () => {
    const suggestions = await engine.getSearchSuggestions('');
    expect(suggestions).toEqual([]);
  });

  test('returns unique, prefix-matching, active product names only', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Gundruk Pickle', price: 100 });
    await createProduct({ sellerId: seller._id, name: 'gundruk Powder', price: 120 });
    await createProduct({ sellerId: seller._id, name: 'Rice', price: 200 });
    await createProduct({ sellerId: seller._id, name: 'Gundruk Soup Mix', price: 90, isActive: false });

    const suggestions = await engine.getSearchSuggestions('gund', 10);

    expect(suggestions).toContain('Gundruk Pickle');
    expect(suggestions).toContain('gundruk Powder');
    expect(suggestions).not.toContain('Rice');
    expect(suggestions).not.toContain('Gundruk Soup Mix');
  });
});
