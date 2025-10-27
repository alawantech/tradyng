import React from 'react';
import { Card } from '../../components/ui/Card';
import { mockBusinesses } from '../../data/mockData';

export const Businesses: React.FC = () => {
  return (
    <div className="p-6 pt-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Businesses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockBusinesses.map((biz) => (
          <Card key={biz.id} className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{biz.name}</h2>
            <p className="text-gray-600 mb-2">Owner: {biz.owner}</p>
            <p className="text-gray-600 mb-2">Email: {biz.email}</p>
            <p className="text-gray-600 mb-2">Plan: {biz.plan}</p>
            <p className="text-gray-600 mb-2">Status: {biz.status}</p>
            <p className="text-gray-600 mb-2">Revenue: ${biz.revenue.toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
