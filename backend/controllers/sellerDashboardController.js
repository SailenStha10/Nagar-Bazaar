const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDERS_LIMIT = 5;
const SALES_CHART_DAYS = 7;

const getSellerDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
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

    const lowStockProducts = await Product.find({
      sellerId: seller._id,
      isActive: true,
      stock: { $lt: LOW_STOCK_THRESHOLD },
    })
      .select('name stock')
      .sort({ stock: 1 })
      .limit(10);

    const now = new Date();
    const todayUTCStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayMs = 24 * 60 * 60 * 1000;
    const sevenDaysAgoUTCStart = todayUTCStart - (SALES_CHART_DAYS - 1) * dayMs;

    const salesByDay = {};
    for (let i = 0; i < SALES_CHART_DAYS; i += 1) {
      const key = new Date(sevenDaysAgoUTCStart + i * dayMs).toISOString().split('T')[0];
      salesByDay[key] = 0;
    }
    sellerItems
      .filter((item) => item.createdAt.getTime() >= sevenDaysAgoUTCStart)
      .forEach((item) => {
        const day = item.createdAt.toISOString().split('T')[0];
        if (salesByDay[day] !== undefined) salesByDay[day] += item.price * item.quantity;
      });
    const salesLast7Days = Object.entries(salesByDay).map(([date, sales]) => ({ date, sales }));

    res.status(200).json({
      success: true,
      data: {
        shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        totalSales,
        totalOrders,
        totalProducts,
        averageRating,
        recentOrders,
        lowStockProducts,
        salesLast7Days,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSellerDashboard };
