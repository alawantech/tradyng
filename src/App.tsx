import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SubdomainService, SubdomainInfo } from './services/subdomain';
import { CartProvider } from './contexts/CartContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Initialize Firebase
import './config/firebase';

// Pages
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { CouponPage } from './pages/CouponPage';
import { FeaturesPage } from './pages/features/FeaturesPage';
import { StoreExamples } from './pages/StoreExamples';
import { SignUp } from './pages/auth/SignUp';
import { SignIn } from './pages/auth/SignIn';
import { PaymentCallback } from './pages/auth/PaymentCallback';
import { AffiliatePage } from './pages/AffiliatePage';
import { AffiliateDashboard } from './pages/AffiliateDashboard';

// Dashboard
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Products } from './pages/dashboard/Products';
import { Orders } from './pages/dashboard/Orders';
import { Customers } from './pages/dashboard/Customers';
import { Analytics } from './pages/dashboard/Analytics';
import { Settings } from './pages/dashboard/Settings';

// Storefront
import { StorefrontLayout } from './pages/storefront/StorefrontLayout';
import { StorefrontHome } from './pages/storefront/StorefrontHome';
import { ProductDetails } from './pages/storefront/ProductDetails';
import { Cart } from './pages/storefront/Cart';
import { EnhancedCheckout } from './pages/storefront/EnhancedCheckout';
import { CustomerProfilePage } from './pages/storefront/CustomerProfile';
import OrderHistory from './pages/storefront/OrderHistory';
import { Payment } from './pages/storefront/Payment';

// Demo
import { StoreSubdomainDemo } from './pages/demo/StoreSubdomainDemo';
import { SubdomainTest } from './pages/demo/SubdomainTest';
import { EmailTest } from './pages/demo/EmailTest';

// Admin
import { AdminLayout } from './pages/admin/AdminLayout';
import { Businesses } from './pages/admin/Businesses';
import { Affiliates } from './pages/admin/Affiliates';
import { Subscriptions } from './pages/admin/Subscriptions';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminOrders } from './pages/admin/Orders';

function App() {
  const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectSubdomain = async () => {
      try {
        const info = await SubdomainService.detectSubdomain();
        setSubdomainInfo(info);
      } catch (error) {
        console.error('Error detecting subdomain:', error);
        // Default to main site if detection fails
        setSubdomainInfo({
          isSubdomain: false,
          originalDomain: window.location.hostname
        });
      } finally {
        setIsLoading(false);
      }
    };

    detectSubdomain();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          {subdomainInfo?.isSubdomain ? (
            // Store routes - only show storefront for subdomains
            <CustomerAuthProvider>
              <CartProvider>
                <Routes>
                  <Route path="/" element={<StorefrontLayout />}>
                    <Route index element={<StorefrontHome />} />
                    <Route path="product/:id" element={<ProductDetails />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<EnhancedCheckout />} />
                    <Route path="profile" element={<CustomerProfilePage />} />
                    <Route path="orders" element={<OrderHistory />} />
                    <Route path="payment" element={<Payment />} />
                  </Route>
                  {/* Redirect any other routes to the store home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CartProvider>
            </CustomerAuthProvider>
          ) : (
            // Main site routes - dashboard and landing page
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/coupon" element={<CouponPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/store-examples" element={<StoreExamples />} />
              <Route path="/demo/subdomains" element={<StoreSubdomainDemo />} />
              <Route path="/demo/test" element={<SubdomainTest />} />
              <Route path="/demo/email-test" element={<EmailTest />} />
              
              {/* Authentication */}
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              
              {/* Affiliate */}
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
              
              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="customers" element={<Customers />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Admin */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Businesses />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="businesses" element={<Businesses />} />
                <Route path="affiliates" element={<Affiliates />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          )}
          
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
    </ThemeProvider>
  );
}

export default App;