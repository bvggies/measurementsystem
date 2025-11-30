import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MeasurementsList from './pages/MeasurementsList';
import MeasurementForm from './pages/MeasurementForm';
import MeasurementView from './pages/MeasurementView';
import ImportPage from './pages/ImportPage';
import CustomersList from './pages/CustomersList';
import OrdersList from './pages/OrdersList';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import ShareableForm from './pages/ShareableForm';
import ActivityLogs from './pages/ActivityLogs';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/form/:token" element={<ShareableForm />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="measurements" element={<MeasurementsList />} />
        <Route path="measurements/new" element={<MeasurementForm />} />
        <Route path="measurements/view/:id" element={<MeasurementView />} />
        <Route path="measurements/edit/:id" element={<MeasurementForm />} />
        <Route path="import" element={<ProtectedRoute allowedRoles={['admin']}><ImportPage /></ProtectedRoute>} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="activity-logs"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
    });
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

