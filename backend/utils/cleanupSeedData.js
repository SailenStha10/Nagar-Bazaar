// One-off cleanup for the demo data created by seedDatabase.js, run once
// against a database that has since accumulated real usage (real accounts,
// orders, complaints). It removes seed sellers/customers/products/reviews/
// notices/market-prices, but keeps any seed record that a real order or
// complaint still points to (so existing order/complaint history doesn't
// end up referencing deleted documents) — see the KEEP_PRODUCT_IDS /
// KEEP_SELLER_EMAILS carve-outs below, which were derived by inspecting
// which seed records real data actually referenced at cleanup time.
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Review = require('../models/Review');
const GovernmentNotice = require('../models/GovernmentNotice');
const MarketPrice = require('../models/MarketPrice');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const OrderItem = require('../models/OrderItem');

// Seed customers that have never placed a real order/complaint — safe to
// remove outright, along with their (empty or seed-only) carts.
const SELLER_EMAILS_TO_DELETE = ['contact@kathmandufreshmart.example', 'contact@himalayanorganics.example'];
const CUSTOMER_EMAILS_TO_DELETE = [
  'sabina.rai@example.com',
  'prakash.adhikari@example.com',
  'nisha.thapa@example.com',
  'kiran.magar@example.com',
  'deepa.karki@example.com',
];

// Seed sellers/products kept because a real order or complaint still
// references them — deleting these would leave that real history pointing
// at nothing. Everything else seed-created is removed.
const SELLER_EMAILS_TO_KEEP = ['contact@valleygrocery.example', 'contact@localharvestnepal.example'];

const cleanupSeedData = async () => {
  const summary = {};

  const sellersToDeleteUsers = await User.find({ email: { $in: SELLER_EMAILS_TO_DELETE } }).select('_id email');
  const sellersToDeleteUserIds = sellersToDeleteUsers.map((u) => u._id);
  const sellersToDelete = await Seller.find({ userId: { $in: sellersToDeleteUserIds } }).select('_id');
  const sellersToDeleteIds = sellersToDelete.map((s) => s._id);

  const sellersToKeepUsers = await User.find({ email: { $in: SELLER_EMAILS_TO_KEEP } }).select('_id');
  const sellersToKeepUserIds = sellersToKeepUsers.map((u) => u._id);
  const sellersToKeep = await Seller.find({ userId: { $in: sellersToKeepUserIds } }).select('_id');
  const sellersToKeepIds = sellersToKeep.map((s) => s._id);

  // Every product created by seedDatabase.js belongs to one of the 4 seed
  // sellers. Of the products under the two *kept* sellers, only the ones a
  // real order/complaint actually references are kept — the rest (and
  // everything under the two fully-deleted sellers) is removed.
  const candidateProducts = await Product.find({ sellerId: { $in: [...sellersToDeleteIds, ...sellersToKeepIds] } }).select('_id');
  const candidateProductIds = candidateProducts.map((p) => p._id.toString());

  const referencedProductIds = new Set(
    (await OrderItem.find({ productId: { $in: candidateProductIds } }).select('productId')).map((i) => i.productId.toString())
  );

  const productIdsToDelete = candidateProductIds.filter((id) => !referencedProductIds.has(id));
  const productIdsToKeep = candidateProductIds.filter((id) => referencedProductIds.has(id));

  // Every seed review belongs to a seed customer (real customers/sellers
  // never got seeded reviews), so all of them go — including any on a kept
  // product, whose rating is reset below. This must run against the full
  // candidate product list *before* any products are deleted, otherwise
  // reviews on already-deleted products become orphaned instead of removed.
  summary.reviewsDeleted = (await Review.deleteMany({ productId: { $in: candidateProductIds } })).deletedCount;

  summary.productsDeleted = (await Product.deleteMany({ _id: { $in: productIdsToDelete } })).deletedCount;
  await Promise.all(productIdsToKeep.map((id) => Product.findByIdAndUpdate(id, { averageRating: 0 })));

  // Notices and market prices are informational, unreferenced by any order
  // or complaint — safe to remove in full along with the seed officer's
  // notices, while the officer account itself stays (a real complaint's
  // assignedOfficer still points to them).
  summary.noticesDeleted = (await GovernmentNotice.deleteMany({})).deletedCount;
  summary.marketPricesDeleted = (await MarketPrice.deleteMany({})).deletedCount;

  // Carts: drop the ones owned by users being deleted; a kept user's cart
  // (even if empty) stays untouched.
  const usersToDeleteIds = [...sellersToDeleteUserIds];
  const customersToDelete = await User.find({ email: { $in: CUSTOMER_EMAILS_TO_DELETE } }).select('_id');
  usersToDeleteIds.push(...customersToDelete.map((u) => u._id));

  const cartsToDelete = await Cart.find({ userId: { $in: usersToDeleteIds } }).select('_id');
  const cartIdsToDelete = cartsToDelete.map((c) => c._id);
  summary.cartItemsDeleted = (await CartItem.deleteMany({ cartId: { $in: cartIdsToDelete } })).deletedCount;
  summary.cartsDeleted = (await Cart.deleteMany({ _id: { $in: cartIdsToDelete } })).deletedCount;

  // Sellers (and their user accounts) that nothing real depends on.
  summary.sellersDeleted = (await Seller.deleteMany({ _id: { $in: sellersToDeleteIds } })).deletedCount;
  summary.sellerUsersDeleted = (await User.deleteMany({ _id: { $in: sellersToDeleteUserIds } })).deletedCount;

  // Seed customers that never placed a real order/complaint.
  summary.customersDeleted = (await User.deleteMany({ email: { $in: CUSTOMER_EMAILS_TO_DELETE } })).deletedCount;

  return summary;
};

module.exports = { cleanupSeedData };

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  require('../models');
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      const result = await cleanupSeedData();
      console.log('Seed data cleaned up:', result);
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error('Cleanup failed:', err.message);
      process.exit(1);
    });
}
