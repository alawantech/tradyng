# Email API Setup Guide

## Problem Solved
This setup fixes the CORS error when trying to send emails directly from the frontend to SendGrid API. Email sending now happens securely through a backend API.

## Quick Fix (Current Solution)
The current implementation uses a **mock email service** that displays OTP codes in the browser console and as temporary notifications. This allows development and testing without a backend.

### How it works now:
1. User requests OTP verification
2. Mock email service generates OTP 
3. **OTP code is displayed in browser notification and console**
4. User can copy the OTP from the notification to complete verification

## Production Setup (Next Steps)

### Option 1: Deploy to Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Create vercel.json in project root
{
  "functions": {
    "api/send-email.js": {
      "runtime": "nodejs18.x"
    }
  }
}

# 3. Set environment variables in Vercel dashboard
SENDGRID_API_KEY=your_sendgrid_api_key

# 4. Deploy
vercel --prod
```

### Option 2: Deploy to Netlify
```bash
# 1. Create netlify.toml
[build]
  functions = "api"

[functions]
  node_bundler = "esbuild"

# 2. Set environment variables in Netlify dashboard
SENDGRID_API_KEY=your_sendgrid_api_key

# 3. Deploy via Netlify CLI or Git integration
```

### Option 3: Express.js Server
```bash
# 1. Navigate to api folder
cd api

# 2. Install dependencies
npm install

# 3. Create .env file
SENDGRID_API_KEY=your_sendgrid_api_key
PORT=3001

# 4. Start server
npm start
```

## Frontend Configuration

### Environment Variables (.env)
```env
# For production API
VITE_EMAIL_API_URL=https://your-api-domain.vercel.app

# SendGrid settings (for backend)
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Switching to Production Email Service

1. **Replace mock service** in `src/services/otpService.ts`:
```typescript
// Change this line:
import { EmailService } from './emailService';

// To this:
import { ProductionEmailService as EmailService } from './productionEmailService';
```

2. **Update API URL** in `.env`:
```env
VITE_EMAIL_API_URL=https://your-deployed-api.vercel.app
```

## Testing

### Development Testing (Current)
1. Fill out registration form
2. Click "Send Verification Code"
3. **Look for green notification in top-right corner**
4. **Copy OTP code from notification**
5. Paste code in verification field

### Production Testing
1. Deploy backend API
2. Update environment variables
3. Switch to ProductionEmailService
4. Test with real email addresses

## Security Notes

### ✅ What's Fixed
- No more CORS errors
- SendGrid API key hidden from frontend
- Secure backend email sending

### 🔒 Production Security
- Use HTTPS for API endpoints
- Validate email addresses server-side
- Rate limit API calls
- Monitor for abuse

## API Endpoints

### POST /api/send-email
```json
{
  "to": "user@example.com",
  "from": "noreply@yourdomain.com", 
  "subject": "Email Verification",
  "html": "<html>Email content</html>",
  "text": "Plain text version"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

## Deployment Checklist

- [ ] Choose deployment platform (Vercel/Netlify/Custom)
- [ ] Set up SendGrid account and get API key
- [ ] Configure environment variables
- [ ] Deploy backend API
- [ ] Update frontend to use ProductionEmailService
- [ ] Test with real email addresses
- [ ] Monitor email delivery rates

## Troubleshooting

### Common Issues

1. **CORS Error**
   - Solution: Use backend API instead of direct SendGrid calls

2. **OTP Not Received**
   - Check spam folder
   - Verify SendGrid configuration
   - Check API logs for errors

3. **API Key Issues**
   - Ensure key is set in backend environment
   - Never expose key in frontend code

4. **Rate Limiting**
   - Implement backend rate limiting
   - Monitor SendGrid usage

### Debug Steps
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Test API with Postman/curl
4. Check SendGrid dashboard for delivery status

## Next Steps

1. **Immediate**: Use current mock service for development
2. **Short-term**: Deploy simple backend API
3. **Long-term**: Implement full email service with templates, analytics, etc.

The mock service allows you to continue development immediately while you set up the production email infrastructure.