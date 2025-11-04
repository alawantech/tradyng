import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Copy, CheckCircle, Sparkles, Shield, Upload, FileText, User, Package, AlertCircle, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { OrderService } from '../../services/order';
import { ImageUploadService } from '../../services/imageUpload';
import toast from 'react-hot-toast';

export const Payment: React.FC = () => {
  const { business } = useStore();
  const { user } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get checkout data from location state
  const { checkoutData } = location.state || {};
  
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!checkoutData) {
      toast.error('Checkout information not found');
      navigate('/');
    }
  }, [checkoutData]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please upload a valid image (JPG, PNG, WEBP)');
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
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentReceipt) {
      toast.error('Please upload payment receipt');
      return;
    }

    if (!checkoutData || !business?.id) {
      toast.error('Checkout information not found');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload payment receipt
      toast.loading('Uploading payment receipt...');
      const receiptUrl = await ImageUploadService.uploadImage(paymentReceipt, `receipts/${business.id}`);
      toast.dismiss();
      
      if (!receiptUrl) {
        toast.error('Failed to upload receipt. Please try again.');
        return;
      }

      // Create order with payment receipt
      toast.loading('Creating your order...');
      const orderId = await OrderService.createOrder(business.id, {
        items: checkoutData.items,
        customerId: user?.uid, // Add customer Firebase Auth UID
        customerName: checkoutData.customerName,
        customerEmail: checkoutData.customerEmail,
        customerPhone: checkoutData.customerPhone,
        shippingAddress: checkoutData.shippingAddress,
        subtotal: checkoutData.subtotal,
        tax: 0,
        shipping: checkoutData.shippingCost || 0,
        total: checkoutData.total,
        status: 'pending', // Set order status
        paymentMethod: 'manual',
        paymentStatus: 'pending',
        paymentReceipt: receiptUrl, // Save receipt URL
        notes: checkoutData.notes
      });

      toast.dismiss();
      toast.success('Order placed successfully! We will verify your payment shortly.');

      // Send order confirmation email to customer
      try {
        console.log('Sending order confirmation email to customer...');
        const response = await fetch('https://sendpaymentreceiptnotification-rv5lqk7lxa-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail: checkoutData.customerEmail,
            customerName: checkoutData.customerName,
            orderId: orderId,
            businessName: business.name || 'Rady.ng',
            businessEmail: business.email,
            businessPhone: business.phone
          })
        });

        if (response.ok) {
          console.log('Order confirmation email sent to customer successfully');
        } else {
          console.warn('Failed to send order confirmation email to customer:', response.status);
        }
      } catch (emailError) {
        console.warn('Error sending order confirmation email to customer:', emailError);
        // Don't fail the order if email fails
      }

      // Send notification email to admin/business owner
      try {
        console.log('Sending order notification email to admin...');
        const adminResponse = await fetch('https://sendadminpaymentreceiptnotification-rv5lqk7lxa-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminEmail: business.email,
            customerName: checkoutData.customerName,
            customerEmail: checkoutData.customerEmail,
            orderId: orderId,
            businessName: business.name || 'Rady.ng',
            businessId: business.id
          })
        });

        if (adminResponse.ok) {
          console.log('Order notification email sent to admin successfully');
        } else {
          console.warn('Failed to send order notification email to admin:', adminResponse.status);
        }
      } catch (emailError) {
        console.warn('Error sending order notification email to admin:', emailError);
        // Don't fail the order if email fails
      }
      
      // Clear cart and navigate to success page
      setTimeout(() => {
        navigate('/orders', { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.dismiss();
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!checkoutData) {
    return null;
  }

  // Bank details from store registration
  const bankDetails = {
    bankName: business?.bankDetails?.bankName || 'Not set',
    accountName: business?.bankDetails?.accountName || business?.name || 'Not set',
    accountNumber: business?.bankDetails?.accountNumber || 'Not set'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Payment
              </h1>
              <p className="text-gray-600">
                Total Amount: <span className="font-bold text-purple-600">{formatCurrency(checkoutData.total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
              </p>
            </div>
            <Link to="/checkout">
              <Button variant="outline">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Bank Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Bank Transfer Instructions */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bank Transfer Details</h2>
                  <p className="text-sm text-gray-600">Transfer to the account below</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Bank Name */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 mb-1 block">Bank Name</label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{bankDetails.bankName}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.bankName, 'Bank name')}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      {copiedField === 'Bank name' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 mb-1 block">Account Name</label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{bankDetails.accountName}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.accountName, 'Account name')}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      {copiedField === 'Account name' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <label className="text-sm text-purple-600 mb-1 block font-medium">Account Number</label>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-900">{bankDetails.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account number')}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      {copiedField === 'Account number' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-purple-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <label className="text-sm text-green-600 mb-1 block font-medium">Amount to Transfer</label>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-900">
                      {formatCurrency(checkoutData.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(checkoutData.total.toString(), 'Amount')}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      {copiedField === 'Amount' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-green-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Transfer the exact amount shown above</li>
                      <li>Upload your payment receipt after transfer</li>
                      <li>Your order will be processed after payment verification</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Coming Soon Badge */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Automatic Payment</span>
                  <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-full">
                    COMING SOON
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Card & mobile money payments will be available soon!
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Upload Receipt */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Upload Receipt */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Payment Receipt</h2>
                  <p className="text-sm text-gray-600">After making transfer, upload proof</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="receipt-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="max-h-64 mx-auto rounded-lg shadow-lg"
                        />
                        <p className="text-sm text-green-600 font-medium">
                          ✓ Receipt uploaded - Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                          <FileText className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 mb-1">
                            Click to upload receipt
                          </p>
                          <p className="text-sm text-gray-500">
                            JPG, PNG or WEBP (Max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {uploadError}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!paymentReceipt || isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white py-6 text-lg font-semibold rounded-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                      Submitting Order...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 mr-2" />
                      Submit Order
                    </div>
                  )}
                </Button>
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Order Summary
              </h3>
              <div className="space-y-3">
                {checkoutData.items.map((item: any) => (
                  <div key={item.productId} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </span>
                  </div>
                ))}

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(checkoutData.subtotal, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(checkoutData.shippingCost || 0, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-200">
                    <span>Total</span>
                    <span className="text-purple-600">
                      {formatCurrency(checkoutData.total, business?.settings?.currency || DEFAULT_CURRENCY)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
