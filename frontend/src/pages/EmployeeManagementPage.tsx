import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  createUserAccount,
  updateUserAccount,
} from '../services/employee.service';
import { UserRole, type Employee } from '../types';
import { Modal } from '../components/ui';

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetPwResult, setResetPwResult] = useState<string | null>(null);

  // Create form
  const [cUsername, setCUsername] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cRole, setCRole] = useState(UserRole.STAFF);
  const [cFullName, setCFullName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPosition, setCPosition] = useState('');
  const [cDepartment, setCDepartment] = useState('');
  const [cSalary, setCSalary] = useState('');
  const [pwErrors, setPwErrors] = useState<string[]>([]);

  // Edit form
  const [eFullName, setEFullName] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [ePosition, setEPosition] = useState('');
  const [eDepartment, setEDepartment] = useState('');
  const [eSalary, setESalary] = useState('');
  const [eRole, setERole] = useState(UserRole.STAFF);
  const [eIsActive, setEIsActive] = useState(true);

  useEffect(() => { loadEmployees(); }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(id: string) {
    setSelectedId(id);
    setError('');
    setResetPwResult(null);
    setShowEdit(false);
    try {
      const emp = await fetchEmployee(id);
      setSelectedEmp(emp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load employee');
      setSelectedEmp(null);
    }
  }

  function validatePassword(pw: string): string[] {
    const errors: string[] = [];
    if (pw.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pw)) errors.push('At least one uppercase letter');
    if (!/\d/.test(pw)) errors.push('At least one number');
    return errors;
  }

  function handlePasswordChange(pw: string) {
    setCPassword(pw);
    setPwErrors(pw.length > 0 ? validatePassword(pw) : []);
  }

  function openCreate() {
    setCUsername(''); setCPassword(''); setCRole(UserRole.STAFF);
    setCFullName(''); setCEmail(''); setCPhone('');
    setCPosition(''); setCDepartment(''); setCSalary('');
    setPwErrors([]);
    setShowCreate(true);
    setError('');
  }

  function openEdit() {
    if (!selectedEmp) return;
    setEFullName(selectedEmp.fullName);
    setEEmail(selectedEmp.email);
    setEPhone(selectedEmp.phone || '');
    setEPosition(selectedEmp.position || '');
    setEDepartment(selectedEmp.department || '');
    setESalary(selectedEmp.salary?.toString() || '');
    setERole(selectedEmp.user?.role || UserRole.STAFF);
    setEIsActive(selectedEmp.isActive);
    setShowEdit(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const pwValidation = validatePassword(cPassword);
    if (pwValidation.length > 0) { setPwErrors(pwValidation); return; }
    if (!cFullName.trim()) { setError('Full name is required'); return; }
    if (!cEmail.trim() || !cEmail.includes('@')) { setError('Valid email is required'); return; }

    setSaving(true);
    setError('');
    try {
      // 1. Create user account
      const user = await createUserAccount({
        username: cUsername,
        password: cPassword,
        fullName: cFullName,
        phone: cPhone || undefined,
        role: cRole,
      });
      // 2. Create employee linked to user
      await createEmployee({
        userId: user.id,
        fullName: cFullName,
        email: cEmail,
        phone: cPhone || undefined,
        position: cPosition || undefined,
        department: cDepartment || undefined,
        salary: cSalary ? Number(cSalary) : undefined,
      });
      await loadEmployees();
      setShowCreate(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaving(true);
    setError('');
    try {
      // Update employee details
      const updated = await updateEmployee(selectedEmp.id, {
        fullName: eFullName,
        email: eEmail,
        phone: ePhone || undefined,
        position: ePosition || undefined,
        department: eDepartment || undefined,
        salary: eSalary ? Number(eSalary) : undefined,
        isActive: eIsActive,
      });
      // Update user role if changed
      if (selectedEmp.user && selectedEmp.user.role !== eRole) {
        await updateUserAccount(selectedEmp.user.id, { role: eRole });
      }
      setSelectedEmp(updated);
      setShowEdit(false);
      await loadEmployees();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedEmp) return;
    const confirmed = window.confirm(`Reset password for ${selectedEmp.fullName}?`);
    if (!confirmed) return;
    try {
      const result = await resetEmployeePassword(selectedEmp.id);
      setResetPwResult(result.newPassword);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  }

  async function handleToggleActive() {
    if (!selectedEmp) return;
    try {
      const updated = await updateEmployee(selectedEmp.id, { isActive: !selectedEmp.isActive });
      setSelectedEmp(updated);
      await loadEmployees();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  if (loading) return <div className="page-container"><p>Loading employees…</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Manage Employees</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Employee</button>
      </header>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Employee">
        <form onSubmit={handleCreate}>
          <h4 style={{ margin: '0 0 12px', color: '#475569' }}>User Account</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={cUsername} onChange={(e) => setCUsername(e.target.value)}
                required maxLength={50} autoFocus />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" value={cPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required minLength={8} maxLength={100} />
              {pwErrors.length > 0 && (
                <small style={{ color: '#dc2626' }}>{pwErrors.join('. ')}</small>
              )}
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Role *</label>
              <select value={cRole} onChange={(e) => setCRole(e.target.value as UserRole)} required>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>

          <h4 style={{ margin: '16px 0 12px', color: '#475569' }}>Employee Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={cFullName} onChange={(e) => setCFullName(e.target.value)}
                required maxLength={100} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)}
                required maxLength={100} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)}
                maxLength={15} />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input type="text" value={cPosition} onChange={(e) => setCPosition(e.target.value)}
                maxLength={50} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" value={cDepartment} onChange={(e) => setCDepartment(e.target.value)}
                maxLength={50} />
            </div>
            <div className="form-group">
              <label>Salary (VND)</label>
              <input type="number" value={cSalary} onChange={(e) => setCSalary(e.target.value)}
                min={0} step={1000} />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Employee'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Employee">
        <form onSubmit={handleEdit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={eFullName} onChange={(e) => setEFullName(e.target.value)} maxLength={100} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} maxLength={100} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={ePhone} onChange={(e) => setEPhone(e.target.value)} maxLength={15} />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input type="text" value={ePosition} onChange={(e) => setEPosition(e.target.value)} maxLength={50} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" value={eDepartment} onChange={(e) => setEDepartment(e.target.value)} maxLength={50} />
            </div>
            <div className="form-group">
              <label>Salary (VND)</label>
              <input type="number" value={eSalary} onChange={(e) => setESalary(e.target.value)} min={0} step={1000} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={eRole} onChange={(e) => setERole(e.target.value as UserRole)}>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={eIsActive}
                  onChange={(e) => setEIsActive(e.target.checked)}
                  style={{ width: 16, height: 16 }} />
                Active
              </label>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Table + Detail Panel */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={7} className="text-muted">No employees yet.</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} onClick={() => handleSelect(emp.id)}
                    style={{ cursor: 'pointer', background: selectedId === emp.id ? '#eff6ff' : undefined }}>
                    <td><strong>{emp.fullName}</strong></td>
                    <td>{emp.email}</td>
                    <td>{emp.position || '—'}</td>
                    <td>{emp.department || '—'}</td>
                    <td>
                      <span className={`badge ${emp.user?.role === 'MANAGER' ? 'badge-warning' : 'badge-info'}`}>
                        {emp.user?.role || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedEmp && (
          <div className="order-detail-panel" style={{ width: 400, flexShrink: 0 }}>
            <div className="order-detail-header">
              <h3>{selectedEmp.fullName}</h3>
              <button className="modal-close" onClick={() => {
                setSelectedId(null); setSelectedEmp(null); setShowEdit(false); setResetPwResult(null);
              }}>×</button>
            </div>

            <div className="order-detail-meta">
              <span>{selectedEmp.email}</span>
              <span className={`badge ${selectedEmp.user?.role === 'MANAGER' ? 'badge-warning' : 'badge-info'}`}>
                {selectedEmp.user?.role || '—'}
              </span>
            </div>

            <div style={{ padding: '16px 24px' }}>
              <DetailRow label="Username" value={selectedEmp.user?.username} />
              <DetailRow label="Full Name" value={selectedEmp.fullName} />
              <DetailRow label="Email" value={selectedEmp.email} />
              <DetailRow label="Phone" value={selectedEmp.phone} />
              <DetailRow label="Position" value={selectedEmp.position} />
              <DetailRow label="Department" value={selectedEmp.department} />
              <DetailRow label="Salary" value={selectedEmp.salary ? `${Number(selectedEmp.salary).toLocaleString()} VND` : null} />
              <DetailRow label="Status">
                <span className={`badge ${selectedEmp.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {selectedEmp.isActive ? 'Active' : 'Inactive'}
                </span>
              </DetailRow>
              <DetailRow label="Created" value={new Date(selectedEmp.createdAt).toLocaleString()} />
              <DetailRow label="Updated" value={new Date(selectedEmp.updatedAt).toLocaleString()} />
              <DetailRow label="Employee ID">
                <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{selectedEmp.id}</code>
              </DetailRow>
            </div>

            {resetPwResult && (
              <div style={{ padding: '0 24px 12px' }}>
                <div className="alert alert-success">
                  New password: <strong><code>{resetPwResult}</code></strong>
                  <br /><small>Copy this — it won't be shown again.</small>
                </div>
              </div>
            )}

            <div className="order-detail-actions" style={{ padding: '0 24px 24px' }}>
              <button className="btn btn-primary btn-block" onClick={openEdit}>Edit Details</button>
              <button className="btn btn-secondary btn-block" onClick={handleResetPassword}>Reset Password</button>
              <button className={`btn btn-block ${selectedEmp.isActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleActive}>
                {selectedEmp.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
      {children ?? <span style={{ fontWeight: 500 }}>{value || '—'}</span>}
    </div>
  );
}
