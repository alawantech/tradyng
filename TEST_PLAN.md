# Test Plan for Affiliate System Registration

## Overview
This test plan validates the complete affiliate system registration process using a low-cost test plan (₦150). The test ensures that all registration logic, coupon handling, and affiliate commission systems work identically to production plans.

## Test Plan Details

### Test Plan Configuration
- **Plan ID**: `test`
- **Plan Name**: Test Plan
- **Price**: ₦150 (yearly)
- **Features**:
  - Up to 50 products
  - Up to 2 images per product
  - 15-second videos per product
  - 100 orders per month
  - 1GB storage
  - Watermarked receipts
  - "Powered by" badge shown

### Test Scenarios

#### 1. Basic Registration (No Coupon)
**Objective**: Verify basic registration flow works
**Steps**:
1. Navigate to `http://localhost:5174/pricing`
2. Click "Start Test Plan" button
3. Skip coupon section
4. Enter registration details:
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPass123!
   - Confirm Password: TestPass123!
5. Complete payment (₦150)
6. Verify account creation and dashboard access

**Expected Results**:
- Registration form accepts input
- Payment processes successfully
- User redirected to dashboard
- Business created with test plan limits

#### 2. Registration with Regular Coupon
**Objective**: Test coupon discount functionality
**Steps**:
1. Navigate to `http://localhost:5174/coupon?plan=test&amount=150`
2. Enter coupon code: `TESTDISCOUNT`
3. Verify ₦20 discount applied (total: ₦130)
4. Complete registration with coupon applied

**Expected Results**:
- Coupon validates successfully
- ₦20 discount applied
- Final payment amount: ₦130
- No affiliate commission triggered

#### 3. Registration with Affiliate Code
**Objective**: Test affiliate referral system
**Prerequisites**: Need an existing affiliate account
**Steps**:
1. Create/register an affiliate first (see affiliate registration steps below)
2. Navigate to `http://localhost:5174/coupon?plan=test&amount=150`
3. Enter affiliate username as coupon code
4. Verify ₦20 discount applied
5. Complete registration

**Expected Results**:
- Affiliate code validates successfully
- ₦20 discount applied to user
- ₦20 commission recorded for affiliate
- Affiliate dashboard shows new referral

#### 4. Affiliate Registration
**Objective**: Test affiliate account creation
**Steps**:
1. Navigate to `http://localhost:5174/affiliate`
2. Fill registration form:
   - Full Name: Affiliate Test
   - Username: testaffiliate
   - Email: affiliate@test.com
   - Password: Affiliate123!
   - Confirm Password: Affiliate123!
3. Complete registration

**Expected Results**:
- Affiliate account created
- Coupon code generated for username
- Redirected to affiliate dashboard
- Can access affiliate features

## Testing Checklist

### Registration Flow
- [ ] Form validation works correctly
- [ ] Email uniqueness enforced
- [ ] Password strength requirements
- [ ] Terms acceptance (if applicable)
- [ ] Error handling for network issues

### Payment Processing
- [ ] Flutterwave integration works
- [ ] Correct amount charged
- [ ] Discount applied properly
- [ ] Payment callback handled
- [ ] Business account created with correct plan

### Coupon System
- [ ] Regular coupons apply discounts
- [ ] Invalid coupons rejected
- [ ] Coupon usage limits respected
- [ ] Affiliate codes work as coupons
- [ ] Commission calculated correctly

### Affiliate System
- [ ] Affiliate registration works
- [ ] Username uniqueness enforced
- [ ] Affiliate dashboard accessible
- [ ] Referral tracking works
- [ ] Commission payouts calculated

### Plan Limits
- [ ] Test plan limits applied correctly
- [ ] Product limits enforced
- [ ] Storage limits respected
- [ ] Feature restrictions work

## Test Data

### Test Users
```
Regular User:
- Email: testuser@example.com
- Password: TestPass123!

Affiliate User:
- Username: testaffiliate
- Email: affiliate@test.com
- Password: Affiliate123!
```

### Test Coupons
```
Regular Coupon: TESTDISCOUNT (₦20 off test plan)
Affiliate Code: TESTAFFILIATE (₦20 off + ₦20 commission)
```

## Success Criteria

The test plan is successful if:
1. All registration flows complete without errors
2. Payments process correctly with discounts applied
3. Affiliate commissions are recorded accurately
4. Plan limits are enforced properly
5. User experience matches production plans

## Troubleshooting

### Common Issues
- **Payment fails**: Check Flutterwave configuration
- **Coupon not applied**: Verify coupon exists in Firestore
- **Affiliate not found**: Ensure affiliate account created successfully
- **Plan limits not applied**: Check PLAN_LIMITS configuration

### Debug Commands
```bash
# Check Firebase data
firebase firestore:query "coupons" --project tradyng-51655
firebase firestore:query "affiliates" --project tradyng-51655
firebase firestore:query "users" --project tradyng-51655

# Check application logs
tail -f logs/application.log
```

## Next Steps

After successful testing with the test plan:
1. All logic validated for production use
2. Can confidently deploy business/pro plans
3. Affiliate system proven to work
4. Coupon and discount systems verified

The test plan ensures production reliability while using minimal test payments.