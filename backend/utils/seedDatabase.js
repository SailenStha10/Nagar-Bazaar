const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Review = require('../models/Review');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const GovernmentNotice = require('../models/GovernmentNotice');
const MarketPrice = require('../models/MarketPrice');
const { hashPassword } = require('./auth');
const { seedCategories } = require('./seedCategories');

const DEMO_PASSWORD = 'password123';
const MARKER_EMAIL = 'contact@kathmandufreshmart.example';

const sellerDefs = [
  { shopName: 'Kathmandu Fresh Mart', location: 'Kathmandu', contact: '9801000001', email: MARKER_EMAIL, owner: 'Rajesh Shrestha' },
  { shopName: 'Valley Grocery Store', location: 'Lalitpur', contact: '9801000002', email: 'contact@valleygrocery.example', owner: 'Sunita Maharjan' },
  { shopName: 'Local Harvest Nepal', location: 'Bhaktapur', contact: '9801000003', email: 'contact@localharvestnepal.example', owner: 'Bikash Tamang' },
  { shopName: 'Himalayan Organics', location: 'Pokhara', contact: '9801000004', email: 'contact@himalayanorganics.example', owner: 'Anita Gurung' },
];

const customerDefs = [
  { name: 'Sabina Rai', email: 'sabina.rai@example.com', phone: '9812000001', address: 'Baneshwor, Kathmandu' },
  { name: 'Prakash Adhikari', email: 'prakash.adhikari@example.com', phone: '9812000002', address: 'Patan, Lalitpur' },
  { name: 'Nisha Thapa', email: 'nisha.thapa@example.com', phone: '9812000003', address: 'Boudha, Kathmandu' },
  { name: 'Kiran Magar', email: 'kiran.magar@example.com', phone: '9812000004', address: 'Lakeside, Pokhara' },
  { name: 'Deepa Karki', email: 'deepa.karki@example.com', phone: '9812000005', address: 'Suryabinayak, Bhaktapur' },
];

const officerDef = {
  name: 'Officer Bimal Basnet',
  email: 'bimal.basnet@nagarbazaar.example',
  phone: '9851000000',
  department: 'Department of Consumer Protection',
  designation: 'Market Monitoring Officer',
  officeLocation: 'Kathmandu Metropolitan Office',
};

const productDefs = [
  // Grocery
  { name: 'Basmati Rice (500g)', category: 'Grocery', price: 450, stock: 60 },
  { name: 'Sunflower Oil (1L)', category: 'Grocery', price: 320, stock: 45 },
  { name: 'Masoor Dal (1kg)', category: 'Grocery', price: 210, stock: 70 },
  { name: 'Sugar (1kg)', category: 'Grocery', price: 115, stock: 90 },
  { name: 'Iodized Salt (1kg)', category: 'Grocery', price: 35, stock: 120 },
  // Fruits & Vegetables
  { name: 'Potato (1kg)', category: 'Fruits & Vegetables', price: 60, stock: 100 },
  { name: 'Tomato (500g)', category: 'Fruits & Vegetables', price: 45, stock: 80 },
  { name: 'Onion (1kg)', category: 'Fruits & Vegetables', price: 90, stock: 95 },
  { name: 'Banana (dozen)', category: 'Fruits & Vegetables', price: 120, stock: 40 },
  { name: 'Apple (1kg)', category: 'Fruits & Vegetables', price: 280, stock: 35 },
  // Dairy
  { name: 'Fresh Milk (500ml)', category: 'Dairy', price: 60, stock: 75 },
  { name: 'Paneer (250g)', category: 'Dairy', price: 180, stock: 30 },
  { name: 'Dahi / Yogurt (400g)', category: 'Dairy', price: 90, stock: 50 },
  { name: 'Pure Ghee (500ml)', category: 'Dairy', price: 950, stock: 20, isLocal: true, producer: 'Kavre Dairy Farmers', location: 'Kavrepalanchok' },
  // Beverages
  { name: 'Nepali Tea (100g)', category: 'Beverages', price: 150, stock: 65 },
  { name: 'Black Tea CTC (250g)', category: 'Beverages', price: 220, stock: 55 },
  { name: 'Mineral Water (1L)', category: 'Beverages', price: 30, stock: 150 },
  { name: 'Sweet Lassi (500ml)', category: 'Beverages', price: 80, stock: 40 },
  // Household Items
  { name: 'Dish Soap (500ml)', category: 'Household Items', price: 140, stock: 60 },
  { name: 'Detergent Powder (1kg)', category: 'Household Items', price: 210, stock: 50 },
  { name: 'Bamboo Broom', category: 'Household Items', price: 180, stock: 25 },
  { name: 'Toilet Cleaner (500ml)', category: 'Household Items', price: 160, stock: 45 },
  // Organic Products
  { name: 'Raw Honey (250g)', category: 'Organic Products', price: 450, stock: 30, isLocal: true, producer: 'Chitwan Beekeepers Cooperative', location: 'Chitwan' },
  { name: 'Organic Turmeric Powder (200g)', category: 'Organic Products', price: 160, stock: 40 },
  { name: 'Organic Brown Rice (1kg)', category: 'Organic Products', price: 190, stock: 35 },
  { name: 'Organic Millet (500g)', category: 'Organic Products', price: 140, stock: 30, isLocal: true, producer: 'Solukhumbu Farmers Group', location: 'Solukhumbu' },
  // Local Products
  { name: 'Gundruk (250g)', category: 'Local Products', price: 180, stock: 50, isLocal: true, producer: 'Himalayan Organics', location: 'Dolakha' },
  { name: 'Mustard Oil (500ml)', category: 'Local Products', price: 420, stock: 40, isLocal: true, producer: 'Local Harvest Nepal', location: 'Palpa' },
  { name: 'Local Pickle / Achar (300g)', category: 'Local Products', price: 210, stock: 45, isLocal: true, producer: 'Bhaktapur Home Kitchens', location: 'Bhaktapur' },
  { name: 'Sel Roti (pack of 6)', category: 'Local Products', price: 250, stock: 25, isLocal: true, producer: 'Newari Sweets House', location: 'Bhaktapur' },
  { name: 'Dried Yak Cheese - Chhurpi (200g)', category: 'Local Products', price: 380, stock: 20, isLocal: true, producer: 'Solukhumbu Highland Dairy', location: 'Solukhumbu' },
  { name: 'Himalayan Rock Salt (500g)', category: 'Local Products', price: 220, stock: 35, isLocal: true, producer: 'Rasuwa Trading Group', location: 'Rasuwa' },
];

const reviewComments = [
  'Great quality, exactly as described.',
  'Fast delivery and fresh product.',
  'Good value for the price, will buy again.',
  'Tastes authentic, just like homemade.',
  'Packaging could be better but product is good.',
  'Highly recommend this seller.',
  'A bit pricier than the local market but worth it.',
  'Excellent freshness and taste.',
  'Exactly what I was looking for.',
  'Will definitely reorder from this store.',
  'Good product, arrived on time.',
  'Satisfied with the purchase overall.',
];

const noticeDefs = [
  {
    title: 'Maximum retail price ceiling set for essential grocery items',
    content:
      'The Department of Consumer Protection has set maximum retail price ceilings for rice, oil, and lentils effective this quarter. Sellers found overpricing these items will face penalties.',
    category: 'price_info',
    priority: 'high',
  },
  {
    title: "How to verify a seller's government certification badge",
    content:
      'Citizens can verify a seller\'s certification status by checking the "Government-verified" badge on the seller profile page. Only officer-approved sellers carry this badge.',
    category: 'consumer_awareness',
    priority: 'medium',
  },
  {
    title: 'New market monitoring zone added for Kalimati region',
    content:
      'Market officers will begin regular price and quality monitoring visits in the Kalimati vegetable market starting next month.',
    category: 'market_info',
    priority: 'low',
  },
  {
    title: 'Updated regulations for local product labeling',
    content:
      'All products marketed as "local" must now include producer name and origin district in their listing, per updated consumer protection regulations.',
    category: 'regulations',
    priority: 'medium',
  },
  {
    title: 'Public notice: Reporting expired or mislabeled products',
    content:
      'Citizens are encouraged to file a complaint immediately if they encounter expired or mislabeled products. All complaints are reviewed within 5 business days.',
    category: 'public_notice',
    priority: 'high',
  },
];

const getCounts = async () => ({
  categories: await require('../models/Category').countDocuments(),
  users: await User.countDocuments(),
  sellers: await Seller.countDocuments(),
  products: await Product.countDocuments(),
  reviews: await Review.countDocuments(),
  governmentNotices: await GovernmentNotice.countDocuments(),
  marketPrices: await MarketPrice.countDocuments(),
});

const seedDatabase = async () => {
  const categories = await seedCategories();
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const alreadySeeded = await User.findOne({ email: MARKER_EMAIL });
  if (alreadySeeded) {
    return { alreadySeeded: true, counts: await getCounts() };
  }

  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  // Sellers (user + seller profile)
  const sellers = [];
  for (const def of sellerDefs) {
    const user = await User.create({
      name: def.owner,
      email: def.email,
      password: hashedPassword,
      phone: def.contact,
      address: def.location,
      role: 'seller',
    });
    const seller = await Seller.create({
      userId: user._id,
      shopName: def.shopName,
      description: `${def.shopName} — trusted local seller based in ${def.location}.`,
      location: def.location,
      contact: def.contact,
      verificationStatus: 'approved',
      verificationDate: new Date(),
    });
    sellers.push(seller);
  }

  // Customers
  const customers = [];
  for (const def of customerDefs) {
    const user = await User.create({
      name: def.name,
      email: def.email,
      password: hashedPassword,
      phone: def.phone,
      address: def.address,
      role: 'customer',
    });
    customers.push(user);
  }

  // Government officer (needed to issue notices / monitor prices)
  const officerUser = await User.create({
    name: officerDef.name,
    email: officerDef.email,
    password: hashedPassword,
    phone: officerDef.phone,
    role: 'officer',
  });
  const officer = await GovernmentOfficer.create({
    userId: officerUser._id,
    department: officerDef.department,
    designation: officerDef.designation,
    officeLocation: officerDef.officeLocation,
  });

  // Products, round-robined across sellers
  const products = [];
  productDefs.forEach((def, i) => {
    products.push({
      sellerId: sellers[i % sellers.length]._id,
      categoryId: categoryByName[def.category],
      name: def.name,
      description: `${def.name} — a quality product sourced for Nagar Bazaar customers.`,
      price: def.price,
      stock: def.stock,
      isLocal: Boolean(def.isLocal),
      localProductDetails: def.isLocal ? { producer: def.producer, location: def.location } : undefined,
      averageRating: 0,
    });
  });
  const createdProducts = await Product.insertMany(products);

  // Reviews — spread across a subset of products
  const reviewTargets = createdProducts.slice(0, reviewComments.length);
  const reviews = reviewTargets.map((product, i) => ({
    productId: product._id,
    userId: customers[i % customers.length]._id,
    rating: 3 + (i % 3),
    comment: reviewComments[i],
  }));
  await Review.insertMany(reviews);

  const ratingsByProduct = reviews.reduce((acc, r) => {
    acc[r.productId] = acc[r.productId] || [];
    acc[r.productId].push(r.rating);
    return acc;
  }, {});
  await Promise.all(
    Object.entries(ratingsByProduct).map(([productId, ratings]) => {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      return Product.findByIdAndUpdate(productId, { averageRating: Math.round(avg * 10) / 10 });
    })
  );

  // Government notices
  await GovernmentNotice.insertMany(
    noticeDefs.map((notice) => ({ ...notice, issuedBy: officer._id, publishedAt: new Date() }))
  );

  // Market prices — sample of products, one flagged for review
  const marketPriceTargets = createdProducts.slice(0, 10);
  await MarketPrice.insertMany(
    marketPriceTargets.map((product, i) => {
      const isFlagged = i === 3;
      const averageMarketPrice = isFlagged ? Math.round(product.price * 0.75) : Math.round(product.price * 0.97);
      return {
        productId: product._id,
        sellerId: product.sellerId,
        price: product.price,
        averageMarketPrice,
        status: isFlagged ? 'review_required' : 'normal',
        monitoredBy: officer._id,
        lastUpdated: new Date(),
      };
    })
  );

  return { alreadySeeded: false, counts: await getCounts() };
};

module.exports = { seedDatabase, DEMO_PASSWORD };

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  require('../models');
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      const result = await seedDatabase();
      console.log(result.alreadySeeded ? 'Database already seeded.' : 'Database seeded successfully.');
      console.log(result.counts);
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}
