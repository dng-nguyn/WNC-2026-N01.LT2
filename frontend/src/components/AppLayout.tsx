import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getLoggedInUser } from '../services/auth.service';
import { useTranslation } from '../i18n';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard' as const, icon: '📊' },
  { path: '/pos', labelKey: 'nav.pos' as const, icon: '🛒' },
  { path: '/tables', labelKey: 'nav.tables' as const, icon: '🪑' },
  { path: '/transactions', labelKey: 'nav.transactions' as const, icon: '📋' },
  { path: '/manage-tables', labelKey: 'nav.manageTables' as const, icon: '⚙️' },
  { path: '/menus', labelKey: 'nav.categories' as const, icon: '📁' },
  { path: '/menu-items', labelKey: 'nav.menuItems' as const, icon: '☕' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getLoggedInUser();
  const { t, locale, setLocale } = useTranslation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function toggleLocale() {
    setLocale(locale === 'vi' ? 'en' : 'vi');
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
              <span className="sidebar-link-label">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-lang"
            onClick={toggleLocale}
            title="Change language"
          >
            {locale === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
          </button>
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
            {t('nav.logout')}
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
