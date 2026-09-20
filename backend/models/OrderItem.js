const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  },
  { timestamps: true }
);

orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ sellerId: 1, createdAt: -1 });
orderItemSchema.index({ productId: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
