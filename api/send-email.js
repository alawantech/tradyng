// Backend API endpoint for sending emails via SendGrid
// This should be deployed to a serverless platform like Vercel, Netlify, or your own server

const sgMail = require('@sendgrid/mail');

// Set SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader('Access-Control-Allow-Origin', '*'); // In production, set to your domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { to, from, subject, html, text } = req.body;

    // Validate required fields
    if (!to || !from || !subject || !html) {
      res.status(400).json({ 
        error: 'Missing required fields: to, from, subject, html' 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || !emailRegex.test(from)) {
      res.status(400).json({ 
        error: 'Invalid email format' 
      });
      return;
    }

    // Send email via SendGrid
    const msg = {
      to,
      from,
      subject,
      html,
      text: text || undefined, // Optional plain text version
    };

    await sgMail.send(msg);

    console.log(`Email sent successfully to: ${to}`);
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('SendGrid error:', error);
    
    // Handle SendGrid specific errors
    if (error.code) {
      res.status(400).json({ 
        error: 'SendGrid API error', 
        details: error.message,
        code: error.code 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  }
}

// Alternative Express.js implementation:
/*
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  // Same logic as above
});

app.listen(3001, () => {
  console.log('Email API server running on port 3001');
});
*/