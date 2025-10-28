import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
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
  const otpCooldownRef = React.useRef<number | null>(null);
  const OTP_LENGTH = 4;

  // Email validation state
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Plan selection from URL params
  const selectedPlanId = searchParams.get('plan') || 'free';
  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[0];
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
      // Debounce the email check
      const timeoutId = setTimeout(() => {
        checkEmailExists(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.storeName.length >= 4 && domainStatus.available === true;
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
    
    try {
      // Always create account first with free plan
      await createAccount('free');
      
      // If user selected a paid plan, redirect to payment for upgrading
      if (selectedPlan.id !== 'free') {
        console.log('💳 Redirecting to payment for plan upgrade:', selectedPlan.id);
        toast.success('Account created! Redirecting to payment...');
        setTimeout(() => {
          handlePlanUpgrade();
        }, 1500); // Small delay to let account creation complete
        return;
      } else {
        // For free plan, go directly to dashboard
        console.log('✅ Free account created, redirecting to dashboard');
        toast.success('Account created successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check if email already exists - might be incomplete signup
      if (error.message?.includes('email-already-in-use') || error.message?.includes('already exists')) {
        console.log('📧 Email already exists, checking for incomplete signup...');
        
        try {
          const existingUser = await checkExistingIncompleteSignup(formData.email);
          if (existingUser) {
            console.log('✅ Found existing account with free plan, redirecting to payment');
            
            // Redirect to payment for the selected plan without creating account again
            setTimeout(() => {
              handleExistingUserPayment(existingUser.uid);
            }, 500);
            return;
          }
        } catch (checkError) {
          console.error('Error checking existing signup:', checkError);
        }
      }
      
      // Show original error if not an incomplete signup
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
      setEmailExists(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const users = await UserService.getUsersByEmail(email);
      const exists = users && users.length > 0;
      setEmailExists(exists);
      console.log('Email check result:', { email, exists });
    } catch (error) {
      console.error('Error checking email existence:', error);
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleExistingUserPayment = async (userId: string) => {
    setIsProcessingPayment(true);

    try {
      // Validate required data
      if (!formData.email) {
        throw new Error('Email is required for payment');
      }

      // Default to business plan if no valid paid plan is selected
      let paymentPlan = selectedPlan;
      if (!paymentPlan || !paymentPlan.yearlyPrice || paymentPlan.yearlyPrice === 0) {
        paymentPlan = PRICING_PLANS.find(plan => plan.id === 'business');
        if (!paymentPlan) {
          throw new Error('Business plan not found');
        }
      }

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
        amount: paymentPlan.yearlyPrice,
        planId: paymentPlan.id
      });

      const paymentResult = await flutterwaveService.initializePayment({
        amount: paymentPlan.yearlyPrice,
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
      setLoading(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };  const createAccount = async (planId: string) => {
    // 1. Create Firebase Auth user
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
      
      // 4. Create business document
      await BusinessService.createBusiness({
        name: formData.storeName,
        subdomain: subdomain,
        ownerId: authUser.uid,
        email: formData.email,
        phone: `${formData.countryCode}${formData.phone}`,
        whatsapp: `${formData.countryCode}${formData.phone}`,
        country: formData.country,
        state: formData.state,
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
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            
            {/* URL Preview */}
            {formData.storeName && formData.storeName.length >= 4 && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300">
                  Your store URL: <span className="text-blue-400">https://{generateSubdomain(formData.storeName)}.rady.ng</span>
                </p>
              </div>
            )}

            {/* Domain Status */}
            {formData.storeName.length >= 4 && (
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
            <Input
              type="email"
              placeholder="kemi@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full h-12 px-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${
                emailExists === true ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
              }`}
            />
            
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
                  to="/auth/signin" 
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
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a secure password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none pr-10 ${passwordMismatch ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showRepeatPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={formData.repeatPassword}
                onChange={(e) => handleInputChange('repeatPassword', e.target.value)}
                className={`w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none pr-10 ${passwordMismatch ? 'border-red-500' : ''}`}
                error={passwordMismatch ? 'Passwords do not match' : ''}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
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
                  (currentStep === 2 && (otpLoading || otpCooldown > 0 || checkingEmail || emailExists === true))
                }
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  isStepValid(currentStep) && !(currentStep === 2 && (otpLoading || otpCooldown > 0 || checkingEmail || emailExists === true))
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