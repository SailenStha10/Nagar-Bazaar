const express = require('express');
const { body } = require('express-validator');
const {
  getPrices,
  getPriceById,
  updatePriceStatus,
  getAnalytics,
  scanPrices,
  getProductAnomaly,
} = require('../controllers/marketMonitoringController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize(['officer', 'admin']));

router.get('/prices', getPrices);
router.get('/analytics', getAnalytics);
router.post('/scan', scanPrices);
router.get('/products/:productId/anomaly', getProductAnomaly);
router.get('/prices/:priceId', getPriceById);

router.put(
  '/prices/:priceId/status',
  [
    body('status').isIn(['normal', 'review_required']).withMessage('Invalid status'),
    body('remarks').optional().isString(),
  ],
  validate,
  updatePriceStatus
);

module.exports = router;
