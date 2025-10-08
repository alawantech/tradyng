import React, { useEffect, useState } from 'react';
import { useStore } from './StorefrontLayout';
import { OrderService, Order } from '../../services/order';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

const OrderHistory: React.FC = () => {
  const { business } = useStore();
  const { customer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (business?.id && customer?.email) {
      loadOrders();
    }
  }, [business?.id, customer?.email]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await OrderService.getOrdersByBusinessId(business.id);
      const customerOrders = allOrders.filter(o => o.customerEmail === customer.email);
      // Sort by most recent first
      customerOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(customerOrders);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <Card key={order.orderId} className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">Order #{order.orderId}</span>
                <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
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
