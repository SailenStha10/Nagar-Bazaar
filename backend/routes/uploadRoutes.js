const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, (req, res) => {
  upload.array('files', 3)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }

    const urls = req.files.map((file) => `/uploads/${file.filename}`);
    res.status(201).json({ success: true, message: 'Files uploaded', data: { urls } });
  });
});

module.exports = router;
