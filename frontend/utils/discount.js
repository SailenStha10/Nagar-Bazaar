// Mirrors backend/utils/discount.js — customer-facing endpoints already send
// `discountPercent`/`discountedPrice` computed server-side, but a few screens
// (the seller's own product list) work off the raw product record instead.
export function computeDiscount(product) {
  const price = product.price;

  if (product.discountType === 'percentage' && product.discountValue > 0) {
    const percent = Math.min(product.discountValue, 100);
    return { discountPercent: percent, discountedPrice: Math.round(price * (1 - percent / 100) * 100) / 100 };
  }

  if (product.discountType === 'flat' && product.discountValue > 0 && product.discountValue < price) {
    const percent = Math.round((1 - product.discountValue / price) * 100);
    return { discountPercent: percent, discountedPrice: product.discountValue };
  }

  return { discountPercent: 0, discountedPrice: price };
}
