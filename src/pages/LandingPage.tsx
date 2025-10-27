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
                  <Button size="lg" className="hero-btn-primary px-8 py-4 text-lg">
                    Start Your Store Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:theme-primary-text px-8 py-4 text-lg"
                >
                  Watch Demo
                </Button>
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
                  src="/src/assets/images/dashboard.PNG" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />

      <Footer />
    </div>
  );
};