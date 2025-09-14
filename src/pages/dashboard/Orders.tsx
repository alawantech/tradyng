import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Package, ShoppingCart, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { OrderService, Order } from '../../services/order';
import { ProductService, Product } from '../../services/product';
import { useAuth } from '../../hooks/useAuth';
import { OrderReceipt } from '../../components/ui/OrderReceipt';
import toast from 'react-hot-toast';

export const Orders: React.FC = () => {
  const { business } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    productId: '',
    quantity: 1
  });

  useEffect(() => {
    if (business?.id) {
      loadData();
    }
  }, [business]);

  const loadData = async () => {
    if (!business?.id) return;

    try {
      const [ordersData, productsData] = await Promise.all([
        OrderService.getOrdersByBusinessId(business.id),
        ProductService.getProductsByBusinessId(business.id)
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    try {
      const selectedProduct = products.find(p => p.id === orderData.productId);
      if (!selectedProduct) {
        toast.error('Please select a product');
        return;
      }

      const total = selectedProduct.price * orderData.quantity;
      
      await OrderService.createOrder(business.id, {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        items: [{
          productId: orderData.productId,
          productName: selectedProduct.name,
          quantity: orderData.quantity,
          price: selectedProduct.price,
          total: total
        }],
        subtotal: total,
        tax: 0,
        shipping: 0,
        total: total,
        status: 'pending',
        paymentMethod: 'manual',
        paymentStatus: 'pending'
      });

      setShowModal(false);
      toast.success('Order created successfully!');
      setOrderData({ customerName: '', customerEmail: '', productId: '', quantity: 1 });
      loadData(); // Reload orders
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
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

  const handleViewOrder = (orderId: string) => {
    setShowReceipt(orderId);
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!business?.id) return;
    
    try {
      await OrderService.updateOrderStatus(business.id, orderId, 'processing');
      toast.success(`Order ${orderId} approved successfully`);
      loadData(); // Reload orders
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    }
  };

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
                  {products.map((product) => (
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
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">
              Your customers haven't placed any orders yet. Create a manual order or wait for customers to make purchases.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Order
            </Button>
          </Card>
        ) : (
          orders.map((order) => (
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
                  onClick={() => order.id && handleViewOrder(order.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Receipt
                </Button>
                {order.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => order.id && handleApproveOrder(order.id)}
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
                    createdAt={order.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                  />
                  <Button variant="outline" className="absolute top-4 right-4" onClick={() => setShowReceipt(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Card>
          ))
        )}
      </div>
    </div>
  );
};