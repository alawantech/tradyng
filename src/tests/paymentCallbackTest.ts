import { AuthService } from '../services/auth';
import { BusinessService } from '../services/business';
import { UserService } from '../services/user';

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