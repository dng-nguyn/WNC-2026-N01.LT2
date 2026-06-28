import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../services/order.service';
import { logout, getLoggedInUser } from '../services/auth.service';
import type { Order, OrderStatus } from '../types';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topItems: { name: string; quantity: number; revenue: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getLoggedInUser();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const orders = await fetchOrders();
      const computed = computeStats(orders);
      setStats(computed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  function computeStats(orders: Order[]): Stats {
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    let totalRevenue = 0;
    let completedOrders = 0;
    let pendingOrders = 0;

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount);

      if (order.status === 'COMPLETED') completedOrders++;
      if (order.status === 'PENDING') pendingOrders++;

      for (const item of order.items) {
        const existing = itemMap.get(item.menuItem.name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.quantity * Number(item.price);
        } else {
          itemMap.set(item.menuItem.name, {
            name: item.menuItem.name,
            quantity: item.quantity,
            revenue: item.quantity * Number(item.price),
          });
        }
      }
    }

    const topItems = [...itemMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: orders.length,
      completedOrders,
      pendingOrders,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      topItems,
    };
  }

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (loading) return <div className="page-container"><p>Loading dashboard…</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          {user && <span className="user-badge">Welcome, {user.username}</span>}
        </div>
        <nav className="nav-links">
          <Link to="/pos" className="btn btn-primary">POS Terminal</Link>
          <Link to="/menus" className="btn btn-secondary">Menus</Link>
          <Link to="/menu-items" className="btn btn-secondary">Menu Items</Link>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </nav>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p className="stat-value stat-green">{stats.completedOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-value stat-orange">{stats.pendingOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Avg Order Value</h3>
              <p className="stat-value">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>

          <div className="card">
            <h2>Top Selling Items</h2>
            {stats.topItems.length === 0 ? (
              <p className="text-muted">No orders yet</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topItems.map((item, i) => (
                    <tr key={item.name}>
                      <td>{i + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
