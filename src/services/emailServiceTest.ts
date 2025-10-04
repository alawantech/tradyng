import { EmailService } from './emailService';

// Test the email service with Firebase Functions
async function testEmailService() {
  console.log('🧪 Testing Firebase Functions Email Service...');
  
  try {
    const result = await EmailService.sendRegistrationOTP(
      'test@example.com',
      '123456',
      {
        storeName: 'Test Store',
        primaryColor: '#3B82F6',
        supportEmail: 'support@teststore.com'
      }
    );
    
    if (result) {
      console.log('✅ Email service test passed!');
    } else {
      console.log('❌ Email service test failed!');
    }
  } catch (error) {
    console.error('❌ Email service test error:', error);
  }
}

// Uncomment to test
// testEmailService();