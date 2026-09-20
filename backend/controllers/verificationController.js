const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Complaint = require('../models/Complaint');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { asString } = require('../utils/sanitize');

const SORT_FIELDS = {
  date: 'createdAt',
  shopName: 'shopName',
};

const getSellersForVerification = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const sortBy = SORT_FIELDS[req.query.sortBy] || 'createdAt';

    const filter = {};
    if (asString(req.query.status)) filter.verificationStatus = req.query.status;

    const total = await Seller.countDocuments(filter);
    const sellers = await Seller.find(filter)
      .populate('userId', 'name')
      .sort({ [sortBy]: sortBy === 'shopName' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const data = await Promise.all(
      sellers.map(async (seller) => ({
        sellerId: seller._id,
        shopName: seller.shopName,
        ownerName: seller.userId?.name,
        location: seller.location,
        status: seller.verificationStatus,
        appliedDate: seller.createdAt,
        lastUpdated: seller.updatedAt,
        productsCount: await Product.countDocuments({ sellerId: seller._id }),
      }))
    );

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSellerVerificationDetail = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await Seller.findById(sellerId)
      .populate('userId', 'name email phone')
      .populate({ path: 'verificationHistory.officerId', populate: { path: 'userId', select: 'name' } });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const [productsCount, sampleProducts, complaintHistory] = await Promise.all([
      Product.countDocuments({ sellerId: seller._id }),
      Product.find({ sellerId: seller._id }).select('name price image').limit(6),
      Complaint.find({ sellerId: seller._id })
        .select('complaintNumber title status createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        sellerId: seller._id,
        shopName: seller.shopName,
        description: seller.description,
        location: seller.location,
        contact: seller.contact,
        owner: seller.userId,
        bankDetails: seller.bankDetails,
        documents: [],
        status: seller.verificationStatus,
        appliedDate: seller.createdAt,
        rejectionReason: seller.rejectionReason,
        reviewReason: seller.reviewReason,
        verificationHistory: seller.verificationHistory.map((h) => ({
          status: h.status,
          date: h.date,
          reason: h.reason,
          officerName: h.officerId?.userId?.name,
        })),
        productsCount,
        products: sampleProducts,
        totalOrders: seller.totalOrders,
        complaintHistory,
        complaintCount: complaintHistory.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resolveOfficerId = async (bodyOfficerId, fallbackUser) => {
  if (bodyOfficerId && mongoose.Types.ObjectId.isValid(bodyOfficerId)) {
    const officer = await GovernmentOfficer.findById(bodyOfficerId);
    if (officer) return officer._id;
  }
  const officer = await GovernmentOfficer.findOne({ userId: fallbackUser._id });
  return officer ? officer._id : undefined;
};

const approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const officerId = await resolveOfficerId(req.body.officerId, req.user);
    seller.verificationStatus = 'approved';
    seller.verifiedBy = officerId;
    seller.verificationDate = new Date();
    seller.rejectionReason = undefined;
    seller.reviewReason = undefined;
    seller.verificationHistory.push({ status: 'approved', date: new Date(), officerId });
    await seller.save();

    res.status(200).json({ success: true, message: 'Seller approved', data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const officerId = await resolveOfficerId(req.body.officerId, req.user);
    seller.verificationStatus = 'rejected';
    seller.rejectionReason = reason;
    seller.verifiedBy = officerId;
    seller.verificationDate = new Date();
    seller.verificationHistory.push({ status: 'rejected', date: new Date(), reason, officerId });
    await seller.save();

    res.status(200).json({ success: true, message: 'Seller rejected', data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reviewSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reviewReason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const officerId = await resolveOfficerId(req.body.officerId, req.user);
    seller.verificationStatus = 'review_required';
    seller.reviewReason = reviewReason;
    seller.verificationHistory.push({ status: 'review_required', date: new Date(), reason: reviewReason, officerId });
    await seller.save();

    res.status(200).json({ success: true, message: 'Seller marked for review', data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSellersForVerification,
  getSellerVerificationDetail,
  approveSeller,
  rejectSeller,
  reviewSeller,
};
