import React, { useState, useEffect } from 'react';
import { Save, Upload, Globe, Palette, Bell, Store, ExternalLink, Check, AlertCircle, Loader } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { BusinessService } from '../../services/business';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, business, loading: authLoading } = useAuth();
  const { updateTheme, primaryColor, secondaryColor, accentColor } = useTheme();
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
    state: ''
  });

  const [brandingSettings, setBrandingSettings] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    logo: ''
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
        state: business.state || ''
      };
      
      console.log('📝 Setting store data:', newStoreData);
      setStoreData(newStoreData);
      setOriginalSubdomain(business.subdomain || ''); // Store original subdomain

      // Load branding settings
      const newBrandingSettings = {
        primaryColor: business.settings?.primaryColor || '#3B82F6',
        secondaryColor: business.settings?.secondaryColor || '#10B981',
        accentColor: business.settings?.accentColor || '#F59E0B',
        logo: business.logo || ''
      };
      
      console.log('🎨 Setting branding data:', newBrandingSettings);
      setBrandingSettings(newBrandingSettings);
      
      console.log('🌐 Store URL will be:', business.subdomain ? `${business.subdomain}.trady.ng` : 'No subdomain available');
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
          currency: 'USD',
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
        logoUpdated: logoUpdated,
        colors: {
          primary: brandingSettings.primaryColor,
          secondary: brandingSettings.secondaryColor,
          accent: brandingSettings.accentColor,
          primaryValid: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.primaryColor),
          secondaryValid: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.secondaryColor),
          accentValid: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.accentColor)
        }
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
          currency: business.settings?.currency || 'USD',
          enableNotifications: business.settings?.enableNotifications || true,
          // Validate colors before including them
          primaryColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.primaryColor) ? 
                       brandingSettings.primaryColor : '#3B82F6',
          secondaryColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.secondaryColor) ? 
                         brandingSettings.secondaryColor : '#1E40AF',
          accentColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.accentColor) ? 
                      brandingSettings.accentColor : '#F59E0B'
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

      // Log complete data structure for debugging
      console.log('📋 Complete update data structure:', JSON.stringify(updateData, null, 2));

      // Check each field for potential issues
      Object.entries(updateData).forEach(([key, value]) => {
        console.log(`🔍 Field "${key}":`, {
          type: typeof value,
          value: key === 'logo' ? `[${(value as string)?.length || 0} chars]` : value,
          isUndefined: value === undefined,
          isNull: value === null,
          isEmpty: value === ''
        });
      });

      // Final safety check - ensure no undefined or invalid values
      if (updateData.logo && (!updateData.logo.startsWith('data:image/') || updateData.logo.length < 100)) {
        console.error('❌ Invalid logo detected at final check, removing');
        delete updateData.logo;
      }

      // Remove any undefined values that might cause Firebase issues
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          console.warn(`⚠️ Removing undefined field: ${key}`);
          delete updateData[key];
        }
      });

      console.log('🧪 Testing with color-only update first...');
      
      // First try a minimal color-only update to isolate the issue
      try {
        const colorOnlyUpdate = {
          settings: {
            ...business.settings,
            primaryColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.primaryColor) ? 
                         brandingSettings.primaryColor : '#3B82F6',
            secondaryColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.secondaryColor) ? 
                           brandingSettings.secondaryColor : '#1E40AF',
            accentColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.accentColor) ? 
                        brandingSettings.accentColor : '#F59E0B'
          }
        };
        
        console.log('🎨 Color-only update data:', JSON.stringify(colorOnlyUpdate, null, 2));
        await BusinessService.updateBusiness(business.id, colorOnlyUpdate);
        console.log('✅ Color-only update successful! Now trying full update...');
        
        // If color-only works, try the full update
        await BusinessService.updateBusiness(business.id, updateData);
      } catch (colorError: any) {
        console.error('❌ Color-only update failed:', colorError);
        // If even color-only fails, the issue is with the color data itself
        throw new Error(`Color update failed: ${colorError?.message || 'Unknown error'}`);
      }

      // Update the business with new data
      // await BusinessService.updateBusiness(business.id, updateData);

      // Update the original subdomain to prevent unnecessary checks
      setOriginalSubdomain(storeData.subdomain);
      setSubdomainAvailable(null);
      setLogoUpdated(false); // Reset logo updated flag
      
      // Update theme with new colors immediately
      console.log('🎨 Updating theme with new brand colors...');
      updateTheme({
        primaryColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.primaryColor) ? 
                     brandingSettings.primaryColor : '#3B82F6',
        secondaryColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.secondaryColor) ? 
                       brandingSettings.secondaryColor : '#1E40AF',
        accentColor: /^#[0-9A-Fa-f]{6}$/.test(brandingSettings.accentColor) ? 
                    brandingSettings.accentColor : '#F59E0B'
      });
      
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
    setStoreData({
      ...storeData,
      [e.target.name]: e.target.value
    });
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
                        {storeData.subdomain ? `${storeData.subdomain}.trady.ng` : 'your-subdomain.trady.ng'}
                      </code>
                      {storeData.subdomain && subdomainAvailable !== false && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${storeData.subdomain}.trady.ng`, '_blank')}
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
          
          <div className="space-y-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={brandingSettings.primaryColor}
                    onChange={(e) => {
                      console.log('🎨 Primary color changed to:', e.target.value);
                      const newColor = e.target.value;
                      setBrandingSettings({...brandingSettings, primaryColor: newColor});
                      // Live preview - update theme immediately
                      if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        updateTheme({ primaryColor: newColor });
                      }
                    }}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input 
                    value={brandingSettings.primaryColor} 
                    onChange={(e) => {
                      console.log('🎨 Primary color text input changed to:', e.target.value);
                      const newColor = e.target.value;
                      setBrandingSettings({...brandingSettings, primaryColor: newColor});
                      // Live preview - update theme immediately if valid hex
                      if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        updateTheme({ primaryColor: newColor });
                      }
                    }}
                    placeholder="#3B82F6"
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Main brand color</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={brandingSettings.secondaryColor}
                    onChange={(e) => {
                      console.log('🎨 Secondary color changed to:', e.target.value);
                      const newColor = e.target.value;
                      setBrandingSettings({...brandingSettings, secondaryColor: newColor});
                      // Live preview - update theme immediately
                      if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        updateTheme({ secondaryColor: newColor });
                      }
                    }}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input 
                    value={brandingSettings.secondaryColor}
                    onChange={(e) => {
                      console.log('🎨 Secondary color text input changed to:', e.target.value);
                      const newColor = e.target.value;
                      setBrandingSettings({...brandingSettings, secondaryColor: newColor});
                      // Live preview - update theme immediately if valid hex
                      if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        updateTheme({ secondaryColor: newColor });
                      }
                    }}
                    placeholder="#10B981"
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Supporting color</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="accentColor"
                    value={brandingSettings.accentColor}
                    onChange={(e) => {
                      console.log('🎨 Accent color changed to:', e.target.value);
                      const newColor = e.target.value;
                      setBrandingSettings({...brandingSettings, accentColor: newColor});
                      // Live preview - update theme immediately
                      if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        updateTheme({ accentColor: newColor });
                      }
                    }}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input 
                    value={brandingSettings.accentColor}
                    onChange={(e) => {
                      console.log('🎨 Accent color text input changed to:', e.target.value);
                      const newColor = e.target.value;
                      setBrandingSettings({...brandingSettings, accentColor: newColor});
                      // Live preview - update theme immediately if valid hex
                      if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        updateTheme({ accentColor: newColor });
                      }
                    }}
                    placeholder="#F59E0B"
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Highlight color</p>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Color Preview</h3>
              <div className="space-y-4">
                {/* Color Swatches */}
                <div className="flex space-x-4">
                  <div 
                    className="w-16 h-16 rounded-lg shadow-sm border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: brandingSettings.primaryColor }}
                  >
                    <span className="text-white text-xs font-medium">Primary</span>
                  </div>
                  <div 
                    className="w-16 h-16 rounded-lg shadow-sm border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: brandingSettings.secondaryColor }}
                  >
                    <span className="text-white text-xs font-medium">Secondary</span>
                  </div>
                  <div 
                    className="w-16 h-16 rounded-lg shadow-sm border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: brandingSettings.accentColor }}
                  >
                    <span className="text-white text-xs font-medium">Accent</span>
                  </div>
                </div>
                
                {/* Example Usage */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 font-medium">Example Usage:</p>
                  <div className="flex space-x-2">
                    <Button variant="primary" size="sm">Primary Action</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <Button variant="accent" size="sm">Accent</Button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="theme-primary-text font-medium">Primary Text</span>
                    <span className="theme-secondary-text font-medium">Secondary Text</span>
                    <span className="theme-accent-text font-medium">Accent Text</span>
                  </div>
                  
                  {/* Theme Debug Info */}
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <p className="font-medium mb-2">🔍 Current Theme Status:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-gray-600">Primary:</span>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2 border" 
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          ></div>
                          <span className="font-mono">{primaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-gray-600">Secondary:</span>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2 border" 
                            style={{ backgroundColor: 'var(--color-secondary)' }}
                          ></div>
                          <span className="font-mono">{secondaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-gray-600">Accent:</span>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2 border" 
                            style={{ backgroundColor: 'var(--color-accent)' }}
                          ></div>
                          <span className="font-mono">{accentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                These colors will be used throughout your storefront to match your brand.
              </p>
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