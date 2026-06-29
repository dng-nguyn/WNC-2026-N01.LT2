import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePOSData } from '../hooks/usePOSData';
import { useCart } from '../hooks/useCart';
import { CategoryTabs, ProductCard, CartSummary } from '../components/pos';
import { Alert } from '../components';
import { PaymentModal } from '../components/payment';

/* ── Map raw DB category names to friendly Vietnamese labels ── */
const categoryMap: Record<string, string> = {
  all: 'Tất cả',
  OrderMenu_1782529111770: 'Cà phê & Trà',
  PayMenu_1782529122262: 'Đồ ăn vặt',
  OrderMenu_1782482776669: 'Trà sữa & Đá xay',
};

function friendlyName(raw: string): string {
  return categoryMap[raw] ?? raw;
}

function rawName(friendly: string): string {
  for (const [key, val] of Object.entries(categoryMap)) {
    if (val === friendly) return key;
  }
  return friendly;
}

export default function POSPage() {
  const [showPayment, setShowPayment] = useState(false);
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
  } = useCart();

  const displayError = dataError || cartError;

  // Friendly category labels for display
  const displayCategories = useMemo(
    () => categories.map((c) => friendlyName(c)),
    [categories],
  );

  const friendlyActive = friendlyName(activeCategory);

  function handleCategorySelect(friendly: string) {
    setActiveCategory(rawName(friendly));
  }

  function handlePayClick() {
    if (cart.length === 0) return;
    setShowPayment(true);
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
        <Link to="/dashboard" className="pos-topbar-back">
          ← Dashboard
        </Link>
      </div>

      {/* ═══ Horizontally Scrollable Category Bar ═══ */}
      <div className="pos-category-bar">
        <CategoryTabs
          categories={displayCategories}
          activeCategory={friendlyActive}
          onSelect={handleCategorySelect}
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
            onCheckout={handlePayClick}
          >
            <label>Table (optional)</label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
            >
              <option value="">Takeaway</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.tableNumber} — {t.status}
                </option>
              ))}
            </select>
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
