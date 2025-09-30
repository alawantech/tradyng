import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, ArrowRight } from 'lucide-react';
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Link to="/products">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 via-blue-500 to-blue-400 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600">
              Hand-picked products just for you
            </p>
          </div>
          
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
                  <Card className="group hover:shadow-xl transition-shadow duration-300 max-w-xs min-w-[16rem] w-full mx-auto">
                    <div className="aspect-w-1 aspect-h-1 relative overflow-hidden rounded-t-lg flex items-center justify-center bg-gray-100">
                      <img
                        src={product.images?.[0] || '/api/placeholder/400/300'}
                        alt={product.name}
                        className="h-48 w-48 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105 mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center mb-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">(5.0)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-auto">
                        <span className="text-xl font-bold text-blue-600 mb-3 w-full text-left">
                          {formatCurrency(product.price, business.settings?.currency || DEFAULT_CURRENCY)}
                        </span>
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            size="sm"
                            className="w-full px-2 py-1 rounded-full font-semibold text-xs bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 transition-all shadow-sm border border-blue-500"
                            onClick={() => {/* TODO: Add to cart logic here */}}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1 inline" /> Add to Cart
                          </Button>
                          <Link to={`/product/${product.id}`} className="w-full">
                            <Button size="sm" className="w-full px-2 py-1 rounded-full font-semibold text-xs bg-white border border-blue-400 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm">View Details</Button>
                          </Link>
                        </div>
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
          
          {featuredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link to="/products">
                <Button size="lg" variant="outline">
                  View All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>


    </div>
  );
};