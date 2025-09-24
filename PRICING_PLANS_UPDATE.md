# Updated Pricing Plans for Trady.ng

## Plan Structure Overview

### 1. **Free Plan** - $0/month
✅ **Allowed Features:**
- **20 products maximum**
- **1 image per product only** (no videos)
- **Orders + Receipts allowed** but with watermarked receipts (Trady.ng logo)
- **Custom business page** with basic theme (no branding control)
- **Limited storage**: 50 MB maximum
- **50 orders per month limit**
- **"Powered by trady.ng" badge** (cannot be removed)
- **Subdomain only**: trady.ng/yourbusinessname

❌ **Not Allowed:**
- Videos
- Multiple product images
- Custom domain support
- Advanced analytics
- Email customization (only plain system emails)
- Branding removal

---

### 2. **Business Plan** - $29/month
✅ **All Features Included:**
- **Up to 150 products**
- **Up to 4 images per product**
- **30-second videos per product**
- **Custom domain support**
- **Unlimited orders**
- **Access to receipts** (no watermark)
- **Advanced analytics**
- **Email customization**
- **Priority support**
- **Remove "Powered by" badge**
- **5GB storage limit**

---

### 3. **Pro Plan** - $99/month
✅ **All Business Features Plus:**
- **Up to 300 products**
- **Up to 4 images per product**
- **1-minute videos per product**
- **Custom domain support**
- **Unlimited orders**
- **Access to receipts** (no watermark)
- **Advanced analytics**
- **Email customization**
- **Priority support**
- **Remove "Powered by" badge**
- **API access**
- **White-label solution**
- **10GB storage limit**

---

## Technical Implementation

### Plan Limits Configuration
```typescript
// src/constants/plans.ts
export const PLAN_LIMITS = {
  free: {
    maxProducts: 20,
    maxImagesPerProduct: 1,
    maxVideoLengthSeconds: 0, // No videos
    maxStorageMB: 50,
    maxOrdersPerMonth: 50,
    allowCustomDomain: false,
    allowVideos: false,
    watermarkedReceipts: true,
    showPoweredByBadge: true,
    advancedAnalytics: false,
    emailCustomization: false,
  },
  business: {
    maxProducts: 150,
    maxImagesPerProduct: 4,
    maxVideoLengthSeconds: 30,
    maxStorageMB: 5000, // 5GB
    maxOrdersPerMonth: -1, // Unlimited
    allowCustomDomain: true,
    allowVideos: true,
    watermarkedReceipts: false,
    showPoweredByBadge: false,
    advancedAnalytics: true,
    emailCustomization: true,
  },
  pro: {
    maxProducts: 300,
    maxImagesPerProduct: 4,
    maxVideoLengthSeconds: 60,
    maxStorageMB: 10000, // 10GB
    maxOrdersPerMonth: -1, // Unlimited
    allowCustomDomain: true,
    allowVideos: true,
    watermarkedReceipts: false,
    showPoweredByBadge: false,
    advancedAnalytics: true,
    emailCustomization: true,
  }
};
```

### UI Enhancements
1. **Plan Limits Display**: Shows current usage and limits in the dashboard
2. **Validation Alerts**: Prevents users from exceeding their plan limits
3. **Feature Restrictions**: Conditionally shows/hides features based on plan
4. **Upgrade Prompts**: Suggests plan upgrades when limits are reached

### Files Updated:
- `src/pages/LandingPage.tsx` - Updated pricing display
- `src/constants/plans.ts` - New plan limits configuration
- `src/pages/dashboard/Products.tsx` - Plan validation and limits display
- `src/services/business.ts` - Updated Business interface
- `FIRESTORE_STRUCTURE.md` - Updated plan types

## Migration Notes
- Existing "basic" plan customers should be migrated to "business" plan
- All plan validations are enforced in the frontend
- Backend validation should also be implemented for security
- Storage limits need to be monitored and enforced

## Benefits of New Structure:
1. **Clear Value Proposition**: Each plan has distinct benefits
2. **Progressive Features**: Natural upgrade path from free to paid plans
3. **Realistic Limits**: Free plan encourages upgrades without being too restrictive
4. **Video Support**: Differentiated video lengths create upgrade incentive
5. **Professional Features**: Business and Pro plans offer serious business tools