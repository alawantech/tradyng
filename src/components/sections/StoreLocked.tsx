import React from 'react';
import { Clock, Store } from 'lucide-react';

interface StoreLockedProps {
    storeName?: string;
}

const StoreLocked: React.FC<StoreLockedProps> = ({ storeName }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-6">
                    <Clock className="h-12 w-12 text-blue-600" />
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Coming Soon
                </h1>

                <div className="flex items-center justify-center space-x-2 text-xl font-medium text-gray-600 mb-6">
                    <Store className="h-5 w-5" />
                    <span>{storeName || 'Our Store'}</span>
                </div>

                <p className="text-lg text-gray-500 mb-8">
                    We are currently setting up our online presence. Please check back later!
                </p>

                <div className="border-t border-gray-200 pt-8">
                    <p className="text-sm text-gray-400">
                        Powered by Rady
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StoreLocked;
