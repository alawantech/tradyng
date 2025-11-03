/**
 * Script to fix customer profile emails
 * Run this to update any customer profiles that have Firebase internal emails
 * instead of real emails
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json'); // You need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Extract real email from Firebase Auth email format
 */
function extractRealEmail(firebaseEmail) {
  if (!firebaseEmail || !firebaseEmail.includes('@customer.local')) {
    return firebaseEmail; // Already a real email
  }
  
  // Remove @customer.local suffix
  const withoutDomain = firebaseEmail.split('@')[0];
  
  // Find the last underscore (business ID separator)
  const lastUnderscoreIndex = withoutDomain.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) return firebaseEmail; // fallback
  
  // Extract the email part (everything before the business ID)
  const emailWithAtReplaced = withoutDomain.substring(0, lastUnderscoreIndex);
  
  // Replace _at_ back to @
  return emailWithAtReplaced.replace('_at_', '@');
}

async function fixCustomerEmails() {
  try {
    console.log('🔄 Starting to fix customer emails...');
    
    // Get all customer profiles from the 'customers' collection
    const customersSnapshot = await db.collection('customers').get();
    
    console.log(`📊 Found ${customersSnapshot.size} customer profiles`);
    
    let fixed = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    
    for (const doc of customersSnapshot.docs) {
      const data = doc.data();
      const currentEmail = data.email;
      
      if (!currentEmail) {
        console.log(`⚠️  Customer ${doc.id} has no email`);
        continue;
      }
      
      // Check if email needs fixing
      if (currentEmail.includes('@customer.local')) {
        const realEmail = extractRealEmail(currentEmail);
        
        try {
          await doc.ref.update({
            email: realEmail,
            updatedAt: admin.firestore.Timestamp.now()
          });
          
          console.log(`✅ Fixed: ${currentEmail} → ${realEmail}`);
          fixed++;
        } catch (error) {
          console.error(`❌ Error fixing ${doc.id}:`, error.message);
          errors++;
        }
      } else {
        alreadyCorrect++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`👍 Already correct: ${alreadyCorrect}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${customersSnapshot.size}`);
    
    // Also fix customerProfiles collection if it exists
    console.log('\n🔄 Checking customerProfiles collection...');
    const profilesSnapshot = await db.collection('customerProfiles').get();
    
    if (profilesSnapshot.size > 0) {
      console.log(`📊 Found ${profilesSnapshot.size} customer profiles in old collection`);
      
      let profilesFixed = 0;
      let profilesAlreadyCorrect = 0;
      
      for (const doc of profilesSnapshot.docs) {
        const data = doc.data();
        const currentEmail = data.email;
        
        if (!currentEmail) continue;
        
        if (currentEmail.includes('@customer.local')) {
          const realEmail = extractRealEmail(currentEmail);
          
          try {
            await doc.ref.update({
              email: realEmail,
              updatedAt: admin.firestore.Timestamp.now()
            });
            
            console.log(`✅ Fixed profile: ${currentEmail} → ${realEmail}`);
            profilesFixed++;
          } catch (error) {
            console.error(`❌ Error fixing profile ${doc.id}:`, error.message);
          }
        } else {
          profilesAlreadyCorrect++;
        }
      }
      
      console.log(`✅ Profiles fixed: ${profilesFixed}`);
      console.log(`👍 Profiles already correct: ${profilesAlreadyCorrect}`);
    }
    
    console.log('\n✨ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fixCustomerEmails();
