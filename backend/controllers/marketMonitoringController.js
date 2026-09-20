const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { asString } = require('../utils/sanitize');

const deviationOf = (price, avg) => {
  if (!avg) return 0;
  return Math.round(((price - avg) / avg) * 1000) / 10;
};

const formatPrice = (record) => ({
  priceId: record._id,
  product: record.productId ? { productId: record.productId._id, name: record.productId.name, category: record.productId.categoryId?.name } : null,
  seller: record.sellerId ? { sellerId: record.sellerId._id, shopName: record.sellerId.shopName, location: record.sellerId.location } : null,
  currentPrice: record.price,
  averageMarketPrice: record.averageMarketPrice,
  priceDeviation: deviationOf(record.price, record.averageMarketPrice),
  status: record.status,
  remarks: record.remarks,
  lastUpdated: record.lastUpdated,
  monitoredBy: record.monitoredBy?.userId ? { name: record.monitoredBy.userId.name } : null,
});

const getPrices = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const filter = {};
    if (asString(req.query.status)) filter.status = req.query.status;
    if (req.query.seller && mongoose.Types.ObjectId.isValid(req.query.seller)) filter.sellerId = req.query.seller;

    let query = MarketPrice.find(filter)
      .populate({ path: 'productId', select: 'name categoryId', populate: { path: 'categoryId', select: 'name' } })
      .populate('sellerId', 'shopName location')
      .populate({ path: 'monitoredBy', populate: { path: 'userId', select: 'name' } });

    let all = await query;

    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
      all = all.filter((r) => r.productId?.categoryId?._id?.toString() === req.query.category);
    }

    const formatted = all.map(formatPrice);

    const sortBy = req.query.sortBy || 'product';
    formatted.sort((a, b) => {
      if (sortBy === 'averagePrice') return (b.averageMarketPrice || 0) - (a.averageMarketPrice || 0);
      if (sortBy === 'deviation') return Math.abs(b.priceDeviation) - Math.abs(a.priceDeviation);
      return (a.product?.name || '').localeCompare(b.product?.name || '');
    });

    const total = formatted.length;
    const paged = formatted.slice((page - 1) * limit, (page - 1) * limit + limit);

    res.status(200).json({
      success: true,
      data: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPriceById = async (req, res) => {
  try {
    const { priceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(priceId)) {
      return res.status(404).json({ success: false, message: 'Price record not found' });
    }

    const record = await MarketPrice.findById(priceId)
      .populate({ path: 'productId', select: 'name categoryId image', populate: { path: 'categoryId', select: 'name' } })
      .populate('sellerId', 'shopName location contact')
      .populate({ path: 'monitoredBy', populate: { path: 'userId', select: 'name' } });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Price record not found' });
    }

    const otherSellers = await MarketPrice.find({ productId: record.productId?._id, _id: { $ne: record._id } })
      .populate('sellerId', 'shopName location');

    res.status(200).json({
      success: true,
      data: {
        ...formatPrice(record),
        history: record.history,
        otherSellers: otherSellers.map((r) => ({
          seller: r.sellerId ? { shopName: r.sellerId.shopName, location: r.sellerId.location } : null,
          price: r.price,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePriceStatus = async (req, res) => {
  try {
    const { priceId } = req.params;
    const { status, remarks } = req.body;
    if (!mongoose.Types.ObjectId.isValid(priceId)) {
      return res.status(404).json({ success: false, message: 'Price record not found' });
    }

    const record = await MarketPrice.findById(priceId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Price record not found' });
    }

    const officer = await GovernmentOfficer.findOne({ userId: req.user._id });

    record.status = status;
    if (remarks !== undefined) record.remarks = remarks;
    record.monitoredBy = officer ? officer._id : record.monitoredBy;
    record.lastUpdated = new Date();
    record.history.push({ price: record.price, averageMarketPrice: record.averageMarketPrice, status, date: new Date() });
    await record.save();

    res.status(200).json({ success: true, message: 'Price status updated', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const records = await MarketPrice.find()
      .populate({ path: 'productId', select: 'name categoryId', populate: { path: 'categoryId', select: 'name' } });

    const pricesUnderReview = records.filter((r) => r.status === 'review_required').length;

    const deviations = records
      .filter((r) => r.averageMarketPrice)
      .map((r) => deviationOf(r.price, r.averageMarketPrice));
    const averagePriceDeviation = deviations.length
      ? Math.round((deviations.reduce((sum, d) => sum + d, 0) / deviations.length) * 10) / 10
      : 0;

    const mostOverpriced = records
      .filter((r) => r.averageMarketPrice)
      .map((r) => ({ product: r.productId?.name, deviation: deviationOf(r.price, r.averageMarketPrice) }))
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 5);

    const pricesByCategory = {};
    records.forEach((r) => {
      const catName = r.productId?.categoryId?.name || 'Uncategorized';
      if (!pricesByCategory[catName]) pricesByCategory[catName] = { count: 0, totalDeviation: 0 };
      pricesByCategory[catName].count += 1;
      pricesByCategory[catName].totalDeviation += r.averageMarketPrice ? deviationOf(r.price, r.averageMarketPrice) : 0;
    });
    Object.keys(pricesByCategory).forEach((cat) => {
      pricesByCategory[cat].avgDeviation = Math.round((pricesByCategory[cat].totalDeviation / pricesByCategory[cat].count) * 10) / 10;
      delete pricesByCategory[cat].totalDeviation;
    });

    const TREND_DAYS = 14;
    const trendMap = {};
    const today = new Date();
    const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
      const key = new Date(todayUTCStart - i * dayMs).toISOString().split('T')[0];
      trendMap[key] = 0;
    }
    const windowStart = todayUTCStart - (TREND_DAYS - 1) * dayMs;
    records
      .filter((r) => r.status === 'review_required' && new Date(r.lastUpdated).getTime() >= windowStart)
      .forEach((r) => {
        const key = new Date(r.lastUpdated).toISOString().split('T')[0];
        if (trendMap[key] !== undefined) trendMap[key] += 1;
      });
    const trendData = Object.entries(trendMap).map(([date, reviewCount]) => ({ date, reviewCount }));

    res.status(200).json({
      success: true,
      data: { pricesUnderReview, averagePriceDeviation, mostOverpriced, pricesByCategory, trendData },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPrices, getPriceById, updatePriceStatus, getAnalytics };
