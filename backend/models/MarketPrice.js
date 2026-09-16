const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    price: { type: Number, required: true },
    averageMarketPrice: { type: Number },
    status: { type: String, enum: ['normal', 'review_required'], default: 'normal' },
    lastUpdated: { type: Date, default: Date.now },
    monitoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficer' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
