// Quick test for OTP service functionality
import { OTPService } from '../services/otpService';

export const testOTPService = async () => {
  const testEmail = 'test@example.com';
  const businessName = 'Test Store';

  console.log('Testing OTP Service...');

  try {
    // Test 1: Send OTP
    console.log('1. Sending OTP...');
    const sendResult = await OTPService.sendOTP(testEmail, businessName);
    console.log('Send result:', sendResult);

    if (sendResult.success) {
      console.log('✅ OTP sent successfully');
      console.log('📧 Check your email for the OTP code - subject should show:', `Your ${businessName} verification code`);
      
      // Test 2: Test invalid OTP
      console.log('2. Testing invalid OTP...');
      const invalidResult = await OTPService.verifyOTP(testEmail, '0000');
      console.log('Invalid OTP result:', invalidResult);
      
      if (!invalidResult.valid) {
        console.log('✅ Invalid OTP correctly rejected');
      }
    } else {
      console.log('❌ Failed to send OTP:', sendResult.message);
    }

  } catch (error) {
    console.error('❌ OTP test failed:', error);
  }
};

// Uncomment to run the test
// testOTPService();