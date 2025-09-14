import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCart } from '../../contexts/CartContext';
import { useStore } from './StorefrontLayout';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
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
    zipCode: '',
    paymentMethod: 'manual',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.error('Please sign in to complete your order');
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
          address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`
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
            <p className="text-gray-600 mt-1">{itemCount} items • ${total.toFixed(2)}</p>
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
                  placeholder="John"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="md:col-span-1"
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                  />
                  <Input
                    label="State"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                  />
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
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
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
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
    </div>
  );
};