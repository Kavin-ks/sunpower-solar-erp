import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { SiteSurveysPage } from './pages/SiteSurveysPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { DispatchPage } from './pages/DispatchPage';
import { InstallationsPage } from './pages/InstallationsPage';
import { WarrantyPage } from './pages/WarrantyPage';
import { ServiceTicketsPage } from './pages/ServiceTicketsPage';
import { FinancePage } from './pages/FinancePage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/enquiries" element={<EnquiriesPage />} />
            <Route path="/surveys" element={<SiteSurveysPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/installations" element={<InstallationsPage />} />
            <Route path="/warranties" element={<WarrantyPage />} />
            <Route path="/service" element={<ServiceTicketsPage />} />
            <Route path="/finance" element={<FinancePage />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
