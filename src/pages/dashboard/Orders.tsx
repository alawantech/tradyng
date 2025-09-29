import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Package, ShoppingCart, Plus, User, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OrderService, Order } from '../../services/order';
import { ProductService, Product } from '../../services/product';
import { CustomerService, Customer } from '../../services/customer';
import { useAuth } from '../../hooks/useAuth';
import { OrderReceipt } from '../../components/ui/OrderReceipt';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const Orders: React.FC = () => {
  const { business } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [customerOption, setCustomerOption] = useState<'existing' | 'manual'>('existing');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderData, setOrderData] = useState({
    // Customer data for manual entry
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    // Address data
    street: '',
    city: '',
    state: '',
    country: '',
    // Order data
    productId: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    if (business?.id) {
      loadData();
    }
  }, [business]);

  const loadData = async () => {
    if (!business?.id) return;

    try {
      const [ordersData, productsData, customersData] = await Promise.all([
        OrderService.getOrdersByBusinessId(business.id),
        ProductService.getProductsByBusinessId(business.id),
        CustomerService.getCustomersByBusinessId(business.id)
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomerSelection = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      // Pre-fill form with customer data
      setOrderData({
        ...orderData,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        country: customer.address?.country || ''
      });
    } else {
      setSelectedCustomer(null);
      // Clear customer data
      setOrderData({
        ...orderData,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        street: '',
        city: '',
        state: '',
        country: ''
      });
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setCustomerOption('existing');
    setSelectedCustomer(null);
    setOrderData({ 
      customerName: '', 
      customerEmail: '', 
      customerPhone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      productId: '', 
      quantity: 1,
      notes: ''
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== ORDER CREATION DEBUG ===');
    console.log('Form data:', orderData);
    console.log('Customer option:', customerOption);
    console.log('Selected customer:', selectedCustomer);
    console.log('Available products:', products.length);
    console.log('Business context:', business?.id);
    
    if (!business?.id) {
      console.error('No business ID found in context');
      toast.error('Authentication error: No business found');
      return;
    }

    try {
      // Validate required fields
      console.log('Validating product selection...');
      if (!orderData.productId) {
        console.error('No product selected');
        toast.error('Please select a product');
        return;
      }
      
      console.log('Validating quantity...');
      if (!orderData.quantity || orderData.quantity < 1) {
        console.error('Invalid quantity:', orderData.quantity);
        toast.error('Please enter a valid quantity');
        return;
      }

      const selectedProduct = products.find(p => p.id === orderData.productId);
      if (!selectedProduct) {
        console.error('Product not found in products list');
        toast.error('Selected product not found');
        return;
      }

      console.log('Selected product:', selectedProduct);

      // Validate customer data based on selection type
      if (customerOption === 'existing') {
        console.log('Validating existing customer selection...');
        if (!selectedCustomer) {
          console.error('No customer selected for existing option');
          toast.error('Please select a customer');
          return;
        }
        console.log('Using existing customer:', selectedCustomer);
      } else {
        console.log('Validating manual customer data...');
        if (!orderData.customerName || !orderData.customerEmail) {
          console.error('Missing customer name or email');
          toast.error('Please fill in customer name and email');
          return;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(orderData.customerEmail)) {
          console.error('Invalid email format:', orderData.customerEmail);
          toast.error('Please enter a valid email address');
          return;
        }
        console.log('Manual customer data validated');
      }

      console.log('All validations passed, preparing order data...');

      const quantity = parseInt(orderData.quantity.toString(), 10);
      const total = selectedProduct.price * quantity;
      
      console.log('Order calculations:', {
        productPrice: selectedProduct.price,
        quantity: quantity,
        total: total
      });

      let customerId: string | undefined;
      
      // Prepare customer data and create customer if manual entry
      let customerData;
      if (customerOption === 'existing' && selectedCustomer) {
        customerData = {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email,
          ...(selectedCustomer.phone && selectedCustomer.phone.trim() ? { customerPhone: selectedCustomer.phone.trim() } : {})
        };
      } else {
        // Manual customer entry - create new customer
        console.log('Creating new customer from manual entry...');
        
        // Check if customer with this email already exists
        const existingCustomers = await CustomerService.getCustomersByBusinessId(business.id);
        const duplicateCustomer = existingCustomers.find(c => c.email.toLowerCase() === orderData.customerEmail.toLowerCase());
        
        if (duplicateCustomer) {
          console.log('Customer with this email already exists:', duplicateCustomer);
          toast.error(`Customer with email "${orderData.customerEmail}" already exists! Please select from existing customers instead of entering manually.`);
          return; // Stop order creation
        } else {
          // Create new customer
          const newCustomerData = {
            name: orderData.customerName,
            email: orderData.customerEmail,
            ...(orderData.customerPhone && orderData.customerPhone.trim() ? { phone: orderData.customerPhone.trim() } : {}),
            ...(orderData.street && orderData.country ? {
              address: {
                street: orderData.street,
                ...(orderData.city && orderData.city.trim() ? { city: orderData.city.trim() } : {}),
                ...(orderData.state && orderData.state.trim() ? { state: orderData.state.trim() } : {}),
                country: orderData.country
              }
            } : {}),
            totalOrders: 0, // Will be updated after order creation
            totalSpent: 0, // Will be updated after order creation
            firstOrderAt: Timestamp.now(),
            lastOrderAt: Timestamp.now()
          };
          
          try {
            customerId = await CustomerService.createCustomer(business.id, newCustomerData);
            console.log('New customer created with ID:', customerId);
          } catch (customerError) {
            console.warn('Failed to create customer, proceeding with order only:', customerError);
            // Continue with order creation even if customer creation fails
          }
          
          customerData = {
            ...(customerId ? { customerId } : {}),
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            ...(orderData.customerPhone && orderData.customerPhone.trim() ? { customerPhone: orderData.customerPhone.trim() } : {})
          };
        }
      }      // Prepare shipping address if provided
      const shippingAddress = (orderData.street && orderData.country) ? {
        street: orderData.street,
        ...(orderData.city && orderData.city.trim() ? { city: orderData.city.trim() } : {}),
        ...(orderData.state && orderData.state.trim() ? { state: orderData.state.trim() } : {}),
        country: orderData.country
      } : undefined;

      console.log('Prepared order data:', {
        businessId: business.id,
        customerData,
        shippingAddress,
        total,
        selectedProduct: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price
        }
      });

      const orderPayload = {
        ...customerData,
        ...(shippingAddress ? { shippingAddress } : {}),
        items: [{
          productId: orderData.productId,
          productName: selectedProduct.name,
          quantity: quantity,
          price: selectedProduct.price,
          total: total
        }],
        subtotal: total,
        tax: 0,
        shipping: 0,
        total: total,
        status: 'pending' as const,
        paymentMethod: 'manual' as const,
        paymentStatus: 'pending' as const,
        ...(orderData.notes && orderData.notes.trim() ? { notes: orderData.notes.trim() } : {})
      };

      console.log('Final order payload (cleaned for Firestore):', orderPayload);

      const orderId = await OrderService.createOrder(business.id, orderPayload);
      console.log('Order created successfully with ID:', orderId);

      // Update customer statistics if we have a customer ID
      if (customerId || (customerOption === 'existing' && selectedCustomer)) {
        const customerIdToUpdate = customerId || selectedCustomer?.id;
        if (customerIdToUpdate) {
          try {
            console.log('Updating customer statistics for:', customerIdToUpdate, 'Order total:', total);
            
            // Use the dedicated CustomerService method for updating stats
            await CustomerService.updateCustomerStats(business.id, customerIdToUpdate, total, true);
            console.log('Customer statistics updated successfully');
            
            // Verify the update by re-fetching the customer data
            const updatedCustomer = await CustomerService.getCustomerById(business.id, customerIdToUpdate);
            console.log('Verified updated customer:', updatedCustomer);
            
          } catch (updateError) {
            console.warn('Failed to update customer statistics:', updateError);
            // Don't fail the order creation if customer update fails
          }
        }
      }

      // Create success message based on what happened
      let successMessage = `Order ${orderId} created successfully!`;
      if (customerOption === 'manual' && customerId) {
        successMessage += ' New customer added to database.';
      }
      if (customerOption === 'existing') {
        successMessage += ' Customer statistics updated.';
      }

      toast.success(successMessage);
      resetModal();
      loadData(); // Reload orders and customers
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        businessId: business?.id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // More specific error messages
      let errorMessage = 'Failed to create order';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your account access.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
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

      {/* Enhanced Modal for creating new order */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Create New Order</h2>
                <Button variant="outline" onClick={resetModal}>
                  ✕
                </Button>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              {/* Customer Selection Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Customer Information
                </label>
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setCustomerOption('existing')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      customerOption === 'existing'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Select Existing Customer</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerOption('manual')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      customerOption === 'manual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Enter Details Manually</div>
                  </button>
                </div>
              </div>

              {/* Customer Selection Dropdown */}
              {customerOption === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer *
                  </label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => handleCustomerSelection(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                  
                  {selectedCustomer && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <p><strong>Name:</strong> {selectedCustomer.name}</p>
                        <p><strong>Email:</strong> {selectedCustomer.email}</p>
                        {selectedCustomer.phone && <p><strong>Phone:</strong> {selectedCustomer.phone}</p>}
                        {selectedCustomer.address && (
                          <p><strong>Address:</strong> {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state}, {selectedCustomer.address.country}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Customer Entry */}
              {customerOption === 'manual' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Customer Name *"
                      name="customerName"
                      value={orderData.customerName}
                      onChange={handleChange}
                      placeholder="Adebayo Ogundimu"
                      required
                    />
                    <Input
                      label="Customer Email *"
                      name="customerEmail"
                      type="email"
                      value={orderData.customerEmail}
                      onChange={handleChange}
                      placeholder="adebayo@gmail.com"
                      required
                    />
                  </div>
                  
                  <Input
                    label="Phone Number (Optional)"
                    name="customerPhone"
                    type="tel"
                    value={orderData.customerPhone}
                    onChange={handleChange}
                    placeholder="+234 803 123 4567"
                  />

                  {/* Delivery Address */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Delivery Address (Optional)</h3>
                    <div className="space-y-3">
                      <Input
                        label="Street Address"
                        name="street"
                        value={orderData.street}
                        onChange={handleChange}
                        placeholder="15 Adeniyi Jones Avenue"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="City"
                          name="city"
                          value={orderData.city}
                          onChange={handleChange}
                          placeholder="Lagos"
                        />
                        <Input
                          label="State"
                          name="state"
                          value={orderData.state}
                          onChange={handleChange}
                          placeholder="Lagos"
                        />
                        <Input
                          label="Country"
                          name="country"
                          value={orderData.country}
                          onChange={handleChange}
                          placeholder="Nigeria"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product *
                  </label>
                  <select
                    name="productId"
                    value={orderData.productId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({formatCurrency(product.price, business?.settings?.currency || DEFAULT_CURRENCY)})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Quantity *"
                  name="quantity"
                  type="number"
                  min={1}
                  value={orderData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={orderData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special instructions or notes for this order..."
                />
              </div>

              {/* Order Summary */}
              {orderData.productId && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
                  {(() => {
                    const selectedProduct = products.find(p => p.id === orderData.productId);
                    const total = selectedProduct ? selectedProduct.price * orderData.quantity : 0;
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>{orderData.quantity}x {selectedProduct?.name}</span>
                          <span>{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-gray-900 pt-2 border-t">
                          <span>Total</span>
                          <span>{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Order
                </Button>
              </div>
            </form>
          </div>
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
                    {order.orderId || order.id}
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
                      {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </p>
                    <p className="text-gray-600">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewOrder(order.orderId || order.id || 'unknown')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Receipt
                </Button>
                {order.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveOrder(order.orderId || order.id || 'unknown')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
            {/* Receipt Modal */}
            {showReceipt === (order.orderId || order.id) && (
              <div
                className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
                onClick={() => setShowReceipt(null)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="bg-white rounded-lg shadow-lg max-w-lg w-full relative overflow-y-auto max-h-[90vh]"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="sticky top-0 right-0 float-right m-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
                    onClick={() => setShowReceipt(null)}
                    aria-label="Close receipt"
                  >
                    Close
                  </button>
                  <OrderReceipt
                    orderId={order.orderId || order.id || 'N/A'}
                    customerName={order.customerName}
                    customerEmail={order.customerEmail}
                    customerPhone={order.customerPhone}
                    customerAddress={order.shippingAddress ? 
                      `${order.shippingAddress.street}${order.shippingAddress.city ? ', ' + order.shippingAddress.city : ''}${order.shippingAddress.state ? ', ' + order.shippingAddress.state : ''}${order.shippingAddress.country ? ', ' + order.shippingAddress.country : ''}` 
                      : undefined
                    }
                    items={order.items}
                    total={order.total}
                    paymentMethod={order.paymentMethod}
                    createdAt={order.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    currencyCode={business?.settings?.currency}
                    storeName={business?.name || 'Trady.ng'}
                    storeAddress={business?.address}
                    storePhone={business?.phone}
                    storeEmail={business?.email}
                    storeLogo={business?.logo}
                    primaryColor={business?.settings?.primaryColor}
                    secondaryColor={business?.settings?.secondaryColor}
                    accentColor={business?.settings?.accentColor}
                  />
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