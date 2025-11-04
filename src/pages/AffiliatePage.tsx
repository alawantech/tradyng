import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, User, Mail, Lock, AtSign, Sparkles, DollarSign, Users, TrendingUp, Shield, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { AffiliateService } from '../services/affiliate';

interface FormData {
  fullName: string;
  username: string;
  email: string;
  whatsappNumber: string;
  password: string;
  confirmPassword: string;
}

export const AffiliatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  // OTP verification states
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check username availability when username field changes
    if (field === 'username') {
      checkUsernameAvailability(value);
    }

    // Check email existence when email field changes
    if (field === 'email') {
      checkEmailExists(value);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Username validation: no spaces, alphanumeric only
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await AffiliateService.checkUsernameAvailability(username.toLowerCase());
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailExists(null);
      return;
    }

    setCheckingEmail(true);
    try {
      // Import AuthService for email checking
      const { AuthService } = await import('../services/auth');
      const exists = await AuthService.checkEmailExists(email);
      setEmailExists(exists);
    } catch (error) {
      console.error('Error checking email existence:', error);
      setEmailExists(false); // Allow registration if check fails
    } finally {
      setCheckingEmail(false);
    }
  };

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Send OTP to email
  const sendOtpCode = async () => {
    if (!formData.email || sendingOtp) return;

    setSendingOtp(true);
    try {
      const res = await fetch('https://us-central1-tradyng-51655.cloudfunctions.net/sendOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          businessName: 'Rady.ng - Affiliate Program'
        })
      });

      if (!res.ok) {
        let errorMessage = 'Failed to send OTP';
        try {
          const json = await res.json();
          errorMessage = json.error || json.message || errorMessage;
        } catch (e) {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      setOtpSent(true);
      setResendTimer(60); // 60 seconds cooldown
      toast.success('OTP sent to your email! Please check your inbox.');
    } catch (error) {
      console.error('Error sending OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP code
  const verifyOtpCode = async () => {
    if (!otpCode || otpCode.length !== 4 || verifyingOtp) return;

    setVerifyingOtp(true);
    try {
      const res = await fetch('https://us-central1-tradyng-51655.cloudfunctions.net/verifyOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          code: otpCode
        })
      });

      if (!res.ok) {
        let errorMessage = 'Invalid OTP code';
        try {
          const json = await res.json();
          errorMessage = json.error || json.message || errorMessage;
        } catch (e) {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      if (result.ok) {
        setOtpVerified(true);
        toast.success('Email verified successfully!');
        // Move to password step
        setShowOtpStep(false);
      } else {
        toast.error('Invalid OTP code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP code. Please try again.';
      toast.error(errorMessage);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Proceed to OTP verification step
  const proceedToOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before sending OTP
    if (!formData.fullName || !formData.username || !formData.email || !formData.whatsappNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.whatsappNumber.trim().length < 10) {
      toast.error('Please enter a valid WhatsApp number');
      return;
    }

    if (usernameAvailable !== true) {
      toast.error('Please choose an available username');
      return;
    }

    if (emailExists === true) {
      toast.error('This email is already registered');
      return;
    }

    setShowOtpStep(true);
    // Send OTP immediately when entering OTP step
    await sendOtpCode();
  };

  const isFormValid = (): boolean => {
    const { fullName, username, email, whatsappNumber, password, confirmPassword } = formData;

    return (
      fullName.trim().length >= 2 &&
      username.length >= 3 &&
      usernameAvailable === true &&
      email.includes('@') &&
      email.includes('.') &&
      emailExists === false &&
      whatsappNumber.trim().length >= 10 && // Validate WhatsApp number
      otpVerified === true && // Require OTP verification
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified) {
      toast.error('Please verify your email with OTP first');
      return;
    }

    if (!isFormValid() || loading) return; // Prevent double submission

    setLoading(true);

    try {
      console.log('🔗 Creating affiliate account...');

      // Create affiliate account
      await AffiliateService.createAffiliate({
        fullName: formData.fullName.trim(),
        username: formData.username.toLowerCase(),
        email: formData.email.toLowerCase(),
        whatsappNumber: formData.whatsappNumber.trim(),
        password: formData.password
      });

      console.log('✅ Affiliate account created successfully');

      toast.success('Affiliate account created! Welcome to our affiliate program.');

      // Redirect to affiliate dashboard
      setTimeout(() => {
        navigate('/affiliate/dashboard');
      }, 1500);

    } catch (error: unknown) {
      console.error('Affiliate registration error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to create affiliate account';
      const errorCode = (error as { code?: string })?.code;

      if (errorCode === 'permission-denied') {
        toast.error('Unable to create affiliate account. Please try again.');
      } else if (errorMessage?.includes('username')) {
        toast.error('Username is already taken. Please choose a different one.');
        setUsernameAvailable(false);
      } else if (errorMessage?.includes('email')) {
        toast.error('Email is already registered. Please use a different email.');
        setEmailExists(true);
      } else {
        toast.error(errorMessage);
      }
      
      // Reset loading state on error to allow retry
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 flex items-center justify-center mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-2xl shadow-purple-500/25">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-3">
            Join Our Affiliate Program
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Turn your network into income. Earn commissions by helping businesses grow.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-3xl"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Full Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <User className="h-4 w-4 text-purple-400" />
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                  <User className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50"
                  required
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <AtSign className="h-4 w-4 text-purple-400" />
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                  <AtSign className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                  className={`w-full h-14 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50 ${
                    usernameAvailable === false ? 'border-red-400/50 focus:border-red-400' :
                    usernameAvailable === true ? 'border-green-400/50 focus:border-green-400' :
                    'border-white/20 focus:border-purple-400'
                  }`}
                  required
                />
              </div>

              {/* Username availability indicator */}
              {formData.username && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  {checkingUsername && (
                    <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      <span>Checking availability...</span>
                    </div>
                  )}

                  {usernameAvailable === true && !checkingUsername && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <Check className="h-4 w-4" />
                      <span>Perfect! This username is available</span>
                    </div>
                  )}

                  {usernameAvailable === false && !checkingUsername && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                      <span>⚠️ Username unavailable or invalid (use letters & numbers only)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-400" />
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                </div>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full h-14 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50 ${
                    emailExists === true ? 'border-red-400/50 focus:border-red-400' : 'border-white/20 focus:border-purple-400'
                  }`}
                  required
                />
              </div>

              {/* Email validation indicator */}
              {formData.email && formData.email.includes('@') && formData.email.includes('.') && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  {checkingEmail && (
                    <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      <span>Checking email availability...</span>
                    </div>
                  )}

                  {emailExists === true && !checkingEmail && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                      <span>⚠️ This email is already registered. Please use a different email or sign in to your existing account.</span>
                    </div>
                  )}

                  {emailExists === false && !checkingEmail && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <Check className="h-4 w-4" />
                      <span>Email is available</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* WhatsApp Number Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-400" />
                WhatsApp Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                  <MessageCircle className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                </div>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 pl-1">We'll use this for withdrawal notifications and support</p>

              {/* Verify Email Button */}
              {!otpVerified && emailExists === false && formData.email && formData.fullName && formData.username && formData.whatsappNumber && usernameAvailable === true && (
                <button
                  type="button"
                  onClick={proceedToOtpStep}
                  disabled={sendingOtp}
                  className="mt-3 w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingOtp ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Verify Email with OTP</span>
                    </>
                  )}
                </button>
              )}

              {/* OTP Verification Success Indicator */}
              {otpVerified && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-400/50">
                  <div className="flex items-center space-x-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    <span>Email verified! You can now set your password.</span>
                  </div>
                </div>
              )}
            </div>

            {/* OTP Modal/Step */}
            {showOtpStep && !otpVerified && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full">
                  <div className="text-center mb-6">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-2xl">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
                    <p className="text-gray-300">
                      We've sent a 4-digit code to<br />
                      <span className="text-purple-400 font-semibold">{formData.email}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-200">Enter OTP Code</label>
                      <input
                        type="text"
                        placeholder="0000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        className="w-full h-14 px-4 bg-white/5 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={verifyOtpCode}
                      disabled={otpCode.length !== 4 || verifyingOtp}
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {verifyingOtp ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify OTP</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => setShowOtpStep(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={sendOtpCode}
                        disabled={resendTimer > 0 || sendingOtp}
                        className="text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Password Field - Only show after OTP verification */}
            {otpVerified && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-400 transition-colors duration-300 rounded-lg hover:bg-purple-500/10 z-10"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field - Only show after OTP verification */}
            {otpVerified && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full h-14 pl-12 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-400/50 focus:border-red-400'
                        : 'border-white/20 focus:border-purple-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-400 transition-colors duration-300 rounded-lg hover:bg-purple-500/10 z-10"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <span>⚠️</span>
                      Passwords do not match
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid() || loading || checkingUsername || checkingEmail}
              className={`w-full h-14 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                isFormValid() && !loading && !checkingUsername && !checkingEmail
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating Your Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>Start Earning Commissions</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Benefits Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Why Join Our Program?</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span>Earn ₦2,000 commission per Business Plan referral</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Users className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Earn ₦4,000 commission per Pro Plan referral</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <span>Commissions paid only after successful payment completion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400">
            Already part of our affiliate family?{' '}
            <Link
              to="/auth/signin?redirect=/affiliate/dashboard"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-300 hover:underline"
            >
              Access Your Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};