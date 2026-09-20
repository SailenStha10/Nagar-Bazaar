const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', getCategories);
router.get('/admin', protect, authorize(['admin']), getCategoriesAdmin);

router.post(
  '/',
  protect,
  authorize(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().isString(),
    body('icon').optional().isString(),
    body('image').optional().isString(),
  ],
  validate,
  createCategory
);

router.put(
  '/:categoryId',
  protect,
  authorize(['admin']),
  [
    body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
    body('description').optional().isString(),
    body('icon').optional().isString(),
    body('image').optional().isString(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateCategory
);

router.delete('/:categoryId', protect, authorize(['admin']), deleteCategory);

module.exports = router;
