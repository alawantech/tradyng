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
  Timestamp
} from 'firebase/firestore';

export interface Business {
  id?: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  ownerId: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
  plan: 'free' | 'basic' | 'pro';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    currency: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    enableNotifications: boolean;
  };
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    instructions?: string;
  };
  paymentMethods?: {
    manualPayment: boolean;
    cardPayment: boolean;
  };
  revenue: number;
  totalOrders: number;
  totalProducts: number;
}

export class BusinessService {
  // Create a new business
  static async createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'businesses'), {
        ...businessData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Get business by ID
  static async getBusinessById(businessId: string): Promise<Business | null> {
    try {
      const docRef = doc(db, 'businesses', businessId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Business;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get business by subdomain
  static async getBusinessBySubdomain(subdomain: string): Promise<Business | null> {
    try {
      const q = query(collection(db, 'businesses'), where('subdomain', '==', subdomain));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Business;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get business by custom domain
  static async getBusinessByCustomDomain(domain: string): Promise<Business | null> {
    try {
      const q = query(collection(db, 'businesses'), where('customDomain', '==', domain));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Business;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get business by store name (alias for subdomain)
  static async getBusinessByStoreName(storeName: string): Promise<Business | null> {
    return this.getBusinessBySubdomain(storeName);
  }

  // Get businesses by owner ID
  static async getBusinessesByOwnerId(ownerId: string): Promise<Business[]> {
    try {
      const q = query(
        collection(db, 'businesses'), 
        where('ownerId', '==', ownerId)
        // Removed orderBy to avoid index requirement
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Business[];
    } catch (error) {
      throw error;
    }
  }

  // Update business
  static async updateBusiness(businessId: string, updates: Partial<Business>): Promise<void> {
    try {
      const docRef = doc(db, 'businesses', businessId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete business
  static async deleteBusiness(businessId: string): Promise<void> {
    try {
      const docRef = doc(db, 'businesses', businessId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }

  // Get all businesses (admin only)
  static async getAllBusinesses(): Promise<Business[]> {
    try {
      const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Business[];
    } catch (error) {
      throw error;
    }
  }
}