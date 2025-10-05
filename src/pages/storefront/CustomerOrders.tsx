import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useStore } from './StorefrontLayout';
import { CustomerService, CustomerOrderHistory } from '../../services/customer';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useCustomerAuth();
  const { business } = useStore();
  const [orders, setOrders] = useState<CustomerOrderHistory[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CustomerOrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user && business?.id) {
      loadOrders();
    }
  }, [user, business]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    if (!user || !business?.id) return;

    setIsLoading(true);
    try {
      const orderHistory = await CustomerService.getOrderHistory(user.uid, business.id);
      setOrders(orderHistory);
    } catch (error) {
      console.error('Error loading orders:', error);
      // Set empty array as fallback
      setOrders([]);
      // Show user-friendly error message
      // toast.error('Could not load order history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term (order ID)
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your order history.</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
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
            <Link 
              to="/profile" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Profile
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
            <p className="text-gray-600 mt-1">
              {business ? `Your orders from ${business.name}` : 'Your order history'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : business 
                  ? `You haven't placed any orders with ${business.name} yet.`
                  : 'You haven\'t placed any orders yet.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => window.location.href = '/'}>
                Start Shopping
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 space-y-3 lg:space-y-2">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.orderId}
                          </h3>
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 sm:mt-0">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Items:</span>
                          <span className="ml-2 text-gray-600">
                            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Total:</span>
                          <span className="ml-2 text-gray-900 font-semibold">
                            {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                          </span>
                        </div>
                        
                        {order.businessName && (
                          <div>
                            <span className="font-medium text-gray-700">Store:</span>
                            <span className="ml-2 text-gray-600">{order.businessName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                      {order.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Cancel Order
                        </Button>
                      )}
                      
                      {order.status === 'delivered' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Reorder
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredOrders.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{filteredOrders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {filteredOrders.filter(o => o.status === 'delivered').length}
                </p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredOrders.filter(o => ['pending', 'approved', 'processing', 'shipped'].includes(o.status)).length}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    filteredOrders.reduce((sum, order) => sum + order.total, 0),
                    business?.settings?.currency || DEFAULT_CURRENCY
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};