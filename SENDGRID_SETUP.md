# SendGrid Email Setup Guide for Your E-commerce Platform

## 🎯 What You'll Get:

✅ **OTP Registration** (expires in 1 day)
✅ **Order Notifications** to store owners  
✅ **Order Confirmations** to customers
✅ **Order Approval** emails with PDF receipts
✅ **Delivery Notifications** to customers
✅ **Welcome Emails** for new customers

---

## 🚀 Step 1: Create SendGrid Account

### A. Sign Up
1. Go to [SendGrid.com](https://sendgrid.com)
2. Click "Start for Free"
3. Fill registration form
4. Choose "Send with Code" option
5. Verify your email address

### B. Account Setup
1. Complete identity verification
2. Add your company details
3. Select "Transactional" as email type

---

## 🔑 Step 2: Get API Key

### A. Create API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Choose **"Restricted Access"** (recommended)
4. Give it a name: `Rady.ng E-commerce`

### B. Set Permissions
Select only these permissions:
- ✅ **Mail Send** → Full Access
- ✅ **Mail Settings** → Read Access  
- ✅ **Tracking** → Read Access

### C. Copy API Key
1. Click **"Create & View"**
2. **IMPORTANT**: Copy the API key immediately (starts with `SG.`)
3. Store it safely - you won't see it again!

---

## 🌐 Step 3: Domain Authentication (Critical!)

### A. Add Your Domain
1. Go to **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain: `rady.ng`
4. Choose **"No"** for branded links (for now)

### B. DNS Records (Add to TrueHost)
SendGrid will provide DNS records like:

```
Type: CNAME
Name: s1._domainkey.rady.ng
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME  
Name: s2._domainkey.rady.ng
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

### C. Add DNS Records
1. Login to your **TrueHost** DNS panel
2. Add each CNAME record exactly as provided
3. Wait 10-15 minutes for DNS propagation
4. Return to SendGrid and click **"Verify"**

---

## ⚙️ Step 4: Configure Environment

### A. Add to .env file:
```bash
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

### B. For Vercel Deployment:
1. Go to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Add: `SENDGRID_API_KEY` = `SG.your_api_key`

---

## 📧 Step 5: Configure Email Addresses

### A. Add Sender Identities
In SendGrid: **Settings** → **Sender Authentication** → **Single Sender Verification**

Add these sender emails:
```
orders@rady.ng        (for order confirmations)
receipts@rady.ng      (for receipts)  
delivery@rady.ng      (for delivery notifications)
welcome@rady.ng       (for welcome emails)
verification@rady.ng  (for OTP emails)
notifications@rady.ng (for admin notifications)
```

### B. Verify Each Sender
1. Click "Create New Sender"
2. Fill in details for each email
3. Use your business information
4. Verify each email address

---

## 🧪 Step 6: Test Email Setup

### A. Test Basic Send
```javascript
// Test in your app
import { EmailService } from './services/emailService';

const testEmail = await EmailService.sendEmail({
  to: 'your-email@gmail.com',
  from: 'orders@rady.ng',
  subject: 'Test Email',
  html: '<h1>Hello from SendGrid!</h1>'
});

console.log('Test email sent:', testEmail);
```

### B. Test OTP Flow
```javascript
import { OTPService } from './services/otpService';
import { EmailService } from './services/emailService';

// Generate and send OTP
const otp = await OTPService.createOTP('test@example.com');
await EmailService.sendRegistrationOTP('test@example.com', otp, 'Test Store');
```

---

## 💰 Step 7: Choose Pricing Plan

### Free Plan (Good for testing):
- 100 emails/day
- SendGrid branding
- Basic features

### Pay-As-You-Go (Recommended):
- $0.95 per 1,000 emails
- No monthly minimum
- No branding
- Full features

### To Upgrade:
1. Go to **Settings** → **Account Details** → **Your Plan**
2. Choose **"Pay As You Go"**
3. Add payment method
4. Buy email credits (minimum $9.95 = 10,000 emails)

---

## 🔧 Step 8: Advanced Configuration

### A. Email Templates (Optional)
1. Go to **Email API** → **Dynamic Templates**
2. Create branded templates for your emails
3. Use in your code with template IDs

### B. Webhook Setup (Optional)
1. Go to **Settings** → **Mail Settings** → **Event Webhook**
2. Add webhook URL: `https://rady.ng/api/sendgrid-webhook`
3. Select events: Delivered, Opened, Clicked, Bounced

### C. Suppression Management
1. Go to **Suppressions** to manage bounced/unsubscribed emails
2. SendGrid automatically handles this

---

## 📊 Step 9: Monitor Email Performance

### A. Dashboard Metrics
Monitor in SendGrid dashboard:
- **Delivery Rate** (should be >95%)
- **Open Rate** (typical: 15-25%)
- **Click Rate** (typical: 2-5%)
- **Bounce Rate** (should be <5%)

### B. Email Activity
View detailed email logs in **Activity** section

---

## 🚨 Step 10: Troubleshooting

### Common Issues:

**1. Authentication Failed**
- Check API key is correct
- Verify domain authentication
- Ensure sender email is verified

**2. Emails Going to Spam**
- Complete domain authentication
- Add SPF/DKIM records
- Use verified sender addresses
- Avoid spam trigger words

**3. High Bounce Rate**
- Clean email lists
- Use double opt-in
- Monitor suppression lists

**4. API Errors**
- Check rate limits (600 emails/minute)
- Verify request format
- Check error codes in logs

---

## ✅ Final Checklist:

- [ ] SendGrid account created and verified
- [ ] API key generated and saved
- [ ] Domain authenticated (DNS records added)
- [ ] Sender emails verified
- [ ] Environment variables configured
- [ ] Test email sent successfully
- [ ] Pricing plan selected
- [ ] Email templates working

---

## 🎉 You're Ready!

Your email system will now automatically:

1. **Registration**: Send OTP (expires 1 day) → Customer
2. **Order Placed**: Send confirmation → Customer + notification → Owner
3. **Order Approved**: Send approval + PDF receipt → Customer
4. **Order Delivered**: Send delivery notification → Customer

## 📞 Support:

- **SendGrid Support**: [support.sendgrid.com](https://support.sendgrid.com)
- **Documentation**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **Status Page**: [status.sendgrid.com](https://status.sendgrid.com)