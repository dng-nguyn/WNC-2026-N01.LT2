import { useState, useEffect } from 'react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatsCard, TopItemsTable } from '../components/dashboard';
import { Card } from '../components';
import { getLoggedInUser } from '../services/auth.service';
import { getSepayStatus, type SepayStatus } from '../services/settings.service';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();
  const user = getLoggedInUser();
  const [sepayStatus, setSepayStatus] = useState<SepayStatus | null>(null);

  useEffect(() => {
    getSepayStatus().then(setSepayStatus).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          {user && <span className="user-badge">Welcome, {user.username}</span>}
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {sepayStatus && !sepayStatus.valid && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>
            <strong>SePay not configured:</strong> {sepayStatus.message}.{' '}
            Payment verification will not work until SePay is set up in{' '}
            <a href="/settings" style={{ color: '#2563eb', textDecoration: 'underline' }}>Settings</a>.
          </span>
        </div>
      )}

      {stats && (
        <>
          <div className="stats-grid">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
            />
            <StatsCard title="Total Orders" value={stats.totalOrders} />
            <StatsCard
              title="Completed"
              value={stats.completedOrders}
              variant="green"
            />
            <StatsCard
              title="Pending"
              value={stats.pendingOrders}
              variant="orange"
            />
            <StatsCard
              title="Avg Order Value"
              value={formatCurrency(stats.averageOrderValue)}
            />
          </div>

          <Card title="Top Selling Items">
            <TopItemsTable items={stats.topItems} />
          </Card>
        </>
      )}
    </div>
  );
}
