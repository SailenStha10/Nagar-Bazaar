// Computes the customer-facing discount for a product from the seller-set
// discountType/discountValue, so there is a single source of truth for what
// "on sale" means — a percentage off, a flat sale price, or no discount.
const computeDiscount = (product) => {
  const price = product.price;

  if (product.discountType === 'percentage' && product.discountValue > 0) {
    const percent = Math.min(product.discountValue, 100);
    const discountedPrice = Math.round(price * (1 - percent / 100) * 100) / 100;
    return { discountPercent: percent, discountedPrice };
  }

  if (product.discountType === 'flat' && product.discountValue > 0 && product.discountValue < price) {
    const percent = Math.round((1 - product.discountValue / price) * 100);
    return { discountPercent: percent, discountedPrice: product.discountValue };
  }

  return { discountPercent: 0, discountedPrice: price };
};

module.exports = { computeDiscount };
