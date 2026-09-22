const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const MarketPrice = require('../models/MarketPrice');
const { createUser, createSeller, createProduct, createCategory } = require('./helpers');

describe('POST /api/market-monitoring/scan (Sprint 3, Ticket 3.3)', () => {
  it('rejects a customer', async () => {
    const { token } = await createUser({ role: 'customer' });
    const res = await request(app).post('/api/market-monitoring/scan').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('scans active products and flags an outlier as review_required', async () => {
    const { token } = await createUser({ role: 'admin' });
    const category = await createCategory();
    const sellers = await Promise.all(Array.from({ length: 5 }).map(() => createSeller()));
    const [s0, s1, s2, s3, s4] = sellers.map((s) => s.seller);

    await createProduct({ sellerId: s1._id, categoryId: category._id, name: 'Sunflower Oil 1L', price: 300 });
    await createProduct({ sellerId: s2._id, categoryId: category._id, name: 'Sunflower Oil 1L', price: 310 });
    await createProduct({ sellerId: s3._id, categoryId: category._id, name: 'Sunflower Oil 1L', price: 290 });
    await createProduct({ sellerId: s4._id, categoryId: category._id, name: 'Sunflower Oil 1L', price: 305 });
    await createProduct({ sellerId: s0._id, categoryId: category._id, name: 'Sunflower Oil 1L', price: 900 });

    const res = await request(app).post('/api/market-monitoring/scan').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.flagged).toBeGreaterThanOrEqual(1);

    const flagged = await MarketPrice.findOne({ sellerId: s0._id, status: 'review_required' });
    expect(flagged).toBeTruthy();
  });
});

describe('GET /api/market-monitoring/products/:productId/anomaly', () => {
  it('rejects a customer', async () => {
    const { token } = await createUser({ role: 'customer' });
    const res = await request(app)
      .get(`/api/market-monitoring/products/${new mongoose.Types.ObjectId()}/anomaly`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent product', async () => {
    const { token } = await createUser({ role: 'officer' });
    const res = await request(app)
      .get(`/api/market-monitoring/products/${new mongoose.Types.ObjectId()}/anomaly`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('is read-only: does not create a MarketPrice record', async () => {
    const { token } = await createUser({ role: 'officer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, name: 'Standalone Product', price: 100 });

    const res = await request(app)
      .get(`/api/market-monitoring/products/${product._id}/anomaly`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isAnomaly).toBe(false);

    const record = await MarketPrice.findOne({ productId: product._id });
    expect(record).toBeNull();
  });
});
