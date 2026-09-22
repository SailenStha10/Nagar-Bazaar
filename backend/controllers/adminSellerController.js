const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * DELETE /api/admin/sellers/:sellerId
 * Removes a seller and their product catalog from the marketplace. The
 * seller's underlying user account is deactivated (not deleted) so it keeps
 * its audit trail and the email stays reserved; past orders, reviews,
 * complaints and market-price records that reference this seller are left
 * alone as historical data rather than cascade-deleted.
 */
const deleteSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    await Product.deleteMany({ sellerId: seller._id });
    await User.findByIdAndUpdate(seller.userId, { isActive: false });
    await Seller.findByIdAndDelete(seller._id);

    res.status(200).json({ success: true, message: 'Seller and their product listings removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { deleteSeller };
