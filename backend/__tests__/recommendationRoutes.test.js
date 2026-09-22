const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { createUser, createSeller, createProduct } = require('./helpers');

let orderCounter = 0;

const createOrderForProducts = async (userId, sellerId, products) => {
  const order = await Order.create({
    userId,
    orderNumber: `RTEST-${Date.now()}-${orderCounter++}`,
    totalAmount: products.reduce((sum, p) => sum + p.price, 0),
    deliveryAddress: 'Test Address, Kathmandu',
  });

  await OrderItem.insertMany(
    products.map((p) => ({ orderId: order._id, productId: p._id, quantity: 1, price: p.price, sellerId }))
  );

  return order;
};

describe('GET /api/recommendations/:userId (Sprint 1, Ticket 1.4)', () => {
  it('rejects a request without a token', async () => {
    const res = await request(app).get(`/api/recommendations/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });

  it('rejects a malformed userId', async () => {
    const { token } = await createUser({ role: 'customer' });
    const res = await request(app).get('/api/recommendations/not-a-valid-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("rejects a customer requesting another customer's recommendations", async () => {
    const { token } = await createUser({ role: 'customer' });
    const { user: otherUser } = await createUser({ role: 'customer' });

    const res = await request(app)
      .get(`/api/recommendations/${otherUser._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows an admin to fetch any user\'s recommendations', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { user: customer } = await createUser({ role: 'customer' });

    const res = await request(app)
      .get(`/api/recommendations/${customer._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns hybrid recommendations for the authenticated user', async () => {
    const { token, user: targetUser } = await createUser({ role: 'customer' });
    const { user: similarUser } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product: shared, category } = await createProduct({ sellerId: seller._id, price: 100 });
    const { product: contentPick } = await createProduct({ sellerId: seller._id, categoryId: category._id, price: 105 });

    await createOrderForProducts(targetUser._id, seller._id, [shared]);
    await createOrderForProducts(similarUser._id, seller._id, [shared, contentPick]);

    const res = await request(app)
      .get(`/api/recommendations/${targetUser._id}?limit=5`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);

    // Product shape must match what ProductCard (frontend) expects, i.e. the
    // same formatListItem() shape used by /api/products/search.
    const entry = res.body.data[0];
    expect(entry.product).toMatchObject({
      _id: expect.any(String),
      name: expect.any(String),
      price: expect.any(Number),
      seller: { shopName: expect.any(String) },
    });
    expect(entry.product).toHaveProperty('ratings');
    expect(entry.product).toHaveProperty('discountedPrice');
  });
});

describe('GET /api/recommendations/:userId/collaborative and /content', () => {
  it('rejects access to another user\'s collaborative recommendations', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { user: otherUser } = await createUser({ role: 'customer' });

    const res = await request(app)
      .get(`/api/recommendations/${otherUser._id}/collaborative`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns content-based recommendations for the authenticated user', async () => {
    const { token, user } = await createUser({ role: 'customer' });

    const res = await request(app)
      .get(`/api/recommendations/${user._id}/content`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
