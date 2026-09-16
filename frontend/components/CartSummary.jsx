import Link from 'next/link';

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 100;

export default function CartSummary({ subtotal, itemCount }) {
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Order Summary</h3>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between text-ink-muted">
          <span>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
          <span className="font-medium text-ink">NPR {subtotal.toLocaleString('en-NP')}</span>
        </div>
        <div className="flex justify-between text-ink-muted">
          <span>Delivery Fee</span>
          <span className="font-medium text-ink">
            {deliveryFee === 0 ? 'Free' : `NPR ${deliveryFee.toLocaleString('en-NP')}`}
          </span>
        </div>
        {subtotal > 0 && deliveryFee > 0 && (
          <p className="text-xs text-local">
            Add NPR {(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString('en-NP')} more for free delivery
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="font-display font-semibold text-ink">Total</span>
        <span className="font-display text-xl font-semibold text-primary">
          NPR {total.toLocaleString('en-NP')}
        </span>
      </div>

      <Link
        href="/customer/checkout"
        aria-disabled={itemCount === 0}
        className={`mt-6 block rounded-full py-3 text-center text-sm font-semibold text-white transition ${
          itemCount === 0
            ? 'pointer-events-none bg-primary/40'
            : 'bg-primary hover:bg-primary-dark'
        }`}
      >
        Proceed to Checkout
      </Link>
      <Link
        href="/products"
        className="mt-3 block text-center text-sm font-semibold text-ink-muted hover:text-primary"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
