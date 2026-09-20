const mongoose = require('mongoose');
const Product = require('../models/Product');
const { asString } = require('../utils/sanitize');

const getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);

    const filter = {};
    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) filter.categoryId = req.query.category;
    if (req.query.seller && mongoose.Types.ObjectId.isValid(req.query.seller)) filter.sellerId = req.query.seller;
    if (asString(req.query.q)) filter.name = { $regex: req.query.q, $options: 'i' };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate({ path: 'sellerId', select: 'shopName' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: products.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: p.image,
        isActive: p.isActive,
        averageRating: p.averageRating,
        category: p.categoryId ? { _id: p.categoryId._id, name: p.categoryId.name } : null,
        seller: p.sellerId ? { _id: p.sellerId._id, shopName: p.sellerId.shopName } : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product removed from system' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProducts, deleteProduct };
