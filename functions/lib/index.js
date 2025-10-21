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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUploadUrl = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Note: Email-sending functions (sendEmail, sendOTPEmail, testSendOTP) have been removed.
// The remaining functions provide health checks and upload URL generation.
// Health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
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
exports.generateUploadUrl = functions.https.onRequest(async (req, res) => {
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
        const authHeader = (req.get('Authorization') || req.get('authorization') || '');
        if (!authHeader.startsWith('Bearer ')) {
            res.status(401).send({ error: 'Missing Authorization Bearer token' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1].trim();
        try {
            await admin.auth().verifyIdToken(idToken);
        }
        catch (err) {
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
    }
    catch (errAny) {
        console.error('generateUploadUrl error:', errAny);
        res.status(500).send({ error: 'Failed to generate upload url', details: String(errAny) });
    }
});
//# sourceMappingURL=index.js.map