const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { asString } = require('../utils/sanitize');

const generateComplaintNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `NC-${year}-`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await Complaint.countDocuments({ complaintNumber: { $regex: `^${prefix}` } });
    const candidate = `${prefix}${String(count + 1 + attempt).padStart(5, '0')}`;
    const exists = await Complaint.findOne({ complaintNumber: candidate });
    if (!exists) return candidate;
  }

  return `${prefix}${Date.now()}`;
};

const isOfficerOwner = async (complaint, user) => {
  if (user.role === 'admin') return true;
  if (user.role !== 'officer') return false;
  const officer = await GovernmentOfficer.findOne({ userId: user._id });
  if (!officer || !complaint.assignedOfficer) return false;
  // assignedOfficer may be a raw ObjectId or a populated document depending on the caller's query.
  const assignedOfficerId = complaint.assignedOfficer._id || complaint.assignedOfficer;
  return assignedOfficerId.toString() === officer._id.toString();
};

const createComplaint = async (req, res) => {
  try {
    const { category, title, description, sellerId, productId, attachments, relatedOrderId } = req.body;

    if (!sellerId && !productId) {
      return res.status(400).json({ success: false, message: 'Either sellerId or productId is required' });
    }

    if (sellerId) {
      if (!mongoose.Types.ObjectId.isValid(sellerId) || !(await Seller.findById(sellerId))) {
        return res.status(400).json({ success: false, message: 'Seller not found' });
      }
    }
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId) || !(await Product.findById(productId))) {
        return res.status(400).json({ success: false, message: 'Product not found' });
      }
    }
    if (relatedOrderId) {
      if (!mongoose.Types.ObjectId.isValid(relatedOrderId)) {
        return res.status(400).json({ success: false, message: 'Invalid related order' });
      }
      const order = await Order.findOne({ _id: relatedOrderId, userId: req.user._id });
      if (!order) {
        return res.status(400).json({ success: false, message: 'Related order not found' });
      }
    }

    const complaintNumber = await generateComplaintNumber();

    const complaint = await Complaint.create({
      complaintNumber,
      userId: req.user._id,
      sellerId,
      productId,
      relatedOrderId,
      category,
      title,
      description,
      attachments: attachments || [],
      status: 'submitted',
      timeline: [{ status: 'submitted', timestamp: new Date(), message: 'Complaint received' }],
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const filter = {};
    if (asString(req.query.status)) filter.status = req.query.status;
    if (asString(req.query.category)) filter.category = req.query.category;
    if (req.query.submittedBy && mongoose.Types.ObjectId.isValid(req.query.submittedBy)) {
      filter.userId = req.query.submittedBy;
    }
    const q = asString(req.query.q);
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { complaintNumber: { $regex: q, $options: 'i' } },
      ];
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
    }

    if (req.query.assignedTo === 'unassigned') {
      filter.assignedOfficer = null;
    } else if (req.query.assignedTo === 'me') {
      const officer = await GovernmentOfficer.findOne({ userId: req.user._id });
      filter.assignedOfficer = officer ? officer._id : null;
    } else if (req.query.assignedTo && mongoose.Types.ObjectId.isValid(req.query.assignedTo)) {
      filter.assignedOfficer = req.query.assignedTo;
    }

    const sortBy = req.query.sortBy === 'priority' ? 'priority' : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('userId', 'name')
      .populate('sellerId', 'shopName')
      .populate({ path: 'assignedOfficer', populate: { path: 'userId', select: 'name' } })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: complaints.map((c) => ({
        complaintId: c._id,
        complaintNumber: c.complaintNumber,
        category: c.category,
        title: c.title,
        status: c.status,
        submittedBy: c.userId ? { name: c.userId.name, userId: c.userId._id } : null,
        seller: c.sellerId ? { shopName: c.sellerId.shopName } : null,
        assignedOfficer: c.assignedOfficer ? { officerId: c.assignedOfficer._id, name: c.assignedOfficer.userId?.name } : null,
        createdAt: c.createdAt,
        priority: c.priority,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const STATUS_ORDER_INDEX = { submitted: 0, under_review: 1, in_progress: 2, resolved: 3 };

const getCitizenComplaints = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const filter = { userId: req.user._id };
    if (asString(req.query.status)) filter.status = req.query.status;
    if (asString(req.query.category)) filter.category = req.query.category;
    if (asString(req.query.q)) filter.complaintNumber = { $regex: req.query.q, $options: 'i' };
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
    }

    const all = await Complaint.find(filter);

    const sortBy = req.query.sortBy || 'latest';
    all.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'status') return STATUS_ORDER_INDEX[a.status] - STATUS_ORDER_INDEX[b.status];
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const total = all.length;
    const paged = all.slice((page - 1) * limit, (page - 1) * limit + limit);

    res.status(200).json({
      success: true,
      data: paged.map((c) => ({
        complaintId: c._id,
        complaintNumber: c.complaintNumber,
        category: c.category,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('userId', 'name email phone')
      .populate('sellerId', 'shopName contact')
      .populate({ path: 'productId', select: 'name categoryId', populate: { path: 'categoryId', select: 'name' } })
      .populate({ path: 'assignedOfficer', populate: { path: 'userId', select: 'name' } })
      .populate('relatedOrderId', 'orderNumber');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'customer' && complaint.userId._id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        category: complaint.category,
        title: complaint.title,
        description: complaint.description,
        status: complaint.status,
        timeline: complaint.timeline,
        submittedBy: complaint.userId,
        seller: complaint.sellerId,
        product: complaint.productId
          ? { name: complaint.productId.name, category: complaint.productId.categoryId?.name }
          : null,
        assignedOfficer: complaint.assignedOfficer
          ? { name: complaint.assignedOfficer.userId?.name, department: complaint.assignedOfficer.department }
          : null,
        officerRemarks: complaint.officerRemarks,
        resolution: complaint.resolution,
        attachments: complaint.attachments,
        relatedOrder: complaint.relatedOrderId ? { orderNumber: complaint.relatedOrderId.orderNumber } : null,
        createdAt: complaint.createdAt,
        resolvedAt: complaint.resolvedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, officerRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (!(await isOfficerOwner(complaint, req.user))) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this complaint' });
    }
    if (complaint.status === 'resolved') {
      return res.status(400).json({ success: false, message: 'Complaint is already resolved' });
    }

    complaint.status = status;
    if (officerRemarks !== undefined) complaint.officerRemarks = officerRemarks;
    complaint.timeline.push({ status, timestamp: new Date(), message: officerRemarks || undefined });
    if (status === 'resolved') complaint.resolvedAt = new Date();
    await complaint.save();

    res.status(200).json({ success: true, message: 'Complaint status updated', data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const assignOfficer = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { officerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({ success: false, message: 'Invalid officer' });
    }

    const officer = await GovernmentOfficer.findById(officerId);
    if (!officer) {
      return res.status(400).json({ success: false, message: 'Officer not found' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedOfficer = officerId;
    if (complaint.status === 'submitted') {
      complaint.status = 'under_review';
      complaint.timeline.push({ status: 'under_review', timestamp: new Date(), message: 'Officer assigned' });
    }
    await complaint.save();

    res.status(200).json({ success: true, message: 'Complaint assigned', data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolution, officerRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (!(await isOfficerOwner(complaint, req.user))) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this complaint' });
    }
    if (complaint.status === 'resolved') {
      return res.status(400).json({ success: false, message: 'Complaint is already resolved' });
    }

    complaint.resolution = resolution;
    if (officerRemarks !== undefined) complaint.officerRemarks = officerRemarks;
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.timeline.push({ status: 'resolved', timestamp: new Date(), message: 'Complaint resolved' });
    await complaint.save();

    res.status(200).json({ success: true, message: 'Complaint resolved', data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getCitizenComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignOfficer,
  resolveComplaint,
};
