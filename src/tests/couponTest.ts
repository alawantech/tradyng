import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Inspect current ABUBAKARDEV coupon
export const inspectAbubakarDevCoupon = async () => {
  console.log('� Inspecting ABUBAKARDEV coupon...');

  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', 'abubakardev'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ ABUBAKARDEV coupon not found');
      return { success: false, message: 'Coupon not found' };
    }

    const couponDoc = querySnapshot.docs[0];
    const couponData = couponDoc.data();

    console.log('📋 Current ABUBAKARDEV coupon data:');
    console.log(JSON.stringify(couponData, null, 2));

    // Check structure
    const issues = [];
    if (couponData.planType !== 'all') {
      issues.push(`planType should be 'all', got '${couponData.planType}'`);
    }
    if (typeof couponData.discount !== 'object') {
      issues.push(`discount should be object, got ${typeof couponData.discount}`);
    } else {
      if (couponData.discount.business !== 2000) {
        issues.push(`business discount should be 2000, got ${couponData.discount.business}`);
      }
      if (couponData.discount.pro !== 4000) {
        issues.push(`pro discount should be 4000, got ${couponData.discount.pro}`);
      }
    }

    if (issues.length > 0) {
      console.log('❌ Issues found:', issues);
      return { success: false, message: 'Issues found', issues, data: couponData };
    } else {
      console.log('✅ Coupon structure is correct');
      return { success: true, message: 'Coupon structure is correct', data: couponData };
    }

  } catch (error: any) {
    console.error('❌ Failed to inspect coupon:', error);
    return { success: false, message: error.message };
  }
};

// Test the updated coupon system
export const testCouponSystem = async () => {
  console.log('🧪 Testing Updated Coupon System...');

  try {
    const couponsRef = collection(db, 'coupons');

    // Test ABUBAKARDEV coupon for business plan
    console.log('1️⃣ Testing ABUBAKARDEV coupon for business plan...');
    const businessQuery = query(couponsRef, where('code', '==', 'abubakardev'));
    const businessSnapshot = await getDocs(businessQuery);

    if (businessSnapshot.empty) {
      throw new Error('ABUBAKARDEV coupon not found');
    }

    const couponDoc = businessSnapshot.docs[0];
    const couponData = couponDoc.data();

    console.log('📋 Current coupon data:', couponData);

    // Verify coupon structure
    if (couponData.planType !== 'all') {
      throw new Error('ABUBAKARDEV should have planType "all"');
    }

    if (typeof couponData.discount !== 'object') {
      throw new Error('ABUBAKARDEV discount should be an object');
    }

    if (couponData.discount.business !== 2000) {
      throw new Error('ABUBAKARDEV business discount should be 2000');
    }

    if (couponData.discount.pro !== 4000) {
      throw new Error('ABUBAKARDEV pro discount should be 4000');
    }

    console.log('✅ ABUBAKARDEV coupon structure verified');

    // Test discount calculation logic (simulate what happens in validateCoupon)
    const testPlanDiscounts = [
      { planId: 'business', expectedDiscount: 2000 },
      { planId: 'pro', expectedDiscount: 4000 }
    ];

    for (const test of testPlanDiscounts) {
      console.log(`2️⃣ Testing discount calculation for ${test.planId} plan...`);

      let discountAmount = 0;
      if (typeof couponData.discount === 'number') {
        discountAmount = couponData.discount;
      } else if (typeof couponData.discount === 'object' && couponData.discount[test.planId]) {
        discountAmount = couponData.discount[test.planId];
      }

      if (discountAmount !== test.expectedDiscount) {
        throw new Error(`Discount for ${test.planId} should be ${test.expectedDiscount}, got ${discountAmount}`);
      }

      console.log(`✅ ${test.planId} plan discount: ₦${discountAmount.toLocaleString()}`);
    }

    // Test PRODISCOUNT coupon (should still work as before)
    console.log('3️⃣ Testing PRODISCOUNT coupon...');
    const proQuery = query(couponsRef, where('code', '==', 'prodiscount'));
    const proSnapshot = await getDocs(proQuery);

    if (proSnapshot.empty) {
      throw new Error('PRODISCOUNT coupon not found');
    }

    const proCouponData = proSnapshot.docs[0].data();

    if (proCouponData.planType !== 'pro') {
      throw new Error('PRODISCOUNT should have planType "pro"');
    }

    if (proCouponData.discount !== 4000) {
      throw new Error('PRODISCOUNT discount should be 4000');
    }

    console.log('✅ PRODISCOUNT coupon verified');

    console.log('🎉 Coupon system test PASSED!');

    return {
      success: true,
      message: 'Coupon system works correctly with plan-specific discounts'
    };

  } catch (error: any) {
    console.error('❌ Coupon system test FAILED:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};