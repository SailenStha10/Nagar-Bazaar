const express = require('express');
const { body } = require('express-validator');
const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  archiveNotice,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const CATEGORIES = ['market_info', 'consumer_awareness', 'public_notice', 'regulations', 'price_info'];
const PRIORITIES = ['low', 'medium', 'high'];

router.get('/', getNotices);
router.get('/:noticeId', getNoticeById);

router.post(
  '/',
  protect,
  authorize(['officer', 'admin']),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('category').isIn(CATEGORIES).withMessage('Invalid notice category'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  ],
  validate,
  createNotice
);

router.put(
  '/:noticeId',
  protect,
  authorize(['officer', 'admin']),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
    body('category').optional().isIn(CATEGORIES).withMessage('Invalid notice category'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  ],
  validate,
  updateNotice
);

router.delete('/:noticeId', protect, authorize(['admin']), deleteNotice);
router.put('/:noticeId/archive', protect, authorize(['admin']), archiveNotice);

module.exports = router;
