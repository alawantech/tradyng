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
      {/* Hero Section */}
      <section className="relative theme-storefront-hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Welcome to {business.name}
            </h1>
            <p className="text-xl theme-primary-light-text mb-8 max-w-2xl mx-auto">
              {business.description || `Discover amazing products from ${business.name}. Quality guaranteed, fast shipping.`}
            </p>
            <Link to="/products">
              <Button size="lg" className="hero-btn-primary">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredFeaturedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-xl transition-shadow duration-300">
                    <div className="aspect-w-1 aspect-h-1 relative overflow-hidden rounded-t-lg">
                      <img
                        src={product.images?.[0] || '/api/placeholder/400/300'}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="p-4">
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
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(product.price, business.settings?.currency || DEFAULT_CURRENCY)}
                        </span>
                        <Link to={`/product/${product.id}`}>
                          <Button size="sm">View Details</Button>
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