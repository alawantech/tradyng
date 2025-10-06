import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ShoppingCart, User, Search, ChevronDown, UserCircle, Package, LogOut, Menu, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SubdomainService, SubdomainInfo } from '../../services/subdomain';
import { BusinessService, Business } from '../../services/business';
import { CategoryService, Category } from '../../services/category';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { CustomerAuthModal } from '../../components/modals/CustomerAuthModal';
import StoreNotFound from '../../components/sections/StoreNotFound';
import toast from 'react-hot-toast';


// Context for store data and search term
interface StoreContextType {
  business: Business | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: Category[];
}

const StoreContext = createContext<StoreContextType>({
  business: null,
  isLoading: true,
  error: null,
  searchTerm: '',
  setSearchTerm: () => {},
  selectedCategory: '',
  setSelectedCategory: () => {},
  categories: [],
});

export const useStore = () => useContext(StoreContext);

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useCart();
  const { user, signOut } = useCustomerAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [storeData, setStoreData] = useState<Omit<StoreContextType, 'searchTerm' | 'setSearchTerm' | 'selectedCategory' | 'setSelectedCategory' | 'categories'>>({
    business: null,
    isLoading: true,
    error: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);

  // Close dropdown/mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showUserDropdown || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown, showMobileMenu]);

  // Close mobile menu on screen resize to larger than 781px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 782) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const detectedSubdomain = await SubdomainService.detectSubdomain();
        setSubdomainInfo(detectedSubdomain);
        
        if (detectedSubdomain.businessId) {
          const business = await BusinessService.getBusinessById(detectedSubdomain.businessId);
          if (business) {
            setStoreData({
              business,
              isLoading: false,
              error: null
            });
            
            // Load categories for this business
            try {
              const businessCategories = await CategoryService.getCategoriesByBusinessId(detectedSubdomain.businessId);
              // If no categories exist, initialize with defaults
              if (businessCategories.length === 0) {
                await CategoryService.initializeDefaultCategories(detectedSubdomain.businessId);
                const updatedCategories = await CategoryService.getCategoriesByBusinessId(detectedSubdomain.businessId);
                setCategories(updatedCategories);
              } else {
                setCategories(businessCategories);
              }
            } catch (error) {
              console.error('Error loading categories:', error);
              setCategories([]);
            }
          } else {
            setStoreData({
              business: null,
              isLoading: false,
              error: 'Store not found'
            });
          }
        } else if (detectedSubdomain.isSubdomain && detectedSubdomain.storeName) {
          // Subdomain detected but no business found
          setStoreData({
            business: null,
            isLoading: false,
            error: 'Store not found'
          });
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.3)_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (storeData.error || !storeData.business) {
    // If it's a subdomain that was detected but no business found, show the custom component
    if (subdomainInfo?.isSubdomain && subdomainInfo.storeName) {
      return <StoreNotFound storeName={subdomainInfo.storeName} />;
    }
    
    // Default error handling for other cases
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.3)_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
        <div className="text-center relative z-10">
          <Store className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">{storeData.error || 'This store does not exist or is not available.'}</p>
          <p className="text-sm text-gray-500 mt-4">Try visiting: http://localhost:5174?store=demo</p>
        </div>
      </div>
    );
  }

  const { business } = storeData;
  const storeName = business.name;
  const primaryColor = business.settings?.primaryColor || '#2563eb';

  return (
    <StoreContext.Provider value={{
      ...storeData,
      searchTerm,
      setSearchTerm,
      selectedCategory,
      setSelectedCategory,
      categories
    }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top row: Hamburger + Logo + Cart + User (always on one line) */}
            <div className="flex items-center justify-between h-16">
              {/* Left side: Hamburger + Logo */}
              <div className="flex items-center space-x-3">
                {/* Hamburger Menu Button - shown on 781px and below, positioned left of logo */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="min-[782px]:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  aria-label="Toggle menu"
                >
                  {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                
                <Link to="/" className="flex items-center space-x-2">
                  {business.logo ? (
                    <img src={business.logo} alt={storeName} className="h-8 w-8 object-contain" />
                  ) : (
                    <>
                      <Store className="h-8 w-8" style={{ color: primaryColor }} />
                      <span className="text-xl font-bold text-gray-900">{storeName}</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Center: Search bar - hidden on mobile, shown on desktop */}
              <div className="hidden min-[782px]:block flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 text-sm"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                      borderColor: `${primaryColor}20`
                    } as React.CSSProperties}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Right side: Cart + User */}
              <div className="flex items-center space-x-2 md:space-x-4">
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
                  <div className="relative hidden min-[782px]:block" ref={userDropdownRef}>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">
                        {user.displayName || user.email?.split('@')[0] || 'Account'}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                    
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user.displayName || 'Customer'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                          
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <UserCircle className="h-4 w-4 mr-3" />
                            My Profile
                          </Link>
                          
                          <Link
                            to="/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <Package className="h-4 w-4 mr-3" />
                            Order History
                          </Link>
                          
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={async () => {
                                setShowUserDropdown(false);
                                try {
                                  await signOut();
                                  toast.success('Signed out successfully');
                                  // Redirect to store homepage where user can see products
                                  navigate('/');
                                } catch (error) {
                                  console.error('Error signing out:', error);
                                  toast.error('Failed to sign out');
                                }
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAuthModalMode('signup');
                        setShowAuthModal(true);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Search Bar - shown on 781px and below */}
            <div className="min-[782px]:hidden border-t border-gray-200 py-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 text-sm"
                  style={{ 
                    '--tw-ring-color': primaryColor,
                    borderColor: `${primaryColor}20`
                  } as React.CSSProperties}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Navigation - hidden on mobile */}
          <div className="border-t hidden min-[782px]:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-6 py-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === '' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-2' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.name 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-2' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Mobile Menu - shown on 781px and below */}
        {showMobileMenu && (
          <div ref={mobileMenuRef} className="min-[782px]:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Categories Section */}
              <div className="py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedCategory === '' 
                        ? 'bg-blue-100 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setShowMobileMenu(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedCategory === category.name 
                          ? 'bg-blue-100 text-blue-600 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Section - only show if user is logged in */}
              {user && (
                <div className="py-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Account</h3>
                  <div className="space-y-2">
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {user.displayName || 'Customer'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    
                    <Link
                      to="/orders"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Package className="h-4 w-4 mr-3" />
                      Order History
                    </Link>
                    
                    <button
                      onClick={async () => {
                        setShowMobileMenu(false);
                        try {
                          await signOut();
                          toast.success('Signed out successfully');
                          navigate('/');
                        } catch (error) {
                          console.error('Error signing out:', error);
                          toast.error('Failed to sign out');
                        }
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Login/Register - only show if user is not logged in */}
              {!user && (
                <div className="py-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Account</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setAuthModalMode('signin');
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Sign In
                    </button>
                    
                    <button
                      onClick={() => {
                        setAuthModalMode('signup');
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Register
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <main className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen relative">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.3)_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
          <div className="relative z-10">
            <Outlet />
          </div>
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
                
                {/* Location Information */}
                <div className="space-y-2">
                  {business.address && (
                    <p className="text-gray-400 text-sm flex items-start">
                      <span className="font-medium text-gray-300 mr-2">📍</span>
                      <span>{business.address}</span>
                    </p>
                  )}
                  {(business.state || business.country) && (
                    <p className="text-gray-400 text-sm flex items-start">
                      <span className="font-medium text-gray-300 mr-2">🌍</span>
                      <span>
                        {business.state && business.country 
                          ? `${business.state}, ${business.country}`
                          : business.state || business.country
                        }
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/" className="hover:text-white">Home</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                <ul className="space-y-3 text-gray-400">
                  {business.email && (
                    <li>
                      <span className="font-medium text-gray-300 block text-xs mb-1">EMAIL</span>
                      <a href={`mailto:${business.email}`} className="hover:text-white text-sm break-all">
                        {business.email}
                      </a>
                    </li>
                  )}
                  {business.phone && (
                    <li>
                      <span className="font-medium text-gray-300 block text-xs mb-1">WHATSAPP</span>
                      <a href={`https://wa.me/${business.phone.replace(/\D/g, '')}`} className="hover:text-white text-sm">
                        {business.phone}
                      </a>
                    </li>
                  )}
                  {(business.country || business.state) && (
                    <li>
                      <span className="font-medium text-gray-300 block text-xs mb-1">LOCATION</span>
                      <span className="text-sm">
                        {business.state && business.country 
                          ? `${business.state}, ${business.country}`
                          : business.state || business.country
                        }
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
              {(business.state || business.country) && (
                <p className="text-sm mt-1">
                  Proudly serving customers from {business.state && business.country 
                    ? `${business.state}, ${business.country}` 
                    : business.state || business.country
                  }
                </p>
              )}
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