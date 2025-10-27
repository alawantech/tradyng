import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockProducts } from '../../data/mockData';
import toast from 'react-hot-toast';

export const AdminOrders: React.FC = () => {
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
    toast.success('Order created successfully!');
    setOrderData({ customerName: '', customerEmail: '', productId: '', quantity: 1 });
  };

  return (
    <div className="p-6 pt-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <Button onClick={() => setShowModal(true)} className="mb-6">Create New Order</Button>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Card className="p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Order</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <Input
                label="Customer Name"
                name="customerName"
                value={orderData.customerName}
                onChange={handleChange}
                required
              />
              <Input
                label="Customer Email"
                name="customerEmail"
                type="email"
                value={orderData.customerEmail}
                onChange={handleChange}
                required
              />
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
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min={1}
                value={orderData.quantity}
                onChange={handleChange}
                required
              />
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
      <Card className="p-6">Order management coming soon.</Card>
    </div>
  );
};
