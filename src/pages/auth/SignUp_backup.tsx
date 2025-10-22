import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { BusinessService } from '../../services/business';
import { Timestamp } from 'firebase/firestore';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    subdomain: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Create Firebase Auth user
      const authUser = await AuthService.signUp(formData.email, formData.password);
      
      // 2. Create user document in Firestore
      await UserService.createUser({
        uid: authUser.uid,
        email: formData.email,
        displayName: formData.name,
        role: 'business_owner'
      });
      
      // 3. Check if subdomain is available
      const existingBusiness = await BusinessService.getBusinessBySubdomain(formData.subdomain.toLowerCase());
      if (existingBusiness) {
        throw new Error('Subdomain already taken. Please choose a different one.');
      }
      
      // 4. Create business document
      await BusinessService.createBusiness({
        name: formData.businessName,
        subdomain: formData.subdomain.toLowerCase(),
        ownerId: authUser.uid,
        email: formData.email,
        plan: 'free',
        status: 'active',
        settings: {
          currency: 'USD',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          enableNotifications: true
        },
        revenue: 0,
        totalOrders: 0,
        totalProducts: 0
      });
      
      toast.success('Account and store created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">rady.ng</span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Store</h2>
            <p className="text-gray-600">Start your e-commerce journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Adebayo Ogundimu"
              className="pl-10"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="adebayo@gmail.com"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />

            <Input
              label="Business Name"
              name="businessName"
              type="text"
              required
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Adebayo's Fashion Store"
            />

            <Input
              label="Store Subdomain"
              name="subdomain"
              type="text"
              required
              value={formData.subdomain}
              onChange={handleChange}
              placeholder="adebayofashion"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your store will be available at: {formData.subdomain || 'yourstore'}.rady.ng
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/auth/signin" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};