import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star, Zap, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PRICING_PLANS } from '../../constants/plans';

interface PricingSectionProps {
  showHeader?: boolean;
  className?: string;
  sectionId?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  showHeader = true,
  className = '',
  sectionId = 'pricing'
}) => {
  // FAQ data
  const faqData = [
    {
      id: 1,
      question: "Can I change my plan later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades or at the next billing cycle for downgrades."
    },
    {
      id: 2,
      question: "Do you offer support for setting up my store?",
      answer: "Absolutely! We provide comprehensive setup assistance including product uploads, payment gateway configuration, and store customization to get you started quickly."
    },
    {
      id: 3,
      question: "Is there a setup fee?",
      answer: "No, there are no setup fees or hidden charges. You only pay the monthly subscription fee."
    },
    {
      id: 4,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and bank transfers within Nigeria."
    }
  ];

  // FAQ toggle state
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Shield className="w-6 h-6 text-blue-500" />;
      case 'business':
        return <Zap className="w-6 h-6 text-green-500" />;
      case 'pro':
        return <Star className="w-6 h-6 text-purple-500" />;
      default:
        return <Shield className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanColors = (planId: string) => {
    switch (planId) {
      case 'free':
        return {
          border: 'border-blue-200',
          ring: 'ring-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          accent: 'text-blue-600'
        };
      case 'business':
        return {
          border: 'border-green-200',
          ring: 'ring-green-600',
          button: 'bg-green-600 hover:bg-green-700 text-white',
          accent: 'text-green-600'
        };
      case 'pro':
        return {
          border: 'border-purple-200',
          ring: 'ring-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700 text-white',
          accent: 'text-purple-600'
        };
      default:
        return {
          border: 'border-gray-200',
          ring: 'ring-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700 text-white',
          accent: 'text-gray-600'
        };
    }
  };

  return (
    <section id={sectionId} className={`py-24 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the plan that fits your business needs. Start free and scale up as you grow. 
              All plans include our core e-commerce features with no hidden fees.
            </p>
            <div className="mt-8 inline-flex items-center space-x-2 text-sm text-gray-500">
              <Check className="w-4 h-4 text-green-500" />
              <span>No setup fees</span>
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
              <Check className="w-4 h-4 text-green-500" />
              <span>Can't set up? We'll do it for free!</span>
            </div>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {PRICING_PLANS.map((plan, index) => {
            const colors = getPlanColors(plan.id);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {plan.isPopular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      <Star className="w-4 h-4 inline mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <Card className={`relative p-8 h-full ${
                  plan.isPopular 
                    ? `${colors.ring} ring-2 scale-105 shadow-2xl bg-white` 
                    : `${colors.border} border-2 shadow-lg hover:shadow-xl transition-shadow bg-white`
                }`}>
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    {/* Price Display */}
                    <div className="mb-6">
                      <div className="flex items-baseline justify-center">
                        <span className={`text-5xl font-bold ${colors.accent}`}>
                          {plan.monthlyPrice === 0 ? 'Free' : `₦${plan.monthlyPrice.toLocaleString()}`}
                        </span>
                        {plan.monthlyPrice > 0 && (
                          <span className="text-gray-500 ml-2 text-lg">/month</span>
                        )}
                      </div>
                      {plan.monthlyPrice > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          or ₦{plan.yearlyPrice.toLocaleString()}/year (save 17%)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-green-500 mt-0.5" />
                        </div>
                        <span className="ml-3 text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Call to Action */}
                  <div className="mt-auto">
                    <Link to="/auth/signup" className="block">
                      <Button 
                        className={`w-full py-4 text-lg font-semibold transition-all duration-200 ${
                          plan.isPopular 
                            ? colors.button
                            : `${colors.button.replace('bg-', 'border-').replace('hover:bg-', 'hover:bg-').replace('text-white', `${colors.accent} hover:text-white`)} border-2`
                        }`}
                      >
                        {plan.buttonText}
                      </Button>
                    </Link>
                    
                    {plan.id === 'free' && (
                      <p className="text-center text-sm text-gray-500 mt-3">
                        No credit card required
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        {/* Additional Information */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need help getting started?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't set up your store? No problem! Our expert team will create your entire store for FREE. 
              We also offer enterprise plans with custom features and dedicated support for larger businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                  Get Free Setup Help
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
        
        {/* FAQ Section */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqData.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h4>
                  {openFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFAQ === faq.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};