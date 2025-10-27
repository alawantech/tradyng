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
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

export const Orders: React.FC = () => {
  const { business } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [customerOption, setCustomerOption] = useState<'existing' | 'manual'>('existing');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [approvingOrders, setApprovingOrders] = useState<Set<string>>(new Set());
  type OrderProduct = { productId: string; quantity: number };
  const [orderData, setOrderData] = useState<{
    // Customer data for manual entry
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    // Address data
    street: string;
    city: string;
    state: string;
    country: string;
    // Order data
    products: OrderProduct[]; // Array of { productId, quantity }
    notes: string;
  }>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    products: [], // Reset products array
    notes: ''
  });
  const [adminOrderStatus, setAdminOrderStatus] = useState<'paid' | 'pending'>('paid');
  const [delivered, setDelivered] = useState(false);
  // Filter state for orders table
  const [filterType, setFilterType] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  // Search state for orders
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered and searched orders logic
  const filteredOrders = orders.filter(order => {
    // Search by order ID, customer name, or email
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches = (order.orderId && order.orderId.toLowerCase().includes(term)) ||
        (order.customerName && order.customerName.toLowerCase().includes(term)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(term));
      if (!matches) return false;
    }
    // Date filters
    if (filterType === 'all' || !filterDate) return true;
    let created: Date;
    if (order.createdAt instanceof Date) {
      created = order.createdAt;
    } else if (order.createdAt?.toDate) {
      created = order.createdAt.toDate();
    } else if (typeof order.createdAt === 'string' || typeof order.createdAt === 'number') {
      created = new Date(order.createdAt);
    } else {
      created = new Date(); // fallback to now if missing
    }
    if (filterType === 'day') {
      return created.toISOString().slice(0, 10) === filterDate;
    }
    if (filterType === 'month') {
      return created.toISOString().slice(0, 7) === filterDate;
    }
    if (filterType === 'year') {
      return created.getFullYear().toString() === filterDate;
    }
    return true;
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
      products: [], // Reset products array
      notes: ''
    });
    setDelivered(false);
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
      if (orderData.products.length === 0 || !orderData.products[0].productId) {
        console.error('No product selected');
        toast.error('Please select a product');
        return;
      }
      
      console.log('Validating quantities...');
      for (const prod of orderData.products) {
        if (!prod.quantity || prod.quantity < 1) {
          console.error('Invalid quantity:', prod.quantity);
          toast.error('Please enter a valid quantity for all products');
          return;
        }
      }

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

      // Calculate subtotal and prepare items array
      const items = orderData.products
        .map(prod => {
          const selectedProduct = products.find(p => p.id === prod.productId);
          if (!selectedProduct) return undefined;
          return {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: prod.quantity,
            price: selectedProduct.price,
            total: selectedProduct.price * prod.quantity
          };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      
      console.log('Order calculations:', {
        items,
        subtotal
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
        items,
        subtotal
      });

      // Helper to check if admin is creating the order
      const isAdminCreating = !!business?.ownerId;

      const orderPayload = {
        ...customerData,
        ...(shippingAddress ? { shippingAddress } : {}),
        items,
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
        status: isAdminCreating ? adminOrderStatus : 'pending',
        paymentMethod: 'manual' as const,
        paymentStatus: isAdminCreating && adminOrderStatus === 'paid' ? 'completed' : 'pending' as const,
        delivered,
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
            console.log('Updating customer statistics for:', customerIdToUpdate, 'Order total:', subtotal);
            
            // Use the dedicated CustomerService method for updating stats
            await CustomerService.updateCustomerStats(business.id, customerIdToUpdate, subtotal, true);
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
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewOrder = (orderId: string) => {
    setShowReceipt(orderId);
  };

  // Generate PDF receipt for email attachment
  const generateOrderPDF = async (order: Order): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary container for the receipt
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        document.body.appendChild(tempContainer);

        // Create the receipt component
        const receiptElement = document.createElement('div');
        receiptElement.innerHTML = `
          <div style="max-width: 400px; margin: 0 auto; background: white; shadow-2xl rounded-2xl overflow-hidden border-2; font-family: system-ui, -apple-system, sans-serif;">
            <!-- Store Header -->
            <div style="relative; padding: 16px; background: linear-gradient(135deg, ${business?.settings?.primaryColor || '#3B82F6'} 0%, ${business?.settings?.secondaryColor || '#1E40AF'} 100%); color: white; text-align: center;">
              <div style="relative; z-index: 10;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <div style="background: white; border-radius: 50%; padding: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); margin-right: 12px;">
                    <img src="${business?.logo || ''}" alt="Store Logo" style="height: 40px; width: 40px; object-fit: contain;" />
                  </div>
                  <div>
                    <h1 style="font-size: 24px; font-weight: bold; tracking-tight;">${business?.name || 'Rady.ng'}</h1>
                  </div>
                </div>

                ${business?.address ? `<p style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${business.address}</p>` : ''}
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px;">
                  ${business?.email ? `<span style="display: flex; align-items: center;"><span style="margin-right: 4px;">📧</span>${business.email}</span>` : ''}
                  ${business?.phone ? `<span style="display: flex; align-items: center;"><span style="margin-right: 4px;">📞</span>${business.phone}</span>` : ''}
                </div>
              </div>
            </div>

            <!-- Receipt Header -->
            <div style="background: #F9FAFB; padding: 12px; border-bottom: 2px solid ${business?.settings?.primaryColor || '#3B82F6'};">
              <div style="text-align: center;">
                <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: ${business?.settings?.primaryColor || '#3B82F6'};">Order Receipt</h2>
                <p style="color: #6B7280; font-size: 14px; margin-bottom: 8px;">Thank you for your business!</p>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="background: white; padding: 6px 12px; border-radius: 4px; border: 1px solid ${business?.settings?.primaryColor || '#3B82F6'}; font-size: 12px;">
                  <span style="font-weight: 600; color: #374151;">Order ID:</span>
                  <span style="margin-left: 4px; font-weight: bold; color: ${business?.settings?.primaryColor || '#3B82F6'};">${order.orderId || order.id}</span>
                </div>
                <div style="background: white; padding: 6px 12px; border-radius: 4px; border: 1px solid ${business?.settings?.primaryColor || '#3B82F6'}; font-size: 12px;">
                  <span style="font-weight: 600; color: #374151;">Date:</span>
                  <span style="margin-left: 4px; font-weight: bold; color: #111827;">${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <!-- Customer Information -->
            <div style="padding: 16px; background: white;">
              <div style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 12px; border-radius: 8px; border: 2px solid ${business?.settings?.primaryColor || '#3B82F6'}; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; color: ${business?.settings?.primaryColor || '#3B82F6'};">
                  <span style="margin-right: 4px;">👤</span>Customer Information
                </h3>
                <div style="display: grid; grid-template-columns: 1fr; gap: 4px;">
                  <div>
                    <p style="display: flex; align-items: center; font-size: 14px;">
                      <span style="font-weight: 600; color: #374151; width: 56px;">Name:</span>
                      <span style="color: #111827;">${order.customerName}</span>
                    </p>
                    <p style="display: flex; align-items: center; font-size: 14px;">
                      <span style="font-weight: 600; color: #374151; width: 56px;">Email:</span>
                      <span style="color: #111827;">${order.customerEmail}</span>
                    </p>
                  </div>
                  ${order.customerPhone ? `
                  <div>
                    <p style="display: flex; align-items: center; font-size: 14px;">
                      <span style="font-weight: 600; color: #374151; width: 56px;">Phone:</span>
                      <span style="color: #111827;">${order.customerPhone}</span>
                    </p>
                  </div>
                  ` : ''}
                </div>
                ${order.shippingAddress ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                  <p style="display: flex; align-items: flex-start; font-size: 14px;">
                    <span style="font-weight: 600; color: #374151; width: 64px; flex-shrink: 0;">Address:</span>
                    <span style="color: #111827; margin-left: 4px; word-break: break-word;">${order.shippingAddress.street}${order.shippingAddress.city ? ', ' + order.shippingAddress.city : ''}${order.shippingAddress.state ? ', ' + order.shippingAddress.state : ''}${order.shippingAddress.country ? ', ' + order.shippingAddress.country : ''}</span>
                  </p>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Items -->
            <div style="padding: 16px; background: #F9FAFB;">
              <div style="background: white; padding: 12px; border-radius: 8px; border: 2px solid ${business?.settings?.primaryColor || '#3B82F6'}; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; color: ${business?.settings?.primaryColor || '#3B82F6'};">
                  <span style="margin-right: 4px;">🛒</span>Order Items
                </h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${order.items.map((item, idx) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #F9FAFB; border-radius: 4px; border: 1px solid rgba(${business?.settings?.primaryColor?.replace('#', '') || '59, 130, 246'}, 0.3);">
                      <div style="flex: 1;">
                        <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.productName}</div>
                        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">
                          Qty: <span style="font-weight: 500;">${item.quantity}</span> × ${formatCurrency(item.price, business?.settings?.currency || DEFAULT_CURRENCY)}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: bold; color: ${business?.settings?.primaryColor || '#3B82F6'};">
                          ${formatCurrency(item.price * item.quantity, business?.settings?.currency || DEFAULT_CURRENCY)}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Total & Payment -->
            <div style="padding: 16px; background: white;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Total Amount -->
                <div style="background: linear-gradient(135deg, rgba(${business?.settings?.primaryColor?.replace('#', '') || '59, 130, 246'}, 0.1) 0%, rgba(${business?.settings?.secondaryColor?.replace('#', '') || '30, 64, 175'}, 0.1) 100%); padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 2px solid ${business?.settings?.primaryColor || '#3B82F6'};">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 18px; font-weight: bold; color: ${business?.settings?.primaryColor || '#3B82F6'};">Total Amount:</span>
                    <span style="font-size: 24px; font-weight: 900; color: ${business?.settings?.primaryColor || '#3B82F6'};">
                      ${formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </span>
                  </div>
                </div>

                <!-- Payment Method -->
                <div style="background: #F9FAFB; padding: 8px; border-radius: 8px; border: 2px solid ${business?.settings?.primaryColor || '#3B82F6'}; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; font-weight: 600; display: flex; align-items: center; color: ${business?.settings?.primaryColor || '#3B82F6'};">
                      <span style="margin-right: 4px;">💳</span>Payment Method:
                    </span>
                    <span style="font-size: 14px; font-weight: bold; color: #111827; background: white; padding: 4px 8px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); capitalize;">
                      ${order.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1F2937; color: white; padding: 12px; text-align: center;">
              <p style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">Thank you for choosing ${business?.name || 'Rady.ng'}!</p>
              <p style="font-size: 12px; opacity: 0.75;">We appreciate your business and hope to serve you again soon.</p>
            </div>
          </div>
        `;

        tempContainer.appendChild(receiptElement);

        // Generate PDF
        const opt = {
          margin: 0.3,
          filename: `receipt-${order.orderId || order.id}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 1.2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(receiptElement).outputPdf('datauristring').then((pdfDataUri: string) => {
          // Convert data URI to base64
          const base64 = pdfDataUri.split(',')[1];
          document.body.removeChild(tempContainer);
          resolve(base64);
        }).catch((error: any) => {
          document.body.removeChild(tempContainer);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!business?.id) return;

    // Set loading state
    setApprovingOrders(prev => new Set(prev).add(orderId));

    try {
      // First, get the order details to generate PDF
      const order = orders.find(o => o.orderId === orderId || o.id === orderId);
      if (!order) {
        toast.error('Order not found');
        return;
      }

      // Generate PDF receipt
      const pdfBase64 = await generateOrderPDF(order);

      // Update order status
      await OrderService.updateOrder(business.id, orderId, {
        status: 'approved',
        paymentStatus: 'completed'
      });

      // Send approval email with PDF attachment
      try {
        const response = await fetch('https://sendorderapprovalemail-rv5lqk7lxa-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            orderId: order.orderId || order.id,
            businessName: business.name || 'Rady.ng',
            businessEmail: business.email,
            businessPhone: business.phone,
            items: order.items,
            total: order.total,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
            currency: business?.settings?.currency || 'NGN',
            pdfBase64
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Email sent successfully:', result);
      } catch (emailError) {
        console.warn('Error sending approval email:', emailError);
        // Don't fail the approval if email fails
      }

      toast.success(`Order ${orderId} approved successfully`);
      loadData(); // Reload orders
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    } finally {
      // Clear loading state
      setApprovingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };  // Handler for adding a product to the order
  function handleAddProduct() {
    setOrderData(prev => ({
      ...prev,
      products: [...prev.products, { productId: '', quantity: 1 }]
    }));
  }
  function handleRemoveProduct(index: number) {
    setOrderData(prev => {
      const products = prev.products.filter((_, i) => i !== index);
      return { ...prev, products };
    });
  }
  function handleProductChange(index: number, field: string, value: any) {
    setOrderData(prev => {
      const products = [...prev.products];
      products[index] = { ...products[index], [field]: value };
      return { ...prev, products };
    });
  }

  // --- Analytics Section ---
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [analyticsDate, setAnalyticsDate] = useState('');

  function filterByPeriod(order: any) {
    let created: Date;
    if (order.createdAt instanceof Date) {
      created = order.createdAt;
    } else if (order.createdAt?.toDate) {
      created = order.createdAt.toDate();
    } else if (typeof order.createdAt === 'string' || typeof order.createdAt === 'number') {
      created = new Date(order.createdAt);
    } else {
      created = new Date();
    }
    if (analyticsPeriod === 'all' || !analyticsDate) return true;
    if (analyticsPeriod === 'day') return created.toISOString().slice(0, 10) === analyticsDate;
    if (analyticsPeriod === 'month') return created.toISOString().slice(0, 7) === analyticsDate;
    if (analyticsPeriod === 'year') return created.getFullYear().toString() === analyticsDate;
    return true;
  }
  const analyticsOrders = orders.filter(filterByPeriod);
  const totalOrders = analyticsOrders.length;
  const pendingOrders = analyticsOrders.filter(o => o.status === 'pending').length;
  const paidOrders = analyticsOrders.filter(o => o.status === 'paid' || o.paymentStatus === 'completed').length;
  const deliveredOrders = analyticsOrders.filter(o => o.delivered).length;
  const totalRevenue = analyticsOrders.reduce((sum, o) => sum + (typeof o.total === 'number' ? o.total : 0), 0);

  // --- Simple Order Analytics Card (no filters, no top customers/products) ---
  return (
    <div className="p-6 pt-20">
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
              <div className="space-y-4">
                {orderData.products.map((prod, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      className="border rounded px-3 py-2 text-sm"
                      value={prod.productId}
                      onChange={e => handleProductChange(idx, 'productId', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="border rounded px-3 py-2 text-sm w-20"
                      value={prod.quantity}
                      onChange={e => handleProductChange(idx, 'quantity', Number(e.target.value))}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveProduct(idx)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" onClick={handleAddProduct} className="mb-2">Add Product</Button>
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

              {/* Order Status - Admin Only */}
              {business?.ownerId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={adminOrderStatus}
                    onChange={e => setAdminOrderStatus(e.target.value as 'paid' | 'pending')}
                  >
                    <option value="paid">Paid (Approved)</option>
                    <option value="pending">Pending (Needs Approval)</option>
                  </select>
                </div>
              )}
              {business?.ownerId && (
                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="delivered"
                    checked={delivered}
                    onChange={e => setDelivered(e.target.checked)}
                  />
                  <label htmlFor="delivered" className="text-sm font-medium text-gray-700">Delivered</label>
                </div>
              )}

              {/* Order Summary */}
              {orderData.products.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    {orderData.products.map((prod, idx) => {
                      const selectedProduct = products.find(p => p.id === prod.productId);
                      const total = selectedProduct ? selectedProduct.price * prod.quantity : 0;
                      return (
                        <div key={idx} className="flex justify-between">
                          <span>{prod.quantity}x {selectedProduct?.name}</span>
                          <span>{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between font-medium text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(orderData.products.reduce((sum, prod) => {
                        const selectedProduct = products.find(p => p.id === prod.productId);
                        return sum + (selectedProduct ? selectedProduct.price * prod.quantity : 0);
                      }, 0), business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                    </div>
                  </div>
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

      {/* Simple Order Analytics Card */}
      <Card className="mb-6 p-6 flex flex-wrap gap-6 items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg rounded-xl">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700">{orders.length}</span>
          <span className="text-sm text-gray-600">Total Orders</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</span>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'paid' || o.paymentStatus === 'completed').length}</span>
          <span className="text-sm text-gray-600">Paid</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-indigo-600">{orders.filter(o => o.delivered).length}</span>
          <span className="text-sm text-gray-600">Delivered</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(orders.reduce((sum, o) => sum + (typeof o.total === 'number' ? o.total : 0), 0), business?.settings?.currency || DEFAULT_CURRENCY)}</span>
          <span className="text-sm text-gray-600">Total Revenue</span>
        </div>
      </Card>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 text-sm"
          placeholder="Search by Order ID, Name, or Email"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filterType}
          onChange={e => {
            setFilterType(e.target.value as any);
            setFilterDate('');
          }}
        >
          <option value="all">All</option>
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        {filterType === 'day' && (
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
        )}
        {filterType === 'month' && (
          <input
            type="month"
            className="border rounded px-3 py-2 text-sm"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            max={new Date().toISOString().slice(0, 7)}
          />
        )}
        {filterType === 'year' && (
          <input
            type="number"
            className="border rounded px-3 py-2 text-sm w-24"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            min="2000"
            max={new Date().getFullYear()}
            placeholder="Year"
          />
        )}
      </div>

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
        ) :
        (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Delivered</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  // For this example, assume all orders created in dashboard are admin orders
                  const isAdminOrder = false; // Fix type error, you can implement your own logic
                  return (
                    <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.orderId || order.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-600">{order.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-gray-900">
                            {item.quantity}x {item.productName}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {formatCurrency(order.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.paymentMethod}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {(order.status === 'approved' || order.status === 'delivered') && (
                            <>
                              <input
                                type="checkbox"
                                checked={!!order.delivered}
                                onChange={async e => {
                                  const newDelivered = e.target.checked;
                                  const newStatus = newDelivered ? 'delivered' : 'approved';
                                  setOrders(prev => prev.map(o => o.id === order.id ? { ...o, delivered: newDelivered, status: newStatus } : o));
                                  try {
                                    await OrderService.updateOrder(business.id, order.orderId || order.id, { 
                                      delivered: newDelivered,
                                      status: newStatus
                                    });

                                    // Send delivery notification email if order is marked as delivered
                                    if (newDelivered) {
                                      try {
                                        // Generate PDF receipt for email attachment
                                        const pdfBase64 = await generateOrderPDF(order);

                                        const response = await fetch('https://sendorderdeliveryemail-rv5lqk7lxa-uc.a.run.app', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            customerEmail: order.customerEmail,
                                            customerName: order.customerName,
                                            customerPhone: order.customerPhone,
                                            shippingAddress: order.shippingAddress,
                                            orderId: order.orderId || order.id,
                                            businessName: business.name || 'Rady.ng',
                                            businessEmail: business.email,
                                            businessPhone: business.phone,
                                            items: order.items,
                                            total: order.total,
                                            paymentMethod: order.paymentMethod,
                                            createdAt: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
                                            currency: business?.settings?.currency || 'NGN',
                                            pdfBase64
                                          })
                                        });

                                        if (!response.ok) {
                                          throw new Error(`HTTP error! status: ${response.status}`);
                                        }

                                        const result = await response.json();
                                        console.log('Delivery email sent successfully:', result);
                                        toast.success('Order marked as delivered and notification email sent!');
                                      } catch (emailError) {
                                        console.warn('Error sending delivery email:', emailError);
                                        toast.success('Order marked as delivered (email notification failed)');
                                      }
                                    } else {
                                      toast.success('Order delivery status updated');
                                    }
                                  } catch (err) {
                                    console.error('Failed to update delivery status:', err);
                                    toast.error('Failed to update delivery status');
                                  }
                                }}
                              />
                              <span className={order.delivered ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                                {order.delivered ? 'Product is delivered' : 'Check if product is delivered'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order.orderId || order.id || 'unknown')}
                          className="mb-2"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Receipt
                        </Button>
                        {/* Only show Approve button for customer manual payment orders, not admin orders */}
                        {order.status === 'pending' && order.paymentMethod === 'manual' && !isAdminOrder && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveOrder(order.orderId || order.id || 'unknown')}
                            disabled={approvingOrders.has(order.orderId || order.id || 'unknown')}
                          >
                            {approvingOrders.has(order.orderId || order.id || 'unknown') ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        )}
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
                                storeName={business?.name || 'Rady.ng'}
                                storeAddress={business?.address}
                                storePhone={business?.phone}
                                storeEmail={business?.email}
                                storeLogo={business?.logo}
                                storeCountry={business?.country}
                                primaryColor={business?.settings?.primaryColor}
                                secondaryColor={business?.settings?.secondaryColor}
                                accentColor={business?.settings?.accentColor}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};