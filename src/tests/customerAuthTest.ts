// Test script to verify customer authentication works across stores
import { customerAuthService } from '../services/customerAuth';

async function testCustomerAuth() {
  console.log('🧪 Testing Customer Authentication System');

  const testEmail = 'test@example.com';
  const businessId1 = 'store1';
  const businessId2 = 'store2';

  try {
    // Test 1: Register customer for Store 1
    console.log('\n📝 Test 1: Registering customer for Store 1');
    await customerAuthService.signUp({
      email: testEmail,
      password: 'password123',
      displayName: 'Test User',
      businessId: businessId1
    });
    console.log('✅ Successfully registered for Store 1');

    // Test 2: Register same email for Store 2 with different password
    console.log('\n📝 Test 2: Registering same email for Store 2');
    await customerAuthService.signUp({
      email: testEmail,
      password: 'different456',
      displayName: 'Test User',
      businessId: businessId2
    });
    console.log('✅ Successfully registered for Store 2 with different password');

    // Test 3: Sign in to Store 1
    console.log('\n🔐 Test 3: Signing in to Store 1');
    await customerAuthService.signIn(testEmail, 'password123', businessId1);
    console.log('✅ Successfully signed in to Store 1');

    // Test 4: Sign in to Store 2
    console.log('\n🔐 Test 4: Signing in to Store 2');
    await customerAuthService.signIn(testEmail, 'different456', businessId2);
    console.log('✅ Successfully signed in to Store 2');

    console.log('\n🎉 All tests passed! Customers can use same email with different passwords across stores.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console or test runner
(window as any).testCustomerAuth = testCustomerAuth;