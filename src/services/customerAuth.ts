import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { CustomerService } from './customer';

export interface CustomerAuthData {
  email: string;
  password: string;
  displayName: string;
  businessId: string;
}

export interface CustomerAuthResult {
  user: User;
  customerId: string;
}

class CustomerAuthService {
  private static instance: CustomerAuthService;

  static getInstance(): CustomerAuthService {
    if (!CustomerAuthService.instance) {
      CustomerAuthService.instance = new CustomerAuthService();
    }
    return CustomerAuthService.instance;
  }

  /**
   * Generate a unique Firebase Auth email for customer based on their real email and business ID
   * This allows the same email to be used across different businesses
   */
  private generateFirebaseEmail(email: string, businessId: string): string {
    return `${email.replace('@', '_at_')}_${businessId}@customer.local`;
  }

  /**
   * Extract the real email from Firebase Auth email
   */
  private extractRealEmail(firebaseEmail: string): string {
    const parts = firebaseEmail.split('@')[0].split('_at_');
    return `${parts[0]}@${parts[1]}`;
  }

  /**
   * Check if a customer already exists for a specific business
   */
  async customerExistsForBusiness(email: string, businessId: string): Promise<boolean> {
    try {
      const existingCustomer = await CustomerService.getCustomerByEmail(businessId, email);
      return existingCustomer !== null;
    } catch (error) {
      console.error('Error checking customer existence:', error);
      return false;
    }
  }

  /**
   * Sign up a customer for a specific business
   */
  async signUp(data: CustomerAuthData): Promise<CustomerAuthResult> {
    try {
      const { email, password, displayName, businessId } = data;

      // Check if customer already exists for this business
      const exists = await this.customerExistsForBusiness(email, businessId);
      if (exists) {
        throw new Error('An account with this email already exists for this store');
      }

      // Generate unique Firebase Auth email
      const firebaseEmail = this.generateFirebaseEmail(email, businessId);

      // Create Firebase Auth account with unique email
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);

      // Update Firebase Auth profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Create customer profile in the business-specific collection
      const customerId = await CustomerService.createCustomer(businessId, {
        name: displayName,
        email: email, // Store the real email
        phone: '',
        totalSpent: 0,
        totalOrders: 0
      });

      // Create or update global customer profile
      await CustomerService.createOrUpdateProfile({
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName
      });

      return {
        user: userCredential.user,
        customerId
      };
    } catch (error: any) {
      console.error('Customer signup error:', error);

      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists for this store');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw error;
    }
  }

  /**
   * Sign in a customer for a specific business
   */
  async signIn(email: string, password: string, businessId: string): Promise<CustomerAuthResult> {
    try {
      // Generate unique Firebase Auth email
      const firebaseEmail = this.generateFirebaseEmail(email, businessId);

      // Check if customer exists for this business
      const customer = await CustomerService.getCustomerByEmail(businessId, email);
      if (!customer) {
        throw new Error('No account found with this email for this store. Please sign up first.');
      }

      // Sign in with Firebase Auth using the unique email
      const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, password);

      return {
        user: userCredential.user,
        customerId: customer.id!
      };
    } catch (error: any) {
      console.error('Customer signin error:', error);

      // Handle Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email for this store. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Sign out customer
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Customer signout error:', error);
      throw error;
    }
  }

  async updatePassword(newPassword: string): Promise<boolean> {
    try {
      // Get the current user (assuming they're signed in)
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Update password in Firebase Auth
      await firebaseUpdatePassword(auth.currentUser, newPassword);

      return true;
    } catch (error: any) {
      console.error('Update password error:', error);

      if (error.code === 'auth/weak-password') {
        throw new Error('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('Please sign in again before updating your password');
      }

      throw error;
    }
  }

  /**
   * Get customer profile for a specific business by Firebase Auth user
   */
  async getCustomerProfile(user: User, businessId: string): Promise<any | null> {
    try {
      // Extract real email from Firebase Auth email
      const realEmail = this.extractRealEmail(user.email!);

      // Get customer profile for this business
      const customer = await CustomerService.getCustomerByEmail(businessId, realEmail);

      return customer;
    } catch (error) {
      console.error('Error getting customer profile:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes and return customer info for specific business
   */
  onAuthStateChanged(callback: (user: User | null, customerProfile: any | null, businessId?: string) => void, businessId?: string) {
    return onAuthStateChanged(auth, async (user) => {
      // Always call callback with user and businessId, but don't load profile here
      // Profile loading is handled by the context to avoid race conditions
      callback(user, null, businessId);
    });
  }
}

export const customerAuthService = CustomerAuthService.getInstance();