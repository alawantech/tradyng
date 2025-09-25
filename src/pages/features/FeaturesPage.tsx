import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { FeaturesSection } from '../../components/sections/FeaturesSection';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <FeaturesSection />
      </div>
      <Footer />
    </div>
  );
};