# Manual Payment System Implementation

## ✅ COMPLETED

### 1. Payment Page (Payment.tsx)
**Features:**
- ✅ Display bank transfer details (Bank Name, Account Name, Account Number)
- ✅ Copy-to-clipboard functionality for each bank detail
- ✅ Amount display with copy function
- ✅ Payment receipt upload (JPG, PNG, WEBP)
- ✅ Image preview before submission
- ✅ "Coming Soon" badge for automatic payments (Flutterwave)
- ✅ Order summary with items
- ✅ Submit order with uploaded receipt

### 2. Order Service Updates
**Changes:**
- ✅ Added `paymentReceipt?: string` field to Order interface
- ✅ Receipt URL is saved with order when customer uploads payment proof

### 3. Firestore Structure
Orders now include:
```typescript
{
  ...existingFields,
  paymentReceipt: "https://firebasestorage.googleapis.com/.../receipt.jpg"
}
```

## 🔄 PENDING - Admin Dashboard Receipt Viewing

### TODO: Update Admin Orders Page
The admin orders page needs to show the payment receipt. Add:

1. **Orders Table** - Add "Receipt" column
2. **View Receipt Button** - Click to view uploaded receipt in modal/new tab
3. **Receipt Preview** - Show image in a modal when admin clicks

### Example Implementation for Admin Orders:

```tsx
// In the orders table, add column:
<td>
  {order.paymentReceipt ? (
    <Button
      size="sm"
      onClick={() => window.open(order.paymentReceipt, '_blank')}
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      View Receipt
    </Button>
  ) : (
    <span className="text-gray-400">No receipt</span>
  )}
</td>
```

## 🎯 How It Works

### Customer Flow:
1. Customer completes checkout → Redirected to `/payment`
2. Sees bank details for transfer
3. Makes bank transfer
4. Uploads payment receipt image
5. Clicks "Submit Order"
6. Order created with `paymentStatus: 'pending'` and receipt URL saved

### Admin Flow (TO BE IMPLEMENTED):
1. Admin opens Orders page
2. Sees list of orders
3. Clicks "View Receipt" for orders with uploaded receipts
4. Receipt image opens in new tab or modal
5. Admin verifies payment
6. Admin updates order status to "paid" or "approved"

## 📋 Bank Details Configuration

Currently hardcoded in Payment.tsx. You can make it dynamic by:

1. Add bank details to business settings:
```typescript
// In business document
settings: {
  bankName: string,
  accountName: string,
  accountNumber: string,
  swiftCode?: string
}
```

2. Update Payment.tsx to read from `business.settings`

## ✅ Testing Checklist

- [x] Build successful
- [ ] Customer can see payment page
- [ ] Customer can upload receipt
- [ ] Order is created with receipt URL
- [ ] Receipt is saved to Firebase Storage
- [ ] Admin can see orders (needs implementation)
- [ ] Admin can view receipt (needs implementation)

## 🚀 Next Steps

1. Test the payment flow on customer storefront
2. Implement admin orders viewing with receipt column
3. Add receipt modal/viewer for admin
4. Test complete flow: Customer upload → Admin view
5. Optionally: Add email notification with receipt to admin

