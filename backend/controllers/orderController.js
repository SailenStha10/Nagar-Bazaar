const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { computeDiscount } = require('../utils/discount');

const ESTIMATED_DELIVERY_DAYS = 4;

const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `NG-${year}-`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await Order.countDocuments({ orderNumber: { $regex: `^${prefix}` } });
    const candidate = `${prefix}${String(count + 1 + attempt).padStart(5, '0')}`;
    const exists = await Order.findOne({ orderNumber: candidate });
    if (!exists) return candidate;
  }

  return `${prefix}${Date.now()}`;
};

const checkout = async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod } = req.body;

    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'A valid delivery address is required' });
    }
    if (!['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    const cartItems = cart ? await CartItem.find({ cartId: cart._id }).populate('productId') : [];

    if (!cart || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const unavailable = cartItems.filter((item) => !item.productId || !item.productId.isActive);
    if (unavailable.length > 0) {
      return res.status(400).json({ success: false, message: 'Some items in your cart are no longer available' });
    }

    const outOfStock = cartItems.filter((item) => item.quantity > item.productId.stock);
    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for: ${outOfStock.map((i) => i.productId.name).join(', ')}`,
      });
    }

    // Charge whatever the product's discount currently computes to, not the
    // raw catalog price — this is what the customer was shown in their cart,
    // and previously got silently dropped here, charging full price instead.
    const unitPrices = cartItems.map((item) => computeDiscount(item.productId).discountedPrice);
    const orderNumber = await generateOrderNumber();
    const totalAmount = cartItems.reduce((sum, item, i) => sum + unitPrices[i] * item.quantity, 0);

    const order = await Order.create({
      userId: req.user._id,
      orderNumber,
      items: [],
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'placed',
      deliveryAddress: deliveryAddress.trim(),
      timeline: [{ status: 'placed', timestamp: new Date() }],
    });

    const orderItems = await OrderItem.insertMany(
      cartItems.map((item, i) => ({
        orderId: order._id,
        productId: item.productId._id,
        quantity: item.quantity,
        price: unitPrices[i],
        sellerId: item.productId.sellerId,
      }))
    );

    order.items = orderItems.map((oi) => oi._id);
    await order.save();

    await Promise.all(
      cartItems.map((item) => Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } }))
    );

    const sellerIds = [...new Set(cartItems.map((item) => item.productId.sellerId.toString()))];
    await Seller.updateMany({ _id: { $in: sellerIds } }, { $inc: { totalOrders: 1 } });

    await CartItem.deleteMany({ cartId: cart._id });
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    const populatedItems = await OrderItem.find({ orderId: order._id })
      .populate('productId', 'name price image')
      .populate('sellerId', 'shopName contact');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        items: populatedItems.map((oi) => ({
          product: oi.productId,
          quantity: oi.quantity,
          price: oi.price,
          seller: oi.sellerId,
        })),
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const filter = { userId: req.user._id };
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: orders.map((order) => ({
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        itemCount: order.items.length,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = await OrderItem.find({ orderId: order._id })
      .populate('productId', 'name price image')
      .populate('sellerId', 'shopName contact');

    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + ESTIMATED_DELIVERY_DAYS);

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        items: items.map((oi) => ({
          product: oi.productId,
          quantity: oi.quantity,
          price: oi.price,
          seller: oi.sellerId,
        })),
        timeline: order.timeline,
        createdAt: order.createdAt,
        estimatedDelivery,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const STATUS_STEPS = [
  { status: 'placed', label: 'Order Placed' },
  { status: 'confirmed', label: 'Order Confirmed' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
];

const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const timelineByStatus = Object.fromEntries(order.timeline.map((t) => [t.status, t.timestamp]));

    const timeline = STATUS_STEPS.map((step) => {
      const timestamp = timelineByStatus[step.status] || null;
      return {
        status: step.status,
        timestamp,
        label: timestamp ? step.label : `${step.label} (Pending)`,
      };
    });

    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + ESTIMATED_DELIVERY_DAYS);

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        timeline,
        currentStatus: order.orderStatus,
        estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { checkout, getOrders, getOrderById, trackOrder };
