import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Menu, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { flutterwaveService } from '../../services/flutterwaveService';
import { PRICING_PLANS } from '../../constants/plans';
import toast from 'react-hot-toast';
import { AuthService } from '../../services/auth';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { business, loading, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCompletePayment = async () => {
    if (!business || !user) return;

    setIsProcessing(true);
    try {
      // Find plan details - default to 'business' if currently set plan not found in pricing
      // or assume business.plan matches a plan ID.
      const paymentPlan = PRICING_PLANS.find(p => p.id === business.plan) || PRICING_PLANS.find(p => p.id === 'business');

      if (!paymentPlan) {
        throw new Error('Plan details not found');
      }

      const txRef = flutterwaveService.generateTxRef('PLAN_COMPLETION');

      const paymentResult = await flutterwaveService.initializePayment({
        amount: paymentPlan.yearlyPrice,
        currency: 'NGN',
        customerEmail: user.email || '',
        customerName: business.name,
        customerPhone: business.phone || '08000000000',
        txRef,
        redirectUrl: `${window.location.origin}/payment/callback?upgrade=true`, // Using upgrade callback flow which handles status update now
        meta: {
          planId: paymentPlan.id,
          planName: paymentPlan.name,
          email: user.email || '',
          existingUser: true,
          userId: user.uid,
          businessId: business.id
        }
      });

      console.log('Payment init result:', paymentResult);

      if (paymentResult.status === 'success' && paymentResult.data?.data?.link) {
        window.location.href = paymentResult.data.data.link;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Payment Guard
  // Blocks access if business status is 'pending_payment'
  if (business?.status === 'pending_payment') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Required</h2>
            <p className="text-gray-600 mb-6">
              Your account setup is incomplete. Please complete your payment to access your dashboard.
            </p>

            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-3 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </button>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center w-full"
            >
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-full shadow p-2"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Sidebar component */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 overflow-auto relative">
        <Outlet />
        <div className="fixed bottom-0 right-0 bg-red-500 text-white text-xs px-2 py-1 opacity-75 z-50 pointer-events-none">
          v_debug_2025_12_29_TIMESTAMP
        </div>
      </div>
    </div>
  );
};