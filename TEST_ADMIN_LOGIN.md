# Admin Login Test Guide

## Issue Fixed
The admin login was redirecting to the coupon page instead of the admin dashboard.

## What Was Fixed
1. **SignIn.tsx** - Added early return for admin users BEFORE any other role checks
2. **Businesses.tsx** - Updated to fetch real data from Firestore instead of mock data
3. **Affiliates.tsx** - Created new page to display all affiliates
4. **App.tsx** - Added Affiliates route to admin section
5. **Sidebar.tsx** - Added Affiliates link to admin menu

## How to Test

### Step 1: Clear Browser Cache
The browser might be using cached JavaScript. Do ONE of these:
- **Hard Refresh**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Incognito Mode**: Open a new incognito/private window
- **Clear Cache**: F12 → Network tab → Disable cache checkbox

### Step 2: Start Dev Server
```powershell
cd d:\tradyng
npm run dev
```

### Step 3: Login
1. Open browser to `http://localhost:5174` (or whatever port the dev server shows)
2. Go to `/auth/signin`
3. Login with your admin credentials:
   - Email: `abubakarlawan671@gmail.com`
   - Password: (your password)

### Step 4: Verify
You should be redirected to `/admin` and see:
- Businesses page with real data from Firestore
- Sidebar with: Businesses, Affiliates, Subscriptions, Analytics, Settings
- Admin dashboard showing all business owners

### Expected Console Logs
When you login, you should see in the browser console:
```
🔐 Attempting to sign in with: { email: 'abubakarlawan671@gmail.com' }
✅ Successfully signed in: { uid: '0b6gdj75y0XsQnl0ZYa00f4KXx33', email: ... }
👤 User data retrieved: { role: 'admin', ... }
🔍 User role is: admin (type: string)
🔍 Role comparison check: { rawRole: 'admin', ... isAdmin: true, ... }
🎯🎯🎯 ADMIN DETECTED - REDIRECTING TO /admin 🎯🎯🎯
```

## Firestore Verification
Your user document in Firestore `users` collection:
```
uid: "0b6gdj75y0XsQnl0ZYa00f4KXx33"
email: "abubakarlawan671@gmail.com"
role: "admin"  ← Must be exactly this (lowercase)
```

## Admin Dashboard Features
Once logged in as admin, you can:
1. **Businesses** - View all businesses with owner details
2. **Affiliates** - View all affiliates with referral stats
3. **Subscriptions** - Manage subscriptions
4. **Analytics** - View platform analytics
5. **Settings** - Admin settings

## Troubleshooting

### Still redirecting to coupon page?
1. Check browser console for logs
2. Verify role in Firestore is `"admin"` (not `"Admin"` or `"business_owner"`)
3. Clear browser cache completely
4. Try incognito mode
5. Check dev server is running on the correct port

### Dev server not starting?
```powershell
# Kill any process using port 5173/5174
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Then restart
npm run dev
```

### Still having issues?
Check the console logs and share:
- The `👤 User data retrieved:` log
- The `🔍 Role comparison check:` log
- Any error messages
