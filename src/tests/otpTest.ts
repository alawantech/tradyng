// Quick test for OTP service functionality
import { OTPService } from '../services/otpService';

export const testOTPService = async () => {
  const testEmail = 'test@example.com';
  const businessId = 'test-business';
  const businessName = 'Test Store';

  console.log('Testing OTP Service...');

  try {
    // Test 1: Send OTP
    console.log('1. Sending OTP...');
    const sendResult = await OTPService.sendOTP(testEmail, businessId, businessName);
    console.log('Send result:', sendResult);

    if (sendResult.success) {
      console.log('✅ OTP sent successfully');
      
      // Test 2: Check if OTP exists
      console.log('2. Checking if OTP exists...');
      const hasOTP = await OTPService.hasValidOTP(testEmail);
      console.log('Has valid OTP:', hasOTP);
      
      if (hasOTP) {
        console.log('✅ OTP exists in database');
        
        // Test 3: Get OTP expiry
        console.log('3. Getting OTP expiry...');
        const expiry = await OTPService.getOTPExpiry(testEmail);
        console.log('OTP expires at:', expiry);
        
        if (expiry) {
          console.log('✅ OTP expiry retrieved');
          
          // Note: In a real test, you would need the actual OTP from the email
          // For testing purposes, you could manually check your email and verify
          console.log('📧 Check your email for the OTP code to test verification');
          
          // Test 4: Test invalid OTP
          console.log('4. Testing invalid OTP...');
          const invalidResult = await OTPService.verifyOTP(testEmail, '000000');
          console.log('Invalid OTP result:', invalidResult);
          
          if (!invalidResult.valid) {
            console.log('✅ Invalid OTP correctly rejected');
          }
        }
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