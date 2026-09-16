const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalPrice: 0 });
  }
  return cart;
};

const recalcCart = async (cartId) => {
  const items = await CartItem.find({ cartId });
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  await Cart.findByIdAndUpdate(cartId, {
    items: items.map((item) => item._id),
    totalPrice,
  });
};

const formatCart = async (cartId) => {
  const cart = await Cart.findById(cartId).populate({
    path: 'items',
    populate: {
      path: 'productId',
      select: 'name price image stock sellerId',
      populate: { path: 'sellerId', select: 'shopName' },
    },
  });

  const items = cart.items
    .filter((item) => item.productId)
    .map((item) => ({
      cartItemId: item._id,
      product: item.productId,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

  return {
    _id: cart._id,
    userId: cart.userId,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
};

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.status(200).json({ success: true, data: await formatCart(cart._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await getOrCreateCart(req.user._id);
    let cartItem = await CartItem.findOne({ cartId: cart._id, productId });
    const isNew = !cartItem;
    const desiredQuantity = cartItem ? cartItem.quantity + qty : qty;

    if (desiredQuantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Out of stock' });
    }

    if (cartItem) {
      cartItem.quantity = desiredQuantity;
      cartItem.price = product.price;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart._id,
        productId,
        quantity: qty,
        price: product.price,
      });
    }

    await recalcCart(cart._id);
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: 'Product added to cart',
      data: await formatCart(cart._id),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const qty = Number(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    if (!Number.isInteger(qty)) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const cartItem = await CartItem.findOne({ _id: itemId, cartId: cart._id });
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (qty <= 0) {
      await CartItem.deleteOne({ _id: itemId });
    } else {
      const product = await Product.findById(cartItem.productId);
      if (!product || qty > product.stock) {
        return res.status(400).json({ success: false, message: 'Out of stock' });
      }
      cartItem.quantity = qty;
      await cartItem.save();
    }

    await recalcCart(cart._id);
    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: await formatCart(cart._id),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const result = await CartItem.deleteOne({ _id: itemId, cartId: cart._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    await recalcCart(cart._id);
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: await formatCart(cart._id),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await CartItem.deleteMany({ cartId: cart._id });
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
