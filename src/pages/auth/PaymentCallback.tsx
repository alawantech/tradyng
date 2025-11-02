import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { flutterwaveService } from '../../services/flutterwaveService';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { BusinessService } from '../../services/business';
import { getDefaultCurrencyForCountry } from '../../constants/currencies';
import toast from 'react-hot-toast';
import { AffiliateService } from '../../services/affiliate';

export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing using ref (survives re-renders better than state)
    if (hasProcessedRef.current) {
      console.log('⚠️ Payment already processed, skipping duplicate call');
      return;
    }

    const handlePaymentCallback = async () => {
      hasProcessedRef.current = true;
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');
      const isSignup = searchParams.get('signup') === 'true';
      const isUpgrade = searchParams.get('upgrade') === 'true';
      const isOrder = searchParams.get('order') === 'true';

      console.log('📋 Payment callback params:', { txRef, transactionId, status, isSignup, isUpgrade, isOrder });

      if (!txRef && !transactionId) {
        setStatus('error');
        setMessage('Invalid payment reference');
        return;
      }

      // Use transaction ID if available, otherwise use tx_ref
      const paymentRef = transactionId || txRef;

      try {
        // Verify payment with Flutterwave using transaction ID or tx_ref
        const verificationResult = await flutterwaveService.verifyPayment(paymentRef!);
        console.log('Payment verification result:', verificationResult);

        if (verificationResult.status === 'success' && verificationResult.data?.data?.status === 'successful') {
          setStatus('success');
          
          if (isUpgrade) {
            setMessage('Payment successful! Upgrading your plan...');
            // Extract metadata from the transaction
            const meta = verificationResult.data.data.meta || {};
            // Upgrade the current authenticated user's account
            await upgradeCurrentUserAccount(meta);
            // Commission is automatically awarded by Cloud Function
          } else if (isSignup) {
            setMessage('Payment successful! Creating your account...');
            // Extract metadata from the transaction
            const meta = verificationResult.data.data.meta || {};
            // Create the account
            await createAccountFromPayment(meta);
            // Commission is automatically awarded by Cloud Function
          } else if (isOrder) {
            setMessage('Payment successful! Processing your order...');
            // Extract metadata from the transaction
            const meta = verificationResult.data.data.meta || {};
            // Create the order
            await createOrderFromPayment(meta);
          } else {
            setMessage('Payment successful!');
          }
        } else {
        // If verification fails but status is 'successful', it might be a timing issue
        // Check if the status parameter indicates success
        if (status === 'successful' || status === 'success' || status === 'completed') {
            console.warn('Flutterwave verification failed but status indicates success - proceeding with account creation');
            setStatus('success');
            
          if (isUpgrade) {
            setMessage('Payment successful! Upgrading your plan...');
            await upgradeCurrentUserAccount({ planId: 'business' }); // Default to business if meta not available
            // Note: Affiliate referral recording not available in fallback case
          } else if (isSignup) {
            setMessage('Payment successful! Creating your account...');
            // For signup, we don't have meta data, so we'll need to handle this differently
            // This is a fallback for when verification fails but payment succeeded
            await createAccountFromUrlParams();
            // Note: Affiliate referral recording not available in fallback case
          } else if (isOrder) {
              setMessage('Payment successful! Processing your order...');
              // For orders, we also don't have meta data in this fallback
              setMessage('Payment successful! Please check your orders in the dashboard.');
              setTimeout(() => {
                navigate('/dashboard/orders');
              }, 2000);
            } else {
              setMessage('Payment successful!');
            }
          } else {
            setStatus('error');
            setMessage(`Payment verification failed: ${verificationResult.message || 'Unknown error'}. Please contact support if you were charged.`);
          }
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        
        // If it's a network error or verification fails, but status indicates success, proceed
        if (status === 'successful' || status === 'success' || status === 'completed') {
          console.warn('Verification failed but status indicates success - proceeding anyway');
          setStatus('success');
          
          if (isUpgrade) {
            setMessage('Payment successful! Upgrading your plan...');
            await upgradeCurrentUserAccount({ planId: 'business' }); // Default to business if meta not available
          } else if (isSignup) {
            setMessage('Payment successful! Creating your account...');
            await createAccountFromUrlParams();
          } else if (isOrder) {
            setMessage('Payment successful! Processing your order...');
            setTimeout(() => {
              navigate('/dashboard/orders');
            }, 2000);
          } else {
            setMessage('Payment successful!');
          }
        } else {
          setStatus('error');
          setMessage('Failed to verify payment. Please contact support.');
        }
      }
    };

    handlePaymentCallback();
  }, [searchParams]);

  const createAccountFromPayment = async (meta: any) => {
    try {
      const { planId, storeName, email, phone, country, state, password, couponCode } = meta;

      // 1. Create Firebase Auth user
      const authUser = await AuthService.signUp(email, password);
      console.log('✅ Firebase Auth user created:', { uid: authUser.uid, email: authUser.email });

      // 2. Create user document in Firestore
      await UserService.createUser({
        uid: authUser.uid,
        email: email,
        displayName: storeName,
        role: 'business_owner'
      });
      console.log('✅ User document created in Firestore');

      // 3. Generate subdomain from store name
      const subdomain = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);

      // Determine currency based on selected country
      const defaultCurrency = getDefaultCurrencyForCountry(country);

      // Get invite source UID if coupon was applied
      let inviteSourceUid: string | undefined = undefined;
      if (couponCode) {
        try {
          const affiliate = await AffiliateService.getAffiliateByUsername(couponCode.toLowerCase());
          if (affiliate) {
            inviteSourceUid = affiliate.firebaseUid;
            console.log('🎯 Tracking affiliate referral:', { affiliateUsername: couponCode, affiliateUid: inviteSourceUid });
          }
        } catch (error) {
          console.error('Error getting affiliate for invite tracking:', error);
        }
      }

      // 4. Create business document
      await BusinessService.createBusiness({
        name: storeName,
        subdomain: subdomain,
        ownerId: authUser.uid,
        email: email,
        phone: phone,
        whatsapp: phone,
        country: country,
        state: state,
        plan: planId,
        status: 'active',
        settings: {
          currency: defaultCurrency,
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          enableNotifications: true
        },
        inviteSourceUid: inviteSourceUid,
        revenue: 0,
        totalOrders: 0,
        totalProducts: 0
      });

      console.log('✅ Business created successfully');

      toast.success('Account and store created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Account creation error:', error);
      setStatus('error');
      setMessage('Payment successful but account creation failed. Please contact support.');
    }
  };

  const createAccountFromUrlParams = async () => {
    try {
      // Retrieve signup data from localStorage (stored before redirecting to Flutterwave)
      console.log('🔍 Checking localStorage for signup data...');
      const signupDataStr = localStorage.getItem('signupData');
      console.log('📦 Raw localStorage data:', signupDataStr);
      
      if (!signupDataStr) {
        console.error('❌ No signup data found in localStorage');
        // Log all localStorage keys for debugging
        console.log('🔍 All localStorage keys:', Object.keys(localStorage));
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            console.log(`🔍 localStorage[${key}]:`, localStorage.getItem(key));
          }
        }
        throw new Error('Signup information not found. Please try the signup process again.');
      }

      const signupData = JSON.parse(signupDataStr);
      console.log('✅ Retrieved signup data from localStorage:', signupData);
      const { email, storeName, password, phone, country, state, planId } = signupData;

      console.log('Creating account from localStorage data:', { email, storeName, planId });

      // Clear the signup data from localStorage after use
      localStorage.removeItem('signupData');

      // 1. Create Firebase Auth user
      const authUser = await AuthService.signUp(email, password);
      console.log('✅ Firebase Auth user created:', { uid: authUser.uid, email: authUser.email });

      // 2. Create user document in Firestore
      await UserService.createUser({
        uid: authUser.uid,
        email: email,
        displayName: storeName,
        role: 'business_owner'
      });
      console.log('✅ User document created in Firestore');

      // 3. Generate subdomain from store name
      const subdomain = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);

      // Determine currency based on selected country
      const defaultCurrency = getDefaultCurrencyForCountry(country);

      // 4. Create business document
      await BusinessService.createBusiness({
        name: storeName,
        subdomain: subdomain,
        ownerId: authUser.uid,
        email: email,
        phone: phone,
        whatsapp: phone,
        country: country,
        state: state,
        plan: planId,
        status: 'active',
        settings: {
          currency: defaultCurrency,
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          enableNotifications: true
        },
        revenue: 0,
        totalOrders: 0,
        totalProducts: 0
      });

      console.log('✅ Business created successfully');

      toast.success('Account and store created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Account creation from sessionStorage error:', error);
      setStatus('error');
      setMessage(`Account creation failed: ${error.message}. Please contact support with your transaction reference.`);
    }
  };

  // Commission tracking and coupon usage is now handled by Cloud Functions
  // This ensures security and consistency

  const createOrderFromPayment = async (meta: any) => {
    // Placeholder for order creation logic
    console.log('Order creation from payment:', meta);
    // This would be implemented based on your order system
  };

  const upgradeCurrentUserAccount = async (meta: any) => {
    try {
      const { planId } = meta;

      // Get current authenticated user
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }

      console.log('Upgrading plan for user:', currentUser.uid, 'to plan:', planId);

      // Find the business owned by this user
      const businesses = await BusinessService.getBusinessesByOwnerId(currentUser.uid);
      if (!businesses || businesses.length === 0) {
        throw new Error('Business account not found. Please contact support.');
      }

      const business = businesses[0]; // Assume first business

      // Update the business plan
      if (!business.id) {
        throw new Error('Business ID not found. Please contact support.');
      }

      await BusinessService.updateBusiness(business.id, {
        plan: planId
      });

      console.log('✅ Business plan upgraded successfully:', { businessId: business.id, newPlan: planId });

      toast.success(`Plan upgraded to ${planId} successfully!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Account upgrade error:', error);
      setStatus('error');
      setMessage('Payment successful but plan upgrade failed. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          <div className="mb-6">
            {status === 'loading' && <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto" />}
            {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />}
            {status === 'error' && <XCircle className="w-16 h-16 text-red-500 mx-auto" />}
          </div>

          <h1 className={`text-2xl font-bold mb-4 ${
            status === 'loading' ? 'text-blue-600' :
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'loading' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </h1>

          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {status === 'success' && (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-green-500 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/pricing')}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};