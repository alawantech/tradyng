import React from 'react';
import { Eye, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { mockOrders } from '../../data/mockData';
import toast from 'react-hot-toast';

export const Orders: React.FC = () => {
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
    toast.success(`View order ${orderId} details`);
  };

  const handleApproveOrder = (orderId: string) => {
    toast.success(`Order ${orderId} approved successfully`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
      </div>

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
                  View Details
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
          </Card>
        ))}
      </div>
    </div>
  );
};