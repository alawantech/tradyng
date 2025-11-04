import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Private Route Guard
 * Protects routes that require authentication and checks trial expiration
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading, isTrialExpired } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Redirect to trial expired page if trial has ended
  if (isTrialExpired) {
    return <Navigate to="/trial-expired" replace />;
  }

  // User is authenticated and trial is active (or not on free plan)
  return <>{children}</>;
};
