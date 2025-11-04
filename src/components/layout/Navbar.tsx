import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Star, ShoppingBag, DollarSign, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: isHomePage ? '#features' : '/features', label: 'Features', icon: Star, isScroll: isHomePage },
    { to: '/store-examples', label: 'Store Examples', icon: ShoppingBag },
    { to: '/pricing', label: 'Pricing', icon: DollarSign },
  ];

  return (
    <>
      <nav className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img src="/logo.png" alt="Rady.ng Logo" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-gray-900">rady.ng</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                link.isScroll ? (
                  <a
                    key={link.label}
                    href={link.to}
                    onClick={scrollToFeatures}
                    className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer font-medium"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/auth/signin">
                <Button variant="ghost" className="font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/pricing#business">
                <Button variant="primary" className="font-medium">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-16 left-0 right-0 bg-white shadow-lg z-40 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Mobile Navigation Links */}
          <div className="space-y-1 py-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return link.isScroll ? (
                <a
                  key={link.label}
                  href={link.to}
                  onClick={scrollToFeatures}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="pt-4 pb-2 space-y-3 border-t border-gray-200">
            <Link to="/auth/signin" className="block">
              <Button
                variant="ghost"
                className="w-full justify-start font-medium"
              >
                <LogIn className="h-5 w-5 mr-3" />
                Sign In
              </Button>
            </Link>
            <Link to="/pricing#business" className="block">
              <Button
                variant="primary"
                className="w-full justify-start font-medium"
              >
                <UserPlus className="h-5 w-5 mr-3" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};