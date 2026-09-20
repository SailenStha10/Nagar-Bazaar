const mongoose = require('mongoose');

const governmentOfficerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String },
    designation: { type: String },
    officeLocation: { type: String },
    verificationLimit: { type: Number, default: 20 },
  },
  { timestamps: true }
);

governmentOfficerSchema.index({ userId: 1 });

module.exports = mongoose.model('GovernmentOfficer', governmentOfficerSchema);
