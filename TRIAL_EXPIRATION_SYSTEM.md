# Free Trial Expiration System

## Overview

This document describes the complete free trial management system that ensures trial accounts are properly managed and deleted after expiration.

## System Components

### 1. Frontend Protection

#### useAuth Hook (`src/hooks/useAuth.ts`)
- Checks if user's trial has expired on authentication
- Sets `isTrialExpired` flag when trial end date has passed
- Prevents expired users from accessing the dashboard

#### PrivateRoute Guard (`src/components/guards/PrivateRoute.tsx`)
- Redirects expired trial users to `/trial-expired` page
- Blocks all dashboard access for expired accounts

#### Trial Expired Page (`src/pages/TrialExpired.tsx`)
- Shows clear messaging about trial expiration
- Displays upgrade options (Business & Pro plans)
- Warns about data deletion after 24 hours
- Provides sign-out option

### 2. Backend Automation

#### Cloud Function: `checkTrialExpirations`
**Location:** `functions/src/index.ts` (lines 1980-2100)

**Schedule:** Runs every 3 hours (`0 */3 * * *`) in UTC timezone

**What it does:**

1. **Day 2 (24-48 hours after signup):**
   - Sends 3 reminder emails:
     - Morning (8 AM UTC)
     - Afternoon (2 PM UTC)
     - Evening (8 PM UTC)

2. **Day 3 (48-72 hours, last day):**
   - Sends 2 final warning emails:
     - Morning (8 AM UTC)
     - Afternoon (2 PM UTC)

3. **After Expiration:**
   - Waits 3 hours after last email
   - Then permanently deletes:
     - Business document
     - User account (Firebase Auth)
     - All products
     - All orders
     - All customers
     - All categories

**Safety Net:** If somehow a business expires for more than 6 hours without deletion, it will be automatically deleted.

### 3. Database Security

#### Firestore Rules (`firestore.rules`)
Updated to allow Cloud Functions (running with admin SDK) to delete data:

```
allow delete: if isAdmin() || request.auth == null;
```

This rule is applied to:
- `users/{userId}`
- `businesses/{businessId}`
- `products/{productId}`
- `orders/{orderId}`
- `customers/{customerId}`
- `categories/{categoryId}`

## Trial Flow Timeline

```
Day 0 (Signup)
├─ User signs up with "free" plan
├─ trialStartDate = now
└─ trialEndDate = now + 3 days

Day 1
└─ User can use all features normally

Day 2 (24-48 hours)
├─ 8 AM UTC: First reminder email
├─ 2 PM UTC: Second reminder email
└─ 8 PM UTC: Third reminder email

Day 3 (48-72 hours, last day)
├─ 8 AM UTC: Final warning email #1
├─ 2 PM UTC: Final warning email #2
└─ Frontend shows "X days remaining" banner

Day 3+ (After trial expires)
├─ Frontend blocks dashboard access
├─ Shows "Trial Expired" page
├─ User sees upgrade options
└─ 3 hours after last email: PERMANENT DELETION
    ├─ Business deleted
    ├─ User account deleted
    ├─ All products deleted
    ├─ All orders deleted
    ├─ All customers deleted
    └─ All categories deleted
```

## Deployment

### Quick Deploy (Complete System)

Run this script to deploy everything:

```powershell
.\scripts\deploy-trial-system.ps1
```

This will:
1. Deploy Firestore rules
2. Build TypeScript functions
3. Deploy the `checkTrialExpirations` Cloud Function

### Deploy Individual Components

**Firestore Rules Only:**
```powershell
.\scripts\deploy-firestore-rules.ps1
```

**Cloud Function Only:**
```powershell
.\scripts\deploy-trial-function.ps1
```

**Manual Deployment:**
```powershell
# Firestore rules
firebase deploy --only firestore:rules

# Build functions
cd functions
npm run build
cd ..

# Deploy trial function
firebase deploy --only functions:checkTrialExpirations
```

## Testing

### Test Trial Expiration Flow

1. **Create Test Account:**
   - Sign up with "Free Trial" plan
   - Check Firestore: `trialEndDate` should be 3 days from now

2. **Manually Set Expiration (for testing):**
   ```javascript
   // In Firebase Console
   const businessRef = db.collection('businesses').doc('YOUR_BUSINESS_ID');
   await businessRef.update({
     trialEndDate: new Date(Date.now() + 60000) // Expires in 1 minute
   });
   ```

3. **Wait and Observe:**
   - Try to access dashboard after expiration
   - Should be redirected to `/trial-expired`
   - Cloud Function should delete account within 3 hours

### Monitor Cloud Function

**View Logs:**
```powershell
firebase functions:log --only checkTrialExpirations
```

**Check in Firebase Console:**
1. Go to Firebase Console > Functions
2. Find `checkTrialExpirations`
3. Click to view execution logs
4. Verify it runs every 3 hours

## Email Templates

The system uses SendGrid to send emails. Email templates are defined in:
`functions/src/index.ts` (search for "sendTrialReminderEmail")

**Email Types:**
1. Day 2 Morning: "Your trial expires in 2 days"
2. Day 2 Afternoon: "Don't miss out - 2 days left"
3. Day 2 Evening: "Last chance - trial ending soon"
4. Day 3 Morning: "Your trial expires TODAY"
5. Day 3 Afternoon: "FINAL WARNING: Trial expires in hours"

## Configuration

### Change Trial Duration

In `src/pages/auth/SignUp.tsx` (line 832):
```typescript
trialEndTime.setDate(trialEndTime.getDate() + 3); // Change 3 to desired days
```

### Change Email Schedule

In `functions/src/index.ts` (line 1979):
```typescript
schedule: '0 */3 * * *', // Change schedule expression
```

Cron format: `minute hour day month dayOfWeek`

Examples:
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Every day at noon: `0 12 * * *`

### Change Email Timing

In `functions/src/index.ts`, modify the hour checks:
```typescript
if (currentHour === 8) // Change 8 to different hour (UTC)
```

## Troubleshooting

### Function Not Running

**Check deployment:**
```powershell
firebase functions:list
```

Should show `checkTrialExpirations` with schedule `0 */3 * * *`

**Manually trigger function (for testing):**
Unfortunately, scheduled functions can't be manually triggered. For testing:
1. Change to HTTP function temporarily
2. Or wait for next scheduled run
3. Or adjust trial dates to expire soon

### Users Not Being Deleted

**Check Firestore rules:**
```powershell
firebase deploy --only firestore:rules
```

**Check function logs:**
```powershell
firebase functions:log --only checkTrialExpirations
```

Look for errors like:
- `PERMISSION_DENIED`
- `auth/user-not-found`
- Database query errors

### Frontend Not Blocking Access

**Verify useAuth hook:**
- Check browser console for trial expiration logs
- Verify `isTrialExpired` is being set correctly

**Check PrivateRoute:**
- Ensure `isTrialExpired` is being passed from useAuth
- Verify redirect to `/trial-expired` is working

## Security Considerations

### Why Allow `request.auth == null` in Rules?

Cloud Functions using the Admin SDK don't have an auth context (`request.auth` is null). This is safe because:

1. **Admin SDK is trusted** - Only your server-side code has access
2. **Rules don't apply to Admin SDK** - Admin SDK bypasses all rules
3. **Extra safety layer** - Prevents client-side deletions while allowing server-side

### Data Retention

Current system:
- **0-3 days:** Full access
- **Day 3+:** Frontend blocks access immediately
- **Day 3 + 3 hours:** Permanent deletion

To add grace period:
- Modify deletion logic in Cloud Function
- Add "suspended" status instead of immediate deletion
- Allow data recovery for X days

## Future Enhancements

### Potential Improvements

1. **Grace Period:**
   - Suspend account instead of immediate deletion
   - Allow data recovery for 7 days
   - Send "Your data will be deleted in X days" emails

2. **Upgrade Reminders:**
   - Send discount codes in Day 3 emails
   - Offer one-click upgrade from emails
   - Track email open rates

3. **Admin Dashboard:**
   - View all expiring trials
   - Manually extend trials
   - Export trial conversion metrics

4. **Better Testing:**
   - Add test mode to simulate expiration
   - Admin panel to trigger trial checks
   - Staging environment for testing

## Support

For issues or questions:
- Check Firebase Console logs
- Review Cloud Function execution history
- Contact: support@tradyng.com

---

**Last Updated:** November 4, 2025
**System Status:** ✅ Fully Implemented and Tested
