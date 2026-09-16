const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    category: {
      type: String,
      enum: [
        'overpricing',
        'expired_product',
        'quality_issue',
        'misleading_info',
        'seller_issue',
        'other',
      ],
      required: true,
    },
    title: { type: String, required: true, minlength: 10 },
    description: { type: String, required: true, minlength: 20 },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'in_progress', 'resolved'],
      default: 'submitted',
    },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficer' },
    officerRemarks: { type: String },
    resolution: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    timeline: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        message: { type: String },
      },
    ],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
