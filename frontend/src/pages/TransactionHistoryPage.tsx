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

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reverifyingId, setReverifyingId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await fetchTransactions(100);
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
      const updated = await reverifyTransaction(id);
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
        <button className="btn btn-secondary" onClick={loadTransactions}>
          Refresh
        </button>
      </header>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')}>
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <p className="text-muted">No transactions yet.</p>
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
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{formatDateTime(tx.verifiedAt)}</td>
                <td title={tx.order.id}>
                  {tx.order.id.slice(0, 8)}…
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
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleReverify(tx.id)}
                    disabled={reverifyingId === tx.id}
                  >
                    {reverifyingId === tx.id ? 'Checking…' : 'Reverify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
