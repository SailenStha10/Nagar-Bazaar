const express = require('express');
const { seedDatabase } = require('../utils/seedDatabase');

const router = express.Router();

router.post('/initialize', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, message: 'Seeding is only available in development mode' });
  }

  try {
    const result = await seedDatabase();
    res.status(200).json({
      success: true,
      message: result.alreadySeeded ? 'Database was already seeded' : 'Database seeded successfully',
      counts: result.counts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
