import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService, Order } from '../../services/order';
import { useColorScheme } from '../../hooks/useColorScheme';
import toast from 'react-hot-toast';

export const Payment: React.FC = () => {
  const { business } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get color scheme based on business background color
  const colorScheme = useColorScheme(business?.branding?.storeBackgroundColor);
  
  // Get order ID and business ID from location state
  const { orderId, businessId } = location.state || {};
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && businessId) {
      loadOrder();
    } else {
      toast.error('Order information not found');
      navigate('/');
    }
  }, [orderId, businessId]);

  const loadOrder = async () => {
    if (!orderId || !businessId) return;

    try {
      // Find order by professional order ID (not Firebase document ID)
      const orders = await OrderService.getOrdersByBusinessId(businessId);
      const foundOrder = orders.find(o => o.orderId === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error('Order not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className={`text-2xl font-bold ${colorScheme.text.primary}`}>Loading order...</h1>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className={`text-3xl font-bold ${colorScheme.text.primary} mb-4`}>Order Not Found</h1>
          <p className={`${colorScheme.text.secondary} mb-8`}>No order data found. Please start a new order.</p>
          <Link to="/products">
            <Button size="lg">
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      
      setPaymentReceipt(file);
      setUploadError(null);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentReceipt) {
      toast.error('Please upload your payment receipt');
      return;
    }

    if (!order || !businessId) {
      toast.error('Order information not found');
      return;
    }

    setIsUploading(true);
    
    try {
      // TODO: Implement actual file upload to Firebase Storage
      // For now, simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For manual payment, set status to 'pending' and paymentStatus to 'pending'
      if (order.id) {
        await OrderService.updateOrder(businessId, order.id, {
          status: 'pending',
          paymentStatus: 'pending',
          notes: order.notes ? `${order.notes}\n\nPayment receipt uploaded` : 'Payment receipt uploaded'
        });
      }

      // Send confirmation email to customer
      try {
        const { sendEmail } = await import('../../services/emailService');
        await sendEmail({
          to: order.customerEmail,
          from: business.email || 'noreply@rady.ng',
          subject: `Order ${order.orderId} Created - Awaiting Approval`,
          html: `<h2>Order Created Successfully</h2>
            <p>Hi ${order.customerName},</p>
            <p>Your order <b>${order.orderId}</b> has been created and is awaiting admin approval.</p>
            <p>Once your payment is verified, your order will be processed and shipped.</p>
            <p>Thank you for shopping with ${business.name}!</p>`
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      toast.success('Payment receipt uploaded successfully! Your order is now awaiting admin approval.');
      // Redirect to order history page and pass orderId in state
      navigate('/orders', { state: { orderSubmitted: true, orderId: order.orderId } });
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Complete Payment</h1>
              <p className="text-black mt-1">Manual payment for {formatCurrency(order?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
            </div>
            <Link to="/checkout">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Checkout
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Instructions */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Bank Transfer Details</h2>
              </div>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Bank Name</p>
                  <p className="text-lg font-semibold text-gray-900">{business.bankDetails?.bankName || 'First National Bank'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Name</p>
                  <p className="text-lg font-semibold text-gray-900">{business.bankDetails?.accountName || business.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Number</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">{business.bankDetails?.accountNumber || '1234567890'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Amount to Transfer</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(order?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Reference</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">{order?.orderId || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Payment Instructions</p>
                    <ul className="text-sm text-amber-700 mt-2 space-y-1">
                      <li>• Transfer the exact amount shown above</li>
                      <li>• Use the reference number in your transfer description</li>
                      <li>• Upload your payment receipt below</li>
                      <li>• Your order will be processed after payment verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upload Receipt */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Upload className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Upload Payment Receipt</h2>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Click to upload receipt
                    </p>
                    <p className="text-sm text-gray-600">
                      PNG, JPG or PDF up to 5MB
                    </p>
                  </label>
                </div>
                
                {paymentReceipt && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{paymentReceipt.name}</p>
                      <p className="text-xs text-green-600">
                        {(paymentReceipt.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
                
                {uploadError && (
                  <p className="text-sm text-red-600">{uploadError}</p>
                )}
                
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!paymentReceipt || isUploading}
                  size="lg"
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : 'Submit Payment Receipt'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Customer Info */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {order?.customerName}</p>
                  <p><span className="font-medium">Email:</span> {order?.customerEmail}</p>
                  <p><span className="font-medium">Phone:</span> {order?.customerPhone}</p>
                  <p><span className="font-medium">Address:</span> {order?.shippingAddress?.street}, {order?.shippingAddress?.city}, {order?.shippingAddress?.state}</p>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order?.items.map((item) => (
                  <div key={item.productId} className="flex items-center space-x-3">
                    <img
                      src={item.image || '/api/placeholder/50/50'}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total, business?.settings?.currency || DEFAULT_CURRENCY)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order?.subtotal || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(order?.tax || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(order?.total || 0, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                </div>
              </div>

              {/* Store Info */}
              <div className="pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Store Information</h3>
                <p className="text-gray-600">{business.name}</p>
                {business.phone && (
                  <p className="text-sm text-gray-500 mt-1">📞 {business.phone}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};