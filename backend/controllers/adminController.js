const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Complaint = require('../models/Complaint');
const GovernmentOfficer = require('../models/GovernmentOfficer');

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

const SELLER_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  review_required: 'Review Required',
};

const TREND_DAYS = 14;
const RECENT_LIMIT = 5;
const ACTIVITY_LIMIT = 10;

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

const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const todayUTCStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // --- System stats ---
    const [totalUsers, totalSellers, verifiedSellers, totalProducts, totalComplaints] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Seller.countDocuments({ verificationStatus: 'approved' }),
      Product.countDocuments({ isActive: true }),
      Complaint.countDocuments(),
    ]);

    const ordersThisMonth = await Order.find({ createdAt: { $gte: monthStart }, orderStatus: { $ne: 'cancelled' } });
    const totalOrdersThisMonth = ordersThisMonth.length;
    const totalRevenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.totalAmount, 0);

    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 1000) / 10 : 0;

    // --- User management ---
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(RECENT_LIMIT).select('name email role createdAt isActive');
    const userBreakdown = await Promise.all(
      ['customer', 'seller', 'officer', 'admin'].map(async (role) => ({ role, count: await User.countDocuments({ role }) }))
    );
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: todayUTCStart } });

    // --- Seller management ---
    const sellersByStatus = await Promise.all(
      Object.entries(SELLER_STATUS_LABELS).map(async ([status, label]) => ({
        status,
        label,
        count: await Seller.countDocuments({ verificationStatus: status }),
      }))
    );
    const pendingVerifications = await Seller.countDocuments({ verificationStatus: { $in: ['pending', 'review_required'] } });
    const recentSellerApplications = await Seller.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .select('shopName location verificationStatus createdAt userId');

    // --- Market activity ---
    const { map: orderTrendMap, windowStart } = buildDayWindow(TREND_DAYS);
    const { map: revenueTrendMap } = buildDayWindow(TREND_DAYS);
    const recentOrdersForTrend = await Order.find({ createdAt: { $gte: new Date(windowStart) }, orderStatus: { $ne: 'cancelled' } }).select(
      'createdAt totalAmount'
    );
    recentOrdersForTrend.forEach((o) => {
      const key = dayKey(o.createdAt);
      if (orderTrendMap[key] !== undefined) orderTrendMap[key] += 1;
      if (revenueTrendMap[key] !== undefined) revenueTrendMap[key] += o.totalAmount;
    });
    const ordersTrend = Object.entries(orderTrendMap).map(([date, count]) => ({ date, count }));
    const revenueTrend = Object.entries(revenueTrendMap).map(([date, revenue]) => ({ date, revenue }));

    const allOrderItems = await OrderItem.find().populate({
      path: 'productId',
      select: 'categoryId',
      populate: { path: 'categoryId', select: 'name' },
    });
    const salesByCategoryMap = {};
    allOrderItems.forEach((item) => {
      const name = item.productId?.categoryId?.name || 'Other';
      salesByCategoryMap[name] = (salesByCategoryMap[name] || 0) + item.price * item.quantity;
    });
    const salesByCategory = Object.entries(salesByCategoryMap).map(([category, amount]) => ({ category, amount }));

    // --- Complaint analytics ---
    const allComplaints = await Complaint.find();
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
    const topComplaintCategories = categoryDistribution.slice().sort((a, b) => b.count - a.count).slice(0, 5);

    const unassignedComplaints = allComplaints
      .filter((c) => !c.assignedOfficer && c.status !== 'resolved')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 10)
      .map((c) => ({
        complaintId: c._id,
        complaintNumber: c.complaintNumber,
        title: c.title,
        category: c.category,
        priority: c.priority,
        status: c.status,
        createdAt: c.createdAt,
      }));

    const { map: resolutionTrendMap } = buildDayWindow(TREND_DAYS);
    allComplaints
      .filter((c) => c.status === 'resolved' && c.resolvedAt && new Date(c.resolvedAt).getTime() >= windowStart)
      .forEach((c) => {
        const key = dayKey(c.resolvedAt);
        if (resolutionTrendMap[key] !== undefined) resolutionTrendMap[key] += 1;
      });
    const resolutionTrend = Object.entries(resolutionTrendMap).map(([date, count]) => ({ date, count }));

    // --- System health ---
    const [productsAvailable, outOfStockProducts, categories] = await Promise.all([
      Product.countDocuments({ isActive: true, stock: { $gt: 0 } }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      Category.find().select('name icon isActive'),
    ]);
    const categoriesOverview = await Promise.all(
      categories.map(async (cat) => ({
        categoryId: cat._id,
        name: cat.name,
        icon: cat.icon,
        productCount: await Product.countDocuments({ categoryId: cat._id, isActive: true }),
      }))
    );

    // --- Officer performance ---
    const officers = await GovernmentOfficer.find().populate('userId', 'name');
    const officerPerformance = await Promise.all(
      officers.map(async (officer) => {
        const assigned = await Complaint.countDocuments({ assignedOfficer: officer._id });
        const resolved = await Complaint.countDocuments({ assignedOfficer: officer._id, status: 'resolved' });
        return {
          officerId: officer._id,
          name: officer.userId?.name,
          department: officer.department,
          assigned,
          resolved,
          resolutionRate: assigned > 0 ? Math.round((resolved / assigned) * 1000) / 10 : 0,
        };
      })
    );

    // --- Recent activity (merged feed) ---
    const recentComplaintsForFeed = await Complaint.find().sort({ createdAt: -1 }).limit(RECENT_LIMIT).select('title complaintNumber createdAt');
    const recentOrdersForFeed = await Order.find().sort({ createdAt: -1 }).limit(RECENT_LIMIT).select('orderNumber totalAmount createdAt');

    const activity = [
      ...recentUsers.map((u) => ({ type: 'user', description: `${u.name} registered as ${u.role}`, timestamp: u.createdAt })),
      ...recentSellerApplications.map((s) => ({ type: 'seller', description: `${s.shopName} applied for verification`, timestamp: s.createdAt })),
      ...recentComplaintsForFeed.map((c) => ({ type: 'complaint', description: `New complaint: ${c.title}`, timestamp: c.createdAt })),
      ...recentOrdersForFeed.map((o) => ({ type: 'order', description: `Order ${o.orderNumber} placed (NPR ${o.totalAmount})`, timestamp: o.createdAt })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, ACTIVITY_LIMIT);

    res.status(200).json({
      success: true,
      data: {
        systemStats: {
          totalUsers,
          totalSellers,
          verifiedSellers,
          totalProducts,
          totalOrdersThisMonth,
          totalRevenueThisMonth,
          totalComplaints,
          resolutionRate,
        },
        userManagement: {
          recentUsers,
          userBreakdown,
          newUsersToday,
        },
        sellerManagement: {
          sellersByStatus,
          pendingVerifications,
          recentApplications: recentSellerApplications.map((s) => ({
            sellerId: s._id,
            shopName: s.shopName,
            ownerName: s.userId?.name,
            location: s.location,
            status: s.verificationStatus,
            appliedDate: s.createdAt,
          })),
        },
        marketActivity: {
          ordersTrend,
          revenueTrend,
          salesByCategory,
        },
        complaintAnalytics: {
          categoryDistribution,
          statusDistribution,
          topComplaintCategories,
          resolutionTrend,
        },
        unassignedComplaints,
        systemHealth: {
          totalProductsAvailable: productsAvailable,
          outOfStockProducts,
          categoriesOverview,
        },
        officerPerformance,
        recentActivity: activity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAdminDashboard };
