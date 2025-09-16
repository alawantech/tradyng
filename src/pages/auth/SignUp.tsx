import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { BusinessService } from '../../services/business';

interface FormData {
  storeName: string;
  email: string;
  password: string;
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
  { id: 4, title: 'Location', description: 'Where is your business?' }
];

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    email: '',
    password: '',
    country: '',
    state: ''
  });

  const [domainStatus, setDomainStatus] = useState<DomainStatus>({
    checking: false,
    available: null,
    message: ''
  });

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
          message: `${subdomain}.trady.ng is already taken`
        });
      } else {
        setDomainStatus({
          checking: false,
          available: true,
          message: `${subdomain}.trady.ng is available!`
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
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.storeName.length >= 4 && domainStatus.available === true;
      case 2:
        return formData.email.includes('@') && formData.email.includes('.');
      case 3:
        return formData.password.length >= 6;
      case 4:
        return formData.country.trim() !== '' && formData.state.trim() !== '';
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid(4)) return;
    
    setLoading(true);
    
    try {
      // 1. Create Firebase Auth user
      const authUser = await AuthService.signUp(formData.email, formData.password);
      
      // 2. Create user document in Firestore
      await UserService.createUser({
        uid: authUser.uid,
        email: formData.email,
        displayName: formData.storeName,
        role: 'business_owner'
      });
      
      // 3. Generate subdomain from store name
      const subdomain = generateSubdomain(formData.storeName);
      
      // 4. Create business document
      await BusinessService.createBusiness({
        name: formData.storeName,
        subdomain: subdomain,
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your store name"
              value={formData.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            
            {/* URL Preview */}
            {formData.storeName && formData.storeName.length >= 4 && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300">
                  Your store URL: <span className="text-blue-400">https://{generateSubdomain(formData.storeName)}.trady.ng</span>
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
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">Password must be at least 6 characters long</p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Input
              type="text"
              placeholder="State/Province"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="w-full h-12 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
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
          <div className="mx-auto h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-white" />
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

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  isStepValid(currentStep)
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
                disabled={!isStepValid(4) || loading}
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  isStepValid(4) && !loading
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
            <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};