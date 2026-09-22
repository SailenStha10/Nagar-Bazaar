const express = require('express');
const {
  getHybridRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:userId', getHybridRecommendations);
router.get('/:userId/collaborative', getCollaborativeRecommendations);
router.get('/:userId/content', getContentBasedRecommendations);

module.exports = router;
