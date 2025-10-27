import React, { useState, useEffect } from 'react';
import { Mail, Plus, Users, X, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomerService, Customer } from '../../services/customer';
import { Timestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const Customers: React.FC = () => {
  // Search state for customers
  const [searchTerm, setSearchTerm] = useState('');
  const { business } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    notes: ''
  });
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewingAddresses, setViewingAddresses] = useState<any[]>([]);
  const [viewingLoading, setViewingLoading] = useState(false);
  // Chat modal state - removed

  useEffect(() => {
    if (business?.id) {
      loadCustomers();
    }
  }, [business]);

  // Auto-refresh customer data every 10 seconds to catch updates from other pages
  useEffect(() => {
    if (!business?.id) return;
    
    const interval = setInterval(() => {
      loadCustomers();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [business?.id]);

  const loadCustomers = async () => {
    if (!business?.id) return;
    
    try {
      setLoading(true);
      const businessCustomers = await CustomerService.getCustomersByBusinessId(business.id);
      setCustomers(businessCustomers);

      // Fetch addresses for all customers
      const addressesMap: Record<string, any[]> = {};
      await Promise.all(
        businessCustomers.map(async (customer) => {
          try {
            const addresses = await CustomerService.getAddresses(customer.id!);
            addressesMap[customer.id!] = addresses || [];
          } catch (error) {
            // If addresses can't be fetched, just set empty array
            addressesMap[customer.id!] = [];
          }
        })
      );
      setCustomerAddresses(addressesMap);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customerId: string) => {
    // Fetch and display customer details (phone, address, stored addresses)
    (async () => {
      if (!business?.id) {
        toast.error('No business selected');
        return;
      }
      try {
        setViewingLoading(true);
        const customer = await CustomerService.getCustomerById(business.id, customerId);
        setViewingCustomer(customer);

        // Try to fetch saved addresses (if any)
        try {
          const addresses = await CustomerService.getAddresses(customerId);
          setViewingAddresses(addresses || []);
        } catch (addrErr) {
          // Not critical - some customers may not have addresses in the addresses collection
          setViewingAddresses([]);
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
        toast.error('Failed to load customer details');
      } finally {
        setViewingLoading(false);
      }
    })();
  };

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      notes: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    // Validate required fields
    if (!customerForm.name.trim() || !customerForm.email.trim()) {
      toast.error('Please fill in required fields (name and email)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setCreating(true);

      // Check if customer with this email already exists
      const existingCustomer = await CustomerService.getCustomerByEmail(business.id, customerForm.email);
      if (existingCustomer) {
        toast.error('A customer with this email already exists');
        return;
      }

      const customerData = {
        name: customerForm.name.trim(),
        email: customerForm.email.trim().toLowerCase(),
        phone: customerForm.phone.trim(),
        address: customerForm.street.trim() ? {
          street: customerForm.street.trim(),
          city: customerForm.city.trim(),
          state: customerForm.state.trim(),
          country: customerForm.country.trim() || 'Nigeria'
        } : undefined,
        totalOrders: 0,
        totalSpent: 0,
        notes: customerForm.notes.trim(),
        tags: []
      };

      await CustomerService.createCustomer(business.id, customerData);
      toast.success('Customer added successfully!');
      handleCloseModal();
      loadCustomers(); // Reload customers
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to add customer');
    } finally {
      setCreating(false);
    }
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
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={loadCustomers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
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
        <>
          <div className="mb-4">
            <Card className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 shadow rounded-xl mb-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-700">{customers.length}</span>
                <span className="text-sm text-gray-600">Total Customers</span>
              </div>
            </Card>
            <div className="flex items-center gap-4">
              <input
                type="text"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Search by name, email, or phone number"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ minWidth: 220 }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Spent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers
                .filter(customer => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  
                  // Check basic customer fields
                  if (
                    (customer.name && customer.name.toLowerCase().includes(term)) ||
                    (customer.email && customer.email.toLowerCase().includes(term)) ||
                    (customer.phone && customer.phone.toLowerCase().includes(term))
                  ) {
                    return true;
                  }
                  
                  // Check phone numbers from saved addresses
                  const savedAddresses = customerAddresses[customer.id!] || [];
                  const hasMatchingPhone = savedAddresses.some(addr => 
                    addr.phone && addr.phone.toLowerCase().includes(term)
                  );
                  
                  return hasMatchingPhone;
                })
                .map((customer) => (
                <tr key={customer.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{customer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(() => {
                      // Show customer phone if exists
                      if (customer.phone) {
                        return customer.phone;
                      }
                      
                      // Show phone from first saved address if no customer phone
                      const savedAddresses = customerAddresses[customer.id!] || [];
                      if (savedAddresses.length > 0) {
                        const addr = savedAddresses.find(a => a.phone) || savedAddresses[0];
                        if (addr.phone) {
                          return <span className="text-blue-600">{addr.phone}</span>;
                        }
                      }
                      
                      // No phone number found
                      return '—';
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(() => {
                      // Show primary address if exists
                      if (customer.address) {
                        return (
                          <span>
                            {customer.address.street ? customer.address.street + ', ' : ''}
                            {customer.address.city ? customer.address.city + ', ' : ''}
                            {customer.address.state ? customer.address.state + ', ' : ''}
                            {customer.address.country || ''}
                          </span>
                        );
                      }
                      
                      // Show first saved address if no primary address
                      const savedAddresses = customerAddresses[customer.id!] || [];
                      if (savedAddresses.length > 0) {
                        const addr = savedAddresses[0];
                        return (
                          <span className="text-blue-600">
                            {addr.street}{addr.city ? ', ' + addr.city : ''}{addr.state ? ', ' + addr.state : ''}{addr.country ? ', ' + addr.country : ''}
                            {savedAddresses.length > 1 && ` (+${savedAddresses.length - 1} more)`}
                          </span>
                        );
                      }
                      
                      // No addresses
                      return '—';
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-bold">{customer.totalOrders}</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-bold">${(customer.totalSpent || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      size="sm"
                      onClick={() => handleViewCustomer(customer.id!)}
                      className="flex-1"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
  </div>
  </>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Add New Customer</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    name="name"
                    value={customerForm.name}
                    onChange={handleFormChange}
                    placeholder="Chioma Adekunle"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={customerForm.email}
                    onChange={handleFormChange}
                    placeholder="chioma@yahoo.com"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    value={customerForm.phone}
                    onChange={handleFormChange}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <Input
                      name="street"
                      value={customerForm.street}
                      onChange={handleFormChange}
                      placeholder="Plot 42 Allen Avenue, Ikeja"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City (Optional)
                    </label>
                    <Input
                      name="city"
                      value={customerForm.city}
                      onChange={handleFormChange}
                      placeholder="Abuja"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State (Optional)
                    </label>
                    <Input
                      name="state"
                      value={customerForm.state}
                      onChange={handleFormChange}
                      placeholder="FCT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <Input
                      name="country"
                      value={customerForm.country}
                      onChange={handleFormChange}
                      placeholder="Nigeria"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={customerForm.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this customer..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                >
                  {creating ? 'Adding...' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Customer Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
              <div>
                <button
                  onClick={() => { setViewingCustomer(null); setViewingAddresses([]); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {viewingLoading ? (
                <div className="text-center text-gray-600">Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Name</h3>
                      <div className="text-gray-900">{viewingCustomer.name}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Email</h3>
                      <div className="text-gray-900">{viewingCustomer.email}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Phone</h3>
                      <div className="text-gray-900">{viewingCustomer.phone || '—'}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Joined</h3>
                      <div className="text-gray-900">{viewingCustomer.createdAt?.toDate ? viewingCustomer.createdAt.toDate().toLocaleDateString() : viewingCustomer.createdAt?.toLocaleDateString?.() || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mt-2">Primary Address</h3>
                    {viewingCustomer.address ? (
                      <div className="text-gray-900 mt-1">
                        {viewingCustomer.address.street ? viewingCustomer.address.street + ', ' : ''}
                        {viewingCustomer.address.city ? viewingCustomer.address.city + ', ' : ''}
                        {viewingCustomer.address.state ? viewingCustomer.address.state + ', ' : ''}
                        {viewingCustomer.address.country || ''}
                      </div>
                    ) : (
                      <div className="text-gray-500">No primary address set</div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mt-3">Saved Addresses</h3>
                    {viewingAddresses.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {viewingAddresses.map((addr, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded border">
                            <div className="font-medium text-gray-900">{addr.label || `Address ${idx + 1}`}{addr.isDefault ? ' — Default' : ''}</div>
                            <div className="text-sm text-gray-700 mt-1">
                              {addr.firstName || ''} {addr.lastName || ''}{addr.phone ? ` • ${addr.phone}` : ''}
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              {addr.street}{addr.city ? ', ' + addr.city : ''}{addr.state ? ', ' + addr.state : ''}{addr.country ? ', ' + addr.country : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 mt-2">No saved addresses</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};