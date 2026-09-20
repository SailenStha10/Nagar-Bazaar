const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Complaint = require('../models/Complaint');
const GovernmentNotice = require('../models/GovernmentNotice');

const RECENT_ORDERS_LIMIT = 5;
const RECENT_COMPLAINTS_LIMIT = 5;
const RECENT_NOTICES_LIMIT = 3;
const TREND_DAYS = 30;
const ACTIVE_STATUSES = ['placed', 'confirmed', 'shipped'];

const getCustomerDashboard = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus));
    const completedOrders = orders.filter((o) => o.orderStatus === 'delivered');
    const totalSpent = orders
      .filter((o) => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const complaints = await Complaint.find({ userId: req.user._id });
    const pendingComplaints = complaints.filter((c) => c.status !== 'resolved').length;

    const recentOrders = orders.slice(0, RECENT_ORDERS_LIMIT).map((o) => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      orderStatus: o.orderStatus,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
    }));

    const activeOrdersList = activeOrders.slice(0, RECENT_ORDERS_LIMIT).map((o) => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      orderStatus: o.orderStatus,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
    }));

    const recentComplaints = complaints
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, RECENT_COMPLAINTS_LIMIT)
      .map((c) => ({
        complaintId: c._id,
        complaintNumber: c.complaintNumber,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt,
      }));

    const recentNotices = await GovernmentNotice.find({ isArchived: false })
      .sort({ publishedAt: -1 })
      .limit(RECENT_NOTICES_LIMIT)
      .select('title category priority publishedAt');

    // --- Order trend (last 30 days) ---
    const now = new Date();
    const todayUTCStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayMs = 24 * 60 * 60 * 1000;
    const windowStart = todayUTCStart - (TREND_DAYS - 1) * dayMs;

    const trendMap = {};
    for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
      const key = new Date(todayUTCStart - i * dayMs).toISOString().split('T')[0];
      trendMap[key] = 0;
    }
    orders
      .filter((o) => o.createdAt.getTime() >= windowStart)
      .forEach((o) => {
        const key = o.createdAt.toISOString().split('T')[0];
        if (trendMap[key] !== undefined) trendMap[key] += 1;
      });
    const orderTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    // --- Spending by category ---
    const orderIds = orders.filter((o) => o.orderStatus !== 'cancelled').map((o) => o._id);
    const orderItems = await OrderItem.find({ orderId: { $in: orderIds } }).populate({
      path: 'productId',
      select: 'categoryId',
      populate: { path: 'categoryId', select: 'name' },
    });

    const spendingByCategory = {};
    orderItems.forEach((item) => {
      const categoryName = item.productId?.categoryId?.name || 'Other';
      spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + item.price * item.quantity;
    });
    const spendingChart = Object.entries(spendingByCategory).map(([category, amount]) => ({ category, amount }));

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        totalSpent,
        complaintCount: pendingComplaints,
        recentOrders,
        activeOrdersList,
        recentComplaints,
        recentNotices,
        orderTrend,
        spendingChart,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCustomerDashboard };
