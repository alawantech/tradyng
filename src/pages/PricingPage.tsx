import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PricingSection } from '../components/sections/PricingSection';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <PricingSection showHeader={true} />
      </div>
      <Footer />
    </div>
  );
};