import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Building2,
  CreditCard,
  Store,
  LogOut
} from 'lucide-react';
import { AuthService } from '../../services/auth';
import toast from 'react-hot-toast';

interface SidebarProps {
  type?: 'business' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ type = 'business' }) => {
  const location = useLocation();
  
  const businessMenuItems = [
    { path: '/dashboard/products', icon: Package, label: 'Products' },
    { path: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/dashboard/customers', icon: Users, label: 'Customers' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/dashboard/settings', icon: Settings, label: 'Store Settings' },
  ];

  const adminMenuItems = [
    { path: '/admin/businesses', icon: Building2, label: 'Businesses' },
    { path: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const menuItems = type === 'admin' ? adminMenuItems : businessMenuItems;

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      toast.success('Signed out successfully');
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center space-x-2">
          <Store className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">trady.ng</span>
        </Link>
      </div>
      
      <nav className="mt-6 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Store Actions Section */}
      {type === 'business' && (
        <div className="border-t border-gray-200 mt-auto">
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Store Actions
            </h3>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Sign out of your account. You'll need to sign in again to access your dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};