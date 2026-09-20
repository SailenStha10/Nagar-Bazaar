const express = require('express');
const { body } = require('express-validator');
const {
  getSellersForVerification,
  getSellerVerificationDetail,
  approveSeller,
  rejectSeller,
  reviewSeller,
} = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize(['officer', 'admin']));

router.get('/sellers', getSellersForVerification);
router.get('/sellers/:sellerId', getSellerVerificationDetail);

router.put('/sellers/:sellerId/approve', authorize(['admin']), [body('officerId').optional().isString()], validate, approveSeller);

router.put(
  '/sellers/:sellerId/reject',
  authorize(['admin']),
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required'), body('officerId').optional().isString()],
  validate,
  rejectSeller
);

router.put(
  '/sellers/:sellerId/review',
  authorize(['admin']),
  [body('reviewReason').trim().notEmpty().withMessage('Review reason is required'), body('officerId').optional().isString()],
  validate,
  reviewSeller
);

module.exports = router;
