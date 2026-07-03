import type { CartItem } from '../../hooks/useCart';

interface CartSummaryProps {
  cart: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  submitting: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onSetQuantity?: (itemId: string, quantity: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  buttonLabel?: string;
  checkoutDisabled?: boolean;
  children?: React.ReactNode;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

export default function CartSummary({
  cart,
  cartTotal,
  cartItemCount,
  submitting,
  onUpdateQuantity,
  onSetQuantity,
  onClear,
  onCheckout,
  buttonLabel,
  checkoutDisabled,
  children,
}: CartSummaryProps) {
  return (
    <>
      {/* ── Header Area ── */}
      <div className="cart-header">
        <h2 className="cart-heading">
          Current Order
          {cartItemCount > 0 && (
            <span className="cart-count-badge">{cartItemCount}</span>
          )}
        </h2>
      </div>

      {/* ── Middle Area: scrollable items ── */}
      <div className="cart-items">
        {cart.length === 0 ? (
          <p className="cart-empty">Tap items to add them here</p>
        ) : (
          cart.map((item) => (
            <div key={item.menuItem.id} className="cart-row">
              <div className="cart-row-info">
                <span className="cart-row-name">{item.menuItem.name}</span>
                <span className="cart-row-subtotal">
                  {formatCurrency(
                    Number(item.menuItem.price) * item.quantity,
                  )}
                </span>
              </div>
              <div className="cart-row-controls">
                <button
                  className="cart-qty-btn"
                  onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  className="cart-qty-input"
                  value={item.quantity}
                  min={1}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return;
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 1 && onSetQuantity) {
                      onSetQuantity(item.menuItem.id, num);
                    }
                  }}
                  onBlur={(e) => {
                    const num = parseInt(e.target.value, 10);
                    if (isNaN(num) || num < 1) {
                      if (onSetQuantity) {
                        onSetQuantity(item.menuItem.id, 1);
                      }
                    }
                  }}
                />
                <button
                  className="cart-qty-btn"
                  onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer Area: controls + totals + pay button ── */}
      <div className="cart-checkout">
        {children && <div className="cart-controls">{children}</div>}

        <div className="cart-total-card">
          <div className="cart-total-line">
            <span className="cart-total-label">
              {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
            </span>
            <span className="cart-total-amount">
              {formatCurrency(cartTotal)}
            </span>
          </div>
        </div>

        <button
          className="cart-pay-btn"
          onClick={onCheckout}
          disabled={submitting || cart.length === 0 || checkoutDisabled}
        >
          {submitting
            ? 'Processing…'
            : `${buttonLabel ?? 'Pay'} ${formatCurrency(cartTotal)}`}
        </button>

        <button
          className="cart-clear-btn"
          onClick={onClear}
          disabled={cart.length === 0}
        >
          Clear all items
        </button>
      </div>
    </>
  );
}
