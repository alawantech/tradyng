import React from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Store, ShoppingCart, User, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/store" className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Tech Gadgets Plus</span>
            </Link>
            
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/store/cart">
                <Button variant="ghost" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </Link>
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 py-4">
              <Link to="/store" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link to="/store/products" className="text-gray-700 hover:text-blue-600 font-medium">
                All Products
              </Link>
              <Link to="/store/categories/electronics" className="text-gray-700 hover:text-blue-600 font-medium">
                Electronics
              </Link>
              <Link to="/store/categories/wearables" className="text-gray-700 hover:text-blue-600 font-medium">
                Wearables
              </Link>
              <Link to="/store/contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Store className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Tech Gadgets Plus</span>
              </div>
              <p className="text-gray-400 mb-6">
                Your trusted partner for premium technology products. 
                We deliver quality and innovation to your doorstep.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/store" className="hover:text-white">Home</Link></li>
                <li><Link to="/store/products" className="hover:text-white">Products</Link></li>
                <li><Link to="/store/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/store/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white">Returns</a></li>
                <li><a href="#" className="hover:text-white">Track Order</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Tech Gadgets Plus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};