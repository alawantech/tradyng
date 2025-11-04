import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Tag, Check, X, Sparkles, Gift, Percent } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PRICING_PLANS } from '../constants/plans';
import { flutterwaveService } from '../services/flutterwaveService';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { AffiliateService } from '../services/affiliate';
import { BusinessService } from '../services/business';
import { AuthService } from '../services/auth';
import toast from 'react-hot-toast';

interface CouponData {
  code: string;
  discount: number | { [planId: string]: number }; // Can be a fixed amount or plan-specific amounts
  planType: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
}

export const CouponPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValidCoupon, setIsValidCoupon] = useState<boolean | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const planId = searchParams.get('plan');

  const selectedPlan = PRICING_PLANS.find(plan => plan.id === planId);

  useEffect(() => {
    if (!planId || !selectedPlan || selectedPlan.id === 'free') {
      navigate('/pricing');
    }

    // Check authentication status
    checkAuthStatus();

    // Initialize coupons if they don't exist
    initializeCouponsIfNeeded();
  }, [planId, selectedPlan, navigate]);

  const checkAuthStatus = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const initializeCouponsIfNeeded = async () => {
    try {
      const couponsRef = collection(db, 'coupons');

      // Check if abubakardev coupon exists
      const q = query(couponsRef, where('code', '==', 'abubakardev'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Initialize default coupons
        await setDoc(doc(couponsRef, 'abubakardev'), {
          code: 'abubakardev',
          discount: { business: 2000, pro: 4000 }, // Different discounts for different plans
          planType: 'all', // Works for all plans
          isActive: true,
          usageLimit: null,
          usedCount: 0,
          createdAt: new Date(),
          description: 'Universal discount coupon - ₦2,000 off Business, ₦4,000 off Pro'
        });

        await setDoc(doc(couponsRef, 'prodiscount'), {
          code: 'prodiscount',
          discount: 4000,
          planType: 'pro',
          isActive: true,
          usageLimit: null,
          usedCount: 0,
          createdAt: new Date(),
          description: 'Pro plan discount coupon'
        });

        await setDoc(doc(couponsRef, 'testdiscount'), {
          code: 'testdiscount',
          discount: 20,
          planType: 'test',
          isActive: true,
          usageLimit: null,
          usedCount: 0,
          createdAt: new Date(),
          description: 'Test plan discount coupon - ₦20 off'
        });

        console.log('Default coupons initialized');
      } else {
        // Always ensure ABUBAKARDEV has the correct structure
        const couponDoc = querySnapshot.docs[0];
        const couponData = couponDoc.data();

        console.log('🎫 Existing coupon data:', couponData);

        // Check if it needs updating (should have planType 'all' and object discount)
        const needsUpdate = !(
          couponData.planType === 'all' &&
          typeof couponData.discount === 'object' &&
          couponData.discount.business === 2000 &&
          couponData.discount.pro === 4000
        );

        if (needsUpdate) {
          console.log('🎫 Updating ABUBAKARDEV coupon to correct structure...');
          await setDoc(doc(couponsRef, 'abubakardev'), {
            code: 'abubakardev',
            discount: { business: 2000, pro: 4000 }, // Different discounts for different plans
            planType: 'all', // Works for all plans
            isActive: true,
            usageLimit: couponData.usageLimit || null,
            usedCount: couponData.usedCount || 0,
            createdAt: couponData.createdAt || new Date(),
            description: 'Universal discount coupon - ₦2,000 off Business, ₦4,000 off Pro'
          });
          console.log('🎫 ABUBAKARDEV coupon updated to correct structure');
        } else {
          console.log('🎫 ABUBAKARDEV coupon already has correct structure');
        }
      }
    } catch (error) {
      console.error('Error initializing coupons:', error);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    console.log('🎫 Starting coupon validation...');
    console.log('🎫 Coupon code entered:', couponCode);
    console.log('🎫 Current planId:', planId);
    console.log('🎫 Selected plan:', selectedPlan);

    setIsValidating(true);
    setIsValidCoupon(null);

    try {
      // First, try to validate as a regular coupon
      const isRegularCoupon = await validateRegularCoupon(couponCode.toLowerCase());
      if (isRegularCoupon) {
        return; // Regular coupon was applied successfully
      }

      // If not a regular coupon, try to validate as an affiliate username
      const isAffiliateCode = await validateAffiliateCode(couponCode.toLowerCase());
      if (isAffiliateCode) {
        return; // Affiliate code was applied successfully
      }

      // If neither coupon nor affiliate code, show error
      setIsValidCoupon(false);
      toast.error('Invalid coupon code or affiliate username');

    } catch (error) {
      console.error('Coupon validation error:', error);
      setIsValidCoupon(false);
      toast.error('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const validateRegularCoupon = async (code: string): Promise<boolean> => {
    // Ensure coupons are initialized/updated before validation
    await initializeCouponsIfNeeded();

    // Query Firebase for the coupon code (case-insensitive)
    const couponsRef = collection(db, 'coupons');
    const q = query(
      couponsRef,
      where('code', '==', code),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);

    console.log('🎫 Regular coupon query result - found coupons:', querySnapshot.size);
    console.log('🎫 Searching for coupon code:', code);

    if (!querySnapshot.empty) {
      const couponDoc = querySnapshot.docs[0];
      const couponData = couponDoc.data() as CouponData;

      console.log('🎫 Found regular coupon:', couponData);

      // Check if coupon is valid for this plan
      if (couponData.planType === 'all' || couponData.planType === planId) {
        // Check usage limit if exists
        if (couponData.usageLimit && (couponData.usedCount || 0) >= couponData.usageLimit) {
          return false;
        }

        // Calculate discount amount based on plan
        let discountAmount = 0;
        console.log('🎫 Validating coupon for plan:', planId);
        console.log('🎫 Coupon data:', couponData);
        console.log('🎫 Coupon discount type:', typeof couponData.discount);
        console.log('🎫 Coupon discount value:', couponData.discount);

        if (typeof couponData.discount === 'number') {
          discountAmount = couponData.discount;
          console.log('🎫 Fixed discount amount:', discountAmount);
        } else if (typeof couponData.discount === 'object' && couponData.discount[planId!]) {
          discountAmount = couponData.discount[planId!];
          console.log('🎫 Plan-specific discount amount:', discountAmount, 'for plan:', planId);
          console.log('🎫 Available discounts:', Object.keys(couponData.discount));
        } else {
          console.log('🎫 No valid discount found for plan:', planId, '- checking if plan exists in discount object');
          if (typeof couponData.discount === 'object') {
            console.log('🎫 Available plan discounts:', couponData.discount);
          }
          return false;
        }

        setIsValidCoupon(true);
        setDiscountAmount(discountAmount);
        setAppliedCoupon(couponData);
        toast.success(`Coupon applied! You save ₦${discountAmount.toLocaleString()}`);
        return true;
      }
    }

    return false;
  };

  const validateAffiliateCode = async (username: string): Promise<boolean> => {
    try {
      console.log('🎯 Checking if code is an affiliate username:', username);

      // Check if this username exists as an affiliate
      const affiliate = await AffiliateService.getAffiliateByUsername(username);

      if (affiliate) {
        console.log('✅ Found affiliate:', affiliate.username);

        // Calculate discount based on plan (only for paid plans)
        let discountAmount = 0;
        if (planId === 'business') {
          discountAmount = 2000;
        } else if (planId === 'pro') {
          discountAmount = 4000;
        } else if (planId === 'test') {
          discountAmount = 20; // 20 naira discount for test plan
        } else if (planId === 'free') {
          // Free plan - no discount needed
          discountAmount = 0;
        } else {
          console.log('❌ Invalid plan for affiliate discount:', planId);
          return false;
        }

        // Create a virtual coupon object for affiliate referral
        const affiliateCoupon: CouponData = {
          code: username.toUpperCase(),
          discount: discountAmount,
          planType: planId!,
          isActive: true,
          usageLimit: undefined,
          usedCount: 0
        };

        setIsValidCoupon(true);
        setDiscountAmount(discountAmount);
        setAppliedCoupon(affiliateCoupon);
        
        if (discountAmount > 0) {
          toast.success(`Affiliate code applied! You save ₦${discountAmount.toLocaleString()}`);
        } else {
          toast.success(`Affiliate code applied! Welcome to your free plan.`);
        }

        console.log('🎯 Affiliate referral applied:', {
          affiliateUsername: username,
          discountAmount,
          planId
        });

        return true;
      }

      console.log('❌ Username is not a valid affiliate:', username);
      return false;

    } catch (error) {
      console.error('Error validating affiliate code:', error);
      return false;
    }
  };

  const handleContinueToPayment = async () => {
    if (!selectedPlan) return;

    setIsProcessingPayment(true);

    try {
      // Check if Flutterwave is configured
      if (!flutterwaveService.isConfigured()) {
        toast.error('Payment system is not configured. Please contact support.');
        return;
      }

      const finalAmount = selectedPlan.yearlyPrice - discountAmount;

      if (isAuthenticated && currentUser) {
        // Handle authenticated user payment
        console.log('💳 Processing payment for authenticated user:', currentUser.uid);

        // Get business info for the authenticated user
        const businesses = await BusinessService.getBusinessesByOwnerId(currentUser.uid);
        if (!businesses || businesses.length === 0) {
          throw new Error('Business account not found');
        }

        const business = businesses[0];
        const txRef = flutterwaveService.generateTxRef('PLAN_UPGRADE_EXISTING');

        // Ensure we have required parameters with fallbacks
        const customerPhone = business.phone || '08012345678';
        const customerName = business.name || 'Business Owner';

        console.log('Initializing payment for authenticated user:', {
          businessId: business.id,
          customerEmail: currentUser.email,
          customerName,
          customerPhone,
          amount: finalAmount,
          planId: selectedPlan.id,
          discountAmount,
          couponCode: appliedCoupon?.code
        });

        const paymentResult = await flutterwaveService.initializePayment({
          amount: finalAmount,
          currency: 'NGN',
          customerEmail: currentUser.email,
          customerName: customerName,
          customerPhone: customerPhone,
          txRef: txRef,
          redirectUrl: `${window.location.origin}/payment/callback?upgrade=true`,
          meta: {
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            email: currentUser.email,
            existingUser: true,
            userId: currentUser.uid,
            businessId: business.id,
            originalAmount: selectedPlan.yearlyPrice,
            discountAmount: discountAmount,
            couponCode: appliedCoupon?.code || null
          }
        });

        if (paymentResult.status === 'success' && paymentResult.data) {
          // Check if we have the payment link
          const paymentLink = paymentResult.data?.data?.link;
          if (paymentLink) {
            console.log('✅ Redirecting to Flutterwave payment page:', paymentLink);
            window.location.href = paymentLink;
          } else {
            console.error('❌ No payment link in response:', paymentResult.data);
            toast.error('Payment link not found in response. Please try again or contact support.');
          }
        } else {
          console.error('❌ Payment initialization failed:', paymentResult);
          toast.error(paymentResult.message || 'Failed to initialize payment. Please try again.');
        }
      } else {
        // Handle non-authenticated user - redirect to payment page for paid plans
        console.log('🔐 Non-authenticated user - checking plan type');

        if (selectedPlan.yearlyPrice > 0) {
          // For paid plans, redirect to payment with all necessary info
          console.log('� Redirecting to payment for paid plan');
          
          // Store coupon info in session storage for payment callback
          if (appliedCoupon) {
            sessionStorage.setItem('appliedCoupon', JSON.stringify({
              code: appliedCoupon.code,
              discount: discountAmount,
              planId: planId
            }));
          }

          // Redirect to signup with payment flow
          const url = new URL('/auth/signup', window.location.origin);
          url.searchParams.set('plan', planId!);
          url.searchParams.set('amount', finalAmount.toString());
          if (appliedCoupon) {
            url.searchParams.set('coupon', appliedCoupon.code);
            url.searchParams.set('discount', discountAmount.toString());
          }

          navigate(url.pathname + url.search);
        } else {
          // For free plan, just redirect to signup
          console.log('🎁 Redirecting to signup for free plan');
          navigate(`/auth/signup?plan=free`);
        }
      }

    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('Business account not found')) {
        toast.error('Business account not found. Please sign up first.');
      } else {
        toast.error(error.message || 'Failed to initialize payment. Please try again or contact support.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSkipCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setIsValidCoupon(null);
    setCouponCode('');
  };

  if (!selectedPlan || selectedPlan.id === 'free') {
    return null;
  }

  const finalAmount = selectedPlan.yearlyPrice - discountAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/pricing"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Pricing
          </Link>

          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Gift className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            Have a Coupon Code?
          </h1>
          <p className="text-lg text-gray-600">
            {isAuthenticated 
              ? `Enter your coupon code to get a discount on your ${selectedPlan.name} plan upgrade`
              : `Enter your coupon code below to get a discount on your ${selectedPlan.name} plan`
            }
          </p>
        </motion.div>

        {/* Selected Plan Summary */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedPlan.name} Plan</h3>
                <p className="text-gray-600">Yearly subscription</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ₦{selectedPlan.yearlyPrice.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">per year</div>
              </div>
            </div>

            {/* Change Plan Button */}
            <div className="border-t border-gray-200 pt-4">
              <Button
                onClick={() => navigate('/pricing')}
                variant="outline"
                className="w-full border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-semibold transition-all duration-300"
              >
                Change Plan
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Coupon Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="space-y-6">
              {/* Coupon Input */}
              <div>
                <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code (Optional)
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center w-12 pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="block w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase tracking-wider font-mono text-gray-900 placeholder-gray-500"
                      disabled={isValidating}
                    />
                  </div>
                  <Button
                    onClick={validateCoupon}
                    disabled={isValidating || !couponCode.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isValidating ? 'Validating...' : 'Apply'}
                  </Button>
                </div>

                {/* Validation Feedback */}
                <AnimatePresence>
                  {isValidCoupon !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mt-3 flex items-center space-x-2 text-sm ${
                        isValidCoupon ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isValidCoupon ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Coupon applied successfully!</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Invalid coupon code</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Discount Display */}
              <AnimatePresence>
                {appliedCoupon && discountAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Percent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-800">Discount Applied!</div>
                          <div className="text-sm text-green-600">
                            {appliedCoupon.code.toUpperCase()} - ₦{discountAmount.toLocaleString()} off
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleSkipCoupon}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{selectedPlan.yearlyPrice.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedCoupon?.code.toUpperCase()})</span>
                      <span>-₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-300 pt-3">
                    <span>Total</span>
                    <span>₦{finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  onClick={handleContinueToPayment}
                  disabled={isProcessingPayment}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isProcessingPayment ? (
                    'Processing...'
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>{isAuthenticated ? 'Continue to Payment' : 'Continue to Registration'}</span>
                      <Sparkles className="w-5 h-5" />
                    </span>
                  )}
                </Button>

                {!appliedCoupon && (
                  <Button
                    onClick={handleContinueToPayment}
                    variant="outline"
                    className="flex-1 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 py-4 rounded-lg font-semibold transition-all duration-300"
                  >
                    Skip Coupon & Continue
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-sm text-gray-500">
            {isAuthenticated 
              ? "Don't have a coupon code? No problem! Continue to payment to complete your plan upgrade."
              : "Don't have a coupon code? No problem! You'll register your account in the next step."
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
};