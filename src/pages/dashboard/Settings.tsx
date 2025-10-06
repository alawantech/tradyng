import React, { useState, useEffect } from 'react';
import { Save, Upload, Globe, Palette, Bell, Store, ExternalLink, Check, AlertCircle, Loader } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { BusinessService } from '../../services/business';
import { CustomDomainService } from '../../services/customDomain';
import { CURRENCIES, DEFAULT_CURRENCY, getDefaultCurrencyForCountry } from '../../constants/currencies';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, business, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [originalSubdomain, setOriginalSubdomain] = useState('');
  const [storeData, setStoreData] = useState({
    storeName: '',
    subdomain: '',
    customDomain: '',
    description: '',
    whatsappNumber: '',
    address: '',
    country: '',
    state: '',
    currency: DEFAULT_CURRENCY
  });

  const [brandingSettings, setBrandingSettings] = useState({
    logo: '',
    storeBackgroundColor: '#1c1c1e', // Soft Black as default
    heroStyle: 'modern' // Modern Black as default
  });
  const [logoUpdated, setLogoUpdated] = useState(false); // Track if logo has been explicitly updated

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain === originalSubdomain) {
      setSubdomainAvailable(null);
      return;
    }

    if (!validateSubdomain(subdomain).isValid) {
      setSubdomainAvailable(false);
      return;
    }

    setCheckingSubdomain(true);
    setSubdomainAvailable(null);

    try {
      const existingBusiness = await BusinessService.getBusinessBySubdomain(subdomain);
      const isAvailable = !existingBusiness || existingBusiness.id === business?.id;
      setSubdomainAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      setSubdomainAvailable(false);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  // Debounced subdomain checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (storeData.subdomain && storeData.subdomain !== originalSubdomain) {
        checkSubdomainAvailability(storeData.subdomain);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [storeData.subdomain, originalSubdomain]);

  // Nigerian states list (same as signup)
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  // List of countries (same as signup)
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia',
    'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
    'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
    'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
    'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany',
    'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
    'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
    'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
    'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
    'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
    'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
    'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
    'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
    'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
    'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
    'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  // Load business data when business is available
  useEffect(() => {
    console.log('🔍 Settings useEffect triggered');
    console.log('📊 Raw business object:', business);
    
    if (business) {
      console.log('📊 Loading business data from Firebase:', {
        id: business.id,
        name: business.name,
        subdomain: business.subdomain, // ← This is the actual subdomain from database
        email: business.email,
        phone: business.phone,
        country: business.country,
        state: business.state
      });
      
      const defaultDescription = `Discover amazing products from ${business.name}. Quality guaranteed, fast shipping.`;
      
      const newStoreData = {
        storeName: business.name || '',
        subdomain: business.subdomain || '', // ← Loading actual subdomain
        customDomain: business.customDomain || '',
        description: business.description || defaultDescription,
        whatsappNumber: business.phone || '', // Using phone field for WhatsApp number
        address: business.address || '',
        country: business.country || 'Nigeria',
        state: business.state || '',
        currency: business.settings?.currency || DEFAULT_CURRENCY
      };
      
      console.log('📝 Setting store data:', newStoreData);
      setStoreData(newStoreData);
      setOriginalSubdomain(business.subdomain || ''); // Store original subdomain

      // Load branding settings
      const newBrandingSettings = {
        logo: business.logo || '',
        storeBackgroundColor: business.branding?.storeBackgroundColor || '#1c1c1e', // Changed to Soft Black
        heroStyle: business.branding?.heroStyle || 'modern' // Changed to modern (Modern Black)
      };
      
      console.log('🎨 Setting branding data:', newBrandingSettings);
      setBrandingSettings(newBrandingSettings);
      
      console.log('🌐 Store URL will be:', business.subdomain ? `${business.subdomain}.rady.ng` : 'No subdomain available');
    } else {
      console.log('❌ No business data available');
    }
  }, [business]);

  // Validate WhatsApp number format (same validation as signup)
  const validateWhatsAppNumber = (number: string) => {
    if (!number) return { isValid: true, error: '' };
    
    const cleanNumber = number.replace(/[\s\-\(\)\+]/g, '');
    
    if (!/^\d+$/.test(cleanNumber)) {
      return { isValid: false, error: 'Number should contain only digits' };
    }
    
    if (cleanNumber.length < 8) {
      return { isValid: false, error: 'Number is too short. Include country code (e.g., 234)' };
    }
    
    if (cleanNumber.length > 15) {
      return { isValid: false, error: 'Number is too long. Check the format' };
    }
    
    if (number.startsWith('+')) {
      return { isValid: false, error: 'Remove the + sign. Just use the country code (e.g., 234)' };
    }
    
    if (cleanNumber.startsWith('0') && cleanNumber.length <= 11) {
      return { isValid: false, error: 'Include country code. For Nigeria, use 234 instead of 0' };
    }
    
    return { isValid: true, error: '' };
  };

  // Validate subdomain format
  const validateSubdomain = (subdomain: string) => {
    if (!subdomain) return { isValid: true, error: '' };
    
    const subdomainRegex = /^[a-z0-9-]+$/;
    
    if (!subdomainRegex.test(subdomain)) {
      return { isValid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
    }
    
    if (subdomain.length < 3) {
      return { isValid: false, error: 'Must be at least 3 characters long' };
    }
    
    if (subdomain.length > 30) {
      return { isValid: false, error: 'Must be 30 characters or less' };
    }
    
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      return { isValid: false, error: 'Cannot start or end with a hyphen' };
    }
    
    return { isValid: true, error: '' };
  };

  const createMissingBusiness = async () => {
    if (!user) {
      toast.error('No user found. Please sign in again.');
      return;
    }

    try {
      console.log('🆕 Creating missing business for user:', user.uid);
      
      const businessId = await BusinessService.createBusiness({
        name: user.displayName || 'My Store',
        subdomain: user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-store',
        ownerId: user.uid,
        email: user.email || '',
        phone: '',
        address: '',
        country: 'Nigeria',
        state: '',
        plan: 'free',
        status: 'active',
        settings: {
          currency: DEFAULT_CURRENCY,
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          enableNotifications: true
        },
        paymentMethods: {
          manualPayment: true,
          cardPayment: false
        },
        revenue: 0,
        totalOrders: 0,
        totalProducts: 0
      });

      console.log('✅ Business created with ID:', businessId);
      toast.success('Business created! Refreshing page...');
      
      // Refresh page to reload business data
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Error creating business:', error);
      toast.error('Failed to create business. Please try again.');
    }
  };

  const whatsappValidation = validateWhatsAppNumber(storeData.whatsappNumber);
  const subdomainValidation = validateSubdomain(storeData.subdomain);

  const handleSave = async () => {
    if (!whatsappValidation.isValid) {
      toast.error('Please fix the WhatsApp number format before saving');
      return;
    }

    if (!subdomainValidation.isValid) {
      toast.error('Please fix the subdomain format before saving');
      return;
    }

    if (!business?.id) {
      toast.error('Business information not found');
      return;
    }

    try {
      setSaving(true);
      
      // Check subdomain availability if it changed
      if (storeData.subdomain !== originalSubdomain) {
        console.log('🔍 Verifying subdomain availability before saving:', storeData.subdomain);
        
        // Double-check availability before saving
        const existingBusiness = await BusinessService.getBusinessBySubdomain(storeData.subdomain);
        if (existingBusiness && existingBusiness.id !== business.id) {
          toast.error('This subdomain is already taken. Please choose a different one.');
          setSubdomainAvailable(false);
          return;
        }
        
        console.log('✅ Subdomain confirmed available');
        toast.success('Subdomain updated successfully!');
      }
      
      console.log('💾 Saving business data:', {
        subdomain: storeData.subdomain,
        storeName: storeData.storeName,
        whatsappNumber: storeData.whatsappNumber,
        logo: brandingSettings.logo ? 'Logo present' : 'No logo',
        logoSize: brandingSettings.logo ? brandingSettings.logo.length : 0,
        logoUpdated: logoUpdated
      });
      
      // Check logo size (Firebase has document size limits)
      if (brandingSettings.logo && brandingSettings.logo.length > 1048576) { // 1MB limit
        toast.error('Logo file is too large. Please use an image smaller than 1MB.');
        return;
      }
      
      // Prepare update data with proper validation
      const updateData: any = {
        name: storeData.storeName,
        subdomain: storeData.subdomain,
        // Only include customDomain if it has a value
        ...(storeData.customDomain && storeData.customDomain.trim() && { customDomain: storeData.customDomain }),
        description: storeData.description || '',
        // Only include phone if whatsappNumber has a value
        ...(storeData.whatsappNumber && storeData.whatsappNumber.trim() && { phone: storeData.whatsappNumber }),
        address: storeData.address || '',
        country: storeData.country || '',
        state: storeData.state || '',
        settings: {
          currency: storeData.currency || DEFAULT_CURRENCY,
          enableNotifications: business.settings?.enableNotifications || true
        },
        // Include branding settings
        branding: {
          storeBackgroundColor: brandingSettings.storeBackgroundColor,
          heroStyle: brandingSettings.heroStyle
        }
      };

      // Only include logo if it's been explicitly updated and valid
      if (logoUpdated && brandingSettings.logo) {
        // Strict validation for logo data
        if (typeof brandingSettings.logo === 'string' && 
            brandingSettings.logo.startsWith('data:image/') &&
            brandingSettings.logo.length > 100) { // Must have actual data
          
          // Check size - Firebase has strict limits
          if (brandingSettings.logo.length > 800000) { // 800KB limit for safety
            throw new Error('Logo file is too large. Please compress the image further.');
          }
          
          console.log('✅ Valid logo detected, including in update');
          updateData.logo = brandingSettings.logo;
        } else {
          console.warn('❌ Invalid logo format detected, skipping logo update');
          // Don't include invalid logo data
        }
      } else {
        console.log('ℹ️ No logo update needed (logoUpdated:', logoUpdated, ', hasLogo:', !!brandingSettings.logo, ')');
      }

      console.log('🚀 Final update data to be sent:', {
        businessId: business.id,
        dataKeys: Object.keys(updateData),
        hasLogo: !!updateData.logo,
        logoSize: updateData.logo ? Math.round(updateData.logo.length / 1024) + 'KB' : 'None',
        settingsKeys: updateData.settings ? Object.keys(updateData.settings) : []
      });

      // Update the business with new data
      await BusinessService.updateBusiness(business.id, updateData);

      // Update the original subdomain to prevent unnecessary checks
      setOriginalSubdomain(storeData.subdomain);
      setSubdomainAvailable(null);
      setLogoUpdated(false); // Reset logo updated flag
      
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      
      // Provide specific error messages based on error type
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please sign in again and try.');
      } else if (error.code === 'invalid-argument') {
        toast.error('Invalid data format. Please check all fields and try again.');
      } else if (error.message?.includes('document too large')) {
        toast.error('Settings data is too large. Please use a smaller logo file.');
      } else if (error.message?.includes('Logo file is too large')) {
        toast.error('Logo file is too large. Please compress the image further.');
      } else if (error.message?.includes('logo') || error.message?.includes('Logo')) {
        toast.error('Logo upload failed. Please try with a smaller image (under 500KB).');
      } else if (error.message?.includes('subdomain')) {
        toast.error('Subdomain error. Please check the subdomain format and try again.');
      } else {
        toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = () => {
    console.log('🖼️ Logo upload initiated');
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type });
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file (PNG, JPG, GIF, etc.)');
          return;
        }
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          toast.error('Image size should be less than 2MB. Please compress your image.');
          return;
        }
        
        // Create preview URL and compress
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            console.log('🖼️ Image loaded for compression:', { width: img.width, height: img.height });
            // Create canvas for compression
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set max dimensions
            const MAX_WIDTH = 512;
            const MAX_HEIGHT = 512;
            
            let { width, height } = img;
            
            // Calculate new dimensions
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = (height * MAX_WIDTH) / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = (width * MAX_HEIGHT) / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to base64 with compression
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              console.log('🗜️ Image compressed:', { 
                originalSize: file.size, 
                compressedSize: compressedDataUrl.length,
                compression: ((file.size - compressedDataUrl.length) / file.size * 100).toFixed(1) + '%'
              });
              
              // Check final size (Firebase limit is ~1MB per field)
              if (compressedDataUrl.length > 800000) { // 800KB limit
                console.error('❌ Compressed image still too large:', compressedDataUrl.length);
                toast.error('Image is still too large after compression. Please use a smaller image.');
                return;
              }
              
              console.log('✅ Setting new logo in branding settings');
              setBrandingSettings({
                ...brandingSettings,
                logo: compressedDataUrl
              });
              setLogoUpdated(true); // Mark logo as explicitly updated
              
              toast.success('Logo uploaded and optimized successfully! Don\'t forget to save your settings.');
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle country change - suggest appropriate currency
    if (name === 'country') {
      const suggestedCurrency = getDefaultCurrencyForCountry(value);
      const currentCurrency = storeData.currency;
      
      console.log(`🌍 Country changed to: ${value}`);
      console.log(`💰 Suggested currency: ${suggestedCurrency}`);
      console.log(`💰 Current currency: ${currentCurrency}`);
      
      // Update the country
      setStoreData({
        ...storeData,
        [name]: value
      });
      
      // Show currency suggestion if it's different from current
      if (suggestedCurrency !== currentCurrency) {
        const suggestedCurrencyInfo = CURRENCIES.find(c => c.code === suggestedCurrency);
        const currentCurrencyInfo = CURRENCIES.find(c => c.code === currentCurrency);
        
        // Create a toast notification suggesting the currency change
        toast((t) => (
          <div className="flex flex-col space-y-2">
            <div className="font-medium text-gray-900">
              Currency Suggestion for {value}
            </div>
            <div className="text-sm text-gray-600">
              The typical currency for {value} is <strong>{suggestedCurrencyInfo?.name || suggestedCurrency}</strong> ({suggestedCurrencyInfo?.symbol || suggestedCurrency}).
            </div>
            <div className="text-sm text-gray-600">
              Currently using: <strong>{currentCurrencyInfo?.name || currentCurrency}</strong> ({currentCurrencyInfo?.symbol || currentCurrency})
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => {
                  setStoreData(prev => ({...prev, currency: suggestedCurrency}));
                  toast.dismiss(t.id);
                  toast.success(`Currency updated to ${suggestedCurrencyInfo?.name || suggestedCurrency}!`);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Switch to {suggestedCurrencyInfo?.flag || '💰'} {suggestedCurrency}
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Keep {currentCurrency}
              </button>
            </div>
          </div>
        ), {
          duration: 8000, // Keep toast open longer for user to decide
          style: {
            maxWidth: '400px',
            padding: '16px'
          }
        });
      }
    } else {
      // Handle other field changes normally
      setStoreData({
        ...storeData,
        [name]: value
      });
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600">Loading your store information...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="text-center">
          <div className="mb-6">
            <Store className="h-16 w-16 theme-primary-text mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to access your store settings</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Sign In to Your Account</h3>
            <p className="text-blue-700 mb-4">
              It looks like you're not signed in. Please sign in with your email and password to access your store settings.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full btn-primary"
              >
                🔐 Sign In
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/auth/signup'}
                variant="outline"
                className="w-full"
              >
                📝 Create Account
              </Button>
            </div>
            
            <div className="mt-4 text-sm theme-primary-text">
              <p className="font-medium">Have an account but can't access it?</p>
              <p>Use the email: <code className="bg-blue-100 px-1 rounded">nn@gmail.com</code></p>
              <p>with the password you created during signup.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-red-600">⚠️ No business data found.</p>
          
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800">Troubleshooting Steps:</h3>
            <div className="text-sm text-red-700 mt-2 space-y-2">
              <div>1. Check browser console for detailed error messages</div>
              <div>2. Make sure you completed the full registration process</div>
              <div>3. Try refreshing the page or signing out and back in</div>
              
              <div className="mt-4">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mr-2"
                >
                  🔄 Refresh Page
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🔍 Current auth state:', { user, business, loading: authLoading });
                    // Force re-fetch business data
                    window.location.href = '/dashboard';
                  }} 
                  variant="outline"
                  className="mr-2"
                >
                  🏠 Go to Dashboard
                </Button>
                <Button 
                  onClick={createMissingBusiness} 
                  className="btn-primary"
                >
                  🏪 Create Business Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600">Customize your store appearance and details</p>
      </div>

      <div className="space-y-8">
        {/* Store Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Store Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Store Name"
              name="storeName"
              value={storeData.storeName}
              onChange={handleChange}
            />
            
            <div>
              <Input
                label="Subdomain"
                name="subdomain"
                value={storeData.subdomain}
                onChange={handleChange}
                placeholder="your-store-name"
                className={`${
                  storeData.subdomain && !subdomainValidation.isValid
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : storeData.subdomain && subdomainAvailable === true
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : storeData.subdomain && subdomainAvailable === false
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              
              {/* Subdomain Status */}
              <div className="mt-2 space-y-2">
                {/* Format Validation */}
                {storeData.subdomain && !subdomainValidation.isValid && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{subdomainValidation.error}</p>
                  </div>
                )}
                
                {/* Availability Check */}
                {storeData.subdomain && subdomainValidation.isValid && storeData.subdomain !== originalSubdomain && (
                  <div className="flex items-center space-x-2">
                    {checkingSubdomain ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin theme-primary-text" />
                        <p className="text-sm theme-primary-text">Checking availability...</p>
                      </>
                    ) : subdomainAvailable === true ? (
                      <>
                        <Check className="h-4 w-4 theme-accent-text" />
                        <p className="text-sm theme-accent-text">✅ Available! This subdomain is ready to use.</p>
                      </>
                    ) : subdomainAvailable === false ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-600">❌ Already taken. Please choose a different subdomain.</p>
                      </>
                    ) : null}
                  </div>
                )}
                
                {/* Current subdomain message */}
                {storeData.subdomain === originalSubdomain && originalSubdomain && (
                  <div className="flex items-center space-x-2 theme-primary-text">
                    <Check className="h-4 w-4" />
                    <p className="text-sm">This is your current subdomain</p>
                  </div>
                )}
                
                {/* Format Help */}
                {(!storeData.subdomain || subdomainValidation.isValid) && (
                  <p className="text-gray-500 text-xs">
                    Use lowercase letters, numbers, and hyphens only (3-30 characters)
                  </p>
                )}
              </div>
              
              {/* Store URL Preview */}
              <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Your Store URL</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-lg font-mono px-3 py-2 bg-white border border-gray-200 rounded-md text-blue-700">
                        {storeData.subdomain ? `${storeData.subdomain}.rady.ng` : 'your-subdomain.rady.ng'}
                      </code>
                      {storeData.subdomain && subdomainAvailable !== false && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${storeData.subdomain}.rady.ng`, '_blank')}
                          className="theme-primary-text hover:theme-primary-text"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
                
                {storeData.subdomain !== originalSubdomain && storeData.subdomain && subdomainAvailable === true && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">🎉 New URL Ready!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Save your settings to activate this new subdomain
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Input
                label="Custom Domain (Optional)"
                name="customDomain"
                value={storeData.customDomain}
                onChange={handleChange}
                placeholder="www.mystore.com"
              />
              {storeData.customDomain && (
                <div className="mt-2 p-3 bg-purple-50 rounded-md">
                  <p className="text-sm text-purple-700">
                    <span className="font-medium">Custom URL:</span>{' '}
                    <code className="bg-purple-100 px-2 py-1 rounded text-purple-800">
                      {storeData.customDomain}
                    </code>
                  </p>
                </div>
              )}
            </div>
            
            <div></div> {/* Empty div for grid spacing */}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <Input
                name="whatsappNumber"
                type="tel"
                value={storeData.whatsappNumber}
                onChange={handleChange}
                placeholder="2348000000000"
                className={`${
                  storeData.whatsappNumber && !whatsappValidation.isValid
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {storeData.whatsappNumber && !whatsappValidation.isValid ? (
                <p className="text-red-500 text-xs mt-1">
                  ❌ {whatsappValidation.error}
                </p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  Include country code (e.g., 234 for Nigeria) - Used for customer support
                </p>
              )}
              {storeData.whatsappNumber && whatsappValidation.isValid && (
                <p className="text-green-600 text-xs mt-1">
                  ✅ Number format looks good!
                </p>
              )}
            </div>
            
            <div></div> {/* Empty div for grid spacing */}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                name="country"
                value={storeData.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              {storeData.country === 'Nigeria' ? (
                <select
                  name="state"
                  value={storeData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a state</option>
                  {nigerianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  name="state"
                  value={storeData.state}
                  onChange={handleChange}
                  placeholder="Enter state/province"
                />
              )}
            </div>
          </div>
          
          {/* Currency Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Currency
            </label>
            <select
              name="currency"
              value={storeData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {CURRENCIES.map((currency) => {
                const isRecommended = getDefaultCurrencyForCountry(storeData.country) === currency.code;
                return (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.name} ({currency.symbol})
                    {isRecommended ? ' ⭐ Recommended for ' + storeData.country : ''}
                  </option>
                );
              })}
            </select>
            
            {/* Currency recommendation info */}
            {(() => {
              const recommendedCurrency = getDefaultCurrencyForCountry(storeData.country);
              const isUsingRecommended = storeData.currency === recommendedCurrency;
              const recommendedCurrencyInfo = CURRENCIES.find(c => c.code === recommendedCurrency);
              const currentCurrencyInfo = CURRENCIES.find(c => c.code === storeData.currency);
              
              return (
                <div className="mt-2">
                  {isUsingRecommended ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <span className="mr-2">✅</span>
                      <span>Using the recommended currency for {storeData.country}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center text-amber-600 text-sm">
                        <span className="mr-2">💡</span>
                        <span>
                          For {storeData.country}, we recommend {recommendedCurrencyInfo?.flag || '💰'} {recommendedCurrencyInfo?.name || recommendedCurrency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStoreData(prev => ({...prev, currency: recommendedCurrency}));
                          toast.success(`Currency updated to ${recommendedCurrencyInfo?.name || recommendedCurrency}!`);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Switch to {recommendedCurrency}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <p className="text-xs text-gray-500 mt-2">
              This currency will be used for all product prices and transactions in your store.
              You can always change this later, but remember that currency and country can be different.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2">Customer Contact:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <div>WhatsApp: <code className="bg-green-100 px-2 py-1 rounded">{storeData.whatsappNumber || 'Not set'}</code></div>
              <div>Location: <code className="bg-green-100 px-2 py-1 rounded">
                {storeData.state && storeData.country ? `${storeData.state}, ${storeData.country}` : 'Not set'}
              </code></div>
              <p className="text-xs mt-1">Customers will use this information to contact you about orders and support</p>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Description
            </label>
            <p className="text-sm text-gray-500 mb-2">
              This description will be displayed to customers on your storefront
            </p>
            <textarea
              name="description"
              value={storeData.description}
              onChange={handleChange}
              rows={3}
              placeholder={`Discover amazing products from ${storeData.storeName || 'your store'}. Quality guaranteed, fast shipping.`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: Include your store name, product quality, and shipping information
            </p>
          </div>
          
          <div className="mt-6">
            <Input
              label="Street Address (Optional)"
              name="address"
              value={storeData.address}
              onChange={handleChange}
              placeholder="123 Main Street, City"
            />
            <p className="text-gray-500 text-xs mt-1">
              Your business street address (optional) - Country and state are set above
            </p>
          </div>
        </Card>

        {/* Branding */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Branding
            {logoUpdated && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Unsaved changes
              </span>
            )}
          </h2>
          
          <div className="space-y-8">
            {/* Store Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {brandingSettings.logo ? (
                    <img src={brandingSettings.logo} alt="Store logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <Button variant="outline" onClick={handleLogoUpload} className="mb-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-gray-500">
                    Recommended: 512x512px PNG or JPG
                  </p>
                </div>
              </div>
            </div>

            {/* Store Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Store Background Color
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Choose a professional background color for your entire storefront
              </p>
              
              {/* Beautiful Color Palette */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-4">
                {[
                  { name: 'Soft Black', color: '#1c1c1e', description: 'Current Default - Bold & Sophisticated' },
                  { name: 'Light Blue', color: '#c5cbe1', description: 'Previous Default' },
                  { name: 'Soft Gray', color: '#f1f5f9', description: 'Clean & Modern' },
                  { name: 'Warm White', color: '#fefefe', description: 'Pure & Minimal' },
                  { name: 'Cream', color: '#faf9f6', description: 'Warm & Welcoming' },
                  { name: 'Light Rose', color: '#fdf2f8', description: 'Elegant & Feminine' },
                  { name: 'Mint', color: '#f0fdfa', description: 'Fresh & Natural' },
                  { name: 'Sky Blue', color: '#f0f9ff', description: 'Professional & Trust' },
                  { name: 'Lavender', color: '#faf5ff', description: 'Luxury & Calm' },
                  { name: 'Peach', color: '#fff7ed', description: 'Friendly & Approachable' },
                  { name: 'Sage', color: '#f6f7f1', description: 'Natural & Peaceful' },
                  { name: 'Pearl', color: '#f8fafc', description: 'Sophisticated' },
                  { name: 'Blush', color: '#fef7f0', description: 'Soft & Inviting' },
                  { name: 'Purple Mist', color: '#f5f3ff', description: 'Dreamy & Magical' },
                  { name: 'Orchid', color: '#fdf4ff', description: 'Graceful & Elegant' },
                  { name: 'Rose Gold', color: '#fef2f2', description: 'Luxurious & Chic' },
                  { name: 'Champagne', color: '#fffbeb', description: 'Glamorous & Rich' },
                  { name: 'Mauve', color: '#faf7ff', description: 'Romantic & Vintage' },
                  { name: 'Powder Blue', color: '#f0f7ff', description: 'Serene & Calming' },
                  { name: 'Dusty Rose', color: '#fef1f2', description: 'Bohemian & Artistic' },
                  { name: 'Soft Lilac', color: '#f9f5ff', description: 'Whimsical & Sweet' },
                  { name: 'Moonstone', color: '#f9fafb', description: 'Mystical & Pure' },
                  { name: 'Coral Pink', color: '#fff2f1', description: 'Vibrant & Youthful' },
                  { name: 'Periwinkle', color: '#f0f4ff', description: 'Gentle & Peaceful' },
                  { name: 'Soft Black', color: '#1c1c1e', description: 'Bold & Sophisticated' },
                  { name: 'Charcoal', color: '#2c2c2e', description: 'Modern & Sleek' },
                  { name: 'Deep Purple', color: '#1a1625', description: 'Mysterious & Elegant' },
                  { name: 'Navy Night', color: '#0f1419', description: 'Professional & Strong' },
                  { name: 'Burgundy', color: '#2d1b1f', description: 'Rich & Luxurious' }
                ].map((colorOption) => (
                  <div key={colorOption.color} className="text-center">
                    <button
                      onClick={() => setBrandingSettings({...brandingSettings, storeBackgroundColor: colorOption.color})}
                      className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        brandingSettings.storeBackgroundColor === colorOption.color 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: colorOption.color }}
                      title={`${colorOption.name} - ${colorOption.description}`}
                    />
                    <p className="text-xs text-gray-600 mt-1">{colorOption.name}</p>
                  </div>
                ))}
              </div>
              
              {/* Current Selection Display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-md border-2 border-white shadow-sm"
                    style={{ backgroundColor: brandingSettings.storeBackgroundColor }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Selected Background Color</p>
                    <p className="text-xs text-gray-600">{brandingSettings.storeBackgroundColor}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Hero Section Style
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Customize how your hero banner appears to customers
              </p>
              
              {/* Hero Style Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'modern',
                    name: 'Modern Black (Default)',
                    description: 'Sleek black design with geometric shapes',
                    preview: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                  },
                  {
                    id: 'default',
                    name: 'Animated Gradient',
                    description: 'Beautiful moving gradients with floating elements',
                    preview: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 25%, #8b8db5 50%, #a5a8c5 75%, #c5cbe1 100%)'
                  },
                  {
                    id: 'elegant',
                    name: 'Elegant Purple',
                    description: 'Sophisticated purple tones with luxury feel',
                    preview: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
                  },
                  {
                    id: 'professional',
                    name: 'Professional Blue',
                    description: 'Business-focused with brand colors',
                    preview: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                  },
                  {
                    id: 'romantic',
                    name: 'Romantic Rose',
                    description: 'Soft pink and rose gold for feminine brands',
                    preview: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 25%, #fdf2f8 50%, #fef7f0 75%, #fff1f2 100%)'
                  },
                  {
                    id: 'mystical',
                    name: 'Mystical Purple',
                    description: 'Deep purples with magical atmosphere',
                    preview: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)'
                  },
                  {
                    id: 'sunset',
                    name: 'Sunset Glow',
                    description: 'Warm oranges and pinks like a sunset',
                    preview: 'linear-gradient(135deg, #fb7185 0%, #f97316 50%, #fbbf24 100%)'
                  },
                  {
                    id: 'ocean',
                    name: 'Ocean Breeze',
                    description: 'Calming blues and teals like the ocean',
                    preview: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #67e8f9 100%)'
                  },
                  {
                    id: 'lavender',
                    name: 'Lavender Dream',
                    description: 'Soft lavender and lilac for gentle brands',
                    preview: 'linear-gradient(135deg, #c084fc 0%, #d8b4fe 50%, #f3e8ff 100%)'
                  },
                  {
                    id: 'forest',
                    name: 'Forest Sage',
                    description: 'Natural greens for eco-friendly brands',
                    preview: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #6ee7b7 100%)'
                  },
                  {
                    id: 'midnight',
                    name: 'Midnight Glam',
                    description: 'Deep black with purple accents',
                    preview: 'linear-gradient(135deg, #111827 0%, #1f2937 30%, #581c87 70%, #7c3aed 100%)'
                  },
                  {
                    id: 'coral',
                    name: 'Coral Blush',
                    description: 'Vibrant coral and peach tones',
                    preview: 'linear-gradient(135deg, #f472b6 0%, #fb7185 50%, #fbbf24 100%)'
                  }
                ].map((style) => (
                  <div key={style.id} className="relative">
                    <button
                      onClick={() => setBrandingSettings({...brandingSettings, heroStyle: style.id})}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                        brandingSettings.heroStyle === style.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Mini Preview */}
                      <div 
                        className="w-full h-20 rounded-md mb-3 flex items-center justify-center"
                        style={{ background: style.preview }}
                      >
                        <div className="text-white text-xs font-medium">Hero Preview</div>
                      </div>
                      
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{style.name}</h3>
                        <p className="text-sm text-gray-600">{style.description}</p>
                      </div>
                      
                      {brandingSettings.heroStyle === style.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Live Preview Button */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Preview Your Changes</h3>
                    <p className="text-sm text-blue-700">See how your storefront will look with these settings</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (storeData.subdomain) {
                        window.open(`https://${storeData.subdomain}.rady.ng`, '_blank');
                      } else {
                        toast.error('Please set a subdomain first to preview your store');
                      }
                    }}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Store
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </h2>
          
          <div className="space-y-4">
            {[
              { id: 'new_orders', label: 'New Orders', description: 'Get notified when you receive new orders' },
              { id: 'low_stock', label: 'Low Stock Alerts', description: 'Get alerted when products are running low' },
              { id: 'customer_messages', label: 'Customer Messages', description: 'Receive notifications for customer inquiries' },
              { id: 'marketing', label: 'Marketing Updates', description: 'Stay updated with marketing tips and features' }
            ].map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{setting.label}</div>
                  <div className="text-sm text-gray-600">{setting.description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};