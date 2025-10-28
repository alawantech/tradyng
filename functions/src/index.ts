import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Initialize Firebase Admin
admin.initializeApp();

// Helper function to format currency
function formatCurrency(amount: number, currencyCode: string): string {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'KES': 'KSh',
    'GHS': '₵',
    'ZAR': 'R',
    'TZS': 'TSh',
    'UGX': 'USh',
    'ZMW': 'ZK',
    'BWP': 'P',
    'MUR': '₨',
    'SCR': '₨',
    'MAD': 'MAD',
    'DZD': 'DZD',
    'TND': 'TND',
    'EGP': 'EGP',
    'LYD': 'LYD',
    'SDG': 'SDG',
    'SSP': 'SSP',
    'ETB': 'ETB',
    'XAF': 'FCFA',
    'XOF': 'CFA',
    'CDF': 'CDF',
    'BIF': 'FBu',
    'RWF': 'RF',
    'DJF': 'Fdj',
    'SOS': 'Sh'
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const OTP_COLLECTION = 'emailOtps';
const RESET_OTP_COLLECTION = 'passwordResetOtps';

function generateNumericOtp(length = 4) {
  const max = 10 ** length;
  const num = Math.floor(Math.random() * (max - 1)) + 1;
  return num.toString().padStart(length, '0');
}

function hashOtp(otp: string, salt: string) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

async function sendEmailViaMailerSend(to: string, subject: string, html: string) {
  // Try MailerSend first if configured, otherwise fall back to SendGrid if provided.
  const configuredUrl = process.env.MAIL_SENDER_API_URL;
  const mailerToken = process.env.MAIL_SENDER_API_TOKEN?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();

  // helper: attempt MailerSend
  const tryMailerSend = async () => {
    if (!mailerToken) throw new Error('MailerSend token not configured');
    try {
      console.info('MAIL_SENDER_API_TOKEN_MASKED:', mailerToken ? `${mailerToken.slice(0,6)}...${mailerToken.slice(-4)}` : 'MISSING', 'len=', mailerToken ? mailerToken.length : 0);
    } catch (e) {}

    const candidateUrls: string[] = [];
    if (configuredUrl) candidateUrls.push(configuredUrl);
    candidateUrls.push('https://api.mailersend.com/v1/email');

        const payload = {
      from: { email: 'no-reply@rady.ng', name: 'Rady.ng' },
      to: [{ email: to }],
      subject,
      html
    };
    let lastErr: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mailerToken}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          // if 404, try next
          if (res.status === 404) { lastErr = { url, status: res.status, body: text.slice(0,200) }; continue; }
          throw new Error(`MailerSend error: ${res.status} ${text}`);
        }
        const txt = await res.text().catch(() => '');
        try { return JSON.parse(txt); } catch (_) { return txt; }
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('MailerSend unknown error');
  };

  // helper: attempt SendGrid
  const trySendGrid = async () => {
    if (!sendgridKey) throw new Error('SendGrid API key not configured');
    const payload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'no-reply@rady.ng', name: 'Rady.ng' },
      subject,
      content: [{ type: 'text/html', value: html }]
    };
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sendgridKey}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`SendGrid error: ${res.status} ${body}`);
    }
    return { ok: true };
  };

  // Try providers in order
  // 1) MailerSend (preferred)
  // 2) SendGrid (fallback)
  const extractMsg = (e: unknown) => {
    if (!e) return String(e);
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  try {
    return await tryMailerSend();
  } catch (mailerErrUnknown) {
    const mailerMsg = extractMsg(mailerErrUnknown);
    console.warn('MailerSend failed:', mailerMsg);
    if (sendgridKey) {
      try { return await trySendGrid(); } catch (sgErrUnknown) {
        const sgMsg = extractMsg(sgErrUnknown);
        console.error('SendGrid also failed:', sgMsg);
        throw new Error(`Email providers failed: ${mailerMsg} ; ${sgMsg}`);
      }
    }

    // If no other provider and we're in non-production (local/dev), log and continue so devs can test
    if (process.env.NODE_ENV !== 'production') {
      console.warn('No email provider configured; running in non-production mode — logging email content instead of sending.');
      console.info(`DEV EMAIL TO=${to} SUBJECT=${subject} HTML=${html}`);
      return { ok: true, debug: true } as any;
    }

    // production: rethrow mailer error with helpful hint
    throw new Error(`MailerSend failed and no fallback provider configured. ${mailerMsg}`);
  }
}

// sendOtp: POST { email, businessName }
export const sendOtp = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  // Log masked presence of the secret early to help diagnose secret injection issues
  try {
    const t = process.env.MAIL_SENDER_API_TOKEN?.trim();
    console.info('sendOtp - MAIL_SENDER_API_TOKEN_MASKED:', t ? `${t.slice(0,6)}...${t.slice(-4)}` : 'MISSING', 'len=', t ? t.length : 0);
  } catch (e) {}
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const { email, businessName } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).send({ error: 'Missing email' });
      return;
    }

  // generate OTP
  const otp = generateNumericOtp(4);
  // DEBUG: log only length (never log actual OTP value)
  try { console.info('OTP_LEN', otp.length); } catch (e) {}
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(otp, salt);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Use a sanitized doc id to avoid invalid characters in doc path
    const docId = encodeURIComponent(email);
    const docRef = admin.firestore().collection(OTP_COLLECTION).doc(docId);

    // Throttle: if an OTP was sent less than 60s ago, reject
    const existing = await docRef.get();
    if (existing.exists) {
      const ex = existing.data() as any;
      if (ex && ex.createdAt && Date.now() - ex.createdAt < 60 * 1000) {
        res.status(429).send({ error: 'OTP recently requested. Please wait a minute before requesting again.' });
        return;
      }
    }

    // store in firestore
    await docRef.set({
      email,
      otpHash,
      salt,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    // send email
    const subject = `Your ${businessName || 'Rady.ng'} verification code`;
    const html = `<p>Your verification code is:</p><h1 style="font-size: 48px; font-weight: bold; color: #333; text-align: center;">${otp}</h1><p>This code expires in 10 minutes.</p>`;
    await sendEmailViaMailerSend(email, subject, html);

    res.json({ ok: true });
  } catch (errAny) {
    console.error('sendOtp error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// verifyOtp: POST { email, code }
export const verifyOtp = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  // Log masked presence of the secret early to help diagnose secret injection issues
  try {
    const t = process.env.MAIL_SENDER_API_TOKEN?.trim();
    console.info('verifyOtp - MAIL_SENDER_API_TOKEN_MASKED:', t ? `${t.slice(0,6)}...${t.slice(-4)}` : 'MISSING', 'len=', t ? t.length : 0);
  } catch (e) {}
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const { email, code } = req.body || {};
    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      res.status(400).send({ error: 'Missing email or code' });
      return;
    }

  const docId = encodeURIComponent(email);
  const docRef = admin.firestore().collection(OTP_COLLECTION).doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      res.status(400).send({ error: 'No code requested for this email' });
      return;
    }

    const data = snap.data() as any;
    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      res.status(400).send({ error: 'Code expired' });
      return;
    }

    if (data.attempts >= 5) {
      await docRef.delete();
      res.status(429).send({ error: 'Too many attempts' });
      return;
    }

    const computed = hashOtp(code, data.salt);
    if (computed === data.otpHash) {
      await docRef.delete();
      res.json({ ok: true });
    } else {
      await docRef.update({ attempts: (data.attempts || 0) + 1 });
      res.status(400).send({ error: 'Invalid code' });
    }
  } catch (errAny) {
    console.error('verifyOtp error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// sendResetOtp: POST { email }
export const sendResetOtp = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  // Log masked presence of the secret early to help diagnose secret injection issues
  try {
    const t = process.env.MAIL_SENDER_API_TOKEN?.trim();
    console.info('sendResetOtp - MAIL_SENDER_API_TOKEN_MASKED:', t ? `${t.slice(0,6)}...${t.slice(-4)}` : 'MISSING', 'len=', t ? t.length : 0);
  } catch (e) {}
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).send({ error: 'Missing email' });
      return;
    }

    // Check if user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord) {
      res.status(400).send({ error: 'No account found with this email address' });
      return;
    }

    // generate OTP
    const otp = generateNumericOtp(4);
    // DEBUG: log only length (never log actual OTP value)
    try { console.info('RESET_OTP_LEN', otp.length); } catch (e) {}
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(otp, salt);
    console.log('DEBUG sendResetOtp generated:', {
      email,
      otpLength: otp.length,
      salt,
      otpHash,
      expiresAt: new Date(Date.now() + 1 * 60 * 1000).toISOString()
    });
    const expiresAt = Date.now() + 1 * 60 * 1000; // 1 minute

    // Use a sanitized doc id to avoid invalid characters in doc path
    const docId = encodeURIComponent(email);
    const docRef = admin.firestore().collection(RESET_OTP_COLLECTION).doc(docId);

    // Throttle: if an OTP was sent less than 60s ago AND it's not expired, reject
    const existing = await docRef.get();
    if (existing.exists) {
      const ex = existing.data() as any;
      if (ex && ex.createdAt && Date.now() - ex.createdAt < 60 * 1000 && Date.now() < ex.expiresAt) {
        res.status(429).send({ error: 'OTP recently requested. Please wait a minute before requesting again.' });
        return;
      }
    }

    // store in firestore
    await docRef.set({
      email,
      otpHash,
      salt,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    // send email
    const subject = 'Your Rady.ng password reset code';
    const html = `<p>Your password reset code is:</p><h1 style="font-size: 48px; font-weight: bold; color: #333; text-align: center; font-family: monospace;">${otp}</h1><p>This code expires in 1 minute.</p>`;
    await sendEmailViaMailerSend(email, subject, html);

    res.json({ ok: true });
  } catch (errAny) {
    console.error('sendResetOtp error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// verifyResetOtp: POST { email, code }
export const verifyResetOtp = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  // Log masked presence of the secret early to help diagnose secret injection issues
  try {
    const t = process.env.MAIL_SENDER_API_TOKEN?.trim();
    console.info('verifyResetOtp - MAIL_SENDER_API_TOKEN_MASKED:', t ? `${t.slice(0,6)}...${t.slice(-4)}` : 'MISSING', 'len=', t ? t.length : 0);
  } catch (e) {}
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const { email, code } = req.body || {};
    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      res.status(400).send({ error: 'Missing email or code' });
      return;
    }

    // Trim whitespace from code
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      res.status(400).send({ error: 'Code cannot be empty' });
      return;
    }

    console.log('DEBUG verifyResetOtp REQUEST:', {
      rawBody: req.body,
      email,
      code,
      trimmedCode,
      codeLength: trimmedCode.length,
      codeType: typeof trimmedCode
    });

    const docId = encodeURIComponent(email);
    const docRef = admin.firestore().collection(RESET_OTP_COLLECTION).doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      res.status(400).send({ error: 'No reset code requested for this email' });
      return;
    }

    const data = snap.data() as any;
    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      res.status(400).send({ error: 'Code expired' });
      return;
    }

    if (data.attempts >= 5) {
      await docRef.delete();
      res.status(429).send({ error: 'Too many attempts' });
      return;
    }

    const computed = hashOtp(trimmedCode, data.salt);
    console.log('DEBUG verifyResetOtp:', {
      email,
      code: trimmedCode,
      storedHash: data.otpHash,
      computedHash: computed,
      salt: data.salt,
      attempts: data.attempts,
      expiresAt: new Date(data.expiresAt).toISOString(),
      now: new Date().toISOString()
    });
    if (computed === data.otpHash) {
      // Mark as verified and store user UID for password reset
      const userRecord = await admin.auth().getUserByEmail(email);
      await docRef.update({ 
        verifiedAt: Date.now(),
        uid: userRecord.uid
      });
      res.json({ ok: true });
    } else {
      await docRef.update({ attempts: (data.attempts || 0) + 1 });
      res.status(400).send({ error: 'Invalid code' });
    }
  } catch (errAny) {
    console.error('verifyResetOtp error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// resetPassword: POST { email, newPassword }
export const resetPassword = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const { email, newPassword } = req.body || {};
    if (!email || typeof email !== 'string' || !newPassword || typeof newPassword !== 'string') {
      res.status(400).send({ error: 'Missing email or newPassword' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).send({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Verify the OTP was recently verified (within last 5 minutes)
    const docId = encodeURIComponent(email);
    const docRef = admin.firestore().collection(RESET_OTP_COLLECTION).doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      res.status(400).send({ error: 'Password reset not authorized' });
      return;
    }

    const data = snap.data() as any;
    // Allow password reset within 1 minute of OTP verification
    if (Date.now() - (data.verifiedAt || 0) > 1 * 60 * 1000) {
      await docRef.delete();
      res.status(400).send({ error: 'Password reset session expired' });
      return;
    }

    // Update the user's password
    await admin.auth().updateUser(data.uid, {
      password: newPassword
    });

    // Clean up the reset OTP
    await docRef.delete();

    res.json({ ok: true });
  } catch (errAny) {
    console.error('resetPassword error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// Temporary test function to verify hash logic
export const testOtpHash = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { code, salt } = req.body || {};
    if (!code || !salt) {
      res.status(400).send({ error: 'Missing code or salt' });
      return;
    }

    const computed = hashOtp(code, salt);
    const testOtp = generateNumericOtp(4);
    const testSalt = crypto.randomBytes(16).toString('hex');
    const testHash = hashOtp(testOtp, testSalt);

    res.json({
      input: { code, salt },
      computedHash: computed,
      testGeneration: {
        otp: testOtp,
        salt: testSalt,
        hash: testHash,
        verification: hashOtp(testOtp, testSalt) === testHash
      }
    });
  } catch (errAny) {
    console.error('testOtpHash error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// Test full OTP flow: create, verify, clean up
export const testFullOtpFlow = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { email, keepRecord } = req.body || {};
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
      return;
    }

    // Generate test OTP
    const testOtp = generateNumericOtp(4);
    const testSalt = crypto.randomBytes(16).toString('hex');
    const testHash = hashOtp(testOtp, testSalt);

    console.log('TEST: Generated OTP:', {
      email,
      otp: testOtp,
      salt: testSalt,
      hash: testHash
    });

    // Store in Firestore
    const docId = encodeURIComponent(email);
    const docRef = admin.firestore().collection(RESET_OTP_COLLECTION).doc(docId);
    await docRef.set({
      email,
      otpHash: testHash,
      salt: testSalt,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
      createdAt: Date.now()
    });

    // Try to verify with correct code
    const computedHash = hashOtp(testOtp, testSalt);
    const verificationResult = computedHash === testHash;

    console.log('TEST: Verification attempt:', {
      originalOtp: testOtp,
      computedHash,
      storedHash: testHash,
      match: verificationResult
    });

    // Clean up unless keepRecord is true
    if (!keepRecord) {
      await docRef.delete();
    }

    res.json({
      testOtp,
      testSalt,
      testHash,
      computedHash,
      verificationResult,
      success: verificationResult,
      docId,
      keepRecord: !!keepRecord
    });
  } catch (errAny) {
    console.error('testFullOtpFlow error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// Debug endpoint to inspect OTP records
export const debugResetOtp = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).send({ error: 'Missing email parameter' });
      return;
    }

    const docId = encodeURIComponent(email);
    const docRef = admin.firestore().collection(RESET_OTP_COLLECTION).doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).send({ error: 'No OTP found for this email' });
      return;
    }

    const data = snap.data() as any;
    res.json({
      email: data.email,
      attempts: data.attempts,
      expiresAt: new Date(data.expiresAt).toISOString(),
      createdAt: new Date(data.createdAt).toISOString(),
      isExpired: Date.now() > data.expiresAt,
      hasSalt: !!data.salt,
      hasOtpHash: !!data.otpHash
    });
  } catch (errAny) {
    console.error('debugResetOtp error:', errAny);
    res.status(500).send({ error: String(errAny) });
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
// testSendOTP has been removed as part of removing email-sending functions.

// sendMessageNotification: POST { businessId, customerId, message, sender, senderName, customerEmail, customerName, businessName, businessEmail }
export const sendMessageNotification = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const {
      businessId,
      customerId,
      message,
      sender,
      senderName,
      customerEmail,
      customerName,
      businessName,
      businessEmail
    } = req.body || {};

    if (!businessId || !customerId || !message || !sender || !customerEmail) {
      res.status(400).send({ error: 'Missing required fields' });
      return;
    }

    let subject: string;
    let html: string;
    let recipientEmail: string;

    if (sender === 'admin') {
      // Admin sent message to customer
      subject = `New message from ${businessName || 'your store'}`;
      recipientEmail = customerEmail;

      // Create customer reply URL (assuming customer dashboard has messages section)
      const replyUrl = `https://yourstore.com/customer/messages?customerId=${customerId}&businessId=${businessId}`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">New Message from ${businessName || 'Your Store'}</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${senderName} (${businessName || 'Store Admin'})</p>
            <p style="margin: 0 0 15px 0;"><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${replyUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reply to Message
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can also reply by logging into your customer account and visiting the Messages section.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This message was sent to ${customerEmail}
          </p>
        </div>
      `;
    } else {
      // Customer sent message to admin
      subject = `New message from ${customerName} (${businessName || 'Store'})`;
      recipientEmail = businessEmail || 'admin@yourstore.com'; // Fallback admin email

      // Create admin reply URL (assuming admin dashboard has messages section)
      const replyUrl = `https://admin.yourstore.com/messages?customerId=${customerId}&businessId=${businessId}`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">New Customer Message</h2>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${customerName} (${customerEmail})</p>
            <p style="margin: 0 0 10px 0;"><strong>Store:</strong> ${businessName || 'Your Store'}</p>
            <p style="margin: 0 0 15px 0;"><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 6px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${replyUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reply to Customer
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can also reply by logging into your admin dashboard and visiting the Messages section.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Customer: ${customerName} (${customerEmail})
          </p>
        </div>
      `;
    }

    await sendEmailViaMailerSend(recipientEmail, subject, html);

    res.json({ ok: true, recipient: recipientEmail });
  } catch (errAny) {
    console.error('sendMessageNotification error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// sendPaymentReceiptNotification: POST { customerEmail, customerName, orderId, businessName, businessEmail, businessPhone }
export const sendPaymentReceiptNotification = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const {
      customerEmail,
      customerName,
      orderId,
      businessName,
      businessEmail,
      businessPhone
    } = req.body || {};

    if (!customerEmail || !orderId || !businessName) {
      res.status(400).send({ error: 'Missing required fields: customerEmail, orderId, businessName' });
      return;
    }

    const subject = `Payment Receipt Submitted - ${businessName}`;
    console.log('DEBUG sendPaymentReceiptNotification:', {
      customerEmail,
      customerName,
      orderId,
      businessName,
      businessEmail,
      businessPhone,
      hasBusinessPhone: !!businessPhone
    });
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Payment Receipt Submitted Successfully</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Hello ${customerName || 'Valued Customer'},</strong></p>
          <p style="margin: 0 0 15px 0;">Thank you for submitting your payment receipt for order #${orderId}.</p>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
            <p style="margin: 0 0 10px 0;"><strong>Order Details:</strong></p>
            <p style="margin: 0 0 5px 0;">Order ID: ${orderId}</p>
            <p style="margin: 0 0 5px 0;">Store: ${businessName}</p>
            <p style="margin: 0;">Status: Awaiting Admin Approval</p>
          </div>
        </div>

        <p style="margin: 20px 0;">
          Your payment receipt has been uploaded and is currently under review by our team.
          You will receive another email once your payment is approved and your order is processed.
        </p>

        ${businessPhone ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-flex; align-items: center; font-weight: bold; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
            <svg style="width: 20px; height: 20px; margin-right: 8px;" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>

        <p style="text-align: center; margin: 15px 0; color: #666; font-size: 14px;">
          If you have any questions, please contact ${businessName} directly via WhatsApp.
        </p>
        ` : `
        <p style="margin: 20px 0;">
          If you have any questions, please contact ${businessName} directly.
        </p>
        `}

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated notification from ${businessName}
        </p>
      </div>
    `;

    await sendEmailViaMailerSend(customerEmail, subject, html);

    res.json({ ok: true, recipient: customerEmail });
  } catch (errAny) {
    console.error('sendPaymentReceiptNotification error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// sendAdminPaymentReceiptNotification: POST { adminEmail, customerName, customerEmail, orderId, businessName, businessId }
export const sendAdminPaymentReceiptNotification = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const {
      adminEmail,
      customerName,
      customerEmail,
      orderId,
      businessName,
      businessId
    } = req.body || {};

    if (!adminEmail || !orderId || !businessName || !businessId) {
      res.status(400).send({ error: 'Missing required fields: adminEmail, orderId, businessName, businessId' });
      return;
    }

    const subject = `New Payment Receipt Submitted - ${businessName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">New Payment Receipt Submitted</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>New payment receipt received for your store!</strong></p>

          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 15px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Order Details:</strong></p>
            <p style="margin: 0 0 5px 0;">Order ID: <strong>${orderId}</strong></p>
            <p style="margin: 0 0 5px 0;">Customer: <strong>${customerName}</strong> (${customerEmail})</p>
            <p style="margin: 0 0 5px 0;">Store: ${businessName}</p>
            <p style="margin: 0;">Status: Payment Receipt Submitted - Awaiting Review</p>
          </div>
        </div>

        <p style="margin: 20px 0;">
          A customer has submitted a payment receipt for their order. Please review the payment details and approve or reject the order.
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated notification for ${businessName}
        </p>
      </div>
    `;

    await sendEmailViaMailerSend(adminEmail, subject, html);

    res.json({ ok: true, recipient: adminEmail });
  } catch (errAny) {
    console.error('sendAdminPaymentReceiptNotification error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// sendOrderDeliveryEmail: POST { customerEmail, customerName, customerPhone, shippingAddress, orderId, businessName, businessEmail, businessPhone, items, total, paymentMethod, createdAt, currency, pdfBase64 }
export const sendOrderDeliveryEmail = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const {
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      orderId,
      businessName,
      businessPhone,
      items,
      total,
      paymentMethod,
      createdAt,
      currency,
      pdfBase64
    } = req.body || {};

    if (!customerEmail || !orderId || !businessName || !pdfBase64) {
      res.status(400).send({ error: 'Missing required fields: customerEmail, orderId, businessName, pdfBase64' });
      return;
    }

    const subject = `Order Delivered - ${businessName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">🚚 Order Delivered Successfully!</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Hello ${customerName || 'Valued Customer'},</strong></p>
          <p style="margin: 0 0 15px 0;">Great news! Your order has been successfully delivered.</p>

          <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 15px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📄 Order Receipt:</strong></p>
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              Your detailed order receipt is attached below. Click to view or download your PDF receipt for your records.
            </p>
          </div>

          <div style="background: #d4edda; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
            <p style="margin: 0 0 10px 0;"><strong>Order Details:</strong></p>
            <p style="margin: 0 0 5px 0;">Order ID: <strong>${orderId}</strong></p>
            <p style="margin: 0 0 5px 0;">Store: ${businessName}</p>
            <p style="margin: 0;">Status: ✅ Delivered</p>
          </div>
        </div>

        <!-- Customer Information -->
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">👤 Customer Information</h3>
          <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: #374151; width: 80px;">Name:</span>
              <span style="color: #111827;">${customerName}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: #374151; width: 80px;">Email:</span>
              <span style="color: #111827;">${customerEmail}</span>
            </div>
            ${customerPhone ? `
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: #374151; width: 80px;">Phone:</span>
              <span style="color: #111827;">${customerPhone}</span>
            </div>
            ` : ''}
            ${shippingAddress ? `
            <div style="display: flex; align-items: flex-start; margin-top: 10px;">
              <span style="font-weight: 600; color: #374151; width: 80px; flex-shrink: 0;">Address:</span>
              <span style="color: #111827;">${shippingAddress.street}${shippingAddress.city ? ', ' + shippingAddress.city : ''}${shippingAddress.state ? ', ' + shippingAddress.state : ''}${shippingAddress.country ? ', ' + shippingAddress.country : ''}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Order Items -->
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">🛒 Order Items</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${items && items.length > 0 ? items.map((item: any) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #111827; font-size: 16px;">${item.productName}</div>
                  <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
                    Qty: <span style="font-weight: 500;">${item.quantity}</span> × ${formatCurrency(item.price, currency)}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: bold; color: #059669;">
                    ${formatCurrency(item.price * item.quantity, currency)}
                  </div>
                </div>
              </div>
            `).join('') : '<p>No items found</p>'}
          </div>
        </div>

        <!-- Order Total & Payment -->
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Total Amount -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 16px; border-radius: 8px; border: 2px solid #10b981;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 20px; font-weight: bold; color: #065f46;">Total Amount:</span>
                <span style="font-size: 24px; font-weight: 900; color: #065f46;">
                  ${formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            <!-- Payment Method -->
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; font-weight: 600; color: #374151;">💳 Payment Method:</span>
                <span style="font-size: 16px; font-weight: bold; color: #111827; background: white; padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db;">
                  ${paymentMethod || 'Manual'}
                </span>
              </div>
            </div>

            <!-- Order Date -->
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; font-weight: 600; color: #374151;">📅 Order Date:</span>
                <span style="font-size: 16px; font-weight: bold; color: #111827;">
                  ${createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p style="margin: 20px 0;">
          Thank you for shopping with us! We hope you enjoy your purchase.
        </p>

        <p style="margin: 20px 0;">
          If you have any questions or concerns about your order, please don't hesitate to contact us.
        </p>

        ${businessPhone ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-flex; align-items: center; font-weight: bold; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
            <svg style="width: 20px; height: 20px; margin-right: 8px;" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            Contact ${businessName}
          </a>
        </div>

        <p style="text-align: center; margin: 15px 0; color: #666; font-size: 14px;">
          Questions about your order? Contact us anytime.
        </p>
        ` : `
        <p style="margin: 20px 0;">
          If you have any questions about your order, please contact ${businessName} directly.
        </p>
        `}

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated notification from ${businessName}
        </p>
      </div>
    `;

    // Convert base64 PDF to buffer for attachment
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Send email with PDF attachment
    await sendEmailWithAttachment(customerEmail, subject, html, pdfBuffer, `receipt-${orderId}.pdf`);

    res.json({ success: true, recipient: customerEmail });
  } catch (error) {
    console.error('sendOrderDeliveryEmail error:', error);
    res.status(500).send({ error: 'Failed to send delivery email' });
  }
});

// sendOrderApprovalEmail: POST { customerEmail, customerName, customerPhone, shippingAddress, orderId, businessName, businessEmail, businessPhone, items, total, paymentMethod, createdAt, currency, pdfBase64 }
export const sendOrderApprovalEmail = functions.https.onRequest({
  secrets: ['MAIL_SENDER_API_TOKEN']
}, async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed, use POST' });
      return;
    }

    const {
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      orderId,
      businessName,
      businessPhone,
      items,
      total,
      paymentMethod,
      createdAt,
      currency,
      pdfBase64
    } = req.body || {};

    if (!customerEmail || !orderId || !businessName || !pdfBase64) {
      res.status(400).send({ error: 'Missing required fields: customerEmail, orderId, businessName, pdfBase64' });
      return;
    }

    const subject = `Order Approved - ${businessName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">🎉 Order Approved!</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Hello ${customerName || 'Valued Customer'},</strong></p>
          <p style="margin: 0 0 15px 0;">Great news! Your order has been approved and is now being processed.</p>

          <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 15px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📄 Order Receipt:</strong></p>
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              Your detailed order receipt is attached below. Click to view or download your PDF receipt for your records.
            </p>
          </div>

          <div style="background: #d4edda; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
            <p style="margin: 0 0 10px 0;"><strong>Order Details:</strong></p>
            <p style="margin: 0 0 5px 0;">Order ID: <strong>${orderId}</strong></p>
            <p style="margin: 0 0 5px 0;">Store: ${businessName}</p>
            <p style="margin: 0;">Status: ✅ Approved & Processing</p>
          </div>
        </div>

        <!-- Customer Information -->
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">👤 Customer Information</h3>
          <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: #374151; width: 80px;">Name:</span>
              <span style="color: #111827;">${customerName}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: #374151; width: 80px;">Email:</span>
              <span style="color: #111827;">${customerEmail}</span>
            </div>
            ${customerPhone ? `
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: #374151; width: 80px;">Phone:</span>
              <span style="color: #111827;">${customerPhone}</span>
            </div>
            ` : ''}
            ${shippingAddress ? `
            <div style="display: flex; align-items: flex-start; margin-top: 10px;">
              <span style="font-weight: 600; color: #374151; width: 80px; flex-shrink: 0;">Address:</span>
              <span style="color: #111827;">${shippingAddress.street}${shippingAddress.city ? ', ' + shippingAddress.city : ''}${shippingAddress.state ? ', ' + shippingAddress.state : ''}${shippingAddress.country ? ', ' + shippingAddress.country : ''}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Order Items -->
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">🛒 Order Items</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${items && items.length > 0 ? items.map((item: any) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #111827; font-size: 16px;">${item.productName}</div>
                  <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
                    Qty: <span style="font-weight: 500;">${item.quantity}</span> × ${formatCurrency(item.price, currency)}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: bold; color: #059669;">
                    ${formatCurrency(item.price * item.quantity, currency)}
                  </div>
                </div>
              </div>
            `).join('') : '<p>No items found</p>'}
          </div>
        </div>

        <!-- Order Total & Payment -->
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Total Amount -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 16px; border-radius: 8px; border: 2px solid #10b981;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 20px; font-weight: bold; color: #065f46;">Total Amount:</span>
                <span style="font-size: 24px; font-weight: 900; color: #065f46;">
                  ${formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            <!-- Payment Method -->
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; font-weight: 600; color: #374151;">💳 Payment Method:</span>
                <span style="font-size: 16px; font-weight: bold; color: #111827; background: white; padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db;">
                  ${paymentMethod || 'Manual'}
                </span>
              </div>
            </div>

            <!-- Order Date -->
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; font-weight: 600; color: #374151;">📅 Order Date:</span>
                <span style="font-size: 16px; font-weight: bold; color: #111827;">
                  ${createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p style="margin: 20px 0;">
          We'll send you another update once your order is ready for delivery or pickup.
        </p>

        ${businessPhone ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-flex; align-items: center; font-weight: bold; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
            <svg style="width: 20px; height: 20px; margin-right: 8px;" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.888 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            Contact ${businessName}
          </a>
        </div>

        <p style="text-align: center; margin: 15px 0; color: #666; font-size: 14px;">
          Questions about your order? Contact us anytime.
        </p>
        ` : `
        <p style="margin: 20px 0;">
          If you have any questions about your order, please contact ${businessName} directly.
        </p>
        `}

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated notification from ${businessName}
        </p>
      </div>
    `;

    // Convert base64 PDF to buffer for attachment
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Send email with PDF attachment
    await sendEmailWithAttachment(customerEmail, subject, html, pdfBuffer, `receipt-${orderId}.pdf`);

    res.json({ success: true, recipient: customerEmail });
  } catch (error) {
    console.error('sendOrderApprovalEmail error:', error);
    res.status(500).send({ error: 'Failed to send approval email' });
  }
});

// Helper function to send email with attachment
async function sendEmailWithAttachment(to: string, subject: string, html: string, attachmentBuffer: Buffer, attachmentName: string) {
  // Try MailerSend first if configured
  const configuredUrl = process.env.MAIL_SENDER_API_URL;
  const mailerToken = process.env.MAIL_SENDER_API_TOKEN?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();

  // helper: attempt MailerSend with attachment
  const tryMailerSendWithAttachment = async () => {
    if (!mailerToken) throw new Error('MailerSend token not configured');

    const candidateUrls: string[] = [];
    if (configuredUrl) candidateUrls.push(configuredUrl);
    candidateUrls.push('https://api.mailersend.com/v1/email');

    const payload = {
      from: { email: 'no-reply@rady.ng', name: 'Rady.ng' },
      to: [{ email: to }],
      subject,
      html,
      attachments: [{
        content: attachmentBuffer.toString('base64'),
        filename: attachmentName,
        type: 'application/pdf'
      }]
    };

    let lastErr: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mailerToken}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (res.status === 404) { lastErr = { url, status: res.status, body: text.slice(0,200) }; continue; }
          throw new Error(`MailerSend error: ${res.status} ${text}`);
        }
        const txt = await res.text().catch(() => '');
        try { return JSON.parse(txt); } catch (_) { return txt; }
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('MailerSend unknown error');
  };

  // helper: attempt SendGrid with attachment
  const trySendGridWithAttachment = async () => {
    if (!sendgridKey) throw new Error('SendGrid API key not configured');
    const payload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'no-reply@rady.ng', name: 'Rady.ng' },
      subject,
      content: [{ type: 'text/html', value: html }],
      attachments: [{
        content: attachmentBuffer.toString('base64'),
        filename: attachmentName,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    };
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sendgridKey}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`SendGrid error: ${res.status} ${body}`);
    }
    return { ok: true };
  };

  // Try providers in order
  const extractMsg = (e: unknown) => {
    if (!e) return String(e);
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  try {
    return await tryMailerSendWithAttachment();
  } catch (mailerErrUnknown) {
    const mailerMsg = extractMsg(mailerErrUnknown);
    console.warn('MailerSend with attachment failed:', mailerMsg);
    if (sendgridKey) {
      try { return await trySendGridWithAttachment(); } catch (sgErrUnknown) {
        const sgMsg = extractMsg(sgErrUnknown);
        console.error('SendGrid with attachment also failed:', sgMsg);
        throw new Error(`Email providers failed: ${mailerMsg} ; ${sgMsg}`);
      }
    }

    // If no other provider and we're in non-production, log and continue
    if (process.env.NODE_ENV !== 'production') {
      console.warn('No email provider configured; running in non-production mode — logging email content instead of sending.');
      console.info(`DEV EMAIL TO=${to} SUBJECT=${subject} HTML=${html} ATTACHMENT=${attachmentName}`);
      return { ok: true, debug: true } as any;
    }

    throw new Error(`MailerSend failed and no fallback provider configured. ${mailerMsg}`);
  }
}
  export const generateUploadUrl = functions.https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method not allowed, use POST' });
        return;
      }

      const authHeader = (req.get('Authorization') || req.get('authorization') || '') as string;
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).send({ error: 'Missing Authorization Bearer token' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1].trim();
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (err) {
        console.warn('Invalid ID token for generateUploadUrl', err);
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const { path, contentType, fileData } = req.body || {};
      if (!path || typeof path !== 'string' || !contentType || typeof contentType !== 'string') {
        res.status(400).send({ error: 'Missing required fields: path, contentType' });
        return;
      }

      const cleanPath = path.replace(/^\/+/, '').replace(/\.\.+/g, '');

      const bucket = admin.storage().bucket();
      const file = bucket.file(cleanPath);

      // If fileData is provided, upload directly instead of generating signed URL
      if (fileData && typeof fileData === 'string') {
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(fileData, 'base64');
          await file.save(buffer, {
            metadata: {
              contentType: contentType,
            },
            public: true, // Make the file publicly accessible
          });

          const bucketName = bucket.name || process.env.GCLOUD_STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT}.appspot.com`;
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(cleanPath)}`;

          res.json({
            uploadUrl: null, // No signed URL needed
            publicUrl,
            uploaded: true
          });
          return;
        } catch (uploadError) {
          console.error('Direct upload failed:', uploadError);
          // Fall back to signed URL approach
        }
      }

      // Fallback: Generate signed URL
      const expiresMs = Date.now() + 15 * 60 * 1000; // 15 minutes
      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: expiresMs,
        contentType
      });

      const bucketName = bucket.name || process.env.GCLOUD_STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT}.appspot.com`;
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(cleanPath)}`;

      res.json({ uploadUrl, publicUrl, expiresAt: new Date(expiresMs).toISOString() });
    } catch (errAny) {
      console.error('generateUploadUrl error:', errAny);
      res.status(500).send({ error: 'Failed to generate upload url', details: String(errAny) });
    }
  });