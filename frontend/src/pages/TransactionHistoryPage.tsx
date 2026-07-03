import { useEffect, useState } from 'react';
import { fetchTransactions, reverifyTransaction } from '../services/transaction.service';
import { VerificationType, type Transaction } from '../types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reverifyingId, setReverifyingId] = useState<string | null>(null);
  const [reverifyResult, setReverifyResult] = useState<Record<string, { found: boolean; sepayId: string | null }>>({});
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(today());

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await fetchTransactions(100, dateFrom, dateTo);
      setTransactions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  async function handleReverify(id: string) {
    try {
      setReverifyingId(id);
      setReverifyResult((prev) => ({ ...prev, [id]: undefined as any }));
      const updated = await reverifyTransaction(id);
      const found = !!updated.sepayTransactionId;
      setReverifyResult((prev) => ({
        ...prev,
        [id]: { found, sepayId: updated.sepayTransactionId },
      }));
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updated : t)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reverify failed');
    } finally {
      setReverifyingId(null);
    }
  }

  if (loading) {
    return <div className="page-container"><p>Loading transactions…</p></div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Transaction History</h1>
      </header>

      {/* Date filter */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', marginBottom: 16 }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <button className="btn btn-primary" onClick={loadTransactions}>
          Search
        </button>
        <button className="btn btn-secondary" onClick={() => { setDateFrom(daysAgo(30)); setDateTo(today()); }}>
          Last 30 days
        </button>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')}>
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <p className="text-muted">No transactions found for this date range.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Verification</th>
              <th>Sepay TX ID</th>
              <th>Reverified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const rResult = reverifyResult[tx.id];
              return (
                <tr key={tx.id}>
                  <td>{formatDateTime(tx.verifiedAt)}</td>
                  <td>
                    <code style={{ fontSize: '0.8rem' }}>{tx.order?.id ?? '—'}</code>
                  </td>
                  <td>{formatCurrency(Number(tx.amount))}</td>
                  <td>
                    <span className={`badge ${tx.verificationType === VerificationType.AUTO ? 'badge-success' : 'badge-warning'}`}>
                      {tx.verificationType === VerificationType.AUTO ? '✓ Auto' : '✎ Manual'}
                    </span>
                  </td>
                  <td className="text-muted">
                    {tx.sepayTransactionId ?? '—'}
                  </td>
                  <td className="text-muted">
                    {tx.reverifiedAt ? formatDateTime(tx.reverifiedAt) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleReverify(tx.id)}
                        disabled={reverifyingId === tx.id}
                      >
                        {reverifyingId === tx.id ? 'Checking…' : 'Reverify'}
                      </button>
                      {rResult && (
                        <span style={{ fontSize: '0.75rem', color: rResult.found ? '#16a34a' : '#dc2626' }}>
                          {rResult.found ? `✓ Found (TX: ${rResult.sepayId})` : '✗ No match on SePay'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
