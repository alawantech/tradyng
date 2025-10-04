import { EmailService } from '../services/emailService';
import { OTPService } from '../services/otpService';

// 🎯 COMPLETE EMAIL WORKFLOW EXAMPLES

// 1. CUSTOMER REGISTRATION WITH OTP (expires in 1 day)
export const handleCustomerRegistration = async (email: string, businessId: string, businessName: string) => {
  try {
    // Generate OTP (expires in 1 day)
    const otp = await OTPService.createOTP(email, businessId);
    
    // Send OTP email
    const emailSent = await EmailService.sendRegistrationOTP(email, otp, businessName);
    
    if (emailSent) {
      console.log(`✅ OTP sent to ${email}`);
      return { success: true, message: 'Verification code sent to your email' };
    } else {
      throw new Error('Failed to send verification email');
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
};

// 2. VERIFY OTP AND COMPLETE REGISTRATION
export const verifyRegistrationOTP = async (email: string, otp: string, customerData: any, business: any) => {
  try {
    // Verify OTP
    const verification = await OTPService.verifyOTP(email, otp);
    
    if (!verification.valid) {
      return { success: false, error: verification.message };
    }
    
    // OTP is valid - complete registration
    const customer = await createCustomerAccount(customerData);
    
    // Send welcome email
    await EmailService.sendWelcomeEmail(customer, business);
    
    console.log(`✅ Customer registered successfully: ${email}`);
    return { success: true, message: 'Registration completed successfully', customer };
    
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: 'Registration failed' };
  }
};

// 3. COMPLETE ORDER WORKFLOW
export const processOrderWorkflow = async (orderData: any) => {
  try {
    const { customer, business, order } = await createOrder(orderData);
    
    // Step 1: Send order confirmation to customer
    await EmailService.sendOrderPlacedConfirmation(order, customer, business);
    console.log('📧 Order confirmation sent to customer');
    
    // Step 2: Send notification to store owner
    await EmailService.sendOrderNotificationToOwner(order, customer, business);
    console.log('📧 Order notification sent to store owner');
    
    return { success: true, orderId: order.id };
    
  } catch (error) {
    console.error('Order processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Order processing failed' };
  }
};

// 4. ADMIN APPROVES ORDER (Manual Payment)
export const approveOrderWithReceipt = async (orderId: string, receiptPDF?: string) => {
  try {
    const { order, customer, business } = await getOrderDetails(orderId);
    
    // Update order status to approved
    await updateOrderStatus(orderId, 'approved');
    
    // Send approval email with PDF receipt
    await EmailService.sendOrderApprovedWithReceipt(order, customer, business, receiptPDF);
    console.log('📧 Order approval email with receipt sent to customer');
    
    return { success: true, message: 'Order approved and customer notified' };
    
  } catch (error) {
    console.error('Order approval error:', error);
    return { success: false, error: 'Failed to approve order' };
  }
};

// 5. MARK ORDER AS DELIVERED
export const markOrderAsDelivered = async (orderId: string) => {
  try {
    const { order, customer, business } = await getOrderDetails(orderId);
    
    // Update order status to delivered
    await updateOrderStatus(orderId, 'delivered');
    
    // Send delivery confirmation email
    await EmailService.sendOrderDeliveredNotification(order, customer, business);
    console.log('📧 Delivery notification sent to customer');
    
    return { success: true, message: 'Order marked as delivered and customer notified' };
    
  } catch (error) {
    console.error('Delivery notification error:', error);
    return { success: false, error: 'Failed to send delivery notification' };
  }
};

// 🔄 EXAMPLE USAGE SCENARIOS

// Scenario 1: Customer wants to register
export const customerRegistrationFlow = async () => {
  const email = 'customer@example.com';
  const businessId = 'bbbb-business-id';
  const businessName = 'BBBB Luxury Store';
  
  // Send OTP
  const result = await handleCustomerRegistration(email, businessId, businessName);
  console.log('Registration result:', result);
  
  // Later, when customer enters OTP...
  const otp = '123456'; // Customer input
  const customerData = {
    name: 'John Doe',
    email: email,
    phone: '+234 801 234 5678'
  };
  const business = await getBusiness(businessId);
  
  const verification = await verifyRegistrationOTP(email, otp, customerData, business);
  console.log('Verification result:', verification);
};

// Scenario 2: Complete order process
export const orderProcessFlow = async () => {
  const orderData = {
    customerId: 'customer-123',
    businessId: 'bbbb-business-id',
    items: [
      { productName: 'Luxury Perfume', quantity: 1, price: 25000 },
      { productName: 'Body Mist', quantity: 2, price: 8000 }
    ],
    total: 41000,
    deliveryInfo: {
      name: 'John Doe',
      phone: '+234 801 234 5678',
      address: '123 Victoria Island',
      city: 'Lagos'
    }
  };
  
  // 1. Process order
  const orderResult = await processOrderWorkflow(orderData);
  console.log('Order processed:', orderResult);
  
  if (orderResult.success) {
    // 2. Admin approves order (with PDF receipt)
    const receiptPDF = 'base64-encoded-pdf-content'; // Generated PDF
    const approvalResult = await approveOrderWithReceipt(orderResult.orderId, receiptPDF);
    console.log('Order approved:', approvalResult);
    
    // 3. Later, mark as delivered
    const deliveryResult = await markOrderAsDelivered(orderResult.orderId);
    console.log('Order delivered:', deliveryResult);
  }
};

// 📧 EMAIL SUMMARY:
// ✅ Registration OTP (expires 1 day) → Customer
// ✅ Welcome email → Customer
// ✅ Order placed confirmation → Customer  
// ✅ New order notification → Store Owner
// ✅ Order approved + PDF receipt → Customer
// ✅ Order delivered notification → Customer

// Mock functions - replace with your actual implementations
const createCustomerAccount = async (data: any) => ({ 
  id: 'customer-123', 
  ...data 
});

const createOrder = async (data: any) => ({
  order: { id: 'ORD-123', ...data, createdAt: { toDate: () => new Date() } },
  customer: { id: 'customer-123', name: 'John Doe', email: 'customer@example.com' },
  business: { 
    id: 'bbbb-business-id', 
    name: 'BBBB Luxury Store', 
    subdomain: 'bbbb',
    email: 'owner@bbbb.com',
    settings: { currency: 'NGN', primaryColor: '#8B5CF6' }
  }
});

const getOrderDetails = async (orderId: string) => ({
  order: { 
    id: orderId, 
    total: 41000,
    items: [
      { productName: 'Luxury Perfume', quantity: 1, price: 25000 }
    ],
    deliveryInfo: {
      name: 'John Doe',
      phone: '+234 801 234 5678',
      address: '123 Victoria Island',
      city: 'Lagos'
    }
  },
  customer: { id: 'customer-123', name: 'John Doe', email: 'customer@example.com' },
  business: { 
    id: 'bbbb-business-id', 
    name: 'BBBB Luxury Store', 
    subdomain: 'bbbb',
    email: 'owner@bbbb.com',
    settings: { currency: 'NGN', primaryColor: '#8B5CF6' }
  }
});

const updateOrderStatus = async (orderId: string, status: string) => {
  console.log(`Order ${orderId} status updated to: ${status}`);
};

const getBusiness = async (businessId: string) => ({
  id: businessId,
  name: 'BBBB Luxury Store',
  subdomain: 'bbbb',
  email: 'owner@bbbb.com',
  settings: { currency: 'NGN', primaryColor: '#8B5CF6' }
});