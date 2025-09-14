import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignUp } from './pages/auth/SignUp';
import { SignIn } from './pages/auth/SignIn';

// Dashboard
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { Products } from './pages/dashboard/Products';
import { Orders } from './pages/dashboard/Orders';
import { Customers } from './pages/dashboard/Customers';
import { Analytics } from './pages/dashboard/Analytics';
import { Settings } from './pages/dashboard/Settings';

// Storefront
import { StorefrontLayout } from './pages/storefront/StorefrontLayout';
import { StorefrontHome } from './pages/storefront/StorefrontHome';
import { ProductListing } from './pages/storefront/ProductListing';
import { ProductDetails } from './pages/storefront/ProductDetails';

// Admin
import { AdminLayout } from './pages/admin/AdminLayout';
import { Businesses } from './pages/admin/Businesses';
import { Subscriptions } from './pages/admin/Subscriptions';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentication */}
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/signin" element={<SignIn />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Products />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Storefront */}
          <Route path="/store" element={<StorefrontLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="products" element={<ProductListing />} />
            <Route path="product/:id" element={<ProductDetails />} />
          </Route>
            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Businesses />} />
              <Route path="businesses" element={<Businesses />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;