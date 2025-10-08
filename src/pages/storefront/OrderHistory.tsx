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
    let timeout: NodeJS.Timeout;
    if (business?.id && user?.email) {
      loadOrders();
      // Timeout fallback: show error if loading takes too long
      timeout = setTimeout(() => {
        setLoading(false);
        if (orders.length === 0) {
          setOrders([]);
        }
      }, 8000);
    }
    return () => clearTimeout(timeout);
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
        <div className="space-y-6">
          {orders.map(order => (
            <Card key={order.orderId} className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">Order #{order.orderId}</span>
                <span className="text-sm text-gray-500">{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Status:</span> {order.status}
              </div>
              <div className="mb-2">
                <span className="font-medium">Total:</span> {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
              </div>
              <div className="mb-2">
                <span className="font-medium">Payment Status:</span> {order.paymentStatus}
              </div>
              <div>
                <span className="font-medium">Items:</span>
                <ul className="list-disc ml-6">
                  {order.items.map(item => (
                    <li key={item.productId}>{item.productName} x {item.quantity}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
