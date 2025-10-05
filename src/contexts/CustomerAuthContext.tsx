import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { UserService } from '../services/user';
import { CustomerService } from '../services/customer';

interface CustomerAuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string, onSuccess?: () => void) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, onSuccess?: () => void) => Promise<void>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string, onSuccess?: () => void) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onSuccess) onSuccess();
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, onSuccess?: () => void) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth user's displayName
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      // Create user document in users collection
      await UserService.createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName,
        role: 'customer'
      });
      
      // Create customer profile in customers collection
      await CustomerService.createOrUpdateProfile({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return (
    <CustomerAuthContext.Provider 
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};