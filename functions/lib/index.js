"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.sendOTPEmail = exports.sendEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Initialize Firebase Admin
admin.initializeApp();
// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY || ((_b = (_a = functions.config()) === null || _a === void 0 ? void 0 : _a.sendgrid) === null || _b === void 0 ? void 0 : _b.api_key);
if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
    mail_1.default.setApiKey(sendGridApiKey);
    console.log('SendGrid initialized successfully');
}
else {
    console.warn('SendGrid API key not found or invalid format. Email sending will fail.');
}
// Generic email sending function
exports.sendEmail = functions.https.onCall(async (request, response) => {
    const data = request.data;
    try {
        // Validate request
        if (!data.to || !data.from || !data.subject || !data.html) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: to, from, subject, html');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.to) || !emailRegex.test(data.from)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Check if SendGrid is configured
        if (!sendGridApiKey || !sendGridApiKey.startsWith('SG.')) {
            throw new functions.https.HttpsError('failed-precondition', 'Email service not configured. Please set up SendGrid API key.');
        }
        // Send email via SendGrid
        const msg = {
            to: data.to,
            from: data.from,
            subject: data.subject,
            html: data.html,
            text: data.text || undefined,
        };
        await mail_1.default.send(msg);
        console.log(`Email sent successfully to: ${data.to}`);
        return {
            success: true,
            message: 'Email sent successfully'
        };
    }
    catch (error) {
        console.error('SendGrid error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to send email', error);
    }
});
// Specialized OTP email function
exports.sendOTPEmail = functions.https.onCall(async (request, response) => {
    const data = request.data;
    try {
        // Validate OTP request
        if (!data.email || !data.otp || !data.storeName) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: email, otp, storeName');
        }
        // Validate OTP format (4 digits)
        if (!/^\d{4}$/.test(data.otp)) {
            throw new functions.https.HttpsError('invalid-argument', 'OTP must be 4 digits');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Check if SendGrid is configured
        if (!sendGridApiKey || !sendGridApiKey.startsWith('SG.')) {
            throw new functions.https.HttpsError('failed-precondition', 'Email service not configured. Please set up SendGrid API key.');
        }
        const primaryColor = data.storeColor || '#3B82F6';
        const supportEmail = data.supportEmail || 'support@rady.ng';
        const fromEmail = 'noreply@rady.ng';
        // Create beautiful OTP email template
        const subject = `Verify your email - ${data.storeName}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🛍️</div>
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">${data.storeName}</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Verify Your Email Address</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 24px; font-weight: bold;">Welcome to ${data.storeName}! 🎉</h2>
            
            <p style="margin: 0 0 25px; color: #6B7280; font-size: 16px; line-height: 1.6;">
              Thanks for signing up! To complete your registration and start shopping, please verify your email address with the code below:
            </p>

            <!-- OTP Code -->
            <div style="background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed ${primaryColor};">
              <p style="margin: 0 0 15px; color: #6B7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <div style="font-size: 32px; font-weight: bold; color: ${primaryColor}; letter-spacing: 6px; font-family: 'Courier New', monospace; background: white; padding: 15px 25px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${data.otp}
              </div>
              <p style="margin: 15px 0 0; color: #9CA3AF; font-size: 12px;">This code expires in 10 minutes</p>
            </div>

            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px;">
                <strong>Security tip:</strong> Never share this code with anyone. We'll never ask for it over the phone or email.
              </p>
            </div>

            <p style="margin: 25px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
              If you didn't create an account with ${data.storeName}, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0 0 15px; color: #6B7280; font-size: 14px;">
              Questions? Contact our support team
            </p>
            <div style="margin: 15px 0;">
              <a href="mailto:${supportEmail}" style="color: ${primaryColor}; text-decoration: none; margin: 0 15px;">📧 ${supportEmail}</a>
            </div>
            <p style="margin: 15px 0 0; color: #9CA3AF; font-size: 12px;">
              © 2025 ${data.storeName}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
        const text = `
      Welcome to ${data.storeName}!
      
      Your verification code is: ${data.otp}
      
      This code expires in 10 minutes.
      
      If you didn't create an account, you can safely ignore this email.
      
      Contact us: ${supportEmail}
    `;
        // Send email via SendGrid
        const msg = {
            to: data.email,
            from: `${data.storeName} <${fromEmail}>`,
            subject,
            html,
            text,
        };
        await mail_1.default.send(msg);
        console.log(`OTP email sent successfully to: ${data.email}`);
        return {
            success: true,
            message: `Verification code sent to ${data.email}`
        };
    }
    catch (error) {
        console.error('OTP email error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to send OTP email', error);
    }
});
// Health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Tradyng Email Functions are running'
    });
});
//# sourceMappingURL=index.js.map