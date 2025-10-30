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
import { DEFAULT_CURRENCY } from '../constants/currencies';

export interface Business {
  id?: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  ownerId: string;
  email: string;
  phone?: string;
  whatsapp: string; // WhatsApp number for customer support - REQUIRED for all businesses
  address?: string;
  country?: string;
  state?: string;
  description?: string;
  logo?: string;
  plan: 'free' | 'business' | 'pro' | 'test';
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
  branding?: {
    storeBackgroundColor?: string;
    heroStyle?: string;
    heroBannerImage?: string;
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
  inviteSourceUid?: string; // UID of the affiliate who referred this business
  revenue: number;
  totalOrders: number;
  totalProducts: number;
}

export class BusinessService {
  // Create a new business
  static async createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      
      // Ensure default settings with NGN currency
      const defaultSettings = {
        currency: DEFAULT_CURRENCY,
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        accentColor: '#F59E0B',
        enableNotifications: true
      };

      // Merge provided settings with defaults
      const settings = {
        ...defaultSettings,
        ...businessData.settings
      };

      const docRef = await addDoc(collection(db, 'businesses'), {
        ...businessData,
        settings,
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
    // For demo purposes, return a mock business
    if (businessId === 'demo-business-id') {
      return {
        id: 'demo-business-id',
        name: 'Demo Beauty Store',
        subdomain: 'demo',
        ownerId: 'demo-owner',
        email: 'demo@example.com',
        phone: '+1 (555) 123-4567',
        whatsapp: '+2348123456789', // Real Nigerian WhatsApp number format
        address: '123 Beauty Lane',
        country: 'United States',
        state: 'California',
        description: 'Welcome to our amazing beauty store! We offer the finest perfumes, body mists, and beauty products.',
        plan: 'business',
        status: 'active',
        revenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        settings: {
          currency: 'USD',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          accentColor: '#F59E0B',
          enableNotifications: true
        },
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      } as Business;
    }
    
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

  // Get businesses by name (checks the name field directly)
  static async getBusinessesByName(name: string): Promise<Business[]> {
    try {
      const q = query(collection(db, 'businesses'), where('name', '==', name));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Business[];
    } catch (error) {
      throw error;
    }
  }

  // Get businesses by owner ID
  static async getBusinessesByOwnerId(ownerId: string): Promise<Business[]> {
    try {
      console.log('🔍 Querying businesses for ownerId:', ownerId);
      console.log('🔍 ownerId type:', typeof ownerId);
      
      const q = query(
        collection(db, 'businesses'), 
        where('ownerId', '==', ownerId)
        // Removed orderBy to avoid index requirement
      );
      
      console.log('📡 Executing Firebase query...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Query executed, found', querySnapshot.docs.length, 'documents');
      
      if (querySnapshot.docs.length > 0) {
        querySnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`📄 Document ${index + 1}:`, {
            id: doc.id,
            ownerId: data.ownerId,
            name: data.name,
            subdomain: data.subdomain
          });
        });
      } else {
        console.log('⚠️ No documents found. Let me check all businesses...');
        // Debug: Get all businesses to see what's there
        const allBusinessesQuery = query(collection(db, 'businesses'));
        const allSnapshot = await getDocs(allBusinessesQuery);
        console.log('📊 Total businesses in database:', allSnapshot.docs.length);
        allSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`🏪 Business ${index + 1}:`, {
            id: doc.id,
            ownerId: data.ownerId,
            name: data.name,
            subdomain: data.subdomain,
            ownerIdMatches: data.ownerId === ownerId
          });
        });
      }
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Business[];
    } catch (error) {
      console.error('❌ Error in getBusinessesByOwnerId:', error);
      throw error;
    }
  }

  // Update business
  static async updateBusiness(businessId: string, updates: Partial<Business>): Promise<void> {
    try {
      console.log('🔄 Updating business:', businessId);
      console.log('📝 Update data:', {
        ...updates,
        logo: updates.logo ? `Logo present (${updates.logo.length} chars)` : 'No logo',
        settings: updates.settings
      });
      
      const docRef = doc(db, 'businesses', businessId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ Business updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating business:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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

  // Check subdomain availability
  static async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    try {
      const business = await this.getBusinessBySubdomain(subdomain);
      return business === null; // Available if no business found
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
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