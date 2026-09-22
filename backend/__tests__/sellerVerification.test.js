const request = require('supertest');
const app = require('../app');
const { createUser, createCategory } = require('./helpers');

const registerSeller = async () => {
  const { user, token } = await createUser({ role: 'seller' });
  const res = await request(app)
    .post('/api/sellers/register')
    .set('Authorization', `Bearer ${token}`)
    .send({ shopName: `Pending Shop ${Date.now()}${Math.random()}`, contact: '9811111111', location: 'Kathmandu' });
  return { user, token, sellerId: res.body.data.sellerId };
};

const approve = (sellerId, adminToken) =>
  request(app).put(`/api/verification/sellers/${sellerId}/approve`).set('Authorization', `Bearer ${adminToken}`).send({});

describe('Seller verification gate (pending sellers blocked from operations)', () => {
  it('a freshly registered seller profile defaults to pending', async () => {
    const { sellerId, token } = await registerSeller();
    const res = await request(app).get('/api/sellers/profile').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.verificationStatus).toBe('pending');
    expect(sellerId).toBeDefined();
  });

  it('blocks GET /sellers/dashboard for a pending seller with a clear message', async () => {
    const { token } = await registerSeller();
    const res = await request(app).get('/api/sellers/dashboard').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.verificationStatus).toBe('pending');
    expect(res.body.message).toMatch(/pending verification/i);
  });

  it('blocks adding a product for a pending seller', async () => {
    const { token } = await registerSeller();
    const category = await createCategory();

    const res = await request(app)
      .post('/api/sellers/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Should Not List', categoryId: category._id.toString(), price: 100, stock: 5 });

    expect(res.status).toBe(403);
    expect(res.body.verificationStatus).toBe('pending');
  });

  it('blocks listing seller products and orders for a pending seller', async () => {
    const { token } = await registerSeller();

    const productsRes = await request(app).get('/api/sellers/products').set('Authorization', `Bearer ${token}`);
    const ordersRes = await request(app).get('/api/sellers/orders').set('Authorization', `Bearer ${token}`);

    expect(productsRes.status).toBe(403);
    expect(ordersRes.status).toBe(403);
  });

  it('still allows a pending seller to view and edit their own profile', async () => {
    const { token } = await registerSeller();

    const getRes = await request(app).get('/api/sellers/profile').set('Authorization', `Bearer ${token}`);
    const putRes = await request(app)
      .put('/api/sellers/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated while pending' });

    expect(getRes.status).toBe(200);
    expect(putRes.status).toBe(200);
  });

  it('does not gate a seller account that has not created a profile yet (lets the 404 through)', async () => {
    const { token } = await createUser({ role: 'seller' });
    const res = await request(app).get('/api/sellers/dashboard').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/register as a seller/i);
  });

  it('allows all seller operations once an admin approves the seller', async () => {
    const { token, sellerId } = await registerSeller();
    const { token: adminToken } = await createUser({ role: 'admin' });
    const category = await createCategory();

    const approveRes = await approve(sellerId, adminToken);
    expect(approveRes.status).toBe(200);

    const dashboardRes = await request(app).get('/api/sellers/dashboard').set('Authorization', `Bearer ${token}`);
    expect(dashboardRes.status).toBe(200);

    const addProductRes = await request(app)
      .post('/api/sellers/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Now Allowed', categoryId: category._id.toString(), price: 100, stock: 5 });
    expect(addProductRes.status).toBe(201);

    const ordersRes = await request(app).get('/api/sellers/orders').set('Authorization', `Bearer ${token}`);
    expect(ordersRes.status).toBe(200);
  });
});
