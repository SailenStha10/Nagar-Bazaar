const mongoose = require('mongoose');

const governmentNoticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['market_info', 'consumer_awareness', 'public_notice', 'regulations', 'price_info'],
      required: true,
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficer' },
    publishedAt: { type: Date, default: Date.now },
    archiveAt: { type: Date },
    isArchived: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GovernmentNotice', governmentNoticeSchema);
