import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AuthService } from '../services/auth';

export const TrialExpired: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="p-8 md:p-12 shadow-2xl border-0">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Free Trial Has Ended
            </h1>
            <p className="text-lg text-gray-600">
              Your 3-day free trial has expired. Upgrade now to continue using your store!
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Clock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">What happens now?</h3>
                <ul className="space-y-2 text-amber-800">
                  <li>• Your store is currently <strong>suspended</strong></li>
                  <li>• Customers cannot access your storefront</li>
                  <li>• Your products and data are safe for 24 hours</li>
                  <li>• After 24 hours, all data will be <strong>permanently deleted</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits of Upgrading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Continue Growing Your Business
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Keep Your Store Active</h3>
                  <p className="text-sm text-gray-600">Your storefront will remain online 24/7</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Unlimited Orders</h3>
                  <p className="text-sm text-gray-600">No restrictions on sales volume</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">All Your Data Preserved</h3>
                  <p className="text-sm text-gray-600">Products, customers, and orders stay safe</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Priority Support</h3>
                  <p className="text-sm text-gray-600">Get help when you need it</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Business Plan */}
            <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Plan</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">₦16,000</span>
                <span className="text-gray-600">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  150 products
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  Unlimited orders
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  5GB storage
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  Custom domain
                </li>
              </ul>
              <Link to="/pricing" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Choose Business Plan
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-gray-300 rounded-xl p-6 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">₦32,000</span>
                <span className="text-gray-600">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                  300 products
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                  Unlimited orders
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                  10GB storage
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                  API access
                </li>
              </ul>
              <Link to="/pricing" className="w-full">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Choose Pro Plan
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Sign Out Option */}
          <div className="text-center pt-6 border-t">
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6 text-gray-600">
          <p className="text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@tradyng.com" className="text-blue-600 hover:underline">
              support@tradyng.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
