import { useState, useEffect } from 'react';
import { AuthService, AuthUser } from '../services/auth';
import { BusinessService, Business } from '../services/business';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        try {
          // Get user's business
          const businesses = await BusinessService.getBusinessesByOwnerId(authUser.uid);
          if (businesses.length > 0) {
            setBusiness(businesses[0]); // Use first business
          } else {
            setBusiness(null);
          }
        } catch (error) {
          console.error('Error fetching business:', error);
          setBusiness(null);
        }
      } else {
        setBusiness(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, business, loading };
};