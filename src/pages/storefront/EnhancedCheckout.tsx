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
  MapPin,
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
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService } from '../../services/order';
import { CustomerService, CustomerAddress, CustomerProfile } from '../../services/customer';
import { EmailService } from '../../services/emailService';
import { OTPService } from '../../services/otpService';
import toast from 'react-hot-toast';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
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
  zipCode?: string;
  isDefault: boolean;
}

export const EnhancedCheckout: React.FC = () => {
  const { items, total, itemCount, clearCart } = useCart();
  const { business } = useStore();
  const { user, signUp, signIn } = useCustomerAuth();
  const navigate = useNavigate();
  
  // State management
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Address form for adding/editing addresses
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    label: 'Home',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
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
    
    setIsLoadingProfile(true);
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
    } finally {
      setIsLoadingProfile(false);
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
      zipCode: address.zipCode || ''
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
    const address = customerAddresses.find(addr => addr.id === addressId);
    if (address) {
      fillFormWithAddress(address);
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
      zipCode: '',
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
      zipCode: address.zipCode || '',
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
      await signUp(formData.email, formData.password, `${formData.firstName} ${formData.lastName}`);
      
      // The useEffect will automatically load the profile after auth state changes
      toast.success('Account created successfully!');
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
          zipCode: formData.zipCode || '',
          country: 'Nigeria'
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
      
      // Save address if user is logged in and it's not already saved
      if (currentUser && !selectedAddressId) {
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
            zipCode: formData.zipCode || '',
            country: 'Nigeria'
          });
        } catch (error) {
          console.error('Error saving address:', error);
        }
      }

      // Send email notifications
      if (business) {
        try {
          const storeBranding = {
            storeName: business.name,
            storeUrl: `https://${business.subdomain}.rady.ng`,
            logoUrl: business.logo,
            primaryColor: business.settings?.primaryColor || '#3B82F6',
            supportEmail: business.email,
            phone: business.phone,
            customFromName: `${business.name} Team`
          };

          // Send order confirmation to customer
          await EmailService.sendOrderPlacedConfirmation(
            { id: orderId, ...orderData },
            { email: formData.email, name: `${formData.firstName} ${formData.lastName}` },
            storeBranding
          );

          // Send notification to store owner
          await EmailService.sendOrderNotificationToOwner(
            { id: orderId, ...orderData },
            { email: formData.email, name: `${formData.firstName} ${formData.lastName}` },
            storeBranding
          );
        } catch (emailError) {
          console.error('Error sending emails:', emailError);
          // Don't fail the order if email fails
        }
      }
      
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
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some products to proceed with checkout.</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-1">{itemCount} items • {formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
          </div>
          <Link to="/cart">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
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
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Sign in or continue as guest
                    </h3>
                    <p className="text-blue-700 mb-4">
                      You can place an order as a guest, or sign in for faster checkout and order tracking.
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
                        Sign In
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAuthModalMode('signup');
                          setShowAuthModal(true);
                        }}
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Create Account
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-700">
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
                          />
                          <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword || ''}
                            onChange={handleInputChange}
                            placeholder="Confirm password"
                            required={formData.createAccount}
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
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Signed in as {customerProfile?.displayName || user.email}
                    </h3>
                    <p className="text-green-700">
                      Your information will be saved and you can track your orders.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Kemi"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Adeyemi"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="kemi@gmail.com"
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+234 901 234 5678"
                />
              </div>
            </Card>

            {/* Saved Addresses (for logged in users) */}
            {user && customerAddresses.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAddress}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {customerAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAddressSelect(address.id!)}
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
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(address.id!);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                {user && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAddress}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
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
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                  />
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                  />
                  <Input
                    label="ZIP Code (Optional)"
                    name="zipCode"
                    value={formData.zipCode || ''}
                    onChange={handleInputChange}
                    placeholder="100001"
                  />
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={formData.paymentMethod === 'manual'}
                    onChange={handleInputChange}
                    className="text-blue-600"
                  />
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Manual Payment</p>
                      <p className="text-sm text-gray-600">Pay via bank transfer</p>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-not-allowed opacity-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    disabled
                    className="text-blue-600"
                  />
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Coming soon...</p>
                    </div>
                  </div>
                </label>
              </div>
            </Card>

            {/* Order Notes */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Notes (Optional)</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special instructions for your order..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
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
                      <p className="font-medium text-sm">{item.name}</p>
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