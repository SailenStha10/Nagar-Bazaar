const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const { asString } = require('../utils/sanitize');

const SORT_FIELDS = ['name', 'price', 'stock', 'createdAt'];

const getSellerForUser = async (userId) => Seller.findOne({ userId });

const buildLocalDetails = (isLocal, localProductDetails) =>
  isLocal ? localProductDetails || {} : undefined;

// Cross-field discount validation lives here rather than in express-validator,
// since it needs the product's (possibly not-yet-updated) price to check a
// flat sale price actually undercuts it.
const validateDiscount = (discountType, discountValue, price) => {
  if (!discountType || discountType === 'none') return null;
  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Discount value must be a positive number';
  }
  if (discountType === 'percentage' && value > 100) {
    return 'Discount percentage cannot exceed 100';
  }
  if (discountType === 'flat' && value >= price) {
    return 'Discounted price must be less than the regular price';
  }
  return null;
};

const addSellerProduct = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const { name, description, categoryId, price, stock, image, isLocal, localProductDetails, discountType, discountValue } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const discountError = validateDiscount(discountType, discountValue, Number(price));
    if (discountError) {
      return res.status(400).json({ success: false, message: discountError });
    }

    const product = await Product.create({
      sellerId: seller._id,
      categoryId,
      name,
      description,
      price,
      stock,
      image,
      discountType: discountType && discountType !== 'none' ? discountType : 'none',
      discountValue: discountType && discountType !== 'none' ? Number(discountValue) : 0,
      isLocal: Boolean(isLocal),
      localProductDetails: buildLocalDetails(isLocal, localProductDetails),
    });

    res.status(201).json({ success: true, message: 'Product added', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSellerProducts = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const sortBy = SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = { sellerId: seller._id };
    if (asString(req.query.q)) {
      filter.name = { $regex: req.query.q, $options: 'i' };
    }
    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.categoryId = req.query.category;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name icon')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSellerProductById = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findOne({ _id: productId, sellerId: seller._id }).populate('categoryId', 'name icon');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSellerProduct = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findOne({ _id: productId, sellerId: seller._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, categoryId, price, stock, image, isLocal, localProductDetails, discountType, discountValue } = req.body;

    if (categoryId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
      product.categoryId = categoryId;
    }

    if (discountType !== undefined || discountValue !== undefined || price !== undefined) {
      const effectivePrice = price !== undefined ? Number(price) : product.price;
      const effectiveType = discountType !== undefined ? discountType : product.discountType;
      const effectiveValue = discountValue !== undefined ? discountValue : product.discountValue;
      const discountError = validateDiscount(effectiveType, effectiveValue, effectivePrice);
      if (discountError) {
        return res.status(400).json({ success: false, message: discountError });
      }
      product.discountType = effectiveType && effectiveType !== 'none' ? effectiveType : 'none';
      product.discountValue = effectiveType && effectiveType !== 'none' ? Number(effectiveValue) : 0;
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (image !== undefined) product.image = image;
    if (isLocal !== undefined) {
      product.isLocal = Boolean(isLocal);
      product.localProductDetails = buildLocalDetails(isLocal, localProductDetails);
    } else if (localProductDetails !== undefined && product.isLocal) {
      product.localProductDetails = localProductDetails;
    }

    await product.save();

    res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSellerProduct = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, sellerId: seller._id },
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  addSellerProduct,
  getSellerProducts,
  getSellerProductById,
  updateSellerProduct,
  deleteSellerProduct,
};
