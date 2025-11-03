import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User
} from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      };
    } catch (error) {
      throw error;
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      };
    } catch (error) {
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }

  // Check if email is already registered in Firebase Authentication
  // This is the ONLY reliable way to check - try to create account with dummy password
  // If it fails with "email-already-in-use", the account exists in Firebase Auth
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('========================================');
      console.log('CHECKING EMAIL IN FIREBASE AUTH');
      console.log('Email:', email);
      console.log('========================================');
      
      // Method: Try to create a user with a random password
      // If email exists in Firebase Auth, it will throw auth/email-already-in-use
      // If email doesn't exist, we'll get a new user which we immediately delete
      const tempPassword = '__temp__check__' + Math.random().toString(36);
      
      try {
        console.log('Attempting to create temp account to check email...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
        
        // Email doesn't exist! (We successfully created an account)
        // Now delete this temp account immediately
        console.log('Email does NOT exist in Firebase Auth - created temp account:', userCredential.user.uid);
        
        // Delete the temp user
        await userCredential.user.delete();
        console.log('Temp account deleted');
        
        console.log('========================================');
        console.log('✅ EMAIL DOES NOT EXIST IN FIREBASE AUTH');
        console.log('ALLOWING REGISTRATION');
        console.log('========================================');
        return false;
        
      } catch (createError: any) {
        console.log('Create account error code:', createError.code);
        console.log('Create account error message:', createError.message);
        
        // Check if error is because email already exists
        if (createError.code === 'auth/email-already-in-use') {
          console.log('========================================');
          console.log('❌ EMAIL ALREADY EXISTS IN FIREBASE AUTH');
          console.log('BLOCKING REGISTRATION');
          console.log('========================================');
          return true;
        }
        
        // For any other error (weak password, invalid email, etc), assume doesn't exist
        console.log('Other error occurred:', createError.code);
        console.log('Assuming email does not exist');
        console.log('========================================');
        return false;
      }
      
    } catch (error: any) {
      console.error('========================================');
      console.error('UNEXPECTED ERROR IN checkEmailExists:');
      console.error('Error:', error);
      console.error('========================================');
      
      // On unexpected error, allow registration to not block users
      return false;
    }
  }

  // Listen for auth state changes
  static onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        callback(null);
      }
    });
  }
}
