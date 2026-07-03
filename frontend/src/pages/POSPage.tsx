import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSData } from '../hooks/usePOSData';
import { useCart } from '../hooks/useCart';
import { CategoryTabs, ProductCard, CartSummary } from '../components/pos';
import { Alert } from '../components';
import { PaymentModal } from '../components/payment';

export default function POSPage() {
  const [showPayment, setShowPayment] = useState(false);
  const [takeout, setTakeout] = useState(true);
  const navigate = useNavigate();
  const {
    tables,
    categories,
    activeCategory,
    setActiveCategory,
    filteredItems,
    loading,
    error: dataError,
  } = usePOSData();

  const {
    cart,
    selectedTableId,
    setSelectedTableId,
    cartTotal,
    cartItemCount,
    submitting,
    error: cartError,
    success,
    addToCart,
    updateQuantity,
    clearCart,
    clearMessages,
    handleCheckout,
  } = useCart();

  const displayError = dataError || cartError;

  async function handleButtonClick() {
    if (cart.length === 0) return;
    if (!takeout && !selectedTableId) return;
    if (takeout) {
      setShowPayment(true);
    } else {
      try {
        await handleCheckout();
        navigate('/tables');
      } catch {
        // error displayed via cartError state
      }
    }
  }

  function handlePaymentSuccess() {
    clearCart();
    setShowPayment(false);
  }

  function handleSetQuantity(itemId: string, newQty: number) {
    const item = cart.find((c) => c.menuItem.id === itemId);
    if (!item) return;
    const delta = newQty - item.quantity;
    if (delta !== 0) updateQuantity(itemId, delta);
  }

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading POS terminal…</p>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      {/* ═══ Fixed Top Navbar ═══ */}
      <div className="pos-topbar">
        <h1 className="pos-topbar-title">POS Terminal</h1>
      </div>

      {/* ═══ Horizontally Scrollable Category Bar ═══ */}
      <div className="pos-category-bar">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {/* ═══ Main Body: Product Grid + Cart Sidebar ═══ */}
      <div className="pos-body">
        {/* ─── Left: Scrollable Product Grid ─── */}
        <div className="pos-main">
          {displayError && (
            <Alert variant="error" onDismiss={clearMessages}>
              {displayError}
            </Alert>
          )}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="menu-grid">
            {filteredItems.map((item) => (
              <ProductCard key={item.id} item={item} onAdd={addToCart} />
            ))}
            {filteredItems.length === 0 && (
              <p className="text-muted">No items in this category</p>
            )}
          </div>
        </div>

        {/* ─── Right: Sticky Cart Sidebar ─── */}
        <div className="pos-cart">
          <CartSummary
            cart={cart}
            cartTotal={cartTotal}
            cartItemCount={cartItemCount}
            submitting={submitting}
            onUpdateQuantity={updateQuantity}
            onSetQuantity={handleSetQuantity}
            onClear={clearCart}
            onCheckout={handleButtonClick}
            checkoutDisabled={!takeout && !selectedTableId}
            buttonLabel={takeout ? 'Pay' : 'Order'}
          >
            {/* Takeout checkbox */}
            <label className="cart-takeout-toggle">
              <input
                type="checkbox"
                checked={takeout}
                onChange={(e) => {
                  setTakeout(e.target.checked);
                  if (e.target.checked) setSelectedTableId('');
                }}
              />
              Takeout
            </label>

            {/* Table selector — only when not takeout */}
            {!takeout && (
              <div className="cart-table-selector">
                <label htmlFor="pos-table">Table</label>
                <select
                  id="pos-table"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                >
                  <option value="">Select a table…</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tableNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CartSummary>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        cart={cart}
        cartTotal={cartTotal}
        selectedTableId={selectedTableId}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
