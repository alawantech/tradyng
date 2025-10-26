import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Package,
  Truck,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  Star,
  Sparkles,
  ShoppingBag,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { useStore } from './StorefrontLayout';
import { OrderService, Order } from '../../services/order';
import { ProductService } from '../../services/product';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Card } from '../../components/ui/Card';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { useLocation } from 'react-router-dom';
import { customerAuthService } from '../../services/customerAuth';

const OrderHistory: React.FC = () => {
  const { business } = useStore();
  const { user, isLoading: authLoading } = useCustomerAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justSubmittedOrderId, setJustSubmittedOrderId] = useState<string | null>(null);

  useEffect(() => {
    console.log('OrderHistory useEffect triggered');
    console.log('Business ID:', business?.id);
    console.log('User email (Firebase):', user?.email);
    
    // Extract real email from Firebase Auth email
    const realEmail = user?.email ? customerAuthService.extractRealEmailFromFirebase(user.email) : null;
    console.log('Real email extracted:', realEmail);
    console.log('Auth loading:', authLoading);

    if (business?.id && realEmail) {
      console.log('Calling loadOrders');
      loadOrders(realEmail);
    } else {
      console.log('Not calling loadOrders - missing business or realEmail');
    }
  }, [business?.id, user?.email]);

  // Handle order submission state from Payment.tsx
  useEffect(() => {
    const state = location.state as { orderSubmitted?: boolean; orderId?: string } | null;
    if (state?.orderSubmitted && state?.orderId) {
      setJustSubmittedOrderId(state.orderId);
      // Reload orders to show the newly created order
      const realEmail = user?.email ? customerAuthService.extractRealEmailFromFirebase(user.email) : null;
      if (business?.id && realEmail) {
        loadOrders(realEmail);
      }
    }
  }, [location.state, business?.id, user?.email]);

  const loadOrders = async (realEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!business?.id) {
        setError('Business ID not found.');
        setLoading(false);
        return;
      }
      if (!realEmail) {
        setError('User email not found. Please sign in again.');
        setLoading(false);
        return;
      }

      console.log('Loading orders for business:', business.id);
      console.log('Using real email for filtering:', realEmail);

      const allOrders = await OrderService.getOrdersByBusinessId(business.id);
      console.log('All orders fetched:', allOrders.length);
      console.log('All orders details:', allOrders.map(o => ({ id: o.orderId, email: o.customerEmail, status: o.status })));

      const customerOrders = allOrders.filter(o => o.customerEmail === realEmail);
      console.log('Filtered customer orders:', customerOrders.length);
      console.log('Customer orders:', customerOrders.map(o => ({ id: o.orderId, email: o.customerEmail })));

      // Sort by most recent first
      customerOrders.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setOrders(customerOrders);

      // Fetch product images for all items in all orders
      const imageMap: Record<string, string> = {};
      for (const order of customerOrders) {
        for (const item of order.items) {
          if (!item.image && item.productId && !imageMap[item.productId]) {
            const product = await ProductService.getProductById(business.id, item.productId);
            if (product && product.images && product.images.length > 0) {
              imageMap[item.productId] = product.images[0];
            }
          } else if (item.image) {
            imageMap[item.productId] = item.image;
          }
        }
      }
      setProductImages(imageMap);
    } catch (err: any) {
      setError('Failed to load orders: ' + (err?.message || String(err)));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'from-yellow-400 to-orange-500';
      case 'paid': return 'from-green-400 to-emerald-500';
      case 'processing': return 'from-blue-400 to-indigo-500';
      case 'shipped': return 'from-blue-400 to-indigo-500';
      case 'delivered': return 'from-emerald-400 to-green-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CreditCard className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20" />
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex-shrink-0"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <History className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2"
                    >
                      Order History
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="text-gray-700 text-sm sm:text-base lg:text-lg font-medium"
                    >
                      Track your purchases and order status
                    </motion.p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex items-center justify-center sm:justify-end space-x-3 sm:space-x-2"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Success Message for Just Submitted Order */}
          <AnimatePresence>
            {justSubmittedOrderId && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="relative mb-6 sm:mb-8"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 backdrop-blur-xl rounded-2xl" />
                <div className="relative p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
                        scale: { duration: 0.3, repeat: Infinity, repeatDelay: 2 }
                      }}
                      className="flex-shrink-0"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1 sm:mb-2"
                      >
                        Payment Receipt Submitted Successfully! 🎉
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-gray-700 text-sm sm:text-base lg:text-lg font-medium"
                      >
                        Your order #{justSubmittedOrderId} has been created and is awaiting admin approval.
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-gray-600 text-xs sm:text-sm mt-2"
                      >
                        You'll receive an email confirmation once your payment is verified and your order is processed.
                      </motion.p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setJustSubmittedOrderId(null)}
                      className="flex-shrink-0 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl shadow-lg font-semibold text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {authLoading || loading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-12 sm:py-16"
            >
              <div className="text-center px-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Loading Your Orders</h3>
                <p className="text-gray-600 text-sm sm:text-base">Please wait while we fetch your order history...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 sm:py-16 px-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Oops! Something went wrong</h3>
              <p className="text-red-600 font-medium mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const realEmail = user?.email ? customerAuthService.extractRealEmailFromFirebase(user.email) : null;
                  if (realEmail) loadOrders(realEmail);
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg font-semibold text-sm sm:text-base min-h-[44px] touch-manipulation"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 sm:py-16 px-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl">
                <Star className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h3 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                No Orders Yet
              </h3>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg">Start shopping to see your order history here!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl shadow-xl font-semibold text-sm sm:text-lg min-h-[44px] touch-manipulation"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                Start Shopping
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <AnimatePresence>
                {orders.map((order, index) => (
                  <motion.div
                    key={order.orderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="relative overflow-hidden shadow-2xl border-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl" />
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-purple-400/30 to-transparent rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16" />
                      <div className="relative p-4 sm:p-6 lg:p-8">
                        {/* Order Header */}
                        <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                              >
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </motion.div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                                  Order #{order.orderId}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600 truncate">
                                    {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                              {/* Status Badge */}
                              <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-white text-xs sm:text-sm font-semibold shadow-lg bg-gradient-to-r ${getStatusColor(order.status)} flex items-center justify-center space-x-1.5 sm:space-x-2 w-fit`}
                              >
                                {getStatusIcon(order.status)}
                                <span className="whitespace-nowrap">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                              </motion.div>

                              {/* Expand/Collapse Button */}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl shadow-lg font-semibold flex items-center justify-center space-x-1.5 sm:space-x-2 text-sm sm:text-base w-full sm:w-auto min-h-[44px] touch-manipulation"
                              >
                                {expandedOrderId === order.orderId ? (
                                  <>
                                    <EyeOff className="w-4 h-4 flex-shrink-0" />
                                    <span className="whitespace-nowrap">Hide Details</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 flex-shrink-0" />
                                    <span className="whitespace-nowrap">View Details</span>
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl border border-green-200/50"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Payment Status</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate">{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border border-blue-200/50"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Items</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-xl border border-purple-200/50 sm:col-span-2 lg:col-span-1"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Amount</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                                  {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            className="bg-gradient-to-r from-orange-50 to-red-50 p-3 sm:p-4 rounded-xl border border-orange-200/50 sm:col-span-2 lg:col-span-1"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Delivery Status</p>
                                <p className={`text-sm sm:text-base lg:text-lg font-bold ${order.delivered ? 'text-green-600' : 'text-orange-600'}`}>
                                  {order.delivered ? 'Delivered' : 'In Transit'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Items Preview */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                          className="mb-4 sm:mb-6"
                        >
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600 flex-shrink-0" />
                            Order Items
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {order.items.map((item, itemIndex) => (
                              <motion.div
                                key={item.productId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/20 shadow-sm hover:shadow-lg transition-all duration-300"
                              >
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <motion.img
                                    whileHover={{ scale: 1.1 }}
                                    src={item.image || productImages[item.productId] || '/logo.png'}
                                    alt={item.productName}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg shadow-md flex-shrink-0"
                                    onError={(e) => (e.currentTarget.src = '/logo.png')}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{item.productName}</p>
                                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                    <p className="text-xs sm:text-sm font-bold text-purple-600 truncate">{formatCurrency(item.price, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Expandable Details */}
                        <AnimatePresence>
                          {expandedOrderId === order.orderId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-200/50 pt-4 sm:pt-6"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Shipping Address */}
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.1 }}
                                  className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-indigo-200/50"
                                >
                                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <h5 className="text-base sm:text-lg font-bold text-gray-900">Shipping Address</h5>
                                  </div>
                                  <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                                    <p className="font-medium">{order.customerName}</p>
                                    <p>{order.shippingAddress?.street}</p>
                                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                                    <p>{order.shippingAddress?.country}</p>
                                    <p className="text-purple-600 font-medium">{order.customerPhone}</p>
                                  </div>
                                </motion.div>

                                {/* Order Details */}
                                <motion.div
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.2 }}
                                  className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 sm:p-6 rounded-xl border border-emerald-200/50"
                                >
                                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <h5 className="text-base sm:text-lg font-bold text-gray-900">Order Details</h5>
                                  </div>
                                  <div className="space-y-2 sm:space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                      <span className="text-xs sm:text-sm text-gray-600 font-medium">Order ID:</span>
                                      <span className="font-mono text-xs sm:text-sm font-bold text-gray-900 break-all">{order.orderId}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                      <span className="text-xs sm:text-sm text-gray-600 font-medium">Payment Method:</span>
                                      <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{order.paymentMethod}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                      <span className="text-xs sm:text-sm text-gray-600 font-medium">Order Date:</span>
                                      <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                                        {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                    {order.notes && (
                                      <div className="mt-3 sm:mt-4">
                                        <span className="text-xs sm:text-sm text-gray-600 block mb-2 font-medium">Order Notes:</span>
                                        <p className="text-xs sm:text-sm text-gray-700 bg-white/50 p-2 sm:p-3 rounded-lg">{order.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrderHistory;
