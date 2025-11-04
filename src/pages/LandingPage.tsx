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
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden min-h-screen flex items-center">
        {/* Advanced Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Animated Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              animation: 'moveGeometricPattern 20s linear infinite'
            }}
          />
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-32 left-16 w-20 h-20 border-2 border-blue-300/40 rounded-full hero-float"></div>
        <div className="absolute top-48 right-32 w-16 h-16 border-2 border-indigo-300/40 rounded-lg transform rotate-45 hero-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-blue-400/20 rounded-full hero-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 right-1/4 w-24 h-24 border-2 border-purple-300/30 rounded-lg transform rotate-12 hero-float" style={{ animationDelay: '2.5s' }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Enhanced Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 backdrop-blur-sm rounded-full border border-blue-200/50"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-sm font-semibold text-blue-700">
                  💰 Plans from ₦16,000/year
                </span>
              </motion.div>

              {/* Main Heading with Gradient */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight"
              >
                <span className="block text-gray-900 mb-3">
                  Build Your Dream
                </span>
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  Online Store
                </span>
                <span className="block text-gray-900 mt-3">
                  In Minutes
                </span>
              </motion.h1>

              {/* Enhanced Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-xl"
              >
                Launch a stunning e-commerce store with your custom domain. 
                <span className="font-semibold text-blue-600"> Sell products, manage inventory, and grow your business</span> with our all-in-one platform.
              </motion.p>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap items-center gap-6 text-sm text-gray-600"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Free 7-Day Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Custom Domain</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">24/7 Support</span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link to="/pricing" className="group">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 rounded-xl relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Launch Your Store Now
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </Link>
                <Link to="/store-examples" className="group">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border-2 border-blue-600 text-blue-700 hover:bg-blue-50 hover:border-indigo-600 hover:text-indigo-700 px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Live Examples
                    </span>
                  </Button>
                </Link>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="pt-6 pb-3 flex items-center gap-4"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    {'★'.repeat(5)}
                  </div>
                  <p className="text-gray-600">
                    <span className="font-bold text-gray-900">5000+</span> businesses launched
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Enhanced Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative mt-12 lg:mt-0"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              
              {/* Main Dashboard Card */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-200/50 transform hover:scale-[1.02] transition-all duration-500">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-lg px-4 py-1 text-xs text-gray-500 text-center">
                    yourbusiness.tradyng.com
                  </div>
                </div>

                {/* Dashboard Image */}
                <div className="relative overflow-hidden rounded-2xl shadow-inner" style={{ height: '400px', maxHeight: '500px' }}>
                  <img
                    src="/images/dashboard.PNG"
                    alt="Admin Dashboard Preview"
                    className="w-full h-full object-cover object-left transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent"></div>
                  
                  {/* Floating Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-xl"
                  >
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">24/7</div>
                        <div className="text-xs text-gray-600">Online</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">∞</div>
                        <div className="text-xs text-gray-600">Products</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">⚡</div>
                        <div className="text-xs text-gray-600">Fast Setup</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating Badges */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg font-bold text-xs sm:text-sm z-10"
              >
                ✓ Secure & Fast
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute -bottom-4 -left-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg font-bold text-xs sm:text-sm z-10"
              >
                🔥 Trending
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Improved Wave Transition */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-20 lg:h-24">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff"></path>
          </svg>
        </div>
      </section>

      {/* Platform Showcase Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} className="w-full h-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            {/* Section Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200 mb-6"
            >
              <span className="text-sm font-bold text-blue-700">✨ All-in-One Platform</span>
            </motion.div>

            <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Everything You Need to
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                Run Your Business
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From managing your store to serving customers, our platform gives you 
              <span className="font-semibold text-gray-900"> complete control and real-time insights</span>.
            </p>
          </motion.div>

          {/* Admin Dashboard Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                  <span className="text-xs font-bold text-blue-700">🎯 CORE FEATURE</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                  Powerful Admin Dashboard
                  <span className="block text-blue-600 mt-2">At Your Fingertips</span>
                </h3>
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                  Get complete control over your business with our intuitive admin dashboard.
                  Monitor sales, manage inventory, and grow your store from anywhere, anytime.
                </p>
                <div className="space-y-4 pt-4">
                  {[
                    { icon: '📊', title: 'Real-time Sales Tracking', desc: 'Monitor revenue and orders as they happen' },
                    { icon: '📦', title: 'Smart Inventory Management', desc: 'Never run out of stock with auto-alerts' },
                    { icon: '👥', title: 'Customer Insights & Analytics', desc: 'Understand your customers better' },
                    { icon: '⚡', title: 'Lightning-Fast Operations', desc: 'Manage everything in seconds, not hours' }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index }}
                      viewport={{ once: true }}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors duration-300 group cursor-pointer"
                    >
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-3xl opacity-20"></div>
                
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-3 transform hover:scale-[1.02] transition-all duration-500">
                  <img
                    src="/images/dashboard.PNG"
                    alt="Admin Dashboard"
                    className="w-full h-auto rounded-xl"
                  />
                  {/* Overlay Badge */}
                  <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-pulse">
                    ✓ Live Demo
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Customer & Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
            {/* Customer Management */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 border border-blue-100"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/10 group-hover:to-indigo-400/10 rounded-3xl transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-200 rounded-full mb-4">
                      <span className="text-xs font-bold text-blue-700">👥 RELATIONSHIP</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-3">
                      Customer Management
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Build lasting relationships with detailed customer profiles, purchase history, and 
                      <span className="font-semibold text-gray-900"> smart communication tools</span>.
                    </p>
                  </div>
                </div>
                
                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Contact Info', 'Order History', 'Email Support'].map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-blue-600 shadow-sm">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-4 transform group-hover:scale-[1.02] transition-transform duration-500">
                  <img
                    src="/images/customers.PNG"
                    alt="Customer Management"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 border border-purple-100"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-pink-400/0 group-hover:from-purple-400/10 group-hover:to-pink-400/10 rounded-3xl transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-200 rounded-full mb-4">
                      <span className="text-xs font-bold text-purple-700">📈 INSIGHTS</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-3">
                      Advanced Analytics
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Make data-driven decisions with comprehensive analytics, 
                      <span className="font-semibold text-gray-900"> performance insights</span>, and revenue tracking.
                    </p>
                  </div>
                </div>
                
                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Sales Trends', 'Revenue Stats', 'Growth Metrics'].map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-purple-600 shadow-sm">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-4 transform group-hover:scale-[1.02] transition-transform duration-500">
                  <img
                    src="/images/analitics.PNG"
                    alt="Store Analytics"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Storefront Experience */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full border border-indigo-200 mb-6"
              >
                <span className="text-sm font-bold text-indigo-700">🎨 BEAUTIFUL DESIGN</span>
              </motion.div>
              <h3 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Beautiful Storefront
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  That Converts
                </span>
              </h3>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Your customers will love browsing your 
                <span className="font-semibold text-gray-900"> professionally designed online store</span>. 
                Every pixel optimized for sales.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hero Section Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 border border-indigo-100"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-blue-400/0 group-hover:from-indigo-400/10 group-hover:to-blue-400/10 rounded-3xl transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">🎯</span>
                        <h4 className="text-xl font-bold text-gray-900">Hero Section</h4>
                      </div>
                      <p className="text-sm text-gray-600">Make a stunning first impression that sells</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 rounded-full">
                      <span className="text-xs font-bold text-green-700">High Convert</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl p-3 transform group-hover:scale-[1.02] transition-transform duration-500">
                    <img
                      src="/images/hero.PNG"
                      alt="Storefront Hero"
                      className="w-full h-auto rounded-xl"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Products Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 border border-purple-100"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-pink-400/0 group-hover:from-purple-400/10 group-hover:to-pink-400/10 rounded-3xl transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">🛍️</span>
                        <h4 className="text-xl font-bold text-gray-900">Product Showcase</h4>
                      </div>
                      <p className="text-sm text-gray-600">Beautiful listings that drive purchases</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 rounded-full">
                      <span className="text-xs font-bold text-blue-700">Auto Layout</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl p-3 transform group-hover:scale-[1.02] transition-transform duration-500">
                    <img
                      src="/images/products.PNG"
                      alt="Product Display"
                      className="w-full h-auto rounded-xl"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Order Management */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-10 lg:p-16 overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-white space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="text-xs font-bold">🚀 EFFICIENCY</span>
                </div>
                
                <h3 className="text-3xl lg:text-5xl font-extrabold leading-tight">
                  Seamless Order
                  <span className="block mt-2">Management</span>
                </h3>
                
                <p className="text-lg lg:text-xl text-blue-100 leading-relaxed">
                  Process orders efficiently with our comprehensive system.
                  <span className="font-semibold text-white"> Track, fulfill, and manage all your sales</span> in one powerful dashboard.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl cursor-pointer"
                  >
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      24/7
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Always Online</div>
                    <div className="text-xs text-gray-500 mt-1">Never miss an order</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl cursor-pointer"
                  >
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      Auto
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Smart Alerts</div>
                    <div className="text-xs text-gray-500 mt-1">Instant notifications</div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl cursor-pointer"
                  >
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      ∞
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Unlimited</div>
                    <div className="text-xs text-gray-500 mt-1">No order limits</div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl cursor-pointer"
                  >
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                      ⚡
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Fast Sync</div>
                    <div className="text-xs text-gray-500 mt-1">Real-time updates</div>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl"></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform hover:scale-[1.02] transition-transform duration-500">
                  <img
                    src="/images/orders.PNG"
                    alt="Order Management"
                    className="w-full h-auto rounded-xl"
                  />
                  
                  {/* Floating Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-xl font-bold text-sm animate-bounce">
                    ✓ Live Orders
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]">
          <div style={{
            backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} className="w-full h-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              Why Choose
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
                Our Platform?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to start, run, and grow your online business
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🚀',
                title: 'Launch in Minutes',
                description: 'Get your store online fast. No technical skills required.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: '🎨',
                title: 'Custom Branding',
                description: 'Your domain, your colors, your brand identity.',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: '📱',
                title: 'Mobile Optimized',
                description: 'Perfect experience on all devices automatically.',
                color: 'from-pink-500 to-pink-600'
              },
              {
                icon: '💳',
                title: 'Secure Payments',
                description: 'Accept payments safely with built-in security.',
                color: 'from-green-500 to-green-600'
              },
              {
                icon: '📊',
                title: 'Real-Time Analytics',
                description: 'Track performance and make data-driven decisions.',
                color: 'from-indigo-500 to-indigo-600'
              },
              {
                icon: '🔔',
                title: 'Smart Notifications',
                description: 'Stay updated with instant order and customer alerts.',
                color: 'from-orange-500 to-orange-600'
              },
              {
                icon: '🎯',
                title: 'SEO Optimized',
                description: 'Get found on Google with built-in SEO tools.',
                color: 'from-red-500 to-red-600'
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Blazing fast load times keep customers happy.',
                color: 'from-yellow-500 to-yellow-600'
              },
              {
                icon: '💬',
                title: '24/7 Support',
                description: 'Expert help whenever you need it, day or night.',
                color: 'from-teal-500 to-teal-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-sm font-bold text-white">
                💰 From ₦16,000/year
              </span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight">
              Ready to Launch Your
              <span className="block mt-2">Dream Store?</span>
            </h2>

            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of successful entrepreneurs who are already 
              <span className="font-bold text-white"> selling online with our platform</span>. 
              Launch your store today!
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
              {[
                { number: '5000+', label: 'Active Stores' },
                { number: '₦16k', label: 'Per Year' },
                { number: '24/7', label: 'Support' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl lg:text-5xl font-extrabold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-blue-200 font-semibold">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/pricing" className="group">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-10 py-6 text-xl font-bold shadow-2xl hover:shadow-white/20 transform hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  <span className="flex items-center gap-3">
                    Get Started Now
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link to="/store-examples">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 px-10 py-6 text-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  View Examples
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8">
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Affordable pricing</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Setup in minutes</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};