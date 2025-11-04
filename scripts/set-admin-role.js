/**
 * Script to set admin role for a user
 * Usage: node scripts/set-admin-role.js <user-email>
 */

const admin = require('firebase-admin');
const serviceAccount = require('../tradyng-51655-firebase-adminsdk-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdminRole(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    
    console.log(`✅ Found user: ${userId}`);
    
    // Check if user document exists
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('📝 Creating user document...');
      await userRef.set({
        email: email,
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('📝 Updating existing user document...');
      await userRef.update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log('✅ Admin role set successfully!');
    console.log(`User ${email} (${userId}) is now an admin.`);
    
    // Verify
    const updatedDoc = await userRef.get();
    console.log('\n📋 User document:', updatedDoc.data());
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/set-admin-role.js <user-email>');
  process.exit(1);
}

setAdminRole(email);
