import React from 'react';
import { Mail, Phone, User, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { mockCustomers } from '../../data/mockData';
import toast from 'react-hot-toast';

export const Customers: React.FC = () => {
  const handleContactCustomer = (customerId: string) => {
    toast.success(`Contact customer ${customerId}`);
  };

  const handleViewCustomer = (customerId: string) => {
    toast.success(`View customer ${customerId} details`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCustomers.map((customer) => (
          <Card key={customer.id} className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {customer.name}
                </h3>
                <p className="text-gray-600">{customer.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Joined {customer.joinedAt}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {customer.totalOrders}
                </div>
                <div className="text-sm text-gray-600">Orders</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${customer.totalSpent.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Spent</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewCustomer(customer.id)}
                className="flex-1"
              >
                View Profile
              </Button>
              <Button
                size="sm"
                onClick={() => handleContactCustomer(customer.id)}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Contact
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};