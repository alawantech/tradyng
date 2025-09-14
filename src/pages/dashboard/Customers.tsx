import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, Calendar, Plus, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CustomerService, Customer } from '../../services/customer';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const Customers: React.FC = () => {
  const { business } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business?.id) {
      loadCustomers();
    }
  }, [business]);

  const loadCustomers = async () => {
    if (!business?.id) return;
    
    try {
      setLoading(true);
      const businessCustomers = await CustomerService.getCustomersByBusinessId(business.id);
      setCustomers(businessCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };
  const handleContactCustomer = (customerId: string) => {
    toast.success(`Contact customer ${customerId}`);
  };

  const handleViewCustomer = (customerId: string) => {
    toast.success(`View customer ${customerId} details`);
  };

  const handleAddCustomer = () => {
    toast.success('Add customer functionality coming soon');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-600 mb-6">
            Your customer list is empty. Start by taking orders or manually add customers.
          </p>
          <Button onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Customer
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
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
                {customer.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {customer.createdAt?.toDate().toLocaleDateString() || 'N/A'}</span>
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
                  onClick={() => handleViewCustomer(customer.id!)}
                  className="flex-1"
                >
                  View Profile
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleContactCustomer(customer.id!)}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};