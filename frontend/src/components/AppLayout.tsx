import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getLoggedInUser } from '../services/auth.service';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/pos', label: 'POS Terminal', icon: '🛒' },
  { path: '/menus', label: 'Menu Categories', icon: '📁' },
  { path: '/menu-items', label: 'Menu Items', icon: '☕' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getLoggedInUser();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">☕</span>
          <span className="sidebar-title">Coffee POS</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <span className="sidebar-user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className="sidebar-user-name">{user.username}</span>
            </div>
          )}
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">{children}</main>

      {/* Mobile hamburger */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle navigation"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
