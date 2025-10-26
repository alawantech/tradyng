const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config (you'll need to replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "tradyng-51655.firebaseapp.com",
  projectId: "tradyng-51655",
  storageBucket: "tradyng-51655.appspot.com",
  messagingSenderId: "563584335869",
  appId: "1:563584335869:web:your-app-id"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testSendOrderApprovalEmail() {
  try {
    console.log('Testing sendOrderApprovalEmail function...');

    const sendOrderApprovalEmail = httpsCallable(functions, 'sendOrderApprovalEmail');

    // Test data
    const testData = {
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      orderId: 'TEST-123',
      businessName: 'Test Store',
      businessPhone: '+1234567890',
      pdfBase64: 'dGVzdA==' // base64 for 'test'
    };

    console.log('Calling function with data:', testData);

    const result = await sendOrderApprovalEmail(testData);
    console.log('Function call successful:', result.data);

  } catch (error) {
    console.error('Function call failed:', error);
  }
}

testSendOrderApprovalEmail();