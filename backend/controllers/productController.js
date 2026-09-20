const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { asString } = require('../utils/sanitize');
const { computeDiscount } = require('../utils/discount');

const SORT_FIELDS = {
  name: 'name',
  price: 'price',
  rating: 'averageRating',
  latest: 'createdAt',
};

const formatSeller = (seller) => {
  if (!seller) return null;
  return {
    _id: seller._id,
    name: seller.userId?.name,
    shopName: seller.shopName,
  };
};

const formatListItem = (product) => ({
  _id: product._id,
  name: product.name,
  price: product.price,
  image: product.image,
  ratings: product.averageRating,
  stock: product.stock,
  isLocal: product.isLocal,
  localProductDetails: product.isLocal ? product.localProductDetails : undefined,
  seller: formatSeller(product.sellerId),
  ...computeDiscount(product),
});

const buildListQuery = async (req, res, extraFilter = {}) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
  const sortBy = SORT_FIELDS[req.query.sortBy] || 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const filter = { isActive: true, ...extraFilter };

  if (req.query.category) {
    if (!mongoose.Types.ObjectId.isValid(req.query.category)) {
      res.status(400).json({ success: false, message: 'Invalid category id' });
      return null;
    }
    filter.categoryId = req.query.category;
  }

  if (req.query.seller) {
    if (!mongoose.Types.ObjectId.isValid(req.query.seller)) {
      res.status(400).json({ success: false, message: 'Invalid seller id' });
      return null;
    }
    filter.sellerId = req.query.seller;
  }

  if (req.query.excludeId && mongoose.Types.ObjectId.isValid(req.query.excludeId)) {
    filter._id = { $ne: req.query.excludeId };
  }

  if (req.query.isLocal === 'true') {
    filter.isLocal = true;
  }

  if (asString(req.query.location)) {
    filter['localProductDetails.location'] = req.query.location;
  }

  if (asString(req.query.producer)) {
    filter['localProductDetails.producer'] = req.query.producer;
  }

  if (req.query.onSale === 'true') {
    filter.discountType = { $ne: 'none' };
    filter.discountValue = { $gt: 0 };
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate({ path: 'sellerId', select: 'shopName userId', populate: { path: 'userId', select: 'name' } })
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: products.map(formatListItem),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

const getProducts = async (req, res) => {
  try {
    const result = await buildListQuery(req, res);
    if (!result) return;
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate('categoryId', 'name icon')
      .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name email phone' } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ productId: id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        ...computeDiscount(product),
        stock: product.stock,
        image: product.image,
        category: product.categoryId
          ? { _id: product.categoryId._id, name: product.categoryId.name, icon: product.categoryId.icon }
          : null,
        seller: product.sellerId,
        ratings: product.averageRating,
        reviews: reviews.map((r) => ({
          user: r.userId?.name,
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt,
        })),
        isLocal: product.isLocal,
        localProductDetails: product.localProductDetails,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const filter = {};

    if (asString(req.query.q)) {
      filter.name = { $regex: req.query.q, $options: 'i' };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    const result = await buildListQuery(req, res, filter);
    if (!result) return;
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProducts, getProductById, searchProducts };
