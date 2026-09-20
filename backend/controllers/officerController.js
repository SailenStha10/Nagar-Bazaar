const GovernmentOfficer = require('../models/GovernmentOfficer');
const Complaint = require('../models/Complaint');
const Seller = require('../models/Seller');
const MarketPrice = require('../models/MarketPrice');

const CATEGORY_LABELS = {
  overpricing: 'Overpricing',
  expired_product: 'Expired Product',
  quality_issue: 'Quality Issue',
  misleading_info: 'Misleading Info',
  seller_issue: 'Seller Issue',
  other: 'Other',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const TREND_DAYS = 14;
const RECENT_LIMIT = 5;
const ACTIVITY_LIMIT = 8;

const deviationOf = (price, avg) => {
  if (!avg) return 0;
  return Math.round(((price - avg) / avg) * 1000) / 10;
};

const dayKey = (date) => new Date(date).toISOString().split('T')[0];

const buildDayWindow = (days) => {
  const today = new Date();
  const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const map = {};
  for (let i = days - 1; i >= 0; i -= 1) {
    map[dayKey(new Date(todayUTCStart - i * dayMs))] = 0;
  }
  return { map, windowStart: todayUTCStart - (days - 1) * dayMs };
};

const getOfficerDashboard = async (req, res) => {
  try {
    const officer = await GovernmentOfficer.findOne({ userId: req.user._id });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer profile not found' });
    }

    // --- Personal workload ---
    const assignedAll = await Complaint.find({ assignedOfficer: officer._id });
    const assignedComplaints = assignedAll.length;
    const resolvedAssigned = assignedAll.filter((c) => c.status === 'resolved');
    const resolvedComplaints = resolvedAssigned.length;
    const pendingComplaints = assignedComplaints - resolvedComplaints;
    const resolutionRate = assignedComplaints > 0 ? Math.round((resolvedComplaints / assignedComplaints) * 100) / 100 : 0;

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const resolvedThisMonth = resolvedAssigned.filter((c) => c.resolvedAt && new Date(c.resolvedAt) >= monthStart).length;

    const resolutionTimes = resolvedAssigned
      .filter((c) => c.resolvedAt)
      .map((c) => (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
    const averageResolutionTime = resolutionTimes.length
      ? Math.round((resolutionTimes.reduce((sum, d) => sum + d, 0) / resolutionTimes.length) * 10) / 10
      : 0;

    // My workload: pending complaints assigned to me, with assignment date & days pending
    const myWorkload = assignedAll
      .filter((c) => c.status !== 'resolved')
      .map((c) => {
        const assignedEvent = c.timeline.find((t) => t.status === 'under_review');
        const assignedDate = assignedEvent ? assignedEvent.timestamp : c.createdAt;
        const daysPending = Math.max(0, Math.floor((now - new Date(assignedDate)) / (1000 * 60 * 60 * 24)));
        return {
          complaintId: c._id,
          complaintNumber: c.complaintNumber,
          title: c.title,
          priority: c.priority,
          status: c.status,
          assignedDate,
          daysPending,
        };
      })
      .sort((a, b) => b.daysPending - a.daysPending)
      .slice(0, 10);

    const recentComplaints = assignedAll
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, RECENT_LIMIT)
      .map((c) => ({
        complaintId: c._id,
        complaintNumber: c.complaintNumber,
        title: c.title,
        status: c.status,
        category: c.category,
        createdAt: c.createdAt,
      }));

    // --- System-wide overview (all complaints, for the shared government dashboard) ---
    const allComplaints = await Complaint.find().populate('userId', 'name');
    const totalComplaints = allComplaints.length;
    const totalPending = allComplaints.filter((c) => c.status !== 'resolved').length;
    const totalResolved = allComplaints.length - totalPending;
    const systemResolutionRate = totalComplaints > 0 ? Math.round((totalResolved / totalComplaints) * 100) / 100 : 0;
    const systemResolutionTimes = allComplaints
      .filter((c) => c.status === 'resolved' && c.resolvedAt)
      .map((c) => (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
    const systemAverageResolutionTime = systemResolutionTimes.length
      ? Math.round((systemResolutionTimes.reduce((sum, d) => sum + d, 0) / systemResolutionTimes.length) * 10) / 10
      : 0;

    const categoryDistribution = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
      category: value,
      label,
      count: allComplaints.filter((c) => c.category === value).length,
    }));

    const statusDistribution = Object.entries(STATUS_LABELS).map(([value, label]) => ({
      status: value,
      label,
      count: allComplaints.filter((c) => c.status === value).length,
    }));

    // Recent complaints not assigned to this officer (unassigned or handled by others)
    const unassignedRecentComplaints = allComplaints
      .filter((c) => !c.assignedOfficer || c.assignedOfficer.toString() !== officer._id.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, RECENT_LIMIT)
      .map((c) => ({
        complaintId: c._id,
        complaintNumber: c.complaintNumber,
        title: c.title,
        status: c.status,
        category: c.category,
        submittedBy: c.userId?.name,
        assigned: Boolean(c.assignedOfficer),
        createdAt: c.createdAt,
      }));

    const { map: trendMap, windowStart } = buildDayWindow(TREND_DAYS);
    allComplaints
      .filter((c) => new Date(c.createdAt).getTime() >= windowStart)
      .forEach((c) => {
        const key = dayKey(c.createdAt);
        if (trendMap[key] !== undefined) trendMap[key] += 1;
      });
    const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    // Resolution timeline: system-wide resolutions per day (last 14 days)
    const { map: resolutionMap } = buildDayWindow(TREND_DAYS);
    allComplaints
      .filter((c) => c.status === 'resolved' && c.resolvedAt && new Date(c.resolvedAt).getTime() >= windowStart)
      .forEach((c) => {
        const key = dayKey(c.resolvedAt);
        if (resolutionMap[key] !== undefined) resolutionMap[key] += 1;
      });
    const resolutionTimeline = Object.entries(resolutionMap).map(([date, count]) => ({ date, count }));

    // Workload trend: complaints assigned to me per day (last 14 days), by under_review timeline event
    const { map: workloadMap } = buildDayWindow(TREND_DAYS);
    assignedAll.forEach((c) => {
      const assignedEvent = c.timeline.find((t) => t.status === 'under_review');
      const assignedAt = assignedEvent ? assignedEvent.timestamp : c.createdAt;
      if (new Date(assignedAt).getTime() >= windowStart) {
        const key = dayKey(assignedAt);
        if (workloadMap[key] !== undefined) workloadMap[key] += 1;
      }
    });
    const workloadTrend = Object.entries(workloadMap).map(([date, count]) => ({ date, count }));

    // --- Seller verification ---
    const sellersUnderReview = await Seller.countDocuments({ verificationStatus: { $in: ['pending', 'review_required'] } });
    const verifiedSellers = await Seller.countDocuments({ verificationStatus: 'approved' });
    const recentSellerApplications = await Seller.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .select('shopName location verificationStatus createdAt userId');

    // --- Market monitoring ---
    const marketPrices = await MarketPrice.find().populate('productId', 'name').populate('sellerId', 'shopName');
    const pricesUnderReview = marketPrices.filter((p) => p.status === 'review_required').length;
    const topOverpriced = marketPrices
      .filter((p) => p.averageMarketPrice)
      .map((p) => ({
        priceId: p._id,
        product: p.productId?.name,
        seller: p.sellerId?.shopName,
        deviation: deviationOf(p.price, p.averageMarketPrice),
      }))
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 5);
    const recentPriceViolations = marketPrices
      .filter((p) => p.status === 'review_required')
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, RECENT_LIMIT)
      .map((p) => ({
        priceId: p._id,
        product: p.productId?.name,
        seller: p.sellerId?.shopName,
        deviation: deviationOf(p.price, p.averageMarketPrice),
        lastUpdated: p.lastUpdated,
      }));

    // --- Recent activity (this officer's own actions) ---
    const activity = [];
    assignedAll.forEach((c) => {
      c.timeline
        .filter((t) => t.status !== 'submitted')
        .forEach((t) => {
          activity.push({
            type: 'complaint',
            description: `${STATUS_LABELS[t.status] || t.status} — ${c.complaintNumber}`,
            timestamp: t.timestamp,
          });
        });
    });
    const mySellerActions = await Seller.find({ 'verificationHistory.officerId': officer._id }).select('shopName verificationHistory');
    mySellerActions.forEach((s) => {
      s.verificationHistory
        .filter((h) => h.officerId?.toString() === officer._id.toString())
        .forEach((h) => {
          activity.push({
            type: 'verification',
            description: `Marked ${s.shopName} as ${h.status.replace('_', ' ')}`,
            timestamp: h.date,
          });
        });
    });
    const myPriceActions = marketPrices.filter((p) => p.monitoredBy?.toString() === officer._id.toString());
    myPriceActions.forEach((p) => {
      (p.history || []).forEach((h) => {
        activity.push({
          type: 'price',
          description: `Updated ${p.productId?.name || 'a product'} price status to ${h.status.replace('_', ' ')}`,
          timestamp: h.date,
        });
      });
    });
    const recentActivity = activity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, ACTIVITY_LIMIT);

    res.status(200).json({
      success: true,
      data: {
        officerProfile: {
          name: req.user.name,
          department: officer.department,
          designation: officer.designation,
          officeLocation: officer.officeLocation,
        },
        assignedComplaints,
        pendingComplaints,
        resolvedComplaints,
        resolvedThisMonth,
        resolutionRate,
        averageResolutionTime,
        myWorkload,
        recentComplaints,
        sellersUnderReview,
        verifiedSellers,
        recentSellerApplications: recentSellerApplications.map((s) => ({
          sellerId: s._id,
          shopName: s.shopName,
          ownerName: s.userId?.name,
          location: s.location,
          status: s.verificationStatus,
          appliedDate: s.createdAt,
        })),
        marketMonitoring: {
          pricesUnderReview,
          topOverpriced,
          recentPriceViolations,
        },
        systemStats: {
          totalComplaints,
          pendingComplaints: totalPending,
          resolvedComplaints: totalResolved,
          resolutionRate: systemResolutionRate,
          averageResolutionTime: systemAverageResolutionTime,
        },
        unassignedRecentComplaints,
        categoryDistribution,
        statusDistribution,
        trend,
        resolutionTimeline,
        workloadTrend,
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const listOfficers = async (req, res) => {
  try {
    const officers = await GovernmentOfficer.find().populate('userId', 'name');
    const withCounts = await Promise.all(
      officers.map(async (officer) => ({
        officerId: officer._id,
        name: officer.userId?.name,
        department: officer.department,
        designation: officer.designation,
        assignedCount: await Complaint.countDocuments({ assignedOfficer: officer._id, status: { $ne: 'resolved' } }),
      }))
    );

    res.status(200).json({ success: true, data: withCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOfficerDashboard, listOfficers };
