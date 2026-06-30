import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatsCard, TopItemsTable } from '../components/dashboard';
import { Card } from '../components';
import { getLoggedInUser } from '../services/auth.service';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();
  const user = getLoggedInUser();

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
