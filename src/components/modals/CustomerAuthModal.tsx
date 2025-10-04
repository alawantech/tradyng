import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, User, Mail, Lock, ShoppingBag, Heart, Star, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useStore } from '../../pages/storefront/StorefrontLayout';
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
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        await signUp(formData.email, formData.password, formData.displayName);
        toast.success(`Welcome to ${business?.name || 'our store'}! 🎉`);
      } else {
        await signIn(formData.email, formData.password);
        toast.success(`Welcome back to ${business?.name || 'our store'}! 🛍️`);
      }
      
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        toast.error(
          `This email is already registered! Try signing in instead.`,
          {
            duration: 5000,
            icon: '👋',
          }
        );
        // Automatically switch to sign-in mode
        setTimeout(() => {
          setMode('signin');
          // Keep the email but clear other fields
          setFormData(prev => ({
            email: prev.email,
            password: '',
            displayName: '',
            confirmPassword: '',
          }));
        }, 2000);
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-not-found') {
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
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8"
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
                  {mode === 'signin' ? 'Welcome Back!' : 'Join Our Community'}
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

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Email already exists notice */}
                {mode === 'signup' && formData.email && (
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
                          signing in instead
                        </button>
                        .
                      </p>
                    </div>
                  </motion.div>
                )}
                {mode === 'signup' && (
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
                )}

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
                      placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters long
                    </p>
                  )}
                  {mode === 'signin' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={() => {
                          toast.error('Password reset feature coming soon!', {
                            icon: '🔄',
                          });
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'signup' && (
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
                )}

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
                        <span className="animate-pulse">{mode === 'signin' ? 'Signing you in...' : 'Creating your account...'}</span>
                      </div>
                    ) : (
                      <span className="relative z-10">
                        {mode === 'signin' ? `Continue to ${storeName}` : `Join ${storeName}`}
                      </span>
                    )}
                  </button>
                </motion.div>
              </motion.form>

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
                    {mode === 'signin' ? 'Create your account' : 'Sign in instead'}
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
    </AnimatePresence>
  );
};