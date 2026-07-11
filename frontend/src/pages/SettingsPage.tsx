import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { changePassword } from '../services/auth.service';
import {
  getSepayConfig,
  setSepayApiKey,
  deleteSepayApiKey,
  listSepayAccounts,
  setSepayAccount,
  getSepayStatus,
  type SepayConfig,
  type SepayBankAccount,
  type SepayStatus,
} from '../services/settings.service';

export default function SettingsPage() {
  // ── Password state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  // ── SePay state ──
  const [sepayConfig, setSepayConfig] = useState<SepayConfig | null>(null);
  const [sepayStatus, setSepayStatus] = useState<SepayStatus | null>(null);
  const [accounts, setAccounts] = useState<SepayBankAccount[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [sepayLoading, setSepayLoading] = useState(false);
  const [sepayMessage, setSepayMessage] = useState('');
  const [sepayError, setSepayError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // ── Load SePay config ──
  const loadSepayConfig = useCallback(async () => {
    try {
      const [config, status] = await Promise.all([
        getSepayConfig(),
        getSepayStatus(),
      ]);
      setSepayConfig(config);
      setSepayStatus(status);
    } catch {
      // Settings endpoint may not be available yet
    }
  }, []);

  useEffect(() => {
    loadSepayConfig();
  }, [loadSepayConfig]);

  // ── Password change ──
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPwMessage('');
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }

    setPwSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      setPwMessage(result.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  }

  // ── SePay: Save API key ──
  async function handleSaveApiKey() {
    setSepayMessage('');
    setSepayError('');
    if (!apiKeyInput.trim()) {
      setSepayError('API key is required');
      return;
    }

    setSepayLoading(true);
    try {
      await setSepayApiKey(apiKeyInput.trim());
      setApiKeyInput('');
      setSepayMessage('API key saved');
      await loadSepayConfig();
    } catch (err: unknown) {
      setSepayError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setSepayLoading(false);
    }
  }

  // ── SePay: Remove API key ──
  async function handleRemoveApiKey() {
    setSepayMessage('');
    setSepayError('');
    setSepayLoading(true);
    try {
      await deleteSepayApiKey();
      setSepayMessage('API key removed');
      setAccounts([]);
      setSelectedAccount('');
      await loadSepayConfig();
    } catch (err: unknown) {
      setSepayError(err instanceof Error ? err.message : 'Failed to remove API key');
    } finally {
      setSepayLoading(false);
    }
  }

  // ── SePay: Fetch accounts ──
  async function handleFetchAccounts() {
    setSepayMessage('');
    setSepayError('');
    setSepayLoading(true);
    try {
      const accs = await listSepayAccounts();
      setAccounts(accs);
      if (accs.length > 0) {
        setSelectedAccount(accs[0].id);
      }
      setSepayMessage(`Found ${accs.length} account(s)`);
    } catch (err: unknown) {
      setSepayError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setSepayLoading(false);
    }
  }

  // ── SePay: Save selected account ──
  async function handleSaveAccount() {
    setSepayMessage('');
    setSepayError('');
    const acc = accounts.find((a) => a.id === selectedAccount);
    if (!acc) {
      setSepayError('Select an account first');
      return;
    }

    setSepayLoading(true);
    try {
      await setSepayAccount({
        accountNumber: acc.account_number,
        bankName: acc.bank_short_name,
        bankBin: acc.bank_bin,
        accountHolder: acc.account_holder_name,
      });
      setSepayMessage(`Account ${acc.account_number} (${acc.bank_short_name}) saved`);
      await loadSepayConfig();
    } catch (err: unknown) {
      setSepayError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSepayLoading(false);
    }
  }

  const statusColor = sepayStatus?.valid
    ? 'var(--color-success, #22c55e)'
    : sepayStatus?.configured
      ? 'var(--color-warning, #f59e0b)'
      : 'var(--color-error, #ef4444)';

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
        </div>
      </header>

      {/* ── SePay Configuration ── */}
      <div className="card form-card">
        <h3>SePay Payment Configuration</h3>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Configure your SePay API key and bank account for QR payment verification.
        </p>

        {/* Status indicator */}
        {sepayStatus && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: sepayStatus.valid ? '#f0fdf4' : sepayStatus.configured ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${statusColor}`,
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                flexShrink: 0,
              }}
            />
            <span>
              {sepayStatus.message}
              {sepayConfig?.accountNumber && sepayStatus.valid && (
                <> — Account: {sepayConfig.accountNumber} ({sepayConfig.bankName})</>
              )}
            </span>
          </div>
        )}

        {sepayMessage && <div className="alert alert-success">{sepayMessage}</div>}
        {sepayError && <div className="alert alert-error">{sepayError}</div>}

        {/* API Key section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            API Key
          </label>
          {sepayConfig?.apiKeySet ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {showApiKey ? sepayConfig.apiKeyPreview : '••••••••••••'}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                onClick={handleRemoveApiKey}
                disabled={sepayLoading}
              >
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your SePay API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveApiKey}
                disabled={sepayLoading || !apiKeyInput.trim()}
              >
                {sepayLoading ? 'Saving…' : 'Save Key'}
              </button>
            </div>
          )}
        </div>

        {/* Bank Account section */}
        {sepayConfig?.apiKeySet && (
          <div>
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              Bank Account
            </label>
            {sepayConfig.accountNumber ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>
                  {sepayConfig.accountNumber} — {sepayConfig.bankName}
                  {sepayConfig.accountHolder && ` (${sepayConfig.accountHolder})`}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  onClick={handleFetchAccounts}
                  disabled={sepayLoading}
                >
                  Change Account
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  No bank account selected. Fetch accounts from SePay and choose one.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFetchAccounts}
                  disabled={sepayLoading}
                >
                  {sepayLoading ? 'Loading…' : 'Fetch Accounts from SePay'}
                </button>
              </div>
            )}

            {/* Account dropdown */}
            {accounts.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} — {acc.bank_short_name} ({acc.account_holder_name})
                      {acc.label ? ` [${acc.label}]` : ''} — Balance: {Number(acc.accumulated).toLocaleString()} VND
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveAccount}
                    disabled={sepayLoading || !selectedAccount}
                  >
                    {sepayLoading ? 'Saving…' : 'Use This Account'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAccounts([])}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Change Password ── */}
      <div className="card form-card">
        <h3>Change Password</h3>

        {pwMessage && <div className="alert alert-success">{pwMessage}</div>}
        {pwError && <div className="alert alert-error">{pwError}</div>}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password *</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              maxLength={100}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={pwSaving}>
              {pwSaving ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
