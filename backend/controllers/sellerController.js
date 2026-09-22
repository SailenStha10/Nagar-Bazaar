const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const { asString } = require('../utils/sanitize');

const formatSeller = async (seller) => ({
  _id: seller._id,
  userId: seller.userId,
  shopName: seller.shopName,
  description: seller.description,
  location: seller.location,
  contact: seller.contact,
  banner: seller.banner,
  ratings: seller.ratings,
  totalOrders: seller.totalOrders,
  productCount: await Product.countDocuments({ sellerId: seller._id, isActive: true }),
  verificationStatus: seller.verificationStatus,
  verifiedBy: seller.verifiedBy,
  verificationDate: seller.verificationDate,
  rejectionReason: seller.rejectionReason,
  reviewReason: seller.reviewReason,
  createdAt: seller.createdAt,
});

const registerSeller = async (req, res) => {
  try {
    const { shopName, description, location, contact, bankDetails, banner } = req.body;

    const existingProfile = await Seller.findOne({ userId: req.user._id });
    if (existingProfile) {
      return res.status(409).json({ success: false, message: 'Seller profile already exists for this account' });
    }

    const existingShop = await Seller.findOne({ shopName });
    if (existingShop) {
      return res.status(409).json({ success: false, message: 'Shop name is already taken' });
    }

    const seller = await Seller.create({
      userId: req.user._id,
      shopName,
      description,
      location,
      contact,
      bankDetails,
      banner,
    });

    res.status(201).json({
      success: true,
      message: 'Seller profile created',
      data: {
        sellerId: seller._id,
        userId: seller.userId,
        shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        createdAt: seller.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSellerById = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    res.status(200).json({ success: true, data: await formatSeller(seller) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSellers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);

    const filter = {};
    if (asString(req.query.location)) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }
    if (req.query.verified === 'true') {
      filter.verificationStatus = 'approved';
    }

    const total = await Seller.countDocuments(filter);
    const sellers = await Seller.find(filter)
      .sort({ shopName: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: await Promise.all(sellers.map(formatSeller)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOwnSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    res.status(200).json({ success: true, data: await formatSeller(seller) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const { shopName, description, location, contact, banner } = req.body;

    if (shopName && shopName !== seller.shopName) {
      const existingShop = await Seller.findOne({ shopName, _id: { $ne: seller._id } });
      if (existingShop) {
        return res.status(409).json({ success: false, message: 'Shop name is already taken' });
      }
      seller.shopName = shopName;
    }

    if (description !== undefined) seller.description = description;
    if (location !== undefined) seller.location = location;
    if (contact !== undefined) seller.contact = contact;
    if (banner !== undefined) seller.banner = banner;

    await seller.save();

    res.status(200).json({ success: true, message: 'Profile updated', data: await formatSeller(seller) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerSeller, getSellerById, getSellers, getOwnSellerProfile, updateSellerProfile };
