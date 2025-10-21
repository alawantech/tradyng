#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple .env loader (no external deps) - parses KEY=VALUE lines
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
      // unquote
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

const MAIL_SENDER_API_TOKEN = process.env.MAIL_SENDER_API_TOKEN || fileEnv.MAIL_SENDER_API_TOKEN;
const MAIL_SENDER_API_URL = process.env.MAIL_SENDER_API_URL || fileEnv.MAIL_SENDER_API_URL || 'https://api.mailersend.com/v1.1/email';

const TO_EMAIL = 'abubakarlawan671@gmail.com';

if (!MAIL_SENDER_API_TOKEN) {
  console.error('MAIL_SENDER_API_TOKEN not found in environment or .env. Please set it in functions/.env or environment.');
  process.exit(1);
}

// Non-sensitive debug: show where the token came from and a masked preview
try {
  const tokenSource = process.env.MAIL_SENDER_API_TOKEN ? 'environment (process.env)' : (fileEnv.MAIL_SENDER_API_TOKEN ? 'functions/.env' : 'none');
  let masked = '';
  if (MAIL_SENDER_API_TOKEN && MAIL_SENDER_API_TOKEN.length > 12) {
    masked = MAIL_SENDER_API_TOKEN.slice(0, 8) + '...' + MAIL_SENDER_API_TOKEN.slice(-4);
  } else if (MAIL_SENDER_API_TOKEN) {
    masked = MAIL_SENDER_API_TOKEN.slice(0, 4) + '...';
  }
  console.log(`MAIL_SENDER_API_TOKEN source: ${tokenSource}`);
  console.log(`MAIL_SENDER_API_URL: ${MAIL_SENDER_API_URL}`);
  console.log(`Token preview (masked): ${masked}`);
} catch (e) {
  // don't expose secrets; just continue
}

async function trySend(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MAIL_SENDER_API_TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  return res;
}

async function sendTest() {
  const payload = {
    from: { email: 'noreply@rady.ng', name: 'Tradyng Test' },
    to: [ { email: TO_EMAIL } ],
    subject: 'Tradyng test email',
    text: 'This is a test email sent from functions/send_test_email.js',
    html: '<p>This is a <strong>test</strong> email sent from <em>functions/send_test_email.js</em>.</p>'
  };

  const tried = [];
  const candidateUrls = [MAIL_SENDER_API_URL, 'https://api.mailersend.com/v1/email'];

  for (const url of candidateUrls) {
    if (!url) continue;
    try {
      const res = await trySend(url, payload);
      const bodyText = await res.text();
      console.log('Request sent to', url);
      console.log('Response status:', res.status);
      // Try to parse JSON response, otherwise print raw text
      try {
        const json = JSON.parse(bodyText);
        console.log('Response body:', json);
      } catch (e) {
        console.log('Response body (text):', bodyText);
      }

      if (res.ok) {
        console.log('Email request accepted (200-299).');
        return;
      }

      // If 404 try next candidate
      if (res.status === 404) {
        console.warn('Endpoint returned 404, trying next candidate if available...');
        tried.push({ url, status: res.status });
        continue;
      }

      // Non-OK and non-404
      process.exitCode = 2;
      return;
    } catch (err) {
      console.error('Error sending request to', url, err && err.message ? err.message : err);
      tried.push({ url, error: String(err) });
    }
  }

  console.error('All attempts failed:', tried);
  process.exitCode = 4;
}

sendTest();
