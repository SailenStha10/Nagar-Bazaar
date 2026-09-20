const mongoose = require('mongoose');
const User = require('../models/User');
const { asString } = require('../utils/sanitize');

const getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const filter = {};
    if (asString(req.query.role)) filter.role = req.query.role;
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'blocked') filter.isActive = false;
    if (asString(req.query.q)) {
      filter.$or = [
        { name: { $regex: req.query.q, $options: 'i' } },
        { email: { $regex: req.query.q, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('name email role phone isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own account status' });
    }

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: isActive ? 'User unblocked' : 'User blocked', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, getUserById, setUserActive };
