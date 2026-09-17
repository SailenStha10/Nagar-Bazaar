const express = require('express');
const { body } = require('express-validator');
const {
  registerSeller,
  getSellerById,
  getSellers,
  updateSellerProfile,
} = require('../controllers/sellerController');
const {
  addSellerProduct,
  getSellerProducts,
  getSellerProductById,
  updateSellerProduct,
  deleteSellerProduct,
} = require('../controllers/sellerProductController');
const { getSellerDashboard } = require('../controllers/sellerDashboardController');
const {
  getSellerOrders,
  getSellerOrderById,
  updateOrderStatus,
} = require('../controllers/sellerOrderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const PHONE_REGEX = /^[0-9+\-\s]{7,15}$/;

router.get('/', getSellers);

router.post(
  '/register',
  protect,
  authorize(['seller']),
  [
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('contact').matches(PHONE_REGEX).withMessage('A valid contact number is required'),
    body('bankDetails').optional().isObject(),
    body('banner').optional().isString(),
  ],
  validate,
  registerSeller
);

router.put(
  '/profile',
  protect,
  authorize(['seller']),
  [
    body('shopName').optional().trim().notEmpty().withMessage('Shop name cannot be empty'),
    body('contact').optional().matches(PHONE_REGEX).withMessage('A valid contact number is required'),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('banner').optional().isString(),
  ],
  validate,
  updateSellerProfile
);

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().isString(),
  body('categoryId').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('image').optional().isString(),
  body('isLocal').optional().isBoolean(),
  body('localProductDetails').optional().isObject(),
];

router.post('/products', protect, authorize(['seller']), productValidation, validate, addSellerProduct);
router.get('/products', protect, authorize(['seller']), getSellerProducts);

router.put(
  '/products/:productId',
  protect,
  authorize(['seller']),
  [
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('description').optional().isString(),
    body('categoryId').optional().notEmpty().withMessage('Category cannot be empty'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('image').optional().isString(),
    body('isLocal').optional().isBoolean(),
    body('localProductDetails').optional().isObject(),
  ],
  validate,
  updateSellerProduct
);

router.get('/products/:productId', protect, authorize(['seller']), getSellerProductById);
router.delete('/products/:productId', protect, authorize(['seller']), deleteSellerProduct);

router.get('/dashboard', protect, authorize(['seller']), getSellerDashboard);

router.get('/orders', protect, authorize(['seller']), getSellerOrders);
router.get('/orders/:orderId', protect, authorize(['seller']), getSellerOrderById);
router.put(
  '/orders/:orderId/status',
  protect,
  authorize(['seller']),
  [body('status').isIn(['confirmed', 'shipped', 'delivered']).withMessage('Invalid status')],
  validate,
  updateOrderStatus
);

router.get('/:sellerId', getSellerById);

module.exports = router;
