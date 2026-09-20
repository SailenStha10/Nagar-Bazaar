const express = require('express');
const { getCustomerDashboard } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize(['customer']), getCustomerDashboard);

module.exports = router;
