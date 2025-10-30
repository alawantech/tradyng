import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export interface Affiliate {
  id?: string;
  fullName: string;
  username: string; // Unique, lowercase, alphanumeric
  email: string;
  password: string; // Will be hashed by Firebase Auth
  firebaseUid?: string;
  bankDetails?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
  };
  totalReferrals: number;
  totalEarnings: number;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Referral {
  id?: string;
  affiliateId: string;
  affiliateUsername: string;
  referredUserId: string;
  referredBusinessId: string;
  referredBusinessName: string;
  referredUserPhone: string;
  referredUserWhatsapp: string;
  planType: 'business' | 'pro';
  discountAmount: number;
  commissionAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export class AffiliateService {
  // Create a new affiliate account
  static async createAffiliate(affiliateData: Omit<Affiliate, 'id' | 'firebaseUid' | 'totalReferrals' | 'totalEarnings' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🔗 Creating affiliate account for:', affiliateData.username);

      // First, create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        affiliateData.email,
        affiliateData.password
      );

      console.log('✅ Firebase Auth user created:', userCredential.user.uid);

      // Create affiliate document in Firestore
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'affiliates'), {
        ...affiliateData,
        firebaseUid: userCredential.user.uid,
        totalReferrals: 0,
        totalEarnings: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });

      console.log('✅ Affiliate document created:', docRef.id);

      // Create coupon for the affiliate's username
      await this.createAffiliateCoupon(affiliateData.username);

      return docRef.id;

    } catch (error: any) {
      console.error('❌ Error creating affiliate:', error);

      // If Firestore creation fails, we should clean up the Auth user
      // But for now, let the error propagate
      throw error;
    }
  }

  // Create a coupon for the affiliate's username
  static async createAffiliateCoupon(username: string): Promise<void> {
    try {
      console.log('🎫 Creating coupon for affiliate username:', username);

      const couponsRef = collection(db, 'coupons');
      await setDoc(doc(couponsRef, username.toLowerCase()), {
        code: username.toLowerCase(),
        discount: { business: 2000, pro: 4000 }, // Different discounts for different plans
        planType: 'all', // Works for all plans
        isActive: true,
        usageLimit: null,
        usedCount: 0,
        createdAt: new Date(),
        description: `Affiliate discount coupon - ₦2,000 off Business, ₦4,000 off Pro (Affiliate: ${username})`
      });

      console.log('✅ Coupon created for affiliate:', username);
    } catch (error) {
      console.error('❌ Error creating affiliate coupon:', error);
      throw error;
    }
  }

  // Check if username is available
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      if (!username || username.length < 3) return false;

      // Username must be alphanumeric only
      const usernameRegex = /^[a-zA-Z0-9]+$/;
      if (!usernameRegex.test(username)) return false;

      const q = query(collection(db, 'affiliates'), where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      return querySnapshot.empty; // Available if no documents found
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  }

  // Get affiliate by username
  static async getAffiliateByUsername(username: string): Promise<Affiliate | null> {
    try {
      const q = query(collection(db, 'affiliates'), where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Affiliate;
      }
      return null;
    } catch (error) {
      console.error('Error getting affiliate by username:', error);
      throw error;
    }
  }

  // Get affiliate by Firebase UID
  static async getAffiliateByFirebaseUid(firebaseUid: string): Promise<Affiliate | null> {
    try {
      const q = query(collection(db, 'affiliates'), where('firebaseUid', '==', firebaseUid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Affiliate;
      }
      return null;
    } catch (error) {
      console.error('Error getting affiliate by Firebase UID:', error);
      throw error;
    }
  }

  // Update affiliate bank details
  static async updateBankDetails(affiliateId: string, bankDetails: Affiliate['bankDetails']): Promise<void> {
    try {
      const docRef = doc(db, 'affiliates', affiliateId);
      await updateDoc(docRef, {
        bankDetails,
        updatedAt: Timestamp.now()
      });
      console.log('✅ Affiliate bank details updated');
    } catch (error) {
      console.error('Error updating bank details:', error);
      throw error;
    }
  }

  // Record a referral and update earnings (only after successful payment)
  static async recordReferral(
    affiliateUsername: string, 
    planType: 'business' | 'pro', 
    discountAmount: number,
    referredUserId?: string,
    referredBusinessId?: string,
    referredBusinessName?: string,
    referredUserPhone?: string,
    referredUserWhatsapp?: string
  ): Promise<void> {
    try {
      console.log('🎯 Processing affiliate referral after successful payment');
      console.log('📊 Referral details:', { 
        affiliateUsername, 
        planType, 
        discountAmount,
        referredUserId,
        referredBusinessId,
        referredBusinessName,
        referredUserPhone,
        referredUserWhatsapp
      });

      const affiliate = await this.getAffiliateByUsername(affiliateUsername);
      if (!affiliate) {
        console.warn('⚠️ Affiliate not found for username:', affiliateUsername);
        return;
      }

      // Calculate commission based on plan type
      // Business Plan: ₦2,000 discount = ₦2,000 commission
      // Pro Plan: ₦4,000 discount = ₦4,000 commission
      let commission = 0;
      if (planType === 'business' && discountAmount === 2000) {
        commission = 2000; // ₦2,000 commission for business plan
      } else if (planType === 'pro' && discountAmount === 4000) {
        commission = 4000; // ₦4,000 commission for pro plan
      } else {
        // Fallback: use the discount amount as commission
        commission = discountAmount;
        console.warn('⚠️ Unexpected discount amount, using as commission:', discountAmount);
      }

      console.log('💰 Calculated commission:', commission, 'for plan:', planType);

      // Update affiliate totals
      const docRef = doc(db, 'affiliates', affiliate.id!);
      await updateDoc(docRef, {
        totalReferrals: affiliate.totalReferrals + 1,
        totalEarnings: affiliate.totalEarnings + commission,
        updatedAt: Timestamp.now()
      });

      // Create detailed referral record
      if (referredUserId && referredBusinessId) {
        const referralData: Omit<Referral, 'id'> = {
          affiliateId: affiliate.id!,
          affiliateUsername: affiliate.username,
          referredUserId,
          referredBusinessId,
          referredBusinessName: referredBusinessName || 'Unknown Store',
          referredUserPhone: referredUserPhone || '',
          referredUserWhatsapp: referredUserWhatsapp || '',
          planType,
          discountAmount,
          commissionAmount: commission,
          paymentStatus: 'completed',
          createdAt: Timestamp.now(),
          completedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'referrals'), referralData);
        console.log('✅ Detailed referral record created');
      }

      console.log('✅ Referral recorded successfully for affiliate:', affiliateUsername);
      console.log('📈 New totals - Referrals:', affiliate.totalReferrals + 1, 'Earnings:', affiliate.totalEarnings + commission);
    } catch (error) {
      console.error('❌ Error recording referral:', error);
      throw error;
    }
  }

  // Get all affiliates (admin only)
  static async getAllAffiliates(): Promise<Affiliate[]> {
    try {
      const q = query(collection(db, 'affiliates'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Affiliate[];
    } catch (error) {
      console.error('Error getting all affiliates:', error);
      throw error;
    }
  }

  // Get referrals for an affiliate
  static async getAffiliateReferrals(affiliateId: string): Promise<Referral[]> {
    try {
      const q = query(
        collection(db, 'referrals'), 
        where('affiliateId', '==', affiliateId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Referral[];
    } catch (error) {
      console.error('Error getting affiliate referrals:', error);
      throw error;
    }
  }
}