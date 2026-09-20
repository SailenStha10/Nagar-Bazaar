const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { createUser, createSeller, createProduct } = require('./helpers');

const validComplaint = (overrides = {}) => ({
  category: 'quality_issue',
  title: 'The product arrived damaged',
  description: 'The packaging was torn and the contents were spoiled on arrival.',
  ...overrides,
});

describe('POST /api/complaints', () => {
  it('rejects a request without a token', async () => {
    const res = await request(app).post('/api/complaints').send(validComplaint());

    expect(res.status).toBe(401);
  });

  it('rejects a non-customer role', async () => {
    const { token } = await createUser({ role: 'seller' });
    const { seller } = await createSeller();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ sellerId: seller._id.toString() }));

    expect(res.status).toBe(403);
  });

  it('rejects a title shorter than 10 characters', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ title: 'Too short', sellerId: seller._id.toString() }));

    expect(res.status).toBe(400);
  });

  it('rejects a description shorter than 20 characters', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ description: 'Too short', sellerId: seller._id.toString() }));

    expect(res.status).toBe(400);
  });

  it('rejects an invalid category', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ category: 'not-a-real-category', sellerId: seller._id.toString() }));

    expect(res.status).toBe(400);
  });

  it('rejects a complaint with neither sellerId nor productId', async () => {
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app).post('/api/complaints').set('Authorization', `Bearer ${token}`).send(validComplaint());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sellerId or productId/i);
  });

  it('rejects a complaint referencing a non-existent seller', async () => {
    const { token } = await createUser({ role: 'customer' });
    const fakeSellerId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ sellerId: fakeSellerId.toString() }));

    expect(res.status).toBe(400);
  });

  it('creates a complaint with valid data and generates a complaint number', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ sellerId: seller._id.toString() }));

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.complaintNumber).toMatch(/^NC-\d{4}-\d{5}$/);
  });

  it('accepts a complaint referencing a product instead of a seller', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id });

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send(validComplaint({ productId: product._id.toString() }));

    expect(res.status).toBe(201);
  });
});

describe('GET /api/complaints/citizen', () => {
  it('only returns complaints filed by the authenticated customer', async () => {
    const { token: tokenA } = await createUser({ role: 'customer' });
    const { token: tokenB } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    await request(app).post('/api/complaints').set('Authorization', `Bearer ${tokenA}`).send(validComplaint({ sellerId: seller._id.toString() }));

    const resA = await request(app).get('/api/complaints/citizen').set('Authorization', `Bearer ${tokenA}`);
    const resB = await request(app).get('/api/complaints/citizen').set('Authorization', `Bearer ${tokenB}`);

    expect(resA.body.data.length).toBe(1);
    expect(resB.body.data.length).toBe(0);
  });

  it('rejects a non-customer role', async () => {
    const { token } = await createUser({ role: 'officer' });

    const res = await request(app).get('/api/complaints/citizen').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/complaints (officer/admin listing)', () => {
  it('rejects a customer', async () => {
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app).get('/api/complaints').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows an officer to list all complaints', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: officerToken } = await createUser({ role: 'officer' });
    const { seller } = await createSeller();

    await request(app).post('/api/complaints').set('Authorization', `Bearer ${customerToken}`).send(validComplaint({ sellerId: seller._id.toString() }));

    const res = await request(app).get('/api/complaints').set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

describe('PUT /api/complaints/:complaintId/assign', () => {
  it('rejects an officer (admin-only action)', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: officerToken, user: officerUser } = await createUser({ role: 'officer' });
    const { seller } = await createSeller();

    const officer = await GovernmentOfficer.create({ userId: officerUser._id, department: 'Test Dept' });

    const createRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validComplaint({ sellerId: seller._id.toString() }));

    const res = await request(app)
      .put(`/api/complaints/${createRes.body.data.complaintId}/assign`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ officerId: officer._id.toString() });

    expect(res.status).toBe(403);
  });

  it('lets an admin assign a complaint to an officer, moving it to under_review', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { user: officerUser } = await createUser({ role: 'officer' });
    const { seller } = await createSeller();

    const officer = await GovernmentOfficer.create({ userId: officerUser._id, department: 'Test Dept' });

    const createRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validComplaint({ sellerId: seller._id.toString() }));

    const res = await request(app)
      .put(`/api/complaints/${createRes.body.data.complaintId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ officerId: officer._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('under_review');
    expect(res.body.data.assignedOfficer).toBe(officer._id.toString());
  });
});

describe('GET /api/complaints/:complaintId', () => {
  it('returns 404 for a malformed id', async () => {
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app).get('/api/complaints/not-a-valid-id').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when a customer requests another customer's complaint", async () => {
    const { token: owner } = await createUser({ role: 'customer' });
    const { token: intruder } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();

    const createRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${owner}`)
      .send(validComplaint({ sellerId: seller._id.toString() }));

    const res = await request(app)
      .get(`/api/complaints/${createRes.body.data.complaintId}`)
      .set('Authorization', `Bearer ${intruder}`);

    expect(res.status).toBe(404);
  });
});
