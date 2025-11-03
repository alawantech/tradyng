import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AffiliateService } from '../../services/affiliate';

interface AffiliateRouteProps {
  children: React.ReactNode;
}

/**
 * Affiliate Route Guard
 * Protects affiliate routes from unauthorized access
 * Only authenticated users who are affiliates can access
 */
export const AffiliateRoute: React.FC<AffiliateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAffiliateStatus = async () => {
      if (!user) {
        setIsAffiliate(false);
        setChecking(false);
        return;
      }

      try {
        // Check if user is an affiliate
        const affiliateData = await AffiliateService.getAffiliateByFirebaseUid(user.uid);
        const affiliateStatus = !!affiliateData;
        setIsAffiliate(affiliateStatus);
        
        if (!affiliateStatus) {
          console.warn('⚠️ Unauthorized affiliate access attempt by:', user.email);
        }
      } catch (error) {
        console.error('Error checking affiliate status:', error);
        setIsAffiliate(false);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAffiliateStatus();
    }
  }, [user, loading]);

  // Show loading spinner while checking auth and affiliate status
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying affiliate access...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return <Navigate to="/auth/signin?redirect=/affiliate/dashboard" replace />;
  }

  // Redirect to affiliate signup if not an affiliate
  if (!isAffiliate) {
    return <Navigate to="/affiliate" replace />;
  }

  // User is authenticated and is affiliate
  return <>{children}</>;
};
