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

const OrderHistory: React.FC = () => {
  const { business } = useStore();
  const { user, isLoading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (business?.id && user?.email) {
      loadOrders();
    }
  }, [business?.id, user?.email]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!business?.id) {
        setError('Business ID not found.');
        setLoading(false);
        return;
      }
      if (!user?.email) {
        setError('User email not found. Please sign in again.');
        setLoading(false);
        return;
      }
      const allOrders = await OrderService.getOrdersByBusinessId(business.id);
      const customerOrders = allOrders.filter(o => o.customerEmail === user?.email);
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
      case 'shipped': return 'from-blue-400 to-indigo-500';
      case 'delivered': return 'from-emerald-400 to-green-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CreditCard className="w-4 h-4" />;
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
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex-shrink-0"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <History className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2"
                    >
                      Order History
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="text-gray-700 text-lg font-medium"
                    >
                      Track your purchases and order status
                    </motion.p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {authLoading || loading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-16"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Orders</h3>
                <p className="text-gray-600">Please wait while we fetch your order history...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h3>
              <p className="text-red-600 font-medium mb-6">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadOrders}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <Star className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                No Orders Yet
              </h3>
              <p className="text-gray-600 mb-8 text-lg">Start shopping to see your order history here!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl font-semibold text-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2 inline" />
                Start Shopping
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-6">
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
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-400/30 to-transparent rounded-full -translate-y-16 translate-x-16" />
                      <div className="relative p-8">
                        {/* Order Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
                          <div className="flex items-center space-x-4">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                            >
                              <Package className="w-6 h-6 text-white" />
                            </motion.div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                Order #{order.orderId}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
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

                          <div className="flex items-center space-x-4">
                            {/* Status Badge */}
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className={`px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg bg-gradient-to-r ${getStatusColor(order.status)} flex items-center space-x-2`}
                            >
                              {getStatusIcon(order.status)}
                              <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </motion.div>

                            {/* Expand/Collapse Button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-lg font-semibold flex items-center space-x-2"
                            >
                              {expandedOrderId === order.orderId ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  <span>View Details</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 font-medium">Payment Status</p>
                                <p className="text-lg font-bold text-gray-900">{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 font-medium">Items</p>
                                <p className="text-lg font-bold text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200/50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 font-medium">Total Amount</p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                  {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Items Preview */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                          className="mb-6"
                        >
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" />
                            Order Items
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {order.items.map((item, itemIndex) => (
                              <motion.div
                                key={item.productId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm hover:shadow-lg transition-all duration-300"
                              >
                                <div className="flex items-center space-x-3">
                                  <motion.img
                                    whileHover={{ scale: 1.1 }}
                                    src={item.image || productImages[item.productId] || '/logo.png'}
                                    alt={item.productName}
                                    className="w-12 h-12 object-cover rounded-lg shadow-md"
                                    onError={(e) => (e.currentTarget.src = '/logo.png')}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{item.productName}</p>
                                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                    <p className="text-sm font-bold text-purple-600">{formatCurrency(item.price, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
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
                              className="border-t border-gray-200/50 pt-6"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Shipping Address */}
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.1 }}
                                  className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200/50"
                                >
                                  <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                                      <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <h5 className="text-lg font-bold text-gray-900">Shipping Address</h5>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-700">
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
                                  className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200/50"
                                >
                                  <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <h5 className="text-lg font-bold text-gray-900">Order Details</h5>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Order ID:</span>
                                      <span className="font-mono text-sm font-bold text-gray-900">{order.orderId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Payment Method:</span>
                                      <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Order Date:</span>
                                      <span className="font-semibold text-gray-900">
                                        {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                    {order.notes && (
                                      <div className="mt-4">
                                        <span className="text-sm text-gray-600 block mb-2">Order Notes:</span>
                                        <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">{order.notes}</p>
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
