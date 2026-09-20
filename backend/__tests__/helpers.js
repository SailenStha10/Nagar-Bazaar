const User = require('../models/User');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const { generateToken, hashPassword } = require('../utils/auth');

const createUser = async (overrides = {}) => {
  const password = overrides.password || 'password123';
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user${Date.now()}${Math.random()}@example.com`,
    password: await hashPassword(password),
    phone: overrides.phone || '9800000000',
    role: overrides.role || 'customer',
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
  const token = generateToken(user._id, user.role);
  return { user, token, password };
};

const createCategory = async (overrides = {}) => {
  return Category.create({
    name: overrides.name || `Category ${Date.now()}${Math.random()}`,
    description: overrides.description || 'A test category',
    icon: overrides.icon || '🧪',
  });
};

const createSeller = async (overrides = {}) => {
  const { user, token } = await createUser({ role: 'seller', ...overrides.userOverrides });
  const seller = await Seller.create({
    userId: user._id,
    shopName: overrides.shopName || `Test Shop ${Date.now()}${Math.random()}`,
    location: overrides.location || 'Kathmandu',
    contact: overrides.contact || '9811111111',
    verificationStatus: overrides.verificationStatus || 'approved',
  });
  return { user, token, seller };
};

const createProduct = async (overrides = {}) => {
  const category = overrides.categoryId ? { _id: overrides.categoryId } : await createCategory();
  const sellerCtx = overrides.sellerId ? { seller: { _id: overrides.sellerId } } : await createSeller();

  const product = await Product.create({
    sellerId: overrides.sellerId || sellerCtx.seller._id,
    categoryId: overrides.categoryId || category._id,
    name: overrides.name || 'Test Product',
    description: overrides.description || 'A product used for testing',
    price: overrides.price ?? 100,
    stock: overrides.stock ?? 20,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
  return { product, category, sellerCtx };
};

module.exports = { createUser, createCategory, createSeller, createProduct };
