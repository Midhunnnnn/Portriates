import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import AdminLogin from './pages/AdminLogin';
import GiveOrder from './pages/GiveOrder';
import Checkout from './pages/Checkout';
import Receipt from './pages/Receipt';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminArtworks from './pages/AdminArtworks';
import AdminEditArtwork from './pages/AdminEditArtwork';

// Protected Route Component for Client Users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-state-block" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p>Verifying secure session...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Route Component for Admin
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-state-block" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p>Verifying admin authorization...</p>
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Commission & Order Flow */}
              <Route path="/give-order" element={<GiveOrder />} />
              <Route path="/checkout/:orderNumber" element={<Checkout />} />
              <Route path="/receipt/:orderNumber" element={<Receipt />} />

              {/* Client Orders History */}
              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />

              {/* Studio Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <AdminOrders />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/artworks"
                element={
                  <AdminRoute>
                    <AdminArtworks />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/artworks/edit/:id"
                element={
                  <AdminRoute>
                    <AdminEditArtwork />
                  </AdminRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
