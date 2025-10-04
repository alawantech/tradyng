// Test SendGrid integration
import { EmailService } from '../services/emailService';

export const testSendGridSetup = async () => {
  console.log('🧪 Testing SendGrid setup...');
  
  try {
    // Test basic email sending
    const testResult = await EmailService.sendEmail({
      to: 'your-email@gmail.com', // Replace with your actual email
      from: 'verification@rady.ng',
      subject: '🎉 SendGrid Test - Your Email System is Working!',
      html: `
        <h2 style="color: #3B82F6;">✅ SendGrid Setup Successful!</h2>
        <p>Congratulations! Your email system is now working correctly.</p>
        <p><strong>What this means:</strong></p>
        <ul>
          <li>✅ API key is configured correctly</li>
          <li>✅ Domain authentication is working</li>
          <li>✅ Sender email is verified</li>
          <li>✅ Your e-commerce platform can send emails</li>
        </ul>
        <p>Next steps:</p>
        <ol>
          <li>Test OTP registration flow</li>
          <li>Test order confirmation emails</li>
          <li>Configure remaining sender emails</li>
        </ol>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This test email was sent from your Rady.ng e-commerce platform using SendGrid.
        </p>
      `,
      text: 'SendGrid test successful! Your email system is working.'
    });

    if (testResult) {
      console.log('✅ SendGrid test email sent successfully!');
      console.log('📧 Check your email inbox for the test message.');
      return { success: true, message: 'SendGrid is configured correctly!' };
    } else {
      throw new Error('Email sending failed');
    }
    
  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
    return { 
      success: false, 
      error: 'SendGrid configuration issue. Check your API key and domain authentication.' 
    };
  }
};

// Test OTP functionality
export const testOTPFlow = async () => {
  console.log('🧪 Testing OTP flow...');
  
  try {
    const testEmail = 'your-email@gmail.com'; // Replace with your email
    const businessName = 'Test Store';
    
    // This will generate an OTP and send it via email
    const result = await EmailService.sendRegistrationOTP(testEmail, '123456', businessName);
    
    if (result) {
      console.log('✅ OTP email sent successfully!');
      console.log('📧 Check your email for the verification code.');
      return { success: true, message: 'OTP system working!' };
    } else {
      throw new Error('OTP email failed');
    }
    
  } catch (error) {
    console.error('❌ OTP test failed:', error);
    return { success: false, error: 'OTP system configuration issue.' };
  }
};

// How to run these tests:
export const runAllTests = async () => {
  console.log('🚀 Starting SendGrid tests...\n');
  
  const basicTest = await testSendGridSetup();
  console.log('Basic Test Result:', basicTest);
  
  if (basicTest.success) {
    console.log('\n⏳ Testing OTP flow...');
    const otpTest = await testOTPFlow();
    console.log('OTP Test Result:', otpTest);
  }
  
  console.log('\n🎉 Tests completed!');
};