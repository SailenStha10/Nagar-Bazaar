const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { createCategory, createSeller, createProduct } = require('./helpers');

describe('GET /api/products', () => {
  it('returns a paginated list of active products', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Rice', price: 450 });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Lentils', price: 200 });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination).toMatchObject({ page: 1, total: 2 });
  });

  it('excludes inactive products from the list', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Active Product' });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Inactive Product', isActive: false });

    const res = await request(app).get('/api/products');

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Active Product');
  });

  it('sorts by price ascending and descending', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Cheap', price: 50 });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Expensive', price: 500 });

    const asc = await request(app).get('/api/products').query({ sortBy: 'price', sortOrder: 'asc' });
    expect(asc.body.data.map((p) => p.name)).toEqual(['Cheap', 'Expensive']);

    const desc = await request(app).get('/api/products').query({ sortBy: 'price', sortOrder: 'desc' });
    expect(desc.body.data.map((p) => p.name)).toEqual(['Expensive', 'Cheap']);
  });

  it('paginates results with limit and page', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    for (let i = 0; i < 15; i += 1) {
      await createProduct({ sellerId: seller._id, categoryId: category._id, name: `Product ${i}` });
    }

    const res = await request(app).get('/api/products').query({ page: 2, limit: 10 });

    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 10, total: 15, pages: 2 });
  });

  it('rejects an invalid category id', async () => {
    const res = await request(app).get('/api/products').query({ category: 'not-an-id' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  it('returns full product detail with category and seller', async () => {
    const { seller } = await createSeller({ shopName: 'Detail Shop' });
    const category = await createCategory({ name: 'Detail Category' });
    const { product } = await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Detailed Product' });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Detailed Product');
    expect(res.body.data.category.name).toBe('Detail Category');
    expect(res.body.data.reviews).toEqual([]);
  });

  it('returns 404 for a non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for a malformed id', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');

    expect(res.status).toBe(404);
  });

  it('returns 404 for an inactive product', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    const { product } = await createProduct({ sellerId: seller._id, categoryId: category._id, isActive: false });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/products/search', () => {
  it('finds products by name (case-insensitive)', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Basmati Rice' });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Mustard Oil' });

    const res = await request(app).get('/api/products/search').query({ q: 'rice' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Basmati Rice');
  });

  it('filters by price range', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Cheap', price: 50 });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Mid', price: 250 });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Costly', price: 900 });

    const res = await request(app).get('/api/products/search').query({ minPrice: 100, maxPrice: 500 });

    expect(res.body.data.map((p) => p.name)).toEqual(['Mid']);
  });

  it('filters out-of-stock products when inStock=true', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'In Stock', stock: 10 });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Sold Out', stock: 0 });

    const res = await request(app).get('/api/products/search').query({ inStock: 'true' });

    expect(res.body.data.map((p) => p.name)).toEqual(['In Stock']);
  });

  it('returns an empty list for a search term with no matches', async () => {
    const res = await request(app).get('/api/products/search').query({ q: 'nonexistent-item-xyz' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/products/search - ranking (Sprint 4, Ticket 4.2)', () => {
  it('ranks a stronger name/description match above a weaker one, and attaches relevanceScore', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({
      sellerId: seller._id,
      categoryId: category._id,
      name: 'Basmati Rice 5kg',
      description: 'Basmati Rice',
    });
    await createProduct({
      sellerId: seller._id,
      categoryId: category._id,
      name: 'Rice Cooker',
      description: 'An electric appliance, not food',
    });

    const res = await request(app).get('/api/products/search').query({ q: 'rice' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].name).toBe('Basmati Rice 5kg');
    expect(res.body.data[0]).toHaveProperty('relevanceScore');
    expect(res.body.data[0].relevanceScore).toBeGreaterThanOrEqual(res.body.data[1].relevanceScore);
  });

  it('still applies category/price/inStock filters when ranking', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Rice Bag', price: 1000, stock: 0 });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Rice Pack', price: 100, stock: 5 });

    const res = await request(app).get('/api/products/search').query({ q: 'rice', inStock: 'true' });

    expect(res.body.data.map((p) => p.name)).toEqual(['Rice Pack']);
  });
});

describe('GET /api/products/search - typo suggestions (Sprint 5, Ticket 5.2)', () => {
  it('returns a "did you mean" suggestion when a typo matches no products by substring', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Mustard Oil' });

    const res = await request(app).get('/api/products/search').query({ q: 'Mustrd Oil' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions[0].corrected).toBe('Mustard Oil');
  });

  it('returns an empty suggestions array when there are real substring matches', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Basmati Rice' });

    const res = await request(app).get('/api/products/search').query({ q: 'rice' });

    expect(res.body.data.length).toBe(1);
    expect(res.body.suggestions).toEqual([]);
  });

  it('still suggests a correction when the matching product name has a quantity suffix', async () => {
    // Regression: "Potato (1kg)" used to score too low as a whole string
    // against "potatoe" to ever surface as a suggestion.
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Potato (1kg)' });

    const res = await request(app).get('/api/products/search').query({ q: 'potatoe' });

    expect(res.body.data).toEqual([]);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions[0].corrected).toBe('Potato (1kg)');
  });
});

describe('GET /api/products/suggestions (Sprint 4, Ticket 4.2)', () => {
  it('returns prefix-matching product names', async () => {
    const { seller } = await createSeller();
    const category = await createCategory();
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Gundruk Pickle' });
    await createProduct({ sellerId: seller._id, categoryId: category._id, name: 'Mustard Oil' });

    const res = await request(app).get('/api/products/suggestions').query({ q: 'gund' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(['Gundruk Pickle']);
  });

  it('returns [] for an empty prefix', async () => {
    const res = await request(app).get('/api/products/suggestions').query({ q: '' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/sellers/products (seller product creation authorization)', () => {
  it('rejects a request without a token', async () => {
    const res = await request(app).post('/api/sellers/products').send({ name: 'No Auth Product' });

    expect(res.status).toBe(401);
  });

  it('rejects a non-seller role', async () => {
    const { createUser } = require('./helpers');
    const { token } = await createUser({ role: 'customer' });

    const res = await request(app).post('/api/sellers/products').set('Authorization', `Bearer ${token}`).send({ name: 'Wrong Role Product' });

    expect(res.status).toBe(403);
  });

  it('rejects invalid product data from a seller', async () => {
    const { token } = await createSeller();

    const res = await request(app)
      .post('/api/sellers/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', price: -5, stock: -1 });

    expect(res.status).toBe(400);
  });

  it('creates a product for a valid seller with valid data', async () => {
    const { token } = await createSeller();
    const category = await createCategory();

    const res = await request(app)
      .post('/api/sellers/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Seller Product', categoryId: category._id.toString(), price: 120, stock: 15 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('New Seller Product');
  });
});
