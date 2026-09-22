const Seller = require('../models/Seller');

/**
 * Blocks seller-only operations (dashboard, product management, order
 * management) until a government officer/admin has approved the seller's
 * profile. A missing profile is left to the calling route (it already
 * reports its own 404 so the frontend can show the "set up your store" step
 * instead of a verification notice).
 */
const requireApprovedSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) return next();

    if (seller.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your seller account is pending verification by an administrator.',
        verificationStatus: seller.verificationStatus,
      });
    }

    req.seller = seller;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { requireApprovedSeller };
