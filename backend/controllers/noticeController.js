const mongoose = require('mongoose');
const GovernmentNotice = require('../models/GovernmentNotice');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { asString } = require('../utils/sanitize');

const formatIssuer = (officer) => {
  if (!officer) return null;
  return {
    name: officer.userId?.name,
    department: officer.department,
    office: officer.officeLocation,
  };
};

const createNotice = async (req, res) => {
  try {
    const { title, content, category, priority } = req.body;
    const officer = await GovernmentOfficer.findOne({ userId: req.user._id });

    const notice = await GovernmentNotice.create({
      title,
      content,
      category,
      priority: priority || 'low',
      issuedBy: officer ? officer._id : undefined,
      publishedAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Notice created', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getNotices = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const filter = { isArchived: req.query.archived === 'true' };
    if (asString(req.query.category)) filter.category = req.query.category;
    if (asString(req.query.priority)) filter.priority = req.query.priority;
    if (asString(req.query.q)) filter.title = { $regex: req.query.q, $options: 'i' };

    const sortBy = req.query.sortBy === 'priority' ? 'priority' : 'publishedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const total = await GovernmentNotice.countDocuments(filter);
    const notices = await GovernmentNotice.find(filter)
      .populate({ path: 'issuedBy', populate: { path: 'userId', select: 'name' } })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: notices.map((n) => ({
        noticeId: n._id,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        issuedBy: formatIssuer(n.issuedBy),
        publishedAt: n.publishedAt,
        viewCount: n.viewCount,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getNoticeById = async (req, res) => {
  try {
    const { noticeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noticeId)) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const notice = await GovernmentNotice.findByIdAndUpdate(
      noticeId,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate({ path: 'issuedBy', populate: { path: 'userId', select: 'name' } });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        noticeId: notice._id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        priority: notice.priority,
        issuedBy: formatIssuer(notice.issuedBy),
        publishedAt: notice.publishedAt,
        archiveDate: notice.archiveAt,
        viewCount: notice.viewCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noticeId)) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const notice = await GovernmentNotice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const { title, content, category, priority } = req.body;
    if (title !== undefined) notice.title = title;
    if (content !== undefined) notice.content = content;
    if (category !== undefined) notice.category = category;
    if (priority !== undefined) notice.priority = priority;
    await notice.save();

    res.status(200).json({ success: true, message: 'Notice updated', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noticeId)) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const notice = await GovernmentNotice.findByIdAndDelete(noticeId);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const archiveNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noticeId)) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const notice = await GovernmentNotice.findByIdAndUpdate(
      noticeId,
      { isArchived: true, archiveAt: new Date() },
      { new: true }
    );
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.status(200).json({ success: true, message: 'Notice archived', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createNotice, getNotices, getNoticeById, updateNotice, deleteNotice, archiveNotice };
