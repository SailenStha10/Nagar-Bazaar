const express = require('express');
const { body } = require('express-validator');
const { checkout, getOrders, getOrderById, trackOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/checkout',
  [
    body('deliveryAddress').trim().isLength({ min: 5 }).withMessage('A valid delivery address is required'),
    body('paymentMethod').isIn(['cod', 'online']).withMessage('Invalid payment method'),
  ],
  validate,
  checkout
);

router.get('/', getOrders);
router.get('/:orderId/track', trackOrder);
router.get('/:orderId', getOrderById);

module.exports = router;
