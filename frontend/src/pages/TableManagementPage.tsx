import { useEffect, useState, FormEvent } from 'react';
import { fetchTables, createTable, updateTable, deleteTable } from '../services/table.service';
import type { Table } from '../types';

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  async function loadTables() {
    try {
      setLoading(true);
      const data = await fetchTables();
      setTables(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setTableNumber('');
    setShowForm(true);
    setError('');
  }

  function openEdit(table: Table) {
    setEditingId(table.id);
    setTableNumber(table.tableNumber);
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setTableNumber('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await updateTable(editingId, { tableNumber });
      } else {
        await createTable({ tableNumber });
      }
      await loadTables();
      cancelForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save table');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete table "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTable(id);
      await loadTables();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
    }
  }

  if (loading) return <div className="page-container"><p>Loading tables…</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Manage Tables</h1>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn btn-primary" onClick={openCreate}>
        + New Table
      </button>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? 'Edit Table' : 'New Table'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tableNumber">Table Number / Name *</label>
              <input
                id="tableNumber"
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
                maxLength={20}
                autoFocus
                placeholder="e.g. Table 1, Patio A"
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
            <th>Table Number</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-muted">No tables yet. Create one above.</td>
            </tr>
          ) : (
            tables.map((table) => (
              <tr key={table.id}>
                <td><strong>{table.tableNumber}</strong></td>
                <td>
                  <span className={`badge badge-${table.status === 'EMPTY' ? 'success' : table.status === 'OCCUPIED' ? 'warning' : 'info'}`}>
                    {table.status}
                  </span>
                </td>
                <td>{new Date(table.createdAt).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(table)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(table.id, table.tableNumber)}>
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
