const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    role: {
      type: String,
      enum: ['customer', 'seller', 'officer', 'admin'],
      default: 'customer',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
