import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';

export interface Domain {
  domain: string;
  businessId: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class DomainService {
  // Add custom domain to business
  static async addCustomDomain(businessId: string, domain: string): Promise<void> {
    try {
      // Check if domain is already taken
      const existingDomain = await this.getDomainByName(domain);
      if (existingDomain) {
        throw new Error('Domain already in use by another store');
      }

      const now = Timestamp.now();
      await setDoc(doc(db, 'domains', domain), {
        domain,
        businessId,
        isActive: false, // Needs verification first
        verificationStatus: 'pending',
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      throw error;
    }
  }

  // Get domain by name
  static async getDomainByName(domain: string): Promise<Domain | null> {
    try {
      const docRef = doc(db, 'domains', domain);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Domain;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get domains by business ID
  static async getDomainsByBusinessId(businessId: string): Promise<Domain[]> {
    try {
      const q = query(collection(db, 'domains'), where('businessId', '==', businessId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data()) as Domain[];
    } catch (error) {
      throw error;
    }
  }

  // Verify domain ownership
  static async verifyDomain(domain: string): Promise<void> {
    try {
      const docRef = doc(db, 'domains', domain);
      await setDoc(docRef, {
        verificationStatus: 'verified',
        isActive: true,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  // Remove custom domain
  static async removeCustomDomain(domain: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'domains', domain));
    } catch (error) {
      throw error;
    }
  }
}