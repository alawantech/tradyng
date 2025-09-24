import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, Shield, User, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCart } from '../../contexts/CartContext';
import { useStore } from './StorefrontLayout';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerAuthModal } from '../../components/modals/CustomerAuthModal';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
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
}

export const Checkout: React.FC = () => {
  const { items, total, itemCount, clearCart } = useCart();
  const { business } = useStore();
  const { user } = useCustomerAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    paymentMethod: 'manual',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create order (we'll implement this with the order service)
      const orderData = {
        customerId: user.uid,
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}, ${formData.state}`
        },
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        status: 'pending_payment' as const
      };

      // TODO: Implement order creation with OrderService
      console.log('Order data:', orderData);
      
      // For now, simulate order creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart and redirect to payment
      clearCart();
      toast.success('Order created successfully!');
      
      if (formData.paymentMethod === 'manual') {
        // Redirect to manual payment page
        navigate('/payment', { state: { orderData } });
      } else {
        // Redirect to card payment (implement later)
        toast.success('Card payment integration coming soon!');
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Authentication Prompt */}
        {!user && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Sign in to continue</h3>
                <p className="text-blue-700 mb-4">
                  You need to sign in or create an account to place an order. Your information will be saved and you can track your orders.
                </p>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAuthModal(true)}
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className={`p-6 ${!user ? 'opacity-50 bg-gray-50' : ''}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
              {!user && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Please sign in to enter your information
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  required
                  disabled={!user}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Kemi"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  required
                  disabled={!user}
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Adeyemi"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  disabled={!user}
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="kemi@gmail.com"
                  className="md:col-span-1"
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  required
                  disabled={!user}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+234 901 234 5678"
                />
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className={`p-6 ${!user ? 'opacity-50 bg-gray-50' : ''}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Address</h2>
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  name="address"
                  required
                  disabled={!user}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="No. 23 Opebi Road, Ikeja"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City (Optional)"
                    name="city"
                    disabled={!user}
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                  />
                  <Input
                    label="State (Optional)"
                    name="state"
                    disabled={!user}
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                  />
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className={`p-6 ${!user ? 'opacity-50 bg-gray-50' : ''}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center space-x-3 p-4 border rounded-lg ${!user ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={formData.paymentMethod === 'manual'}
                    onChange={handleInputChange}
                    disabled={!user}
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
                
                {/* TODO: Add card payment option later */}
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
            <Card className={`p-6 ${!user ? 'opacity-50 bg-gray-50' : ''}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Notes (Optional)</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={!user}
                placeholder="Any special instructions for your order..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isSubmitting || !user}
              >
                {!user 
                  ? 'Sign In to Place Order'
                  : (isSubmitting ? 'Creating Order...' : 'Place Order')
                }
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

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </div>
  );
};