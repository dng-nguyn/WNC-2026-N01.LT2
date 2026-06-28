import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchMenuItems } from '../services/menuItem.service';
import { fetchTables } from '../services/table.service';
import { createOrder } from '../services/order.service';
import { getLoggedInUser } from '../services/auth.service';
import type { MenuItem, Table as TableType } from '../types';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string;
}

export default function POSPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = getLoggedInUser();

  useEffect(() => {
    Promise.all([fetchMenuItems(), fetchTables()])
      .then(([items, tabs]) => {
        setMenuItems(items.filter((i) => i.isAvailable));
        setTables(tabs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  // Unique categories from menu items
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.menu.name));
    return ['all', ...cats];
  }, [menuItems]);

  const filteredItems = useMemo(
    () =>
      activeCategory === 'all'
        ? menuItems
        : menuItems.filter((i) => i.menu.name === activeCategory),
    [menuItems, activeCategory],
  );

  // Cart totals
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * Number(item.menuItem.price), 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  function addToCart(menuItem: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menuItem, quantity: 1, note: '' }];
    });
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }

  function updateNote(itemId: string, note: string) {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, note } : c)),
    );
  }

  function clearCart() {
    setCart([]);
    setSelectedTableId('');
    setSuccess('');
    setError('');
  }

  async function handleCheckout() {
    if (!user) {
      setError('You must be logged in to place an order');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createOrder({
        userId: user.id,
        tableId: selectedTableId || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          note: c.note || undefined,
        })),
      });
      setSuccess(`Order placed successfully! ${cartItemCount} item(s) — ${
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)
      }`);
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (loading) return <div className="page-container"><p>Loading POS terminal…</p></div>;

  return (
    <div className="pos-layout">
      {/* Left — Menu Grid */}
      <div className="pos-menu">
        <header className="pos-header">
          <h1>POS Terminal</h1>
          <Link to="/dashboard" className="btn btn-sm btn-secondary">← Dashboard</Link>
        </header>

        {/* Category tabs */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Menu item grid */}
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className="menu-item-card"
              onClick={() => addToCart(item)}
              disabled={!item.isAvailable}
            >
              <span className="menu-item-name">{item.name}</span>
              <span className="menu-item-price">{formatCurrency(Number(item.price))}</span>
              {!item.isAvailable && <span className="badge badge-danger">Unavailable</span>}
            </button>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-muted">No items in this category</p>
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="pos-cart">
        <h2>Current Order</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Table selector */}
        <div className="form-group">
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
        </div>

        {/* Cart items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="text-muted">Click menu items to add them here</p>
          ) : (
            cart.map((item) => (
              <div key={item.menuItem.id} className="cart-item">
                <div className="cart-item-header">
                  <span className="cart-item-name">{item.menuItem.name}</span>
                  <span className="cart-item-price">
                    {formatCurrency(Number(item.menuItem.price) * item.quantity)}
                  </span>
                </div>
                <div className="cart-item-controls">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => updateQuantity(item.menuItem.id, -1)}
                  >
                    −
                  </button>
                  <span className="cart-qty">{item.quantity}</span>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => updateQuantity(item.menuItem.id, 1)}
                  >
                    +
                  </button>
                  <input
                    className="cart-note"
                    placeholder="Note…"
                    value={item.note}
                    onChange={(e) => updateNote(item.menuItem.id, e.target.value)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & checkout */}
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total ({cartItemCount} items)</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>

          <div className="cart-actions">
            <button className="btn btn-secondary" onClick={clearCart} disabled={cart.length === 0}>
              Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
