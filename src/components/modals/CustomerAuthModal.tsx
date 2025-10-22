import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, User, Mail, Lock, ShoppingBag, Heart, Star, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useStore } from '../../pages/storefront/StorefrontLayout';
// OTP service for email verification
import { OTPService } from '../../services/otpService';
import toast from 'react-hot-toast';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp } = useCustomerAuth();
  const { business } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP verification state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });

  // Sync mode with initialMode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetForm();
    }
  }, [isOpen, initialMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    // Reset OTP state
    setOtp('');
    setOtpModalOpen(false);
    setOtpLoading(false);
    setOtpCooldown(0);
    setOtpError('');
  };

  // Simple handler for forgot-password since email/OTP flows were removed.
  const handleForgotPassword = () => {
    toast('Password reset is not available in this build. Please contact support for help.');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password, () => {
        // Success callback - redirect to homepage
        toast.success(`Welcome back to ${business?.name || 'our store'}! 🛍️`);
        resetForm();
        onClose();
        navigate('/');
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password. Please check your credentials.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Basic validation
    if (!formData.email || !formData.password || !formData.displayName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP instead of creating account directly
      const otpResult = await OTPService.sendOTP(formData.email);

      if (otpResult.success) {
        toast.success(otpResult.message);
        setOtpModalOpen(true);
        // Start cooldown timer for resend
        setOtpCooldown(120); // 2 minutes
        const cooldownInterval = setInterval(() => {
          setOtpCooldown(prev => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(otpResult.message);
      }
    } catch (error: any) {
      console.error('OTP sending error:', error);
      toast.error('Error sending verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAndCreateAccount = async (otpCode: string) => {
    setOtpLoading(true);
    setOtpError('');

    try {
      const verifyResult = await OTPService.verifyOTP(formData.email, otpCode);

      if (verifyResult.valid) {
        // OTP verified, now create the account
        await signUp(
          formData.email,
          formData.password,
          formData.displayName,
          () => {
            toast.success(`Welcome to ${business?.name || 'our store'}! 🎉`);
            resetForm();
            onClose();
            navigate('/');
          }
        );
      } else {
        setOtpError(verifyResult.message);
        toast.error(verifyResult.message);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = 'Error verifying code. Please try again.';
      setOtpError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpCooldown > 0) return;

    setOtpLoading(true);
    try {
      const resendResult = await OTPService.sendOTP(formData.email);

      if (resendResult.success) {
        toast.success(resendResult.message);
        setOtpCooldown(120); // Reset cooldown
        const cooldownInterval = setInterval(() => {
          setOtpCooldown(prev => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(resendResult.message);
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error('Error resending code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP and email-based password reset removed.

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (!isOpen) return null;

  const primaryColor = business?.settings?.primaryColor || '#3B82F6';
  const storeName = business?.name || 'Store';
  const storeDescription = business?.description || 'Your premium shopping destination';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm auth-modal-backdrop"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient header */}
            <div 
              className="h-32 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 50%, ${primaryColor}99 100%)`
              }}
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-2 border-white/30 floating-orb-1"></div>
                <div className="absolute top-8 right-8 w-16 h-16 rounded-full border-2 border-white/20 floating-orb-2"></div>
                <div className="absolute bottom-4 left-1/2 w-12 h-12 rounded-full border-2 border-white/25 floating-orb-3"></div>
              </div>
              
              {/* Store branding */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                {business?.logo ? (
                  <motion.img 
                    src={business.logo} 
                    alt={storeName}
                    className="h-12 w-12 object-contain mb-2 rounded-lg bg-white/20 p-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  />
                ) : (
                  <motion.div
                    className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </motion.div>
                )}
                <motion.h3 
                  className="text-lg font-bold text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {storeName}
                </motion.h3>
                <motion.p 
                  className="text-xs text-white/80 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {storeDescription}
                </motion.p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Header */}
              <motion.div 
                className="mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {mode === 'signin' ? 'Login' : 'Register'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'signin' 
                    ? `Continue your shopping journey at ${storeName}`
                    : `Create your account and unlock exclusive benefits`
                  }
                </p>
              </motion.div>

              {/* Benefits section for signup */}
              {mode === 'signup' && (
                <motion.div 
                  className="mb-6 grid grid-cols-2 gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                      <Heart className="h-3 w-3" style={{ color: primaryColor }} />
                    </div>
                    <span>Save favorites</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                      <Star className="h-3 w-3" style={{ color: primaryColor }} />
                    </div>
                    <span>Exclusive offers</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                      <ShoppingBag className="h-3 w-3" style={{ color: primaryColor }} />
                    </div>
                    <span>Order tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                      <Shield className="h-3 w-3" style={{ color: primaryColor }} />
                    </div>
                    <span>Secure checkout</span>
                  </div>
                </motion.div>
              )}

              {/* SIGN IN FORM */}
              {mode === 'signin' && (
                <motion.form 
                  onSubmit={handleSignIn} 
                  className="space-y-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white auth-input"
                        style={{ 
                          '--tw-ring-color': primaryColor 
                        } as React.CSSProperties}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white auth-input"
                        style={{ 
                          '--tw-ring-color': primaryColor 
                        } as React.CSSProperties}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={handleForgotPassword}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl auth-button shimmer-effect"
                      style={{ 
                        backgroundColor: primaryColor,
                        '--tw-ring-color': `${primaryColor}50`
                      } as React.CSSProperties}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="relative">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <div className="absolute inset-0 border-2 border-transparent border-t-white/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                          </div>
                          <span className="animate-pulse">Signing you in...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">Continue to {storeName}</span>
                      )}
                    </button>
                  </motion.div>
                </motion.form>
              )}

              {/* SIGN UP FORM */}
              {mode === 'signup' && (
                <motion.form 
                  onSubmit={handleSignUp} 
                  className="space-y-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Email already exists notice */}
                  {formData.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3"
                    >
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-blue-800 font-medium">Already have an account?</p>
                        <p className="text-blue-600">
                          If you've shopped with {storeName} before, try{' '}
                          <button
                            type="button"
                            onClick={() => setMode('signin')}
                            className="underline font-medium hover:text-blue-800"
                          >
                            logging in instead
                          </button>
                          .
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="displayName"
                        required
                        value={formData.displayName}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white auth-input"
                        style={{ 
                          '--tw-ring-color': primaryColor 
                        } as React.CSSProperties}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </motion.div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white auth-input"
                        style={{ 
                          '--tw-ring-color': primaryColor 
                        } as React.CSSProperties}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white auth-input"
                        style={{ 
                          '--tw-ring-color': primaryColor 
                        } as React.CSSProperties}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white auth-input"
                        style={{ 
                          '--tw-ring-color': primaryColor 
                        } as React.CSSProperties}
                        placeholder="Confirm your password"
                      />
                    </div>
                  </motion.div>

                  {/* Create Account Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl auth-button shimmer-effect"
                      style={{ 
                        backgroundColor: primaryColor,
                        '--tw-ring-color': `${primaryColor}50`
                      } as React.CSSProperties}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="relative">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <div className="absolute inset-0 border-2 border-transparent border-t-white/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                          </div>
                          <span className="animate-pulse">Creating your account...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">Join {storeName}</span>
                      )}
                    </button>
                  </motion.div>
                </motion.form>
              )}

              {/* Mode Switch */}
              <motion.div 
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                  <p className="text-sm text-gray-600">
                    {mode === 'signin' ? "New to " + storeName + "? " : "Already shopping with us? "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="font-semibold hover:underline transition-colors"
                      style={{ color: primaryColor }}
                    >
                      {mode === 'signin' ? 'Register now' : 'Login instead'}
                    </button>
                  </p>
                </motion.div>

              {/* Trust indicators */}
              <motion.div 
                className="mt-6 pt-6 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Secure & Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>Trusted by thousands</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Email/OTP modals removed on purpose (password reset & OTP flows disabled) */}
      
      {/* OTP Verification Modal */}
      <AnimatePresence>
        {otpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setOtpModalOpen(false)}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Verify Your Email
                    </h3>
                    <button
                      onClick={() => setOtpModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    We sent a 4-digit code to <strong>{formData.email}</strong>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="p-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Enter verification code
                    </label>
                    
                    {/* OTP Input Fields */}
                    <div className="flex justify-center space-x-3">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={otp[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            const newOtp = otp.split('');
                            newOtp[index] = value;
                            const updatedOtp = newOtp.join('');
                            setOtp(updatedOtp);
                            
                            // Auto-advance to next input
                            if (value && index < 3) {
                              const nextInput = document.getElementById(`otp-${index + 1}`);
                              nextInput?.focus();
                            }
                            
                            // Auto-verify when complete
                            if (updatedOtp.length === 4) {
                              verifyOtpAndCreateAccount(updatedOtp);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otp[index] && index > 0) {
                              const prevInput = document.getElementById(`otp-${index - 1}`);
                              prevInput?.focus();
                            }
                          }}
                          id={`otp-${index}`}
                          className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                          style={{ 
                            '--tw-ring-color': primaryColor 
                          } as React.CSSProperties}
                          disabled={otpLoading}
                        />
                      ))}
                    </div>

                    {/* Error Message */}
                    {otpError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 text-center"
                      >
                        {otpError}
                      </motion.div>
                    )}

                    {/* Loading State */}
                    {otpLoading && (
                      <div className="text-center">
                        <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
                          <span>Verifying code...</span>
                        </div>
                      </div>
                    )}

                    {/* Resend Button */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={otpLoading || otpCooldown > 0}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {otpCooldown > 0 
                          ? `Resend code in ${Math.floor(otpCooldown / 60)}:${(otpCooldown % 60).toString().padStart(2, '0')}`
                          : 'Resend code'
                        }
                      </button>
                    </div>

                    {/* Cancel Button */}
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={() => setOtpModalOpen(false)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={otpLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};