// functions/send_test_email.js
// Simple local test script to verify MailerSend token and send a debug email.
// Usage (PowerShell):
//   $env:MAIL_SENDER_API_TOKEN='your_token_here'; node .\functions\send_test_email.js recipient@example.com

const fs = require('fs');
const path = require('path');

function loadEnv(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch (err) {
    return {};
  }
}

const envPath = path.join(__dirname, '.env');
const fileEnv = loadEnv(envPath);

const MAIL_SENDER_API_TOKEN = process.env.MAIL_SENDER_API_TOKEN || fileEnv.MAIL_SENDER_API_TOKEN || '';
const MAIL_SENDER_API_URL = process.env.MAIL_SENDER_API_URL || fileEnv.MAIL_SENDER_API_URL || 'https://api.mailersend.com/v1/email';

const TO_EMAIL = process.argv[2] || 'abubakarlawan671@gmail.com';

if (!MAIL_SENDER_API_TOKEN) {
  console.error('MAIL_SENDER_API_TOKEN not found in environment or functions/.env. Set it and retry.');
  process.exit(1);
}

const masked = MAIL_SENDER_API_TOKEN.length > 12 ? MAIL_SENDER_API_TOKEN.slice(0,8) + '...' + MAIL_SENDER_API_TOKEN.slice(-4) : MAIL_SENDER_API_TOKEN.slice(0,4) + '...';
console.log('Using MAIL_SENDER_API_URL =', MAIL_SENDER_API_URL);
console.log('Token preview (masked):', masked);

async function send() {
  try {
    const payload = {
      from: { email: 'no-reply@rady.ng', name: 'Rady.ng' },
      to: [{ email: TO_EMAIL }],
      subject: 'Rady.ng test email',
      html: `<p>Test email sent at ${new Date().toISOString()}</p>`
    };

    const res = await fetch(MAIL_SENDER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAIL_SENDER_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(() => '');
    console.log('Response status:', res.status);
    try { console.log('Response body:', JSON.parse(text)); } catch { console.log('Response body:', text); }

    if (!res.ok) process.exit(2);
    console.log('Email request accepted.');
    process.exit(0);
  } catch (err) {
    console.error('Error sending test email:', err);
    process.exit(3);
  }
}

send();
