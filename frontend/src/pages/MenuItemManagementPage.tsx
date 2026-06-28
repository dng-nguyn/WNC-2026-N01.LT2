import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuItem.service';
import { fetchMenus } from '../services/menu.service';
import type { MenuItem, Menu } from '../types';

export default function MenuItemManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [menuId, setMenuId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchMenuItems(), fetchMenus()])
      .then(([itemsData, menusData]) => {
        setItems(itemsData);
        setMenus(menusData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingId(null);
    setMenuId(menus[0]?.id || '');
    setName('');
    setPrice('');
    setIsAvailable(true);
    setShowForm(true);
    setError('');
  }

  function openEdit(item: MenuItem) {
    setEditingId(item.id);
    setMenuId(item.menu.id);
    setName(item.name);
    setPrice(String(Number(item.price)));
    setIsAvailable(item.isAvailable);
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error('Please enter a valid price');
      }

      if (editingId) {
        await updateMenuItem(editingId, {
          menuId,
          name,
          price: priceNum,
          isAvailable,
        });
      } else {
        await createMenuItem({
          menuId,
          name,
          price: priceNum,
          isAvailable,
        });
      }

      const [itemsData, menusData] = await Promise.all([fetchMenuItems(), fetchMenus()]);
      setItems(itemsData);
      setMenus(menusData);
      cancelForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(id);
      const itemsData = await fetchMenuItems();
      setItems(itemsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu item');
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (loading) return <div className="page-container"><p>Loading menu items…</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Menu Items (Products)</h1>
        </div>
        <nav className="nav-links">
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
          <Link to="/menus" className="btn btn-secondary">Categories</Link>
          <Link to="/pos" className="btn btn-primary">POS Terminal</Link>
        </nav>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn btn-primary" onClick={openCreate}>
        + New Menu Item
      </button>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? 'Edit Menu Item' : 'New Menu Item'}</h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="itemCategory">Category *</label>
              <select
                id="itemCategory"
                value={menuId}
                onChange={(e) => setMenuId(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="itemName">Name *</label>
              <input
                id="itemName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="itemPrice">Price (VND) *</label>
              <input
                id="itemPrice"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                Available for sale
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Available</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-muted">No menu items yet. Create one above.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.menu.name}</td>
                <td>{formatCurrency(Number(item.price))}</td>
                <td>
                  <span className={`badge ${item.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                    {item.isAvailable ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
