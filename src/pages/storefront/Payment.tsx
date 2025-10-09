import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, CreditCard, Clock, CheckCircle, Sparkles, Shield, Star, Banknote, FileText, Camera, Zap, User, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService, Order } from '../../services/order';
import toast from 'react-hot-toast';

export const Payment: React.FC = () => {
  const { business } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get order ID and business ID from location state
  const { orderId, businessId } = location.state || {};
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && businessId) {
      loadOrder();
    } else {
      toast.error('Order information not found');
      navigate('/');
    }
  }, [orderId, businessId]);

  const loadOrder = async () => {
    if (!orderId || !businessId) return;

    try {
      // Find order by professional order ID (not Firebase document ID)
      const orders = await OrderService.getOrdersByBusinessId(businessId);
      const foundOrder = orders.find(o => o.orderId === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error('Order not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
      navigate('/');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Star className="w-12 h-12 text-white animate-spin" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Loading Your Order...
            </h1>
            <p className="text-gray-600 text-lg">Please wait while we prepare your payment details</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!order) {
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
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-8 text-lg">No order data found. Please start a new order.</p>
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
    if (!paymentReceipt) {
      toast.error('Please upload your payment receipt');
      return;
    }

    if (!order || !businessId) {
      toast.error('Order information not found');
      return;
    }

    setIsUploading(true);
    
    try {
      // TODO: Implement actual file upload to Firebase Storage
      // For now, simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For manual payment, set status to 'pending' and paymentStatus to 'pending'
      if (order.id) {
        await OrderService.updateOrder(businessId, order.id, {
          status: 'pending',
          paymentStatus: 'pending',
          notes: order.notes ? `${order.notes}\n\nPayment receipt uploaded` : 'Payment receipt uploaded'
        });
      }

      // Send confirmation email to customer
      try {
        const { sendEmail } = await import('../../services/emailService');
        await sendEmail({
          to: order.customerEmail,
          from: business.email || 'noreply@rady.ng',
          subject: `Order ${order.orderId} Created - Awaiting Approval`,
          html: `<h2>Order Created Successfully</h2>
            <p>Hi ${order.customerName},</p>
            <p>Your order <b>${order.orderId}</b> has been created and is awaiting admin approval.</p>
            <p>Once your payment is verified, your order will be processed and shipped.</p>
            <p>Thank you for shopping with ${business.name}!</p>`
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      toast.success('Payment receipt uploaded successfully! Your order is now awaiting admin approval.');
      // Redirect to order history page and pass orderId in state
      navigate('/orders', { state: { orderSubmitted: true, orderId: order.orderId } });
      
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
                    Secure bank transfer for {formatCurrency(order?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}
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

              {/* Bank Transfer Details */}
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
                          <Banknote className="h-6 w-6 text-white" />
                        </div>
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Bank Transfer Details</h2>
                        <p className="text-gray-600 text-lg">Secure payment information</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 backdrop-blur-sm p-6 rounded-2xl border border-green-200/50">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl"
                      >
                        <span className="text-gray-700 font-semibold">Bank Name</span>
                        <span className="text-gray-900 font-bold">{business.bankDetails?.bankName || 'First National Bank'}</span>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl"
                      >
                        <span className="text-gray-700 font-semibold">Account Name</span>
                        <span className="text-gray-900 font-bold">{business.bankDetails?.accountName || business.name}</span>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl"
                      >
                        <span className="text-gray-700 font-semibold">Account Number</span>
                        <span className="text-gray-900 font-mono font-bold text-lg">{business.bankDetails?.accountNumber || '1234567890'}</span>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 backdrop-blur-sm rounded-xl border-2 border-purple-200"
                      >
                        <span className="text-gray-700 font-semibold">Amount to Transfer</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {formatCurrency(order?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}
                        </span>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl"
                      >
                        <span className="text-gray-700 font-semibold">Reference</span>
                        <span className="text-gray-900 font-mono font-bold">{order?.orderId || 'N/A'}</span>
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
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-amber-800 mb-3">Payment Instructions</h3>
                          <ul className="text-amber-700 space-y-2 text-sm">
                            <li className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Transfer the exact amount shown above</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Use the reference number in your transfer description</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Upload your payment receipt below</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Your order will be processed after payment verification</span>
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
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Upload Payment Receipt</h2>
                        <p className="text-gray-600 text-lg">Submit your proof of payment</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-400 transition-all duration-300 bg-gradient-to-r from-purple-50/50 to-blue-50/50 backdrop-blur-sm"
                      >
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Upload className="h-16 w-16 text-purple-400 mx-auto mb-6" />
                          </motion.div>
                          <p className="text-xl font-bold text-gray-900 mb-3">
                            Click to upload receipt
                          </p>
                          <p className="text-gray-600 text-lg">
                            PNG, JPG or PDF up to 5MB
                          </p>
                        </label>
                      </motion.div>
                      
                      <AnimatePresence>
                        {paymentReceipt && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center space-x-4 p-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 backdrop-blur-sm rounded-2xl border border-green-200/50"
                          >
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                            </motion.div>
                            <div className="flex-1">
                              <p className="text-lg font-bold text-green-800">{paymentReceipt.name}</p>
                              <p className="text-green-600 font-medium">
                                {(paymentReceipt.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {uploadError && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-50/50 backdrop-blur-sm rounded-xl border border-red-200/50"
                        >
                          <p className="text-red-600 font-medium">{uploadError}</p>
                        </motion.div>
                      )}
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleSubmitPayment}
                          disabled={!paymentReceipt || isUploading}
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
                              Uploading Receipt...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Zap className="h-5 w-5 mr-2" />
                              Submit Payment Receipt
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </div>
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
                          <span className="text-gray-900 font-semibold">{order?.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Email:</span>
                          <span className="text-gray-900 font-semibold">{order?.customerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <span className="text-gray-900 font-semibold">{order?.customerPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Address:</span>
                          <span className="text-gray-900 font-semibold text-right">
                            {order?.shippingAddress?.street}, {order?.shippingAddress?.city}
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
                        {order?.items.map((item, index) => (
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
                        <span className="font-semibold text-gray-900">{formatCurrency(order?.subtotal || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tax</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(order?.tax || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold border-t border-gray-300/50 pt-4">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Total</span>
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{formatCurrency(order?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
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