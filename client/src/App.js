import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SignupPage from './pages/auth/SignupPage';
import ContactPage from './pages/contact/ContactPage';
import AboutPage from './pages/about/AboutPage';
import CollectionPage from './pages/collection/CollectionPage';
import CategoryPage from './pages/collection/CategoryPage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';
import UserDashboard from './pages/user/UserDashboard';
import AdminPanel from './pages/admin/AdminPanel';
import DashboardHome from './pages/admin/DashboardHome';
import BooksPage from './pages/admin/BooksPage';
import MembersPage from './pages/admin/MembersPage';
import IssuesPage from './pages/admin/IssuesPage';
import UsersPage from './pages/admin/UsersPage';
import OrdersPage from './pages/admin/OrdersPage';
import SettingsPage from './pages/admin/SettingsPage';
import RefundsPage from './pages/admin/RefundsPage';
import ComplaintsPage from './pages/admin/ComplaintsPage';
import BackToTop from './components/common/BackToTop';
import AIChatbot from './components/common/AIChatbot';
import InvoicePage from './pages/user/InvoicePage';
import ReaderPage from './pages/user/ReaderPage';

const ProtectedRoute = ({ children, adminRequired }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminRequired && !['admin', 'librarian'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={['admin','librarian'].includes(user.role) ? '/admin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup"   element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/contact"  element={<ContactPage />} />
          <Route path="/about"    element={<AboutPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/collection/:category" element={<CategoryPage />} />
          <Route path="/cart"     element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/invoice/:id" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
          <Route path="/read/:bookId" element={<ProtectedRoute><ReaderPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminRequired><AdminPanel /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="orders"   element={<OrdersPage />} />
            <Route path="books"    element={<BooksPage />} />
            <Route path="members"  element={<MembersPage />} />
            <Route path="issues"   element={<IssuesPage />} />
            <Route path="users"    element={<UsersPage />} />
            <Route path="refunds"  element={<RefundsPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
      <BackToTop />
      <AIChatbot />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#c9a84c', secondary: '#000' } },
                error:   { iconTheme: { primary: '#e05a5a', secondary: '#000' } },
              }}
            />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}