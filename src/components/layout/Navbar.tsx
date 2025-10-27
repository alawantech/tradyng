import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Rady.ng Logo" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-gray-900">rady.ng</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:theme-primary-text transition-colors">
              Home
            </Link>
            {isHomePage ? (
              <a 
                href="#features" 
                onClick={scrollToFeatures}
                className="text-gray-700 hover:theme-primary-text transition-colors cursor-pointer"
              >
                Features
              </a>
            ) : (
              <Link to="/features" className="text-gray-700 hover:theme-primary-text transition-colors">
                Features
              </Link>
            )}
            <Link to="/store-examples" className="text-gray-700 hover:theme-primary-text transition-colors">
              Store Examples
            </Link>
            <Link to="/pricing" className="text-gray-700 hover:theme-primary-text transition-colors">
              Pricing
            </Link>
          </div>
          
          {isHomePage && (
            <div className="flex items-center space-x-4">
              <Link to="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          )}
          
          {!isHomePage && (
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};