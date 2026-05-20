import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Favorites from './pages/Favorites';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';
import Register from './pages/Register';

// Vendor Pages
import VendorDashboard from './pages/VendorDashboard';
import MyProperties from './pages/MyProperties';
import SalesHistory from './pages/SalesHistory';
import Analytics from './pages/Analytics';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import PermissionsManager from './pages/PermissionsManager';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <FavoritesProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main className="page-wrapper" style={{ flex: 1, backgroundColor: 'var(--bg-color)' }}>
              <div className="container">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Customer Routes */}
                  <Route path="/favorites" element={
                    <ProtectedRoute allowedRoles={['Customer', 'Admin', 'Vendor']}>
                      <Favorites />
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute allowedRoles={['Customer']}>
                      <MyOrders />
                    </ProtectedRoute>
                  } />

                  {/* Vendor Routes */}
                  <Route path="/vendor" element={
                    <ProtectedRoute allowedRoles={['Vendor']}>
                      <VendorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/properties" element={
                    <ProtectedRoute allowedRoles={['Vendor']}>
                      <MyProperties />
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/sales" element={
                    <ProtectedRoute allowedRoles={['Vendor']}>
                      <SalesHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/analytics" element={
                    <ProtectedRoute allowedRoles={['Vendor']}>
                      <Analytics />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/permissions" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <PermissionsManager />
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </main>
          </div>
          </FavoritesProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
