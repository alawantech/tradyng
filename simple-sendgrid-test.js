import sgMail from '@sendgrid/mail';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module  await testBasicEmail();
  console.log('');
  await testCustomBrandedEmails();
  
  console.log('');
  console.log('✨ Custom email branding tests completed!');
  console.log('');
  console.log('📋 What You Just Saw:');
  console.log('✅ 4 different email styles sent to your inbox');
  console.log('✅ Custom store names and themes');
  console.log('✅ Different colors for each store type'); 
  console.log('✅ Branded subject lines and content');
  console.log('✅ Store-specific contact information');
  console.log('');
  console.log('🎯 Your platform can now send personalized emails for each store!');lename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file manually
function loadEnvFile() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    return {};
  }
}

const envVars = loadEnvFile();
const SENDGRID_API_KEY = envVars.VITE_SENDGRID_API_KEY || process.env.VITE_SENDGRID_API_KEY;
const FROM_EMAIL = envVars.VITE_FROM_EMAIL || process.env.VITE_FROM_EMAIL || 'noreply@rady.ng';

if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'SG.paste_your_real_api_key_here') {
  console.error('❌ SendGrid API Key not configured properly!');
  console.log('');
  console.log('📝 To test SendGrid emails, please:');
  console.log('1. Go to your SendGrid account (https://app.sendgrid.com)');
  console.log('2. Navigate to Settings > API Keys');
  console.log('3. Copy your API key');
  console.log('4. Update the .env file in this project:');
  console.log('   Replace: VITE_SENDGRID_API_KEY=SG.paste_your_real_api_key_here');
  console.log('   With:    VITE_SENDGRID_API_KEY=your_actual_api_key');
  console.log('5. Run this test again');
  console.log('');
  console.log('💡 Your API key should start with "SG." and be about 69 characters long');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function testBasicEmail() {
  console.log('🧪 Testing basic SendGrid email...');
  
  const msg = {
    to: 'abubakarlawan671@gmail.com', // Your actual email address
    from: FROM_EMAIL,
    subject: 'SendGrid Test - Basic Email from Tradyng',
    text: 'This is a test email sent via SendGrid from your Tradyng platform.',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">📧 SendGrid Test Email</h1>
          <p style="color: #666; margin: 5px 0;">From your Tradyng platform</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">✅ Success!</h3>
          <p>Your SendGrid email integration is working correctly.</p>
          <p>This test confirms that your platform can send emails for:</p>
          <ul>
            <li>Customer registration with OTP codes</li>
            <li>Order confirmations</li>
            <li>Order approval notifications</li>
            <li>Delivery confirmations</li>
          </ul>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            <strong>Test Details:</strong><br>
            Time sent: ${new Date().toISOString()}<br>
            From: ${FROM_EMAIL}<br>
            Platform: Tradyng E-commerce
          </p>
        </div>
      </div>
    `,
  };

  try {
    console.log(`📤 Sending test email to: ${msg.to}`);
    console.log(`📧 From address: ${FROM_EMAIL}`);
    
    await sgMail.send(msg);
    console.log('✅ Basic email sent successfully!');
    console.log('📬 Check your email inbox (including spam folder)');
  } catch (error) {
    console.error('❌ Failed to send basic email:');
    console.error('Error details:', error.response?.body || error.message);
    
    if (error.response?.body?.errors) {
      error.response.body.errors.forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }
  }
}

async function testCustomBrandedEmails() {
  console.log('🎨 Testing Custom Store-Branded Emails...');
  
  // Test different store themes
  const stores = [
    {
      name: "TechHub Electronics",
      color: "#1E40AF",
      emoji: "💻",
      from: "TechHub Team"
    },
    {
      name: "Bella Fashion Boutique", 
      color: "#EC4899",
      emoji: "👗",
      from: "Bella Fashion Team"
    },
    {
      name: "Mario's Italian Kitchen",
      color: "#DC2626", 
      emoji: "🍝",
      from: "Mario's Kitchen"
    }
  ];

  for (const store of stores) {
    console.log(`\n${store.emoji} Testing ${store.name}...`);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const msg = {
      to: 'abubakarlawan671@gmail.com',
      from: `${store.from} <noreply@rady.ng>`,
      subject: `${store.emoji} Verify Your ${store.name} Account`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px; background: ${store.color}; color: white; padding: 20px; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 28px;">${store.emoji} ${store.name}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #333; margin-top: 0;">Complete Your Registration</h2>
            <p style="font-size: 18px; margin-bottom: 20px;">Your verification code is:</p>
            
            <div style="background: white; border: 3px solid ${store.color}; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: ${store.color}; letter-spacing: 4px;">${otp}</span>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">⏰ This code expires in 24 hours</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Need help? Contact us at support@${store.name.toLowerCase().replace(/[^a-z]/g, '')}.rady.ng
            </p>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ ${store.name} themed email sent!`);
      console.log(`📧 OTP Code: ${otp}`);
    } catch (error) {
      console.error(`❌ Failed to send ${store.name} email:`, error.message);
    }
  }
}

async function runQuickTests() {
  console.log('🚀 Starting SendGrid Custom Branding Tests');
  console.log('=' * 50);
  console.log(`📧 Using FROM_EMAIL: ${FROM_EMAIL}`);
  console.log(`🔑 API Key configured: ${SENDGRID_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🔑 API Key format: ${SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'None'}`);
  console.log('');
  console.log('🎨 Testing multiple store branding themes...');
  console.log('');
  
  await testBasicEmail();
  console.log('');
  await testOTPEmail();
  
  console.log('');
  console.log('✨ SendGrid tests completed!');
  console.log('');
  console.log('� Next Steps:');
  console.log('1. Check your email inbox (and spam folder)');
  console.log('2. If emails arrived, your SendGrid integration is working!');
  console.log('3. Update the email addresses in the test file to your real email');
  console.log('4. Your platform is ready to send customer emails');
}

runQuickTests().catch(console.error);