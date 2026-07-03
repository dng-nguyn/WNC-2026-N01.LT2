import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import TablesPage from './pages/TablesPage';
import MenuManagementPage from './pages/MenuManagementPage';
import MenuItemManagementPage from './pages/MenuItemManagementPage';
export default function App() {
  return (
    <I18nProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — with sidebar layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menus"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MenuManagementPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu-items"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MenuItemManagementPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected routes — with sidebar layout */}
      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <POSPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tables"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TablesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </I18nProvider>
  );
}
