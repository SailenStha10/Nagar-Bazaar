const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    image: { type: String },
    discountType: { type: String, enum: ['none', 'percentage', 'flat'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },
    isLocal: { type: Boolean, default: false },
    localProductDetails: {
      producer: { type: String },
      location: { type: String },
    },
    averageRating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ sellerId: 1 });
productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ isActive: 1, name: 1 });
productSchema.index({ isActive: 1, isLocal: 1 });

module.exports = mongoose.model('Product', productSchema);
