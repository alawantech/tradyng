import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { BusinessService } from '../../services/business';
import { CountryService } from '../../data/countries';
import type { Country, State } from '../../data/countries';
import { getDefaultCurrencyForCountry } from '../../constants/currencies';
import { COUNTRY_CALLING_CODES } from '../../data/countryCallingCodes';
import { PRICING_PLANS } from '../../constants/plans';
import { flutterwaveService } from '../../services/flutterwaveService';

interface FormData {
  storeName: string;
  email: string;
  password: string;
  repeatPassword: string;
  phone: string;
  countryCode: string;
  country: string;
  state: string;
}

interface DomainStatus {
  checking: boolean;
  available: boolean | null;
  message: string;
}

const steps = [
  { id: 1, title: 'Store Name', description: 'Choose your store name' },
  { id: 2, title: 'Email', description: 'Enter your email address' },
  { id: 3, title: 'Password', description: 'Create a secure password' },
  { id: 4, title: 'Whatsapp Number', description: 'Add your store Whatsapp number' },
  { id: 5, title: 'Location', description: 'Where is your business?' }
];

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    email: '',
    password: '',
    repeatPassword: '',
    phone: '',
    countryCode: '234',
    country: 'Nigeria', // Default to Nigeria
    state: ''
  });

  const [domainStatus, setDomainStatus] = useState<DomainStatus>({
    checking: false,
    available: null,
    message: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0); // seconds remaining until resend allowed
  const otpCooldownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const emailCheckTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const OTP_LENGTH = 4;

  // Email validation state
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Store name validation state
  const [storeNameExists, setStoreNameExists] = useState<boolean | null>(null);
  const [checkingStoreName, setCheckingStoreName] = useState(false);

  // Plan selection from URL params
  const selectedPlanId = searchParams.get('plan') || 'free';
  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[0];
  const couponCode = searchParams.get('coupon');
  const discountAmount = parseInt(searchParams.get('discount') || '0');

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const countriesList = await CountryService.getAllCountries();
        setCountries(countriesList);
        
        // Set Nigerian states as default since Nigeria is pre-selected
        const nigerianStates = CountryService.getStatesByCountryCode('NG');
        setStates(nigerianStates);
      } catch (error) {
        console.error('Error loading countries:', error);
        toast.error('Failed to load countries');
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (formData.country === 'Nigeria') {
      const nigerianStates = CountryService.getStatesByCountryCode('NG');
      setStates(nigerianStates);
    } else {
      // Clear states for non-Nigerian countries since they'll use manual input
      setStates([]);
      // Clear the current state value when switching away from Nigeria
      if (formData.state) {
        setFormData(prev => ({ ...prev, state: '' }));
      }
    }
  }, [formData.country]);

  const generateSubdomain = (storeName: string): string => {
    return storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  };

  const checkDomainAvailability = useCallback(async (storeName: string) => {
    if (storeName.length < 4) return;
    
    const subdomain = generateSubdomain(storeName);
    if (!subdomain) return;

    setDomainStatus({
      checking: true,
      available: null,
      message: 'Checking availability...'
    });

    try {
      const isAvailable = await BusinessService.checkSubdomainAvailability(subdomain);
      
      if (!isAvailable) {
        setDomainStatus({
          checking: false,
          available: false,
          message: `${subdomain}.rady.ng is already taken`
        });
      } else {
        setDomainStatus({
          checking: false,
          available: true,
          message: `${subdomain}.rady.ng is available!`
        });
      }
    } catch (error) {
      console.error('Error checking domain availability:', error);
      setDomainStatus({
        checking: false,
        available: null,
        message: 'Error checking availability'
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.storeName.length >= 4) {
        checkDomainAvailability(formData.storeName);
      } else {
        setDomainStatus({
          checking: false,
          available: null,
          message: ''
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.storeName, checkDomainAvailability]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check email existence when email field changes
    if (field === 'email') {
      // Reset email exists state when email changes
      setEmailExists(null);
      setCheckingEmail(false);
      
      // Clear any existing timeout
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      
      // Debounce the email check
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkEmailExists(value);
      }, 500);
    }

    // Check store name existence when store name field changes
    if (field === 'storeName') {
      // Reset store name exists state when store name changes
      setStoreNameExists(null);
      setCheckingStoreName(false);
      
      // Clear any existing timeout
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      
      // Debounce the store name check
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkStoreNameExists(value);
      }, 500);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.storeName.length >= 4 && domainStatus.available === true && storeNameExists === false;
      case 2:
        return formData.email.includes('@') && formData.email.includes('.') && emailExists === false;
      case 3:
        return (
          formData.password.length >= 6 &&
          formData.repeatPassword.length >= 6 &&
          formData.password === formData.repeatPassword
        );
      case 4:
        return formData.phone.trim().length >= 7;
      case 5:
        return formData.country.trim() !== '' && formData.state.trim() !== '';
      default:
        return false;
    }
  };

  const nextStep = () => {
    // If we're on store name step (1), check if store name exists first
    if (currentStep === 1) {
      if (storeNameExists === true) {
        // Don't proceed if store name exists
        return;
      }
      if (checkingStoreName) {
        // Don't proceed while checking store name
        return;
      }
    }

    // If we're on email step (2), check if email exists first
    if (currentStep === 2) {
      if (emailExists === true) {
        // Don't proceed if email exists
        return;
      }
      if (checkingEmail) {
        // Don't proceed while checking email
        return;
      }
      if (!isStepValid(2) || otpLoading || otpCooldown > 0) {
        return;
      }
      triggerSendOtp();
      return;
    }

    if (currentStep < 5 && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid(5)) return;
    
    setLoading(true);
    
    console.log('🔐 Creating new account with email:', formData.email);
    console.log('📋 Selected plan:', selectedPlanId, 'Coupon:', couponCode, 'Discount:', discountAmount);
    
    try {
      // Check if we have a coupon applied for a paid plan
      const hasPaidPlanCoupon = couponCode && selectedPlanId !== 'free' && discountAmount > 0;
      
      if (hasPaidPlanCoupon) {
        // For paid plans with coupon, create account and proceed to payment
        console.log('💳 Paid plan with coupon detected - creating account with FREE plan, then upgrading via payment');
        
        // Create account with FREE plan first (will upgrade after payment)
        await createAccount('free');
        
        // Store signup data for payment flow
        const signupData = {
          email: formData.email,
          storeName: formData.storeName,
          password: formData.password,
          phone: `${formData.countryCode}${formData.phone}`,
          country: formData.country,
          state: formData.state,
          planId: selectedPlanId,
          couponCode: couponCode,
          discountAmount: discountAmount
        };
        localStorage.setItem('signupData', JSON.stringify(signupData));
        console.log('💾 Stored signup data in localStorage for payment flow');
        
        // Then redirect to payment after a short delay to ensure auth state is ready
        toast.success('Account created! Redirecting to payment...');
        setTimeout(() => {
          console.log('⏰ Delay complete, calling handlePlanUpgrade...');
          handlePlanUpgrade();
        }, 2000); // Increased delay to ensure auth state is fully set
        return;
      } else {
        // For free plan or no coupon, create account normally
        await createAccount(selectedPlanId);
        
        if (selectedPlanId === 'free') {
          console.log('🎉 Free account created successfully');
          toast.success('Account created successfully!');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          // For paid plans without coupon, redirect to coupon page
          console.log('🎫 Paid plan without coupon - redirecting to coupon page');
          toast.success('Account created! Redirecting to coupon page...');
          
          setTimeout(() => {
            navigate(`/coupon?plan=${selectedPlanId}&amount=${PRICING_PLANS.find(p => p.id === selectedPlanId)?.yearlyPrice || 0}`);
          }, 1500);
        }
        return;
      }
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check if email already exists
      if (error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use') || error.message?.includes('already exists')) {
        console.log('📧 Email already exists, checking for incomplete signup...');
        
        try {
          const existingUser = await checkExistingIncompleteSignup(formData.email);
          if (existingUser) {
            console.log('✅ Found existing account with free plan, redirecting to payment');
            toast.error('Account already exists but appears incomplete. Redirecting to complete setup...');
            
            // Redirect to payment for the selected plan without creating account again
            setTimeout(() => {
              handleExistingUserPayment(existingUser.uid);
            }, 500);
            return;
          } else {
            // Email exists and account is complete - redirect to sign in
            console.log('❌ Email already exists with complete account');
            toast.error('An account with this email already exists. Please sign in instead.');
            
            // Redirect to sign in after a short delay
            setTimeout(() => {
              navigate(`/auth/signin${selectedPlanId !== 'free' ? `?plan=${selectedPlanId}${couponCode ? `&coupon=${couponCode}&discount=${discountAmount}` : ''}` : ''}`);
            }, 2000);
            return;
          }
        } catch (checkError) {
          console.error('Error checking existing signup:', checkError);
          toast.error('An account with this email already exists. Please sign in instead.');
          setTimeout(() => {
            navigate(`/auth/signin${selectedPlanId !== 'free' ? `?plan=${selectedPlanId}${couponCode ? `&coupon=${couponCode}&discount=${discountAmount}` : ''}` : ''}`);
          }, 2000);
          return;
        }
      }
      
      // Show original error for other cases
      toast.error(error.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const checkExistingIncompleteSignup = async (email: string) => {
    try {
      // Get user by email from Firestore
      const users = await UserService.getUsersByEmail(email);
      if (!users || users.length === 0) {
        return null;
      }

      const user = users[0];
      
      // Check if user has a business with free plan
      const businesses = await BusinessService.getBusinessesByOwnerId(user.uid);
      if (!businesses || businesses.length === 0) {
        return null;
      }

      const business = businesses[0];
      
      // If business has free plan, it's an incomplete signup
      if (business.plan === 'free') {
        console.log('Found incomplete signup:', { userId: user.uid, businessId: business.id, plan: business.plan });
        return { uid: user.uid, business };
      }

      return null;
    } catch (error) {
      console.error('Error checking existing signup:', error);
      return null;
    }
  };

    const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      console.log('❌ Invalid email format, skipping check:', email);
      setEmailExists(null);
      return;
    }

    console.log('🔍 Checking if email exists:', email);
    setCheckingEmail(true);
    try {
      // Check Firebase Auth - this is the source of truth for email registration
      // If the email exists in Auth, show "Account Already Exists"
      // If it doesn't exist in Auth, allow registration even if orphaned data exists in Firestore
      const existsInAuth = await AuthService.checkEmailExists(email);
      console.log('✅ Email check completed:', { email, existsInAuth });
      
      if (existsInAuth) {
        console.log('⚠️ EMAIL ALREADY EXISTS - Setting emailExists to TRUE');
        setEmailExists(true);
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        console.log('✅ Email is available - Setting emailExists to FALSE');
        setEmailExists(false);
      }
    } catch (error) {
      console.error('❌ Error checking email existence:', error);
      // If Auth check fails, allow registration to avoid blocking users
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
      console.log('📊 Final state - emailExists:', emailExists, 'checkingEmail:', false);
    }
  };

  const checkStoreNameExists = async (storeName: string) => {
    if (!storeName || storeName.length < 4) {
      setStoreNameExists(null);
      return;
    }

    setCheckingStoreName(true);
    try {
      // Check if a business with this name already exists in Firestore
      const businesses = await BusinessService.getBusinessesByName(storeName);
      const storeNameExists = businesses && businesses.length > 0;
      setStoreNameExists(storeNameExists);
      console.log('Store name check result:', { storeName, exists: storeNameExists });
    } catch (error) {
      console.error('Error checking store name existence:', error);
      // If check fails, allow registration to avoid blocking users
      setStoreNameExists(false);
    } finally {
      setCheckingStoreName(false);
    }
  };

  const handleExistingUserPayment = async (userId: string) => {
    setLoading(true);

    try {
      // Validate required data
      if (!formData.email) {
        throw new Error('Email is required for payment');
      }

      // Default to business plan if no valid paid plan is selected
      let paymentPlan = selectedPlan;
      if (!paymentPlan || !paymentPlan.yearlyPrice || paymentPlan.yearlyPrice === 0) {
        paymentPlan = PRICING_PLANS.find(plan => plan.id === 'business')!;
      }

      // Calculate final amount with coupon discount
      const finalAmount = paymentPlan.yearlyPrice - discountAmount;

      // Check if Flutterwave is configured
      if (!flutterwaveService.isConfigured()) {
        toast.error('Payment system is not configured. Please contact support.');
        return;
      }

      // Get user and business info
      const businesses = await BusinessService.getBusinessesByOwnerId(userId);
      if (!businesses || businesses.length === 0) {
        throw new Error('Business account not found');
      }

      const business = businesses[0];
      const txRef = flutterwaveService.generateTxRef('PLAN_UPGRADE_EXISTING');

      // Ensure we have required parameters with fallbacks
      const customerPhone = business.phone || '08012345678'; // Default fallback phone
      const customerName = business.name || 'Business Owner'; // Default fallback name

      console.log('Initializing payment for existing user:', {
        businessId: business.id,
        customerEmail: formData.email,
        customerName,
        customerPhone,
        amount: finalAmount,
        planId: paymentPlan.id,
        discountAmount,
        couponCode
      });

      const paymentResult = await flutterwaveService.initializePayment({
        amount: finalAmount,
        currency: 'NGN',
        customerEmail: formData.email,
        customerName: customerName,
        customerPhone: customerPhone,
        txRef: txRef,
        redirectUrl: `${window.location.origin}/payment/callback?upgrade=true`,
        meta: {
          planId: paymentPlan.id,
          planName: paymentPlan.name,
          email: formData.email,
          existingUser: true,
          userId: userId,
          businessId: business.id,
          customerName: customerName,
          customerPhone: customerPhone,
          originalAmount: paymentPlan.yearlyPrice,
          discountAmount: discountAmount,
          couponCode: couponCode || null
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
      setLoading(false);
    }
  };

  const handlePlanUpgrade = async () => {
    console.log('🚀 handlePlanUpgrade called');
    setLoading(true);

    try {
      // Validate required data
      if (!formData.email) {
        console.error('❌ No email in formData');
        throw new Error('Email is required for payment');
      }

      // Default to business plan if no valid paid plan is selected
      let paymentPlan = selectedPlan;
      if (!paymentPlan || !paymentPlan.yearlyPrice || paymentPlan.yearlyPrice === 0) {
        paymentPlan = PRICING_PLANS.find(plan => plan.id === 'business')!;
      }

      console.log('📋 Payment plan:', paymentPlan.id, 'Price:', paymentPlan.yearlyPrice);

      // Calculate final amount with coupon discount
      const finalAmount = paymentPlan.yearlyPrice - discountAmount;
      console.log('💰 Final amount after discount:', finalAmount);

      // Check if Flutterwave is configured
      if (!flutterwaveService.isConfigured()) {
        console.error('❌ Flutterwave not configured');
        toast.error('Payment system is not configured. Please contact support.');
        return;
      }

      // Get current user from Auth
      console.log('🔍 Getting current user from AuthService...');
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.error('❌ No current user found');
        throw new Error('User not authenticated. Please wait a moment and try again.');
      }
      console.log('✅ Current user found:', currentUser.uid);

      // Get business info for the newly created account
      const businesses = await BusinessService.getBusinessesByOwnerId(currentUser.uid);
      if (!businesses || businesses.length === 0) {
        throw new Error('Business account not found');
      }

      const business = businesses[0];
      const txRef = flutterwaveService.generateTxRef('PLAN_UPGRADE_NEW');

      // Ensure we have required parameters with fallbacks
      const customerPhone = business.phone || '08012345678'; // Default fallback phone
      const customerName = business.name || 'Business Owner'; // Default fallback name

      console.log('Initializing payment for new user plan upgrade:', {
        businessId: business.id,
        customerEmail: formData.email,
        customerName,
        customerPhone,
        amount: finalAmount,
        planId: paymentPlan.id,
        discountAmount,
        couponCode
      });

      const paymentResult = await flutterwaveService.initializePayment({
        amount: finalAmount,
        currency: 'NGN',
        customerEmail: formData.email,
        customerName: customerName,
        customerPhone: customerPhone,
        txRef: txRef,
        redirectUrl: `${window.location.origin}/payment/callback?upgrade=true`,
        meta: {
          planId: paymentPlan.id,
          planName: paymentPlan.name,
          email: formData.email,
          existingUser: false,
          userId: currentUser.uid,
          businessId: business.id,
          customerName: customerName,
          customerPhone: customerPhone,
          originalAmount: paymentPlan.yearlyPrice,
          discountAmount: discountAmount,
          couponCode: couponCode || null
        }
      });

      console.log('📊 Payment result:', paymentResult);

      if (paymentResult.status === 'success' && paymentResult.data) {
        const paymentLink = paymentResult.data?.data?.link;
        if (paymentLink) {
          console.log('✅ Redirecting to Flutterwave payment page:', paymentLink);
          // Redirect to Flutterwave payment page
          window.location.href = paymentLink;
        } else {
          console.error('❌ No payment link in response:', paymentResult.data);
          toast.error('Payment link not found. Please try again.');
        }
      } else {
        console.error('❌ Payment initialization failed:', paymentResult);
        toast.error(paymentResult.message || 'Failed to initialize payment');
      }

    } catch (error: any) {
      console.error('❌ Payment error for plan upgrade:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (planId: string) => {
    const authUser = await AuthService.signUp(formData.email, formData.password);
    console.log('✅ Firebase Auth user created:', { uid: authUser.uid, email: authUser.email });
    
    // 2. Create user document in Firestore
    // Check if email should be admin (for testing purposes)
    const isAdminEmail = formData.email.includes('admin@') || formData.email.includes('@admin.');
    const userRole = isAdminEmail ? 'admin' : 'business_owner';
    
    await UserService.createUser({
      uid: authUser.uid,
      email: formData.email,
      displayName: formData.storeName,
      role: userRole
    });
    console.log('✅ User document created in Firestore with role:', userRole);
    
    // Only create business for business owners, not admins
    if (userRole === 'business_owner') {
      // 3. Generate subdomain from store name
      const subdomain = generateSubdomain(formData.storeName);
      console.log('🌐 Generated subdomain:', subdomain);
      
      // Determine currency based on selected country
      const defaultCurrency = getDefaultCurrencyForCountry(formData.country);
      console.log(`💰 Setting currency based on country "${formData.country}": ${defaultCurrency}`);
      
      // Get invite source UID if coupon was applied
      let inviteSourceUid: string | undefined = undefined;
      if (couponCode) {
        try {
          // Import AffiliateService dynamically if needed
          const { AffiliateService } = await import('../../services/affiliate');
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
      const businessData: any = {
        name: formData.storeName,
        subdomain: subdomain,
        ownerId: authUser.uid,
        email: formData.email,
        phone: `${formData.countryCode}${formData.phone}`,
        whatsapp: `${formData.countryCode}${formData.phone}`,
        country: formData.country,
        state: formData.state,
        plan: planId as 'free' | 'business' | 'pro' | 'test',
        status: 'active' as const,
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
      };

      // For free plan, set trial dates (3 days from now)
      if (planId === 'free') {
        const { Timestamp } = await import('firebase/firestore');
        const now = Timestamp.now();
        const trialEndTime = new Date();
        trialEndTime.setDate(trialEndTime.getDate() + 3); // 3 days from now
        businessData.trialStartDate = now;
        businessData.trialEndDate = Timestamp.fromDate(trialEndTime);
        console.log('🎁 Free plan - Trial period set:', {
          start: now.toDate().toISOString(),
          end: trialEndTime.toISOString()
        });
      }

      // Only add inviteSourceUid if it exists
      if (inviteSourceUid) {
        businessData.inviteSourceUid = inviteSourceUid;
      }

      await BusinessService.createBusiness(businessData);
      console.log('✅ Business created successfully');
      
      // Don't navigate here - let handleSubmit handle navigation based on plan
      console.log('🎉 Account creation completed successfully');
    } else {
      // Admin users go to admin panel
      console.log('ℹ️ Skipping business creation for admin user');
      // Don't navigate here - let handleSubmit handle navigation based on plan
      console.log('🎉 Admin account creation completed successfully');
    }
  };

  // OTP helpers
  const triggerSendOtp = async () => {
    try {
      setOtpLoading(true);
      // Use the deployed run.app endpoint (updated after deployment).
      // For Cloud Functions v2 each function has its own run.app host; do not append the function name path.
      const res = await fetch('https://sendotp-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      if (!res.ok) {
        // Try JSON first, then text. Some errors return HTML (404 page) so fall back safely.
        let bodyText: string | null = null;
        try {
          const json = await res.json();
          bodyText = json && (json.error || json.message) ? (json.error || json.message) : JSON.stringify(json);
        } catch (_e) {
          try { bodyText = await res.text(); } catch (_e2) { bodyText = null; }
        }
        // If rate-limited, start a cooldown and surface a user-friendly message
        if (res.status === 429) {
          // Default cooldown is 60 seconds as enforced by the server
          const cooldownSec = 60;
          setOtpCooldown(cooldownSec);
          // start interval to count down
          if (otpCooldownRef.current) clearInterval(otpCooldownRef.current);
          otpCooldownRef.current = setInterval(() => {
            setOtpCooldown(prev => {
              if (prev <= 1) {
                if (otpCooldownRef.current) {
                  clearInterval(otpCooldownRef.current);
                  otpCooldownRef.current = null;
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          // Try to parse server message for toast
          const msg = bodyText || 'OTP recently requested. Please wait a minute before requesting again.';
          // Open modal so user can enter existing OTP if they already received it
          setShowOtpModal(true);
          setOtpCode('');
          toast.error(msg);
          return;
        }

        throw new Error(bodyText || `Failed to send OTP (status ${res.status})`);
      }
      setShowOtpModal(true);
      setOtpCode('');
    } catch (err: any) {
      console.error('sendOtp error:', err);
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (otpCooldownRef.current) {
        window.clearInterval(otpCooldownRef.current);
        otpCooldownRef.current = null;
      }
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
        emailCheckTimeoutRef.current = null;
      }
    };
  }, []);

  const verifyOtpAuto = async (code: string) => {
    if (code.length !== OTP_LENGTH) return;
    try {
      setOtpLoading(true);
      const res = await fetch('https://verifyotp-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code })
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
      // success: close modal and advance to next step
      setShowOtpModal(false);
      setOtpCode('');
      setCurrentStep(prev => prev + 1);
      toast.success('Email verified');
    } catch (err: any) {
      console.error('verifyOtp error:', err);
      toast.error(err.message || 'Invalid code');
    } finally {
      setOtpLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Kemi's Fashion Store"
              value={formData.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              className={`w-full h-12 px-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${
                storeNameExists === true ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
              }`}
            />
            
            {/* Store name checking indicator */}
            {checkingStoreName && (
              <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span className="text-yellow-400 text-sm">Checking store name availability...</span>
                </div>
              </div>
            )}
            
            {/* Existing store message */}
            {storeNameExists === true && !checkingStoreName && (
              <div className="mt-3 p-4 bg-red-900/30 border border-red-600 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span className="text-red-400 text-sm font-medium">Store Already Exists</span>
                </div>
                <p className="text-red-300 text-sm mb-3">
                  A store with this name already exists. Please sign in with your existing account to continue, or choose a different store name.
                </p>
                <Link 
                  to={`/auth/signin${selectedPlanId !== 'free' ? `?plan=${selectedPlanId}${couponCode ? `&coupon=${couponCode}&discount=${discountAmount}` : ''}` : ''}`}
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Sign In to Continue
                </Link>
              </div>
            )}
            
            {/* URL Preview */}
            {formData.storeName && formData.storeName.length >= 4 && storeNameExists === false && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300">
                  Your store URL: <span className="text-blue-400">https://{generateSubdomain(formData.storeName)}.rady.ng</span>
                </p>
              </div>
            )}

            {/* Domain Status */}
            {formData.storeName.length >= 4 && storeNameExists === false && (
              <div className="mt-3">
                <div className={`p-3 rounded-lg border ${
                  domainStatus.checking 
                    ? 'bg-yellow-900/30 border-yellow-600' 
                    : domainStatus.available === true
                    ? 'bg-green-900/30 border-green-600'
                    : domainStatus.available === false
                    ? 'bg-red-900/30 border-red-600'
                    : 'bg-gray-800 border-gray-600'
                }`}>
                  <div className="flex items-center space-x-2">
                    {domainStatus.checking && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                        <span className="text-yellow-400 text-sm">{domainStatus.message}</span>
                      </>
                    )}
                    
                    {domainStatus.available === true && (
                      <>
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 text-sm">✅ {domainStatus.message}</span>
                      </>
                    )}
                    
                    {domainStatus.available === false && (
                      <>
                        <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span className="text-red-400 text-sm">❌ {domainStatus.message}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center w-12 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="email"
                placeholder="kemi@gmail.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full h-12 pl-16 pr-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${
                  emailExists === true ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
                }`}
              />
            </div>
            
            {/* Email checking indicator */}
            {checkingEmail && (
              <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span className="text-yellow-400 text-sm">Checking email availability...</span>
                </div>
              </div>
            )}
            
            {/* Existing account message */}
            {emailExists === true && !checkingEmail && (
              <div className="mt-3 p-4 bg-red-900/30 border border-red-600 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span className="text-red-400 text-sm font-medium">Account Already Exists</span>
                </div>
                <p className="text-red-300 text-sm mb-3">
                  An account with this email address already exists. Please sign in with your existing email and password to continue.
                </p>
                <Link 
                  to={`/auth/signin${selectedPlanId !== 'free' ? `?plan=${selectedPlanId}${couponCode ? `&coupon=${couponCode}&discount=${discountAmount}` : ''}` : ''}`}
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Sign In to Continue
                </Link>
              </div>
            )}
            
            {/* OTP cooldown message */}
            {otpCooldown > 0 && emailExists === false && (
              <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <p className="text-sm text-yellow-400">OTP recently requested. Please wait {otpCooldown} seconds before requesting again.</p>
              </div>
            )}
          </div>
        );

      case 3:
        const passwordMismatch = formData.repeatPassword.length > 0 && formData.password !== formData.repeatPassword;
        return (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center w-12 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a secure password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full h-12 pl-16 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${passwordMismatch ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center w-12 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type={showRepeatPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={formData.repeatPassword}
                onChange={(e) => handleInputChange('repeatPassword', e.target.value)}
                className={`w-full h-12 pl-16 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${passwordMismatch ? 'border-red-500' : ''}`}
                error={passwordMismatch ? 'Passwords do not match' : ''}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowRepeatPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showRepeatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-xs ${passwordMismatch ? 'text-red-500' : 'text-gray-400'}`}>Password must be at least 6 characters long. Both passwords must match.</p>
          </div>
        );

      case 4:
        // Prepare country code options for select
        const countryOptions = Object.entries(COUNTRY_CALLING_CODES).map(([country, code]) => ({
          value: code,
          label: `${country} (${code})`
        }));
        const selectedCountryCode = formData.countryCode || '234';
        return (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-white mb-1 drop-shadow-lg">
              Whatsapp Number
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedCountryCode}
                onChange={e => handleInputChange('countryCode', e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg font-semibold border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {countryOptions.map(opt => (
                  <option key={`${opt.label}-${opt.value}`} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Input
                type="tel"
                placeholder="e.g. 8012345678 (no leading zero)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/^0+/, ''))}
                className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400">Select your country code and enter your Whatsapp number without the first zero.</p>
          </div>
        );

      case 5:
        const isNigeria = formData.country === 'Nigeria';
        
        return (
          <div className="space-y-4">
            <Select
              options={countries.map(country => ({
                value: country.name,
                label: country.name,
                flag: country.flag
              }))}
              value={formData.country}
              onChange={(value) => handleInputChange('country', value)}
              placeholder={loadingCountries ? 'Loading countries...' : 'Select your country'}
              disabled={loadingCountries}
            />
            
            {isNigeria ? (
              <Select
                options={states.map(state => ({
                  value: state.name,
                  label: state.name
                }))}
                value={formData.state}
                onChange={(value) => handleInputChange('state', value)}
                placeholder="Select your state"
                disabled={states.length === 0}
              />
            ) : (
              <Input
                type="text"
                placeholder="Enter your state/province"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Rady.ng Logo" className="h-12 w-12 object-contain bg-white rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Your Store</h1>
          <p className="text-gray-400">Join thousands of successful merchants</p>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full ${
                currentStep >= step.id ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6">
          {/* Step Info */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-400">
              {steps[currentStep - 1].description}
            </p>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-3">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                currentStep === 1 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={
                  !isStepValid(currentStep) || 
                  (currentStep === 1 && (checkingStoreName || storeNameExists === true)) ||
                  (currentStep === 2 && (otpLoading || otpCooldown > 0 || checkingEmail || emailExists === true))
                }
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  isStepValid(currentStep) && 
                  !(currentStep === 1 && (checkingStoreName || storeNameExists === true)) &&
                  !(currentStep === 2 && (otpLoading || otpCooldown > 0 || checkingEmail || emailExists === true))
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid(5) || loading}
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  isStepValid(5) && !loading
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-2">Enter verification code</h3>
            <p className="text-sm text-gray-400 mb-4">We sent a 4-digit code to <span className="font-medium text-white">{formData.email}</span></p>
            <div className="flex items-center space-x-2">
              <input
                autoFocus
                value={otpCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
                  setOtpCode(v);
                  if (v.length === OTP_LENGTH) verifyOtpAuto(v);
                }}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg text-center tracking-widest text-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                placeholder="_ _ _ _"
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                onClick={() => { setShowOtpModal(false); setOtpCode(''); }}
              >
                Cancel
              </button>
              <div className="flex items-center space-x-3">
                <div>
                  {otpLoading ? <div className="text-sm text-gray-300">Verifying...</div> : <div className="text-sm text-gray-400">Auto-verifies when you finish typing</div>}
                </div>
                <div>
                  <button
                    className={`px-3 py-2 rounded-lg font-medium text-sm ${otpCooldown > 0 || otpLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    onClick={() => { if (!otpLoading && otpCooldown === 0) triggerSendOtp(); }}
                    disabled={otpCooldown > 0 || otpLoading}
                  >
                    {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Resend'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};