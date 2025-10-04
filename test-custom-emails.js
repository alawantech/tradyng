import { EmailService } from './src/services/emailService.js';

// Test the new customizable email system
const testStoreBranding = {
  storeName: "TechHub Electronics",
  storeUrl: "https://techhub.rady.ng",
  logoUrl: "https://via.placeholder.com/200x60/1E40AF/FFFFFF?text=TechHub",
  primaryColor: "#1E40AF", // Blue theme
  accentColor: "#10B981", // Green accents
  supportEmail: "support@techhub.rady.ng",
  phone: "+1 (555) 123-4567",
  address: "123 Tech Street, Silicon Valley, CA 94025",
  customFromName: "TechHub Team"
};

const fashionStoreBranding = {
  storeName: "Bella Fashion Boutique",
  storeUrl: "https://bella.rady.ng",
  logoUrl: "https://via.placeholder.com/200x60/EC4899/FFFFFF?text=Bella+Fashion",
  primaryColor: "#EC4899", // Pink theme
  accentColor: "#8B5CF6", // Purple accents
  supportEmail: "hello@bella.rady.ng",
  phone: "+1 (555) 987-6543",
  address: "456 Fashion Ave, New York, NY 10001",
  customFromName: "Bella Fashion Team"
};

async function testCustomEmails() {
  console.log('🎨 Testing Customizable Email System\n');
  
  const customerEmail = 'abubakarlawan671@gmail.com';
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Test 1: Tech store OTP with blue theme
  console.log('📧 Sending Tech Store OTP (Blue Theme)...');
  const techOTPResult = await EmailService.sendRegistrationOTP(
    customerEmail,
    otp,
    testStoreBranding,
    "🔐 Secure Your TechHub Account - Verification Required"
  );
  console.log(`Tech OTP sent: ${techOTPResult ? '✅' : '❌'}`);
  console.log(`OTP Code: ${otp}\n`);
  
  // Test 2: Fashion store OTP with pink theme
  console.log('📧 Sending Fashion Store OTP (Pink Theme)...');
  const fashionOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const fashionOTPResult = await EmailService.sendRegistrationOTP(
    customerEmail,
    fashionOTP,
    fashionStoreBranding,
    "✨ Welcome to Bella Fashion - Complete Your Registration"
  );
  console.log(`Fashion OTP sent: ${fashionOTPResult ? '✅' : '❌'}`);
  console.log(`Fashion OTP Code: ${fashionOTP}\n`);
  
  // Test 3: Order notification with custom branding
  const mockOrder = {
    id: 'TECH-12345',
    total: 299.99,
    items: [
      { name: 'iPhone 15 Pro', quantity: 1, price: 299.99 }
    ]
  };
  
  const mockCustomer = {
    email: customerEmail,
    name: 'Abubakar Lawan',
    phone: '+1234567890'
  };
  
  console.log('📧 Sending Tech Store Order Notification...');
  const orderResult = await EmailService.sendOrderNotificationToOwner(
    mockOrder,
    mockCustomer,
    testStoreBranding,
    "💻 Urgent: High-Value Tech Order Received - Process Immediately"
  );
  console.log(`Order notification sent: ${orderResult ? '✅' : '❌'}\n`);
  
  console.log('🎉 Custom email tests completed!');
  console.log('📬 Check your email to see the different store branding styles');
  console.log('\n📋 Features Demonstrated:');
  console.log('✅ Custom store names and subjects');
  console.log('✅ Different color themes per store');
  console.log('✅ Custom logos and branding');
  console.log('✅ Personalized from names');
  console.log('✅ Store-specific contact information');
}

testCustomEmails().catch(console.error);