import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import fetch from 'node-fetch';

const OTP_COLLECTION = 'emailOtps';

function generateNumericOtp(length = 6) {
  const max = 10 ** length;
  const num = Math.floor(Math.random() * (max - 1)) + 1;
  return num.toString().padStart(length, '0');
}

function hashOtp(otp: string, salt: string) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

async function sendEmailViaMailerSend(to: string, subject: string, html: string) {
  const url = process.env.MAIL_SENDER_API_URL;
  const token = process.env.MAIL_SENDER_API_TOKEN;
  if (!url || !token) throw new Error('Mail sender env not configured');

  const payload = {
    from: { email: 'no-reply@trady.ng', name: 'Trady.ng' },
    to: [{ email: to }],
    subject,
    html
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`MailerSend error: ${res.status} ${txt}`);
  }

  return res.json();
}

// sendOtp: POST { email }
export const sendOtp = functions.https.onRequest(async (req, res) => {
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
    const otp = generateNumericOtp(6);
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(otp, salt);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // store in firestore
    const docRef = admin.firestore().collection(OTP_COLLECTION).doc(email);
    await docRef.set({
      email,
      otpHash,
      salt,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    // send email
    const subject = 'Your Trady.ng verification code';
    const html = `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`;
    await sendEmailViaMailerSend(email, subject, html);

    res.json({ ok: true });
  } catch (errAny) {
    console.error('sendOtp error:', errAny);
    res.status(500).send({ error: String(errAny) });
  }
});

// verifyOtp: POST { email, code }
export const verifyOtp = functions.https.onRequest(async (req, res) => {
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

    const docRef = admin.firestore().collection(OTP_COLLECTION).doc(email);
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

// Initialize Firebase Admin
admin.initializeApp();

// Note: Email-sending functions (sendEmail, sendOTPEmail, testSendOTP) have been removed.
// The remaining functions provide health checks and upload URL generation.


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