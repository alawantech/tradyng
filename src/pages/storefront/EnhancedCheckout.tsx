import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield, 
  User, 
  AlertCircle, 
  Plus,
  Edit3,
  Trash2,
  Check
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCart } from '../../contexts/CartContext';
import { useStore } from './StorefrontLayout';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerAuthModal } from '../../components/modals/CustomerAuthModal';
import { useColorScheme } from '../../hooks/useColorScheme';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService } from '../../services/order';
import { CustomerService, CustomerAddress, CustomerProfile } from '../../services/customer';
import toast from 'react-hot-toast';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  paymentMethod: 'manual' | 'card';
  notes?: string;
  createAccount?: boolean;
  password?: string;
  confirmPassword?: string;
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
}

export const EnhancedCheckout: React.FC = () => {
  const { items, total, itemCount, clearCart } = useCart();
  const { business } = useStore();
  const { user, signUp } = useCustomerAuth();
  const navigate = useNavigate();
  
  // Get color scheme based on business background color
  const colorScheme = useColorScheme(business?.branding?.storeBackgroundColor);
  
  // State management
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    paymentMethod: 'manual',
    notes: '',
    createAccount: false
  });

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Address form for adding/editing addresses
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    label: 'Home',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    isDefault: false
  });

  // Load customer profile and addresses when user changes
  useEffect(() => {
    if (user) {
      loadCustomerData();
    } else {
      setCustomerProfile(null);
      setCustomerAddresses([]);
      setSelectedAddressId('');
    }
  }, [user]);

  const loadCustomerData = async () => {
    if (!user) return;
    
    try {
      // Load or create customer profile
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
      
      setCustomerProfile(profile);
      
      // Load addresses
      const addresses = await CustomerService.getAddresses(user.uid);
      setCustomerAddresses(addresses);
      
      // Pre-fill form with profile data
      if (profile) {
        setFormData(prev => ({
          ...prev,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email,
          phone: profile.phone || ''
        }));
        
        // Select default address if available
        const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id!);
          fillFormWithAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load your profile information');
    }
  };

  const fillFormWithAddress = (address: CustomerAddress) => {
    setFormData(prev => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      address: address.street,
      city: address.city,
      state: address.state,
      country: address.country
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      // Clear form for new address entry
      setFormData(prev => ({
        ...prev,
        address: '',
        city: '',
        state: '',
        country: 'Nigeria'
      }));
    } else {
      const address = customerAddresses.find(addr => addr.id === addressId);
      if (address) {
        fillFormWithAddress(address);
      }
    }
  };

  const handleAddAddress = () => {
    setEditingAddressId('');
    setAddressForm({
      label: 'Home',
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      isDefault: customerAddresses.length === 0
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
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    try {
      if (editingAddressId) {
        // Update existing address
        await CustomerService.updateAddress(editingAddressId, {
          ...addressForm,
          customerId: user.uid
        });
        toast.success('Address updated successfully!');
      } else {
        // Add new address
        await CustomerService.addAddress({
          ...addressForm,
          customerId: user.uid
        });
        toast.success('Address added successfully!');
      }
      
      // Reload addresses
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

  const handleCreateAccountDuringCheckout = async (): Promise<boolean> => {
    if (!formData.createAccount || !formData.password) return true;

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    try {
      // Create Firebase Auth account
      await signUp(formData.email, formData.password, `${formData.firstName} ${formData.lastName}`, () => {
        // Success callback - redirect to homepage after a short delay
        toast.success('Account created successfully! Welcome to the store!');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      });
      
      // The useEffect will automatically load the profile after auth state changes
      return true;
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || 'Failed to create account');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!business?.id) {
      toast.error('Business information not found');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let currentUser = user;
      
      // Handle account creation during checkout
      if (!user && formData.createAccount) {
        const accountCreated = await handleCreateAccountDuringCheckout();
        if (!accountCreated) {
          setIsSubmitting(false);
          return;
        }
        // Wait for auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentUser = user; // This should be updated after signup
      }
      
      if (!user && !formData.createAccount) {
        setShowAuthModal(true);
        setIsSubmitting(false);
        return;
      }

      // Create order using OrderService
      const orderData = {
        customerId: currentUser?.uid || 'guest',
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country
        },
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: total,
        tax: 0,
        shipping: 0,
        total: total,
        status: 'pending' as const,
        paymentMethod: (formData.paymentMethod === 'card' ? 'automatic' : 'manual') as 'manual' | 'automatic',
        paymentStatus: 'pending' as const,
        notes: formData.notes
      };

      // Create order in database
      const orderId = await OrderService.createOrder(business.id, orderData);
      
      // Save address if user is logged in and it's a new address
      if (currentUser && (selectedAddressId === 'new' || !selectedAddressId)) {
        try {
          await CustomerService.addAddress({
            customerId: currentUser.uid,
            label: 'Checkout Address',
            isDefault: customerAddresses.length === 0,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            street: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country
          });
        } catch (error) {
          console.error('Error saving address:', error);
        }
      }

      // Send email notifications (commented out until methods are available)
      // if (business) {
      //   try {
      //     const storeBranding = {
      //       storeName: business.name,
      //       storeUrl: `https://${business.subdomain}.rady.ng`,
      //       logoUrl: business.logo,
      //       primaryColor: business.settings?.primaryColor || '#3B82F6',
      //       supportEmail: business.email,
      //       phone: business.phone,
      //       customFromName: `${business.name} Team`
      //     };

      //     // TODO: Send order confirmation to customer
      //     // TODO: Send notification to store owner
      //   } catch (emailError) {
      //     console.error('Error sending emails:', emailError);
      //     // Don't fail the order if email fails
      //   }
      // }
      
      // Clear cart and redirect to payment
      clearCart();
      toast.success(`Order ${orderId} created successfully!`);
      
      if (formData.paymentMethod === 'manual') {
        navigate('/payment', { state: { orderId, businessId: business.id } });
      } else {
        toast.success('Card payment integration coming soon!');
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className={`text-2xl font-bold ${colorScheme.text.primary}`}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className={`text-3xl font-bold ${colorScheme.text.primary} mb-4`}>Your cart is empty</h1>
          <p className={`${colorScheme.text.secondary} mb-8`}>Add some products to proceed with checkout.</p>
          <Link to="/products">
            <Button size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Checkout</h1>
              <p className="text-black mt-1">{itemCount} items • {formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
            </div>
            <Link to="/cart">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Authentication Status */}
            {!user ? (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${colorScheme.text.info} mb-2`}>
                      Sign in or continue as guest
                    </h3>
                    <p className={`${colorScheme.text.info} mb-4`}>
                      You can place an order as a guest, or login for faster checkout and order tracking.
                    </p>
                    <div className="flex space-x-4 mb-4">
                      <Button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('signin');
                          setShowAuthModal(true);
                        }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAuthModalMode('signup');
                          setShowAuthModal(true);
                        }}
                        size="sm"
                        className={`border-blue-300 ${colorScheme.text.info} hover:bg-blue-100`}
                      >
                        Register
                      </Button>
                    </div>
                    
                    {/* Guest checkout option */}
                    <div className="border-t pt-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="createAccount"
                          checked={formData.createAccount}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${colorScheme.text.primary}`}>
                          Create an account during checkout (optional)
                        </span>
                      </label>
                      
                      {formData.createAccount && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password || ''}
                            onChange={handleInputChange}
                            placeholder="Enter password"
                            required={formData.createAccount}
                            labelClassName={colorScheme.text.primary}
                            borderClassName={colorScheme.border.default}
                          />
                          <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword || ''}
                            onChange={handleInputChange}
                            placeholder="Confirm password"
                            required={formData.createAccount}
                            labelClassName={colorScheme.text.primary}
                            borderClassName={colorScheme.border.default}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="flex items-start space-x-3">
                  <Check className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${colorScheme.text.success} mb-2`}>
                      Signed in as {customerProfile?.displayName || user.email}
                    </h3>
                    <p className={`${colorScheme.text.success}`}>
                      Your information will be saved and you can track your orders.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Customer Information */}
            <Card className="p-6 bg-white border border-gray-200">
              <h2 className="text-xl font-bold text-black mb-6">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Kemi"
                  labelClassName="text-black"
                  borderClassName="border-gray-300"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Adeyemi"
                  labelClassName="text-black"
                  borderClassName="border-gray-300"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="kemi@gmail.com"
                  labelClassName="text-black"
                  borderClassName="border-gray-300"
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+234 901 234 5678"
                  labelClassName="text-black"
                  borderClassName="border-gray-300"
                />
              </div>
            </Card>

            {/* Saved Addresses (for logged in users) */}
            {user && customerAddresses.length > 0 && (
              <Card className="p-6 bg-white border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-black">Choose Delivery Address</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAddress}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Create New Address Option */}
                  <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedAddressId === 'new'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="deliveryAddress"
                        value="new"
                        checked={selectedAddressId === 'new'}
                        onChange={() => handleAddressSelect('new')}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <Plus className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-black">Use New Address</span>
                        <p className="text-sm text-gray-600 mt-1">Enter a different delivery address below</p>
                      </div>
                    </div>
                  </label>
                  
                  {/* Saved Addresses */}
                  {customerAddresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedAddressId === address.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="radio"
                            name="deliveryAddress"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => handleAddressSelect(address.id!)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-black">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700 font-medium">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{address.street}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state}, {address.country}
                            </p>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                          </div>
                        </div>
                        </div>
                        <div className="flex items-start space-x-1 ml-3 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Address"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteAddress(address.id!);
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {/* Shipping Address - Show when no saved addresses OR "Use New Address" is selected */}
            {(!user || customerAddresses.length === 0 || selectedAddressId === 'new') && (
              <Card className="p-6 bg-white border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-black">
                      {selectedAddressId === 'new' ? 'Enter New Delivery Address' : 'Delivery Address'}
                    </h2>
                    {selectedAddressId === 'new' && (
                      <p className="text-sm text-gray-600 mt-1">
                        This address will be saved to your account for future orders
                      </p>
                    )}
                  </div>
                  {user && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAddress}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Save Address
                    </Button>
                  )}
                </div>
              
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="No. 23 Opebi Road, Ikeja"
                  labelClassName="text-black"
                  borderClassName="border-gray-300"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Country"
                    name="country"
                    required
                    value={formData.country || 'Nigeria'}
                    onChange={handleInputChange}
                    placeholder="Nigeria"
                    labelClassName="text-black"
                    borderClassName="border-gray-300"
                  />
                  <Input
                    label="State"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                    labelClassName="text-black"
                    borderClassName="border-gray-300"
                  />
                  <Input
                    label="City"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                    labelClassName="text-black"
                    borderClassName="border-gray-300"
                  />
                </div>
              </div>
            </Card>
            )}

            {/* Payment Method */}
            <Card className={`p-6 bg-white border border-gray-200`}>
              <h2 className="text-xl font-bold text-black mb-6">Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:border-gray-400 ${formData.paymentMethod === 'manual' ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={formData.paymentMethod === 'manual'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-black">Manual Payment</p>
                      <p className="text-sm text-gray-700">Pay via bank transfer</p>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-not-allowed opacity-50 bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-black">Credit/Debit Card</p>
                      <p className="text-sm text-gray-700">Coming soon...</p>
                    </div>
                  </div>
                </label>
              </div>
            </Card>

            {/* Order Notes */}
            <Card className={`p-6 ${colorScheme.background.card}`}>
              <h2 className={`text-xl font-bold ${colorScheme.text.primary} mb-6`}>Order Notes (Optional)</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special instructions for your order..."
                rows={3}
                className={`w-full px-3 py-2 border ${colorScheme.border.default} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorScheme.text.primary} placeholder-gray-400`}
              />
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.image || '/api/placeholder/50/50'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.price * item.quantity, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full mb-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Order...' : 'Place Order'}
              </Button>

              {/* Security Features */}
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure checkout</span>
                </div>
              </div>

              {/* Store Info */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Order from</h3>
                <p className="text-gray-600">{business.name}</p>
                {business.phone && (
                  <p className="text-sm text-gray-500 mt-1">📞 {business.phone}</p>
                )}
              </div>
            </Card>
          </div>
        </form>
      </motion.div>

      {/* Address Form Modal */}
      <AnimatePresence>
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
                className={`relative w-full max-w-lg transform ${colorScheme.background.card} p-6 text-left shadow-xl transition-all sm:my-8 sm:p-8 rounded-lg`}
              >
                <h3 className={`text-lg font-bold ${colorScheme.text.primary} mb-6`}>
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
                      labelClassName={colorScheme.text.primary}
                      borderClassName={colorScheme.border.default}
                    />
                    <div className="flex items-center pt-6">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={handleAddressFormChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${colorScheme.text.primary}`}>Set as default</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={addressForm.firstName}
                      onChange={handleAddressFormChange}
                      labelClassName={colorScheme.text.primary}
                      borderClassName={colorScheme.border.default}
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={addressForm.lastName}
                      onChange={handleAddressFormChange}
                      labelClassName={colorScheme.text.primary}
                      borderClassName={colorScheme.border.default}
                    />
                  </div>
                  
                  <Input
                    label="Phone"
                    name="phone"
                    value={addressForm.phone}
                    onChange={handleAddressFormChange}
                    labelClassName={colorScheme.text.primary}
                    borderClassName={colorScheme.border.default}
                  />
                  
                  <Input
                    label="Street Address"
                    name="street"
                    value={addressForm.street}
                    onChange={handleAddressFormChange}
                    labelClassName={colorScheme.text.primary}
                    borderClassName={colorScheme.border.default}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressFormChange}
                      labelClassName={colorScheme.text.primary}
                      borderClassName={colorScheme.border.default}
                    />
                    <Input
                      label="State"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressFormChange}
                      labelClassName={colorScheme.text.primary}
                      borderClassName={colorScheme.border.default}
                    />
                    <Input
                      label="Country"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressFormChange}
                      labelClassName={colorScheme.text.primary}
                      borderClassName={colorScheme.border.default}
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
      </AnimatePresence>

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};