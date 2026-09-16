const express = require('express');
const { body } = require('express-validator');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getCart);

router.post(
  '/add',
  [
    body('productId').notEmpty().withMessage('productId is required'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
  ],
  validate,
  addToCart
);

router.put(
  '/item/:itemId',
  [body('quantity').isInt().withMessage('quantity must be an integer')],
  validate,
  updateCartItem
);

router.delete('/item/:itemId', removeCartItem);

router.delete('/clear', clearCart);

module.exports = router;
