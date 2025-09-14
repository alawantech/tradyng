import React, { useState } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { mockOrders, mockProducts } from '../../data/mockData';
import { OrderReceipt } from '../../components/ui/OrderReceipt';
import toast from 'react-hot-toast';

export const Orders: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    productId: '',
    quantity: 1
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    // Here you would add logic to save the order to backend or state
    toast.success('Order created successfully!');
    setOrderData({ customerName: '', customerEmail: '', productId: '', quantity: 1 });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'Processing':
        return <Package className="h-4 w-4" />;
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const [showReceipt, setShowReceipt] = useState<string | null>(null);

  const handleViewOrder = (orderId: string) => {
    setShowReceipt(orderId);
  };

  const handleApproveOrder = (orderId: string) => {
    toast.success(`Order ${orderId} approved successfully`);
  };

  const getOrderById = (id: string) => mockOrders.find(o => o.id === id);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          Create New Order
        </Button>
      </div>

      {/* Modal for creating new order */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Card className="p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Order</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <input type="hidden" name="customerId" value={''} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  name="customerName"
                  value={orderData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <input
                  name="customerEmail"
                  type="email"
                  value={orderData.customerEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  name="productId"
                  value={orderData.productId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a product</option>
                  {mockProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${product.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  value={orderData.quantity}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Order</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {mockOrders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.id}
                  </h3>
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-gray-600">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Items</p>
                    {order.items.map((item, index) => (
                      <p key={index} className="text-gray-900">
                        {item.quantity}x {item.productName}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-500">Total & Payment</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                    <p className="text-gray-600">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewOrder(order.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Receipt
                </Button>
                {order.status === 'Pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveOrder(order.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
            {/* Receipt Modal */}
            {showReceipt === order.id && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
                  <OrderReceipt
                    orderId={order.id}
                    customerName={order.customerName}
                    customerEmail={order.customerEmail}
                    items={order.items}
                    total={order.total}
                    paymentMethod={order.paymentMethod}
                    createdAt={order.createdAt}
                  />
                  <Button variant="outline" className="absolute top-4 right-4" onClick={() => setShowReceipt(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};