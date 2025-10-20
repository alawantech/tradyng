import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize MailerSend token
const mailerSendToken = process.env.MAIL_SENDER_API_TOKEN || functions.config()?.mail?.sender_api_token || process.env.MAIL_SENDER_API_TOKEN;
const mailerSendUrl = process.env.MAIL_SENDER_API_URL || functions.config()?.mail?.sender_api_url || 'https://api.mailersend.com/v1/email';

if (!mailerSendToken) {
  console.warn('MAIL_SENDER_API_TOKEN not found. Email sending will fail.');
} else {
  console.log('MailerSend token found, emails will be sent via MailerSend HTTP API');
}

async function sendViaMailerSend(payload: any, url = mailerSendUrl) {
  if (!mailerSendToken) {
    throw new functions.https.HttpsError('failed-precondition', 'Email service not configured.');
  }

  const candidateUrls = [url, 'https://api.mailersend.com/v1/email', 'https://api.mailersend.com/v1.1/email'];

  const tried: Array<any> = [];
  for (const candidate of candidateUrls) {
    if (!candidate) continue;
    try {
      console.log('MailerSend: attempting', candidate);
      const res = await fetch(candidate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mailerSendToken}`
        },
        body: JSON.stringify(payload),
        // set a short timeout via AbortController if desired in future
      });

      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch (e) { json = text; }

      if (res.ok) {
        console.log('MailerSend success:', candidate);
        return json;
      }

      console.warn('MailerSend non-ok response:', res.status, candidate);
      tried.push({ url: candidate, status: res.status, body: json });
      // try next candidate
    } catch (errAny) {
      const e: any = errAny;
      console.error('MailerSend request error for', candidate, e && e.message ? e.message : e);
      tried.push({ url: candidate, error: String(e) });
    }
  }

  console.error('MailerSend: all attempts failed', tried);
  throw new functions.https.HttpsError('internal', 'Failed to send email via MailerSend', { tried });
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
  whatsappNumber?: string;
  isPasswordReset?: boolean; // Flag to identify password reset emails
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

    // Build payload for MailerSend
    const payload = {
      from: { email: data.from },
      to: [{ email: data.to }],
      subject: data.subject,
      text: data.text || undefined,
      html: data.html
    };

    // Send using MailerSend HTTP API
    await sendViaMailerSend(payload);

    console.log(`Email sent successfully to: ${data.to}`);
    return { 
      success: true, 
      message: 'Email sent successfully' 
    };

  } catch (error) {
  console.error('Email service error:', error);
    
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

    // Build MailerSend payload

    const primaryColor = data.storeColor || '#3B82F6';
    const fromEmail = 'noreply@rady.ng';
    const isPasswordReset = data.isPasswordReset || false;

    // Create simple, concise OTP email template that shows code immediately
    const subject = isPasswordReset 
      ? `${data.otp} - ${data.storeName} password reset code`
      : `${data.otp} - ${data.storeName} verification code`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isPasswordReset ? 'Password Reset Code' : 'Verification Code'}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; text-align: center;">
          
          <!-- Store Name/Logo -->
          <h1 style="margin: 0 0 20px; color: ${primaryColor}; font-size: 24px; font-weight: bold;">${data.storeName}</h1>
          
          ${isPasswordReset ? `
          <!-- Password Reset Notice -->
          <p style="margin: 0 0 20px; color: #666; font-size: 16px;">Password Reset Request</p>
          ` : ''}
          
          <!-- OTP Code - Large and Prominent -->
          <div style="background: ${primaryColor}; color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px;">${isPasswordReset ? 'Your password reset code:' : 'Your verification code:'}</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">
              ${data.otp}
            </div>
          </div>
          
          <!-- Simple Instructions -->
          <p style="margin: 20px 0 0; color: #666; font-size: 14px;">
            ${isPasswordReset ? 'Enter this code to reset your password. Expires in 5 minutes.' : 'Enter this code to complete registration. Expires in 5 minutes.'}
          </p>
          
          ${data.whatsappNumber ? `
          <!-- WhatsApp Contact -->
          <div style="margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="margin: 0 0 10px; color: #666; font-size: 13px;">Need help? Contact us on WhatsApp:</p>
            <a href="https://wa.me/${data.whatsappNumber.replace(/[^\d]/g, '')}" 
               style="display: inline-flex; align-items: center; text-decoration: none; background: #25D366; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.50 3.555"/>
              </svg>
              ${data.whatsappNumber}
            </a>
          </div>
          ` : ''}
          
        </div>
      </body>
      </html>
    `;

    const text = `${data.storeName}\n\n${isPasswordReset ? 'Password Reset Request\n\n' : ''}Your ${isPasswordReset ? 'password reset' : 'verification'} code: ${data.otp}\n\nExpires in 5 minutes.${data.whatsappNumber ? `\n\nNeed help? WhatsApp: ${data.whatsappNumber}` : ''}`;

    const payload = {
      from: { email: fromEmail, name: data.storeName },
      to: [{ email: data.email }],
      subject,
      text,
      html
    };

    await sendViaMailerSend(payload);

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

// Temporary test endpoint: create OTP record and send OTP email via MailerSend
// Usage (POST JSON): { "email": "user@example.com", "businessId": "", "businessName": "Test Store" }
export const testSendOTP = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const { email, businessId, businessName } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).send({ error: 'Missing email in request body' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).send({ error: 'Invalid email format' });
      return;
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000); // 5 minutes

    // Store OTP in Firestore
    const otpRecord = {
      email: email.toLowerCase(),
      otp,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      isUsed: false,
      attempts: 0,
      businessId: businessId || null,
      businessName: businessName || null,
      createdAt: admin.firestore.Timestamp.fromDate(now)
    };

    await admin.firestore().collection('email_otps').add(otpRecord as any);

    // Build email content (reuse same template as sendOTPEmail)
    const primaryColor = '#3B82F6';
    const fromEmail = 'noreply@rady.ng';
    const subject = `${otp} - ${(businessName || 'Store')} verification code`;
    const html = `<!DOCTYPE html><html><body><div style="max-width:500px;margin:0 auto;background:white;padding:30px;text-align:center;"><h1 style="color:${primaryColor}">${businessName || 'Store'}</h1><div style="background:${primaryColor};color:white;border-radius:8px;padding:20px;margin:20px 0;"><div style="font-size:36px;font-weight:bold;letter-spacing:4px;font-family:monospace;">${otp}</div></div><p>Enter this code to complete registration. Expires in 5 minutes.</p></div></body></html>`;
    const text = `${businessName || 'Store'}\n\nYour verification code: ${otp}\n\nExpires in 5 minutes.`;

    const payload = {
      from: { email: fromEmail, name: businessName || 'Store' },
      to: [{ email }],
      subject,
      text,
      html
    };

    // Send via MailerSend (will try fallback URLs internally)
    await sendViaMailerSend(payload);

    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (errAny) {
    console.error('testSendOTP error:', errAny);
    res.status(500).send({ error: 'Failed to send OTP', details: String(errAny) });
  }
});