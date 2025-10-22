import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Initialize Firebase Admin early
admin.initializeApp();

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

// sendOtp: POST { email }
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

    const { email } = req.body || {};
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
    const subject = 'Your Rady.ng verification code';
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

  // Generate signed upload URL (v4) for direct-to-GCS uploads
  // Expects POST { path: 'folder/file.jpg', contentType: 'image/jpeg' }
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

      const { path, contentType } = req.body || {};
      if (!path || typeof path !== 'string' || !contentType || typeof contentType !== 'string') {
        res.status(400).send({ error: 'Missing required fields: path, contentType' });
        return;
      }

      const cleanPath = path.replace(/^\/+/, '').replace(/\.\.+/g, '');

      const bucket = admin.storage().bucket();
      const file = bucket.file(cleanPath);

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