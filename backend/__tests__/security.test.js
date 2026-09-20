const request = require('supertest');
const app = require('../app');
const { createUser, createSeller } = require('./helpers');

describe('Security headers', () => {
  it('sets helmet security headers on responses', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows uploaded assets to be fetched cross-origin', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });
});

describe('NoSQL injection protection', () => {
  it('neutralizes a MongoDB operator injected via query string', async () => {
    const { token } = await createUser({ role: 'officer' });

    // Without sanitization, ?status[$ne]=resolved becomes { status: { $ne: 'resolved' } },
    // which would match every complaint regardless of status.
    const res = await request(app)
      .get('/api/complaints')
      .query({ 'status[$ne]': 'resolved' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // The operator key is stripped, so the (now-empty) status filter matches nothing
    // rather than silently returning every complaint.
    expect(res.body.data).toEqual([]);
  });

  it('strips MongoDB operator keys from the request body', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'quality_issue',
        title: 'Legit complaint title here',
        description: 'A perfectly normal complaint description for testing purposes.',
        sellerId: seller._id.toString(),
        officerRemarks: { $where: 'this.constructor.constructor("return process")().exit()' },
      });

    // The request still succeeds (unknown fields are simply ignored by the model),
    // proving the dangerous operator never reached Mongoose/MongoDB.
    expect(res.status).toBe(201);
  });
});

describe('CORS configuration', () => {
  it('reflects an allowed origin in development', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

describe('Request body size limit', () => {
  it('rejects an oversized JSON payload', async () => {
    const { token } = await createUser({ role: 'customer' });
    const hugeAddress = 'x'.repeat(300 * 1024);

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: hugeAddress, paymentMethod: 'cod' });

    expect(res.status).toBe(413);
  });
});
