import React from 'react';
import { motion } from 'framer-motion';
import { Store, ExternalLink, Users, ShoppingBag, Globe } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const StoreSubdomainDemo: React.FC = () => {
  const demoStores = [
    {
      name: "Beauty Paradise",
      subdomain: "beautyparadise",
      description: "Premium cosmetics and skincare",
      products: 245,
      color: "from-pink-500 to-purple-600"
    },
    {
      name: "Tech Central",
      subdomain: "techcentral", 
      description: "Latest gadgets and electronics",
      products: 189,
      color: "from-blue-500 to-cyan-600"
    },
    {
      name: "Fashion Hub",
      subdomain: "fashionhub",
      description: "Trendy clothing and accessories",
      products: 312,
      color: "from-green-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Store Subdomains on Rady.ng
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every store gets its own professional subdomain. Your customers can easily find and remember your store with a clean, branded URL.
            </p>
          </motion.div>
        </div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="p-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How Store Subdomains Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Subdomain</h3>
                <p className="text-gray-600">Pick a unique name for your store like "beautyshop" or "techstore"</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Your URL</h3>
                <p className="text-gray-600">Your store becomes accessible at yourstore.rady.ng instantly</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share & Sell</h3>
                <p className="text-gray-600">Customers can easily find and remember your store URL</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Demo Stores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Example Stores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoStores.map((store, index) => (
              <motion.div
                key={store.subdomain}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className={`h-24 bg-gradient-to-r ${store.color} relative`}>
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-white font-bold text-lg">{store.name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{store.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <ShoppingBag className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{store.products} products</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <code className="text-blue-600 font-mono text-sm">
                          {store.subdomain}.rady.ng
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${store.subdomain}.rady.ng?store=demo`, '_blank')}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Visit Store</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <Card className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Why Use Subdomains?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Professional Look</h3>
                <p className="text-indigo-100 text-sm">Clean, branded URLs that customers trust</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Easy to Remember</h3>
                <p className="text-indigo-100 text-sm">Simple URLs customers can type and share</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Brand Identity</h3>
                <p className="text-indigo-100 text-sm">Your store name in the URL builds brand recognition</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">SEO Benefits</h3>
                <p className="text-indigo-100 text-sm">Better search engine rankings with keyword-rich URLs</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="p-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Your Store Subdomain?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of store owners who have chosen Rady.ng for their online business. 
              Set up your professional store subdomain in minutes.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => window.location.href = '/auth/signup'}
            >
              Start Your Store Today
            </Button>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};