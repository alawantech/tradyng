/**
 * Script to fix affiliate totals after manual deletion of duplicate referrals
 * This will recalculate totalReferrals and totalEarnings based on actual referral records
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this from Firebase Console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAffiliateTotals() {
  console.log('🔧 Starting affiliate totals fix...\n');

  try {
    // Get all affiliates
    const affiliatesSnapshot = await db.collection('affiliates').get();
    
    if (affiliatesSnapshot.empty) {
      console.log('No affiliates found.');
      return;
    }

    console.log(`Found ${affiliatesSnapshot.size} affiliates\n`);

    for (const affiliateDoc of affiliatesSnapshot.docs) {
      const affiliate = { id: affiliateDoc.id, ...affiliateDoc.data() };
      
      console.log(`\n📊 Processing affiliate: ${affiliate.username} (${affiliate.id})`);
      console.log(`   Current totals: Referrals=${affiliate.totalReferrals || 0}, Earnings=₦${affiliate.totalEarnings || 0}`);

      // Get all referrals for this affiliate
      const referralsSnapshot = await db.collection('referrals')
        .where('affiliateId', '==', affiliate.id)
        .get();

      const actualReferralCount = referralsSnapshot.size;
      let actualTotalEarnings = 0;

      // Calculate actual total earnings
      referralsSnapshot.forEach(referralDoc => {
        const referral = referralDoc.data();
        actualTotalEarnings += referral.commissionAmount || 0;
      });

      console.log(`   Actual totals:  Referrals=${actualReferralCount}, Earnings=₦${actualTotalEarnings}`);

      // Update affiliate document if totals are different
      if (affiliate.totalReferrals !== actualReferralCount || affiliate.totalEarnings !== actualTotalEarnings) {
        await affiliateDoc.ref.update({
          totalReferrals: actualReferralCount,
          totalEarnings: actualTotalEarnings,
          updatedAt: admin.firestore.Timestamp.now()
        });
        console.log(`   ✅ Updated affiliate totals`);
      } else {
        console.log(`   ✓ Totals are correct, no update needed`);
      }
    }

    console.log('\n\n🎉 Affiliate totals fixed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing affiliate totals:', error);
    process.exit(1);
  }
}

// Run the script
fixAffiliateTotals();
