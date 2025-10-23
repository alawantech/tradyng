import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { customerAuthService } from '../services/customerAuth';

interface CustomerAuthContextType {
  user: User | null;
  customerProfile: any | null;
  businessId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string, businessId: string, onSuccess?: () => void) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, businessId: string, onSuccess?: () => void) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  setBusinessId: (businessId: string | null) => void;
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
  const [customerProfile, setCustomerProfile] = useState<any | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = customerAuthService.onAuthStateChanged(
      async (firebaseUser, _, bid) => {
        setUser(firebaseUser);

        // If we have a user and business ID, try to get customer profile
        if (firebaseUser && bid) {
          try {
            const customerProfile = await customerAuthService.getCustomerProfile(firebaseUser, bid);
            setCustomerProfile(customerProfile);
          } catch (error) {
            console.error('Error loading customer profile:', error);
            setCustomerProfile(null);
          }
        } else if (firebaseUser && businessId) {
          // If businessId is set but not passed in callback, use the stored one
          try {
            const customerProfile = await customerAuthService.getCustomerProfile(firebaseUser, businessId);
            setCustomerProfile(customerProfile);
          } catch (error) {
            console.error('Error loading customer profile:', error);
            setCustomerProfile(null);
          }
        } else {
          setCustomerProfile(null);
        }

        setIsLoading(false);
      },
      businessId || undefined
    );

    return unsubscribe;
  }, [businessId]);

  // Effect to load customer profile when businessId changes and user is already authenticated
  useEffect(() => {
    const loadCustomerProfile = async () => {
      if (user && businessId && !customerProfile) {
        try {
          const profile = await customerAuthService.getCustomerProfile(user, businessId);
          setCustomerProfile(profile);
        } catch (error) {
          console.error('Error loading customer profile on business change:', error);
        }
      }
    };

    loadCustomerProfile();
  }, [user, businessId, customerProfile]);

  const signIn = async (email: string, password: string, businessId: string, onSuccess?: () => void) => {
    try {
      setBusinessId(businessId);
      await customerAuthService.signIn(email, password, businessId);
      if (onSuccess) onSuccess();
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, businessId: string, onSuccess?: () => void) => {
    try {
      setBusinessId(businessId);
      await customerAuthService.signUp({
        email,
        password,
        displayName,
        businessId
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await customerAuthService.signOut();
      setBusinessId(null);
      setCustomerProfile(null);
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      return await customerAuthService.updatePassword(newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        customerProfile,
        businessId,
        isLoading,
        signIn,
        signUp,
        signOut,
        updatePassword,
        setBusinessId,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};