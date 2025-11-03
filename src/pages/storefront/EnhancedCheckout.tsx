import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Shield,
  User,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Check,
  Sparkles,
  Lock,
  Truck,
  Star
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
import { customerAuthService } from '../../services/customerAuth';
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
        // Extract real email from Firebase Auth email
        const realEmail = user.email ? customerAuthService.extractRealEmailFromFirebase(user.email) : '';
        
        // Create profile if it doesn't exist
        await CustomerService.createOrUpdateProfile({
          uid: user.uid,
          email: realEmail,
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
        // Always use the real email extracted from Firebase Auth, in case profile has wrong email
        const realEmail = user.email ? customerAuthService.extractRealEmailFromFirebase(user.email) : profile.email;
        
        setFormData(prev => ({
          ...prev,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: realEmail, // Always use extracted real email
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

      // Clear cart and redirect to payment with checkout data
      clearCart();
      toast.success('Proceeding to payment. Please upload your receipt to complete the order.');

      if (formData.paymentMethod === 'manual') {
        // Pass checkout data instead of creating order
        const checkoutData = {
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
            total: item.price * item.quantity,
            image: item.image
          })),
          subtotal: total,
          tax: 0,
          shipping: 0,
          total: total,
          paymentMethod: 'manual' as const,
          notes: formData.notes,
          businessId: business.id
        };

        navigate('/payment', { state: { checkoutData } });
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Star className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8 text-lg">Add some amazing products to proceed with checkout.</p>
            <Link to="/products">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Continue Shopping
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20" />
            <div className="relative p-8">
              <div className="flex items-center justify-between">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2"
                  >
                    Secure Checkout
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-gray-700 text-lg font-medium"
                  >
                    {itemCount} item{itemCount !== 1 ? 's' : ''} • {formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Link to="/cart">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 text-gray-700 px-6 py-3 rounded-xl shadow-lg">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Cart
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Authentication Status */}
              {!user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-8">
                      <div className="flex items-start space-x-4">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="flex-shrink-0"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <AlertCircle className="h-6 w-6 text-white" />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Sign in or continue as guest
                          </h3>
                          <p className="text-gray-600 mb-6 text-lg">
                            You can place an order as a guest, or login for faster checkout and order tracking.
                          </p>
                          <div className="flex flex-wrap gap-4 mb-6">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                type="button"
                                onClick={() => {
                                  setAuthModalMode('signin');
                                  setShowAuthModal(true);
                                }}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-xl"
                              >
                                <User className="h-5 w-5 mr-2" />
                                Login
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setAuthModalMode('signup');
                                  setShowAuthModal(true);
                                }}
                                size="lg"
                                className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 text-gray-700 px-6 py-3 rounded-xl shadow-lg"
                              >
                                Register
                              </Button>
                            </motion.div>
                          </div>

                          {/* Guest checkout option */}
                          <div className="border-t border-gray-200/50 pt-6">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                name="createAccount"
                                checked={formData.createAccount}
                                onChange={handleInputChange}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                Create an account during checkout (optional)
                              </span>
                            </label>

                            {formData.createAccount && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                              >
                                <Input
                                  label="Password"
                                  name="password"
                                  type="password"
                                  value={formData.password || ''}
                                  onChange={handleInputChange}
                                  placeholder="Enter password"
                                  required={formData.createAccount}
                                  labelClassName="text-gray-700 font-semibold"
                                  borderClassName="border-gray-300 focus:border-blue-500"
                                  className="bg-white/50 backdrop-blur-sm rounded-xl"
                                />
                                <Input
                                  label="Confirm Password"
                                  name="confirmPassword"
                                  type="password"
                                  value={formData.confirmPassword || ''}
                                  onChange={handleInputChange}
                                  placeholder="Confirm password"
                                  required={formData.createAccount}
                                  labelClassName="text-gray-700 font-semibold"
                                  borderClassName="border-gray-300 focus:border-blue-500"
                                  className="bg-white/50 backdrop-blur-sm rounded-xl"
                                />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-8">
                      <div className="flex items-start space-x-4">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="flex-shrink-0"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Signed in as {customerProfile?.displayName || (user.email ? customerAuthService.extractRealEmailFromFirebase(user.email) : 'User')}
                          </h3>
                          <p className="text-gray-600 text-lg">
                            Your information will be saved and you can track your orders.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Customer Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl" />
                  <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -translate-y-12 -translate-x-12" />
                  <div className="relative p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                      <User className="h-6 w-6 mr-3 text-purple-600" />
                      Customer Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <Input
                          label="First Name"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Kemi"
                          labelClassName="text-gray-700 font-semibold"
                          borderClassName="border-gray-300 focus:border-purple-500"
                          className="bg-white/50 backdrop-blur-sm rounded-xl"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      >
                        <Input
                          label="Last Name"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Adeyemi"
                          labelClassName="text-gray-700 font-semibold"
                          borderClassName="border-gray-300 focus:border-purple-500"
                          className="bg-white/50 backdrop-blur-sm rounded-xl"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      >
                        <Input
                          label="Email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="kemi@gmail.com"
                          labelClassName="text-gray-700 font-semibold"
                          borderClassName="border-gray-300 focus:border-purple-500"
                          className="bg-white/50 backdrop-blur-sm rounded-xl"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                      >
                        <Input
                          label="Phone"
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+234 901 234 5678"
                          labelClassName="text-gray-700 font-semibold"
                          borderClassName="border-gray-300 focus:border-purple-500"
                          className="bg-white/50 backdrop-blur-sm rounded-xl"
                        />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Saved Addresses (for logged in users) */}
              {user && customerAddresses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl" />
                    <div className="relative p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                          <Truck className="h-6 w-6 mr-3 text-blue-600" />
                          Choose Delivery Address
                        </h2>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={handleAddAddress}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-3 rounded-xl shadow-lg"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Address
                          </Button>
                        </motion.div>
                      </div>

                      <div className="space-y-4">
                        {/* Create New Address Option */}
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          className={`block p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                            selectedAddressId === 'new'
                              ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-xl'
                              : 'border-gray-200 hover:border-purple-300 bg-white/50 backdrop-blur-sm hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <motion.div
                              animate={selectedAddressId === 'new' ? { rotate: [0, 10, -10, 0] } : {}}
                              transition={{ duration: 0.5 }}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedAddressId === 'new' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                              }`}
                            >
                              {selectedAddressId === 'new' && <Check className="w-3 h-3 text-white" />}
                            </motion.div>
                            <input
                              type="radio"
                              name="deliveryAddress"
                              value="new"
                              checked={selectedAddressId === 'new'}
                              onChange={() => handleAddressSelect('new')}
                              className="sr-only"
                            />
                            <Plus className="h-6 w-6 text-purple-600 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900 text-lg">Use New Address</span>
                              <p className="text-gray-600 mt-1">Enter a different delivery address below</p>
                            </div>
                          </div>
                        </motion.label>

                        {/* Saved Addresses */}
                        {customerAddresses.map((address, index) => (
                          <motion.label
                            key={address.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`block p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                              selectedAddressId === address.id
                                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-xl'
                                : 'border-gray-200 hover:border-purple-300 bg-white/50 backdrop-blur-sm hover:shadow-lg'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <motion.div
                                  animate={selectedAddressId === address.id ? { rotate: [0, 10, -10, 0] } : {}}
                                  transition={{ duration: 0.5 }}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                                    selectedAddressId === address.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                  }`}
                                >
                                  {selectedAddressId === address.id && <Check className="w-3 h-3 text-white" />}
                                </motion.div>
                                <input
                                  type="radio"
                                  name="deliveryAddress"
                                  value={address.id}
                                  checked={selectedAddressId === address.id}
                                  onChange={() => handleAddressSelect(address.id!)}
                                  className="sr-only"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <span className="font-semibold text-gray-900 text-lg">{address.label}</span>
                                    {address.isDefault && (
                                      <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-semibold shadow-lg">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-gray-700 font-medium">
                                      {address.firstName} {address.lastName}
                                    </p>
                                    <p className="text-gray-600">{address.street}</p>
                                    <p className="text-gray-600">
                                      {address.city}, {address.state}, {address.country}
                                    </p>
                                    <p className="text-gray-600">{address.phone}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2 ml-4 pt-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEditAddress(address);
                                  }}
                                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Edit Address"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteAddress(address.id!);
                                  }}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Address"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Shipping Address - Show when no saved addresses OR "Use New Address" is selected */}
              {(!user || customerAddresses.length === 0 || selectedAddressId === 'new') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Truck className="h-6 w-6 mr-3 text-blue-600" />
                            {selectedAddressId === 'new' ? 'Enter New Delivery Address' : 'Delivery Address'}
                          </h2>
                          {selectedAddressId === 'new' && (
                            <p className="text-gray-600 mt-2 text-lg">
                              This address will be saved to your account for future orders
                            </p>
                          )}
                        </div>
                        {user && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={handleAddAddress}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-3 rounded-xl shadow-lg"
                            >
                              <Plus className="h-5 w-5 mr-2" />
                              Save Address
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <Input
                            label="Street Address"
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="No. 23 Opebi Road, Ikeja"
                            labelClassName="text-gray-700 font-semibold"
                            borderClassName="border-gray-300 focus:border-purple-500"
                            className="bg-white/50 backdrop-blur-sm rounded-xl"
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                          <Input
                            label="Country"
                            name="country"
                            required
                            value={formData.country || 'Nigeria'}
                            onChange={handleInputChange}
                            placeholder="Nigeria"
                            labelClassName="text-gray-700 font-semibold"
                            borderClassName="border-gray-300 focus:border-purple-500"
                            className="bg-white/50 backdrop-blur-sm rounded-xl"
                          />
                          <Input
                            label="State"
                            name="state"
                            required
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="Lagos"
                            labelClassName="text-gray-700 font-semibold"
                            borderClassName="border-gray-300 focus:border-purple-500"
                            className="bg-white/50 backdrop-blur-sm rounded-xl"
                          />
                          <Input
                            label="City"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Lagos"
                            labelClassName="text-gray-700 font-semibold"
                            borderClassName="border-gray-300 focus:border-purple-500"
                            className="bg-white/50 backdrop-blur-sm rounded-xl"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full translate-y-16 -translate-x-16" />
                  <div className="relative p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                      <Lock className="h-6 w-6 mr-3 text-green-600" />
                      Payment Method
                    </h2>
                    <div className="space-y-4">
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center space-x-4 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                          formData.paymentMethod === 'manual'
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-xl'
                            : 'border-gray-200 hover:border-purple-300 bg-white/50 backdrop-blur-sm hover:shadow-lg'
                        }`}
                      >
                        <motion.div
                          animate={formData.paymentMethod === 'manual' ? { rotate: [0, 10, -10, 0] } : {}}
                          transition={{ duration: 0.5 }}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            formData.paymentMethod === 'manual' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                          }`}
                        >
                          {formData.paymentMethod === 'manual' && <Check className="w-4 h-4 text-white" />}
                        </motion.div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="manual"
                          checked={formData.paymentMethod === 'manual'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">Manual Payment</p>
                            <p className="text-gray-600">Pay via bank transfer</p>
                          </div>
                        </div>
                      </motion.label>

                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-2xl cursor-not-allowed opacity-60 bg-gray-50/50 backdrop-blur-sm"
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          disabled
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">Credit/Debit Card</p>
                            <p className="text-gray-600">Coming soon...</p>
                          </div>
                        </div>
                      </motion.label>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Order Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl" />
                  <div className="relative p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                      Order Notes (Optional)
                    </h2>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special instructions for your order..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 resize-none"
                    />
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="sticky top-8"
              >
                <Card className="relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl" />
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/30 to-transparent rounded-full -translate-y-12 translate-x-12" />
                  <div className="relative p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                      <Star className="h-6 w-6 mr-3 text-yellow-500" />
                      Order Summary
                    </h2>

                    {/* Order Items */}
                    <div className="space-y-6 mb-8">
                      <AnimatePresence>
                        {items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center space-x-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm"
                          >
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              src={item.image || '/api/placeholder/60/60'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-xl shadow-lg"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                              <p className="text-gray-600 text-sm mt-1">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4 mb-8 border-t border-gray-200/50 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold border-t border-gray-300/50 pt-4">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Total</span>
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full mb-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl font-semibold text-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Creating Order...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Lock className="h-5 w-5 mr-2" />
                            Place Order
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    {/* Security Features */}
                    <div className="space-y-4 text-sm text-gray-600">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        className="flex items-center space-x-3 p-3 bg-green-50/50 backdrop-blur-sm rounded-lg"
                      >
                        <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="font-medium">Secure checkout with SSL encryption</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.3 }}
                        className="flex items-center space-x-3 p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg"
                      >
                        <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <span className="font-medium">Fast and reliable delivery</span>
                      </motion.div>
                    </div>

                    {/* Store Info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1.4 }}
                      className="mt-8 pt-6 border-t border-gray-200/50"
                    >
                      <h3 className="font-bold text-gray-900 mb-3">Order from</h3>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{business.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{business.name}</p>
                          {business.phone && (
                            <p className="text-sm text-gray-600">📞 {business.phone}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
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
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowAddressForm(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full max-w-lg transform bg-white/95 backdrop-blur-xl p-8 text-left shadow-2xl transition-all sm:my-8 sm:p-8 rounded-2xl border border-white/20"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <Edit3 className="h-6 w-6 mr-3 text-purple-600" />
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Address Label"
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressFormChange}
                        placeholder="Home, Work, etc."
                        labelClassName="text-gray-700 font-semibold"
                        borderClassName="border-gray-300 focus:border-purple-500"
                        className="bg-white/50 backdrop-blur-sm rounded-xl"
                      />
                      <div className="flex items-center pt-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={addressForm.isDefault}
                            onChange={handleAddressFormChange}
                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-gray-700 font-medium">Set as default</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        name="firstName"
                        value={addressForm.firstName}
                        onChange={handleAddressFormChange}
                        labelClassName="text-gray-700 font-semibold"
                        borderClassName="border-gray-300 focus:border-purple-500"
                        className="bg-white/50 backdrop-blur-sm rounded-xl"
                      />
                      <Input
                        label="Last Name"
                        name="lastName"
                        value={addressForm.lastName}
                        onChange={handleAddressFormChange}
                        labelClassName="text-gray-700 font-semibold"
                        borderClassName="border-gray-300 focus:border-purple-500"
                        className="bg-white/50 backdrop-blur-sm rounded-xl"
                      />
                    </div>
                    
                    <Input
                      label="Phone"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressFormChange}
                      labelClassName="text-gray-700 font-semibold"
                      borderClassName="border-gray-300 focus:border-purple-500"
                      className="bg-white/50 backdrop-blur-sm rounded-xl"
                    />
                    
                    <Input
                      label="Street Address"
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressFormChange}
                      labelClassName="text-gray-700 font-semibold"
                      borderClassName="border-gray-300 focus:border-purple-500"
                      className="bg-white/50 backdrop-blur-sm rounded-xl"
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="City"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressFormChange}
                        labelClassName="text-gray-700 font-semibold"
                        borderClassName="border-gray-300 focus:border-purple-500"
                        className="bg-white/50 backdrop-blur-sm rounded-xl"
                      />
                      <Input
                        label="State"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressFormChange}
                        labelClassName="text-gray-700 font-semibold"
                        borderClassName="border-gray-300 focus:border-purple-500"
                        className="bg-white/50 backdrop-blur-sm rounded-xl"
                      />
                      <Input
                        label="Country"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressFormChange}
                        labelClassName="text-gray-700 font-semibold"
                        borderClassName="border-gray-300 focus:border-purple-500"
                        className="bg-white/50 backdrop-blur-sm rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 mt-8">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1"
                    >
                      <Button
                        type="button"
                        onClick={handleSaveAddress}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold"
                      >
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddressForm(false)}
                        className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 text-gray-700 px-6 py-3 rounded-xl shadow-lg"
                      >
                        Cancel
                      </Button>
                    </motion.div>
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
    </div>
  );
};