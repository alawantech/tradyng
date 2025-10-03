import { ShoppingBag, Home, Plus } from 'lucide-react';

interface StoreNotFoundProps {
  storeName: string;
}

export default function StoreNotFound({ storeName }: StoreNotFoundProps) {
  const mainSiteUrl = window.location.hostname.includes('localhost') 
    ? `http://localhost${window.location.port ? `:${window.location.port}` : ''}`
    : 'https://rady.ng';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Store Not Found
          </h1>
          
          <p className="text-gray-600 mb-6">
            The store <span className="font-semibold text-blue-600">"{storeName}"</span> doesn't exist yet.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={mainSiteUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Main Site
            </a>
            
            <a
              href={`${mainSiteUrl}/dashboard`}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create This Store
            </a>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Want to claim this store name? Sign up and create your store with the subdomain "{storeName}".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}