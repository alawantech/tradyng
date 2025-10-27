import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PricingSection } from '../components/sections/PricingSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';

export const LandingPage: React.FC = () => {
  // Handle hash navigation on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#features') {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          featuresSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative theme-hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Build Your
                <span className="theme-primary-light-text"> Dream Store </span>
                in Minutes
              </h1>
              <p className="text-xl theme-primary-light-text mb-8 leading-relaxed">
                Create a professional online store with your own custom domain. 
                Start selling today with our powerful e-commerce platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth/signup">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 hover:text-black px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    Start Your Store Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/store-examples">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    🛍️ View Store Examples
                  </Button>
                </Link>
              </div>
              <p className="text-blue-200 text-sm mt-4">
                ✨ No credit card required • Setup in under 5 minutes
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-lg shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <img 
                  src="/images/dashboard.PNG" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Showcase Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="text-blue-600"> Run Your Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From managing your store to serving customers, our platform gives you complete control and insights.
            </p>
          </motion.div>

          {/* Admin Dashboard Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Powerful Admin Dashboard
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Get complete control over your business with our intuitive admin dashboard.
                  Monitor sales, manage inventory, and grow your store from anywhere.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Real-time sales tracking
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Inventory management
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Customer insights
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gray-900 rounded-xl shadow-2xl p-2 transform hover:scale-105 transition-transform duration-300">
                  <img
                    src="/images/dashboard.PNG"
                    alt="Admin Dashboard"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customer & Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Customer Management */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Customer Management
                </h3>
                <p className="text-gray-600">
                  Build lasting relationships with detailed customer profiles and communication tools.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-3">
                <img
                  src="/images/customers.PNG"
                  alt="Customer Management"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Advanced Analytics
                </h3>
                <p className="text-gray-600">
                  Make data-driven decisions with comprehensive analytics and performance insights.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-3">
                <img
                  src="/images/analitics.PNG"
                  alt="Store Analytics"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>
          </div>

          {/* Storefront Experience */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Beautiful Storefront Experience
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your customers will love browsing your professionally designed online store.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hero Section Preview */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Hero Section</h4>
                  <p className="text-sm text-gray-600">Make a stunning first impression</p>
                </div>
                <img
                  src="/images/hero.PNG"
                  alt="Storefront Hero"
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {/* Products Display */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Product Showcase</h4>
                  <p className="text-sm text-gray-600">Beautiful product listings</p>
                </div>
                <img
                  src="/images/products.PNG"
                  alt="Product Display"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </motion.div>

          {/* Order Management */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 lg:p-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Seamless Order Management
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Process orders efficiently with our comprehensive order management system.
                  Track, fulfill, and manage all your sales in one place.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <div className="text-sm text-gray-600">Order Processing</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">Auto</div>
                    <div className="text-sm text-gray-600">Notifications</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4">
                <img
                  src="/images/orders.PNG"
                  alt="Order Management"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};