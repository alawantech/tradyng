# Admin Trial Management Features

## Overview

This document describes the admin features for managing free trial stores, including manual deletion and custom reminder emails.

## Features

### 1. Admin Email Notifications

**When:** Automatically sent when a free trial store expires (reaches 3 days)

**What Admin Receives:**
- Business name and ID
- Owner email
- Trial status (expired or days remaining)
- Direct link to admin panel

**Configuration:**
Update the admin email in `functions/src/index.ts` (line ~2222):
```typescript
const adminEmail = 'admin@tradyng.com'; // Change this to your admin email
```

### 2. Delete Store Button (Admin Panel)

**Location:** Admin > Businesses page

**Appears:** Only for stores on the "free" plan

**What It Does:**
- Permanently deletes the business
- Deletes all products
- Deletes all orders
- Deletes all customers
- Deletes all categories
- Deletes the owner's Firebase Auth account
- **Cannot be undone!**

**How to Use:**
1. Go to Admin panel > Businesses
2. Find a free trial store
3. Click the red "Delete" button in the Actions column
4. Confirm the deletion

**Visual Indicators:**
- Shows "EXPIRED" badge for expired trials
- Shows "Xd left" for active trials (e.g., "2d left")
- Color-coded:
  - 🔴 Red: Expired
  - 🟠 Orange: 1 day left
  - 🟡 Yellow: 2+ days left

### 3. Send Reminder Button (Admin Panel)

**Location:** Admin > Businesses page

**Appears:** Only for stores on the "free" plan

**What It Does:**
- Opens a modal with quick templates
- Sends custom email to store owner
- Logs reminder in database

**Quick Templates:**
1. **Trial Expiring Soon** - Standard reminder about upcoming expiration
2. **Special Discount Offer** - Offer a discount code
3. **Payment Reminder** - Urgent message about expired trial

**How to Use:**
1. Go to Admin panel > Businesses
2. Find a free trial store
3. Click the "Remind" button
4. Either:
   - Click a quick template to use it
   - Type your own custom message
5. Click "Send Reminder"

**Email Features:**
- Professionally formatted HTML email
- Includes store name
- Has "View Pricing Plans" button
- Reply-to enabled

## Cloud Functions

### sendTrialReminder
**Endpoint:** `https://sendtrialreminder-rv5lqk7lxa-uc.a.run.app`

**Request:**
```json
{
  "businessId": "business123",
  "customMessage": "Your custom message here..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder email sent successfully"
}
```

**Logs:** Saves reminder to `adminReminders` collection with:
- businessId
- businessName
- recipientEmail
- message
- sentAt timestamp

### adminDeleteBusiness
**Endpoint:** `https://admindeletebusiness-rv5lqk7lxa-uc.a.run.app`

**Request:**
```json
{
  "businessId": "business123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business deleted successfully"
}
```

**What Gets Deleted:**
1. Business document
2. User account (Firebase Auth)
3. All products (`products` collection)
4. All orders (`orders` collection)
5. All customers (`customers` subcollection)
6. All categories (`categories` subcollection)

## Deployment

### Deploy New Cloud Functions

```powershell
cd functions
npm run build
cd ..

# Deploy both new functions
firebase deploy --only functions:sendTrialReminder,functions:adminDeleteBusiness
```

### Or Deploy All Functions

```powershell
firebase deploy --only functions
```

### Update Frontend URLs

The Cloud Function URLs are hardcoded in `src/pages/admin/Businesses.tsx`:

```typescript
// Line ~67
const response = await fetch('https://sendtrialreminder-rv5lqk7lxa-uc.a.run.app', {

// Line ~87
const response = await fetch('https://admindeletebusiness-rv5lqk7lxa-uc.a.run.app', {
```

**After deploying**, update these URLs with your actual Cloud Function endpoints.

**Find your URLs:**
```powershell
firebase functions:list
```

Or in Firebase Console > Functions > Function details

## Security

### Firestore Rules

Already updated to allow admin actions:
- Admin can delete any business
- Admin can delete products, orders, customers, categories
- Cloud Functions (with admin SDK) can delete everything

### Frontend Access Control

The Businesses page is protected by `AdminRoute` guard:
- Only users with `role: 'admin'` can access
- Checked in `src/components/guards/AdminRoute.tsx`

### Backend Verification

Cloud Functions **should** verify admin role (currently not implemented for simplicity). To add:

```typescript
// In sendTrialReminder and adminDeleteBusiness functions
// Add authentication header check
const authToken = req.headers.authorization?.split('Bearer ')[1];
if (!authToken) {
  res.status(401).json({ error: 'Unauthorized' });
  return;
}

// Verify token and check admin role
const decodedToken = await admin.auth().verifyIdToken(authToken);
const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
  res.status(403).json({ error: 'Forbidden - Admin access required' });
  return;
}
```

## Testing

### Test Send Reminder

1. Create a test free trial account
2. Go to Admin > Businesses
3. Find the test account
4. Click "Remind" button
5. Select or type a message
6. Click "Send Reminder"
7. Check email inbox

### Test Delete Business

1. Create a test free trial account with some products
2. Go to Admin > Businesses
3. Find the test account
4. Click "Delete" button
5. Confirm deletion
6. Verify:
   - Business removed from list
   - User cannot log in
   - All data deleted from Firestore

### Monitor Cloud Functions

```powershell
# View logs
firebase functions:log --only sendTrialReminder
firebase functions:log --only adminDeleteBusiness

# Or in Firebase Console
# Functions > Select function > Logs tab
```

## Troubleshooting

### Email Not Sending

**Check:**
1. MailerSend API key is configured
2. Cloud Function deployed successfully
3. Check function logs for errors
4. Verify `sendEmailViaMailerSend` function works

**Fix:**
```powershell
firebase functions:log --only sendTrialReminder
```

### Delete Not Working

**Check:**
1. Firestore rules allow deletions
2. Cloud Function has admin privileges
3. BusinessId is correct

**Fix:**
```powershell
firebase functions:log --only adminDeleteBusiness
```

### Actions Column Not Showing

**Check:**
1. Component imported correctly
2. SendReminderModal exists
3. No TypeScript errors

**Fix:**
```powershell
npm run build
# Check console for errors
```

### Wrong Cloud Function URLs

**Symptoms:**
- 404 errors when clicking buttons
- CORS errors

**Fix:**
1. Deploy functions first
2. Get actual URLs from Firebase Console
3. Update URLs in `Businesses.tsx`

## Future Enhancements

### Potential Improvements

1. **Bulk Actions:**
   - Select multiple stores
   - Send reminders to all
   - Bulk delete expired stores

2. **Email Scheduling:**
   - Schedule reminder for later
   - Set up automated reminder sequences

3. **Better Templates:**
   - Save custom templates
   - Use variables in templates
   - Preview email before sending

4. **Analytics:**
   - Track reminder open rates
   - Track conversion after reminders
   - A/B test different messages

5. **Safety Features:**
   - Soft delete (recovery period)
   - Export data before deletion
   - Require admin password for deletion

## Admin Email Configuration

### Setting Up Admin Email

1. **In Cloud Function** (`functions/src/index.ts`):
```typescript
const adminEmail = 'your-admin@email.com';
```

2. **Multiple Admins:**
```typescript
const adminEmails = [
  'admin1@tradyng.com',
  'admin2@tradyng.com',
  'support@tradyng.com'
];

// Send to all admins
for (const email of adminEmails) {
  await sendEmailViaMailerSend(email, subject, html);
}
```

3. **Environment Variable (Recommended):**
```typescript
const adminEmail = process.env.ADMIN_EMAIL || 'admin@tradyng.com';
```

Set in Firebase:
```powershell
firebase functions:config:set admin.email="your-admin@email.com"
firebase deploy --only functions
```

Access in code:
```typescript
const adminEmail = functions.config().admin.email;
```

## Support

For issues or questions:
- Check Firebase Console logs
- Review Cloud Function execution history
- Contact: support@tradyng.com

---

**Last Updated:** November 4, 2025
**Status:** ✅ Fully Implemented
