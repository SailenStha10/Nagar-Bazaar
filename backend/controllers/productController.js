const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { asString } = require('../utils/sanitize');
const { computeDiscount } = require('../utils/discount');
const SearchRankingEngine = require('../algorithms/searchRanking');
const FuzzyMatcher = require('../algorithms/fuzzyMatching');

const rankingEngine = new SearchRankingEngine();
const fuzzyMatcher = new FuzzyMatcher();

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

// Builds the shared Product filter from query params. Returns null (and
// writes the error response) on an invalid id, so callers can bail out.
const buildFilter = (req, res, extraFilter = {}) => {
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

  return filter;
};

const buildListQuery = async (req, res, extraFilter = {}) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
  const sortBy = SORT_FIELDS[req.query.sortBy] || 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const filter = buildFilter(req, res, extraFilter);
  if (!filter) return null;

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

const MAX_RANKED_CANDIDATES = 300;

const searchProducts = async (req, res) => {
  try {
    const q = asString(req.query.q);
    const extraFilter = {};

    if (q) {
      extraFilter.name = { $regex: q, $options: 'i' };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      extraFilter.price = {};
      if (req.query.minPrice) extraFilter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) extraFilter.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.inStock === 'true') {
      extraFilter.stock = { $gt: 0 };
    }

    // Without a search term there's nothing to rank against — fall back to
    // the plain sortBy-based listing.
    if (!q) {
      const result = await buildListQuery(req, res, extraFilter);
      if (!result) return;
      return res.status(200).json({ success: true, ...result });
    }

    const filter = buildFilter(req, res, extraFilter);
    if (!filter) return;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);

    const candidates = await Product.find(filter)
      .select('name description price createdAt')
      .limit(MAX_RANKED_CANDIDATES)
      .lean();

    const ranked = await rankingEngine.rankProducts(q, candidates);
    const total = ranked.length;
    const pageSlice = ranked.slice((page - 1) * limit, (page - 1) * limit + limit);

    const populated = await Product.find({ _id: { $in: pageSlice.map((r) => r.product._id) } })
      .populate({ path: 'sellerId', select: 'shopName userId', populate: { path: 'userId', select: 'name' } });
    const byId = new Map(populated.map((p) => [p._id.toString(), p]));

    const data = pageSlice
      .map((r) => {
        const product = byId.get(r.product._id.toString());
        return product ? { ...formatListItem(product), relevanceScore: r.scores.final } : null;
      })
      .filter(Boolean);

    // No substring matches at all — the query might just be a typo, so look
    // for a "did you mean" correction across every active product (not just
    // the regex-filtered candidates, which is exactly what came up empty).
    let suggestions = [];
    if (total === 0) {
      const corrections = await fuzzyMatcher.getCorrections(q, 5);
      suggestions = corrections.suggestions;
    }

    res.status(200).json({
      success: true,
      data,
      suggestions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/products/suggestions?q=
 * Autocomplete: product names starting with the given prefix.
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const prefix = asString(req.query.q);
    const suggestions = await rankingEngine.getSearchSuggestions(prefix, 8);
    res.status(200).json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  getSearchSuggestions,
  formatListItem,
};
