const express = require('express');
const { getOfficerDashboard, listOfficers } = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize(['officer']), getOfficerDashboard);
router.get('/', authorize(['officer', 'admin']), listOfficers);

module.exports = router;
