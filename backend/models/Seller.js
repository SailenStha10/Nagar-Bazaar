const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String, required: true, unique: true },
    description: { type: String },
    location: { type: String },
    contact: { type: String },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'review_required'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficer' },
    verificationDate: { type: Date },
    rejectionReason: { type: String },
    reviewReason: { type: String },
    verificationHistory: [
      {
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'review_required'] },
        date: { type: Date, default: Date.now },
        reason: { type: String },
        officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficer' },
      },
    ],
    banner: { type: String },
    ratings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sellerSchema.index({ userId: 1 });
sellerSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Seller', sellerSchema);
