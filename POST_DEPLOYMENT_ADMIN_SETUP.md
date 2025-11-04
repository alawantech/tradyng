# Post-Deployment Steps

## After Firebase Functions Deploy Successfully

### 1. Get the New Function URLs

Run this command to see all deployed functions:
```powershell
firebase functions:list
```

Look for these two new functions:
- `sendTrialReminder`
- `adminDeleteBusiness`

Note their URLs (they will look like `https://sendtrialreminder-XXXXX.a.run.app`)

### 2. Update Businesses.tsx with Real URLs

Open `src/pages/admin/Businesses.tsx` and update these lines:

**Line ~70 (handleSendReminder):**
```typescript
const response = await fetch('https://sendtrialreminder-rv5lqk7lxa-uc.a.run.app', {
```
Replace with your actual URL from step 1

**Line ~90 (handleDeleteBusiness):**
```typescript
const response = await fetch('https://admindeletebusiness-rv5lqk7lxa-uc.a.run.app', {
```
Replace with your actual URL from step 1

### 3. Test the Features

1. **Go to Admin Panel:**
   - Navigate to `/admin/businesses`

2. **Test Send Reminder:**
   - Find a free trial store
   - Click "Remind" button
   - Select or type a message
   - Click "Send Reminder"
   - Check that email is received

3. **Test Delete Store:**
   - Find a test free trial store
   - Click "Delete" button
   - Confirm deletion
   - Verify store is removed

### 4. Update Admin Email

In `functions/src/index.ts` (line ~2222), update the admin email:
```typescript
const adminEmail = 'your-actual-admin@email.com';
```

Then redeploy:
```powershell
cd functions
npm run build
cd ..
firebase deploy --only functions:checkTrialExpirations
```

## Quick Commands

```powershell
# Get function URLs
firebase functions:list

# View function logs
firebase functions:log --only sendTrialReminder
firebase functions:log --only adminDeleteBusiness

# Redeploy specific function
firebase deploy --only functions:sendTrialReminder
firebase deploy --only functions:adminDeleteBusiness
```

## Troubleshooting

### CORS Errors
- Functions have been updated with proper CORS headers
- Should work after redeployment

### 404 Errors
- Make sure you updated the URLs in Businesses.tsx
- Check that functions deployed successfully

### Email Not Sending
- Check MailerSend API key is configured
- View function logs: `firebase functions:log --only sendTrialReminder`

## Done! ✅

Once you complete these steps, the admin trial management system will be fully operational!
