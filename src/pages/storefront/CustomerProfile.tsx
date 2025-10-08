import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  Package, 
  LogOut,
  X,
  ExternalLink,
  Menu,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useStore } from './StorefrontLayout';
import { CustomerService, CustomerProfile, CustomerAddress, CustomerOrderHistory } from '../../services/customer';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { useColorScheme } from '../../hooks/useColorScheme';
import toast from 'react-hot-toast';

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
  };
}

interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  notes?: string;
}

export const CustomerProfilePage: React.FC = () => {
  const { user, signOut } = useCustomerAuth();
  const { business } = useStore();
  const navigate = useNavigate();
  
  // Get color scheme based on business background color
  const colorScheme = useColorScheme(business?.branding?.storeBackgroundColor);
  
  // State management
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [orderHistory, setOrderHistory] = useState<CustomerOrderHistory[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    displayName: '',
    firstName: '',
    lastName: '',
    phone: '',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      promotionalEmails: true,
    }
  });

  // Address form modal
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string>('');
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    label: 'Home',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    isDefault: false,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadCustomerData();
    }
  }, [user]);

  const loadCustomerData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load customer profile
      let profile = null;
      try {
        profile = await CustomerService.getProfile(user.uid);
        
        if (!profile) {
          // Create profile if it doesn't exist
          const displayName = user.displayName || user.email?.split('@')[0] || 'Customer';
          console.log('Creating profile with displayName:', displayName, 'from user.displayName:', user.displayName);
          await CustomerService.createOrUpdateProfile({
            uid: user.uid,
            email: user.email!,
            displayName
          });
          profile = await CustomerService.getProfile(user.uid);
        }
        
        if (profile) {
          console.log('Loaded profile:', profile);
          setCustomerProfile(profile);
          
          // Check if displayName looks like an email prefix and provide better fallback
          let displayName = profile.displayName;
          const emailPrefix = user.email?.split('@')[0];
          
          // If displayName is just the email prefix and user has a Firebase displayName, use that instead
          if (displayName === emailPrefix && user.displayName && user.displayName !== emailPrefix) {
            displayName = user.displayName;
          }
          
          setProfileForm({
            displayName: displayName || user.displayName || emailPrefix || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone || '',
            preferences: profile.preferences || {
              emailNotifications: true,
              smsNotifications: true,
              promotionalEmails: true,
            }
          });
        } else {
          // If no profile exists and creation failed, use user data as fallback
          const fallbackDisplayName = user.displayName || user.email?.split('@')[0] || '';
          setProfileForm({
            displayName: fallbackDisplayName,
            firstName: '',
            lastName: '',
            phone: '',
            preferences: {
              emailNotifications: true,
              smsNotifications: true,
              promotionalEmails: true,
            }
          });
        }
      } catch (error) {
        console.error('Error loading customer profile:', error);
        // Continue loading other data even if profile fails
      }
      
      // Load addresses
      try {
        const addresses = await CustomerService.getAddresses(user.uid);
        setCustomerAddresses(addresses);
      } catch (error) {
        console.error('Error loading customer addresses:', error);
        // Set empty array as fallback
        setCustomerAddresses([]);
      }
      
      // Load order history for this business
      if (business?.id) {
        try {
          const orders = await CustomerService.getOrderHistory(user.uid, business.id);
          setOrderHistory(orders);
        } catch (error) {
          console.error('Error loading order history:', error);
          // Set empty array as fallback
          setOrderHistory([]);
        }
      }
      
    } catch (error) {
      console.error('Error in loadCustomerData:', error);
      toast.error('Some profile information could not be loaded');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1] as keyof typeof profileForm.preferences;
      setProfileForm(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setProfileForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !customerProfile) return;

    setIsSaving(true);
    try {
      const updates: Partial<CustomerProfile> = {
        displayName: profileForm.displayName,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        preferences: profileForm.preferences
      };

      await CustomerService.updateProfile(user.uid, updates);
      await loadCustomerData(); // Reload to get updated data
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddAddress = () => {
    setEditingAddressId('');
    setAddressForm({
      label: 'Home',
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      isDefault: customerAddresses.length === 0,
      notes: ''
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddressId(address.id!);
    setAddressForm({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      isDefault: address.isDefault,
      notes: address.notes || ''
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    try {
      if (editingAddressId) {
        await CustomerService.updateAddress(editingAddressId, {
          ...addressForm,
          customerId: user.uid
        });
        toast.success('Address updated successfully!');
      } else {
        await CustomerService.addAddress({
          ...addressForm,
          customerId: user.uid,
          country: 'Nigeria' // Default country
        });
        toast.success('Address added successfully!');
      }
      
      await loadCustomerData();
      setShowAddressForm(false);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await CustomerService.deleteAddress(addressId, user.uid);
      toast.success('Address deleted successfully!');
      await loadCustomerData();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;

    try {
      await CustomerService.setDefaultAddress(user.uid, addressId);
      toast.success('Default address updated!');
      await loadCustomerData();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      // Redirect to store homepage where user can see products
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to access your profile.</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="md:col-span-2 h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:space-y-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back!</h1>
                <p className="text-blue-100 text-sm lg:text-lg">
                  Manage your account, track orders, and update your preferences
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-blue-100">Account Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
            
            {/* Mobile Sign Out */}
            <div className="lg:hidden mt-6">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <Menu className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {activeTab === 'profile' && 'Profile'}
                  {activeTab === 'addresses' && 'Addresses'}
                  {activeTab === 'orders' && 'Recent Orders'}
                </span>
              </div>
              <ChevronRight className={`h-5 w-5 text-gray-400 transform transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-2">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Profile</span>
                      <p className="text-xs text-gray-500 mt-0.5">Personal information</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('addresses');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === 'addresses'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Addresses</span>
                      <p className="text-xs text-gray-500 mt-0.5">Delivery locations</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === 'orders'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Recent Orders</span>
                      <p className="text-xs text-gray-500 mt-0.5">Latest purchases</p>
                    </div>
                  </button>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <Link
                      to="/orders"
                      className="w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5" />
                        <div>
                          <span className="font-medium">Order History</span>
                          <p className="text-xs text-gray-500 mt-0.5">View all orders</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Desktop Sidebar Navigation - Hidden on Mobile */}
            <div className="hidden lg:block lg:col-span-1">
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Menu</h3>
                  <p className="text-sm text-gray-600">Manage your account settings</p>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Profile</span>
                      <p className="text-xs text-gray-500 mt-0.5">Personal information</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === 'addresses'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Addresses</span>
                      <p className="text-xs text-gray-500 mt-0.5">Delivery locations</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === 'orders'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    <div>
                      <span className="font-medium">Recent Orders</span>
                      <p className="text-xs text-gray-500 mt-0.5">Latest purchases</p>
                    </div>
                  </button>
                  
                  <div className="border-t border-gray-200 pt-3 mt-4">
                    <Link
                      to="/orders"
                      className="w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-xl text-left text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5" />
                        <div>
                          <span className="font-medium">Order History</span>
                          <p className="text-xs text-gray-500 mt-0.5">View all orders</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <div className="space-y-4 lg:space-y-6">
                  {/* Profile Header Card */}
                  <Card className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 lg:mb-8">
                      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 flex-1">
                        {/* Profile Avatar */}
                        <div className="relative mx-auto sm:mx-0">
                          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl lg:text-2xl font-bold shadow-lg">
                            {(profileForm.displayName && profileForm.displayName !== user.email?.split('@')[0]) 
                              ? profileForm.displayName.charAt(0).toUpperCase() 
                              : user.displayName 
                                ? user.displayName.charAt(0).toUpperCase()
                                : user.email 
                                  ? user.email.charAt(0).toUpperCase() 
                                  : 'U'}
                          </div>
                          <div className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 text-center sm:text-left">
                          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                            {(profileForm.displayName && profileForm.displayName !== user.email?.split('@')[0])
                              ? profileForm.displayName
                              : user.displayName || 'Welcome'}
                          </h2>
                          <p className="text-gray-600 mb-3 break-all">{user.email}</p>
                          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                              Active Account
                            </span>
                            <span className="text-gray-500">
                              Member since {new Date().getFullYear()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Edit Button */}
                      <div className="mt-6 lg:mt-0 w-full sm:w-auto">
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="bg-white hover:bg-gray-50 border-gray-300 w-full sm:w-auto"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <Button
                              onClick={handleSaveProfile}
                              disabled={isSaving}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                // Reset form
                                if (customerProfile) {
                                  setProfileForm({
                                    displayName: customerProfile.displayName,
                                    firstName: customerProfile.firstName || '',
                                    lastName: customerProfile.lastName || '',
                                    phone: customerProfile.phone || '',
                                    preferences: customerProfile.preferences
                                  });
                                }
                              }}
                              className="border-gray-300"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Basic Information Card */}
                  <Card className="p-6 lg:p-8">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-3 text-blue-600" />
                        Personal Information
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage your personal details and contact information</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-4 lg:space-y-6">
                        <div>
                          <Input
                            label="Display Name"
                            name="displayName"
                            value={profileForm.displayName}
                            onChange={handleProfileFormChange}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                          <p className="text-xs text-gray-500 mt-1">This is how your name appears to others</p>
                        </div>
                        
                        <div>
                          <Input
                            label="First Name"
                            name="firstName"
                            value={profileForm.firstName}
                            onChange={handleProfileFormChange}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        
                        <div>
                          <Input
                            label="Phone Number"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileFormChange}
                            disabled={!isEditing}
                            placeholder="+234 xxx xxx xxxx"
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4 lg:space-y-6">
                        <div>
                          <Input
                            label="Email Address"
                            value={user.email || ''}
                            disabled
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">Your email cannot be changed</p>
                        </div>
                        
                        <div>
                          <Input
                            label="Last Name"
                            name="lastName"
                            value={profileForm.lastName}
                            onChange={handleProfileFormChange}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Notification Preferences Card */}
                  <Card className="p-6 lg:p-8">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
                        <Package className="h-5 w-5 mr-3 text-blue-600" />
                        Notification Preferences
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm lg:text-base">Choose how you want to receive updates about your orders</p>
                    </div>
                    
                    <div className="space-y-4 lg:space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                        <div className="space-y-4">
                          <label className="flex items-start space-x-4 cursor-pointer">
                            <div className="flex items-center h-5 mt-0.5">
                              <input
                                type="checkbox"
                                name="preferences.emailNotifications"
                                checked={profileForm.preferences.emailNotifications}
                                onChange={handleProfileFormChange}
                                disabled={!isEditing}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">Order Email Notifications</span>
                              <p className="text-xs text-gray-600 mt-1">Receive emails about order confirmations, shipping updates, and delivery status</p>
                            </div>
                          </label>
                          
                          <label className="flex items-start space-x-4 cursor-pointer">
                            <div className="flex items-center h-5 mt-0.5">
                              <input
                                type="checkbox"
                                name="preferences.smsNotifications"
                                checked={profileForm.preferences.smsNotifications}
                                onChange={handleProfileFormChange}
                                disabled={!isEditing}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">SMS Notifications</span>
                              <p className="text-xs text-gray-600 mt-1">Get text messages for important order updates and delivery notifications</p>
                            </div>
                          </label>
                          
                          <label className="flex items-start space-x-4 cursor-pointer">
                            <div className="flex items-center h-5 mt-0.5">
                              <input
                                type="checkbox"
                                name="preferences.promotionalEmails"
                                checked={profileForm.preferences.promotionalEmails}
                                onChange={handleProfileFormChange}
                                disabled={!isEditing}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">Promotional Emails</span>
                              <p className="text-xs text-gray-600 mt-1">Receive special offers, discounts, and updates about new products</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

            {activeTab === 'addresses' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                  <Button onClick={handleAddAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>

                {customerAddresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                    <p className="text-gray-600 mb-6">Add an address to make checkout faster.</p>
                    <Button onClick={handleAddAddress}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">{address.label}</span>
                              {address.isDefault && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-gray-600 text-sm">{address.street}</p>
                            <p className="text-gray-600 text-sm">
                              {address.city}, {address.state}, {address.country}
                            </p>
                            <p className="text-gray-600 text-sm">{address.phone}</p>
                            {address.notes && (
                              <p className="text-gray-500 text-xs mt-1">{address.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefaultAddress(address.id!)}
                              >
                                Set Default
                              </Button>
                            )}
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id!)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'orders' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order History {business && `from ${business.name}`}
                </h2>

                {orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">
                      {business ? `You haven't placed any orders with ${business.name} yet.` : 'You haven\'t placed any orders yet.'}
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div
                        key={order.orderId}
                        className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">Order #{order.orderId}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium text-gray-900">Date</p>
                            <p>{order.orderDate.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Items</p>
                            <p>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Total</p>
                            <p className="font-semibold">
                              {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                            </p>
                          </div>
                        </div>
                        
                        {order.businessName && (
                          <p className="text-sm text-gray-500 mt-2">
                            Store: {order.businessName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAddressForm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg transform bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:p-8 rounded-lg"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Address Label"
                    name="label"
                    value={addressForm.label}
                    onChange={handleAddressFormChange}
                    placeholder="Home, Work, etc."
                  />
                  <div className="flex items-center pt-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={addressForm.isDefault}
                        onChange={handleAddressFormChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Set as default</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={addressForm.firstName}
                    onChange={handleAddressFormChange}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={addressForm.lastName}
                    onChange={handleAddressFormChange}
                  />
                </div>
                
                <Input
                  label="Phone"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleAddressFormChange}
                />
                
                <Input
                  label="Street Address"
                  name="street"
                  value={addressForm.street}
                  onChange={handleAddressFormChange}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressFormChange}
                  />
                  <Input
                    label="State"
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressFormChange}
                  />
                  <Input
                    label="Country"
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressFormChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={addressForm.notes || ''}
                    onChange={handleAddressFormChange}
                    placeholder="Delivery instructions, landmarks, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-4 mt-6">
                  <Button
                    type="button"
                    onClick={handleSaveAddress}
                    className="flex-1"
                  >
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default CustomerProfilePage;