const mongoose = require('mongoose');
const User = require('../models/User');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const Complaint = require('../models/Complaint');
const { hashPassword } = require('../utils/auth');

const getOfficers = async (req, res) => {
  try {
    const officers = await GovernmentOfficer.find().populate('userId', 'name email phone isActive').sort({ createdAt: -1 });
    const data = await Promise.all(
      officers.map(async (officer) => {
        const assigned = await Complaint.countDocuments({ assignedOfficer: officer._id });
        const resolved = await Complaint.countDocuments({ assignedOfficer: officer._id, status: 'resolved' });
        return {
          officerId: officer._id,
          userId: officer.userId?._id,
          name: officer.userId?.name,
          email: officer.userId?.email,
          isActive: officer.userId?.isActive,
          department: officer.department,
          designation: officer.designation,
          officeLocation: officer.officeLocation,
          verificationLimit: officer.verificationLimit,
          assigned,
          resolved,
          resolutionRate: assigned > 0 ? Math.round((resolved / assigned) * 1000) / 10 : 0,
        };
      })
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createOfficer = async (req, res) => {
  try {
    const { name, email, password, phone, department, designation, officeLocation } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword, phone, role: 'officer' });
    const officer = await GovernmentOfficer.create({ userId: user._id, department, designation, officeLocation });

    res.status(201).json({
      success: true,
      message: 'Officer account created',
      data: { officerId: officer._id, userId: user._id, name: user.name, email: user.email, department, designation, officeLocation },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    const officer = await GovernmentOfficer.findById(officerId);
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    const { department, designation, officeLocation, verificationLimit, name, phone } = req.body;
    if (department !== undefined) officer.department = department;
    if (designation !== undefined) officer.designation = designation;
    if (officeLocation !== undefined) officer.officeLocation = officeLocation;
    if (verificationLimit !== undefined) officer.verificationLimit = verificationLimit;
    await officer.save();

    if (name !== undefined || phone !== undefined) {
      const update = {};
      if (name !== undefined) update.name = name;
      if (phone !== undefined) update.phone = phone;
      await User.findByIdAndUpdate(officer.userId, update);
    }

    res.status(200).json({ success: true, message: 'Officer updated', data: officer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setOfficerActive = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { isActive } = req.body;
    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    const officer = await GovernmentOfficer.findById(officerId);
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    await User.findByIdAndUpdate(officer.userId, { isActive });

    res.status(200).json({ success: true, message: isActive ? 'Officer activated' : 'Officer deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOfficers, createOfficer, updateOfficer, setOfficerActive };
