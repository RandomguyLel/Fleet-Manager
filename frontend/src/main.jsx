import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './i18n/i18n';  // Import i18n configuration
import Dashboard from './Dashboard';
import Vehicles from './Vehicles';
import Analytics from './Analytics';
import AuditLog from './AuditLog';
import Login from './Login';
import Profile from './Profile';
import UserManagement from './UserManagement';
import ServiceHistory from './ServiceHistory';
import SystemSettings from './SystemSettings';
import Calendar from './pages/Calendar';
import { AuthProvider, ProtectedRoute, AdminProtectedRoute } from './AuthContext';
import { CsddProvider } from './CsddContext';

// Layout wrapper component
const AppLayout = ({ children }) => {
  return <>{children}</>;
};

// App component that handles routes
const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Vehicles />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-log"
        element={
          <AdminProtectedRoute>
            <AppLayout>
              <AuditLog />
            </AppLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <AdminProtectedRoute>
            <AppLayout>
              <UserManagement />
            </AppLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/service-history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ServiceHistory />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-history/:vehicleId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ServiceHistory />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Calendar />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SystemSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CsddProvider>
          <App />
        </CsddProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);