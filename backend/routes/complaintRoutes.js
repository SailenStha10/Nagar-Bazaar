const express = require('express');
const { body } = require('express-validator');
const {
  createComplaint,
  getComplaints,
  getCitizenComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignOfficer,
  resolveComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const CATEGORIES = ['overpricing', 'expired_product', 'quality_issue', 'misleading_info', 'seller_issue', 'other'];

router.use(protect);

router.post(
  '/',
  authorize(['customer']),
  [
    body('category').isIn(CATEGORIES).withMessage('Invalid complaint category'),
    body('title').trim().isLength({ min: 10 }).withMessage('Title must be at least 10 characters'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('sellerId').optional().isString(),
    body('productId').optional().isString(),
    body('relatedOrderId').optional().isString(),
    body('attachments').optional().isArray({ max: 3 }).withMessage('You can attach up to 3 files'),
  ],
  validate,
  createComplaint
);

router.get('/citizen', authorize(['customer']), getCitizenComplaints);
router.get('/', authorize(['officer', 'admin']), getComplaints);

router.put(
  '/:complaintId/status',
  authorize(['officer', 'admin']),
  [
    body('status').isIn(['under_review', 'in_progress', 'resolved']).withMessage('Invalid status'),
    body('officerRemarks').optional().isString(),
  ],
  validate,
  updateComplaintStatus
);

router.put(
  '/:complaintId/assign',
  authorize(['admin']),
  [body('officerId').notEmpty().withMessage('officerId is required')],
  validate,
  assignOfficer
);

router.put(
  '/:complaintId/resolve',
  authorize(['officer', 'admin']),
  [
    body('resolution').trim().notEmpty().withMessage('Resolution text is required'),
    body('officerRemarks').optional().isString(),
  ],
  validate,
  resolveComplaint
);

router.get('/:complaintId', getComplaintById);

module.exports = router;
