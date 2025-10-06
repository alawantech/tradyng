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