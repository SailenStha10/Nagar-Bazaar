const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const STATUS_SEQUENCE = ['placed', 'confirmed', 'shipped', 'delivered'];
const VALID_FILTER_STATUSES = [...STATUS_SEQUENCE, 'cancelled'];

const getSellerForUser = async (userId) => Seller.findOne({ userId });

const getSellerOrders = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const sortBy = req.query.sortBy === 'amount' ? 'amount' : 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const sellerItems = await OrderItem.find({ sellerId: seller._id });
    const orderIds = [...new Set(sellerItems.map((item) => item.orderId.toString()))];

    const orderFilter = { _id: { $in: orderIds } };
    if (req.query.status && VALID_FILTER_STATUSES.includes(req.query.status)) {
      orderFilter.orderStatus = req.query.status;
    }

    const matchingOrders = await Order.find(orderFilter).populate('userId', 'name');

    const enriched = matchingOrders.map((order) => {
      const idStr = order._id.toString();
      const itemsForOrder = sellerItems.filter((item) => item.orderId.toString() === idStr);
      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.userId?.name,
        itemsForThisSeller: itemsForOrder.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: itemsForOrder.reduce((sum, item) => sum + item.price * item.quantity, 0),
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      };
    });

    enriched.sort((a, b) => {
      const diff =
        sortBy === 'amount' ? a.totalAmount - b.totalAmount : new Date(a.createdAt) - new Date(b.createdAt);
      return sortOrder === 1 ? diff : -diff;
    });

    const total = enriched.length;
    const paged = enriched.slice((page - 1) * limit, (page - 1) * limit + limit);

    res.status(200).json({
      success: true,
      data: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSellerOrderById = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const sellerItems = await OrderItem.find({ orderId, sellerId: seller._id }).populate(
      'productId',
      'name price image'
    );
    if (sellerItems.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = await Order.findById(orderId).populate('userId', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        customer: {
          name: order.userId?.name,
          email: order.userId?.email,
          phone: order.userId?.phone,
        },
        items: sellerItems.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        timeline: order.timeline,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found. Please register as a seller first.' });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!STATUS_SEQUENCE.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ownsOrder = await OrderItem.exists({ orderId, sellerId: seller._id });
    if (!ownsOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentIndex = STATUS_SEQUENCE.indexOf(order.orderStatus);
    const nextIndex = STATUS_SEQUENCE.indexOf(status);

    if (nextIndex !== currentIndex + 1) {
      return res.status(400).json({
        success: false,
        message: `Orders must progress sequentially. Current status is '${order.orderStatus}'.`,
      });
    }

    order.orderStatus = status;
    order.timeline.push({ status, timestamp: new Date() });
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();

    res.status(200).json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSellerOrders, getSellerOrderById, updateOrderStatus };
