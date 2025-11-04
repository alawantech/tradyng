import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  getDocs,
  updateDoc,
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
  whatsappNumber: string;
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
  planType: 'business' | 'pro' | 'test';
  discountAmount: number;
  commissionAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface WithdrawalRequest {
  id?: string;
  affiliateId: string;
  affiliateUsername: string;
  affiliateEmail: string;
  amount: number;
  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string; // Admin user ID
  rejectionReason?: string;
  transactionReference?: string;
}

export class AffiliateService {
  // Create a new affiliate account
  static async createAffiliate(affiliateData: Omit<Affiliate, 'id' | 'firebaseUid' | 'totalReferrals' | 'totalEarnings' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    let userCredential: any = null;
    
    try {
      console.log('🔗 Creating affiliate account for:', affiliateData.username);

      // Check if username already exists (duplicate prevention)
      const existingUsername = await this.checkUsernameAvailability(affiliateData.username);
      if (!existingUsername) {
        console.error('❌ Username already taken:', affiliateData.username);
        throw new Error('Username is already taken. Please choose a different username.');
      }

      // Check if email already has an affiliate account in Firestore
      const emailQuery = query(collection(db, 'affiliates'), where('email', '==', affiliateData.email.toLowerCase()));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        console.error('❌ Email already has an affiliate account:', affiliateData.email);
        throw new Error('Email is already registered. Please use a different email.');
      }

      // Try to create Firebase Auth user
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          affiliateData.email,
          affiliateData.password
        );
        console.log('✅ Firebase Auth user created:', userCredential.user.uid);
      } catch (authError: any) {
        // If email already exists in Auth, check if affiliate document exists
        if (authError.code === 'auth/email-already-in-use') {
          console.warn('⚠️ Firebase Auth user already exists, checking for affiliate document...');
          
          // Try to get user by email from Auth
          try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const signInResult = await signInWithEmailAndPassword(auth, affiliateData.email, affiliateData.password);
            
            // Check if affiliate document exists
            const existingAffiliate = await this.getAffiliateByFirebaseUid(signInResult.user.uid);
            if (existingAffiliate) {
              console.log('✅ Affiliate already exists, returning existing ID');
              return existingAffiliate.id!;
            }
            
            // Auth user exists but no affiliate document - create it now
            console.log('⚠️ Auth user exists but no affiliate document, creating document...');
            userCredential = signInResult;
          } catch (signInError) {
            // Password doesn't match or other error
            throw new Error('Email is already registered with a different password. Please try logging in or use forgot password.');
          }
        } else {
          throw authError;
        }
      }

      // Check if this Firebase UID already has an affiliate document (duplicate prevention)
      const existingAffiliate = await this.getAffiliateByFirebaseUid(userCredential.user.uid);
      if (existingAffiliate) {
        console.warn('⚠️ Affiliate document already exists for this user:', userCredential.user.uid);
        return existingAffiliate.id!;
      }

      // Create affiliate document in Firestore
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'affiliates'), {
        fullName: affiliateData.fullName,
        username: affiliateData.username.toLowerCase(),
        email: affiliateData.email.toLowerCase(),
        whatsappNumber: affiliateData.whatsappNumber,
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
    planType: 'business' | 'pro' | 'test', 
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
      // Test Plan: ₦20 discount = ₦20 commission
      let commission = 0;
      if (planType === 'business' && discountAmount === 2000) {
        commission = 2000; // ₦2,000 commission for business plan
      } else if (planType === 'pro' && discountAmount === 4000) {
        commission = 4000; // ₦4,000 commission for pro plan
      } else if (planType === 'test' && discountAmount === 20) {
        commission = 20; // ₦20 commission for test plan
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
    } catch (error: any) {
      console.error('Error getting affiliate referrals:', error);
      // If it's an index error, return empty array (indexes are building)
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Firestore index is building. Returning empty array for now.');
        return [];
      }
      // For other errors, throw
      throw error;
    }
  }

  // Request withdrawal
  static async requestWithdrawal(
    affiliateId: string,
    amount: number
  ): Promise<string> {
    try {
      // Get affiliate data directly from Firestore
      const affiliateDoc = await getDoc(doc(db, 'affiliates', affiliateId));
      if (!affiliateDoc.exists()) {
        throw new Error('Affiliate not found');
      }

      const affiliate = { id: affiliateDoc.id, ...affiliateDoc.data() } as Affiliate;

      // Check if bank details are set
      if (!affiliate.bankDetails || !affiliate.bankDetails.accountNumber) {
        throw new Error('Please add your bank details before requesting withdrawal');
      }

      // Validate amount is positive
      if (amount <= 0) {
        throw new Error('Withdrawal amount must be greater than zero');
      }

      // Check if there's already a pending withdrawal
      const pendingWithdrawalsQuery = query(
        collection(db, 'withdrawalRequests'),
        where('affiliateId', '==', affiliateId),
        where('status', '==', 'pending')
      );
      const pendingWithdrawalsSnapshot = await getDocs(pendingWithdrawalsQuery);
      
      if (!pendingWithdrawalsSnapshot.empty) {
        throw new Error('You already have a pending withdrawal request. Please wait for it to be processed.');
      }

      // Calculate available balance (total earnings minus all pending/approved/paid withdrawals)
      const allWithdrawalsQuery = query(
        collection(db, 'withdrawalRequests'),
        where('affiliateId', '==', affiliateId),
        where('status', 'in', ['pending', 'approved', 'paid'])
      );
      const allWithdrawalsSnapshot = await getDocs(allWithdrawalsQuery);
      const totalWithdrawn = allWithdrawalsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      
      const availableBalance = affiliate.totalEarnings - totalWithdrawn;

      // Check if affiliate has enough available balance
      if (availableBalance < amount) {
        throw new Error(`Insufficient balance. Available: ₦${availableBalance.toLocaleString()}`);
      }

      if (availableBalance <= 0) {
        throw new Error('You have no available balance to withdraw');
      }

      // Create withdrawal request
      const withdrawalData: Omit<WithdrawalRequest, 'id'> = {
        affiliateId: affiliate.id!,
        affiliateUsername: affiliate.username,
        affiliateEmail: affiliate.email,
        amount,
        bankDetails: affiliate.bankDetails,
        status: 'pending',
        requestedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'withdrawalRequests'), withdrawalData);
      console.log('✅ Withdrawal request created:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }
  }

  // Get withdrawal requests for an affiliate
  static async getAffiliateWithdrawals(affiliateId: string): Promise<WithdrawalRequest[]> {
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        where('affiliateId', '==', affiliateId),
        orderBy('requestedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
    } catch (error: any) {
      console.error('Error getting affiliate withdrawals:', error);
      // If it's an index error, return empty array (indexes are building)
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Firestore index is building. Returning empty array for now.');
        return [];
      }
      // For other errors, throw
      throw error;
    }
  }

  // Get all withdrawal requests (admin only)
  static async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        orderBy('requestedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
    } catch (error) {
      console.error('Error getting all withdrawal requests:', error);
      throw error;
    }
  }

  // Update withdrawal status (admin only)
  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'approved' | 'rejected' | 'paid',
    adminUserId: string,
    rejectionReason?: string,
    transactionReference?: string
  ): Promise<void> {
    try {
      const withdrawalRef = doc(db, 'withdrawalRequests', withdrawalId);
      const withdrawalSnap = await getDoc(withdrawalRef);

      if (!withdrawalSnap.exists()) {
        throw new Error('Withdrawal request not found');
      }

      const withdrawal = withdrawalSnap.data() as WithdrawalRequest;

      // Update withdrawal request
      const updateData: any = {
        status,
        processedAt: Timestamp.now(),
        processedBy: adminUserId
      };

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      if (transactionReference) {
        updateData.transactionReference = transactionReference;
      }

      await updateDoc(withdrawalRef, updateData);

      // If approved or paid, deduct from affiliate earnings
      if (status === 'approved' || status === 'paid') {
        const affiliateRef = doc(db, 'affiliates', withdrawal.affiliateId);
        const affiliateSnap = await getDoc(affiliateRef);

        if (affiliateSnap.exists()) {
          const affiliate = affiliateSnap.data() as Affiliate;
          const newEarnings = Math.max(0, affiliate.totalEarnings - withdrawal.amount);

          await updateDoc(affiliateRef, {
            totalEarnings: newEarnings,
            updatedAt: Timestamp.now()
          });

          console.log('✅ Affiliate earnings updated. New balance:', newEarnings);
        }
      }

      console.log('✅ Withdrawal status updated to:', status);
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      throw error;
    }
  }
}