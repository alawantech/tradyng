import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Clock, CheckCircle, Sparkles, Shield, Star, Zap, User, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService, Order } from '../../services/order';
import { flutterwaveService } from '../../services/flutterwaveService';
import toast from 'react-hot-toast';

export const Payment: React.FC = () => {
  const { business } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get checkout data from location state
  const { checkoutData } = location.state || {};
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!checkoutData) {
      toast.error('Checkout information not found');
      navigate('/');
    }
  }, [checkoutData]);

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

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Checkout Information Not Found
            </h1>
            <p className="text-gray-600 mb-8 text-lg">Please start your checkout process again.</p>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      
      setPaymentReceipt(file);
      setUploadError(null);
    }
  };

  const handleSubmitPayment = async () => {
    if (!checkoutData || !business?.id) {
      toast.error('Checkout information not found');
      return;
    }

    setIsUploading(true);
    
    try {
      // Check if Flutterwave is configured
      if (!flutterwaveService.isConfigured()) {
        toast.error('Payment system is not configured. Please contact support.');
        return;
      }

      const txRef = flutterwaveService.generateTxRef('ORDER');
      
      const paymentResult = await flutterwaveService.initializePayment({
        amount: checkoutData.total,
        currency: business?.settings?.currency || DEFAULT_CURRENCY,
        customerEmail: checkoutData.customerEmail,
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone,
        txRef: txRef,
        redirectUrl: `${window.location.origin}/payment/callback?order=true`,
        meta: {
          orderData: checkoutData,
          businessId: business.id,
          businessName: business.name
        }
      });

      if (paymentResult.status === 'success' && paymentResult.data) {
        // Redirect to Flutterwave payment page
        window.location.href = paymentResult.data.data.link;
      } else {
        toast.error(paymentResult.message || 'Failed to initialize payment');
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
                    Complete Your Payment
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-gray-700 text-lg font-medium"
                  >
                    Secure bank transfer for {formatCurrency(checkoutData?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Link to="/checkout">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 text-gray-700 px-6 py-3 rounded-xl shadow-lg">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Checkout
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Instructions */}
            <div className="space-y-6">

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Card className="relative overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl" />
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-400/30 to-transparent rounded-full -translate-y-12 translate-x-12" />
                      <div className="relative p-8">
                        <div className="flex items-center space-x-4 mb-8">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="flex-shrink-0"
                          >
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                          </motion.div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
                            <p className="text-gray-600 text-lg">Pay securely with Flutterwave</p>
                          </div>
                        </div>
                        
                        <div className="space-y-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 backdrop-blur-sm p-6 rounded-2xl border border-green-200/50">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl"
                          >
                            <span className="text-gray-700 font-semibold">Payment Method</span>
                            <span className="text-gray-900 font-bold">Flutterwave</span>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl"
                          >
                            <span className="text-gray-700 font-semibold">Currency</span>
                            <span className="text-gray-900 font-bold">{business?.settings?.currency || DEFAULT_CURRENCY}</span>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 backdrop-blur-sm rounded-xl border-2 border-purple-200"
                          >
                            <span className="text-gray-700 font-semibold">Amount to Pay</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              {formatCurrency(checkoutData?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}
                            </span>
                          </motion.div>
                        </div>
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.6 }}
                          className="mt-8 p-6 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 backdrop-blur-sm rounded-2xl border border-amber-200/50"
                        >
                          <div className="flex items-start space-x-4">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                            </motion.div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-amber-800 mb-3">Secure Payment</h3>
                              <ul className="text-amber-700 space-y-2 text-sm">
                                <li className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span>Multiple payment options available</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span>Card, Mobile Money, Bank Transfer</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span>256-bit SSL encryption</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span>Instant payment confirmation</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>

              {/* Upload Receipt */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Card className="relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/30 to-transparent rounded-full translate-y-12 -translate-x-12" />
                  <div className="relative p-8">
                    <div className="flex items-center space-x-4 mb-8">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex-shrink-0"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
                        <p className="text-gray-600 text-lg">Click below to proceed to secure payment</p>
                      </div>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleSubmitPayment}
                        disabled={isUploading}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl font-semibold text-lg"
                      >
                        {isUploading ? (
                          <div className="flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                            />
                            Processing Payment...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2" />
                            Pay with Flutterwave
                          </div>
                        )}
                      </Button>
                    </motion.div>
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
                    <div className="flex items-center space-x-4 mb-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex-shrink-0"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                        <p className="text-gray-600 text-lg">Review your purchase</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.9 }}
                      className="mb-8 p-6 bg-gradient-to-r from-gray-50/50 to-slate-50/50 backdrop-blur-sm rounded-2xl border border-gray-200/50"
                    >
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-purple-600" />
                        Customer Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Name:</span>
                          <span className="text-gray-900 font-semibold">{checkoutData?.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Email:</span>
                          <span className="text-gray-900 font-semibold">{checkoutData?.customerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <span className="text-gray-900 font-semibold">{checkoutData?.customerPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Address:</span>
                          <span className="text-gray-900 font-semibold text-right">
                            {checkoutData?.shippingAddress?.street}, {checkoutData?.shippingAddress?.city}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Order Items */}
                    <div className="space-y-6 mb-8">
                      <h3 className="font-bold text-gray-900 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Order Items
                      </h3>
                      <AnimatePresence>
                        {checkoutData?.items.map((item, index) => (
                          <motion.div
                            key={item.productId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center space-x-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm"
                          >
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              src={item.image || '/api/placeholder/60/60'}
                              alt={item.productName}
                              className="w-16 h-16 object-cover rounded-xl shadow-lg"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm leading-tight">{item.productName}</p>
                              <p className="text-gray-600 text-sm mt-1">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-900">{formatCurrency(item.total, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4 mb-8 border-t border-gray-200/50 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(checkoutData?.subtotal || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tax</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(checkoutData?.tax || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold border-t border-gray-300/50 pt-4">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Total</span>
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{formatCurrency(checkoutData?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                    </div>

                    {/* Security Features */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1.2 }}
                      className="space-y-4 text-sm text-gray-600"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.3 }}
                        className="flex items-center space-x-3 p-3 bg-green-50/50 backdrop-blur-sm rounded-lg"
                      >
                        <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="font-medium">Secure payment processing</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.4 }}
                        className="flex items-center space-x-3 p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg"
                      >
                        <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <span className="font-medium">Fast order processing</span>
                      </motion.div>
                    </motion.div>

                    {/* Store Info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1.5 }}
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};