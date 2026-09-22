const mongoose = require('mongoose');
const RecommendationEngine = require('../algorithms/recommendation');
const Product = require('../models/Product');
const { formatListItem } = require('./productController');

const engine = new RecommendationEngine();

const canAccess = (req, userId) => req.user._id.toString() === userId || req.user.role === 'admin';

// Re-fetch full product docs (populated the way ProductCard expects) for a
// set of recommendation entries, so the frontend gets the same shape as
// every other product listing endpoint.
const attachProductDetails = async (recommendations) => {
  const productIds = recommendations.map((r) => r.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate({ path: 'sellerId', select: 'shopName userId', populate: { path: 'userId', select: 'name' } })
    .lean();

  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return recommendations
    .map((rec) => {
      const product = byId.get(rec.productId);
      if (!product) return null;
      return { ...rec, product: formatListItem(product) };
    })
    .filter(Boolean);
};

const getHybridRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canAccess(req, userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const result = await engine.getHybridRecommendations(userId, limit);
    const data = await attachProductDetails(result.recommendations);

    res.status(200).json({
      success: true,
      data,
      stats: result.stats,
      executionTime: result.executionTime,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCollaborativeRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canAccess(req, userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const result = await engine.getCollaborativeRecommendations(userId, limit);

    res.status(200).json({ success: true, data: result.recommendations, executionTime: result.executionTime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getContentBasedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canAccess(req, userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const result = await engine.getContentBasedRecommendations(userId, limit);

    res.status(200).json({ success: true, data: result.recommendations, executionTime: result.executionTime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getHybridRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
};
