import { useEffect, useState, FormEvent } from 'react';
import { fetchMenus, createMenu, updateMenu, deleteMenu } from '../services/menu.service';
import type { Menu } from '../types';

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenus();
  }, []);

  async function loadMenus() {
    try {
      const data = await fetchMenus();
      setMenus(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load menus');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName('');
    setDescription('');
    setShowForm(true);
    setError('');
  }

  function openEdit(menu: Menu) {
    setEditingId(menu.id);
    setName(menu.name);
    setDescription(menu.description || '');
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setDescription('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await updateMenu(editingId, { name, description: description || undefined });
      } else {
        await createMenu({ name, description: description || undefined });
      }
      await loadMenus();
      cancelForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this menu category?')) return;
    try {
      await deleteMenu(id);
      await loadMenus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu');
    }
  }

  if (loading) return <div className="page-container"><p>Loading menus…</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Menu Categories</h1>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn btn-primary" onClick={openCreate}>
        + New Category
      </button>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="menuName">Name *</label>
              <input
                id="menuName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="menuDesc">Description</label>
              <textarea
                id="menuDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
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
            <th>Description</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menus.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-muted">No categories yet. Create one above.</td>
            </tr>
          ) : (
            menus.map((menu) => (
              <tr key={menu.id}>
                <td><strong>{menu.name}</strong></td>
                <td>{menu.description || '—'}</td>
                <td>{new Date(menu.createdAt).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(menu)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(menu.id)}>
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
