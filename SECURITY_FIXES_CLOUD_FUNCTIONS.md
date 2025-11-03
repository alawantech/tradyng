# SECURITY IMPROVEMENTS FOR CLOUD FUNCTIONS

## Required Changes to functions/src/index.ts

### 1. Restrict CORS (Replace `'*'` with your actual domains)

```typescript
// Instead of:
res.set('Access-Control-Allow-Origin', '*');

// Use:
const allowedOrigins = [
  'https://rady.ng',
  'https://www.rady.ng',
  'https://admin.rady.ng',
  'http://localhost:5173', // Dev only
  'http://localhost:3000'  // Dev only
];

const origin = req.get('origin');
if (origin && allowedOrigins.includes(origin)) {
  res.set('Access-Control-Allow-Origin', origin);
}
```

### 2. Add Authorization Middleware

```typescript
// Add this helper function at the top of your file
async function verifyAdmin(req: Request): Promise<boolean> {
  try {
    const authHeader = req.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user is admin in Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    return userDoc.exists && userDoc.data()?.role === 'admin';
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

async function verifyBusinessOwner(req: Request, businessId: string): Promise<boolean> {
  try {
    const authHeader = req.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user owns the business
    const businessDoc = await admin.firestore()
      .collection('businesses')
      .doc(businessId)
      .get();
    
    return businessDoc.exists && businessDoc.data()?.ownerId === decodedToken.uid;
  } catch (error) {
    console.error('Business owner verification error:', error);
    return false;
  }
}
```

### 3. Protect generateUploadUrl Function

```typescript
export const generateUploadUrl = functions.https.onRequest(async (req, res) => {
  // ... existing CORS ...
  
  try {
    const authHeader = (req.get('Authorization') || req.get('authorization') || '') as string;
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).send({ error: 'Missing Authorization Bearer token' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.warn('Invalid ID token for generateUploadUrl', err);
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const { path, contentType, fileData } = req.body || {};
    
    // ⚠️ ADD THIS: Verify user owns the business they're uploading for
    const pathParts = path.split('/');
    if (pathParts[0] === 'businesses' && pathParts[1]) {
      const businessId = pathParts[1];
      const isOwner = await verifyBusinessOwner(req, businessId);
      const isAdmin = await verifyAdmin(req);
      
      if (!isOwner && !isAdmin) {
        res.status(403).send({ error: 'Forbidden: You do not own this business' });
        return;
      }
    }
    
    // ... rest of function ...
  }
});
```

### 4. Add Rate Limiting

```typescript
// Install: npm install express-rate-limit

import rateLimit from 'express-rate-limit';

// Payment rate limiter - max 5 requests per hour per IP
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many payment requests, please try again later'
});

// OTP rate limiter - max 10 requests per hour per IP
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many OTP requests, please try again later'
});
```

### 5. Validate Inputs

```typescript
// Add input validation library
// npm install validator

import validator from 'validator';

// In sendOtp function:
if (!email || !validator.isEmail(email)) {
  res.status(400).send({ error: 'Invalid email address' });
  return;
}

// In payment functions:
if (!amount || typeof amount !== 'number' || amount <= 0) {
  res.status(400).send({ error: 'Invalid amount' });
  return;
}
```

### 6. Protect Affiliate Commission Function

```typescript
// In verifyPaymentAndAwardCommission:
// Add check to prevent duplicate commission awards
const existingReferral = await admin.firestore()
  .collection('referrals')
  .where('transactionRef', '==', txRef)
  .limit(1)
  .get();

if (!existingReferral.empty) {
  console.log('Commission already awarded for this transaction');
  res.json({
    status: 'success',
    message: 'Payment verified (commission already awarded)',
    data: verifyData
  });
  return;
}
```

## Implementation Priority

1. ✅ Fix Firestore rules IMMEDIATELY
2. ✅ Add route guards to admin routes
3. ⚠️ Update CORS in all cloud functions
4. ⚠️ Add authorization checks to sensitive functions
5. ⚠️ Implement rate limiting
6. ⚠️ Add input validation
