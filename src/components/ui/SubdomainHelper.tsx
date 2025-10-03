import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Globe, Store } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import toast from 'react-hot-toast';

interface SubdomainHelperProps {
  currentSubdomain?: string;
  onSubdomainChange?: (subdomain: string) => void;
}

export const SubdomainHelper: React.FC<SubdomainHelperProps> = ({
  currentSubdomain = '',
  onSubdomainChange
}) => {
  const [copied, setCopied] = useState(false);
  const [testSubdomain, setTestSubdomain] = useState(currentSubdomain);

  const fullUrl = testSubdomain ? `${testSubdomain}.rady.ng` : 'yourstore.rady.ng';
  const httpsUrl = `https://${fullUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
      toast.success('Store URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleTest = () => {
    if (testSubdomain) {
      window.open(httpsUrl, '_blank');
    } else {
      toast.error('Please enter a subdomain first');
    }
  };

  const handleSubdomainInput = (value: string) => {
    // Clean the input: lowercase, no spaces, only alphanumeric and hyphens
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 30); // Limit length
    
    setTestSubdomain(cleaned);
    onSubdomainChange?.(cleaned);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your Store Subdomain
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Choose a unique subdomain for your store. This will be your store's web address that customers use to visit your shop.
          </p>

          <div className="space-y-4">
            {/* Subdomain Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Subdomain
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex">
                  <Input
                    value={testSubdomain}
                    onChange={(e) => handleSubdomainInput(e.target.value)}
                    placeholder="mystorename"
                    className="rounded-r-none border-r-0"
                  />
                  <div className="px-3 py-2 bg-gray-50 border border-l-0 rounded-r-md text-gray-500 text-sm">
                    .rady.ng
                  </div>
                </div>
              </div>
              {testSubdomain && (
                <p className="text-xs text-gray-500 mt-1">
                  Only letters, numbers, and hyphens allowed. No spaces.
                </p>
              )}
            </div>

            {/* URL Preview */}
            {testSubdomain && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Store className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 flex-shrink-0">Your store URL:</span>
                    <code className="text-blue-600 font-mono text-sm bg-blue-50 px-2 py-1 rounded truncate">
                      {httpsUrl}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center space-x-1"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTest}
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Visit</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-800 mb-2">💡 Subdomain Tips:</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Use your business name or brand (e.g., "beautyboutique")</li>
                <li>• Keep it short and memorable</li>
                <li>• Avoid numbers unless they're part of your brand</li>
                <li>• Once set, customers will use this URL to find your store</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};