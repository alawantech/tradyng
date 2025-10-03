import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SubdomainService } from '../../services/subdomain';

export const SubdomainTest: React.FC = () => {
  const [subdomainInfo, setSubdomainInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testSubdomain = async () => {
      try {
        const info = await SubdomainService.detectSubdomain();
        setSubdomainInfo(info);
      } catch (error) {
        console.error('Error testing subdomain:', error);
      } finally {
        setIsLoading(false);
      }
    };

    testSubdomain();
  }, []);

  const testUrls = [
    { url: 'https://rady.ng', description: 'Main site' },
    { url: 'https://demo.rady.ng', description: 'Demo store' },
    { url: 'https://beauty.rady.ng', description: 'Beauty store example' },
    { url: 'https://tech.rady.ng', description: 'Tech store example' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Globe className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subdomain Test Page
          </h1>
          <p className="text-xl text-gray-600">
            Test and verify subdomain functionality for Rady.ng stores
          </p>
        </motion.div>

        {/* Current Subdomain Info */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Subdomain Detection</h2>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Detecting subdomain...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {subdomainInfo?.isSubdomain ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <span className="font-medium">
                  {subdomainInfo?.isSubdomain ? 'Subdomain Detected' : 'Main Site'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div><strong>Current URL:</strong> {window.location.href}</div>
                <div><strong>Hostname:</strong> {window.location.hostname}</div>
                <div><strong>Is Subdomain:</strong> {subdomainInfo?.isSubdomain ? 'Yes' : 'No'}</div>
                {subdomainInfo?.storeName && (
                  <div><strong>Store Name:</strong> {subdomainInfo.storeName}</div>
                )}
                {subdomainInfo?.businessId && (
                  <div><strong>Business ID:</strong> {subdomainInfo.businessId}</div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Test URLs */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Subdomain URLs</h2>
          <div className="space-y-3">
            {testUrls.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-mono text-blue-600">{item.url}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(item.url, '_blank')}
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Test</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Test Subdomains</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900">1. DNS Setup Required</h3>
              <p>Make sure you've added the wildcard CNAME record: <code className="bg-gray-100 px-1 rounded">*.rady.ng → cname.vercel-dns.com</code></p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">2. Local Testing</h3>
              <p>For local development, use: <code className="bg-gray-100 px-1 rounded">http://localhost:5174?store=demo</code></p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">3. Production Testing</h3>
              <p>Try visiting: <code className="bg-gray-100 px-1 rounded">https://demo.rady.ng</code> or <code className="bg-gray-100 px-1 rounded">https://test.rady.ng</code></p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">4. Create New Stores</h3>
              <p>Users can create stores with subdomains like: <code className="bg-gray-100 px-1 rounded">mystorename.rady.ng</code></p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};