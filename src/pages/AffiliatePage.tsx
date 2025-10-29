import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, User, Mail, Lock, AtSign, Sparkles, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { AffiliateService } from '../services/affiliate';

interface FormData {
  fullName: string;
  username: string;
  email: string;
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

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check username availability when username field changes
    if (field === 'username') {
      checkUsernameAvailability(value);
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

  const isFormValid = (): boolean => {
    const { fullName, username, email, password, confirmPassword } = formData;

    return (
      fullName.trim().length >= 2 &&
      username.length >= 3 &&
      usernameAvailable === true &&
      email.includes('@') &&
      email.includes('.') &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) return;

    setLoading(true);

    try {
      console.log('🔗 Creating affiliate account...');

      // Create affiliate account
      await AffiliateService.createAffiliate({
        fullName: formData.fullName.trim(),
        username: formData.username.toLowerCase(),
        email: formData.email.toLowerCase(),
        password: formData.password
      });

      console.log('✅ Affiliate account created successfully');

      toast.success('Affiliate account created! Welcome to our affiliate program.');

      // Redirect to affiliate dashboard
      setTimeout(() => {
        navigate('/affiliate/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Affiliate registration error:', error);

      if (error.code === 'permission-denied') {
        toast.error('Unable to create affiliate account. Please try again.');
      } else if (error.message?.includes('username')) {
        toast.error('Username is already taken. Please choose a different one.');
        setUsernameAvailable(false);
      } else if (error.message?.includes('email')) {
        toast.error('Email is already registered. Please use a different email.');
      } else {
        toast.error(error.message || 'Failed to create affiliate account');
      }
    } finally {
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <User className="h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full h-14 pl-16 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50"
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <AtSign className="h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                  className={`w-full h-14 pl-16 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50 ${
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Mail className="h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                </div>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full h-14 pl-16 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-400" />
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Lock className="h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full h-14 pl-16 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-400 transition-colors duration-300 rounded-lg hover:bg-purple-500/10"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-400" />
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Lock className="h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-300" />
                  </div>
                </div>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full h-14 pl-16 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 group-hover:border-purple-300/50 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-400/50 focus:border-red-400'
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-400 transition-colors duration-300 rounded-lg hover:bg-purple-500/10"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`w-full h-14 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                isFormValid() && !loading
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
              to="/affiliate/dashboard"
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