import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY || functions.config()?.sendgrid?.api_key;
if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
  sgMail.setApiKey(sendGridApiKey);
  console.log('SendGrid initialized successfully');
} else {
  console.warn('SendGrid API key not found or invalid format. Email sending will fail.');
}

interface EmailRequest {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

interface OTPEmailRequest {
  email: string;
  otp: string;
  storeName: string;
  storeColor?: string;
  supportEmail?: string;
}

// Generic email sending function
export const sendEmail = functions.https.onCall(async (request, response) => {
  const data = request.data as EmailRequest;
  try {
    // Validate request
    if (!data.to || !data.from || !data.subject || !data.html) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: to, from, subject, html'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to) || !emailRegex.test(data.from)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email format'
      );
    }

    // Check if SendGrid is configured
    if (!sendGridApiKey || !sendGridApiKey.startsWith('SG.')) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Email service not configured. Please set up SendGrid API key.'
      );
    }

    // Send email via SendGrid
    const msg = {
      to: data.to,
      from: data.from,
      subject: data.subject,
      html: data.html,
      text: data.text || undefined,
    };

    await sgMail.send(msg);

    console.log(`Email sent successfully to: ${data.to}`);
    return { 
      success: true, 
      message: 'Email sent successfully' 
    };

  } catch (error) {
    console.error('SendGrid error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send email',
      error
    );
  }
});

// Specialized OTP email function
export const sendOTPEmail = functions.https.onCall(async (request, response) => {
  const data = request.data as OTPEmailRequest;
  try {
    // Validate OTP request
    if (!data.email || !data.otp || !data.storeName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: email, otp, storeName'
      );
    }

    // Validate OTP format (4 digits)
    if (!/^\d{4}$/.test(data.otp)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'OTP must be 4 digits'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email format'
      );
    }

    // Check if SendGrid is configured
    if (!sendGridApiKey || !sendGridApiKey.startsWith('SG.')) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Email service not configured. Please set up SendGrid API key.'
      );
    }

    const primaryColor = data.storeColor || '#3B82F6';
    const fromEmail = 'noreply@rady.ng';

    // Create simple, concise OTP email template that shows code immediately
    const subject = `${data.otp} - ${data.storeName} verification code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; text-align: center;">
          
          <!-- Store Name/Logo -->
          <h1 style="margin: 0 0 20px; color: ${primaryColor}; font-size: 24px; font-weight: bold;">${data.storeName}</h1>
          
          <!-- OTP Code - Large and Prominent -->
          <div style="background: ${primaryColor}; color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px;">Your verification code:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">
              ${data.otp}
            </div>
          </div>
          
          <!-- Simple Instructions -->
          <p style="margin: 20px 0 0; color: #666; font-size: 14px;">
            Enter this code to complete registration. Expires in 3 minutes.
          </p>
          
        </div>
      </body>
      </html>
    `;

    const text = `${data.storeName}\n\nYour verification code: ${data.otp}\n\nExpires in 3 minutes.`;

    // Send email via SendGrid
    const msg = {
      to: data.email,
      from: `${data.storeName} <${fromEmail}>`,
      subject,
      html,
      text,
    };

    await sgMail.send(msg);

    console.log(`OTP email sent successfully to: ${data.email}`);
    return { 
      success: true, 
      message: `Verification code sent to ${data.email}` 
    };

  } catch (error) {
    console.error('OTP email error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send OTP email',
      error
    );
  }
});

// Health check function
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Tradyng Email Functions are running'
  });
});