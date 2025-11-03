import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { BusinessService } from '../../services/business';
import { AffiliateService } from '../../services/affiliate';
import { flutterwaveService } from '../../services/flutterwaveService';
import { PRICING_PLANS } from '../../constants/plans';
import { FirebaseTest } from '../../utils/firebaseTest';

export const SignIn: React.FC = () => {
  // UPDATED: Admin login fix - v2.0 - 2025-11-03
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check for coupon/plan parameters from URL
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const planFromUrl = searchParams.get('plan');
  const couponFromUrl = searchParams.get('coupon');
  const discountFromUrl = searchParams.get('discount');
  const redirectFromUrl = searchParams.get('redirect');

  // Forgot password states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpCooldownRef = React.useRef<number | null>(null);
  const OTP_LENGTH = 4;
  const [otpCountdown, setOtpCountdown] = useState(60); // 1 minute countdown
  const otpCountdownRef = React.useRef<number | null>(null);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('🔐 Attempting to sign in with:', { email: formData.email });
    console.log('🔐 CODE VERSION: 2025-11-03-FIX-v3');
    
    try {
      // Sign in with Firebase Auth
      const authUser = await AuthService.signIn(formData.email, formData.password);
      console.log('✅ Successfully signed in:', { uid: authUser.uid, email: authUser.email });
      
      // Get user role from Firestore
      const userData = await UserService.getUserById(authUser.uid);
      console.log('👤 User data retrieved:', userData);
      console.log('🔍 User role is:', userData?.role, '(type:', typeof userData?.role, ')');
      
      // SUPER AGGRESSIVE ADMIN CHECK - Check IMMEDIATELY
      if (userData && userData.role) {
        const roleStr = String(userData.role).trim().toLowerCase();
        console.log('🔍 Processed role string:', roleStr);
        console.log('🔍 Is it "admin"?:', roleStr === 'admin');
        
        if (roleStr === 'admin') {
          console.log('🚨🚨🚨 ADMIN ROLE CONFIRMED - REDIRECTING NOW 🚨🚨🚨');
          console.log('🚨 Using window.location.href to force redirect');
          setLoading(false);
          toast.success('Welcome back, Admin!');
          // Force immediate redirect
          window.location.href = '/admin';
          return; // Stop everything
        }
      }
      
      console.log('⚠️ Admin check passed, continuing with other role checks...');
      
      // Check if this is an affiliate (they won't have user data in 'users' collection)
      let isAffiliate = false;
      let affiliateData = null;
      
      if (!userData) {
        try {
          affiliateData = await AffiliateService.getAffiliateByFirebaseUid(authUser.uid);
          if (affiliateData) {
            isAffiliate = true;
            console.log('🎯 Affiliate user detected:', affiliateData.username);
          }
        } catch (error) {
          console.error('Error checking affiliate status:', error);
        }
      }
      
      if (!userData && !isAffiliate) {
        throw new Error('User data not found. Please contact support.');
      }
      
      // Update last login for regular users (affiliates don't have user records)
      if (userData) {
        await UserService.updateLastLogin(authUser.uid);
      }
      
      // NOTE: Admin check is at the top of this function - if we reached here, user is NOT admin
      console.log('📍 User is not admin, checking other roles...');
      
      // Check if user has a free plan business that needs payment
      let redirectPath = '/dashboard'; // default for business owners
      let welcomeMessage = 'Welcome back!';
      
      // Handle affiliate login
      if (isAffiliate) {
        console.log('✅ BRANCH: Affiliate detected');
        if (redirectFromUrl === '/affiliate/dashboard') {
          redirectPath = '/affiliate/dashboard';
          welcomeMessage = 'Welcome back to your affiliate dashboard!';
        } else {
          // Default redirect for affiliates
          redirectPath = '/affiliate/dashboard';
          welcomeMessage = 'Welcome back to your affiliate dashboard!';
        }
      } else if (userData && userData.role && userData.role.trim().toLowerCase() === 'business_owner') {
        console.log('✅ BRANCH: Business owner detected - checking for businesses');
        try {
          const businesses = await BusinessService.getBusinessesByOwnerId(authUser.uid);
          if (businesses && businesses.length > 0) {
            const business = businesses[0];
            console.log('🏢 Business data retrieved:', { id: business.id, plan: business.plan });
            
            // All users with a business (free or paid) go to dashboard
            if (business.plan) {
              console.log('✅ User has paid plan, redirecting to dashboard');
              console.log('📊 Business details:', {
                id: business.id,
                name: business.name,
                plan: business.plan,
                createdAt: business.createdAt,
                ownerId: business.ownerId
              });
              redirectPath = '/dashboard';
              welcomeMessage = 'Welcome back to your store!';
            }
          } else {
            // No business found, redirect to coupon page to complete signup
            console.log('❌ No business found, redirecting to coupon page to complete signup');
            const redirectPlan = planFromUrl && planFromUrl !== 'free' ? planFromUrl : 'business';
            const couponUrl = `/coupon?plan=${redirectPlan}${couponFromUrl ? `&coupon=${couponFromUrl}&discount=${discountFromUrl}` : ''}`;
            navigate(couponUrl);
            return;
          }
        } catch (businessError) {
          console.error('Error checking business data:', businessError);
          // Fall back to dashboard if business check fails
          redirectPath = '/dashboard';
          welcomeMessage = 'Welcome back!';
        }
      } else if (userData && userData.role && userData.role.trim().toLowerCase() === 'customer') {
        // Customers should be redirected to their account page or back to store
        redirectPath = '/';
        welcomeMessage = 'Welcome back!';
      } else {
        // Default to dashboard for unknown roles
        console.log('⚠️ BRANCH: Unknown or no role, using default');
        redirectPath = '/dashboard';
        welcomeMessage = 'Welcome back!';
      }
      
      console.log('🚀 Redirecting to:', redirectPath, 'for user type:', isAffiliate ? 'affiliate' : userData?.role || 'unknown');
      
      toast.success(welcomeMessage);
      setTimeout(() => {
        navigate(redirectPath);
      }, 1000);
      
    } catch (error: any) {
      console.error('Signin error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initiatePaymentForExistingUser = async (userId: string, business: any, email: string) => {
    setIsProcessingPayment(true);
    try {
      // Default to business plan
      const paymentPlan = PRICING_PLANS.find(plan => plan.id === 'business');
      if (!paymentPlan) {
        throw new Error('Business plan not found');
      }

      // Check if Flutterwave is configured
      if (!flutterwaveService.isConfigured()) {
        toast.error('Payment system is not configured. Please contact support.');
        return;
      }

      const txRef = flutterwaveService.generateTxRef('PLAN_UPGRADE_EXISTING');

      // Ensure we have required parameters with fallbacks
      const customerPhone = business.phone || '08012345678';
      const customerName = business.name || 'Business Owner';

      console.log('Initializing payment for existing user:', {
        businessId: business.id,
        customerEmail: email,
        customerName,
        customerPhone,
        amount: paymentPlan.yearlyPrice,
        planId: paymentPlan.id
      });

      const paymentResult = await flutterwaveService.initializePayment({
        amount: paymentPlan.yearlyPrice,
        currency: 'NGN',
        customerEmail: email,
        customerName: customerName,
        customerPhone: customerPhone,
        txRef: txRef,
        redirectUrl: `${window.location.origin}/payment/callback?upgrade=true`,
        meta: {
          planId: paymentPlan.id,
          planName: paymentPlan.name,
          email: email,
          existingUser: true,
          userId: userId,
          businessId: business.id
        }
      });

      if (paymentResult.status === 'success' && paymentResult.data) {
        // Redirect to Flutterwave payment page
        window.location.href = paymentResult.data.data.link;
      } else {
        toast.error(paymentResult.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment error for existing user:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const initiatePaymentForNewUser = async (userId: string, email: string) => {
    setIsProcessingPayment(true);
    try {
      // Default to business plan
      const paymentPlan = PRICING_PLANS.find(plan => plan.id === 'business');
      if (!paymentPlan) {
        throw new Error('Business plan not found');
      }

      // Check if Flutterwave is configured
      if (!flutterwaveService.isConfigured()) {
        toast.error('Payment system is not configured. Please contact support.');
        return;
      }

      const txRef = flutterwaveService.generateTxRef('PLAN_UPGRADE_NEW');

      // Use default values since we don't have business data yet
      const customerPhone = '08012345678';
      const customerName = 'Business Owner';

      console.log('Initializing payment for new user:', {
        customerEmail: email,
        customerName,
        customerPhone,
        amount: paymentPlan.yearlyPrice,
        planId: paymentPlan.id
      });

      const paymentResult = await flutterwaveService.initializePayment({
        amount: paymentPlan.yearlyPrice,
        currency: 'NGN',
        customerEmail: email,
        customerName: customerName,
        customerPhone: customerPhone,
        txRef: txRef,
        redirectUrl: `${window.location.origin}/payment/callback?upgrade=true`,
        meta: {
          planId: paymentPlan.id,
          planName: paymentPlan.name,
          email: email,
          existingUser: false,
          userId: userId,
          businessId: null
        }
      });

      if (paymentResult.status === 'success' && paymentResult.data) {
        // Redirect to Flutterwave payment page
        window.location.href = paymentResult.data.data.link;
      } else {
        toast.error(paymentResult.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment error for new user:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Test Firebase connection - for debugging
  const testFirebase = async () => {
    console.log('🧪 Testing Firebase connection...');
    await FirebaseTest.testConnection();
    
    // Try to create a test user
    try {
      const testEmail = 'test-' + Date.now() + '@example.com';
      const testPassword = 'TestPass123!';
      console.log('🧪 Creating test user:', testEmail);
      const user = await FirebaseTest.testCreateUser(testEmail, testPassword);
      console.log('✅ Test user created:', user.uid);
      
      // Now try to login with the test user
      console.log('🧪 Testing login with test user...');
      await FirebaseTest.testLogin(testEmail, testPassword);
      console.log('✅ Test login successful');
      
      toast.success('Firebase test completed successfully!');
    } catch (error: any) {
      console.error('❌ Firebase test failed:', error);
      toast.error('Firebase test failed: ' + error.message);
    }
  };

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (otpCooldownRef.current) {
        window.clearInterval(otpCooldownRef.current);
        otpCooldownRef.current = null;
      }
      if (otpCountdownRef.current) {
        window.clearInterval(otpCountdownRef.current);
        otpCountdownRef.current = null;
      }
    };
  }, []);

  // Start OTP countdown when entering OTP step
  useEffect(() => {
    if (forgotPasswordStep === 'otp') {
      setOtpCountdown(60); // Reset to 60 seconds (1 minute)
      if (otpCountdownRef.current) {
        window.clearInterval(otpCountdownRef.current);
      }
      otpCountdownRef.current = window.setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) {
            if (otpCountdownRef.current) {
              window.clearInterval(otpCountdownRef.current);
              otpCountdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    } else {
      // Clear countdown when leaving OTP step
      if (otpCountdownRef.current) {
        window.clearInterval(otpCountdownRef.current);
        otpCountdownRef.current = null;
      }
    }
  }, [forgotPasswordStep]);

  // Forgot password functions
  const triggerResetOtp = async () => {
    try {
      setOtpLoading(true);
      const res = await fetch('https://us-central1-tradyng-51655.cloudfunctions.net/sendResetOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      if (!res.ok) {
        let bodyText: string | null = null;
        try {
          const json = await res.json();
          bodyText = json && (json.error || json.message) ? (json.error || json.message) : JSON.stringify(json);
        } catch (_e) {
          try { bodyText = await res.text(); } catch (_e2) { bodyText = null; }
        }
        if (res.status === 429) {
          const cooldownSec = 60;
          setOtpCooldown(cooldownSec);
          if (otpCooldownRef.current) window.clearInterval(otpCooldownRef.current);
          otpCooldownRef.current = window.setInterval(() => {
            setOtpCooldown(prev => {
              if (prev <= 1) {
                if (otpCooldownRef.current) {
                  window.clearInterval(otpCooldownRef.current);
                  otpCooldownRef.current = null;
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000) as unknown as number;
          toast.error('OTP recently requested. Please wait a minute before requesting again.');
          return;
        }
        throw new Error(bodyText || `Failed to send OTP (status ${res.status})`);
      }
      setForgotPasswordStep('otp');
      setOtpCode('');
      setOtpCountdown(60); // Reset countdown when new OTP is sent
      setOtpCooldown(60); // Start cooldown to prevent immediate resend
      if (otpCooldownRef.current) window.clearInterval(otpCooldownRef.current);
      otpCooldownRef.current = window.setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            if (otpCooldownRef.current) {
              window.clearInterval(otpCooldownRef.current);
              otpCooldownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    } catch (err: any) {
      console.error('sendResetOtp error:', err);
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyResetOtp = async () => {
    if (otpCountdown === 0) {
      toast.error('Code has expired. Please request a new one.');
      return;
    }
    try {
      setOtpLoading(true);
      const res = await fetch('https://us-central1-tradyng-51655.cloudfunctions.net/verifyResetOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: otpCode.trim() })
      });
      if (!res.ok) {
        let bodyText: string | null = null;
        try {
          const json = await res.json();
          bodyText = json && (json.error || json.message) ? (json.error || json.message) : JSON.stringify(json);
        } catch (_e) {
          try { bodyText = await res.text(); } catch (_e2) { bodyText = null; }
        }
        throw new Error(bodyText || `Invalid code (status ${res.status})`);
      }
      // Stop the countdown timer on successful verification
      if (otpCountdownRef.current) {
        window.clearInterval(otpCountdownRef.current);
        otpCountdownRef.current = null;
      }
      setForgotPasswordStep('newPassword');
      setOtpCode('');
    } catch (err: any) {
      console.error('verifyResetOtp error:', err);
      toast.error(err.message || 'Invalid code');
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setResetLoading(true);
      const res = await fetch('https://us-central1-tradyng-51655.cloudfunctions.net/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword })
      });
      if (!res.ok) {
        let bodyText: string | null = null;
        try {
          const json = await res.json();
          bodyText = json && (json.error || json.message) ? (json.error || json.message) : JSON.stringify(json);
        } catch (_e) {
          try { bodyText = await res.text(); } catch (_e2) { bodyText = null; }
        }
        throw new Error(bodyText || `Failed to reset password (status ${res.status})`);
      }
      toast.success('Password reset successfully! You can now sign in with your new password.');
      setShowForgotPasswordModal(false);
      setForgotPasswordStep('email');
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('resetPassword error:', err);
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
  <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
              <img src="/logo.png" alt="Rady.ng Logo" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-white">rady.ng</span>
            </Link>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="adebayo@example.com"
              icon={<Mail className="h-5 w-5" />}
              className="h-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
              labelClassName="text-white font-bold drop-shadow-lg"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              className="h-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
              labelClassName="text-white font-bold drop-shadow-lg"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-700 bg-gray-800 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button 
                  type="button"
                  className="font-medium text-blue-400 hover:text-blue-300"
                  onClick={() => {
                    setShowForgotPasswordModal(true);
                    setForgotPasswordStep('email');
                    setResetEmail('');
                    setOtpCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors" disabled={loading || isProcessingPayment}>
              {(loading || isProcessingPayment) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  {isProcessingPayment ? 'Processing Payment...' : 'Signing In...'}
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>



          <p className="text-center text-sm text-gray-300 mt-6">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up
            </Link>
          </p>
  </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            {forgotPasswordStep === 'email' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">Reset Password</h3>
                <p className="text-sm text-gray-400 mb-4">Enter your registered email address to receive a reset code.</p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    onClick={() => setShowForgotPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={triggerResetOtp}
                    disabled={!resetEmail || otpLoading || otpCooldown > 0}
                  >
                    {otpLoading ? 'Sending...' : otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Send Code'}
                  </button>
                </div>
              </>
            )}

            {forgotPasswordStep === 'otp' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">Enter Reset Code</h3>
                <p className="text-sm text-gray-400 mb-4">We sent a 4-digit code to <span className="font-medium text-white">{resetEmail}</span></p>
                <div className="text-center mb-4">
                  <div className={`text-2xl font-bold mb-2 ${otpCountdown <= 10 ? 'text-red-400' : 'text-blue-400'}`}>
                    {otpCountdown > 0 ? `${Math.floor(otpCountdown / 60)}:${(otpCountdown % 60).toString().padStart(2, '0')}` : 'Expired'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {otpCountdown > 0 ? 'Code expires in' : 'Code has expired'}
                  </div>
                </div>
                <input
                  autoFocus
                  value={otpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
                    setOtpCode(v);
                  }}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg text-center tracking-widest text-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="_ _ _ _"
                  disabled={otpCountdown === 0}
                />
                <div className="text-center mb-4">
                  {otpLoading ? (
                    <div className="text-sm text-gray-300">Verifying...</div>
                  ) : otpCountdown === 0 ? (
                    <div className="text-sm text-red-400">Code expired. Request a new one.</div>
                  ) : null}
                </div>
                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    onClick={() => setForgotPasswordStep('email')}
                  >
                    Back
                  </button>
                  <div className="flex space-x-2">
                    <button
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                      onClick={triggerResetOtp}
                      disabled={otpLoading || otpCooldown > 0}
                    >
                      {otpLoading ? 'Sending...' : otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Resend Code'}
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      onClick={verifyResetOtp}
                      disabled={otpCode.length !== OTP_LENGTH || otpLoading || otpCountdown === 0}
                    >
                      {otpLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {forgotPasswordStep === 'newPassword' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">New Password</h3>
                <p className="text-sm text-gray-400 mb-4">Enter your new password.</p>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    onClick={() => setForgotPasswordStep('otp')}
                  >
                    Back
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={resetPassword}
                    disabled={!newPassword || !confirmPassword || resetLoading}
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};