// Quick test to verify WhatsApp appears in OTP emails
import { OTPService } from '../services/otpService';

export const testWhatsAppInEmail = async () => {
  console.log('🔍 Testing WhatsApp contact in emails...');
  
  const testEmail = 'test@example.com';
  const businessId = 'demo-business-id';
  const businessName = 'Demo Beauty Store';
  
  console.log('📧 Sending test OTP with WhatsApp contact...');
  const result = await OTPService.sendOTP(testEmail, businessId, businessName);
  
  console.log('📧 Result:', result);
  console.log('✅ Check your email for the WhatsApp contact section!');
  console.log('📱 Expected: WhatsApp button with +2348123456789');
};

// To test, uncomment the line below and run this in console:
// testWhatsAppInEmail();

export default testWhatsAppInEmail;