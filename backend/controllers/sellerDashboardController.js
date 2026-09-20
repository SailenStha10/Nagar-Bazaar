const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDERS_LIMIT = 5;
const TOP_PRODUCTS_LIMIT = 5;
const SALES_CHART_DAYS = 30;

const dayKey = (date) => date.toISOString().split('T')[0];

const getSellerDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id }).populate({
      path: 'verificationHistory.officerId',
      populate: { path: 'userId', select: 'name' },
    });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const sellerItems = await OrderItem.find({ sellerId: seller._id }).sort({ createdAt: -1 });

    const totalSales = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderIdSet = new Set(sellerItems.map((item) => item.orderId.toString()));
    const totalOrders = orderIdSet.size;
    const totalProducts = await Product.countDocuments({ sellerId: seller._id, isActive: true });

    const activeProducts = await Product.find({ sellerId: seller._id, isActive: true }).select('averageRating');
    const ratedProducts = activeProducts.filter((p) => p.averageRating > 0);
    const averageRating = ratedProducts.length
      ? Math.round((ratedProducts.reduce((sum, p) => sum + p.averageRating, 0) / ratedProducts.length) * 10) / 10
      : 0;

    // --- Recent orders ---
    const recentOrderIds = [];
    for (const item of sellerItems) {
      const idStr = item.orderId.toString();
      if (!recentOrderIds.includes(idStr)) recentOrderIds.push(idStr);
      if (recentOrderIds.length >= RECENT_ORDERS_LIMIT) break;
    }
    const recentOrdersRaw = await Order.find({ _id: { $in: recentOrderIds } }).populate('userId', 'name');
    const ordersById = Object.fromEntries(recentOrdersRaw.map((o) => [o._id.toString(), o]));
    const recentOrders = recentOrderIds
      .map((id) => {
        const order = ordersById[id];
        if (!order) return null;
        const itemsForOrder = sellerItems.filter((item) => item.orderId.toString() === id);
        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.userId?.name,
          itemsForThisSeller: itemsForOrder.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: itemsForOrder.reduce((sum, item) => sum + item.price * item.quantity, 0),
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
        };
      })
      .filter(Boolean);

    // --- Orders by status (bar chart) ---
    const allSellerOrders = await Order.find({ _id: { $in: Array.from(orderIdSet) } }).select('orderStatus');
    const STATUS_LABELS = { placed: 'Placed', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
    const ordersByStatus = Object.entries(STATUS_LABELS).map(([status, label]) => ({
      status,
      label,
      count: allSellerOrders.filter((o) => o.orderStatus === status).length,
    }));

    // --- Low stock ---
    const lowStockProducts = await Product.find({
      sellerId: seller._id,
      isActive: true,
      stock: { $lt: LOW_STOCK_THRESHOLD },
    })
      .select('name stock categoryId')
      .populate('categoryId', 'name')
      .sort({ stock: 1 })
      .limit(10);

    // --- Top products (by revenue) ---
    const revenueByProduct = {};
    sellerItems.forEach((item) => {
      const key = item.productId.toString();
      if (!revenueByProduct[key]) revenueByProduct[key] = { quantity: 0, revenue: 0 };
      revenueByProduct[key].quantity += item.quantity;
      revenueByProduct[key].revenue += item.price * item.quantity;
    });
    const topProductIds = Object.entries(revenueByProduct)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, TOP_PRODUCTS_LIMIT)
      .map(([id]) => id);
    const topProductDocs = await Product.find({ _id: { $in: topProductIds } }).select('name averageRating');
    const topProductsById = Object.fromEntries(topProductDocs.map((p) => [p._id.toString(), p]));
    const topProducts = topProductIds
      .map((id) => {
        const product = topProductsById[id];
        if (!product) return null;
        return {
          productId: id,
          name: product.name,
          rating: product.averageRating,
          salesCount: revenueByProduct[id].quantity,
          revenue: revenueByProduct[id].revenue,
        };
      })
      .filter(Boolean);

    // --- Sales trend (last 30 days) ---
    const now = new Date();
    const todayUTCStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayMs = 24 * 60 * 60 * 1000;
    const chartWindowStart = todayUTCStart - (SALES_CHART_DAYS - 1) * dayMs;

    const salesByDay = {};
    for (let i = 0; i < SALES_CHART_DAYS; i += 1) {
      const key = new Date(chartWindowStart + i * dayMs).toISOString().split('T')[0];
      salesByDay[key] = 0;
    }
    sellerItems
      .filter((item) => item.createdAt.getTime() >= chartWindowStart)
      .forEach((item) => {
        const day = dayKey(item.createdAt);
        if (salesByDay[day] !== undefined) salesByDay[day] += item.price * item.quantity;
      });
    const salesLast30Days = Object.entries(salesByDay).map(([date, sales]) => ({ date, sales }));

    // --- Month-to-month sales comparison ---
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const todayStart = new Date(todayUTCStart);

    const thisMonthItems = sellerItems.filter((item) => item.createdAt >= monthStart);
    const lastMonthItems = sellerItems.filter((item) => item.createdAt >= lastMonthStart && item.createdAt < monthStart);
    const todayItems = sellerItems.filter((item) => item.createdAt >= todayStart);

    const thisMonthSales = thisMonthItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const lastMonthSales = lastMonthItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const todaySales = todayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const thisMonthOrders = new Set(thisMonthItems.map((item) => item.orderId.toString())).size;
    const salesGrowthPercent = lastMonthSales > 0 ? Math.round(((thisMonthSales - lastMonthSales) / lastMonthSales) * 1000) / 10 : null;

    res.status(200).json({
      success: true,
      data: {
        shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
        reviewReason: seller.reviewReason,
        verificationDate: seller.verificationDate,
        verificationHistory: seller.verificationHistory.map((h) => ({
          status: h.status,
          date: h.date,
          reason: h.reason,
          officerName: h.officerId?.userId?.name,
        })),
        totalSales,
        totalOrders,
        totalProducts,
        averageRating,
        lowStockCount: lowStockProducts.length,
        thisMonthSales,
        lastMonthSales,
        todaySales,
        thisMonthOrders,
        salesGrowthPercent,
        recentOrders,
        ordersByStatus,
        lowStockProducts,
        topProducts,
        salesLast30Days,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSellerDashboard };
