import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { FirebaseTest } from '../../utils/firebaseTest';
import logo from '../../assets/logo.png';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('🔐 Attempting to sign in with:', { email: formData.email });
    
    try {
      // Sign in with Firebase Auth
      const authUser = await AuthService.signIn(formData.email, formData.password);
      console.log('✅ Successfully signed in:', { uid: authUser.uid, email: authUser.email });
      
      // Get user role from Firestore
      const userData = await UserService.getUserById(authUser.uid);
      console.log('👤 User data retrieved:', userData);
      
      if (!userData) {
        throw new Error('User data not found. Please contact support.');
      }
      
      // Update last login
      await UserService.updateLastLogin(authUser.uid);
      
      // Route based on user role
      let redirectPath = '/dashboard'; // default for business owners
      let welcomeMessage = 'Welcome back!';
      
      switch (userData.role) {
        case 'admin':
          redirectPath = '/admin';
          welcomeMessage = 'Welcome back, Admin!';
          break;
        case 'business_owner':
          redirectPath = '/dashboard';
          welcomeMessage = 'Welcome back to your store!';
          break;
        case 'customer':
          // Customers should be redirected to their account page or back to store
          redirectPath = '/';
          welcomeMessage = 'Welcome back!';
          break;
        default:
          // Default to dashboard for unknown roles
          redirectPath = '/dashboard';
          welcomeMessage = 'Welcome back!';
      }
      
      console.log('🚀 Redirecting to:', redirectPath, 'for role:', userData.role);
      
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
              <img src={logo} alt="Trady.ng Logo" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-white">trady.ng</span>
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
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold shadow-lg"
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
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold shadow-lg"
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
                <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Signing In...
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
    </div>
  );
};