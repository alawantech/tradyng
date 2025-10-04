// Quick SendGrid Test
// Run this to test your SendGrid setup

import { EmailService } from '../services/emailService';
import { OTPService } from '../services/otpService';

// 🧪 TEST 1: Basic Email Test
const testBasicEmail = async () => {
  console.log('🧪 Testing basic email sending...');
  
  try {
    const result = await EmailService.sendEmail({
      to: 'alawantech1@gmail.com', // Your email
      from: 'verification@rady.ng',
      subject: '🎉 SendGrid Working - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">✅ SendGrid is Working!</h2>
          <p>Congratulations! Your SendGrid integration is working perfectly.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #3B82F6; margin-top: 0;">What's Working:</h3>
            <ul style="color: #1e40af;">
              <li>✅ API Key configured correctly</li>
              <li>✅ Domain authentication active</li>
              <li>✅ Email sending functional</li>
              <li>✅ Ready for production use</li>
            </ul>
          </div>
          <p><strong>Next:</strong> Test OTP and order emails!</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent from Rady.ng E-commerce Platform
          </p>
        </div>
      `
    });

    if (result) {
      console.log('✅ Basic email test PASSED!');
      console.log('📧 Check your email: alawantech1@gmail.com');
      return true;
    } else {
      console.log('❌ Basic email test FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    return false;
  }
};

// 🧪 TEST 2: OTP Email Test
const testOTPEmail = async () => {
  console.log('🧪 Testing OTP email system...');
  
  try {
    // Generate test OTP
    const testOTP = OTPService.generateOTP();
    console.log('🔢 Generated test OTP:', testOTP);
    
    const result = await EmailService.sendRegistrationOTP(
      'alawantech1@gmail.com', // Your email
      testOTP,
      'BBBB Luxury Store'
    );

    if (result) {
      console.log('✅ OTP email test PASSED!');
      console.log('📧 Check your email for the OTP verification code');
      console.log('🔢 OTP sent:', testOTP);
      return true;
    } else {
      console.log('❌ OTP email test FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ OTP test error:', error);
    return false;
  }
};

// 🧪 TEST 3: Order Email Test
const testOrderEmail = async () => {
  console.log('🧪 Testing order notification emails...');
  
  try {
    // Mock order data
    const mockOrder = {
      id: 'TEST-' + Date.now(),
      total: 35000,
      items: [
        { productName: 'Luxury Perfume', quantity: 1, price: 25000 },
        { productName: 'Body Mist Set', quantity: 2, price: 5000 }
      ],
      deliveryInfo: {
        name: 'Test Customer',
        phone: '+234 801 234 5678',
        address: '123 Test Street, Victoria Island',
        city: 'Lagos'
      },
      createdAt: { toDate: () => new Date() }
    };

    const mockCustomer = {
      name: 'Test Customer',
      email: 'alawantech1@gmail.com' // Your email
    };

    const mockBusiness = {
      id: 'test-business',
      name: 'BBBB Luxury Store',
      subdomain: 'bbbb',
      email: 'owner@bbbb.com',
      logo: 'https://via.placeholder.com/100x50/8B5CF6/white?text=BBBB',
      settings: {
        currency: 'NGN',
        primaryColor: '#8B5CF6'
      },
      description: 'Premium beauty and fragrance store'
    };

    // Test order placed email
    const orderResult = await EmailService.sendOrderPlacedConfirmation(
      mockOrder, 
      mockCustomer, 
      mockBusiness
    );

    // Test owner notification
    const ownerResult = await EmailService.sendOrderNotificationToOwner(
      mockOrder, 
      mockCustomer, 
      mockBusiness
    );

    if (orderResult && ownerResult) {
      console.log('✅ Order email tests PASSED!');
      console.log('📧 Check your email for order confirmation and owner notification');
      return true;
    } else {
      console.log('❌ Order email tests FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Order email test error:', error);
    return false;
  }
};

// 🚀 RUN ALL TESTS
export const runSendGridTests = async () => {
  console.log('🚀 Starting SendGrid Tests...\n');
  console.log('═'.repeat(50));
  
  let passedTests = 0;
  let totalTests = 3;

  // Test 1: Basic Email
  console.log('\n📧 TEST 1: Basic Email Sending');
  console.log('─'.repeat(30));
  if (await testBasicEmail()) {
    passedTests++;
  }

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: OTP Email
  console.log('\n🔢 TEST 2: OTP Email System');
  console.log('─'.repeat(30));
  if (await testOTPEmail()) {
    passedTests++;
  }

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Order Emails
  console.log('\n🛒 TEST 3: Order Email System');
  console.log('─'.repeat(30));
  if (await testOrderEmail()) {
    passedTests++;
  }

  // Results
  console.log('\n' + '═'.repeat(50));
  console.log('🎯 TEST RESULTS');
  console.log('─'.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('🚀 Your email system is ready for production!');
    console.log('\n📧 Check your email inbox for test messages.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
    console.log('💡 Common issues:');
    console.log('   - API key not set correctly in .env');
    console.log('   - Domain authentication not complete');
    console.log('   - Sender emails not verified');
  }
  
  console.log('\n' + '═'.repeat(50));
};

// Simple function to run just basic test
export const quickTest = async () => {
  console.log('⚡ Quick SendGrid Test...');
  const result = await testBasicEmail();
  if (result) {
    console.log('🎉 SendGrid is working! Run full tests for complete verification.');
  } else {
    console.log('❌ SendGrid setup needs attention. Check your configuration.');
  }
  return result;
};