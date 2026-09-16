const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', getCategories);

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

module.exports = router;
