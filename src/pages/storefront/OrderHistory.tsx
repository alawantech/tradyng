import React, { useEffect, useState } from 'react';
import { useStore } from './StorefrontLayout';
import { OrderService, Order } from '../../services/order';
import { useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Card } from '../../components/ui/Card';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

const OrderHistory: React.FC = () => {
  const { business } = useStore();
  const { user, isLoading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

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
    } catch (err: any) {
      setError('Failed to load orders: ' + (err?.message || String(err)));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      {authLoading || loading ? (
        <div>Loading orders...</div>
      ) : error ? (
        <div className="text-red-600 font-semibold">{error}</div>
      ) : orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <div className="space-y-8">
          {orders.map(order => (
            <Card key={order.orderId} className="p-6 border border-gray-200 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <div>
                  <span className="font-bold text-lg">Order #{order.orderId}</span>
                  <span className="ml-3 px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: order.status === 'pending' ? '#fef3c7' : order.status === 'paid' ? '#d1fae5' : order.status === 'shipped' ? '#bfdbfe' : order.status === 'delivered' ? '#bbf7d0' : '#f3f4f6',
                      color: order.status === 'pending' ? '#b45309' : order.status === 'paid' ? '#065f46' : order.status === 'shipped' ? '#1e40af' : order.status === 'delivered' ? '#166534' : '#374151'
                    }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-6 items-center">
                <div className="font-medium text-gray-700">Total: <span className="font-bold text-blue-600">{formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}</span></div>
                <div className="font-medium text-gray-700">Payment: <span className="font-bold text-green-600">{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</span></div>
              </div>
              <div className="mt-4">
                <span className="font-semibold text-gray-900 mb-2 block">Items:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={item.image || '/logo.png'}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={e => (e.currentTarget.src = '/logo.png')}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                        <div className="text-sm text-gray-700">{formatCurrency(item.price, business?.settings?.currency || DEFAULT_CURRENCY)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
