// Test OTP email subject customization
import { OTPService } from '../services/otpService';

export const testOTPEmailSubject = async () => {
  const testEmail = 'test@example.com';
  const businessName = 'Test Store';

  console.log('🧪 Testing OTP Email Subject Customization...');
  console.log('📧 Test Email:', testEmail);
  console.log('🏪 Business Name:', businessName);
  console.log('📨 Expected Subject: "Your Test Store verification code"');

  try {
    const result = await OTPService.sendOTP(testEmail, businessName);

    if (result.success) {
      console.log('✅ OTP sent successfully!');
      console.log('📧 Check your email for the verification code');
      console.log('🔍 Verify the email subject shows:', `"Your ${businessName} verification code"`);
      console.log('💡 If subject shows "Your Rady.ng verification code" instead, the customization failed');
    } else {
      console.log('❌ Failed to send OTP:', result.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Uncomment to run the test
// testOTPEmailSubject();