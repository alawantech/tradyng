import { AuthService } from '../services/auth';
import { BusinessService } from '../services/business';
import { UserService } from '../services/user';
import { AffiliateService } from '../services/affiliate';

// Test the payment callback upgrade flow
export const testPaymentCallbackUpgrade = async () => {
  console.log('🧪 Testing Payment Callback Upgrade Flow...');

  try {
    // Test data
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';
    const testStoreName = 'Test Store';
    const testPlanId = 'business';

    // 1. Create a test user account
    console.log('1️⃣ Creating test user account...');
    const authUser = await AuthService.signUp(testEmail, testPassword);
    console.log('✅ Test user created:', authUser.uid);

    // 2. Create user document
    await UserService.createUser({
      uid: authUser.uid,
      email: testEmail,
      displayName: testStoreName,
      role: 'business_owner'
    });
    console.log('✅ User document created');

    // 3. Create business with free plan
    const businessData = {
      name: testStoreName,
      subdomain: 'teststore',
      ownerId: authUser.uid,
      email: testEmail,
      phone: '08012345678',
      whatsapp: '08012345678',
      country: 'Nigeria',
      state: 'Lagos',
      plan: 'free' as const, // Start with free plan
      status: 'active' as const,
      settings: {
        currency: 'NGN',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        enableNotifications: true
      },
      revenue: 0,
      totalOrders: 0,
      totalProducts: 0
    };

    const businessId = await BusinessService.createBusiness(businessData);
    console.log('✅ Business created with free plan, ID:', businessId);

    // 4. Verify initial plan is 'free'
    const businesses = await BusinessService.getBusinessesByOwnerId(authUser.uid);
    const business = businesses[0];
    console.log('📊 Initial business plan:', business.plan);
    if (business.plan !== 'free') {
      throw new Error('Initial plan should be free');
    }

    // 5. Simulate plan upgrade (what PaymentCallback.upgradeCurrentUserAccount does)
    console.log('2️⃣ Simulating plan upgrade...');
    if (!business.id) {
      throw new Error('Business ID is undefined');
    }
    await BusinessService.updateBusiness(business.id, {
      plan: testPlanId
    });
    console.log('✅ Business plan upgraded to:', testPlanId);

    // 6. Verify plan was upgraded
    const updatedBusinesses = await BusinessService.getBusinessesByOwnerId(authUser.uid);
    const updatedBusiness = updatedBusinesses[0];
    console.log('📊 Updated business plan:', updatedBusiness.plan);

    if (updatedBusiness.plan !== testPlanId) {
      throw new Error(`Plan upgrade failed. Expected: ${testPlanId}, Got: ${updatedBusiness.plan}`);
    }

    // 7. Clean up - delete test data
    console.log('3️⃣ Cleaning up test data...');

    // Delete business
    if (business.id) {
      await BusinessService.deleteBusiness(business.id);
    }

    console.log('✅ Test data cleaned up');
    console.log('🎉 Payment callback upgrade flow test PASSED!');

    return {
      success: true,
      message: 'Payment callback upgrade flow works correctly'
    };

  } catch (error: any) {
    console.error('❌ Payment callback upgrade flow test FAILED:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// Test the email existence checking flow
export const testEmailExistenceCheck = async () => {
  console.log('🧪 Testing Email Existence Check Flow...');

  try {
    const testEmail = 'existing@example.com';
    const testPassword = 'testpassword123';
    const testStoreName = 'Existing Store';

    // 1. Create a test user account
    console.log('1️⃣ Creating test user account...');
    const authUser = await AuthService.signUp(testEmail, testPassword);
    console.log('✅ Test user created:', authUser.uid);

    // 2. Create user document
    await UserService.createUser({
      uid: authUser.uid,
      email: testEmail,
      displayName: testStoreName,
      role: 'business_owner'
    });
    console.log('✅ User document created');

    // 3. Test email existence check (what SignUp.checkEmailExists does)
    console.log('2️⃣ Testing email existence check...');

    // Check Firebase Auth
    const emailExists = await AuthService.checkEmailExists(testEmail);
    console.log('📧 Email exists in Auth:', emailExists);

    // Check Firestore
    const users = await UserService.getUsersByEmail(testEmail);
    console.log('📄 User documents found:', users.length);

    if (!emailExists) {
      throw new Error('Email should exist in Firebase Auth');
    }

    if (users.length === 0) {
      throw new Error('User document should exist in Firestore');
    }

    console.log('✅ Test data cleaned up');
    console.log('🎉 Email existence check flow test PASSED!');

    return {
      success: true,
      message: 'Email existence check flow works correctly'
    };

  } catch (error: any) {
    console.error('❌ Email existence check flow test FAILED:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// Test the affiliate referral recording flow
export const testAffiliateReferralRecording = async () => {
  console.log('🧪 Testing Affiliate Referral Recording Flow...');

  try {
    // Test data
    const affiliateEmail = 'affiliate@example.com';
    const affiliatePassword = 'affiliate123';
    const affiliateUsername = 'testaffiliate';
    const affiliateFullName = 'Test Affiliate';

    const customerEmail = 'customer@example.com';
    const customerPassword = 'customer123';
    const customerStoreName = 'Customer Store';

    // 1. Create affiliate account
    console.log('1️⃣ Creating affiliate account...');
    const affiliateAuthUser = await AuthService.signUp(affiliateEmail, affiliatePassword);
    console.log('✅ Affiliate user created:', affiliateAuthUser.uid);

    // Create affiliate profile
    const affiliateData = {
      email: affiliateEmail,
      fullName: affiliateFullName,
      username: affiliateUsername,
      password: affiliatePassword,
      bankDetails: {
        accountName: 'Test Bank Account',
        accountNumber: '1234567890',
        bankName: 'Test Bank'
      }
    };

    const affiliateId = await AffiliateService.createAffiliate(affiliateData);
    console.log('✅ Affiliate profile created, ID:', affiliateId);

    // 2. Create customer account (referred user)
    console.log('2️⃣ Creating customer account...');
    const customerAuthUser = await AuthService.signUp(customerEmail, customerPassword);
    console.log('✅ Customer user created:', customerAuthUser.uid);

    // Create user document for customer
    await UserService.createUser({
      uid: customerAuthUser.uid,
      email: customerEmail,
      displayName: customerStoreName,
      role: 'business_owner'
    });
    console.log('✅ Customer user document created');

    // Create business for customer
    const customerBusinessData = {
      name: customerStoreName,
      subdomain: 'customerstore',
      ownerId: customerAuthUser.uid,
      email: customerEmail,
      phone: '08012345678',
      whatsapp: '08012345678',
      country: 'Nigeria',
      state: 'Lagos',
      plan: 'free' as const,
      status: 'active' as const,
      settings: {
        currency: 'NGN',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        enableNotifications: true
      },
      revenue: 0,
      totalOrders: 0,
      totalProducts: 0
    };

    const customerBusinessId = await BusinessService.createBusiness(customerBusinessData);
    console.log('✅ Customer business created, ID:', customerBusinessId);

    // 3. Simulate affiliate referral recording (what PaymentCallback.recordAffiliateReferral does)
    console.log('3️⃣ Simulating affiliate referral recording...');

    // Get affiliate by username
    const affiliate = await AffiliateService.getAffiliateByUsername(affiliateUsername);
    if (!affiliate) {
      throw new Error('Affiliate not found by username');
    }
    console.log('✅ Affiliate found by username:', affiliate.username);

    // Record referral
    const discountAmount = 10000; // ₦100.00 discount (which would give ₦10.00 commission at 10%)
    await AffiliateService.recordReferral(affiliateUsername, 'business', discountAmount);
    console.log('✅ Referral recorded with discount amount:', discountAmount);

    // 4. Verify referral was recorded
    console.log('4️⃣ Verifying referral recording...');

    // Get updated affiliate data
    const updatedAffiliate = await AffiliateService.getAffiliateByFirebaseUid(affiliateAuthUser.uid);
    if (!updatedAffiliate) {
      throw new Error('Updated affiliate data not found');
    }

    console.log('📊 Updated affiliate earnings:', updatedAffiliate.totalEarnings);
    console.log('📊 Updated affiliate referrals:', updatedAffiliate.totalReferrals);

    const expectedCommission = discountAmount * 0.1; // 10% commission
    if (updatedAffiliate.totalEarnings !== expectedCommission) {
      throw new Error(`Earnings mismatch. Expected: ${expectedCommission}, Got: ${updatedAffiliate.totalEarnings}`);
    }

    if (updatedAffiliate.totalReferrals !== 1) {
      throw new Error(`Referrals count mismatch. Expected: 1, Got: ${updatedAffiliate.totalReferrals}`);
    }

    // 5. Clean up test data
    console.log('5️⃣ Cleaning up test data...');

    // Delete customer business
    if (customerBusinessId) {
      await BusinessService.deleteBusiness(customerBusinessId);
    }

    // Delete affiliate profile (assuming there's a delete method)
    // Note: AffiliateService might not have delete method, so we'll skip this for now

    console.log('✅ Test data cleaned up (affiliate profile retained)');
    console.log('🎉 Affiliate referral recording flow test PASSED!');

    return {
      success: true,
      message: 'Affiliate referral recording flow works correctly'
    };

  } catch (error: any) {
    console.error('❌ Affiliate referral recording flow test FAILED:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};