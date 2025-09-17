import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { useCart } from '../../contexts/CartContext';
import { ProductService, Product } from '../../services/product';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import toast from 'react-hot-toast';

export const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const { business, isLoading: storeLoading } = useStore();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id || !business?.id) return;
      
      try {
        setIsLoading(true);
        const fetchedProduct = await ProductService.getProductById(business.id, id);
        setProduct(fetchedProduct);
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, business?.id]);

  if (storeLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg h-96"></div>
              <div className="flex space-x-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or is no longer available.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product || !business) return;
    
    addItem({
      id: product.id!,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0],
      businessId: business.id!,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Navigate to checkout - we'll implement this later
    toast.success('Redirecting to checkout...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <img
                src={product.images?.[selectedImage] || '/api/placeholder/400/300'}
                alt={product.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                }}
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">(4.9) • 127 reviews</span>
            </div>
          </div>

          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(product.price, business?.settings?.currency || DEFAULT_CURRENCY)}
          </div>

          <p className="text-gray-700 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
            <span className="text-gray-600">
              {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={handleAddToCart} 
              className="flex-1"
              disabled={product.stock === 0 || !product.isActive}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button 
              onClick={handleBuyNow} 
              variant="outline" 
              className="flex-1"
              disabled={product.stock === 0 || !product.isActive}
            >
              Buy Now
            </Button>
          </div>

          <div className="flex space-x-6">
            <button className="flex items-center space-x-2 text-gray-600 hover:theme-primary-text">
              <Heart className="h-5 w-5" />
              <span>Add to Wishlist</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:theme-primary-text">
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">2-year warranty included</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700">30-day return policy</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {[
              { name: 'John D.', rating: 5, comment: 'Excellent product! Exceeded my expectations.', date: '2024-01-15' },
              { name: 'Sarah M.', rating: 4, comment: 'Great quality and fast shipping. Very satisfied.', date: '2024-01-10' },
              { name: 'Mike R.', rating: 5, comment: 'Perfect! Exactly what I was looking for.', date: '2024-01-08' }
            ].map((review, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{review.name}</span>
                    <div className="flex text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};