import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export class FirebaseTest {
  // Test Firebase connection
  static async testConnection() {
    try {
      console.log('🔥 Testing Firebase connection...');
      console.log('Auth instance:', auth);
      console.log('DB instance:', db);
      console.log('Current user:', auth.currentUser);
      
      // Test Firestore read
      try {
        const testDoc = doc(db, 'test', 'connection');
        await getDoc(testDoc);
        console.log('✅ Firestore connection successful');
      } catch (error) {
        console.error('❌ Firestore connection failed:', error);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Firebase test failed:', error);
      return false;
    }
  }

  // Test user creation
  static async testCreateUser(email: string, password: string) {
    try {
      console.log('🔐 Testing user creation with:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User created successfully:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ User creation failed:', error.code, error.message);
      throw error;
    }
  }

  // Test user login
  static async testLogin(email: string, password: string) {
    try {
      console.log('🔐 Testing user login with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User login successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ User login failed:', error.code, error.message);
      throw error;
    }
  }
}

// Expose for browser console testing
(window as any).FirebaseTest = FirebaseTest;