import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService } from '../../services/order';
import { ProductService } from '../../services/product';
import { CustomerService } from '../../services/customer';
import { Order } from '../../services/order';
import { Product } from '../../services/product';
import { Customer } from '../../services/customer';

export const Analytics: React.FC = () => {
  const { business } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!business?.id) return;
      setLoading(true);
      const [ordersData, productsData, customersData] = await Promise.all([
        OrderService.getOrdersByBusinessId(business.id),
        ProductService.getProductsByBusinessId(business.id),
        CustomerService.getCustomersByBusinessId(business.id)
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
      setLoading(false);
    }
    fetchData();
  }, [business]);

  function getOrderDate(createdAt: any): Date {
    if (createdAt instanceof Date) return createdAt;
    if (createdAt?.toDate) return createdAt.toDate();
    if (typeof createdAt === 'string' || typeof createdAt === 'number') return new Date(createdAt);
    return new Date();
  }

  // --- Filter orders by period ---
  let filteredOrders = orders;
  if (period === 'month' && selectedMonth) {
    filteredOrders = orders.filter((o: Order) => {
      const created = getOrderDate(o.createdAt);
      const monthStr = created.toISOString().slice(0, 7);
      return monthStr === selectedMonth;
    });
  }
  if (period === 'year' && selectedYear) {
    filteredOrders = orders.filter((o: Order) => {
      const created = getOrderDate(o.createdAt);
      return created.getFullYear().toString() === selectedYear;
    });
  }
  // For 'all', no filter needed

  // --- Stats ---
  const totalRevenue = filteredOrders.reduce((sum: number, o: any) => sum + (typeof o.total === 'number' ? o.total : 0), 0);
  const totalOrders = filteredOrders.length;
  const activeCustomers = new Set(filteredOrders.map((o: any) => o.customerEmail)).size;
  const paidOrders = filteredOrders.filter((o: any) => o.status === 'paid' || o.paymentStatus === 'completed').length;
  const pendingOrders = filteredOrders.filter((o: any) => o.status === 'pending').length;
  const conversionRate = totalOrders && customers.length ? ((totalOrders / customers.length) * 100).toFixed(1) + '%' : '0%';

  // --- Chart Data ---
  // Group by day for month, by month for year, by day for all
  let chartData: { name: string; sales: number; revenue: number }[] = [];
  if (period === 'month' && selectedMonth) {
    // Group by day in selected month
    const dayMap: Record<string, { sales: number; revenue: number }> = {};
    filteredOrders.forEach((o: Order) => {
      const created = getOrderDate(o.createdAt);
      const dayStr = created.toISOString().slice(0, 10);
      if (!dayMap[dayStr]) dayMap[dayStr] = { sales: 0, revenue: 0 };
      dayMap[dayStr].sales += o.items.reduce((sum, item) => sum + item.quantity, 0);
      dayMap[dayStr].revenue += o.total;
    });
    chartData = Object.entries(dayMap).map(([name, data]) => ({ name, ...data }));
  }
  else if (period === 'year' && selectedYear) {
    // Group by month in selected year
    const monthMap: Record<string, { sales: number; revenue: number }> = {};
    filteredOrders.forEach((o: Order) => {
      const created = getOrderDate(o.createdAt);
      const monthStr = created.toISOString().slice(0, 7);
      if (!monthMap[monthStr]) monthMap[monthStr] = { sales: 0, revenue: 0 };
      monthMap[monthStr].sales += o.items.reduce((sum, item) => sum + item.quantity, 0);
      monthMap[monthStr].revenue += o.total;
    });
    chartData = Object.entries(monthMap).map(([name, data]) => ({ name, ...data }));
  }
  else {
    // Group by day for all time
    const dayMap: Record<string, { sales: number; revenue: number }> = {};
    filteredOrders.forEach((o: Order) => {
      const created = getOrderDate(o.createdAt);
      const dayStr = created.toISOString().slice(0, 10);
      if (!dayMap[dayStr]) dayMap[dayStr] = { sales: 0, revenue: 0 };
      dayMap[dayStr].sales += o.items.reduce((sum, item) => sum + item.quantity, 0);
      dayMap[dayStr].revenue += o.total;
    });
    chartData = Object.entries(dayMap).map(([name, data]) => ({ name, ...data }));
  }

  // --- Top Products ---
  const productTotals: Record<string, { name: string; sold: number }> = {};
  filteredOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      if (!productTotals[item.productId]) {
        productTotals[item.productId] = { name: item.productName, sold: 0 };
      }
      productTotals[item.productId].sold += item.quantity;
    });
  });
  const topProducts = Object.values(productTotals).sort((a, b) => b.sold - a.sold).slice(0, 3);

  // --- Top Customers ---
  const customerTotals: Record<string, { name: string; spent: number }> = {};
  filteredOrders.forEach((o: any) => {
    if (!customerTotals[o.customerEmail]) {
      customerTotals[o.customerEmail] = { name: o.customerName, spent: 0 };
    }
    customerTotals[o.customerEmail].spent += o.total;
  });
  const topCustomers = Object.entries(customerTotals)
    .map(([email, data]) => ({ name: data.name, spent: data.spent }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  // --- Stats Cards ---
  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue, business?.settings?.currency || DEFAULT_CURRENCY),
      change: '',
      changeType: 'positive',
      icon: DollarSign
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      change: '',
      changeType: 'positive',
      icon: ShoppingCart
    },
    {
      title: 'Active Customers',
      value: activeCustomers,
      change: '',
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'Conversion Rate',
      value: conversionRate,
      change: '',
      changeType: 'positive',
      icon: TrendingUp
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your store's performance</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={period}
            onChange={e => { setPeriod(e.target.value as any); setSelectedMonth(''); setSelectedYear(''); }}
          >
            <option value="all">All Time</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          {period === 'month' && (
            <input
              type="month"
              className="border rounded px-3 py-2 text-sm"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
            />
          )}
          {period === 'year' && (
            <input
              type="number"
              className="border rounded px-3 py-2 text-sm w-24"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              min="2020"
              max={new Date().getFullYear()}
              placeholder="Year"
            />
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
              <ul className="space-y-2">
                {topProducts.map(p => (
                  <li key={p.name} className="flex justify-between items-center">
                    <span className="font-medium text-blue-700">{p.name}</span>
                    <span className="text-sm text-gray-600">{p.sold} sold</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
              <ul className="space-y-2">
                {topCustomers.map(c => (
                  <li key={c.name} className="flex justify-between items-center">
                    <span className="font-medium text-indigo-700">{c.name}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(c.spent, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};