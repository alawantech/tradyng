import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  Package, 
  Heart,
  Settings,
  LogOut,
  Check,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useStore } from './StorefrontLayout';
import { CustomerService, CustomerProfile, CustomerAddress, CustomerOrderHistory } from '../../services/customer';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import toast from 'react-hot-toast';

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
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
  zipCode?: string;
  isDefault: boolean;
  notes?: string;
}

export const CustomerProfilePage: React.FC = () => {
  const { user, signOut } = useCustomerAuth();
  const { business } = useStore();
  
  // State management
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [orderHistory, setOrderHistory] = useState<CustomerOrderHistory[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
    zipCode: '',
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
      let profile = await CustomerService.getProfile(user.uid);
      
      if (!profile) {
        // Create profile if it doesn't exist
        await CustomerService.createOrUpdateProfile({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || ''
        });
        profile = await CustomerService.getProfile(user.uid);
      }
      
      if (profile) {
        setCustomerProfile(profile);
        setProfileForm({
          displayName: profile.displayName,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
          gender: profile.gender,
          preferences: profile.preferences
        });
      }
      
      // Load addresses
      const addresses = await CustomerService.getAddresses(user.uid);
      setCustomerAddresses(addresses);
      
      // Load order history for this business
      if (business?.id) {
        const orders = await CustomerService.getOrderHistory(user.uid, business.id);
        setOrderHistory(orders);
      }
      
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load your profile information');
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
        dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth) : undefined,
        gender: profileForm.gender,
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
      zipCode: '',
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
      zipCode: address.zipCode || '',
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
          customerId: user.uid
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your profile.</p>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'addresses'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  <span>Addresses</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'orders'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span>Orders</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
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
                              dateOfBirth: customerProfile.dateOfBirth ? customerProfile.dateOfBirth.toISOString().split('T')[0] : '',
                              gender: customerProfile.gender,
                              preferences: customerProfile.preferences
                            });
                          }
                        }}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Display Name"
                        name="displayName"
                        value={profileForm.displayName}
                        onChange={handleProfileFormChange}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Email"
                        value={user.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <Input
                        label="First Name"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileFormChange}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Last Name"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileFormChange}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileFormChange}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={profileForm.dateOfBirth || ''}
                        onChange={handleProfileFormChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={profileForm.gender || ''}
                      onChange={handleProfileFormChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Preferences */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="preferences.emailNotifications"
                          checked={profileForm.preferences.emailNotifications}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Email notifications for orders</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="preferences.smsNotifications"
                          checked={profileForm.preferences.smsNotifications}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">SMS notifications</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="preferences.promotionalEmails"
                          checked={profileForm.preferences.promotionalEmails}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Promotional emails and offers</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
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
                              {address.city}, {address.state} {address.zipCode}
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
                    label="ZIP Code"
                    name="zipCode"
                    value={addressForm.zipCode || ''}
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
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};