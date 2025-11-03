// Script to add missing 'status' field to existing orders
// Run this with: node scripts/fix-order-status.js

const admin = require('firebase-admin');
const serviceAccount = require('../tradyng-51655-firebase-adminsdk-8xagv-efacd2e6f4.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixOrderStatus() {
  try {
    console.log('Starting to fix order status...');
    
    // Get all businesses
    const businessesSnapshot = await db.collection('businesses').get();
    console.log(`Found ${businessesSnapshot.size} businesses`);
    
    let totalOrdersFixed = 0;
    
    for (const businessDoc of businessesSnapshot.docs) {
      const businessId = businessDoc.id;
      console.log(`\nProcessing business: ${businessId}`);
      
      // Get all orders for this business
      const ordersSnapshot = await db
        .collection('businesses')
        .doc(businessId)
        .collection('orders')
        .get();
      
      console.log(`  Found ${ordersSnapshot.size} orders`);
      
      let ordersFixedForBusiness = 0;
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        
        // Check if status field is missing or undefined
        if (!orderData.status) {
          console.log(`  Fixing order ${orderDoc.id} - adding status: 'pending'`);
          
          await orderDoc.ref.update({
            status: 'pending',
            updatedAt: admin.firestore.Timestamp.now()
          });
          
          ordersFixedForBusiness++;
          totalOrdersFixed++;
        }
      }
      
      if (ordersFixedForBusiness > 0) {
        console.log(`  ✅ Fixed ${ordersFixedForBusiness} orders for this business`);
      } else {
        console.log(`  ✓ All orders already have status field`);
      }
    }
    
    console.log(`\n✅ Migration complete! Fixed ${totalOrdersFixed} orders total.`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing order status:', error);
    process.exit(1);
  }
}

fixOrderStatus();
