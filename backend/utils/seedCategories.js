const Category = require('../models/Category');

const categories = [
  { name: 'Grocery', icon: '🛒', description: 'Everyday grocery essentials and pantry staples.' },
  { name: 'Fruits & Vegetables', icon: '🥦', description: 'Fresh produce sourced from local farms.' },
  { name: 'Dairy', icon: '🥛', description: 'Milk, cheese, and other dairy products.' },
  { name: 'Beverages', icon: '🥤', description: 'Teas, juices, and other drinks.' },
  { name: 'Household Items', icon: '🧺', description: 'Everyday household and cleaning supplies.' },
  { name: 'Organic Products', icon: '🌿', description: 'Certified organic and chemical-free products.' },
  { name: 'Local Products', icon: '🏔️', description: 'Authentic Nepali products sourced directly from local producers.' },
];

const seedCategories = async () => {
  const results = [];
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { name: category.name },
      { $setOnInsert: category },
      { upsert: true, new: true }
    );
    results.push(doc);
  }
  return results;
};

module.exports = { seedCategories, categories };

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      const seeded = await seedCategories();
      console.log(`Seeded ${seeded.length} categories`);
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}
