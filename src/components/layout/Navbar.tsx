import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, User, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">trady.ng</span>
          </Link>
          
          {isHomePage && (
            <>
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Home
                </Link>
                <Link to="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Features
                </Link>
                <Link to="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link to="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth/signup">
                  <Button variant="primary">Get Started</Button>
                </Link>
              </div>
            </>
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