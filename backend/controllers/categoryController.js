const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const data = await Promise.all(
      categories.map(async (cat) => ({
        _id: cat._id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        image: cat.image,
        isActive: cat.isActive,
        productCount: await Product.countDocuments({ categoryId: cat._id, isActive: true }),
      }))
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon, image } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name, description, icon, image });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, icon, image, isActive } = req.body;
    if (name && name !== category.name) {
      const existing = await Category.findOne({ name, _id: { $ne: category._id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Category name already in use' });
      }
      category.name = name;
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    await category.save();

    res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ categoryId, isActive: true });
    if (productCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${productCount} active product(s) use this category` });
    }

    const category = await Category.findByIdAndUpdate(categoryId, { isActive: false }, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCategories, getCategoriesAdmin, createCategory, updateCategory, deleteCategory };
