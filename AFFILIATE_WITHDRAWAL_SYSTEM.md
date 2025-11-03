# Affiliate Withdrawal System

## Overview
Complete withdrawal management system for affiliates with admin approval workflow, bank details management, and comprehensive status tracking.

## Features Implemented

### 1. **Admin Withdrawal Management** (`src/pages/admin/Withdrawals.tsx`)
- **Dashboard Overview**
  - Stats cards showing pending, approved, paid, and rejected withdrawals
  - Total amounts for each status category
  - Real-time data from Firestore

- **Withdrawal Table**
  - Displays all withdrawal requests from all affiliates
  - Columns: Affiliate info, amount, bank details, status, requested date, actions
  - Status badges with color coding (pending/yellow, approved/blue, paid/green, rejected/red)

- **Admin Actions**
  - **Approve**: Approves withdrawal request and deducts from affiliate earnings
  - **Reject**: Opens modal to enter rejection reason
  - **Mark as Paid**: For approved withdrawals, enter transaction reference number
  - All actions update Firestore and show loading states

### 2. **Affiliate Dashboard** (`src/pages/AffiliateDashboard.tsx`)
- **New Stats Card**
  - Added "Available Balance" card showing earnings minus withdrawals
  - Calculated from completed referral commissions minus approved/paid withdrawals

- **Bank Details Management**
  - Form to add/update bank details (account name, bank name, account number)
  - Validation: 10-digit account number minimum
  - Required before requesting withdrawal

- **Withdrawal Request Section**
  - Form to request withdrawal with amount input
  - No minimum withdrawal - withdraw any amount
  - "Withdraw All" button to withdraw entire available balance
  - Balance verification before request
  - Real-time balance breakdown showing:
    - Total earnings (from completed referrals)
    - Total withdrawn (approved + paid withdrawals)
    - Available balance

- **Withdrawal History Table**
  - Displays all withdrawal requests with status
  - Shows requested date, processed date, and details
  - For rejected: Shows rejection reason
  - For paid: Shows transaction reference number
  - Status icons and color-coded badges

### 3. **Affiliate Service** (`src/services/affiliate.ts`)

#### New Interface
```typescript
interface WithdrawalRequest {
  id: string;
  affiliateId: string;
  affiliateUsername: string;
  affiliateEmail: string;
  amount: number;
  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string;
  rejectionReason?: string;
  transactionReference?: string;
}
```

#### New Methods

**`updateBankDetails(affiliateId, bankDetails)`**
- Updates affiliate's bank account information
- Required before withdrawal requests

**`requestWithdrawal(affiliateId, amount)`**
- Creates new withdrawal request
- Validations:
  - Amount must be positive (greater than zero)
  - Sufficient available balance
  - Bank details must exist
- Auto-fills affiliate info (username, email)
- Status set to 'pending'

**`getAffiliateWithdrawals(affiliateId)`**
- Gets all withdrawal requests for specific affiliate
- Ordered by request date (newest first)

**`getAllWithdrawalRequests()`**
- Admin function to get all withdrawal requests
- Ordered by request date (newest first)

**`updateWithdrawalStatus(withdrawalId, status, metadata)`**
- Admin function to approve/reject/mark as paid
- **On Approve**: Deducts amount from affiliate's totalEarnings
- **On Reject**: Requires rejection reason
- **On Paid**: Requires transaction reference
- Updates processedAt timestamp
- Validates status transitions

### 4. **Routing & Navigation**
- **Route Added**: `/admin/withdrawals` in `src/App.tsx`
- **Sidebar Link**: Added in `src/components/layout/Sidebar.tsx`
  - Icon: Wallet (Lucide React)
  - Visible in admin menu
  - Direct navigation to withdrawals management

### 5. **Firestore Indexes** (`firestore.indexes.json`)
Added two composite indexes for optimal query performance:

```json
{
  "collectionGroup": "withdrawalRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "requestedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "withdrawalRequests",
  "fields": [
    { "fieldPath": "affiliateId", "order": "ASCENDING" },
    { "fieldPath": "requestedAt", "order": "DESCENDING" }
  ]
}
```

## Workflow

### Affiliate Perspective
1. **Add Bank Details**
   - Navigate to affiliate dashboard
   - Fill in bank information (account name, bank name, account number)
   - Save details (required before withdrawal)

2. **Request Withdrawal**
   - View available balance in stats card
   - Enter withdrawal amount (any amount)
   - Use "Withdraw All" button to withdraw entire balance
   - Click "Request Withdrawal"
   - Request goes to admin for approval

3. **Track Status**
   - View withdrawal history table
   - See status updates (pending → approved → paid)
   - View rejection reasons if applicable
   - See transaction reference when paid

### Admin Perspective
1. **View All Requests**
   - Navigate to Admin → Withdrawals
   - See stats dashboard with counts and totals
   - View table of all withdrawal requests

2. **Process Requests**
   - **Approve**: Click approve button
     - System deducts from affiliate earnings
     - Status changes to "approved"
   - **Reject**: Click reject button
     - Enter rejection reason in modal
     - Status changes to "rejected"
   - **Mark as Paid**: For approved requests
     - Enter transaction reference number
     - Status changes to "paid"

3. **Review Details**
   - See affiliate information (username, email)
   - View bank details for each request
   - Check requested amounts and dates

## Data Structure

### Firestore Collections

**`affiliates` collection**
```javascript
{
  id: "affiliateId",
  username: "johndoe",
  email: "john@example.com",
  totalEarnings: 50000, // Updated on withdrawal approval
  bankDetails: {
    accountName: "John Doe",
    bankName: "First Bank",
    accountNumber: "1234567890"
  }
}
```

**`withdrawalRequests` collection**
```javascript
{
  id: "withdrawalId",
  affiliateId: "affiliateId",
  affiliateUsername: "johndoe",
  affiliateEmail: "john@example.com",
  amount: 10000,
  bankDetails: {
    accountName: "John Doe",
    bankName: "First Bank",
    accountNumber: "1234567890"
  },
  status: "pending", // or "approved", "rejected", "paid"
  requestedAt: Timestamp,
  processedAt: Timestamp, // Set when status changes
  processedBy: "adminUserId", // Admin who processed
  rejectionReason: "Insufficient documentation", // If rejected
  transactionReference: "TXN123456" // If paid
}
```

## Validation Rules

### Withdrawal Request
- ✅ No minimum amount - withdraw any available balance
- ✅ Bank details must exist
- ✅ Available balance must be sufficient
- ✅ Amount must be positive number

### Bank Details
- ✅ Account name required (not empty)
- ✅ Bank name required (not empty)
- ✅ Account number required (10 digits minimum)
- ✅ Account number must be numeric

### Status Transitions
- ✅ Pending → Approved (requires admin action)
- ✅ Pending → Rejected (requires rejection reason)
- ✅ Approved → Paid (requires transaction reference)
- ❌ Cannot change from Paid or Rejected

## UI Components Used

### From Lucide React
- `Wallet` - Withdrawal icon
- `DollarSign` - Money/earnings icon
- `Clock` - Pending status
- `CheckCircle` - Approved/Paid status
- `XCircle` - Rejected status
- `AlertCircle` - Warning/info alerts
- `Users`, `CreditCard`, `Save`, `Copy`, `Check`, `Phone`, `MessageCircle`, `Building`

### Custom Components
- `Button` - Action buttons with loading states
- `Input` - Form inputs with validation
- `Card` - Container components

### Libraries
- `react-hot-toast` - Success/error notifications
- `framer-motion` - Smooth animations and transitions

## Testing Guide

### As Affiliate
1. Login as affiliate user
2. Navigate to dashboard
3. Add bank details (if not added)
4. Request withdrawal (try various amounts)
5. Check withdrawal history table
6. Verify balance calculations

### As Admin
1. Login as admin user
2. Navigate to Admin → Withdrawals
3. View stats dashboard
4. Try approving a withdrawal
5. Try rejecting with reason
6. Try marking approved as paid
7. Verify data updates in tables

### Edge Cases to Test
- Request with zero or negative amount
- Request more than available balance
- Request without bank details
- Request full available balance using "Withdraw All"
- Multiple simultaneous withdrawals
- Approve then mark as paid workflow
- Rejection with and without reason

## Security Considerations

1. **Bank Details**
   - Stored in Firestore (consider encryption)
   - Only visible to affiliate owner and admin
   - Validated before storage

2. **Withdrawal Approval**
   - Only admin can approve/reject/mark paid
   - Amount deducted from earnings on approval
   - Transaction is atomic

3. **Balance Calculation**
   - Real-time calculation from referrals and withdrawals
   - Server-side validation on withdrawal request
   - Prevents over-withdrawal

## Future Enhancements

### Potential Features
1. **Email Notifications**
   - Notify affiliate on status change
   - Notify admin on new withdrawal request

2. **Withdrawal Limits**
   - Daily/weekly/monthly limits
   - Configurable minimum/maximum amounts

3. **Batch Processing**
   - Admin can process multiple withdrawals at once
   - Export withdrawal data to CSV

4. **Payment Integration**
   - Direct bank transfer API integration
   - Auto-mark as paid after successful transfer
   - Payment receipts generation

5. **Withdrawal Schedule**
   - Set specific payout days (e.g., every Friday)
   - Queue system for scheduled processing

6. **Analytics**
   - Withdrawal trends graph
   - Average processing time
   - Affiliate withdrawal patterns

7. **Audit Trail**
   - Full history of status changes
   - Admin actions log
   - Export audit reports

## Files Modified

### Created
- `src/pages/admin/Withdrawals.tsx` - Admin withdrawal management page
- `AFFILIATE_WITHDRAWAL_SYSTEM.md` - This documentation

### Modified
- `src/services/affiliate.ts` - Added withdrawal methods and interface
- `src/pages/admin/Affiliates.tsx` - Added "View Referrals" functionality
- `src/pages/AffiliateDashboard.tsx` - Added withdrawal request section and history
- `src/App.tsx` - Added withdrawals route
- `src/components/layout/Sidebar.tsx` - Added withdrawals menu item
- `firestore.indexes.json` - Added composite indexes for withdrawals

## Deployment Notes

### Before Deploying
1. **Deploy Firestore Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Test in Development**
   - Verify all withdrawal flows work
   - Check balance calculations
   - Test status transitions

3. **Security Rules**
   - Update Firestore rules for withdrawalRequests collection
   - Ensure only admin can approve/reject
   - Affiliates can only read their own withdrawals

### Security Rules Example
```javascript
match /withdrawalRequests/{requestId} {
  // Affiliates can read only their own
  allow read: if request.auth != null && 
    (get(/databases/$(database)/documents/affiliates/$(request.auth.uid)).data.id == resource.data.affiliateId ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  // Only affiliates can create
  allow create: if request.auth != null &&
    exists(/databases/$(database)/documents/affiliates/$(request.auth.uid));
  
  // Only admin can update
  allow update: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## Support & Maintenance

### Common Issues

**Problem**: Withdrawal request fails
- Check bank details are saved
- Verify amount is positive (greater than zero)
- Check available balance

**Problem**: Balance not updating after approval
- Check affiliate totalEarnings field
- Verify withdrawal status is "approved"
- Check Firestore transaction succeeded

**Problem**: Cannot see withdrawal requests (admin)
- Verify user has admin role
- Check Firestore indexes are deployed
- Clear browser cache

### Monitoring
- Track failed withdrawal requests
- Monitor average approval time
- Watch for duplicate requests
- Alert on large withdrawal amounts

---

**Last Updated**: November 3, 2025
**Version**: 1.0.0
**Status**: ✅ Fully Implemented and Ready for Testing
