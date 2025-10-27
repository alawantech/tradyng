// Comprehensive test for African WhatsApp number formatting
import { formatWhatsAppNumber } from './src/utils/whatsapp.js';

console.log('🧪 Testing African WhatsApp Number Formatting\n');

// Test cases for various African countries
const africanTestCases = [
  // West Africa
  { input: '08123456789', expected: '+2348123456789', country: 'Nigeria', description: 'Nigeria: 0 prefix' },
  { input: '8123456789', expected: '+2348123456789', country: 'Nigeria', description: 'Nigeria: no country code' },
  { input: '+2348123456789', expected: '+2348123456789', country: 'Nigeria', description: 'Nigeria: full international' },
  { input: '70123456', expected: '+22770123456', country: 'Niger', description: 'Niger: local format' },
  { input: '+22770123456', expected: '+22770123456', country: 'Niger', description: 'Niger: international' },
  { input: '12345678', expected: '+22312345678', country: 'Mali', description: 'Mali: local format' },
  { input: '+22312345678', expected: '+22312345678', country: 'Mali', description: 'Mali: international' },
  { input: '90123456', expected: '+22890123456', country: 'Togo', description: 'Togo: local format' },
  { input: '+22890123456', expected: '+22890123456', country: 'Togo', description: 'Togo: international' },
  { input: '67123456', expected: '+23767123456', country: 'Cameroon', description: 'Cameroon: local format' },
  { input: '+23767123456', expected: '+23767123456', country: 'Cameroon', description: 'Cameroon: international' },
  { input: '70123456', expected: '+22670123456', country: 'Burkina Faso', description: 'Burkina Faso: local format' },
  { input: '+22670123456', expected: '+22670123456', country: 'Burkina Faso', description: 'Burkina Faso: international' },
  { input: '771234567', expected: '+221771234567', country: 'Senegal', description: 'Senegal: local format' },
  { input: '+221771234567', expected: '+221771234567', country: 'Senegal', description: 'Senegal: international' },
  { input: '0101234567', expected: '+2250101234567', country: 'Ivory Coast', description: 'Ivory Coast: local format' },
  { input: '+2250101234567', expected: '+2250101234567', country: 'Ivory Coast', description: 'Ivory Coast: international' },
  { input: '241234567', expected: '+233241234567', country: 'Ghana', description: 'Ghana: local format' },
  { input: '+233241234567', expected: '+233241234567', country: 'Ghana', description: 'Ghana: international' },

  // East Africa
  { input: '712345678', expected: '+254712345678', country: 'Kenya', description: 'Kenya: local format' },
  { input: '+254712345678', expected: '+254712345678', country: 'Kenya', description: 'Kenya: international' },
  { input: '712345678', expected: '+256712345678', country: 'Uganda', description: 'Uganda: local format' },
  { input: '+256712345678', expected: '+256712345678', country: 'Uganda', description: 'Uganda: international' },
  { input: '612345678', expected: '+255612345678', country: 'Tanzania', description: 'Tanzania: local format' },
  { input: '+255612345678', expected: '+255612345678', country: 'Tanzania', description: 'Tanzania: international' },
  { input: '712345678', expected: '+250712345678', country: 'Rwanda', description: 'Rwanda: local format' },
  { input: '+250712345678', expected: '+250712345678', country: 'Rwanda', description: 'Rwanda: international' },

  // Southern Africa
  { input: '0712345678', expected: '+27712345678', country: 'South Africa', description: 'South Africa: 0 prefix' },
  { input: '712345678', expected: '+27712345678', country: 'South Africa', description: 'South Africa: no prefix' },
  { input: '+27712345678', expected: '+27712345678', country: 'South Africa', description: 'South Africa: international' },

  // North Africa
  { input: '0123456789', expected: '+20123456789', country: 'Egypt', description: 'Egypt: 0 prefix' },
  { input: '1234567890', expected: '+20123456789', country: 'Egypt', description: 'Egypt: no prefix' },
  { input: '+20123456789', expected: '+20123456789', country: 'Egypt', description: 'Egypt: international' },
  { input: '0612345678', expected: '+212612345678', country: 'Morocco', description: 'Morocco: 0 prefix' },
  { input: '612345678', expected: '+212612345678', country: 'Morocco', description: 'Morocco: no prefix' },
  { input: '+212612345678', expected: '+212612345678', country: 'Morocco', description: 'Morocco: international' },
  { input: '0551234567', expected: '+213551234567', country: 'Algeria', description: 'Algeria: 0 prefix' },
  { input: '551234567', expected: '+213551234567', country: 'Algeria', description: 'Algeria: no prefix' },
  { input: '+213551234567', expected: '+213551234567', country: 'Algeria', description: 'Algeria: international' },
  { input: '20123456', expected: '+21620123456', country: 'Tunisia', description: 'Tunisia: local format' },
  { input: '+21620123456', expected: '+21620123456', country: 'Tunisia', description: 'Tunisia: international' },
];

let passedTests = 0;
let totalTests = africanTestCases.length;

africanTestCases.forEach((testCase, index) => {
  const result = formatWhatsAppNumber(testCase.input);
  const numberMatch = result?.number === testCase.expected;
  const countryMatch = result?.country === testCase.country;

  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Input: ${testCase.input}`);
  console.log(`  Expected: ${testCase.expected} (${testCase.country})`);
  console.log(`  Result: ${result?.number || 'null'} (${result?.country || 'null'})`);
  console.log(`  Formatted: ${result?.formattedNumber || 'null'}`);
  console.log(`  WhatsApp URL: ${result?.whatsappUrl || 'null'}`);

  if (numberMatch && countryMatch) {
    console.log(`  Status: ✅ PASS\n`);
    passedTests++;
  } else {
    console.log(`  Status: ❌ FAIL`);
    if (!numberMatch) console.log(`    Number mismatch: expected ${testCase.expected}, got ${result?.number}`);
    if (!countryMatch) console.log(`    Country mismatch: expected ${testCase.country}, got ${result?.country}`);
    console.log('');
  }
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All African WhatsApp number formatting tests passed!');
} else {
  console.log('⚠️ Some tests failed. Please review the implementation.');
}

console.log('\n🏁 Testing completed!');