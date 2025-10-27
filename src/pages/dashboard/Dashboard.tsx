import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Calendar,
  Activity
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService } from '../../services/order';
import { ProductService } from '../../services/product';
import { CustomerService } from '../../services/customer';
import { Order } from '../../services/order';
import { Product } from '../../services/product';
import { Customer } from '../../services/customer';

export const Dashboard: React.FC = () => {
  const { business } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!business?.id) return;
      setLoading(true);
      try {
        const [ordersData, productsData, customersData] = await Promise.all([
          OrderService.getOrdersByBusinessId(business.id),
          ProductService.getProductsByBusinessId(business.id),
          CustomerService.getCustomersByBusinessId(business.id)
        ]);
        setOrders(ordersData);
        setProducts(productsData);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [business]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalProducts = products.length;

  // Calculate growth metrics (comparing to last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentOrders = orders.filter(order => {
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt as any);
    return orderDate >= thirtyDaysAgo;
  });

  const previousOrders = orders.filter(order => {
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt as any);
    return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
  });

  const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const ordersGrowth = previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0;

  // Recent orders (last 5)
  const recentOrdersList = orders
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Low stock products (assuming stock < 10 is low)
  const lowStockProducts = products.filter(product => (product.stock || 0) < 10);

  // Pending orders
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'approved' || order.status === 'delivered').length;

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    trendLabel?: string;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon: Icon, trend, trendLabel, color, bgColor }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center text-sm">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-gray-500 ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${bgColor}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 pt-20 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">Welcome back! Here's your business overview.</p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link to="/dashboard/products" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
            <Link to="/dashboard/analytics" className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <Activity className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue, business?.settings?.currency || DEFAULT_CURRENCY)}
            icon={DollarSign}
            trend={revenueGrowth}
            trendLabel="vs last month"
            color="text-green-600"
            bgColor="bg-green-100"
          />

          <MetricCard
            title="Total Orders"
            value={totalOrders}
            icon={ShoppingCart}
            trend={ordersGrowth}
            trendLabel="vs last month"
            color="text-blue-600"
            bgColor="bg-blue-100"
          />

          <MetricCard
            title="Active Customers"
            value={totalCustomers}
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />

          <MetricCard
            title="Product Catalog"
            value={totalProducts}
            icon={Package}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-orange-600">{pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{completedOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">{totalOrders}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue This Month</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(recentRevenue, business?.settings?.currency || DEFAULT_CURRENCY)}
            </div>
            <div className="flex items-center text-sm">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(revenueGrowth).toFixed(1)}% from last month
              </span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {lowStockProducts.length}
            </div>
            <p className="text-sm text-gray-600">
              Products low on stock
            </p>
            {lowStockProducts.length > 0 && (
              <Link to="/dashboard/products" className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md mt-3 transition-colors">
                Manage Inventory
              </Link>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="p-6 border-0 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/dashboard/orders" className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                View All <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrdersList.length > 0 ? (
                recentOrdersList.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.orderId || order.id?.slice(-6)}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(order.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No orders yet</p>
                  <p className="text-sm text-gray-400">Your recent orders will appear here</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions & Insights */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 border-0 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/dashboard/products" className="h-20 flex flex-col items-center justify-center border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-700 rounded-lg transition-colors">
                  <Plus className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">Add Product</span>
                </Link>
                <Link to="/dashboard/orders" className="h-20 flex flex-col items-center justify-center border border-gray-300 bg-white hover:bg-green-50 hover:border-green-200 text-gray-700 rounded-lg transition-colors">
                  <ShoppingCart className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-sm font-medium">View Orders</span>
                </Link>
                <Link to="/dashboard/customers" className="h-20 flex flex-col items-center justify-center border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-200 text-gray-700 rounded-lg transition-colors">
                  <Users className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Manage Customers</span>
                </Link>
                <Link to="/dashboard/analytics" className="h-20 flex flex-col items-center justify-center border border-gray-300 bg-white hover:bg-orange-50 hover:border-orange-200 text-gray-700 rounded-lg transition-colors">
                  <Activity className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-sm font-medium">View Analytics</span>
                </Link>
              </div>
            </Card>

            {/* Business Insights */}
            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Revenue Growth</p>
                    <p className="text-sm text-gray-600">
                      {revenueGrowth >= 0 ? 'Up' : 'Down'} {Math.abs(revenueGrowth).toFixed(1)}% this month
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Customer Base</p>
                    <p className="text-sm text-gray-600">
                      {totalCustomers} registered customers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Product Inventory</p>
                    <p className="text-sm text-gray-600">
                      {totalProducts} products in catalog
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};