const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    price: { type: Number, required: true },
    averageMarketPrice: { type: Number },
    status: { type: String, enum: ['normal', 'review_required'], default: 'normal' },
    remarks: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    monitoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficer' },
    history: [
      {
        price: { type: Number },
        averageMarketPrice: { type: Number },
        status: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

marketPriceSchema.index({ productId: 1 });
marketPriceSchema.index({ sellerId: 1 });
marketPriceSchema.index({ status: 1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
