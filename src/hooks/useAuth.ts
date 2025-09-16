import { useState, useEffect } from 'react';
import { AuthService, AuthUser } from '../services/auth';
import { BusinessService, Business } from '../services/business';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let businessQueryPromise: Promise<void> | null = null;

    const unsubscribe = AuthService.onAuthStateChanged(async (authUser) => {
      console.log('🔄 Auth state changed. User:', authUser ? `${authUser.email} (${authUser.uid})` : 'null');
      
      setUser(authUser);
      
      if (authUser && !authInitialized) {
        // Only query business data once when user is first authenticated
        setAuthInitialized(true);
        
        businessQueryPromise = (async () => {
          try {
            console.log('🔐 First-time authentication, fetching businesses for UID:', authUser.uid);
            const businesses = await BusinessService.getBusinessesByOwnerId(authUser.uid);
            console.log('🏪 Found businesses:', businesses);
            console.log('🏪 Number of businesses found:', businesses.length);
            
            if (businesses.length > 0) {
              console.log('✅ Setting business data:', businesses[0]);
              console.log('🔑 Business subdomain:', businesses[0].subdomain);
              setBusiness(businesses[0]);
            } else {
              console.log('❌ No businesses found for user UID:', authUser.uid);
              console.log('🔍 This could mean:');
              console.log('   1. Business was not created during registration');
              console.log('   2. Business ownerId does not match user UID');
              console.log('   3. Database query is not working');
              setBusiness(null);
            }
          } catch (error) {
            console.error('❌ Error fetching business:', error);
            setBusiness(null);
          }
        })();
        
        await businessQueryPromise;
        setLoading(false);
      } else if (!authUser) {
        console.log('🚫 No authenticated user');
        setBusiness(null);
        setAuthInitialized(false);
        setLoading(false);
      } else if (authUser && authInitialized) {
        // User is already authenticated and business data has been loaded
        console.log('✅ User already authenticated, keeping existing state');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authInitialized]);

  return { user, business, loading };
};