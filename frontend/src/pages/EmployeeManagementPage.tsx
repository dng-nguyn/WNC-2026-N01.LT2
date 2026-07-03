import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  resetPassword,
} from '../services/employee.service';
import { UserRole, type User } from '../types';

export default function EmployeeManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState(UserRole.STAFF);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState(UserRole.STAFF);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectUser(id: string) {
    setSelectedId(id);
    setError('');
    try {
      const user = await fetchUser(id);
      setSelectedUser(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setSelectedUser(null);
    }
  }
  function openCreateForm() {
    setCreateUsername('');
    setCreatePassword('');
    setCreateFullName('');
    setCreatePhone('');
    setCreateRole(UserRole.STAFF);
    setShowCreateForm(true);
    setShowEditForm(false);
    setError('');
  }

  function openEditForm() {
    if (!selectedUser) return;
    setEditFullName(selectedUser.fullName || '');
    setEditPhone(selectedUser.phone || '');
    setEditRole(selectedUser.role);
    setShowEditForm(true);
    setError('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createUser({
        username: createUsername,
        password: createPassword,
        fullName: createFullName || undefined,
        phone: createPhone || undefined,
        role: createRole,
      });
      await loadUsers();
      setShowCreateForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      await updateUser(selectedId, {
        fullName: editFullName || undefined,
        phone: editPhone || undefined,
        role: editRole,
      });
      await loadUsers();
      // Refresh selected user
      const updated = await fetchUser(selectedId);
      setSelectedUser(updated);
      setShowEditForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedId) return;
    if (!confirm('Reset password? A new random password will be generated.')) return;
    try {
      const result = await resetPassword(selectedId);
      alert(result.message || 'Password reset successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  }

  async function handleToggleActive() {
    if (!selectedId || !selectedUser) return;
    try {
      await updateUser(selectedId, { isActive: !selectedUser.isActive });
      await loadUsers();
      const updated = await fetchUser(selectedId);
      setSelectedUser(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading employees…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Manage Employees</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreateForm}>
          + Add Employee
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Employee</h3>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="createUsername">Username *</label>
                <input
                  id="createUsername"
                  type="text"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                  maxLength={50}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="createPassword">Password *</label>
                <input
                  id="createPassword"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="createFullName">Full Name</label>
                <input
                  id="createFullName"
                  type="text"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="createPhone">Phone</label>
                <input
                  id="createPhone"
                  type="text"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  maxLength={15}
                />
              </div>
              <div className="form-group">
                <label htmlFor="createRole">Role *</label>
                <select
                  id="createRole"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  required
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tables-grid" style={{ alignItems: 'start' }}>
        {/* Employee Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No employees yet. Add one above.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong>{user.fullName || user.username}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          user.role === 'MANAGER' ? 'badge-warning' : 'badge-info'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          user.isActive ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedUser && (
          <div className="order-detail-panel">
            <div className="order-detail-header">
              <h3>{selectedUser.fullName || selectedUser.username}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedUser(null);
                  setShowEditForm(false);
                }}
              >
                ×
              </button>
            </div>

            {showEditForm ? (
              <form onSubmit={handleEdit} style={{ padding: '16px 24px' }}>
                <div className="form-group">
                  <label htmlFor="editFullName">Full Name</label>
                  <input
                    id="editFullName"
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editPhone">Phone</label>
                  <input
                    id="editPhone"
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    maxLength={15}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editRole">Role</label>
                  <select
                    id="editRole"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="order-detail-meta">
                  <span>Username: {selectedUser.username}</span>
                  <span
                    className={`badge ${
                      selectedUser.role === 'MANAGER' ? 'badge-warning' : 'badge-info'
                    }`}
                  >
                    {selectedUser.role}
                  </span>
                </div>

                <div style={{ padding: '16px 24px' }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Full Name:</strong>{' '}
                    {selectedUser.fullName || '—'}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Phone:</strong> {selectedUser.phone || '—'}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`badge ${
                        selectedUser.isActive ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Created:</strong>{' '}
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Updated:</strong>{' '}
                    {new Date(selectedUser.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="order-detail-actions" style={{ padding: '0 24px 24px' }}>
                  <button className="btn btn-primary btn-block" onClick={openEditForm}>
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={handleResetPassword}
                  >
                    Reset Password
                  </button>
                  <button
                    className={`btn btn-block ${
                      selectedUser.isActive ? 'btn-danger' : 'btn-primary'
                    }`}
                    onClick={handleToggleActive}
                  >
                    {selectedUser.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
