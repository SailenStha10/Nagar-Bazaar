const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { createUser } = require('./helpers');

describe('POST /api/auth/register', () => {
  it('registers a user with valid data', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sita Sharma',
      email: 'sita.sharma@example.com',
      password: 'password123',
      phone: '9812345678',
      role: 'customer',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ name: 'Sita Sharma', email: 'sita.sharma@example.com', role: 'customer' });

    const stored = await User.findOne({ email: 'sita.sharma@example.com' });
    expect(stored).not.toBeNull();
    expect(stored.password).not.toBe('password123');
  });

  it('rejects a duplicate email', async () => {
    await createUser({ email: 'dupe@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: 'dupe@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Password',
      email: 'weak@example.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'missing@example.com' });

    expect(res.status).toBe(400);
  });

  it('rejects a role outside customer/seller at the validation layer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Role Tester',
      email: 'roletest@example.com',
      password: 'password123',
      role: 'admin',
    });

    expect(res.status).toBe(400);
  });

  it('defaults to customer when no role is given', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Role',
      email: 'norole@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { user, password } = await createUser({ email: 'login@example.com' });

    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.userId).toBe(user._id.toString());
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(404);
  });

  it('rejects an incorrect password', async () => {
    await createUser({ email: 'wrongpass@example.com', password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email: 'wrongpass@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects a deactivated account', async () => {
    await createUser({ email: 'blocked@example.com', password: 'password123', isActive: false });

    const res = await request(app).post('/api/auth/login').send({ email: 'blocked@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/inactive/i);
  });

  it('rejects a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/profile', () => {
  it('returns the profile for a valid token', async () => {
    const { user, token } = await createUser({ email: 'profile@example.com' });

    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects a request without a token', async () => {
    const res = await request(app).get('/api/auth/profile');

    expect(res.status).toBe(401);
  });

  it('rejects a malformed/invalid token', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });
});
