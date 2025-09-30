import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, ShoppingCart, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useStore } from './StorefrontLayout';
import { ProductService, Product } from '../../services/product';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

export const ProductListing: React.FC = () => {
  const { business, isLoading: storeLoading, searchTerm, setSearchTerm } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!business?.id) return;
      try {
        setIsLoadingProducts(true);
        const fetchedProducts = await ProductService.getProductsByBusinessId(business.id);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, [business?.id]);

  // Dynamically get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    return matchesSearch && matchesCategory;
  });

  if (storeLoading || isLoadingProducts) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-200 h-80 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} products available
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Search</h3>
            <Input
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <span className="text-gray-500 text-sm">No categories found</span>
              ) : (
                categories.map((category) => (
                  <label key={category} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        setSelectedCategories(prev =>
                          e.target.checked
                            ? [...prev, category]
                            : prev.filter(c => c !== category)
                        );
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))
              )}
            </div>
          </Card>

          {/* Price Range filter removed as requested */}
        </div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ShoppingCart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Products Found' : 'No Products Available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : 'This store hasn\'t added any products yet. Check back later!'
                }
              </p>
              {searchTerm && (
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
              {filteredProducts.map((product, index) => (
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
                          {formatCurrency(product.price, business?.settings?.currency || DEFAULT_CURRENCY)}
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
            <div className="space-y-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <img
                        src={product.images?.[0] || '/api/placeholder/400/300'}
                        alt={product.name}
                        className="w-full md:w-48 h-48 object-cover object-center rounded-lg transition-transform duration-300 hover:scale-105 bg-gray-100"
                        style={{boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {product.description}
                        </p>
                        <div className="flex items-center mb-4">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 ml-2">(5.0)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCurrency(product.price, business?.settings?.currency || DEFAULT_CURRENCY)}
                          </span>
                          <Link to={`/product/${product.id}`}>
                            <Button>View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};