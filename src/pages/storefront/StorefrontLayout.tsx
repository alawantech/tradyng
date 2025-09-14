import React, { useEffect, useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Store, ShoppingCart, User, Search, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SubdomainService } from '../../services/subdomain';
import { BusinessService, Business } from '../../services/business';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { CustomerAuthModal } from '../../components/modals/CustomerAuthModal';

// Context for store data
interface StoreContextType {
  business: Business | null;
  isLoading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType>({
  business: null,
  isLoading: true,
  error: null
});

export const useStore = () => useContext(StoreContext);

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useCart();
  const { user, signOut } = useCustomerAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [storeData, setStoreData] = useState<StoreContextType>({
    business: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const subdomainInfo = await SubdomainService.detectSubdomain();
        
        if (subdomainInfo.businessId) {
          const business = await BusinessService.getBusinessById(subdomainInfo.businessId);
          if (business) {
            setStoreData({
              business,
              isLoading: false,
              error: null
            });
          } else {
            setStoreData({
              business: null,
              isLoading: false,
              error: 'Store not found'
            });
          }
        } else {
          setStoreData({
            business: null,
            isLoading: false,
            error: 'Invalid store URL'
          });
        }
      } catch (error) {
        console.error('Error loading store data:', error);
        setStoreData({
          business: null,
          isLoading: false,
          error: 'Failed to load store'
        });
      }
    };

    loadStoreData();
  }, []);

  if (storeData.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (storeData.error || !storeData.business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">{storeData.error || 'This store does not exist or is not available.'}</p>
        </div>
      </div>
    );
  }

  const { business } = storeData;
  const storeName = business.name;
  const primaryColor = business.settings?.primaryColor || '#2563eb';

  return (
    <StoreContext.Provider value={storeData}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                {business.logo ? (
                  <img src={business.logo} alt={storeName} className="h-8 w-8 object-contain" />
                ) : (
                  <Store className="h-8 w-8" style={{ color: primaryColor }} />
                )}
                <span className="text-xl font-bold text-gray-900">{storeName}</span>
              </Link>
              
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                      borderColor: `${primaryColor}20`
                    } as React.CSSProperties}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link to="/cart">
                  <Button variant="ghost" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span 
                      className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {itemCount}
                    </span>
                  </Button>
                </Link>
                {user ? (
                  <div className="relative">
                    <Button variant="outline" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {user.displayName || user.email}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                    {/* TODO: Add dropdown menu for account options */}
                    <button
                      onClick={() => signOut()}
                      className="absolute top-full right-0 mt-1 px-4 py-2 bg-white border rounded-lg shadow-lg text-sm hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAuthModalMode('signin');
                        setShowAuthModal(true);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAuthModalMode('signup');
                        setShowAuthModal(true);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8 py-4">
                <Link to="/" className="text-gray-700 font-medium" style={{ 
                  color: window.location.pathname === '/' ? primaryColor : undefined 
                }}>
                  Home
                </Link>
                <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium">
                  All Products
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
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
                  {business.logo ? (
                    <img src={business.logo} alt={storeName} className="h-8 w-8 object-contain" />
                  ) : (
                    <Store className="h-8 w-8" style={{ color: primaryColor }} />
                  )}
                  <span className="text-xl font-bold">{storeName}</span>
                </div>
                <p className="text-gray-400 mb-6">
                  {business.description || `Welcome to ${storeName}. We deliver quality products to your doorstep.`}
                </p>
                {business.address && (
                  <p className="text-gray-400 text-sm">{business.address}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/" className="hover:text-white">Home</Link></li>
                  <li><Link to="/products" className="hover:text-white">Products</Link></li>
                  <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <ul className="space-y-2 text-gray-400">
                  {business.email && (
                    <li><a href={`mailto:${business.email}`} className="hover:text-white">{business.email}</a></li>
                  )}
                  {business.phone && (
                    <li><a href={`tel:${business.phone}`} className="hover:text-white">{business.phone}</a></li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
            </div>
          </div>
        </footer>
        
        {/* Customer Authentication Modal */}
        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      </div>
    </StoreContext.Provider>
  );
};