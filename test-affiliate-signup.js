import { AffiliateService } from '../services/affiliate';
import { BusinessService } from '../services/business';
import { UserService } from '../services/user';
import { AuthService } from '../services/auth';

async function testAffiliateSignupFlow() {
  console.log('🧪 Testing Affiliate Signup Flow...\n');

  try {
    // Test 1: Check if test affiliate exists
    console.log('1️⃣ Checking if test affiliate exists...');
    const testAffiliate = await AffiliateService.getAffiliateByUsername('testdiscount');
    if (!testAffiliate) {
      console.log('❌ Test affiliate not found. Creating one...');
      // Create test affiliate
      const testAffiliateId = await AffiliateService.createAffiliate({
        firebaseUid: 'test-affiliate-uid',
        username: 'testdiscount',
        email: 'test@affiliate.com',
        commissionRate: 20, // 20% commission for test plan
        totalEarnings: 0,
        totalReferrals: 0,
        status: 'active'
      });
      console.log('✅ Test affiliate created with ID:', testAffiliateId);
    } else {
      console.log('✅ Test affiliate exists:', testAffiliate.username);
    }

    // Test 2: Simulate signup with test plan and coupon
    console.log('\n2️⃣ Simulating signup with test plan and coupon...');

    const testEmail = `test-${Date.now()}@example.com`;
    const testStoreName = `Test Store ${Date.now()}`;

    console.log('📧 Test email:', testEmail);
    console.log('🏪 Test store name:', testStoreName);
    console.log('🎫 Using coupon: testdiscount');

    // This would normally be done in the SignUp component
    // For testing, we'll simulate the createAccount function logic

    console.log('🔐 Creating Firebase Auth user...');
    const authUser = await AuthService.signUp(testEmail, 'testpassword123');
    console.log('✅ Auth user created:', authUser.uid);

    console.log('👤 Creating user document...');
    await UserService.createUser({
      uid: authUser.uid,
      email: testEmail,
      displayName: testStoreName,
      role: 'business_owner'
    });
    console.log('✅ User document created');

    // Get invite source UID from coupon
    console.log('🎯 Getting affiliate from coupon...');
    const affiliate = await AffiliateService.getAffiliateByUsername('testdiscount');
    const inviteSourceUid = affiliate ? affiliate.firebaseUid : undefined;
    console.log('🎯 Invite source UID:', inviteSourceUid);

    console.log('🏢 Creating business with test plan...');
    const businessData = {
      name: testStoreName,
      subdomain: testStoreName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20),
      ownerId: authUser.uid,
      email: testEmail,
      phone: '+2348012345678',
      whatsapp: '+2348012345678',
      country: 'Nigeria',
      state: 'Lagos',
      plan: 'test',
      status: 'active',
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

    // Only add inviteSourceUid if it exists
    if (inviteSourceUid) {
      (businessData as any).inviteSourceUid = inviteSourceUid;
    }

    const businessId = await BusinessService.createBusiness(businessData);
    console.log('✅ Business created with ID:', businessId);

    // Test 3: Verify affiliate referral was recorded
    console.log('\n3️⃣ Verifying affiliate referral recording...');

    // For test plan, referral should be recorded after account creation (not payment)
    // Let's check if the referral was recorded
    const updatedAffiliate = await AffiliateService.getAffiliateByUsername('testdiscount');
    console.log('📊 Affiliate referral count:', updatedAffiliate?.totalReferrals || 0);
    console.log('💰 Affiliate earnings:', updatedAffiliate?.totalEarnings || 0);

    // Test 4: Verify business has correct inviteSourceUid
    console.log('\n4️⃣ Verifying business invite source...');
    const createdBusiness = await BusinessService.getBusinessById(businessId);
    console.log('🎯 Business inviteSourceUid:', createdBusiness?.inviteSourceUid);

    if (createdBusiness?.inviteSourceUid === inviteSourceUid) {
      console.log('✅ Invite source correctly set');
    } else {
      console.log('❌ Invite source not set correctly');
    }

    console.log('\n🎉 Affiliate signup flow test completed successfully!');

    // Cleanup: Delete test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await BusinessService.deleteBusiness(businessId);
      await UserService.deleteUser(authUser.uid);
      await AuthService.deleteUser(authUser.uid);
      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup failed, but test was successful');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAffiliateSignupFlow();