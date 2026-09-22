const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const { createUser, createSeller, createProduct } = require('./helpers');

describe('DELETE /api/admin/sellers/:sellerId', () => {
  it('rejects a non-admin', async () => {
    const { token } = await createUser({ role: 'seller' });
    const res = await request(app).delete(`/api/admin/sellers/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a malformed or non-existent seller id', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });

    const malformed = await request(app).delete('/api/admin/sellers/not-a-valid-id').set('Authorization', `Bearer ${adminToken}`);
    expect(malformed.status).toBe(404);

    const missing = await request(app)
      .delete(`/api/admin/sellers/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);
  });

  it('deletes the seller, removes their products, and deactivates their user account', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { user: sellerUser, seller } = await createSeller();
    const { product: productA } = await createProduct({ sellerId: seller._id });
    const { product: productB } = await createProduct({ sellerId: seller._id });

    const res = await request(app).delete(`/api/admin/sellers/${seller._id}`).set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const sellerDoc = await Seller.findById(seller._id);
    expect(sellerDoc).toBeNull();

    const remainingProducts = await Product.countDocuments({ _id: { $in: [productA._id, productB._id] } });
    expect(remainingProducts).toBe(0);

    const userDoc = await User.findById(sellerUser._id);
    expect(userDoc).not.toBeNull();
    expect(userDoc.isActive).toBe(false);
  });

  it('does not touch products belonging to other sellers', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { seller: sellerToDelete } = await createSeller();
    const { seller: otherSeller } = await createSeller();
    const { product: keepThis } = await createProduct({ sellerId: otherSeller._id });

    await request(app).delete(`/api/admin/sellers/${sellerToDelete._id}`).set('Authorization', `Bearer ${adminToken}`);

    const stillThere = await Product.findById(keepThis._id);
    expect(stillThere).not.toBeNull();
  });
});
