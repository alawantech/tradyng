import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { ProductService, Product } from '../../services/product';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

export const StorefrontHome: React.FC = () => {
  const { business, isLoading: storeLoading, searchTerm } = useStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      if (!business?.id) return;
      
      try {
        setIsLoadingProducts(true);
        const products = await ProductService.getProductsByBusinessId(business.id);
        // Get first 4 products as featured
        setFeaturedProducts(products.slice(0, 4));
      } catch (error) {
        console.error('Error loading products:', error);
        setFeaturedProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [business?.id]);

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">This store does not exist or is not available.</p>
        </div>
      </div>
    );
  }

  // Filter featured products by search term
  const filteredFeaturedProducts = featuredProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Beautiful, compact, visually impressive */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-400 to-purple-500 text-white overflow-hidden">
        {/* Decorative blurred circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-400 opacity-30 rounded-full blur-2xl -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 opacity-20 rounded-full blur-2xl -z-10" />
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 md:py-20 flex flex-col items-center justify-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 drop-shadow-lg"
            style={{letterSpacing: '0.01em'}}
          >
            Welcome to <span className="bg-white bg-opacity-20 px-2 rounded text-shadow-lg">{business.name}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl mb-6 max-w-xl mx-auto text-white/90"
          >
            {business.description || `Discover amazing products from ${business.name}. Quality guaranteed, fast shipping.`}
          </motion.p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFeaturedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
              {filteredFeaturedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex justify-center"
                >
                  <Card className="bg-white border border-gray-200 shadow-sm w-full max-w-xs flex flex-col p-0">
                    <div className="w-full aspect-square overflow-hidden">
                      <img
                        src={product.images?.[0] || '/api/placeholder/400/300'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                        }}
                      />
                    </div>
                    <div className="flex flex-col px-4 py-3">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                      <span className="text-lg font-bold text-blue-600 mb-2">{formatCurrency(product.price, business.settings?.currency || DEFAULT_CURRENCY)}</span>
                      <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">(5.0)</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="flex-1 px-2 py-1 rounded font-semibold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-all">Add to Cart</Button>
                        <Link to={`/product/${product.id}`} className="flex-1">
                          <Button size="sm" className="w-full px-2 py-1 rounded font-semibold text-xs bg-white border border-blue-400 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all">View</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ShoppingCart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{searchTerm ? 'No Products Found' : 'No Products Yet'}</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : "This store hasn't added any products yet. Check back later!"}
              </p>
            </div>
          )}
        </div>
      </section>


    </div>
  );
};