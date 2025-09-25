import React from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Zap, 
  Globe, 
  Shield, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { Card } from '../ui/Card';

interface FeaturesSectionProps {
  showHeader?: boolean;
  className?: string;
  sectionId?: string;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  showHeader = true,
  className = '',
  sectionId = 'features'
}) => {
  const features = [
    {
      icon: Store,
      title: 'Custom Online Stores',
      description: 'Create your unique storefront with custom branding and domain'
    },
    {
      icon: Zap,
      title: 'Lightning Fast Setup',
      description: 'Get your store online in minutes, not days'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Sell to customers anywhere in the world'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Multiple payment options with enterprise-level security'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Track sales, customers, and growth with detailed insights'
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Expert support team ready to help you succeed'
    }
  ];

  return (
    <section id={sectionId} className={`py-24 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools and features designed to help your business grow and thrive online
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};