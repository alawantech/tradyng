import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'business_owner' | 'customer' | 'admin';
  createdAt: Timestamp;
  lastLogin: Timestamp;
  profileImage?: string;
  phone?: string;
}

export class UserService {
  // Create a new user document
  static async createUser(userData: Omit<User, 'createdAt' | 'lastLogin'>): Promise<void> {
    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'users', userData.uid), {
        ...userData,
        createdAt: now,
        lastLogin: now
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(uid: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, updates);
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        lastLogin: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }
}