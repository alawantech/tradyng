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
  LogOut,
  MessageSquare,
  X
} from 'lucide-react';
import { AuthService } from '../../services/auth';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

interface SidebarProps {
  type?: 'business' | 'admin';
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ type = 'business', open = false, onClose }) => {
  const location = useLocation();
  
  const businessMenuItems = [
    { path: '/dashboard/products', icon: Package, label: 'Products' },
    { path: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/dashboard/customers', icon: Users, label: 'Customers' },
    { path: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
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

  // Responsive sidebar logic
  // Show sidebar as overlay on small screens if open, else hide
  return (
    <>
      {/* Overlay for mobile/tablet */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-lg flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:h-screen lg:block`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Trady.ng Logo" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-gray-900">trady.ng</span>
          </Link>
          {/* Close button for mobile/tablet */}
          <button
            className="lg:hidden ml-2 p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
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
                    ? 'theme-primary-text theme-primary-bg-light border-r-2 theme-primary-border'
                    : 'text-gray-700 hover:theme-primary-text hover:bg-gray-50'
                }`}
                onClick={onClose}
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
              <h3 className="text-xs font-semibold theme-secondary-text uppercase tracking-wide mb-3">
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
    </>
  );
};