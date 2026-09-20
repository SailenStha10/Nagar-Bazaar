const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { createUser, createSeller, createProduct } = require('./helpers');

const addToCart = (token, productId, quantity = 1) =>
  request(app).post('/api/cart/add').set('Authorization', `Bearer ${token}`).send({ productId, quantity });

describe('POST /api/orders/checkout', () => {
  it('rejects a request without a token', async () => {
    const res = await request(app).post('/api/orders/checkout').send({ deliveryAddress: 'Somewhere', paymentMethod: 'cod' });

    expect(res.status).toBe(401);
  });

  it('rejects checkout with an empty cart', async () => {
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: 'Baneshwor, Kathmandu', paymentMethod: 'cod' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it('rejects an invalid payment method', async () => {
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: 'Baneshwor, Kathmandu', paymentMethod: 'bitcoin' });

    expect(res.status).toBe(400);
  });

  it('rejects a delivery address that is too short', async () => {
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: 'Hi', paymentMethod: 'cod' });

    expect(res.status).toBe(400);
  });

  it('creates an order, decrements stock, and clears the cart', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, price: 150, stock: 10 });

    await addToCart(token, product._id.toString(), 3);

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: 'Baneshwor, Kathmandu', paymentMethod: 'cod' });

    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(450);
    expect(res.body.data.orderNumber).toMatch(/^NG-\d{4}-\d{5}$/);
    expect(res.body.data.orderStatus).toBe('placed');

    const Product = require('../models/Product');
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(7);

    const cartRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.items).toEqual([]);
  });

  it('rejects checkout when requested quantity exceeds stock', async () => {
    const { token } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, stock: 2 });

    await addToCart(token, product._id.toString(), 2);

    const Product = require('../models/Product');
    await Product.findByIdAndUpdate(product._id, { stock: 1 });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: 'Baneshwor, Kathmandu', paymentMethod: 'cod' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });
});

describe('GET /api/orders', () => {
  it('rejects a request without a token', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.status).toBe(401);
  });

  it('only returns orders belonging to the authenticated user', async () => {
    const { token: tokenA } = await createUser({ role: 'customer' });
    const { token: tokenB } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, stock: 10 });

    await addToCart(tokenA, product._id.toString(), 1);
    await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ deliveryAddress: 'Baneshwor, Kathmandu', paymentMethod: 'cod' });

    const resA = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenA}`);
    const resB = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenB}`);

    expect(resA.body.data.length).toBe(1);
    expect(resB.body.data.length).toBe(0);
  });
});

describe('GET /api/orders/:orderId', () => {
  it('returns 404 for an order that does not belong to the user', async () => {
    const { token: owner } = await createUser({ role: 'customer' });
    const { token: intruder } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const { product } = await createProduct({ sellerId: seller._id, stock: 10 });

    await addToCart(owner, product._id.toString(), 1);
    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${owner}`)
      .send({ deliveryAddress: 'Baneshwor, Kathmandu', paymentMethod: 'cod' });

    const res = await request(app)
      .get(`/api/orders/${checkoutRes.body.data.orderId}`)
      .set('Authorization', `Bearer ${intruder}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent order id', async () => {
    const { token } = await createUser({ role: 'customer' });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/orders/${fakeId}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
